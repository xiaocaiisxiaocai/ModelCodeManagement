// model-classification.service.ts - 机型分类业务服务 (简化版)
/**
 * 机型分类业务服务
 * 直接使用API数据，移除DTO和Mapper层
 */

import { apiClient } from '../api/client';
import type { ServiceResponse, PageQuery, PagedResponse, ModelClassification, ModelClassificationFormData } from '../../types/domain';

/**
 * 机型分类服务接口
 */
export interface IModelClassificationService {
  getAll(): Promise<ServiceResponse<ModelClassification[]>>;
  getByProductType(productType: string): Promise<ServiceResponse<ModelClassification[]>>;
  getById(id: string): Promise<ServiceResponse<ModelClassification>>;
  create(data: ModelClassificationFormData): Promise<ServiceResponse<ModelClassification>>;
  update(id: string, data: ModelClassificationFormData): Promise<ServiceResponse<ModelClassification>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
}

/**
 * 机型分类服务实现
 */
export class ModelClassificationService implements IModelClassificationService {

  /**
   * 获取所有机型分类
   */
  async getAll(): Promise<ServiceResponse<ModelClassification[]>> {
    try {
      const response = await apiClient.get('/model-classifications');

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取机型分类失败' };
      }

      const items = Array.isArray(response.data) ? response.data : 
                   response.data.items || response.data.Items || [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToModelClassification(item))
      };
      
    } catch (error) {
      return { success: false, error: '获取机型分类失败' };
    }
  }

  /**
   * 根据产品类型获取机型分类
   */
  async getByProductType(productType: string): Promise<ServiceResponse<ModelClassification[]>> {
    try {
      const response = await apiClient.get(`/model-classifications/by-product/${productType}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取机型分类失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToModelClassification(item))
      };
      
    } catch (error) {
      return { success: false, error: '获取机型分类失败' };
    }
  }

  /**
   * 根据ID获取机型分类
   */
  async getById(id: string): Promise<ServiceResponse<ModelClassification>> {
    try {
      const response = await apiClient.get(`/model-classifications/${id}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取机型分类失败' };
      }

      return {
        success: true,
        data: this.mapToModelClassification(response.data)
      };
      
    } catch (error) {
      return { success: false, error: '获取机型分类失败' };
    }
  }

  /**
   * 创建机型分类
   */
  async create(data: ModelClassificationFormData): Promise<ServiceResponse<ModelClassification>> {
    try {
      const response = await apiClient.post('/model-classifications', data);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '创建机型分类失败' };
      }

      return {
        success: true,
        data: this.mapToModelClassification(response.data)
      };
      
    } catch (error) {
      return { success: false, error: '创建机型分类失败' };
    }
  }

  /**
   * 更新机型分类
   */
  async update(id: string, data: ModelClassificationFormData): Promise<ServiceResponse<ModelClassification>> {
    try {
      const response = await apiClient.put(`/model-classifications/${id}`, data);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '更新机型分类失败' };
      }

      return {
        success: true,
        data: this.mapToModelClassification(response.data)
      };
      
    } catch (error) {
      return { success: false, error: '更新机型分类失败' };
    }
  }

  /**
   * 删除机型分类
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const response = await apiClient.delete(`/model-classifications/${id}`);

      return {
        success: response.success,
        data: response.success,
        error: response.error
      };
      
    } catch (error) {
      return { success: false, error: '删除机型分类失败' };
    }
  }

  /**
   * 将API数据映射为Domain类型
   */
  private mapToModelClassification(item: any): ModelClassification {
    const type = item.type || item.Type || '';
    return {
      id: String(item.id || item.Id || ''),
      type: type.replace('-', ''), // 移除后缀
      typeWithSuffix: type.endsWith('-') ? type : `${type}-`,
      description: item.description || item.Description || [],
      descriptionText: Array.isArray(item.description) ? item.description.join(', ') : '',
      productTypeId: String(item.productTypeId || item.ProductTypeId || ''),
      productTypeCode: item.productTypeCode || item.ProductTypeCode || '',
      hasCodeClassification: item.hasCodeClassification ?? item.HasCodeClassification ?? true,
      structureType: (item.hasCodeClassification ?? item.HasCodeClassification ?? true) ? '3层' : '2层',
      createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.UpdatedAt || new Date().toISOString(),
      
      // 统计信息
      stats: {
        codeClassificationCount: (item.codeClassifications || []).length,
        codeUsageCount: item.codeUsageCount || 0,
        availableCodeCount: item.availableCodeCount || 0
      },
      
      // 可选的关联数据
      productType: item.productType,
      codeClassifications: item.codeClassifications || []
    };
  }
}