// domain.ts - 前端领域类型定义
/**
 * 前端领域类型定义
 * 优化用于UI展示和交互的数据结构
 * 与后端API类型分离，便于前端逻辑处理
 */

// ================================
// 基础领域类型 (UI友好)
// ================================

export interface DomainResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PagedDomainResponse<T> extends DomainResponse<T[]> {
  pagination: {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// 服务层响应类型（与DomainResponse兼容）
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PagedResponse<T> extends ServiceResponse<T[]> {
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// ================================
// 产品类型领域模型 (ProductType Domain)
// ================================

export interface ProductType {
  id: string;                          // UI中使用string便于处理
  code: string;                        // 产品代码: "PCB", "FPC", "HDI"
  createdAt: string;                   // 格式化的日期字符串 "2024-01-01"
  displayName: string;                 // 显示名称 (computed)
  isNew: boolean;                      // 是否是新创建的 (computed)
  
  // 关联数据 (按需加载)
  modelClassifications?: ModelClassification[];
  modelClassificationCount?: number;   // 关联的机型分类数量
}

export interface ProductTypeFormData {
  code: string;
  displayName?: string;                // 表单辅助字段
}

export interface ProductTypeListItem extends ProductType {
  summary: {
    modelClassificationCount: number;
    codeUsageCount: number;
    lastModified: string;
  };
}

// ================================
// 机型分类领域模型 (ModelClassification Domain)
// ================================

export interface ModelClassification {
  id: string;
  type: string;                        // "SLU", "SLUR", "AC" (不带-)
  typeWithSuffix: string;              // "SLU-", "SLUR-", "AC-" (UI显示用)
  description: string[];               // 描述列表
  descriptionText: string;             // 描述合并字符串 (computed)
  productTypeId: string;
  productTypeCode: string;             // 关联的产品类型代码 (computed)
  hasCodeClassification: boolean;      // 是否有代码分类层
  structureType: '2层' | '3层';        // 结构类型描述 (computed)
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  productType?: ProductType;
  codeClassifications?: CodeClassification[];
  codeUsageEntries?: CodeUsageEntry[];
  
  // 统计信息 (computed)
  stats: {
    codeClassificationCount: number;   // 代码分类数量
    codeUsageCount: number;           // 编码使用数量
    availableCodeCount: number;       // 可用编码数量
  };
}

export interface ModelClassificationFormData {
  type: string;
  description: string[];
  productTypeId: string;
  hasCodeClassification: boolean;
  descriptionInput?: string;           // 表单辅助字段
}

export interface ModelClassificationListItem extends ModelClassification {
  isActive: boolean;                   // 是否激活状态
  canDelete: boolean;                  // 是否可删除 (computed)
  warningMessages: string[];           // 警告信息 (computed)
}

// ================================
// 代码分类领域模型 (CodeClassification Domain)
// ================================

export interface CodeClassification {
  id: string;
  code: string;                        // "1", "2", "3"
  name: string;                        // "内层", "薄板", "载盘"
  displayName: string;                 // "1-内层" (computed)
  description?: string;
  modelClassificationId: string;
  modelClassificationType: string;     // 关联的机型分类类型 (computed)
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  modelClassification?: ModelClassification;
  
  // 统计信息 (computed)
  stats: {
    codeUsageCount: number;           // 编码使用数量
    availableCodeCount: number;       // 可用编码数量
    lastUsedDate?: string;            // 最后使用日期
  };
}

export interface CodeClassificationFormData {
  code: string;
  name: string;
  description?: string;
  modelClassificationId: string;
  sortOrder: number;
  displayNamePreview?: string;         // 表单辅助字段
}

// ================================
// 编码使用记录领域模型 (CodeUsageEntry Domain)
// ================================

export interface CodeUsageEntry {
  id: string;
  
  // 编码组成 (优化显示)
  model: string;                       // 完整编码 "SLU-105A"
  modelParts: {                        // 编码解析 (computed)
    prefix: string;                    // "SLU-"
    number: string;                    // "105"
    suffix?: string;                   // "A"
  };
  modelType: string;                   // "SLU-"
  modelTypeDisplay: string;            // "SLU" (不带-，用于显示)
  codeClassificationNumber?: number;   // 代码分类数字
  actualNumber: string;                // 实际编号 "05"
  extension?: string;                  // 延伸码 "A"
  
  // 业务字段 (UI优化)
  productName?: string;
  description?: string;
  occupancyType?: string;
  occupancyTypeDisplay?: string;       // 占用类型显示名 (computed)
  customerId?: number;                 // 客户ID
  customer?: string;                   // 客户名称 (computed)
  factoryId?: number;                  // 厂区ID
  factory?: string;                    // 厂区名称 (computed)
  builder?: string;
  requester?: string;
  creationDate?: string;               // 格式化日期 "2024-01-01"
  createdAt: string;
  
  // 状态字段 (UI友好)
  isAllocated: boolean;
  allocationStatus: 'planned' | 'allocated' | 'suspended';  // 分配状态 (computed)
  allocationStatusDisplay: string;     // "预分配" | "已分配" | "暂停" (computed)
  isDeleted: boolean;
  deletedReason?: string;
  
  // 关联数据
  modelClassificationId: string;
  codeClassificationId?: string;
  modelClassification?: ModelClassification;
  codeClassification?: CodeClassification;
  
  // 显示辅助 (computed)
  displayInfo: {
    fullPath: string;                  // 完整路径 "PCB > SLU- > 1-内层 > SLU-105A"
    shortPath: string;                 // 简短路径 "SLU-105A"
    statusBadge: {
      text: string;
      variant: 'success' | 'warning' | 'danger' | 'info';
    };
    createdTime: {
      formatted: string;               // "2024年1月1日"
      relative: string;                // "3天前"
    };
  };
}

export interface CodeUsageEntryFormData {
  model: string;
  modelType: string;
  codeClassificationNumber?: number;
  actualNumber: string;
  extension?: string;
  modelClassificationId: string;
  codeClassificationId?: string;
  productName?: string;
  description?: string;
  occupancyType?: string;
  builder?: string;
  requester?: string;
  creationDate?: string;
  
  // 表单辅助字段
  modelPreview?: string;               // 编码预览
  pathPreview?: string;                // 路径预览
}

export interface CodeUsageEntryListItem extends CodeUsageEntry {
  canEdit: boolean;                    // 是否可编辑 (computed)
  canDelete: boolean;                  // 是否可删除 (computed)
  canRestore: boolean;                 // 是否可恢复 (computed)
}

// ================================
// 用户认证领域模型 (User/Auth Domain)
// ================================

export interface User {
  id: string;
  employeeId: string;
  userName: string;                    // 用户名 (后端必填)
  name?: string;                       // 显示名称 (计算字段，通常等于userName)
  email?: string;
  department?: string;
  position?: string;
  phone?: string;
  
  // 状态信息
  status?: string;                     // Active/Locked/Resigned
  isActive?: boolean;
  
  // 组织信息
  organizationId?: number;
  organizationName?: string;           // 组织名称 (computed)
  
  // 权限信息 - 兼容两种格式
  role: string;                        // 单个角色: User/Admin/SuperAdmin (后端格式)
  roles?: string[];                    // 角色列表 (复杂权限系统)
  permissions?: string[];              // 权限列表
  
  // 时间信息
  joinDate?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // 显示辅助字段 (前端计算)
  password?: string;                   // 临时字段，用于表单
  displayInfo?: {                      // 可选的显示辅助信息
    fullName: string;                  // 显示名称
    avatar: string;                    // 头像URL或初始字母
    contactInfo: string;               // 联系信息摘要
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  
  // 权限检查辅助
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export interface LoginFormData {
  employeeId: string;
  password: string;
  rememberMe?: boolean;
}

// ================================
// 角色权限领域模型 (RBAC Domain)
// ================================

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  permissions?: Permission[];
  userCount?: number; // 使用该角色的用户数量
  permissionCount?: number; // 权限数量统计
  
  // 系统信息
  isSystem?: boolean; // 是否为系统内置角色
  
  // 显示信息
  displayInfo: {
    statusBadge: 'active' | 'inactive';
    statusColor: string;
    statusText: string;
  };
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  type: 'Menu' | 'Action' | 'Api';
  resource: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 层级信息
  parentId?: string; // 父权限ID
  
  // 分组信息
  category: string;
  categoryDisplay: string;
  
  // 显示信息
  displayInfo: {
    typeIcon: string;
    typeColor: string;
    fullPath: string; // 完整权限路径
  };
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
  
  // 关联数据
  user?: User;
  role?: Role;
}

// 创建和更新类型
export interface UserCreate {
  employeeId: string;
  name: string;
  password: string;
  email?: string;
  phoneNumber?: string;
  organizationId?: string;
  department?: string;
  position?: string;
  role: 'User' | 'Admin' | 'SuperAdmin';
  isActive?: boolean;
  remarks?: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  phoneNumber?: string;
  organizationId?: string;
  position?: string;
  role?: 'User' | 'Admin' | 'SuperAdmin';
  isActive?: boolean;
  remarks?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RoleCreate {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface PermissionCreate {
  code: string;
  name: string;
  type: 'Menu' | 'Action' | 'Api';
  resource: string;
  description?: string;
  isActive?: boolean;
}

export interface PermissionUpdate {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ================================
// 战情中心领域模型 (WarRoom Domain)
// ================================

export interface WarRoomData {
  // 年度新机型数据 (图表友好)
  yearlyNewModels: YearlyNewModelsData[];
  
  // 规划使用情况 (图表友好)
  planningUsage: PlanningUsageData[];
  
  // 机型代码剩余情况 (UI优化)
  modelCodeRemaining: ModelCodeRemainingData[];
  
  // 新增代码数据 (统计优化)
  newCodeData: Record<string, ModelNewCodeData>;
  
  // 汇总统计 (computed)
  summary: {
    totalModelTypes: number;
    totalCodesUsed: number;
    totalCodesRemaining: number;
    averageUsageRate: number;
    monthlyGrowthRate: number;
  };
  
  // 更新时间
  lastUpdated: string;
}

export interface YearRangeData {
  minYear: number;
  maxYear: number;
  availableYears: number[];
}

export interface YearlyNewModelsData {
  year: number;
  count: number;
  modelTypes?: string[];
  
  // UI显示优化
  yearDisplay: string;                 // "2024年"
  growthRate?: number;                 // 增长率 (computed)
  growthRateDisplay?: string;          // "+15%" (computed)
}

export interface PlanningUsageData {
  modelType: string;                   // "SLU"
  modelTypeDisplay: string;            // "SLU-" (UI显示)
  planning: number;
  workOrder: number;
  pause: number;
  
  // 计算字段 (computed)
  total: number;                       // 总计
  planningRate: number;                // 规划占比
  workOrderRate: number;               // 工令占比
  pauseRate: number;                   // 暂停占比
  
  // 显示优化
  displayData: {
    planningPercent: string;           // "65%"
    workOrderPercent: string;          // "25%"
    pausePercent: string;              // "10%"
    status: 'healthy' | 'warning' | 'danger';
  };
}

export interface ModelCodeRemainingData {
  modelType: string;                   // "SLU"
  modelTypeDisplay: string;            // "SLU-"
  total: number;
  used: number;
  remaining: number;
  usagePercentage: number;
  
  // 显示优化 (computed)
  displayData: {
    usageRate: string;                 // "75.5%"
    remainingRate: string;             // "24.5%"
    status: 'healthy' | 'warning' | 'danger';
    statusColor: string;               // CSS颜色值
    progressWidth: string;             // "75.5%"
  };
  
  // 预警信息 (computed)
  alerts: {
    level: 'info' | 'warning' | 'error';
    message: string;
  }[];
}

export interface ModelNewCodeData {
  modelType: string;
  modelTypeDisplay: string;            // UI显示优化
  newCodesThisMonth: number;
  newCodesThisYear: number;
  
  // 趋势计算 (computed)
  monthlyAverage: number;              // 月均新增
  yearlyProjection: number;            // 年度预测
  growthTrend: 'up' | 'down' | 'stable'; // 增长趋势
  
  // 显示优化
  displayData: {
    monthlyGrowth: string;             // "+15%"
    yearlyGrowth: string;              // "+180%"
    trendIcon: string;                 // 趋势图标
    trendColor: string;                // 趋势颜色
  };
}

// ================================
// 组织架构领域模型 (Organization Domain)
// ================================

export interface Organization {
  id: string;
  name: string;
  type: 'Company' | 'Division' | 'Department' | 'Section';
  typeDisplay: string;                 // 类型显示名
  parentId?: string;
  path: string;                        // "/1/3/5/"
  pathArray: string[];                 // ["1", "3", "5"] (computed)
  pathDisplay: string;                 // "集团公司 > 信息技术部 > 开发团队" (computed)
  level: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  parent?: Organization;
  children?: Organization[];
  
  // 统计信息（直接字段，方便访问）
  userCount: number;                   // 用户数量
  
  // 树形结构辅助 (computed)
  treeData: {
    hasChildren: boolean;
    isExpanded?: boolean;              // 展开状态 (UI控制)
    depth: number;                     // 缩进深度
    isLastChild: boolean;              // 是否最后一个子节点
  };
  
  // 统计信息 (computed)
  stats: {
    childrenCount: number;             // 子组织数量
    userCount: number;                 // 用户数量（与上面的userCount同步）
    descendantCount: number;           // 后代组织总数
  };
}

export interface OrganizationTreeNode extends Organization {
  expanded: boolean;                   // 展开状态
  selected: boolean;                   // 选中状态
  indentLevel: number;                 // 缩进级别
}

// ================================
// 通用分页和查询参数 (UI Domain)
// ================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  organizationId?: string;
  createdBy?: string;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
  label: string;                       // 显示标签
}

// ================================
// 表单和验证辅助类型
// ================================

export interface FormFieldError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'custom';
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
  warnings?: FormFieldError[];
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

// ================================
// 错误处理领域类型
// ================================

export interface DomainError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  userMessage: string;                 // 用户友好的错误消息
  severity: 'info' | 'warning' | 'error' | 'fatal';
  recoverable: boolean;                // 是否可恢复
  retryable: boolean;                  // 是否可重试
}

export interface ValidationError extends DomainError {
  field: string;
  value: any;
  rule: string;
}

// ================================
// UI状态管理类型
// ================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;                   // 0-100
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  notifications: Notification[];
  modals: ModalState[];
  loading: Record<string, LoadingState>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  duration?: number;                   // 自动关闭时间(ms)
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ModalState {
  id: string;
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  maskClosable?: boolean;
}

// ================================
// 数据字典领域模型 (DataDictionary Domain)
// ================================

export interface DataDictionary {
  id: string;
  category: string;                // 字典分类: Customer, Factory, ProductName, OccupancyType
  code: string;                    // 编码
  name: string;                    // 名称
  parentId?: string;               // 父级ID (用于层级关系)
  categoryDisplay: string;         // 分类显示名 (computed)
  hasParent: boolean;             // 是否有父级 (computed)
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  parent?: DataDictionary;
  children?: DataDictionary[];
  
  // 显示优化 (computed)
  displayInfo: {
    fullPath: string;              // 完整路径 "客户 > 厂区"
    categoryColor: string;         // 分类颜色
    categoryIcon: string;          // 分类图标
  };
}

export interface DataDictionaryFormData {
  category: string;
  code: string;
  name: string;
  parentId?: string;
}

export interface DataDictionaryListItem extends DataDictionary {
  canEdit: boolean;                // 是否可编辑 (computed)
  canDelete: boolean;              // 是否可删除 (computed)
  childrenCount: number;           // 子项数量 (computed)
}

// 兼容原有mock接口的类型
export interface Customer {
  id: string;
  name: string;
  
  // 扩展信息 (computed)
  factoryCount?: number;           // 厂区数量
  displayName: string;             // 显示名称
}

export interface Factory {
  id: string;
  name: string;
  customerId: string;              // 关联的客户ID
  
  // 关联数据
  customer?: Customer;
  customerName?: string;           // 客户名称 (computed)
  
  // 显示优化
  displayInfo: {
    fullPath: string;              // 完整路径 "客户名 > 厂区名"
    customerDisplay: string;       // 客户显示
  };
}

export interface ProductNameDict {
  id: string;
  name: string;
  
  // 统计信息 (computed)
  usageCount?: number;             // 使用次数
  displayName: string;             // 显示名称
}

export interface OccupancyTypeDict {
  id: string;
  name: string;
  
  // 显示优化
  displayName: string;             // 显示名称
  color: string;                   // 颜色 (computed)
  description?: string;            // 描述
}

export interface ModelTypeDict {
  id: string;
  type: string;                    // 机型类型 (e.g., "SLU-", "SLUR-")
  name: string;                    // 机型名称
  productType: string;             // 产品类型 (e.g., "PCB", "FPC")
  description: string[];           // 描述列表
  
  // 显示优化
  displayName: string;             // 显示名称 (computed)
  fullName: string;                // 完整名称 (computed)
  hasCodeClassification?: boolean; // 是否有代码分类
}

// 完整的数据字典对象 (兼容原有接口)
export interface DataDictionaryCollection {
  customers: Customer[];           // 客户字典
  factories: Factory[];            // 厂区字典 (与客户级联)
  productNames: ProductNameDict[]; // 品名字典
  occupancyTypes: OccupancyTypeDict[]; // 占用类型字典
  modelTypes: ModelTypeDict[];     // 机型分类字典 (如果需要)
}

// ================================
// 审计日志领域模型 (AuditLog Domain)
// ================================

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;                      // 操作类型: Create, Update, Delete, Login, Logout
  entityType?: string;                 // 实体类型: User, ProductType, ModelClassification, etc.
  entityId?: string;                   // 实体ID
  description: string;                 // 操作描述
  result: string;                      // 操作结果: Success, Failed
  oldValue?: string;                   // 变更前数据 (JSON字符串)
  newValue?: string;                   // 变更后数据 (JSON字符串)
  ipAddress?: string;                  // IP地址
  requestPath?: string;                // 请求路径
  userAgent?: string;                  // 用户代理
  errorMessage?: string;               // 错误消息 (如果失败)
  durationMs?: number;                 // 执行耗时(毫秒)
  createdAt: string;
  updatedAt: string;
  
  // 显示优化 (computed)
  displayInfo: {
    actionText: string;                // 中文操作名称
    resultBadge: 'success' | 'danger' | 'warning';
    actionBadge: 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'primary';
    entityTypeText: string;            // 中文实体类型
    timeDisplay: string;               // 格式化时间显示
    durationDisplay: string;           // 耗时显示 "123ms"
  };
  
  // 风险评估 (computed)
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];               // 风险因素列表
  
  // 变更分析 (computed, 仅在有新旧值时)
  changeAnalysis?: {
    fieldChanges: {
      field: string;
      oldValue: any;
      newValue: any;
      changeType: 'added' | 'removed' | 'modified';
    }[];
    changeCount: number;
    significantChanges: boolean;       // 是否有重要变更
  };
}