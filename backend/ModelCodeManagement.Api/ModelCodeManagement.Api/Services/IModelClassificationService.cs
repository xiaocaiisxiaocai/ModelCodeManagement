using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 机型分类服务接口
    /// </summary>
    public interface IModelClassificationService
    {
        /// <summary>
        /// 获取所有机型分类
        /// </summary>
        Task<ApiResponse<List<ModelClassificationDto>>> GetAllAsync();

        /// <summary>
        /// 根据产品类型获取机型分类
        /// </summary>
        Task<ApiResponse<List<ModelClassificationDto>>> GetByProductTypeAsync(string productType);

        /// <summary>
        /// 根据产品类型ID获取机型分类
        /// </summary>
        Task<ApiResponse<List<ModelClassificationDto>>> GetByProductTypeIdAsync(int productTypeId);

        /// <summary>
        /// 根据ID获取机型分类
        /// </summary>
        Task<ApiResponse<ModelClassificationDto>> GetByIdAsync(int id);

        /// <summary>
        /// 根据类型获取机型分类
        /// </summary>
        Task<ApiResponse<ModelClassificationDto>> GetByTypeAsync(string type);

        /// <summary>
        /// 创建机型分类
        /// </summary>
        Task<ApiResponse<ModelClassificationDto>> CreateAsync(CreateModelClassificationDto dto);

        /// <summary>
        /// 更新机型分类
        /// </summary>
        Task<ApiResponse<ModelClassificationDto>> UpdateAsync(int id, UpdateModelClassificationDto dto);

        /// <summary>
        /// 删除机型分类
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);
    }
}