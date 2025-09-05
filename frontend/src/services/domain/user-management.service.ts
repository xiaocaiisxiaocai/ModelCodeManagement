// user-management.service.ts - 用户管理服务
/**
 * 用户管理业务服务
 * 使用新的服务层架构：ApiClient + 映射器 + 响应适配器
 * 基于后端UserController提供的API接口
 */

import { apiClient } from '../api/client';
import type {
  User,
  UserCreate,
  UserUpdate,
  Role,
  Permission,
  Organization,
  ServiceResponse,
  PagedResponse,
  PageQuery
} from '../../types/domain';

/**
 * 用户管理服务接口
 */
export interface IUserManagementService {
  // 基础CRUD操作
  getAll(): Promise<ServiceResponse<User[]>>;
  getById(id: string): Promise<ServiceResponse<User>>;
  create(data: UserCreate): Promise<ServiceResponse<User>>;
  update(id: string, data: UserUpdate): Promise<ServiceResponse<User>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
  batchDelete(ids: string[]): Promise<ServiceResponse<boolean>>;
  getPagedList(query: PageQuery): Promise<PagedResponse<User>>;
  
  // 用户专用功能
  resetPassword(id: string): Promise<ServiceResponse<string>>;
  assignRoles(userId: string, roleIds: string[]): Promise<ServiceResponse<boolean>>;
  getUserRoles(userId: string): Promise<ServiceResponse<Role[]>>;
  
  // 组织相关
  getOrganizations(): Promise<ServiceResponse<Organization[]>>;
  getOrganizationTree(): Promise<ServiceResponse<Organization[]>>;
  createOrganization(orgData: { name: string; type?: string; parentId?: number; sortOrder?: number }): Promise<ServiceResponse<Organization>>;
  updateOrganization(id: string, orgData: { name: string; type?: string; parentId?: number; sortOrder?: number }): Promise<ServiceResponse<Organization>>;
  deleteOrganization(id: string): Promise<ServiceResponse<boolean>>;
  
  // 角色权限管理
  getRoles(params?: { pageSize?: number }): Promise<ServiceResponse<{ roles: Role[]; totalCount: number }>>;
  getPermissions(params?: { pageSize?: number }): Promise<ServiceResponse<{ permissions: Permission[]; totalCount: number }>>;
  createRole(roleData: { code: string; name: string; permissionIds: number[] }): Promise<ServiceResponse<Role>>;
  updateRole(id: string, roleData: { code: string; name: string; permissionIds: number[] }): Promise<ServiceResponse<Role>>;
  deleteRole(id: string): Promise<ServiceResponse<boolean>>;
  getRolePermissions(roleId: string): Promise<ServiceResponse<Permission[]>>;
  
  // 权限管理
  createPermission(permissionData: { code: string; name: string; type: string; resource?: string; parentId?: number }): Promise<ServiceResponse<Permission>>;
  updatePermission(id: string, permissionData: { code: string; name: string; type: string; resource?: string; parentId?: number }): Promise<ServiceResponse<Permission>>;
  deletePermission(id: string): Promise<ServiceResponse<boolean>>;
}

/**
 * 用户管理服务实现
 */
export class UserManagementService implements IUserManagementService {

  /**
   * 获取所有用户
   */
  async getAll(): Promise<ServiceResponse<User[]>> {
    try {

      
      // 🔧 直接使用后端返回的原始数据格式，不使用DTO映射
      const response = await apiClient.get('/user?pageSize=1000');
      

      
      if (!response.success || !response.data as any) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取用户数据失败'
        };
      }

      // 直接使用后端分页数据格式
      const backendData = response.data as any as any;
      const items = backendData.Items || [];
      

      
      if (!Array.isArray(items) || items.length === 0) {
        return {
          success: true,
          data: [],
          message: '暂无用户数据'
        };
      }
      
      // 直接转换为前端User格式，不使用DTO映射器
      const users: User[] = items.map((item: any) => ({
        id: item.Id?.toString() || item.id?.toString() || '',
        employeeId: item.EmployeeId || item.employeeId || '',
        name: item.UserName || item.userName || '',
        userName: item.UserName || item.userName || '',
        email: item.Email || item.email || '',
        role: item.Role || item.role || 'User',
        department: item.Department || item.department || '',
        organizationId: item.OrganizationId?.toString() || item.organizationId?.toString(),
        position: item.Position || item.position || '',
        phone: item.Phone || item.phone || '',
        status: item.Status || item.status || 'Active',
        isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
        lastLoginAt: item.LastLoginAt || item.lastLoginAt,
        createdAt: item.CreatedAt || item.createdAt || '',
        updatedAt: item.UpdatedAt || item.updatedAt || '',
        
        // 显示字段
        displayName: item.UserName || item.userName || '',
        roleNames: [item.Role || item.role || 'User'],
        displayInfo: {
          fullName: item.UserName || item.userName || '',
          avatar: (item.UserName || item.userName || '').charAt(0).toUpperCase(),
          contactInfo: item.Email || item.email || item.Phone || item.phone || ''
        }
      }));
      

      
      return {
        success: true,
        data: users,
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getAll error:', error);
      return {
        success: false,
        error: `获取用户列表失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 根据ID获取用户
   */
  async getById(id: string): Promise<ServiceResponse<User>> {
    try {

      
      if (!id?.trim()) {
        return {
          success: false,
          error: '用户ID不能为空'
        };
      }

      const response = await apiClient.get(`/user/${id}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取用户失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendUser = response.data as any as any;
      const user: User = {
        id: backendUser.Id?.toString() || backendUser.id?.toString() || '',
        employeeId: backendUser.EmployeeId || backendUser.employeeId || '',
        name: backendUser.UserName || backendUser.userName || '',
        userName: backendUser.UserName || backendUser.userName || '',
        email: backendUser.Email || backendUser.email || '',
        role: backendUser.Role || backendUser.role || 'User',
        department: backendUser.Department || backendUser.department || '',
        organizationId: backendUser.OrganizationId?.toString() || backendUser.organizationId?.toString(),
        position: backendUser.Position || backendUser.position || '',
        phone: backendUser.Phone || backendUser.phone || '',
        status: backendUser.Status || backendUser.status || 'Active',
        isActive: backendUser.IsActive !== undefined ? backendUser.IsActive : (backendUser.isActive !== undefined ? backendUser.isActive : true),
        lastLoginAt: backendUser.LastLoginAt || backendUser.lastLoginAt,
        createdAt: backendUser.CreatedAt || backendUser.createdAt || '',
        updatedAt: backendUser.UpdatedAt || backendUser.updatedAt || '',

        displayInfo: {
          fullName: backendUser.UserName || backendUser.userName || '',
          avatar: (backendUser.UserName || backendUser.userName || '').charAt(0).toUpperCase(),
          contactInfo: backendUser.Email || backendUser.email || backendUser.Phone || backendUser.phone || ''
        }
      };
      
      const result = {
        success: true,
        data: user,
        message: '获取成功'
      };
      

      return result;
      
    } catch (error) {
      console.error('❌ [UserManagementService] getById error:', error);
      return {
        success: false,
        error: `获取用户失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 创建用户
   */
  async create(data: UserCreate): Promise<ServiceResponse<User>> {
    try {

      
      // 数据验证
      const validation = this.validateUser(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      // 映射前端数据到后端DTO格式
      const createUserDto = {
        employeeId: data.employeeId,
        userName: data.name,  // 前端name -> 后端UserName
        password: data.password,
        email: data.email || undefined,
        role: data.role, // 保持首字母大写格式: User/Admin/SuperAdmin
        // 🔧 修复：不传递department字段，只传递organizationId
        organizationId: data.department ? parseInt(data.department) : undefined,
        position: data.position || undefined,
        phone: data.phoneNumber || undefined,
        isActive: data.isActive !== false, // 默认为true
        status: "Active" // 默认状态
      };

      const response = await apiClient.post('/user', createUserDto);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '创建用户失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendUser = response.data as any as any;
      const user: User = {
        id: backendUser.Id?.toString() || backendUser.id?.toString() || '',
        employeeId: backendUser.EmployeeId || backendUser.employeeId || '',
        name: backendUser.UserName || backendUser.userName || '',
        userName: backendUser.UserName || backendUser.userName || '',
        email: backendUser.Email || backendUser.email || '',
        role: backendUser.Role || backendUser.role || 'User',
        department: backendUser.Department || backendUser.department || '',
        organizationId: backendUser.OrganizationId?.toString() || backendUser.organizationId?.toString(),
        position: backendUser.Position || backendUser.position || '',
        phone: backendUser.Phone || backendUser.phone || '',
        status: backendUser.Status || backendUser.status || 'Active',
        isActive: backendUser.IsActive !== undefined ? backendUser.IsActive : (backendUser.isActive !== undefined ? backendUser.isActive : true),
        lastLoginAt: backendUser.LastLoginAt || backendUser.lastLoginAt,
        createdAt: backendUser.CreatedAt || backendUser.createdAt || '',
        updatedAt: backendUser.UpdatedAt || backendUser.updatedAt || '',

        displayInfo: {
          fullName: backendUser.UserName || backendUser.userName || '',
          avatar: (backendUser.UserName || backendUser.userName || '').charAt(0).toUpperCase(),
          contactInfo: backendUser.Email || backendUser.email || backendUser.Phone || backendUser.phone || ''
        }
      };
      
      const result = {
        success: true,
        data: user,
        message: '创建成功'
      };
      

      return result;
      
    } catch (error) {
      console.error('❌ [UserManagementService] create error:', error);
      return {
        success: false,
        error: `创建用户失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 更新用户
   */
  async update(id: string, data: UserUpdate): Promise<ServiceResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: '用户ID不能为空'
        };
      }

      const validation = this.validateUser(data, false);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        };
      }

      // 映射前端数据到后端DTO格式
      const updateUserDto = {
        userName: data.name,  // 前端name -> 后端UserName
        email: data.email || '',
        // 🔧 修复：恢复role字段，后端已支持通过UserRoles关联表管理
        role: data.role || 'User',  // 恢复role字段
        // 🔧 修复：organizationId必须是数字类型，处理可能的字符串输入
        organizationId: data.organizationId ? parseInt(data.organizationId) : undefined,
        status: 'Active',
        isActive: true
      };

      console.log('🔧 [UserManagementService] 更新用户数据:', {
        id,
        updateUserDto,
        originalData: data
      });

      const response = await apiClient.put(`/user/${id}`, updateUserDto);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '更新用户失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendUser = response.data as any as any;
      const user: User = {
        id: backendUser.Id?.toString() || backendUser.id?.toString() || '',
        employeeId: backendUser.EmployeeId || backendUser.employeeId || '',
        name: backendUser.UserName || backendUser.userName || '',
        userName: backendUser.UserName || backendUser.userName || '',
        email: backendUser.Email || backendUser.email || '',
        role: backendUser.Role || backendUser.role || 'User',
        department: backendUser.Department || backendUser.department || '',
        organizationId: backendUser.OrganizationId?.toString() || backendUser.organizationId?.toString(),
        position: backendUser.Position || backendUser.position || '',
        phone: backendUser.Phone || backendUser.phone || '',
        status: backendUser.Status || backendUser.status || 'Active',
        isActive: backendUser.IsActive !== undefined ? backendUser.IsActive : (backendUser.isActive !== undefined ? backendUser.isActive : true),
        lastLoginAt: backendUser.LastLoginAt || backendUser.lastLoginAt,
        createdAt: backendUser.CreatedAt || backendUser.createdAt || '',
        updatedAt: backendUser.UpdatedAt || backendUser.updatedAt || '',

        displayInfo: {
          fullName: backendUser.UserName || backendUser.userName || '',
          avatar: (backendUser.UserName || backendUser.userName || '').charAt(0).toUpperCase(),
          contactInfo: backendUser.Email || backendUser.email || backendUser.Phone || backendUser.phone || ''
        }
      };
      
      const result = {
        success: true,
        data: user,
        message: '更新成功'
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ [UserManagementService] update error:', error);
      return {
        success: false,
        error: `更新用户失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 删除用户
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!id?.trim()) {
        return {
          success: false,
          error: '用户ID不能为空'
        };
      }

      const response = await apiClient.delete(`/user/${id}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '删除用户失败'
        };
      }

      return {
        success: true,
        data: true,
        message: '删除成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] delete error:', error);
      return {
        success: false,
        error: `删除用户失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 批量删除用户
   */
  async batchDelete(ids: string[]): Promise<ServiceResponse<boolean>> {
    try {
      // console.log('📡 [UserManagementService] 批量删除用户:', ids);
      
      if (!ids?.length) {
        return {
          success: false,
          error: '删除ID列表不能为空'
        };
      }

      // 逐一删除（如果后端支持批量删除可以优化）
      for (const id of ids) {
        const result = await this.delete(id);
        if (!result.success) {
          return result;
        }
      }

      // console.log('✅ [UserManagementService] 成功批量删除用户:', ids.length, '个');
      return {
        success: true,
        data: true,
        message: '批量删除成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] batchDelete error:', error);
      return {
        success: false,
        error: `批量删除用户失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取分页用户列表
   */
  async getPagedList(query: PageQuery): Promise<PagedResponse<User>> {
    try {
      // console.log('📡 [UserManagementService] 获取分页列表:', query);
      
      const params = new URLSearchParams();
      params.append('page', query.page.toString());
      params.append('pageSize', query.pageSize.toString());
      
      if (query.search?.trim()) {
        params.append('search', query.search.trim());
      }

      const response = await apiClient.get(`/user?${params.toString()}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取分页用户列表失败',
          totalCount: 0,
          currentPage: query.page,
          pageSize: query.pageSize,
          totalPages: 0
        };
      }

      // 直接使用后端分页数据格式
      const backendData = response.data as any as any;
      const items = backendData?.Items || [];
      
      // 直接转换为前端User格式，不使用DTO映射器
      const users: User[] = items.map((item: any) => ({
        id: item.Id?.toString() || item.id?.toString() || '',
        employeeId: item.EmployeeId || item.employeeId || '',
        name: item.UserName || item.userName || '',
        userName: item.UserName || item.userName || '',
        email: item.Email || item.email || '',
        role: item.Role || item.role || 'user',
        department: item.Department || item.department || '',
        organizationId: item.OrganizationId?.toString() || item.organizationId?.toString(),
        position: item.Position || item.position || '',
        phone: item.Phone || item.phone || '',
        status: item.Status || item.status || 'Active',
        isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
        lastLoginAt: item.LastLoginAt || item.lastLoginAt,
        createdAt: item.CreatedAt || item.createdAt || '',
        updatedAt: item.UpdatedAt || item.updatedAt || '',
        displayName: item.UserName || item.userName || '',
        roleNames: [item.Role || item.role || 'user']
      }));
      
      // console.log('✅ [UserManagementService] 成功获取分页列表:', users.length, '条');
      return {
        success: true,
        data: users,
        totalCount: backendData?.TotalCount || backendData?.totalCount || 0,
        currentPage: backendData?.CurrentPage || backendData?.currentPage || query.page,
        pageSize: backendData?.PageSize || backendData?.pageSize || query.pageSize,
        totalPages: backendData?.TotalPages || backendData?.totalPages || Math.ceil((backendData?.TotalCount || 0) / query.pageSize),
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getPagedList error:', error);
      return {
        success: false,
        error: `获取分页用户列表失败: ${error instanceof Error ? error.message : String(error)}`,
        totalCount: 0,
        currentPage: query.page,
        pageSize: query.pageSize,
        totalPages: 0
      };
    }
  }

  /**
   * 重置用户密码
   */
  async resetPassword(id: string): Promise<ServiceResponse<string>> {
    try {
      // console.log('📡 [UserManagementService] 重置用户密码:', id);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '用户ID不能为空'
        };
      }

      const response = await apiClient.post(`/user/${id}/reset-password`, {});
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '重置密码失败'
        };
      }

      // console.log('✅ [UserManagementService] 成功重置用户密码:', id);
      return {
        success: true,
        data: (response.data as any as string) || '密码已重置',
        message: '密码重置成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] resetPassword error:', error);
      return {
        success: false,
        error: `重置密码失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 分配用户角色
   */
  async assignRoles(userId: string, roleIds: string[]): Promise<ServiceResponse<boolean>> {
    try {
      // console.log('📡 [UserManagementService] 分配用户角色:', userId, roleIds);
      
      if (!userId?.trim()) {
        return {
          success: false,
          error: '用户ID不能为空'
        };
      }

      const numericRoleIds = roleIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      const response = await apiClient.post(`/user/${userId}/roles`, { roleIds: numericRoleIds });
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '分配角色失败'
        };
      }

      // console.log('✅ [UserManagementService] 成功分配用户角色');
      return {
        success: true,
        data: true,
        message: '分配角色成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] assignRoles error:', error);
      return {
        success: false,
        error: `分配角色失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取用户角色
   */
  async getUserRoles(userId: string): Promise<ServiceResponse<Role[]>> {
    try {
      // console.log('📡 [UserManagementService] 获取用户角色:', userId);
      
      if (!userId?.trim()) {
        return {
          success: false,
          error: '用户ID不能为空'
        };
      }

      const response = await apiClient.get(`/user/${userId}/roles`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取用户角色失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendRoles = (response.data as any as any) || [];
      const roles: Role[] = backendRoles.map((item: any) => ({
        id: item.Id?.toString() || item.id?.toString() || '',
        code: item.Code || item.code || '',
        name: item.Name || item.name || '',
        description: item.Description || item.description || '',
        isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
        createdAt: item.CreatedAt || item.createdAt || '',
        updatedAt: item.UpdatedAt || item.updatedAt || ''
      }));
      
      // console.log('✅ [UserManagementService] 成功获取用户角色:', roles.length, '个');
      return {
        success: true,
        data: roles,
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getUserRoles error:', error);
      return {
        success: false,
        error: `获取用户角色失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取组织列表
   */
  async getOrganizations(): Promise<ServiceResponse<Organization[]>> {
    try {
      // console.log('📡 [UserManagementService] 获取组织列表...');
      
      const response = await apiClient.get('/organization?pageSize=1000');
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取组织列表失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendData = response.data as any as any;
      const items = backendData?.Items || backendData || [];
      
      const organizations: Organization[] = items.map((item: any) => ({
        id: item.Id?.toString() || item.id?.toString() || '',
        name: item.Name || item.name || '',
        type: item.Type || item.type || '',
        typeDisplay: (() => {
          const typeMap: Record<string, string> = {
            'Company': '公司',
            'Division': '事业部',
            'Department': '部门',
            'Section': '课别'
          };
          const type = item.Type || item.type || '';
          return typeMap[type] || type;
        })(),
        parentId: item.ParentId?.toString() || item.parentId?.toString() || undefined,
        path: item.Path || item.path || '',
        pathArray: (item.Path || item.path || '').split('/').filter(Boolean),
        pathDisplay: '', // TODO: 计算路径显示
        level: item.Level || item.level || 0,
        sortOrder: item.SortOrder || item.sortOrder || 0,
        isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
        createdAt: item.CreatedAt || item.createdAt || '',
        updatedAt: item.UpdatedAt || item.updatedAt || '',
        // 统计信息（直接字段）
        userCount: item.UserCount || item.userCount || 0,
        // 树形结构辅助
        treeData: {
          hasChildren: false, // TODO: 根据children判断
          depth: item.Level || item.level || 0,
          isLastChild: false
        },
        // 统计信息 - 需要从后端或计算得出
        stats: {
          childrenCount: 0,
          userCount: item.UserCount || item.userCount || 0, // 与顶级userCount同步
          descendantCount: 0
        }
      }));
      
      // console.log('✅ [UserManagementService] 成功获取组织列表:', organizations.length, '个');
      return {
        success: true,
        data: organizations,
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getOrganizations error:', error);
      return {
        success: false,
        error: `获取组织列表失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取组织树
   */
  async getOrganizationTree(): Promise<ServiceResponse<Organization[]>> {
    try {
      // console.log('📡 [UserManagementService] 获取组织树...');
      
      const response = await apiClient.get('/organization/tree');
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取组织树失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendData = (response.data as any as any) || [];
      const organizations: Organization[] = backendData.map((item: any) => ({
        id: item.Id?.toString() || item.id?.toString() || '',
        code: item.Code || item.code || '',
        name: item.Name || item.name || '',
        type: item.Type || item.type || '',
        typeDisplay: (() => {
          const typeMap: Record<string, string> = {
            'Company': '公司',
            'Division': '事业部',
            'Department': '部门',
            'Section': '课别'
          };
          const type = item.Type || item.type || '';
          return typeMap[type] || type;
        })(),
        parentId: item.ParentId?.toString() || item.parentId?.toString() || undefined,
        path: item.Path || item.path || '',
        pathArray: (item.Path || item.path || '').split('/').filter(Boolean),
        pathDisplay: '', // TODO: 计算路径显示
        level: item.Level || item.level || 0,
        sortOrder: item.SortOrder || item.sortOrder || 0,
        isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
        createdAt: item.CreatedAt || item.createdAt || '',
        updatedAt: item.UpdatedAt || item.updatedAt || '',
        // 统计信息（直接字段）
        userCount: item.UserCount || item.userCount || 0,
        // 树形结构辅助
        treeData: {
          hasChildren: Array.isArray(item.Children) && item.Children.length > 0,
          depth: item.Level || item.level || 0,
          isLastChild: false
        },
        // 统计信息 - 需要从后端或计算得出
        stats: {
          childrenCount: Array.isArray(item.Children) ? item.Children.length : 0,
          userCount: item.UserCount || item.userCount || 0, // 与顶级userCount同步
          descendantCount: 0
        },
        // 如果有子节点，递归处理
        children: Array.isArray(item.Children) ? item.Children.map((child: any) => ({
          id: child.Id?.toString() || child.id?.toString() || '',
          code: child.Code || child.code || '',
          name: child.Name || child.name || '',
          type: child.Type || child.type || '',
          typeDisplay: (() => {
            const typeMap: Record<string, string> = {
              'Company': '公司',
              'Division': '事业部',
              'Department': '部门',
              'Section': '课别'
            };
            const type = child.Type || child.type || '';
            return typeMap[type] || type;
          })(),
          parentId: child.ParentId?.toString() || child.parentId?.toString() || undefined,
          path: child.Path || child.path || '',
          pathArray: (child.Path || child.path || '').split('/').filter(Boolean),
          pathDisplay: '',
          level: child.Level || child.level || 0,
          sortOrder: child.SortOrder || child.sortOrder || 0,
          isActive: child.IsActive !== undefined ? child.IsActive : (child.isActive !== undefined ? child.isActive : true),
          createdAt: child.CreatedAt || child.createdAt || '',
          updatedAt: child.UpdatedAt || child.updatedAt || '',
          userCount: child.UserCount || child.userCount || 0,
          treeData: {
            hasChildren: Array.isArray(child.Children) && child.Children.length > 0,
            depth: child.Level || child.level || 0,
            isLastChild: false
          },
          stats: {
            childrenCount: Array.isArray(child.Children) ? child.Children.length : 0,
            userCount: child.UserCount || child.userCount || 0,
            descendantCount: 0
          }
        })) : undefined
      }));
      
      // console.log('✅ [UserManagementService] 成功获取组织树:', organizations.length, '个节点');
      return {
        success: true,
        data: organizations,
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getOrganizationTree error:', error);
      return {
        success: false,
        error: `获取组织树失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 创建组织
   */
  async createOrganization(orgData: { name: string; type?: string; parentId?: number; sortOrder?: number }): Promise<ServiceResponse<Organization>> {
    try {
      // console.log('📡 [UserManagementService] 创建组织:', orgData);
      
      if (!orgData.name?.trim()) {
        return {
          success: false,
          error: '组织名称不能为空'
        };
      }

      const response = await apiClient.post('/organization', orgData);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '创建组织失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendOrg = response.data as any as any;
      const organization: Organization = {
        id: backendOrg.Id?.toString() || backendOrg.id?.toString() || '',
        name: backendOrg.Name || backendOrg.name || '',
        type: backendOrg.Type || backendOrg.type || '',
        typeDisplay: (() => {
          const typeMap: Record<string, string> = {
            'Company': '公司',
            'Division': '事业部',
            'Department': '部门',
            'Section': '课别'
          };
          const type = backendOrg.Type || backendOrg.type || '';
          return typeMap[type] || type;
        })(),
        parentId: backendOrg.ParentId?.toString() || backendOrg.parentId?.toString() || undefined,
        path: backendOrg.Path || backendOrg.path || '',
        pathArray: (backendOrg.Path || backendOrg.path || '').split('/').filter(Boolean),
        pathDisplay: '',
        level: backendOrg.Level || backendOrg.level || 0,
        sortOrder: backendOrg.SortOrder || backendOrg.sortOrder || 0,
        isActive: backendOrg.IsActive !== undefined ? backendOrg.IsActive : (backendOrg.isActive !== undefined ? backendOrg.isActive : true),
        createdAt: backendOrg.CreatedAt || backendOrg.createdAt || '',
        updatedAt: backendOrg.UpdatedAt || backendOrg.updatedAt || '',
        userCount: backendOrg.UserCount || backendOrg.userCount || 0,
        treeData: {
          hasChildren: false,
          depth: backendOrg.Level || backendOrg.level || 0,
          isLastChild: false
        },
        stats: {
          childrenCount: 0,
          userCount: backendOrg.UserCount || backendOrg.userCount || 0,
          descendantCount: 0
        }
      };
      
      // console.log('✅ [UserManagementService] 成功创建组织:', organization.name);
      return {
        success: true,
        data: organization,
        message: '创建成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] createOrganization error:', error);
      return {
        success: false,
        error: `创建组织失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 更新组织
   */
  async updateOrganization(id: string, orgData: { name: string; type?: string; parentId?: number; sortOrder?: number }): Promise<ServiceResponse<Organization>> {
    try {
      // console.log('📡 [UserManagementService] 更新组织:', id, orgData);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '组织ID不能为空'
        };
      }

      const response = await apiClient.put(`/organization/${id}`, orgData);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '更新组织失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendOrg = response.data as any as any;
      const organization: Organization = {
        id: backendOrg.Id?.toString() || backendOrg.id?.toString() || '',
        name: backendOrg.Name || backendOrg.name || '',
        type: backendOrg.Type || backendOrg.type || '',
        typeDisplay: (() => {
          const typeMap: Record<string, string> = {
            'Company': '公司',
            'Division': '事业部',
            'Department': '部门',
            'Section': '课别'
          };
          const type = backendOrg.Type || backendOrg.type || '';
          return typeMap[type] || type;
        })(),
        parentId: backendOrg.ParentId?.toString() || backendOrg.parentId?.toString() || undefined,
        path: backendOrg.Path || backendOrg.path || '',
        pathArray: (backendOrg.Path || backendOrg.path || '').split('/').filter(Boolean),
        pathDisplay: '',
        level: backendOrg.Level || backendOrg.level || 0,
        sortOrder: backendOrg.SortOrder || backendOrg.sortOrder || 0,
        isActive: backendOrg.IsActive !== undefined ? backendOrg.IsActive : (backendOrg.isActive !== undefined ? backendOrg.isActive : true),
        createdAt: backendOrg.CreatedAt || backendOrg.createdAt || '',
        updatedAt: backendOrg.UpdatedAt || backendOrg.updatedAt || '',
        userCount: backendOrg.UserCount || backendOrg.userCount || 0,
        treeData: {
          hasChildren: false,
          depth: backendOrg.Level || backendOrg.level || 0,
          isLastChild: false
        },
        stats: {
          childrenCount: 0,
          userCount: backendOrg.UserCount || backendOrg.userCount || 0,
          descendantCount: 0
        }
      };
      
      // console.log('✅ [UserManagementService] 成功更新组织:', organization.name);
      return {
        success: true,
        data: organization,
        message: '更新成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] updateOrganization error:', error);
      return {
        success: false,
        error: `更新组织失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 删除组织
   */
  async deleteOrganization(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // console.log('📡 [UserManagementService] 删除组织:', id);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '组织ID不能为空'
        };
      }

      const response = await apiClient.delete(`/organization/${id}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '删除组织失败'
        };
      }

      // console.log('✅ [UserManagementService] 成功删除组织:', id);
      return {
        success: true,
        data: true,
        message: '删除成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] deleteOrganization error:', error);
      return {
        success: false,
        error: `删除组织失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 验证用户数据 - 与后端验证器保持一致
   */
  private validateUser(data: Partial<UserCreate>, isCreate = true): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 创建时的必填字段验证
    if (isCreate) {
      // 工号验证 - 与后端CreateUserDtoValidator一致
      if (!data.employeeId?.trim()) {
        errors.push('工号不能为空');
      } else if (data.employeeId.length < 3 || data.employeeId.length > 20) {
        errors.push('工号长度必须在3-20位之间');
      } else if (!/^[a-zA-Z0-9]+$/.test(data.employeeId)) {
        errors.push('工号只能包含字母和数字');
      }

      // 用户名验证
      if (!data.name?.trim()) {
        errors.push('用户名不能为空');
      } else if (data.name.length < 2 || data.name.length > 50) {
        errors.push('用户名长度必须在2-50位之间');
      }

      // 密码验证
      if (!data.password?.trim()) {
        errors.push('密码不能为空');
      } else if (data.password.length < 4) {
        errors.push('密码长度至少4位');
      }

      // 角色验证
      if (!data.role) {
        errors.push('角色不能为空');
      } else if (!['SuperAdmin', 'Admin', 'User'].includes(data.role)) {
        errors.push('角色必须是SuperAdmin、Admin或User');
      }
    }

    // 邮箱格式验证（可选字段）
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('邮箱格式不正确');
    }

    // 手机号格式验证（可选字段）
    if (data.phoneNumber && !/^1[3-9]\d{9}$/.test(data.phoneNumber)) {
      errors.push('手机号格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取角色列表
   */
  async getRoles(params?: { pageSize?: number }): Promise<ServiceResponse<{ roles: Role[]; totalCount: number }>> {
    try {
      // console.log('📡 [UserManagementService] 获取角色列表...');
      
      const queryParams = new URLSearchParams();
      if (params?.pageSize) {
        queryParams.append('pageSize', params.pageSize.toString());
      }

      const response = await apiClient.get(`/roles?${queryParams.toString()}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取角色列表失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendData = response.data as any as any;
      const items = backendData?.Items || backendData || [];
      
      const roles: Role[] = items.map((item: any) => {
        const permissions = item.Permissions || item.permissions || [];
        
        return {
          id: item.Id?.toString() || item.id?.toString() || '',
          code: item.Code || item.code || '',
          name: item.Name || item.name || '',
          description: item.Description || item.description || '',
          isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
          createdAt: item.CreatedAt || item.createdAt || '',
          updatedAt: item.UpdatedAt || item.updatedAt || '',
          // 关联数据
          permissions: permissions,
          userCount: item.UserCount || item.userCount || 0,
          permissionCount: item.PermissionCount || item.permissionCount || (Array.isArray(permissions) ? permissions.length : 0),
          // 显示信息
          displayInfo: {
            statusBadge: (item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true)) ? 'active' : 'inactive',
            statusColor: (item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true)) ? 'green' : 'red',
            statusText: (item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true)) ? '启用' : '禁用'
          }
        };
      });
      
      // console.log('✅ [UserManagementService] 成功获取角色列表:', roles.length, '个');
      return {
        success: true,
        data: {
          roles,
          totalCount: roles.length
        },
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getRoles error:', error);
      return {
        success: false,
        error: `获取角色列表失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取权限列表
   */
  async getPermissions(params?: { pageSize?: number }): Promise<ServiceResponse<{ permissions: Permission[]; totalCount: number }>> {
    try {
      // console.log('📡 [UserManagementService] 获取权限列表...');
      
      const queryParams = new URLSearchParams();
      if (params?.pageSize) {
        queryParams.append('pageSize', params.pageSize.toString());
      }

      const response = await apiClient.get(`/permissions?${queryParams.toString()}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取权限列表失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendData = response.data as any as any;
      const items = backendData?.Items || backendData || [];
      
      const permissions: Permission[] = items.map((item: any) => {
        const type = item.Type || item.type || 'Menu';
        const resource = item.Resource || item.resource || '';
        
        return {
          id: item.Id?.toString() || item.id?.toString() || '',
          code: item.Code || item.code || '',
          name: item.Name || item.name || '',
          type: type as 'Menu' | 'Action' | 'Api',
          resource: resource,
          description: item.Description || item.description || '',
          isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
          createdAt: item.CreatedAt || item.createdAt || '',
          updatedAt: item.UpdatedAt || item.updatedAt || '',
          // 层级信息
          parentId: item.ParentId?.toString() || item.parentId?.toString(),
          // 分组信息 - 基于type生成category
          category: item.Category || item.category || type,
          categoryDisplay: item.CategoryDisplay || item.categoryDisplay || 
            (type === 'Menu' ? '菜单权限' : 
             type === 'Action' ? '操作权限' : 'API权限'),
          // 显示信息
          displayInfo: {
            typeIcon: type === 'Menu' ? 'menu' : 
                     type === 'Action' ? 'action' : 'api',
            typeColor: type === 'Menu' ? 'blue' : 
                      type === 'Action' ? 'green' : 'orange',
            fullPath: `${resource}/${item.Code || item.code || ''}`
          }
        };
      });
      
      // console.log('✅ [UserManagementService] 成功获取权限列表:', permissions.length, '个');
      return {
        success: true,
        data: {
          permissions,
          totalCount: permissions.length
        },
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getPermissions error:', error);
      return {
        success: false,
        error: `获取权限列表失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 创建角色
   */
  async createRole(roleData: { code: string; name: string; permissionIds: number[] }): Promise<ServiceResponse<Role>> {
    try {
      // console.log('📡 [UserManagementService] 创建角色:', roleData);
      
      if (!roleData.code?.trim()) {
        return {
          success: false,
          error: '角色代码不能为空'
        };
      }
      if (!roleData.name?.trim()) {
        return {
          success: false,
          error: '角色名称不能为空'
        };
      }

      const response = await apiClient.post('/roles', roleData);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '创建角色失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendRole = response.data as any;
      const permissions = backendRole.Permissions || backendRole.permissions || [];
      
      const role: Role = {
        id: backendRole.Id?.toString() || backendRole.id?.toString() || '',
        code: backendRole.Code || backendRole.code || '',
        name: backendRole.Name || backendRole.name || '',
        description: backendRole.Description || backendRole.description || '',
        isActive: backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true),
        createdAt: backendRole.CreatedAt || backendRole.createdAt || '',
        updatedAt: backendRole.UpdatedAt || backendRole.updatedAt || '',
        // 关联数据
        permissions: permissions,
        userCount: backendRole.UserCount || backendRole.userCount || 0,
        permissionCount: Array.isArray(permissions) ? permissions.length : 0,
        // 显示信息
        displayInfo: {
          statusBadge: (backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true)) ? 'active' : 'inactive',
          statusColor: (backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true)) ? 'green' : 'red',
          statusText: (backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true)) ? '启用' : '禁用'
        }
      };
      
      // console.log('✅ [UserManagementService] 成功创建角色:', role.name);
      return {
        success: true,
        data: role,
        message: '创建成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] createRole error:', error);
      return {
        success: false,
        error: `创建角色失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, roleData: { code: string; name: string; permissionIds: number[] }): Promise<ServiceResponse<Role>> {
    try {
      // console.log('📡 [UserManagementService] 更新角色:', id, roleData);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '角色ID不能为空'
        };
      }

      const response = await apiClient.put(`/roles/${id}`, roleData);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '更新角色失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendRole = response.data as any;
      const permissions = backendRole.Permissions || backendRole.permissions || [];
      
      const role: Role = {
        id: backendRole.Id?.toString() || backendRole.id?.toString() || '',
        code: backendRole.Code || backendRole.code || '',
        name: backendRole.Name || backendRole.name || '',
        description: backendRole.Description || backendRole.description || '',
        isActive: backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true),
        createdAt: backendRole.CreatedAt || backendRole.createdAt || '',
        updatedAt: backendRole.UpdatedAt || backendRole.updatedAt || '',
        // 关联数据
        permissions: permissions,
        userCount: backendRole.UserCount || backendRole.userCount || 0,
        permissionCount: Array.isArray(permissions) ? permissions.length : 0,
        // 显示信息
        displayInfo: {
          statusBadge: (backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true)) ? 'active' : 'inactive',
          statusColor: (backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true)) ? 'green' : 'red',
          statusText: (backendRole.IsActive !== undefined ? backendRole.IsActive : (backendRole.isActive !== undefined ? backendRole.isActive : true)) ? '启用' : '禁用'
        }
      };
      
      // console.log('✅ [UserManagementService] 成功更新角色:', role.name);
      return {
        success: true,
        data: role,
        message: '更新成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] updateRole error:', error);
      return {
        success: false,
        error: `更新角色失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // console.log('📡 [UserManagementService] 删除角色:', id);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '角色ID不能为空'
        };
      }

      const response = await apiClient.delete(`/roles/${id}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '删除角色失败'
        };
      }

      // console.log('✅ [UserManagementService] 成功删除角色:', id);
      return {
        success: true,
        data: true,
        message: '删除成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] deleteRole error:', error);
      return {
        success: false,
        error: `删除角色失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取角色权限
   */
  async getRolePermissions(roleId: string): Promise<ServiceResponse<Permission[]>> {
    try {
      // console.log('📡 [UserManagementService] 获取角色权限:', roleId);
      
      if (!roleId?.trim()) {
        return {
          success: false,
          error: '角色ID不能为空'
        };
      }

      const response = await apiClient.get(`/roles/${roleId}/permissions`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '获取角色权限失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendData = (response.data as any as any) || [];
      
      const permissions: Permission[] = backendData.map((item: any) => {
        // 计算权限级别：基于权限类型和资源路径层级
        let level = 1;
        const type = item.Type || item.type || 'Menu';
        const resource = item.Resource || item.resource || '';
        
        // 根据类型设置基础级别
        if (type === 'Menu') level = 1;
        else if (type === 'Action') level = 2;
        else if (type === 'Api') level = 3;
        
        // 根据资源路径增加级别
        if (resource) {
          const pathDepth = resource.split('/').filter(Boolean).length;
          level = Math.min(level + pathDepth, 5); // 最高5级
        }
        
        return {
          id: item.Id?.toString() || item.id?.toString() || '',
          code: item.Code || item.code || '',
          name: item.Name || item.name || '',
          type: type as 'Menu' | 'Action' | 'Api',
          resource: resource,
          description: item.Description || item.description || '',
          isActive: item.IsActive !== undefined ? item.IsActive : (item.isActive !== undefined ? item.isActive : true),
          createdAt: item.CreatedAt || item.createdAt || '',
          updatedAt: item.UpdatedAt || item.updatedAt || '',
          // 层级信息
  
          parentId: item.ParentId?.toString() || item.parentId?.toString(),
          // 分组信息 - 基于type生成category
          category: item.Category || item.category || type,
          categoryDisplay: item.CategoryDisplay || item.categoryDisplay || 
            (type === 'Menu' ? '菜单权限' : 
             type === 'Action' ? '操作权限' : 'API权限'),
          // 显示信息
          displayInfo: {
            typeIcon: type === 'Menu' ? 'menu' : 
                     type === 'Action' ? 'action' : 'api',
            typeColor: type === 'Menu' ? 'blue' : 
                      type === 'Action' ? 'green' : 'orange',
            fullPath: `${resource}/${item.Code || item.code || ''}`
          }
        };
      });
      
      // console.log('✅ [UserManagementService] 成功获取角色权限:', permissions.length, '个');
      return {
        success: true,
        data: permissions,
        message: '获取成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] getRolePermissions error:', error);
      return {
        success: false,
        error: `获取角色权限失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 创建权限
   */
  async createPermission(permissionData: { code: string; name: string; type: string; resource?: string; parentId?: number }): Promise<ServiceResponse<Permission>> {
    try {
      // console.log('📡 [UserManagementService] 创建权限:', permissionData);
      
      if (!permissionData.code?.trim()) {
        return {
          success: false,
          error: '权限代码不能为空'
        };
      }
      if (!permissionData.name?.trim()) {
        return {
          success: false,
          error: '权限名称不能为空'
        };
      }

      const response = await apiClient.post('/permissions', permissionData);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '创建权限失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendPermission = response.data as any;
      
      // 计算权限级别：基于权限类型和资源路径层级
      let level = 1;
      const type = backendPermission.Type || backendPermission.type || 'Menu';
      const resource = backendPermission.Resource || backendPermission.resource || '';
      
      // 根据类型设置基础级别
      if (type === 'Menu') level = 1;
      else if (type === 'Action') level = 2;
      else if (type === 'Api') level = 3;
      
      // 根据资源路径增加级别
      if (resource) {
        const pathDepth = resource.split('/').filter(Boolean).length;
        level = Math.min(level + pathDepth, 5); // 最高5级
      }
      
      const permission: Permission = {
        id: backendPermission.Id?.toString() || backendPermission.id?.toString() || '',
        code: backendPermission.Code || backendPermission.code || '',
        name: backendPermission.Name || backendPermission.name || '',
        type: type as 'Menu' | 'Action' | 'Api',
        resource: resource,
        description: backendPermission.Description || backendPermission.description || '',
        isActive: backendPermission.IsActive !== undefined ? backendPermission.IsActive : (backendPermission.isActive !== undefined ? backendPermission.isActive : true),
        createdAt: backendPermission.CreatedAt || backendPermission.createdAt || '',
        updatedAt: backendPermission.UpdatedAt || backendPermission.updatedAt || '',
        // 层级信息

        parentId: backendPermission.ParentId?.toString() || backendPermission.parentId?.toString(),
        // 分组信息 - 基于type生成category
        category: backendPermission.Category || backendPermission.category || type,
        categoryDisplay: backendPermission.CategoryDisplay || backendPermission.categoryDisplay || 
          (type === 'Menu' ? '菜单权限' : 
           type === 'Action' ? '操作权限' : 'API权限'),
        // 显示信息
        displayInfo: {
          typeIcon: type === 'Menu' ? 'menu' : 
                   type === 'Action' ? 'action' : 'api',
          typeColor: type === 'Menu' ? 'blue' : 
                    type === 'Action' ? 'green' : 'orange',
          fullPath: `${resource}/${backendPermission.Code || backendPermission.code || ''}`
        }
      };
      
      // console.log('✅ [UserManagementService] 成功创建权限:', permission.name);
      return {
        success: true,
        data: permission,
        message: '创建成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] createPermission error:', error);
      return {
        success: false,
        error: `创建权限失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 更新权限
   */
  async updatePermission(id: string, permissionData: { code: string; name: string; type: string; resource?: string; parentId?: number }): Promise<ServiceResponse<Permission>> {
    try {
      // console.log('📡 [UserManagementService] 更新权限:', id, permissionData);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '权限ID不能为空'
        };
      }

      const response = await apiClient.put(`/permissions/${id}`, permissionData);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '更新权限失败'
        };
      }

      // 直接使用后端数据，不使用DTO映射
      const backendPermission = response.data as any;
      
      // 计算权限级别：基于权限类型和资源路径层级
      let level = 1;
      const type = backendPermission.Type || backendPermission.type || 'Menu';
      const resource = backendPermission.Resource || backendPermission.resource || '';
      
      // 根据类型设置基础级别
      if (type === 'Menu') level = 1;
      else if (type === 'Action') level = 2;
      else if (type === 'Api') level = 3;
      
      // 根据资源路径增加级别
      if (resource) {
        const pathDepth = resource.split('/').filter(Boolean).length;
        level = Math.min(level + pathDepth, 5); // 最高5级
      }
      
      const permission: Permission = {
        id: backendPermission.Id?.toString() || backendPermission.id?.toString() || '',
        code: backendPermission.Code || backendPermission.code || '',
        name: backendPermission.Name || backendPermission.name || '',
        type: type as 'Menu' | 'Action' | 'Api',
        resource: resource,
        description: backendPermission.Description || backendPermission.description || '',
        isActive: backendPermission.IsActive !== undefined ? backendPermission.IsActive : (backendPermission.isActive !== undefined ? backendPermission.isActive : true),
        createdAt: backendPermission.CreatedAt || backendPermission.createdAt || '',
        updatedAt: backendPermission.UpdatedAt || backendPermission.updatedAt || '',
        // 层级信息

        parentId: backendPermission.ParentId?.toString() || backendPermission.parentId?.toString(),
        // 分组信息 - 基于type生成category
        category: backendPermission.Category || backendPermission.category || type,
        categoryDisplay: backendPermission.CategoryDisplay || backendPermission.categoryDisplay || 
          (type === 'Menu' ? '菜单权限' : 
           type === 'Action' ? '操作权限' : 'API权限'),
        // 显示信息
        displayInfo: {
          typeIcon: type === 'Menu' ? 'menu' : 
                   type === 'Action' ? 'action' : 'api',
          typeColor: type === 'Menu' ? 'blue' : 
                    type === 'Action' ? 'green' : 'orange',
          fullPath: `${resource}/${backendPermission.Code || backendPermission.code || ''}`
        }
      };
      
      // console.log('✅ [UserManagementService] 成功更新权限:', permission.name);
      return {
        success: true,
        data: permission,
        message: '更新成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] updatePermission error:', error);
      return {
        success: false,
        error: `更新权限失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 删除权限
   */
  async deletePermission(id: string): Promise<ServiceResponse<boolean>> {
    try {
      // console.log('📡 [UserManagementService] 删除权限:', id);
      
      if (!id?.trim()) {
        return {
          success: false,
          error: '权限ID不能为空'
        };
      }

      const response = await apiClient.delete(`/permissions/${id}`);
      
      if (!response.success) {
        console.error('❌ [UserManagementService] API请求失败:', response.error);
        return {
          success: false,
          error: response.error || '删除权限失败'
        };
      }

      // console.log('✅ [UserManagementService] 成功删除权限:', id);
      return {
        success: true,
        data: true,
        message: '删除成功'
      };
      
    } catch (error) {
      console.error('❌ [UserManagementService] deletePermission error:', error);
      return {
        success: false,
        error: `删除权限失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// 创建默认实例
export const userManagementService = new UserManagementService();