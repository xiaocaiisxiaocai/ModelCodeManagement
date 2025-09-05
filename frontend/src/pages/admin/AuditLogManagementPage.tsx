// AuditLogManagementPage.tsx - 审计日志管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { 
  Button, Card, CardBody, Input, Select, Table, Badge, Modal, ModalFooter, 
  Pagination 
} from '../../components/ui';
import { useToastContext } from '../../contexts/ToastContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { services } from '../../services';
import type { AuditLog } from '../../types/domain';

const AuditLogManagementPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const { addToast } = useToastContext();
  
  // 动态选项状态
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);
  const [availableResults, setAvailableResults] = useState<string[]>([]);

  // 筛选状态
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    entityType: '',
    result: '',
    startDate: '',
    endDate: ''
  });

  // Modal状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);

  // 加载数据
  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: currentPage,
        pageSize
      };

      const response = await services.auditLog.getAuditLogs(params);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load audit logs');
      }
      
      const logs = response.data || [];
      setAuditLogs(logs);
      setTotal(response.totalCount || 0);
      
      // 动态提取可用选项
      updateAvailableOptions(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      addToast({
        type: 'error',
        title: '加载失败',
        message: '无法加载审计日志数据'
      });
    } finally {
      setLoading(false);
    }
  };

  // 动态更新可用选项
  const updateAvailableOptions = (logs: AuditLog[]) => {
    // 提取所有唯一的操作类型
    const actions = [...new Set(logs.map(log => log.action).filter(Boolean))].sort();
    setAvailableActions(actions);
    
    // 提取所有唯一的实体类型
    const entityTypes = [...new Set(logs.map(log => log.entityType).filter(Boolean))].sort();
    setAvailableEntityTypes(entityTypes);
    
    // 提取所有唯一的操作结果
    const results = [...new Set(logs.map(log => log.result).filter(Boolean))].sort();
    setAvailableResults(results);
  };

  // 生成操作类型选项
  const getActionOptions = () => {
    return [
      { value: '', label: '全部' },
      ...availableActions.map(action => ({
        value: action,
        label: getActionLabel(action)
      }))
    ];
  };

  // 生成实体类型选项
  const getEntityTypeOptions = () => {
    return [
      { value: '', label: '全部' },
      ...availableEntityTypes.map(entityType => ({
        value: entityType,
        label: getEntityTypeLabel(entityType)
      }))
    ];
  };

  // 生成操作结果选项
  const getResultOptions = () => {
    return [
      { value: '', label: '全部' },
      ...availableResults.map(result => ({
        value: result,
        label: getResultLabel(result)
      }))
    ];
  };

  // 获取操作类型的中文标签
  const getActionLabel = (action: string): string => {
    const actionLabels: Record<string, string> = {
      'CreateUser': '创建用户',
      'UpdateUser': '更新用户',
      'DeleteUser': '删除用户',
      'ResetUserPassword': '重置密码',
      'CreateRole': '创建角色',
      'UpdateRole': '更新角色',
      'DeleteRole': '删除角色',
      'AssignRolePermissions': '分配角色权限',
      'CreateOrganization': '创建组织',
      'UpdateOrganization': '更新组织',
      'DeleteOrganization': '删除组织',
      'CreatePermission': '创建权限',
      'UpdatePermission': '更新权限',
      'DeletePermission': '删除权限',
      'Login': '登录',
      'Logout': '登出'
    };
    return actionLabels[action] || action;
  };

  // 获取实体类型的中文标签
  const getEntityTypeLabel = (entityType: string): string => {
    const entityTypeLabels: Record<string, string> = {
      'User': '用户',
      'Role': '角色',
      'Organization': '组织',
      'Permission': '权限',
      'Auth': '认证',
      'ProductType': '产品类型',
      'ModelClassification': '机型分类',
      'CodeClassification': '代码分类',
      'CodeUsage': '代码使用'
    };
    return entityTypeLabels[entityType] || entityType;
  };

  // 获取操作结果的中文标签
  const getResultLabel = (result: string): string => {
    const resultLabels: Record<string, string> = {
      'Success': '成功',
      'Failed': '失败',
      'Error': '错误'
    };
    return resultLabels[result] || result;
  };

  // 安全解析JSON
  const safeParseJSON = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return jsonString; // 如果解析失败，返回原始字符串
    }
  };

  // 复制日志详情
  const copyLogDetails = async (log: AuditLog) => {
    const details = [
      `审计日志详情`,
      `==================`,
      `用户: ${log.username} (ID: ${log.userId})`,
      `操作: ${getActionLabel(log.action)} (${log.action})`,
      `结果: ${getResultLabel(log.result)} (${log.result})`,
      `描述: ${log.description}`,
      `操作时间: ${formatDateTime(log.createdAt)}`,
      log.durationMs ? `执行耗时: ${log.durationMs}ms` : null,
      log.entityType ? `实体类型: ${getEntityTypeLabel(log.entityType)} (${log.entityType})` : null,
      log.entityId ? `实体ID: ${log.entityId}` : null,
      log.ipAddress ? `IP地址: ${log.ipAddress}` : null,
      log.requestPath ? `请求路径: ${log.requestPath}` : null,
      log.userAgent ? `用户代理: ${log.userAgent}` : null,
      log.oldValue ? `变更前数据:\n${JSON.stringify(safeParseJSON(log.oldValue), null, 2)}` : null,
      log.newValue ? `变更后数据:\n${JSON.stringify(safeParseJSON(log.newValue), null, 2)}` : null,
      log.errorMessage ? `错误信息: ${log.errorMessage}` : null
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(details);
      addToast({
        type: 'success',
        title: '复制成功',
        message: '审计日志详情已复制到剪贴板'
      });
    } catch (error) {
      console.error('Failed to copy log details:', error);
      addToast({
        type: 'error',
        title: '复制失败',
        message: '无法复制到剪贴板，请手动选择内容复制'
      });
    }
  };

  // 筛选处理
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadAuditLogs();
  };

  const handleReset = () => {
    setFilters({
      username: '',
      action: '',
      entityType: '',
      result: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  // 查看详情
  const viewLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // 清理过期日志
  const handleCleanupLogs = async () => {
    setLoading(true);
    try {
      const response = await services.auditLog.cleanupOldAuditLogs(cleanupDays);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to cleanup logs');
      }
      
      setShowCleanupModal(false);
      loadAuditLogs();
      
      addToast({
        type: 'success',
        title: '清理成功',
        message: `已清理 ${cleanupDays} 天前的日志`
      });
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
      addToast({
        type: 'error',
        title: '清理失败',
        message: '清理审计日志失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 获取操作结果标签样式
  const getResultBadgeVariant = (result: string) => {
    switch (result.toLowerCase()) {
      case 'success': return 'success';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  // 获取操作类型标签样式
  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'success';
      case 'update': return 'warning';
      case 'delete': return 'danger';
      case 'login': return 'info';
      case 'logout': return 'secondary';
      default: return 'primary';
    }
  };

  // 表格列定义
  const columns = [
    {
      key: 'username',
      title: '用户',
      width: '120px',
      render: (value: string, record: AuditLog) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">ID: {record.userId}</div>
        </div>
      )
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (value: string) => (
        <Badge variant={getActionBadgeVariant(value)} className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'entityType',
      title: '实体类型',
      width: '120px',
      render: (value?: string, record?: AuditLog) => (
        <div>
          <div>{value || '-'}</div>
          {record?.entityId && (
            <div className="text-xs text-gray-500">ID: {record.entityId}</div>
          )}
        </div>
      )
    },
    {
      key: 'description',
      title: '描述',
      width: '200px',
      render: (value: string) => (
        <div className="truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'result',
      title: '结果',
      width: '80px',
      render: (value: string) => (
        <Badge variant={getResultBadgeVariant(value)} className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: '操作时间',
      width: '150px',
      render: (value: string) => (
        <div className="text-sm">
          {formatDateTime(value)}
        </div>
      )
    },
    {
      key: 'durationMs',
      title: '耗时',
      width: '80px',
      render: (value?: number) => (
        <div className="text-sm text-gray-600">
          {value ? `${value}ms` : '-'}
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '80px',
      render: (_: any, record: AuditLog) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => viewLogDetail(record)}
          className="px-2 py-1 text-xs"
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <ModernLayout title="审计日志" subtitle="查看系统操作审计日志">
      <PermissionGate 
        roles={['admin', 'superadmin']}
        fallback={
          <Card className="p-8 text-center">
            <p className="text-gray-500">您没有权限访问此页面</p>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* 筛选栏 */}
          <Card>
            <CardBody className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                <Input
                  placeholder="用户名"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  size="sm"
                />
                
                <Select
                  placeholder="操作类型"
                  value={filters.action}
                  onChange={(value) => handleFilterChange('action', value)}
                  options={getActionOptions()}
                  size="sm"
                />
                
                <Select
                  placeholder="实体类型"
                  value={filters.entityType}
                  onChange={(value) => handleFilterChange('entityType', value)}
                  options={getEntityTypeOptions()}
                  size="sm"
                />
                
                <Select
                  placeholder="操作结果"
                  value={filters.result}
                  onChange={(value) => handleFilterChange('result', value)}
                  options={getResultOptions()}
                  size="sm"
                />
                
                <Input
                  type="date"
                  placeholder="开始日期"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  size="sm"
                />
                
                <Input
                  type="date"
                  placeholder="结束日期"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  size="sm"
                />
              </div>
              
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div className="flex gap-3">
                  <Button variant="primary" size="sm" onClick={handleSearch}>
                    <span className="i-carbon-search mr-2"></span>搜索
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    重置
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="text-sm text-gray-600">
                    共 {total} 条记录
                  </div>
                  
                  <PermissionGate roles={['superadmin']}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowCleanupModal(true)}
                      className="flex items-center"
                    >
                      <span className="i-carbon-clean mr-2"></span>清理日志
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
            ) : auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <Card key={log.id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <div className="font-medium text-gray-900 text-base mr-2">
                            {log.username}
                          </div>
                          <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                            {log.action}
                          </Badge>
                          <Badge variant={getResultBadgeVariant(log.result)} className="text-xs ml-2">
                            {log.result}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 truncate" title={log.description}>
                          {log.description}
                        </div>
                        <div className="space-y-1">
                          {log.entityType && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-16">实体:</span>
                              <span className="text-xs text-gray-600">
                                {log.entityType}
                                {log.entityId && ` (ID: ${log.entityId})`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">时间:</span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          {log.durationMs && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-16">耗时:</span>
                              <span className="text-xs text-gray-500">
                                {log.durationMs}ms
                              </span>
                            </div>
                          )}
                          {log.ipAddress && (
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 w-16">IP:</span>
                              <span className="text-xs text-gray-500">
                                {log.ipAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => viewLogDetail(log)}
                          className="px-3 py-2 text-xs flex items-center"
                          title="查看详情"
                        >
                          <span className="i-carbon-view mr-1"></span>
                          查看
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">暂无审计日志</p>
              </Card>
            )}
            
            {/* 移动端分页 */}
            {total > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-xs flex items-center"
                  >
                    上一页
                  </Button>
                  
                  <div className="text-xs text-gray-600">
                    第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(total / pageSize)}
                    className="px-3 py-2 text-xs flex items-center"
                  >
                    下一页
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* 桌面端表格布局 */}
          <Card className="hidden lg:block">
            <CardBody className="p-0">
              <Table
                columns={columns}
                data={auditLogs}
                loading={loading}
                emptyMessage="暂无审计日志"
              />
              
              {total > 0 && (
                <div className="p-4 border-t">
                  <Pagination
                    current={currentPage}
                    total={total}
                    pageSize={pageSize}
                    onChange={setCurrentPage}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* 日志详情Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="审计日志详情"
          size="xl"
        >
          {selectedLog && (
            <div className="space-y-6">
              {/* 主要信息卡片 */}
              <Card className="border-l-4 border-l-blue-500">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="i-carbon-user mr-2"></span>
                        {selectedLog.username}
                        <span className="text-sm font-normal text-gray-500 ml-2">(ID: {selectedLog.userId})</span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedLog.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getActionBadgeVariant(selectedLog.action)} className="text-sm">
                        {getActionLabel(selectedLog.action)}
                      </Badge>
                      <Badge variant={getResultBadgeVariant(selectedLog.result)} className="text-sm">
                        {getResultLabel(selectedLog.result)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="i-carbon-time text-gray-400"></span>
                      <div>
                        <div className="text-xs text-gray-500">操作时间</div>
                        <div className="text-sm font-medium">{formatDateTime(selectedLog.createdAt)}</div>
                      </div>
                    </div>
                    
                    {selectedLog.durationMs && (
                      <div className="flex items-center space-x-2">
                        <span className="i-carbon-timer text-gray-400"></span>
                        <div>
                          <div className="text-xs text-gray-500">执行耗时</div>
                          <div className="text-sm font-medium">{selectedLog.durationMs}ms</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedLog.entityType && (
                      <div className="flex items-center space-x-2">
                        <span className="i-carbon-data-base text-gray-400"></span>
                        <div>
                          <div className="text-xs text-gray-500">实体类型</div>
                          <div className="text-sm font-medium">
                            {getEntityTypeLabel(selectedLog.entityType)}
                            {selectedLog.entityId && (
                              <span className="text-gray-500 ml-1">(ID: {selectedLog.entityId})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedLog.ipAddress && (
                      <div className="flex items-center space-x-2">
                        <span className="i-carbon-network-1 text-gray-400"></span>
                        <div>
                          <div className="text-xs text-gray-500">IP地址</div>
                          <div className="text-sm font-medium">{selectedLog.ipAddress}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* 请求信息 */}
              {(selectedLog.requestPath || selectedLog.userAgent) && (
                <Card>
                  <CardBody className="p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="i-carbon-http text-blue-500 mr-2"></span>
                      请求信息
                    </h4>
                    <div className="space-y-3">
                      {selectedLog.requestPath && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">请求路径</label>
                          <div className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded border">{selectedLog.requestPath}</div>
                        </div>
                      )}
                      {selectedLog.userAgent && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">用户代理</label>
                          <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded border break-all">{selectedLog.userAgent}</div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* 数据变更对比 */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <Card>
                  <CardBody className="p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="i-carbon-compare text-orange-500 mr-2"></span>
                      数据变更
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {selectedLog.oldValue && (
                        <div>
                          <label className="block text-xs font-medium text-red-600 uppercase tracking-wider mb-2">
                            <span className="i-carbon-subtract mr-1"></span>
                            变更前
                          </label>
                          <div className="relative">
                            <pre className="text-xs bg-red-50 border border-red-200 p-3 rounded overflow-auto max-h-64 font-mono">
{JSON.stringify(safeParseJSON(selectedLog.oldValue), null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      {selectedLog.newValue && (
                        <div>
                          <label className="block text-xs font-medium text-green-600 uppercase tracking-wider mb-2">
                            <span className="i-carbon-add mr-1"></span>
                            变更后
                          </label>
                          <div className="relative">
                            <pre className="text-xs bg-green-50 border border-green-200 p-3 rounded overflow-auto max-h-64 font-mono">
{JSON.stringify(safeParseJSON(selectedLog.newValue), null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* 错误信息 */}
              {selectedLog.errorMessage && (
                <Card className="border-l-4 border-l-red-500">
                  <CardBody className="p-4">
                    <h4 className="text-md font-semibold text-red-700 mb-3 flex items-center">
                      <span className="i-carbon-warning text-red-500 mr-2"></span>
                      错误信息
                    </h4>
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                      <div className="text-sm text-red-800 font-mono">{selectedLog.errorMessage}</div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
          
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="secondary"
                onClick={() => copyLogDetails(selectedLog)}
                size="sm"
                className="flex items-center"
              >
                <span className="i-carbon-copy mr-1"></span>
                复制详情
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDetailModal(false)}
                size="sm"
              >
                关闭
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* 清理日志Modal */}
        <Modal
          isOpen={showCleanupModal}
          onClose={() => setShowCleanupModal(false)}
          title="清理过期日志"
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              此操作将清理指定天数之前的审计日志，该操作不可逆。
            </div>
            
            <Input
              label="保留天数"
              type="number"
              value={cleanupDays}
              onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)}
              placeholder="默认保留90天"
              size="sm"
            />
            
            <div className="text-sm text-orange-600">
              ⚠️ 将删除 {cleanupDays} 天前的所有审计日志
            </div>
          </div>
          
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCleanupModal(false)}
              disabled={loading}
              size="sm"
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleCleanupLogs}
              loading={loading}
              size="sm"
            >
              确认清理
            </Button>
          </ModalFooter>
        </Modal>
      </PermissionGate>
    </ModernLayout>
  );
};

export default AuditLogManagementPage;