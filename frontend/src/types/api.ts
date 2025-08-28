// api.ts - 与后端API匹配的TypeScript接口定义

/**
 * 统一API响应格式
 */
export interface DataResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页查询参数
 */
export interface QueryDto {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  isActive?: boolean;
}

/**
 * 分页结果
 */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

// ===== 产品类型相关 =====

export interface ProductTypeDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateProductTypeDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateProductTypeDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ===== 机型分类相关 =====

export interface ModelClassificationDto {
  id: number;
  type: string;
  name: string;
  description?: string;
  productTypeId: number;
  hasCodeClassification: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  productType?: ProductTypeDto;
}

export interface CreateModelClassificationDto {
  type: string;
  name: string;
  description?: string;
  productTypeId: number;
  hasCodeClassification: boolean;
}

export interface UpdateModelClassificationDto {
  type?: string;
  name?: string;
  description?: string;
  hasCodeClassification?: boolean;
  isActive?: boolean;
}

// ===== 代码分类相关 =====

export interface CodeClassificationDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  modelClassificationId: number;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  modelClassification?: ModelClassificationDto;
}

export interface CreateCodeClassificationDto {
  code: string;
  name: string;
  description?: string;
  modelClassificationId: number;
  sortOrder?: number;
}

export interface UpdateCodeClassificationDto {
  code?: string;
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ===== 编码使用相关 =====

export interface CodeUsageEntryDto {
  id: number;
  model: string;
  modelType: string;
  codeClassification?: string;
  actualNumber: string;
  extension?: string;
  modelClassificationId: number;
  codeClassificationId?: number;
  productName?: string;
  description?: string;
  occupancyType?: string;
  customerId?: number;
  factoryId?: number;
  builder?: string;
  requester?: string;
  creationDate?: string;
  isAllocated: boolean;
  isDeleted: boolean;
  deletedReason?: string;
  numberDigits: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  modelClassification?: ModelClassificationDto;
  codeClassificationObj?: CodeClassificationDto;
}

export interface AllocateCodeDto {
  extension?: string;
  productName?: string;
  description?: string;
  occupancyType?: string;
  customerId?: number;
  factoryId?: number;
  builder?: string;
  requester?: string;
  creationDate?: string;
}

export interface UpdateCodeUsageDto {
  extension?: string;
  productName?: string;
  description?: string;
  occupancyType?: string;
  customerId?: number;
  factoryId?: number;
  builder?: string;
  requester?: string;
  creationDate?: string;
}

export interface CodeUsageQueryDto extends QueryDto {
  modelClassificationId?: number;
  codeClassificationId?: number;
  isAllocated?: boolean;
  occupancyType?: string;
  includeDeleted?: boolean;
}

// ===== 编码预分配相关 =====

export interface PreAllocateCodesDto {
  codeClassificationId: number;
  forceRegenerate?: boolean;
}

export interface PreAllocationResultDto {
  codeClassificationId: number;
  codeClassificationName: string;
  modelType: string;
  rangeStart: number;
  rangeEnd: number;
  totalGenerated: number;
  totalSkipped: number;
  success: boolean;
  message: string;
}

export interface CreateManualCodeDto {
  modelClassificationId: number;
  numberPart: string;
  extension?: string;
  productName?: string;
  description?: string;
  occupancyType?: string;
  builder?: string;
  requester?: string;
  creationDate?: string;
}

export interface ValidateManualCodeDto {
  modelType: string;
  numberPart: string;
  extension?: string;
}

export interface CodeAvailabilityDto {
  isAvailable: boolean;
  fullCode: string;
  message: string;
  conflictInfo?: {
    id: number;
    productName?: string;
    occupancyType?: string;
    createdAt: string;
  };
}

export interface UpdateOccupancyTypeDto {
  codeUsageId: number;
  occupancyType: string;
}

export interface BatchDeleteUnusedCodesDto {
  modelClassificationId?: number;
  codeClassificationId?: number;
  codeIds?: number[];
  reason?: string;
}

export interface BatchOperationResultDto {
  successCount: number;
  failureCount: number;
  errors: string[];
  details: any[];
}

export interface PreAllocationStatsDto {
  totalCodes: number;
  allocatedCodes: number;
  availableCodes: number;
  allocationRate: number;
  byModelClassification: Record<string, number>;
  byCodeClassification: Record<string, number>;
}

export interface CodePreAllocationLogDto {
  id: number;
  codeClassificationId: number;
  codeClassificationName: string;
  modelClassificationId: number;
  modelType: string;
  rangeStart: number;
  rangeEnd: number;
  generatedCount: number;
  skippedCount: number;
  operationType: string;
  createdBy?: number;
  createdAt: string;
}

// ===== 数据字典相关 =====

export interface DataDictionaryDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  sortOrder: number;
  parentId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDataDictionaryDto {
  code: string;
  name: string;
  description?: string;
  category: string;
  sortOrder?: number;
  parentId?: number;
}

export interface UpdateDataDictionaryDto {
  code?: string;
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface DataDictionaryQueryDto extends QueryDto {
  category?: string;
  parentId?: number;
}

// ===== 系统配置相关 =====

export interface SystemConfigDto {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== 用户认证相关 =====

export interface LoginRequest {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  employeeId: string;
  userName: string;
  role: string;
  department?: string;
  email?: string;
  organizationId?: number;
  position?: string;
  phone?: string;
  lastLogin?: string;
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}