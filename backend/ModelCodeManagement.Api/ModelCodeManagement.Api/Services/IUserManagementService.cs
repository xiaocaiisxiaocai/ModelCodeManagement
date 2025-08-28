using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 用户管理服务接口
    /// </summary>
    public interface IUserManagementService
    {
        /// <summary>
        /// 分页获取用户列表
        /// </summary>
        Task<ApiResponse<PagedResult<UserDto>>> GetPagedAsync(QueryDto query);

        /// <summary>
        /// 根据ID获取用户
        /// </summary>
        Task<ApiResponse<UserDto>> GetByIdAsync(int id);

        /// <summary>
        /// 根据工号获取用户
        /// </summary>
        Task<ApiResponse<UserDto>> GetByEmployeeIdAsync(string employeeId);

        /// <summary>
        /// 获取当前用户信息
        /// </summary>
        Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId);

        /// <summary>
        /// 创建用户
        /// </summary>
        Task<ApiResponse<UserDto>> CreateAsync(CreateUserDto dto);

        /// <summary>
        /// 更新用户信息
        /// </summary>
        Task<ApiResponse<UserDto>> UpdateAsync(int id, UpdateUserDto dto);

        /// <summary>
        /// 删除用户
        /// </summary>
        Task<ApiResponse<object>> DeleteAsync(int id);

        /// <summary>
        /// 获取用户统计信息
        /// </summary>
        Task<ApiResponse<UserStatisticsDto>> GetStatisticsAsync();

        /// <summary>
        /// 检查工号是否已存在
        /// </summary>
        Task<bool> IsEmployeeIdExistAsync(string employeeId, int? excludeId = null);

        /// <summary>
        /// 检查邮箱是否已存在
        /// </summary>
        Task<bool> IsEmailExistAsync(string email, int? excludeId = null);

        /// <summary>
        /// 根据组织获取用户列表
        /// </summary>
        Task<ApiResponse<List<UserDto>>> GetByOrganizationAsync(int organizationId);

        /// <summary>
        /// 根据角色获取用户列表
        /// </summary>
        Task<ApiResponse<List<UserDto>>> GetByRoleAsync(string role);
    }

    /// <summary>
    /// 用户统计信息DTO
    /// </summary>
    public class UserStatisticsDto
    {
        /// <summary>
        /// 总用户数
        /// </summary>
        public int TotalUsers { get; set; }

        /// <summary>
        /// 活跃用户数
        /// </summary>
        public int ActiveUsers { get; set; }

        /// <summary>
        /// 禁用用户数
        /// </summary>
        public int InactiveUsers { get; set; }

        /// <summary>
        /// 各角色用户数量
        /// </summary>
        public Dictionary<string, int> UsersByRole { get; set; } = new();

        /// <summary>
        /// 各部门用户数量
        /// </summary>
        public Dictionary<string, int> UsersByDepartment { get; set; } = new();
    }
}