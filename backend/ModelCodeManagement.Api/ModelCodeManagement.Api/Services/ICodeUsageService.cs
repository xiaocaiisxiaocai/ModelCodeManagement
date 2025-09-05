using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 编码使用服务接口
    /// </summary>
    public interface ICodeUsageService
    {
        /// <summary>
        /// 分页查询编码使用记录
        /// </summary>
        Task<ApiResponse<PagedResult<CodeUsageEntryDto>>> GetPagedAsync(CodeUsageQueryDto query);

        /// <summary>
        /// 根据分类ID获取编码列表
        /// </summary>
        Task<ApiResponse<PagedResult<CodeUsageEntryDto>>> GetByClassificationAsync(
            int? codeClassificationId, 
            int? modelClassificationId,
            QueryDto query);

        /// <summary>
        /// 根据ID获取编码使用记录
        /// </summary>
        Task<ApiResponse<CodeUsageEntryDto>> GetByIdAsync(int id);

        /// <summary>
        /// 根据机型获取所有编码使用记录（支持2层结构）
        /// </summary>
        Task<ApiResponse<List<CodeUsageEntryDto>>> GetByModelAsync(string modelType, bool includeDeleted = false);

        /// <summary>
        /// 根据机型和代码编号获取编码使用记录
        /// </summary>
        Task<ApiResponse<List<CodeUsageEntryDto>>> GetByModelAndCodeAsync(string modelType, string codeNumber, bool includeDeleted = false);

        /// <summary>
        /// 分配编码（预分配的编码变为已使用）
        /// </summary>
        Task<ApiResponse<CodeUsageEntryDto>> AllocateCodeAsync(int codeId, AllocateCodeDto dto);

        /// <summary>
        /// 创建编码使用记录
        /// </summary>
        Task<ApiResponse<CodeUsageEntryDto>> CreateAsync(CreateCodeUsageDto dto);

        /// <summary>
        /// 手动创建编码（2层结构专用）
        /// </summary>
        Task<ApiResponse<CodeUsageEntryDto>> CreateManualCodeAsync(CreateManualCodeDto dto);

        /// <summary>
        /// 更新编码使用记录
        /// </summary>
        Task<ApiResponse<CodeUsageEntryDto>> UpdateAsync(int id, UpdateCodeUsageDto dto);

        /// <summary>
        /// 软删除编码使用记录
        /// </summary>
        Task<ApiResponse> SoftDeleteAsync(int id, string reason);

        /// <summary>
        /// 恢复软删除的编码使用记录
        /// </summary>
        Task<ApiResponse> RestoreAsync(int id);

        /// <summary>
        /// 检查编码是否可用
        /// </summary>
        Task<ApiResponse<bool>> CheckCodeAvailabilityAsync(string modelType, int? classificationNumber, string actualNumber, string? extension = null);

        /// <summary>
        /// 获取可用编码数量统计
        /// </summary>
        Task<ApiResponse<Dictionary<string, int>>> GetAvailableCodeStatsAsync(int? modelClassificationId = null, int? codeClassificationId = null);
    }
}