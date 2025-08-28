using System.Collections.Concurrent;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// Token服务实现（内存版本）
    /// 生产环境建议使用Redis
    /// </summary>
    public class TokenService : ITokenService
    {
        private readonly ConcurrentDictionary<string, DateTime> _revokedTokens = new();
        private readonly ILogger<TokenService> _logger;
        private readonly Timer _cleanupTimer;

        public TokenService(ILogger<TokenService> logger)
        {
            _logger = logger;
            
            // 每小时清理一次过期的失效Token记录
            _cleanupTimer = new Timer(async _ => await CleanupExpiredTokensAsync(), 
                null, TimeSpan.FromHours(1), TimeSpan.FromHours(1));
        }

        /// <summary>
        /// 使Token失效
        /// </summary>
        public Task RevokeTokenAsync(string tokenId)
        {
            try
            {
                // 记录失效时间，25小时后自动清理（比Token过期时间多1小时）
                var expireTime = DateTime.UtcNow.AddHours(25);
                _revokedTokens.TryAdd(tokenId, expireTime);
                
                _logger.LogInformation($"Token已失效: {tokenId}");
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"使Token失效失败: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// 检查Token是否已失效
        /// </summary>
        public Task<bool> IsTokenRevokedAsync(string tokenId)
        {
            var isRevoked = _revokedTokens.ContainsKey(tokenId);
            return Task.FromResult(isRevoked);
        }

        /// <summary>
        /// 清理过期的失效Token记录
        /// </summary>
        public Task CleanupExpiredTokensAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var expiredTokens = _revokedTokens
                    .Where(kvp => kvp.Value < now)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var tokenId in expiredTokens)
                {
                    _revokedTokens.TryRemove(tokenId, out _);
                }

                if (expiredTokens.Any())
                {
                    _logger.LogInformation($"清理了 {expiredTokens.Count} 个过期的失效Token记录");
                }

                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"清理过期Token记录失败: {ex.Message}");
                return Task.CompletedTask;
            }
        }

        public void Dispose()
        {
            _cleanupTimer?.Dispose();
        }
    }
}