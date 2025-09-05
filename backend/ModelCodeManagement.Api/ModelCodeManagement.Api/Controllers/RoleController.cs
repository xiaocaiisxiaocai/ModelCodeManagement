using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 角色管理控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/roles")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>
        /// 分页获取角色列表
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "RoleView")] // RBAC权限控制：需要角色查看权限
        public async Task<IActionResult> GetPaged([FromQuery] RoleQueryDto query)
        {
            var result = await _roleService.GetPagedAsync(query);
            return Ok(result);
        }

        /// <summary>
        /// 根据ID获取角色
        /// </summary>
        [HttpGet("{id:int}")]
        [Authorize(Policy = "RoleView")] // RBAC权限控制：需要角色查看权限
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _roleService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 获取所有启用的角色
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetAllActive()
        {
            var result = await _roleService.GetAllActiveAsync();
            return Ok(result);
        }

        /// <summary>
        /// 创建角色
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "RoleManage")] // RBAC权限控制：需要角色管理权限
        [AuditLog("CreateRole", "Role")]
        public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int id) ? id : (int?)null;

            var result = await _roleService.CreateAsync(dto, userId);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新角色
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Policy = "RoleManage")] // RBAC权限控制：需要角色管理权限
        [AuditLog("UpdateRole", "Role")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _roleService.UpdateAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除角色
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "RoleDelete")] // RBAC权限控制：需要角色删除权限
        [AuditLog("DeleteRole", "Role")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _roleService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 分配角色权限
        /// </summary>
        [HttpPost("{id:int}/permissions")]
        [Authorize(Policy = "PermissionManage")] // RBAC权限控制：需要权限管理权限
        [AuditLog("AssignRolePermissions", "Role")]
        public async Task<IActionResult> AssignPermissions(int id, [FromBody] AssignRolePermissionDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _roleService.AssignPermissionsAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取角色的权限列表
        /// </summary>
        [HttpGet("{id:int}/permissions")]
        [Authorize(Policy = "PermissionView")] // RBAC权限控制：需要权限查看权限
        public async Task<IActionResult> GetRolePermissions(int id)
        {
            var result = await _roleService.GetRolePermissionsAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// 分配角色用户
        /// </summary>
        [HttpPost("{id:int}/users")]
        [Authorize(Policy = "UserManage")] // RBAC权限控制：需要用户管理权限
        public async Task<IActionResult> AssignUsers(int id, [FromBody] AssignUserRoleDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null && int.TryParse(userIdClaim.Value, out int uid) ? uid : (int?)null;

            var result = await _roleService.AssignUsersAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取角色的用户列表
        /// </summary>
        [HttpGet("{id:int}/users")]
        [Authorize(Policy = "UserView")] // RBAC权限控制：需要用户查看权限
        public async Task<IActionResult> GetRoleUsers(int id)
        {
            var result = await _roleService.GetRoleUsersAsync(id);
            return Ok(result);
        }
    }
}