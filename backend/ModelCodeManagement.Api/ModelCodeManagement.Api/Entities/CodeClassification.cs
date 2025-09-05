using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 代码分类实体 (1-内层, 2-薄板, 3-载盘等) - 仅3层结构使用
    /// </summary>
    [Table("CodeClassifications")]
    public class CodeClassification
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 代码 (1-内层, 2-薄板, 3-载盘等)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 名称
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 机型分类ID (关联到ModelClassifications)
        /// </summary>
        public int ModelClassificationId { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 关联的机型分类
        /// </summary>
        public virtual ModelClassification? ModelClassification { get; set; }

        /// <summary>
        /// 关联的代码使用记录列表
        /// </summary>
        public virtual ICollection<CodeUsageEntry> CodeUsageEntries { get; set; } = new List<CodeUsageEntry>();

        /// <summary>
        /// 从代码中提取数字部分 (如："1-内层" -> 1)
        /// </summary>
        public int ExtractNumberFromCode()
        {
            var parts = Code.Split('-');
            if (parts.Length > 0 && int.TryParse(parts[0], out int number))
            {
                return number;
            }
            return 0;
        }
    }
}