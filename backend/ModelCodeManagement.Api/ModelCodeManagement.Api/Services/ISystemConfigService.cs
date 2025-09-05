using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 系统配置服务接口
    /// </summary>
    public interface ISystemConfigService
    {
        /// <summary>
        /// 获取配置值
        /// </summary>
        Task<ApiResponse<string>> GetConfigValueAsync(string key);

        /// <summary>
        /// 获取配置值（泛型）
        /// </summary>
        Task<ApiResponse<T>> GetConfigValueAsync<T>(string key) where T : IConvertible;

        /// <summary>
        /// 设置配置值
        /// </summary>
        Task<ApiResponse> SetConfigValueAsync(string key, string value, string? description = null);

        /// <summary>
        /// 获取编号位数配置
        /// </summary>
        Task<ApiResponse<int>> GetNumberDigitsAsync();

        /// <summary>
        /// 获取延伸码最大长度配置
        /// </summary>
        Task<ApiResponse<int>> GetExtensionMaxLengthAsync();

        /// <summary>
        /// 获取延伸码排除字符配置
        /// </summary>
        Task<ApiResponse<List<string>>> GetExtensionExcludedCharsAsync();

        /// <summary>
        /// 获取所有配置
        /// </summary>
        Task<ApiResponse<Dictionary<string, string>>> GetAllConfigsAsync();

        /// <summary>
        /// 批量更新配置
        /// </summary>
        Task<ApiResponse> UpdateConfigsAsync(Dictionary<string, string> configs);
    }
}