using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 权限管理控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/permissions")]
    [Authorize]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;

        public PermissionController(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        /// <summary>
        /// 分页获取权限列表
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "PermissionView")] // RBAC权限控制：需要权限查看权限
        public async Task<IActionResult> GetPaged([FromQuery] PermissionQueryDto query)
        {
            var result = await _permissionService.GetPagedAsync(query);
            return Ok(result);
        }

        /// <summary>
        /// 根据ID获取权限
        /// </summary>
        [HttpGet("{id:int}")]
        [Authorize(Policy = "PermissionView")] // RBAC权限控制：需要权限查看权限
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _permissionService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 获取权限树
        /// </summary>
        [HttpGet("tree")]
        public async Task<IActionResult> GetTree()
        {
            var result = await _permissionService.GetTreeAsync();
            return Ok(result);
        }

        /// <summary>
        /// 根据父级ID获取子级权限列表
        /// </summary>
        [HttpGet("children")]
        public async Task<IActionResult> GetChildren([FromQuery] int? parentId)
        {
            var result = await _permissionService.GetChildrenAsync(parentId);
            return Ok(result);
        }

        /// <summary>
        /// 创建权限
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "PermissionManage")] // RBAC权限控制：需要权限管理权限
        [AuditLog("CreatePermission", "Permission")]
        public async Task<IActionResult> Create([FromBody] CreatePermissionDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int id) ? id : (int?)null;

            var result = await _permissionService.CreateAsync(dto, userId);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新权限
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Policy = "PermissionManage")] // RBAC权限控制：需要权限管理权限
        [AuditLog("UpdatePermission", "Permission")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePermissionDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _permissionService.UpdateAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除权限
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "PermissionManage")] // RBAC权限控制：需要权限管理权限
        [AuditLog("DeletePermission", "Permission")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _permissionService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 移动权限
        /// </summary>
        [HttpPatch("{id:int}/move")]
        [Authorize(Policy = "PermissionManage")] // RBAC权限控制：需要权限管理权限
        public async Task<IActionResult> Move(int id, [FromBody] MovePermissionDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _permissionService.MoveAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取当前用户的权限列表
        /// </summary>
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var result = await _permissionService.GetUserPermissionsAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// 检查当前用户是否拥有指定权限
        /// </summary>
        [HttpGet("check/{permissionCode}")]
        public async Task<IActionResult> CheckPermission(string permissionCode)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var hasPermission = await _permissionService.HasPermissionAsync(userId, permissionCode);
            return Ok(new { hasPermission });
        }
    }
}