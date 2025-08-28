using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;

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
        [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
        public async Task<IActionResult> GetPaged([FromQuery] RoleQueryDto query)
        {
            var result = await _roleService.GetPagedAsync(query);
            return Ok(result);
        }

        /// <summary>
        /// 根据ID获取角色
        /// </summary>
        [HttpGet("{id:int}")]
        [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
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
        [Authorize(Roles = "SUPER_ADMIN")]
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
        [Authorize(Roles = "SUPER_ADMIN")]
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
        [Authorize(Roles = "SUPER_ADMIN")]
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
        [Authorize(Roles = "SUPER_ADMIN")]
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
        [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
        public async Task<IActionResult> GetRolePermissions(int id)
        {
            var result = await _roleService.GetRolePermissionsAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// 分配角色用户
        /// </summary>
        [HttpPost("{id:int}/users")]
        [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
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
        [Authorize(Roles = "SUPER_ADMIN,ADMIN")]
        public async Task<IActionResult> GetRoleUsers(int id)
        {
            var result = await _roleService.GetRoleUsersAsync(id);
            return Ok(result);
        }
    }
}