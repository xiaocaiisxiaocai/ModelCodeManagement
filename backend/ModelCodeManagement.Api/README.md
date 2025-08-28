# 机型编码管理系统 - 后端API

## 项目概述

本项目是一个完整的企业级机型编码管理系统后端API，基于.NET 8和SqlSugar ORM构建，实现了完整的多层级组织架构和RBAC权限管理系统。

## 技术栈

- **.NET 8.0** - 主框架
- **SqlSugar** - ORM框架
- **MySQL** - 数据库
- **JWT** - 身份认证
- **BCrypt** - 密码加密
- **Swagger** - API文档

## 核心功能

### 1. 身份认证系统
- JWT Token认证
- Refresh Token机制
- 密码BCrypt加密
- 登录/登出/密码修改

### 2. 多层级组织架构
- 无限层级组织树结构
- 路径式层级管理 (`/1/3/5/`)
- 组织移动和重命名
- 自动路径更新

### 3. RBAC权限管理
- **5个核心实体**：用户(User)、角色(Role)、权限(Permission)、用户角色(UserRole)、角色权限(RolePermission)
- **3种权限类型**：菜单(Menu)、操作(Action)、API(Api)
- **权限继承**：支持父子权限关系
- **系统角色**：SuperAdmin、Admin、User

### 4. 编码管理
- 产品类型管理
- 机型分类管理
- 代码分类管理
- 编码使用记录
- 预分配日志

### 5. 系统管理
- 系统配置管理
- 数据字典管理
- 用户管理
- 权限控制

## 项目结构

```
ModelCodeManagement.Api/
├── Controllers/           # API控制器
│   ├── AuthController.cs          # 身份认证
│   ├── UserController.cs          # 用户管理
│   ├── OrganizationController.cs  # 组织架构
│   ├── RoleController.cs          # 角色管理
│   ├── PermissionController.cs    # 权限管理
│   ├── ProductTypeController.cs   # 产品类型
│   ├── ModelClassificationController.cs # 机型分类
│   ├── CodeClassificationController.cs  # 代码分类
│   ├── CodeUsageController.cs     # 编码使用
│   ├── SystemConfigController.cs  # 系统配置
│   └── DataDictionaryController.cs # 数据字典
├── DTOs/                 # 数据传输对象
├── Entities/             # 实体模型
├── Extensions/           # 扩展方法
├── Middleware/           # 中间件
├── Models/               # 数据模型
├── Services/             # 业务服务
│   ├── Impl/            # 服务实现
│   └── Interfaces/      # 服务接口
└── Program.cs           # 应用程序入口
```

## 数据库设计

### 核心表结构

1. **Users** - 用户表
2. **Organizations** - 组织架构表
3. **Roles** - 角色表  
4. **Permissions** - 权限表
5. **UserRoles** - 用户角色关联表
6. **RolePermissions** - 角色权限关联表
7. **ProductTypes** - 产品类型表
8. **ModelClassifications** - 机型分类表
9. **CodeClassifications** - 代码分类表
10. **CodeUsageEntries** - 编码使用记录表
11. **SystemConfigs** - 系统配置表
12. **DataDictionaries** - 数据字典表
13. **RefreshTokens** - 刷新令牌表

## API接口

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh-token` - 刷新Token
- `POST /api/v1/auth/logout` - 用户登出

### 用户管理
- `GET /api/v1/user` - 获取用户列表
- `GET /api/v1/user/profile` - 获取当前用户信息
- `POST /api/v1/user` - 创建用户
- `PUT /api/v1/user/{id}` - 更新用户
- `DELETE /api/v1/user/{id}` - 删除用户

### 组织架构
- `GET /api/v1/organization/tree` - 获取组织树
- `POST /api/v1/organization` - 创建组织
- `PUT /api/v1/organization/{id}` - 更新组织
- `DELETE /api/v1/organization/{id}` - 删除组织

### 权限管理
- `GET /api/v1/permission/tree` - 获取权限树
- `GET /api/v1/role` - 获取角色列表
- `POST /api/v1/role` - 创建角色
- `POST /api/v1/role/{id}/permissions` - 分配角色权限

## 运行环境

### 前置条件
- .NET 8.0 SDK
- MySQL 8.0+
- Visual Studio 2022 或 VS Code

### 配置文件
在 `appsettings.json` 中配置：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ModelCodeManagement;Uid=root;Pwd=your_password;CharSet=utf8mb4;"
  },
  "Jwt": {
    "Key": "your-super-secret-key-here-must-be-at-least-32-characters",
    "Issuer": "ModelCodeManagement",
    "Audience": "ModelCodeManagement",
    "AccessTokenExpirationMinutes": 30,
    "RefreshTokenExpirationDays": 7
  }
}
```

### 运行步骤

1. **克隆项目**
   ```bash
   cd D:\Code\机型编码管理系统\backend\ModelCodeManagement.Api\ModelCodeManagement.Api
   ```

2. **还原依赖**
   ```bash
   dotnet restore
   ```

3. **编译项目**
   ```bash
   dotnet build
   ```

4. **运行项目**
   ```bash
   dotnet run
   ```

5. **访问Swagger文档**
   ```
   http://localhost:5000/swagger
   ```

## 初始化数据

系统首次运行时会自动创建：

### 默认管理员账户
- **工号**: admin
- **密码**: admin123
- **角色**: 超级管理员

### 组织架构
- 集团公司
  - 信息技术部
  - 生产部
  - 质量部

### 系统角色
- **SUPER_ADMIN** - 超级管理员（所有权限）
- **ADMIN** - 系统管理员（管理权限）
- **USER** - 普通用户（基本权限）

### 权限体系
- 系统管理
  - 组织架构管理
  - 角色权限管理
  - 用户管理
- 编码管理
  - 编码查看
  - 编码创建

## 测试

使用提供的 `test_api.http` 文件进行API测试：

1. 先调用登录接口获取Token
2. 使用Token访问需要认证的接口
3. 测试各种权限级别的接口

## 安全特性

- JWT Token认证
- 基于角色的访问控制(RBAC)
- 密码BCrypt加密
- Token过期验证
- API权限验证
- 输入数据验证

## 开发状态

✅ **已完成功能**
- 完整的身份认证系统
- 多层级组织架构管理
- RBAC权限管理体系
- 编码管理核心功能
- 数据字典管理
- 系统配置管理
- API接口和文档
- 数据库自动初始化

🚀 **系统已可用于生产环境**

## 维护说明

- 定期更新依赖包
- 监控数据库性能
- 定期备份数据库
- 检查安全更新