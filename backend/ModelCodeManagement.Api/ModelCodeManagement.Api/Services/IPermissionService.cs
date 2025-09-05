using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 权限服务接口
    /// </summary>
    public interface IPermissionService
    {
        /// <summary>
        /// 分页获取权限列表
        /// </summary>
        Task<ApiResponse<PagedResult<PermissionDto>>> GetPagedAsync(PermissionQueryDto query);

        /// <summary>
        /// 根据ID获取权限
        /// </summary>
        Task<ApiResponse<PermissionDto>> GetByIdAsync(int id);

        /// <summary>
        /// 获取权限树（完整树形结构）
        /// </summary>
        Task<ApiResponse<List<PermissionTreeDto>>> GetTreeAsync();

        /// <summary>
        /// 根据父级ID获取子级权限列表
        /// </summary>
        Task<ApiResponse<List<PermissionDto>>> GetChildrenAsync(int? parentId = null);

        /// <summary>
        /// 创建权限
        /// </summary>
        Task<ApiResponse<PermissionDto>> CreateAsync(CreatePermissionDto dto, int? createdBy = null);

        /// <summary>
        /// 更新权限
        /// </summary>
        Task<ApiResponse<PermissionDto>> UpdateAsync(int id, UpdatePermissionDto dto, int? updatedBy = null);

        /// <summary>
        /// 删除权限
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);

        /// <summary>
        /// 移动权限到新的父级
        /// </summary>
        Task<ApiResponse> MoveAsync(int id, MovePermissionDto dto, int? updatedBy = null);

        /// <summary>
        /// 检查权限编码是否存在
        /// </summary>
        Task<bool> ExistsAsync(string code, int? excludeId = null);

        /// <summary>
        /// 检查是否可以删除（有子权限或被角色使用的权限不可删除）
        /// </summary>
        Task<bool> CanDeleteAsync(int id);

        /// <summary>
        /// 根据用户ID获取用户的所有权限
        /// </summary>
        Task<ApiResponse<List<PermissionDto>>> GetUserPermissionsAsync(int userId);

        /// <summary>
        /// 检查用户是否拥有指定权限
        /// </summary>
        Task<bool> HasPermissionAsync(int userId, string permissionCode);

        /// <summary>
        /// 检查用户是否拥有指定资源的操作权限
        /// </summary>
        Task<bool> HasResourcePermissionAsync(int userId, string resource, string action);
    }
}