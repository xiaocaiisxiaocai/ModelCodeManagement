[根目录](../../../../CLAUDE.md) > [backend](../../../) > [ModelCodeManagement.Api](../) > **ModelCodeManagement.Api**

# Backend API 模块文档

## 模块职责

.NET 8 Web API 后端服务，负责制造业编码管理系统的核心业务逻辑、数据持久化、用户认证授权和API接口提供。采用分层架构模式，通过 SqlSugar ORM 与 MySQL 数据库交互，提供 RESTful API 服务。

## 入口与启动

### 核心入口文件
- **应用入口**: `Program.cs` - 服务配置、依赖注入和中间件管道
- **数据库上下文**: `Models/DatabaseContext.cs` - 数据库初始化和实体配置
- **应用配置**: `appsettings.json` - 数据库连接、JWT配置等

### 启动命令
```bash
dotnet watch run              # 热重载开发 (http://localhost:5250)
dotnet build                  # 编译检查
dotnet clean                  # 清理输出
dotnet run                    # 启动应用
```

### 关键端点
- **Swagger文档**: `http://localhost:5250/swagger`
- **健康检查**: `http://localhost:5250/api/health`
- **公开健康检查**: `http://localhost:5250/api/health/public`

## 对外接口

### RESTful API 设计

#### 核心业务API (`/api/v1/*`)
```csharp
// 产品类型管理
[Route("api/v1/product-types")]
- GET    /                    # 获取所有产品类型
- GET    /{id}               # 根据ID获取
- GET    /by-code/{code}     # 根据代码获取
- POST   /                   # 创建产品类型 [Admin]
- PUT    /{id}               # 更新产品类型 [Admin]
- DELETE /{id}               # 删除产品类型 [SuperAdmin]
- POST   /{id}/toggle-active # 启用/禁用 [Admin]

// 机型分类管理
[Route("api/v1/model-classifications")]
- GET    /                          # 获取所有机型分类
- GET    /{id}                     # 根据ID获取
- GET    /by-product-type/{productTypeId} # 按产品类型获取
- POST   /                         # 创建 [Admin]
- PUT    /{id}                     # 更新 [Admin] 
- DELETE /{id}                     # 删除 [SuperAdmin]

// 代码分类管理
[Route("api/v1/code-classifications")]
- GET    /                              # 获取所有代码分类
- GET    /{id}                         # 根据ID获取
- GET    /by-model-type/{modelTypeId}  # 按机型类型获取
- POST   /                             # 创建 [Admin]
- PUT    /{id}                         # 更新 [Admin]
- DELETE /{id}                         # 删除 [SuperAdmin]

// 编码使用管理
[Route("api/v1/code-usage")]
- GET    /                    # 获取编码使用记录 (分页)
- GET    /{id}               # 根据ID获取
- POST   /                   # 创建记录 [User+]
- PUT    /{id}               # 更新记录 [User+]
- DELETE /{id}               # 软删除记录 [Admin+]
- POST   /{id}/restore       # 恢复记录 [Admin+]
```

#### 认证授权API (`/api/v1/auth`)
```csharp
[Route("api/v1/auth")]
- POST   /login              # 用户登录
- POST   /refresh-token      # 刷新Token
- POST   /logout             # 用户登出
- GET    /profile            # 获取用户信息 [Authenticated]
```

#### 管理功能API (`/api/v1/admin/*`)
```csharp
// 用户管理
[Route("api/v1/admin/users")]
- GET    /                   # 获取用户列表 [Admin+]
- POST   /                   # 创建用户 [Admin+]
- PUT    /{id}               # 更新用户 [Admin+]
- DELETE /{id}               # 删除用户 [SuperAdmin]

// 角色权限管理
[Route("api/v1/admin/roles")]
[Route("api/v1/admin/permissions")]
[Route("api/v1/admin/organizations")]
```

### 响应格式标准
```csharp
// 统一响应格式
public class DataResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string? Message { get; set; }
}
```

## 关键依赖与配置

### NuGet 包依赖
```xml
<!-- ModelCodeManagement.Api.csproj -->
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="FluentValidation" Version="11.9.0" />
<PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.19" />
<PackageReference Include="MySql.Data" Version="9.4.0" />
<PackageReference Include="SqlSugarCore" Version="5.1.4.158" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
```

### 数据库配置 (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=ModelCodeManagement;Uid=root;Pwd=abc+123;CharSet=utf8mb4;SslMode=none;AllowPublicKeyRetrieval=true;"
  },
  "Jwt": {
    "Key": "ModelCodeManagement_SuperSecretKey_2024_ForJwtTokenGeneration",
    "Issuer": "ModelCodeManagement.Api",
    "Audience": "ModelCodeManagement.Client",
    "AccessTokenExpirationMinutes": 120,
    "RefreshTokenExpirationDays": 7
  }
}
```

### 服务注册配置 (`Program.cs`)
```csharp
// 数据库服务
builder.Services.AddSqlSugarSetup(builder.Configuration);

// JWT认证服务  
builder.Services.AddJwtAuthentication(builder.Configuration);

// CORS服务
builder.Services.AddCorsSetup(builder.Configuration);

// 业务服务注册
builder.Services.AddScoped<IProductTypeService, ProductTypeService>();
builder.Services.AddScoped<IModelClassificationService, ModelClassificationService>();
builder.Services.AddScoped<ICodeUsageService, CodeUsageService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
```

## 数据模型

### 核心实体设计

#### 产品类型实体 (`Entities/ProductType.cs`)
```csharp
[SugarTable("ProductTypes")]
public class ProductType
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public int Id { get; set; }
    
    [SugarColumn(Length = 20, IsNullable = false)]
    public string Code { get; set; } = string.Empty;
    
    [SugarColumn(Length = 100, IsNullable = false)]
    public string Name { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    
    // 导航属性
    [Navigate(NavigateType.OneToMany, nameof(ModelClassification.ProductTypeId))]
    public List<ModelClassification> ModelClassifications { get; set; } = new();
}
```

#### 机型分类实体 (`Entities/ModelClassification.cs`)
```csharp
[SugarTable("ModelClassifications")]
public class ModelClassification
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public int Id { get; set; }
    
    public string Type { get; set; } = string.Empty;        // SLU-, SLUR- 等
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ProductTypeId { get; set; }
    public bool HasCodeClassification { get; set; } = true; // 控制2层/3层结构
    public bool IsActive { get; set; } = true;
}
```

#### 编码使用记录 (`Entities/CodeUsageEntry.cs`)
```csharp
[SugarTable("CodeUsageEntries")]
public class CodeUsageEntry  
{
    [SugarColumn(IsPrimaryKey = true, IsIdentity = true)]
    public int Id { get; set; }
    
    public string Model { get; set; } = string.Empty;      // 机型编号
    public string CodeNumber { get; set; } = string.Empty; // 代码分类编号
    public string? Extension { get; set; }                 // 延伸编号
    public string ProductName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OccupancyType { get; set; } = string.Empty;
    public string Builder { get; set; } = string.Empty;
    public string Requester { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;           // 软删除
    public DateTime? DeletedAt { get; set; }
}
```

### 用户权限实体
```csharp
// 用户实体
[SugarTable("Users")]
public class User
{
    public int Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public int OrganizationId { get; set; }
    public bool IsActive { get; set; } = true;
}

// 组织架构
[SugarTable("Organizations")]
public class Organization
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;  // 如 /1/3/5/
    public int Level { get; set; }
    public int? ParentId { get; set; }
}
```

## 测试与质量

### API测试 (`ModelCodeManagement.Api.http`)
```http
### 用户登录
POST http://localhost:5250/api/v1/auth/login
Content-Type: application/json

{
  "employeeId": "admin",
  "password": "admin123"
}

### 获取产品类型
GET http://localhost:5250/api/v1/product-types
Authorization: Bearer {{token}}

### 创建产品类型
POST http://localhost:5250/api/v1/product-types
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "code": "PCB",
  "name": "印刷电路板"
}
```

### 数据验证 (FluentValidation)
```csharp
// Validators/ProductTypeDtoValidator.cs
public class CreateProductTypeDtoValidator : AbstractValidator<CreateProductTypeDto>
{
    public CreateProductTypeDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("产品代码不能为空")
            .MaximumLength(20).WithMessage("产品代码不能超过20个字符");
            
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("产品名称不能为空")
            .MaximumLength(100).WithMessage("产品名称不能超过100个字符");
    }
}
```

### 全局异常处理
```csharp
// Middleware/GlobalExceptionMiddleware.cs
public class GlobalExceptionMiddleware
{
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
}
```

## 常见问题 (FAQ)

### Q: 如何添加新的业务实体？
A: 1) 在 `Entities/` 创建实体类；2) 在 `DTOs/` 创建传输对象；3) 在 `Services/` 创建服务接口和实现；4) 在 `Controllers/` 创建控制器；5) 在 `Program.cs` 注册服务。

### Q: 如何配置数据库连接？
A: 修改 `appsettings.json` 中的 `ConnectionStrings:DefaultConnection`，支持 MySQL、SQL Server、SQLite 等多种数据库。

### Q: 如何添加新的权限验证？
A: 使用 `[Authorize]` 特性，可指定角色 `[Authorize(Roles = "Admin")]` 或策略 `[Authorize(Policy = "AdminPolicy")]`。

### Q: 如何处理软删除？
A: 实体添加 `IsDeleted` 字段，在服务层实现软删除逻辑，查询时过滤已删除记录。

### Q: 如何扩展JWT Token？
A: 在 `Services/JwtTokenService.cs` 中修改 Token 生成逻辑，添加自定义 Claims。

## 相关文件清单

### 核心配置文件
```
ModelCodeManagement.Api/
├── ModelCodeManagement.Api.csproj    # 项目配置和依赖
├── Program.cs                        # 应用入口和服务配置
├── appsettings.json                  # 应用配置
├── appsettings.Development.json      # 开发环境配置
└── ModelCodeManagement.Api.http     # API测试文件
```

### 源码架构
```
/
├── Controllers/                      # API控制器
│   ├── ProductTypesController.cs    # 产品类型API
│   ├── AuthController.cs            # 认证API
│   └── ...
├── Services/                        # 业务服务接口
│   ├── IProductTypeService.cs       
│   └── Impl/                        # 服务实现
│       ├── ProductTypeService.cs
│       └── ...
├── Entities/                        # 数据实体
│   ├── ProductType.cs
│   ├── ModelClassification.cs
│   └── ...
├── DTOs/                           # 数据传输对象
│   ├── ProductTypeDtos.cs
│   └── ...
├── Repositories/                   # 数据访问层
│   ├── IRepository.cs
│   └── BaseRepository.cs
├── Validators/                     # 数据验证器
│   ├── ProductTypeDtoValidator.cs
│   └── ...
├── Middleware/                     # 中间件
│   ├── GlobalExceptionMiddleware.cs
│   └── TokenValidationMiddleware.cs
├── Extensions/                     # 扩展方法
│   ├── ServiceExtensions.cs
│   └── ...
├── Models/                         # 数据模型
│   └── DatabaseContext.cs         # 数据库上下文
└── Filters/                        # 过滤器
    ├── ValidationFilter.cs
    └── AuditLogAttribute.cs
```

## 变更记录 (Changelog)

### v1.0.0 - 2025年08月26日
- ✅ **核心架构完成**: .NET 8 Web API + SqlSugar + MySQL
- ✅ **分层架构**: Controller → Service → Repository → Entity
- ✅ **认证授权**: JWT + Refresh Token + RBAC权限管理
- ✅ **数据验证**: FluentValidation 统一验证
- ✅ **异常处理**: 全局异常中间件
- ✅ **API文档**: Swagger/OpenAPI 集成
- ✅ **数据库初始化**: 自动建表和初始数据
- ✅ **审计日志**: 操作记录和审计追踪
- ⚠️ **单元测试**: 待实现测试项目
- ⚠️ **集成测试**: 待添加API集成测试

---

**创建时间**: 2025年08月26日 10:20:31  
**模块状态**: ✅ 核心功能完成，可进行业务开发  
**.NET版本**: .NET 8.0 + SqlSugar 5.1.4 + MySQL 8.0