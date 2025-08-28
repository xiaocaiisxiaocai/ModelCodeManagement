using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 机型分类控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/model-classifications")]
    [Authorize]
    public class ModelClassificationsController : ControllerBase
    {
        private readonly IModelClassificationService _modelClassificationService;

        public ModelClassificationsController(IModelClassificationService modelClassificationService)
        {
            _modelClassificationService = modelClassificationService;
        }

        /// <summary>
        /// 获取所有机型分类
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _modelClassificationService.GetAllAsync();
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据产品类型获取机型分类
        /// </summary>
        [HttpGet("by-product/{productType}")]
        public async Task<IActionResult> GetByProductType(string productType)
        {
            var result = await _modelClassificationService.GetByProductTypeAsync(productType);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据产品类型ID获取机型分类
        /// </summary>
        [HttpGet("by-product-id/{productTypeId}")]
        public async Task<IActionResult> GetByProductTypeId(int productTypeId)
        {
            var result = await _modelClassificationService.GetByProductTypeIdAsync(productTypeId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据ID获取机型分类
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _modelClassificationService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 根据类型获取机型分类
        /// </summary>
        [HttpGet("by-type/{type}")]
        public async Task<IActionResult> GetByType(string type)
        {
            var result = await _modelClassificationService.GetByTypeAsync(type);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 创建机型分类
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "Admin")]
        [AuditLog("CreateModelClassification", "ModelClassification")]
        public async Task<IActionResult> Create([FromBody] CreateModelClassificationDto dto)
        {
            var result = await _modelClassificationService.CreateAsync(dto);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新机型分类
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Policy = "Admin")]
        [AuditLog("UpdateModelClassification", "ModelClassification")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateModelClassificationDto dto)
        {
            var result = await _modelClassificationService.UpdateAsync(id, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除机型分类
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "SuperAdmin")]
        [AuditLog("DeleteModelClassification", "ModelClassification")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _modelClassificationService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }
}