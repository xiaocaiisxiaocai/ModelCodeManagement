using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 用户角色权限服务接口
    /// </summary>
    public interface IUserRoleService
    {
        /// <summary>
        /// 获取用户的所有角色和权限信息
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <returns>包含角色和权限信息的用户对象</returns>
        Task<User?> GetUserWithRolesAndPermissionsAsync(int userId);

        /// <summary>
        /// 为用户分配角色
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="roleIds">角色ID列表</param>
        /// <param name="assignedBy">分配者ID</param>
        /// <returns>操作结果</returns>
        Task<ApiResponse<object>> AssignRolesToUserAsync(int userId, List<int> roleIds, int assignedBy);

        /// <summary>
        /// 移除用户的角色
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="roleIds">要移除的角色ID列表</param>
        /// <returns>操作结果</returns>
        Task<ApiResponse<object>> RemoveRolesFromUserAsync(int userId, List<int> roleIds);

        /// <summary>
        /// 获取用户的角色列表
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <returns>角色列表</returns>
        Task<List<RoleDto>> GetUserRolesAsync(int userId);

        /// <summary>
        /// 获取用户的权限列表
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <returns>权限列表</returns>
        Task<List<PermissionDto>> GetUserPermissionsAsync(int userId);

        /// <summary>
        /// 检查用户是否拥有指定权限
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="permissionCode">权限代码</param>
        /// <returns>是否拥有权限</returns>
        Task<bool> HasPermissionAsync(int userId, string permissionCode);

        /// <summary>
        /// 检查用户是否拥有指定角色
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="roleCode">角色代码</param>
        /// <returns>是否拥有角色</returns>
        Task<bool> HasRoleAsync(int userId, string roleCode);
    }
}