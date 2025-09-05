using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 角色实体
    /// </summary>
    [Table("Roles")]
    public class Role
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 角色编码（唯一）
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// 角色名称
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

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
        /// 角色拥有的权限列表
        /// </summary>
        [NotMapped]
        public List<Permission> Permissions { get; set; } = new();

        /// <summary>
        /// 拥有此角色的用户数量
        /// </summary>
        [NotMapped]
        public int UserCount { get; set; }

        #endregion
    }
}