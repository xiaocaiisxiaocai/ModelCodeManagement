using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 审计日志控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/audit-logs")]
    [Authorize]
    public class AuditLogController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// 分页查询审计日志
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "AuditLogView")] // RBAC权限控制：需要审计日志查看权限
        public async Task<IActionResult> GetPaged([FromQuery] AuditLogQueryDto query)
        {
            var result = await _auditLogService.GetPagedAsync(query);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 查询用户的审计日志
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize(Policy = "AuditLogView")] // RBAC权限控制：需要审计日志查看权限
        public async Task<IActionResult> GetByUser(int userId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var result = await _auditLogService.GetByUserAsync(userId, startDate, endDate);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 查询当前用户的审计日志
        /// </summary>
        [HttpGet("my-logs")]
        public async Task<IActionResult> GetMyLogs([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var result = await _auditLogService.GetByUserAsync(userId, startDate, endDate);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 查询实体的审计日志
        /// </summary>
        [HttpGet("entity/{entityType}/{entityId}")]
        [Authorize(Policy = "AuditLogView")] // RBAC权限控制：需要审计日志查看权限
        public async Task<IActionResult> GetByEntity(string entityType, int entityId)
        {
            var result = await _auditLogService.GetByEntityAsync(entityType, entityId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 清理过期日志
        /// </summary>
        [HttpPost("cleanup")]
        [Authorize(Policy = "AuditLogManage")] // RBAC权限控制：需要审计日志管理权限
        public async Task<IActionResult> CleanupOldLogs([FromQuery] int daysToKeep = 90)
        {
            var result = await _auditLogService.CleanupOldLogsAsync(daysToKeep);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }
}