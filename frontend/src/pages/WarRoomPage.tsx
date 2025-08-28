import React, { useState, useEffect, useRef } from 'react';
import ModernLayout from '../components/ModernLayout';
import ReactECharts from 'echarts-for-react';
import type { ModelNewCodeData } from '../mock/interfaces';
import { useNavigate } from 'react-router-dom';

import { unifiedServices } from '../services/unifiedService';
import { useServiceResponse } from '../hooks/useServiceResponse';

// 定义类型
type ModelType = 'SLU' | 'SLUR' | 'SB' | 'ST' | 'AC';
type TimePeriodType = 'recent_month' | 'recent_half_year' | 'recent_year' | 'all_time' | 'custom';
type DateRange = {
  startDate: Date;
  endDate: Date;
  label: string;
};

const WarRoomPage: React.FC = () => {
  const { loading, error, handleResponse, clearError } = useServiceResponse();
  const navigate = useNavigate();
  
  // 状态管理
  const [activeModelTab, setActiveModelTab] = useState<ModelType>('SLU');
  const [timePeriod, setTimePeriod] = useState<TimePeriodType>('recent_month');
  const [chartsReady, setChartsReady] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    return {
      startDate,
      endDate,
      label: '最近一个月'
    };
  });
  
  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];
  
  // 战情中心数据状态
  const [warRoomData, setWarRoomData] = useState({
    yearlyNewModels: [] as any[],
    planningUsage: [] as any[],
    modelCodeRemaining: [] as any[],
    newCodeData: {} as Record<string, ModelNewCodeData>
  });

  // 动态数据状态
  const [dynamicData, setDynamicData] = useState({
    newCodeData: {} as Record<string, ModelNewCodeData>,
    modelCodeRemaining: [] as any[],
    availableModelTypes: [] as string[]
  });

  // 加载数据
  useEffect(() => {
    loadWarRoomData();
    loadDynamicData();
  }, []);

  // 延迟启用图表渲染，避免DOM尺寸警告
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // 处理时间段变化
  const handleTimePeriodChange = (period: TimePeriodType) => {
    setTimePeriod(period);
    const endDate = new Date();
    const startDate = new Date();
    
    let label = '';
    switch (period) {
      case 'recent_month':
        startDate.setMonth(startDate.getMonth() - 1);
        label = '最近一个月';
        break;
      case 'recent_half_year':
        startDate.setMonth(startDate.getMonth() - 6);
        label = '最近半年';
        break;
      case 'recent_year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        label = '最近一年';
        break;
      case 'all_time':
        // 查看所有时间的数据 - 设置一个很早的开始时间
        startDate.setFullYear(2020, 0, 1); // 从2020年开始
        label = '查看所有';
        break;
      case 'custom':
        // 自定义时间段保持当前dateRange不变
        return;
    }
    
    setDateRange({
      startDate,
      endDate,
      label
    });
  };
  
  /**
   * 加载战情中心数据 - 新方式
   */
  const loadWarRoomData = async () => {
    await handleResponse(
      () => unifiedServices.warRoom.getWarRoomData(),
      (data) => {
        setWarRoomData(data);
      },
      (errorMsg) => {
      }
    );
  };

  /**
   * 加载动态计算数据
   */
  const loadDynamicData = async () => {
    // 加载动态新增代码数据
    await handleResponse(
      () => unifiedServices.warRoom.getDynamicNewCodeData(),
      (newCodeData) => {
        const availableTypes = Object.keys(newCodeData);
        setDynamicData(prev => ({
          ...prev,
          newCodeData,
          availableModelTypes: availableTypes
        }));
        
        // 如果当前选中的机型不存在，切换到第一个可用机型
        if (availableTypes.length > 0 && !availableTypes.includes(activeModelTab)) {
          setActiveModelTab(availableTypes[0] as ModelType);
        }
      },
      (errorMsg) => {
      }
    );

    // 加载动态机型码余量数据
    await handleResponse(
      () => unifiedServices.warRoom.getDynamicModelCodeRemaining(),
      (remainingData) => {
        setDynamicData(prev => ({
          ...prev,
          modelCodeRemaining: remainingData
        }));
      },
      (errorMsg) => {
      }
    );
  };


  // 新增机型数柱状图配置
  const getNewModelChartOption = () => {
    return {
      backgroundColor: '#ffffff',
      title: {
        text: '新增機型數',
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontWeight: 'normal'
        },
        left: 15,
        top: 15
      },
      legend: {
        data: ['PCB', 'FPC'],
        right: '10%',
        top: 15,
        textStyle: {
          color: '#666'
        },
        itemStyle: {
          borderWidth: 0
        },
        icon: 'rect'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '25%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: (warRoomData.yearlyNewModels || []).map(item => item.year),
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#666'
        },
        name: '年度',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee'
          }
        },
        axisLabel: {
          color: '#666'
        }
      },
      series: [
        {
          name: 'PCB',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#4a7ebb'
          },
          data: (warRoomData.yearlyNewModels || []).map(item => item.PCB)
        },
        {
          name: 'FPC',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#855ea8'
          },
          data: (warRoomData.yearlyNewModels || []).map(item => item.FPC)
        }
      ]
    };
  };

  // 规划占用数柱状图配置
  const getPlanningUsageChartOption = () => {
    return {
      backgroundColor: '#ffffff',
      title: {
        text: '規劃占用數',
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontWeight: 'normal'
        },
        left: 15,
        top: 15
      },
      legend: {
        data: ['PCB', 'FPC'],
        right: '10%',
        top: 15,
        textStyle: {
          color: '#666'
        },
        itemStyle: {
          borderWidth: 0
        },
        icon: 'rect'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '25%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: (warRoomData.planningUsage || []).map(item => item.period),
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#666'
        },
        name: '週期',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee'
          }
        },
        axisLabel: {
          color: '#666'
        }
      },
      series: [
        {
          name: 'PCB',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#4a7ebb'
          },
          data: (warRoomData.planningUsage || []).map(item => item.PCB)
        },
        {
          name: 'FPC',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#855ea8'
          },
          data: (warRoomData.planningUsage || []).map(item => item.FPC)
        }
      ]
    };
  };

  // 根据当前选中的机型过滤机型码余量数据 - 使用动态数据
  const getFilteredModelCodeData = () => {
    // 防止数据未加载时的错误
    if (!dynamicData.modelCodeRemaining || !Array.isArray(dynamicData.modelCodeRemaining)) {
      return [];
    }
    // 根据当前选中的机型精确匹配数据
    return dynamicData.modelCodeRemaining.filter(item => item.type === activeModelTab);
  };

  // 机型码余量柱状图配置
  const getModelCodeRemainingChartOption = () => {
    // 获取过滤后的数据
    const filteredData = getFilteredModelCodeData();
    
    return {
      backgroundColor: '#ffffff',
      title: {
        text: '機型碼餘量',
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontWeight: 'normal'
        },
        left: 15,
        top: 15
      },
      legend: {
        data: ['已使用', '剩余量'],
        right: '10%',
        top: 15,
        textStyle: {
          color: '#666'
        },
        itemStyle: {
          borderWidth: 0
        },
        icon: 'rect'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          // 找到对应的机型数据 - 使用动态数据
          const name = params[0].name;
          const data = (dynamicData.modelCodeRemaining || []).find(item => item.type === name);
          if (data) {
            return `
              <div>
                <div><strong>${data.type}</strong></div>
                <div>总量: ${data.total}</div>
                <div>已用: ${data.used}</div>
                <div>剩余: ${data.remaining}</div>
                <div>使用率: ${data.usageRate || 0}%</div>
              </div>
            `;
          }
          return '';
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '25%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: filteredData.map(item => item.type),
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#666'
        },
        name: '機型',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          color: '#666'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#eee'
          }
        },
        axisLabel: {
          color: '#666'
        }
      },
      series: [
        {
          name: '已使用',
          type: 'bar',
          stack: 'total',
          barWidth: '20%',
          itemStyle: {
            color: '#F29900' // 橙色，表示已使用
          },
          data: filteredData.map(item => item.used)
        },
        {
          name: '剩余量',
          type: 'bar',
          stack: 'total',
          barWidth: '20%',
          itemStyle: {
            color: '#69CB24' // 绿色，表示剩余
          },
          data: filteredData.map(item => item.remaining)
        }
      ]
    };
  };

  // 处理代码点击事件 - 跳转到代码使用清单并自动搜索该代码
  const handleCodeClick = async (code: string) => {
    
    try {
      // 获取机型分类信息，判断导航结构
      const response = await unifiedServices.modelClassification.getModelClassificationsByProductType('PCB');
      
      if (response.data) {
        // 正确匹配机型：activeModelTab是"SLUR"，需要匹配"SLUR-"
        const modelTypeWithDash = activeModelTab.endsWith('-') ? activeModelTab : `${activeModelTab}-`;
        const modelClassification = response.data.find(mc => mc.type === modelTypeWithDash);
        
        
        if (modelClassification) {
          if (modelClassification.hasCodeClassification === false) {
            // 2层结构：跳转到直接代码使用页面，并传递搜索参数
            const targetPath = `/direct-code-usage/PCB/${activeModelTab}?search=${encodeURIComponent(code)}`;
            navigate(targetPath);
          } else {
            // 3层结构：跳转到对应的代码分类页面，并传递搜索参数
            // 对于SLUR-100，提取'1'；对于SLUR-201，提取'2'
            const codeId = code.split('-')[1]?.charAt(0);
            
            if (codeId) {
              const targetPath = `/code-usage/PCB/${modelTypeWithDash}/${codeId}?search=${encodeURIComponent(code)}`;
              navigate(targetPath);
            }
          }
        } else {
          // 降级处理
          handleCodeClickFallback(code);
        }
      }
    } catch (error) {
      // 降级处理
      handleCodeClickFallback(code);
    }
  };

  // 降级处理函数
  const handleCodeClickFallback = (code: string) => {
    
    if (activeModelTab === 'AC') {
      // AC是2层结构，添加搜索参数
      const fallbackPath = `/direct-code-usage/PCB/${activeModelTab}?search=${encodeURIComponent(code)}`;
      navigate(fallbackPath);
    } else {
      // 其他都是3层结构，提取代码分类ID并添加搜索参数
      const codeId = code.split('-')[1]?.charAt(0);
      
      if (codeId) {
        const modelTypeWithDash = activeModelTab.endsWith('-') ? activeModelTab : `${activeModelTab}-`;
        const fallbackPath = `/code-usage/PCB/${modelTypeWithDash}/${codeId}?search=${encodeURIComponent(code)}`;
        navigate(fallbackPath);
      }
    }
  };

  // 获取当前选中机型和时间段的代码 - 基于真实数据
  const getSelectedTimePeriodCodes = () => {
    // 从mock数据中获取真实已使用的代码（有productName的代码）
    const modelPrefix = `${activeModelTab}-`;
    
    // 根据机型返回真实已使用的代码
    if (activeModelTab === 'SLUR') {
      // SLUR机型实际已使用的代码（来自mock数据）
      const realUsedCodes = ['SLUR-100', 'SLUR-101', 'SLUR-106', 'SLUR-201'];
      return realUsedCodes.slice(0, timePeriod === 'all_time' ? realUsedCodes.length : Math.min(realUsedCodes.length, 10));
    } else if (activeModelTab === 'SLU') {
      // SLU机型实际已使用的代码（来自mock数据）
      const realUsedCodes = ['SLU-100', 'SLU-101', 'SLU-117', 'SLU-151', 'SLU-232', 'SLU-301', 'SLU-361', 'SLU-395', 'SLU-399', 'SLU-401', 'SLU-433', 'SLU-440'];
      return realUsedCodes.slice(0, timePeriod === 'all_time' ? realUsedCodes.length : Math.min(realUsedCodes.length, 10));
    } else if (activeModelTab === 'SB') {
      // SB机型实际已使用的代码
      const realUsedCodes = ['SB-100', 'SB-101', 'SB-108'];
      return realUsedCodes.slice(0, timePeriod === 'all_time' ? realUsedCodes.length : Math.min(realUsedCodes.length, 10));
    } else if (activeModelTab === 'ST') {
      // ST机型实际已使用的代码
      const realUsedCodes = ['ST-100', 'ST-101'];
      return realUsedCodes.slice(0, timePeriod === 'all_time' ? realUsedCodes.length : Math.min(realUsedCodes.length, 10));
    } else if (activeModelTab === 'AC') {
      // AC机型实际已使用的代码（2层结构）
      const realUsedCodes = ['AC-50', 'AC-100'];
      return realUsedCodes.slice(0, timePeriod === 'all_time' ? realUsedCodes.length : Math.min(realUsedCodes.length, 10));
    } else {
      // 其他机型使用原有的模拟生成逻辑
      return generateMockCodesForTimeRange(activeModelTab, dateRange);
    }
  };
  
  // 获取分页后的代码数据
  const getPaginatedCodes = () => {
    const allCodes = getSelectedTimePeriodCodes();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allCodes.slice(startIndex, endIndex);
  };
  
  // 获取总页数
  const getTotalPages = () => {
    const totalCodes = getSelectedTimePeriodCodes().length;
    return Math.ceil(totalCodes / pageSize);
  };
  
  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // 处理页面大小变化
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 重置到第一页
  };
  
  // 重置分页当机型或时间段变化时
  useEffect(() => {
    setCurrentPage(1);
  }, [activeModelTab, timePeriod]);
  
  // 为时间范围生成模拟代码（实际项目中应该从数据库按日期查询）
  const generateMockCodesForTimeRange = (modelType: string, range: DateRange): string[] => {
    const codes: string[] = [];
    const daysDiff = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 3600 * 24));
    
    // 根据时间范围生成不同数量的模拟代码
    let codeCount = 0;
    if (daysDiff <= 31) {
      codeCount = 5; // 最近一个月
    } else if (daysDiff <= 186) {
      codeCount = 15; // 最近半年
    } else if (daysDiff <= 365) {
      codeCount = 25; // 最近一年
    } else {
      codeCount = 50; // 查看所有 - 显示更多历史数据
    }
    
    // 生成模拟代码列表
    for (let i = 0; i < codeCount; i++) {
      const baseCode = Math.floor(Math.random() * 400) + 100;
      codes.push(`${modelType}-${baseCode.toString().padStart(3, '0')}`);
    }
    
    return codes.slice(0, timePeriod === 'all_time' ? 20 : 10); // 查看所有时显示更多代码
  };

  // 时间段选择器组件
  const TimeFilterComponent = () => (
    <div className="flex flex-col gap-2">
      {/* 时间段选择器 */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600 font-medium">时间段:</label>
        <select
          value={timePeriod}
          onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriodType)}
          className="px-3 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="recent_month">最近一个月</option>
          <option value="recent_half_year">最近半年</option>
          <option value="recent_year">最近一年</option>
          <option value="all_time">查看所有</option>
        </select>
      </div>
      
      {/* 当前时间段显示 */}
      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
        <span className="i-carbon-calendar mr-1"></span>
        <span className="font-medium">{dateRange.label}：</span>
        <span>
          {dateRange.startDate.toLocaleDateString('zh-CN')} ~ {dateRange.endDate.toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  );

  // 共用的机型筛选器组件 - 使用动态可用机型
  const ModelFilterComponent = () => (
    <div className="flex flex-wrap gap-1">
      {dynamicData.availableModelTypes.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveModelTab(tab as ModelType)}
          className={`px-2 py-1 rounded-md text-xs transition-colors ${
            activeModelTab === tab 
            ? 'bg-blue-600 text-white font-medium' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  return (
    <ModernLayout title="战情中心" subtitle="关键数据实时监控">
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

      {/* 战情中心内容 */}
      {!loading && (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* 移动端纵向布局 */}
          <div className="lg:hidden flex flex-col gap-4">
            {/* 机型筛选器 */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">机型筛选</h3>
              <ModelFilterComponent />
            </div>
            
            {/* 图表区域 - 移动端纵向堆叠 */}
            <div className="space-y-4">
              {/* 新增机型数 */}
              <div className="bg-white rounded-lg shadow-sm">
                {chartsReady ? (
                  <ReactECharts
                    option={getNewModelChartOption()}
                    style={{ height: '250px', width: '100%' }}
                    opts={{ renderer: 'canvas', locale: 'ZH' }}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* 规划占用数 */}
              <div className="bg-white rounded-lg shadow-sm">
                {chartsReady ? (
                  <ReactECharts
                    option={getPlanningUsageChartOption()}
                    style={{ height: '250px', width: '100%' }}
                    opts={{ renderer: 'canvas', locale: 'ZH' }}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* 机型码余量 */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-3 pt-2 flex justify-start items-center">
                  <ModelFilterComponent />
                </div>
                {chartsReady ? (
                  <ReactECharts
                    option={getModelCodeRemainingChartOption()}
                    style={{ height: '300px', width: '100%' }}
                    opts={{ renderer: 'canvas', locale: 'ZH' }}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 新增代码清单 - 移动端优化 */}
            <div className="bg-white rounded-lg shadow-sm flex flex-col">
              {/* 标题 */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-800">新增代码清单</h3>
              </div>
              
              {/* 筛选器 */}
              <div className="border-b border-gray-200">
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">机型筛选</h4>
                      <ModelFilterComponent />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">时间筛选</h4>
                      <TimeFilterComponent />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 分页控制器 */}
              <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">每页显示:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    {pageSizeOptions.map(size => (
                      <option key={size} value={size}>{size}条</option>
                    ))}
                  </select>
                </div>
                <div className="text-gray-600">
                  共 {getSelectedTimePeriodCodes().length} 条
                </div>
              </div>
              
              {/* 代码列表 - 移动端优化 */}
              <div className="max-h-80 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {getPaginatedCodes().map((code: string, index: number) => (
                    <div 
                      key={`${code}-${index}`}
                      className="p-4 hover:bg-gray-50 flex justify-between items-center"
                    >
                      <span className="text-gray-800 text-base font-medium">{code}</span>
                      <button 
                        onClick={() => handleCodeClick(code)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        查看详情
                      </button>
                    </div>
                  ))}
                  
                  {/* 空状态提示 */}
                  {getPaginatedCodes().length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <div className="text-gray-400 mb-2">
                        <span className="i-carbon-document text-2xl"></span>
                      </div>
                      <div>暂无代码数据</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 分页导航 - 移动端优化 */}
              {getTotalPages() > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                      let pageNum;
                      const totalPages = getTotalPages();
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 text-sm rounded ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 桌面端左右分割布局 */}
          <div className="hidden lg:flex gap-4 h-full">
            {/* 左侧：图表区域 - 65% */}
            <div className="w-[65%] flex flex-col gap-3">
              {/* 左上：新增机型数和规划占用数（上下排列） */}
              <div className="flex-1 space-y-4">
                {/* 新增机型数 */}
                <div className="bg-white rounded-lg shadow-sm h-1/2">
                  {chartsReady ? (
                    <ReactECharts
                      option={getNewModelChartOption()}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'canvas', locale: 'ZH' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                
                {/* 规划占用数 */}
                <div className="bg-white rounded-lg shadow-sm h-1/2">
                  {chartsReady ? (
                    <ReactECharts
                      option={getPlanningUsageChartOption()}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'canvas', locale: 'ZH' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 左下：机型码余量 */}
              <div className="bg-white rounded-lg shadow-sm h-96">
                <div className="px-4 pt-3 flex justify-start items-center">
                  <ModelFilterComponent />
                </div>
                {chartsReady ? (
                  <ReactECharts
                    option={getModelCodeRemainingChartOption()}
                    style={{ height: 'calc(100% - 48px)', width: '100%' }}
                    opts={{ renderer: 'canvas', locale: 'ZH' }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 右侧：新增代码清单 - 35% */}
            <div className="w-[35%] bg-white rounded-lg shadow-sm flex flex-col">
              {/* 标题和控制栏 */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">新增代码清单</h3>
                  
                  <div className="flex items-center space-x-6">
                    {/* 机型筛选 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">机型:</span>
                      <ModelFilterComponent />
                    </div>
                    
                    {/* 时间筛选 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">时间:</span>
                      <select
                        value={timePeriod}
                        onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriodType)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="recent_month">最近一个月</option>
                        <option value="recent_half_year">最近半年</option>
                        <option value="recent_year">最近一年</option>
                        <option value="all_time">查看所有</option>
                      </select>
                    </div>
                  
                    {/* 分页控制 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">每页:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {pageSizeOptions.map(size => (
                          <option key={size} value={size}>{size}条</option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-500">
                        共 {getSelectedTimePeriodCodes().length} 条
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 代码网格 */}
              <div className="flex-1 p-3 overflow-y-auto">
                <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                  {getPaginatedCodes().map((code: string, index: number) => (
                    <div 
                      key={`${code}-${index}`}
                      className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md p-3 transition-all cursor-pointer group"
                      onClick={() => handleCodeClick(code)}
                    >
                      <div className="text-center">
                        <div className="text-sm font-mono font-medium text-gray-800 group-hover:text-blue-700 mb-2">
                          {code}
                        </div>
                        <button className="text-xs text-blue-600 group-hover:text-blue-800 bg-blue-100 group-hover:bg-blue-200 px-2 py-1 rounded transition-colors">
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* 空状态提示 */}
                  {getPaginatedCodes().length === 0 && (
                    <div className="col-span-full p-8 text-center text-gray-500">
                      <div className="text-gray-400 mb-2">
                        <span className="i-carbon-document text-2xl"></span>
                      </div>
                      <div>暂无代码数据</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 分页导航 */}
              {getTotalPages() > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-center">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span className="i-carbon-chevron-left"></span>
                      <span>上一页</span>
                    </button>
                    
                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(9, getTotalPages()) }, (_, i) => {
                        let pageNum;
                        const totalPages = getTotalPages();
                        
                        if (totalPages <= 9) {
                          pageNum = i + 1;
                        } else if (currentPage <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 4) {
                          pageNum = totalPages - 8 + i;
                        } else {
                          pageNum = currentPage - 4 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-7 h-7 text-xs rounded transition-colors ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span>下一页</span>
                      <span className="i-carbon-chevron-right"></span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </ModernLayout>
  );
};


export default WarRoomPage; 