// interfaces.ts

/**
 * 统一服务响应格式
 */
export interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * @description 模型分类说明
 */
export interface ModelClassification {
    id?: string; // 可选的ID，用于更新操作
    type: string; // 例如: 'SLU', 'SLUR', 'SB', 'ST' (只包含大写字母)
    description: string[]; // 描述列表
    productType: string; // 关联的产品类型代码，如 'PCB', 'FPC'
    productTypeId?: number; // 产品类型ID，用于后端API调用
    hasCodeClassification?: boolean; // 可选：是否需要代码分类层，默认为true（3层结构）。设为false时直接跳转到代码使用（2层结构）
    createdAt?: string; // 创建时间
    codeClassificationCount?: number; // 代码分类数量
    codeUsageCount?: number; // 代码使用数量
  }
  
  /**
   * @description 代码分类说明
   */
  export interface CodeClassification {
    code: string; // 例如: '1', '2', '3' (纯数字)
    name: string; // 例如: '内层', '薄板', '载盘'
    modelType: string; // 关联的机型类型，例如 'SLU-', 'SLUR-'
  }
  
  /**
   * @description 代码使用清单条目
   */
  export interface CodeUsageEntry {
    model: string; // 机型 (e.g., "SLU-101")
    codeNumber: string; // 代码编号 (e.g., "1", "2", "3")
    extension?: string; // 延伸 (e.g., "A")
    productName: string; // 品名 (e.g., "横向内层暂放板机")
    description: string; // 说明
    remarks?: string; // 备注
    occupancyType: string; // 占用类型 (e.g., "规划", "工令")
    customer?: string; // 客户 (e.g., "苹果", "华为", "小米")
    factory?: string; // 厂区 (e.g., "龙华厂", "观澜厂", "松山湖厂")
    builder: string; // 建檔人 (e.g., "周杰倫")
    requester: string; // 需求人 (e.g., "馬雲", "雷軍", "王心凌")
    creationDate: string; // 建立时间 (YYYY/MM/DD)
    isDeleted: boolean; // 软删除字段，默认为 false
    id: string; // 唯一标识符，用于CRUD操作
    deletedDate?: string; // 删除时间 (YYYY/MM/DD)，仅当isDeleted为true时有值
  }
  
  /**
   * @description 产品类型
   */
  export interface ProductType {
    id?: string; // 唯一标识符 (前端格式)
    Id?: number; // 唯一标识符 (后端格式)
    code?: string; // 产品代码，如 'PCB', 'FPC' (前端格式)
    Code?: string; // 产品代码 (后端格式)
    CreatedAt?: string; // 创建时间 (后端格式)
    ModelClassificationCount?: number; // 机型分类数量 (后端格式)
  }

  /**
   * @description 用户权限类型
   */
  export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

  /**
   * @description 用户信息
   */
  export interface User {
    id: string; // 唯一标识符
    employeeId: string; // 工号
    password: string; // 密码
    name: string; // 用户名
    role: UserRole; // 权限: 普通用户、管理员、超级管理员
    department?: string; // 部门
    email?: string; // 邮箱
    createdAt: string; // 创建时间
    lastLogin?: string; // 最后登录时间
  }

  /**
   * @description 年度新增机型数据
   */
  export interface YearlyNewModelsData {
    year: string; // 年份
    PCB: number; // PCB产品类型的新增机型数量
    FPC: number; // FPC产品类型的新增机型数量
  }

  /**
   * @description 规划占用数据
   */
  export interface PlanningUsageData {
    period: string; // 周期 (例如: "Q1", "Q2", "Q3")
    PCB: number; // PCB产品类型的规划占用数量
    FPC: number; // FPC产品类型的规划占用数量
  }

  /**
   * @description 机型码余量数据
   */
  export interface ModelCodeRemainingData {
    type: string; // 机型类型 (例如: "SLU-1", "SLU-2")
    total: number; // 总量
    used: number; // 已使用
    remaining: number; // 剩余量
  }

  /**
   * @description 新增代码数据项
   */
  export interface NewCodeDataItem {
    date: string; // 日期 (根据时间粒度，可以是周、月、年)
    count: number; // 新增数量
    codeId: string; // 代码ID，用于跳转到对应的代码使用清单
    codes: string[]; // 具体的代码编号列表
  }
  
  /**
   * @description 机型新增代码数据
   */
  export interface ModelNewCodeData {
    week: NewCodeDataItem[]; // 按周统计的数据
    month: NewCodeDataItem[]; // 按月统计的数据
    year: NewCodeDataItem[]; // 按年统计的数据
  }

  /**
   * @description 战情中心数据
   */
  export interface WarRoomData {
    yearlyNewModels: YearlyNewModelsData[]; // 年度新增机型数据
    planningUsage: PlanningUsageData[]; // 规划占用数据
    modelCodeRemaining: ModelCodeRemainingData[]; // 机型码余量数据
    newCodeData: {
      SLU: ModelNewCodeData; // SLU机型的新增代码数据
      SLUR: ModelNewCodeData; // SLUR机型的新增代码数据
      SB: ModelNewCodeData; // SB机型的新增代码数据
      ST: ModelNewCodeData; // ST机型的新增代码数据
    };
  }
  
  /**
   * @description 数据字典 - 客户信息
   */
  export interface Customer {
    id: string; // 客户ID
    name: string; // 客户名称 (e.g., "苹果", "华为", "迅得")
  }

  /**
   * @description 数据字典 - 厂区信息
   */
  export interface Factory {
    id: string; // 厂区ID
    name: string; // 厂区名称 (e.g., "龙华厂", "迅得东莞厂")
    customerId: string; // 关联的客户ID，实现级联关系
  }

  /**
   * @description 数据字典 - 品名信息
   */
  export interface ProductNameDict {
    id: string; // 品名ID
    name: string; // 品名 (e.g., "横向内层暂放板机", "PCB层压板")
  }

  /**
   * @description 数据字典 - 占用类型
   */
  export interface OccupancyTypeDict {
    id: string; // 占用类型ID
    name: string; // 占用类型名称 (e.g., "规划", "工令", "暂停")
  }

  /**
   * @description 数据字典 - 机型分类描述
   */
  export interface ModelTypeDict {
    id: string; // 机型分类ID
    type: string; // 机型类型 (e.g., "SLU-", "SLUR-")
    name: string; // 机型名称
    description: string[]; // 详细描述
    productType: string; // 关联产品类型
  }

  /**
   * @description 数据字典集合
   */
  export interface DataDictionary {
    customers: Customer[]; // 客户字典
    factories: Factory[]; // 厂区字典 (与客户级联)
    productNames: ProductNameDict[]; // 品名字典
    occupancyTypes: OccupancyTypeDict[]; // 占用类型字典
    modelTypes: ModelTypeDict[]; // 机型分类字典
  }

  /**
   * @description 整个 mock 数据的结构
   */
  export interface MockData {
    productTypes: ProductType[];
    modelClassifications: ModelClassification[];
    codeClassifications: CodeClassification[];
    codeUsageList: CodeUsageEntry[];
    users: User[]; // 用户列表
    warRoomData: WarRoomData; // 战情中心数据
    dataDictionary: DataDictionary; // 数据字典
  }