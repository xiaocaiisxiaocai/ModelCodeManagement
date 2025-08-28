using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 代码分类服务实现
    /// </summary>
    public class CodeClassificationService : ICodeClassificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBaseRepository<CodeClassification> _codeClassificationRepository;
        private readonly IBaseRepository<CodeUsageEntry> _codeUsageRepository;
        private readonly ISystemConfigService _systemConfigService;
        private readonly IUserContextService _userContextService;
        private readonly ILogger<CodeClassificationService> _logger;

        public CodeClassificationService(
            ApplicationDbContext context,
            IBaseRepository<CodeClassification> codeClassificationRepository,
            IBaseRepository<CodeUsageEntry> codeUsageRepository,
            ISystemConfigService systemConfigService,
            IUserContextService userContextService,
            ILogger<CodeClassificationService> logger)
        {
            _context = context;
            _codeClassificationRepository = codeClassificationRepository;
            _codeUsageRepository = codeUsageRepository;
            _systemConfigService = systemConfigService;
            _userContextService = userContextService;
            _logger = logger;
        }

        /// <summary>
        /// 根据机型类型获取代码分类
        /// </summary>
        public async Task<ApiResponse<List<CodeClassificationDto>>> GetByModelTypeAsync(string modelType)
        {
            try
            {
                var codeClassifications = await _context.CodeClassifications
                    .Include(c => c.ModelClassification)
                    .Where(c => c.ModelClassification!.Type == modelType)
                    .OrderBy(c => c.Code)
                    .ToListAsync();

                var dtos = codeClassifications.Select(c => c.ToDto()).ToList();
                _logger.LogInformation("根据机型类型{ModelType}获取{Count}个代码分类", modelType, dtos.Count);
                return ApiResponse<List<CodeClassificationDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}个代码分类");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取代码分类列表失败 - ModelType: {ModelType}", modelType);
                return ApiResponse<List<CodeClassificationDto>>.ErrorResult($"获取代码分类列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据机型分类ID获取代码分类
        /// </summary>
        public async Task<ApiResponse<List<CodeClassificationDto>>> GetByModelClassificationIdAsync(int modelClassificationId)
        {
            try
            {
                var codeClassifications = await _context.CodeClassifications
                    .Include(c => c.ModelClassification)
                    .Where(c => c.ModelClassificationId == modelClassificationId)
                    .OrderBy(c => c.Code)
                    .ToListAsync();

                var dtos = codeClassifications.Select(c => c.ToDto()).ToList();
                return ApiResponse<List<CodeClassificationDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}个代码分类");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取代码分类列表失败 - ModelClassificationId: {ModelClassificationId}", modelClassificationId);
                return ApiResponse<List<CodeClassificationDto>>.ErrorResult($"获取代码分类列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据ID获取代码分类
        /// </summary>
        public async Task<ApiResponse<CodeClassificationDto>> GetByIdAsync(int id)
        {
            try
            {
                var codeClassification = await _context.CodeClassifications
                    .Include(c => c.ModelClassification)
                    .Include(c => c.CodeUsageEntries)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (codeClassification == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的代码分类", id);
                    return ApiResponse<CodeClassificationDto>.ErrorResult($"未找到ID为{id}的代码分类");
                }

                var dto = codeClassification.ToDto();
                return ApiResponse<CodeClassificationDto>.SuccessResult(dto, "获取代码分类成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取代码分类失败 - ID: {Id}", id);
                return ApiResponse<CodeClassificationDto>.ErrorResult($"获取代码分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 创建代码分类（会触发预分配）
        /// </summary>
        public async Task<ApiResponse<CodeClassificationDto>> CreateAsync(CreateCodeClassificationDto dto)
        {
            try
            {
                // 验证机型分类是否存在
                var modelClassification = await _context.ModelClassifications
                    .FirstOrDefaultAsync(m => m.Id == dto.ModelClassificationId);

                if (modelClassification == null)
                {
                    _logger.LogWarning("机型分类不存在或已禁用 - ModelClassificationId: {ModelClassificationId}", dto.ModelClassificationId);
                    return ApiResponse<CodeClassificationDto>.ErrorResult($"机型分类ID {dto.ModelClassificationId} 不存在或已禁用");
                }

                // 验证代码唯一性（在同一机型分类下）
                var codeExists = await _context.CodeClassifications
                    .AnyAsync(c => c.Code == dto.Code && c.ModelClassificationId == dto.ModelClassificationId);

                if (codeExists)
                {
                    _logger.LogWarning("代码在机型分类下已存在 - Code: {Code}, ModelClassificationId: {ModelClassificationId}", 
                        dto.Code, dto.ModelClassificationId);
                    return ApiResponse<CodeClassificationDto>.ErrorResult($"代码 {dto.Code} 在该机型分类下已存在");
                }

                // 使用EF Core事务
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 创建代码分类
                    var entity = dto.ToEntity();
                    var createdEntity = await _codeClassificationRepository.AddAsync(entity);
                    await _context.SaveChangesAsync();

                    // 如果是3层结构，触发预分配
                    if (modelClassification.HasCodeClassification)
                    {
                        await PreAllocateCodesInternalAsync(createdEntity.Id, modelClassification.Type, dto.Code);
                    }

                    await transaction.CommitAsync();

                    // 重新查询以获取关联数据
                    var entityWithIncludes = await _context.CodeClassifications
                        .Include(c => c.ModelClassification)
                        .Include(c => c.CodeUsageEntries)
                        .FirstOrDefaultAsync(c => c.Id == createdEntity.Id);

                    var resultDto = entityWithIncludes!.ToDto();
                    _logger.LogInformation("创建代码分类成功 - Code: {Code}, Id: {Id}", dto.Code, createdEntity.Id);
                    return ApiResponse<CodeClassificationDto>.SuccessResult(resultDto, "创建代码分类成功");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return ApiResponse<CodeClassificationDto>.ErrorResult($"创建代码分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 更新代码分类
        /// </summary>
        public async Task<ApiResponse<CodeClassificationDto>> UpdateAsync(int id, UpdateCodeClassificationDto dto)
        {
            try
            {
                var entity = await _context.CodeClassifications
                    .Include(c => c.ModelClassification)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到要更新的代码分类 - ID: {Id}", id);
                    return ApiResponse<CodeClassificationDto>.ErrorResult($"未找到ID为{id}的代码分类");
                }

                // 验证代码唯一性（排除自身）
                if (entity.Code != dto.Code)
                {
                    var codeExists = await _context.CodeClassifications
                        .Where(c => c.Code == dto.Code && c.ModelClassificationId == entity.ModelClassificationId && c.Id != id)
                        .AnyAsync();

                    if (codeExists)
                    {
                        return ApiResponse<CodeClassificationDto>.ErrorResult($"代码 {dto.Code} 在该机型分类下已被其他代码分类使用");
                    }
                }

                entity.UpdateFromDto(dto);
                _context.CodeClassifications.Update(entity);
                await _context.SaveChangesAsync();

                var resultDto = entity.ToDto();
                return ApiResponse<CodeClassificationDto>.SuccessResult(resultDto, "更新代码分类成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<CodeClassificationDto>.ErrorResult($"更新代码分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 删除代码分类
        /// </summary>
        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var entity = await _context.CodeClassifications
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到要删除的代码分类 - ID: {Id}", id);
                    return ApiResponse.ErrorResult($"未找到ID为{id}的代码分类");
                }

                // 检查是否有已分配的编码使用记录（预分配记录可以删除，已分配记录不能删除）
                var hasAllocatedEntries = await _context.CodeUsageEntries
                    .Where(c => c.CodeClassificationId == id && c.IsAllocated)
                    .AnyAsync();

                if (hasAllocatedEntries)
                {
                    return ApiResponse.ErrorResult("该代码分类下存在已使用的编码记录，无法删除");
                }

                // 删除该代码分类下的所有预分配记录
                var preallocatedEntries = await _context.CodeUsageEntries
                    .Where(c => c.CodeClassificationId == id && !c.IsAllocated)
                    .ToListAsync();

                if (preallocatedEntries.Any())
                {
                    _context.CodeUsageEntries.RemoveRange(preallocatedEntries);
                    _logger.LogInformation("删除代码分类时清理了{Count}个预分配记录", preallocatedEntries.Count);
                }

                // 删除代码分类
                _context.CodeClassifications.Remove(entity);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("删除代码分类成功 - ID: {Id}, Code: {Code}", id, entity.Code);
                return ApiResponse.SuccessResult("删除代码分类成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult($"删除代码分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 预分配编码（3层结构专用）
        /// </summary>
        public async Task<ApiResponse> PreAllocateCodesAsync(int codeClassificationId)
        {
            try
            {
                var codeClassification = await _context.CodeClassifications
                    .Include(c => c.ModelClassification)
                    .FirstOrDefaultAsync(c => c.Id == codeClassificationId);

                if (codeClassification == null)
                {
                    return ApiResponse.ErrorResult($"未找到ID为{codeClassificationId}的代码分类");
                }

                if (!codeClassification.ModelClassification!.HasCodeClassification)
                {
                    return ApiResponse.ErrorResult("该机型分类不支持代码分类预分配");
                }

                await PreAllocateCodesInternalAsync(codeClassificationId, codeClassification.ModelClassification.Type, codeClassification.Code);
                return ApiResponse.SuccessResult("预分配编码成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult($"预分配编码失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 内部预分配方法
        /// </summary>
        private async Task PreAllocateCodesInternalAsync(int codeClassificationId, string modelType, string codeClassificationCode)
        {
            // 获取机型分类ID
            var modelClassification = await _context.ModelClassifications
                .FirstOrDefaultAsync(m => m.Type == modelType);

            if (modelClassification == null)
            {
                throw new Exception($"未找到机型类型: {modelType}");
            }

            // 提取代码分类编号（如"1-内层" -> 1）
            var classificationNumber = ExtractNumberFromCode(codeClassificationCode);
            if (classificationNumber == 0)
            {
                throw new Exception($"无法从代码 {codeClassificationCode} 中提取数字");
            }

            // 获取编号位数配置
            var numberDigitsResult = await _systemConfigService.GetNumberDigitsAsync();
            if (!numberDigitsResult.Success)
            {
                throw new Exception("获取编号位数配置失败");
            }
            
            var numberDigits = numberDigitsResult.Data;
            var maxNumber = (int)Math.Pow(10, numberDigits) - 1;

            var preallocatedCodes = new List<CodeUsageEntry>();

            for (int i = 0; i <= maxNumber; i++)
            {
                var actualNumber = i.ToString(new string('0', numberDigits)); // 00, 01, 02...
                var fullModel = $"{modelType}{classificationNumber}{actualNumber}"; // SLU-100, SLU-101...

                preallocatedCodes.Add(new CodeUsageEntry
                {
                    Model = fullModel,
                    ModelType = modelType,
                    CodeClassificationNumber = classificationNumber,
                    ActualNumber = actualNumber,
                    Extension = null,
                    ModelClassificationId = modelClassification.Id,
                    CodeClassificationId = codeClassificationId,
                    IsAllocated = false,
                    NumberDigits = numberDigits,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                });
            }

            // 使用EF Core批量插入
            await _context.CodeUsageEntries.AddRangeAsync(preallocatedCodes);
            await _context.SaveChangesAsync();

            // 记录预分配日志
            var preAllocationLog = new CodePreAllocationLog
            {
                ModelClassificationId = modelClassification.Id,
                CodeClassificationId = codeClassificationId,
                ModelType = modelType,
                ClassificationNumber = classificationNumber.ToString(),
                AllocationCount = preallocatedCodes.Count,
                NumberDigits = numberDigits,
                StartCode = preallocatedCodes.First().Model,
                EndCode = preallocatedCodes.Last().Model,
                CreatedBy = _userContextService.TryGetCurrentUserId(out int userId) ? userId : 1,
                CreatedAt = DateTime.Now
            };

            await _context.CodePreAllocationLogs.AddAsync(preAllocationLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// 从代码中提取数字部分
        /// </summary>
        private int ExtractNumberFromCode(string code)
        {
            var parts = code.Split('-');
            if (parts.Length > 0 && int.TryParse(parts[0], out int number))
            {
                return number;
            }
            return 0;
        }
    }
}