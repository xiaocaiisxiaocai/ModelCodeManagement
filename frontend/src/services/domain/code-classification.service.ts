// code-classification.service.ts - 代码分类业务服务
import { apiClient } from '../api/client';
import type { ServiceResponse, CodeClassification, CodeClassificationFormData } from '../../types/domain';

/**
 * 代码分类服务接口
 */
export interface ICodeClassificationService {
  getAll(): Promise<ServiceResponse<CodeClassification[]>>;
  getByModelType(modelType: string): Promise<ServiceResponse<CodeClassification[]>>;
  getById(id: string): Promise<ServiceResponse<CodeClassification>>;
  create(data: CodeClassificationFormData): Promise<ServiceResponse<CodeClassification>>;
  update(id: string, data: CodeClassificationFormData): Promise<ServiceResponse<CodeClassification>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
}

/**
 * 代码分类服务实现
 */
export class CodeClassificationService implements ICodeClassificationService {

  /**
   * 获取所有代码分类
   */
  async getAll(): Promise<ServiceResponse<CodeClassification[]>> {
    try {
      console.log('📡 [CodeClassificationService] 获取所有代码分类...');
      
      const response = await apiClient.get('/code-classifications');

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '获取代码分类失败'
        };
      }

      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : 
                   responseData?.items || responseData?.Items || [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToCodeClassification(item))
      };
      
    } catch (error) {
      console.error('❌ [CodeClassificationService] getAll error:', error);
      return {
        success: false,
        error: '获取代码分类失败'
      };
    }
  }

  /**
   * 根据机型类型获取代码分类
   */
  async getByModelType(modelType: string): Promise<ServiceResponse<CodeClassification[]>> {
    try {
      console.log('📡 [CodeClassificationService] 根据机型类型获取代码分类:', modelType);
      
      const response = await apiClient.get(`/code-classifications/by-model/${modelType}`);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '获取代码分类失败'
        };
      }

      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : 
                   responseData?.items || responseData?.Items || [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToCodeClassification(item, modelType))
      };
      
    } catch (error) {
      console.error('❌ [CodeClassificationService] getByModelType error:', error);
      return {
        success: false,
        error: '获取代码分类失败'
      };
    }
  }

  /**
   * 根据ID获取代码分类
   */
  async getById(id: string): Promise<ServiceResponse<CodeClassification>> {
    try {
      const response = await apiClient.get(`/code-classifications/${id}`);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '获取代码分类失败'
        };
      }

      const item = response.data as any;
      return {
        success: true,
        data: this.mapToCodeClassification(item)
      };
      
    } catch (error) {
      return {
        success: false,
        error: '获取代码分类失败'
      };
    }
  }

  /**
   * 创建代码分类
   */
  async create(data: CodeClassificationFormData): Promise<ServiceResponse<CodeClassification>> {
    try {
      const response = await apiClient.post('/code-classifications', data);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '创建代码分类失败'
        };
      }

      const item = response.data as any;
      return {
        success: true,
        data: this.mapToCodeClassification(item)
      };
      
    } catch (error) {
      return {
        success: false,
        error: '创建代码分类失败'
      };
    }
  }

  /**
   * 更新代码分类
   */
  async update(id: string, data: CodeClassificationFormData): Promise<ServiceResponse<CodeClassification>> {
    try {
      // 只传递后端需要的字段
      const updateData = {
        code: data.code,
        name: data.name
      };
      const response = await apiClient.put(`/code-classifications/${id}`, updateData);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '更新代码分类失败'
        };
      }

      const item = response.data as any;
      return {
        success: true,
        data: this.mapToCodeClassification(item)
      };
      
    } catch (error) {
      return {
        success: false,
        error: '更新代码分类失败'
      };
    }
  }

  /**
   * 删除代码分类
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const response = await apiClient.delete(`/code-classifications/${id}`);

      return {
        success: response.success,
        data: response.success,
        error: response.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: '删除代码分类失败'
      };
    }
  }

  /**
   * 数据映射方法
   */
  private mapToCodeClassification(item: any, modelType?: string): CodeClassification {
    return {
      id: String(item.id || item.Id || ''),
      code: item.code || item.Code || '',
      name: item.name || item.Name || '',
      displayName: `${item.code || item.Code || ''}-${item.name || item.Name || ''}`,
      description: item.description || item.Description || '',
      modelClassificationId: String(item.modelClassificationId || item.ModelClassificationId || ''),
      modelClassificationType: modelType || item.modelClassificationType || item.ModelClassificationType || '',
      sortOrder: item.sortOrder || item.SortOrder || 0,
      isActive: item.isActive !== undefined ? item.isActive : (item.IsActive !== undefined ? item.IsActive : true),
      createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.UpdatedAt || new Date().toISOString(),
      stats: {
        codeUsageCount: item.codeUsageCount || item.CodeUsageCount || 0,
        availableCodeCount: item.availableCodeCount || item.AvailableCodeCount || 0,
        lastUsedDate: item.lastUsedDate || item.LastUsedDate || undefined
      }
    };
  }
}
