// adaptiveService.ts - 自适应服务，根据环境自动切换Mock和真实API
import type { DataResponse } from '../mock/interfaces';
import { realApiService, type BackendCodeUsageEntry, type BackendModelClassification, type BackendCodeClassification, type BackendProductType } from './realApiService';
import { unifiedServices } from './unifiedService';
import type { ProductType, ModelClassification, CodeClassification, CodeUsageEntry } from '../mock/interfaces';

// 数据转换器 - 将后端数据格式转换为前端格式
class DataTransformer {
  
  /**
   * 转换产品类型数据
   */
  static transformProductType(backend: BackendProductType): ProductType {
    return {
      id: backend.id.toString(),
      code: backend.code
    };
  }

  /**
   * 转换机型分类数据
   */
  static transformModelClassification(backend: BackendModelClassification): ModelClassification {
    return {
      type: backend.type,
      description: backend.description ? [backend.description] : [],
      productType: 'PCB', // 需要根据productTypeId查找对应的code
      hasCodeClassification: backend.hasCodeClassification
    };
  }

  /**
   * 转换代码分类数据
   */
  static transformCodeClassification(backend: BackendCodeClassification): CodeClassification {
    return {
      code: backend.code,
      modelType: '' // 需要根据modelClassificationId查找对应的type
    };
  }

  /**
   * 转换编码使用记录数据
   */
  static transformCodeUsageEntry(backend: BackendCodeUsageEntry): CodeUsageEntry {
    return {
      id: backend.id.toString(),
      model: backend.model,
      codeNumber: backend.codeClassificationNumber?.toString() || '',
      extension: backend.extension || '',
      productName: backend.productName || '',
      description: backend.description || '',
      occupancyType: backend.occupancyType || '',
      builder: backend.builder || '',
      requester: backend.requester || '',
      creationDate: backend.creationDate || backend.createdAt.split('T')[0].replace(/-/g, '/'),
      isDeleted: backend.isDeleted
    };
  }
}

/**
 * 自适应服务 - 根据环境和配置自动选择数据源
 */
export class AdaptiveService {
  private useRealApi: boolean;

  constructor() {
    // 检查是否应该使用真实API
    this.useRealApi = this.shouldUseRealApi();
  }

  /**
   * 判断是否应该使用真实API
   */
  private shouldUseRealApi(): boolean {
    // 1. 检查环境变量
    if (import.meta.env.VITE_USE_REAL_API === 'true') {
      return true;
    }
    
    // 2. 检查localStorage设置（开发时可手动切换）
    if (localStorage.getItem('useRealApi') === 'true') {
      return true;
    }
    
    // 3. 生产环境默认使用真实API
    if (import.meta.env.PROD) {
      return true;
    }
    
    // 4. 检查是否有认证Token（如果用户已登录，优先使用真实API）
    if (localStorage.getItem('accessToken')) {
      return true;
    }
    
    // 默认使用Mock
    return false;
  }

  /**
   * 手动切换API模式
   */
  switchToRealApi(useReal: boolean): void {
    this.useRealApi = useReal;
    localStorage.setItem('useRealApi', useReal.toString());
  }

  /**
   * 获取所有产品类型
   */
  async getProductTypes(): Promise<DataResponse<ProductType[]>> {
    if (this.useRealApi) {
      try {
        const response = await realApiService.getProductTypes();
        if (response.success && response.data) {
          const transformedData = response.data.map(DataTransformer.transformProductType);
          return {
            ...response,
            data: transformedData
          };
        }
        return response;
      } catch (error) {
        console.warn('Real API failed, fallback to Mock:', error);
        // 失败时回退到Mock
        return unifiedServices.productType.getAllProductTypes();
      }
    } else {
      return unifiedServices.productType.getAllProductTypes();
    }
  }

  /**
   * 获取机型分类
   */
  async getModelClassifications(productType?: string): Promise<DataResponse<ModelClassification[]>> {
    if (this.useRealApi) {
      try {
        // 需要先根据productType找到对应的ID（这里简化处理）
        const response = await realApiService.getModelClassifications();
        if (response.success && response.data) {
          let transformedData = response.data.map(DataTransformer.transformModelClassification);
          
          // 如果指定了产品类型，进行过滤
          if (productType) {
            transformedData = transformedData.filter(mc => mc.productType === productType);
          }
          
          return {
            ...response,
            data: transformedData
          };
        }
        return response;
      } catch (error) {
        console.warn('Real API failed, fallback to Mock:', error);
        return unifiedServices.modelClassification.getAllModelClassifications();
      }
    } else {
      return unifiedServices.modelClassification.getAllModelClassifications();
    }
  }

  /**
   * 预分配编码
   */
  async preAllocateCodes(codeClassificationId: number, forceRegenerate?: boolean): Promise<DataResponse<any>> {
    if (this.useRealApi) {
      try {
        return await realApiService.preAllocateCodes({
          codeClassificationId,
          forceRegenerate: forceRegenerate || false
        });
      } catch (error) {
        console.warn('Real API failed:', error);
        return {
          success: false,
          error: `预分配失败: ${error}`
        };
      }
    } else {
      // Mock模式下的模拟预分配
      return {
        success: true,
        data: {
          codeClassificationId,
          totalGenerated: 100,
          message: '模拟预分配完成'
        },
        message: 'Mock: 预分配编码完成'
      };
    }
  }

  /**
   * 手动创建编码
   */
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
  }): Promise<DataResponse<CodeUsageEntry>> {
    if (this.useRealApi) {
      try {
        const response = await realApiService.createManualCode(data);
        if (response.success && response.data) {
          const transformedData = DataTransformer.transformCodeUsageEntry(response.data);
          return {
            ...response,
            data: transformedData
          };
        }
        return response;
      } catch (error) {
        console.warn('Real API failed:', error);
        return {
          success: false,
          error: `创建编码失败: ${error}`
        };
      }
    } else {
      // Mock模式下使用现有的服务
      const mockData = {
        model: `Mock-${data.numberPart}${data.extension || ''}`,
        codeNumber: '1',
        extension: data.extension || '',
        productName: data.productName || '',
        description: data.description || '',
        occupancyType: data.occupancyType || '',
        builder: data.builder || '',
        requester: data.requester || '',
        creationDate: data.creationDate || new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        isDeleted: false
      };
      
      return unifiedServices.codeUsage.addCodeUsage(mockData);
    }
  }

  /**
   * 获取统计信息
   */
  async getPreAllocationStats(
    modelClassificationId?: number,
    codeClassificationId?: number
  ): Promise<DataResponse<{
    totalCodes: number;
    allocatedCodes: number;
    availableCodes: number;
    allocationRate: number;
  }>> {
    if (this.useRealApi) {
      try {
        return await realApiService.getPreAllocationStats(modelClassificationId, codeClassificationId);
      } catch (error) {
        console.warn('Real API failed:', error);
        return {
          success: false,
          error: `获取统计失败: ${error}`
        };
      }
    } else {
      // Mock统计数据
      return {
        success: true,
        data: {
          totalCodes: 1000,
          allocatedCodes: 350,
          availableCodes: 650,
          allocationRate: 35.0
        },
        message: 'Mock: 统计数据'
      };
    }
  }

  /**
   * 验证编码格式
   */
  async validateManualCode(data: {
    modelType: string;
    numberPart: string;
    extension?: string;
  }): Promise<DataResponse<{
    isAvailable: boolean;
    fullCode: string;
    message: string;
  }>> {
    if (this.useRealApi) {
      try {
        return await realApiService.validateManualCode(data);
      } catch (error) {
        console.warn('Real API failed:', error);
        return {
          success: false,
          error: `验证失败: ${error}`
        };
      }
    } else {
      // Mock验证
      const fullCode = `${data.modelType}-${data.numberPart}${data.extension || ''}`;
      return {
        success: true,
        data: {
          isAvailable: true,
          fullCode,
          message: `编码${fullCode}可用 (Mock)`
        },
        message: 'Mock: 编码验证完成'
      };
    }
  }
}

// 导出单例实例
export const adaptiveService = new AdaptiveService();
export default adaptiveService;