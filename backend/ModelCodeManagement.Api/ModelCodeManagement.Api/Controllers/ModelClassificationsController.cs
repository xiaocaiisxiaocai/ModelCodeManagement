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
        [Authorize(Policy = "ModelClassificationView")] // RBAC权限控制：需要机型分类查看权限
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
        [Authorize(Policy = "ModelClassificationView")] // RBAC权限控制：需要机型分类查看权限
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
        [Authorize(Policy = "ModelClassificationView")] // RBAC权限控制：需要机型分类查看权限
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
        [Authorize(Policy = "ModelClassificationView")] // RBAC权限控制：需要机型分类查看权限
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
        [Authorize(Policy = "ModelClassificationView")] // RBAC权限控制：需要机型分类查看权限
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
        [Authorize(Policy = "ModelClassificationManage")] // RBAC权限控制：需要机型分类管理权限
        [AuditLog("CreateModelClassification", "ModelClassification")]
        public async Task<IActionResult> Create([FromBody] CreateModelClassificationDto dto)
        {
            Console.WriteLine("🚀 [ModelClassificationsController] Create方法被调用");
            Console.WriteLine($"📝 接收到的DTO数据: Type={dto?.Type}, Description={dto?.Description?.Count}项, ProductTypeId={dto?.ProductTypeId}, HasCodeClassification={dto?.HasCodeClassification}");
            
            if (dto?.Description != null)
            {
                Console.WriteLine($"📋 描述内容: [{string.Join(", ", dto.Description.Select(d => $"\"{d}\""))}]");
            }
            
            var result = await _modelClassificationService.CreateAsync(dto);
            
            Console.WriteLine($"✅ 服务返回结果: Success={result.Success}, Message={result.Message}");
            if (!result.Success)
            {
                Console.WriteLine($"❌ 错误详情: {result.Error}");
            }
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新机型分类
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Policy = "ModelClassificationManage")] // RBAC权限控制：需要机型分类管理权限
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
        [Authorize(Policy = "ModelClassificationDelete")] // RBAC权限控制：需要机型分类删除权限
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