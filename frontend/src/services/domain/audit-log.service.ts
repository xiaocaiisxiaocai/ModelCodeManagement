// audit-log.service.ts - 审计日志服务
/**
 * 审计日志业务服务
 * 使用新的服务层架构：ApiClient + 直接后端数据访问
 * 基于后端AuditLogController提供的API接口
 */

import { apiClient } from '../api/client';
import type {
  AuditLog,
  ServiceResponse,
  PaginationParams,
  PagedResponse
} from '../../types/domain';

/**
 * 审计日志查询参数
 */
export interface AuditLogQuery extends PaginationParams {
  username?: string;
  action?: string;
  entityType?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  pageIndex?: number;
}

/**
 * 审计日志管理服务接口
 */
export interface IAuditLogService {
  getAuditLogs(query: AuditLogQuery): Promise<PagedResponse<AuditLog>>;
  cleanupOldAuditLogs(days: number): Promise<ServiceResponse<boolean>>;
}

/**
 * 审计日志管理服务实现
 */
export class AuditLogService implements IAuditLogService {

  /**
   * 获取审计日志列表
   */
  async getAuditLogs(query: AuditLogQuery): Promise<PagedResponse<AuditLog>> {
    try {
      
      const params = new URLSearchParams();
      
      // 分页参数
      if (query.pageIndex !== undefined) {
        params.append('pageIndex', query.pageIndex.toString());
      } else if (query.page) {
        params.append('pageIndex', (query.page - 1).toString());
      }
      
      params.append('pageSize', (query.pageSize || 20).toString());
      
      // 筛选参数
      if (query.username?.trim()) {
        params.append('username', query.username.trim());
      }
      if (query.action?.trim()) {
        params.append('action', query.action.trim());
      }
      if (query.entityType?.trim()) {
        params.append('entityType', query.entityType.trim());
      }
      if (query.result?.trim()) {
        params.append('result', query.result.trim());
      }
      if (query.startDate?.trim()) {
        params.append('startDate', query.startDate.trim());
      }
      if (query.endDate?.trim()) {
        params.append('endDate', query.endDate.trim());
      }

      const response = await apiClient.get(`/audit-logs?${params.toString()}`);
      
      if (!response.success) {
        console.error('❌ [AuditLogService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取审计日志失败'
        };
      }

      // 直接使用后端分页数据格式
      const backendData = response.data;
      const items = backendData?.items || backendData?.Items || [];
      
      // 直接转换为前端AuditLog格式
      const auditLogs: AuditLog[] = items.map((item: any) => ({
        id: item.Id?.toString() || item.id?.toString() || '',
        userId: item.UserId?.toString() || item.userId?.toString() || '',
        username: item.UserName || item.userName || '',
        action: item.Action || item.action || '',
        entityType: item.EntityType || item.entityType || '',
        entityId: item.EntityId?.toString() || item.entityId?.toString() || '',
        description: item.Description || item.description || '',
        result: item.Result || item.result || '',
        oldValue: item.OldValue || item.oldValue || '',
        newValue: item.NewValue || item.newValue || '',
        ipAddress: item.IpAddress || item.ipAddress || '',
        requestPath: item.RequestPath || item.requestPath || '',
        userAgent: item.UserAgent || item.userAgent || '',
        errorMessage: item.ErrorMessage || item.errorMessage || '',
        durationMs: item.DurationMs || item.durationMs || 0,
        createdAt: item.CreatedAt || item.createdAt || '',
        updatedAt: item.UpdatedAt || item.updatedAt || ''
      }));
      
      return {
        success: true,
        data: auditLogs,
        totalCount: backendData?.totalCount || backendData?.TotalCount || 0,
        currentPage: (backendData?.currentPage || backendData?.CurrentPage || query.pageIndex || 0) + 1,
        pageSize: backendData?.pageSize || backendData?.PageSize || query.pageSize || 20,
        totalPages: backendData?.totalPages || backendData?.TotalPages || 
          Math.ceil((backendData?.totalCount || backendData?.TotalCount || 0) / (query.pageSize || 20)),
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [AuditLogService] getAuditLogs error:', error);
      return {
        success: false,
        error: `获取审计日志列表失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 清理过期审计日志
   */
  async cleanupOldAuditLogs(days: number): Promise<ServiceResponse<boolean>> {
    try {
      
      if (days <= 0) {
        return {
          success: false,
          error: '保留天数必须大于0'
        };
      }

      const response = await apiClient.delete(`/audit-logs/cleanup?days=${days}`);
      
      if (!response.success) {
        console.error('❌ [AuditLogService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '清理审计日志失败'
        };
      }

      return {
        success: true,
        data: true,
        message: '清理成功'
      };
      
    } catch (error) {
      console.error('❌ [AuditLogService] cleanupOldAuditLogs error:', error);
      return {
        success: false,
        error: `清理审计日志失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// 创建默认实例
export const auditLogService = new AuditLogService();