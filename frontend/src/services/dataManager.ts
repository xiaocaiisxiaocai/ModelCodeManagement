// dataManager.ts - 统一数据管理中心
import { mockData } from '../mock/mockData';
import type { 
  ProductType, 
  CodeUsageEntry, 
  ModelClassification, 
  CodeClassification,
  WarRoomData,
  MockData 
} from '../mock/interfaces';

/**
 * 统一日期格式管理
 */
export class DateFormatter {
  static readonly FORMAT = {
    DISPLAY: 'YYYY/MM/DD',  // 显示格式 
    STORAGE: 'YYYY-MM-DD'   // 存储格式
  };

  /**
   * 获取当前日期 - 统一存储格式
   */
  static getCurrentDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取显示格式日期
   */
  static getDisplayDate(date?: string): string {
    const dateStr = date || this.getCurrentDate();
    return dateStr.replace(/-/g, '/');
  }

  /**
   * 转换为存储格式
   */
  static toStorageFormat(displayDate: string): string {
    return displayDate.replace(/\//g, '-');
  }
}

/**
 * 统一ID生成器
 */
export class IdGenerator {
  static generate(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }
}

/**
 * 统一响应接口
 */
export interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 统一数据操作基类
 */
export abstract class BaseDataService<T> {
  /**
   * 成功响应
   */
  protected success<U>(data: U, message?: string): DataResponse<U> {
    return { 
      success: true, 
      data, 
      message 
    };
  }

  /**
   * 错误响应
   */
  protected error(error: string): DataResponse<T> {
    console.error('🚫 [Service Error]', error);
    return { 
      success: false, 
      error 
    };
  }

  /**
   * 验证必要字段
   */
  protected validateRequired(obj: any, fields: string[]): string | null {
    for (const field of fields) {
      if (!obj[field]) {
        return `缺少必要字段: ${field}`;
      }
    }
    return null;
  }
}

/**
 * 统一数据管理器
 */
export class DataManager {
  private static instance: DataManager;
  private data: MockData;

  private constructor() {
    this.data = mockData;
  }

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * 获取所有数据
   */
  getAllData(): MockData {
    return this.data;
  }

  /**
   * 获取产品类型数据
   */
  getProductTypes(): ProductType[] {
    return [...this.data.productTypes];
  }

  /**
   * 获取模型分类数据
   */
  getModelClassifications(): ModelClassification[] {
    return [...this.data.modelClassifications];
  }

  /**
   * 获取代码分类数据
   */
  getCodeClassifications(): CodeClassification[] {
    return [...this.data.codeClassifications];
  }

  /**
   * 获取代码使用清单数据
   */
  getCodeUsageList(): CodeUsageEntry[] {
    return [...this.data.codeUsageList];
  }

  /**
   * 获取战情中心数据
   */
  getWarRoomData(): WarRoomData {
    return { ...this.data.warRoomData };
  }

  /**
   * 更新数据
   */
  updateData(updates: Partial<MockData>): void {
    this.data = { ...this.data, ...updates };
  }

  /**
   * 重置数据
   */
  resetData(): void {
    // 这里可以重新加载初始数据
    this.data = mockData;
  }

  /**
   * 数据统计信息
   */
  getStats() {
    return {
      productTypes: this.data.productTypes.length,
      modelClassifications: this.data.modelClassifications.length,
      codeClassifications: this.data.codeClassifications.length,
      totalCodeUsages: this.data.codeUsageList.length,
      activeCodeUsages: this.data.codeUsageList.filter(item => !item.isDeleted).length,
      deletedCodeUsages: this.data.codeUsageList.filter(item => item.isDeleted).length,
      lastUpdated: DateFormatter.getCurrentDate()
    };
  }
}

/**
 * 数据验证器
 */
export class DataValidator {
  static validateProductType(data: Partial<ProductType>): string | null {
    if (!data.code || data.code.trim().length === 0) {
      return '产品代码不能为空';
    }
    if (data.code.length > 10) {
      return '产品代码长度不能超过10个字符';
    }
    return null;
  }

  static validateModelClassification(data: Partial<ModelClassification>): string | null {
    if (!data.type || data.type.trim().length === 0) {
      return '机型类型不能为空';
    }
    if (!data.productType || data.productType.trim().length === 0) {
      return '关联产品类型不能为空';
    }
    if (!data.description || !Array.isArray(data.description) || data.description.length === 0) {
      return '描述信息不能为空';
    }
    return null;
  }

  static validateCodeClassification(data: Partial<CodeClassification>): string | null {
    if (!data.code || data.code.trim().length === 0) {
      return '代码不能为空';
    }
    if (!data.modelType || data.modelType.trim().length === 0) {
      return '关联机型类型不能为空';
    }
    return null;
  }

  static validateCodeUsageEntry(data: Partial<CodeUsageEntry>): string | null {
    const requiredFields = ['model', 'codeNumber', 'productName', 'occupancyType', 'builder', 'requester'];
    
    for (const field of requiredFields) {
      if (!data[field as keyof CodeUsageEntry] || 
          String(data[field as keyof CodeUsageEntry]).trim().length === 0) {
        return `${field} 不能为空`;
      }
    }

    // 占用类型验证现在由后端API和前端选项控制，不再硬编码验证
    if (data.occupancyType && typeof data.occupancyType !== 'string') {
      return '占用类型必须是有效的字符串';
    }

    return null;
  }
}

export default DataManager;