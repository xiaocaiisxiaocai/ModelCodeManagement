// businessService.ts - 业务服务层，基于API服务的高级封装
import { apiService } from './apiService';
import type { 
  DataResponse, 
  ProductTypeDto, 
  ModelClassificationDto, 
  CodeClassificationDto, 
  CodeUsageEntryDto,
  PagedResult,
  PreAllocationResultDto,
  PreAllocationStatsDto,
  CreateManualCodeDto,
  ValidateManualCodeDto,
  CodeAvailabilityDto
} from '../types/api';

/**
 * 产品类型业务服务
 */
export class ProductTypeService {
  
  async getAll(): Promise<DataResponse<ProductTypeDto[]>> {
    return apiService.getProductTypes();
  }

  async getById(id: number): Promise<DataResponse<ProductTypeDto>> {
    return apiService.getProductTypeById(id);
  }

  async create(data: {
    code: string;
    name: string;
    description?: string;
  }): Promise<DataResponse<ProductTypeDto>> {
    return apiService.createProductType(data);
  }

  async update(id: number, data: {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<DataResponse<ProductTypeDto>> {
    return apiService.updateProductType(id, data);
  }

  async delete(id: number): Promise<DataResponse<void>> {
    return apiService.deleteProductType(id);
  }
}

/**
 * 机型分类业务服务
 */
export class ModelClassificationService {
  
  async getAll(productTypeId?: number): Promise<DataResponse<ModelClassificationDto[]>> {
    return apiService.getModelClassifications(productTypeId);
  }

  async getById(id: number): Promise<DataResponse<ModelClassificationDto>> {
    return apiService.getModelClassificationById(id);
  }

  async create(data: {
    type: string;
    name: string;
    description?: string;
    productTypeId: number;
    hasCodeClassification: boolean;
  }): Promise<DataResponse<ModelClassificationDto>> {
    return apiService.createModelClassification(data);
  }

  async update(id: number, data: {
    type?: string;
    name?: string;
    description?: string;
    hasCodeClassification?: boolean;
    isActive?: boolean;
  }): Promise<DataResponse<ModelClassificationDto>> {
    return apiService.updateModelClassification(id, data);
  }

  async delete(id: number): Promise<DataResponse<void>> {
    return apiService.deleteModelClassification(id);
  }

  /**
   * 按产品类型获取机型分类
   */
  async getByProductType(productTypeId: number): Promise<DataResponse<ModelClassificationDto[]>> {
    return this.getAll(productTypeId);
  }

  /**
   * 检查机型是否为3层结构
   */
  async hasCodeClassification(id: number): Promise<DataResponse<boolean>> {
    const response = await this.getById(id);
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.hasCodeClassification,
        message: response.data.hasCodeClassification ? '3层结构' : '2层结构'
      };
    }
    return {
      success: false,
      error: response.error
    };
  }
}

/**
 * 代码分类业务服务
 */
export class CodeClassificationService {
  
  async getAll(modelClassificationId?: number): Promise<DataResponse<CodeClassificationDto[]>> {
    return apiService.getCodeClassifications(modelClassificationId);
  }

  async getById(id: number): Promise<DataResponse<CodeClassificationDto>> {
    return apiService.getCodeClassificationById(id);
  }

  async create(data: {
    code: string;
    name: string;
    description?: string;
    modelClassificationId: number;
    sortOrder?: number;
  }): Promise<DataResponse<CodeClassificationDto>> {
    return apiService.createCodeClassification(data);
  }

  async update(id: number, data: {
    code?: string;
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DataResponse<CodeClassificationDto>> {
    return apiService.updateCodeClassification(id, data);
  }

  async delete(id: number): Promise<DataResponse<void>> {
    return apiService.deleteCodeClassification(id);
  }

  /**
   * 按机型分类获取代码分类
   */
  async getByModelClassification(modelClassificationId: number): Promise<DataResponse<CodeClassificationDto[]>> {
    return this.getAll(modelClassificationId);
  }
}

/**
 * 编码使用业务服务
 */
export class CodeUsageService {
  
  async getAll(params?: {
    modelClassificationId?: number;
    codeClassificationId?: number;
    isAllocated?: boolean;
    occupancyType?: string;
    includeDeleted?: boolean;
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<CodeUsageEntryDto>>> {
    return apiService.getCodeUsageEntries(params);
  }

  async getById(id: number): Promise<DataResponse<CodeUsageEntryDto>> {
    return apiService.getCodeUsageById(id);
  }

  async allocate(id: number, data: {
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
    return apiService.allocateCode(id, data);
  }

  async update(id: number, data: {
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
    return apiService.updateCodeUsage(id, data);
  }

  async delete(id: number, reason?: string): Promise<DataResponse<void>> {
    return apiService.deleteCodeUsage(id, reason);
  }

  async restore(id: number): Promise<DataResponse<CodeUsageEntryDto>> {
    return apiService.restoreCodeUsage(id);
  }

  /**
   * 获取可用编码列表
   */
  async getAvailableCodes(
    modelClassificationId: number,
    codeClassificationId?: number,
    params?: {
      keyword?: string;
      pageIndex?: number;
      pageSize?: number;
    }
  ): Promise<DataResponse<PagedResult<CodeUsageEntryDto>>> {
    return apiService.getAvailableCodes(modelClassificationId, codeClassificationId, params);
  }

  /**
   * 按机型和代码分类筛选
   */
  async getByModelAndCode(
    modelClassificationId: number,
    codeClassificationId?: number,
    isAllocated?: boolean
  ): Promise<DataResponse<PagedResult<CodeUsageEntryDto>>> {
    return this.getAll({
      modelClassificationId,
      codeClassificationId,
      isAllocated
    });
  }

  /**
   * 按占用类型统计
   */
  async getStatsByOccupancyType(
    modelClassificationId?: number,
    codeClassificationId?: number
  ): Promise<DataResponse<Record<string, number>>> {
    const response = await this.getAll({
      modelClassificationId,
      codeClassificationId,
      pageSize: 1000 // 获取更多数据用于统计
    });

    if (response.success && response.data) {
      const stats: Record<string, number> = {};
      response.data.items.forEach(item => {
        const type = item.occupancyType || '未设置';
        stats[type] = (stats[type] || 0) + 1;
      });

      return {
        success: true,
        data: stats,
        message: '统计完成'
      };
    }

    return {
      success: false,
      error: response.error
    };
  }
}

/**
 * 编码预分配业务服务
 */
export class CodePreAllocationService {
  
  async preAllocate(data: {
    codeClassificationId: number;
    forceRegenerate?: boolean;
  }): Promise<DataResponse<PreAllocationResultDto>> {
    return apiService.preAllocateCodes(data);
  }

  async createManualCode(data: CreateManualCodeDto): Promise<DataResponse<CodeUsageEntryDto>> {
    return apiService.createManualCode(data);
  }

  async validateManualCode(data: ValidateManualCodeDto): Promise<DataResponse<CodeAvailabilityDto>> {
    return apiService.validateManualCode(data);
  }

  async getStats(
    modelClassificationId?: number,
    codeClassificationId?: number
  ): Promise<DataResponse<PreAllocationStatsDto>> {
    return apiService.getPreAllocationStats(modelClassificationId, codeClassificationId);
  }

  async batchDeleteUnused(data: {
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
    return apiService.batchDeleteUnusedCodes(data);
  }

  async getLogs(params?: {
    keyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<DataResponse<PagedResult<any>>> {
    return apiService.getPreAllocationLogs(params);
  }

  /**
   * 快速预分配 - 自动检测结构类型并执行相应操作
   */
  async quickPreAllocate(
    modelClassificationId: number,
    codeClassificationId?: number
  ): Promise<DataResponse<PreAllocationResultDto | CodeUsageEntryDto>> {
    // 先获取机型分类信息判断是否为3层结构
    const modelService = new ModelClassificationService();
    const modelResponse = await modelService.getById(modelClassificationId);

    if (!modelResponse.success || !modelResponse.data) {
      return {
        success: false,
        error: '获取机型分类信息失败'
      };
    }

    const hasCodeClassification = modelResponse.data.hasCodeClassification;

    if (hasCodeClassification && codeClassificationId) {
      // 3层结构：执行预分配
      return this.preAllocate({
        codeClassificationId,
        forceRegenerate: false
      });
    } else {
      // 2层结构：提示手动创建
      return {
        success: false,
        error: '2层结构需要手动创建编码，请使用手动创建功能'
      };
    }
  }
}

/**
 * 系统配置业务服务
 */
export class SystemConfigService {
  
  async getAll(): Promise<DataResponse<Record<string, string>>> {
    return apiService.getSystemConfigs();
  }

  async get(key: string): Promise<DataResponse<string>> {
    return apiService.getSystemConfig(key);
  }

  async update(configs: Record<string, string>): Promise<DataResponse<void>> {
    return apiService.updateSystemConfigs(configs);
  }

  /**
   * 获取编号位数配置
   */
  async getNumberDigits(): Promise<DataResponse<number>> {
    const response = await this.get('NumberDigits');
    if (response.success && response.data) {
      const value = parseInt(response.data);
      return {
        success: true,
        data: isNaN(value) ? 3 : value,
        message: '获取编号位数成功'
      };
    }
    return {
      success: false,
      error: response.error,
      data: 3 // 默认值
    };
  }

  /**
   * 获取延伸码最大长度配置
   */
  async getExtensionMaxLength(): Promise<DataResponse<number>> {
    const response = await this.get('ExtensionMaxLength');
    if (response.success && response.data) {
      const value = parseInt(response.data);
      return {
        success: true,
        data: isNaN(value) ? 5 : value,
        message: '获取延伸码最大长度成功'
      };
    }
    return {
      success: false,
      error: response.error,
      data: 5 // 默认值
    };
  }

  /**
   * 获取延伸码排除字符配置
   */
  async getExtensionExcludedChars(): Promise<DataResponse<string[]>> {
    const response = await this.get('ExtensionExcludedChars');
    if (response.success && response.data) {
      const chars = response.data.split(',').map(c => c.trim()).filter(c => c.length > 0);
      return {
        success: true,
        data: chars,
        message: '获取延伸码排除字符成功'
      };
    }
    return {
      success: false,
      error: response.error,
      data: ['0', 'O', 'I', '1'] // 默认值
    };
  }
}

// 导出业务服务实例
export const businessServices = {
  productType: new ProductTypeService(),
  modelClassification: new ModelClassificationService(),
  codeClassification: new CodeClassificationService(),
  codeUsage: new CodeUsageService(),
  codePreAllocation: new CodePreAllocationService(),
  systemConfig: new SystemConfigService()
};

export default businessServices;