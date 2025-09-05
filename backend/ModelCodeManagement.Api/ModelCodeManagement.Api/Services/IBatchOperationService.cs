using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 批量操作服务接口
    /// </summary>
    public interface IBatchOperationService
    {
        /// <summary>
        /// 批量创建产品类型
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchCreateProductTypesAsync(BatchCreateProductTypesDto dto);

        /// <summary>
        /// 批量创建机型分类
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchCreateModelClassificationsAsync(BatchCreateModelClassificationsDto dto);

        /// <summary>
        /// 批量创建代码分类
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchCreateCodeClassificationsAsync(BatchCreateCodeClassificationsDto dto);

        /// <summary>
        /// 批量导入编码使用记录
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchImportCodeUsageAsync(BatchImportCodeUsageDto dto);

        /// <summary>
        /// 批量更新编码占用类型
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchUpdateOccupancyTypesAsync(BatchUpdateOccupancyTypesDto dto);

        /// <summary>
        /// 批量软删除编码记录
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchSoftDeleteCodesAsync(BatchSoftDeleteCodesDto dto);

        /// <summary>
        /// 批量恢复软删除的编码记录
        /// </summary>
        Task<ApiResponse<BatchOperationResultDto>> BatchRestoreCodesAsync(BatchRestoreCodesDto dto);

        /// <summary>
        /// 导出编码使用记录到Excel
        /// </summary>
        Task<ApiResponse<ExportFileDto>> ExportCodeUsageToExcelAsync(CodeUsageExportQueryDto query);

        /// <summary>
        /// 导出机型分类到Excel
        /// </summary>
        Task<ApiResponse<ExportFileDto>> ExportModelClassificationsToExcelAsync(ExportQueryDto query);

        /// <summary>
        /// 获取批量操作历史记录
        /// </summary>
        Task<ApiResponse<PagedResult<BatchOperationHistoryDto>>> GetBatchOperationHistoryAsync(QueryDto query);

        /// <summary>
        /// 验证批量导入数据
        /// </summary>
        Task<ApiResponse<BatchImportValidationResultDto>> ValidateBatchImportAsync(ValidateBatchImportDto dto);

        /// <summary>
        /// 生成导入模板
        /// </summary>
        Task<ApiResponse<ExportFileDto>> GenerateImportTemplateAsync(string templateType);
    }
}