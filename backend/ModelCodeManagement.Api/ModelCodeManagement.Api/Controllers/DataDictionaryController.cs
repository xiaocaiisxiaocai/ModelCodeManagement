using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 数据字典控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/data-dictionary")]
    [Authorize]
    public class DataDictionaryController : ControllerBase
    {
        private readonly IDataDictionaryService _dataDictionaryService;

        public DataDictionaryController(IDataDictionaryService dataDictionaryService)
        {
            _dataDictionaryService = dataDictionaryService;
        }

        /// <summary>
        /// 分页获取数据字典列表
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "DataDictionaryView")] // RBAC权限控制：需要数据字典查看权限
        public async Task<IActionResult> GetPaged([FromQuery] DataDictionaryQueryDto query)
        {
            var result = await _dataDictionaryService.GetPagedAsync(query);
            return Ok(result);
        }

        /// <summary>
        /// 根据ID获取数据字典
        /// </summary>
        [HttpGet("{id:int}")]
        [Authorize(Policy = "DataDictionaryView")] // RBAC权限控制：需要数据字典查看权限
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _dataDictionaryService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 根据类型获取数据字典选项
        /// </summary>
        [HttpGet("options/{type}")]
        public async Task<IActionResult> GetOptionsByType(string type)
        {
            var result = await _dataDictionaryService.GetOptionsByTypeAsync(type);
            return Ok(result);
        }

        /// <summary>
        /// 获取所有类型的数据字典（按类型分组）
        /// </summary>
        [HttpGet("all-grouped")]
        public async Task<IActionResult> GetAllGrouped()
        {
            var result = await _dataDictionaryService.GetAllGroupedAsync();
            return Ok(result);
        }

        /// <summary>
        /// 获取所有字典类型
        /// </summary>
        [HttpGet("types")]
        public async Task<IActionResult> GetAllTypes()
        {
            var result = await _dataDictionaryService.GetAllTypesAsync();
            return Ok(result);
        }

        /// <summary>
        /// 获取客户列表（匹配前端Customer接口）
        /// </summary>
        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers()
        {
            var result = await _dataDictionaryService.GetCustomersAsync();
            return Ok(result);
        }

        /// <summary>
        /// 获取厂区列表（匹配前端Factory接口）
        /// </summary>
        [HttpGet("factories")]
        public async Task<IActionResult> GetFactories()
        {
            var result = await _dataDictionaryService.GetFactoriesAsync();
            return Ok(result);
        }

        /// <summary>
        /// 根据客户ID获取厂区列表
        /// </summary>
        [HttpGet("factories/by-customer/{customerId}")]
        public async Task<IActionResult> GetFactoriesByCustomer(string customerId)
        {
            var result = await _dataDictionaryService.GetFactoriesByCustomerAsync(customerId);
            return Ok(result);
        }

        /// <summary>
        /// 获取品名列表（匹配前端ProductNameDict接口）
        /// </summary>
        [HttpGet("product-names")]
        public async Task<IActionResult> GetProductNames()
        {
            var result = await _dataDictionaryService.GetProductNamesAsync();
            return Ok(result);
        }

        /// <summary>
        /// 获取占用类型列表（匹配前端OccupancyTypeDict接口）
        /// </summary>
        [HttpGet("occupancy-types")]
        public async Task<IActionResult> GetOccupancyTypes()
        {
            var result = await _dataDictionaryService.GetOccupancyTypesAsync();
            return Ok(result);
        }


        /// <summary>
        /// 创建数据字典
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "DataDictionaryManage")] // RBAC权限控制：需要数据字典管理权限
        public async Task<IActionResult> Create([FromBody] CreateDataDictionaryDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int id) ? id : (int?)null;

            var result = await _dataDictionaryService.CreateAsync(dto, userId);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新数据字典
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Policy = "DataDictionaryManage")] // RBAC权限控制：需要数据字典管理权限
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDataDictionaryDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _dataDictionaryService.UpdateAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除数据字典
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "DataDictionaryDelete")] // RBAC权限控制：需要数据字典删除权限
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _dataDictionaryService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 批量删除数据字典
        /// </summary>
        [HttpDelete("batch")]
        [Authorize(Policy = "DataDictionaryDelete")] // RBAC权限控制：需要数据字典删除权限
        public async Task<IActionResult> BatchDelete([FromBody] List<int> ids)
        {
            var result = await _dataDictionaryService.BatchDeleteAsync(ids);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }
}