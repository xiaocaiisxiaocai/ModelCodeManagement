using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 代码分类控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/code-classifications")]
    [Authorize]
    public class CodeClassificationController : ControllerBase
    {
        private readonly ICodeClassificationService _codeClassificationService;

        public CodeClassificationController(ICodeClassificationService codeClassificationService)
        {
            _codeClassificationService = codeClassificationService;
        }

        /// <summary>
        /// 根据机型类型获取代码分类
        /// </summary>
        /// <param name="modelType">机型类型，如 SLU-, SLUR- 等</param>
        [HttpGet("by-model/{modelType}")]
        [Authorize(Policy = "CodeClassificationView")] // RBAC权限控制：需要代码分类查看权限
        public async Task<IActionResult> GetByModelType(string modelType)
        {
            var result = await _codeClassificationService.GetByModelTypeAsync(modelType);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据机型分类ID获取代码分类
        /// </summary>
        /// <param name="modelClassificationId">机型分类ID</param>
        [HttpGet("by-model-id/{modelClassificationId}")]
        [Authorize(Policy = "CodeClassificationView")] // RBAC权限控制：需要代码分类查看权限
        public async Task<IActionResult> GetByModelClassificationId(int modelClassificationId)
        {
            var result = await _codeClassificationService.GetByModelClassificationIdAsync(modelClassificationId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据ID获取代码分类
        /// </summary>
        /// <param name="id">代码分类ID</param>
        [HttpGet("{id}")]
        [Authorize(Policy = "CodeClassificationView")] // RBAC权限控制：需要代码分类查看权限
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _codeClassificationService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 创建代码分类（会自动触发预分配）
        /// </summary>
        /// <param name="dto">创建代码分类DTO</param>
        /// <remarks>
        /// 当创建代码分类时，系统会自动为3层结构的机型预分配100个编码记录。
        /// 例如：创建"1-内层"时，会自动生成SLU-100到SLU-199的编码记录。
        /// </remarks>
        [HttpPost]
        [Authorize(Policy = "CodeClassificationManage")] // RBAC权限控制：需要代码分类管理权限
        [AuditLog("CreateCodeClassification", "CodeClassification")]
        public async Task<IActionResult> Create([FromBody] CreateCodeClassificationDto dto)
        {
            var result = await _codeClassificationService.CreateAsync(dto);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新代码分类
        /// </summary>
        /// <param name="id">代码分类ID</param>
        /// <param name="dto">更新代码分类DTO</param>
        [HttpPut("{id}")]
        [Authorize(Policy = "CodeClassificationManage")] // RBAC权限控制：需要代码分类管理权限
        [AuditLog("UpdateCodeClassification", "CodeClassification")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCodeClassificationDto dto)
        {
            var result = await _codeClassificationService.UpdateAsync(id, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除代码分类
        /// </summary>
        /// <param name="id">代码分类ID</param>
        /// <remarks>
        /// 删除代码分类时，会同时删除该分类下所有未使用的预分配编码记录。
        /// 已使用的编码记录将被保留。
        /// </remarks>
        [HttpDelete("{id}")]
        [Authorize(Policy = "CodeClassificationDelete")] // RBAC权限控制：需要代码分类删除权限
        [AuditLog("DeleteCodeClassification", "CodeClassification")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _codeClassificationService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }
}