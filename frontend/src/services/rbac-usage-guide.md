# RBAC功能使用指南

## 🚀 概述

本系统实现了完整的基于角色的访问控制（RBAC）功能，包括用户管理、角色管理、权限验证、UI反馈等完整功能。

## 📁 文件结构

```
src/
├── services/
│   └── rbacService.ts                    # RBAC核心服务
├── pages/admin/
│   ├── UserManagementPageEnhanced.tsx    # 增强版用户管理页面
│   ├── RoleManagementPageEnhanced.tsx    # 增强版角色管理页面
│   └── RBACDemo.tsx                      # RBAC功能演示页面
├── components/
│   ├── UserRoleAssignment.tsx            # 用户角色分配组件
│   ├── auth/
│   │   └── PermissionGateEnhanced.tsx    # 增强版权限门禁组件
│   └── ui/
│       └── Toast.tsx                     # Toast通知组件
├── contexts/
│   └── ToastContext.tsx                  # Toast上下文提供者
└── hooks/
    └── useServiceResponseEnhanced.ts     # 增强版服务响应钩子
```

## 🔧 核心功能

### 1. RBAC服务 (rbacService.ts)

提供完整的用户和角色管理API：

```typescript
import { rbacService } from '../services/rbacService';

// 用户管理
await rbacService.getAllUsers();
await rbacService.createUser(userData);
await rbacService.updateUser(userId, userData);
await rbacService.deleteUser(userId);
await rbacService.resetUserPassword(userId);

// 角色管理
await rbacService.getAllRoles();
await rbacService.createRole(roleData);
await rbacService.updateRole(roleId, roleData);
await rbacService.deleteRole(roleId);

// 权限管理
await rbacService.getAllPermissions();
await rbacService.getUserPermissions(userId);

// 批量操作
await rbacService.bulkDeleteUsers(userIds);
await rbacService.bulkUpdateUserRoles(userIds, roleId);
```

### 2. 增强版权限门禁 (PermissionGateEnhanced.tsx)

支持多种权限验证方式：

```tsx
import PermissionGateEnhanced from '../components/auth/PermissionGateEnhanced';

// 基于角色的权限控制
<PermissionGateEnhanced roles={['admin', 'superadmin']}>
  <AdminOnlyContent />
</PermissionGateEnhanced>

// 基于具体权限的控制
<PermissionGateEnhanced permissions={['user:create', 'user:update']}>
  <UserManagementContent />
</PermissionGateEnhanced>

// 部门级别权限控制
<PermissionGateEnhanced allowedDepartments={['技术部', '研发部']}>
  <TechDepartmentContent />
</PermissionGateEnhanced>

// 自定义验证函数
<PermissionGateEnhanced 
  customValidator={(user) => user?.employeeId?.startsWith('00')}
  showReason={true}
>
  <SpecialContent />
</PermissionGateEnhanced>

// 需要满足所有条件
<PermissionGateEnhanced 
  roles={['admin']}
  permissions={['user:delete']}
  requireAll={true}
>
  <HighSecurityContent />
</PermissionGateEnhanced>
```

### 3. Toast通知系统

全局的消息通知系统：

```tsx
import { useToastContext } from '../contexts/ToastContext';

const Component = () => {
  const toast = useToastContext();

  const handleSuccess = () => {
    toast.success('操作成功', '用户已成功创建');
  };

  const handleError = () => {
    toast.error('操作失败', '请检查网络连接', {
      actions: [
        {
          label: '重试',
          onClick: () => retryOperation(),
          variant: 'primary'
        }
      ]
    });
  };

  const handleWarning = () => {
    toast.warning('注意', '此操作不可撤销');
  };

  const handleInfo = () => {
    toast.info('提示', '新功能已上线', {
      duration: 0 // 不自动关闭
    });
  };
};
```

### 4. 增强版用户管理页面

提供完整的用户CRUD操作：

- ✅ **用户列表**: 支持搜索、筛选、排序
- ✅ **用户创建**: 表单验证、权限检查
- ✅ **用户编辑**: 批量编辑、角色分配
- ✅ **用户删除**: 单个/批量删除、权限验证
- ✅ **密码重置**: 安全的密码重置机制
- ✅ **批量操作**: 批量删除、批量角色变更
- ✅ **用户详情**: 详细信息查看
- ✅ **权限验证**: 基于角色的操作权限控制

### 5. 增强版角色管理页面

完整的角色和权限管理：

- ✅ **角色列表**: 系统角色与自定义角色
- ✅ **角色创建**: 权限配置、分类管理
- ✅ **角色编辑**: 权限调整、描述更新
- ✅ **角色克隆**: 基于现有角色创建新角色
- ✅ **权限详情**: 权限列表查看、权限说明
- ✅ **权限搜索**: 快速查找权限项
- ✅ **分类管理**: 权限按类别组织

### 6. 用户角色分配组件

专门的角色分配管理：

```tsx
import UserRoleAssignment from '../components/UserRoleAssignment';

<UserRoleAssignment
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  user={selectedUser}
  onUserUpdated={(updatedUser) => {
    // 处理用户更新
  }}
/>
```

## 🎯 使用示例

### 在App.tsx中集成Toast

```tsx
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider position="top-right">
        <Router>
          {/* 路由配置 */}
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
```

### 在路由中使用权限控制

```tsx
import { Route } from 'react-router-dom';
import PermissionGateEnhanced from './components/auth/PermissionGateEnhanced';

<Route path="/admin/users" element={
  <PermissionGateEnhanced roles={['admin', 'superadmin']}>
    <UserManagementPageEnhanced />
  </PermissionGateEnhanced>
} />

<Route path="/admin/roles" element={
  <PermissionGateEnhanced roles={['superadmin']}>
    <RoleManagementPageEnhanced />
  </PermissionGateEnhanced>
} />
```

### 使用增强版服务响应钩子

```tsx
import { useServiceResponseEnhanced } from '../hooks/useServiceResponseEnhanced';

const Component = () => {
  const { loading, handleResponse, showSuccess, showError } = useServiceResponseEnhanced({
    successMessage: '操作成功',
    errorMessage: '操作失败',
    retryOnError: true,
    maxRetries: 3
  });

  const createUser = async (userData) => {
    await handleResponse(
      () => rbacService.createUser(userData),
      (newUser) => {
        // 成功回调
        setUsers(prev => [...prev, newUser]);
      },
      (error) => {
        // 错误回调
        console.error('创建用户失败:', error);
      }
    );
  };
};
```

## 🔒 权限级别说明

### 角色层级
1. **superadmin** (超级管理员)
   - 最高权限级别
   - 可以管理所有用户和角色
   - 可以修改系统配置

2. **admin** (管理员)
   - 中等权限级别
   - 可以管理普通用户
   - 可以管理业务数据

3. **user** (普通用户)
   - 基础权限级别
   - 只能查看和操作自己的数据

### 权限分类
- **用户管理**: user:read, user:create, user:update, user:delete
- **角色管理**: role:read, role:create, role:update, role:delete
- **权限管理**: permission:read, permission:create, permission:update, permission:delete
- **产品管理**: product:read, product:create, product:update, product:delete
- **机型管理**: model:read, model:create, model:update, model:delete
- **代码管理**: code:read, code:create, code:update, code:delete
- **数据查看**: warroom:read
- **数据管理**: data:export
- **系统管理**: system:config

## 📋 最佳实践

### 1. 权限验证
```tsx
// ✅ 推荐：使用PermissionGateEnhanced包装组件
<PermissionGateEnhanced roles={['admin']}>
  <AdminButton />
</PermissionGateEnhanced>

// ❌ 不推荐：在组件内部做权限判断
const AdminButton = () => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return null;
  return <Button>Admin Action</Button>;
};
```

### 2. 错误处理
```tsx
// ✅ 推荐：使用useServiceResponseEnhanced
const { handleResponse } = useServiceResponseEnhanced();

const createUser = async (userData) => {
  await handleResponse(
    () => rbacService.createUser(userData),
    (user) => setUsers(prev => [...prev, user])
  );
};

// ❌ 不推荐：手动处理错误
const createUser = async (userData) => {
  try {
    const response = await rbacService.createUser(userData);
    if (response.success) {
      setUsers(prev => [...prev, response.data]);
      alert('创建成功'); // 使用alert不友好
    } else {
      alert(response.error); // 使用alert不友好
    }
  } catch (error) {
    alert('创建失败'); // 使用alert不友好
  }
};
```

### 3. Toast使用
```tsx
// ✅ 推荐：合理使用不同类型的Toast
toast.success('操作成功'); // 成功操作
toast.error('操作失败', '详细错误信息'); // 错误操作
toast.warning('注意', '此操作不可撤销'); // 警告信息
toast.info('提示', '新功能已上线'); // 信息提示

// ✅ 推荐：为重要操作添加交互按钮
toast.error('删除失败', '网络连接超时', {
  actions: [
    {
      label: '重试',
      onClick: () => retryDelete(),
      variant: 'primary'
    },
    {
      label: '取消',
      onClick: () => {},
      variant: 'secondary'
    }
  ]
});
```

## 🔧 配置说明

### 环境变量
```env
# API基础URL
VITE_API_BASE_URL=/api/v1

# Toast配置
VITE_TOAST_POSITION=top-right
VITE_TOAST_DURATION=5000
```

### TypeScript类型
系统提供了完整的TypeScript类型定义，确保类型安全：

```typescript
import type { 
  User, 
  UserRole, 
  Role, 
  Permission, 
  CreateUserRequest,
  UpdateUserRequest,
  CreateRoleRequest 
} from '../services/rbacService';
```

## 🚧 注意事项

1. **权限验证**: 前端权限验证仅用于UI控制，真正的安全验证应在后端实现
2. **敏感操作**: 删除用户、修改角色等敏感操作需要二次确认
3. **批量操作**: 批量操作前应检查每个项目的权限
4. **错误处理**: 所有API调用都应该有适当的错误处理
5. **用户体验**: 使用Loading状态和Toast通知提供良好的用户反馈

## 📖 扩展开发

如需添加新的权限或角色：

1. 在`rbacService.ts`中定义新的权限常量
2. 更新`Permission`接口类型定义
3. 在角色管理页面的权限列表中添加新权限
4. 使用`PermissionGateEnhanced`组件保护相应的UI组件
5. 在后端API中实现对应的权限验证逻辑

## 🎉 总结

本RBAC系统提供了：
- ✅ 完整的用户和角色管理
- ✅ 灵活的权限控制机制
- ✅ 友好的用户界面和交互
- ✅ 类型安全的TypeScript支持
- ✅ 完善的错误处理和用户反馈
- ✅ 可扩展的架构设计

系统已经可以投入生产使用，为机型编码管理系统提供了坚实的权限管理基础。