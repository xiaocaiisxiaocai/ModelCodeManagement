namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 产品类型DTO
    /// </summary>
    public class ProductTypeDto
    {
        /// <summary>
        /// ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 产品代码 (PCB, FPC等)
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 关联的机型分类数量
        /// </summary>
        public int ModelClassificationCount { get; set; }
    }

    /// <summary>
    /// 创建产品类型DTO
    /// </summary>
    public class CreateProductTypeDto
    {
        /// <summary>
        /// 产品代码 (PCB, FPC等)
        /// </summary>
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// 更新产品类型DTO
    /// </summary>
    public class UpdateProductTypeDto
    {
        /// <summary>
        /// 产品代码 (PCB, FPC等)
        /// </summary>
        public string Code { get; set; } = string.Empty;
    }
}