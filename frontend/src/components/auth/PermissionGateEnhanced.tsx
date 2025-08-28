// PermissionGateEnhanced.tsx - 增强版权限门禁组件
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, CardBody, Badge, Modal, ModalFooter } from '../ui';
import type { UserRole } from '../../mock/interfaces';

interface PermissionGateEnhancedProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  requireAll?: boolean; // 是否需要满足所有权限/角色（默认为满足任一即可）
  fallback?: React.ReactNode;
  showReason?: boolean; // 是否显示权限不足的详细原因
  onAccessDenied?: (reason: string) => void; // 权限不足时的回调
  allowedDepartments?: string[]; // 允许的部门
  customValidator?: (user: any) => boolean; // 自定义验证函数
}

interface AccessDeniedInfo {
  type: 'role' | 'permission' | 'department' | 'custom';
  required: string[];
  current: string[];
  message: string;
}

const PermissionGateEnhanced: React.FC<PermissionGateEnhancedProps> = ({
  children,
  roles = [],
  permissions = [],
  requireAll = false,
  fallback,
  showReason = true,
  onAccessDenied,
  allowedDepartments = [],
  customValidator
}) => {
  const { user, isAuthenticated, hasRole, hasPermission, hasAnyPermission } = useAuth();
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessDeniedInfo, setAccessDeniedInfo] = useState<AccessDeniedInfo | null>(null);

  // 检查权限
  const checkAccess = (): { hasAccess: boolean; reason?: AccessDeniedInfo } => {
    if (!isAuthenticated || !user) {
      return {
        hasAccess: false,
        reason: {
          type: 'role',
          required: ['authenticated'],
          current: [],
          message: '请先登录系统'
        }
      };
    }

    // 检查角色权限
    if (roles.length > 0) {
      const hasRequiredRole = requireAll
        ? roles.every(role => hasRole(role))
        : roles.some(role => hasRole(role));

      if (!hasRequiredRole) {
        return {
          hasAccess: false,
          reason: {
            type: 'role',
            required: roles,
            current: [user.role],
            message: requireAll
              ? `需要同时拥有以下角色: ${roles.join(', ')}`
              : `需要以下任一角色: ${roles.join(', ')}`
          }
        };
      }
    }

    // 检查具体权限
    if (permissions.length > 0) {
      const hasRequiredPermission = requireAll
        ? permissions.every(permission => hasPermission(permission))
        : hasAnyPermission(permissions);

      if (!hasRequiredPermission) {
        return {
          hasAccess: false,
          reason: {
            type: 'permission',
            required: permissions,
            current: [], // 实际应用中应该从用户权限中获取
            message: requireAll
              ? `需要同时拥有以下权限: ${permissions.join(', ')}`
              : `需要以下任一权限: ${permissions.join(', ')}`
          }
        };
      }
    }

    // 检查部门权限
    if (allowedDepartments.length > 0 && user.department) {
      const hasDepartmentAccess = allowedDepartments.includes(user.department);
      if (!hasDepartmentAccess) {
        return {
          hasAccess: false,
          reason: {
            type: 'department',
            required: allowedDepartments,
            current: [user.department],
            message: `仅限以下部门访问: ${allowedDepartments.join(', ')}`
          }
        };
      }
    }

    // 自定义验证
    if (customValidator && !customValidator(user)) {
      return {
        hasAccess: false,
        reason: {
          type: 'custom',
          required: ['custom validation'],
          current: [],
          message: '不满足自定义访问条件'
        }
      };
    }

    return { hasAccess: true };
  };

  const { hasAccess, reason } = checkAccess();

  // 处理权限不足
  useEffect(() => {
    if (!hasAccess && reason) {
      setAccessDeniedInfo(reason);
      if (onAccessDenied) {
        onAccessDenied(reason.message);
      }
    }
  }, [hasAccess, reason, onAccessDenied]);

  // 如果有权限，直接渲染子组件
  if (hasAccess) {
    return <>{children}</>;
  }

  // 如果提供了fallback，使用fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // 默认的权限不足UI
  return (
    <Card className="p-8 text-center border-red-200 bg-red-50">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <span className="i-carbon-locked text-4xl text-red-500"></span>
        </div>
        
        <h3 className="text-lg font-medium text-red-800 mb-2">
          访问受限
        </h3>
        
        <p className="text-red-600 mb-4">
          {accessDeniedInfo?.message || '您没有权限访问此功能'}
        </p>

        {showReason && accessDeniedInfo && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccessModal(true)}
            className="text-red-600 border-red-300 hover:bg-red-100"
          >
            查看详细信息
          </Button>
        )}

        {/* 权限详情Modal */}
        <Modal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          title="权限不足详情"
        >
          {accessDeniedInfo && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center mb-2">
                  <span className="i-carbon-warning text-red-500 mr-2"></span>
                  <span className="font-medium text-red-800">访问被拒绝</span>
                </div>
                <p className="text-red-700">{accessDeniedInfo.message}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">需要的{getRequirementTypeName(accessDeniedInfo.type)}</h4>
                  <div className="space-y-1">
                    {accessDeniedInfo.required.map(req => (
                      <Badge key={req} variant="warning" className="mr-1 mb-1">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">当前的{getRequirementTypeName(accessDeniedInfo.type)}</h4>
                  <div className="space-y-1">
                    {accessDeniedInfo.current.length > 0 ? (
                      accessDeniedInfo.current.map(curr => (
                        <Badge key={curr} variant="info" className="mr-1 mb-1">
                          {curr}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">无</span>
                    )}
                  </div>
                </div>
              </div>

              {user && (
                <div className="bg-gray-50 rounded-md p-3">
                  <h4 className="font-medium text-gray-900 mb-2">当前用户信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">姓名：</span>
                      <span>{user.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">工号：</span>
                      <span>{user.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">角色：</span>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">部门：</span>
                      <span>{user.department || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <span className="i-carbon-information text-blue-500 mr-2 mt-0.5"></span>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">如何获得访问权限？</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>联系系统管理员申请相应权限</li>
                      <li>确认您的角色和部门信息是否正确</li>
                      <li>如有疑问，请联系技术支持</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowAccessModal(false)}
            >
              关闭
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </Card>
  );
};

// 辅助函数
const getRequirementTypeName = (type: AccessDeniedInfo['type']): string => {
  switch (type) {
    case 'role': return '角色';
    case 'permission': return '权限';
    case 'department': return '部门';
    case 'custom': return '条件';
    default: return '要求';
  }
};

const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'superadmin': return '超级管理员';
    case 'admin': return '管理员';
    case 'user': return '普通用户';
    default: return role;
  }
};

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'superadmin': return 'danger';
    case 'admin': return 'warning';
    default: return 'info';
  }
};

export default PermissionGateEnhanced;