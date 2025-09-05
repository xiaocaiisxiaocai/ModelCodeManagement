using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Services;
using ModelCodeManagement.Api.Services.Impl;
using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.Middleware;
using ModelCodeManagement.Api.Repositories;
using ModelCodeManagement.Api.Filters;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.DTOs;
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
    
    // 开发环境：确保数据库存在
    if (app.Environment.IsDevelopment())
    {
        try
        {
            // 只有数据库存在时才删除
            if (await dbContext.Database.CanConnectAsync())
    {
        await dbContext.Database.EnsureDeletedAsync();
                Console.WriteLine("🗑️ 开发环境：已删除现有数据库");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ 删除数据库时出现错误（可忽略）: {ex.Message}");
        }
        
        await dbContext.Database.EnsureCreatedAsync();
        Console.WriteLine("✅开发环境：数据库已创建/重新创建");
    }
    else
    {
        await dbContext.Database.EnsureCreatedAsync();
    }
    // 注意：实际部署时应使用Migration而不是EnsureCreated
    
    // 初始化种子数�?
    await SeedDataAsync(dbContext, scope, app.Environment.IsDevelopment());
}

// 数据种子初始化方�?
static async Task SeedDataAsync(ApplicationDbContext dbContext, IServiceScope scope, bool isDevelopment)
{
    // 1. 先创建4层组织架构：集团公司 → 事业部 → 部门 → 课别
    if (!await dbContext.Organizations.AnyAsync())
    {
        var organizations = new[]
        {
            // Level 1: 公司
            new Organization { Name = "科技集团", Type = "Company", ParentId = null, Path = "/1/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 2: 事业部 (Business Division)
            new Organization { Name = "科技事业部", Type = "BusinessUnit", ParentId = 1, Path = "/1/2/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "制造事业部", Type = "BusinessUnit", ParentId = 1, Path = "/1/3/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 3: 部门 (Department) - 归属科技事业部
            new Organization { Name = "信息技术部", Type = "Department", ParentId = 2, Path = "/1/2/4/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "研发部", Type = "Department", ParentId = 2, Path = "/1/2/5/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 3: 部门 (Department) - 归属制造事业部
            new Organization { Name = "生产部", Type = "Department", ParentId = 3, Path = "/1/3/6/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "质量部", Type = "Department", ParentId = 3, Path = "/1/3/7/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 4: 课别 (Section/Team) - 归属IT部门
            new Organization { Name = "系统开发课", Type = "Section", ParentId = 4, Path = "/1/2/4/8/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "网络运维课", Type = "Section", ParentId = 4, Path = "/1/2/4/9/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 4: 课别 (Section/Team) - 归属研发部门
            new Organization { Name = "软件研发课", Type = "Section", ParentId = 5, Path = "/1/2/5/10/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "硬件研发课", Type = "Section", ParentId = 5, Path = "/1/2/5/11/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 4: 课别 (Section/Team) - 归属生产部门
            new Organization { Name = "PCB生产线", Type = "Section", ParentId = 6, Path = "/1/3/6/12/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "FPC生产线", Type = "Section", ParentId = 6, Path = "/1/3/6/13/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // Level 4: 课别 (Section/Team) - 归属质量部门
            new Organization { Name = "质量检验课", Type = "Section", ParentId = 7, Path = "/1/3/7/14/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Organization { Name = "质量保证课", Type = "Section", ParentId = 7, Path = "/1/3/7/15/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };
        
        dbContext.Organizations.AddRange(organizations);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始4层组织架构已创建：公司 → 事业部 → 部门 → 课别");
    }
    
    // 2. 检查是否已有用户
    if (!await dbContext.Users.AnyAsync())
    {
        // 获取系统开发课的ID
        var sysSection = await dbContext.Organizations.FirstOrDefaultAsync(o => o.Name == "系统开发课");
        
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
            OrganizationId = sysSection?.Id ?? 8, // 关联到系统开发课，如果找不到则默认使用ID 8
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };
        
        dbContext.Users.Add(adminUser);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始admin用户已创建(admin/admin123)，已关联到系统开发课");
        
        // 创建一些测试用户来验证层级人数统计（分配到不同层级）
        var testUsers = new[]
        {
            // Level 1 公司级别：总经理
            new User 
            { 
                EmployeeId = "ceo001", 
                UserName = "总经理", 
                Email = "ceo@company.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Department = "GROUP",
                Position = "总经理",
                Status = "Active",
                IsActive = true,
                OrganizationId = await dbContext.Organizations.Where(o => o.Name == "科技集团").Select(o => o.Id).FirstOrDefaultAsync(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            },
            // Level 2 事业部级别：科技事业部总监
            new User 
            { 
                EmployeeId = "tech_director", 
                UserName = "科技事业部总监", 
                Email = "techdirector@company.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Department = "TECH_BU",
                Position = "事业部总监",
                Status = "Active",
                IsActive = true,
                OrganizationId = await dbContext.Organizations.Where(o => o.Name == "科技事业部").Select(o => o.Id).FirstOrDefaultAsync(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            },
            // Level 3 部门级别：信息技术部经理
            new User 
            { 
                EmployeeId = "it_manager", 
                UserName = "IT部经理", 
                Email = "itmanager@company.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Department = "IT",
                Position = "部门经理",
                Status = "Active",
                IsActive = true,
                OrganizationId = await dbContext.Organizations.Where(o => o.Name == "信息技术部").Select(o => o.Id).FirstOrDefaultAsync(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            },
            // Level 4 课别级别：系统开发课员工
            new User 
            { 
                EmployeeId = "dev001", 
                UserName = "张开发", 
                Email = "zhang@company.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Department = "IT",
                Position = "软件开发工程师",
                Status = "Active",
                IsActive = true,
                OrganizationId = await dbContext.Organizations.Where(o => o.Name == "系统开发课").Select(o => o.Id).FirstOrDefaultAsync(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            },
            // Level 4 课别级别：网络运维课员工
            new User 
            { 
                EmployeeId = "net001", 
                UserName = "李运维", 
                Email = "li@company.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Department = "IT",
                Position = "网络工程师",
                Status = "Active",
                IsActive = true,
                OrganizationId = await dbContext.Organizations.Where(o => o.Name == "网络运维课").Select(o => o.Id).FirstOrDefaultAsync(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            },
            // Level 4 课别级别：生产线员工
            new User 
            { 
                EmployeeId = "prod001", 
                UserName = "王生产", 
                Email = "wang@company.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Department = "PROD",
                Position = "生产操作员",
                Status = "Active",
                IsActive = true,
                OrganizationId = await dbContext.Organizations.Where(o => o.Name == "PCB生产线").Select(o => o.Id).FirstOrDefaultAsync(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            }
        };
        
        dbContext.Users.AddRange(testUsers);
        await dbContext.SaveChangesAsync();
        
        Console.WriteLine("✅初始测试用户已创建，分布在不同的组织层级中（公司、事业部、部门、课别各1-2人）");
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
            new Permission { Code = "USER_MANAGE", Name = "用户管理", Type = "Menu", ParentId = null, Path = "/1/", Resource = "/admin/users", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "USER_CREATE", Name = "创建用户", Type = "Action", ParentId = 1, Path = "/1/1/", Resource = "/api/v1/user", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "USER_UPDATE", Name = "编辑用户", Type = "Action", ParentId = 1, Path = "/1/2/", Resource = "/api/v1/user/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "USER_DELETE", Name = "删除用户", Type = "Action", ParentId = 1, Path = "/1/3/", Resource = "/api/v1/user/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 角色管理权限
            new Permission { Code = "ROLE_MANAGE", Name = "角色管理", Type = "Menu", ParentId = null, Path = "/2/", Resource = "/admin/roles", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "ROLE_CREATE", Name = "创建角色", Type = "Action", ParentId = 2, Path = "/2/1/", Resource = "/api/v1/roles", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "ROLE_UPDATE", Name = "编辑角色", Type = "Action", ParentId = 2, Path = "/2/2/", Resource = "/api/v1/roles/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "ROLE_DELETE", Name = "删除角色", Type = "Action", ParentId = 2, Path = "/2/3/", Resource = "/api/v1/roles/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 组织架构管理权限
            new Permission { Code = "ORG_MANAGE", Name = "组织架构管理", Type = "Menu", ParentId = null, Path = "/3/", Resource = "/admin/departments", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 审计日志权限
            new Permission { Code = "AUDIT_LOG_VIEW", Name = "查看审计日志", Type = "Menu", ParentId = null, Path = "/4/", Resource = "/admin/audit-logs", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 系统配置权限
            new Permission { Code = "SYSTEM_CONFIG", Name = "系统配置", Type = "Menu", ParentId = null, Path = "/5/", Resource = "/api/v1/system-configs", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 产品类型管理
            new Permission { Code = "PRODUCT_TYPE_MANAGE", Name = "产品类型管理", Type = "Menu", ParentId = null, Path = "/6/", Resource = "/coding", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_CREATE", Name = "创建产品类型", Type = "Action", ParentId = 6, Path = "/6/1/", Resource = "/api/v1/product-types", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_UPDATE", Name = "编辑产品类型", Type = "Action", ParentId = 6, Path = "/6/2/", Resource = "/api/v1/product-types/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_DELETE", Name = "删除产品类型", Type = "Action", ParentId = 6, Path = "/6/3/", Resource = "/api/v1/product-types/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PRODUCT_TYPE_VIEW", Name = "查看产品类型", Type = "Action", ParentId = 6, Path = "/6/4/", Resource = "/api/v1/product-types", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 机型分类管理
            new Permission { Code = "MODEL_CLASS_MANAGE", Name = "机型分类管理", Type = "Menu", ParentId = null, Path = "/7/", Resource = "/coding/model-classification", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_CREATE", Name = "创建机型分类", Type = "Action", ParentId = 7, Path = "/7/1/", Resource = "/api/v1/model-classifications", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_UPDATE", Name = "编辑机型分类", Type = "Action", ParentId = 7, Path = "/7/2/", Resource = "/api/v1/model-classifications/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_DELETE", Name = "删除机型分类", Type = "Action", ParentId = 7, Path = "/7/3/", Resource = "/api/v1/model-classifications/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "MODEL_CLASS_VIEW", Name = "查看机型分类", Type = "Action", ParentId = 7, Path = "/7/4/", Resource = "/api/v1/model-classifications", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 代码分类管理
            new Permission { Code = "CODE_CLASS_MANAGE", Name = "代码分类管理", Type = "Menu", ParentId = null, Path = "/8/", Resource = "/coding/code-classification", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_CREATE", Name = "创建代码分类", Type = "Action", ParentId = 8, Path = "/8/1/", Resource = "/api/v1/code-classifications", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_UPDATE", Name = "编辑代码分类", Type = "Action", ParentId = 8, Path = "/8/2/", Resource = "/api/v1/code-classifications/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_DELETE", Name = "删除代码分类", Type = "Action", ParentId = 8, Path = "/8/3/", Resource = "/api/v1/code-classifications/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_CLASS_VIEW", Name = "查看代码分类", Type = "Action", ParentId = 8, Path = "/8/4/", Resource = "/api/v1/code-classifications", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 编码管理权限 - 编码使用管理
            new Permission { Code = "CODE_USAGE_MANAGE", Name = "编码使用管理", Type = "Menu", ParentId = null, Path = "/9/", Resource = "/coding/code-usage", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_CREATE", Name = "创建编码使用记录", Type = "Action", ParentId = 9, Path = "/9/1/", Resource = "/api/v1/code-usage", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_UPDATE", Name = "编辑编码使用记录", Type = "Action", ParentId = 9, Path = "/9/2/", Resource = "/api/v1/code-usage/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_DELETE", Name = "删除编码使用记录", Type = "Action", ParentId = 9, Path = "/9/3/", Resource = "/api/v1/code-usage/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "CODE_USAGE_VIEW", Name = "查看编码使用记录", Type = "Action", ParentId = 9, Path = "/9/4/", Resource = "/api/v1/code-usage", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 数据字典管理权限
            new Permission { Code = "DATA_DICT_MANAGE", Name = "数据字典管理", Type = "Menu", ParentId = null, Path = "/10/", Resource = "/data-dictionary", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_CREATE", Name = "创建数据字典", Type = "Action", ParentId = 10, Path = "/10/1/", Resource = "/api/v1/data-dictionary", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_UPDATE", Name = "编辑数据字典", Type = "Action", ParentId = 10, Path = "/10/2/", Resource = "/api/v1/data-dictionary/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_DELETE", Name = "删除数据字典", Type = "Action", ParentId = 10, Path = "/10/3/", Resource = "/api/v1/data-dictionary/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "DATA_DICT_VIEW", Name = "查看数据字典", Type = "Action", ParentId = 10, Path = "/10/4/", Resource = "/api/v1/data-dictionary", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },

            // 战情中心权限  
            new Permission { Code = "WAR_ROOM_VIEW", Name = "查看战情中心", Type = "Menu", ParentId = null, Path = "/11/", Resource = "/", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "WAR_ROOM_MANAGE", Name = "管理战情中心", Type = "Action", ParentId = 11, Path = "/11/1/", Resource = "/api/v1/war-room", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 补充缺失的权限 - 这些权限在ServiceExtensions中被引用但未在数据库中初始化
            // 用户查看权限 (独立于用户管理)
            new Permission { Code = "USER_VIEW", Name = "查看用户信息", Type = "Action", ParentId = 1, Path = "/1/4/", Resource = "/api/v1/user", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 角色查看权限 (独立于角色管理)  
            new Permission { Code = "ROLE_VIEW", Name = "查看角色信息", Type = "Action", ParentId = 2, Path = "/2/4/", Resource = "/api/v1/roles", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 组织查看权限 (独立于组织管理)
            new Permission { Code = "ORG_VIEW", Name = "查看组织架构", Type = "Action", ParentId = 3, Path = "/3/1/", Resource = "/api/v1/organization", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 权限管理权限
            new Permission { Code = "PERMISSION_MANAGE", Name = "权限管理", Type = "Menu", ParentId = null, Path = "/12/", Resource = "/admin/permissions", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_VIEW", Name = "查看权限", Type = "Action", ParentId = 12, Path = "/12/1/", Resource = "/api/v1/permissions", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_CREATE", Name = "创建权限", Type = "Action", ParentId = 12, Path = "/12/2/", Resource = "/api/v1/permissions", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_UPDATE", Name = "编辑权限", Type = "Action", ParentId = 12, Path = "/12/3/", Resource = "/api/v1/permissions/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            new Permission { Code = "PERMISSION_DELETE", Name = "删除权限", Type = "Action", ParentId = 12, Path = "/12/4/", Resource = "/api/v1/permissions/{id}", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now },
            
            // 批量操作权限
            new Permission { Code = "BATCH_OPERATION", Name = "批量操作", Type = "Menu", ParentId = null, Path = "/13/", Resource = "/api/v1/batch-operations", CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
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
        await InitializeTestDataAsync(dbContext, scope);
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
        }
        
        // 为其他测试用户分配USER角色
        var normalUserRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "USER");
        if (normalUserRole != null)
        {
            var testUserEmployeeIds = new[] { "ceo001", "tech_director", "it_manager", "dev001", "net001", "prod001" };
            var testUsers = await dbContext.Users
                .Where(u => testUserEmployeeIds.Contains(u.EmployeeId))
                .ToListAsync();
            
            foreach (var user in testUsers)
            {
                var testUserRole = new UserRole
                {
                    UserId = user.Id,
                    RoleId = normalUserRole.Id,
                    AssignedBy = adminUser?.Id ?? user.Id, // 由admin分配，如果admin不存在则自分配
                    AssignedAt = DateTime.Now
                };
                dbContext.UserRoles.Add(testUserRole);
            }
        }
        
        await dbContext.SaveChangesAsync();
        Console.WriteLine("✅初始用户角色关联已创建(包括测试用户)");
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
    
    // 更新现有代码使用记录的客户和厂区信息（如果为空）
    var existingCodeUsageEntries = await dbContext.CodeUsageEntries
        .Where(c => c.CustomerId == null || c.FactoryId == null)
        .ToListAsync();
    
    if (existingCodeUsageEntries.Any())
    {
        var random = new Random();
        var customerIds = await dbContext.DataDictionaries
            .Where(d => d.Category == "Customer")
            .Select(d => d.Id)
            .ToArrayAsync();
            
        var factoryIds = await dbContext.DataDictionaries
            .Where(d => d.Category == "Factory")
            .Select(d => d.Id)
            .ToArrayAsync();
        
        if (customerIds.Any() && factoryIds.Any())
        {
            foreach (var entry in existingCodeUsageEntries)
            {
                if (entry.CustomerId == null)
                {
                    entry.CustomerId = customerIds[random.Next(customerIds.Length)];
                }
                if (entry.FactoryId == null)
                {
                    entry.FactoryId = factoryIds[random.Next(factoryIds.Length)];
                }
                entry.UpdatedAt = DateTime.Now;
            }
            
            await dbContext.SaveChangesAsync();
            Console.WriteLine($"✅已更新{existingCodeUsageEntries.Count}条现有代码使用记录的客户和厂区信息");
        }
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
static async Task InitializeTestDataAsync(ApplicationDbContext dbContext, IServiceScope scope)
{
    // 检查是否已有机型分类，如果没有则创建
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
    
    // 检查是否已有代码使用记录，如果有则跳过初始化
    var existingUsageCount = await dbContext.CodeUsageEntries.CountAsync();
    if (existingUsageCount > 0)
    {
        Console.WriteLine($"⚠️ 已存在 {existingUsageCount} 条代码使用记录，跳过重复初始化");
        return;
    }
    
    Console.WriteLine("🔍 开始使用服务层初始化代码分类和编码使用记录数据...");
    
    // 获取各个机型分类的ID
    var fixedSluClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "SLU");
    var fixedSlurClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "SLUR");
    var fixedSbClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "SB");
    var fixedStClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "ST");
    var fixedAcClassification = await dbContext.ModelClassifications.FirstOrDefaultAsync(mc => mc.Type == "AC");
    
    Console.WriteLine($"🔍 机型分类检查 - SLU:{fixedSluClassification?.Id}, SLUR:{fixedSlurClassification?.Id}, SB:{fixedSbClassification?.Id}, ST:{fixedStClassification?.Id}, AC:{fixedAcClassification?.Id}");
    
    // 获取服务实例
    var codeClassificationService = scope.ServiceProvider.GetRequiredService<ICodeClassificationService>();
    var codeUsageService = scope.ServiceProvider.GetRequiredService<ICodeUsageService>();
    
    if (fixedSluClassification != null && fixedSlurClassification != null && fixedSbClassification != null && 
        fixedStClassification != null && fixedAcClassification != null)
    {
        Console.WriteLine("🚀 使用服务层创建代码分类和预分配编码...");
        
        // 为3层结构创建代码分类（会自动预分配00-99编码）
        var codeClassificationsToCreate = new[]
        {
            new { ModelClassificationId = fixedSluClassification.Id, Code = "1", Name = "1-内层板类型1" },
            new { ModelClassificationId = fixedSluClassification.Id, Code = "2", Name = "2-内层板类型2" },
            new { ModelClassificationId = fixedSluClassification.Id, Code = "3", Name = "3-内层板类型3" },
            
            new { ModelClassificationId = fixedSlurClassification.Id, Code = "1", Name = "1-内层板类型1" },
            new { ModelClassificationId = fixedSlurClassification.Id, Code = "2", Name = "2-内层板类型2" },
            new { ModelClassificationId = fixedSlurClassification.Id, Code = "3", Name = "3-内层板类型3" },
            
            new { ModelClassificationId = fixedSbClassification.Id, Code = "1", Name = "1-单板类型1" },
            new { ModelClassificationId = fixedSbClassification.Id, Code = "2", Name = "2-单板类型2" },
            new { ModelClassificationId = fixedSbClassification.Id, Code = "3", Name = "3-单板类型3" },
            
            new { ModelClassificationId = fixedStClassification.Id, Code = "1", Name = "1-载盘类型1" },
            new { ModelClassificationId = fixedStClassification.Id, Code = "2", Name = "2-载盘类型2" },
            new { ModelClassificationId = fixedStClassification.Id, Code = "3", Name = "3-载盘类型3" }
        };
        
        foreach (var codeClassToCreate in codeClassificationsToCreate)
        {
            var createDto = new CreateCodeClassificationDto
            {
                Code = codeClassToCreate.Code,
                Name = codeClassToCreate.Name,
                ModelClassificationId = codeClassToCreate.ModelClassificationId
            };
            
            var result = await codeClassificationService.CreateAsync(createDto);
            if (result.Success)
            {
                Console.WriteLine($"✅ 已创建代码分类: {codeClassToCreate.Name} (自动预分配了100个编码)");
            }
            else
            {
                Console.WriteLine($"❌ 创建代码分类失败: {codeClassToCreate.Name} - {result.Message}");
            }
        }
        
        // 获取客户和厂区映射（提前声明）
        var customers = await dbContext.DataDictionaries.Where(dd => dd.Category == "Customer").ToListAsync();
        var factories = await dbContext.DataDictionaries.Where(dd => dd.Category == "Factory").ToListAsync();
        var customerMap = customers.ToDictionary(c => c.Name, c => (int?)c.Id);
        var factoryMap = factories.ToDictionary(f => f.Name, f => (int?)f.Id);
        
        // 获取代码分类ID映射
        var sluCodeClass1 = await dbContext.CodeClassifications.FirstOrDefaultAsync(cc => cc.Code == "1" && cc.ModelClassification.Type == "SLU");
        var sluCodeClass2 = await dbContext.CodeClassifications.FirstOrDefaultAsync(cc => cc.Code == "2" && cc.ModelClassification.Type == "SLU");
        var sluCodeClass3 = await dbContext.CodeClassifications.FirstOrDefaultAsync(cc => cc.Code == "3" && cc.ModelClassification.Type == "SLU");
        
        // 为AC（2层结构）创建跨年份的使用记录，包含软删除数据
        Console.WriteLine("📝 为2层结构AC创建跨年份使用记录（包含软删除）...");
        
        // AC测试数据（跨越2022-2025年）
        var acTestRecords = new[]
        {
            // 2022年的历史数据
            new { NumberPart = "10", ProductName = "自动化控制板A", OccupancyType = "PLANNING", Builder = "张工程师", Customer = "华为", Factory = "华为深圳厂", Year = 2022, Month = 3, Day = 15, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "15", ProductName = "自动化控制板B", OccupancyType = "WORK_ORDER", Builder = "李工程师", Customer = "小米", Factory = "小米重庆厂", Year = 2022, Month = 6, Day = 20, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "20", ProductName = "自动化控制板C", OccupancyType = "PAUSE", Builder = "王工程师", Customer = "OPPO", Factory = "华为深圳厂", Year = 2022, Month = 9, Day = 10, WillDelete = true, DeleteReason = "项目取消，停用该控制板" },
            
            // 2023年的数据
            new { NumberPart = "25", ProductName = "控制系统主板A", OccupancyType = "WORK_ORDER", Builder = "陈工程师", Customer = "苹果", Factory = "苹果观澜厂", Year = 2023, Month = 1, Day = 12, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "30", ProductName = "控制系统主板B", OccupancyType = "PLANNING", Builder = "刘工程师", Customer = "联想", Factory = "迅得昆山厂", Year = 2023, Month = 4, Day = 8, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "35", ProductName = "控制系统主板C", OccupancyType = "WORK_ORDER", Builder = "周工程师", Customer = "三星", Factory = "小米昆山厂", Year = 2023, Month = 8, Day = 3, WillDelete = true, DeleteReason = "技术升级，旧版本停用" },
            new { NumberPart = "40", ProductName = "控制系统主板D", OccupancyType = "PAUSE", Builder = "吴工程师", Customer = "vivo", Factory = "苹果龙华厂", Year = 2023, Month = 11, Day = 22, WillDelete = false, DeleteReason = "" },
            
            // 2024年的数据
            new { NumberPart = "45", ProductName = "新型控制板A", OccupancyType = "PLANNING", Builder = "徐工程师", Customer = "迅得", Factory = "迅得东莞厂", Year = 2024, Month = 2, Day = 18, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "50", ProductName = "新型控制板B", OccupancyType = "WORK_ORDER", Builder = "孙工程师", Customer = "华为", Factory = "华为深圳厂", Year = 2024, Month = 5, Day = 25, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "55", ProductName = "新型控制板C", OccupancyType = "PLANNING", Builder = "朱工程师", Customer = "惠普", Factory = "苹果观澜厂", Year = 2024, Month = 8, Day = 10, WillDelete = true, DeleteReason = "客户需求变更，停用该型号" },
            new { NumberPart = "60", ProductName = "新型控制板D", OccupancyType = "WORK_ORDER", Builder = "马工程师", Customer = "戴尔", Factory = "迅得昆山厂", Year = 2024, Month = 11, Day = 15, WillDelete = false, DeleteReason = "" },
            
            // 2025年的数据
            new { NumberPart = "65", ProductName = "最新控制板A", OccupancyType = "PLANNING", Builder = "高工程师", Customer = "联想", Factory = "小米昆山厂", Year = 2025, Month = 1, Day = 8, WillDelete = false, DeleteReason = "" },
            new { NumberPart = "70", ProductName = "最新控制板B", OccupancyType = "WORK_ORDER", Builder = "林工程师", Customer = "OPPO", Factory = "华为松山湖厂", Year = 2025, Month = 3, Day = 12, WillDelete = false, DeleteReason = "" }
        };
        
        foreach (var record in acTestRecords)
        {
            var creationDate = new DateTime(record.Year, record.Month, record.Day);
            var createDto = new CreateManualCodeDto
            {
                ModelClassificationId = fixedAcClassification.Id,
                NumberPart = record.NumberPart,
                Extension = null,
                ProductName = record.ProductName,
                Description = $"{record.ProductName}的详细说明",
                OccupancyType = record.OccupancyType,
                Builder = record.Builder,
                Requester = "系统管理员",
                CreationDate = DateOnly.FromDateTime(creationDate)
            };
            
            var result = await codeUsageService.CreateManualCodeAsync(createDto);
            if (result.Success)
            {
                Console.WriteLine($"✅ 已创建AC使用记录: AC{record.NumberPart} - {record.ProductName} ({record.Year}年{record.Month}月)");
                
                // 如果标记为需要删除，则执行软删除
                if (record.WillDelete)
                {
                    var deleteResult = await codeUsageService.SoftDeleteAsync(result.Data.Id, record.DeleteReason);
                    if (deleteResult.Success)
                    {
                        Console.WriteLine($"🗑️ 已软删除AC记录: AC{record.NumberPart} - 原因: {record.DeleteReason}");
                }
                else
                {
                        Console.WriteLine($"❌ 软删除AC记录失败: AC{record.NumberPart} - {deleteResult.Message}");
                    }
                }
            }
            else
            {
                Console.WriteLine($"❌ 创建AC使用记录失败: AC{record.NumberPart} - {result.Message}");
            }
        }
        
        Console.WriteLine("✅ 代码分类和预分配编码初始化完成");
    }
    else
    {
        Console.WriteLine("⚠️ 机型分类数据缺失，跳过代码分类和编码初始化");
    }
}
