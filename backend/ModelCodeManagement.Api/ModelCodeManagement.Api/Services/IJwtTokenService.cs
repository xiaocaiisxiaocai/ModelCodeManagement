using ModelCodeManagement.Api.Entities;
using System.Security.Claims;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// JWT Token服务接口
    /// </summary>
    public interface IJwtTokenService
    {
        /// <summary>
        /// 生成JWT Token
        /// </summary>
        /// <param name="user">用户信息</param>
        /// <returns>Token和JwtId</returns>
        (string Token, string JwtId) GenerateAccessToken(User user);

        /// <summary>
        /// 生成JWT Token
        /// </summary>
        /// <param name="claims">声明</param>
        /// <returns>Token和JwtId</returns>
        (string Token, string JwtId) GenerateAccessToken(IEnumerable<Claim> claims);

        /// <summary>
        /// 验证Token是否有效
        /// </summary>
        /// <param name="token">Token字符串</param>
        /// <returns>是否有效</returns>
        bool ValidateToken(string token);

        /// <summary>
        /// 从Token中获取Claims
        /// </summary>
        /// <param name="token">Token字符串</param>
        /// <returns>Claims列表</returns>
        IEnumerable<Claim>? GetClaimsFromToken(string token);

        /// <summary>
        /// 从Token中获取用户ID
        /// </summary>
        /// <param name="token">Token字符串</param>
        /// <returns>用户ID</returns>
        int? GetUserIdFromToken(string token);

        /// <summary>
        /// 从Token中获取JwtId
        /// </summary>
        /// <param name="token">Token字符串</param>
        /// <returns>JwtId</returns>
        string? GetJwtIdFromToken(string token);

        /// <summary>
        /// 检查Token是否过期
        /// </summary>
        /// <param name="token">Token字符串</param>
        /// <returns>是否过期</returns>
        bool IsTokenExpired(string token);
    }
}