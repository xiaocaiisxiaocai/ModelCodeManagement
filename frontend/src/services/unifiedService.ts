// unifiedService.ts - 统一服务层
import { 
  DataManager,
  BaseDataService, 
  type DataResponse 
} from './dataManager';
import { httpClient } from './httpClient';
import { ErrorHandler } from '../utils/errorHandler';
import type { 
  ProductType,
  ModelClassification,
  CodeUsageEntry,
  WarRoomData,
  YearlyNewModelsData,
  PlanningUsageData,
  ModelCodeRemainingData,
  ModelNewCodeData,
  Customer,
  Factory,
  ProductNameDict,
  OccupancyTypeDict,
  ModelTypeDict
} from '../mock/interfaces';
import type { CodeClassificationDto as CodeClassification } from './apiService';

/**
 * 统一产品类型服务
 */
export class UnifiedProductTypeService extends BaseDataService<ProductType> {

  async getAllProductTypes(): Promise<DataResponse<ProductType[]>> {
    try {
      const response = await httpClient.get<any>('/v1/product-types');
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [ProductTypeService] response.data is not an array:', typeof rawData, rawData);
          
          // 可能的数据结构：{ Data: [...] } 或直接是数组
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [ProductTypeService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到产品类型数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const productTypes: ProductType[] = rawData.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          code: item.Code || item.code || ''
        }));
        
        
        return {
          success: true,
          data: productTypes,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [ProductTypeService] Error in getAllProductTypes:', error);
      ErrorHandler.handleAsyncError(error, 'ProductTypeService.getAllProductTypes');
      return { success: false, error: `获取产品类型失败: ${error}` };
    }
  }

  async getProductTypeById(id: string): Promise<DataResponse<ProductType>> {
    try {
      const response = await httpClient.get<any>(`/v1/product-types/${id}`);
      
      if (response.success && response.data) {
        // 🔧 转换后端数据格式为前端期望格式
        const productType: ProductType = {
          id: response.data.Id?.toString() || response.data.id?.toString() || '',
          code: response.data.Code || response.data.code || ''
        };
        
        return {
          success: true,
          data: productType,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ProductTypeService.getProductTypeById', { id });
      return { success: false, error: `获取产品类型失败: ${error}` };
    }
  }

  async addProductType(productType: Omit<ProductType, 'id'>): Promise<DataResponse<ProductType>> {
    try {
      const response = await httpClient.post<any>('/v1/product-types', productType);
      
      if (response.success && response.data) {
        // 🔧 转换后端数据格式为前端期望格式
        const createdProductType: ProductType = {
          id: response.data.Id?.toString() || response.data.id?.toString() || '',
          code: response.data.Code || response.data.code || ''
        };
        
        return {
          success: true,
          data: createdProductType,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ProductTypeService.addProductType', { productType });
      return { success: false, error: `添加产品类型失败: ${error}` };
    }
  }

  async updateProductType(id: string, updates: Partial<ProductType>): Promise<DataResponse<ProductType>> {
    try {
      const response = await httpClient.put<any>(`/v1/product-types/${id}`, updates);
      
      if (response.success && response.data) {
        // 🔧 转换后端数据格式为前端期望格式
        const updatedProductType: ProductType = {
          id: response.data.Id?.toString() || response.data.id?.toString() || '',
          code: response.data.Code || response.data.code || ''
        };
        
        return {
          success: true,
          data: updatedProductType,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ProductTypeService.updateProductType', { id, updates });
      return { success: false, error: `更新产品类型失败: ${error}` };
    }
  }

  async deleteProductType(id: string): Promise<DataResponse<boolean>> {
    try {
      const result = await httpClient.delete(`/v1/product-types/${id}`);
      return { success: result.success, data: result.success, message: result.message, error: result.error };
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ProductTypeService.deleteProductType', { id });
      return { success: false, error: `删除产品类型失败: ${error}` };
    }
  }
}

/**
 * 统一模型分类服务
 */
export class UnifiedModelClassificationService extends BaseDataService<ModelClassification> {

  async getAllModelClassifications(): Promise<DataResponse<ModelClassification[]>> {
    try {
      const response = await httpClient.get<any>('/v1/model-classifications');
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [ModelClassificationService] response.data is not an array:', typeof rawData, rawData);
          
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [ModelClassificationService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到机型分类数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const modelClassifications: ModelClassification[] = rawData.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString(),
          type: item.Type || item.type || '',
          description: Array.isArray(item.Description) ? item.Description : 
                      (item.description ? (Array.isArray(item.description) ? item.description : [item.description]) : []),
          productType: item.ProductType || item.productType || '',
          productTypeId: item.ProductTypeId || item.productTypeId,
          hasCodeClassification: item.HasCodeClassification !== undefined ? item.HasCodeClassification : 
                                (item.hasCodeClassification !== undefined ? item.hasCodeClassification : true)
        }));
        
        
        return {
          success: true,
          data: modelClassifications,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [ModelClassificationService] Error in getAllModelClassifications:', error);
      ErrorHandler.handleAsyncError(error, 'ModelClassificationService.getAllModelClassifications');
      return { success: false, error: `获取机型分类失败: ${error}` };
    }
  }

  async getModelClassificationsByProductType(productType: string): Promise<DataResponse<ModelClassification[]>> {
    try {
      const response = await httpClient.get<any>(`/v1/model-classifications/by-product/${productType}`);
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [ModelClassificationService] response.data is not an array:', typeof rawData, rawData);
          
          // 可能的数据结构：{ Data: [...] } 或直接是数组
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [ModelClassificationService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到机型分类数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const modelClassifications: ModelClassification[] = rawData.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString(),
          type: item.Type || item.type || '',
          description: Array.isArray(item.Description) ? item.Description : 
                      (item.description ? (Array.isArray(item.description) ? item.description : [item.description]) : []),
          productType: item.ProductType || item.productType || productType,
          productTypeId: item.ProductTypeId || item.productTypeId,
          hasCodeClassification: item.HasCodeClassification !== undefined ? item.HasCodeClassification : 
                                (item.hasCodeClassification !== undefined ? item.hasCodeClassification : true)
        }));
        
        
        return {
          success: true,
          data: modelClassifications,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [ModelClassificationService] Error in getModelClassificationsByProductType:', error);
      ErrorHandler.handleAsyncError(error, 'ModelClassificationService.getModelClassificationsByProductType', { productType });
      return { success: false, error: `获取机型分类失败: ${error}` };
    }
  }

  async addModelClassification(classification: ModelClassification): Promise<DataResponse<ModelClassification>> {
    try {
      // 需要获取产品类型ID
      let productTypeId = classification.productTypeId;
      
      if (!productTypeId && classification.productType) {
        // 根据产品类型代码获取ID
        const productTypesResponse = await httpClient.get<ProductType[]>('/v1/product-types');
        
        if (productTypesResponse.success && productTypesResponse.data) {
          const productType = productTypesResponse.data.find(pt => pt.code === classification.productType);
          
          if (productType) {
            productTypeId = parseInt(productType.id);
          }
        }
      }
      
      if (!productTypeId) {
        return { success: false, error: `无法找到产品类型ID: ${classification.productType}` };
      }
      
      // 转换为后端期望的格式
      const createDto = {
        Type: classification.type,
        Description: classification.description || [],
        ProductTypeId: productTypeId,
        HasCodeClassification: classification.hasCodeClassification ?? true
      };
      
      return await httpClient.post<ModelClassification>('/v1/model-classifications', createDto);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ModelClassificationService.addModelClassification', { classification });
      return { success: false, error: `添加机型分类失败: ${error}` };
    }
  }

  async updateModelClassification(id: string, updates: Partial<ModelClassification>): Promise<DataResponse<ModelClassification>> {
    try {
      return await httpClient.put<ModelClassification>(`/v1/model-classifications/${id}`, updates);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ModelClassificationService.updateModelClassification', { id, updates });
      return { success: false, error: `更新机型分类失败: ${error}` };
    }
  }

  async deleteModelClassification(id: string): Promise<DataResponse<boolean>> {
    try {
      const result = await httpClient.delete(`/v1/model-classifications/${id}`);
      return { success: result.success, data: result.success, message: result.message, error: result.error };
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ModelClassificationService.deleteModelClassification', { id });
      return { success: false, error: `删除机型分类失败: ${error}` };
    }
  }

  async getModelClassificationByType(productType: string, modelType: string): Promise<DataResponse<ModelClassification | null>> {
    try {
      const response = await httpClient.get<ModelClassification[]>(`/v1/model-classifications/by-product/${productType}`);
      
      if (response.success && response.data) {
        const modelClassification = response.data.find(mc => mc.type === modelType);
        return {
          success: true,
          data: modelClassification || null
        };
      }
      
      return { success: false, error: response.error || '获取机型分类失败' };
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'ModelClassificationService.getModelClassificationByType', { productType, modelType });
      return { success: false, error: `获取机型分类失败: ${error}` };
    }
  }
}

/**
 * 统一代码分类服务
 */
export class UnifiedCodeClassificationService extends BaseDataService<CodeClassification> {

  async getAllCodeClassifications(): Promise<DataResponse<CodeClassification[]>> {
    try {
      const response = await httpClient.get<any>('/v1/code-classifications');
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [CodeClassificationService] response.data is not an array:', typeof rawData, rawData);
          
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [CodeClassificationService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到代码分类数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const codeClassifications: CodeClassification[] = rawData.map((item: any) => ({
          code: item.Code || item.code || '',
          name: item.Name || item.name || '',
          modelType: item.ModelType || item.modelType || ''
        }));
        
        
        return {
          success: true,
          data: codeClassifications,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [CodeClassificationService] Error in getAllCodeClassifications:', error);
      ErrorHandler.handleAsyncError(error, 'CodeClassificationService.getAllCodeClassifications');
      return { success: false, error: `获取代码分类失败: ${error}` };
    }
  }

  async getCodeClassificationsByModelType(modelType: string): Promise<DataResponse<CodeClassification[]>> {
    try {
      const response = await httpClient.get<any>(`/v1/code-classifications/by-model/${modelType}`);
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [CodeClassificationService] response.data is not an array:', typeof rawData, rawData);
          
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [CodeClassificationService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到代码分类数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const codeClassifications: CodeClassification[] = rawData.map((item: any) => ({
          code: item.Code || item.code || '',
          name: item.Name || item.name || '',
          modelType: item.ModelType || item.modelType || modelType
        }));
        
        
        return {
          success: true,
          data: codeClassifications,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [CodeClassificationService] Error in getCodeClassificationsByModelType:', error);
      ErrorHandler.handleAsyncError(error, 'CodeClassificationService.getCodeClassificationsByModelType', { modelType });
      return { success: false, error: `获取代码分类失败: ${error}` };
    }
  }

  async addCodeClassification(classification: Pick<CodeClassification, 'code' | 'name'> & { modelType: string }, productType: string): Promise<DataResponse<CodeClassification>> {
    try {
      // 获取ModelClassification ID
      const modelClassResponse = await unifiedServices.modelClassification.getModelClassificationByType(productType, classification.modelType);
      
      if (!modelClassResponse.success || !modelClassResponse.data) {
        return { success: false, error: `找不到机型分类: ${classification.modelType}` };
      }

      // 使用新的分离字段结构：code存储数字，name存储名称
      const code = classification.code;
      const name = classification.name || '';
      
      if (!code || !name) {
        return { success: false, error: '代码和名称都不能为空' };
      }

      // 构造后端期望的DTO
      const createDto = {
        code: classification.code,
        name: name,
        modelClassificationId: parseInt(modelClassResponse.data.id || '0')
      };

      const response = await httpClient.post<any>('/v1/code-classifications', createDto);
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const createdCodeClassification: CodeClassification = {
          code: response.data.Code || response.data.code || '',
          name: response.data.Name || response.data.name || '',
          modelType: response.data.ModelType || response.data.modelType || classification.modelType
        };
        
        return {
          success: true,
          data: createdCodeClassification,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeClassificationService.addCodeClassification', { classification, productType });
      return { success: false, error: `添加代码分类失败: ${error}` };
    }
  }


  async updateCodeClassification(id: string, updates: Partial<CodeClassification>): Promise<DataResponse<CodeClassification>> {
    try {
      // 构造后端期望的UpdateCodeClassificationDto
      const updateDto = {
        code: updates.code || '',
        name: updates.name || ''
      };
      
      const response = await httpClient.put<any>(`/v1/code-classifications/${id}`, updateDto);
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const updatedCodeClassification: CodeClassification = {
          code: response.data.Code || response.data.code || '',
          name: response.data.Name || response.data.name || '',
          modelType: response.data.ModelType || response.data.modelType || updates.modelType || ''
        };
        
        return {
          success: true,
          data: updatedCodeClassification,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeClassificationService.updateCodeClassification', { id, updates });
      return { success: false, error: `更新代码分类失败: ${error}` };
    }
  }

  async deleteCodeClassification(id: string): Promise<DataResponse<boolean>> {
    try {
      const result = await httpClient.delete(`/v1/code-classifications/${id}`);
      return result;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeClassificationService.deleteCodeClassification', { id });
      return { success: false, error: `删除代码分类失败: ${error}` };
    }
  }
}

/**
 * 统一代码使用清单服务
 */
export class UnifiedCodeUsageService extends BaseDataService<CodeUsageEntry> {

  async getAllCodeUsages(includeDeleted: boolean = false): Promise<DataResponse<CodeUsageEntry[]>> {
    try {
      const params = includeDeleted ? { includeDeleted: 'true' } : {};
      const response = await httpClient.get<any>('/v1/code-usage', params);
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [CodeUsageService] response.data is not an array:', typeof rawData, rawData);
          
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [CodeUsageService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到代码使用记录数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const codeUsageEntries: CodeUsageEntry[] = rawData.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          model: item.Model || item.model || '',
          codeNumber: item.CodeNumber || item.codeNumber || '',
          extension: item.Extension || item.extension || '',
          productName: item.ProductName || item.productName || '',
          description: item.Description || item.description || '',
          occupancyType: item.OccupancyType || item.occupancyType || '',
          customer: item.Customer || item.customer || '',
          factory: item.Factory || item.factory || '',
          builder: item.Builder || item.builder || '',
          requester: item.Requester || item.requester || '',
          creationDate: item.CreatedAt || item.creationDate || item.CreatedDate || new Date().toISOString(),
          isDeleted: item.IsDeleted !== undefined ? item.IsDeleted : (item.isDeleted !== undefined ? item.isDeleted : false)
        }));
        
        
        return {
          success: true,
          data: codeUsageEntries,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [CodeUsageService] Error in getAllCodeUsages:', error);
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.getAllCodeUsages', { includeDeleted });
      return { success: false, error: `获取代码使用记录失败: ${error}` };
    }
  }

  async getCodeUsagesByModelAndCode(modelType: string, codeNumber: string, includeDeleted: boolean = false): Promise<DataResponse<CodeUsageEntry[]>> {
    try {
      const params = {
        modelType,
        codeNumber,
        ...(includeDeleted && { includeDeleted: 'true' })
      };
      const response = await httpClient.get<any>('/v1/code-usage/by-model-code', params);
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [CodeUsageService] response.data is not an array:', typeof rawData, rawData);
          
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [CodeUsageService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到代码使用记录数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const codeUsageEntries: CodeUsageEntry[] = rawData.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          model: item.Model || item.model || '',
          codeNumber: item.CodeNumber || item.codeNumber || '',
          extension: item.Extension || item.extension || '',
          productName: item.ProductName || item.productName || '',
          description: item.Description || item.description || '',
          occupancyType: item.OccupancyType || item.occupancyType || '',
          customer: item.Customer || item.customer || '',
          factory: item.Factory || item.factory || '',
          builder: item.Builder || item.builder || '',
          requester: item.Requester || item.requester || '',
          creationDate: item.CreatedAt || item.creationDate || item.CreatedDate || new Date().toISOString(),
          isDeleted: item.IsDeleted !== undefined ? item.IsDeleted : (item.isDeleted !== undefined ? item.isDeleted : false)
        }));
        
        
        return {
          success: true,
          data: codeUsageEntries,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [CodeUsageService] Error in getCodeUsagesByModelAndCode:', error);
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.getCodeUsagesByModelAndCode', { modelType, codeNumber, includeDeleted });
      return { success: false, error: `获取代码使用记录失败: ${error}` };
    }
  }

  // 新增：按机型获取所有代码使用记录（支持直接访问模式）
  async getCodeUsagesByModel(modelType: string, includeDeleted: boolean = false): Promise<DataResponse<CodeUsageEntry[]>> {
    try {
      const params = {
        modelType,
        ...(includeDeleted && { includeDeleted: 'true' })
      };
      const response = await httpClient.get<any>('/v1/code-usage/by-model', params);
      
      if (response.success && response.data) {
        // 🔧 检查数据类型并转换
        let rawData = response.data;
        
        // 如果data不是数组，尝试从其他可能的字段获取数组数据
        if (!Array.isArray(rawData)) {
          console.warn('⚠️ [CodeUsageService] response.data is not an array:', typeof rawData, rawData);
          
          if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.Data)) {
              rawData = rawData.Data;
            } else if (Array.isArray(rawData.data)) {
              rawData = rawData.data;
            } else {
              console.error('❌ [CodeUsageService] Cannot find array data in response');
              return { success: false, error: '数据格式错误：未找到代码使用记录数组' };
            }
          } else {
            return { success: false, error: '数据格式错误：响应数据不是对象' };
          }
        }
        
        // 转换后端数据格式为前端期望格式
        const codeUsageEntries: CodeUsageEntry[] = rawData.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          model: item.Model || item.model || '',
          codeNumber: item.CodeNumber || item.codeNumber || '',
          extension: item.Extension || item.extension || '',
          productName: item.ProductName || item.productName || '',
          description: item.Description || item.description || '',
          occupancyType: item.OccupancyType || item.occupancyType || '',
          customer: item.Customer || item.customer || '',
          factory: item.Factory || item.factory || '',
          builder: item.Builder || item.builder || '',
          requester: item.Requester || item.requester || '',
          creationDate: item.CreatedAt || item.creationDate || item.CreatedDate || new Date().toISOString(),
          isDeleted: item.IsDeleted !== undefined ? item.IsDeleted : (item.isDeleted !== undefined ? item.isDeleted : false)
        }));
        
        
        return {
          success: true,
          data: codeUsageEntries,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ [CodeUsageService] Error in getCodeUsagesByModel:', error);
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.getCodeUsagesByModel', { modelType, includeDeleted });
      return { success: false, error: `获取机型代码使用记录失败: ${error}` };
    }
  }

  async addCodeUsage(codeUsage: Omit<CodeUsageEntry, 'id' | 'creationDate' | 'isDeleted'>): Promise<DataResponse<CodeUsageEntry>> {
    try {
      const response = await httpClient.post<any>('/v1/code-usage/create-manual', codeUsage);
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const createdCodeUsage: CodeUsageEntry = {
          id: response.data.Id?.toString() || response.data.id?.toString() || '',
          model: response.data.Model || response.data.model || '',
          codeNumber: response.data.CodeNumber || response.data.codeNumber || '',
          extension: response.data.Extension || response.data.extension || '',
          productName: response.data.ProductName || response.data.productName || '',
          description: response.data.Description || response.data.description || '',
          occupancyType: response.data.OccupancyType || response.data.occupancyType || '',
          customer: response.data.Customer || response.data.customer || '',
          factory: response.data.Factory || response.data.factory || '',
          builder: response.data.Builder || response.data.builder || '',
          requester: response.data.Requester || response.data.requester || '',
          creationDate: response.data.CreatedAt || response.data.creationDate || response.data.CreatedDate || new Date().toISOString(),
          isDeleted: response.data.IsDeleted !== undefined ? response.data.IsDeleted : (response.data.isDeleted !== undefined ? response.data.isDeleted : false)
        };
        
        return {
          success: true,
          data: createdCodeUsage,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.addCodeUsage', { codeUsage });
      return { success: false, error: `添加代码使用记录失败: ${error}` };
    }
  }

  async updateCodeUsage(id: string, updates: Partial<CodeUsageEntry>): Promise<DataResponse<CodeUsageEntry>> {
    try {
      const response = await httpClient.put<any>(`/v1/code-usage/${id}`, updates);
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const updatedCodeUsage: CodeUsageEntry = {
          id: response.data.Id?.toString() || response.data.id?.toString() || id,
          model: response.data.Model || response.data.model || '',
          codeNumber: response.data.CodeNumber || response.data.codeNumber || '',
          extension: response.data.Extension || response.data.extension || '',
          productName: response.data.ProductName || response.data.productName || '',
          description: response.data.Description || response.data.description || '',
          occupancyType: response.data.OccupancyType || response.data.occupancyType || '',
          customer: response.data.Customer || response.data.customer || '',
          factory: response.data.Factory || response.data.factory || '',
          builder: response.data.Builder || response.data.builder || '',
          requester: response.data.Requester || response.data.requester || '',
          creationDate: response.data.CreatedAt || response.data.creationDate || response.data.CreatedDate || new Date().toISOString(),
          isDeleted: response.data.IsDeleted !== undefined ? response.data.IsDeleted : (response.data.isDeleted !== undefined ? response.data.isDeleted : false)
        };
        
        return {
          success: true,
          data: updatedCodeUsage,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.updateCodeUsage', { id, updates });
      return { success: false, error: `更新代码使用记录失败: ${error}` };
    }
  }

  async softDeleteCodeUsage(id: string): Promise<DataResponse<boolean>> {
    try {
      const result = await httpClient.delete(`/v1/code-usage/${id}`);
      return result;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.softDeleteCodeUsage', { id });
      return { success: false, error: `删除代码使用记录失败: ${error}` };
    }
  }

  async restoreCodeUsage(id: string): Promise<DataResponse<boolean>> {
    try {
      const result = await httpClient.post(`/v1/code-usage/${id}/restore`);
      return result;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.restoreCodeUsage', { id });
      return { success: false, error: `恢复代码使用记录失败: ${error}` };
    }
  }

  async getCodeClassificationName(modelType: string, codeNumber: string): Promise<DataResponse<string>> {
    try {
      const response = await unifiedServices.codeClassification.getCodeClassificationsByModelType(modelType);
      if (!response.success || !response.data) {
        return { success: false, error: '获取代码分类失败' };
      }
      
      const classification = response.data.find(cc => 
        cc.code === codeNumber
      );
      
      if (classification) {
        return this.success(classification.name || '', `成功获取代码分类名称: ${classification.name}`);
      }
      
      return this.success('', '未找到对应的代码分类');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'CodeUsageService.getCodeClassificationName', { modelType, codeNumber });
      return { success: false, error: `获取代码分类名称失败: ${error}` };
    }
  }
}

/**
 * 统一战情中心服务
 */
export class UnifiedWarRoomService extends BaseDataService<WarRoomData> {
  private dataManager = DataManager.getInstance();

  async getWarRoomData(): Promise<DataResponse<WarRoomData>> {
    try {
      const data = this.dataManager.getWarRoomData();
      return this.success(data, '成功获取战情中心数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getWarRoomData');
      return { success: false, error: `获取战情中心数据失败: ${error}` };
    }
  }

  async getYearlyNewModels(): Promise<DataResponse<YearlyNewModelsData[]>> {
    try {
      const warRoomData = this.dataManager.getWarRoomData();
      return this.success(warRoomData.yearlyNewModels, '成功获取年度新增机型数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getYearlyNewModels');
      return { success: false, error: `获取年度新增机型数据失败: ${error}` };
    }
  }

  async getPlanningUsage(): Promise<DataResponse<PlanningUsageData[]>> {
    try {
      const warRoomData = this.dataManager.getWarRoomData();
      return this.success(warRoomData.planningUsage, '成功获取规划占用数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getPlanningUsage');
      return { success: false, error: `获取规划占用数据失败: ${error}` };
    }
  }

  async getModelCodeRemaining(): Promise<DataResponse<ModelCodeRemainingData[]>> {
    try {
      const warRoomData = this.dataManager.getWarRoomData();
      return this.success(warRoomData.modelCodeRemaining, '成功获取机型码余量数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getModelCodeRemaining');
      return { success: false, error: `获取机型码余量数据失败: ${error}` };
    }
  }

  async getNewCodeDataByModel(modelType: string): Promise<DataResponse<ModelNewCodeData>> {
    try {
      const warRoomData = this.dataManager.getWarRoomData();
      const modelData = warRoomData.newCodeData[modelType as keyof typeof warRoomData.newCodeData];
      
      if (!modelData) {
        return { success: false, error: `不支持的机型类型: ${modelType}` };
      }

      return this.success(modelData, `成功获取${modelType}机型新增代码数据`);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getNewCodeDataByModel', { modelType });
      return { success: false, error: `获取新增代码数据失败: ${error}` };
    }
  }

  /**
   * 动态生成新增代码统计数据 - 从原始代码使用清单计算
   */
  async getDynamicNewCodeData(): Promise<DataResponse<Record<string, ModelNewCodeData>>> {
    try {
      const allCodeUsage = this.dataManager.getCodeUsageList();
      const modelClassifications = this.dataManager.getModelClassifications();
      
      // 获取所有机型类型
      const modelTypes = [...new Set(modelClassifications.map(mc => mc.type.replace(/-$/, '')))];
      
      const dynamicData: Record<string, ModelNewCodeData> = {};
      
      for (const modelType of modelTypes) {
        // 筛选该机型的所有代码使用记录
        const modelCodes = allCodeUsage.filter(entry => 
          entry.model.startsWith(modelType + '-') && !entry.isDeleted
        );
        
        // 按创建日期分组统计
        const weekData: any[] = [];
        const monthData: any[] = [];
        const yearData: any[] = [];
        
        // 生成周数据（最近4周）
        for (let week = 1; week <= 4; week++) {
          const weekCodes = modelCodes.filter(entry => {
            // 简单模拟：根据创建日期分布到不同周
            const date = new Date(entry.creationDate);
            const weekOfMonth = Math.ceil(date.getDate() / 7);
            return weekOfMonth === week;
          }).map(entry => entry.model);
          
          weekData.push({
            date: `第${week}周`,
            count: weekCodes.length,
            codeId: `${modelType.toLowerCase()}-w${week}`,
            codes: weekCodes.slice(0, 10) // 限制显示数量
          });
        }
        
        // 生成月数据（最近3个月）
        const months = ['1月', '2月', '3月'];
        for (let month = 0; month < 3; month++) {
          const monthCodes = modelCodes.filter(entry => {
            const date = new Date(entry.creationDate);
            return date.getMonth() === month;
          }).map(entry => entry.model);
          
          monthData.push({
            date: months[month],
            count: monthCodes.length,
            codeId: `${modelType.toLowerCase()}-m${month + 1}`,
            codes: monthCodes.slice(0, 15) // 限制显示数量
          });
        }
        
        // 生成年数据（最近3年）
        const years = ['2022', '2023', '2024'];
        for (const year of years) {
          const yearCodes = modelCodes.filter(entry => {
            const date = new Date(entry.creationDate);
            return date.getFullYear().toString() === year;
          }).map(entry => entry.model);
          
          yearData.push({
            date: year,
            count: yearCodes.length,
            codeId: `${modelType.toLowerCase()}-y${year}`,
            codes: yearCodes.slice(0, 20) // 限制显示数量
          });
        }
        
        dynamicData[modelType] = {
          week: weekData,
          month: monthData,
          year: yearData
        };
      }
      
      return this.success(dynamicData, '成功生成动态新增代码统计数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getDynamicNewCodeData');
      return { success: false, error: `生成动态统计数据失败: ${error}` };
    }
  }

  /**
   * 动态计算机型码余量数据
   */
  async getDynamicModelCodeRemaining(): Promise<DataResponse<any[]>> {
    try {
      const allCodeUsage = this.dataManager.getCodeUsageList();
      const modelClassifications = this.dataManager.getModelClassifications();
      const codeClassifications = this.dataManager.getCodeClassifications();
      
      // 获取所有机型类型
      const modelTypes = [...new Set(modelClassifications.map(mc => mc.type.replace(/-$/, '')))];
      
      const remainingData = modelTypes.map(modelType => {
        // 获取该机型的机型分类配置
        const modelClassification = modelClassifications.find(mc => 
          mc.type.replace(/-$/, '') === modelType
        );
        
        const totalCodes = allCodeUsage.filter(entry => entry.model.startsWith(modelType + '-'));
        // 已使用的代码：未删除且有实际产品名称的代码
        const usedCodes = totalCodes.filter(entry => 
          !entry.isDeleted && entry.productName && entry.productName.trim() !== ''
        );
        
        let total: number;
        let usageRate: number;
        
        if (modelClassification?.hasCodeClassification === false) {
          // 2层结构：总数就是实际代码数，使用率100%
          total = totalCodes.length;
          usageRate = 100;
        } else {
          // 3层结构：总数 = 代码分类数量 × 100（每个分类00-99，共100个）
          const codeClassificationCount = codeClassifications.filter(cc => 
            cc.modelType === modelClassification?.type
          ).length;
          total = codeClassificationCount * 100;
          usageRate = total > 0 ? (usedCodes.length / total * 100) : 0;
        }
        
        return {
          type: modelType,
          total,
          used: usedCodes.length,
          remaining: Math.max(0, total - usedCodes.length),
          usageRate: Math.round(usageRate * 10) / 10 // 保留一位小数
        };
      });
      
      return this.success(remainingData, '成功计算机型码余量数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'WarRoomService.getDynamicModelCodeRemaining');
      return { success: false, error: `计算机型码余量失败: ${error}` };
    }
  }
}

/**
 * 统一仪表盘服务
 */
export class UnifiedDashboardService extends BaseDataService<any> {
  private dataManager = DataManager.getInstance();

  async getDashboardStats(): Promise<DataResponse<any>> {
    try {
      const stats = this.dataManager.getStats();
      
      // 额外的仪表盘统计信息
      const codeUsageList = this.dataManager.getCodeUsageList();
      const modelClassifications = this.dataManager.getModelClassifications();
      
      // 按机型-代码分组使用数量
      const usagesByModelCode = codeUsageList
        .filter(item => !item.isDeleted)
        .reduce((acc: Record<string, number>, item) => {
          const modelPrefix = item.model.split('-')[0];
          const key = `${modelPrefix}-${item.codeNumber}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

      // 按占用类型分组
      const usagesByType = codeUsageList
        .filter(item => !item.isDeleted)
        .reduce((acc: Record<string, number>, item) => {
          const type = item.occupancyType || '其他';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

      // 按产品类型分组机型数量
      const modelsByProductType = modelClassifications.reduce((acc: Record<string, number>, item) => {
        acc[item.productType] = (acc[item.productType] || 0) + 1;
        return acc;
      }, {});

      const dashboardData = {
        ...stats,
        usagesByModelCode,
        usagesByType,
        modelsByProductType,
        generatedAt: DateFormatter.getCurrentDate()
      };

      return this.success(dashboardData, '成功获取仪表盘数据');
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DashboardService.getDashboardStats');
      return { success: false, error: `获取仪表盘数据失败: ${error}` };
    }
  }
}

/**
 * 统一数据字典服务
 */
export class UnifiedDataDictionaryService extends BaseDataService<any> {

  async getCustomers(): Promise<DataResponse<Customer[]>> {
    try {
      const response = await httpClient.get<any>('/v1/data-dictionary/customers');
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const customers: Customer[] = response.data.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          name: item.Name || item.name || ''
        }));
        
        return {
          success: true,
          data: customers,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getCustomers');
      return { success: false, error: `获取客户列表失败: ${error}` };
    }
  }

  async getFactories(): Promise<DataResponse<Factory[]>> {
    try {
      const response = await httpClient.get<any>('/v1/data-dictionary/factories');
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const factories: Factory[] = response.data.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          name: item.Name || item.name || '',
          customerId: item.CustomerId?.toString() || item.customerId?.toString() || ''
        }));
        
        return {
          success: true,
          data: factories,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getFactories');
      return { success: false, error: `获取厂区列表失败: ${error}` };
    }
  }

  async getFactoriesByCustomer(customerId: string): Promise<DataResponse<Factory[]>> {
    try {
      return await httpClient.get<Factory[]>(`/v1/data-dictionary/factories/by-customer/${customerId}`);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getFactoriesByCustomer', { customerId });
      return { success: false, error: `获取客户厂区失败: ${error}` };
    }
  }

  async getProductNames(): Promise<DataResponse<ProductNameDict[]>> {
    try {
      const response = await httpClient.get<any>('/v1/data-dictionary/product-names');
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const productNames: ProductNameDict[] = response.data.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          name: item.Name || item.name || ''
        }));
        
        return {
          success: true,
          data: productNames,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getProductNames');
      return { success: false, error: `获取品名列表失败: ${error}` };
    }
  }

  async getOccupancyTypes(): Promise<DataResponse<OccupancyTypeDict[]>> {
    try {
      const response = await httpClient.get<any>('/v1/data-dictionary/occupancy-types');
      
      if (response.success && response.data) {
        // 转换后端数据格式为前端期望格式
        const occupancyTypes: OccupancyTypeDict[] = response.data.map((item: any) => ({
          id: item.Id?.toString() || item.id?.toString() || '',
          name: item.Name || item.name || ''
        }));
        
        return {
          success: true,
          data: occupancyTypes,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getOccupancyTypes');
      return { success: false, error: `获取占用类型失败: ${error}` };
    }
  }

  // 占用类型映射函数：将后端英文代码转换为中文名称
  mapOccupancyTypeCodeToName(code: string): string {
    const occupancyTypeMap: { [key: string]: string } = {
      'PLANNING': '规划',
      'WORK_ORDER': '工令', 
      'PAUSE': '暂停'
    };
    return occupancyTypeMap[code] || code;
  }

  // 反向映射函数：将中文名称转换为后端英文代码
  mapOccupancyTypeNameToCode(name: string): string {
    const reverseMap: { [key: string]: string } = {
      '规划': 'PLANNING',
      '工令': 'WORK_ORDER',
      '暂停': 'PAUSE'
    };
    return reverseMap[name] || name;
  }

  // 创建数据字典项
  async create(data: { category: string; code: string; name: string }): Promise<DataResponse<any>> {
    try {
      return await httpClient.post<any>('/v1/data-dictionary', data);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.create', { data });
      return { success: false, error: `创建数据字典失败: ${error}` };
    }
  }

  // 更新数据字典项
  async update(id: number, data: { code: string; name: string }): Promise<DataResponse<any>> {
    try {
      return await httpClient.put<any>(`/v1/data-dictionary/${id}`, data);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.update', { id, data });
      return { success: false, error: `更新数据字典失败: ${error}` };
    }
  }

  // 删除数据字典项
  async delete(id: number): Promise<DataResponse<boolean>> {
    try {
      return await httpClient.delete(`/v1/data-dictionary/${id}`);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.delete', { id });
      return { success: false, error: `删除数据字典失败: ${error}` };
    }
  }

  // 批量删除数据字典项
  async batchDelete(ids: number[]): Promise<DataResponse<any>> {
    try {
      return await httpClient.delete('/v1/data-dictionary/batch', { data: ids });
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.batchDelete', { ids });
      return { success: false, error: `批量删除数据字典失败: ${error}` };
    }
  }

  // 根据ID获取数据字典项
  async getById(id: number): Promise<DataResponse<any>> {
    try {
      return await httpClient.get<any>(`/v1/data-dictionary/${id}`);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getById', { id });
      return { success: false, error: `获取数据字典项失败: ${error}` };
    }
  }

  // 分页获取数据字典列表
  async getPagedList(query?: { category?: string; page?: number; size?: number }): Promise<DataResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (query?.category) params.append('category', query.category);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.size) params.append('size', query.size.toString());
      
      const url = params.toString() ? `/v1/data-dictionary?${params.toString()}` : '/v1/data-dictionary';
      return await httpClient.get<any>(url);
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'DataDictionaryService.getPagedList', { query });
      return { success: false, error: `获取数据字典列表失败: ${error}` };
    }
  }

}

// 导出统一服务实例
export const unifiedServices = {
  productType: new UnifiedProductTypeService(),
  modelClassification: new UnifiedModelClassificationService(),
  codeClassification: new UnifiedCodeClassificationService(),
  codeUsage: new UnifiedCodeUsageService(),
  warRoom: new UnifiedWarRoomService(),
  dashboard: new UnifiedDashboardService(),
  dataDictionary: new UnifiedDataDictionaryService()
};

export default unifiedServices;