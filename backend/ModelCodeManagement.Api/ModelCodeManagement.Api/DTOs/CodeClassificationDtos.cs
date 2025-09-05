namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 代码分类DTO
    /// </summary>
    public class CodeClassificationDto
    {
        /// <summary>
        /// ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 代码 (1-内层, 2-薄板等)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 名称
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 机型类型 (SLU-)
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 机型分类ID
        /// </summary>
        public int ModelClassificationId { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 代码使用记录数量
        /// </summary>
        public int CodeUsageCount { get; set; }

        /// <summary>
        /// 已分配数量
        /// </summary>
        public int AllocatedCount { get; set; }

        /// <summary>
        /// 可用数量
        /// </summary>
        public int AvailableCount { get; set; }
    }

    /// <summary>
    /// 创建代码分类DTO
    /// </summary>
    public class CreateCodeClassificationDto
    {
        /// <summary>
        /// 代码 (1-内层, 2-薄板等)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 名称
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 机型分类ID
        /// </summary>
        public int ModelClassificationId { get; set; }
    }

    /// <summary>
    /// 更新代码分类DTO
    /// </summary>
    public class UpdateCodeClassificationDto
    {
        /// <summary>
        /// 代码 (1-内层, 2-薄板等)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 名称
        /// </summary>
        public string Name { get; set; } = string.Empty;
    }
}