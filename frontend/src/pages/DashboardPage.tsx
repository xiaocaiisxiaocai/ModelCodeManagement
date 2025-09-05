import React, { useState, useEffect } from 'react';
import ModernLayout from '../components/ModernLayout.js';
import ReactECharts from 'echarts-for-react';

import { services } from '../services';
import { useServiceResponse } from '../hooks/useServiceResponse';

// 标签类型定义
type TabType = 'all' | 'planning' | 'workOrder';

interface DashboardData {
  totalCodeUsages: number;
  totalModels: number;
  totalCodes: number;
  totalProductTypes: number;
  usagesByModelCode: Record<string, number>;
  usagesByType: Record<string, number>;
  modelsByProductType: Record<string, number>;
}

const DashboardPage: React.FC = () => {
  const { loading, error, handleResponse, clearError } = useServiceResponse();
  
  // 状态管理
  const [dashboardData, setDashboardData] = useState({
    totalCodeUsages: 0,
    totalModels: 0,
    totalCodes: 0,
    totalProductTypes: 0,
    usagesByModelCode: {} as Record<string, number>,
    usagesByType: {} as Record<string, number>,
    modelsByProductType: {} as Record<string, number>
  });
  
  // 加载仪表盘数据
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  /**
   * 加载仪表盘统计数据 - 新方式
   */
  const loadDashboardData = async () => {
    await handleResponse(
      () => services.warRoom.getWarRoomData(),
      (data) => {
        setDashboardData(data as DashboardData);
      },
      (errorMsg) => {
        console.error('加载仪表盘数据失败:', errorMsg);
      }
    );
  };


  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  
  // 添加标签页状态
  const [activeTab, setActiveTab] = useState<TabType>('all');
  

  // 产品类型分布饼图配置
  const getProductTypeChartOption = () => {
    const data = Object.entries(dashboardData.modelsByProductType).map(([name, value]) => {
      return {
        name,
        value
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: Object.keys(dashboardData.modelsByProductType),
        textStyle: {
          color: '#fff'
        }
      },
      series: [
        {
          name: '产品类型',
          type: 'pie',
          radius: ['60%', '75%'], // 进一步增大饼图尺寸
          center: ['60%', '50%'], // 调整饼图位置
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6, // 减小圆角
            borderColor: '#fff',
            borderWidth: 1 // 减小边框宽度
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true,
            length: 10, // 减小标签线长度
            length2: 10 // 减小标签线长度
          },
          data: data
        }
      ],
      color: ['#8378ea', '#55bef9', '#f5c63d', '#f16769']
    };
  };


  // 机型-代码编号分布饼图配置
  const getModelCodeChartOption = () => {
    const data = Object.entries(dashboardData.usagesByModelCode).map(([name, value]) => {
      return {
        name,
        value
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: Object.keys(dashboardData.usagesByModelCode),
        textStyle: {
          color: '#fff'
        }
      },
      series: [
        {
          name: '机型-代码编号',
          type: 'pie',
          radius: ['60%', '75%'], // 进一步增大饼图尺寸
          center: ['60%', '50%'], // 调整饼图位置
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6, // 减小圆角
            borderColor: '#fff',
            borderWidth: 1 // 减小边框宽度
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true,
            length: 10, // 减小标签线长度
            length2: 10 // 减小标签线长度
          },
          data: data
        }
      ],
      color: ['#36c6d3', '#ffb848', '#f5c63d', '#f16769', '#8378ea', '#55bef9']
    };
  };
  
  return (
    <ModernLayout title="仪表盘" subtitle="系统概览">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="i-carbon-warning text-red-400"></span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <span className="i-carbon-close"></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      )}

      {/* 仪表盘内容 */}
      {!loading && (
        <>
          {/* 顶部卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-80">产品分类</div>
                  <div className="text-3xl font-bold mt-1">{dashboardData.totalProductTypes}</div>
                  <div className="text-xs mt-2 opacity-80"></div>
                </div>
                <div className="text-4xl opacity-80">
                  <span className="i-carbon-document"></span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-80">机型分类</div>
                  <div className="text-3xl font-bold mt-1">{dashboardData.totalModels}</div>
                  <div className="text-xs mt-2 opacity-80"></div>
                </div>
                <div className="text-4xl opacity-80">
                  <span className="i-carbon-renew"></span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-80">代码分类数</div>
                  <div className="text-3xl font-bold mt-1">{dashboardData.totalCodes}</div>
                  <div className="text-xs mt-2 opacity-80"></div>
                </div>
                <div className="text-4xl opacity-80">
                  <span className="i-carbon-code"></span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-80">代码使用清单</div>
                  <div className="text-3xl font-bold mt-1">{dashboardData.totalCodeUsages}</div>
                  <div className="text-xs mt-2 opacity-80"></div>
                </div>
                <div className="text-4xl opacity-80">
                  <span className="i-carbon-list"></span>
                </div>
              </div>
            </div>
          </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 产品类型分布 - ECharts饼图 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md p-5 text-white">
          <h2 className="text-xl font-bold mb-1">产品类型分布</h2>
          <div className="text-xs opacity-80 mb-2">按产品类型统计机型分布情况</div>
          
          <div className="h-48"> {/* 进一步减小高度 */}
            <ReactECharts
              option={getProductTypeChartOption()}
              style={{ height: '100%', width: '100%' }}
              className="bg-transparent"
            />
          </div>
        </div>
        
        {/* 机型-代码编号分布 - ECharts饼图 */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg shadow-md p-5 text-white">
          <h2 className="text-xl font-bold mb-1">机型代码分布</h2>
          <div className="text-xs opacity-80 mb-2">按机型-代码编号统计使用情况</div>
          
          <div className="h-48"> {/* 进一步减小高度 */}
            <ReactECharts
              option={getModelCodeChartOption()}
              style={{ height: '100%', width: '100%' }}
              className="bg-transparent"
                    />
                  </div>
                </div>
      </div>
      
      {/* 左右两块完全独立的区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 左侧区域：机型代码使用情况统计 */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-md p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">机型代码使用统计</h2>
              <div className="text-xs opacity-80">各机型代码使用情况明细</div>
            </div>
              </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">机型/代码</th>
                  <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">规划</th>
                  <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">工令</th>
                  <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dashboardData.usagesByModelCode)
                  .filter(([modelCode]) => modelCode.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(([modelCode, count]) => {
                    // 简化版本，只显示总数
                    const planningCount = Math.floor(count * 0.6); // 模拟数据
                    const workOrderCount = count - planningCount;
                    
                    return (
                      <tr key={modelCode} className="border-b border-white/10 hover:bg-white/10">
                        <td className="px-4 py-3 whitespace-nowrap">{modelCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-teal-400 text-teal-900 text-xs px-2 py-1 rounded-full">{planningCount}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-amber-400 text-amber-900 text-xs px-2 py-1 rounded-full">{workOrderCount}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs">
                            查看
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 右侧区域：机型代码详情 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">机型代码详情</h2>
              <div className="text-xs opacity-80">各机型代码的使用情况统计</div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="输入机型搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 pr-10 rounded-md text-gray-800 w-64 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <span className="absolute right-3 top-2.5 text-gray-500">
                <span className="i-carbon-search"></span>
              </span>
                  </div>
                </div>
          
          <div className="overflow-x-auto">
            {/* 标签页切换 */}
            <div className="flex mb-4 bg-white/10 rounded-lg overflow-hidden">
              <button 
                className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'all' ? 'bg-white/20 text-white' : 'text-indigo-200'}`}
                onClick={() => setActiveTab('all')}
              >
                全部
              </button>
              <button 
                className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'planning' ? 'bg-white/20 text-white' : 'text-indigo-200'}`}
                onClick={() => setActiveTab('planning')}
              >
                规划
              </button>
              <button 
                className={`flex-1 py-2 px-4 text-sm font-medium ${activeTab === 'workOrder' ? 'bg-white/20 text-white' : 'text-indigo-200'}`}
                onClick={() => setActiveTab('workOrder')}
              >
                工令
              </button>
              </div>
            
            {/* 全部标签内容 */}
            {activeTab === 'all' && (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">机型/代码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">规划</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">工令</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">剩余</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dashboardData.usagesByModelCode)
                    .filter(([modelCode]) => modelCode.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(([modelCode, count]) => {
                      // 简化版本，使用模拟数据
                      const planningCount = Math.floor(count * 0.6);
                      const workOrderCount = count - planningCount;
                      const usedCount = count;
                      const remaining = 99 - usedCount;
                      
                      return (
                        <tr key={`${modelCode}-details`} className="border-b border-white/10 hover:bg-white/10">
                          <td className="px-4 py-3 whitespace-nowrap">{modelCode}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-teal-400 text-teal-900 text-xs px-2 py-1 rounded-full">
                              {planningCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-amber-400 text-amber-900 text-xs px-2 py-1 rounded-full">
                              {workOrderCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {remaining}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
            
            {/* 规划标签内容 */}
            {activeTab === 'planning' && (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">机型/代码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">已使用 (规划)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">使用的编号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">剩余</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dashboardData.usagesByModelCode)
                    .filter(([modelCode]) => modelCode.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(([modelCode, count]) => {
                      const planningCount = Math.floor(count * 0.6);
                      
                      if (planningCount === 0) return null;
                      
                      const usedNumbers = '模拟数据'; // 简化显示
                      const usedCount = count;
                      const remaining = 99 - usedCount;
                      
                      return (
                        <tr key={`${modelCode}-planning`} className="border-b border-white/10 hover:bg-white/10">
                          <td className="px-4 py-3 whitespace-nowrap">{modelCode}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-teal-400 text-teal-900 text-xs px-2 py-1 rounded-full">
                              {planningCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {usedNumbers || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {remaining}
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                </tbody>
              </table>
            )}
            
            {/* 工令标签内容 */}
            {activeTab === 'workOrder' && (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">机型/代码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">已使用 (工令)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">使用的编号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium opacity-80 uppercase tracking-wider">剩余</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dashboardData.usagesByModelCode)
                    .filter(([modelCode]) => modelCode.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(([modelCode, count]) => {
                      const workOrderCount = Math.floor(count * 0.4);
                      
                      if (workOrderCount === 0) return null;
                      
                      const usedNumbers = '模拟数据'; // 简化显示
                      const usedCount = count;
                      const remaining = 99 - usedCount;
                      
                      return (
                        <tr key={`${modelCode}-workOrder`} className="border-b border-white/10 hover:bg-white/10">
                          <td className="px-4 py-3 whitespace-nowrap">{modelCode}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-amber-400 text-amber-900 text-xs px-2 py-1 rounded-full">
                              {workOrderCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {usedNumbers || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {remaining}
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
        </>
      )}

    </ModernLayout>
  );
};


export default DashboardPage; 