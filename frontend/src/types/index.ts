// src/types/index.ts - 类型系统统一入口
/**
 * 类型系统总入口
 * 提供项目中所有类型定义的统一导出
 * 
 * 架构说明：
 * - api.ts: 后端API数据传输对象类型 (严格对应后端Entity)
 * - domain.ts: 前端领域类型 (优化用于UI展示和交互)
 * - mappers.ts: API DTO 与 Domain 类型之间的双向映射
 * - 其他模块: 认证、通用、UI等辅助类型
 */

// ================================
// 核心类型模块
// ================================

// 后端API类型 (DTO层)
export type { 
  ApiResponse, 
  PagedApiResponse,
  PaginationParams as ApiPaginationParams,
  // 其他具体导出...
} from './api';

// 前端领域类型 (Domain层)
export type {
  ServiceResponse,
  PagedResponse,
  PaginationParams as DomainPaginationParams,
  // 其他具体导出...
} from './domain';

// 类型映射系统
export * from './mappers';
export { default as Mappers } from './mappers';

// ================================
// 辅助类型模块 (待创建)
// ================================

// 认证相关类型
// export * from './auth';

// 通用工具类型
// export * from './common';

// UI组件类型
// export * from './ui';

// ================================
// 兼容性导出
// ================================

// ✅ 所有mock引用已切换到新类型系统，移除兼容性导出
// export * from '../mock/interfaces';

// ================================
// 类型系统使用指南
// ================================

/**
 * 类型使用建议：
 * 
 * 1. 服务层 (API调用)
 *    - 使用 api.ts 中的 DTO 类型进行网络通信
 *    - 使用 mappers.ts 进行类型转换
 *    例：const dto = await api.get<ProductTypeDto>('/product-types');
 *        const domain = Mappers.ProductType.toDomain(dto);
 * 
 * 2. 组件层 (UI展示)
 *    - 使用 domain.ts 中的领域类型进行UI渲染
 *    - 享受计算字段和显示优化的便利
 *    例：<ProductTypeCard productType={domainProductType} />
 * 
 * 3. 表单层 (数据提交)
 *    - 使用 domain.ts 中的 FormData 类型收集表单数据
 *    - 使用 mappers.ts 转换为 CreateDto/UpdateDto
 *    例：const formData: ProductTypeFormData = { code: 'PCB' };
 *        const createDto = Mappers.ProductType.toCreateDto(formData);
 * 
 * 4. 状态管理 (数据缓存)
 *    - 优先使用领域类型存储数据
 *    - 在需要网络传输时转换为DTO类型
 */

// ================================
// 类型导入便捷别名
// ================================

// API类型别名 (后端对接)
export type {
  ProductTypeDto as ApiProductType,
  ModelClassificationDto as ApiModelClassification,
  CodeUsageEntryDto as ApiCodeUsageEntry,
  UserDto as ApiUser,
  WarRoomDataDto as ApiWarRoomData,
} from './api';

// Domain类型别名 (前端使用)
export type {
  ProductType as DomainProductType,
  ModelClassification as DomainModelClassification,
  CodeUsageEntry as DomainCodeUsageEntry,
  User as DomainUser,
  WarRoomData as DomainWarRoomData,
} from './domain';

// 响应类型别名已在上面导出

// 映射器类型别名
export { Mappers as TypeMappers } from './mappers';