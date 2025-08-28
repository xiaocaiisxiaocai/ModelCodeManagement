using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 组织架构服务接口
    /// </summary>
    public interface IOrganizationService
    {
        /// <summary>
        /// 分页获取组织架构列表
        /// </summary>
        Task<ApiResponse<PagedResult<OrganizationDto>>> GetPagedAsync(OrganizationQueryDto query);

        /// <summary>
        /// 根据ID获取组织架构
        /// </summary>
        Task<ApiResponse<OrganizationDto>> GetByIdAsync(int id);

        /// <summary>
        /// 获取组织架构树（完整树形结构）
        /// </summary>
        Task<ApiResponse<List<OrganizationTreeDto>>> GetTreeAsync();

        /// <summary>
        /// 根据父级ID获取子级组织列表
        /// </summary>
        Task<ApiResponse<List<OrganizationDto>>> GetChildrenAsync(int? parentId = null);

        /// <summary>
        /// 创建组织架构
        /// </summary>
        Task<ApiResponse<OrganizationDto>> CreateAsync(CreateOrganizationDto dto, int? createdBy = null);

        /// <summary>
        /// 更新组织架构
        /// </summary>
        Task<ApiResponse<OrganizationDto>> UpdateAsync(int id, UpdateOrganizationDto dto, int? updatedBy = null);

        /// <summary>
        /// 删除组织架构
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);

        /// <summary>
        /// 移动组织架构到新的父级
        /// </summary>
        Task<ApiResponse> MoveAsync(int id, MoveOrganizationDto dto, int? updatedBy = null);

        /// <summary>
        /// 检查组织编码是否存在
        /// </summary>
        Task<bool> ExistsAsync(string code, int? excludeId = null);

        /// <summary>
        /// 检查是否可以删除（没有子级和用户）
        /// </summary>
        Task<bool> CanDeleteAsync(int id);

        /// <summary>
        /// 获取组织的所有上级路径
        /// </summary>
        Task<ApiResponse<List<OrganizationDto>>> GetAncestorsAsync(int id);

        /// <summary>
        /// 获取组织的所有下级路径
        /// </summary>
        Task<ApiResponse<List<OrganizationDto>>> GetDescendantsAsync(int id);

        /// <summary>
        /// 根据用户ID获取用户所在组织及其上级组织
        /// </summary>
        Task<ApiResponse<List<OrganizationDto>>> GetUserOrganizationPathAsync(int userId);
    }
}