// realApiService.ts - 真实API服务，对接后端
import { httpClient } from './httpClient';
import type { DataResponse } from '../mock/interfaces';

// 后端API的数据结构定义（与前端Mock数据结构对应）
export interface BackendProductType {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendModelClassification {
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

export interface BackendCodeClassification {
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

export interface BackendCodeUsageEntry {
  id: number;
  model: string;
  modelType: string;
  codeClassificationNumber?: number;
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
}

// 前端到后端的创建DTO
export interface CreateCodeUsageDto {
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

/**
 * 真实API服务类 - 与.NET后端对接
 */
export class RealApiService {
  
  /**
   * 获取所有产品类型
   */
  async getProductTypes(): Promise<DataResponse<BackendProductType[]>> {
    return httpClient.get<BackendProductType[]>('/productTypes');
  }

  /**
   * 获取机型分类（按产品类型筛选）
   */
  async getModelClassifications(productTypeId?: number): Promise<DataResponse<BackendModelClassification[]>> {
    const params = productTypeId ? { productTypeId } : undefined;
    return httpClient.get<BackendModelClassification[]>('/modelClassifications', params);
  }

  /**
   * 获取代码分类（按机型分类筛选）
   */
  async getCodeClassifications(modelClassificationId?: number): Promise<DataResponse<BackendCodeClassification[]>> {
    const params = modelClassificationId ? { modelClassificationId } : undefined;
    return httpClient.get<BackendCodeClassification[]>('/codeClassifications', params);
  }

  /**
   * 获取代码使用记录
   */
  async getCodeUsageEntries(params?: {
    modelClassificationId?: number;
    codeClassificationId?: number;
    isAllocated?: boolean;
    pageIndex?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<DataResponse<{
    items: BackendCodeUsageEntry[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
  }>> {
    return httpClient.get<any>('/codeUsage', params);
  }

  /**
   * 预分配编码（3层结构）
   */
  async preAllocateCodes(dto: PreAllocateCodesDto): Promise<DataResponse<PreAllocationResultDto>> {
    return httpClient.post<PreAllocationResultDto>('/codePreAllocation/preAllocate', dto);
  }

  /**
   * 手动创建编码（2层结构）
   */
  async createManualCode(dto: CreateCodeUsageDto): Promise<DataResponse<BackendCodeUsageEntry>> {
    return httpClient.post<BackendCodeUsageEntry>('/codePreAllocation/manual', dto);
  }

  /**
   * 验证手动编码格式
   */
  async validateManualCode(dto: {
    modelType: string;
    numberPart: string;
    extension?: string;
  }): Promise<DataResponse<{
    isAvailable: boolean;
    fullCode: string;
    message: string;
    conflictInfo?: any;
  }>> {
    return httpClient.post<any>('/codePreAllocation/validate', dto);
  }

  /**
   * 获取可用编码列表
   */
  async getAvailableCodes(
    modelClassificationId: number,
    codeClassificationId?: number,
    pageIndex: number = 1,
    pageSize: number = 20,
    keyword?: string
  ): Promise<DataResponse<{
    items: BackendCodeUsageEntry[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
  }>> {
    return httpClient.get<any>('/codePreAllocation/available', {
      modelClassificationId,
      codeClassificationId,
      pageIndex,
      pageSize,
      keyword
    });
  }

  /**
   * 获取预分配统计信息
   */
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

  /**
   * 更新编码使用信息
   */
  async updateCodeUsage(id: number, updates: {
    extension?: string;
    productName?: string;
    description?: string;
    occupancyType?: string;
    builder?: string;
    requester?: string;
    creationDate?: string;
  }): Promise<DataResponse<BackendCodeUsageEntry>> {
    return httpClient.put<BackendCodeUsageEntry>(`/codeUsage/${id}`, updates);
  }

  /**
   * 分配编码
   */
  async allocateCode(id: number, allocationData: {
    extension?: string;
    productName?: string;
    description?: string;
    occupancyType?: string;
    builder?: string;
    requester?: string;
    creationDate?: string;
  }): Promise<DataResponse<BackendCodeUsageEntry>> {
    return httpClient.post<BackendCodeUsageEntry>(`/codeUsage/${id}/allocate`, allocationData);
  }

  /**
   * 软删除编码使用记录
   */
  async deleteCodeUsage(id: number, reason?: string): Promise<DataResponse<boolean>> {
    return httpClient.delete<boolean>(`/codeUsage/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`);
  }
}

// 导出单例实例
export const realApiService = new RealApiService();
export default realApiService;