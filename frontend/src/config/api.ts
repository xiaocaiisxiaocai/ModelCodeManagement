// api.ts - API配置管理
/**
 * 统一的API配置管理
 * 避免在各个文件中硬编码API地址
 */

// API基础配置
export const API_CONFIG = {
  // 后端API基础地址
  BASE_URL: 'http://localhost:5250',
  
  // API版本前缀
  API_PREFIX: '/api/v1',
  
  // 超时设置
  TIMEOUT: 30000,
  
  // 重试配置
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  // 确保endpoint以/开头
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${cleanEndpoint}`;
};

// API端点常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // 数据字典相关
  DATA_DICTIONARY: {
    BASE: '/data-dictionary',
    CUSTOMERS: '/data-dictionary/customers',
    FACTORIES: '/data-dictionary/factories',
    PRODUCT_NAMES: '/data-dictionary/product-names',
    OCCUPANCY_TYPES: '/data-dictionary/occupancy-types',
    BY_CATEGORY: (category: string) => `/data-dictionary?category=${category}`,
    BY_ID: (id: string) => `/data-dictionary/${id}`,
    FACTORIES_BY_CUSTOMER: (customerId: string) => `/data-dictionary/factories/by-customer/${customerId}`,
  },
  
  // 产品类型相关
  PRODUCT_TYPES: {
    BASE: '/product-types',
    BY_ID: (id: string) => `/product-types/${id}`,
    PAGED: '/product-types/paged',
  },
  
  // 机型分类相关
  MODEL_CLASSIFICATIONS: {
    BASE: '/model-classifications',
    BY_ID: (id: string) => `/model-classifications/${id}`,
    BY_PRODUCT_TYPE: (productTypeId: string) => `/model-classifications/by-product-type/${productTypeId}`,
    PAGED: '/model-classifications/paged',
  },
  
  // 代码分类相关
  CODE_CLASSIFICATIONS: {
    BASE: '/code-classifications',
    BY_ID: (id: string) => `/code-classifications/${id}`,
    BY_MODEL_TYPE: (modelTypeId: string) => `/code-classifications/by-model-type/${modelTypeId}`,
    PAGED: '/code-classifications/paged',
  },
  
  // 编码使用相关
  CODE_USAGE: {
    BASE: '/code-usage',
    BY_ID: (id: string) => `/code-usage/${id}`,
    PAGED: '/code-usage/paged',
    STATISTICS: '/code-usage/statistics',
  },
  
  // 用户管理相关
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PAGED: '/users/paged',
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  },
  
  // 角色权限相关
  ROLES: {
    BASE: '/roles',
    BY_ID: (id: string) => `/roles/${id}`,
    PERMISSIONS: '/roles/permissions',
  },
  
  // 组织架构相关
  ORGANIZATIONS: {
    BASE: '/organizations',
    BY_ID: (id: string) => `/organizations/${id}`,
    TREE: '/organizations/tree',
  },
  
  // 战情中心相关
  WAR_ROOM: {
    DATA: '/war-room/data',
    STATISTICS: '/war-room/statistics',
  },
  
  // 系统相关
  SYSTEM: {
    HEALTH: '/health',
    VERSION: '/version',
    CONFIG: '/system/config',
  },
} as const;

// 导出便捷方法
export { buildApiUrl as apiUrl };
export default API_CONFIG;
