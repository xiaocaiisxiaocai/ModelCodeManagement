using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.Services.Impl;
using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.Middleware;
using ModelCodeManagement.Api.Repositories;
using ModelCodeManagement.Api.Filters;
using ModelCodeManagement.Api.Entities;
using FluentValidation.AspNetCore;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using System.Text.Json;
using System.Text.Encodings.Web;

var builder = WebApplication.CreateBuilder(args);

// 添加HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// 添加控制器服务和验证过滤�?
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
})
.AddJsonOptions(options =>
{
    // 支持中文编码 - 使用更安全的中文编码器
    options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Create(
        System.Text.Unicode.UnicodeRanges.BasicLatin,
        System.Text.Unicode.UnicodeRanges.CjkUnifiedIdeographs,
        System.Text.Unicode.UnicodeRanges.CjkUnifiedIdeographsExtensionA,
        System.Text.Unicode.UnicodeRanges.CjkSymbolsandPunctuation,
        System.Text.Unicode.UnicodeRanges.GeneralPunctuation);
    
    // 保持属性名大小写
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    
    // 允许尾随逗号
    options.JsonSerializerOptions.AllowTrailingCommas = true;
    
    // 读取注释
    options.JsonSerializerOptions.ReadCommentHandling = System.Text.Json.JsonCommentHandling.Skip;
    
    // 设置默认缓冲区大小以处理较大的JSON
    options.JsonSerializerOptions.DefaultBufferSize = 16384;
    
    // 处理循环引用
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    
    // 配置更宽松的数字处理
    options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
});

// 添加FluentValidation
builder.Services.AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters()
    .AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

// 添加EF Core数据库服�?
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 添加内存缓存
builder.Services.AddMemoryCache();

// 添加响应缓存
builder.Services.AddResponseCaching();

// 添加JWT认证服务
builder.Services.AddJwtAuthentication(builder.Configuration);

// 添加CORS服务
builder.Services.AddCorsSetup(builder.Configuration);

// 添加Swagger服务
builder.Services.AddSwaggerSetup();

// 注册EF Core Repository
builder.Services.AddScoped(typeof(ModelCodeManagement.Api.Data.IBaseRepository<>), typeof(ModelCodeManagement.Api.Data.BaseRepository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();

// 注册实体Repository
builder.Services.AddScoped<ModelCodeManagement.Api.Data.IBaseRepository<ProductType>, ModelCodeManagement.Api.Data.BaseRepository<ProductType>>();
builder.Services.AddScoped<ModelCodeManagement.Api.Data.IBaseRepository<ModelClassification>, ModelCodeManagement.Api.Data.BaseRepository<ModelClassification>>();
builder.Services.AddScoped<ModelCodeManagement.Api.Data.IBaseRepository<CodeClassification>, ModelCodeManagement.Api.Data.BaseRepository<CodeClassification>>();
builder.Services.AddScoped<ModelCodeManagement.Api.Data.IBaseRepository<CodeUsageEntry>, ModelCodeManagement.Api.Data.BaseRepository<CodeUsageEntry>>();

// 注册用户上下文服�?
builder.Services.AddScoped<IUserContextService, UserContextService>();

// 注册审计日志服务
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// 注册业务服务
builder.Services.AddScoped<ISystemConfigService, SystemConfigService>();
builder.Services.AddScoped<IProductTypeService, ProductTypeService>();
builder.Services.AddScoped<IModelClassificationService, ModelClassificationService>();
builder.Services.AddScoped<ICodeClassificationService, CodeClassificationService>();
builder.Services.AddScoped<ICodeUsageService, CodeUsageService>();

// 注册新增的服�?
// builder.Services.AddScoped<ICodePreAllocationService, CodePreAllocationService>(); // 暂时禁用预分配服务，不符合业务需�?
builder.Services.AddScoped<IBatchOperationService, BatchOperationService>();

// 注册认证和用户管理服�?
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IUserService, UserService>(); // 保持向后兼容
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();

// 其他服务
builder.Services.AddScoped<IDataDictionaryService, DataDictionaryService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IWarRoomService, WarRoomService>();

// 健康检查和监控服务
builder.Services.AddScoped<IHealthCheckService, HealthCheckService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

// 验证配置和服�? 
var logger = app.Services.GetRequiredService<ILogger<Program>>();
// builder.Configuration.ValidateConfiguration(logger);
// app.Services.ValidateServices(); // 暂时注释这些验证，避免SqlSugar相关验证错误

// 初始化EF Core数据�?
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // 开发环境：删除并重新创建数据库以确保表结构正确
    if (app.Environment.IsDevelopment())
    {
        await dbContext.Database.EnsureDeletedAsync();
        await dbContext.Database.EnsureCreatedAsync();
        Console.WriteLine("✅开发环境：数据库已重新创建");
    }
    else
    {
        await dbContext.Database.EnsureCreatedAsync();
    }
    // 注意：实际部署时应使用Migration而不是EnsureCreated
    
    // 初始化种子数�?
    await SeedDataAsync(dbContext, app.Environment.IsDevelopment());
}

// 数据种子初始化方�?
static async Task SeedDataAsync(ApplicationDbContext dbContext, bool isDevelopment)
{
    // 检查是否已有用�?
    if (!await dbContext.Users.AnyAsync())
    {
        // 创建默认admin用户
        var adminUser = new User
        {
            EmployeeId = "admin",
            UserName = "Administrator",
            Email = "admin@company.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Department = "IT",
            Position = "System Administrator",
            Status = "Active",
            IsActive = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        
        dbContext.Users.Add(adminUser);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始admin用户已创建(admin/admin123)");
    }
    
    // 检查是否已有产品类�?
    if (!await dbContext.ProductTypes.AnyAsync())
    {
        var productTypes = new[]
        {
            new ProductType { Code = "PCB", CreatedAt = DateTime.Now },
            new ProductType { Code = "FPC", CreatedAt = DateTime.Now }
        };
        
        dbContext.ProductTypes.AddRange(productTypes);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始产品类型已创建");
    }
    
    // 检查是否已有组织架构
    if (!await dbContext.Organizations.AnyAsync())
    {
        var organizations = new[]
        {
            new Organization { Code = "ROOT", Name = "集团公司", Type = "Company", ParentId = null, Path = "/1/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Code = "IT", Name = "信息技术部", Type = "Department", ParentId = 1, Path = "/1/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Code = "PROD", Name = "生产部", Type = "Department", ParentId = 1, Path = "/1/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Code = "QA", Name = "质量部", Type = "Department", ParentId = 1, Path = "/1/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.Organizations.AddRange(organizations);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始组织架构已创建");
    }
    
    // 检查是否已有角�?
    if (!await dbContext.Roles.AnyAsync())
    {
        var roles = new[]
        {
            new Role { Code = "SUPER_ADMIN", Name = "超级管理员", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Role { Code = "ADMIN", Name = "管理员", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Role { Code = "USER", Name = "普通用户", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.Roles.AddRange(roles);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始角色数据已创建");
    }
    
    // 检查是否已有权限
    if (!await dbContext.Permissions.AnyAsync())
    {
        var permissions = new[]
        {
            // 用户管理权限
            new Permission { Code = "USER_MANAGE", Name = "用户管理", Type = "Menu", ParentId = null, Path = "/1/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "USER_CREATE", Name = "创建用户", Type = "Action", ParentId = 1, Path = "/1/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "USER_UPDATE", Name = "编辑用户", Type = "Action", ParentId = 1, Path = "/1/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "USER_DELETE", Name = "删除用户", Type = "Action", ParentId = 1, Path = "/1/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 角色管理权限
            new Permission { Code = "ROLE_MANAGE", Name = "角色管理", Type = "Menu", ParentId = null, Path = "/2/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "ROLE_CREATE", Name = "创建角色", Type = "Action", ParentId = 2, Path = "/2/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "ROLE_UPDATE", Name = "编辑角色", Type = "Action", ParentId = 2, Path = "/2/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "ROLE_DELETE", Name = "删除角色", Type = "Action", ParentId = 2, Path = "/2/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 组织架构管理权限
            new Permission { Code = "ORG_MANAGE", Name = "组织架构管理", Type = "Menu", ParentId = null, Path = "/3/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 审计日志权限
            new Permission { Code = "AUDIT_LOG_VIEW", Name = "查看审计日志", Type = "Menu", ParentId = null, Path = "/4/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 系统配置权限
            new Permission { Code = "SYSTEM_CONFIG", Name = "系统配置", Type = "Menu", ParentId = null, Path = "/5/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 产品类型管理
            new Permission { Code = "PRODUCT_TYPE_MANAGE", Name = "产品类型管理", Type = "Menu", ParentId = null, Path = "/6/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_CREATE", Name = "创建产品类型", Type = "Action", ParentId = 6, Path = "/6/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_UPDATE", Name = "编辑产品类型", Type = "Action", ParentId = 6, Path = "/6/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_DELETE", Name = "删除产品类型", Type = "Action", ParentId = 6, Path = "/6/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_VIEW", Name = "查看产品类型", Type = "Action", ParentId = 6, Path = "/6/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 机型分类管理
            new Permission { Code = "MODEL_CLASS_MANAGE", Name = "机型分类管理", Type = "Menu", ParentId = null, Path = "/7/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_CREATE", Name = "创建机型分类", Type = "Action", ParentId = 7, Path = "/7/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_UPDATE", Name = "编辑机型分类", Type = "Action", ParentId = 7, Path = "/7/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_DELETE", Name = "删除机型分类", Type = "Action", ParentId = 7, Path = "/7/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_VIEW", Name = "查看机型分类", Type = "Action", ParentId = 7, Path = "/7/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 代码分类管理
            new Permission { Code = "CODE_CLASS_MANAGE", Name = "代码分类管理", Type = "Menu", ParentId = null, Path = "/8/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_CREATE", Name = "创建代码分类", Type = "Action", ParentId = 8, Path = "/8/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_UPDATE", Name = "编辑代码分类", Type = "Action", ParentId = 8, Path = "/8/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_DELETE", Name = "删除代码分类", Type = "Action", ParentId = 8, Path = "/8/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_VIEW", Name = "查看代码分类", Type = "Action", ParentId = 8, Path = "/8/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 编码使用管理
            new Permission { Code = "CODE_USAGE_MANAGE", Name = "编码使用管理", Type = "Menu", ParentId = null, Path = "/9/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_CREATE", Name = "创建编码使用记录", Type = "Action", ParentId = 9, Path = "/9/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_UPDATE", Name = "编辑编码使用记录", Type = "Action", ParentId = 9, Path = "/9/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_DELETE", Name = "删除编码使用记录", Type = "Action", ParentId = 9, Path = "/9/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_VIEW", Name = "查看编码使用记录", Type = "Action", ParentId = 9, Path = "/9/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 数据字典管理权限
            new Permission { Code = "DATA_DICT_MANAGE", Name = "数据字典管理", Type = "Menu", ParentId = null, Path = "/10/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_CREATE", Name = "创建数据字典", Type = "Action", ParentId = 10, Path = "/10/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_UPDATE", Name = "编辑数据字典", Type = "Action", ParentId = 10, Path = "/10/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_DELETE", Name = "删除数据字典", Type = "Action", ParentId = 10, Path = "/10/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_VIEW", Name = "查看数据字典", Type = "Action", ParentId = 10, Path = "/10/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 战情中心权限  
            new Permission { Code = "WAR_ROOM_VIEW", Name = "查看战情中心", Type = "Menu", ParentId = null, Path = "/11/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "WAR_ROOM_MANAGE", Name = "管理战情中心", Type = "Action", ParentId = 11, Path = "/11/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 补充缺失的权限 - 这些权限在ServiceExtensions中被引用但未在数据库中初始化
            // 用户查看权限 (独立于用户管理)
            new Permission { Code = "USER_VIEW", Name = "查看用户信息", Type = "Action", ParentId = 1, Path = "/1/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 角色查看权限 (独立于角色管理)  
            new Permission { Code = "ROLE_VIEW", Name = "查看角色信息", Type = "Action", ParentId = 2, Path = "/2/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 组织查看权限 (独立于组织管理)
            new Permission { Code = "ORG_VIEW", Name = "查看组织架构", Type = "Action", ParentId = 3, Path = "/3/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 权限管理权限
            new Permission { Code = "PERMISSION_MANAGE", Name = "权限管理", Type = "Menu", ParentId = null, Path = "/12/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_VIEW", Name = "查看权限", Type = "Action", ParentId = 12, Path = "/12/1/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_CREATE", Name = "创建权限", Type = "Action", ParentId = 12, Path = "/12/2/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_UPDATE", Name = "编辑权限", Type = "Action", ParentId = 12, Path = "/12/3/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_DELETE", Name = "删除权限", Type = "Action", ParentId = 12, Path = "/12/4/", Level = 2, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 批量操作权限
            new Permission { Code = "BATCH_OPERATION", Name = "批量操作", Type = "Menu", ParentId = null, Path = "/13/", Level = 1, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.Permissions.AddRange(permissions);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始权限数据已创建");
    }
    
    // 检查是否已有系统配置
    if (!await dbContext.SystemConfigs.AnyAsync())
    {
        var systemConfigs = new[]
        {
            new SystemConfig { ConfigKey = "NumberDigits", ConfigValue = "2", Description = "编码数字位数配置，用于自动生成编码", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.SystemConfigs.AddRange(systemConfigs);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始系统配置已创建");
    }
    
    // 在开发环境下初始化机型分类和使用清单测试数据
    if (isDevelopment)
    {
        await InitializeTestDataAsync(dbContext);
    }
    
    // 初始化RBAC关联数据
    await InitializeRbacDataAsync(dbContext, isDevelopment);
}

// RBAC关联数据初始化方�?
static async Task InitializeRbacDataAsync(ApplicationDbContext dbContext, bool isDevelopment)
{
    // 检查是否已有角色权限关�?
    if (!await dbContext.RolePermissions.AnyAsync())
    {
        // 获取角色和权�?
        var superAdminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "SUPER_ADMIN");
        var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "ADMIN");
        var userRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "USER");
        
        var userManagePermission = await dbContext.Permissions.FirstOrDefaultAsync(p => p.Code == "USER_MANAGE");
        var roleManagePermission = await dbContext.Permissions.FirstOrDefaultAsync(p => p.Code == "ROLE_MANAGE");
        var orgManagePermission = await dbContext.Permissions.FirstOrDefaultAsync(p => p.Code == "ORG_MANAGE");
        
        var rolePermissions = new List<RolePermission>();
        
        // 获取所有权�?
        var allPermissions = await dbContext.Permissions.ToListAsync();
        
        if (superAdminRole != null && allPermissions.Any())
        {
            // SuperAdmin拥有所有权�?
            foreach (var permission in allPermissions)
            {
                rolePermissions.Add(new RolePermission { RoleId = superAdminRole.Id, PermissionId = permission.Id, AssignedAt = DateTime.Now });
            }
        }
        
        if (adminRole != null && allPermissions.Any())
        {
            // Admin：可以增删改查战情中心、编码管理、数据字�?
            var adminPermissionCodes = new[] {
                "WAR_ROOM_VIEW", "WAR_ROOM_MANAGE",
                "PRODUCT_TYPE_MANAGE", "PRODUCT_TYPE_CREATE", "PRODUCT_TYPE_UPDATE", "PRODUCT_TYPE_DELETE", "PRODUCT_TYPE_VIEW",
                "MODEL_CLASS_MANAGE", "MODEL_CLASS_CREATE", "MODEL_CLASS_UPDATE", "MODEL_CLASS_DELETE", "MODEL_CLASS_VIEW",
                "CODE_CLASS_MANAGE", "CODE_CLASS_CREATE", "CODE_CLASS_UPDATE", "CODE_CLASS_DELETE", "CODE_CLASS_VIEW",
                "CODE_USAGE_MANAGE", "CODE_USAGE_CREATE", "CODE_USAGE_UPDATE", "CODE_USAGE_DELETE", "CODE_USAGE_VIEW",
                "DATA_DICT_MANAGE", "DATA_DICT_CREATE", "DATA_DICT_UPDATE", "DATA_DICT_DELETE", "DATA_DICT_VIEW",
                "USER_VIEW", "ROLE_VIEW", "ORG_VIEW", "PERMISSION_VIEW", "BATCH_OPERATION"
            };
            
            var adminPermissions = allPermissions.Where(p => adminPermissionCodes.Contains(p.Code)).ToList();
            foreach (var permission in adminPermissions)
            {
                rolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = permission.Id, AssignedAt = DateTime.Now });
            }
        }
        
        if (userRole != null && allPermissions.Any())
        {
            // User：只有查看战情中心、编码管理的权限
            var userPermissionCodes = new[] {
                "WAR_ROOM_VIEW",
                "PRODUCT_TYPE_VIEW", "MODEL_CLASS_VIEW", "CODE_CLASS_VIEW", "CODE_USAGE_VIEW"
            };
            
            var userPermissions = allPermissions.Where(p => userPermissionCodes.Contains(p.Code)).ToList();
            foreach (var permission in userPermissions)
            {
                rolePermissions.Add(new RolePermission { RoleId = userRole.Id, PermissionId = permission.Id, AssignedAt = DateTime.Now });
            }
        }
        
        if (rolePermissions.Any())
        {
            dbContext.RolePermissions.AddRange(rolePermissions);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅初始角色权限关联已创建");
        }
    }
    
    // 检查是否已有用户角色关�?
    if (!await dbContext.UserRoles.AnyAsync())
    {
        // 为admin用户分配SuperAdmin角色
        var adminUser = await dbContext.Users.FirstOrDefaultAsync(u => u.EmployeeId == "admin");
        var superAdminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "SUPER_ADMIN");
        
        if (adminUser != null && superAdminRole != null)
        {
            var userRole = new UserRole
            {
                UserId = adminUser.Id,
                RoleId = superAdminRole.Id,
                AssignedBy = adminUser.Id, // 自分�?
                AssignedAt = DateTime.Now
            };
            
            dbContext.UserRoles.Add(userRole);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅初始用户角色关联已创建(admin -> SuperAdmin)");
        }
    }
    
    // 初始化数据字�?- 与前端mock数据一�?
    // 开发环境下强制重新初始化数据字�?
    if (isDevelopment)
    {
        // 清空现有数据字典数据
        var existingDictionaries = await dbContext.DataDictionaries.ToListAsync();
        if (existingDictionaries.Any())
        {
            dbContext.DataDictionaries.RemoveRange(existingDictionaries);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("🔄 开发环境：已清空现有数据字典数据");
        }
    }
    
    if (!await dbContext.DataDictionaries.AnyAsync())
    {
        // 第一步：创建客户字典
        var customers = new[]
        {
            new DataDictionary { Category = "Customer", Code = "APPLE", Name = "苹果", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "HUAWEI", Name = "华为", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "XIAOMI", Name = "小米", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "SAMSUNG", Name = "三星", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "OPPO", Name = "OPPO", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "VIVO", Name = "vivo", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "LENOVO", Name = "联想", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "DELL", Name = "戴尔", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "HP", Name = "惠普", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Customer", Code = "XUNDE", Name = "迅得", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.DataDictionaries.AddRange(customers);
        await dbContext.SaveChangesAsync();
        
        // 重新查询客户数据以获取自动生成的ID
        var savedCustomers = await dbContext.DataDictionaries
            .Where(x => x.Category == "Customer")
            .ToListAsync();
        
        // 创建客户Code到ID的映射
        var customerMap = savedCustomers.ToDictionary(x => x.Code, x => x.Id);
        
        // 第二步：创建厂区字典，设置正确的ParentId
        var factories = new[]
        {
            new DataDictionary { Category = "Factory", Code = "APPLE_LH", Name = "苹果龙华厂", ParentId = customerMap["APPLE"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "APPLE_GL", Name = "苹果观澜厂", ParentId = customerMap["APPLE"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "HUAWEI_SSH", Name = "华为松山湖厂", ParentId = customerMap["HUAWEI"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "HUAWEI_SZ", Name = "华为深圳厂", ParentId = customerMap["HUAWEI"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "XIAOMI_KS", Name = "小米昆山厂", ParentId = customerMap["XIAOMI"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "XIAOMI_CQ", Name = "小米重庆厂", ParentId = customerMap["XIAOMI"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "XUNDE_DG", Name = "迅得东莞厂", ParentId = customerMap["XUNDE"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "Factory", Code = "XUNDE_KS", Name = "迅得昆山厂", ParentId = customerMap["XUNDE"], CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.DataDictionaries.AddRange(factories);
        await dbContext.SaveChangesAsync();
        
        // 第三步：创建其他字典数据
        var otherDictionaries = new[]
        {
            // 品名字典
            new DataDictionary { Category = "ProductName", Code = "PCB_INNER_BOARD", Name = "横向内层暂放板机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "PCB_LAMINATE", Name = "PCB层压机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "THIN_BOARD_HANDLER", Name = "薄板处理机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "CARRIER_CONVEYOR", Name = "载盘输送机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "MULTILAYER_PRESS", Name = "多层板压合机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "FPC_FLEXIBLE", Name = "FPC柔性板机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "AUTO_TESTER", Name = "自动检测机", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "ProductName", Code = "CONVEYOR_SYSTEM", Name = "传送带系统", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 占用类型字典
            new DataDictionary { Category = "OccupancyType", Code = "PLANNING", Name = "规划", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "OccupancyType", Code = "WORK_ORDER", Name = "工令", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new DataDictionary { Category = "OccupancyType", Code = "PAUSE", Name = "暂停", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.DataDictionaries.AddRange(otherDictionaries);
        await dbContext.SaveChangesAsync();
        Console.WriteLine("✅初始数据字典已创建(包含客户、厂区带关联、品名、占用类型等完整数据)");
    }
    
    // 初始化产品类型测试数据
    if (!await dbContext.ProductTypes.AnyAsync())
    {
        var productTypes = new[]
        {
            new ProductType { Code = "PCB", CreatedAt = DateTime.Now },
            new ProductType { Code = "FPC", CreatedAt = DateTime.Now },
            new ProductType { Code = "HDI", CreatedAt = DateTime.Now }
        };
        
        dbContext.ProductTypes.AddRange(productTypes);
        await dbContext.SaveChangesAsync();
        Console.WriteLine("✅产品类型测试数据已创建"); // 触发重新编译
    }
    
    // 初始化机型分类测试数据
    if (!await dbContext.ModelClassifications.AnyAsync())
    {
        var pcbProductType = await dbContext.ProductTypes.FirstOrDefaultAsync(pt => pt.Code == "PCB");
        if (pcbProductType != null)
        {
            var modelClassifications = new[]
            {
                new ModelClassification { Type = "SLU", ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "SLUR", ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "SB", ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "ST", ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "AC", ProductTypeId = pcbProductType.Id, HasCodeClassification = false, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
            };
            
            dbContext.ModelClassifications.AddRange(modelClassifications);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅机型分类测试数据已创建");
        }
    }
    
    // 初始化编码使用记录测试数据（用于战情中心统计）
    if (!await dbContext.CodeUsageEntries.AnyAsync())
    {
        var baseTime = new DateTime(2022, 1, 1);
        var codeUsageEntries = new List<CodeUsageEntry>();
        
        // 2022年数据：SLU和SLUR首次出现
        codeUsageEntries.AddRange(new[]
        {
            new CodeUsageEntry { ModelType = "SLU", Model = "SLU-100", ActualNumber = "SLU-100", ProductName = "单层内层板A", OccupancyType = "PLANNING", Builder = "张三", CreatedAt = baseTime.AddDays(10), UpdatedAt = baseTime.AddDays(10) },
            new CodeUsageEntry { ModelType = "SLU", Model = "SLU-101", ActualNumber = "SLU-101", ProductName = "单层内层板B", OccupancyType = "WORK_ORDER", Builder = "李四", CreatedAt = baseTime.AddDays(20), UpdatedAt = baseTime.AddDays(20) },
            new CodeUsageEntry { ModelType = "SLUR", Model = "SLUR-100", ActualNumber = "SLUR-100", ProductName = "单层内层补强板A", OccupancyType = "PLANNING", Builder = "王五", CreatedAt = baseTime.AddDays(30), UpdatedAt = baseTime.AddDays(30) },
            new CodeUsageEntry { ModelType = "SLUR", Model = "SLUR-101", ActualNumber = "SLUR-101", ProductName = "单层内层补强板B", OccupancyType = "WORK_ORDER", Builder = "赵六", CreatedAt = baseTime.AddDays(40), UpdatedAt = baseTime.AddDays(40) }
        });
        
        // 2023年数据：SB首次出现，SLU和SLUR继续使用
        var time2023 = new DateTime(2023, 1, 1);
        codeUsageEntries.AddRange(new[]
        {
            new CodeUsageEntry { ModelType = "SB", Model = "SB-100", ActualNumber = "SB-100", ProductName = "薄板A", OccupancyType = "PLANNING", Builder = "孙七", CreatedAt = time2023.AddDays(15), UpdatedAt = time2023.AddDays(15) },
            new CodeUsageEntry { ModelType = "SLU", Model = "SLU-102", ActualNumber = "SLU-102", ProductName = "单层内层板C", OccupancyType = "WORK_ORDER", Builder = "周八", CreatedAt = time2023.AddDays(25), UpdatedAt = time2023.AddDays(25) },
            new CodeUsageEntry { ModelType = "SLUR", Model = "SLUR-102", ActualNumber = "SLUR-102", ProductName = "单层内层补强板C", OccupancyType = "PAUSE", Builder = "吴九", CreatedAt = time2023.AddDays(35), UpdatedAt = time2023.AddDays(35) }
        });
        
        // 2024年数据：ST首次出现
        var time2024 = new DateTime(2024, 1, 1);
        codeUsageEntries.AddRange(new[]
        {
            new CodeUsageEntry { ModelType = "ST", Model = "ST-100", ActualNumber = "ST-100", ProductName = "载盘A", OccupancyType = "PLANNING", Builder = "郑十", CreatedAt = time2024.AddDays(20), UpdatedAt = time2024.AddDays(20) },
            new CodeUsageEntry { ModelType = "SB", Model = "SB-101", ActualNumber = "SB-101", ProductName = "薄板B", OccupancyType = "WORK_ORDER", Builder = "钱一", CreatedAt = time2024.AddDays(30), UpdatedAt = time2024.AddDays(30) }
        });
        
        // 2025年数据：AC首次出现
        var time2025 = new DateTime(2025, 1, 1);
        codeUsageEntries.AddRange(new[]
        {
            new CodeUsageEntry { ModelType = "AC", Model = "AC-50", ActualNumber = "AC-50", ProductName = "特殊载盘A", OccupancyType = "PLANNING", Builder = "陈二", CreatedAt = time2025.AddDays(10), UpdatedAt = time2025.AddDays(10) },
            new CodeUsageEntry { ModelType = "AC", Model = "AC-100", ActualNumber = "AC-100", ProductName = "特殊载盘B", OccupancyType = "WORK_ORDER", Builder = "林三", CreatedAt = time2025.AddDays(20), UpdatedAt = time2025.AddDays(20) }
        });
        
        dbContext.CodeUsageEntries.AddRange(codeUsageEntries);
        await dbContext.SaveChangesAsync();
        Console.WriteLine("✅编码使用记录测试数据已创建 - 包含2022-2025年新增机型统计数据");
    }
}

// 配置HTTP请求管道
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "机型编码管理系统 API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

// 添加性能监控中间�?
app.UseMiddleware<PerformanceMonitoringMiddleware>();

// 添加全局异常处理中间件（最先执行）
app.UseMiddleware<GlobalExceptionMiddleware>();

// 启用响应缓存
app.UseResponseCaching();

// 启用CORS
app.UseCors("DefaultPolicy");

// 启用认证和授�?
app.UseAuthentication();
app.UseAuthorization();

// 添加Token验证中间件（在认证之后）
app.UseMiddleware<TokenValidationMiddleware>();

// 映射控制�?
app.MapControllers();

// 健康检查端点（需要认证）
app.MapGet("/api/health", async (IHealthCheckService healthCheckService) =>
{
    var result = await healthCheckService.CheckHealthAsync();
    return Results.Ok(result);
}).WithTags("Health").RequireAuthorization();

// 公开的健康检查端点（无需认证�?
app.MapGet("/api/health/public", () => new
{
    Status = "API Running",
    Timestamp = DateTime.UtcNow,
    Version = "1.0.0"
}).WithTags("Health");

// 系统信息端点（需要管理员权限�?
app.MapGet("/api/system/info", (IHealthCheckService healthCheckService) =>
{
    var info = healthCheckService.GetSystemInfo();
    return Results.Ok(info);
}).WithTags("System").RequireAuthorization("Admin");

// .NET 内置健康检查端�?
app.MapHealthChecks("/health");

app.Run();

// 初始化测试数据的方法
static async Task InitializeTestDataAsync(ApplicationDbContext dbContext)
{
    // 检查是否已有机型分类
    if (!await dbContext.ModelClassifications.AnyAsync())
    {
        var pcbProductType = await dbContext.ProductTypes.FirstOrDefaultAsync(p => p.Code == "PCB");
        var fpcProductType = await dbContext.ProductTypes.FirstOrDefaultAsync(p => p.Code == "FPC");
        
        if (pcbProductType != null)
        {
            var modelClassifications = new[]
            {
                new ModelClassification { Type = "SLU", Description = new List<string> { "单层内层板专用暂存设备" }, ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "SLUR", Description = new List<string> { "单层内层板补强专用设备" }, ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "SB", Description = new List<string> { "薄板专用处理设备" }, ProductTypeId = pcbProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
            };
            
            dbContext.ModelClassifications.AddRange(modelClassifications);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅测试PCB机型分类已创建 (SLU, SLUR, SB)");
        }
        
        if (fpcProductType != null)
        {
            var fpcModelClassifications = new[]
            {
                new ModelClassification { Type = "ST", Description = new List<string> { "製程中間轉角轉向" }, ProductTypeId = fpcProductType.Id, HasCodeClassification = true, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
                new ModelClassification { Type = "AC", Description = new List<string> { "自動化控制系統", "無需代碼分類的直接使用模式" }, ProductTypeId = fpcProductType.Id, HasCodeClassification = false, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
            };
            
            dbContext.ModelClassifications.AddRange(fpcModelClassifications);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅测试FPC机型分类已创建 (ST, AC)");
        }
    }
    
    // 检查是否已有代码分类
    if (!await dbContext.CodeClassifications.AnyAsync())
    {
        var sluClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "SLU");
        var slurClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "SLUR");
        var sbClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "SB");
        var stClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "ST");
        var acClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "AC");
        
        var codeClassifications = new List<CodeClassification>();
        
        if (sluClassification != null)
        {
            codeClassifications.AddRange(new[]
            {
                new CodeClassification { Code = "1", Name = "内层板类型1", ModelClassificationId = sluClassification.Id, CreatedAt = DateTime.Now },
                new CodeClassification { Code = "2", Name = "内层板类型2", ModelClassificationId = sluClassification.Id, CreatedAt = DateTime.Now },
                new CodeClassification { Code = "3", Name = "内层板类型3", ModelClassificationId = sluClassification.Id, CreatedAt = DateTime.Now }
            });
        }
        
        if (slurClassification != null)
        {
            codeClassifications.AddRange(new[]
            {
                new CodeClassification { Code = "1", Name = "补强类型1", ModelClassificationId = slurClassification.Id, CreatedAt = DateTime.Now },
                new CodeClassification { Code = "2", Name = "补强类型2", ModelClassificationId = slurClassification.Id, CreatedAt = DateTime.Now }
            });
        }
        
        if (sbClassification != null)
        {
            codeClassifications.AddRange(new[]
            {
                new CodeClassification { Code = "1", Name = "薄板处理1", ModelClassificationId = sbClassification.Id, CreatedAt = DateTime.Now },
                new CodeClassification { Code = "2", Name = "薄板处理2", ModelClassificationId = sbClassification.Id, CreatedAt = DateTime.Now }
            });
        }
        
        if (stClassification != null)
        {
            codeClassifications.AddRange(new[]
            {
                new CodeClassification { Code = "1", Name = "转角转向1", ModelClassificationId = stClassification.Id, CreatedAt = DateTime.Now },
                new CodeClassification { Code = "2", Name = "转角转向2", ModelClassificationId = stClassification.Id, CreatedAt = DateTime.Now }
            });
        }
        
        // AC机型类型不需要代码分类，因为HasCodeClassification = false
        // 直接跳过AC的代码分类创建
        
        if (codeClassifications.Any())
        {
            dbContext.CodeClassifications.AddRange(codeClassifications);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅测试代码分类已创建");
        }
    }
    
    // 检查是否已有代码使用记录
    if (!await dbContext.CodeUsageEntries.AnyAsync())
    {
        var random = new Random();
        var occupancyTypes = new[] { "PLANNING", "WORK_ORDER", "PAUSE" };
        var builders = new[] { "张三", "李四", "王五", "赵六", "钱七" };
        var productNames = new[] { "横向内层暂放板机", "PCB层压机", "薄板处理机", "载盘输送机", "多层板压合机", "FPC柔性板机" };
        
        var codeUsageEntries = new List<CodeUsageEntry>();
        
        // 获取所有机型分类和代码分类
        var allModelClassifications = await dbContext.ModelClassifications.Include(mc => mc.CodeClassifications).ToListAsync();
        
        foreach (var modelClassification in allModelClassifications)
        {
            if (modelClassification.HasCodeClassification && modelClassification.CodeClassifications.Any())
            {
                // 3层结构：为每个代码分类生成00-99的完整编码范围
                foreach (var codeClassification in modelClassification.CodeClassifications)
                {
                    for (int actualNum = 0; actualNum < 100; actualNum++)
                    {
                        var actualNumber = $"{actualNum:D2}";
                        var modelNumber = $"{modelClassification.Type}-{codeClassification.Code}{actualNumber}";
                        
                        // 随机决定是否创建这个编码（模拟使用情况，80%概率创建）
                        if (random.Next(1, 101) <= 80)
                        {
                            var year = random.Next(2022, 2025);
                            var month = random.Next(1, 13);
                            var day = random.Next(1, 29);
                            var createdDate = new DateTime(year, month, day);
                            
                            var entry = new CodeUsageEntry
                            {
                                Model = modelNumber,
                                ModelType = modelClassification.Type,
                                ModelClassificationId = modelClassification.Id,
                                CodeClassificationId = codeClassification.Id,
                                CodeClassificationNumber = codeClassification.ExtractNumberFromCode(),
                                ActualNumber = actualNumber,
                                ProductName = productNames[random.Next(productNames.Length)],
                                Description = $"{modelClassification.Type}-{codeClassification.Code}系列设备用于{productNames[random.Next(productNames.Length)]}",
                                OccupancyType = occupancyTypes[random.Next(occupancyTypes.Length)],
                                Builder = builders[random.Next(builders.Length)],
                                Requester = builders[random.Next(builders.Length)],
                                CreatedAt = createdDate,
                                UpdatedAt = createdDate,
                                CreationDate = DateOnly.FromDateTime(createdDate),
                                IsDeleted = random.Next(1, 101) <= 10 // 10%的记录被软删除
                            };
                            
                            codeUsageEntries.Add(entry);
                        }
                    }
                }
            }
            else
            {
                // 2层结构：特定编码（如AC-50, AC-100）
                if (modelClassification.Type == "AC")
                {
                    // AC机型只生成50和100两个编码
                    var specificNumbers = new[] { "50", "100" };
                    
                    foreach (var actualNumber in specificNumbers)
                    {
                        var modelNumber = $"{modelClassification.Type}-{actualNumber}";
                        
                        var year = random.Next(2023, 2025);
                        var month = random.Next(1, 13);
                        var day = random.Next(1, 29);
                        var createdDate = new DateTime(year, month, day);
                        
                        var entry = new CodeUsageEntry
                        {
                            Model = modelNumber,
                            ModelType = modelClassification.Type,
                            ModelClassificationId = modelClassification.Id,
                            CodeClassificationId = null,
                            CodeClassificationNumber = null,
                            ActualNumber = actualNumber,
                            ProductName = "自动化控制系统",
                            Description = $"{modelNumber}自动化控制设备",
                            OccupancyType = occupancyTypes[random.Next(occupancyTypes.Length)],
                            Builder = builders[random.Next(builders.Length)],
                            Requester = builders[random.Next(builders.Length)],
                            CreatedAt = createdDate,
                            UpdatedAt = createdDate,
                            CreationDate = DateOnly.FromDateTime(createdDate),
                            IsDeleted = false // AC机型的编码不删除
                        };
                        
                        codeUsageEntries.Add(entry);
                    }
                }
                else
                {
                    // 其他2层结构机型（如ST）生成更多样化的编码
                    for (int i = 0; i < 20; i++) // 每个2层机型生成20个编码
                    {
                        var actualNumber = $"{random.Next(1, 100):D2}";
                        var modelNumber = $"{modelClassification.Type}-{actualNumber}";
                        
                        var year = random.Next(2022, 2025);
                        var month = random.Next(1, 13);
                        var day = random.Next(1, 29);
                        var createdDate = new DateTime(year, month, day);
                        
                        var entry = new CodeUsageEntry
                        {
                            Model = modelNumber,
                            ModelType = modelClassification.Type,
                            ModelClassificationId = modelClassification.Id,
                            CodeClassificationId = null,
                            CodeClassificationNumber = null,
                            ActualNumber = actualNumber,
                            ProductName = productNames[random.Next(productNames.Length)],
                            Description = $"{modelNumber}设备用于{productNames[random.Next(productNames.Length)]}",
                            OccupancyType = occupancyTypes[random.Next(occupancyTypes.Length)],
                            Builder = builders[random.Next(builders.Length)],
                            Requester = builders[random.Next(builders.Length)],
                            CreatedAt = createdDate,
                            UpdatedAt = createdDate,
                            CreationDate = DateOnly.FromDateTime(createdDate),
                            IsDeleted = random.Next(1, 101) <= 5 // 5%的记录被软删除
                        };
                        
                        codeUsageEntries.Add(entry);
                    }
                }
            }
        }
        
        if (codeUsageEntries.Any())
        {
            dbContext.CodeUsageEntries.AddRange(codeUsageEntries);
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅测试代码使用记录已创建 - 总计{codeUsageEntries.Count}条记录");
        }
    }
}
