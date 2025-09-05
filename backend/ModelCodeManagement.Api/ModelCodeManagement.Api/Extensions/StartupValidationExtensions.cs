using ModelCodeManagement.Api.Services;

namespace ModelCodeManagement.Api.Extensions
{
    /// <summary>
    /// 启动验证扩展
    /// </summary>
    public static class StartupValidationExtensions
    {
        /// <summary>
        /// 验证所有必要服务是否正确注册
        /// </summary>
        public static void ValidateServices(this IServiceProvider serviceProvider)
        {
            var logger = serviceProvider.GetService<ILogger<Program>>();
            
            try
            {
                // 验证核心服务
                var requiredServices = new Type[]
                {
                    typeof(IProductTypeService),
                    typeof(IModelClassificationService),
                    typeof(ICodeClassificationService),
                    typeof(ICodeUsageService),
                    typeof(ISystemConfigService),
                    typeof(IUserService),
                    typeof(IAuthenticationService),
                    typeof(IJwtTokenService),
                    typeof(IRefreshTokenService),
                    typeof(IDataDictionaryService),
                    typeof(IOrganizationService),
                    typeof(IPermissionService),
                    typeof(IRoleService),
                    typeof(IAuditLogService),
                    typeof(IUserContextService)
                };

                var missingServices = new List<string>();

                // 使用作用域来解析作用域服务，避免从根提供者解析作用域服务的错误
                using (var scope = serviceProvider.CreateScope())
                {
                    foreach (var serviceType in requiredServices)
                    {
                        try
                        {
                            var service = scope.ServiceProvider.GetService(serviceType);
                            if (service == null)
                            {
                                missingServices.Add(serviceType.Name);
                            }
                        }
                        catch (Exception ex)
                        {
                            logger?.LogWarning($"验证服务 {serviceType.Name} 时出现异常: {ex.Message}");
                            missingServices.Add(serviceType.Name);
                        }
                    }
                }

                if (missingServices.Any())
                {
                    var errorMessage = $"以下服务未正确注册: {string.Join(", ", missingServices)}";
                    logger?.LogError(errorMessage);
                    throw new InvalidOperationException(errorMessage);
                }

                logger?.LogInformation("所有核心服务验证通过");
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "服务验证失败");
                throw;
            }
        }

        /// <summary>
        /// 验证配置完整性
        /// </summary>
        public static void ValidateConfiguration(this IConfiguration configuration, ILogger logger)
        {
            try
            {
                // 验证必要配置项
                var requiredConfigs = new[]
                {
                    "ConnectionStrings:DefaultConnection",
                    "Jwt:Key",
                    "Jwt:Issuer", 
                    "Jwt:Audience"
                };

                var missingConfigs = new List<string>();

                foreach (var configKey in requiredConfigs)
                {
                    var value = configuration[configKey];
                    if (string.IsNullOrEmpty(value))
                    {
                        missingConfigs.Add(configKey);
                    }
                }

                if (missingConfigs.Any())
                {
                    var errorMessage = $"以下配置项缺失或为空: {string.Join(", ", missingConfigs)}";
                    logger.LogError(errorMessage);
                    throw new InvalidOperationException(errorMessage);
                }

                // 验证JWT密钥长度
                var jwtKey = configuration["Jwt:Key"];
                if (!string.IsNullOrEmpty(jwtKey) && jwtKey.Length < 32)
                {
                    logger.LogWarning("JWT密钥长度少于32字符，建议使用更长的密钥提高安全性");
                }

                logger.LogInformation("配置验证通过");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "配置验证失败");
                throw;
            }
        }
    }
}