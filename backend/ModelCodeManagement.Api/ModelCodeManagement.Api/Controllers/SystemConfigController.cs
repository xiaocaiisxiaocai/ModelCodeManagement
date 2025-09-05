using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 系统配置控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/system-configs")]
    [Authorize]
    public class SystemConfigController : ControllerBase
    {
        private readonly ISystemConfigService _systemConfigService;

        public SystemConfigController(ISystemConfigService systemConfigService)
        {
            _systemConfigService = systemConfigService;
        }

        /// <summary>
        /// 设置系统配置项
        /// </summary>
        /// <param name="key">配置项键名</param>
        /// <param name="value">配置项值</param>
        [HttpPost("{key}")]
        [Authorize(Policy = "SystemConfig")] // RBAC权限控制：需要系统配置权限
        public async Task<IActionResult> SetConfig(string key, [FromBody] string value)
        {
            var result = await _systemConfigService.SetConfigValueAsync(key, value);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取系统配置项
        /// </summary>
        /// <param name="key">配置项键名</param>
        [HttpGet("{key}")]
        public async Task<IActionResult> GetConfig(string key)
        {
            var result = await _systemConfigService.GetConfigValueAsync<string>(key);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }
    }
}