namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// Token服务接口
    /// </summary>
    public interface ITokenService
    {
        /// <summary>
        /// 使Token失效
        /// </summary>
        /// <param name="tokenId">Token的JTI</param>
        Task RevokeTokenAsync(string tokenId);

        /// <summary>
        /// 检查Token是否已失效
        /// </summary>
        /// <param name="tokenId">Token的JTI</param>
        /// <returns>true表示已失效</returns>
        Task<bool> IsTokenRevokedAsync(string tokenId);

        /// <summary>
        /// 清理过期的失效Token记录
        /// </summary>
        Task CleanupExpiredTokensAsync();
    }
}