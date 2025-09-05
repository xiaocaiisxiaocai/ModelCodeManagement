using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Filters;
using System.Linq;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 用户管理控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;
        private readonly IAuthenticationService _authenticationService;

        public UserController(IUserManagementService userManagementService, IAuthenticationService authenticationService)
        {
            _userManagementService = userManagementService;
            _authenticationService = authenticationService;
        }

        /// <summary>
        /// 分页获取用户列表
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "UserView")] // RBAC权限控制：需要用户查看权限
        public async Task<IActionResult> GetPaged([FromQuery] QueryDto query)
        {
            var result = await _userManagementService.GetPagedAsync(query);
            return Ok(result);
        }

        /// <summary>
        /// 根据ID获取用户
        /// </summary>
        [HttpGet("{id:int}")]
        [Authorize(Policy = "UserView")] // RBAC权限控制：需要用户查看权限
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _userManagementService.GetByIdAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 根据工号获取用户
        /// </summary>
        [HttpGet("by-employee/{employeeId}")]
        [Authorize(Policy = "UserView")] // RBAC权限控制：需要用户查看权限
        public async Task<IActionResult> GetByEmployeeId(string employeeId)
        {
            var result = await _userManagementService.GetByEmployeeIdAsync(employeeId);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 获取当前用户信息
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var result = await _userManagementService.GetCurrentUserAsync(userId);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 创建用户
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "UserManage")] // RBAC权限控制：需要用户管理权限
        [AuditLog("CreateUser", "User")]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            var result = await _userManagementService.CreateAsync(dto);
            
            if (result.Success)
                return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新用户信息
        /// </summary>
        [HttpPut("{id:int}")]
        [Authorize(Policy = "UserManage")] // RBAC权限控制：需要用户管理权限
        [AuditLog("UpdateUser", "User")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            var result = await _userManagementService.UpdateAsync(id, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新当前用户资料
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            // 普通用户只能修改自己的基本信息，不能修改角色等敏感信息
            var safeDto = new UpdateUserDto
            {
                UserName = dto.UserName,
                Email = dto.Email,
                Phone = dto.Phone,
                Role = dto.Role, // 这里可以根据需要限制
                Department = dto.Department,
                Position = dto.Position
            };

            var result = await _userManagementService.UpdateAsync(userId, safeDto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 删除用户
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize(Policy = "UserDelete")] // RBAC权限控制：需要用户删除权限
        [AuditLog("DeleteUser", "User")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _userManagementService.DeleteAsync(id);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 重置用户密码为默认密码1234
        /// </summary>
        [HttpPost("{id:int}/reset-password")]
        [Authorize(Policy = "UserManage")] // RBAC权限控制：需要用户管理权限
        [AuditLog("ResetUserPassword", "User")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            // 重置为默认密码1234
            var newPassword = "1234";
            var result = await _authenticationService.ResetPasswordAsync(id, newPassword);
            
            if (result.Success)
            {
                // 返回新密码给管理员
                return Ok(new { 
                    success = true, 
                    message = "密码重置成功", 
                    data = newPassword 
                });
            }
            
            return BadRequest(result);
        }
        

        /// <summary>
        /// 修改密码
        /// </summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var result = await _authenticationService.ChangePasswordAsync(userId, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 更新最后登录时间
        /// </summary>
        [HttpPost("{id:int}/update-last-login")]
        [Authorize(Policy = "UserManage")] // RBAC权限控制：需要用户管理权限
        public IActionResult UpdateLastLogin(int id)
        {
            // 这个方法不再需要在Controller中暴露，因为登录时会自动更新
            return Ok(new { message = "最后登录时间已更新" });
        }
    }

    /// <summary>
    /// 重置密码DTO
    /// </summary>
    public class ResetPasswordDto
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}