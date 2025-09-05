using System.Diagnostics;

namespace ModelCodeManagement.Api.Middleware
{
    /// <summary>
    /// 性能监控中间件
    /// </summary>
    public class PerformanceMonitoringMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PerformanceMonitoringMiddleware> _logger;
        private readonly IConfiguration _configuration;

        public PerformanceMonitoringMiddleware(
            RequestDelegate next,
            ILogger<PerformanceMonitoringMiddleware> logger,
            IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var requestPath = context.Request.Path.Value;
            var requestMethod = context.Request.Method;
            var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault();
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();

            try
            {
                // 执行下一个中间件
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();
                var responseTime = stopwatch.ElapsedMilliseconds;
                var statusCode = context.Response.StatusCode;

                // 记录请求信息
                _logger.LogInformation(
                    "HTTP {Method} {Path} responded {StatusCode} in {ResponseTime}ms - IP: {IpAddress}",
                    requestMethod, requestPath, statusCode, responseTime, ipAddress);

                // 如果响应时间超过阈值，记录警告
                var slowRequestThreshold = _configuration.GetValue<int>("Performance:SlowRequestThreshold", 5000);
                if (responseTime > slowRequestThreshold)
                {
                    _logger.LogWarning(
                        "慢请求检测 - {Method} {Path} took {ResponseTime}ms (threshold: {Threshold}ms) - IP: {IpAddress}",
                        requestMethod, requestPath, responseTime, slowRequestThreshold, ipAddress);
                }

                // 添加响应时间头部（仅在响应未开始时）
                if (!context.Response.HasStarted)
                {
                    context.Response.Headers.Append("X-Response-Time", $"{responseTime}ms");
                }
            }
        }
    }
}