using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 角色权限关联实体
    /// </summary>
    [Table("RolePermissions")]
    public class RolePermission
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 角色ID
        /// </summary>
        public int RoleId { get; set; }

        /// <summary>
        /// 权限ID
        /// </summary>
        public int PermissionId { get; set; }

        /// <summary>
        /// 分配时间
        /// </summary>
        public DateTime AssignedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 分配者ID
        /// </summary>
        public int? AssignedBy { get; set; }

        #region 导航属性

        /// <summary>
        /// 角色信息
        /// </summary>
        [ForeignKey(nameof(RoleId))]
        public Role? Role { get; set; }

        /// <summary>
        /// 权限信息
        /// </summary>
        [ForeignKey(nameof(PermissionId))]
        public Permission? Permission { get; set; }

        /// <summary>
        /// 分配者信息
        /// </summary>
        [ForeignKey(nameof(AssignedBy))]
        public User? AssignedByUser { get; set; }

        #endregion
    }
}