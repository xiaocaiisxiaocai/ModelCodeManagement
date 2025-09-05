using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 编码使用服务实现
    /// </summary>
    public class CodeUsageService : ICodeUsageService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBaseRepository<CodeUsageEntry> _codeUsageRepository;
        private readonly ISystemConfigService _systemConfigService;
        private readonly ILogger<CodeUsageService> _logger;

        public CodeUsageService(
            ApplicationDbContext context,
            IBaseRepository<CodeUsageEntry> codeUsageRepository,
            ISystemConfigService systemConfigService,
            ILogger<CodeUsageService> logger)
        {
            _context = context;
            _codeUsageRepository = codeUsageRepository;
            _systemConfigService = systemConfigService;
            _logger = logger;
        }

        /// <summary>
        /// 分页查询编码使用记录
        /// </summary>
        public async Task<ApiResponse<PagedResult<CodeUsageEntryDto>>> GetPagedAsync(CodeUsageQueryDto query)
        {
            try
            {
                var queryable = _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .AsQueryable();

                // 条件筛选
                if (!query.IncludeDeleted)
                    queryable = queryable.Where(c => !c.IsDeleted);
                    
                if (query.ModelClassificationId.HasValue)
                    queryable = queryable.Where(c => c.ModelClassificationId == query.ModelClassificationId);
                    
                if (query.CodeClassificationId.HasValue)
                    queryable = queryable.Where(c => c.CodeClassificationId == query.CodeClassificationId);
                    
                if (query.IsAllocated.HasValue)
                    queryable = queryable.Where(c => c.IsAllocated == query.IsAllocated);
                    
                if (!string.IsNullOrEmpty(query.OccupancyType))
                    queryable = queryable.Where(c => c.OccupancyType == query.OccupancyType);
                    
                if (!string.IsNullOrEmpty(query.Keyword))
                    queryable = queryable.Where(c => 
                        c.Model.Contains(query.Keyword!) || 
                        c.ProductName!.Contains(query.Keyword!) ||
                        c.Description!.Contains(query.Keyword!));

                var total = await queryable.CountAsync();

                var items = await queryable
                    .OrderBy(c => c.Model)
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = items.Select(c => c.ToDto()).ToList();

                var result = new PagedResult<CodeUsageEntryDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询编码记录成功 - 获取{Count}条记录，共{Total}条", dtos.Count, total);
                return ApiResponse<PagedResult<CodeUsageEntryDto>>.SuccessResult(result, $"成功获取{dtos.Count}条编码记录");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取编码记录失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<CodeUsageEntryDto>>.ErrorResult($"获取编码记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据分类ID获取编码列表
        /// </summary>
        public async Task<ApiResponse<PagedResult<CodeUsageEntryDto>>> GetByClassificationAsync(
            int? codeClassificationId, 
            int? modelClassificationId,
            QueryDto query)
        {
            try
            {
                var queryable = _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => !c.IsDeleted)
                    .AsQueryable();

                if (codeClassificationId.HasValue)
                    queryable = queryable.Where(c => c.CodeClassificationId == codeClassificationId);
                    
                if (modelClassificationId.HasValue)
                    queryable = queryable.Where(c => c.ModelClassificationId == modelClassificationId);
                    
                if (!string.IsNullOrEmpty(query.Keyword))
                    queryable = queryable.Where(c => 
                        c.Model.Contains(query.Keyword!) || 
                        c.ProductName!.Contains(query.Keyword!) ||
                        c.Description!.Contains(query.Keyword!));

                var total = await queryable.CountAsync();

                var items = await queryable
                    .OrderBy(c => c.Model)
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = items.Select(c => c.ToDto()).ToList();

                var result = new PagedResult<CodeUsageEntryDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                return ApiResponse<PagedResult<CodeUsageEntryDto>>.SuccessResult(result, $"成功获取{dtos.Count}条编码记录");
            }
            catch (Exception ex)
            {
                return ApiResponse<PagedResult<CodeUsageEntryDto>>.ErrorResult($"获取编码记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据ID获取编码使用记录
        /// </summary>
        public async Task<ApiResponse<CodeUsageEntryDto>> GetByIdAsync(int id)
        {
            try
            {
                var entity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的编码记录", id);
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult($"未找到ID为{id}的编码记录");
                }

                var dto = entity.ToDto();
                return ApiResponse<CodeUsageEntryDto>.SuccessResult(dto, "获取编码记录成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取编码记录失败 - ID: {Id}", id);
                return ApiResponse<CodeUsageEntryDto>.ErrorResult($"获取编码记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 分配编码（预分配的编码变为已使用）
        /// </summary>
        public async Task<ApiResponse<CodeUsageEntryDto>> AllocateCodeAsync(int codeId, AllocateCodeDto dto)
        {
            try
            {
                var entity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .FirstOrDefaultAsync(c => c.Id == codeId && !c.IsDeleted);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{CodeId}的编码记录", codeId);
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult($"未找到ID为{codeId}的编码记录");
                }

                if (entity.IsAllocated)
                {
                    _logger.LogWarning("编码已被分配使用 - CodeId: {CodeId}, Model: {Model}", codeId, entity.Model);
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult("该编码已被分配使用");
                }

                // 验证延伸码
                if (!string.IsNullOrEmpty(dto.Extension))
                {
                    var extensionValidation = await ValidateExtensionAsync(dto.Extension);
                    if (!extensionValidation.Success)
                    {
                        return ApiResponse<CodeUsageEntryDto>.ErrorResult(extensionValidation.Message);
                    }

                    // 检查完整编码的唯一性
                    var fullModel = entity.Model + dto.Extension;
                    var exists = await _context.CodeUsageEntries
                        .AnyAsync(c => c.Model == fullModel && c.Id != codeId);

                    if (exists)
                    {
                        _logger.LogWarning("编码已存在 - FullModel: {FullModel}", fullModel);
                        return ApiResponse<CodeUsageEntryDto>.ErrorResult($"编码 {fullModel} 已存在");
                    }
                }

                entity.UpdateFromAllocateDto(dto);
                await _codeUsageRepository.UpdateAsync(entity);
                await _context.SaveChangesAsync();

                var resultDto = entity.ToDto();
                _logger.LogInformation("编码分配成功 - CodeId: {CodeId}, Model: {Model}", codeId, entity.Model);
                return ApiResponse<CodeUsageEntryDto>.SuccessResult(resultDto, "编码分配成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<CodeUsageEntryDto>.ErrorResult($"编码分配失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 创建编码使用记录
        /// </summary>
        public async Task<ApiResponse<CodeUsageEntryDto>> CreateAsync(CreateCodeUsageDto dto)
        {
            try
            {
                // 构造完整编码
                var fullModel = $"{dto.ModelType}{dto.CodeClassificationNumber}{dto.ActualNumber}{dto.Extension ?? ""}";

                // 检查唯一性
                var exists = await _context.CodeUsageEntries
                    .Where(c => c.Model == fullModel)
                    .AnyAsync();

                if (exists)
                {
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult($"编码 {fullModel} 已存在");
                }

                // 验证占用类型
                if (!string.IsNullOrEmpty(dto.OccupancyType))
                {
                    var validOccupancyTypes = new[] { "PLANNING", "WORK_ORDER", "PAUSE" };
                    if (!validOccupancyTypes.Contains(dto.OccupancyType))
                    {
                        return ApiResponse<CodeUsageEntryDto>.ErrorResult($"无效的占用类型: {dto.OccupancyType}");
                    }
                }

                // 创建编码记录
                var entity = new CodeUsageEntry
                {
                    Model = fullModel,
                    ModelType = dto.ModelType,
                    CodeClassificationNumber = dto.CodeClassificationNumber,
                    ActualNumber = dto.ActualNumber,
                    Extension = dto.Extension,
                    ProductName = dto.ProductName,
                    Description = dto.Description,
                    OccupancyType = dto.OccupancyType,
                    CustomerId = dto.CustomerId,
                    FactoryId = dto.FactoryId,
                    Builder = dto.Builder,
                    Requester = dto.Requester,
                    IsAllocated = true, // 手动创建直接标记为已使用
                    NumberDigits = 2, // 默认值
                    CreationDate = DateOnly.FromDateTime(DateTime.Now),
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                await _context.CodeUsageEntries.AddAsync(entity);
                await _context.SaveChangesAsync();

                // 重新查询以获取关联数据
                var createdEntity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .FirstAsync(c => c.Id == entity.Id);

                var resultDto = createdEntity.ToDto();
                _logger.LogInformation("编码创建成功 - Model: {Model}", fullModel);
                return ApiResponse<CodeUsageEntryDto>.SuccessResult(resultDto, "编码创建成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建编码失败 - Model: {Model}", $"{dto.ModelType}{dto.CodeClassificationNumber}{dto.ActualNumber}{dto.Extension ?? ""}");
                return ApiResponse<CodeUsageEntryDto>.ErrorResult($"创建编码失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 手动创建编码（2层结构专用）
        /// </summary>
        public async Task<ApiResponse<CodeUsageEntryDto>> CreateManualCodeAsync(CreateManualCodeDto dto)
        {
            try
            {
                // 获取机型分类信息
                var modelClassification = await _context.ModelClassifications
                    .Where(m => m.Id == dto.ModelClassificationId)
                    .FirstAsync();

                if (modelClassification == null)
                {
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult($"机型分类ID {dto.ModelClassificationId} 不存在或已禁用");
                }

                // 移除3层结构的限制，允许手动创建3层结构编码
                // 3层结构编码支持智能新增：不存在则创建，已存在则更新

                // 验证编号格式
                var numberDigitsResult = await _systemConfigService.GetNumberDigitsAsync();
                if (!numberDigitsResult.Success)
                {
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult("获取编号位数配置失败");
                }

                var numberDigits = numberDigitsResult.Data;
                if (dto.NumberPart.Length != numberDigits || !dto.NumberPart.All(char.IsDigit))
                {
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult($"编号必须为{numberDigits}位数字");
                }

                // 验证延伸码
                if (!string.IsNullOrEmpty(dto.Extension))
                {
                    var extensionValidation = await ValidateExtensionAsync(dto.Extension);
                    if (!extensionValidation.Success)
                    {
                        return ApiResponse<CodeUsageEntryDto>.ErrorResult(extensionValidation.Message);
                    }
                }

                // 构造完整编码
                var fullModel = $"{modelClassification.Type}{dto.NumberPart}{dto.Extension ?? ""}";

                // 检查唯一性
                var existingEntity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => c.Model == fullModel && !c.IsDeleted)
                    .FirstOrDefaultAsync();

                if (existingEntity != null)
                {
                    // 如果编码已存在，自动转为编辑模式
                    _logger.LogInformation("编码 {FullModel} 已存在，自动转为编辑模式", fullModel);
                    
                    // 更新现有记录
                    existingEntity.ProductName = dto.ProductName;
                    existingEntity.Description = dto.Description;
                    existingEntity.OccupancyType = dto.OccupancyType;
                    existingEntity.Builder = dto.Builder;
                    existingEntity.Requester = dto.Requester;
                    existingEntity.UpdatedAt = DateTime.Now;
                    
                    await _context.SaveChangesAsync();
                    
                    var updatedDto = existingEntity.ToDto();
                    return ApiResponse<CodeUsageEntryDto>.SuccessResult(updatedDto, $"编码 {fullModel} 已存在，已自动更新该记录");
                }

                // 创建编码记录
                var entity = new CodeUsageEntry
                {
                    Model = fullModel,
                    ModelType = modelClassification.Type,
                    CodeClassificationNumber = null, // 2层结构无代码分类
                    ActualNumber = dto.NumberPart,
                    Extension = dto.Extension,
                    ModelClassificationId = dto.ModelClassificationId,
                    CodeClassificationId = null, // 2层结构设为NULL
                    ProductName = dto.ProductName,
                    Description = dto.Description,
                    OccupancyType = dto.OccupancyType,
                    Builder = dto.Builder,
                    Requester = dto.Requester,
                    CreationDate = dto.CreationDate,
                    IsAllocated = true, // 手动创建直接标记为已使用
                    NumberDigits = numberDigits,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                await _context.CodeUsageEntries.AddAsync(entity);
                await _context.SaveChangesAsync();

                // 重新查询以获取关联数据
                var createdEntity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .FirstAsync(c => c.Id == entity.Id);

                var resultDto = createdEntity.ToDto();
                return ApiResponse<CodeUsageEntryDto>.SuccessResult(resultDto, "手动创建编码成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<CodeUsageEntryDto>.ErrorResult($"手动创建编码失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 更新编码使用记录
        /// </summary>
        public async Task<ApiResponse<CodeUsageEntryDto>> UpdateAsync(int id, UpdateCodeUsageDto dto)
        {
            try
            {
                var entity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => c.Id == id && !c.IsDeleted)
                    .FirstAsync();

                if (entity == null)
                {
                    return ApiResponse<CodeUsageEntryDto>.ErrorResult($"未找到ID为{id}的编码记录");
                }

                // 验证延伸码
                if (!string.IsNullOrEmpty(dto.Extension) && entity.Extension != dto.Extension)
                {
                    var extensionValidation = await ValidateExtensionAsync(dto.Extension);
                    if (!extensionValidation.Success)
                    {
                        return ApiResponse<CodeUsageEntryDto>.ErrorResult(extensionValidation.Message);
                    }

                    // 检查新的完整编码唯一性
                    var baseModel = entity.Model;
                    if (!string.IsNullOrEmpty(entity.Extension))
                    {
                        baseModel = baseModel.Substring(0, baseModel.Length - entity.Extension.Length);
                    }
                    var newFullModel = baseModel + dto.Extension;

                    var exists = await _context.CodeUsageEntries
                        .Where(c => c.Model == newFullModel && c.Id != id)
                        .AnyAsync();

                    if (exists)
                    {
                        return ApiResponse<CodeUsageEntryDto>.ErrorResult($"编码 {newFullModel} 已存在");
                    }
                }

                entity.UpdateFromDto(dto);
                _context.CodeUsageEntries.Update(entity);
                await _context.SaveChangesAsync();

                var resultDto = entity.ToDto();
                return ApiResponse<CodeUsageEntryDto>.SuccessResult(resultDto, "更新编码记录成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<CodeUsageEntryDto>.ErrorResult($"更新编码记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 软删除编码使用记录
        /// </summary>
        public async Task<ApiResponse> SoftDeleteAsync(int id, string reason)
        {
            try
            {
                var entity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => c.Id == id && !c.IsDeleted)
                    .FirstAsync();

                if (entity == null)
                {
                    return ApiResponse.ErrorResult($"未找到ID为{id}的编码记录");
                }

                entity.IsDeleted = true;
                entity.DeletedReason = reason;
                entity.UpdatedAt = DateTime.Now;

                _context.CodeUsageEntries.Update(entity);
                await _context.SaveChangesAsync();
                return ApiResponse.SuccessResult("删除编码记录成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult($"删除编码记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 恢复软删除的编码使用记录
        /// </summary>
        public async Task<ApiResponse> RestoreAsync(int id)
        {
            try
            {
                var entity = await _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => c.Id == id && c.IsDeleted)
                    .FirstAsync();

                if (entity == null)
                {
                    return ApiResponse.ErrorResult($"未找到ID为{id}的已删除编码记录");
                }

                entity.IsDeleted = false;
                entity.DeletedReason = null;
                entity.UpdatedAt = DateTime.Now;

                _context.CodeUsageEntries.Update(entity);
                await _context.SaveChangesAsync();
                return ApiResponse.SuccessResult("恢复编码记录成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult($"恢复编码记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 检查编码是否可用
        /// </summary>
        public async Task<ApiResponse<bool>> CheckCodeAvailabilityAsync(string modelType, int? classificationNumber, string actualNumber, string? extension = null)
        {
            try
            {
                var fullModel = classificationNumber.HasValue 
                    ? $"{modelType}{classificationNumber}{actualNumber}{extension ?? ""}"
                    : $"{modelType}{actualNumber}{extension ?? ""}";

                var exists = await _context.CodeUsageEntries
                    .Where(c => c.Model == fullModel)
                    .AnyAsync();

                return ApiResponse<bool>.SuccessResult(!exists, exists ? "编码已被使用" : "编码可用");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResult($"检查编码可用性失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 获取可用编码数量统计
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, int>>> GetAvailableCodeStatsAsync(int? modelClassificationId = null, int? codeClassificationId = null)
        {
            try
            {
                var queryable = _context.CodeUsageEntries
                    .Where(c => !c.IsDeleted);

                if (modelClassificationId.HasValue)
                    queryable = queryable.Where(c => c.ModelClassificationId == modelClassificationId);

                if (codeClassificationId.HasValue)
                    queryable = queryable.Where(c => c.CodeClassificationId == codeClassificationId);

                var totalCount = await queryable.CountAsync();
                var allocatedCount = await queryable.Where(c => c.IsAllocated).CountAsync();
                var availableCount = totalCount - allocatedCount;

                var stats = new Dictionary<string, int>
                {
                    ["total"] = totalCount,
                    ["allocated"] = allocatedCount,
                    ["available"] = availableCount
                };

                return ApiResponse<Dictionary<string, int>>.SuccessResult(stats, "获取编码统计成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<Dictionary<string, int>>.ErrorResult($"获取编码统计失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据机型获取所有编码使用记录（支持2层结构）
        /// </summary>
        public async Task<ApiResponse<List<CodeUsageEntryDto>>> GetByModelAsync(string modelType, bool includeDeleted = false)
        {
            try
            {
                var queryable = _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => c.ModelType == modelType);

                if (!includeDeleted)
                    queryable = queryable.Where(c => !c.IsDeleted);

                var entities = await queryable
                    .OrderBy(c => c.ActualNumber)
                    .ThenBy(c => c.Extension)
                    .ToListAsync();

                var dtos = entities.Select(e => e.ToDto()).ToList();

                _logger.LogInformation("根据机型{ModelType}获取{Count}条编码使用记录", modelType, dtos.Count);
                return ApiResponse<List<CodeUsageEntryDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}条编码使用记录");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据机型获取编码使用记录失败: ModelType={ModelType}", modelType);
                return ApiResponse<List<CodeUsageEntryDto>>.ErrorResult($"获取编码使用记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据机型和代码编号获取编码使用记录
        /// </summary>
        public async Task<ApiResponse<List<CodeUsageEntryDto>>> GetByModelAndCodeAsync(string modelType, string codeNumber, bool includeDeleted = false)
        {
            try
            {
                // codeNumber是代码分类编号，应匹配CodeClassificationNumber字段
                // 例如：codeNumber=1 匹配所有CodeClassificationNumber=1的记录
                if (!int.TryParse(codeNumber, out int codeClassificationNumber))
                {
                    return ApiResponse<List<CodeUsageEntryDto>>.ErrorResult($"无效的代码编号: {codeNumber}");
                }

                var queryable = _context.CodeUsageEntries
                    .Include(c => c.Customer)
                    .Include(c => c.Factory)
                    .Where(c => c.ModelType == modelType && c.CodeClassificationNumber == codeClassificationNumber);

                if (!includeDeleted)
                    queryable = queryable.Where(c => !c.IsDeleted);

                var entities = await queryable
                    .OrderBy(c => c.ActualNumber)
                    .ThenBy(c => c.Extension)
                    .ToListAsync();

                var dtos = entities.Select(e => e.ToDto()).ToList();

                return ApiResponse<List<CodeUsageEntryDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}条编码使用记录");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据机型和代码编号获取编码使用记录失败: ModelType={ModelType}, CodeNumber={CodeNumber}", modelType, codeNumber);
                return ApiResponse<List<CodeUsageEntryDto>>.ErrorResult($"获取编码使用记录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 验证延伸码
        /// </summary>
        private async Task<ApiResponse> ValidateExtensionAsync(string extension)
        {
            try
            {
                // 获取延伸码最大长度
                var maxLengthResult = await _systemConfigService.GetExtensionMaxLengthAsync();
                if (!maxLengthResult.Success)
                {
                    return ApiResponse.ErrorResult("获取延伸码长度配置失败");
                }

                if (extension.Length > maxLengthResult.Data)
                {
                    return ApiResponse.ErrorResult($"延伸码长度不能超过{maxLengthResult.Data}位");
                }

                // 获取排除字符
                var excludedCharsResult = await _systemConfigService.GetExtensionExcludedCharsAsync();
                if (!excludedCharsResult.Success)
                {
                    return ApiResponse.ErrorResult("获取延伸码排除字符配置失败");
                }

                var excludedChars = excludedCharsResult.Data;
                if (excludedChars != null && extension.Any(c => excludedChars.Contains(c.ToString())))
                {
                    return ApiResponse.ErrorResult($"延伸码不能包含字符: {string.Join(", ", excludedChars)}");
                }

                return ApiResponse.SuccessResult("延伸码验证通过");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult($"延伸码验证失败: {ex.Message}");
            }
        }
    }
}