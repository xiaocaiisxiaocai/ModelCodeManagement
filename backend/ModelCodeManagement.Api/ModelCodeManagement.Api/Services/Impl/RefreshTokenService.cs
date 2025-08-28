using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// Refresh Token服务实现
    /// </summary>
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RefreshTokenService> _logger;

        public RefreshTokenService(
            ApplicationDbContext context, 
            IConfiguration configuration,
            ILogger<RefreshTokenService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// 生成新的Refresh Token
        /// </summary>
        public async Task<RefreshToken> GenerateRefreshTokenAsync(int userId, string jwtId, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                // 生成安全的随机token
                var tokenBytes = new byte[64];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(tokenBytes);
                var token = Convert.ToBase64String(tokenBytes);

                // 获取refresh token过期时间配置
                var refreshExpireDays = int.Parse(_configuration["JwtSettings:RefreshExpireDays"] ?? "7");

                var refreshToken = new RefreshToken
                {
                    Token = token,
                    UserId = userId,
                    JwtId = jwtId,
                    ExpiresAt = DateTime.UtcNow.AddDays(refreshExpireDays),
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    CreatedAt = DateTime.UtcNow
                };

                // 保存到数据库
                _context.RefreshTokens.Add(refreshToken);
                await _context.SaveChangesAsync();

                _logger.LogInformation("生成新的Refresh Token成功 - UserId: {UserId}, JwtId: {JwtId}", userId, jwtId);

                return refreshToken;
            }
            catch (Exception ex)
            {
                _logger.LogError($"生成Refresh Token失败: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// 验证并使用Refresh Token
        /// </summary>
        public async Task<(bool IsValid, RefreshToken? RefreshToken, User? User)> ValidateAndUseRefreshTokenAsync(string token)
        {
            try
            {
                // 查找refresh token
                var refreshToken = await _context.RefreshTokens
                    .Where(rt => rt.Token == token)
                    .FirstOrDefaultAsync();

                if (refreshToken == null)
                {
                    _logger.LogWarning("Refresh Token不存在: {Token}", token.Substring(0, Math.Min(20, token.Length)));
                    return (false, null, null);
                }

                // 检查token是否有效
                if (!refreshToken.IsValid)
                {
                    _logger.LogWarning($"Refresh Token无效，ID: {refreshToken.Id}, 已使用: {refreshToken.IsUsed}, 已撤销: {refreshToken.IsRevoked}, 过期: {refreshToken.ExpiresAt < DateTime.UtcNow}");
                    return (false, refreshToken, null);
                }

                // 获取关联的用户
                var user = await _context.Users
                    .Where(u => u.Id == refreshToken.UserId && u.IsActive)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("Refresh Token关联的用户不存在或已禁用 - UserId: {UserId}", refreshToken.UserId);
                    return (false, refreshToken, null);
                }

                // 标记为已使用
                refreshToken.IsUsed = true;
                refreshToken.UsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Refresh Token验证成功，用户ID: {refreshToken.UserId}");

                return (true, refreshToken, user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"验证Refresh Token失败: {ex.Message}");
                return (false, null, null);
            }
        }

        /// <summary>
        /// 撤销Refresh Token
        /// </summary>
        public async Task RevokeRefreshTokenAsync(string token)
        {
            try
            {
                var tokensToRevoke = await _context.RefreshTokens
                    .Where(rt => rt.Token == token)
                    .ToListAsync();

                foreach (var tokenEntity in tokensToRevoke)
                {
                    tokenEntity.IsRevoked = true;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("撤销Refresh Token成功 - Token: {Token}", token.Substring(0, Math.Min(20, token.Length)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "撤销Refresh Token失败");
                throw;
            }
        }

        /// <summary>
        /// 撤销用户的所有Refresh Token
        /// </summary>
        public async Task RevokeAllUserRefreshTokensAsync(int userId)
        {
            try
            {
                var tokensToRevoke = await _context.RefreshTokens
                    .Where(rt => rt.UserId == userId)
                    .ToListAsync();

                foreach (var token in tokensToRevoke)
                {
                    token.IsRevoked = true;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("撤销用户所有Refresh Token成功 - UserId: {UserId}, Count: {Count}", userId, tokensToRevoke.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "撤销用户所有Refresh Token失败 - UserId: {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// 撤销与指定JWT关联的Refresh Token
        /// </summary>
        public async Task RevokeRefreshTokenByJwtIdAsync(string jwtId)
        {
            try
            {
                var tokensToRevoke = await _context.RefreshTokens
                    .Where(rt => rt.JwtId == jwtId)
                    .ToListAsync();

                foreach (var token in tokensToRevoke)
                {
                    token.IsRevoked = true;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("撤销JWT关联的Refresh Token成功 - JwtId: {JwtId}, Count: {Count}", jwtId, tokensToRevoke.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "撤销JWT关联的Refresh Token失败 - JwtId: {JwtId}", jwtId);
                throw;
            }
        }

        /// <summary>
        /// 清理过期的Refresh Token
        /// </summary>
        public async Task CleanupExpiredTokensAsync()
        {
            try
            {
                var expiredTokens = await _context.RefreshTokens
                    .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync();

                if (expiredTokens.Any())
                {
                    _context.RefreshTokens.RemoveRange(expiredTokens);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("清理过期Refresh Token成功 - Count: {Count}", expiredTokens.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理过期Refresh Token失败");
            }
        }

        /// <summary>
        /// 获取用户的活跃Refresh Token数量
        /// </summary>
        public async Task<int> GetActiveTokenCountAsync(int userId)
        {
            try
            {
                return await _context.RefreshTokens
                    .Where(rt => rt.UserId == userId && 
                                !rt.IsUsed && 
                                !rt.IsRevoked && 
                                rt.ExpiresAt > DateTime.UtcNow)
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户活跃Refresh Token数量失败 - UserId: {UserId}", userId);
                return 0;
            }
        }
    }
}