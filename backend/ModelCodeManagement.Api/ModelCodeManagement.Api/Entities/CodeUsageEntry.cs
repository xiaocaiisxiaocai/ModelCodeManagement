using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 编码使用记录实体 - 核心表
    /// </summary>
    [Table("CodeUsageEntries")]
    public class CodeUsageEntry
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        #region 编码组成部分

        /// <summary>
        /// 完整编码 (如: SLU-105A, AC-001B)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// 机型类型 (SLU-, AC-等) - 来自ModelClassifications.Type
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 代码分类数字 (1, 2, 3等) - 来自CodeClassifications，2层结构时为NULL
        /// </summary>
        public int? CodeClassificationNumber { get; set; }

        /// <summary>
        /// 实际编号 (05, 001等)
        /// </summary>
        [Required]
        [MaxLength(10)]
        public string ActualNumber { get; set; } = string.Empty;

        /// <summary>
        /// 延伸码 (A, B等)
        /// </summary>
        [MaxLength(10)]
        public string? Extension { get; set; }

        #endregion

        #region 关联字段

        /// <summary>
        /// 机型分类ID (关联ModelClassifications)
        /// </summary>
        public int ModelClassificationId { get; set; }

        /// <summary>
        /// 代码分类ID (关联CodeClassifications) - 2层结构时为NULL
        /// </summary>
        public int? CodeClassificationId { get; set; }

        #endregion

        #region 业务字段

        /// <summary>
        /// 品名
        /// </summary>
        [MaxLength(200)]
        public string? ProductName { get; set; }

        /// <summary>
        /// 说明
        /// </summary>
        [Column(TypeName = "TEXT")]
        public string? Description { get; set; }

        /// <summary>
        /// 占用类型 (规划/暂停/工令)
        /// </summary>
        [MaxLength(20)]
        public string? OccupancyType { get; set; }

        /// <summary>
        /// 客户ID (关联DataDictionary，Category='Customer')
        /// </summary>
        public int? CustomerId { get; set; }

        /// <summary>
        /// 厂区ID (关联DataDictionary，Category='Factory')
        /// </summary>
        public int? FactoryId { get; set; }

        /// <summary>
        /// 建档人
        /// </summary>
        [MaxLength(100)]
        public string? Builder { get; set; }

        /// <summary>
        /// 需求人
        /// </summary>
        [MaxLength(100)]
        public string? Requester { get; set; }

        /// <summary>
        /// 创建日期
        /// </summary>
        public DateOnly? CreationDate { get; set; }

        #endregion

        #region 状态字段

        /// <summary>
        /// 是否已分配 (false=预分配, true=已使用)
        /// </summary>
        public bool IsAllocated { get; set; } = false;

        /// <summary>
        /// 是否删除
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// 删除原因
        /// </summary>
        [MaxLength(200)]
        public string? DeletedReason { get; set; }

        /// <summary>
        /// 创建时的编号位数
        /// </summary>
        public int NumberDigits { get; set; } = 2;

        #endregion

        #region 审计字段

        /// <summary>
        /// 创建人ID
        /// </summary>
        public int? CreatedBy { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        #endregion

        #region 导航属性

        /// <summary>
        /// 关联的机型分类
        /// </summary>
        [NotMapped]
        public ModelClassification? ModelClassification { get; set; }

        /// <summary>
        /// 关联的代码分类
        /// </summary>
        [NotMapped]
        public CodeClassification? CodeClassification { get; set; }

        /// <summary>
        /// 关联的客户数据字典
        /// </summary>
        public DataDictionary? Customer { get; set; }

        /// <summary>
        /// 关联的厂区数据字典
        /// </summary>
        public DataDictionary? Factory { get; set; }

        #endregion
    }
}