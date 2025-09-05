using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 系统配置服务实现
    /// </summary>
    public class SystemConfigService : ISystemConfigService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SystemConfigService> _logger;

        public SystemConfigService(
            ApplicationDbContext context,
            ILogger<SystemConfigService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 获取配置值
        /// </summary>
        public async Task<ApiResponse<string>> GetConfigValueAsync(string key)
        {
            try
            {
                var config = await _context.SystemConfigs
                    .Where(c => c.ConfigKey == key && c.IsActive)
                    .FirstOrDefaultAsync();

                if (config == null)
                {
                    _logger.LogWarning("未找到配置项: {Key}", key);
                    return ApiResponse<string>.ErrorResult($"配置项 {key} 不存在");
                }

                return ApiResponse<string>.SuccessResult(config.ConfigValue ?? "");
            }
            catch (Exception ex)
            {
                return ApiResponse<string>.ErrorResult($"获取配置失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 获取配置值（泛型）
        /// </summary>
        public async Task<ApiResponse<T>> GetConfigValueAsync<T>(string key) where T : IConvertible
        {
            try
            {
                var result = await GetConfigValueAsync(key);
                if (!result.Success)
                {
                    return ApiResponse<T>.ErrorResult(result.Message);
                }

                if (result.Data == null)
                {
                    return ApiResponse<T>.ErrorResult("配置值为空");
                }
                
                var convertedValue = (T)Convert.ChangeType(result.Data, typeof(T));
                return ApiResponse<T>.SuccessResult(convertedValue);
            }
            catch (Exception ex)
            {
                return ApiResponse<T>.ErrorResult($"配置值转换失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 设置配置值
        /// </summary>
        public async Task<ApiResponse> SetConfigValueAsync(string key, string value, string? description = null)
        {
            try
            {
                var existingConfig = await _context.SystemConfigs
                    .Where(c => c.ConfigKey == key)
                    .FirstOrDefaultAsync();

                if (existingConfig != null)
                {
                    // 更新现有配置
                    existingConfig.ConfigValue = value;
                    existingConfig.UpdatedAt = DateTime.Now;
                    if (!string.IsNullOrEmpty(description))
                    {
                        existingConfig.Description = description;
                    }
                }
                else
                {
                    // 创建新配置
                    var newConfig = new SystemConfig
                    {
                        ConfigKey = key,
                        ConfigValue = value,
                        Description = description,
                        IsActive = true,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    _context.SystemConfigs.Add(newConfig);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("设置系统配置成功 - Key: {Key}, Value: {Value}", key, value);
                
                return ApiResponse.SuccessResult("配置更新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "设置配置失败 - Key: {Key}", key);
                return ApiResponse.ErrorResult($"设置配置失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 获取编号位数配置
        /// </summary>
        public async Task<ApiResponse<int>> GetNumberDigitsAsync()
        {
            return await GetConfigValueAsync<int>("NumberDigits");
        }

        /// <summary>
        /// 获取延伸码最大长度配置
        /// </summary>
        public async Task<ApiResponse<int>> GetExtensionMaxLengthAsync()
        {
            return await GetConfigValueAsync<int>("ExtensionMaxLength");
        }

        /// <summary>
        /// 获取延伸码排除字符配置
        /// </summary>
        public async Task<ApiResponse<List<string>>> GetExtensionExcludedCharsAsync()
        {
            try
            {
                var result = await GetConfigValueAsync("ExtensionExcludedChars");
                if (!result.Success)
                {
                    return ApiResponse<List<string>>.ErrorResult(result.Message);
                }

                var excludedChars = result.Data!.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(c => c.Trim())
                    .Where(c => !string.IsNullOrEmpty(c))
                    .ToList();

                return ApiResponse<List<string>>.SuccessResult(excludedChars);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<string>>.ErrorResult($"获取排除字符配置失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 获取所有配置
        /// </summary>
        public async Task<ApiResponse<Dictionary<string, string>>> GetAllConfigsAsync()
        {
            try
            {
                var configs = await _context.SystemConfigs
                    .Where(c => c.IsActive)
                    .Select(c => new { c.ConfigKey, c.ConfigValue })
                    .ToListAsync();

                var configDict = configs.ToDictionary(c => c.ConfigKey, c => c.ConfigValue);
                return ApiResponse<Dictionary<string, string>>.SuccessResult(configDict);
            }
            catch (Exception ex)
            {
                return ApiResponse<Dictionary<string, string>>.ErrorResult($"获取配置列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 批量更新配置
        /// </summary>
        public async Task<ApiResponse> UpdateConfigsAsync(Dictionary<string, string> configs)
        {
            try
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var kvp in configs)
                    {
                        var existingConfig = await _context.SystemConfigs
                            .Where(c => c.ConfigKey == kvp.Key)
                            .FirstOrDefaultAsync();

                        if (existingConfig != null)
                        {
                            // 更新现有配置
                            existingConfig.ConfigValue = kvp.Value;
                            existingConfig.UpdatedAt = DateTime.Now;
                        }
                        else
                        {
                            // 创建新配置
                            var newConfig = new SystemConfig
                            {
                                ConfigKey = kvp.Key,
                                ConfigValue = kvp.Value,
                                IsActive = true,
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
                            };

                            _context.SystemConfigs.Add(newConfig);
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("批量更新系统配置成功 - Count: {Count}", configs.Count);
                    return ApiResponse.SuccessResult("批量更新配置成功");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量更新配置失败");
                return ApiResponse.ErrorResult($"批量更新配置失败: {ex.Message}");
            }
        }
    }
}