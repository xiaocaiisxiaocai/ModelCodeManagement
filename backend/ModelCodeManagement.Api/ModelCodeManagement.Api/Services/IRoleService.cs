using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 角色服务接口
    /// </summary>
    public interface IRoleService
    {
        /// <summary>
        /// 分页获取角色列表
        /// </summary>
        Task<ApiResponse<PagedResult<RoleDto>>> GetPagedAsync(RoleQueryDto query);

        /// <summary>
        /// 根据ID获取角色
        /// </summary>
        Task<ApiResponse<RoleDto>> GetByIdAsync(int id);

        /// <summary>
        /// 获取所有启用的角色
        /// </summary>
        Task<ApiResponse<List<RoleDto>>> GetAllActiveAsync();

        /// <summary>
        /// 创建角色
        /// </summary>
        Task<ApiResponse<RoleDto>> CreateAsync(CreateRoleDto dto, int? createdBy = null);

        /// <summary>
        /// 更新角色
        /// </summary>
        Task<ApiResponse<RoleDto>> UpdateAsync(int id, UpdateRoleDto dto, int? updatedBy = null);

        /// <summary>
        /// 删除角色
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);

        /// <summary>
        /// 分配角色权限
        /// </summary>
        Task<ApiResponse> AssignPermissionsAsync(int roleId, AssignRolePermissionDto dto, int? assignedBy = null);

        /// <summary>
        /// 获取角色的权限列表
        /// </summary>
        Task<ApiResponse<List<PermissionDto>>> GetRolePermissionsAsync(int roleId);

        /// <summary>
        /// 分配用户角色
        /// </summary>
        Task<ApiResponse> AssignUsersAsync(int roleId, AssignUserRoleDto dto, int? assignedBy = null);

        /// <summary>
        /// 获取角色的用户列表
        /// </summary>
        Task<ApiResponse<List<UserDto>>> GetRoleUsersAsync(int roleId);

        /// <summary>
        /// 检查角色编码是否存在
        /// </summary>
        Task<bool> ExistsAsync(string code, int? excludeId = null);

        /// <summary>
        /// 检查是否可以删除（系统角色或有用户的角色不可删除）
        /// </summary>
        Task<bool> CanDeleteAsync(int id);
    }
}