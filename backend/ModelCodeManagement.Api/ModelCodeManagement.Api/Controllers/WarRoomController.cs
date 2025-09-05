using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Services;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 战情中心数据控制器
    /// </summary>
    [Route("api/v1/war-room")]
    [ApiController]
    [Authorize]
    public class WarRoomController : ControllerBase
    {
        private readonly IWarRoomService _warRoomService;
        private readonly ILogger<WarRoomController> _logger;

        public WarRoomController(IWarRoomService warRoomService, ILogger<WarRoomController> logger)
        {
            _warRoomService = warRoomService;
            _logger = logger;
        }

        /// <summary>
        /// 获取战情中心完整数据
        /// </summary>
        /// <param name="query">查询参数</param>
        /// <returns>战情中心数据</returns>
        [HttpPost("data")]
        [Authorize] // 暂时只需要认证，不需要特定权限
        public async Task<IActionResult> GetWarRoomData([FromBody] WarRoomQueryDto query)
        {
            var result = await _warRoomService.GetWarRoomDataAsync(query);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取年度新增机型统计
        /// </summary>
        /// <param name="startYear">开始年份</param>
        /// <param name="endYear">结束年份</param>
        /// <returns>年度新增机型数据</returns>
        [HttpGet("yearly-new-models")]
        public async Task<IActionResult> GetYearlyNewModels([FromQuery] int? startYear = null, [FromQuery] int? endYear = null)
        {
            var result = await _warRoomService.GetYearlyNewModelsAsync(startYear, endYear);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取规划占用统计
        /// </summary>
        /// <param name="startDate">开始日期</param>
        /// <param name="endDate">结束日期</param>
        /// <returns>规划占用数据</returns>
        [HttpGet("planning-usage")]
        public async Task<IActionResult> GetPlanningUsage([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var result = await _warRoomService.GetPlanningUsageAsync(startDate, endDate);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取机型码余量统计
        /// </summary>
        /// <returns>机型码余量数据</returns>
        [HttpGet("model-code-remaining")]
        public async Task<IActionResult> GetModelCodeRemaining()
        {
            var result = await _warRoomService.GetModelCodeRemainingAsync();
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取指定机型的新增代码清单 (分页)
        /// </summary>
        /// <param name="query">查询参数</param>
        /// <returns>新增代码数据</returns>
        [HttpPost("new-code-data-by-model")]
        public async Task<IActionResult> GetNewCodeDataByModel([FromBody] NewCodeQueryDto query)
        {
            var result = await _warRoomService.GetNewCodeDataByModelAsync(query);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取动态新增代码数据 (所有机型)
        /// </summary>
        /// <param name="startDate">开始日期</param>
        /// <param name="endDate">结束日期</param>
        /// <returns>按机型分组的新增代码数据</returns>
        [HttpGet("dynamic-new-code-data")]
        public async Task<IActionResult> GetDynamicNewCodeData([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            var result = await _warRoomService.GetDynamicNewCodeDataAsync(startDate, endDate);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取机型首次出现的年份范围
        /// </summary>
        /// <returns>年份范围数据</returns>
        [HttpGet("available-year-range")]
        public async Task<IActionResult> GetAvailableYearRange()
        {
            var result = await _warRoomService.GetAvailableYearRangeAsync();
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }
    }
}