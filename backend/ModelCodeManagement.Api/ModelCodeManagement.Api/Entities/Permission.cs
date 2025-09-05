using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 权限实体
    /// </summary>
    [Table("Permissions")]
    public class Permission
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 权限编码（唯一）
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 权限名称
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 权限类型（Menu-菜单, Action-操作, Api-接口）
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = "Action";

        /// <summary>
        /// 资源标识（如：/api/v1/users, ProductType.Create）
        /// </summary>
        [MaxLength(200)]
        public string? Resource { get; set; }

        /// <summary>
        /// 操作类型（Create, Read, Update, Delete, List, Export等）
        /// </summary>
        [MaxLength(50)]
        public string? Action { get; set; }

        /// <summary>
        /// 父级权限ID（用于构建权限树）
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 权限路径（如：/1/2/3/）
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Path { get; set; } = string.Empty;



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
        /// 父级权限
        /// </summary>
        [NotMapped]
        public Permission? Parent { get; set; }

        /// <summary>
        /// 子级权限列表
        /// </summary>
        [NotMapped]
        public List<Permission> Children { get; set; } = new();

        #endregion
    }
}