import React, { useState, useEffect } from 'react';
import ModernLayout from '../components/ModernLayout';
import DataDictionaryModal from '../components/DataDictionaryModal';
import { Button, Card, CardBody, Input, Select, Table, Badge, Modal, ModalFooter } from '../components/ui';
import { services } from '../services';

const DataDictionaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'factories' | 'productNames' | 'occupancyTypes'>('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingData, setEditingData] = useState<any>(null);
  
  // 删除确认对话框状态
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // 数据状态
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 数据字典状态 - 直接使用后端返回的数据结构
  const [dataDictionary, setDataDictionary] = useState({
    customers: [] as any[],
    factories: [] as any[], 
    productNames: [] as any[],
    occupancyTypes: [] as any[]
  });
  
  // 标签配置
  const tabs = [
    { id: 'customers' as const, name: '客户', icon: 'i-carbon-user-multiple' },
    { id: 'factories' as const, name: '厂区', icon: 'i-carbon-building' },
    { id: 'productNames' as const, name: '品名', icon: 'i-carbon-tag' },
    { id: 'occupancyTypes' as const, name: '占用类型', icon: 'i-carbon-document' }
  ];
  
  // 使用现有的services加载数据字典数据
  const loadDataDictionary = async () => {
    setLoading(true);
    try {
      const [customersRes, factoriesRes, productNamesRes, occupancyTypesRes] = await Promise.all([
        services.dataDictionary.getCustomers(),
        services.dataDictionary.getFactories(),
        services.dataDictionary.getProductNames(),
        services.dataDictionary.getOccupancyTypes()
      ]);

      // 数据加载成功
        
        setDataDictionary({
        customers: customersRes.success ? customersRes.data || [] : [],
        factories: factoriesRes.success ? factoriesRes.data || [] : [],
        productNames: productNamesRes.success ? productNamesRes.data || [] : [],
        occupancyTypes: occupancyTypesRes.success ? occupancyTypesRes.data || [] : []
      });
      
    } catch (error) {
      console.error('❌ [DataDictionaryPage] 加载数据字典失败:', error);
        setDataDictionary({
          customers: [],
          factories: [],
          productNames: [],
          occupancyTypes: []
        });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadDataDictionary();
  }, []);

  // refreshTrigger变化时重新加载数据
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadDataDictionary();
    }
  }, [refreshTrigger]);

  // 切换tab时重置分页和搜索
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setSelectedCustomer('');
  }, [activeTab]);

  // 通用搜索过滤函数
  const getFilteredData = (data: any[], searchFields: string[]) => {
    // 确保 data 是数组
    if (!Array.isArray(data)) {
      return [];
    }
    
    if (!searchTerm) return data;
    
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  };
  
  // 根据选中客户过滤厂区
  const getFilteredFactories = () => {
    let factories = dataDictionary.factories;
    
    // 确保 factories 是数组
    if (!Array.isArray(factories)) {
      return [];
    }
    
    if (selectedCustomer) {
      factories = factories.filter(factory => {
        const factoryCustomerId = factory.CustomerId || factory.customerId || factory.ParentId || factory.parentId;
        return factoryCustomerId?.toString() === selectedCustomer.toString();
      });
    }
    
    if (searchTerm) {
      factories = factories.filter(factory => {
        const factoryName = (factory.Name || factory.name || '').toLowerCase();
        const factoryId = (factory.Id || factory.id || '').toString().toLowerCase();
        return factoryName.includes(searchTerm.toLowerCase()) ||
               factoryId.includes(searchTerm.toLowerCase());
      });
    }
    
    return factories;
  };
  
  // 分页处理
  const getPaginatedData = (data: any[]) => {
    // 确保 data 是数组
    if (!Array.isArray(data)) {
      return [];
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };
  
  const getTotalPages = (data: any[]) => {
    // 确保 data 是数组
    if (!Array.isArray(data)) {
      return 1;
    }
    
    return Math.ceil(data.length / pageSize);
  };
  
  // 处理操作
  const handleCreate = () => {
    setEditingData(null);
    setModalMode('create');
    setModalOpen(true);
  };
  
  const handleEdit = (item: any) => {
    setEditingData(item);
    setModalMode('edit');
    setModalOpen(true);
  };
  
  const handleDelete = (item: any) => {
    setDeleteTargetId(item.Id || item.id);
    setDeleteTargetName(item.Name || item.name);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    setLoading(true);
    try {
      const result = await services.dataDictionary.delete(deleteTargetId);
      
      if (result.success) {
        setRefreshTrigger(prev => prev + 1);
        setDeleteModalOpen(false);
        setDeleteTargetId('');
        setDeleteTargetName('');
      } else {
        console.error('❌ [DataDictionaryPage] 删除失败:', result.error);
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('❌ [DataDictionaryPage] 删除异常:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  const handleModalSave = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleModalClose = () => {
    setModalOpen(false);
    setEditingData(null);
  };
  
  // 分页控制
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 获取当前tab的数据类型
  const getCurrentDataType = () => {
    switch (activeTab) {
      case 'customers': return 'customer';
      case 'factories': return 'factory';
      case 'productNames': return 'productName';
      case 'occupancyTypes': return 'occupancyType';
      default: return 'customer';
    }
  };

  // 渲染统一的内容
  const renderContent = () => {
    let data: any[] = [];
    let headers: string[] = [];
    let searchPlaceholder = '';
    let itemName = '';
    let searchFields: string[] = [];
    
    switch (activeTab) {
      case 'customers':
        data = getFilteredData(dataDictionary.customers, ['id', 'name']);
        headers = ['客户ID', '客户名称', '厂区数量', '操作'];
        searchPlaceholder = '搜索客户（ID、名称）';
        itemName = '客户';
        break;
        
      case 'factories':
        data = getFilteredFactories();
        headers = ['厂区ID', '厂区名称', '所属客户', '操作'];
        searchPlaceholder = '搜索厂区（ID、名称）';
        itemName = '厂区';
        break;
        
      case 'productNames':
        data = getFilteredData(dataDictionary.productNames, ['id', 'name']);
        headers = ['品名ID', '品名名称', '操作'];
        searchPlaceholder = '搜索品名（ID、名称）';
        itemName = '品名';
        break;
        
      case 'occupancyTypes':
        data = getFilteredData(dataDictionary.occupancyTypes, ['id', 'name']);
        headers = ['类型ID', '类型名称', '操作'];
        searchPlaceholder = '搜索占用类型（ID、名称）';
        itemName = '占用类型';
        break;
        
    }
    
    const paginatedData = getPaginatedData(data);
    const totalPages = getTotalPages(data);
    
    // 获取表格数据
    const getTableData = () => {
      return paginatedData.map((item, index) => {
        const rowData = (() => {
        switch (activeTab) {
          case 'customers':
            return [
              <code key="id" className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {item.Id || item.id}
              </code>,
              <div key="name" className="font-medium text-gray-900">
                {item.Name || item.name}
              </div>,
              <div key="count" className="text-left font-mono text-sm font-medium text-blue-600">
                {dataDictionary.factories.filter(f => (f.CustomerId || f.customerId) === (item.Id || item.id)).length}
              </div>,
              <div key="actions" className="flex gap-1 min-w-max">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleEdit(item)} 
                  className="px-2 py-1 text-xs" 
                  title={`编辑${itemName}`}
                >
                  <span className="i-carbon-edit text-sm"></span>
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDelete(item)} 
                  className="px-2 py-1 text-xs" 
                  title={`删除${itemName}`}
                >
                  <span className="i-carbon-delete text-sm"></span>
                </Button>
              </div>
            ];
            
          case 'factories':
            return [
              <code key="id" className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {item.Id || item.id}
              </code>,
              <div key="name" className="font-medium text-gray-900">
                {item.Name || item.name}
              </div>,
              <span key="customer" className="text-sm text-gray-600">
                {dataDictionary.customers.find(c => (c.Id || c.id) === (item.CustomerId || item.customerId))?.Name || dataDictionary.customers.find(c => (c.Id || c.id) === (item.CustomerId || item.customerId))?.name || '-'}
              </span>,
              <div key="actions" className="flex gap-1 min-w-max">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleEdit(item)} 
                  className="px-2 py-1 text-xs" 
                  title={`编辑${itemName}`}
                >
                  <span className="i-carbon-edit text-sm"></span>
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDelete(item)} 
                  className="px-2 py-1 text-xs" 
                  title={`删除${itemName}`}
                >
                  <span className="i-carbon-delete text-sm"></span>
                </Button>
              </div>
            ];
            
          default:
            return [
              <code key="id" className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {item.Id || item.id}
              </code>,
              <div key="name" className="font-medium text-gray-900">
                {item.Name || item.name}
              </div>,
              <div key="actions" className="flex gap-1 min-w-max">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleEdit(item)} 
                  className="px-2 py-1 text-xs" 
                  title={`编辑${itemName}`}
                >
                  <span className="i-carbon-edit text-sm"></span>
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDelete(item)} 
                  className="px-2 py-1 text-xs" 
                  title={`删除${itemName}`}
                >
                  <span className="i-carbon-delete text-sm"></span>
                </Button>
              </div>
            ];
        }
        })();
        
        // 给每一行数据添加key
        return { key: item.Id || item.id || index, data: rowData };
      }).map(row => row.data);
    };
    
    // 获取移动端卡片数据
    const getMobileCardData = (item: any) => {
      switch (activeTab) {
        case 'customers':
          return (
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {item.id}
                </code>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">厂区:</span>
                <Badge variant="info" className="text-xs">
                  {dataDictionary.factories.filter(f => f.customerId === item.id).length} 个
                </Badge>
              </div>
            </div>
          );
          
        case 'factories':
          return (
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {item.Id || item.id}
                </code>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">客户:</span>
                <span className="text-sm text-gray-600">
                  {dataDictionary.customers.find(c => (c.Id || c.id) === (item.CustomerId || item.customerId))?.Name || dataDictionary.customers.find(c => (c.Id || c.id) === (item.CustomerId || item.customerId))?.name || '-'}
                </span>
              </div>
            </div>
          );
          
        default:
          return (
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16">ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {item.Id || item.id}
                </code>
              </div>
            </div>
          );
      }
    };
    
    return (
      <div className="h-full flex flex-col">
        {/* 操作栏 - 固定在顶部 */}
        <div className="flex-shrink-0">
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="w-full sm:w-80">
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<span className="i-carbon-search"></span>}
                      size="sm"
                    />
                  </div>
                  
                  {/* 第二个控件区域 - 保持布局一致性 */}
                  <div className="w-full sm:w-48">
                    {activeTab === 'factories' ? (
                      <Select
                        value={selectedCustomer}
                        onChange={(value) => setSelectedCustomer(value)}
                        options={[
                          { value: '', label: '全部客户' },
                          ...dataDictionary.customers.map(customer => ({
                            value: customer.Id || customer.id,
                            label: customer.Name || customer.name,
                            key: customer.Id || customer.id
                          }))
                        ]}
                        size="sm"
                      />
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    共 {data.length} 个{itemName}
                  </div>
                  
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    className="flex items-center"
                    size="sm"
                  >
                    <span className="i-carbon-add mr-2"></span>
                    新增{itemName}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 移动端卡片式布局 - 可滚动区域 */}
        <div className="lg:hidden flex-1 min-h-0 mt-6">
          <div className="h-full overflow-auto">
            <div className="space-y-4 pb-4">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <Card key={item.Id || item.id} className="shadow-sm">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-base mr-2">
                            {item.Name || item.name}
                          </h3>
                          <div className="mt-1">
                            {getMobileCardData(item)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="px-3 py-2 text-xs"
                            title={`编辑${itemName}`}
                          >
                            <span className="i-carbon-edit mr-1"></span>
                            编辑
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="px-3 py-2 text-xs"
                            title={`删除${itemName}`}
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
                  <p className="text-gray-500">暂无{itemName}数据</p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* 桌面端表格布局 - 可滚动区域 */}
        <div className="hidden lg:block flex-1 min-h-0 mt-6">
          <Card className="h-full">
            <CardBody className="p-0 h-full flex flex-col">
              {/* 表格容器 - 可滚动 */}
              <div className="flex-1 overflow-auto">
                <Table
                  headers={headers}
                  data={getTableData()}
                  emptyMessage={`暂无${itemName}数据`}
                  loading={loading}
                />
              </div>
              
              {/* 分页控件 - 固定在底部 */}
              {data.length > 0 && totalPages > 1 && (
                <div className="flex-shrink-0 border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.length)} 项，共 {data.length} 项
                      </span>
                      <Select
                        value={pageSize.toString()}
                        onChange={(value) => handlePageSizeChange(parseInt(value))}
                        options={[
                          { value: '10', label: '10条/页' },
                          { value: '20', label: '20条/页' },
                          { value: '50', label: '50条/页' },
                          { value: '100', label: '100条/页' }
                        ]}
                        size="sm"
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        上一页
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "primary" : "secondary"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* 移动端分页 */}
        {data.length > 0 && totalPages > 1 && (
          <div className="lg:hidden flex-shrink-0 mt-4">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <ModernLayout title="数据字典" subtitle="系统基础数据管理">
      <div className="h-full flex flex-col overflow-hidden max-w-none">
        {/* 标签导航 */}
        <div className="bg-white shadow rounded-lg flex-shrink-0">
          <div className="border-b border-gray-200">
            <div className="overflow-x-auto scrollbar-none">
              <nav className="-mb-px flex space-x-2 px-6 min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 flex-shrink-0 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={tab.icon}></span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* 内容区域 - 占满剩余空间 */}
        <div className="flex-1 min-h-0 mt-4 overflow-hidden">
          {renderContent()}
        </div>

        {/* 级联关系说明 - 固定在底部 */}
        {activeTab === 'factories' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 mt-1.5 flex-shrink-0">
            <div className="flex items-center">
              <span className="i-carbon-information text-blue-400 mr-1.5 text-xs"></span>
              <span className="text-xs text-blue-700">客户与厂区存在级联关系</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 数据字典编辑模态框 */}
      {modalOpen && (
        <DataDictionaryModal
          mode={modalMode}
          entryType={getCurrentDataType() as any}
          data={editingData}
          customers={dataDictionary.customers}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
      
      {/* 删除确认对话框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <span className="i-carbon-warning text-red-600 text-2xl"></span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">确定要删除吗？</h3>
          <p className="text-sm text-gray-500 mb-6">
            您即将删除「{deleteTargetName}」，此操作不可撤销。
          </p>
        </div>
        
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpen(false)}
            size="sm"
          >
            取消
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            size="sm"
          >
            确定删除
          </Button>
        </ModalFooter>
      </Modal>
    </ModernLayout>
  );
};

export default DataDictionaryPage;