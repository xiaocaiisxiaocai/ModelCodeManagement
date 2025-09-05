using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.Entities;
using System.Diagnostics;
using System.Text.Json;

namespace ModelCodeManagement.Api.Filters
{
    /// <summary>
    /// 审计日志特性
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AuditLogAttribute : ActionFilterAttribute
    {
        private readonly string _action;
        private readonly string? _entityType;
        private Stopwatch? _stopwatch;

        public AuditLogAttribute(string action, string? entityType = null)
        {
            _action = action;
            _entityType = entityType;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            _stopwatch = Stopwatch.StartNew();
            
            var executedContext = await next();
            
            _stopwatch.Stop();

            // 获取审计日志服务
            var auditLogService = context.HttpContext.RequestServices.GetService<IAuditLogService>();
            if (auditLogService == null)
            {
                return;
            }

            // 构建审计日志
            var log = new AuditLog
            {
                Action = _action,
                EntityType = _entityType,
                RequestPath = context.HttpContext.Request.Path,
                HttpMethod = context.HttpContext.Request.Method,
                DurationMs = (int)_stopwatch.ElapsedMilliseconds
            };

            // 尝试从路由获取实体ID
            if (context.RouteData.Values.TryGetValue("id", out var idValue) && int.TryParse(idValue?.ToString(), out int entityId))
            {
                log.EntityId = entityId;
            }

            // 根据结果设置状态
            if (executedContext.Exception != null)
            {
                log.Result = "Failed";
                log.ErrorMessage = executedContext.Exception.Message;
                log.Description = $"{_action} 失败: {executedContext.Exception.Message}";
            }
            else if (executedContext.Result is ObjectResult objectResult)
            {
                var statusCode = objectResult.StatusCode ?? 200;
                if (statusCode >= 200 && statusCode < 300)
                {
                    log.Result = "Success";
                    log.Description = $"{_action} 成功";
                    
                    // 对于创建操作，尝试从响应中获取新创建的实体ID
                    if (_action.Contains("Create") && objectResult.Value != null)
                    {
                        try
                        {
                            var json = JsonSerializer.Serialize(objectResult.Value);
                            using var doc = JsonDocument.Parse(json);
                            if (doc.RootElement.TryGetProperty("data", out var dataElement))
                            {
                                if (dataElement.TryGetProperty("id", out var idElement))
                                {
                                    log.EntityId = idElement.GetInt32();
                                }
                            }
                        }
                        catch { }
                    }
                }
                else
                {
                    log.Result = "Failed";
                    log.Description = $"{_action} 失败 (状态码: {statusCode})";
                }
            }
            else
            {
                log.Description = $"{_action} 完成";
            }

            // 记录请求参数（仅记录非敏感信息）
            if (context.ActionArguments.Count > 0 && !_action.Contains("Login") && !_action.Contains("Password"))
            {
                try
                {
                    var parameters = context.ActionArguments
                        .Where(p => p.Value != null && p.Key != "password" && p.Key != "token")
                        .ToDictionary(p => p.Key, p => p.Value);
                    
                    if (parameters.Count > 0)
                    {
                        log.NewValue = JsonSerializer.Serialize(parameters);
                    }
                }
                catch { }
            }

            // 异步记录日志
            await auditLogService.LogAsync(log);
        }
    }
}