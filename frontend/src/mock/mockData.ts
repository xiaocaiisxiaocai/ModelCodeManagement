// mockData.ts - 优化后的统一数据结构

import type { MockData, Customer, Factory, ProductNameDict, OccupancyTypeDict, ModelTypeDict } from './interfaces';

// 工具函数
const generateId = () => Math.random().toString(36).substring(2, 9);
const getCurrentDate = () => new Date().toISOString().split('T')[0]; // 统一使用 YYYY-MM-DD 格式

// 数据字典定义
const customerDict: Customer[] = [
  { id: 'cust001', name: '苹果' },
  { id: 'cust002', name: '华为' },
  { id: 'cust003', name: '小米' },
  { id: 'cust004', name: '三星' },
  { id: 'cust005', name: 'OPPO' },
  { id: 'cust006', name: 'vivo' },
  { id: 'cust007', name: '联想' },
  { id: 'cust008', name: '戴尔' },
  { id: 'cust009', name: '惠普' },
  { id: 'cust010', name: '迅得' },
];

const factoryDict: Factory[] = [
  // 苹果厂区
  { id: 'fact001', name: '苹果龙华厂', customerId: 'cust001'},
  { id: 'fact002', name: '苹果观澜厂', customerId: 'cust001'},
  
  // 华为厂区
  { id: 'fact003', name: '华为松山湖厂', customerId: 'cust002'},
  { id: 'fact004', name: '华为深圳厂', customerId: 'cust002'},
  
  // 小米厂区
  { id: 'fact005', name: '小米昆山厂', customerId: 'cust003'},
  { id: 'fact006', name: '小米重庆厂', customerId: 'cust003'},
  
  // 迅得厂区 (级联关系示例)
  { id: 'fact007', name: '迅得东莞厂', customerId: 'cust010'},
  { id: 'fact008', name: '迅得昆山厂', customerId: 'cust010'},
  { id: 'fact009', name: '迅得泰国厂', customerId: 'cust010'},
  
  // 其他客户的厂区
  { id: 'fact010', name: '三星东莞厂', customerId: 'cust004'},
  { id: 'fact011', name: 'OPPO东莞厂', customerId: 'cust005'},
  { id: 'fact012', name: 'vivo东莞厂', customerId: 'cust006'},
  { id: 'fact013', name: '联想深圳厂', customerId: 'cust007'},
  { id: 'fact014', name: '戴尔苏州厂', customerId: 'cust008'},
  { id: 'fact015', name: '惠普重庆厂', customerId: 'cust009'},
];

const productNameDict: ProductNameDict[] = [
  { id: 'prod001', name: '横向内层暂放板机'},
  { id: 'prod002', name: 'PCB层压板'},
  { id: 'prod003', name: '薄板处理机'},
  { id: 'prod004', name: '载盘输送机'},
  { id: 'prod005', name: '多层板压合机'},
  { id: 'prod006', name: 'FPC柔性板机'},
  { id: 'prod007', name: '自动检测机'},
  { id: 'prod008', name: '传送带系统'},
];

const occupancyTypeDict: OccupancyTypeDict[] = [
  { id: 'occ001', name: '规划'},
  { id: 'occ002', name: '工令'},
];

const modelTypeDict: ModelTypeDict[] = [
  { 
    id: 'model001', 
    type: 'SLU-', 
    name: '製程投收料非多軸機械手',
    description: ['製程投收料', '非多軸機械手'], 
    productType: 'PCB' 
  },
  { 
    id: 'model002', 
    type: 'SLUR-', 
    name: '製程投收料多軸機械手',
    description: ['製程投收料', '多軸機械手'], 
    productType: 'PCB' 
  },
  { 
    id: 'model003', 
    type: 'SB-', 
    name: '送板機',
    description: ['送板機'], 
    productType: 'PCB' 
  },
  { 
    id: 'model004', 
    type: 'ST-', 
    name: '堆疊機',
    description: ['堆疊機'], 
    productType: 'PCB' 
  },
  { 
    id: 'model005', 
    type: 'AC-', 
    name: '空調設備',
    description: ['空調設備', '環境控制'], 
    productType: 'FPC' 
  },
];

// 工具函数：根据字典获取随机数据
export const getRandomCustomer = () => customerDict[Math.floor(Math.random() * customerDict.length)].name;
export const getRandomFactory = () => factoryDict[Math.floor(Math.random() * factoryDict.length)].name;
export const getRandomProductName = () => productNameDict[Math.floor(Math.random() * productNameDict.length)].name;

// 工具函数：根据客户获取其厂区
export const getFactoriesByCustomer = (customerId: string) => 
  factoryDict.filter(factory => factory.customerId === customerId);

// 工具函数：获取客户对应的厂区名称
export const getFactoryByCustomerName = (customerName: string) => {
  const customer = customerDict.find(c => c.name === customerName);
  if (!customer) return factoryDict[0].name; // 默认返回第一个
  
  const customerFactories = getFactoriesByCustomer(customer.id);
  return customerFactories.length > 0 
    ? customerFactories[Math.floor(Math.random() * customerFactories.length)].name
    : factoryDict[0].name;
};

export const mockData: MockData = {
  // 产品类型 - 简化结构
  productTypes: [
    { id: '1', code: 'PCB' },
    { id: '2', code: 'FPC' }
  ],

  // 机型分类 - 统一命名规则（移除硬编码配置，由用户控制）
  modelClassifications: [
    {
      type: 'SLU-',
      description: ['製程投收料', '非多軸機械手'],
      productType: 'PCB',
      hasCodeClassification: true // 默认3层结构，可由用户修改
    },
    {
      type: 'SLUR-',
      description: ['製程投收料', '多軸機械手版本'],
      productType: 'PCB',
      hasCodeClassification: true // 默认3层结构，可由用户修改
    },
    {
      type: 'SB-',
      description: ['製程中間暫存'],
      productType: 'PCB',
      hasCodeClassification: true // 默认3层结构，可由用户修改
    },
    {
      type: 'ST-',
      description: ['製程中間轉角轉向'],
      productType: 'FPC',
      hasCodeClassification: true // 默认3层结构，可由用户修改
    },
    {
      type: 'AC-',
      description: ['自動化控制系統', '無需代碼分類的直接使用模式'],
      productType: 'PCB',
      hasCodeClassification: false // 2层结构：直接跳转到代码使用，无代码分类
    }
  ],

  // 代码分类 - 统一命名规则
  codeClassifications: [
    // SLU- 机型的代码分类（4个分类）
    { code: '1', name: '内層', modelType: 'SLU-' },
    { code: '2', name: '薄板', modelType: 'SLU-' },
    { code: '3', name: '载盘', modelType: 'SLU-' },
    { code: '4', name: '传送', modelType: 'SLU-' },
    
    // SLUR- 机型的代码分类
    { code: '1', name: '机械手', modelType: 'SLUR-' },
    { code: '2', name: '传送带', modelType: 'SLUR-' },
    { code: '3', name: '控制器', modelType: 'SLUR-' },
    
    // SB- 机型的代码分类
    { code: '1', name: '暂存架', modelType: 'SB-' },
    { code: '2', name: '缓冲区', modelType: 'SB-' },
    { code: '3', name: '立体仓', modelType: 'SB-' },
    
    // ST- 机型的代码分类
    { code: '1', name: '转角器', modelType: 'ST-' },
    { code: '2', name: '旋转台', modelType: 'ST-' },
    { code: '3', name: '导向器', modelType: 'ST-' }
  ],

  // 代码使用清单 - 完整范围生成（3层结构自动生成完整范围）
  codeUsageList: [
    // SLU- 系列代码分类1（SLU-100到SLU-199）
    // 前面一些有实际数据，表示已被使用
    {
      id: generateId(),
      model: 'SLU-100',
      codeNumber: '1',
      extension: '',
      productName: '内层板处理基础设备',
      description: '基础内层板材处理设备',
      occupancyType: '规划',
      customer: '苹果',
      factory: '龙华厂',
      builder: '张工程师',
      requester: '产品部',
      creationDate: '2024-01-01',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-101',
      codeNumber: '1',
      extension: '',
      productName: '横向内层暂放板机',
      description: '用于PCB内层板材的横向暂存处理',
      occupancyType: '规划',
      customer: '戴尔',
      factory: '东莞厂',
      builder: '张工程师',
      requester: '李经理',
      creationDate: '2024-01-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-101',
      codeNumber: '1',
      extension: 'A',
      productName: '横向内层暂放板机-改进版',
      description: '改进版本，增加自动定位功能',
      occupancyType: '工令',
      customer: '华为',
      factory: '松山湖厂',
      builder: '张工程师',
      requester: '王经理',
      creationDate: '2024-02-20',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-102',
      codeNumber: '1',
      extension: '',
      productName: '内层板材处理设备',
      description: '自动化内层板材处理系统',
      occupancyType: '规划',
      customer: '三星',
      factory: '东莞厂',
      builder: '李工程师',
      requester: '王经理',
      creationDate: '2024-01-20',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-105',
      codeNumber: '1',
      extension: '',
      productName: '多层内层板处理机',
      description: '专用于多层PCB内层处理',
      occupancyType: '工令',
      customer: '苹果',
      factory: '观澜厂',
      builder: '赵工程师',
      requester: '陈经理',
      creationDate: '2024-03-01',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-108',
      codeNumber: '1',
      extension: '',
      productName: '内层检测设备',
      description: '内层质量检测和分拣系统',
      occupancyType: '规划',
      customer: '惠普',
      factory: '东莞厂',
      builder: '钱工程师',
      requester: '孙经理',
      creationDate: '2024-03-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-115',
      codeNumber: '1',
      extension: '',
      productName: '内层清洗设备',
      description: '内层板材清洗和烘干系统',
      occupancyType: '工令',
      customer: '戴尔',
      factory: '重庆厂',
      builder: '周工程师',
      requester: '吴经理',
      creationDate: '2024-04-10',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-125',
      codeNumber: '1',
      extension: '',
      productName: '内层压合设备',
      description: '高精度内层压合系统',
      occupancyType: '规划',
      customer: '惠普',
      factory: '龙华厂',
      builder: '郑工程师',
      requester: '王经理',
      creationDate: '2024-05-20',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-135',
      codeNumber: '1',
      extension: '',
      productName: '内层钻孔设备',
      description: '高速精密内层钻孔机',
      occupancyType: '工令',
      customer: 'OPPO',
      factory: '重庆厂',
      builder: '冯工程师',
      requester: '徐经理',
      creationDate: '2024-06-05',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-145',
      codeNumber: '1',
      extension: '',
      productName: '内层镀铜设备',
      description: '自动化内层镀铜处理系统',
      occupancyType: '规划',
      customer: '三星',
      factory: '深圳厂',
      builder: '陈工程师',
      requester: '刘经理',
      creationDate: '2024-07-12',
      isDeleted: false
    },
    // 其他为空记录（只有机型）
    ...Array.from({ length: 90 }, (_, i) => {
      const modelNum = 103 + i;
      // 跳过已有数据的机型
      if ([105, 108, 115, 125, 135, 145].includes(modelNum)) {
        return null;
      }
      return {
        id: generateId(),
        model: `SLU-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '1',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }).filter(Boolean),

    // SLU- 系列代码分类2（SLU-200到SLU-299）- 部分已使用
    {
      id: generateId(),
      model: 'SLU-200',
      codeNumber: '2',
      extension: '',
      productName: '薄板处理基础设备',
      description: '基础薄板材料处理设备',
      occupancyType: '工令',
      customer: '苹果',
      factory: '东莞厂',
      builder: '李工程师',
      requester: '生产部',
      creationDate: '2024-02-01',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-201',
      codeNumber: '2',
      extension: '',
      productName: '薄板处理器',
      description: '专用于薄板材料的处理设备',
      occupancyType: '规划',
      customer: '三星',
      factory: '松山湖厂',
      builder: '李工程师',
      requester: '赵经理',
      creationDate: '2024-03-10',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-203',
      codeNumber: '2',
      extension: '',
      productName: '薄板检测设备',
      description: '薄板质量检测系统',
      occupancyType: '工令',
      customer: '三星',
      factory: '观澜厂',
      builder: '王工程师',
      requester: '陈经理',
      creationDate: '2024-04-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-210',
      codeNumber: '2',
      extension: '',
      productName: '薄板切割机',
      description: '高精度薄板切割设备',
      occupancyType: '规划',
      customer: '戴尔',
      factory: '重庆厂',
      builder: '林工程师',
      requester: '张经理',
      creationDate: '2024-05-08',
      isDeleted: false
    },
    // 其他为空记录
    ...Array.from({ length: 96 }, (_, i) => {
      const modelNum = 201 + i;
      if ([201, 203, 210].includes(modelNum)) {
        return null;
      }
      return {
        id: generateId(),
        model: `SLU-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '2',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }).filter(Boolean),

    // SLU- 系列代码分类3（SLU-300到SLU-399）- 部分已使用
    {
      id: generateId(),
      model: 'SLU-300',
      codeNumber: '3',
      extension: '',
      productName: '载盘处理基础设备',
      description: '基础载盘处理设备',
      occupancyType: '规划',
      customer: '惠普',
      factory: '重庆厂',
      builder: '王工程师',
      requester: '工艺部',
      creationDate: '2024-03-01',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-301',
      codeNumber: '3',
      extension: '',
      productName: '载盘处理设备',
      description: '自动化载盘搬运和定位设备',
      occupancyType: '工令',
      customer: '小米',
      factory: '观澜厂',
      builder: '王工程师',
      requester: '陈经理',
      creationDate: '2024-04-05',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-305',
      codeNumber: '3',
      extension: '',
      productName: '载盘清洗设备',
      description: '载盘自动清洗和烘干系统',
      occupancyType: '规划',
      customer: 'vivo',
      factory: '昆山厂',
      builder: '赵工程师',
      requester: '孙经理',
      creationDate: '2024-06-12',
      isDeleted: false
    },
    // 其他为空记录
    ...Array.from({ length: 97 }, (_, i) => {
      const modelNum = 301 + i;
      if ([301, 305].includes(modelNum)) {
        return null;
      }
      return {
        id: generateId(),
        model: `SLU-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '3',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }).filter(Boolean),

    // SLU- 系列代码分类4（SLU-400到SLU-499）- 传送设备，部分已使用
    {
      id: generateId(),
      model: 'SLU-400',
      codeNumber: '4',
      extension: '',
      productName: '水平传送带',
      description: '用于PCB板材的水平传送',
      occupancyType: '工令',
      customer: '戴尔',
      factory: '松山湖厂',
      builder: '传送工程师',
      requester: '自动化部',
      creationDate: '2024-06-01',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-405',
      codeNumber: '4',
      extension: '',
      productName: '垂直提升机',
      description: '多层传送的垂直提升设备',
      occupancyType: '规划',
      customer: '联想',
      factory: '重庆厂',
      builder: '传送工程师',
      requester: '生产部',
      creationDate: '2024-06-10',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLU-410',
      codeNumber: '4',
      extension: '',
      productName: '转弯传送装置',
      description: '用于改变传送方向的转弯装置',
      occupancyType: '工令',
      customer: '苹果',
      factory: '松山湖厂',
      builder: '机械工程师',
      requester: '工艺部',
      creationDate: '2024-06-20',
      isDeleted: false
    },
    // 其他为空记录（400-499，共100个，排除已定义的3个）
    ...Array.from({ length: 100 }, (_, i) => {
      const modelNum = 400 + i;
      if ([400, 405, 410].includes(modelNum)) {
        return null;
      }
      return {
        id: generateId(),
        model: `SLU-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '4',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }).filter(Boolean),

    // SLUR- 系列代码分类1（SLUR-100到SLUR-199）- 部分已使用
    {
      id: generateId(),
      model: 'SLUR-100',
      codeNumber: '1',
      extension: '',
      productName: 'SLUR内层基础设备',
      description: 'SLUR系列内层基础处理设备',
      occupancyType: '规划',
      customer: 'OPPO',
      factory: '昆山厂',
      builder: '刘工程师',
      requester: '技术部',
      creationDate: '2024-01-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLUR-101',
      codeNumber: '1',
      extension: '',
      productName: '高速多轴机械手',
      description: '六轴高精度机械手，用于复杂操作',
      occupancyType: '规划',
      customer: '联想',
      factory: '重庆厂',
      builder: '刘工程师',
      requester: '吴经理',
      creationDate: '2024-05-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SLUR-106',
      codeNumber: '1',
      extension: '',
      productName: '协作机械手',
      description: '人机协作安全机械手系统',
      occupancyType: '工令',
      customer: 'vivo',
      factory: '东莞厂',
      builder: '周工程师',
      requester: '徐经理',
      creationDate: '2024-06-20',
      isDeleted: false
    },
    // 其他为空记录
    ...Array.from({ length: 97 }, (_, i) => {
      const modelNum = 101 + i;
      if ([101, 106].includes(modelNum)) {
        return null;
      }
      return {
        id: generateId(),
        model: `SLUR-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '1',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }).filter(Boolean),

    // SLUR- 系列代码分类2（SLUR-201到SLUR-299）- 部分已使用
    {
      id: generateId(),
      model: 'SLUR-201',
      codeNumber: '2',
      extension: '',
      productName: '智能传送带系统',
      description: '配备视觉识别的智能传送系统',
      occupancyType: '规划',
      customer: '三星',
      factory: '松山湖厂',
      builder: '周工程师',
      requester: '徐经理',
      creationDate: '2024-06-01',
      isDeleted: false
    },
    // 其他为空记录
    ...Array.from({ length: 98 }, (_, i) => {
      const modelNum = 201 + i + 1;
      return {
        id: generateId(),
        model: `SLUR-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '2',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }),

    // SB- 系列代码分类1（SB-100到SB-199）- 部分已使用
    {
      id: generateId(),
      model: 'SB-100',
      codeNumber: '1',
      extension: '',
      productName: 'SB基础设备',
      description: 'SB系列基础处理设备',
      occupancyType: '规划',
      customer: '苹果',
      factory: '观澜厂',
      builder: '陈工程师',
      requester: '制造部',
      creationDate: '2024-02-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SB-101',
      codeNumber: '1',
      extension: '',
      productName: '立体暂存架',
      description: '多层立体暂存解决方案',
      occupancyType: '工令',
      customer: '小米',
      factory: '松山湖厂',
      builder: '孙工程师',
      requester: '马经理',
      creationDate: '2024-06-20',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'SB-108',
      codeNumber: '1',
      extension: '',
      productName: '自动暂存系统',
      description: '全自动料框暂存管理系统',
      occupancyType: '规划',
      customer: '联想',
      factory: '深圳厂',
      builder: '郭工程师',
      requester: '何经理',
      creationDate: '2024-07-15',
      isDeleted: false
    },
    // 其他为空记录
    ...Array.from({ length: 97 }, (_, i) => {
      const modelNum = 101 + i;
      if ([101, 108].includes(modelNum)) {
        return null;
      }
      return {
        id: generateId(),
        model: `SB-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '1',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }).filter(Boolean),

    // ST- 系列代码分类1（ST-100到ST-199）- 部分已使用
    {
      id: generateId(),
      model: 'ST-100',
      codeNumber: '1',
      extension: '',
      productName: 'ST基础设备',
      description: 'ST系列基础处理设备',
      occupancyType: '规划',
      customer: '华为',
      factory: '昆山厂',
      builder: '赵工程师',
      requester: '质量部',
      creationDate: '2024-03-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'ST-101',
      codeNumber: '1',
      extension: '',
      productName: '90度转角器',
      description: 'FPC专用90度转角处理设备',
      occupancyType: '规划',
      customer: '联想',
      factory: '东莞厂',
      builder: '胡工程师',
      requester: '林经理',
      creationDate: '2024-07-10',
      isDeleted: false
    },
    // 其他为空记录
    ...Array.from({ length: 98 }, (_, i) => {
      const modelNum = 101 + i + 1;
      return {
        id: generateId(),
        model: `ST-${modelNum.toString().padStart(3, '0')}`,
        codeNumber: '1',
        extension: '',
        productName: '', // 空字段，等待用户填写
        description: '', // 空字段，等待用户填写
        occupancyType: '', // 空字段，等待用户填写
        builder: '', // 空字段，等待用户填写
        requester: '', // 空字段，等待用户填写
        creationDate: '', // 空字段，等待用户填写
        isDeleted: false
      };
    }),

    // 已删除的示例数据（历史记录）
    {
      id: generateId(),
      model: 'SLU-199',
      codeNumber: '1',
      extension: '',
      productName: '测试设备（已废弃）',
      description: '用于测试的临时设备，现已废弃',
      occupancyType: '规划',
      customer: '小米',
      factory: '重庆厂',
      builder: '测试员',
      requester: '测试经理',
      creationDate: '2023-12-01',
      isDeleted: true,
      deletedDate: '2024-01-01'
    },
    {
      id: generateId(),
      model: 'SLUR-199',
      codeNumber: '1',
      extension: '',
      productName: '旧版机械手（已淘汰）',
      description: '早期版本机械手，已被新版本替代',
      occupancyType: '工令',
      customer: '华为',
      factory: '昆山厂',
      builder: '刘工程师',
      requester: '吴经理',
      creationDate: '2023-10-15',
      isDeleted: true,
      deletedDate: '2024-05-20'
    },

    // AC- 系列（2层结构，无代码分类）
    {
      id: generateId(),
      model: 'AC-50',
      codeNumber: '50', // 直接使用数字作为代码编号
      extension: '',
      productName: '自動控制系統50型',
      description: '標準型自動化控制系統，適用於基礎生產線控制',
      occupancyType: '规划',
      customer: '联想',
      factory: '东莞厂',
      builder: '控制工程师',
      requester: '生产经理',
      creationDate: '2024-03-15',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'AC-50',
      codeNumber: '50',
      extension: 'A',
      productName: '自動控制系統50型-升級版',
      description: '增加遠程監控功能的升級版本',
      occupancyType: '工令',
      customer: '小米',
      factory: '重庆厂',
      builder: '控制工程师',
      requester: '技術部',
      creationDate: '2024-04-20',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'AC-100',
      codeNumber: '100',
      extension: '',
      productName: '自動控制系統100型',
      description: '高階自動化控制系統，支持複雜多線程控制',
      occupancyType: '规划',
      customer: '苹果',
      factory: '观澜厂',
      builder: '控制工程师',
      requester: '研發部',
      creationDate: '2024-05-10',
      isDeleted: false
    },
    {
      id: generateId(),
      model: 'AC-100',
      codeNumber: '100',
      extension: 'B',
      productName: '自動控制系統100型-專業版',
      description: '增加AI智能分析模組的專業版本',
      occupancyType: '工令',
      customer: 'OPPO',
      factory: '东莞厂',
      builder: '控制工程师',
      requester: '智能制造部',
      creationDate: '2024-06-05',
      isDeleted: false
    },

    // 已删除的示例数据 - 更多历史记录
    {
      id: generateId(),
      model: 'SLU-199',
      codeNumber: '1',
      extension: '',
      productName: '测试设备（已废弃）',
      description: '用于测试的临时设备，现已废弃',
      occupancyType: '规划',
      customer: 'vivo',
      factory: '龙华厂',
      builder: '测试员',
      requester: '测试经理',
      creationDate: '2023-12-01',
      isDeleted: true,
      deletedDate: '2024-01-01'
    },
    {
      id: generateId(),
      model: 'SLU-104',
      codeNumber: '1',
      extension: '',
      productName: '旧版内层处理机',
      description: '第一代内层处理设备，已被新版本替代',
      occupancyType: '工令',
      customer: '华为',
      factory: '重庆厂',
      builder: '王工程师',
      requester: '生产部',
      creationDate: '2023-08-15',
      isDeleted: true,
      deletedDate: '2024-03-20'
    },
    {
      id: generateId(),
      model: 'SLU-104',
      codeNumber: '1',
      extension: 'A',
      productName: '旧版内层处理机-改进版',
      description: '第一代设备的改进版，因故障率高已淘汰',
      occupancyType: '规划',
      customer: '三星',
      factory: '昆山厂',
      builder: '王工程师',
      requester: '生产部',
      creationDate: '2023-09-10',
      isDeleted: true,
      deletedDate: '2024-03-20'
    },
    {
      id: generateId(),
      model: 'SLU-110',
      codeNumber: '1',
      extension: '',
      productName: '实验性内层设备',
      description: '用于新工艺测试的实验设备，测试完成后废弃',
      occupancyType: '规划',
      customer: '三星',
      factory: '东莞厂',
      builder: '研发团队',
      requester: '技术部',
      creationDate: '2024-01-10',
      isDeleted: true,
      deletedDate: '2024-06-15'
    },
    {
      id: generateId(),
      model: 'SLU-202',
      codeNumber: '2',
      extension: '',
      productName: '早期薄板处理器',
      description: '早期版本薄板处理设备，精度不足已替换',
      occupancyType: '工令',
      customer: '联想',
      factory: '深圳厂',
      builder: '陈工程师',
      requester: '质量部',
      creationDate: '2023-11-05',
      isDeleted: true,
      deletedDate: '2024-04-18'
    },
    {
      id: generateId(),
      model: 'SLU-205',
      codeNumber: '2',
      extension: '',
      productName: '薄板测试设备',
      description: '薄板工艺验证专用设备，验证完成后停用',
      occupancyType: '规划',
      customer: 'OPPO',
      factory: '松山湖厂',
      builder: '测试组',
      requester: '工艺部',
      creationDate: '2024-02-01',
      isDeleted: true,
      deletedDate: '2024-07-10'
    },
    {
      id: generateId(),
      model: 'SLUR-105',
      codeNumber: '1',
      extension: '',
      productName: '四轴机械手（已淘汰）',
      description: '早期四轴机械手，被六轴版本替代',
      occupancyType: '工令',
      customer: '华为',
      factory: '龙华厂',
      builder: '自动化部',
      requester: '生产经理',
      creationDate: '2023-05-20',
      isDeleted: true,
      deletedDate: '2024-05-25'
    },
    {
      id: generateId(),
      model: 'SLUR-105',
      codeNumber: '1',
      extension: 'B',
      productName: '四轴机械手-升级版',
      description: '四轴机械手的升级版本，仍不如六轴版本',
      occupancyType: '规划',
      customer: '苹果',
      factory: '昆山厂',
      builder: '自动化部',
      requester: '生产经理',
      creationDate: '2023-07-15',
      isDeleted: true,
      deletedDate: '2024-05-25'
    },
    {
      id: generateId(),
      model: 'SB-105',
      codeNumber: '1',
      extension: '',
      productName: '小型暂存架（已废弃）',
      description: '容量不足的小型暂存架，已被大型版本替代',
      occupancyType: '规划',
      customer: '小米',
      factory: '昆山厂',
      builder: '结构工程师',
      requester: '仓储部',
      creationDate: '2023-10-12',
      isDeleted: true,
      deletedDate: '2024-06-30'
    },
    {
      id: generateId(),
      model: 'ST-105',
      codeNumber: '1',
      extension: '',
      productName: '45度转角器（已停用）',
      description: '45度转角处理设备，工艺变更后不再需要',
      occupancyType: '工令',
      customer: '戴尔',
      factory: '东莞厂',
      builder: 'FPC工程师',
      requester: 'FPC部门',
      creationDate: '2023-09-08',
      isDeleted: true,
      deletedDate: '2024-04-22'
    },
    {
      id: generateId(),
      model: 'AC-25',
      codeNumber: '25',
      extension: '',
      productName: '基础控制系统25型（已淘汰）',
      description: '早期基础控制系统，功能有限已升级',
      occupancyType: '规划',
      customer: 'OPPO',
      factory: '深圳厂',
      builder: '控制工程师',
      requester: '电气部',
      creationDate: '2023-06-01',
      isDeleted: true,
      deletedDate: '2024-03-15'
    },
    {
      id: generateId(),
      model: 'AC-75',
      codeNumber: '75',
      extension: '',
      productName: '中级控制系统75型（已停用）',
      description: '中级控制系统，因兼容性问题停用',
      occupancyType: '工令',
      customer: '惠普',
      factory: '松山湖厂',
      builder: '控制工程师',
      requester: '自动化部',
      creationDate: '2024-01-20',
      isDeleted: true,
      deletedDate: '2024-07-01'
    }
  ],

  // 用户数据 - 简化结构
  users: [
    {
      id: generateId(),
      employeeId: '0000',
      password: 'admin',
      name: '系统管理员',
      role: 'SUPER_ADMIN',
      department: '信息技术部',
      email: 'admin@company.com',
      createdAt: '2024-01-01',
      lastLogin: getCurrentDate()
    },
    {
      id: generateId(),
      employeeId: '1001',
      password: 'admin123',
      name: '张经理',
      role: 'ADMIN',
      department: '生产部',
      email: 'zhang@company.com',
      createdAt: '2024-01-15',
      lastLogin: '2024-07-20'
    },
    {
      id: generateId(),
      employeeId: '2001',
      password: 'user123',
      name: '李工程师',
      role: 'USER',
      department: '研发部',
      email: 'li@company.com',
      createdAt: '2024-02-01',
      lastLogin: '2024-07-22'
    }
  ],

  // 战情中心数据 - 大幅简化，使用合理的数据量
  warRoomData: {
    // 年度新增机型数据
    yearlyNewModels: [
      { year: '2022', PCB: 12, FPC: 8 },
      { year: '2023', PCB: 15, FPC: 10 },
      { year: '2024', PCB: 18, FPC: 12 }
    ],

    // 季度规划占用数据
    planningUsage: [
      { period: 'Q1', PCB: 25, FPC: 15 },
      { period: 'Q2', PCB: 30, FPC: 18 },
      { period: 'Q3', PCB: 28, FPC: 20 },
      { period: 'Q4', PCB: 32, FPC: 22 }
    ],

    // 机型码余量数据（更新为实际统计数据）
    modelCodeRemaining: [
      { type: 'SLU', total: 999, used: 15, remaining: 984 }, // 实际：8个有效+5个已删除+完整范围生成
      { type: 'SLUR', total: 999, used: 4, remaining: 995 },  // 实际：3个有效+2个已删除
      { type: 'SB', total: 999, used: 3, remaining: 996 },    // 实际：2个有效+1个已删除  
      { type: 'ST', total: 999, used: 2, remaining: 997 },    // 实际：1个有效+1个已删除
      { type: 'AC', total: 999, used: 4, remaining: 995 }     // 实际：2个有效+2个已删除
    ],

    // 新增代码统计数据 - 更新为实际机型编号
    newCodeData: {
      SLU: {
        week: [
          { date: '第1周', count: 3, codeId: 'slu-w1', codes: ['SLU-100', 'SLU-101', 'SLU-102'] },
          { date: '第2周', count: 3, codeId: 'slu-w2', codes: ['SLU-104', 'SLU-105', 'SLU-108'] },
          { date: '第3周', count: 1, codeId: 'slu-w3', codes: ['SLU-110'] },
          { date: '第4周', count: 4, codeId: 'slu-w4', codes: ['SLU-115', 'SLU-125', 'SLU-135', 'SLU-145'] }
        ],
        month: [
          { date: '1月', count: 9, codeId: 'slu-m1', codes: ['SLU-100', 'SLU-101', 'SLU-102', 'SLU-104', 'SLU-105', 'SLU-108', 'SLU-110', 'SLU-115', 'SLU-125'] },
          { date: '2月', count: 6, codeId: 'slu-m2', codes: ['SLU-135', 'SLU-145', 'SLU-199', 'SLU-201', 'SLU-202', 'SLU-203'] },
          { date: '3月', count: 4, codeId: 'slu-m3', codes: ['SLU-205', 'SLU-210', 'SLU-301', 'SLU-305'] }
        ],
        year: [
          { date: '2022', count: 4, codeId: 'slu-y1', codes: ['SLU-100', 'SLU-101', 'SLU-102', 'SLU-104'] },
          { date: '2023', count: 4, codeId: 'slu-y2', codes: ['SLU-105', 'SLU-108', 'SLU-110', 'SLU-115'] },
          { date: '2024', count: 11, codeId: 'slu-y3', codes: ['SLU-125', 'SLU-135', 'SLU-145', 'SLU-199', 'SLU-201', 'SLU-202', 'SLU-203', 'SLU-205', 'SLU-210', 'SLU-301', 'SLU-305'] }
        ]
      },
      SLUR: {
        week: [
          { date: '第1周', count: 2, codeId: 'slur-w1', codes: ['SLUR-100', 'SLUR-101'] },
          { date: '第2周', count: 1, codeId: 'slur-w2', codes: ['SLUR-105'] },
          { date: '第3周', count: 1, codeId: 'slur-w3', codes: ['SLUR-106'] },
          { date: '第4周', count: 1, codeId: 'slur-w4', codes: ['SLUR-201'] }
        ],
        month: [
          { date: '1月', count: 3, codeId: 'slur-m1', codes: ['SLUR-100', 'SLUR-101', 'SLUR-105'] },
          { date: '2月', count: 1, codeId: 'slur-m2', codes: ['SLUR-106'] },
          { date: '3月', count: 1, codeId: 'slur-m3', codes: ['SLUR-201'] }
        ],
        year: [
          { date: '2022', count: 2, codeId: 'slur-y1', codes: ['SLUR-100', 'SLUR-101'] },
          { date: '2023', count: 2, codeId: 'slur-y2', codes: ['SLUR-105', 'SLUR-106'] },
          { date: '2024', count: 1, codeId: 'slur-y3', codes: ['SLUR-201'] }
        ]
      },
      SB: {
        week: [
          { date: '第1周', count: 2, codeId: 'sb-w1', codes: ['SB-100', 'SB-101'] },
          { date: '第2周', count: 1, codeId: 'sb-w2', codes: ['SB-105'] },
          { date: '第3周', count: 1, codeId: 'sb-w3', codes: ['SB-108'] },
          { date: '第4周', count: 0, codeId: 'sb-w4', codes: [] }
        ],
        month: [
          { date: '1月', count: 2, codeId: 'sb-m1', codes: ['SB-100', 'SB-101'] },
          { date: '2月', count: 1, codeId: 'sb-m2', codes: ['SB-105'] },
          { date: '3月', count: 1, codeId: 'sb-m3', codes: ['SB-108'] }
        ],
        year: [
          { date: '2022', count: 2, codeId: 'sb-y1', codes: ['SB-100', 'SB-101'] },
          { date: '2023', count: 1, codeId: 'sb-y2', codes: ['SB-105'] },
          { date: '2024', count: 1, codeId: 'sb-y3', codes: ['SB-108'] }
        ]
      },
      ST: {
        week: [
          { date: '第1周', count: 2, codeId: 'st-w1', codes: ['ST-100', 'ST-101'] },
          { date: '第2周', count: 1, codeId: 'st-w2', codes: ['ST-105'] },
          { date: '第3周', count: 0, codeId: 'st-w3', codes: [] },
          { date: '第4周', count: 0, codeId: 'st-w4', codes: [] }
        ],
        month: [
          { date: '1月', count: 2, codeId: 'st-m1', codes: ['ST-100', 'ST-101'] },
          { date: '2月', count: 1, codeId: 'st-m2', codes: ['ST-105'] },
          { date: '3月', count: 0, codeId: 'st-m3', codes: [] }
        ],
        year: [
          { date: '2022', count: 2, codeId: 'st-y1', codes: ['ST-100', 'ST-101'] },
          { date: '2023', count: 1, codeId: 'st-y2', codes: ['ST-105'] },
          { date: '2024', count: 0, codeId: 'st-y3', codes: [] }
        ]
      }
    }
  },

  // 数据字典
  dataDictionary: {
    customers: customerDict,
    factories: factoryDict,
    productNames: productNameDict,
    occupancyTypes: occupancyTypeDict,
    modelTypes: modelTypeDict,
  }
};