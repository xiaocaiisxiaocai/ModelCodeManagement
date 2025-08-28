using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 机型分类实体 (SLU-, SLUR-, SB-, ST-, AC-等)
    /// </summary>
    [Table("ModelClassifications")]
    public class ModelClassification
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 机型类型 (SLU-, SLUR-, SB-, ST-, AC-等)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;


        /// <summary>
        /// 描述信息 (EF Core会自动处理JSON转换)
        /// </summary>
        public List<string> Description { get; set; } = new();

        /// <summary>
        /// 产品类型ID (关联到ProductTypes)
        /// </summary>
        [Required]
        [ForeignKey("ProductType")]
        public int ProductTypeId { get; set; }

        /// <summary>
        /// 是否有代码分类层 (true=3层结构, false=2层结构)
        /// </summary>
        public bool HasCodeClassification { get; set; } = true;


        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 关联的产品类型
        /// </summary>
        public virtual ProductType? ProductType { get; set; }

        /// <summary>
        /// 关联的代码分类列表
        /// </summary>
        public virtual ICollection<CodeClassification> CodeClassifications { get; set; } = new List<CodeClassification>();

        /// <summary>
        /// 关联的代码使用记录列表
        /// </summary>
        public virtual ICollection<CodeUsageEntry> CodeUsageEntries { get; set; } = new List<CodeUsageEntry>();
    }
}