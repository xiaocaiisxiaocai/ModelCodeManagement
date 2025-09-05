// RoleManagementPage.tsx - 角色管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, Table, Badge, ConfirmDialog } from '../../components/ui';
import { useToastContext } from '../../contexts/ToastContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { services } from '../../services';
import type { Role, Permission } from '../../types/domain';

// Role 和 Permission 接口已从 domain types 导入

interface CreateRoleForm {
  code: string;
  name: string;
  permissions: string[];
}

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToastContext();
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreateRoleForm>({
    code: '',
    name: '',
    permissions: []
  });
  
  const [editForm, setEditForm] = useState<CreateRoleForm>({
    code: '',
    name: '',
    permissions: []
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 使用后端API获取数据，不再需要本地mock数据

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 使用新的服务层
      const [rolesResponse, permissionsResponse] = await Promise.all([
        services.userManagement.getRoles({ pageSize: 100 }),
        services.userManagement.getPermissions({ pageSize: 100 })
      ]);
      
      if (!rolesResponse.success || !permissionsResponse.success) {
        throw new Error('Failed to load data');
      }
      
      const rolesData = rolesResponse.data?.roles || [];
      const permissionsData = permissionsResponse.data?.permissions || [];
      
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast({
        type: 'error',
        title: '加载失败',
        message: '无法加载角色和权限数据'
      });
    } finally {
      setLoading(false);
    }
  };

  // 筛选角色 - 防止undefined导致的toLowerCase错误
  const filteredRoles = roles.filter(role => 
    (role.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 按分类组织权限
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // 表单验证
  const validateForm = (form: CreateRoleForm): boolean => {
    const errors: Record<string, string> = {};

    if (!form.code.trim()) {
      errors.code = '角色编码不能为空';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(form.code)) {
      errors.code = '角色编码只能包含字母、数字和下划线，且必须以字母开头';
    } else if (roles.some(r => r.code === form.code && r.id !== editingRole?.id)) {
      errors.code = '角色编码已存在';
    }

    if (!form.name.trim()) {
      errors.name = '角色名称不能为空';
    }

    if (form.permissions.length === 0) {
      errors.permissions = '至少选择一个权限';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建角色
  const handleCreateRole = async () => {
    if (!validateForm(createForm)) return;

    setLoading(true);
    try {
      // 使用后端API创建角色
      const response = await services.userManagement.createRole({
        code: createForm.code,
        name: createForm.name,
        permissionIds: createForm.permissions.map(id => parseInt(id))
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create role');
      }
      
      const newRole = response.data;
      
      // 权限已在创建角色时一起处理
      
      setRoles(prev => [...prev, newRole]);
      setShowCreateModal(false);
      setCreateForm({ code: '', name: '', permissions: [] });
      setFormErrors({});
      
      // 重新加载数据以获取最新的权限信息
      loadData();
      
      addToast({
        type: 'success',
        title: '创建成功',
        message: '角色创建成功'
      });
    } catch (error) {
      console.error('Failed to create role:', error);
      addToast({
        type: 'error',
        title: '创建失败',
        message: '角色创建失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 编辑角色
  const handleEditRole = async () => {
    if (!validateForm(editForm) || !editingRole) return;

    setLoading(true);
    try {
      // 使用后端API更新角色
      const response = await services.userManagement.updateRole(editingRole.id, {
        code: editForm.code,
        name: editForm.name,
        permissionIds: editForm.permissions.map(id => parseInt(id))
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update role');
      }
      
      const updatedRole = response.data;
      
      // 权限已在更新角色时一起处理
      
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id ? updatedRole : role
      ));
      
      setShowEditModal(false);
      setEditingRole(null);
      setFormErrors({});
      
      // 重新加载数据以获取最新的权限信息
      loadData();
      
      addToast({
        type: 'success',
        title: '更新成功',
        message: '角色更新成功'
      });
    } catch (error) {
      console.error('Failed to update role:', error);
      addToast({
        type: 'error',
        title: '更新失败',
        message: '角色更新失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (role: Role) => {
    setDeletingRole(role);
    setShowDeleteDialog(true);
  };

  // 删除角色
  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    if (deletingRole.isSystem) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '系统内置角色不能删除'
      });
      return;
    }

    if (deletingRole.userCount > 0) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '该角色下还有用户，请先移除所有用户后再删除'
      });
      return;
    }

    setLoading(true);
    try {
      // 使用后端API删除角色
      const response = await services.userManagement.deleteRole(deletingRole.id);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete role');
      }
      
      setRoles(prev => prev.filter(role => role.id !== deletingRole.id));
      setShowDeleteDialog(false);
      setDeletingRole(null);
      
      addToast({
        type: 'success',
        title: '删除成功',
        message: '角色删除成功'
      });
    } catch (error) {
      console.error('Failed to delete role:', error);
      addToast({
        type: 'error',
        title: '删除失败',
        message: '角色删除失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑Modal
  const openEditModal = async (role: Role) => {
    setEditingRole(role);
    
    // 获取角色的当前权限
    try {
      const rolePermissions = await services.userManagement.getRolePermissions(role.id);
      
      const permissionIds = rolePermissions.success && rolePermissions.data 
        ? rolePermissions.data.map(p => p.id) 
        : [];
      
      setEditForm({
        code: role.code,
        name: role.name,
        permissions: permissionIds
      });
    } catch (error) {
      console.error('❌ [RoleManagementPage] 编辑模式获取角色权限失败:', error);
      setEditForm({
        code: role.code,
        name: role.name,
        permissions: []
      });
    }
    
    setFormErrors({});
    setShowEditModal(true);
  };

  // 查看权限详情
  const openPermissionModal = async (role: Role) => {
    setViewingRole(role);
    
    // 获取角色的实际权限列表
    try {
      const rolePermissions = await services.userManagement.getRolePermissions(role.id);
      
      if (rolePermissions.success && rolePermissions.data) {
        const enrichedRole = {
          ...role,
          permissions: rolePermissions.data
        };
        setViewingRole(enrichedRole);
      } else {
        console.error('❌ [RoleManagementPage] 获取角色权限失败:', rolePermissions.error);
      }
    } catch (error) {
      console.error('❌ [RoleManagementPage] Failed to load role permissions:', error);
    }
    
    setShowPermissionModal(true);
  };

  // 权限选择组件
  const PermissionSelector: React.FC<{
    selectedPermissions: string[];
    onPermissionChange: (permissions: string[]) => void;
    disabled?: boolean;
  }> = ({ selectedPermissions, onPermissionChange, disabled = false }) => {
    const handlePermissionToggle = (permissionId: string) => {
      if (disabled) return;
      
      const newPermissions = selectedPermissions.includes(permissionId)
        ? selectedPermissions.filter(p => p !== permissionId)
        : [...selectedPermissions, permissionId];
      
      onPermissionChange(newPermissions);
    };

    const handleCategoryToggle = (category: string) => {
      if (disabled) return;
      
      const categoryPermissions = permissionsByCategory[category].map(p => p.id);
      const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
      
      let newPermissions: string[];
      if (allSelected) {
        // 取消选择这个分类的所有权限
        newPermissions = selectedPermissions.filter(p => !categoryPermissions.includes(p));
      } else {
        // 选择这个分类的所有权限
        newPermissions = [...new Set([...selectedPermissions, ...categoryPermissions])];
      }
      
      onPermissionChange(newPermissions);
    };

    return (
      <div className="space-y-4">
        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
          const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p.id));
          const someSelected = categoryPermissions.some(p => selectedPermissions.includes(p.id));

          return (
            <div key={category} className="border rounded-md p-4">
              <div className="flex items-center mb-3">
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
                <span className="font-medium text-gray-900">{category}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                {categoryPermissions.map(permission => (
                  <label key={permission.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      disabled={disabled}
                      className="mr-2 mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{permission.name}</div>
                      <div className="text-xs text-gray-500">{permission.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="w-full sm:w-80">
                    <Input
                      placeholder="搜索角色（名称、编码）"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<span className="i-carbon-search"></span>}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    共 {filteredRoles.length} 个角色
                  </div>
                  
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center"
                    size="sm"
                  >
                    <span className="i-carbon-add mr-2"></span>
                    新增角色
                  </Button>
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
            ) : filteredRoles.length > 0 ? (
              filteredRoles.map((role) => (
                <Card key={role.id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {role.code}
                            </code>
                            <span className="text-sm font-medium">{role.name}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">权限:</span>
                            <span className="text-sm text-gray-600">
                              {role.permissionCount === 0 ? '未分配' : `${role.permissionCount} 个`}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">用户:</span>
                            <span className="text-sm text-gray-600">
                              {role.userCount} 人
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">创建:</span>
                            <span className="text-xs text-gray-500">
                              {new Date(role.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openPermissionModal(role)}
                          disabled={loading}
                          className="px-3 py-2 text-xs flex items-center"
                          title="查看权限"
                        >
                          <span className="i-carbon-view mr-1"></span>
                          查看
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(role)}
                          disabled={loading || role.isSystem}
                          className="px-3 py-2 text-xs flex items-center"
                          title={role.isSystem ? '系统角色不可编辑' : '编辑角色'}
                        >
                          <span className="i-carbon-edit mr-1"></span>
                          编辑
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openDeleteDialog(role)}
                            disabled={loading || role.userCount > 0}
                            className="px-3 py-2 text-xs flex items-center"
                            title={role.userCount > 0 ? '该角色下还有用户，不能删除' : '删除角色'}
                          >
                            <span className="i-carbon-delete mr-1"></span>
                            删除
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">暂无角色数据</p>
              </Card>
            )}
          </div>

          {/* 桌面端表格布局 */}
          <Card className="hidden lg:block">
            <CardBody className="p-0">
              <Table
                headers={['角色编码', '角色名称', '权限数量', '用户数量', '创建时间', '操作']}
                data={filteredRoles.map(role => [
                  <code key="code" className="text-sm bg-gray-100 px-2 py-1 rounded">{role.code}</code>,
                  role.name,
                  role.permissionCount === 0 ? '未分配' : `${role.permissionCount} 个`,
                  role.userCount,
                  new Date(role.createdAt).toLocaleDateString(),
                  <div key="actions" className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openPermissionModal(role)}
                      disabled={loading}
                      title="查看权限"
                    >
                      <span className="i-carbon-view"></span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(role)}
                      disabled={loading || role.isSystem}
                      title={role.isSystem ? '系统角色不可编辑' : '编辑角色'}
                    >
                      <span className="i-carbon-edit"></span>
                    </Button>
                    
                    {!role.isSystem && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openDeleteDialog(role)}
                        disabled={loading || role.userCount > 0}
                        title={role.userCount > 0 ? '该角色下还有用户，不能删除' : '删除角色'}
                      >
                        <span className="i-carbon-delete"></span>
                      </Button>
                    )}
                  </div>
                ])}
                loading={loading}
                emptyMessage="暂无角色数据"
              />
            </CardBody>
          </Card>
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
              label="角色编码 *"
              value={createForm.code}
              onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
              error={formErrors.code}
              placeholder="请输入角色编码（如：Editor）"
              helperText="只能包含字母、数字和下划线，且必须以字母开头"
            />
            
            <Input
              label="角色名称 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入角色名称（如：编辑员）"
            />
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">权限配置 *</label>
              {formErrors.permissions && (
                <p className="text-sm text-red-600 mb-2">{formErrors.permissions}</p>
              )}
              <div className="max-h-96 overflow-y-auto border rounded-md p-4">
                <PermissionSelector
                  selectedPermissions={createForm.permissions}
                  onPermissionChange={(permissions) => setCreateForm(prev => ({ ...prev, permissions }))}
                />
              </div>
            </div>
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
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
              label="角色编码 *"
              value={editForm.code}
              onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
              error={formErrors.code}
              placeholder="请输入角色编码"
              disabled={editingRole?.isSystem}
            />
            
            <Input
              label="角色名称 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入角色名称"
              disabled={editingRole?.isSystem}
            />
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">权限配置 *</label>
              {formErrors.permissions && (
                <p className="text-sm text-red-600 mb-2">{formErrors.permissions}</p>
              )}
              <div className="max-h-96 overflow-y-auto border rounded-md p-4">
                <PermissionSelector
                  selectedPermissions={editForm.permissions}
                  onPermissionChange={(permissions) => setEditForm(prev => ({ ...prev, permissions }))}
                  disabled={editingRole?.isSystem}
                />
              </div>
              {editingRole?.isSystem && (
                <p className="text-xs text-gray-500 mt-1">系统内置角色的权限不可修改</p>
              )}
            </div>
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
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

        {/* 权限详情Modal */}
        <Modal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          title={`权限详情 - ${viewingRole?.name}`}
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
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">权限列表</h4>
                {viewingRole.permissions.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                    <span className="text-gray-500">暂未分配权限</span>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <PermissionSelector
                      selectedPermissions={viewingRole.permissions?.map(p => p.id) || []}
                      onPermissionChange={() => {}} // 查看模式，不允许修改
                      disabled={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowPermissionModal(false)}
            >
              关闭
            </Button>
          </ModalFooter>
        </Modal>

        {/* 删除角色确认对话框 */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeletingRole(null);
          }}
          onConfirm={handleDeleteRole}
          title="删除角色"
          message="您确定要删除这个角色吗？此操作不可恢复。"
          confirmText="删除"
          cancelText="取消"
          confirmType="danger"
          loading={loading}
          userInfo={deletingRole ? {
            name: deletingRole.name,
            employeeId: deletingRole.code,
            role: '角色'
          } : undefined}
        />
      </PermissionGate>
    </ModernLayout>
  );
};

export default RoleManagementPage;