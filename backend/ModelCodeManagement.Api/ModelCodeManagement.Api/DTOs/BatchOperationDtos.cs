namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 批量创建产品类型DTO
    /// </summary>
    public class BatchCreateProductTypesDto
    {
        /// <summary>
        /// 产品类型列表
        /// </summary>
        public List<CreateProductTypeDto> ProductTypes { get; set; } = new();

        /// <summary>
        /// 是否跳过重复项
        /// </summary>
        public bool SkipDuplicates { get; set; } = true;
    }

    /// <summary>
    /// 批量创建机型分类DTO
    /// </summary>
    public class BatchCreateModelClassificationsDto
    {
        /// <summary>
        /// 机型分类列表
        /// </summary>
        public List<CreateModelClassificationDto> ModelClassifications { get; set; } = new();

        /// <summary>
        /// 是否跳过重复项
        /// </summary>
        public bool SkipDuplicates { get; set; } = true;
    }

    /// <summary>
    /// 批量创建代码分类DTO
    /// </summary>
    public class BatchCreateCodeClassificationsDto
    {
        /// <summary>
        /// 代码分类列表
        /// </summary>
        public List<CreateCodeClassificationDto> CodeClassifications { get; set; } = new();

        /// <summary>
        /// 是否跳过重复项
        /// </summary>
        public bool SkipDuplicates { get; set; } = true;

        /// <summary>
        /// 是否自动预分配编码
        /// </summary>
        public bool AutoPreAllocate { get; set; } = true;
    }

    /// <summary>
    /// 批量导入编码使用记录DTO
    /// </summary>
    public class BatchImportCodeUsageDto
    {
        /// <summary>
        /// 编码使用记录列表
        /// </summary>
        public List<ImportCodeUsageEntryDto> CodeUsageEntries { get; set; } = new();

        /// <summary>
        /// 是否跳过重复项
        /// </summary>
        public bool SkipDuplicates { get; set; } = true;

        /// <summary>
        /// 是否验证编码格式
        /// </summary>
        public bool ValidateFormat { get; set; } = true;

        /// <summary>
        /// 是否自动创建缺失的分类
        /// </summary>
        public bool AutoCreateClassifications { get; set; } = false;
    }

    /// <summary>
    /// 导入编码使用记录DTO
    /// </summary>
    public class ImportCodeUsageEntryDto
    {
        /// <summary>
        /// 完整编码
        /// </summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// 机型类型
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 代码分类代码（可选，3层结构时必填）
        /// </summary>
        public string? CodeClassificationCode { get; set; }

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
        public string? CreationDate { get; set; }
    }

    /// <summary>
    /// 批量更新占用类型DTO
    /// </summary>
    public class BatchUpdateOccupancyTypesDto
    {
        /// <summary>
        /// 编码ID列表
        /// </summary>
        public List<int> CodeIds { get; set; } = new();

        /// <summary>
        /// 新的占用类型
        /// </summary>
        public string OccupancyType { get; set; } = string.Empty;

        /// <summary>
        /// 更新原因
        /// </summary>
        public string? Reason { get; set; }
    }

    /// <summary>
    /// 批量软删除编码DTO
    /// </summary>
    public class BatchSoftDeleteCodesDto
    {
        /// <summary>
        /// 编码ID列表
        /// </summary>
        public List<int> CodeIds { get; set; } = new();

        /// <summary>
        /// 删除原因
        /// </summary>
        public string Reason { get; set; } = string.Empty;
    }

    /// <summary>
    /// 批量恢复编码DTO
    /// </summary>
    public class BatchRestoreCodesDto
    {
        /// <summary>
        /// 编码ID列表
        /// </summary>
        public List<int> CodeIds { get; set; } = new();

        /// <summary>
        /// 恢复原因
        /// </summary>
        public string? Reason { get; set; }
    }

    /// <summary>
    /// 编码使用导出查询DTO
    /// </summary>
    public class CodeUsageExportQueryDto
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
        /// 是否已分配
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

        /// <summary>
        /// 开始日期
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// 结束日期
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// 关键字搜索
        /// </summary>
        public string? Keyword { get; set; }
    }

    /// <summary>
    /// 导出查询DTO
    /// </summary>
    public class ExportQueryDto
    {
        /// <summary>
        /// 产品类型ID
        /// </summary>
        public int? ProductTypeId { get; set; }

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool? IsActive { get; set; }

        /// <summary>
        /// 关键字搜索
        /// </summary>
        public string? Keyword { get; set; }
    }

    /// <summary>
    /// 导出文件DTO
    /// </summary>
    public class ExportFileDto
    {
        /// <summary>
        /// 文件内容
        /// </summary>
        public byte[] FileContent { get; set; } = Array.Empty<byte>();

        /// <summary>
        /// 文件名
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// 内容类型
        /// </summary>
        public string ContentType { get; set; } = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    /// <summary>
    /// 批量操作历史DTO
    /// </summary>
    public class BatchOperationHistoryDto
    {
        /// <summary>
        /// ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 操作类型
        /// </summary>
        public string OperationType { get; set; } = string.Empty;

        /// <summary>
        /// 操作描述
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// 成功数量
        /// </summary>
        public int SuccessCount { get; set; }

        /// <summary>
        /// 失败数量
        /// </summary>
        public int FailureCount { get; set; }

        /// <summary>
        /// 总数量
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// 操作人ID
        /// </summary>
        public int? OperatorId { get; set; }

        /// <summary>
        /// 操作人姓名
        /// </summary>
        public string? OperatorName { get; set; }

        /// <summary>
        /// 操作时间
        /// </summary>
        public DateTime OperatedAt { get; set; }

        /// <summary>
        /// 执行时长（毫秒）
        /// </summary>
        public long ExecutionTimeMs { get; set; }

        /// <summary>
        /// 操作结果
        /// </summary>
        public string? Result { get; set; }

        /// <summary>
        /// 错误信息
        /// </summary>
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// 验证批量导入DTO
    /// </summary>
    public class ValidateBatchImportDto
    {
        /// <summary>
        /// 导入类型
        /// </summary>
        public string ImportType { get; set; } = string.Empty;

        /// <summary>
        /// 导入数据
        /// </summary>
        public List<Dictionary<string, object>> ImportData { get; set; } = new();

        /// <summary>
        /// 是否严格验证
        /// </summary>
        public bool StrictValidation { get; set; } = true;
    }

    /// <summary>
    /// 批量导入验证结果DTO
    /// </summary>
    public class BatchImportValidationResultDto
    {
        /// <summary>
        /// 总记录数
        /// </summary>
        public int TotalRecords { get; set; }

        /// <summary>
        /// 有效记录数
        /// </summary>
        public int ValidRecords { get; set; }

        /// <summary>
        /// 无效记录数
        /// </summary>
        public int InvalidRecords { get; set; }

        /// <summary>
        /// 重复记录数
        /// </summary>
        public int DuplicateRecordCount { get; set; }

        /// <summary>
        /// 验证是否通过
        /// </summary>
        public bool IsValid { get; set; }

        /// <summary>
        /// 验证错误列表
        /// </summary>
        public List<ValidationErrorDto> ValidationErrors { get; set; } = new();

        /// <summary>
        /// 重复记录列表
        /// </summary>
        public List<DuplicateRecordDto> DuplicateRecords { get; set; } = new();

        /// <summary>
        /// 验证摘要
        /// </summary>
        public string Summary { get; set; } = string.Empty;
    }

    /// <summary>
    /// 验证错误DTO
    /// </summary>
    public class ValidationErrorDto
    {
        /// <summary>
        /// 行号
        /// </summary>
        public int RowIndex { get; set; }

        /// <summary>
        /// 字段名
        /// </summary>
        public string FieldName { get; set; } = string.Empty;

        /// <summary>
        /// 字段值
        /// </summary>
        public string? FieldValue { get; set; }

        /// <summary>
        /// 错误消息
        /// </summary>
        public string ErrorMessage { get; set; } = string.Empty;

        /// <summary>
        /// 错误类型
        /// </summary>
        public string ErrorType { get; set; } = string.Empty;
    }

    /// <summary>
    /// 重复记录DTO
    /// </summary>
    public class DuplicateRecordDto
    {
        /// <summary>
        /// 行号
        /// </summary>
        public int RowIndex { get; set; }

        /// <summary>
        /// 重复字段
        /// </summary>
        public string DuplicateField { get; set; } = string.Empty;

        /// <summary>
        /// 重复值
        /// </summary>
        public string DuplicateValue { get; set; } = string.Empty;

        /// <summary>
        /// 与现有记录的冲突描述
        /// </summary>
        public string ConflictDescription { get; set; } = string.Empty;
    }
}