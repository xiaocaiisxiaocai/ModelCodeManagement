namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 编码可用性检查结果DTO
    /// </summary>
    public class CodeAvailabilityDto
    {
        /// <summary>
        /// 是否可用
        /// </summary>
        public bool IsAvailable { get; set; }

        /// <summary>
        /// 消息
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// 完整编码
        /// </summary>
        public string FullCode { get; set; } = string.Empty;

        /// <summary>
        /// 冲突信息
        /// </summary>
        public object? ConflictInfo { get; set; }
    }

    /// <summary>
    /// 编码统计DTO
    /// </summary>
    public class CodeStatsDto
    {
        /// <summary>
        /// 总编码数
        /// </summary>
        public int TotalCodes { get; set; }

        /// <summary>
        /// 已使用编码数
        /// </summary>
        public int UsedCodes { get; set; }

        /// <summary>
        /// 可用编码数
        /// </summary>
        public int AvailableCodes { get; set; }

        /// <summary>
        /// 使用率
        /// </summary>
        public decimal UsageRate { get; set; }

        /// <summary>
        /// 按机型分类的统计
        /// </summary>
        public Dictionary<string, int> ByModelClassification { get; set; } = new();

        /// <summary>
        /// 按代码分类的统计
        /// </summary>
        public Dictionary<string, int> ByCodeClassification { get; set; } = new();
    }

    /// <summary>
    /// 权限树节点DTO
    /// </summary>
    public class PermissionTreeNodeDto
    {
        /// <summary>
        /// 权限ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 权限代码
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 权限名称
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 权限类型
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// 层级
        /// </summary>
        public int Level { get; set; }

        /// <summary>
        /// 父级ID
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 图标
        /// </summary>
        public string? Icon { get; set; }

        /// <summary>
        /// 资源路径
        /// </summary>
        public string? Resource { get; set; }

        /// <summary>
        /// 是否选中
        /// </summary>
        public bool Checked { get; set; } = false;

        /// <summary>
        /// 子权限列表
        /// </summary>
        public List<PermissionTreeNodeDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 组织架构树节点DTO
    /// </summary>
    public class OrganizationTreeNodeDto
    {
        /// <summary>
        /// 组织ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 组织名称
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 组织类型
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// 层级
        /// </summary>
        public int Level { get; set; }

        /// <summary>
        /// 父级ID
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 排序顺序
        /// </summary>
        public int SortOrder { get; set; }

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 员工数量
        /// </summary>
        public int EmployeeCount { get; set; }

        /// <summary>
        /// 子组织列表
        /// </summary>
        public List<OrganizationTreeNodeDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 角色权限分配DTO
    /// </summary>
    public class AssignRolePermissionsDto
    {
        /// <summary>
        /// 权限ID列表
        /// </summary>
        public List<int> PermissionIds { get; set; } = new();
    }

    /// <summary>
    /// 用户角色分配DTO
    /// </summary>
    public class AssignUserRolesDto
    {
        /// <summary>
        /// 角色ID列表
        /// </summary>
        public List<int> RoleIds { get; set; } = new();
    }

    /// <summary>
    /// 仪表板统计DTO
    /// </summary>
    public class DashboardStatsDto
    {
        /// <summary>
        /// 总用户数
        /// </summary>
        public int TotalUsers { get; set; }

        /// <summary>
        /// 活跃用户数
        /// </summary>
        public int ActiveUsers { get; set; }

        /// <summary>
        /// 总产品类型数
        /// </summary>
        public int TotalProductTypes { get; set; }

        /// <summary>
        /// 总机型分类数
        /// </summary>
        public int TotalModelClassifications { get; set; }

        /// <summary>
        /// 总编码使用数
        /// </summary>
        public int TotalCodeUsages { get; set; }

        /// <summary>
        /// 今日新增编码数
        /// </summary>
        public int TodayNewCodes { get; set; }

        /// <summary>
        /// 本月新增编码数
        /// </summary>
        public int MonthlyNewCodes { get; set; }

        /// <summary>
        /// 编码使用趋势 (最近7天)
        /// </summary>
        public Dictionary<string, int> CodeUsageTrend { get; set; } = new();

        /// <summary>
        /// 按产品类型分布
        /// </summary>
        public Dictionary<string, int> CodesByProductType { get; set; } = new();
    }

    /// <summary>
    /// 批量操作结果DTO
    /// </summary>
    public class BatchOperationResultDto
    {
        /// <summary>
        /// 成功数量
        /// </summary>
        public int SuccessCount { get; set; }

        /// <summary>
        /// 失败数量
        /// </summary>
        public int FailureCount { get; set; }

        /// <summary>
        /// 失败数量 (兼容性属性)
        /// </summary>
        public int FailedCount
        {
            get => FailureCount;
            set => FailureCount = value;
        }

        /// <summary>
        /// 总记录数
        /// </summary>
        public int TotalRecords { get; set; }

        /// <summary>
        /// 是否成功
        /// </summary>
        public bool IsSuccess => FailureCount == 0;

        /// <summary>
        /// 操作消息
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// 错误详情
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// 失败记录详情
        /// </summary>
        public List<BatchOperationFailedRecordDto> FailedRecords { get; set; } = new();

        /// <summary>
        /// 操作详情
        /// </summary>
        public List<object> Details { get; set; } = new();
    }

    /// <summary>
    /// 批量操作失败记录DTO
    /// </summary>
    public class BatchOperationFailedRecordDto
    {
        /// <summary>
        /// 记录ID或标识
        /// </summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// 失败原因
        /// </summary>
        public string Reason { get; set; } = string.Empty;

        /// <summary>
        /// 错误消息 (兼容性属性)
        /// </summary>
        public string ErrorMessage
        {
            get => Reason;
            set => Reason = value;
        }

        /// <summary>
        /// 记录数据
        /// </summary>
        public object? Data { get; set; }
    }
}