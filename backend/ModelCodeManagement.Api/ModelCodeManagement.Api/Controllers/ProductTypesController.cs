using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 产品类型控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/product-types")]
    [Authorize]
    public class ProductTypesController : ControllerBase
    {
        private readonly IProductTypeService _productTypeService;

        public ProductTypesController(IProductTypeService productTypeService)
        {
            _productTypeService = productTypeService;
        }

        /// <summary>
        /// 获取所有产品类型
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _productTypeService.GetAllAsync();
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 根据ID获取产品类型
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _productTypeService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 根据代码获取产品类型
        /// </summary>
        [HttpGet("by-code/{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            var result = await _productTypeService.GetByCodeAsync(code);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 创建产品类型
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "Admin")]
        [AuditLog("CreateProductType", "ProductType")]
        public async Task<IActionResult> Create([FromBody] CreateProductTypeDto dto)
        {
            var result = await _productTypeService.CreateAsync(dto);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新产品类型
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Policy = "Admin")]
        [AuditLog("UpdateProductType", "ProductType")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductTypeDto dto)
        {
            var result = await _productTypeService.UpdateAsync(id, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除产品类型
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "SuperAdmin")]
        [AuditLog("DeleteProductType", "ProductType")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _productTypeService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }
}