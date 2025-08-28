using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ModelCodeManagement.Api.Extensions
{
    /// <summary>
    /// 控制器扩展方法
    /// </summary>
    public static class ControllerExtensions
    {
        /// <summary>
        /// 获取当前用户ID
        /// </summary>
        /// <param name="controller">控制器实例</param>
        /// <returns>用户ID，如果获取失败返回null</returns>
        public static int? GetCurrentUserId(this ControllerBase controller)
        {
            var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }

        /// <summary>
        /// 获取当前用户角色
        /// </summary>
        /// <param name="controller">控制器实例</param>
        /// <returns>用户角色</returns>
        public static string? GetCurrentUserRole(this ControllerBase controller)
        {
            return controller.User.FindFirst(ClaimTypes.Role)?.Value;
        }

        /// <summary>
        /// 获取客户端IP地址
        /// </summary>
        /// <param name="controller">控制器实例</param>
        /// <returns>IP地址</returns>
        public static string? GetClientIpAddress(this ControllerBase controller)
        {
            return controller.HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        /// <summary>
        /// 获取User-Agent
        /// </summary>
        /// <param name="controller">控制器实例</param>
        /// <returns>User-Agent字符串</returns>
        public static string? GetUserAgent(this ControllerBase controller)
        {
            return controller.HttpContext.Request.Headers["User-Agent"].FirstOrDefault();
        }

        /// <summary>
        /// 检查当前用户是否有指定权限
        /// </summary>
        /// <param name="controller">控制器实例</param>
        /// <param name="permission">权限名称</param>
        /// <returns>是否有权限</returns>
        public static bool HasPermission(this ControllerBase controller, string permission)
        {
            return controller.User.HasClaim("permission", permission);
        }
    }
}