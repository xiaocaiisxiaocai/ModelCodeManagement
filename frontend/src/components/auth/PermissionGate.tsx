// PermissionGate.tsx - 权限门控组件
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types/domain';

type UserRole = 'user' | 'admin' | 'superadmin';

interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  requireAny?: boolean; // true: 任一权限即可, false: 需要所有权限 (别名)
  requireAnyPermission?: boolean; // true: 任一权限即可, false: 需要所有权限
  requireAuth?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  fallback = null,
  roles = [],
  permissions = [],
  requireAny = false,
  requireAnyPermission = false,
  requireAuth = true
}) => {
  const { isAuthenticated, user, hasPermission, hasAnyPermission, hasRole } = useAuth();

  // 需要认证但未登录
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // 检查角色权限 (基于后端的 UserRoles 系统)
  if (roles.length > 0 && user) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // 检查功能权限 (基于后端的 RolePermissions 系统)
  if (permissions.length > 0) {
    const useAnyPermissionCheck = requireAny || requireAnyPermission;
    const hasRequiredPermission = useAnyPermissionCheck
      ? hasAnyPermission(permissions)
      : permissions.every(permission => hasPermission(permission));
    
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// 便捷的权限检查Hook
export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission, hasRole, isAuthenticated, user } = useAuth();

  const checkAccess = (options: {
    roles?: UserRole[];
    permissions?: string[];
    requireAnyPermission?: boolean;
    requireAuth?: boolean;
  }) => {
    const {
      roles = [],
      permissions = [],
      requireAnyPermission = false,
      requireAuth = true
    } = options;

    // 需要认证但未登录
    if (requireAuth && !isAuthenticated) {
      return false;
    }

    // 检查角色权限
    if (roles.length > 0 && user) {
      const hasRequiredRole = roles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        return false;
      }
    }

    // 检查功能权限
    if (permissions.length > 0) {
      const hasRequiredPermission = requireAnyPermission
        ? hasAnyPermission(permissions)
        : permissions.every(permission => hasPermission(permission));
      
      if (!hasRequiredPermission) {
        return false;
      }
    }

    return true;
  };

  return { checkAccess };
};

export default PermissionGate;