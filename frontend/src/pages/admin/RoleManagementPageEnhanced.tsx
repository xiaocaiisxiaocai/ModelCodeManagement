// RoleManagementPageEnhanced.tsx - 增强版角色管理页面
import React, { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, Table, Badge } from '../../components/ui';
import PermissionGate from '../../components/auth/PermissionGate';
import { useServiceResponse } from '../../hooks/useServiceResponse';
import { rbacService, type Role, type Permission, type CreateRoleRequest } from '../../services/rbacService';

interface PermissionCategory {
  name: string;
  permissions: Permission[];
  description: string;
}

interface CreateRoleForm extends CreateRoleRequest {}

interface EditRoleForm extends CreateRoleRequest {
  id: string;
}

const RoleManagementPageEnhanced: React.FC = () => {
  const { loading, error, handleResponse, clearError, showSuccess, showError } = useServiceResponse();
  
  // 数据状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSystemRoles, setShowSystemRoles] = useState(true);
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [cloningRole, setCloningRole] = useState<Role | null>(null);
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreateRoleForm>({
    name: '',
    description: '',
    permissions: []
  });
  
  const [editForm, setEditForm] = useState<EditRoleForm>({
    id: '',
    name: '',
    description: '',
    permissions: []
  });

  const [cloneForm, setCloneForm] = useState<CreateRoleForm>({
    name: '',
    description: '',
    permissions: []
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 加载数据
  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = useCallback(async () => {
    await handleResponse(
      () => rbacService.getAllRoles(),
      (data) => setRoles(data),
      (error) => showError(`加载角色列表失败: ${error}`)
    );
  }, [handleResponse, showError]);

  const loadPermissions = useCallback(async () => {
    await handleResponse(
      () => rbacService.getAllPermissions(),
      (data) => {
        setPermissions(data);
        // 按分类组织权限
        const categoriesMap = data.reduce((acc, permission) => {
          if (!acc[permission.category]) {
            acc[permission.category] = {
              name: permission.category,
              permissions: [],
              description: getCategoryDescription(permission.category)
            };
          }
          acc[permission.category].permissions.push(permission);
          return acc;
        }, {} as Record<string, PermissionCategory>);
        
        setPermissionCategories(Object.values(categoriesMap));
      },
      (error) => console.error('加载权限列表失败:', error)
    );
  }, [handleResponse]);

  // 获取分类描述
  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      '用户管理': '管理系统用户账号的增删改查权限',
      '角色管理': '管理角色定义和权限分配',
      '权限管理': '管理系统权限定义',
      '产品管理': '管理产品类型和分类',
      '机型管理': '管理机型分类和配置',
      '代码管理': '管理编码分类和使用记录',
      '数据查看': '查看统计数据和报表',
      '数据管理': '管理数据导入导出',
      '系统管理': '系统配置和管理'
    };
    return descriptions[category] || '其他权限';
  };

  // 筛选角色
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSystemFilter = showSystemRoles || !role.isSystem;
    return matchesSearch && matchesSystemFilter;
  });

  // 表单验证
  const validateForm = (form: CreateRoleForm, excludeId?: string): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = '角色名称不能为空';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(form.name)) {
      errors.name = '角色名称只能包含字母、数字和下划线，且必须以字母开头';
    } else if (roles.some(r => r.name === form.name && r.id !== excludeId)) {
      errors.name = '角色名称已存在';
    }

    if (!form.description.trim()) {
      errors.description = '角色描述不能为空';
    }

    if (form.permissions.length === 0) {
      errors.permissions = '至少选择一个权限';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD操作
  const handleCreateRole = async () => {
    if (!validateForm(createForm)) return;

    await handleResponse(
      () => rbacService.createRole(createForm),
      (data) => {
        setRoles(prev => [...prev, data]);
        setShowCreateModal(false);
        resetCreateForm();
        showSuccess('角色创建成功');
      },
      (error) => showError(`创建角色失败: ${error}`)
    );
  };

  const handleEditRole = async () => {
    if (!validateForm(editForm, editForm.id) || !editingRole) return;

    await handleResponse(
      () => rbacService.updateRole(editForm.id, {
        name: editForm.name,
        description: editForm.description,
        permissions: editForm.permissions
      }),
      (data) => {
        setRoles(prev => prev.map(role => role.id === editForm.id ? data : role));
        setShowEditModal(false);
        setEditingRole(null);
        showSuccess('角色更新成功');
      },
      (error) => showError(`更新角色失败: ${error}`)
    );
  };

  const handleCloneRole = async () => {
    if (!validateForm(cloneForm)) return;

    await handleResponse(
      () => rbacService.createRole(cloneForm),
      (data) => {
        setRoles(prev => [...prev, data]);
        setShowCloneModal(false);
        setCloningRole(null);
        resetCloneForm();
        showSuccess('角色克隆成功');
      },
      (error) => showError(`克隆角色失败: ${error}`)
    );
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      showError('系统内置角色不能删除');
      return;
    }

    if (role.userCount > 0) {
      showError('该角色下还有用户，请先移除所有用户后再删除');
      return;
    }

    if (!confirm('确定要删除这个角色吗？')) return;

    await handleResponse(
      () => rbacService.deleteRole(roleId),
      () => {
        setRoles(prev => prev.filter(role => role.id !== roleId));
        showSuccess('角色删除成功');
      },
      (error) => showError(`删除角色失败: ${error}`)
    );
  };

  // UI辅助方法
  const resetCreateForm = () => {
    setCreateForm({ name: '', description: '', permissions: [] });
    setFormErrors({});
  };

  const resetCloneForm = () => {
    setCloneForm({ name: '', description: '', permissions: [] });
    setFormErrors({});
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setEditForm({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openPermissionModal = (role: Role) => {
    setViewingRole(role);
    setShowPermissionModal(true);
  };

  const openCloneModal = (role: Role) => {
    setCloningRole(role);
    setCloneForm({
      name: `${role.name}_copy`,
      description: `${role.description}（副本）`,
      permissions: [...role.permissions]
    });
    setFormErrors({});
    setShowCloneModal(true);
  };

  // 权限选择组件
  const PermissionSelector: React.FC<{
    selectedPermissions: string[];
    onPermissionChange: (permissions: string[]) => void;
    disabled?: boolean;
    searchable?: boolean;
  }> = ({ selectedPermissions, onPermissionChange, disabled = false, searchable = false }) => {
    const [permissionSearch, setPermissionSearch] = useState('');

    const filteredCategories = permissionCategories.filter(category => {
      if (!searchable || !permissionSearch) return true;
      return category.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
             category.permissions.some(p => 
               p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
               p.description.toLowerCase().includes(permissionSearch.toLowerCase())
             );
    });

    const handlePermissionToggle = (permissionId: string) => {
      if (disabled) return;
      
      const newPermissions = selectedPermissions.includes(permissionId)
        ? selectedPermissions.filter(p => p !== permissionId)
        : [...selectedPermissions, permissionId];
      
      onPermissionChange(newPermissions);
    };

    const handleCategoryToggle = (category: PermissionCategory) => {
      if (disabled) return;
      
      const categoryPermissions = category.permissions.map(p => p.id);
      const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
      
      let newPermissions: string[];
      if (allSelected) {
        newPermissions = selectedPermissions.filter(p => !categoryPermissions.includes(p));
      } else {
        newPermissions = [...new Set([...selectedPermissions, ...categoryPermissions])];
      }
      
      onPermissionChange(newPermissions);
    };

    const handleSelectAll = () => {
      if (disabled) return;
      const allPermissions = permissions.map(p => p.id);
      onPermissionChange(selectedPermissions.length === allPermissions.length ? [] : allPermissions);
    };

    return (
      <div className="space-y-4">
        {searchable && (
          <div className="space-y-2">
            <Input
              placeholder="搜索权限..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              icon={<span className="i-carbon-search"></span>}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                已选择 {selectedPermissions.length} / {permissions.length} 个权限
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={disabled}
              >
                {selectedPermissions.length === permissions.length ? '取消全选' : '全选'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredCategories.map((category) => {
            const allSelected = category.permissions.every(p => selectedPermissions.includes(p.id));
            const someSelected = category.permissions.some(p => selectedPermissions.includes(p.id));

            return (
              <div key={category.name} className="border rounded-md p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={input => {
                        if (input) input.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={() => handleCategoryToggle(category)}
                      disabled={disabled}
                      className="mr-2"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <p className="text-xs text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <Badge variant="info">
                    {category.permissions.filter(p => selectedPermissions.includes(p.id)).length} / {category.permissions.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                  {category.permissions.map(permission => (
                    <label key={permission.id} className="flex items-start p-2 bg-white rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        disabled={disabled}
                        className="mr-2 mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.description}</div>
                        <code className="text-xs text-blue-600 bg-blue-50 px-1 rounded">{permission.id}</code>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ModernLayout title="角色管理" subtitle="管理系统角色和权限配置">
      <PermissionGate 
        roles={['superadmin']}
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
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Input
                  placeholder="搜索角色（名称、描述）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  icon={<span className="i-carbon-search"></span>}
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showSystemRoles"
                    checked={showSystemRoles}
                    onChange={(e) => setShowSystemRoles(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="showSystemRoles" className="text-sm text-gray-700">
                    显示系统内置角色
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  共 {filteredRoles.length} 个角色，其中系统角色 {filteredRoles.filter(r => r.isSystem).length} 个
                </div>

                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center"
                >
                  <span className="i-carbon-add mr-2"></span>
                  新增角色
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* 角色列表 */}
          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">角色名称</th>
                      <th className="px-4 py-3 text-left">描述</th>
                      <th className="px-4 py-3 text-left">权限数量</th>
                      <th className="px-4 py-3 text-left">用户数量</th>
                      <th className="px-4 py-3 text-left">类型</th>
                      <th className="px-4 py-3 text-left">创建时间</th>
                      <th className="px-4 py-3 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map(role => (
                      <tr key={role.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{role.name}</code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate" title={role.description}>
                            {role.description}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {role.permissions.includes('*') ? (
                              <Badge variant="success">全部权限</Badge>
                            ) : (
                              <span className="text-sm">{role.permissions.length} 个</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${role.userCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            {role.userCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={role.isSystem ? 'info' : 'default'}>
                            {role.isSystem ? '系统内置' : '自定义'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(role.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissionModal(role)}
                              disabled={loading}
                              title="查看权限"
                            >
                              <span className="i-carbon-view"></span>
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCloneModal(role)}
                              disabled={loading}
                              title="克隆角色"
                            >
                              <span className="i-carbon-copy"></span>
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(role)}
                              disabled={loading || role.isSystem}
                              title={role.isSystem ? '系统角色不可编辑' : '编辑角色'}
                            >
                              <span className="i-carbon-edit"></span>
                            </Button>
                            
                            {!role.isSystem && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={loading || role.userCount > 0}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                title={role.userCount > 0 ? '该角色下还有用户，不能删除' : '删除角色'}
                              >
                                <span className="i-carbon-delete"></span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredRoles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  暂无角色数据
                </div>
              )}
            </CardBody>
          </Card>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
                <div className="text-sm text-gray-600">总角色数</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {roles.filter(r => !r.isSystem).length}
                </div>
                <div className="text-sm text-gray-600">自定义角色</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {roles.filter(r => r.isSystem).length}
                </div>
                <div className="text-sm text-gray-600">系统角色</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{permissions.length}</div>
                <div className="text-sm text-gray-600">权限总数</div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 创建角色Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="新增角色"
          size="large"
        >
          <div className="space-y-4">
            <Input
              label="角色名称 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入角色名称（如：editor）"
              helperText="只能包含字母、数字和下划线，且必须以字母开头"
            />
            
            <Input
              label="角色描述 *"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              error={formErrors.description}
              placeholder="请输入角色描述"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">权限配置 *</label>
              {formErrors.permissions && (
                <p className="text-sm text-red-600 mb-2">{formErrors.permissions}</p>
              )}
              <PermissionSelector
                selectedPermissions={createForm.permissions}
                onPermissionChange={(permissions) => setCreateForm(prev => ({ ...prev, permissions }))}
                searchable={true}
              />
            </div>
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
              onClick={handleCreateRole}
              loading={loading}
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 编辑角色Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="编辑角色"
          size="large"
        >
          <div className="space-y-4">
            <Input
              label="角色名称 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入角色名称"
              disabled={editingRole?.isSystem}
            />
            
            <Input
              label="角色描述 *"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              error={formErrors.description}
              placeholder="请输入角色描述"
              disabled={editingRole?.isSystem}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">权限配置 *</label>
              {formErrors.permissions && (
                <p className="text-sm text-red-600 mb-2">{formErrors.permissions}</p>
              )}
              <PermissionSelector
                selectedPermissions={editForm.permissions}
                onPermissionChange={(permissions) => setEditForm(prev => ({ ...prev, permissions }))}
                disabled={editingRole?.isSystem}
                searchable={true}
              />
              {editingRole?.isSystem && (
                <p className="text-xs text-gray-500 mt-1">系统内置角色的权限不可修改</p>
              )}
            </div>
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
              onClick={handleEditRole}
              loading={loading}
              disabled={editingRole?.isSystem}
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 克隆角色Modal */}
        <Modal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          title={`克隆角色 - ${cloningRole?.description}`}
          size="large"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                <span className="i-carbon-information mr-1"></span>
                将基于 <code className="bg-blue-100 px-1 rounded">{cloningRole?.name}</code> 角色创建新角色，并继承其所有权限配置
              </p>
            </div>

            <Input
              label="新角色名称 *"
              value={cloneForm.name}
              onChange={(e) => setCloneForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入新角色名称"
              helperText="只能包含字母、数字和下划线，且必须以字母开头"
            />
            
            <Input
              label="新角色描述 *"
              value={cloneForm.description}
              onChange={(e) => setCloneForm(prev => ({ ...prev, description: e.target.value }))}
              error={formErrors.description}
              placeholder="请输入新角色描述"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">权限配置</label>
              <p className="text-sm text-gray-600 mb-2">
                已继承 {cloneForm.permissions.length} 个权限，您可以进行调整
              </p>
              <PermissionSelector
                selectedPermissions={cloneForm.permissions}
                onPermissionChange={(permissions) => setCloneForm(prev => ({ ...prev, permissions }))}
                searchable={true}
              />
            </div>
          </div>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloneModal(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCloneRole}
              loading={loading}
            >
              创建角色
            </Button>
          </ModalFooter>
        </Modal>

        {/* 权限详情Modal */}
        <Modal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          title={`权限详情 - ${viewingRole?.description}`}
          size="large"
        >
          {viewingRole && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">角色信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">角色名称：</span>
                    <code className="bg-white px-2 py-1 rounded">{viewingRole.name}</code>
                  </div>
                  <div>
                    <span className="text-gray-600">用户数量：</span>
                    <span>{viewingRole.userCount} 人</span>
                  </div>
                  <div>
                    <span className="text-gray-600">角色类型：</span>
                    <Badge variant={viewingRole.isSystem ? 'info' : 'default'}>
                      {viewingRole.isSystem ? '系统内置' : '自定义'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">权限数量：</span>
                    <span>
                      {viewingRole.permissions.includes('*') ? '全部权限' : `${viewingRole.permissions.length} 个`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">权限列表</h4>
                {viewingRole.permissions.includes('*') ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
                    <span className="text-blue-700 font-medium">
                      <span className="i-carbon-checkmark-filled mr-2"></span>
                      拥有所有权限
                    </span>
                  </div>
                ) : (
                  <PermissionSelector
                    selectedPermissions={viewingRole.permissions}
                    onPermissionChange={() => {}}
                    disabled={true}
                  />
                )}
              </div>
            </div>
          )}
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowPermissionModal(false)}
            >
              关闭
            </Button>
          </ModalFooter>
        </Modal>
      </PermissionGate>
    </ModernLayout>
  );
};

export default RoleManagementPageEnhanced;