// apiService.ts - 完整后端API对接服务
import { httpClient } from './httpClient';
import type { DataResponse } from '../types/api';

// ===== 后端DTO接口定义 =====

export interface ProductTypeDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
}

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
}

export interface CodeUsageEntryDto {
  id: number;
  model: string;
  modelType: string;
  codeClassification?: string;
  actualNumber: string;
  extension?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
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

// ===== RBAC相关DTO接口定义 =====

export interface UserDto {
  id: number;
  employeeId: string;
  userName: string;
  email?: string;
  role: string;
  department?: string;
  organizationId?: number;
  organizationName?: string;
  position?: string;
  superiorId?: number;
  superiorName?: string;
  phone?: string;
  joinDate?: string;
  status: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  // 支持后端PascalCase和前端camelCase字段
  userCount?: number;
  UserCount?: number;
  permissionCount?: number;
  PermissionCount?: number;
  permissions?: number[];
  Permissions?: number[];
}

export interface PermissionDto {
  id: number;
  code: string;
  name: string;
  type: string;
  level: number;
  resource?: string;
  isActive: boolean;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  description?: string;
  category?: string;
  action?: string;
  // 支持后端PascalCase和前端camelCase字段
  Code?: string;
  Name?: string;
  Type?: string;
  Level?: number;
  Resource?: string;
  Description?: string;
  Category?: string;
  Action?: string;
}

export interface OrganizationDto {
  id: number;
  code: string;
  name: string;
  type: string;
  level: number;
  path: string;
  parentId?: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  parentName?: string;
  managerName?: string;
}

export interface AuditLogDto {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityType?: string;
  entityId?: number;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  httpMethod?: string;
  result: string;
  errorMessage?: string;
  createdAt: string;
  durationMs?: number;
}

// ===== API服务类 =====

/**
 * 完整的后端API服务
 */
export class ApiService {
  
  // ===== 产品类型管理 =====
  
  async getProductTypes(): Promise<DataResponse<ProductTypeDto[]>> {
    return httpClient.get<ProductTypeDto[]>('/v1/product-types');
  }

  async getProductTypeById(id: number): Promise<DataResponse<ProductTypeDto>> {
    return httpClient.get<ProductTypeDto>(`/v1/product-types/${id}`);
  }

  async createProductType(data: {
    code: string;
    name: string;
    description?: string;
  }): Promise<DataResponse<ProductTypeDto>> {
    return httpClient.post<ProductTypeDto>('/v1/product-types', data);
  }

  async updateProductType(id: number, data: {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<DataResponse<ProductTypeDto>> {
    return httpClient.put<ProductTypeDto>(`/v1/product-types/${id}`, data);
  }

  async deleteProductType(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/product-types/${id}`);
  }

  // ===== 机型分类管理 =====

  async getModelClassifications(productTypeId?: number): Promise<DataResponse<ModelClassificationDto[]>> {
    const params = productTypeId ? { productTypeId } : undefined;
    return httpClient.get<ModelClassificationDto[]>('/v1/model-classifications', params);
  }

  async getModelClassificationById(id: number): Promise<DataResponse<ModelClassificationDto>> {
    return httpClient.get<ModelClassificationDto>(`/v1/model-classifications/${id}`);
  }

  async createModelClassification(data: {
    type: string;
    name: string;
    description?: string;
    productTypeId: number;
    hasCodeClassification: boolean;
  }): Promise<DataResponse<ModelClassificationDto>> {
    return httpClient.post<ModelClassificationDto>('/v1/model-classifications', data);
  }

  async updateModelClassification(id: number, data: {
    type?: string;
    name?: string;
    description?: string;
    hasCodeClassification?: boolean;
    isActive?: boolean;
  }): Promise<DataResponse<ModelClassificationDto>> {
    return httpClient.put<ModelClassificationDto>(`/v1/model-classifications/${id}`, data);
  }

  async deleteModelClassification(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/model-classifications/${id}`);
  }

  // ===== 代码分类管理 =====

  async getCodeClassifications(modelClassificationId?: number): Promise<DataResponse<CodeClassificationDto[]>> {
    const params = modelClassificationId ? { modelClassificationId } : undefined;
    return httpClient.get<CodeClassificationDto[]>('/v1/code-classification', params);
  }

  async getCodeClassificationById(id: number): Promise<DataResponse<CodeClassificationDto>> {
    return httpClient.get<CodeClassificationDto>(`/v1/code-classification/${id}`);
  }

  async createCodeClassification(data: {
    code: string;
    name: string;
    description?: string;
    modelClassificationId: number;
    sortOrder?: number;
  }): Promise<DataResponse<CodeClassificationDto>> {
    return httpClient.post<CodeClassificationDto>('/v1/code-classification', data);
  }

  async updateCodeClassification(id: number, data: {
    code?: string;
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DataResponse<CodeClassificationDto>> {
    return httpClient.put<CodeClassificationDto>(`/v1/code-classification/${id}`, data);
  }

  async deleteCodeClassification(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/code-classification/${id}`);
  }

  // ===== 编码使用管理 =====

  async getCodeUsageEntries(params?: {
    modelClassificationId?: number;
    codeClassificationId?: number;
    isAllocated?: boolean;
    occupancyType?: string;
    includeDeleted?: boolean;
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<CodeUsageEntryDto>>> {
    return httpClient.get<PagedResult<CodeUsageEntryDto>>('/v1/code-usage', params);
  }

  async getCodeUsageById(id: number): Promise<DataResponse<CodeUsageEntryDto>> {
    return httpClient.get<CodeUsageEntryDto>(`/v1/code-usage/${id}`);
  }

  async allocateCode(id: number, data: {
    extension?: string;
    productName?: string;
    description?: string;
    occupancyType?: string;
    customerId?: number;
    factoryId?: number;
    builder?: string;
    requester?: string;
    creationDate?: string;
  }): Promise<DataResponse<CodeUsageEntryDto>> {
    return httpClient.post<CodeUsageEntryDto>(`/v1/code-usage/${id}/allocate`, data);
  }

  async updateCodeUsage(id: number, data: {
    extension?: string;
    productName?: string;
    description?: string;
    occupancyType?: string;
    customerId?: number;
    factoryId?: number;
    builder?: string;
    requester?: string;
    creationDate?: string;
  }): Promise<DataResponse<CodeUsageEntryDto>> {
    return httpClient.put<CodeUsageEntryDto>(`/v1/code-usage/${id}`, data);
  }

  async deleteCodeUsage(id: number, reason?: string): Promise<DataResponse<void>> {
    const url = reason ? `/v1/code-usage/${id}?reason=${encodeURIComponent(reason)}` : `/v1/code-usage/${id}`;
    return httpClient.delete<void>(url);
  }

  async restoreCodeUsage(id: number): Promise<DataResponse<CodeUsageEntryDto>> {
    return httpClient.post<CodeUsageEntryDto>(`/v1/code-usage/${id}/restore`);
  }

  // ===== 编码预分配管理 =====

  async preAllocateCodes(data: {
    codeClassificationId: number;
    forceRegenerate?: boolean;
  }): Promise<DataResponse<PreAllocationResultDto>> {
    return httpClient.post<PreAllocationResultDto>('/v1/code-pre-allocation/pre-allocate', data);
  }

  async createManualCode(data: {
    modelClassificationId: number;
    numberPart: string;
    extension?: string;
    productName?: string;
    description?: string;
    occupancyType?: string;
    builder?: string;
    requester?: string;
    creationDate?: string;
  }): Promise<DataResponse<CodeUsageEntryDto>> {
    return httpClient.post<CodeUsageEntryDto>('/v1/code-pre-allocation/manual', data);
  }

  async validateManualCode(data: {
    modelType: string;
    numberPart: string;
    extension?: string;
  }): Promise<DataResponse<{
    isAvailable: boolean;
    fullCode: string;
    message: string;
    conflictInfo?: any;
  }>> {
    return httpClient.post<any>('/v1/code-pre-allocation/validate', data);
  }

  async getAvailableCodes(
    modelClassificationId: number,
    codeClassificationId?: number,
    params?: {
      keyword?: string;
      pageIndex?: number;
      pageSize?: number;
    }
  ): Promise<DataResponse<PagedResult<CodeUsageEntryDto>>> {
    const queryParams = {
      modelClassificationId,
      codeClassificationId,
      ...params
    };
    return httpClient.get<PagedResult<CodeUsageEntryDto>>('/v1/code-pre-allocation/available', queryParams);
  }

  async getPreAllocationStats(
    modelClassificationId?: number,
    codeClassificationId?: number
  ): Promise<DataResponse<{
    totalCodes: number;
    allocatedCodes: number;
    availableCodes: number;
    allocationRate: number;
    byModelClassification: Record<string, number>;
    byCodeClassification: Record<string, number>;
  }>> {
    const params: any = {};
    if (modelClassificationId) params.modelClassificationId = modelClassificationId;
    if (codeClassificationId) params.codeClassificationId = codeClassificationId;
    
    return httpClient.get<any>('/codePreAllocation/stats', params);
  }

  async batchDeleteUnusedCodes(data: {
    modelClassificationId?: number;
    codeClassificationId?: number;
    codeIds?: number[];
    reason?: string;
  }): Promise<DataResponse<{
    successCount: number;
    failureCount: number;
    errors: string[];
    details: any[];
  }>> {
    return httpClient.post<any>('/codePreAllocation/batchDelete', data);
  }

  async getPreAllocationLogs(params?: {
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<any>>> {
    return httpClient.get<PagedResult<any>>('/codePreAllocation/logs', params);
  }

  // ===== 系统配置管理 =====

  async getSystemConfigs(): Promise<DataResponse<Record<string, string>>> {
    return httpClient.get<Record<string, string>>('/systemConfig');
  }

  async getSystemConfig(key: string): Promise<DataResponse<string>> {
    return httpClient.get<string>(`/systemConfig/${key}`);
  }

  async updateSystemConfigs(configs: Record<string, string>): Promise<DataResponse<void>> {
    return httpClient.put<void>('/systemConfig', configs);
  }

  // ===== 数据字典管理 =====

  async getDataDictionary(type: string, params?: {
    isActive?: boolean;
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<any>>> {
    return httpClient.get<PagedResult<any>>(`/dataDictionary/${type}`, params);
  }

  async createDataDictionaryItem(type: string, data: {
    code: string;
    name: string;
    description?: string;
    sortOrder?: number;
    parentId?: number;
  }): Promise<DataResponse<any>> {
    return httpClient.post<any>(`/dataDictionary/${type}`, data);
  }

  async updateDataDictionaryItem(type: string, id: number, data: {
    code?: string;
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DataResponse<any>> {
    return httpClient.put<any>(`/dataDictionary/${type}/${id}`, data);
  }

  async deleteDataDictionaryItem(type: string, id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/dataDictionary/${type}/${id}`);
  }

  // ===== 用户管理 =====
  
  async getUsers(params?: {
    keyword?: string;
    role?: string;
    isActive?: boolean;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<UserDto>>> {
    return httpClient.get<PagedResult<UserDto>>('/v1/user', params);
  }

  async getUserById(id: number): Promise<DataResponse<UserDto>> {
    return httpClient.get<UserDto>(`/v1/user/${id}`);
  }

  async createUser(data: {
    employeeId: string;
    userName: string;
    email?: string;
    password: string;
    organizationId?: number;
    position?: string;
    phone?: string;
    joinDate?: string;
  }): Promise<DataResponse<UserDto>> {
    return httpClient.post<UserDto>('/v1/user', data);
  }

  async updateUser(id: number, data: {
    userName?: string;
    email?: string;
    organizationId?: number;
    position?: string;
    phone?: string;
    joinDate?: string;
    isActive?: boolean;
  }): Promise<DataResponse<UserDto>> {
    return httpClient.put<UserDto>(`/v1/user/${id}`, data);
  }

  async deleteUser(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/user/${id}`);
  }

  async resetUserPassword(id: number, newPassword: string): Promise<DataResponse<string>> {
    return httpClient.post<string>(`/v1/user/${id}/reset-password`, {});
  }

  async assignUserRoles(userId: number, roleIds: number[]): Promise<DataResponse<void>> {
    return httpClient.post<void>(`/v1/user/${userId}/roles`, { roleIds });
  }

  async getUserRoles(userId: number): Promise<DataResponse<RoleDto[]>> {
    return httpClient.get<RoleDto[]>(`/v1/user/${userId}/roles`);
  }

  // ===== 角色管理 =====
  
  async getRoles(params?: {
    keyword?: string;
    isActive?: boolean;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<RoleDto>>> {
    return httpClient.get<PagedResult<RoleDto>>('/v1/roles', params);
  }

  async getRoleById(id: number): Promise<DataResponse<RoleDto>> {
    return httpClient.get<RoleDto>(`/v1/roles/${id}`);
  }

  async createRole(data: {
    code: string;
    name: string;
    description?: string;
  }): Promise<DataResponse<RoleDto>> {
    return httpClient.post<RoleDto>('/v1/roles', data);
  }

  async updateRole(id: number, data: {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<DataResponse<RoleDto>> {
    return httpClient.put<RoleDto>(`/v1/roles/${id}`, data);
  }

  async deleteRole(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/roles/${id}`);
  }

  async getRolePermissions(roleId: number): Promise<DataResponse<PermissionDto[]>> {
    return httpClient.get<PermissionDto[]>(`/v1/roles/${roleId}/permissions`);
  }

  async assignRolePermissions(roleId: number, permissionIds: number[]): Promise<DataResponse<void>> {
    return httpClient.post<void>(`/v1/roles/${roleId}/permissions`, { permissionIds });
  }

  // ===== 权限管理 =====
  
  async getPermissions(params?: {
    keyword?: string;
    type?: string;
    isActive?: boolean;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<PermissionDto>>> {
    return httpClient.get<PagedResult<PermissionDto>>('/v1/permissions', params);
  }

  async getPermissionById(id: number): Promise<DataResponse<PermissionDto>> {
    return httpClient.get<PermissionDto>(`/v1/permissions/${id}`);
  }

  async createPermission(data: {
    code: string;
    name: string;
    type: string;
    level: number;
    resource?: string;
    parentId?: number;
  }): Promise<DataResponse<PermissionDto>> {
    return httpClient.post<PermissionDto>('/v1/permissions', data);
  }

  async updatePermission(id: number, data: {
    code?: string;
    name?: string;
    type?: string;
    level?: number;
    resource?: string;
    parentId?: number;
    isActive?: boolean;
  }): Promise<DataResponse<PermissionDto>> {
    return httpClient.put<PermissionDto>(`/v1/permissions/${id}`, data);
  }

  async deletePermission(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/permissions/${id}`);
  }

  // ===== 组织架构管理 =====
  
  async getOrganizations(params?: {
    keyword?: string;
    type?: string;
    parentId?: number;
    isActive?: boolean;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<OrganizationDto>>> {
    return httpClient.get<PagedResult<OrganizationDto>>('/v1/organization', params);
  }

  async getOrganizationById(id: number): Promise<DataResponse<OrganizationDto>> {
    return httpClient.get<OrganizationDto>(`/v1/organization/${id}`);
  }

  async createOrganization(data: {
    code: string;
    name: string;
    type: string;
    parentId?: number;
    sortOrder?: number;
  }): Promise<DataResponse<OrganizationDto>> {
    return httpClient.post<OrganizationDto>('/v1/organization', data);
  }

  async updateOrganization(id: number, data: {
    code?: string;
    name?: string;
    type?: string;
    parentId?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DataResponse<OrganizationDto>> {
    return httpClient.put<OrganizationDto>(`/v1/organization/${id}`, data);
  }

  async deleteOrganization(id: number): Promise<DataResponse<void>> {
    return httpClient.delete<void>(`/v1/organization/${id}`);
  }

  async getOrganizationTree(): Promise<DataResponse<OrganizationDto[]>> {
    return httpClient.get<OrganizationDto[]>('/v1/organization/tree');
  }

  // ===== 审计日志管理 =====

  async getAuditLogs(params?: {
    userId?: number;
    username?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    result?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<AuditLogDto>>> {
    return httpClient.get<PagedResult<AuditLogDto>>('/v1/audit-logs', params);
  }

  async getAuditLogsByUser(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<DataResponse<AuditLogDto[]>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return httpClient.get<AuditLogDto[]>(`/v1/audit-logs/user/${userId}`, params);
  }

  async getMyAuditLogs(
    startDate?: string,
    endDate?: string
  ): Promise<DataResponse<AuditLogDto[]>> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return httpClient.get<AuditLogDto[]>('/v1/audit-logs/my-logs', params);
  }

  async getAuditLogsByEntity(
    entityType: string,
    entityId: number
  ): Promise<DataResponse<AuditLogDto[]>> {
    return httpClient.get<AuditLogDto[]>(`/v1/audit-logs/entity/${entityType}/${entityId}`);
  }

  async cleanupOldAuditLogs(daysToKeep: number = 90): Promise<DataResponse<void>> {
    return httpClient.post<void>(`/v1/audit-logs/cleanup?daysToKeep=${daysToKeep}`);
  }

}

// 导出单例实例
export const apiService = new ApiService();
export default apiService;