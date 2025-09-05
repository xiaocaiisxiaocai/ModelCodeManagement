// index.ts - 服务层统一导出
/**
 * 新服务层的统一入口点
 * 提供现代化的服务访问方式和向后兼容支持
 */

import { container, getServiceContainer, type ServiceContainer } from './container';

// ===== 核心服务导出 =====

/**
 * 主要服务访问点 - 推荐使用方式
 * 
 * @example
 * ```typescript
 * import { services } from './services';
 * 
 * // 获取所有产品类型
 * const result = await services.productType.getAll();
 * if (result.success) {
 *   // 产品类型数据处理逻辑
 * }
 * ```
 */
export const services = {
  productType: container.productType,
  modelClassification: container.modelClassification,
  codeClassification: container.codeClassification,
  codeUsage: container.codeUsage,
  warRoom: container.warRoom,
  dataDictionary: container.dataDictionary,
  userManagement: container.userManagement,
  auditLog: container.auditLog,
} as const;

/**
 * 服务容器访问 - 高级用法
 * 
 * @example
 * ```typescript
 * import { serviceContainer } from './services';
 * 
 * // 获取特定服务
 * const productService = serviceContainer.getService('productType');
 * 
 * // 检查服务状态
 * // 服务容器状态信息
 * ```
 */
export const serviceContainer: ServiceContainer = container;

// 旧的兼容层已移除，现在统一使用新的services对象

// ===== 类型定义导出 =====

// 领域类型
export type * from '../types/domain';

// 服务接口类型
export type { IProductTypeService } from './domain/product-type.service';
export type { IModelClassificationService } from './domain/model-classification.service';
export type { ICodeUsageService } from './domain/code-usage.service';
export type { IDataDictionaryService } from './domain/data-dictionary.service';

// ===== 核心组件导出 =====

// API 客户端
export { apiClient } from './api/client';

// 服务容器
export { ServiceContainer, getServiceContainer } from './container';

// ===== 便捷函数导出 =====

/**
 * 创建服务实例的工厂函数
 * 主要用于测试或特殊场景
 */
export function createServices(apiBaseUrl?: string) {
  const newContainer = getServiceContainer();
  if (apiBaseUrl) {
    newContainer.setApiBaseUrl(apiBaseUrl);
  }
  return {
    productType: newContainer.productType,
    modelClassification: newContainer.modelClassification,
    codeUsage: newContainer.codeUsage,
    warRoom: newContainer.warRoom,
    dataDictionary: newContainer.dataDictionary,
    userManagement: newContainer.userManagement,
    auditLog: newContainer.auditLog,
  };
}

/**
 * 重置服务容器
 * 主要用于测试场景
 */
export function resetServices() {
  serviceContainer.destroy();
  return getServiceContainer();
}

/**
 * 获取服务层状态信息
 */
export function getServiceStatus() {
  return serviceContainer.getStatus();
}

// ===== 迁移指导 =====

/**
 * 迁移指导常量
 * 帮助开发者了解如何从旧的 unifiedService 迁移到新的服务层
 */
export const MIGRATION_GUIDE = {
  // 旧的调用方式 -> 新的调用方式
  examples: {
    // ProductType 服务迁移
    productType: {
      old: `import { unifiedServices } from './services/unifiedService';
const result = await unifiedServices.productType.getAllProductTypes();`,
      new: `import { services } from './services';
const result = await services.productType.getAll();`
    },
    // ModelClassification 服务迁移
    modelClassification: {
      old: `import { unifiedServices } from './services/unifiedService';
const result = await unifiedServices.modelClassification.getModelClassificationsByProductType('PCB');`,
      new: `import { services } from './services';
const result = await services.modelClassification.getByProductType('PCB');`
    },
    // CodeUsage 服务迁移
    codeUsage: {
      old: `import { unifiedServices } from './services/unifiedService';
const result = await unifiedServices.codeUsage.getAllCodeUsageEntries();`,
      new: `import { services } from './services';
const result = await services.codeUsage.getAll();`
    },
    // DataDictionary 服务迁移
    dataDictionary: {
      old: `// 原先通过mock数据或unifiedService访问
import { customerDict, factoryDict } from './mock/mockData';
const customers = customerDict;`,
      new: `import { services } from './services';
const customersResult = await services.dataDictionary.getCustomers();
if (customersResult.success) {
  const customers = customersResult.data;
}`
    }
  },
  benefits: [
    '✅ 统一的错误处理',
    '✅ 完整的类型安全',
    '✅ 自动数据映射',
    '✅ 标准化响应格式',
    '✅ 更好的可测试性',
    '✅ 清晰的服务边界'
  ]
} as const;

// ===== 默认导出 =====

/**
 * 默认导出 - 最常用的服务访问方式
 */
export default services;