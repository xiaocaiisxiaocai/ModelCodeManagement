using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 代码分类服务接口
    /// </summary>
    public interface ICodeClassificationService
    {
        /// <summary>
        /// 根据机型类型获取代码分类
        /// </summary>
        Task<ApiResponse<List<CodeClassificationDto>>> GetByModelTypeAsync(string modelType);

        /// <summary>
        /// 根据机型分类ID获取代码分类
        /// </summary>
        Task<ApiResponse<List<CodeClassificationDto>>> GetByModelClassificationIdAsync(int modelClassificationId);

        /// <summary>
        /// 根据ID获取代码分类
        /// </summary>
        Task<ApiResponse<CodeClassificationDto>> GetByIdAsync(int id);

        /// <summary>
        /// 创建代码分类（会触发预分配）
        /// </summary>
        Task<ApiResponse<CodeClassificationDto>> CreateAsync(CreateCodeClassificationDto dto);

        /// <summary>
        /// 更新代码分类
        /// </summary>
        Task<ApiResponse<CodeClassificationDto>> UpdateAsync(int id, UpdateCodeClassificationDto dto);

        /// <summary>
        /// 删除代码分类
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);

        /// <summary>
        /// 预分配编码（3层结构专用）
        /// </summary>
        Task<ApiResponse> PreAllocateCodesAsync(int codeClassificationId);
    }
}