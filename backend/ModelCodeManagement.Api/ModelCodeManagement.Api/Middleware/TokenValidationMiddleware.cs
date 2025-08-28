using ModelCodeManagement.Api.Services;
using System.Text.Json;

namespace ModelCodeManagement.Api.Middleware
{
    /// <summary>
    /// Token验证中间件 - 检查Token是否已失效
    /// </summary>
    public class TokenValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TokenValidationMiddleware> _logger;

        public TokenValidationMiddleware(RequestDelegate next, ILogger<TokenValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ITokenService tokenService)
        {
            // 跳过登录和公开端点的Token验证
            var path = context.Request.Path.Value?.ToLower();
            var skipPaths = new[] { "/api/v1/auth/login", "/api/v1/auth/refresh", "/api/health/public", "/swagger" };
            
            if (skipPaths.Any(skipPath => path?.StartsWith(skipPath) == true))
            {
                await _next(context);
                return;
            }

            // 只检查需要认证的请求
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var jtiClaim = context.User.FindFirst("jti");
                if (jtiClaim != null)
                {
                    var isRevoked = await tokenService.IsTokenRevokedAsync(jtiClaim.Value);
                    if (isRevoked)
                    {
                        _logger.LogWarning($"检测到已失效的Token: {jtiClaim.Value}");
                        await HandleRevokedToken(context);
                        return;
                    }
                }
            }

            await _next(context);
        }

        /// <summary>
        /// 处理已失效的Token
        /// </summary>
        private async Task HandleRevokedToken(HttpContext context)
        {
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";

            var response = new
            {
                success = false,
                message = "Token已失效，请重新登录",
                data = (object?)null,
                timestamp = DateTime.Now
            };

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }
}