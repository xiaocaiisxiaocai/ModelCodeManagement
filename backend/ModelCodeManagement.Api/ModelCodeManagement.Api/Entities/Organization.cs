using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 组织架构实体（部门树形结构）
    /// </summary>
    [Table("Organizations")]
    public class Organization
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }



        /// <summary>
        /// 组织名称
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 组织类型（Company-公司, Department-部门, Team-团队）
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = "Department";

        /// <summary>
        /// 父级组织ID（根节点为null）
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 组织层级路径（如：/1/2/3/）
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Path { get; set; } = string.Empty;

        /// <summary>
        /// 组织层级（从1开始）
        /// </summary>
        public int Level { get; set; } = 1;

        /// <summary>
        /// 排序顺序
        /// </summary>
        public int SortOrder { get; set; } = 0;

        /// <summary>
        /// 负责人用户ID
        /// </summary>
        public int? ManagerId { get; set; }

        /// <summary>
        /// 组织描述
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// 联系电话
        /// </summary>
        [MaxLength(50)]
        public string? Phone { get; set; }

        /// <summary>
        /// 联系邮箱
        /// </summary>
        [MaxLength(100)]
        public string? Email { get; set; }

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; } = true;

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

        #region 导航属性（不映射到数据库）

        /// <summary>
        /// 父级组织
        /// </summary>
        [NotMapped]
        public Organization? Parent { get; set; }

        /// <summary>
        /// 子级组织列表
        /// </summary>
        [NotMapped]
        public List<Organization> Children { get; set; } = new();

        /// <summary>
        /// 负责人信息
        /// </summary>
        [NotMapped]
        public User? Manager { get; set; }

        /// <summary>
        /// 组织下的用户数量
        /// </summary>
        [NotMapped]
        public int UserCount { get; set; }

        #endregion
    }
}