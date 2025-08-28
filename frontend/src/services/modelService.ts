// modelService.ts
import { mockData } from '../mock/mockData';
import type { ProductType, CodeUsageEntry, ModelClassification, CodeClassification } from '../mock/interfaces';

// 生成唯一ID的辅助函数
const generateId = () => Math.random().toString(36).substring(2, 9);

// 当前日期格式化为 YYYY/MM/DD
const formatDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 产品类型服务
 */
export const ProductTypeService = {
  // 获取所有产品类型
  getAllProductTypes(): ProductType[] {
    return [...mockData.productTypes];
  },

  // 根据ID获取单个产品类型
  getProductTypeById(id: string): ProductType | undefined {
    return mockData.productTypes.find(pt => pt.id === id);
  },

  // 添加新的产品类型
  addProductType(productType: Omit<ProductType, 'id'>): ProductType {
    const newProductType: ProductType = {
      ...productType,
      id: generateId(),
    };
    mockData.productTypes.push(newProductType);
    return newProductType;
  },

  // 更新产品类型
  updateProductType(id: string, productType: Partial<ProductType>): ProductType | undefined {
    const index = mockData.productTypes.findIndex(pt => pt.id === id);
    if (index === -1) return undefined;

    // 更新产品类型
    const updatedProductType = {
      ...mockData.productTypes[index],
      ...productType
    };
    mockData.productTypes[index] = updatedProductType;
    return updatedProductType;
  },

  // 删除产品类型
  deleteProductType(id: string): boolean {
    const initialLength = mockData.productTypes.length;
    mockData.productTypes = mockData.productTypes.filter(pt => pt.id !== id);
    return initialLength > mockData.productTypes.length;
  }
};

/**
 * 代码使用清单服务
 */
export const CodeUsageService = {
  // 获取所有代码使用清单
  getAllCodeUsages(): CodeUsageEntry[] {
    return mockData.codeUsageList.filter(item => !item.isDeleted);
  },

  // 获取包括已删除的所有代码使用清单
  getAllCodeUsagesIncludingDeleted(): CodeUsageEntry[] {
    return [...mockData.codeUsageList];
  },

  // 根据ID获取单个代码使用清单
  getCodeUsageById(id: string): CodeUsageEntry | undefined {
    return mockData.codeUsageList.find(item => item.id === id && !item.isDeleted);
  },

  // 根据机型查找代码使用清单
  getCodeUsageByModel(model: string): CodeUsageEntry[] {
    return mockData.codeUsageList.filter(item => item.model === model && !item.isDeleted);
  },

  // 添加新的代码使用清单
  addCodeUsage(codeUsage: Omit<CodeUsageEntry, 'id' | 'isDeleted' | 'history'>): CodeUsageEntry {
    const newCodeUsage: CodeUsageEntry = {
      ...codeUsage,
      id: generateId(),
      isDeleted: false,
      creationDate: codeUsage.creationDate || formatDate()
    };
    mockData.codeUsageList.push(newCodeUsage);
    return newCodeUsage;
  },

  // 更新代码使用清单
  updateCodeUsage(id: string, codeUsage: Partial<CodeUsageEntry>): CodeUsageEntry | undefined {
    const index = mockData.codeUsageList.findIndex(item => item.id === id && !item.isDeleted);
    if (index === -1) return undefined;

    // 更新代码使用清单
    const updatedCodeUsage = {
      ...mockData.codeUsageList[index],
      ...codeUsage
    };
    mockData.codeUsageList[index] = updatedCodeUsage;
    return updatedCodeUsage;
  },

  // 软删除代码使用清单（将isDeleted设为true）
  softDeleteCodeUsage(id: string): boolean {
    const index = mockData.codeUsageList.findIndex(item => item.id === id && !item.isDeleted);
    if (index === -1) return false;

    // 创建历史记录
    mockData.codeUsageList[index].isDeleted = true;
    return true;
  },

  // 恢复已删除的代码使用清单
  restoreCodeUsage(id: string): boolean {
    const index = mockData.codeUsageList.findIndex(item => item.id === id && item.isDeleted);
    if (index === -1) return false;

    // 恢复
    mockData.codeUsageList[index].isDeleted = false;
    return true;
  },

  // 硬删除代码使用清单（从数组中移除）
  hardDeleteCodeUsage(id: string): boolean {
    const initialLength = mockData.codeUsageList.length;
    mockData.codeUsageList = mockData.codeUsageList.filter(item => item.id !== id);
    return initialLength > mockData.codeUsageList.length;
  }
};

/**
 * 模型分类服务
 */
export const ModelClassificationService = {
  // 获取所有模型分类
  getAllModelClassifications(): ModelClassification[] {
    return [...mockData.modelClassifications];
  },

  // 根据类型获取模型分类
  getModelClassificationByType(type: string): ModelClassification | undefined {
    return mockData.modelClassifications.find(mc => mc.type === type);
  },

  // 添加新的模型分类
  addModelClassification(modelClassification: ModelClassification): ModelClassification {
    mockData.modelClassifications.push(modelClassification);
    return modelClassification;
  },

  // 更新模型分类
  updateModelClassification(type: string, modelClassification: Partial<ModelClassification>): ModelClassification | undefined {
    const index = mockData.modelClassifications.findIndex(mc => mc.type === type);
    if (index === -1) return undefined;

    // 更新模型分类
    const updatedModelClassification = {
      ...mockData.modelClassifications[index],
      ...modelClassification
    };
    mockData.modelClassifications[index] = updatedModelClassification;
    return updatedModelClassification;
  },

  // 删除模型分类
  deleteModelClassification(type: string): boolean {
    const initialLength = mockData.modelClassifications.length;
    mockData.modelClassifications = mockData.modelClassifications.filter(mc => mc.type !== type);
    return initialLength > mockData.modelClassifications.length;
  }
};

/**
 * 代码分类服务
 */
export const CodeClassificationService = {
  // 获取所有代码分类
  getAllCodeClassifications(): CodeClassification[] {
    return [...mockData.codeClassifications];
  },

  // 根据代码获取代码分类
  getCodeClassificationByCode(code: string): CodeClassification | undefined {
    return mockData.codeClassifications.find(cc => cc.code === code);
  },

  // 添加新的代码分类
  addCodeClassification(codeClassification: CodeClassification): CodeClassification {
    mockData.codeClassifications.push(codeClassification);
    return codeClassification;
  },

  // 更新代码分类
  updateCodeClassification(code: string, codeClassification: Partial<CodeClassification>): CodeClassification | undefined {
    const index = mockData.codeClassifications.findIndex(cc => cc.code === code);
    if (index === -1) return undefined;

    // 更新代码分类
    const updatedCodeClassification = {
      ...mockData.codeClassifications[index],
      ...codeClassification
    };
    mockData.codeClassifications[index] = updatedCodeClassification;
    return updatedCodeClassification;
  },

  // 删除代码分类
  deleteCodeClassification(code: string): boolean {
    const initialLength = mockData.codeClassifications.length;
    mockData.codeClassifications = mockData.codeClassifications.filter(cc => cc.code !== code);
    return initialLength > mockData.codeClassifications.length;
  }
};

// 导出所有服务
export const ModelService = {
  ProductType: ProductTypeService,
  CodeUsage: CodeUsageService,
  ModelClassification: ModelClassificationService,
  CodeClassification: CodeClassificationService
};

export default ModelService; 