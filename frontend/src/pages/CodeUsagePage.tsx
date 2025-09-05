import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ModernLayout from '../components/ModernLayout';
import { Button } from '../components/ui';
import type { DomainCodeUsageEntry as CodeUsageEntry } from '../types';

// 定义表单数据类型
interface CodeUsageEntryFormData {
  model: string;
  productName: string;
  description?: string;
  occupancyType: string;
  builder: string;
  requester: string;
}
import CrudDrawer from '../components/CrudDrawer';

import { services } from '../services';
import { useServiceResponse } from '../hooks/useServiceResponse';
import { useApi } from '../hooks/useApi';

// CRUD操作类型
type CrudMode = 'create' | 'read' | 'update' | 'delete';

// 分组数据类型
type GroupedEntry = {
  key: string; // 分组键: 机型+延伸
  model: string; // 完整机型，如"SLU-101"
  extension: string; // 延伸
  entries: CodeUsageEntry[]; // 该组所有记录(包括已删除的)
  activeEntry: CodeUsageEntry | null; // 当前活跃的记录(未删除的)，如果全部已删除则为null
  hasDeleted: boolean; // 是否有已删除的记录
  deletedCount: number; // 已删除的记录数量
};

const CodeUsagePage: React.FC = () => {
  const { modelType, codeNumber } = useParams<{
    productType: string;
    modelType: string;
    codeNumber: string;
  }>();
  const [searchParams] = useSearchParams();
  const { loading: mutationLoading, handleResponse, showSuccess, showError } = useServiceResponse();

  // 检测是否为直接访问模式（2层结构：没有codeNumber参数）
  const isDirectAccess = !codeNumber;

  // API call for useApi
  const getCodeUsages = useCallback(() => {
    if (!modelType) return Promise.resolve({ success: true, data: [] });
    return isDirectAccess
      ? services.codeUsage.getByModel(modelType, true) // 包含已删除记录
      : services.codeUsage.getByModelAndCode(modelType, codeNumber!, true); // 包含已删除记录
  }, [modelType, codeNumber, isDirectAccess]);

  const { data: rawData, loading: dataLoading, error: dataError, refetch: loadData } = useApi(getCodeUsages, [modelType, codeNumber, isDirectAccess]);

  // 状态管理
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<GroupedEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CodeUsageEntry | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedEntry | null>(null);
  const [drawerMode, setDrawerMode] = useState<CrudMode | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<CodeUsageEntry[]>([]);
  const [codeName, setCodeName] = useState('');
  const [searchFilter, setSearchFilter] = useState(searchParams.get('search') || '');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [paginatedEntries, setPaginatedEntries] = useState<GroupedEntry[]>([]);


  // 响应式表格状态
  const [expandedRows, setExpandedRows] = useState(new Set<string>());

  // 加载页面标题数据
  useEffect(() => {
    if (modelType) {
      loadCodeName();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelType, codeNumber, isDirectAccess]);

  // 监听URL参数变化，更新搜索条件
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchFilter(searchParam);
    }
  }, [searchParams]);

  /**
   * 获取代码分类名称 - 支持直接访问模式
   */
  const loadCodeName = async () => {
    if (!modelType) return;

    if (isDirectAccess) {
      // 直接访问模式：设置为机型名称
      setCodeName(`机型 ${modelType} 的所有代码使用`);
    } else {
      // 标准模式：获取代码分类名称
      if (!codeNumber) return;

      await handleResponse(
        () => services.codeClassification.getByModelType(modelType),
        (data) => {
          const classifications = data as any[];
          const classification = classifications?.find(c => c.code === codeNumber);
          const name = classification ? `${classification.code}-${classification.name}` : codeNumber;
          setCodeName(name || '');
        },
        (errorMsg) => {
          console.error('获取代码分类名称失败:', errorMsg);
          setCodeName(codeNumber || ''); // 失败时使用代码编号
        }
      );
    }
  };

  // 当从 useApi 获取的原始数据 rawData 变化时，执行分组和排序
  useEffect(() => {
    if (rawData) {
      // 按机型+延伸分组
      const groupMap = new Map<string, CodeUsageEntry[]>();
      (rawData as CodeUsageEntry[]).forEach(entry => {
        const key = `${entry.model}${entry.extension ? '-' + entry.extension : ''}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)?.push(entry);
      });

      // 转换为分组数组
      const groups: GroupedEntry[] = [];
      groupMap.forEach((entries, key) => {
        const model = entries[0].model;
        const extension = entries[0].extension || '';
        const activeEntries = entries.filter(e => !e.isDeleted);
        const activeEntry = activeEntries.length > 0 ? activeEntries[0] : null;
        const deletedEntries = entries.filter(e => e.isDeleted);

        groups.push({
          key,
          model,
          extension,
          entries,
          activeEntry,
          hasDeleted: deletedEntries.length > 0,
          deletedCount: deletedEntries.length
        });
      });

      // 排序: 按机型编号从小到大排列
      groups.sort((a, b) => {
        const extractNumber = (modelStr: string) => {
          const match = modelStr.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return extractNumber(a.model) - extractNumber(b.model);
      });

      setGroupedEntries(groups);
    }
  }, [rawData]);

  // 筛选功能
  useEffect(() => {
    if (!searchFilter.trim()) {
      setFilteredEntries(groupedEntries);
    } else {
      const filtered = groupedEntries.filter(group =>
        group.model.toLowerCase().includes(searchFilter.toLowerCase()) ||
        group.extension.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (group.activeEntry?.productName && group.activeEntry.productName.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (group.activeEntry?.description && group.activeEntry.description.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (group.activeEntry?.builder && group.activeEntry.builder.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (group.activeEntry?.requester && group.activeEntry.requester.toLowerCase().includes(searchFilter.toLowerCase()))
      );
      setFilteredEntries(filtered);
    }
  }, [searchFilter, groupedEntries]);

  // 分页功能
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredEntries.slice(startIndex, endIndex);
    setPaginatedEntries(paginated);
  }, [filteredEntries, currentPage, pageSize]);

  // 重置分页当过滤条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter]);

  // 计算分页信息
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredEntries.length);

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value);
  };

  // 分页控制函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 切换行展开/收起
  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };


  // 处理创建新记录
  const handleCreate = () => {
    setSelectedEntry(null);
    setDrawerMode('create');
  };

  // 处理编辑记录
  const handleEdit = (entry: CodeUsageEntry) => {
    setSelectedEntry(entry);
    setDrawerMode('update');
  };

  // 处理删除记录
  const handleDeleteRequest = (entry: CodeUsageEntry) => {
    setSelectedEntry(entry);
    setDrawerMode('delete');
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerMode(null);
  };

  /**
   * 保存数据 - 新方式
   */
  const handleSaveData = async (data: CodeUsageEntry) => {
    let success = false;

    if (drawerMode === 'create') {
      const result = await handleResponse(
        () => services.codeUsage.create(data),
        (newData) => {
          const entry = newData as CodeUsageEntry;
          showSuccess(`成功创建代码使用记录: ${entry.model}${entry.extension || ''}`);
          success = true;
        },
        (errorMsg) => {
          showError(`创建代码使用记录失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    } else if (drawerMode === 'update' && data.id) {
      const result = await handleResponse(
        () => services.codeUsage.update(data.id, data),
        (updatedData) => {
          const entry = updatedData as CodeUsageEntry;
          showSuccess(`成功更新代码使用记录: ${entry.model}${entry.extension || ''}`);
          success = true;
        },
        (errorMsg) => {
          showError(`更新代码使用记录失败: ${errorMsg}`);
        }
      );
      success = result !== null;
    }

    if (success) {
      await loadData();
    }
  };


  /**
   * 删除数据 - 新方式
   */
  const handleDeleteData = async (id: string, reason?: string) => {
    const result = await handleResponse(
      () => services.codeUsage.delete(id, reason),
      () => {
        showSuccess('成功删除代码使用记录，可在历史记录中查看');
      },
      (errorMsg) => {
        showError(`删除代码使用记录失败: ${errorMsg}`);
      }
    );

    if (result !== null) {
      await loadData();
    }
  };


  // 查看历史记录
  const handleViewHistory = (group: GroupedEntry) => {
    // 获取该组的所有已删除记录
    const deletedEntries = group.entries.filter(entry => entry.isDeleted);
    setHistoryEntries(deletedEntries.sort((a, b) => {
      return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
    }));
    setSelectedGroup(group);
    setHistoryModalOpen(true);
  };

  return (
    <ModernLayout
      title="代码使用清单"
      subtitle={isDirectAccess ? `${modelType} ${codeName}` : `${modelType}-${codeNumber} ${codeName}的使用记录`}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-orange-500 inline-flex text-white py-2 px-4 rounded-md font-bold shadow-sm">
          {modelType ? (isDirectAccess ? `${modelType}全部` : `${modelType}-${codeNumber}`) : ''}
        </div>
      </div>

      {/* 搜索和工具栏 */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
        {/* 搜索框和分页信息 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-shrink-0">
            <input
              type="text"
              placeholder="搜索机型代码、延伸、品名等..."
              value={searchFilter}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 lg:w-80"
            />
            <span className="absolute left-3 top-2.5 i-carbon-search text-gray-400"></span>
          </div>
          <div className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
            {filteredEntries.length > 0 ? (
              <>显示 {startIndex} - {endIndex} 条，共 {filteredEntries.length} 条记录</>
            ) : (
              '暂无记录'
            )}
          </div>
        </div>

        {/* 新增按钮 */}
        <Button
          onClick={handleCreate}
          disabled={dataLoading || mutationLoading}
          variant="primary"
          size="sm"
          className="flex items-center whitespace-nowrap flex-shrink-0"
        >
          <span className="i-carbon-add mr-2"></span>
          <span className="hidden sm:inline">{dataLoading ? '加载中...' : '新增记录'}</span>
          <span className="sm:hidden">{dataLoading ? '加载中...' : '新增'}</span>
        </Button>
      </div>

      {dataError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <span className="i-carbon-warning text-red-500 mr-3"></span>
            <p className="text-sm text-red-800">{dataError}</p>
            <Button onClick={loadData} variant="danger" size="sm" className="ml-auto">重试</Button>
          </div>
        </div>
      )}

      {/* 移动端卡片布局 */}
      <div className="lg:hidden space-y-4">
        {dataLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : paginatedEntries.length > 0 ? (
          paginatedEntries.map((group) => (
            <div key={group.key} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {group.model}
                      </span>
                      {group.extension && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {group.extension}
                        </span>
                      )}
                    </div>
                    
                    {group.activeEntry ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">品名：</span>
                          <span className="text-gray-900">{group.activeEntry.productName}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">占用类型：</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            group.activeEntry.occupancyType === 'PLANNING' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {group.activeEntry.occupancyTypeDisplay || group.activeEntry.occupancyType}
                          </span>
                        </div>
                        {group.activeEntry.description && (
                          <div>
                            <span className="font-medium text-gray-700">说明：</span>
                            <span className="text-gray-600">{group.activeEntry.description}</span>
                          </div>
                        )}
                        {group.activeEntry.builder && (
                          <div>
                            <span className="font-medium text-gray-700">构建者：</span>
                            <span className="text-gray-600">{group.activeEntry.builder}</span>
                          </div>
                        )}
                        {group.activeEntry.requester && (
                          <div>
                            <span className="font-medium text-gray-700">请求者：</span>
                            <span className="text-gray-600">{group.activeEntry.requester}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                          <div className="text-xs text-gray-500">
                            {group.activeEntry.builder} · {group.activeEntry.creationDate}
                          </div>
                          {group.hasDeleted && (
                            <Button 
                              onClick={() => handleViewHistory(group)} 
                              variant="secondary"
                              size="sm"
                              className="text-xs p-0 h-auto"
                            >
                              历史记录({group.deletedCount})
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">此代码所有版本均已删除</div>
                    )}
                  </div>
                  
                  {group.activeEntry && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleEdit(group.activeEntry!)}
                        disabled={mutationLoading}
                        variant="warning"
                        size="sm"
                        className="px-3 py-2 text-xs flex items-center"
                      >
                        <span className="i-carbon-edit mr-1"></span>
                        编辑
                      </Button>
                      <Button
                        onClick={() => handleDeleteRequest(group.activeEntry!)}
                        disabled={mutationLoading}
                        variant="danger"
                        size="sm"
                        className="px-3 py-2 text-xs flex items-center"
                      >
                        <span className="i-carbon-delete mr-1"></span>
                        删除
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            {isDirectAccess ? `该机型${modelType}下暂无使用记录` : `该代码编号下暂无使用记录`}
          </div>
        )}
      </div>

      {/* 移动端分页控制 */}
      {filteredEntries.length > 0 && (
        <div className="lg:hidden bg-white rounded-lg shadow-sm mt-4 px-4 py-3">
          <div className="flex flex-col space-y-3">
            {/* 分页信息和页面大小选择器 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">每页</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
                <span className="text-xs text-gray-600">条</span>
              </div>
              <div className="text-xs text-gray-600">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>

            {/* 分页按钮 - 只在需要分页时显示 */}
            {filteredEntries.length > pageSize && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              {/* 简化的页码显示 - 移动端只显示当前页和总页数 */}
              <div className="flex items-center space-x-1">
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  >
                    1
                  </button>
                )}
                {currentPage > 3 && <span className="text-xs text-gray-400">...</span>}
                {currentPage > 2 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  >
                    {currentPage - 1}
                  </button>
                )}
                <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                  {currentPage}
                </button>
                {currentPage < totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  >
                    {currentPage + 1}
                  </button>
                )}
                {currentPage < totalPages - 2 && <span className="text-xs text-gray-400">...</span>}
                {currentPage < totalPages && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded text-xs hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* 桌面端表格布局 */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-350px)] overflow-y-auto">
            <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider lg:hidden"></th>
                <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">机型</th>
                <th scope="col" className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">延伸</th>
                <th scope="col" className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品名</th>
                <th scope="col" className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">说明</th>

                <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">占用类型</th>
                <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">客户</th>
                <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">厂区</th>
                <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">建檔人</th>
                <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">需求人</th>
                <th scope="col" className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">建立时间</th>
                <th scope="col" className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">历史</th>
                <th scope="col" className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : paginatedEntries.length > 0 ? (
                paginatedEntries.map((group) => (
                  <React.Fragment key={group.key}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate lg:hidden">
                        <button onClick={() => toggleRow(group.key)} className="text-blue-500">
                          <span className={expandedRows.has(group.key) ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'}></span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate">{group.model}</td>
                      <td className="px-3 py-3 text-sm text-gray-500 truncate">{group.extension || '-'}</td>
                      {group.activeEntry ? (
                        <>
                          <td className="px-3 py-3 text-sm text-gray-500"><div className="truncate" title={group.activeEntry.productName}>{group.activeEntry.productName}</div></td>
                          <td className="px-3 py-3 text-sm text-gray-500 hidden lg:table-cell"><div className="truncate" title={group.activeEntry.description}>{group.activeEntry.description || '-'}</div></td>
                          <td className="px-3 py-3 text-sm text-gray-500 hidden lg:table-cell"><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${group.activeEntry.occupancyType === 'PLANNING' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{group.activeEntry.occupancyTypeDisplay || group.activeEntry.occupancyType}</span></td>
                          <td className="px-3 py-3 text-sm text-gray-500 truncate hidden lg:table-cell">{group.activeEntry.customer || '-'}</td>
                          <td className="px-3 py-3 text-sm text-gray-500 truncate hidden lg:table-cell">{group.activeEntry.factory || '-'}</td>
                          <td className="px-3 py-3 text-sm text-gray-500 truncate hidden lg:table-cell">{group.activeEntry.builder}</td>
                          <td className="px-3 py-3 text-sm text-gray-500 truncate hidden lg:table-cell">{group.activeEntry.requester}</td>
                          <td className="px-3 py-3 text-sm text-gray-500 truncate hidden lg:table-cell">{group.activeEntry.creationDate}</td>
                        </>
                      ) : (
                        <>
                          <td colSpan={8} className="px-3 py-3 text-sm text-gray-400 text-center">- 此代码所有版本均已删除 -</td>
                        </>
                      )}
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {group.hasDeleted && (
                          <button onClick={() => handleViewHistory(group)} className="text-blue-500 hover:text-blue-700 underline text-xs">
                            详情 <span className="ml-1 bg-gray-200 text-gray-800 text-xs px-1 py-0.5 rounded-full">{group.deletedCount}</span>
                          </button>
                        )}
                        {!group.hasDeleted && '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium">
                        {group.activeEntry && (
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => handleEdit(group.activeEntry!)}
                              disabled={mutationLoading}
                              className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(group.activeEntry!)}
                              disabled={mutationLoading}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedRows.has(group.key) && (
                      <tr className="lg:hidden">
                        <td colSpan={14} className="p-4 bg-gray-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>说明:</strong> {group.activeEntry?.description || '-'}</div>
                            <div><strong>产品名称:</strong> {group.activeEntry?.productName || '-'}</div>
                            <div><strong>占用类型:</strong> {group.activeEntry?.occupancyTypeDisplay || group.activeEntry?.occupancyType || '-'}</div>
                            <div><strong>构建者:</strong> {group.activeEntry?.builder || '-'}</div>
                            <div><strong>请求者:</strong> {group.activeEntry?.requester || '-'}</div>
                            <div><strong>建檔人:</strong> {group.activeEntry?.builder}</div>
                            <div><strong>需求人:</strong> {group.activeEntry?.requester}</div>
                            <div><strong>建立时间:</strong> {group.activeEntry?.creationDate}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={isDirectAccess ? 14 : 13} className="px-6 py-10 text-center">
                    <div className="text-gray-500">
                      {isDirectAccess ? `该机型${modelType}下暂无使用记录` : `该代码编号下暂无使用记录`}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* 分页控件 */}
        {filteredEntries.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* 页面大小选择器 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">每页显示</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50 条</option>
                  <option value={100}>100 条</option>
                  <option value={500}>500 条</option>
                  <option value={1000}>1000 条</option>
                </select>
              </div>

              {/* 分页导航 - 只在需要分页时显示 */}
              {filteredEntries.length > pageSize && (
                <>
                  <div className="flex items-center space-x-2">
                    {/* 上一页 */}
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>

                    {/* 页码 */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
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
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-2 py-1 text-sm rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* 下一页 */}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>

                  {/* 跳转到指定页 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">跳转到</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = Number(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-12 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">页</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 历史记录模态框 */}
      {historyModalOpen && selectedGroup && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setHistoryModalOpen(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[95%] max-w-7xl max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold">{selectedGroup.model} {selectedGroup.extension ? `(${selectedGroup.extension})` : ''} 历史删除记录</h2>
                <button onClick={() => setHistoryModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">机型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">延伸</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">品名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">说明</th>

                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">占用类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">建檔人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">需求人</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">删除时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 bg-red-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.model}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{entry.extension || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <del>{entry.productName}</del>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {entry.description ? (
                            <div className="truncate" title={entry.description}>
                              <del>{entry.description}</del>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.occupancyType === 'PLANNING'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {entry.occupancyTypeDisplay || entry.occupancyType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{entry.builder}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{entry.requester}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{entry.creationDate || '未知'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </>
        )}

      {/* CRUD 抽屉 */}
      {drawerMode && (
        <CrudDrawer
          mode={drawerMode}
          data={selectedEntry || undefined}
          modelType={modelType}
          codeNumber={codeNumber}
          isLoading={mutationLoading}
          onClose={handleCloseDrawer}
          onSave={handleSaveData}
          onDelete={handleDeleteData}
        />
      )}

    </ModernLayout>
  );
};


export default CodeUsagePage;