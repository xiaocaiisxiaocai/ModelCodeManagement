using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 编码使用控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/code-usage")]
    [Authorize]
    public class CodeUsageController : ControllerBase
    {
        private readonly ICodeUsageService _codeUsageService;

        public CodeUsageController(ICodeUsageService codeUsageService)
        {
            _codeUsageService = codeUsageService;
        }

        /// <summary>
        /// 分页查询编码使用记录
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "CodeUsageView")] // RBAC权限控制：需要编码使用查看权限
        public async Task<IActionResult> GetPaged([FromQuery] CodeUsageQueryDto query)
        {
            var result = await _codeUsageService.GetPagedAsync(query);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据分类ID获取编码列表
        /// </summary>
        [HttpGet("by-classification/{classificationId}")]
        [Authorize(Policy = "CodeUsageView")] // RBAC权限控制：需要编码使用查看权限
        public async Task<IActionResult> GetByClassification(int classificationId, [FromQuery] QueryDto query)
        {
            var result = await _codeUsageService.GetByClassificationAsync(classificationId, null, query);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据机型分类ID获取编码列表
        /// </summary>
        [HttpGet("by-model-classification/{modelClassificationId}")]
        public async Task<IActionResult> GetByModelClassification(int modelClassificationId, [FromQuery] QueryDto query)
        {
            var result = await _codeUsageService.GetByClassificationAsync(null, modelClassificationId, query);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据机型获取所有编码使用记录（支持2层结构）
        /// </summary>
        [HttpGet("by-model")]
        public async Task<IActionResult> GetByModel(
            [FromQuery] string modelType,
            [FromQuery] bool includeDeleted = false)
        {
            var result = await _codeUsageService.GetByModelAsync(modelType, includeDeleted);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据机型和代码编号获取编码使用记录
        /// </summary>
        [HttpGet("by-model-code")]
        public async Task<IActionResult> GetByModelAndCode(
            [FromQuery] string modelType,
            [FromQuery] string codeNumber,
            [FromQuery] bool includeDeleted = false)
        {
            var result = await _codeUsageService.GetByModelAndCodeAsync(modelType, codeNumber, includeDeleted);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据ID获取编码使用记录
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _codeUsageService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 创建新的编码使用记录
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "CodeUsageManage")] // RBAC权限控制：需要编码使用管理权限
        [AuditLog("CreateCodeUsage", "CodeUsage")]
        public async Task<IActionResult> Create([FromBody] CreateCodeUsageDto dto)
        {
            var result = await _codeUsageService.CreateAsync(dto);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 分配编码
        /// </summary>
        [HttpPost("{id}/allocate")]
        [Authorize(Policy = "CodeUsageManage")] // RBAC权限控制：需要编码使用管理权限
        [AuditLog("AllocateCode", "CodeUsage")]
        public async Task<IActionResult> AllocateCode(int id, [FromBody] AllocateCodeDto dto)
        {
            var result = await _codeUsageService.AllocateCodeAsync(id, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 手动创建编码（2层结构专用）
        /// </summary>
        [HttpPost("create-manual")]
        [Authorize(Policy = "CodeUsageManage")] // RBAC权限控制：需要编码使用管理权限
        [AuditLog("CreateManualCode", "CodeUsage")]
        public async Task<IActionResult> CreateManualCode([FromBody] CreateManualCodeDto dto)
        {
            var result = await _codeUsageService.CreateManualCodeAsync(dto);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新编码使用记录
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Policy = "CodeUsageManage")] // RBAC权限控制：需要编码使用管理权限
        [AuditLog("UpdateCodeUsage", "CodeUsage")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCodeUsageDto dto)
        {
            var result = await _codeUsageService.UpdateAsync(id, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 软删除编码使用记录
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "CodeUsageDelete")] // RBAC权限控制：需要编码使用删除权限
        [AuditLog("SoftDeleteCodeUsage", "CodeUsage")]
        public async Task<IActionResult> SoftDelete(int id, [FromQuery] string reason = "")
        {
            var result = await _codeUsageService.SoftDeleteAsync(id, reason);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 恢复软删除的编码使用记录
        /// </summary>
        [HttpPost("{id}/restore")]
        [Authorize(Policy = "CodeUsageManage")] // RBAC权限控制：需要编码使用管理权限
        [AuditLog("RestoreCodeUsage", "CodeUsage")]
        public async Task<IActionResult> Restore(int id)
        {
            var result = await _codeUsageService.RestoreAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 检查编码是否可用
        /// </summary>
        [HttpGet("check-availability")]
        public async Task<IActionResult> CheckAvailability(
            [FromQuery] string modelType,
            [FromQuery] int? classificationNumber,
            [FromQuery] string actualNumber,
            [FromQuery] string? extension = null)
        {
            var result = await _codeUsageService.CheckCodeAvailabilityAsync(modelType, classificationNumber, actualNumber, extension);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取可用编码数量统计
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(
            [FromQuery] int? modelClassificationId = null,
            [FromQuery] int? codeClassificationId = null)
        {
            var result = await _codeUsageService.GetAvailableCodeStatsAsync(modelClassificationId, codeClassificationId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }
}