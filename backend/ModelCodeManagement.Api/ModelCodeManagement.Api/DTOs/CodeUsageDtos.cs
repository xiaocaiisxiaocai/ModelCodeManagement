namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 编码使用DTO
    /// </summary>
    public class CodeUsageEntryDto
    {
        /// <summary>
        /// ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 完整编码
        /// </summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// 机型类型
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 代码分类 (如"1-内层")
        /// </summary>
        public string? CodeClassification { get; set; }

        /// <summary>
        /// 实际编号
        /// </summary>
        public string ActualNumber { get; set; } = string.Empty;

        /// <summary>
        /// 延伸码
        /// </summary>
        public string? Extension { get; set; }

        /// <summary>
        /// 品名
        /// </summary>
        public string? ProductName { get; set; }

        /// <summary>
        /// 说明
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// 占用类型
        /// </summary>
        public string? OccupancyType { get; set; }

        /// <summary>
        /// 占用类型显示名称
        /// </summary>
        public string? OccupancyTypeDisplay { get; set; }

        /// <summary>
        /// 客户ID
        /// </summary>
        public int? CustomerId { get; set; }

        /// <summary>
        /// 客户名称
        /// </summary>
        public string? Customer { get; set; }

        /// <summary>
        /// 厂区ID
        /// </summary>
        public int? FactoryId { get; set; }

        /// <summary>
        /// 厂区名称
        /// </summary>
        public string? Factory { get; set; }

        /// <summary>
        /// 建档人
        /// </summary>
        public string? Builder { get; set; }

        /// <summary>
        /// 需求人
        /// </summary>
        public string? Requester { get; set; }

        /// <summary>
        /// 创建日期
        /// </summary>
        public DateOnly? CreationDate { get; set; }

        /// <summary>
        /// 是否已分配
        /// </summary>
        public bool IsAllocated { get; set; }

        /// <summary>
        /// 是否删除
        /// </summary>
        public bool IsDeleted { get; set; }

        /// <summary>
        /// 删除原因
        /// </summary>
        public string? DeletedReason { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// 分配编码DTO
    /// </summary>
    public class AllocateCodeDto
    {
        /// <summary>
        /// 延伸码
        /// </summary>
        public string? Extension { get; set; }

        /// <summary>
        /// 品名
        /// </summary>
        public string? ProductName { get; set; }

        /// <summary>
        /// 说明
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// 占用类型 (规划/暂停/工令)
        /// </summary>
        public string? OccupancyType { get; set; }

        /// <summary>
        /// 客户ID
        /// </summary>
        public int? CustomerId { get; set; }

        /// <summary>
        /// 厂区ID
        /// </summary>
        public int? FactoryId { get; set; }

        /// <summary>
        /// 建档人
        /// </summary>
        public string? Builder { get; set; }

        /// <summary>
        /// 需求人
        /// </summary>
        public string? Requester { get; set; }

        /// <summary>
        /// 创建日期
        /// </summary>
        public DateOnly? CreationDate { get; set; }
    }

    /// <summary>
    /// 手动创建编码DTO (2层结构专用)
    /// </summary>
    public class CreateManualCodeDto
    {
        /// <summary>
        /// 机型分类ID
        /// </summary>
        public int ModelClassificationId { get; set; }

        /// <summary>
        /// 编号部分 (如 001)
        /// </summary>
        public string NumberPart { get; set; } = string.Empty;

        /// <summary>
        /// 延伸码
        /// </summary>
        public string? Extension { get; set; }

        /// <summary>
        /// 品名
        /// </summary>
        public string? ProductName { get; set; }

        /// <summary>
        /// 说明
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// 占用类型 (规划/暂停/工令)
        /// </summary>
        public string? OccupancyType { get; set; }


        /// <summary>
        /// 建档人
        /// </summary>
        public string? Builder { get; set; }

        /// <summary>
        /// 需求人
        /// </summary>
        public string? Requester { get; set; }

        /// <summary>
        /// 创建日期
        /// </summary>
        public DateOnly? CreationDate { get; set; }
    }

    /// <summary>
    /// 创建编码使用记录DTO
    /// </summary>
    public class CreateCodeUsageDto
    {
        /// <summary>
        /// 机型类型
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 代码分类编号
        /// </summary>
        public int? CodeClassificationNumber { get; set; }

        /// <summary>
        /// 实际编号
        /// </summary>
        public string ActualNumber { get; set; } = string.Empty;

        /// <summary>
        /// 延伸码
        /// </summary>
        public string? Extension { get; set; }

        /// <summary>
        /// 品名
        /// </summary>
        public string? ProductName { get; set; }

        /// <summary>
        /// 说明
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// 占用类型
        /// </summary>
        public string? OccupancyType { get; set; }

        /// <summary>
        /// 客户ID
        /// </summary>
        public int? CustomerId { get; set; }

        /// <summary>
        /// 厂区ID
        /// </summary>
        public int? FactoryId { get; set; }

        /// <summary>
        /// 建档人
        /// </summary>
        public string? Builder { get; set; }

        /// <summary>
        /// 需求人
        /// </summary>
        public string? Requester { get; set; }
    }

    /// <summary>
    /// 更新编码使用DTO
    /// </summary>
    public class UpdateCodeUsageDto
    {
        /// <summary>
        /// 延伸码
        /// </summary>
        public string? Extension { get; set; }

        /// <summary>
        /// 品名
        /// </summary>
        public string? ProductName { get; set; }

        /// <summary>
        /// 说明
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// 占用类型 (规划/暂停/工令)
        /// </summary>
        public string? OccupancyType { get; set; }


        /// <summary>
        /// 建档人
        /// </summary>
        public string? Builder { get; set; }

        /// <summary>
        /// 需求人
        /// </summary>
        public string? Requester { get; set; }

        /// <summary>
        /// 创建日期
        /// </summary>
        public DateOnly? CreationDate { get; set; }
    }

    /// <summary>
    /// 编码查询DTO
    /// </summary>
    public class CodeUsageQueryDto : QueryDto
    {
        /// <summary>
        /// 机型分类ID
        /// </summary>
        public int? ModelClassificationId { get; set; }

        /// <summary>
        /// 代码分类ID
        /// </summary>
        public int? CodeClassificationId { get; set; }

        /// <summary>
        /// 是否已分配 (null=全部, true=已分配, false=未分配)
        /// </summary>
        public bool? IsAllocated { get; set; }

        /// <summary>
        /// 占用类型
        /// </summary>
        public string? OccupancyType { get; set; }

        /// <summary>
        /// 是否包含删除的记录
        /// </summary>
        public bool IncludeDeleted { get; set; } = false;
    }



    /// <summary>
    /// 验证手动编码DTO
    /// </summary>
    public class ValidateManualCodeDto
    {
        /// <summary>
        /// 机型类型
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 编号部分
        /// </summary>
        public string NumberPart { get; set; } = string.Empty;

        /// <summary>
        /// 延伸码
        /// </summary>
        public string? Extension { get; set; }
    }

    /// <summary>
    /// 更新占用类型DTO
    /// </summary>
    public class UpdateOccupancyTypeDto
    {
        /// <summary>
        /// 编码使用ID
        /// </summary>
        public int CodeUsageId { get; set; }

        /// <summary>
        /// 占用类型
        /// </summary>
        public string OccupancyType { get; set; } = string.Empty;
    }

    /// <summary>
    /// 批量删除未使用编码DTO
    /// </summary>
    public class BatchDeleteUnusedCodesDto
    {
        /// <summary>
        /// 机型分类ID（可选）
        /// </summary>
        public int? ModelClassificationId { get; set; }

        /// <summary>
        /// 代码分类ID（可选）
        /// </summary>
        public int? CodeClassificationId { get; set; }

        /// <summary>
        /// 指定编码ID列表（可选）
        /// </summary>
        public List<int>? CodeIds { get; set; }

        /// <summary>
        /// 删除原因
        /// </summary>
        public string? Reason { get; set; }
    }


}