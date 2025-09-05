using System.Text.Json;
using Microsoft.AspNetCore.Http;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 审计日志服务实现
    /// </summary>
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBaseRepository<AuditLog> _auditLogRepository;
        private readonly IUserContextService _userContextService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<AuditLogService> _logger;

        public AuditLogService(
            ApplicationDbContext context,
            IBaseRepository<AuditLog> auditLogRepository,
            IUserContextService userContextService,
            IHttpContextAccessor httpContextAccessor,
            ILogger<AuditLogService> logger)
        {
            _context = context;
            _auditLogRepository = auditLogRepository;
            _userContextService = userContextService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// 记录审计日志
        /// </summary>
        public async Task LogAsync(AuditLog log)
        {
            try
            {
                // 补充用户信息
                if (log.UserId == 0 && _userContextService.TryGetCurrentUserId(out int userId))
                {
                    log.UserId = userId;
                }
                
                if (string.IsNullOrEmpty(log.Username))
                {
                    log.Username = _userContextService.GetCurrentUsername();
                }

                // 补充请求信息
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext != null)
                {
                    log.IpAddress ??= httpContext.Connection.RemoteIpAddress?.ToString();
                    log.UserAgent ??= httpContext.Request.Headers["User-Agent"].FirstOrDefault();
                    log.RequestPath ??= httpContext.Request.Path;
                    log.HttpMethod ??= httpContext.Request.Method;
                }

                await _auditLogRepository.AddAsync(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // 记录日志失败不应影响业务操作
                _logger.LogError(ex, "记录审计日志失败 - Action: {Action}", log.Action);
            }
        }

        /// <summary>
        /// 记录操作日志
        /// </summary>
        public async Task LogActionAsync(string action, string description, string? entityType = null, int? entityId = null)
        {
            var log = new AuditLog
            {
                Action = action,
                Description = description,
                EntityType = entityType,
                EntityId = entityId,
                Result = "Success"
            };

            await LogAsync(log);
        }

        /// <summary>
        /// 记录数据变更日志
        /// </summary>
        public async Task LogChangeAsync<T>(string action, T? oldValue, T? newValue, string entityType, int entityId) where T : class
        {
            var log = new AuditLog
            {
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Description = $"{action} {entityType} (ID: {entityId})",
                OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
                NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
                Result = "Success"
            };

            await LogAsync(log);
        }

        /// <summary>
        /// 记录错误日志
        /// </summary>
        public async Task LogErrorAsync(string action, string description, string errorMessage)
        {
            var log = new AuditLog
            {
                Action = action,
                Description = description,
                Result = "Failed",
                ErrorMessage = errorMessage
            };

            await LogAsync(log);
        }

        /// <summary>
        /// 分页查询审计日志
        /// </summary>
        public async Task<ApiResponse<PagedResult<AuditLog>>> GetPagedAsync(AuditLogQueryDto query)
        {
            try
            {
                // 验证分页参数
                if (query.PageIndex <= 0) query.PageIndex = 1;
                if (query.PageSize <= 0) query.PageSize = 20;
                if (query.PageSize > 100) query.PageSize = 100; // 限制最大页面大小
                
                var queryable = _context.AuditLogs.AsQueryable();

                // 应用过滤条件
                if (query.UserId.HasValue)
                    queryable = queryable.Where(l => l.UserId == query.UserId.Value);
                
                if (!string.IsNullOrEmpty(query.Username))
                    queryable = queryable.Where(l => l.Username.Contains(query.Username));
                
                if (!string.IsNullOrEmpty(query.Action))
                    queryable = queryable.Where(l => l.Action == query.Action);
                
                if (!string.IsNullOrEmpty(query.EntityType))
                    queryable = queryable.Where(l => l.EntityType == query.EntityType);
                
                if (!string.IsNullOrEmpty(query.Result))
                    queryable = queryable.Where(l => l.Result == query.Result);
                
                if (query.StartDate.HasValue)
                    queryable = queryable.Where(l => l.CreatedAt >= query.StartDate.Value);
                
                if (query.EndDate.HasValue)
                    queryable = queryable.Where(l => l.CreatedAt <= query.EndDate.Value);

                // 总记录数
                var totalCount = await queryable.CountAsync();

                // 排序和分页
                var items = await queryable
                    .OrderByDescending(l => l.CreatedAt)
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var result = new PagedResult<AuditLog>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询审计日志成功 - 获取{Count}条记录，共{Total}条", items.Count, totalCount);
                return ApiResponse<PagedResult<AuditLog>>.SuccessResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询审计日志失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<AuditLog>>.ErrorResult($"查询审计日志失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 按用户查询审计日志
        /// </summary>
        public async Task<ApiResponse<List<AuditLog>>> GetByUserAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var queryable = _context.AuditLogs
                    .Where(l => l.UserId == userId);

                if (startDate.HasValue)
                    queryable = queryable.Where(l => l.CreatedAt >= startDate.Value);
                
                if (endDate.HasValue)
                    queryable = queryable.Where(l => l.CreatedAt <= endDate.Value);

                var logs = await queryable
                    .OrderByDescending(l => l.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("查询用户审计日志成功 - UserId: {UserId}, Count: {Count}", userId, logs.Count);
                return ApiResponse<List<AuditLog>>.SuccessResult(logs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询用户日志失败 - UserId: {UserId}", userId);
                return ApiResponse<List<AuditLog>>.ErrorResult($"查询用户日志失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 按实体查询审计日志
        /// </summary>
        public async Task<ApiResponse<List<AuditLog>>> GetByEntityAsync(string entityType, int entityId)
        {
            try
            {
                var logs = await _context.AuditLogs
                    .Where(l => l.EntityType == entityType && l.EntityId == entityId)
                    .OrderByDescending(l => l.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("查询实体审计日志成功 - EntityType: {EntityType}, EntityId: {EntityId}, Count: {Count}", 
                    entityType, entityId, logs.Count);
                return ApiResponse<List<AuditLog>>.SuccessResult(logs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询实体日志失败 - EntityType: {EntityType}, EntityId: {EntityId}", entityType, entityId);
                return ApiResponse<List<AuditLog>>.ErrorResult($"查询实体日志失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 清理过期日志
        /// </summary>
        public async Task<ApiResponse> CleanupOldLogsAsync(int daysToKeep = 90)
        {
            try
            {
                var cutoffDate = DateTime.Now.AddDays(-daysToKeep);
                var logsToDelete = await _context.AuditLogs
                    .Where(l => l.CreatedAt < cutoffDate)
                    .ToListAsync();

                if (logsToDelete.Any())
                {
                    _context.AuditLogs.RemoveRange(logsToDelete);
                    var deletedCount = await _context.SaveChangesAsync();

                    await LogActionAsync("CleanupLogs", $"清理了{deletedCount}条{daysToKeep}天前的日志");
                    _logger.LogInformation("清理过期审计日志成功 - 清理了{Count}条{Days}天前的日志", deletedCount, daysToKeep);
                    
                    return ApiResponse.SuccessResult($"成功清理{deletedCount}条过期日志");
                }
                
                _logger.LogInformation("清理过期审计日志完成 - 没有需要清理的{Days}天前的日志", daysToKeep);
                return ApiResponse.SuccessResult("没有需要清理的过期日志");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理过期日志失败 - DaysToKeep: {DaysToKeep}", daysToKeep);
                return ApiResponse.ErrorResult($"清理日志失败: {ex.Message}");
            }
        }
    }
}