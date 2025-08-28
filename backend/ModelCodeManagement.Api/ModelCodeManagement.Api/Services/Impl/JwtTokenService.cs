using Microsoft.IdentityModel.Tokens;
using ModelCodeManagement.Api.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// JWT Token服务实现
    /// </summary>
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtTokenService> _logger;

        public JwtTokenService(IConfiguration configuration, ILogger<JwtTokenService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public (string Token, string JwtId) GenerateAccessToken(User user)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.UserName),
                new(ClaimTypes.Email, user.Email ?? ""),
                new("EmployeeId", user.EmployeeId),
                new("Department", user.Department ?? ""),
                new("OrganizationId", user.OrganizationId?.ToString() ?? ""),
                new("Position", user.Position ?? "")
            };

            // 添加用户的所有角色
            if (user.Roles?.Any() == true)
            {
                foreach (var role in user.Roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role.Code));
                }
            }

            // 添加用户的所有权限
            if (user.Permissions?.Any() == true)
            {
                foreach (var permission in user.Permissions)
                {
                    claims.Add(new Claim("permission", permission.Code));
                }
            }

            return GenerateAccessToken(claims);
        }

        public (string Token, string JwtId) GenerateAccessToken(IEnumerable<Claim> claims)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT密钥未配置");
                var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT发行者未配置");
                var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT受众未配置");
                var expireMinutes = int.Parse(jwtSettings["ExpireMinutes"] ?? "120");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var jwtId = Guid.NewGuid().ToString();
                var allClaims = new List<Claim>(claims)
                {
                    new(JwtRegisteredClaimNames.Jti, jwtId),
                    new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
                };

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: allClaims,
                    expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                    signingCredentials: credentials
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                return (tokenString, jwtId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "生成JWT Token时发生错误");
                throw new InvalidOperationException("生成Token失败", ex);
            }
        }

        public bool ValidateToken(string token)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT密钥未配置");
                var issuer = jwtSettings["Issuer"];
                var audience = jwtSettings["Audience"];

                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(secretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = !string.IsNullOrEmpty(issuer),
                    ValidIssuer = issuer,
                    ValidateAudience = !string.IsNullOrEmpty(audience),
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                tokenHandler.ValidateToken(token, validationParameters, out _);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Token验证失败: {Token}", token);
                return false;
            }
        }

        public IEnumerable<Claim>? GetClaimsFromToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);
                return jsonToken.Claims;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "从Token获取Claims失败: {Token}", token);
                return null;
            }
        }

        public int? GetUserIdFromToken(string token)
        {
            var claims = GetClaimsFromToken(token);
            var userIdClaim = claims?.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }

            return null;
        }

        public string? GetJwtIdFromToken(string token)
        {
            var claims = GetClaimsFromToken(token);
            return claims?.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        }

        public bool IsTokenExpired(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);
                return jsonToken.ValidTo < DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "检查Token过期状态失败: {Token}", token);
                return true; // 如果无法解析，认为已过期
            }
        }
    }
}