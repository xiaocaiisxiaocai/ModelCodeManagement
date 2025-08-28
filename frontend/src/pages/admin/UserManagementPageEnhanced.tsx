// UserManagementPageEnhanced.tsx - 增强版用户管理页面
import React, { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, Table, Badge } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { useServiceResponse } from '../../hooks/useServiceResponse';
import { rbacService, type CreateUserRequest, type UpdateUserRequest, type Role } from '../../services/rbacService';
import type { User, UserRole } from '../../mock/interfaces';

interface CreateUserForm extends CreateUserRequest {
  confirmPassword: string;
}

interface EditUserForm extends UpdateUserRequest {
  id: string;
  employeeId: string;
}

interface BulkOperationModal {
  type: 'delete' | 'changeRole' | null;
  selectedUsers: User[];
  targetRole?: UserRole;
}

const UserManagementPageEnhanced: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { loading, error, handleResponse, clearError, showSuccess, showError } = useServiceResponse();
  
  // 数据状态
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [bulkOperation, setBulkOperation] = useState<BulkOperationModal>({ type: null, selectedUsers: [] });
  
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
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = useCallback(async () => {
    await handleResponse(
      () => rbacService.getAllUsers(),
      (data) => {
        setUsers(data);
        setSelectedUsers(new Set()); // 清空选择
      },
      (error) => showError(`加载用户列表失败: ${error}`)
    );
  }, [handleResponse, showError]);

  const loadRoles = useCallback(async () => {
    await handleResponse(
      () => rbacService.getAllRoles(),
      (data) => setRoles(data),
      (error) => console.error('加载角色列表失败:', error)
    );
  }, [handleResponse]);

  // 获取部门列表
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));

  // 筛选和排序用户
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
      return matchesSearch && matchesRole && matchesDepartment;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
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

    // 权限检查：只有更高级角色才能创建相同或更低级的角色
    if (currentUser && !rbacService.canManageUser(currentUser.role, createForm.role)) {
      errors.role = '您无权创建该级别的用户';
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

    // 权限检查
    if (currentUser && editingUser && !rbacService.canManageUser(currentUser.role, editForm.role)) {
      errors.role = '您无权将用户设置为该级别';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD操作
  const handleCreateUser = async () => {
    if (!validateCreateForm()) return;

    await handleResponse(
      () => rbacService.createUser({
        employeeId: createForm.employeeId,
        name: createForm.name,
        role: createForm.role,
        department: createForm.department,
        email: createForm.email,
        password: createForm.password
      }),
      (data) => {
        setUsers(prev => [...prev, data]);
        setShowCreateModal(false);
        resetCreateForm();
        showSuccess('用户创建成功');
      },
      (error) => showError(`创建用户失败: ${error}`)
    );
  };

  const handleEditUser = async () => {
    if (!validateEditForm() || !editingUser) return;

    await handleResponse(
      () => rbacService.updateUser(editForm.id, {
        name: editForm.name,
        role: editForm.role,
        department: editForm.department,
        email: editForm.email
      }),
      (data) => {
        setUsers(prev => prev.map(user => user.id === editForm.id ? data : user));
        setShowEditModal(false);
        setEditingUser(null);
        showSuccess('用户信息更新成功');
      },
      (error) => showError(`更新用户失败: ${error}`)
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      showError('不能删除当前登录用户');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!rbacService.canManageUser(currentUser!.role, user.role)) {
      showError('您无权删除该用户');
      return;
    }

    if (!confirm('确定要删除这个用户吗？')) return;

    await handleResponse(
      () => rbacService.deleteUser(userId),
      () => {
        setUsers(prev => prev.filter(user => user.id !== userId));
        showSuccess('用户删除成功');
      },
      (error) => showError(`删除用户失败: ${error}`)
    );
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!rbacService.canManageUser(currentUser!.role, user.role)) {
      showError('您无权重置该用户密码');
      return;
    }

    if (!confirm('确定要重置这个用户的密码吗？密码将重置为默认密码。')) return;

    await handleResponse(
      () => rbacService.resetUserPassword(userId),
      (newPassword) => {
        showSuccess(`密码重置成功，新密码为：${newPassword}`);
      },
      (error) => showError(`重置密码失败: ${error}`)
    );
  };

  // 批量操作
  const handleBulkDelete = async () => {
    const selectedUsersList = Array.from(selectedUsers).map(id => users.find(u => u.id === id)!);
    const cannotDelete = selectedUsersList.filter(user => 
      user.id === currentUser?.id || !rbacService.canManageUser(currentUser!.role, user.role)
    );

    if (cannotDelete.length > 0) {
      showError(`无法删除${cannotDelete.length}个用户（包含当前用户或权限不足）`);
      return;
    }

    setBulkOperation({ type: 'delete', selectedUsers: selectedUsersList });
    setShowBulkModal(true);
  };

  const handleBulkChangeRole = (targetRole: UserRole) => {
    const selectedUsersList = Array.from(selectedUsers).map(id => users.find(u => u.id === id)!);
    setBulkOperation({ type: 'changeRole', selectedUsers: selectedUsersList, targetRole });
    setShowBulkModal(true);
  };

  const executeBulkOperation = async () => {
    if (!bulkOperation.type || bulkOperation.selectedUsers.length === 0) return;

    const userIds = bulkOperation.selectedUsers.map(u => u.id);

    if (bulkOperation.type === 'delete') {
      await handleResponse(
        () => rbacService.bulkDeleteUsers(userIds),
        () => {
          setUsers(prev => prev.filter(user => !userIds.includes(user.id)));
          setSelectedUsers(new Set());
          setShowBulkModal(false);
          showSuccess(`成功删除${userIds.length}个用户`);
        },
        (error) => showError(`批量删除失败: ${error}`)
      );
    } else if (bulkOperation.type === 'changeRole' && bulkOperation.targetRole) {
      const targetRoleData = roles.find(r => r.name === bulkOperation.targetRole);
      if (!targetRoleData) return;

      await handleResponse(
        () => rbacService.bulkUpdateUserRoles(userIds, targetRoleData.id),
        () => {
          setUsers(prev => prev.map(user => 
            userIds.includes(user.id) 
              ? { ...user, role: bulkOperation.targetRole! }
              : user
          ));
          setSelectedUsers(new Set());
          setShowBulkModal(false);
          showSuccess(`成功更新${userIds.length}个用户的角色`);
        },
        (error) => showError(`批量更新角色失败: ${error}`)
      );
    }
  };

  // UI辅助方法
  const resetCreateForm = () => {
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
  };

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

  const openUserDetail = (user: User) => {
    setViewingUser(user);
    setShowUserDetailModal(true);
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.id)));
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 角色显示相关
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'danger';
      case 'admin': return 'warning';
      default: return 'info';
    }
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return '超级管理员';
      case 'admin': return '管理员';
      default: return '普通用户';
    }
  };

  return (
    <ModernLayout title="用户管理" subtitle="管理系统用户账号和权限">
      <PermissionGate 
        roles={['admin', 'superadmin']}
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
              {/* 搜索和筛选 */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <Input
                  placeholder="搜索用户（姓名、工号、邮箱）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  icon={<span className="i-carbon-search"></span>}
                />
                
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部角色</option>
                  <option value="superadmin">超级管理员</option>
                  <option value="admin">管理员</option>
                  <option value="user">普通用户</option>
                </select>

                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部部门</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* 批量操作和新增按钮 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {selectedUsers.size > 0 && (
                    <>
                      <span className="text-sm text-gray-600">
                        已选择 {selectedUsers.size} 个用户
                      </span>
                      
                      <PermissionGate roles={['superadmin']}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <span className="i-carbon-delete mr-1"></span>
                          批量删除
                        </Button>
                      </PermissionGate>

                      <PermissionGate roles={['admin', 'superadmin']}>
                        <div className="relative group">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <span className="i-carbon-user-role mr-1"></span>
                            批量修改角色
                            <span className="i-carbon-chevron-down ml-1"></span>
                          </Button>
                          <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => handleBulkChangeRole('user')}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                            >
                              设为普通用户
                            </button>
                            <button
                              onClick={() => handleBulkChangeRole('admin')}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                            >
                              设为管理员
                            </button>
                            {currentUser?.role === 'superadmin' && (
                              <button
                                onClick={() => handleBulkChangeRole('superadmin')}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                              >
                                设为超级管理员
                              </button>
                            )}
                          </div>
                        </div>
                      </PermissionGate>
                    </>
                  )}
                </div>

                <PermissionGate roles={['superadmin']}>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center"
                  >
                    <span className="i-carbon-add mr-2"></span>
                    新增用户
                  </Button>
                </PermissionGate>
              </div>
            </CardBody>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('employeeId')}
                      >
                        工号 {sortField === 'employeeId' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        姓名 {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-left">角色</th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('department')}
                      >
                        部门 {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-left">邮箱</th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        创建时间 {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('lastLogin')}
                      >
                        最后登录 {sortField === 'lastLogin' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-3 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedUsers.map(user => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{user.employeeId}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openUserDetail(user)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {user.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleText(user.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{user.department || '-'}</td>
                        <td className="px-4 py-3">{user.email || '-'}</td>
                        <td className="px-4 py-3">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '从未登录'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              disabled={loading}
                            >
                              <span className="i-carbon-edit"></span>
                            </Button>
                            
                            <PermissionGate roles={['superadmin']}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetPassword(user.id)}
                                disabled={loading}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                <span className="i-carbon-password"></span>
                              </Button>
                              
                              {user.id !== currentUser?.id && rbacService.canManageUser(currentUser!.role, user.role) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={loading}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <span className="i-carbon-delete"></span>
                                </Button>
                              )}
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredAndSortedUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  暂无用户数据
                </div>
              )}
            </CardBody>
          </Card>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-sm text-gray-600">总用户数</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600">管理员</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {users.filter(u => u.role === 'superadmin').length}
                </div>
                <div className="text-sm text-gray-600">超级管理员</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedUsers.size}
                </div>
                <div className="text-sm text-gray-600">已选择</div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 创建用户Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="新增用户"
        >
          <div className="space-y-4">
            <Input
              label="工号 *"
              value={createForm.employeeId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, employeeId: e.target.value }))}
              error={formErrors.employeeId}
              placeholder="请输入工号"
            />
            
            <Input
              label="姓名 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入姓名"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">角色 *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">普通用户</option>
                {rbacService.canManageUser(currentUser!.role, 'admin') && (
                  <option value="admin">管理员</option>
                )}
                {currentUser?.role === 'superadmin' && (
                  <option value="superadmin">超级管理员</option>
                )}
              </select>
              {formErrors.role && <p className="text-sm text-red-600 mt-1">{formErrors.role}</p>}
            </div>
            
            <Input
              label="部门"
              value={createForm.department}
              onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
              placeholder="请输入部门"
            />
            
            <Input
              label="邮箱"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              placeholder="请输入邮箱"
            />
            
            <Input
              label="密码 *"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
              error={formErrors.password}
              placeholder="请输入密码（至少6位）"
            />
            
            <Input
              label="确认密码 *"
              type="password"
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={formErrors.confirmPassword}
              placeholder="请再次输入密码"
            />
          </div>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
              loading={loading}
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
          <div className="space-y-4">
            <Input
              label="工号"
              value={editForm.employeeId}
              disabled
              className="bg-gray-50"
            />
            
            <Input
              label="姓名 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入姓名"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">角色 *</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={editingUser?.id === currentUser?.id}
              >
                <option value="user">普通用户</option>
                {rbacService.canManageUser(currentUser!.role, 'admin') && (
                  <option value="admin">管理员</option>
                )}
                {currentUser?.role === 'superadmin' && (
                  <option value="superadmin">超级管理员</option>
                )}
              </select>
              {editingUser?.id === currentUser?.id && (
                <p className="text-xs text-gray-500 mt-1">不能修改自己的角色</p>
              )}
              {formErrors.role && <p className="text-sm text-red-600 mt-1">{formErrors.role}</p>}
            </div>
            
            <Input
              label="部门"
              value={editForm.department}
              onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
              placeholder="请输入部门"
            />
            
            <Input
              label="邮箱"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              placeholder="请输入邮箱"
            />
          </div>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditUser}
              loading={loading}
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 批量操作确认Modal */}
        <Modal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title={bulkOperation.type === 'delete' ? '批量删除用户' : '批量修改角色'}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              {bulkOperation.type === 'delete' 
                ? `确定要删除以下 ${bulkOperation.selectedUsers.length} 个用户吗？`
                : `确定要将以下 ${bulkOperation.selectedUsers.length} 个用户的角色修改为 "${getRoleText(bulkOperation.targetRole!)}" 吗？`
              }
            </p>
            
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {bulkOperation.selectedUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center py-1">
                  <span>{user.name} ({user.employeeId})</span>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleText(user.role)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant={bulkOperation.type === 'delete' ? 'danger' : 'primary'}
              onClick={executeBulkOperation}
              loading={loading}
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 用户详情Modal */}
        <Modal
          isOpen={showUserDetailModal}
          onClose={() => setShowUserDetailModal(false)}
          title="用户详情"
          size="large"
        >
          {viewingUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">工号</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{viewingUser.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">角色</label>
                  <div className="mt-1">
                    <Badge variant={getRoleBadgeVariant(viewingUser.role)}>
                      {getRoleText(viewingUser.role)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">部门</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.department || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">邮箱</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingUser.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">创建时间</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">最后登录</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : '从未登录'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowUserDetailModal(false)}
            >
              关闭
            </Button>
          </ModalFooter>
        </Modal>
      </PermissionGate>
    </ModernLayout>
  );
};

export default UserManagementPageEnhanced;