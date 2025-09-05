// product-type.service.ts - 产品类型业务服务 (简化版)
/**
 * 产品类型业务服务
 * 直接使用API数据，移除DTO和Mapper层
 */

import { apiClient } from '../api/client';
import type { ServiceResponse, PageQuery, PagedResponse, ProductType, ProductTypeFormData } from '../../types/domain';

/**
 * 产品类型服务接口
 */
export interface IProductTypeService {
  getAll(): Promise<ServiceResponse<ProductType[]>>;
  getById(id: string): Promise<ServiceResponse<ProductType>>;
  create(data: ProductTypeFormData): Promise<ServiceResponse<ProductType>>;
  update(id: string, data: ProductTypeFormData): Promise<ServiceResponse<ProductType>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
}

/**
 * 产品类型服务实现
 */
export class ProductTypeService implements IProductTypeService {

  /**
   * 获取所有产品类型
   */
  async getAll(): Promise<ServiceResponse<ProductType[]>> {
    try {
      console.log('📡 [ProductTypeService] 获取所有产品类型...');
      
      const response = await apiClient.get('/product-types');

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '获取产品类型失败'
        };
      }

      // 处理后端返回的数据格式
      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : 
                   responseData?.items || responseData?.Items || [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          code: item.code || item.Code || '',
          createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
          displayName: item.code || item.Code || '',
          isNew: false,
          // 可选的关联数据
          modelClassifications: item.modelClassifications || [],
          modelClassificationCount: item.modelClassificationCount || 0
        }))
      };
      
    } catch (error) {
      console.error('❌ [ProductTypeService] getAll error:', error);
      return {
        success: false,
        error: '获取产品类型失败'
      };
    }
  }

  /**
   * 根据ID获取产品类型
   */
  async getById(id: string): Promise<ServiceResponse<ProductType>> {
    try {
      console.log('📡 [ProductTypeService] 获取产品类型:', id);
      
      const response = await apiClient.get(`/product-types/${id}`);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '获取产品类型失败'
        };
      }

      const item = response.data as any;
      return {
        success: true,
        data: {
          id: String(item.id || item.Id || ''),
          code: item.code || item.Code || '',
          createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
          displayName: item.code || item.Code || '',
          isNew: false,
          modelClassifications: item.modelClassifications || [],
          modelClassificationCount: item.modelClassificationCount || 0
        }
      };
      
    } catch (error) {
      console.error('❌ [ProductTypeService] getById error:', error);
      return {
        success: false,
        error: '获取产品类型失败'
      };
    }
  }

  /**
   * 创建产品类型
   */
  async create(data: ProductTypeFormData): Promise<ServiceResponse<ProductType>> {
    try {
      console.log('📡 [ProductTypeService] 创建产品类型:', data);
      
      const response = await apiClient.post('/product-types', data);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '创建产品类型失败'
        };
      }

      const item = response.data as any;
      return {
        success: true,
        data: {
          id: String(item.id || item.Id || ''),
          code: item.code || item.Code || '',
          createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
          displayName: item.code || item.Code || '',
          isNew: false,
          modelClassifications: item.modelClassifications || [],
          modelClassificationCount: item.modelClassificationCount || 0
        }
      };
      
    } catch (error) {
      console.error('❌ [ProductTypeService] create error:', error);
      return {
        success: false,
        error: '创建产品类型失败'
      };
    }
  }

  /**
   * 更新产品类型
   */
  async update(id: string, data: ProductTypeFormData): Promise<ServiceResponse<ProductType>> {
    try {
      console.log('📡 [ProductTypeService] 更新产品类型:', id, data);
      
      const response = await apiClient.put(`/product-types/${id}`, data);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || '更新产品类型失败'
        };
      }

      const item = response.data as any;
      return {
        success: true,
        data: {
          id: String(item.id || item.Id || ''),
          code: item.code || item.Code || '',
          createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
          displayName: item.code || item.Code || '',
          isNew: false,
          modelClassifications: item.modelClassifications || [],
          modelClassificationCount: item.modelClassificationCount || 0
        }
      };
      
    } catch (error) {
      console.error('❌ [ProductTypeService] update error:', error);
      return {
        success: false,
        error: '更新产品类型失败'
      };
    }
  }

  /**
   * 删除产品类型
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      console.log('📡 [ProductTypeService] 删除产品类型:', id);
      
      const response = await apiClient.delete(`/product-types/${id}`);

      return {
        success: response.success,
        data: response.success,
        error: response.error
      };
      
    } catch (error) {
      console.error('❌ [ProductTypeService] delete error:', error);
      return {
        success: false,
        error: '删除产品类型失败'
      };
    }
  }
}