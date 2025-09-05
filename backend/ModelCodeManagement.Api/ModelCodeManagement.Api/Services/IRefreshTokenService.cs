using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// Refresh Token服务接口
    /// </summary>
    public interface IRefreshTokenService
    {
        /// <summary>
        /// 生成新的Refresh Token
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="jwtId">JWT Token ID</param>
        /// <param name="ipAddress">IP地址</param>
        /// <param name="userAgent">User Agent</param>
        /// <returns>Refresh Token实体</returns>
        Task<RefreshToken> GenerateRefreshTokenAsync(int userId, string jwtId, string? ipAddress = null, string? userAgent = null);

        /// <summary>
        /// 验证并使用Refresh Token
        /// </summary>
        /// <param name="token">Refresh Token</param>
        /// <returns>验证结果和用户信息</returns>
        Task<(bool IsValid, RefreshToken? RefreshToken, User? User)> ValidateAndUseRefreshTokenAsync(string token);

        /// <summary>
        /// 撤销Refresh Token
        /// </summary>
        /// <param name="token">要撤销的Token</param>
        Task RevokeRefreshTokenAsync(string token);

        /// <summary>
        /// 撤销用户的所有Refresh Token
        /// </summary>
        /// <param name="userId">用户ID</param>
        Task RevokeAllUserRefreshTokensAsync(int userId);

        /// <summary>
        /// 撤销与指定JWT关联的Refresh Token
        /// </summary>
        /// <param name="jwtId">JWT Token ID</param>
        Task RevokeRefreshTokenByJwtIdAsync(string jwtId);

        /// <summary>
        /// 清理过期的Refresh Token
        /// </summary>
        Task CleanupExpiredTokensAsync();

        /// <summary>
        /// 获取用户的活跃Refresh Token数量
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <returns>活跃Token数量</returns>
        Task<int> GetActiveTokenCountAsync(int userId);
    }
}