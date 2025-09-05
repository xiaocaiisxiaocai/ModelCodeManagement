using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Filters
{
    /// <summary>
    /// 模型验证过滤器
    /// </summary>
    public class ValidationFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                var response = new ApiResponse<object>
                {
                    Success = false,
                    Message = "输入验证失败",
                    Data = errors,
                    Timestamp = DateTime.Now
                };

                context.Result = new BadRequestObjectResult(response);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // 不需要在执行后做任何操作
        }
    }
}