using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Filters;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 认证控制器
    /// </summary>
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IUserManagementService _userManagementService;
        private readonly ITokenService _tokenService;

        public AuthController(
            IAuthenticationService authenticationService, 
            IUserManagementService userManagementService,
            ITokenService tokenService)
        {
            _authenticationService = authenticationService;
            _userManagementService = userManagementService;
            _tokenService = tokenService;
        }

        /// <summary>
        /// 用户登录
        /// </summary>
        [HttpPost("login")]
        [AuditLog("Login", "Auth")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var ipAddress = this.GetClientIpAddress();
            var userAgent = this.GetUserAgent();
            
            var result = await _authenticationService.LoginAsync(dto, ipAddress, userAgent);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 获取当前用户信息
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = this.GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _userManagementService.GetCurrentUserAsync(userId.Value);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 获取当前用户信息 (别名端点)
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = this.GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _userManagementService.GetCurrentUserAsync(userId.Value);
            
            if (result.Success)
                return Ok(result);
            
            return NotFound(result);
        }

        /// <summary>
        /// 修改密码
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = this.GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _authenticationService.ChangePasswordAsync(userId.Value, dto);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 刷新Token
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            var ipAddress = this.GetClientIpAddress();
            var userAgent = this.GetUserAgent();
            
            var result = await _authenticationService.RefreshTokenAsync(dto, ipAddress, userAgent);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

        /// <summary>
        /// 登出（使Token失效）
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        [AuditLog("Logout", "Auth")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            var result = await _authenticationService.LogoutAsync(dto.RefreshToken);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }

    }
}