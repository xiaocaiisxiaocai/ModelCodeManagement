namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 通用响应结果
    /// </summary>
    public class ApiResponse<T>
    {
        /// <summary>
        /// 是否成功
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// 响应消息
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// 响应数据
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// 错误码
        /// </summary>
        public string? ErrorCode { get; set; }

        /// <summary>
        /// 时间戳
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.Now;

        /// <summary>
        /// 成功响应
        /// </summary>
        public static ApiResponse<T> SuccessResult(T data, string message = "操作成功")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        /// <summary>
        /// 失败响应
        /// </summary>
        public static ApiResponse<T> ErrorResult(string message, string? errorCode = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                ErrorCode = errorCode
            };
        }
    }

    /// <summary>
    /// 无泛型响应结果
    /// </summary>
    public class ApiResponse
    {
        /// <summary>
        /// 是否成功
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// 响应消息
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// 错误码
        /// </summary>
        public string? ErrorCode { get; set; }

        /// <summary>
        /// 成功响应
        /// </summary>
        public static ApiResponse SuccessResult(string message = "操作成功")
        {
            return new ApiResponse
            {
                Success = true,
                Message = message
            };
        }

        /// <summary>
        /// 失败响应
        /// </summary>
        public static ApiResponse ErrorResult(string message, string? errorCode = null)
        {
            return new ApiResponse
            {
                Success = false,
                Message = message,
                ErrorCode = errorCode
            };
        }
    }

    /// <summary>
    /// 分页结果
    /// </summary>
    public class PagedResult<T>
    {
        /// <summary>
        /// 数据列表
        /// </summary>
        public List<T> Items { get; set; } = new();

        /// <summary>
        /// 总记录数
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// 页码
        /// </summary>
        public int PageIndex { get; set; }

        /// <summary>
        /// 页大小
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// 总页数
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        /// <summary>
        /// 是否有下一页
        /// </summary>
        public bool HasNextPage => PageIndex < TotalPages;

        /// <summary>
        /// 是否有上一页
        /// </summary>
        public bool HasPreviousPage => PageIndex > 1;
    }

    /// <summary>
    /// 查询参数基类
    /// </summary>
    public class QueryDto
    {
        /// <summary>
        /// 页码 (默认1)
        /// </summary>
        public int PageIndex { get; set; } = 1;

        /// <summary>
        /// 页大小 (默认20)
        /// </summary>
        public int PageSize { get; set; } = 20;

        /// <summary>
        /// 搜索关键字
        /// </summary>
        public string? Keyword { get; set; }

        /// <summary>
        /// 排序字段
        /// </summary>
        public string? SortField { get; set; }

        /// <summary>
        /// 排序方向 (asc/desc)
        /// </summary>
        public string? SortOrder { get; set; } = "desc";

        /// <summary>
        /// 是否活跃状态过滤
        /// </summary>
        public bool? IsActive { get; set; }
    }
}