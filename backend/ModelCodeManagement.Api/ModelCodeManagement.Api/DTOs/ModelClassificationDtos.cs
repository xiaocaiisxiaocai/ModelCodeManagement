namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 机型分类DTO
    /// </summary>
    public class ModelClassificationDto
    {
        /// <summary>
        /// ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 机型类型 (SLU-, SLUR-等)
        /// </summary>
        public string Type { get; set; } = string.Empty;


        /// <summary>
        /// 描述数组
        /// </summary>
        public List<string> Description { get; set; } = new();

        /// <summary>
        /// 产品类型代码 (PCB/FPC)
        /// </summary>
        public string ProductType { get; set; } = string.Empty;

        /// <summary>
        /// 产品类型ID
        /// </summary>
        public int ProductTypeId { get; set; }

        /// <summary>
        /// 是否有代码分类层 (3层/2层结构)
        /// </summary>
        public bool HasCodeClassification { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 代码分类数量
        /// </summary>
        public int CodeClassificationCount { get; set; }

        /// <summary>
        /// 代码使用记录数量
        /// </summary>
        public int CodeUsageCount { get; set; }
    }

    /// <summary>
    /// 创建机型分类DTO
    /// </summary>
    public class CreateModelClassificationDto
    {
        /// <summary>
        /// 机型类型 (SLU-, SLUR-等)
        /// </summary>
        public string Type { get; set; } = string.Empty;


        /// <summary>
        /// 描述数组
        /// </summary>
        public List<string> Description { get; set; } = new();

        /// <summary>
        /// 产品类型ID
        /// </summary>
        public int ProductTypeId { get; set; }

        /// <summary>
        /// 是否有代码分类层
        /// </summary>
        public bool HasCodeClassification { get; set; } = true;
    }

    /// <summary>
    /// 更新机型分类DTO
    /// </summary>
    public class UpdateModelClassificationDto
    {
        /// <summary>
        /// 机型类型 (SLU-, SLUR-等)
        /// </summary>
        public string Type { get; set; } = string.Empty;


        /// <summary>
        /// 描述数组
        /// </summary>
        public List<string> Description { get; set; } = new();

        /// <summary>
        /// 产品类型ID
        /// </summary>
        public int ProductTypeId { get; set; }

        /// <summary>
        /// 是否有代码分类层
        /// </summary>
        public bool HasCodeClassification { get; set; }
    }
}