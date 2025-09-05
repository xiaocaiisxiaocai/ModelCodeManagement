// ProtectedRoute.tsx - 路由权限保护组件
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
type UserRole = 'user' | 'admin' | 'superadmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  requireAnyPermission?: boolean; // true: 任一权限即可, false: 需要所有权限
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  requireAnyPermission = false,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading, user, hasPermission, hasAnyPermission, hasRole } = useAuth();
  const location = useLocation();

  // 正在加载认证状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证身份中...</p>
        </div>
      </div>
    );
  }

  // 需要认证但未登录
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 检查功能权限
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requireAnyPermission
      ? hasAnyPermission(requiredPermissions)
      : requiredPermissions.every(permission => hasPermission(permission));
    
    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  return <>{children}</>;
};

export default ProtectedRoute;