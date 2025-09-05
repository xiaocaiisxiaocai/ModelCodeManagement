// container.ts - 服务容器
/**
 * 依赖注入容器，管理所有服务实例
 * 提供统一的服务访问和生命周期管理
 */

import { ProductTypeService, type IProductTypeService } from './domain/product-type.service';
import { ModelClassificationService, type IModelClassificationService } from './domain/model-classification.service';
import { CodeClassificationService, type ICodeClassificationService } from './domain/code-classification.service';
import { CodeUsageService, type ICodeUsageService } from './domain/code-usage.service';
import { WarRoomService, type IWarRoomService } from './domain/war-room.service';
import { DataDictionaryService, type IDataDictionaryService } from './domain/data-dictionary.service';
import { UserManagementService, type IUserManagementService } from './domain/user-management.service';
import { AuditLogService, type IAuditLogService } from './domain/audit-log.service';
import { apiClient } from './api/client';

/**
 * 服务容器接口
 */
export interface IServiceContainer {
  productType: IProductTypeService;
  modelClassification: IModelClassificationService;
  codeClassification: ICodeClassificationService;
  codeUsage: ICodeUsageService;
  warRoom: IWarRoomService;
  dataDictionary: IDataDictionaryService;
  userManagement: IUserManagementService;
  auditLog: IAuditLogService;
  // 后续可扩展其他服务
}

/**
 * 服务容器实现
 * 单例模式，确保服务实例的一致性
 */
export class ServiceContainer implements IServiceContainer {
  private static instance: ServiceContainer;
  
  // 服务实例
  public readonly productType: IProductTypeService;
  public readonly modelClassification: IModelClassificationService;
  public readonly codeClassification: ICodeClassificationService;
  public readonly codeUsage: ICodeUsageService;
  public readonly warRoom: IWarRoomService;
  public readonly dataDictionary: IDataDictionaryService;
  public readonly userManagement: IUserManagementService;
  public readonly auditLog: IAuditLogService;

  private constructor() {
    
    // 初始化所有服务
    this.productType = new ProductTypeService();
    this.modelClassification = new ModelClassificationService();
    this.codeClassification = new CodeClassificationService();
    this.codeUsage = new CodeUsageService();
    this.warRoom = new WarRoomService();
    this.dataDictionary = new DataDictionaryService();
    this.userManagement = new UserManagementService();
    this.auditLog = new AuditLogService();

    // console.log('✅ [ServiceContainer] 服务容器初始化完成');
  }

  /**
   * 获取服务容器单例实例
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * 获取指定类型的服务
   */
  getService<T extends keyof IServiceContainer>(serviceName: T): IServiceContainer[T] {
    const service = this[serviceName];
    if (!service) {
      throw new Error(`Service '${serviceName}' not found in container`);
    }
    return service;
  }

  /**
   * 检查服务是否存在
   */
  hasService(serviceName: keyof IServiceContainer): boolean {
    return serviceName in this && this[serviceName] !== undefined;
  }

  /**
   * 获取所有已注册的服务名称
   */
  getServiceNames(): (keyof IServiceContainer)[] {
    return ['productType', 'modelClassification', 'codeUsage', 'warRoom', 'dataDictionary', 'userManagement'];
  }

  /**
   * 设置API客户端基础URL（用于测试或环境切换）
   */
  setApiBaseUrl(url: string): void {
    // console.log('🔧 [ServiceContainer] 设置API基础URL:', url);
    apiClient.setBaseURL(url);
  }

  /**
   * 销毁服务容器（主要用于测试场景）
   */
  destroy(): void {
    // console.log('🔥 [ServiceContainer] 销毁服务容器...');
    ServiceContainer.instance = undefined as any;
  }

  /**
   * 获取服务容器状态信息
   */
  getStatus() {
    return {
      initialized: true,
      services: this.getServiceNames(),
      apiBaseUrl: (apiClient as any).baseURL || '/api',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 获取默认服务容器实例的便捷函数
 */
export function getServiceContainer(): ServiceContainer {
  return ServiceContainer.getInstance();
}

/**
 * 便捷的服务访问器
 */
export const container = ServiceContainer.getInstance();