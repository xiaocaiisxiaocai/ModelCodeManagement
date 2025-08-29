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
  
  // 年份范围状态
  const [yearRange, setYearRange] = useState(() => {
    const currentYear = new Date().getFullYear();
    return {
      startYear: 2020,
      endYear: currentYear
    };
  });
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

  // 延迟启用图表渲染，确保DOM容器完全渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartsReady(true);
    }, 500); // 增加延迟时间，确保容器尺寸稳定
    return () => clearTimeout(timer);
  }, []);

  // 监听年份范围变化，重新加载年度数据
  useEffect(() => {
    loadYearlyNewModels(yearRange.startYear, yearRange.endYear);
  }, [yearRange]);
  
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

  // 处理年份范围变化
  const handleYearRangeChange = (startYear: number, endYear: number) => {
    setYearRange({ startYear, endYear });
  };
  
  /**
   * 加载年度新增机型数据
   */
  const loadYearlyNewModels = async (startYear?: number, endYear?: number) => {
    await handleResponse(
      () => unifiedServices.warRoom.getYearlyNewModels(startYear, endYear),
      (data) => {
        console.log('✅ 成功获取年度新增机型数据:', data);
        setWarRoomData(prev => ({
          ...prev,
          yearlyNewModels: data
        }));
      },
      (errorMsg) => {
        console.error('❌ 加载年度新增机型数据失败:', errorMsg);
      }
    );
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
        const availableTypes = newCodeData && typeof newCodeData === 'object' 
          ? Object.keys(newCodeData) 
          : [];
        
        console.log('🔍 动态新增代码数据:', newCodeData);
        console.log('🔍 可用机型类型:', availableTypes);
        
        setDynamicData(prev => ({
          ...prev,
          newCodeData: newCodeData || {},
          availableModelTypes: availableTypes
        }));
        
        // 如果当前选中的机型不存在，切换到第一个可用机型
        if (availableTypes && availableTypes.length > 0 && !availableTypes.includes(activeModelTab)) {
          setActiveModelTab(availableTypes[0] as ModelType);
        }
      },
      (errorMsg) => {
        console.error('❌ 加载动态新增代码数据失败:', errorMsg);
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


  // 新增机型数柱状图配置 - 显示每年新增的机型类型数量
  const getNewModelChartOption = () => {
    // 处理后端返回的PascalCase属性名
    const yearlyData = (warRoomData?.yearlyNewModels && Array.isArray(warRoomData.yearlyNewModels)) 
      ? warRoomData.yearlyNewModels 
      : (warRoomData?.YearlyNewModels && Array.isArray(warRoomData.YearlyNewModels))
        ? warRoomData.YearlyNewModels
        : [];
    
    // 调试日志：输出年度新增机型数据
    console.log('🔍 年度新增机型数据:', yearlyData);
    console.log('🔍 warRoomData:', warRoomData);
    
    return {
      backgroundColor: '#ffffff',
      title: {
        text: '新增机型数（按年度）',
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontWeight: 'normal'
        },
        left: 15,
        top: 10
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const data = params[0];
          const yearData = yearlyData.find(item => (item.Year || item.year) === data.name);
          let tooltip = `${data.name}年<br/>`;
          tooltip += `新增机型数: ${data.value}种<br/>`;
          const modelTypes = yearData?.ModelTypes || yearData?.modelTypes;
          if (modelTypes?.length > 0) {
            tooltip += `机型类型: ${modelTypes.join(', ')}`;
          }
          return tooltip;
        }
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '10%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: yearlyData.map(item => item.Year || item.year),
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
        },
        name: '新增机型数量',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#666'
        }
      },
      series: [{
        name: '新增机型数',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: '#4a7ebb',
          borderRadius: [4, 4, 0, 0]
        },
        data: yearlyData.map(item => item.NewModelCount || item.newModelCount || 0)
      }]
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
        top: 10
      },
      legend: {
        data: ['规划', '工令', '暂停'],
        right: '10%',
        top: 10,
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
        left: '8%',
        right: '8%',
        bottom: '10%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: (warRoomData.planningUsage || []).map(item => item.modelType || item.ModelType),
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
          name: '规划',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#4a7ebb'
          },
          data: (warRoomData.planningUsage || []).map(item => item.planning || item.Planning || 0)
        },
        {
          name: '工令',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#855ea8'
          },
          data: (warRoomData.planningUsage || []).map(item => item.workOrder || item.WorkOrder || 0)
        },
        {
          name: '暂停',
          type: 'bar',
          barWidth: '12%',
          itemStyle: {
            color: '#f29900'
          },
          data: (warRoomData.planningUsage || []).map(item => item.pause || item.Pause || 0)
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
    return dynamicData.modelCodeRemaining.filter(item => 
      (item.type || item.modelType || item.ModelType) === activeModelTab
    );
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
          const data = (dynamicData.modelCodeRemaining || []).find(item => 
            (item.type || item.modelType || item.ModelType) === name
          );
          if (data) {
            return `
              <div>
                <div><strong>${data.type || data.modelType || data.ModelType}</strong></div>
                <div>总量: ${data.total || data.Total || 0}</div>
                <div>已用: ${data.used || data.Used || 0}</div>
                <div>剩余: ${data.remaining || data.Remaining || 0}</div>
                <div>使用率: ${data.usageRate || data.UsageRate || 0}%</div>
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
        data: filteredData.map(item => item.type || item.modelType || item.ModelType),
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
          data: filteredData.map(item => item.used || item.Used || 0)
        },
        {
          name: '剩余量',
          type: 'bar',
          stack: 'total',
          barWidth: '20%',
          itemStyle: {
            color: '#69CB24' // 绿色，表示剩余
          },
          data: filteredData.map(item => item.remaining || item.Remaining || 0)
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

  // 年份范围选择器组件
  const YearRangeFilterComponent = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);
    
    return (
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600 font-medium">年份:</label>
        <div className="flex items-center gap-1">
          <select
            value={yearRange.startYear}
            onChange={(e) => handleYearRangeChange(Number(e.target.value), yearRange.endYear)}
            className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">至</span>
          <select
            value={yearRange.endYear}
            onChange={(e) => handleYearRangeChange(yearRange.startYear, Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // 共用的机型筛选器组件 - 使用动态可用机型（按钮形式）
  const ModelFilterComponent = () => (
    <div className="flex flex-wrap gap-1">
      {(dynamicData.availableModelTypes || []).map(tab => (
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

  // 机型下拉选择器组件 - 用于节省空间
  const ModelSelectComponent = () => (
    <select
      value={activeModelTab}
      onChange={(e) => setActiveModelTab(e.target.value as ModelType)}
      className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {(dynamicData.availableModelTypes || []).map(type => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
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
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-100px)] w-full max-w-full">
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
          <div className="hidden lg:flex gap-4 h-full w-full">
            {/* 左侧：图表区域 - 65% */}
            <div className="w-[65%] flex flex-col gap-4 h-full">
              {/* 上部：新增机型数和规划占用数（左右排列） */}
              <div className="flex-1 min-h-[350px] flex gap-4">
                {/* 新增机型数 */}
                <div className="flex-1 bg-white rounded-lg shadow-sm">
                  <div className="px-4 pt-3 pb-2 flex justify-between items-center border-b border-gray-100">
                    <h3 className="text-base font-medium text-gray-800">年度新增机型数</h3>
                    <YearRangeFilterComponent />
                  </div>
                  <div className="h-[calc(100%-60px)] min-h-[300px]">
                    {chartsReady && ((warRoomData.yearlyNewModels && warRoomData.yearlyNewModels.length > 0) || (warRoomData.YearlyNewModels && warRoomData.YearlyNewModels.length > 0)) ? (
                      <ReactECharts
                        option={getNewModelChartOption()}
                        style={{ height: '100%', width: '100%', minHeight: '300px' }}
                        opts={{ renderer: 'canvas', locale: 'ZH' }}
                        onChartReady={() => console.log('📊 年度新增机型图表渲染完成')}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg min-h-[300px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">
                          {!chartsReady ? '图表准备中...' : '数据加载中...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 规划占用数 */}
                <div className="flex-1 bg-white rounded-lg shadow-sm">
                  {chartsReady ? (
                    <ReactECharts
                      option={getPlanningUsageChartOption()}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'canvas', locale: 'ZH' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 下部：机型码余量 - 占剩余空间 */}
              <div className="flex-1 bg-white rounded-lg shadow-sm min-h-0">
                <div className="px-4 pt-3 pb-2 flex justify-between items-center border-b border-gray-100">
                  <h3 className="text-base font-medium text-gray-800">机型码余量</h3>
                  <ModelFilterComponent />
                </div>
                <div className="h-[calc(100%-60px)] min-h-[350px]">
                  {chartsReady ? (
                    <ReactECharts
                      option={getModelCodeRemainingChartOption()}
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
            </div>
            
            {/* 右侧：新增代码清单 - 35% */}
            <div className="w-[35%] bg-white rounded-lg shadow-sm flex flex-col h-full">
              {/* 紧凑的标题栏 */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-medium text-gray-800">新增代码清单</h3>
                  <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                    共 {getSelectedTimePeriodCodes().length} 条
                  </span>
                </div>
                
                {/* 紧凑的筛选控制栏 - 单行布局 */}
                <div className="flex items-center gap-2 text-xs">
                  {/* 机型选择 */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-gray-600 text-xs whitespace-nowrap">机型:</span>
                    <select
                      value={activeModelTab}
                      onChange={(e) => setActiveModelTab(e.target.value as ModelType)}
                      className="px-1 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-14"
                    >
                      {(dynamicData.availableModelTypes || []).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 时间选择 */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-gray-600 text-xs whitespace-nowrap">时间:</span>
                    <select
                      value={timePeriod}
                      onChange={(e) => handleTimePeriodChange(e.target.value as TimePeriodType)}
                      className="px-1 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-14"
                    >
                      <option value="recent_month">1月</option>
                      <option value="recent_half_year">半年</option>
                      <option value="recent_year">1年</option>
                      <option value="all_time">全部</option>
                    </select>
                  </div>
                  
                  {/* 每页数量选择 */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-gray-600 text-xs whitespace-nowrap">每页:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-1 py-0.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-12"
                    >
                      {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 代码列表 - 一行一条 */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {getPaginatedCodes().map((code: string, index: number) => (
                    <div 
                      key={`${code}-${index}`}
                      className="px-2 py-1.5 hover:bg-blue-50 transition-all cursor-pointer group flex items-center justify-between border-l-2 border-l-transparent hover:border-l-blue-500"
                      onClick={() => handleCodeClick(code)}
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-60 group-hover:opacity-100 flex-shrink-0"></div>
                        <div className="text-sm font-mono font-medium text-gray-800 group-hover:text-blue-700 truncate">
                          {code}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-1">
                        <span className="i-carbon-arrow-right text-xs text-gray-400 group-hover:text-blue-600 transition-colors"></span>
                      </div>
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
              
              {/* 简洁分页导航 */}
              {getTotalPages() > 1 && (
                <div className="px-2 py-1 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="i-carbon-chevron-left"></span>
                  </button>
                  
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">{currentPage}/{getTotalPages()}</span>
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="i-carbon-chevron-right"></span>
                  </button>
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