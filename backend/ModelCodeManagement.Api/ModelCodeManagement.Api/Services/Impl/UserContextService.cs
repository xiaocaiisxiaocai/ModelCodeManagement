using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 用户上下文服务实现
    /// </summary>
    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// 获取当前用户ID
        /// </summary>
        public int GetCurrentUserId()
        {
            if (TryGetCurrentUserId(out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("无法获取当前用户ID");
        }

        /// <summary>
        /// 尝试获取当前用户ID
        /// </summary>
        public bool TryGetCurrentUserId(out int userId)
        {
            userId = 0;
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
            
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out userId))
            {
                return true;
            }
            
            return false;
        }

        /// <summary>
        /// 获取当前用户名
        /// </summary>
        public string GetCurrentUsername()
        {
            var usernameClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name);
            return usernameClaim?.Value ?? string.Empty;
        }

        /// <summary>
        /// 获取当前用户角色列表
        /// </summary>
        public List<string> GetCurrentUserRoles()
        {
            var roles = new List<string>();
            var roleClaims = _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role);
            
            if (roleClaims != null)
            {
                roles.AddRange(roleClaims.Select(c => c.Value));
            }
            
            return roles;
        }

        /// <summary>
        /// 检查当前用户是否有指定角色
        /// </summary>
        public bool IsInRole(string role)
        {
            return _httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;
        }

        /// <summary>
        /// 获取当前用户的组织ID
        /// </summary>
        public int? GetCurrentUserOrganizationId()
        {
            var orgIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("OrganizationId");
            
            if (orgIdClaim != null && int.TryParse(orgIdClaim.Value, out int orgId))
            {
                return orgId;
            }
            
            return null;
        }
    }
}