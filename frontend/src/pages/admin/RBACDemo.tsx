// RBACDemo.tsx - RBAC功能演示页面
import React, { useState } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Badge } from '../../components/ui';
import { PermissionGate } from '../../components/auth/PermissionGate';
import UserRoleAssignment from '../../components/UserRoleAssignment';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../contexts/ToastContext';
import type { DomainUser as User } from '../../types';

const RBACDemo: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToastContext();
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 模拟用户数据
  const mockUsers: User[] = [
    {
      id: '1',
      employeeId: '0001',
      userName: 'zhangsan',
      name: '张三',
      role: 'admin',
      department: '技术部',
      password: '',
      email: 'zhangsan@company.com',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      employeeId: '0002',
      userName: 'lisi',
      name: '李四',
      role: 'user',
      department: '市场部',
      password: '',
      email: 'lisi@company.com',
      createdAt: '2024-01-02T00:00:00Z'
    }
  ];

  const handleRoleAssignment = (user: User) => {
    setSelectedUser(user);
    setShowRoleAssignment(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    toast.success('角色分配成功', `${updatedUser.name} 的角色已更新为 ${updatedUser.role}`);
  };

  const testToastNotifications = () => {
    toast.success('成功消息', '这是一个成功的操作示例');
    setTimeout(() => {
      toast.warning('警告消息', '这是一个警告示例');
    }, 1000);
    setTimeout(() => {
      toast.error('错误消息', '这是一个错误示例');
    }, 2000);
    setTimeout(() => {
      toast.info('信息消息', '这是一个信息示例', {
        actions: [
          {
            label: '查看详情',
            onClick: () => toast.info('详情', '您点击了查看详情'),
            variant: 'primary'
          },
          {
            label: '忽略',
            onClick: () => toast.info('已忽略', '您选择了忽略此消息'),
            variant: 'secondary'
          }
        ]
      });
    }, 3000);
  };

  return (
    <ModernLayout title="RBAC功能演示" subtitle="演示基于角色的访问控制功能">
      <div className="space-y-6">
        {/* 当前用户信息 */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">当前用户信息</h3>
            {currentUser && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">姓名：</span>
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">工号：</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{currentUser.employeeId}</code>
                </div>
                <div>
                  <span className="text-sm text-gray-600">角色：</span>
                  <Badge variant={currentUser.role === 'superadmin' ? 'danger' : currentUser.role === 'admin' ? 'warning' : 'info'}>
                    {currentUser.role === 'superadmin' ? '超级管理员' : currentUser.role === 'admin' ? '管理员' : '普通用户'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">部门：</span>
                  <span>{currentUser.department || '-'}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 权限演示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 超级管理员权限演示 */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                超级管理员权限
                <Badge variant="danger" className="ml-2">superadmin</Badge>
              </h3>
              
              <PermissionGate
                roles={['superadmin']}
                fallback={
                  <div className="text-center py-8 text-gray-500">
                    <span className="i-carbon-locked text-2xl mb-2 block"></span>
                    <p>仅超级管理员可见</p>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <span className="i-carbon-checkmark-filled text-green-600 mr-2"></span>
                    <span className="text-green-800">您拥有超级管理员权限！</span>
                  </div>
                  <p className="text-sm text-gray-600">超级管理员可以：</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>管理所有用户账号</li>
                    <li>创建和修改角色</li>
                    <li>分配权限</li>
                    <li>访问系统配置</li>
                  </ul>
                </div>
              </PermissionGate>
            </CardBody>
          </Card>

          {/* 管理员权限演示 */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                管理员权限
                <Badge variant="warning" className="ml-2">admin+</Badge>
              </h3>
              
              <PermissionGate
                roles={['admin', 'superadmin']}
                fallback={
                  <div className="text-center py-8 text-gray-500">
                    <span className="i-carbon-locked text-2xl mb-2 block"></span>
                    <p>仅管理员及以上可见</p>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <span className="i-carbon-checkmark-filled text-blue-600 mr-2"></span>
                    <span className="text-blue-800">您拥有管理员权限！</span>
                  </div>
                  <p className="text-sm text-gray-600">管理员可以：</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>查看和编辑用户信息</li>
                    <li>管理产品和机型</li>
                    <li>审核编码申请</li>
                    <li>查看统计报表</li>
                  </ul>
                </div>
              </PermissionGate>
            </CardBody>
          </Card>

          {/* 权限演示说明 */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                权限系统说明
                <Badge variant="info" className="ml-2">基于后端RBAC</Badge>
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="i-carbon-information text-blue-600 mr-2"></span>
                    <span className="text-blue-800 font-medium">权限系统特性</span>
                  </div>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 ml-6">
                    <li>基于角色的访问控制 (RBAC)</li>
                    <li>支持用户-角色-权限三级关联</li>
                    <li>组织架构层级管理</li>
                    <li>JWT Token 权限验证</li>
                    <li>前后端双重权限检查</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 功能演示 */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">功能演示</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Toast通知演示 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Toast通知</h4>
                <Button
                  variant="primary"
                  onClick={testToastNotifications}
                  className="w-full"
                >
                  测试通知消息
                </Button>
                <p className="text-xs text-gray-500">
                  点击将依次显示成功、警告、错误和信息通知
                </p>
              </div>

              {/* 用户角色分配演示 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">角色分配</h4>
                <PermissionGate roles={['admin', 'superadmin']}>
                  <div className="space-y-2">
                    {mockUsers.map(user => (
                      <Button
                        key={user.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleAssignment(user)}
                        className="w-full justify-between"
                      >
                        <span>{user.name}</span>
                        <Badge variant={user.role === 'admin' ? 'warning' : 'info'}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </PermissionGate>
              </div>

              {/* 权限检查演示 */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">权限检查</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>超级管理员：</span>
                    <Badge variant={currentUser?.role === 'superadmin' ? 'success' : 'danger'}>
                      {currentUser?.role === 'superadmin' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>管理员+：</span>
                    <Badge variant={['admin', 'superadmin'].includes(currentUser?.role || '') ? 'success' : 'danger'}>
                      {['admin', 'superadmin'].includes(currentUser?.role || '') ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>当前部门：</span>
                    <Badge variant="info">
                      {currentUser?.department || '未设置'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">RBAC功能说明</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">权限门禁组件特性：</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>基于角色的访问控制</li>
                  <li>细粒度权限验证</li>
                  <li>部门级别权限控制</li>
                  <li>自定义验证函数支持</li>
                  <li>友好的权限不足提示</li>
                  <li>详细的权限说明</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Toast通知系统特性：</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>多种通知类型（成功、错误、警告、信息）</li>
                  <li>可配置的自动关闭时间</li>
                  <li>交互式操作按钮</li>
                  <li>优雅的动画效果</li>
                  <li>可堆叠显示</li>
                  <li>响应式设计</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 用户角色分配Modal */}
      <UserRoleAssignment
        isOpen={showRoleAssignment}
        onClose={() => setShowRoleAssignment(false)}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </ModernLayout>
  );
};

export default RBACDemo;