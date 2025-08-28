using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ModelCodeManagement.Api.Controllers
{
    /// <summary>
    /// 测试控制器 - 用于验证Token失效功能
    /// </summary>
    [ApiController]
    [Route("api/v1/test")]
    public class TestController : ControllerBase
    {
        /// <summary>
        /// 公开测试端点（无需认证）
        /// </summary>
        [HttpGet("public")]
        public IActionResult PublicTest()
        {
            return Ok(new
            {
                message = "公开端点访问成功",
                timestamp = DateTime.Now,
                requiresAuth = false
            });
        }

        /// <summary>
        /// 受保护测试端点（需要认证）
        /// </summary>
        [HttpGet("protected")]
        [Authorize]
        public IActionResult ProtectedTest()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userName = User.FindFirst(ClaimTypes.Name)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var jti = User.FindFirst("jti")?.Value;

            return Ok(new
            {
                message = "受保护端点访问成功",
                timestamp = DateTime.Now,
                requiresAuth = true,
                user = new
                {
                    id = userId,
                    name = userName,
                    role = role,
                    tokenId = jti
                }
            });
        }

        /// <summary>
        /// Token信息查看
        /// </summary>
        [HttpGet("token-info")]
        [Authorize]
        public IActionResult TokenInfo()
        {
            var claims = User.Claims.Select(c => new
            {
                type = c.Type,
                value = c.Value
            }).ToList();

            return Ok(new
            {
                message = "Token信息获取成功",
                timestamp = DateTime.Now,
                isAuthenticated = User.Identity?.IsAuthenticated ?? false,
                authType = User.Identity?.AuthenticationType,
                claims = claims
            });
        }
    }
}