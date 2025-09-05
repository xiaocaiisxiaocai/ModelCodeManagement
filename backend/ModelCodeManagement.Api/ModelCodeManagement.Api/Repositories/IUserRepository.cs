using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;

namespace ModelCodeManagement.Api.Repositories
{
    /// <summary>
    /// 用户仓储接口
    /// </summary>
    public interface IUserRepository : IBaseRepository<User>
    {
        /// <summary>
        /// 根据工号获取用户
        /// </summary>
        Task<User?> GetByEmployeeIdAsync(string employeeId);

        /// <summary>
        /// 根据邮箱获取用户
        /// </summary>
        Task<User?> GetByEmailAsync(string email);

        /// <summary>
        /// 检查工号是否存在
        /// </summary>
        Task<bool> IsEmployeeIdExistAsync(string employeeId, int? excludeId = null);

        /// <summary>
        /// 检查邮箱是否存在
        /// </summary>
        Task<bool> IsEmailExistAsync(string email, int? excludeId = null);

        /// <summary>
        /// 根据组织ID获取用户列表
        /// </summary>
        Task<List<User>> GetByOrganizationIdAsync(int organizationId);

        /// <summary>
        /// 根据角色获取用户列表
        /// </summary>
        Task<List<User>> GetByRoleAsync(string role);

        /// <summary>
        /// 分页查询用户（支持关键字搜索）
        /// </summary>
        Task<PagedResult<User>> GetPagedWithSearchAsync(QueryDto query);

        /// <summary>
        /// 更新最后登录时间
        /// </summary>
        Task<bool> UpdateLastLoginAsync(int userId);

        /// <summary>
        /// 获取活跃用户数量
        /// </summary>
        Task<int> GetActiveUserCountAsync();

        /// <summary>
        /// 根据上级ID获取下属用户
        /// </summary>
        Task<List<User>> GetSubordinatesAsync(int superiorId);
    }
}