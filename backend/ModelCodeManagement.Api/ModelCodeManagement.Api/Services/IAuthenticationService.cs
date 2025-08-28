using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 身份认证服务接口
    /// </summary>
    public interface IAuthenticationService
    {
        /// <summary>
        /// 用户登录
        /// </summary>
        /// <param name="dto">登录信息</param>
        /// <param name="ipAddress">IP地址</param>
        /// <param name="userAgent">用户代理</param>
        /// <returns>登录结果</returns>
        Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto, string? ipAddress = null, string? userAgent = null);

        /// <summary>
        /// 刷新Token
        /// </summary>
        /// <param name="dto">刷新Token请求</param>
        /// <param name="ipAddress">IP地址</param>
        /// <param name="userAgent">用户代理</param>
        /// <returns>刷新结果</returns>
        Task<ApiResponse<RefreshTokenResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto, string? ipAddress = null, string? userAgent = null);

        /// <summary>
        /// 用户登出
        /// </summary>
        /// <param name="refreshToken">刷新Token</param>
        /// <returns>登出结果</returns>
        Task<ApiResponse<object>> LogoutAsync(string refreshToken);

        /// <summary>
        /// 验证密码
        /// </summary>
        /// <param name="plainPassword">明文密码</param>
        /// <param name="hashedPassword">哈希密码</param>
        /// <returns>是否匹配</returns>
        bool VerifyPassword(string plainPassword, string hashedPassword);

        /// <summary>
        /// 哈希密码
        /// </summary>
        /// <param name="password">明文密码</param>
        /// <returns>哈希后的密码</returns>
        string HashPassword(string password);

        /// <summary>
        /// 修改密码
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="dto">修改密码信息</param>
        /// <returns>修改结果</returns>
        Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordDto dto);

        /// <summary>
        /// 重置密码
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="newPassword">新密码</param>
        /// <returns>重置结果</returns>
        Task<ApiResponse<object>> ResetPasswordAsync(int userId, string newPassword);
    }
}