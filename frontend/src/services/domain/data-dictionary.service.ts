// data-dictionary.service.ts - 数据字典业务服务 (简化版)
/**
 * 数据字典业务服务
 * 直接使用API数据，移除DTO和Mapper层
 */

import { apiClient } from '../api/client';
import type { ServiceResponse, PageQuery, PagedResponse } from '../../types/domain';

// 简化的数据字典接口
interface DataDictionary {
  id: string;
  category: string;
  code: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  code: string;
}

interface Factory {
  id: string;
  name: string;
  customerId: string;
}

/**
 * 数据字典服务接口
 */
export interface IDataDictionaryService {
  getAll(): Promise<ServiceResponse<DataDictionary[]>>;
  getByCategory(category: string): Promise<ServiceResponse<DataDictionary[]>>;
  getCustomers(): Promise<ServiceResponse<DataDictionary[]>>;
  getFactories(): Promise<ServiceResponse<DataDictionary[]>>;
  getFactoriesByCustomer(customerId: string): Promise<ServiceResponse<DataDictionary[]>>;
  getProductNames(): Promise<ServiceResponse<any[]>>;
  getOccupancyTypes(): Promise<ServiceResponse<any[]>>;
}

/**
 * 数据字典服务实现
 */
export class DataDictionaryService implements IDataDictionaryService {

  /**
   * 获取所有数据字典
   */
  async getAll(): Promise<ServiceResponse<DataDictionary[]>> {
    try {
      const response = await apiClient.get('/data-dictionary');

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取数据字典失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          category: item.category || item.Category || '',
          code: item.code || item.Code || '',
          name: item.name || item.Name || '',
          parentId: item.parentId ? String(item.parentId) : undefined,
          createdAt: item.createdAt || item.CreatedAt || new Date().toISOString()
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取数据字典失败' };
    }
  }

  /**
   * 根据分类获取数据字典
   */
  async getByCategory(category: string): Promise<ServiceResponse<DataDictionary[]>> {
    try {
      const response = await apiClient.get(`/data-dictionary/category/${category}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取数据字典失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          category: item.category || item.Category || '',
          code: item.code || item.Code || '',
          name: item.name || item.Name || '',
          parentId: item.parentId ? String(item.parentId) : undefined,
          createdAt: item.createdAt || item.CreatedAt || new Date().toISOString()
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取数据字典失败' };
    }
  }

  /**
   * 获取客户列表
   */
  async getCustomers(): Promise<ServiceResponse<DataDictionary[]>> {
    try {
      const response = await apiClient.get('/data-dictionary/customers');

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取客户列表失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          category: item.category || item.Category || 'Customer',
          code: item.code || item.Code || '',
          name: item.name || item.Name || '',
          parentId: item.parentId ? String(item.parentId) : undefined,
          categoryDisplay: '客户',
          hasParent: !!item.parentId,
          createdAt: item.createdAt || item.CreatedAt || '',
          updatedAt: item.updatedAt || item.UpdatedAt || '',
          displayInfo: {
            fullPath: item.name || item.Name || '',
            categoryColor: 'blue',
            categoryIcon: 'user'
          }
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取客户列表失败' };
    }
  }

  /**
   * 获取所有厂区列表
   */
  async getFactories(): Promise<ServiceResponse<DataDictionary[]>> {
    try {
      const response = await apiClient.get('/data-dictionary/factories');

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取厂区列表失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          category: item.category || item.Category || 'Factory',
          code: item.code || item.Code || '',
          name: item.name || item.Name || '',
          parentId: item.parentId ? String(item.parentId) : undefined,
          categoryDisplay: '厂区',
          hasParent: !!item.parentId,
          createdAt: item.createdAt || item.CreatedAt || '',
          updatedAt: item.updatedAt || item.UpdatedAt || '',
          displayInfo: {
            fullPath: item.name || item.Name || '',
            categoryColor: 'green',
            categoryIcon: 'building'
          }
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取厂区列表失败' };
    }
  }

  /**
   * 根据客户ID获取厂区列表
   */
  async getFactoriesByCustomer(customerId: string): Promise<ServiceResponse<DataDictionary[]>> {
    try {
      const response = await apiClient.get(`/data-dictionary/factories/customer/${customerId}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取厂区列表失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          category: item.category || item.Category || 'Factory',
          code: item.code || item.Code || '',
          name: item.name || item.Name || '',
          parentId: item.parentId ? String(item.parentId) : undefined,
          categoryDisplay: '厂区',
          hasParent: !!item.parentId,
          createdAt: item.createdAt || item.CreatedAt || '',
          updatedAt: item.updatedAt || item.UpdatedAt || '',
          displayInfo: {
            fullPath: item.name || item.Name || '',
            categoryColor: 'green',
            categoryIcon: 'building'
          }
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取厂区列表失败' };
    }
  }

  /**
   * 获取品名列表
   */
  async getProductNames(): Promise<ServiceResponse<any[]>> {
    try {
      const response = await apiClient.get('/data-dictionary/product-names');

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取品名列表失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          name: item.name || item.Name || '',
          code: item.code || item.Code || ''
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取品名列表失败' };
    }
  }

  /**
   * 获取占用类型列表
   */
  async getOccupancyTypes(): Promise<ServiceResponse<any[]>> {
    try {
      const response = await apiClient.get('/data-dictionary/occupancy-types');

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取占用类型列表失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          id: String(item.id || item.Id || ''),
          name: item.name || item.Name || '',
          code: item.code || item.Code || ''
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取占用类型列表失败' };
    }
  }
}