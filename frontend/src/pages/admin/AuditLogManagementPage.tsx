// AuditLogManagementPage.tsx - 审计日志管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../../components/ModernLayout';
import { 
  Button, Card, CardBody, Input, Select, Table, Badge, Modal, ModalFooter, 
  Pagination, useToast 
} from '../../components/ui';
import PermissionGate from '../../components/auth/PermissionGate';
import { apiService } from '../../services/apiService';
import type { AuditLogDto } from '../../services/apiService';

const AuditLogManagementPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const { addToast } = useToast();

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
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
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
        pageIndex: currentPage - 1,
        pageSize
      };

      const response = await apiService.getAuditLogs(params);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load audit logs');
      }
      
      setAuditLogs(response.data?.items || []);
      setTotal(response.data?.totalCount || 0);
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
  const viewLogDetail = (log: AuditLogDto) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // 清理过期日志
  const handleCleanupLogs = async () => {
    setLoading(true);
    try {
      const response = await apiService.cleanupOldAuditLogs(cleanupDays);
      
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
      render: (value: string, record: AuditLogDto) => (
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
      render: (value?: string, record?: AuditLogDto) => (
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
      render: (_: any, record: AuditLogDto) => (
        <Button
          variant="outline"
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
                  options={[
                    { value: '', label: '全部' },
                    { value: 'Create', label: '创建' },
                    { value: 'Update', label: '更新' },
                    { value: 'Delete', label: '删除' },
                    { value: 'Login', label: '登录' },
                    { value: 'Logout', label: '登出' }
                  ]}
                  size="sm"
                />
                
                <Select
                  placeholder="实体类型"
                  value={filters.entityType}
                  onChange={(value) => handleFilterChange('entityType', value)}
                  options={[
                    { value: '', label: '全部' },
                    { value: 'ProductType', label: '产品类型' },
                    { value: 'ModelClassification', label: '机型分类' },
                    { value: 'CodeClassification', label: '代码分类' },
                    { value: 'CodeUsage', label: '代码使用' },
                    { value: 'User', label: '用户' },
                    { value: 'Role', label: '角色' }
                  ]}
                  size="sm"
                />
                
                <Select
                  placeholder="操作结果"
                  value={filters.result}
                  onChange={(value) => handleFilterChange('result', value)}
                  options={[
                    { value: '', label: '全部' },
                    { value: 'Success', label: '成功' },
                    { value: 'Failed', label: '失败' }
                  ]}
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
                  <Button variant="outline" size="sm" onClick={handleReset}>
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
                    variant="outline"
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
                    variant="outline"
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
          size="lg"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">用户</label>
                  <div>{selectedLog.username} (ID: {selectedLog.userId})</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">操作</label>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">实体类型</label>
                  <div>{selectedLog.entityType || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">实体ID</label>
                  <div>{selectedLog.entityId || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">结果</label>
                  <Badge variant={getResultBadgeVariant(selectedLog.result)}>
                    {selectedLog.result}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">耗时</label>
                  <div>{selectedLog.durationMs ? `${selectedLog.durationMs}ms` : '-'}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <div className="mt-1 text-sm">{selectedLog.description}</div>
              </div>
              
              {selectedLog.oldValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">变更前数据</label>
                  <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">变更后数据</label>
                  <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP地址</label>
                  <div>{selectedLog.ipAddress || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">请求路径</label>
                  <div>{selectedLog.requestPath || '-'}</div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">用户代理</label>
                  <div className="text-xs break-all">{selectedLog.userAgent || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">操作时间</label>
                  <div>{formatDateTime(selectedLog.createdAt)}</div>
                </div>
              </div>
              
              {selectedLog.errorMessage && (
                <div>
                  <label className="block text-sm font-medium text-red-700">错误信息</label>
                  <div className="mt-1 text-sm text-red-600">{selectedLog.errorMessage}</div>
                </div>
              )}
            </div>
          )}
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              size="sm"
            >
              关闭
            </Button>
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
              variant="outline"
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