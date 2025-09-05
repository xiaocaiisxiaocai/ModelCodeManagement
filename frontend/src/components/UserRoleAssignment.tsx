// UserRoleAssignment.tsx - 用户角色分配组件
import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, Input, Modal, ModalFooter, Badge } from './ui';
import { useServiceResponse } from '../hooks/useServiceResponse';
import { rbacService, type Role } from '../services/rbacService';
import type { User, UserRole } from '../types/domain';

interface UserRoleAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
}

interface RoleAssignmentHistory {
  id: string;
  fromRole: UserRole;
  toRole: UserRole;
  assignedBy: string;
  assignedAt: string;
  reason?: string;
}

const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const { loading, handleResponse, showSuccess, showError } = useServiceResponse();
  
  // 状态管理
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleAssignmentHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 加载数据
  useEffect(() => {
    if (isOpen && user) {
      loadRoles();
      loadUserPermissions();
      loadRoleHistory();
      setSelectedRole(user.role);
      setAssignmentReason('');
    }
  }, [isOpen, user]);

  const loadRoles = async () => {
    await handleResponse(
      () => rbacService.getAllRoles(),
      (data) => setRoles(data),
      (error) => console.error('加载角色失败:', error)
    );
  };

  const loadUserPermissions = async () => {
    if (!user) return;
    
    await handleResponse(
      () => rbacService.getUserPermissions(user.id),
      (data) => setUserPermissions(data),
      (error) => console.error('加载用户权限失败:', error)
    );
  };

  const loadRoleHistory = async () => {
    // 模拟角色变更历史
    const mockHistory: RoleAssignmentHistory[] = [
      {
        id: '1',
        fromRole: 'user',
        toRole: 'admin',
        assignedBy: 'SuperAdmin',
        assignedAt: '2024-01-15T10:30:00Z',
        reason: '晋升为部门管理员'
      },
      {
        id: '2',
        fromRole: 'admin',
        toRole: 'user',
        assignedBy: 'SuperAdmin',
        assignedAt: '2024-01-01T09:00:00Z',
        reason: '部门调整'
      }
    ];
    setRoleHistory(mockHistory);
  };

  // 分配角色
  const handleAssignRole = async () => {
    if (!user || selectedRole === user.role) {
      showError('请选择不同的角色');
      return;
    }

    if (!assignmentReason.trim()) {
      showError('请填写分配原因');
      return;
    }

    const roleData = roles.find(r => r.name === selectedRole);
    if (!roleData) {
      showError('角色不存在');
      return;
    }

    await handleResponse(
      () => rbacService.assignUserRole(user.id, roleData.id),
      () => {
        const updatedUser = { ...user, role: selectedRole };
        onUserUpdated(updatedUser);
        showSuccess('角色分配成功');
        onClose();
      },
      (error) => showError(`角色分配失败: ${error}`)
    );
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'superadmin': return '超级管理员';
      case 'admin': return '管理员';
      case 'user': return '普通用户';
      default: return role;
    }
  };

  // 获取角色徽章样式
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin': return 'warning';
      default: return 'info';
    }
  };

  // 获取权限显示
  const getPermissionsByRole = (roleName: string): string[] => {
    const role = roles.find(r => r.name === roleName);
    return role?.permissions || [];
  };

  // 权限对比组件
  const PermissionComparison: React.FC<{
    currentRole: UserRole;
    newRole: UserRole;
  }> = ({ currentRole, newRole }) => {
    const currentPermissions = getPermissionsByRole(currentRole);
    const newPermissions = getPermissionsByRole(newRole);
    
    const addedPermissions = newPermissions.filter(p => !currentPermissions.includes(p));
    const removedPermissions = currentPermissions.filter(p => !newPermissions.includes(p));
    
    if (addedPermissions.length === 0 && removedPermissions.length === 0) {
      return (
        <div className="text-sm text-gray-600 text-center py-4">
          权限无变化
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {addedPermissions.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-green-700 mb-2">
              <span className="i-carbon-add mr-1"></span>
              将获得权限 ({addedPermissions.length})
            </h5>
            <div className="flex flex-wrap gap-1">
              {addedPermissions.map(permission => (
                <Badge key={permission} variant="success" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {removedPermissions.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-red-700 mb-2">
              <span className="i-carbon-subtract mr-1"></span>
              将失去权限 ({removedPermissions.length})
            </h5>
            <div className="flex flex-wrap gap-1">
              {removedPermissions.map(permission => (
                <Badge key={permission} variant="danger" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`用户角色分配 - ${user.name}`}
      size="large"
    >
      <div className="space-y-6">
        {/* 用户信息 */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">用户信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">工号：</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{user.employeeId}</code>
              </div>
              <div>
                <span className="text-gray-600">姓名：</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div>
                <span className="text-gray-600">当前角色：</span>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">部门：</span>
                <span>{user.department || '-'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 角色分配 */}
        <Card>
          <CardBody className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">角色分配</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择新角色 *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                  <option value="superadmin">超级管理员</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分配原因 *
                </label>
                <textarea
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="请说明角色变更的原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* 权限变化预览 */}
              {selectedRole !== user.role && (
                <div className="border rounded-md p-4 bg-blue-50">
                  <h5 className="font-medium text-gray-900 mb-3">权限变化预览</h5>
                  <PermissionComparison
                    currentRole={user.role}
                    newRole={selectedRole}
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 当前权限 */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">当前权限</h4>
              <Badge variant="info">
                {userPermissions.length} 个权限
              </Badge>
            </div>
            
            {userPermissions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {userPermissions.map(permission => (
                  <Badge key={permission} variant="default" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无权限数据</p>
            )}
          </CardBody>
        </Card>

        {/* 角色变更历史 */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">角色变更历史</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? '收起' : '展开'}
                <span className={`ml-1 transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                  <span className="i-carbon-chevron-down"></span>
                </span>
              </Button>
            </div>
            
            {showHistory && (
              <div className="space-y-3">
                {roleHistory.length > 0 ? (
                  roleHistory.map(history => (
                    <div key={history.id} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(history.fromRole)}>
                            {getRoleDisplayName(history.fromRole)}
                          </Badge>
                          <span className="i-carbon-arrow-right text-gray-400"></span>
                          <Badge variant={getRoleBadgeVariant(history.toRole)}>
                            {getRoleDisplayName(history.toRole)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(history.assignedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>操作人：{history.assignedBy}</span>
                        {history.reason && (
                          <span className="ml-4">原因：{history.reason}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    暂无角色变更历史
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleAssignRole}
          loading={loading}
          disabled={selectedRole === user.role || !assignmentReason.trim()}
        >
          分配角色
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UserRoleAssignment;