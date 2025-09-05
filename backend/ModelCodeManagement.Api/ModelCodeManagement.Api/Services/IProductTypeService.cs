using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 产品类型服务接口
    /// </summary>
    public interface IProductTypeService
    {
        /// <summary>
        /// 获取所有产品类型
        /// </summary>
        Task<ApiResponse<List<ProductTypeDto>>> GetAllAsync();

        /// <summary>
        /// 根据ID获取产品类型
        /// </summary>
        Task<ApiResponse<ProductTypeDto>> GetByIdAsync(int id);

        /// <summary>
        /// 根据代码获取产品类型
        /// </summary>
        Task<ApiResponse<ProductTypeDto>> GetByCodeAsync(string code);

        /// <summary>
        /// 创建产品类型
        /// </summary>
        Task<ApiResponse<ProductTypeDto>> CreateAsync(CreateProductTypeDto dto);

        /// <summary>
        /// 更新产品类型
        /// </summary>
        Task<ApiResponse<ProductTypeDto>> UpdateAsync(int id, UpdateProductTypeDto dto);

        /// <summary>
        /// 删除产品类型
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);
    }
}