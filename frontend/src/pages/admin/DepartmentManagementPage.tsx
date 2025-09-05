// DepartmentManagementPage.tsx - 组织架构管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, TreeTable, Badge, Select, ConfirmDialog } from '../../components/ui';
import { useToastContext } from '../../contexts/ToastContext';
import type { TreeTableColumn, TreeTableNode } from '../../components/ui';
import PermissionGate from '../../components/auth/PermissionGate';
import { services } from '../../services';
import type { Organization } from '../../types/domain';

interface CreateOrganizationForm {
  name: string;
  type: string;
  parentId?: string;
  sortOrder?: number;
}

interface EditOrganizationForm extends CreateOrganizationForm {
}

const DepartmentManagementPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(true);
  const [mobileExpandedKeys, setMobileExpandedKeys] = useState<Set<string>>(() => {
    // 初始状态根据expandAll决定
    return expandAll ? new Set() : new Set(); // 初始为空，等待数据加载后再更新
  });
  const { addToast } = useToastContext();
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreateOrganizationForm>({
    name: '',
    type: 'Department',
    parentId: undefined,
    sortOrder: 0
  });
  
  const [editForm, setEditForm] = useState<EditOrganizationForm>({
    name: '',
    type: 'Department',
    parentId: undefined,
    sortOrder: 0
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 加载数据
  useEffect(() => {
    loadOrganizations();
  }, []);

  // 获取所有节点ID（包括子节点）
  const getAllOrganizationIds = (orgs: Organization[]): string[] => {
    const ids: string[] = [];
    const traverse = (orgs: Organization[]) => {
      orgs.forEach(org => {
        ids.push(String(org.id));
        if (org.children) {
          traverse(org.children);
        }
      });
    };
    traverse(orgs);
    return ids;
  };

  // 当expandAll状态变化时，更新移动端展开状态
  useEffect(() => {
    if (expandAll) {
      // 展开所有节点 - 获取所有组织ID（包括子组织）
      const allIds = getAllOrganizationIds(organizations);
      setMobileExpandedKeys(new Set(allIds));
    } else {
      // 折叠所有节点
      setMobileExpandedKeys(new Set());
    }
  }, [expandAll, organizations]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      // 暂时使用分页API，因为树形API数据不完整
      const response = await services.userManagement.getOrganizations();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load organizations');
      }
      
      setOrganizations(response.data || []);
    } catch (error) {
      addToast({
        type: 'error',
        title: '加载失败',
        message: '无法加载组织数据'
      });
    } finally {
      setLoading(false);
    }
  };

  // 构建树形结构数据 - 基于后端parentId的简单版本
  const buildTreeData = (): TreeTableNode[] => {
    if (organizations.length === 0) return [];
    
    const organizationMap = new Map<string, Organization & { children: Organization[] }>();
    const rootOrganizations: (Organization & { children: Organization[] })[] = [];
    
    // 首先创建所有组织的映射，并初始化children数组
    organizations.forEach(org => {
      organizationMap.set(org.id, { ...org, children: [] });
    });
    
    // 构建父子关系
    organizations.forEach(org => {
      const orgWithChildren = organizationMap.get(org.id)!;
      if (org.parentId) {
        const parent = organizationMap.get(org.parentId);
        if (parent) {
          parent.children.push(orgWithChildren);
        } else {
          // 如果找不到父组织，视为根组织
          rootOrganizations.push(orgWithChildren);
        }
      } else {
        rootOrganizations.push(orgWithChildren);
      }
    });
    
    // 递归筛选函数
    const filterOrganizations = (orgs: (Organization & { children: Organization[] })[]): TreeTableNode[] => {
      const results: TreeTableNode[] = [];
      
      for (const org of orgs) {
        // 检查当前组织是否匹配搜索条件
        const matchesSearch = !searchTerm || 
          org.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 递归筛选子组织
        const filteredChildren = org.children.length > 0 ? filterOrganizations(org.children as (Organization & { children: Organization[] })[]) : [];
        
        // 如果当前组织匹配条件，或者有匹配的子组织，则包含此组织
        if (matchesSearch || filteredChildren.length > 0) {
          results.push({
            id: String(org.id),
            name: org.name,
            level: org.level,
            type: org.type,
            userCount: org.userCount || 0,
            createdAt: org.createdAt || new Date().toISOString(),
            children: filteredChildren.length > 0 ? filteredChildren : undefined
          });
        }
      }
      
      return results.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    };
    
    return filterOrganizations(rootOrganizations);
  };
  
  const treeData = buildTreeData();
  
  // 验证父子关系
  const parentIds = organizations.map(d => d.parentId).filter(Boolean);
  const existingIds = organizations.map(d => d.id);
  const missingParents = parentIds.filter(pid => !existingIds.includes(pid));

  // 获取父级组织选项（用于创建子组织）
  const getParentOrganizationOptions = () => {
    return organizations
      .filter(org => org.level <= 3) // 只显示到部门级别，不包括课别
      .map(org => ({
        value: org.id,
        label: `${org.name} (${org.typeDisplay || org.type})`
      }));
  };

  // 表单验证
  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!createForm.name.trim()) {
      errors.name = '组织名称不能为空';
    }

    if (!createForm.type.trim()) {
      errors.type = '组织类型不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.name.trim()) {
      errors.name = '组织名称不能为空';
    }

    if (!editForm.type.trim()) {
      errors.type = '组织类型不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建组织
  const handleCreateOrganization = async () => {
    if (!validateCreateForm()) return;

    setLoading(true);
    try {
      const response = await services.userManagement.createOrganization({
        name: createForm.name,
        type: createForm.type,
        parentId: createForm.parentId ? parseInt(createForm.parentId) : undefined,
        sortOrder: createForm.sortOrder
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create organization');
      }
      
      const newOrganization = response.data;
      setOrganizations(prev => [...prev, newOrganization]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        type: 'Department',
        parentId: undefined,
        sortOrder: 0
      });
      setFormErrors({});
      
      addToast({
        type: 'success',
        title: '创建成功',
        message: '组织创建成功'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '创建失败',
        message: '组织创建失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 编辑组织
  const handleEditOrganization = async () => {
    if (!validateEditForm() || !editingOrganization) return;

    setLoading(true);
    try {
      const response = await services.userManagement.updateOrganization(editingOrganization.id, {
        name: editForm.name,
        type: editForm.type,
        parentId: editForm.parentId ? parseInt(editForm.parentId) : undefined,
        sortOrder: editForm.sortOrder
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update organization');
      }
      
      const updatedOrganization = response.data;
      setOrganizations(prev => prev.map(organization => 
        organization.id === editingOrganization.id ? updatedOrganization : organization
      ));
      
      setShowEditModal(false);
      setEditingOrganization(null);
      setFormErrors({});
      
      addToast({
        type: 'success',
        title: '更新成功',
        message: '组织信息更新成功'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '更新失败',
        message: '组织信息更新失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (organizationId: string | number) => {
    // 修复ID类型匹配问题 - 支持字符串和数字类型的ID
    const organization = organizations.find(d => 
      d.id === organizationId || 
      String(d.id) === String(organizationId) ||
      Number(d.id) === organizationId
    );
    
    if (!organization) {
      return;
    }

    // 检查是否有子组织 - 修复ID类型匹配问题
    const hasChildren = organizations.some(d => 
      d.parentId === organizationId || 
      String(d.parentId) === String(organizationId) ||
      Number(d.parentId) === organizationId
    );
    
    if (hasChildren) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '该组织下还有子组织，请先删除子组织后再删除'
      });
      return;
    }

    setDeletingOrganization(organization);
    setShowDeleteDialog(true);
  };

  // 执行删除组织
  const handleDeleteOrganization = async () => {
    if (!deletingOrganization) return;

    setLoading(true);
    try {
      const response = await services.userManagement.deleteOrganization(deletingOrganization.id.toString());
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete organization');
      }
      
      setOrganizations(prev => prev.filter(organization => organization.id !== deletingOrganization.id));
      setShowDeleteDialog(false);
      setDeletingOrganization(null);
      
      addToast({
        type: 'success',
        title: '删除成功',
        message: '组织删除成功'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '组织删除失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑Modal
  const openEditModal = (organization: Organization) => {
    setEditingOrganization(organization);
    setEditForm({
      name: organization.name,
      type: organization.type,
      parentId: organization.parentId,
      sortOrder: organization.sortOrder
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // 获取父组织名称
  const getParentOrganizationName = (parentId?: string | number) => {
    if (!parentId) return '-';
    const parent = organizations.find(d => 
      d.id === parentId || 
      String(d.id) === String(parentId)
    );
    return parent ? parent.name : '-';
  };

  // 状态标签样式
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'success' : 'secondary';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? '启用' : '禁用';
  };

  // 层级标签样式
  const getLevelBadgeVariant = (level: number, type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' => {
    const typeColorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Company': 'primary',
      'Division': 'info',
      'Department': 'warning',
      'Section': 'success'
    };
    return typeColorMap[type] || 'secondary';
  };

  const getLevelText = (level: number, type: string) => {
    const typeMap: Record<string, string> = {
      'Company': '公司',
      'Division': '事业部', 
      'Department': '部门',
      'Section': '课别'
    };
    
    // 如果有明确的类型映射，使用类型映射
    if (typeMap[type]) {
      return typeMap[type];
    }
    
    // 根据层级显示对应的组织类型
    const levelMap: Record<number, string> = {
      1: '公司',
      2: '事业部',
      3: '部门',
      4: '课别'
    };
    
    return levelMap[level] || `${level}级部门`;
  };

  // 移动端递归渲染树形结构
  // 移动端切换展开/折叠状态
  const toggleMobileExpand = (nodeId: string) => {
    const newExpandedKeys = new Set(mobileExpandedKeys);
    if (newExpandedKeys.has(nodeId)) {
      newExpandedKeys.delete(nodeId);
    } else {
      newExpandedKeys.add(nodeId);
    }
    setMobileExpandedKeys(newExpandedKeys);
  };

  const renderMobileTreeView = (nodes: TreeTableNode[], depth: number = 0): React.ReactNode[] => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <Card className={`shadow-sm ${depth > 0 ? 'ml-4 border-l-4 border-blue-200' : ''}`}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  {node.children && node.children.length > 0 && (
                    <button
                      onClick={() => toggleMobileExpand(node.id)}
                      className="mr-2 p-1 rounded hover:bg-gray-100 transition-colors"
                      title={mobileExpandedKeys.has(node.id) ? '折叠' : '展开'}
                    >
                      <span className={`text-gray-500 transition-transform duration-200 ${
                        mobileExpandedKeys.has(node.id) ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'
                      }`}></span>
                    </button>
                  )}
                  <div className={`w-2 h-2 rounded-full mr-2 ${depth === 0 ? 'bg-blue-500' : depth === 1 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <h3 className="font-medium text-gray-900 text-base mr-2">
                    {node.name}
                  </h3>
                  <Badge variant={getLevelBadgeVariant(node.level, node.type || 'Department')} className="text-xs">
                    {getLevelText(node.level, node.type || 'Department')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 w-16">人员:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {node.userCount} 人
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 w-16">创建:</span>
                    <span className="text-xs text-gray-500">
                      {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  {node.children && node.children.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-16">子组织:</span>
                      <span className="text-xs text-blue-600">
                        {node.children.length} 个
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const organization = organizations.find(d => String(d.id) === node.id);
                    if (organization) openEditModal(organization);
                  }}
                  disabled={loading}
                  className="px-3 py-2 text-xs flex items-center"
                  title="编辑组织"
                >
                  <span className="i-carbon-edit mr-1"></span>
                  编辑
                </Button>
                <PermissionGate roles={['superadmin']}>
                  {node.userCount === 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDeleteDialog(Number(node.id))}
                      disabled={loading}
                      className="px-3 py-2 text-xs flex items-center"
                      title="删除组织"
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
        {/* 递归渲染子组织 - 只在展开状态下显示 */}
        {node.children && node.children.length > 0 && mobileExpandedKeys.has(node.id) && renderMobileTreeView(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  // 树形表格列配置
  const treeColumns: TreeTableColumn[] = [
    {
      key: 'name',
      title: '组织名称',
      width: '300px'
    },
    {
      key: 'level',
      title: '层级',
      width: '100px',
      render: (value, record: any) => (
        <Badge variant={getLevelBadgeVariant(value, record.type || 'Department')} className="text-xs">
          {getLevelText(value, record.type || 'Department')}
        </Badge>
      )
    },
    {
      key: 'userCount',
      title: '人员数量',
      width: '100px',
      render: (value) => (
        <span className="text-sm font-medium text-blue-600">{value}</span>
      )
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (_, record) => (
        <div className="flex gap-1 min-w-max">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const organization = organizations.find(d => String(d.id) === record.id);
              if (organization) openEditModal(organization);
            }}
            disabled={loading}
            className="px-2 py-1 text-xs flex items-center justify-center"
            title="编辑组织"
          >
            <span className="i-carbon-edit text-sm"></span>
          </Button>
          
          <PermissionGate roles={['superadmin']}>
            {record.userCount === 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => openDeleteDialog(Number(record.id))}
                disabled={loading}
                className="px-2 py-1 text-xs flex items-center justify-center"
                title="删除组织"
              >
                <span className="i-carbon-delete text-sm"></span>
              </Button>
            )}
          </PermissionGate>
        </div>
      )
    }
  ];

  return (
    <ModernLayout title="组织架构" subtitle="管理公司组织架构体系">
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="w-full sm:w-80">
                    <Input
                      placeholder="搜索组织（名称）"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<span className="i-carbon-search"></span>}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    共 {treeData.reduce((count, root) => {
                      const countNodes = (nodes: TreeTableNode[]): number => {
                        return nodes.reduce((sum, node) => {
                          return sum + 1 + (node.children ? countNodes(node.children) : 0);
                        }, 0);
                      };
                      return count + countNodes([root]);
                    }, 0)} 个组织
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandAll(!expandAll)}
                    className="flex items-center"
                  >
                    <span className={`i-carbon-${expandAll ? 'collapse-all' : 'expand-all'} mr-2`}></span>
                    {expandAll ? '折叠全部' : '展开全部'}
                  </Button>
                  
                  <PermissionGate roles={['superadmin']}>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center"
                      size="sm"
                    >
                      <span className="i-carbon-add mr-2"></span>
                      新增组织
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 移动端卡片式布局 */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
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
            ) : (
              renderMobileTreeView(treeData, 0)
            )}
            
            {!loading && treeData.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-gray-500">暂无组织数据</p>
              </Card>
            )}
          </div>

          {/* 桌面端树形表格布局 */}
          <Card className="hidden lg:block">
            <CardBody className="p-0">
              <TreeTable
                columns={treeColumns}
                data={treeData}
                loading={loading}
                emptyMessage="暂无组织数据"
                expandAll={expandAll}
                indentSize={24}
              />
            </CardBody>
          </Card>
        </div>

        {/* 创建组织Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="新增组织"
        >
          <div className="space-y-3">
            <Input
              label="组织名称 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入组织名称"
              size="sm"
            />
            
            <Select
              label="组织类型 *"
              value={createForm.type}
              onChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}
              options={[
                { value: 'Company', label: '公司' },
                { value: 'Division', label: '事业部' },
                { value: 'Department', label: '部门' },
                { value: 'Section', label: '课别' }
              ]}
              error={formErrors.type}
              size="sm"
            />
            
            <Select
              label="上级组织"
              value={createForm.parentId || ''}
              onChange={(value) => setCreateForm(prev => ({ ...prev, parentId: value || undefined }))}
              options={[
                { value: '', label: '无（创建根级组织）' },
                ...getParentOrganizationOptions()
              ]}
              size="sm"
            />
            
            <Input
              label="排序顺序"
              type="number"
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              placeholder="请输入排序顺序（数字）"
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
              onClick={handleCreateOrganization}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 编辑组织Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="编辑组织"
        >
          <div className="space-y-3">
            <Input
              label="组织名称 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入组织名称"
              size="sm"
            />
            
            <Select
              label="组织类型 *"
              value={editForm.type}
              onChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
              options={[
                { value: 'Company', label: '公司' },
                { value: 'Division', label: '事业部' },
                { value: 'Department', label: '部门' },
                { value: 'Section', label: '课别' }
              ]}
              error={formErrors.type}
              size="sm"
            />
            
            <Select
              label="上级组织"
              value={editForm.parentId || ''}
              onChange={(value) => setEditForm(prev => ({ ...prev, parentId: value || undefined }))}
              options={[
                { value: '', label: '无（根级组织）' },
                ...getParentOrganizationOptions().filter(opt => opt.value !== editingOrganization?.id)
              ]}
              size="sm"
            />
            
            <Input
              label="排序顺序"
              type="number"
              value={editForm.sortOrder}
              onChange={(e) => setEditForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              placeholder="请输入排序顺序（数字）"
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
              onClick={handleEditOrganization}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 删除组织确认对话框 */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeletingOrganization(null);
          }}
          onConfirm={handleDeleteOrganization}
          title="删除组织"
          message={`您确定要删除组织 "${deletingOrganization?.name}" 吗？此操作不可恢复。`}
          confirmText="删除"
          cancelText="取消"
          confirmType="danger"
          loading={loading}
          userInfo={deletingOrganization ? {
            name: deletingOrganization.name,
            employeeId: deletingOrganization.name,
            role: getLevelText(deletingOrganization.level, deletingOrganization.type || 'Department')
          } : undefined}
        />
      </PermissionGate>
    </ModernLayout>
  );
};

export default DepartmentManagementPage;