using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 批量操作控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/batch-operations")]
    [Authorize(Policy = "BatchOperation")] // RBAC权限控制：需要批量操作权限
    public class BatchOperationsController : ControllerBase
    {
        private readonly IBatchOperationService _batchOperationService;

        public BatchOperationsController(IBatchOperationService batchOperationService)
        {
            _batchOperationService = batchOperationService;
        }

        /// <summary>
        /// 批量创建产品类型
        /// </summary>
        /// <param name="dto">批量创建产品类型DTO</param>
        [HttpPost("product-types")]
        [AuditLog("BatchCreateProductTypes", "BatchOperation")]
        public async Task<IActionResult> BatchCreateProductTypes([FromBody] BatchCreateProductTypesDto dto)
        {
            var result = await _batchOperationService.BatchCreateProductTypesAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量创建机型分类
        /// </summary>
        /// <param name="dto">批量创建机型分类DTO</param>
        [HttpPost("model-classifications")]
        [AuditLog("BatchCreateModelClassifications", "BatchOperation")]
        public async Task<IActionResult> BatchCreateModelClassifications([FromBody] BatchCreateModelClassificationsDto dto)
        {
            var result = await _batchOperationService.BatchCreateModelClassificationsAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量创建代码分类
        /// </summary>
        /// <param name="dto">批量创建代码分类DTO</param>
        [HttpPost("code-classifications")]
        [AuditLog("BatchCreateCodeClassifications", "BatchOperation")]
        public async Task<IActionResult> BatchCreateCodeClassifications([FromBody] BatchCreateCodeClassificationsDto dto)
        {
            var result = await _batchOperationService.BatchCreateCodeClassificationsAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量导入编码使用记录
        /// </summary>
        /// <param name="dto">批量导入编码使用记录DTO</param>
        [HttpPost("code-usage-import")]
        [AuditLog("BatchImportCodeUsage", "BatchOperation")]
        public async Task<IActionResult> BatchImportCodeUsage([FromBody] BatchImportCodeUsageDto dto)
        {
            var result = await _batchOperationService.BatchImportCodeUsageAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量更新编码占用类型
        /// </summary>
        /// <param name="dto">批量更新占用类型DTO</param>
        [HttpPost("update-occupancy-types")]
        [AuditLog("BatchUpdateOccupancyTypes", "BatchOperation")]
        public async Task<IActionResult> BatchUpdateOccupancyTypes([FromBody] BatchUpdateOccupancyTypesDto dto)
        {
            var result = await _batchOperationService.BatchUpdateOccupancyTypesAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量软删除编码记录
        /// </summary>
        /// <param name="dto">批量软删除DTO</param>
        [HttpPost("soft-delete-codes")]
        [AuditLog("BatchSoftDeleteCodes", "BatchOperation")]
        public async Task<IActionResult> BatchSoftDeleteCodes([FromBody] BatchSoftDeleteCodesDto dto)
        {
            var result = await _batchOperationService.BatchSoftDeleteCodesAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量恢复软删除的编码记录
        /// </summary>
        /// <param name="dto">批量恢复DTO</param>
        [HttpPost("restore-codes")]
        [AuditLog("BatchRestoreCodes", "BatchOperation")]
        public async Task<IActionResult> BatchRestoreCodes([FromBody] BatchRestoreCodesDto dto)
        {
            var result = await _batchOperationService.BatchRestoreCodesAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 导出编码使用记录到Excel
        /// </summary>
        /// <param name="query">导出查询参数</param>
        [HttpGet("export-code-usage")]
        public async Task<IActionResult> ExportCodeUsage([FromQuery] CodeUsageExportQueryDto query)
        {
            var result = await _batchOperationService.ExportCodeUsageToExcelAsync(query);
            
            if (result.Success)
            {
                return File(result.Data!.FileContent, result.Data.ContentType, result.Data.FileName);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 导出机型分类到Excel
        /// </summary>
        /// <param name="query">导出查询参数</param>
        [HttpGet("export-model-classifications")]
        public async Task<IActionResult> ExportModelClassifications([FromQuery] ExportQueryDto query)
        {
            var result = await _batchOperationService.ExportModelClassificationsToExcelAsync(query);
            
            if (result.Success)
            {
                return File(result.Data!.FileContent, result.Data.ContentType, result.Data.FileName);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取批量操作历史记录
        /// </summary>
        /// <param name="query">查询参数</param>
        [HttpGet("history")]
        public async Task<IActionResult> GetBatchOperationHistory([FromQuery] QueryDto query)
        {
            var result = await _batchOperationService.GetBatchOperationHistoryAsync(query);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 验证批量导入数据
        /// </summary>
        /// <param name="dto">验证批量导入DTO</param>
        [HttpPost("validate-import")]
        public async Task<IActionResult> ValidateBatchImport([FromBody] ValidateBatchImportDto dto)
        {
            var result = await _batchOperationService.ValidateBatchImportAsync(dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取导入模板
        /// </summary>
        /// <param name="templateType">模板类型</param>
        [HttpGet("import-template/{templateType}")]
        public async Task<IActionResult> GetImportTemplate(string templateType)
        {
            var result = await _batchOperationService.GenerateImportTemplateAsync(templateType);
            
            if (result.Success)
            {
                return File(result.Data!.FileContent, result.Data.ContentType, result.Data.FileName);
            }
            
            return BadRequest(result);
        }
    }
}