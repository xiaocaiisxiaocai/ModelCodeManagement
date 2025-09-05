// war-room.service.ts - 战情中心服务 (简化版)
/**
 * 战情中心数据服务
 * 直接使用API数据，移除DTO和Mapper层
 */

import { apiClient } from '../api/client';
import type { WarRoomData, ServiceResponse, YearlyNewModelsData, ModelNewCodeData, ModelCodeRemainingData, YearRangeData } from '../../types/domain';

/**
 * 战情中心服务接口
 */
export interface IWarRoomService {
  getWarRoomData(query?: {
    startDate?: Date | null;
    endDate?: Date | null;
    modelType?: string | null;
  }): Promise<ServiceResponse<WarRoomData>>;
  getYearlyNewModels(startYear?: number, endYear?: number): Promise<ServiceResponse<YearlyNewModelsData[]>>;
  getPlanningUsage(startDate?: Date, endDate?: Date): Promise<ServiceResponse<any[]>>;
  getDynamicNewCodeData(): Promise<ServiceResponse<ModelNewCodeData[]>>;
  getDynamicModelCodeRemaining(): Promise<ServiceResponse<ModelCodeRemainingData[]>>;
  getAvailableYearRange(): Promise<ServiceResponse<YearRangeData>>;
}

/**
 * 战情中心服务实现
 */
export class WarRoomService implements IWarRoomService {

  /**
   * 获取战情中心完整数据（重载方法支持参数）
   */
  async getWarRoomData(query?: {
    startDate?: Date | null;
    endDate?: Date | null;
    modelType?: string | null;
  }): Promise<ServiceResponse<WarRoomData>> {
    try {
      const requestBody = {
        startDate: query?.startDate || null,
        endDate: query?.endDate || null,
        modelType: query?.modelType || null,
        timePeriod: 'all_time'
      };

      console.log('📡 [WarRoomService] 发送战情中心数据请求:', requestBody);

      const response = await apiClient.post('/war-room/data', requestBody);
      
      if (!response.success || !response.data) {
        console.error('❌ [WarRoomService] API响应错误:', response);
        return { success: false, error: response.error || '获取战情中心数据失败' };
      }

      const data = response.data as any;
      console.log('📊 [WarRoomService] 获取到原始数据:', data);
      
      return {
        success: true,
        data: {
          yearlyNewModels: (data.YearlyNewModels || data.yearlyNewModels || []).map((item: any) => ({
            year: item.Year || item.year || '',
            count: item.Count || item.count || item.NewModelCount || 0,
            modelTypes: item.ModelTypes || item.modelTypes || []
          })),
          planningUsage: data.PlanningUsage || data.planningUsage || [],
          modelCodeRemaining: data.ModelCodeRemaining || data.modelCodeRemaining || [],
          modelNewCode: data.NewCodeData || data.modelNewCode || {},
          totalModels: data.totalModels || 0,
          totalNewModels: data.totalNewModels || 0,
          totalPlanningUsage: data.totalPlanningUsage || 0
        }
      };
      
    } catch (error) {
      console.error('❌ [WarRoomService] getWarRoomData error:', error);
      return { success: false, error: '获取战情中心数据失败' };
    }
  }

  /**
   * 获取年度新增机型数据
   */
  async getYearlyNewModels(startYear: number, endYear: number): Promise<ServiceResponse<YearlyNewModelsData[]>> {
    try {
      const params = new URLSearchParams();
      params.append('startYear', startYear.toString());
      params.append('endYear', endYear.toString());

      const response = await apiClient.get(`/war-room/yearly-new-models?${params.toString()}`);
      
      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取年度新增机型数据失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          year: item.year || item.Year,
          count: item.count || item.newModelCount || item.NewModelCount || 0,
          modelTypes: item.modelTypes || item.ModelTypes || [],
          modelTypeStats: item.modelTypeStats || item.ModelTypeStats || {}
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取年度新增机型数据失败' };
    }
  }

  /**
   * 获取规划占用数据
   */
  async getPlanningUsage(startDate?: Date, endDate?: Date): Promise<ServiceResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }

      const url = params.toString() ? `/war-room/planning-usage?${params.toString()}` : '/war-room/planning-usage';
      const response = await apiClient.get(url);
      
      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取规划占用数据失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          modelType: item.ModelType || item.modelType || '',
          planning: item.Planning || item.planning || 0,
          workOrder: item.WorkOrder || item.workOrder || 0,
          pause: item.Pause || item.pause || 0
        }))
      };
      
    } catch (error) {
      console.error('❌ [WarRoomService] getPlanningUsage error:', error);
      return { success: false, error: '获取规划占用数据失败' };
    }
  }

  /**
   * 获取动态新代码数据
   */
  async getDynamicNewCodeData(): Promise<ServiceResponse<ModelNewCodeData[]>> {
    try {
      const response = await apiClient.get('/war-room/dynamic-new-code-data');
      
      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取动态新代码数据失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          productType: item.ProductType || item.productType || '',
          modelType: item.ModelType || item.modelType || '',
          newCodesThisMonth: item.NewCodesThisMonth || item.newCodesThisMonth || 0,
          newCodesThisYear: item.NewCodesThisYear || item.newCodesThisYear || 0
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取动态新代码数据失败' };
    }
  }

  /**
   * 获取动态机型代码余量数据
   */
  async getDynamicModelCodeRemaining(): Promise<ServiceResponse<ModelCodeRemainingData[]>> {
    try {
      const response = await apiClient.get('/war-room/model-code-remaining');
      
      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取动态机型代码余量数据失败' };
      }

      const items = Array.isArray(response.data) ? response.data : [];

      return {
        success: true,
        data: items.map((item: any) => ({
          productType: item.ProductType || item.productType || '',
          modelType: item.ModelType || item.modelType || '',
          totalCodes: item.Total || item.total || item.totalCodes || 0,
          usedCodes: item.Used || item.used || item.usedCodes || 0,
          remainingCodes: item.Remaining || item.remaining || item.remainingCodes || 0,
          usagePercentage: item.UsageRate || item.usageRate || item.usagePercentage || 0
        }))
      };
      
    } catch (error) {
      return { success: false, error: '获取动态机型代码余量数据失败' };
    }
  }

  /**
   * 获取机型首次出现的年份范围
   */
  async getAvailableYearRange(): Promise<ServiceResponse<YearRangeData>> {
    try {
      const response = await apiClient.get('/war-room/available-year-range');
      
      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取年份范围失败' };
      }

      const data = response.data as any;
      
      return {
        success: true,
        data: {
          minYear: data.MinYear || data.minYear || new Date().getFullYear(),
          maxYear: data.MaxYear || data.maxYear || new Date().getFullYear(),
          availableYears: data.AvailableYears || data.availableYears || [new Date().getFullYear()]
        }
      };
      
    } catch (error) {
      return { success: false, error: '获取年份范围失败' };
    }
  }
}

// 创建默认实例
export const warRoomService = new WarRoomService();