using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 产品类型服务实现
    /// </summary>
    public class ProductTypeService : IProductTypeService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBaseRepository<ProductType> _productTypeRepository;
        private readonly ILogger<ProductTypeService> _logger;

        public ProductTypeService(
            ApplicationDbContext context,
            IBaseRepository<ProductType> productTypeRepository,
            ILogger<ProductTypeService> logger)
        {
            _context = context;
            _productTypeRepository = productTypeRepository;
            _logger = logger;
        }

        /// <summary>
        /// 获取所有产品类型
        /// </summary>
        public async Task<ApiResponse<List<ProductTypeDto>>> GetAllAsync()
        {
            try
            {
                var productTypes = await _context.ProductTypes
                    .Include(p => p.ModelClassifications)
                    .OrderBy(p => p.Code)
                    .ToListAsync();

                var dtos = productTypes.Select(p => p.ToDto()).ToList();
                _logger.LogInformation("成功获取{Count}个产品类型", dtos.Count);
                return ApiResponse<List<ProductTypeDto>>.SuccessResult(dtos, $"成功获取{dtos.Count}个产品类型");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取产品类型列表失败");
                return ApiResponse<List<ProductTypeDto>>.ErrorResult($"获取产品类型列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据ID获取产品类型
        /// </summary>
        public async Task<ApiResponse<ProductTypeDto>> GetByIdAsync(int id)
        {
            try
            {
                var productType = await _context.ProductTypes
                    .Include(p => p.ModelClassifications)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (productType == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的产品类型", id);
                    return ApiResponse<ProductTypeDto>.ErrorResult($"未找到ID为{id}的产品类型");
                }

                var dto = productType.ToDto();
                return ApiResponse<ProductTypeDto>.SuccessResult(dto, "获取产品类型成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取产品类型失败 - ID: {Id}", id);
                return ApiResponse<ProductTypeDto>.ErrorResult($"获取产品类型失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据代码获取产品类型
        /// </summary>
        public async Task<ApiResponse<ProductTypeDto>> GetByCodeAsync(string code)
        {
            try
            {
                var productType = await _context.ProductTypes
                    .Include(p => p.ModelClassifications)
                    .FirstOrDefaultAsync(p => p.Code == code);

                if (productType == null)
                {
                    _logger.LogWarning("未找到代码为{Code}的产品类型", code);
                    return ApiResponse<ProductTypeDto>.ErrorResult($"未找到代码为{code}的产品类型");
                }

                var dto = productType.ToDto();
                return ApiResponse<ProductTypeDto>.SuccessResult(dto, "获取产品类型成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取产品类型失败 - Code: {Code}", code);
                return ApiResponse<ProductTypeDto>.ErrorResult($"获取产品类型失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 创建产品类型
        /// </summary>
        public async Task<ApiResponse<ProductTypeDto>> CreateAsync(CreateProductTypeDto dto)
        {
            try
            {
                // 验证代码唯一性
                var exists = await _context.ProductTypes
                    .AnyAsync(p => p.Code == dto.Code);

                if (exists)
                {
                    _logger.LogWarning("产品代码已存在 - Code: {Code}", dto.Code);
                    return ApiResponse<ProductTypeDto>.ErrorResult($"产品代码 {dto.Code} 已存在");
                }

                var entity = dto.ToEntity();
                var createdEntity = await _productTypeRepository.AddAsync(entity);
                await _context.SaveChangesAsync();

                var resultDto = createdEntity.ToDto();
                _logger.LogInformation("创建产品类型成功 - Code: {Code}, Id: {Id}", dto.Code, createdEntity.Id);
                return ApiResponse<ProductTypeDto>.SuccessResult(resultDto, "创建产品类型成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建产品类型失败 - Code: {Code}", dto.Code);
                return ApiResponse<ProductTypeDto>.ErrorResult($"创建产品类型失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 更新产品类型
        /// </summary>
        public async Task<ApiResponse<ProductTypeDto>> UpdateAsync(int id, UpdateProductTypeDto dto)
        {
            try
            {
                var entity = await _context.ProductTypes
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到要更新的产品类型 - ID: {Id}", id);
                    return ApiResponse<ProductTypeDto>.ErrorResult($"未找到ID为{id}的产品类型");
                }

                // 验证代码唯一性（排除自身）
                if (entity.Code != dto.Code)
                {
                    var exists = await _context.ProductTypes
                        .AnyAsync(p => p.Code == dto.Code && p.Id != id);

                    if (exists)
                    {
                        _logger.LogWarning("产品代码已被其他产品使用 - Code: {Code}", dto.Code);
                        return ApiResponse<ProductTypeDto>.ErrorResult($"产品代码 {dto.Code} 已被其他产品使用");
                    }
                }

                entity.UpdateFromDto(dto);
                await _productTypeRepository.UpdateAsync(entity);
                await _context.SaveChangesAsync();

                var resultDto = entity.ToDto();
                _logger.LogInformation("更新产品类型成功 - ID: {Id}, Code: {Code}", id, dto.Code);
                return ApiResponse<ProductTypeDto>.SuccessResult(resultDto, "更新产品类型成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新产品类型失败 - ID: {Id}", id);
                return ApiResponse<ProductTypeDto>.ErrorResult($"更新产品类型失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 删除产品类型
        /// </summary>
        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var entity = await _context.ProductTypes
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到要删除的产品类型 - ID: {Id}", id);
                    return ApiResponse.ErrorResult($"未找到ID为{id}的产品类型");
                }

                // 检查是否有关联的机型分类
                var hasModelClassifications = await _context.ModelClassifications
                    .AnyAsync(m => m.ProductTypeId == id);

                if (hasModelClassifications)
                {
                    _logger.LogWarning("产品类型下存在机型分类，无法删除 - ID: {Id}", id);
                    return ApiResponse.ErrorResult("该产品类型下存在机型分类，无法删除");
                }

                await _productTypeRepository.DeleteAsync(entity);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("删除产品类型成功 - ID: {Id}, Code: {Code}", id, entity.Code);
                return ApiResponse.SuccessResult("删除产品类型成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除产品类型失败 - ID: {Id}", id);
                return ApiResponse.ErrorResult($"删除产品类型失败: {ex.Message}");
            }
        }
    }
}