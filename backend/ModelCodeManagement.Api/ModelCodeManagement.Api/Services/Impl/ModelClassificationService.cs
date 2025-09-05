using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 机型分类服务实现
    /// </summary>
    public class ModelClassificationService : IModelClassificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBaseRepository<ModelClassification> _modelClassificationRepository;
        private readonly ILogger<ModelClassificationService> _logger;

        public ModelClassificationService(
            ApplicationDbContext context,
            IBaseRepository<ModelClassification> modelClassificationRepository,
            ILogger<ModelClassificationService> logger)
        {
            _context = context;
            _modelClassificationRepository = modelClassificationRepository;
            _logger = logger;
        }

        /// <summary>
        /// 获取所有机型分类
        /// </summary>
        public async Task<ApiResponse<List<ModelClassificationDto>>> GetAllAsync()
        {
            try
            {
                var modelClassifications = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .Include(m => m.CodeClassifications)
                    .OrderBy(m => m.ProductTypeId)
                    .ThenBy(m => m.Type)
                    .ToListAsync();

                var dtos = modelClassifications.Select(m => m.ToDto()).ToList();
                _logger.LogInformation("成功获取{Count}个机型分类", dtos.Count);
                return ApiResponse<List<ModelClassificationDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}个机型分类");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型分类列表失败");
                return ApiResponse<List<ModelClassificationDto>>.ErrorResult($"获取机型分类列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据产品类型获取机型分类
        /// </summary>
        public async Task<ApiResponse<List<ModelClassificationDto>>> GetByProductTypeAsync(string productType)
        {
            try
            {
                var modelClassifications = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .Include(m => m.CodeClassifications)
                    .Where(m => m.ProductType!.Code == productType)
                    .OrderBy(m => m.Type)
                    .ToListAsync();

                var dtos = modelClassifications.Select(m => m.ToDto()).ToList();
                _logger.LogInformation("根据产品类型{ProductType}获取{Count}个机型分类", productType, dtos.Count);
                return ApiResponse<List<ModelClassificationDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}个机型分类");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型分类列表失败 - ProductType: {ProductType}", productType);
                return ApiResponse<List<ModelClassificationDto>>.ErrorResult($"获取机型分类列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据产品类型ID获取机型分类
        /// </summary>
        public async Task<ApiResponse<List<ModelClassificationDto>>> GetByProductTypeIdAsync(int productTypeId)
        {
            try
            {
                var modelClassifications = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .Include(m => m.CodeClassifications)
                    .Include(m => m.CodeUsageEntries)
                    .Where(m => m.ProductTypeId == productTypeId)
                    .OrderBy(m => m.Type)
                    .ToListAsync();

                var dtos = modelClassifications.Select(m => m.ToDto()).ToList();
                return ApiResponse<List<ModelClassificationDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}个机型分类");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型分类列表失败 - ProductTypeId: {ProductTypeId}", productTypeId);
                return ApiResponse<List<ModelClassificationDto>>.ErrorResult($"获取机型分类列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据ID获取机型分类
        /// </summary>
        public async Task<ApiResponse<ModelClassificationDto>> GetByIdAsync(int id)
        {
            try
            {
                var modelClassification = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .Include(m => m.CodeClassifications)
                    .Include(m => m.CodeUsageEntries)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (modelClassification == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的机型分类", id);
                    return ApiResponse<ModelClassificationDto>.ErrorResult($"未找到ID为{id}的机型分类");
                }

                var dto = modelClassification.ToDto();
                return ApiResponse<ModelClassificationDto>.SuccessResult(dto, "获取机型分类成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型分类失败 - ID: {Id}", id);
                return ApiResponse<ModelClassificationDto>.ErrorResult($"获取机型分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据类型获取机型分类
        /// </summary>
        public async Task<ApiResponse<ModelClassificationDto>> GetByTypeAsync(string type)
        {
            try
            {
                var modelClassification = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .Include(m => m.CodeClassifications)
                    .Include(m => m.CodeUsageEntries)
                    .FirstOrDefaultAsync(m => m.Type == type);

                if (modelClassification == null)
                {
                    _logger.LogWarning("未找到类型为{Type}的机型分类", type);
                    return ApiResponse<ModelClassificationDto>.ErrorResult($"未找到类型为{type}的机型分类");
                }

                var dto = modelClassification.ToDto();
                return ApiResponse<ModelClassificationDto>.SuccessResult(dto, "获取机型分类成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型分类失败 - Type: {Type}", type);
                return ApiResponse<ModelClassificationDto>.ErrorResult($"获取机型分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 创建机型分类
        /// </summary>
        public async Task<ApiResponse<ModelClassificationDto>> CreateAsync(CreateModelClassificationDto dto)
        {
            try
            {
                // 验证产品类型是否存在
                var productTypeExists = await _context.ProductTypes
                    .Where(p => p.Id == dto.ProductTypeId)
                    .AnyAsync();

                if (!productTypeExists)
                {
                    return ApiResponse<ModelClassificationDto>.ErrorResult($"产品类型ID {dto.ProductTypeId} 不存在或已禁用");
                }

                // 验证机型类型唯一性
                var typeExists = await _context.ModelClassifications
                    .Where(m => m.Type == dto.Type)
                    .AnyAsync();

                if (typeExists)
                {
                    return ApiResponse<ModelClassificationDto>.ErrorResult($"机型类型 {dto.Type} 已存在");
                }

                var entity = dto.ToEntity();
                var createdEntity = await _modelClassificationRepository.AddAsync(entity);
                await _context.SaveChangesAsync();

                // 重新查询以获取关联数据
                var entityWithIncludes = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .FirstOrDefaultAsync(m => m.Id == createdEntity.Id);

                var resultDto = entityWithIncludes!.ToDto();
                _logger.LogInformation("创建机型分类成功 - Type: {Type}, Id: {Id}", dto.Type, createdEntity.Id);
                return ApiResponse<ModelClassificationDto>.SuccessResult(resultDto, "创建机型分类成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<ModelClassificationDto>.ErrorResult($"创建机型分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 更新机型分类
        /// </summary>
        public async Task<ApiResponse<ModelClassificationDto>> UpdateAsync(int id, UpdateModelClassificationDto dto)
        {
            try
            {
                var entity = await _context.ModelClassifications
                    .Include(m => m.ProductType)
                    .Where(m => m.Id == id)
                    .FirstOrDefaultAsync();

                if (entity == null)
                {
                    return ApiResponse<ModelClassificationDto>.ErrorResult($"未找到ID为{id}的机型分类");
                }

                // 验证机型类型唯一性（排除自身）
                if (entity.Type != dto.Type)
                {
                    var typeExists = await _context.ModelClassifications
                        .Where(m => m.Type == dto.Type && m.Id != id)
                        .AnyAsync();

                    if (typeExists)
                    {
                        return ApiResponse<ModelClassificationDto>.ErrorResult($"机型类型 {dto.Type} 已被其他机型分类使用");
                    }
                }

                entity.UpdateFromDto(dto);
                await _modelClassificationRepository.UpdateAsync(entity);
                await _context.SaveChangesAsync();

                var resultDto = entity.ToDto();
                _logger.LogInformation("更新机型分类成功 - ID: {Id}, Type: {Type}", id, dto.Type);
                return ApiResponse<ModelClassificationDto>.SuccessResult(resultDto, "更新机型分类成功");
            }
            catch (Exception ex)
            {
                return ApiResponse<ModelClassificationDto>.ErrorResult($"更新机型分类失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 删除机型分类
        /// </summary>
        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var entity = await _context.ModelClassifications
                    .Where(m => m.Id == id)
                    .FirstAsync();

                if (entity == null)
                {
                    return ApiResponse.ErrorResult($"未找到ID为{id}的机型分类");
                }

                // 检查是否有关联的代码分类
                var hasCodeClassifications = await _context.CodeClassifications
                    .Where(c => c.ModelClassificationId == id)
                    .AnyAsync();

                if (hasCodeClassifications)
                {
                    return ApiResponse.ErrorResult("该机型分类下存在代码分类，无法删除");
                }

                // 检查是否有关联的代码使用记录
                var hasCodeUsageEntries = await _context.CodeUsageEntries
                    .Where(c => c.ModelClassificationId == id)
                    .AnyAsync();

                if (hasCodeUsageEntries)
                {
                    return ApiResponse.ErrorResult("该机型分类下存在编码使用记录，无法删除");
                }

                await _modelClassificationRepository.DeleteAsync(entity);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("删除机型分类成功 - ID: {Id}, Type: {Type}", id, entity.Type);
                return ApiResponse.SuccessResult("删除机型分类成功");
            }
            catch (Exception ex)
            {
                return ApiResponse.ErrorResult($"删除机型分类失败: {ex.Message}");
            }
        }
    }
}