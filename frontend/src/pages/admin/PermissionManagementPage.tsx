// PermissionManagementPage.tsx - 权限管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, Table, Badge, Select, ConfirmDialog } from '../../components/ui';
import { useToastContext } from '../../contexts/ToastContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { services } from '../../services';
import type { Permission } from '../../types/domain';

interface CreatePermissionForm {
  code: string;
  name: string;
  type: string;
  resource?: string;
  parentId?: string;
}

const PermissionManagementPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { addToast } = useToastContext();
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreatePermissionForm>({
    code: '',
    name: '',
    type: 'Menu',
    resource: '',
    parentId: undefined
  });
  
  const [editForm, setEditForm] = useState<CreatePermissionForm>({
    code: '',
    name: '',
    type: 'Menu',
    resource: '',
    parentId: undefined
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 预定义的权限类型
  const permissionTypes = [
    { value: 'Menu', label: '菜单权限' },
    { value: 'Action', label: '操作权限' },
    { value: 'Api', label: 'API权限' }
  ];


  // 加载数据
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await services.userManagement.getPermissions({ pageSize: 100 });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load permissions');
      }
      
      setPermissions(response.data?.permissions || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      addToast({
        type: 'error',
        title: '加载失败',
        message: '无法加载权限数据'
      });
    } finally {
      setLoading(false);
    }
  };

  // 筛选权限 - 防止undefined导致的toLowerCase错误
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = (permission.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (permission.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (permission.resource && permission.resource.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || permission.type === selectedType;
    return matchesSearch && matchesType;
  });

  // 获取所有类型用于筛选 - 防止undefined
  const availableTypes = Array.from(new Set(permissions.map(p => p.type || '').filter(Boolean)));

  // 表单验证
  const validateForm = (form: CreatePermissionForm): boolean => {
    const errors: Record<string, string> = {};

    if (!form.code.trim()) {
      errors.code = '权限编码不能为空';
    } else if (permissions.some(p => p.code === form.code && p.id !== editingPermission?.id)) {
      errors.code = '权限编码已存在';
    }

    if (!form.name.trim()) {
      errors.name = '权限名称不能为空';
    }

    if (!form.type.trim()) {
      errors.type = '权限类型不能为空';
    }


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建权限
  const handleCreatePermission = async () => {
    if (!validateForm(createForm)) return;

    setLoading(true);
    try {
      const response = await services.userManagement.createPermission({
        code: createForm.code,
        name: createForm.name,
        type: createForm.type,
        resource: createForm.resource,
        parentId: createForm.parentId ? parseInt(createForm.parentId) : undefined
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create permission');
      }
      
      const newPermission = response.data;
      setPermissions(prev => [...prev, newPermission]);
      setShowCreateModal(false);
      setCreateForm({
        code: '',
        name: '',
        type: 'Menu',
        resource: '',
        parentId: undefined
      });
      setFormErrors({});
      
      addToast({
        type: 'success',
        title: '创建成功',
        message: '权限创建成功'
      });
    } catch (error) {
      console.error('Failed to create permission:', error);
      addToast({
        type: 'error',
        title: '创建失败',
        message: '权限创建失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 编辑权限
  const handleEditPermission = async () => {
    if (!validateForm(editForm) || !editingPermission) return;

    setLoading(true);
    try {
      const response = await services.userManagement.updatePermission(editingPermission.id, {
        code: editForm.code,
        name: editForm.name,
        type: editForm.type,
        resource: editForm.resource,
        parentId: editForm.parentId ? parseInt(editForm.parentId) : undefined
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update permission');
      }
      
      const updatedPermission = response.data;
      setPermissions(prev => prev.map(permission => 
        permission.id === editingPermission.id ? updatedPermission : permission
      ));
      
      setShowEditModal(false);
      setEditingPermission(null);
      setFormErrors({});
      
      addToast({
        type: 'success',
        title: '更新成功',
        message: '权限更新成功'
      });
    } catch (error) {
      console.error('Failed to update permission:', error);
      addToast({
        type: 'error',
        title: '更新失败',
        message: '权限更新失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (permission: Permission) => {
    setDeletingPermission(permission);
    setShowDeleteDialog(true);
  };

  // 删除权限
  const handleDeletePermission = async () => {
    if (!deletingPermission) return;

    setLoading(true);
    try {
      const response = await services.userManagement.deletePermission(deletingPermission.id.toString());
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete permission');
      }
      
      setPermissions(prev => prev.filter(permission => permission.id !== deletingPermission.id));
      setShowDeleteDialog(false);
      setDeletingPermission(null);
      
      addToast({
        type: 'success',
        title: '删除成功',
        message: '权限删除成功'
      });
    } catch (error) {
      console.error('Failed to delete permission:', error);
      addToast({
        type: 'error',
        title: '删除失败',
        message: '权限删除失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑Modal
  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setEditForm({
      code: permission.code,
      name: permission.name,
      type: permission.type,
      resource: permission.resource || '',
      parentId: permission.parentId
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // 获取权限类型的显示标签
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Menu': return 'info';
      case 'Action': return 'warning';
      case 'Api': return 'success';
      default: return 'secondary';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'Menu': return '菜单权限';
      case 'Action': return '操作权限';
      case 'Api': return 'API权限';
      default: return type;
    }
  };




  return (
    <ModernLayout title="权限管理" subtitle="管理系统权限配置">
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
                      placeholder="搜索权限（名称、编码、资源）"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<span className="i-carbon-search"></span>}
                      size="sm"
                    />
                  </div>
                  
                  <div className="w-full sm:w-36">
                    <Select
                      value={selectedType}
                      onChange={(value) => setSelectedType(value)}
                      options={[
                        { value: 'all', label: '全部类型' },
                        ...availableTypes.map(type => ({
                          value: type,
                          label: getTypeText(type)
                        }))
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    共 {filteredPermissions.length} 个权限
                  </div>
                  
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center"
                    size="sm"
                  >
                    <span className="i-carbon-add mr-2"></span>
                    新增权限
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
            ) : filteredPermissions.length > 0 ? (
              filteredPermissions.map((permission) => (
                <Card key={permission.id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <h3 className="font-medium text-gray-900 text-base mr-2">
                            {permission.name}
                          </h3>
                          <Badge variant={getTypeBadgeVariant(permission.type)} className="text-xs">
                            {getTypeText(permission.type)}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">编码:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {permission.code}
                            </code>
                          </div>

                          {permission.resource && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-16">资源:</span>
                              <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded truncate">
                                {permission.resource}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(permission)}
                          disabled={loading}
                          className="px-3 py-2 text-xs flex items-center"
                          title="编辑权限"
                        >
                          <span className="i-carbon-edit mr-1"></span>
                          编辑
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDeleteDialog(permission)}
                          disabled={loading}
                          className="px-3 py-2 text-xs flex items-center"
                          title="删除权限"
                        >
                          <span className="i-carbon-delete mr-1"></span>
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">暂无权限数据</p>
              </Card>
            )}
          </div>

          {/* 桌面端表格布局 */}
          <Card className="hidden lg:block">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <Table
                  headers={['权限编码', '权限名称', '权限类型', '资源', '操作']}
                  data={filteredPermissions.map(permission => [
                    <code key="code" className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {permission.code}
                    </code>,
                    <div key="name" className="font-medium text-gray-900">
                      {permission.name}
                    </div>,
                    <Badge key="type" variant={getTypeBadgeVariant(permission.type)} className="text-xs">
                      {getTypeText(permission.type)}
                    </Badge>,
                    <code key="resource" className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {permission.resource || '-'}
                    </code>,
                    <div key="actions" className="flex gap-1 min-w-max">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(permission)}
                        disabled={loading}
                        className="px-2 py-1 text-xs"
                        title="编辑权限"
                      >
                        <span className="i-carbon-edit text-sm"></span>
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openDeleteDialog(permission)}
                        disabled={loading}
                        className="px-2 py-1 text-xs"
                        title="删除权限"
                      >
                        <span className="i-carbon-delete text-sm"></span>
                      </Button>
                    </div>
                  ])}
                  loading={loading}
                  emptyMessage="暂无权限数据"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 创建权限Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="新增权限"
        >
          <div className="space-y-3">
            {formErrors.general && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {formErrors.general}
              </div>
            )}
            
            <Input
              label="权限编码 *"
              value={createForm.code}
              onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
              error={formErrors.code}
              placeholder="请输入权限编码（如：USER_READ）"
              size="sm"
            />
            
            <Input
              label="权限名称 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入权限名称"
              size="sm"
            />
            
            <Select
              label="权限类型 *"
              value={createForm.type}
              onChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}
              options={permissionTypes}
              placeholder="请选择权限类型"
              error={formErrors.type}
              size="sm"
            />
            
            
            <Input
              label="资源标识"
              value={createForm.resource}
              onChange={(e) => setCreateForm(prev => ({ ...prev, resource: e.target.value }))}
              error={formErrors.resource}
              placeholder="请输入资源标识（可选）"
              size="sm"
            />
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePermission}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 编辑权限Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="编辑权限"
        >
          <div className="space-y-3">
            {formErrors.general && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {formErrors.general}
              </div>
            )}
            
            <Input
              label="权限编码 *"
              value={editForm.code}
              onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
              error={formErrors.code}
              placeholder="请输入权限编码"
              size="sm"
            />
            
            <Input
              label="权限名称 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入权限名称"
              size="sm"
            />
            
            <Select
              label="权限类型 *"
              value={editForm.type}
              onChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
              options={permissionTypes}
              placeholder="请选择权限类型"
              error={formErrors.type}
              size="sm"
            />
            
            
            <Input
              label="资源标识"
              value={editForm.resource}
              onChange={(e) => setEditForm(prev => ({ ...prev, resource: e.target.value }))}
              error={formErrors.resource}
              placeholder="请输入资源标识（可选）"
              size="sm"
            />
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditPermission}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 删除确认对话框 */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeletingPermission(null);
          }}
          onConfirm={handleDeletePermission}
          title="删除权限"
          message="确定要删除这个权限吗？删除后相关角色的权限配置也会受到影响。"
          confirmText="删除"
          cancelText="取消"
          confirmType="danger"
          loading={loading}
          userInfo={deletingPermission ? {
            name: deletingPermission.name,
            employeeId: deletingPermission.code,
            role: '权限'
          } : undefined}
        />
      </PermissionGate>
    </ModernLayout>
  );
};

export default PermissionManagementPage;