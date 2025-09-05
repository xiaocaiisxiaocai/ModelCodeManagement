// code-usage.service.ts - 编码使用业务服务 (简化版)
/**
 * 编码使用业务服务
 * 直接使用API数据，移除DTO和Mapper层
 */

import { apiClient } from '../api/client';
import type { ServiceResponse, PageQuery, PagedResponse, CodeUsageEntry, CodeUsageEntryFormData } from '../../types/domain';

/**
 * 编码使用服务接口
 */
export interface ICodeUsageService {
  getAll(query?: PageQuery): Promise<ServiceResponse<CodeUsageEntry[]>>;
  getByModel(modelType: string, includeDeleted?: boolean): Promise<ServiceResponse<CodeUsageEntry[]>>;
  getByModelAndCode(modelType: string, codeNumber: string, includeDeleted?: boolean): Promise<ServiceResponse<CodeUsageEntry[]>>;
  getById(id: string): Promise<ServiceResponse<CodeUsageEntry>>;
  create(data: CodeUsageEntry): Promise<ServiceResponse<CodeUsageEntry>>;
  update(id: string, data: CodeUsageEntry): Promise<ServiceResponse<CodeUsageEntry>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
  restore(id: string): Promise<ServiceResponse<boolean>>;
}

/**
 * 编码使用服务实现
 */
export class CodeUsageService implements ICodeUsageService {

  /**
   * 获取所有编码使用记录
   */
  async getAll(query?: PageQuery): Promise<ServiceResponse<CodeUsageEntry[]>> {
    try {
      const params = query ? {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search
      } : {};

      let url = '/code-usage';
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        url += `?${searchParams.toString()}`;
      }

      const response = await apiClient.get(url);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取编码使用记录失败' };
      }

      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : 
                   responseData?.items || responseData?.Items || [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToCodeUsageEntry(item))
      };
      
    } catch (error) {
      return { success: false, error: '获取编码使用记录失败' };
    }
  }

  /**
   * 根据机型获取编码使用记录（2层结构专用）
   */
  async getByModel(modelType: string, includeDeleted: boolean = false): Promise<ServiceResponse<CodeUsageEntry[]>> {
    try {
      const params = new URLSearchParams({
        modelType,
        includeDeleted: includeDeleted.toString()
      });

      const response = await apiClient.get(`/code-usage/by-model?${params.toString()}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取编码使用记录失败' };
      }

      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : 
                   responseData?.items || responseData?.Items || 
                   responseData?.data || responseData?.Data || [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToCodeUsageEntry(item))
      };
      
    } catch (error) {
      return { success: false, error: '获取编码使用记录失败' };
    }
  }

  /**
   * 根据机型和代码编号获取编码使用记录
   */
  async getByModelAndCode(modelType: string, codeNumber: string, includeDeleted: boolean = false): Promise<ServiceResponse<CodeUsageEntry[]>> {
    try {
      const params = new URLSearchParams({
        modelType,
        codeNumber,
        includeDeleted: includeDeleted.toString()
      });

      const response = await apiClient.get(`/code-usage/by-model-code?${params.toString()}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取编码使用记录失败' };
      }

      const responseData = response.data as any;
      const items = Array.isArray(responseData) ? responseData : 
                   responseData?.items || responseData?.Items || 
                   responseData?.data || responseData?.Data || [];

      return {
        success: true,
        data: items.map((item: any) => this.mapToCodeUsageEntry(item))
      };
      
    } catch (error) {
      return { success: false, error: '获取编码使用记录失败' };
    }
  }

  /**
   * 根据ID获取编码使用记录
   */
  async getById(id: string): Promise<ServiceResponse<CodeUsageEntry>> {
    try {
      const response = await apiClient.get(`/code-usage/${id}`);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '获取编码使用记录失败' };
      }

      return {
        success: true,
        data: this.mapToCodeUsageEntry(response.data)
      };
      
    } catch (error) {
      return { success: false, error: '获取编码使用记录失败' };
    }
  }

  /**
   * 创建编码使用记录
   */
  async create(data: CodeUsageEntry): Promise<ServiceResponse<CodeUsageEntry>> {
    try {
      console.log('🔍 [CodeUsageService.create] 开始创建记录，输入数据:', data);
      
      // 判断是2层还是3层结构
      const isDirectAccess = !data.codeClassificationNumber;
      console.log('🔍 [CodeUsageService.create] 是否为2层结构:', isDirectAccess);
      
      // 标准化占用类型值
      const standardizedOccupancyType = this.standardizeOccupancyType(data.occupancyType);
      console.log('🔍 [CodeUsageService.create] 标准化后的占用类型:', standardizedOccupancyType);
      
      // 准备发送给后端的数据，只包含后端需要的字段
      const payload: any = {
        extension: data.extension || '',
        productName: data.productName || '',
        description: data.description || '',
        occupancyType: standardizedOccupancyType,
        customerId: data.customerId || null,
        factoryId: data.factoryId || null,
        builder: data.builder || '',
        requester: data.requester || ''
      };
      
      console.log('🔍 [CodeUsageService.create] 初始载荷:', payload);
      
      if (isDirectAccess) {
        // 2层结构：使用create-manual端点
        console.log('🔍 [CodeUsageService.create] 使用2层结构，调用create-manual端点');
        
        // 先通过modelType获取modelClassificationId
        // 如果modelType是SLU-1格式，需要提取出SLU部分（机型类型）
        const actualModelType = data.modelType.includes('-') 
          ? data.modelType.split('-')[0] 
          : data.modelType;
        console.log('🔍 [CodeUsageService.create] 原始modelType:', data.modelType, '提取后的机型类型:', actualModelType);
        const modelClassificationResponse = await this.getModelClassificationIdByType(actualModelType);
        console.log('🔍 [CodeUsageService.create] 获取机型分类ID结果:', modelClassificationResponse);
        
        if (!modelClassificationResponse.success) {
          console.error('❌ [CodeUsageService.create] 获取机型分类ID失败:', modelClassificationResponse.error);
          return { success: false, error: modelClassificationResponse.error || '无法获取机型分类ID' };
        }
        
        payload.modelClassificationId = modelClassificationResponse.data;
        payload.numberPart = data.actualNumber || '001'; // 确保numberPart不为空
        
        console.log('🔍 [CodeUsageService.create] 最终载荷:', payload);
        console.log('🔍 [CodeUsageService.create] 调用API: /code-usage/create-manual');
        
        const response = await apiClient.post('/code-usage/create-manual', payload);
        console.log('🔍 [CodeUsageService.create] API响应:', response);
        
        if (!response.success || !response.data) {
          console.error('❌ [CodeUsageService.create] 创建失败:', response.error);
          return { success: false, error: response.error || '创建编码使用记录失败' };
        }
        
        console.log('✅ [CodeUsageService.create] 创建成功，返回数据:', response.data);
        
        return {
          success: true,
          data: this.mapToCodeUsageEntry(response.data)
        };
      } else {
        // 3层结构：使用普通create端点
        console.log('🔍 [CodeUsageService.create] 使用3层结构，调用普通create端点');
        
        payload.modelType = data.modelType;
        payload.codeClassificationNumber = data.codeClassificationNumber;
        payload.actualNumber = data.actualNumber;
        
        console.log('🔍 [CodeUsageService.create] 3层结构载荷:', payload);
        console.log('🔍 [CodeUsageService.create] 调用API: /code-usage');
        
        const response = await apiClient.post('/code-usage', payload);
        console.log('🔍 [CodeUsageService.create] 3层结构API响应:', response);
        
        if (!response.success || !response.data) {
          console.error('❌ [CodeUsageService.create] 3层结构创建失败:', response.error);
          return { success: false, error: response.error || '创建编码使用记录失败' };
        }
        
        console.log('✅ [CodeUsageService.create] 3层结构创建成功，返回数据:', response.data);
        
        return {
          success: true,
          data: this.mapToCodeUsageEntry(response.data)
        };
      }
      
    } catch (error) {
      console.error('💥 [CodeUsageService.create] 创建过程中发生异常:', error);
      return { success: false, error: '创建编码使用记录失败' };
    }
  }

  /**
   * 更新编码使用记录
   */
  async update(id: string, data: CodeUsageEntry): Promise<ServiceResponse<CodeUsageEntry>> {
    try {
      // 标准化占用类型值
      const standardizedOccupancyType = this.standardizeOccupancyType(data.occupancyType);
      
      // 准备更新数据，只包含后端允许更新的字段
      const payload = {
        extension: data.extension || '',
        productName: data.productName || '',
        description: data.description || '',
        occupancyType: standardizedOccupancyType,
        customerId: data.customerId || null,
        factoryId: data.factoryId || null,
        builder: data.builder || '',
        requester: data.requester || ''
      };
      
      const response = await apiClient.put(`/code-usage/${id}`, payload);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || '更新编码使用记录失败' };
      }

      return {
        success: true,
        data: this.mapToCodeUsageEntry(response.data)
      };
      
    } catch (error) {
      return { success: false, error: '更新编码使用记录失败' };
    }
  }

  /**
   * 软删除编码使用记录
   */
  async delete(id: string, reason: string = '用户删除'): Promise<ServiceResponse<boolean>> {
    try {
      const response = await apiClient.delete(`/code-usage/${id}?reason=${encodeURIComponent(reason)}`);
      
      return {
        success: response.success,
        data: response.success,
        error: response.error
      };
      
    } catch (error) {
      return { success: false, error: '删除编码使用记录失败' };
    }
  }

  /**
   * 恢复编码使用记录
   */
  async restore(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const response = await apiClient.post(`/code-usage/${id}/restore`);

      return {
        success: response.success,
        data: response.success,
        error: response.error
      };
      
    } catch (error) {
      return { success: false, error: '恢复编码使用记录失败' };
    }
  }

  /**
   * 将API数据映射为Domain类型
   */
  private mapToCodeUsageEntry(item: any): CodeUsageEntry {
    const model = item.model || item.Model || '';
    const modelType = item.modelType || item.ModelType || '';
    
    // 解析编码组成部分
    const modelParts = this.parseModel(model);
    
    return {
      id: String(item.id || item.Id || ''),
      model,
      modelParts,
      modelType,
      modelTypeDisplay: modelType.replace('-', ''),
      codeClassificationNumber: item.codeClassificationNumber || item.CodeClassificationNumber,
      actualNumber: item.actualNumber || item.ActualNumber || '',
      extension: item.extension || item.Extension,
      
      // 业务字段
      productName: item.productName || item.ProductName,
      description: item.description || item.Description,
      occupancyType: item.occupancyType || item.OccupancyType,
      occupancyTypeDisplay: item.occupancyTypeDisplay || item.OccupancyTypeDisplay || item.occupancyType || item.OccupancyType || '',
      customerId: item.customerId || item.CustomerId,
      customer: item.customer || item.Customer,
      factoryId: item.factoryId || item.FactoryId,
      factory: item.factory || item.Factory,
      builder: item.builder || item.Builder,
      requester: item.requester || item.Requester,
      creationDate: item.creationDate || item.CreationDate,
      createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
      
      // 状态字段
      isAllocated: item.isAllocated ?? item.IsAllocated ?? false,
      allocationStatus: this.mapAllocationStatus(item),
      allocationStatusDisplay: this.mapAllocationStatusDisplay(item),
      isDeleted: item.isDeleted ?? item.IsDeleted ?? false,
      deletedReason: item.deletedReason || item.DeletedReason,
      
      // 关联数据
      modelClassificationId: String(item.modelClassificationId || item.ModelClassificationId || ''),
      codeClassificationId: item.codeClassificationId ? String(item.codeClassificationId) : undefined,
      modelClassification: item.modelClassification,
      codeClassification: item.codeClassification,
      
      // 显示辅助
      displayInfo: {
        fullPath: this.buildFullPath(item),
        shortPath: model,
        statusBadge: {
          text: this.mapAllocationStatusDisplay(item),
          variant: this.mapStatusVariant(item)
        },
        createdTime: {
          formatted: this.formatDate(item.createdAt || item.CreatedAt),
          relative: this.getRelativeTime(item.createdAt || item.CreatedAt)
        }
      }
    };
  }

  /**
   * 解析编码组成部分
   */
  private parseModel(model: string): { prefix: string; number: string; suffix?: string } {
    const match = model.match(/^([A-Z]+-?)(\d+)([A-Z]*)$/);
    if (match) {
      return {
        prefix: match[1],
        number: match[2],
        suffix: match[3] || undefined
      };
    }
    return { prefix: '', number: model };
  }

  /**
   * 映射分配状态
   */
  private mapAllocationStatus(item: any): 'planned' | 'allocated' | 'suspended' {
    if (item.isDeleted) return 'suspended';
    if (item.isAllocated) return 'allocated';
    return 'planned';
  }

  /**
   * 映射分配状态显示文本
   */
  private mapAllocationStatusDisplay(item: any): string {
    if (item.isDeleted) return '暂停';
    if (item.isAllocated) return '已分配';
    return '预分配';
  }

  /**
   * 映射状态变体
   */
  private mapStatusVariant(item: any): 'success' | 'warning' | 'danger' | 'info' {
    if (item.isDeleted) return 'danger';
    if (item.isAllocated) return 'success';
    return 'info';
  }

  /**
   * 构建完整路径
   */
  private buildFullPath(item: any): string {
    const parts = [];
    if (item.productType) parts.push(item.productType);
    if (item.modelType) parts.push(item.modelType);
    if (item.codeClassification) parts.push(item.codeClassification.name);
    if (item.model) parts.push(item.model);
    return parts.join(' > ');
  }

  /**
   * 格式化日期
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  }

  /**
   * 获取相对时间
   */
  private getRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '今天';
      if (diffDays === 1) return '昨天';
      if (diffDays < 7) return `${diffDays}天前`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
      return `${Math.floor(diffDays / 30)}个月前`;
    } catch {
      return '';
    }
  }

  /**
   * 根据机型类型获取机型分类ID
   */
  private async getModelClassificationIdByType(modelType: string): Promise<ServiceResponse<number>> {
    try {
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] 开始获取机型分类ID，机型类型:', modelType);
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] 调用API: /model-classifications');
      
      // 通过机型分类服务获取所有机型分类，然后找到匹配的ID
      const response = await apiClient.get('/model-classifications');
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] API响应:', response);
      
      if (!response.success || !response.data) {
        console.error('❌ [CodeUsageService.getModelClassificationIdByType] 获取机型分类失败:', response.error);
        return { success: false, error: '获取机型分类失败' };
      }

      const responseData = response.data as any;
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] 原始响应数据:', responseData);
      
      const modelClassifications = Array.isArray(responseData) ? responseData : responseData?.items || responseData?.Items || [];
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] 解析后的机型分类列表:', modelClassifications);
      
      const targetClassification = modelClassifications.find((mc: any) => 
        (mc.type || mc.Type) === modelType
      );
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] 找到的目标分类:', targetClassification);
      
      if (!targetClassification) {
        console.error('❌ [CodeUsageService.getModelClassificationIdByType] 未找到机型分类:', modelType);
        return { success: false, error: `未找到机型分类: ${modelType}` };
      }

      const id = targetClassification.id || targetClassification.Id;
      console.log('🔍 [CodeUsageService.getModelClassificationIdByType] 提取的ID:', id);
      
      const result = { 
        success: true, 
        data: parseInt(String(id)) 
      };
      console.log('✅ [CodeUsageService.getModelClassificationIdByType] 返回结果:', result);
      
      return result;
      
    } catch (error) {
      console.error('💥 [CodeUsageService.getModelClassificationIdByType] 获取机型分类ID过程中发生异常:', error);
      return { success: false, error: '获取机型分类ID失败' };
    }
  }

  /**
   * 标准化占用类型值，确保符合后端验证要求
   */
  private standardizeOccupancyType(occupancyType?: string): string {
    console.log('🔍 [CodeUsageService.standardizeOccupancyType] 输入占用类型:', occupancyType);
    
    if (!occupancyType) {
      console.log('🔍 [CodeUsageService.standardizeOccupancyType] 无输入，返回默认值: 规划');
      return '规划'; // 默认值
    }
    
    // 标准化映射
    const typeMap: Record<string, string> = {
      '规划': '规划',
      '工令': '工令', 
      '暂停': '暂停',
      'planning': '规划',
      'work_order': '工令',
      'pause': '暂停',
      'suspended': '暂停'
    };
    
    const normalized = typeMap[occupancyType.toLowerCase()] || typeMap[occupancyType];
    const result = normalized || '规划'; // 如果没有匹配到，返回默认值
    
    console.log('🔍 [CodeUsageService.standardizeOccupancyType] 标准化结果:', result);
    return result;
  }
}