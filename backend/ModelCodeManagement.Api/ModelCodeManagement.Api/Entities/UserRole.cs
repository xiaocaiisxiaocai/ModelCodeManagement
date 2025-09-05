using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 用户角色关联实体
    /// </summary>
    [Table("UserRoles")]
    public class UserRole
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 用户ID
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// 角色ID
        /// </summary>
        public int RoleId { get; set; }

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
        /// 用户信息
        /// </summary>
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        /// <summary>
        /// 角色信息
        /// </summary>
        [ForeignKey(nameof(RoleId))]
        public Role? Role { get; set; }

        /// <summary>
        /// 分配者信息
        /// </summary>
        [ForeignKey(nameof(AssignedBy))]
        public User? AssignedByUser { get; set; }

        #endregion
    }
}