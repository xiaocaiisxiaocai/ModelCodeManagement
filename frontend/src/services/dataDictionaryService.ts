import type { Customer, Factory, ProductNameDict, OccupancyTypeDict, ModelTypeDict } from '../mock/interfaces';
import { mockData } from '../mock/mockData';

// 数据字典服务类
export class DataDictionaryService {
  
  // === 客户管理 ===
  
  /**
   * 获取所有客户
   */
  static getCustomers(): Customer[] {
    return mockData.dataDictionary.customers;
  }
  
  /**
   * 根据ID获取客户
   */
  static getCustomerById(id: string): Customer | undefined {
    return mockData.dataDictionary.customers.find(c => c.id === id);
  }
  
  /**
   * 创建客户
   */
  static createCustomer(customer: Omit<Customer, 'id'>): Customer {
    const newCustomer: Customer = {
      id: this.generateId('cust'),
      ...customer
    };
    
    mockData.dataDictionary.customers.push(newCustomer);
    return newCustomer;
  }
  
  /**
   * 更新客户
   */
  static updateCustomer(id: string, updates: Partial<Omit<Customer, 'id'>>): Customer | null {
    const index = mockData.dataDictionary.customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    mockData.dataDictionary.customers[index] = {
      ...mockData.dataDictionary.customers[index],
      ...updates
    };
    
    return mockData.dataDictionary.customers[index];
  }
  
  /**
   * 删除客户（级联删除相关厂区）
   */
  static deleteCustomer(id: string): boolean {
    const index = mockData.dataDictionary.customers.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    // 删除客户相关的厂区
    mockData.dataDictionary.factories = mockData.dataDictionary.factories.filter(
      f => f.customerId !== id
    );
    
    // 删除客户
    mockData.dataDictionary.customers.splice(index, 1);
    return true;
  }
  
  // === 厂区管理 ===
  
  /**
   * 获取所有厂区
   */
  static getFactories(): Factory[] {
    return mockData.dataDictionary.factories;
  }
  
  /**
   * 根据客户ID获取厂区
   */
  static getFactoriesByCustomerId(customerId: string): Factory[] {
    return mockData.dataDictionary.factories.filter(f => f.customerId === customerId);
  }
  
  /**
   * 根据ID获取厂区
   */
  static getFactoryById(id: string): Factory | undefined {
    return mockData.dataDictionary.factories.find(f => f.id === id);
  }
  
  /**
   * 创建厂区
   */
  static createFactory(factory: Omit<Factory, 'id'>): Factory {
    const newFactory: Factory = {
      id: this.generateId('fact'),
      ...factory
    };
    
    mockData.dataDictionary.factories.push(newFactory);
    return newFactory;
  }
  
  /**
   * 更新厂区
   */
  static updateFactory(id: string, updates: Partial<Omit<Factory, 'id'>>): Factory | null {
    const index = mockData.dataDictionary.factories.findIndex(f => f.id === id);
    if (index === -1) return null;
    
    mockData.dataDictionary.factories[index] = {
      ...mockData.dataDictionary.factories[index],
      ...updates
    };
    
    return mockData.dataDictionary.factories[index];
  }
  
  /**
   * 删除厂区
   */
  static deleteFactory(id: string): boolean {
    const index = mockData.dataDictionary.factories.findIndex(f => f.id === id);
    if (index === -1) return false;
    
    mockData.dataDictionary.factories.splice(index, 1);
    return true;
  }
  
  // === 品名管理 ===
  
  /**
   * 获取所有品名
   */
  static getProductNames(): ProductNameDict[] {
    return mockData.dataDictionary.productNames;
  }
  
  /**
   * 根据ID获取品名
   */
  static getProductNameById(id: string): ProductNameDict | undefined {
    return mockData.dataDictionary.productNames.find(p => p.id === id);
  }
  
  /**
   * 创建品名
   */
  static createProductName(product: Omit<ProductNameDict, 'id'>): ProductNameDict {
    const newProduct: ProductNameDict = {
      id: this.generateId('prod'),
      ...product
    };
    
    mockData.dataDictionary.productNames.push(newProduct);
    return newProduct;
  }
  
  /**
   * 更新品名
   */
  static updateProductName(id: string, updates: Partial<Omit<ProductNameDict, 'id'>>): ProductNameDict | null {
    const index = mockData.dataDictionary.productNames.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    mockData.dataDictionary.productNames[index] = {
      ...mockData.dataDictionary.productNames[index],
      ...updates
    };
    
    return mockData.dataDictionary.productNames[index];
  }
  
  /**
   * 删除品名
   */
  static deleteProductName(id: string): boolean {
    const index = mockData.dataDictionary.productNames.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    mockData.dataDictionary.productNames.splice(index, 1);
    return true;
  }
  
  // === 占用类型管理 ===
  
  /**
   * 获取所有占用类型
   */
  static getOccupancyTypes(): OccupancyTypeDict[] {
    return mockData.dataDictionary.occupancyTypes;
  }
  
  /**
   * 根据ID获取占用类型
   */
  static getOccupancyTypeById(id: string): OccupancyTypeDict | undefined {
    return mockData.dataDictionary.occupancyTypes.find(o => o.id === id);
  }
  
  /**
   * 创建占用类型
   */
  static createOccupancyType(occupancyType: Omit<OccupancyTypeDict, 'id'>): OccupancyTypeDict {
    const newOccupancyType: OccupancyTypeDict = {
      id: this.generateId('occu'),
      ...occupancyType
    };
    
    mockData.dataDictionary.occupancyTypes.push(newOccupancyType);
    return newOccupancyType;
  }
  
  /**
   * 更新占用类型
   */
  static updateOccupancyType(id: string, updates: Partial<Omit<OccupancyTypeDict, 'id'>>): OccupancyTypeDict | null {
    const index = mockData.dataDictionary.occupancyTypes.findIndex(o => o.id === id);
    if (index === -1) return null;
    
    mockData.dataDictionary.occupancyTypes[index] = {
      ...mockData.dataDictionary.occupancyTypes[index],
      ...updates
    };
    
    return mockData.dataDictionary.occupancyTypes[index];
  }
  
  /**
   * 删除占用类型
   */
  static deleteOccupancyType(id: string): boolean {
    const index = mockData.dataDictionary.occupancyTypes.findIndex(o => o.id === id);
    if (index === -1) return false;
    
    mockData.dataDictionary.occupancyTypes.splice(index, 1);
    return true;
  }
  
  // === 机型分类管理 ===
  
  /**
   * 获取所有机型分类
   */
  static getModelTypes(): ModelTypeDict[] {
    return mockData.dataDictionary.modelTypes;
  }
  
  /**
   * 根据ID获取机型分类
   */
  static getModelTypeById(id: string): ModelTypeDict | undefined {
    return mockData.dataDictionary.modelTypes.find(m => m.id === id);
  }
  
  /**
   * 创建机型分类
   */
  static createModelType(modelType: Omit<ModelTypeDict, 'id'>): ModelTypeDict {
    const newModelType: ModelTypeDict = {
      id: this.generateId('model'),
      ...modelType
    };
    
    mockData.dataDictionary.modelTypes.push(newModelType);
    return newModelType;
  }
  
  /**
   * 更新机型分类
   */
  static updateModelType(id: string, updates: Partial<Omit<ModelTypeDict, 'id'>>): ModelTypeDict | null {
    const index = mockData.dataDictionary.modelTypes.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    mockData.dataDictionary.modelTypes[index] = {
      ...mockData.dataDictionary.modelTypes[index],
      ...updates
    };
    
    return mockData.dataDictionary.modelTypes[index];
  }
  
  /**
   * 删除机型分类
   */
  static deleteModelType(id: string): boolean {
    const index = mockData.dataDictionary.modelTypes.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    mockData.dataDictionary.modelTypes.splice(index, 1);
    return true;
  }
  
  // === 工具方法 ===
  
  /**
   * 生成ID
   */
  private static generateId(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5);
    return `${prefix}${timestamp}${random}`;
  }
  
  /**
   * 验证客户名称唯一性
   */
  static isCustomerNameUnique(name: string, excludeId?: string): boolean {
    return !mockData.dataDictionary.customers.some(c => c.name === name && c.id !== excludeId);
  }
  
  /**
   * 验证厂区名称在客户下唯一性
   */
  static isFactoryNameUniqueForCustomer(name: string, customerId: string, excludeId?: string): boolean {
    return !mockData.dataDictionary.factories.some(f => 
      f.name === name && f.customerId === customerId && f.id !== excludeId
    );
  }
  
  /**
   * 验证品名名称唯一性
   */
  static isProductNameUnique(name: string, excludeId?: string): boolean {
    return !mockData.dataDictionary.productNames.some(p => p.name === name && p.id !== excludeId);
  }
  
  /**
   * 验证占用类型名称唯一性
   */
  static isOccupancyTypeNameUnique(name: string, excludeId?: string): boolean {
    return !mockData.dataDictionary.occupancyTypes.some(o => o.name === name && o.id !== excludeId);
  }
  
  /**
   * 验证机型分类代码唯一性
   */
  static isModelTypeUnique(type: string, excludeId?: string): boolean {
    return !mockData.dataDictionary.modelTypes.some(m => m.type === type && m.id !== excludeId);
  }
}