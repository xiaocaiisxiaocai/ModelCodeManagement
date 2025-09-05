import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// 懒加载页面组件
const ProductTypePage = React.lazy(() => import('../pages/ProductTypePage'));
const ModelClassificationPage = React.lazy(() => import('../pages/ModelClassificationPage'));
const CodeClassificationPage = React.lazy(() => import('../pages/CodeClassificationPage'));
const CodeUsagePage = React.lazy(() => import('../pages/CodeUsagePage'));
const WarRoomPage = React.lazy(() => import('../pages/WarRoomPage'));
const DataDictionaryPage = React.lazy(() => import('../pages/DataDictionaryPage'));
const LoginPage = React.lazy(() => import('../pages/LoginPage'));
const UnauthorizedPage = React.lazy(() => import('../pages/UnauthorizedPage'));
const UserManagementPage = React.lazy(() => import('../pages/admin/UserManagementPage'));
const RoleManagementPage = React.lazy(() => import('../pages/admin/RoleManagementPage'));
// Enhanced 组件已清理，使用标准组件
const PermissionManagementPage = React.lazy(() => import('../pages/admin/PermissionManagementPage'));
const DepartmentManagementPage = React.lazy(() => import('../pages/admin/DepartmentManagementPage'));
const AuditLogManagementPage = React.lazy(() => import('../pages/admin/AuditLogManagementPage'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const RBACDemo = React.lazy(() => import('../pages/admin/RBACDemo'));
// 调试组件已清理

// 页面加载器组件
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="flex flex-col items-center">
      <img src="/SAA.png" alt="Loading Logo" className="h-12 mb-4" />
      <div className="flex items-center space-x-2">
        <div className="i-carbon-circle-dash text-2xl text-blue-600 animate-spin" />
        <span className="text-gray-600">页面加载中...</span>
      </div>
    </div>
  </div>
);

// 包装组件：为懒加载组件提供 Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
};

// 创建路由配置
export const router = createBrowserRouter([
  // 公开路由
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/unauthorized',
    element: withSuspense(UnauthorizedPage),
  },

  // 受保护的路由 - 战情中心为首页
  {
    path: '/',
    element: (
      <ProtectedRoute>
        {withSuspense(WarRoomPage)}
      </ProtectedRoute>
    ),
  },
  
  // 编码管理模块路由
  {
    path: '/coding',
    element: (
      <ProtectedRoute>
        {withSuspense(ProductTypePage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/coding/model-classification/:productType',
    element: (
      <ProtectedRoute>
        {withSuspense(ModelClassificationPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/coding/code-classification/:productType/:modelType',
    element: (
      <ProtectedRoute>
        {withSuspense(CodeClassificationPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/coding/code-usage/:productType/:modelType/:codeNumber',
    element: (
      <ProtectedRoute>
        {withSuspense(CodeUsagePage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/coding/direct-code-usage/:productType/:modelType',
    element: (
      <ProtectedRoute>
        {withSuspense(CodeUsagePage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/data-dictionary',
    element: (
      <ProtectedRoute>
        {withSuspense(DataDictionaryPage)}
      </ProtectedRoute>
    ),
  },

  // 管理员路由 - 基于RBAC权限
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute requiredPermissions={['USER_MANAGE']}>
        {withSuspense(UserManagementPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/roles',
    element: (
      <ProtectedRoute requiredPermissions={['ROLE_MANAGE']}>
        {withSuspense(RoleManagementPage)}
      </ProtectedRoute>
    ),
  },
  // Enhanced 路由已清理，使用标准路由
  {
    path: '/admin/permissions',
    element: (
      <ProtectedRoute requiredPermissions={['ROLE_MANAGE']}>
        {withSuspense(PermissionManagementPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/departments',
    element: (
      <ProtectedRoute requiredPermissions={['ORG_MANAGE']}>
        {withSuspense(DepartmentManagementPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/audit-logs',
    element: (
      <ProtectedRoute requiredPermissions={['AUDIT_LOG_VIEW']}>
        {withSuspense(AuditLogManagementPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        {withSuspense(ProfilePage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/rbac-demo',
    element: (
      <ProtectedRoute requiredPermissions={['USER_MANAGE']}>
        {withSuspense(RBACDemo)}
      </ProtectedRoute>
    ),
  },
  // 调试路由已清理

  // 重定向未匹配的路径到首页
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  // 启用 React Router v7 Future Flags
  future: {
    // 在 v7 中，相对路径解析将在 Splat 路由内改变
    v7_relativeSplatPath: true,
  },
});