using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 代码预分配日志实体
    /// </summary>
    [Table("code_pre_allocation_logs")]
    public class CodePreAllocationLog
    {
        /// <summary>
        /// 日志ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }
        
        /// <summary>
        /// 机型分类ID
        /// </summary>
        [Column("model_classification_id")]
        public int ModelClassificationId { get; set; }
        
        /// <summary>
        /// 代码分类ID
        /// </summary>
        [Column("code_classification_id")]
        public int? CodeClassificationId { get; set; }
        
        /// <summary>
        /// 机型类型
        /// </summary>
        [Column("model_type")]
        [Required]
        [MaxLength(100)]
        public string ModelType { get; set; } = string.Empty;
        
        /// <summary>
        /// 分类编号
        /// </summary>
        [Column("classification_number")]
        [Required]
        [MaxLength(100)]
        public string ClassificationNumber { get; set; } = string.Empty;
        
        /// <summary>
        /// 分配数量
        /// </summary>
        [Column("allocation_count")]
        public int AllocationCount { get; set; }
        
        /// <summary>
        /// 数字位数
        /// </summary>
        [Column("number_digits")]
        public int NumberDigits { get; set; }
        
        /// <summary>
        /// 起始代码
        /// </summary>
        [Column("start_code")]
        [Required]
        [MaxLength(100)]
        public string StartCode { get; set; } = string.Empty;
        
        /// <summary>
        /// 结束代码
        /// </summary>
        [Column("end_code")]
        [Required]
        [MaxLength(100)]
        public string EndCode { get; set; } = string.Empty;
        
        /// <summary>
        /// 创建者ID
        /// </summary>
        [Column("created_by")]
        public int CreatedBy { get; set; }
        
        /// <summary>
        /// 创建时间
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}