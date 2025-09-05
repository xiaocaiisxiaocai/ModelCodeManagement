using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 审计日志服务接口
    /// </summary>
    public interface IAuditLogService
    {
        /// <summary>
        /// 记录审计日志
        /// </summary>
        Task LogAsync(AuditLog log);
        
        /// <summary>
        /// 记录操作日志
        /// </summary>
        Task LogActionAsync(string action, string description, string? entityType = null, int? entityId = null);
        
        /// <summary>
        /// 记录数据变更日志
        /// </summary>
        Task LogChangeAsync<T>(string action, T? oldValue, T? newValue, string entityType, int entityId) where T : class;
        
        /// <summary>
        /// 记录错误日志
        /// </summary>
        Task LogErrorAsync(string action, string description, string errorMessage);
        
        /// <summary>
        /// 分页查询审计日志
        /// </summary>
        Task<ApiResponse<PagedResult<AuditLog>>> GetPagedAsync(AuditLogQueryDto query);
        
        /// <summary>
        /// 按用户查询审计日志
        /// </summary>
        Task<ApiResponse<List<AuditLog>>> GetByUserAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
        
        /// <summary>
        /// 按实体查询审计日志
        /// </summary>
        Task<ApiResponse<List<AuditLog>>> GetByEntityAsync(string entityType, int entityId);
        
        /// <summary>
        /// 清理过期日志
        /// </summary>
        Task<ApiResponse> CleanupOldLogsAsync(int daysToKeep = 90);
    }
    
    /// <summary>
    /// 审计日志查询DTO
    /// </summary>
    public class AuditLogQueryDto : QueryDto
    {
        public int? UserId { get; set; }
        public string? Username { get; set; }
        public string? Action { get; set; }
        public string? EntityType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Result { get; set; }
    }
}