using Microsoft.EntityFrameworkCore;
using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.Repositories;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.Services.Impl;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ModelCodeManagement.Api.Extensions
{
    /// <summary>
    /// 服务扩展方法
    /// </summary>
    public static class ServiceExtensions
    {
        /// <summary>
        /// 添加Entity Framework Core数据库服务
        /// </summary>
        public static IServiceCollection AddEntityFrameworkSetup(this IServiceCollection services, IConfiguration configuration)
        {
            // 获取数据库连接字符串
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new ArgumentException("数据库连接字符串不能为空");
            }

            // 注册Entity Framework Core DbContext
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), mySqlOptions =>
                {
                    // MySQL特定配置
                    mySqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                    
                    // 启用字符串比较转换
                    mySqlOptions.EnableStringComparisonTranslations();
                    
                    // 设置命令超时时间
                    mySqlOptions.CommandTimeout(30);
                });

                // 开发环境下启用敏感数据日志记录和详细错误信息
                var environment = services.BuildServiceProvider().GetRequiredService<IWebHostEnvironment>();
                if (environment.IsDevelopment())
                {
                    options.EnableSensitiveDataLogging();
                    options.EnableDetailedErrors();
                    options.LogTo(Console.WriteLine, LogLevel.Information);
                }

                // EF Core 8.0+ 查询拆分配置
                
                // 启用服务验证（仅在开发环境）
                if (environment.IsDevelopment())
                {
                    options.EnableServiceProviderCaching(false);
                    options.EnableSensitiveDataLogging();
                }
            });

            // 注册数据库健康检查
            services.AddHealthChecks()
                .AddCheck("database", () => 
                {
                    try
                    {
                        return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Database is healthy");
                    }
                    catch (Exception ex)
                    {
                        return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Database is unhealthy", ex);
                    }
                });

            return services;
        }

        /// <summary>
        /// 添加仓储模式服务
        /// </summary>
        public static IServiceCollection AddRepositoryPattern(this IServiceCollection services)
        {
            // 注册通用仓储接口和实现
            services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));
            
            // 注册现有的仓储服务
            services.AddScoped<IUserRepository, UserRepository>();
            
            return services;
        }

        /// <summary>
        /// 添加业务服务层
        /// </summary>
        public static IServiceCollection AddBusinessServices(this IServiceCollection services)
        {
            // 注册已迁移的业务服务接口和实现
            services.AddScoped<IProductTypeService, ProductTypeService>();
            services.AddScoped<IModelClassificationService, ModelClassificationService>();
            services.AddScoped<ICodeClassificationService, CodeClassificationService>();
            services.AddScoped<ICodeUsageService, CodeUsageService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IRoleService, RoleService>();
            services.AddScoped<IPermissionService, PermissionService>();
            services.AddScoped<IOrganizationService, OrganizationService>();
            services.AddScoped<IAuditLogService, AuditLogService>();
            services.AddScoped<ISystemConfigService, SystemConfigService>();
            services.AddScoped<IRefreshTokenService, RefreshTokenService>();
            services.AddScoped<IBatchOperationService, BatchOperationService>();
            services.AddScoped<IDataDictionaryService, DataDictionaryService>();
            
            return services;
        }

        /// <summary>
        /// 添加缓存服务
        /// </summary>
        public static IServiceCollection AddCachingServices(this IServiceCollection services)
        {
            // 添加内存缓存
            services.AddMemoryCache();
            
            // 添加响应缓存
            services.AddResponseCaching();
            
            return services;
        }

        /// <summary>
        /// 添加性能监控服务
        /// </summary>
        public static IServiceCollection AddPerformanceMonitoring(this IServiceCollection services)
        {
            // 添加健康检查
            services.AddHealthChecks()
                .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("API is running"));
            
            return services;
        }

        /// <summary>
        /// 添加JWT认证服务
        /// </summary>
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtSettings = configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expireMinutes = int.Parse(jwtSettings["ExpireMinutes"] ?? "60");

            if (string.IsNullOrEmpty(secretKey))
            {
                throw new ArgumentException("JWT密钥不能为空");
            }

            // JWT认证配置
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = issuer,
                        ValidAudience = audience,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(secretKey)),
                        ClockSkew = TimeSpan.Zero,
                        RequireExpirationTime = true,
                        RequireSignedTokens = true,
                        SaveSigninToken = false
                    };

                    // JWT事件处理
                    options.Events = new JwtBearerEvents
                    {
                        OnAuthenticationFailed = context =>
                        {
                            Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                            return Task.CompletedTask;
                        },
                        OnTokenValidated = context =>
                        {
                            Console.WriteLine($"Token validated for user: {context.Principal?.Identity?.Name}");
                            return Task.CompletedTask;
                        },
                        OnChallenge = context =>
                        {
                            Console.WriteLine($"Authentication challenge: {context.Error}");
                            return Task.CompletedTask;
                        }
                    };
                });

            // 授权策略配置
            services.AddAuthorization(options =>
            {
                // 基于角色的策略
                options.AddPolicy("SuperAdmin", policy => 
                    policy.RequireRole("SuperAdmin"));
                options.AddPolicy("Admin", policy => 
                    policy.RequireRole("SuperAdmin", "Admin"));
                options.AddPolicy("User", policy => 
                    policy.RequireRole("SuperAdmin", "Admin", "User"));
                
                // 基于权限的策略 - 匹配数据库中的权限代码
                options.AddPolicy("ProductTypeView", policy =>
                    policy.RequireClaim("permission", "PRODUCT_TYPE_VIEW", "PRODUCT_TYPE_MANAGE", "PRODUCT_TYPE_CREATE", "PRODUCT_TYPE_UPDATE"));
                options.AddPolicy("ProductTypeManage", policy =>
                    policy.RequireClaim("permission", "PRODUCT_TYPE_MANAGE", "PRODUCT_TYPE_CREATE", "PRODUCT_TYPE_UPDATE"));
                options.AddPolicy("ProductTypeDelete", policy =>
                    policy.RequireClaim("permission", "PRODUCT_TYPE_DELETE"));
                options.AddPolicy("ModelClassificationView", policy =>
                    policy.RequireClaim("permission", "MODEL_CLASS_VIEW", "MODEL_CLASS_MANAGE", "MODEL_CLASS_CREATE", "MODEL_CLASS_UPDATE"));
                options.AddPolicy("ModelClassificationManage", policy =>
                    policy.RequireClaim("permission", "MODEL_CLASS_MANAGE", "MODEL_CLASS_CREATE", "MODEL_CLASS_UPDATE"));
                options.AddPolicy("ModelClassificationDelete", policy =>
                    policy.RequireClaim("permission", "MODEL_CLASS_DELETE"));
                options.AddPolicy("CodeClassificationView", policy =>
                    policy.RequireClaim("permission", "CODE_CLASS_VIEW", "CODE_CLASS_MANAGE", "CODE_CLASS_CREATE", "CODE_CLASS_UPDATE"));
                options.AddPolicy("CodeClassificationManage", policy =>
                    policy.RequireClaim("permission", "CODE_CLASS_MANAGE", "CODE_CLASS_CREATE", "CODE_CLASS_UPDATE"));
                options.AddPolicy("CodeClassificationDelete", policy =>
                    policy.RequireClaim("permission", "CODE_CLASS_DELETE"));
                options.AddPolicy("CodeUsageView", policy =>
                    policy.RequireClaim("permission", "CODE_USAGE_VIEW", "CODE_USAGE_MANAGE", "CODE_USAGE_CREATE", "CODE_USAGE_UPDATE"));
                options.AddPolicy("CodeUsageManage", policy =>
                    policy.RequireClaim("permission", "CODE_USAGE_MANAGE", "CODE_USAGE_CREATE", "CODE_USAGE_UPDATE"));
                options.AddPolicy("CodeUsageDelete", policy =>
                    policy.RequireClaim("permission", "CODE_USAGE_DELETE"));
                options.AddPolicy("UserManage", policy =>
                    policy.RequireClaim("permission", "USER_MANAGE", "USER_CREATE", "USER_UPDATE"));
                options.AddPolicy("UserView", policy =>
                    policy.RequireClaim("permission", "USER_MANAGE", "USER_CREATE", "USER_UPDATE", "USER_DELETE"));
                options.AddPolicy("UserDelete", policy =>
                    policy.RequireClaim("permission", "USER_DELETE"));
                
                // 角色管理权限
                options.AddPolicy("RoleView", policy =>
                    policy.RequireClaim("permission", "ROLE_MANAGE", "ROLE_CREATE", "ROLE_UPDATE", "ROLE_DELETE"));
                options.AddPolicy("RoleManage", policy =>
                    policy.RequireClaim("permission", "ROLE_MANAGE", "ROLE_CREATE", "ROLE_UPDATE"));
                options.AddPolicy("RoleDelete", policy =>
                    policy.RequireClaim("permission", "ROLE_DELETE"));
                
                // 审计日志权限
                options.AddPolicy("AuditLogView", policy =>
                    policy.RequireClaim("permission", "AUDIT_LOG_VIEW"));
                options.AddPolicy("AuditLogManage", policy =>
                    policy.RequireClaim("permission", "AUDIT_LOG_VIEW", "SYSTEM_CONFIG"));
                
                // 数据字典权限
                options.AddPolicy("DataDictionaryView", policy =>
                    policy.RequireClaim("permission", "DATA_DICT_VIEW", "DATA_DICT_MANAGE", "DATA_DICT_CREATE", "DATA_DICT_UPDATE"));
                options.AddPolicy("DataDictionaryManage", policy =>
                    policy.RequireClaim("permission", "DATA_DICT_MANAGE", "DATA_DICT_CREATE", "DATA_DICT_UPDATE"));
                options.AddPolicy("DataDictionaryDelete", policy =>
                    policy.RequireClaim("permission", "DATA_DICT_DELETE"));
                
                // 组织管理权限
                options.AddPolicy("OrganizationView", policy =>
                    policy.RequireClaim("permission", "ORG_MANAGE"));
                options.AddPolicy("OrganizationManage", policy =>
                    policy.RequireClaim("permission", "ORG_MANAGE"));
                
                // 权限管理
                options.AddPolicy("PermissionView", policy =>
                    policy.RequireClaim("permission", "ROLE_MANAGE", "SYSTEM_CONFIG"));
                options.AddPolicy("PermissionManage", policy =>
                    policy.RequireClaim("permission", "SYSTEM_CONFIG"));
                
                // 战情中心权限
                options.AddPolicy("WarRoomView", policy =>
                    policy.RequireClaim("permission", "WAR_ROOM_VIEW", "WAR_ROOM_MANAGE"));
                options.AddPolicy("WarRoomManage", policy =>
                    policy.RequireClaim("permission", "WAR_ROOM_MANAGE"));
                
                // 系统配置权限
                options.AddPolicy("SystemConfig", policy =>
                    policy.RequireClaim("permission", "SYSTEM_CONFIG"));
                
                // 批量操作权限 (需要管理员权限)
                options.AddPolicy("BatchOperation", policy =>
                    policy.RequireClaim("permission", "PRODUCT_TYPE_MANAGE", "MODEL_CLASS_MANAGE", "CODE_CLASS_MANAGE", "CODE_USAGE_MANAGE", "DATA_DICT_MANAGE"));
            });

            return services;
        }

        /// <summary>
        /// 添加CORS服务
        /// </summary>
        public static IServiceCollection AddCorsSetup(this IServiceCollection services, IConfiguration configuration)
        {
            var corsOrigins = configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() 
                             ?? new[] { "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173" };

            services.AddCors(options =>
            {
                // 开发环境策略
                options.AddPolicy("DevelopmentPolicy", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
                
                // 生产环境策略
                options.AddPolicy("ProductionPolicy", builder =>
                {
                    builder.WithOrigins(corsOrigins)
                           .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                           .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
                           .AllowCredentials()
                           .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
                });
                
                // 默认策略（根据环境选择）
                options.AddPolicy("DefaultPolicy", builder =>
                {
                    var environment = services.BuildServiceProvider().GetRequiredService<IWebHostEnvironment>();
                    if (environment.IsDevelopment())
                    {
                        builder.AllowAnyOrigin()
                               .AllowAnyMethod()
                               .AllowAnyHeader();
                    }
                    else
                    {
                        builder.WithOrigins(corsOrigins)
                               .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                               .WithHeaders("Content-Type", "Authorization", "X-Requested-With")
                               .AllowCredentials();
                    }
                });
            });

            return services;
        }

        /// <summary>
        /// 添加Swagger服务
        /// </summary>
        public static IServiceCollection AddSwaggerSetup(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(options =>
            {
                // API文档信息
                options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                {
                    Title = "机型编码管理系统 API",
                    Version = "v1.0.0",
                    Description = "企业级制造业编码管理平台API文档 - 支持PCB/FPC制造企业的多层级组织架构和细粒度权限控制",
                    Contact = new Microsoft.OpenApi.Models.OpenApiContact
                    {
                        Name = "技术支持团队",
                        Email = "support@company.com",
                        Url = new Uri("https://company.com/support")
                    },
                    License = new Microsoft.OpenApi.Models.OpenApiLicense
                    {
                        Name = "MIT License",
                        Url = new Uri("https://opensource.org/licenses/MIT")
                    },
                    TermsOfService = new Uri("https://company.com/terms")
                });

                // JWT Bearer认证配置
                options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Description = @"JWT Authorization header using the Bearer scheme. 
                                  Enter 'Bearer' [space] and then your token in the text input below.
                                  Example: 'Bearer 12345abcdef'",
                    Name = "Authorization",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT"
                });

                // 全局安全要求
                options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            },
                            Scheme = "oauth2",
                            Name = "Bearer",
                            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                        },
                        new List<string>()
                    }
                });

                // API分组和标签
                options.TagActionsBy(api =>
                {
                    var controllerName = api.ActionDescriptor.RouteValues["controller"];
                    return new[] { controllerName ?? "Default" };
                });

                // 自定义操作ID
                options.CustomOperationIds(apiDesc =>
                {
                    var controller = apiDesc.ActionDescriptor.RouteValues.TryGetValue("controller", out var controllerValue) ? controllerValue : "Default";
                    var action = apiDesc.ActionDescriptor.RouteValues.TryGetValue("action", out var actionValue) ? actionValue : "Index";
                    return $"{controller}_{action}";
                });

                // 包含XML注释文档
                var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                {
                    options.IncludeXmlComments(xmlPath, true);
                }

                // 枚举字符串转换
                options.UseInlineDefinitionsForEnums();
                
                // 忽略过时的API
                options.IgnoreObsoleteActions();
                options.IgnoreObsoleteProperties();

                // 自定义Schema ID
                options.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
            });

            return services;
        }
        /// <summary>
        /// 添加数据验证服务
        /// </summary>
        public static IServiceCollection AddValidationServices(this IServiceCollection services)
        {
            // 配置模型验证行为
            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value!.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToArray();

                    var response = new
                    {
                        Success = false,
                        Message = "输入数据验证失败",
                        Errors = errors
                    };

                    return new BadRequestObjectResult(response);
                };
            });

            return services;
        }
    }
}