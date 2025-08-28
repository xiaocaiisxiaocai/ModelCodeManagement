// DepartmentManagementPage.tsx - 部门管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { Button, Card, CardBody, Input, Modal, ModalFooter, TreeTable, Badge, Select, useToast } from '../../components/ui';
import type { TreeTableColumn, TreeTableNode } from '../../components/ui';
import PermissionGate from '../../components/auth/PermissionGate';
import { rbacApiService } from '../../services/rbacApiService';
import type { Department } from '../../services/rbacApiService';

interface CreateDepartmentForm {
  code: string;
  name: string;
  type: string;
  parentId?: number;
  sortOrder?: number;
}

interface EditDepartmentForm extends CreateDepartmentForm {
}

const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(true);
  const [mobileExpandedKeys, setMobileExpandedKeys] = useState<Set<string>>(() => {
    // 初始状态根据expandAll决定
    return expandAll ? new Set() : new Set(); // 初始为空，等待数据加载后再更新
  });
  const { addToast } = useToast();
  
  // Modal状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // 表单状态
  const [createForm, setCreateForm] = useState<CreateDepartmentForm>({
    code: '',
    name: '',
    type: 'Department',
    parentId: undefined,
    sortOrder: 0
  });
  
  const [editForm, setEditForm] = useState<EditDepartmentForm>({
    code: '',
    name: '',
    type: 'Department',
    parentId: undefined,
    sortOrder: 0
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 加载数据
  useEffect(() => {
    loadDepartments();
  }, []);

  // 获取所有节点ID（包括子节点）
  const getAllDepartmentIds = (depts: Department[]): string[] => {
    const ids: string[] = [];
    const traverse = (depts: Department[]) => {
      depts.forEach(dept => {
        ids.push(String(dept.id));
        if (dept.children) {
          traverse(dept.children);
        }
      });
    };
    traverse(depts);
    return ids;
  };

  // 当expandAll状态变化时，更新移动端展开状态
  useEffect(() => {
    if (expandAll) {
      // 展开所有节点 - 获取所有部门ID（包括子部门）
      const allIds = getAllDepartmentIds(departments);
      setMobileExpandedKeys(new Set(allIds));
    } else {
      // 折叠所有节点
      setMobileExpandedKeys(new Set());
    }
  }, [expandAll, departments]);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      // 暂时使用分页API，因为树形API数据不完整
      const response = await rbacApiService.getDepartments({ pageSize: 100 });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load departments');
      }
      
      setDepartments(response.data?.departments || []);
    } catch (error) {
      addToast({
        type: 'error',
        title: '加载失败',
        message: '无法加载部门数据'
      });
    } finally {
      setLoading(false);
    }
  };

  // 构建树形结构数据 - 基于后端parentId的简单版本
  const buildTreeData = (): TreeTableNode[] => {
    if (departments.length === 0) return [];
    
    const departmentMap = new Map<number, Department & { children: Department[] }>();
    const rootDepartments: (Department & { children: Department[] })[] = [];
    
    // 首先创建所有部门的映射，并初始化children数组
    departments.forEach(dept => {
      departmentMap.set(dept.id, { ...dept, children: [] });
    });
    
    // 构建父子关系
    departments.forEach(dept => {
      const deptWithChildren = departmentMap.get(dept.id)!;
      if (dept.parentId) {
        const parent = departmentMap.get(dept.parentId);
        if (parent) {
          parent.children.push(deptWithChildren);
        } else {
          // 如果找不到父部门，视为根部门
          rootDepartments.push(deptWithChildren);
        }
      } else {
        rootDepartments.push(deptWithChildren);
      }
    });
    
    // 递归筛选函数
    const filterDepartments = (depts: (Department & { children: Department[] })[]): TreeTableNode[] => {
      const results: TreeTableNode[] = [];
      
      for (const dept of depts) {
        // 检查当前部门是否匹配搜索条件
        const matchesSearch = !searchTerm || 
          dept.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 递归筛选子部门
        const filteredChildren = dept.children.length > 0 ? filterDepartments(dept.children) : [];
        
        // 如果当前部门匹配条件，或者有匹配的子部门，则包含此部门
        if (matchesSearch || filteredChildren.length > 0) {
          results.push({
            id: String(dept.id),
            name: dept.name,
            level: dept.level,
            type: dept.type,
            userCount: dept.userCount || 0,
            createdAt: dept.createdAt || new Date().toISOString(),
            children: filteredChildren.length > 0 ? filteredChildren : undefined
          });
        }
      }
      
      return results.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    };
    
    return filterDepartments(rootDepartments);
  };
  
  const treeData = buildTreeData();
  
  // 验证父子关系
  const parentIds = departments.map(d => d.parentId).filter(Boolean);
  const existingIds = departments.map(d => d.id);
  const missingParents = parentIds.filter(pid => !existingIds.includes(pid));

  // 获取父级部门选项（用于创建子部门）
  const getParentDepartmentOptions = () => {
    return departments
      .filter(dept => dept.level === 1)
      .map(dept => ({
        value: dept.id,
        label: dept.name
      }));
  };

  // 表单验证
  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!createForm.code.trim()) {
      errors.code = '部门编码不能为空';
    } else if (departments.some(d => d.code === createForm.code)) {
      errors.code = '部门编码已存在';
    }

    if (!createForm.name.trim()) {
      errors.name = '部门名称不能为空';
    }

    if (!createForm.type.trim()) {
      errors.type = '部门类型不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.code.trim()) {
      errors.code = '部门编码不能为空';
    } else if (departments.some(d => d.code === editForm.code && d.id !== editingDepartment?.id)) {
      errors.code = '部门编码已存在';
    }

    if (!editForm.name.trim()) {
      errors.name = '部门名称不能为空';
    }

    if (!editForm.type.trim()) {
      errors.type = '部门类型不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 创建部门
  const handleCreateDepartment = async () => {
    if (!validateCreateForm()) return;

    setLoading(true);
    try {
      const response = await rbacApiService.createDepartment({
        code: createForm.code,
        name: createForm.name,
        type: createForm.type,
        parentId: createForm.parentId,
        sortOrder: createForm.sortOrder
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create department');
      }
      
      const newDepartment = response.data;
      setDepartments(prev => [...prev, newDepartment]);
      setShowCreateModal(false);
      setCreateForm({
        code: '',
        name: '',
        type: 'Department',
        parentId: undefined,
        sortOrder: 0
      });
      setFormErrors({});
      
      addToast({
        type: 'success',
        title: '创建成功',
        message: '部门创建成功'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '创建失败',
        message: '部门创建失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 编辑部门
  const handleEditDepartment = async () => {
    if (!validateEditForm() || !editingDepartment) return;

    setLoading(true);
    try {
      const response = await rbacApiService.updateDepartment(editingDepartment.id, {
        code: editForm.code,
        name: editForm.name,
        type: editForm.type,
        parentId: editForm.parentId,
        sortOrder: editForm.sortOrder
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update department');
      }
      
      const updatedDepartment = response.data;
      setDepartments(prev => prev.map(department => 
        department.id === editingDepartment.id ? updatedDepartment : department
      ));
      
      setShowEditModal(false);
      setEditingDepartment(null);
      setFormErrors({});
      
      addToast({
        type: 'success',
        title: '更新成功',
        message: '部门信息更新成功'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '更新失败',
        message: '部门信息更新失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除部门
  const handleDeleteDepartment = async (departmentId: number) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;

    // 检查是否有子部门
    const hasChildren = departments.some(d => d.parentId === departmentId);
    if (hasChildren) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '该部门下还有子部门，请先删除子部门后再删除'
      });
      return;
    }

    if (!confirm('确定要删除这个部门吗？')) return;

    setLoading(true);
    try {
      const response = await rbacApiService.deleteDepartment(departmentId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete department');
      }
      
      setDepartments(prev => prev.filter(department => department.id !== departmentId));
      
      addToast({
        type: 'success',
        title: '删除成功',
        message: '部门删除成功'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '删除失败',
        message: '部门删除失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑Modal
  const openEditModal = (department: Department) => {
    setEditingDepartment(department);
    setEditForm({
      code: department.code,
      name: department.name,
      type: department.type,
      parentId: department.parentId,
      sortOrder: department.sortOrder
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // 获取父部门名称
  const getParentDepartmentName = (parentId?: number) => {
    if (!parentId) return '-';
    const parent = departments.find(d => d.id === parentId);
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
  const getLevelBadgeVariant = (level: number, type: string) => {
    const typeColorMap: Record<string, string> = {
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
    return typeMap[type] || `${level}级部门`;
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
                      <span className="text-xs text-gray-500 w-16">子部门:</span>
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
                    const department = departments.find(d => String(d.id) === node.id);
                    if (department) openEditModal(department);
                  }}
                  disabled={loading}
                  className="px-3 py-2 text-xs flex items-center"
                  title="编辑部门"
                >
                  <span className="i-carbon-edit mr-1"></span>
                  编辑
                </Button>
                <PermissionGate roles={['superadmin']}>
                  {node.userCount === 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteDepartment(Number(node.id))}
                      disabled={loading}
                      className="px-3 py-2 text-xs flex items-center"
                      title="删除部门"
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
        {/* 递归渲染子部门 - 只在展开状态下显示 */}
        {node.children && node.children.length > 0 && mobileExpandedKeys.has(node.id) && renderMobileTreeView(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  // 树形表格列配置
  const treeColumns: TreeTableColumn[] = [
    {
      key: 'name',
      title: '部门名称',
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
        <div className="text-center">
          <span className="text-sm font-medium text-blue-600">{value}</span>
        </div>
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
              const department = departments.find(d => String(d.id) === record.id);
              if (department) openEditModal(department);
            }}
            disabled={loading}
            className="px-2 py-1 text-xs flex items-center justify-center"
            title="编辑部门"
          >
            <span className="i-carbon-edit text-sm"></span>
          </Button>
          
          <PermissionGate roles={['superadmin']}>
            {record.userCount === 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteDepartment(Number(record.id))}
                disabled={loading}
                className="px-2 py-1 text-xs flex items-center justify-center"
                title="删除部门"
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
    <ModernLayout title="部门管理" subtitle="管理组织部门结构">
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
                      placeholder="搜索部门（名称）"
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
                    }, 0)} 个部门
                  </div>
                  
                  <Button
                    variant="outline"
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
                      新增部门
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
                <p className="text-gray-500">暂无部门数据</p>
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
                emptyMessage="暂无部门数据"
                expandAll={expandAll}
                indentSize={24}
              />
            </CardBody>
          </Card>
        </div>

        {/* 创建部门Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="新增部门"
        >
          <div className="space-y-3">
            <Input
              label="部门编码 *"
              value={createForm.code}
              onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
              error={formErrors.code}
              placeholder="请输入部门编码（如：TECH）"
              size="sm"
            />
            
            <Input
              label="部门名称 *"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入部门名称"
              size="sm"
            />
            
            <Select
              label="部门类型 *"
              value={createForm.type}
              onChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}
              options={[
                { value: 'Department', label: '部门' },
                { value: 'Division', label: '事业部' },
                { value: 'Company', label: '公司' }
              ]}
              error={formErrors.type}
              size="sm"
            />
            
            <Select
              label="上级部门"
              value={createForm.parentId || ''}
              onChange={(value) => setCreateForm(prev => ({ ...prev, parentId: value ? parseInt(value) : undefined }))}
              options={[
                { value: '', label: '无（创建一级部门）' },
                ...getParentDepartmentOptions()
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
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDepartment}
              loading={loading}
              size="sm"
            >
              确定
            </Button>
          </ModalFooter>
        </Modal>

        {/* 编辑部门Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="编辑部门"
        >
          <div className="space-y-3">
            <Input
              label="部门编码 *"
              value={editForm.code}
              onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
              error={formErrors.code}
              placeholder="请输入部门编码"
              size="sm"
            />
            
            <Input
              label="部门名称 *"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              placeholder="请输入部门名称"
              size="sm"
            />
            
            <Select
              label="部门类型 *"
              value={editForm.type}
              onChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
              options={[
                { value: 'Department', label: '部门' },
                { value: 'Division', label: '事业部' },
                { value: 'Company', label: '公司' }
              ]}
              error={formErrors.type}
              size="sm"
            />
            
            <Select
              label="上级部门"
              value={editForm.parentId || ''}
              onChange={(value) => setEditForm(prev => ({ ...prev, parentId: value ? parseInt(value) : undefined }))}
              options={[
                { value: '', label: '无（一级部门）' },
                ...getParentDepartmentOptions().filter(opt => parseInt(opt.value) !== editingDepartment?.id)
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
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditDepartment}
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

export default DepartmentManagementPage;