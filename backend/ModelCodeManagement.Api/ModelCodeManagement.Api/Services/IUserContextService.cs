namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 用户上下文服务接口
    /// </summary>
    public interface IUserContextService
    {
        /// <summary>
        /// 获取当前用户ID
        /// </summary>
        int GetCurrentUserId();
        
        /// <summary>
        /// 尝试获取当前用户ID
        /// </summary>
        bool TryGetCurrentUserId(out int userId);
        
        /// <summary>
        /// 获取当前用户名
        /// </summary>
        string GetCurrentUsername();
        
        /// <summary>
        /// 获取当前用户角色列表
        /// </summary>
        List<string> GetCurrentUserRoles();
        
        /// <summary>
        /// 检查当前用户是否有指定角色
        /// </summary>
        bool IsInRole(string role);
        
        /// <summary>
        /// 获取当前用户的组织ID
        /// </summary>
        int? GetCurrentUserOrganizationId();
    }
}