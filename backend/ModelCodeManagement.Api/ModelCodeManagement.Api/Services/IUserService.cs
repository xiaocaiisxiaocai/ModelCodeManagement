using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 用户服务接口
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// 用户登录
        /// </summary>
        Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto, string? ipAddress = null, string? userAgent = null);

        /// <summary>
        /// 刷新Token（基于用户信息）
        /// </summary>
        Task<ApiResponse<RefreshTokenResponseDto>> RefreshTokenAsync(User user, string? ipAddress = null, string? userAgent = null);

        /// <summary>
        /// 获取当前用户信息
        /// </summary>
        Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId);

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
        /// 创建用户
        /// </summary>
        Task<ApiResponse<UserDto>> CreateAsync(CreateUserDto dto);

        /// <summary>
        /// 更新用户信息
        /// </summary>
        Task<ApiResponse<UserDto>> UpdateAsync(int id, UpdateUserDto dto);

        /// <summary>
        /// 修改密码
        /// </summary>
        Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordDto dto);

        /// <summary>
        /// 重置密码
        /// </summary>
        Task<ApiResponse> ResetPasswordAsync(int id, string newPassword);

        /// <summary>
        /// 删除用户
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);

        /// <summary>
        /// 更新最后登录时间
        /// </summary>
        Task UpdateLastLoginAsync(int userId);
    }
}