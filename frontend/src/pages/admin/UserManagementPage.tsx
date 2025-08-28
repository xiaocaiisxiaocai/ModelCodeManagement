// UserManagementPage.tsx - 用户管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, Table, Badge, Select, useToast } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { rbacApiService } from '../../services/rbacApiService';
import type { User, CreateUserRequest, UpdateUserRequest, Department } from '../../services/rbacApiService';
import { formatOrganizationOptions } from '../../utils/organizationUtils';

type UserRole = 'user' | 'admin' | 'superadmin';

interface CreateUserForm {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface EditUserForm extends Omit<CreateUserForm, 'password' | 'confirmPassword'> {
  id: string;
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const { addToast } = useToast();
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    employeeId: '',
    name: '',
    role: 'user',
    department: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    id: '',
    employeeId: '',
    name: '',
    role: 'user',
    department: '',
    email: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载用户和部门数据
      const [usersResponse, departmentsResponse] = await Promise.all([
        rbacApiService.getUsers({ pageSize: 100 }),
        rbacApiService.getDepartments({ pageSize: 100 })
      ]);
      
      if (!usersResponse.success) {
        throw new Error(usersResponse.error || 'Failed to load users');
      }
      
      if (!departmentsResponse.success) {
        throw new Error(departmentsResponse.error || 'Failed to load departments');
      }
      
      setUsers(usersResponse.data?.users || []);
      setDepartments(departmentsResponse.data?.departments || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast({
        type: 'error',
        title: '加载失败',
        message: '无法加载数据'
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取部门选项
  const getDepartmentOptions = () => {
    return formatOrganizationOptions(departments, 'name', false);
  };

  // 获取部门名称 - 根据部门代码查找对应的部门名称
  const getDepartmentName = (departmentCode?: string) => {
    if (!departmentCode) return '-';
    
    // 根据部门代码查找对应的部门名称
    const department = departments.find(dept => 
      dept.code === departmentCode || dept.name === departmentCode
    );
    
    return department ? department.name : departmentCode;
  };

  // 筛选用户
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // 表单验证
  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!createForm.employeeId.trim()) {
      errors.employeeId = '工号不能为空';
    } else if (users.some(u => u.employeeId === createForm.employeeId)) {
      errors.employeeId = '工号已存在';
    }

    if (!createForm.name.trim()) {
      errors.name = '姓名不能为空';
    }

    if (!createForm.password) {
      errors.password = '密码不能为空';
    } else if (createForm.password.length < 6) {
      errors.password = '密码至少6位';
    }

    if (createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    if (createForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = '邮箱格式不正确';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.name.trim()) {
      errors.name = '姓名不能为空';
    }

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = '邮箱格式不正确';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建用户
  const handleCreateUser = async () => {
    if (!validateCreateForm()) return;

    setLoading(true);
    try {
      // 使用后端API创建用户
      const response = await rbacApiService.createUser({
        employeeId: createForm.employeeId,
        userName: createForm.name,
        email: createForm.email,
        password: createForm.password
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create user');
      }
      
      const newUser = response.data;
      
      setUsers(prev => [...prev, newUser]);
      setShowCreateModal(false);
      setCreateForm({
        employeeId: '',
        name: '',
        role: 'user',
        department: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setFormErrors({});
      
      // 重新加载数据以更新部门用户统计
      loadData();
      
      addToast({
        type: 'success',
        title: '创建成功',
        message: '用户创建成功'
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      addToast({
        type: 'error',
        title: '创建失败',
        message: '用户创建失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 编辑用户
  const handleEditUser = async () => {
    if (!validateEditForm() || !editingUser) return;

    setLoading(true);
    try {
      // 使用后端API更新用户
      const response = await rbacApiService.updateUser(parseInt(editForm.id), {
        userName: editForm.name,
        email: editForm.email
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user');
      }
      
      const updatedUser = response.data;
      
      setUsers(prev => prev.map(user => 
        user.id === editForm.id ? updatedUser : user
      ));
      
      setShowEditModal(false);
      setEditingUser(null);
      setFormErrors({});
      
      // 重新加载数据以更新部门用户统计
      loadData();
      
      addToast({
        type: 'success',
        title: '更新成功',
        message: '用户信息更新成功'
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      addToast({
        type: 'error',
        title: '更新失败',
        message: '用户信息更新失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '不能删除当前登录用户'
      });
      return;
    }

    if (!confirm('确定要删除这个用户吗？')) return;

    setLoading(true);
    try {
      // 🔧 修复：转换字符串ID为数字
      const numericId = parseInt(userId);
      if (isNaN(numericId)) {
        throw new Error('Invalid user ID');
      }
      
      // 使用后端API删除用户
      const response = await rbacApiService.deleteUser(numericId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete user');
      }
      
      setUsers(prev => prev.filter(user => user.id !== userId)); // 🔧 修复：保持字符串类型
      
      // 重新加载数据以更新部门用户统计
      loadData();
      
      addToast({
        type: 'success',
        title: '删除成功',
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      addToast({
        type: 'error',
        title: '删除失败',
        message: '用户删除失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (userId: string) => {
    if (!confirm('确定要重置这个用户的密码吗？密码将重置为默认密码。')) return;

    setLoading(true);
    try {
      // 🔧 修复：转换字符串ID为数字
      const numericId = parseInt(userId);
      if (isNaN(numericId)) {
        throw new Error('Invalid user ID');
      }
      
      // 使用后端API重置密码
      const response = await rbacApiService.resetPassword(numericId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }
      
      addToast({
        type: 'success',
        title: '重置成功',
        message: `密码重置成功，新密码为：${response.data}`
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      addToast({
        type: 'error',
        title: '重置失败',
        message: '密码重置失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑Modal
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      department: user.department || '',
      email: user.email || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // 角色标签样式
  const getRoleBadgeVariant = (role: string) => {
    const normalizedRole = role.toLowerCase();
    switch (normalizedRole) {
      case 'superadmin':
      case 'super_admin': return 'danger';
      case 'admin': return 'warning';
      default: return 'info';
    }
  };

  const getRoleText = (role: string) => {
    if (!role) return '普通用户';
    
    const normalizedRole = role.toLowerCase().trim();
    
    // 处理所有可能的超级管理员角色格式
    if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
      return '超级管理员';
    }
    
    if (normalizedRole === 'admin') {
      return '管理员';
    }
    
    return '普通用户';
  };

  return (
    <ModernLayout title="用户管理" subtitle="管理系统用户账号和权限">
      <PermissionGate 
        roles={['ADMIN', 'SUPER_ADMIN']}
        fallback={
          <Card className="p-8 text-center">
            <p className="text-gray-500">您没有权限访问此页面</p>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* 操作栏 */}
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="w-full sm:w-80">
                    <Input
                      placeholder="搜索用户（姓名、工号、邮箱）"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<span className="i-carbon-search"></span>}
                      size="sm"
                    />
                  </div>
                  
                  <div className="w-full sm:w-36">
                    <Select
                      value={selectedRole}
                      onChange={(value) => setSelectedRole(value as UserRole | 'all')}
                      options={[
                        { value: 'all', label: '全部角色' },
                        { value: 'superadmin', label: '超级管理员' },
                        { value: 'admin', label: '管理员' },
                        { value: 'user', label: '普通用户' }
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    共 {filteredUsers.length} 个用户
                  </div>
                  
                  <PermissionGate roles={['SUPER_ADMIN']}>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center"
                      size="sm"
                    >
                      <span className="i-carbon-add mr-2"></span>
                      新增用户
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 移动端卡片式布局 */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardBody className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Card key={user.id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <h3 className="font-medium text-gray-900 text-base mr-2">
                            {user.name}
                          </h3>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {getRoleText(user.role)}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">工号:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {user.employeeId}
                            </code>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">部门:</span>
                            <span className="text-sm text-gray-600">
                              {getDepartmentName(user.department)}
                            </span>
                          </div>
                          {user.email && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-16">邮箱:</span>
                              <span className="text-sm text-gray-600 truncate">
                                {user.email}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">创建:</span>
                            <span className="text-xs text-gray-500">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          {user.lastLogin && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-16">登录:</span>
                              <span className="text-xs text-gray-500">
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          disabled={loading}
                          className="px-3 py-2 text-xs"
                          title="编辑用户"
                        >
                          <span className="i-carbon-edit mr-1"></span>
                          编辑
                        </Button>
                        <PermissionGate roles={['SUPER_ADMIN']}>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={loading}
                            className="px-3 py-2 text-xs"
                            title="重置密码"
                          >
                            <span className="i-carbon-password mr-1"></span>
                            重置
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loading}
                              className="px-3 py-2 text-xs"
                              title="删除用户"
                            >
                              <span className="i-carbon-delete mr-1"></span>
                              删除
                            </Button>
                          )}
                        </PermissionGate>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">暂无用户数据</p>
              </Card>
            )}
          </div>

          {/* 桌面端表格布局 */}
          <Card className="hidden lg:block">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <Table
                  headers={['工号', '姓名', '角色', '部门', '邮箱', '创建时间', '最后登录', '操作']}
                  data={filteredUsers.map(user => [
                    <code key="employeeId" className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {user.employeeId}
                    </code>,
                    <div key="name" className="font-medium text-gray-900">
                      {user.name}
                    </div>,
                    <Badge key="role" variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {getRoleText(user.role)}
                    </Badge>,
                    <span key="department" className="text-sm text-gray-600">
                      {getDepartmentName(user.department)}
                    </span>,
                    <span key="email" className="text-sm text-gray-600 truncate max-w-32" title={user.email}>
                      {user.email || '-'}
                    </span>,
                    <span key="created" className="text-xs text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </span>,
                    <span key="login" className="text-xs text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '从未登录'}
                    </span>,
                    <div key="actions" className="flex gap-1 min-w-max">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        disabled={loading}
                        className="px-2 py-1 text-xs"
                        title="编辑用户"
                      >
                        <span className="i-carbon-edit text-sm"></span>
                      </Button>
                      
                      <PermissionGate roles={['SUPER_ADMIN']}>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                          disabled={loading}
                          className="px-2 py-1 text-xs"
                          title="重置密码"
                        >
                          <span className="i-carbon-password text-sm"></span>
                        </Button>
                        
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading}
                            className="px-2 py-1 text-xs"
                            title="删除用户"
                          >
                            <span className="i-carbon-delete text-sm"></span>
                          </Button>
                        )}
                      </PermissionGate>
                    </div>
                  ])}
                  loading={loading}
                  emptyMessage="暂无用户数据"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 创建用户Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="新增用户"
        >
          <div className="space-y-3">
            <Input
              label="工号 *"
              value={createForm.employeeId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, employeeId: e.target.value }))}
              error={formErrors.employeeId}
              placeholder="请输入工号"
              size="sm"
            />
            
            <Input
              label="姓名 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入姓名"
              size="sm"
            />
            
            <Select
              label="角色 *"
              value={createForm.role}
              onChange={(value) => setCreateForm(prev => ({ ...prev, role: value as UserRole }))}
              options={[
                { value: 'user', label: '普通用户' },
                { value: 'admin', label: '管理员' },
                ...(currentUser?.role === 'superadmin' ? [{ value: 'superadmin', label: '超级管理员' }] : [])
              ]}
              size="sm"
            />
            
            <Select
              label="部门"
              value={createForm.department}
              onChange={(value) => setCreateForm(prev => ({ ...prev, department: value }))}
              options={[
                { value: '', label: '请选择部门' },
                ...getDepartmentOptions()
              ]}
              size="sm"
            />
            
            <Input
              label="邮箱"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              placeholder="请输入邮箱"
              size="sm"
            />
            
            <Input
              label="密码 *"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
              error={formErrors.password}
              placeholder="请输入密码"
              size="sm"
            />
            
            <Input
              label="确认密码 *"
              type="password"
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={formErrors.confirmPassword}
              placeholder="请再次输入密码"
              size="sm"
            />
          </div>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 编辑用户Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="编辑用户"
        >
          <div className="space-y-3">
            <Input
              label="工号"
              value={editForm.employeeId}
              disabled
              className="bg-gray-50"
              size="sm"
            />
            
            <Input
              label="姓名 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入姓名"
              size="sm"
            />
            
            <Select
              label="角色 *"
              value={editForm.role}
              onChange={(value) => setEditForm(prev => ({ ...prev, role: value as UserRole }))}
              options={[
                { value: 'user', label: '普通用户' },
                { value: 'admin', label: '管理员' },
                ...(currentUser?.role === 'superadmin' ? [{ value: 'superadmin', label: '超级管理员' }] : [])
              ]}
              disabled={editingUser?.id === currentUser?.id}
              helperText={editingUser?.id === currentUser?.id ? '不能修改自己的角色' : undefined}
              size="sm"
            />
            
            <Select
              label="部门"
              value={editForm.department}
              onChange={(value) => setEditForm(prev => ({ ...prev, department: value }))}
              options={[
                { value: '', label: '请选择部门' },
                ...getDepartmentOptions()
              ]}
              size="sm"
            />
            
            <Input
              label="邮箱"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              placeholder="请输入邮箱"
              size="sm"
            />
          </div>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditUser}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>
      </PermissionGate>
    </ModernLayout>
  );
};

export default UserManagementPage;