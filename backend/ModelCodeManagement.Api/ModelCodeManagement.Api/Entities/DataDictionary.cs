using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 数据字典实体
    /// </summary>
    [Table("DataDictionaries")]
    public class DataDictionary
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 字典分类（如：OccupancyType, OperationType等）
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// 字典编码
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 字典名称
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 父级ID（用于层级关系，如厂区关联客户）
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 创建者ID
        /// </summary>
        public int? CreatedBy { get; set; }

        /// <summary>
        /// 更新者ID
        /// </summary>
        public int? UpdatedBy { get; set; }
    }
}