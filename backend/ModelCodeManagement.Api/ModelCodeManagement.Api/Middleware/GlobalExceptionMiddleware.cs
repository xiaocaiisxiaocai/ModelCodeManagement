using ModelCodeManagement.Api.DTOs;
using System.Net;
using System.Text.Json;

namespace ModelCodeManagement.Api.Middleware
{
    /// <summary>
    /// 全局异常处理中间件
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public GlobalExceptionMiddleware(
            RequestDelegate next, 
            ILogger<GlobalExceptionMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            _logger.LogError(exception, "发生未处理的异常: {Message}", exception.Message);

            var response = context.Response;
            response.ContentType = "application/json";

            var apiResponse = exception switch
            {
                ValidationException validationEx => new ApiResponse<object>
                {
                    Success = false,
                    Message = "输入验证失败",
                    Data = validationEx.Errors,
                    Timestamp = DateTime.Now
                },
                
                UnauthorizedAccessException => new ApiResponse<object>
                {
                    Success = false,
                    Message = "访问被拒绝，权限不足",
                    Data = null,
                    Timestamp = DateTime.Now
                },
                
                ArgumentNullException argEx => new ApiResponse<object>
                {
                    Success = false,
                    Message = "参数不能为空",
                    Data = _environment.IsDevelopment() ? argEx.ParamName : null,
                    Timestamp = DateTime.Now
                },
                
                ArgumentException argEx => new ApiResponse<object>
                {
                    Success = false,
                    Message = "参数错误",
                    Data = _environment.IsDevelopment() ? argEx.Message : null,
                    Timestamp = DateTime.Now
                },
                
                InvalidOperationException => new ApiResponse<object>
                {
                    Success = false,
                    Message = "操作无效",
                    Data = null,
                    Timestamp = DateTime.Now
                },
                
                TimeoutException => new ApiResponse<object>
                {
                    Success = false,
                    Message = "请求超时",
                    Data = null,
                    Timestamp = DateTime.Now
                },
                
                _ => new ApiResponse<object>
                {
                    Success = false,
                    Message = "系统内部错误",
                    Data = _environment.IsDevelopment() ? exception.Message : null,
                    Timestamp = DateTime.Now
                }
            };

            response.StatusCode = GetStatusCode(exception);

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = _environment.IsDevelopment()
            };

            var result = JsonSerializer.Serialize(apiResponse, jsonOptions);
            await response.WriteAsync(result);
        }

        private static int GetStatusCode(Exception exception) => exception switch
        {
            ValidationException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            ArgumentNullException => (int)HttpStatusCode.BadRequest,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            TimeoutException => (int)HttpStatusCode.RequestTimeout,
            _ => (int)HttpStatusCode.InternalServerError
        };
    }

    /// <summary>
    /// 验证异常
    /// </summary>
    public class ValidationException : Exception
    {
        public object Errors { get; }

        public ValidationException(string message, object errors) : base(message)
        {
            Errors = errors;
        }

        public ValidationException(object errors) : base("输入验证失败")
        {
            Errors = errors;
        }
    }
}