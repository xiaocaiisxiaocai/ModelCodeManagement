using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 用户实体
    /// </summary>
    [Table("Users")]
    public class User
    {
        /// <summary>
        /// 主键ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 工号
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string EmployeeId { get; set; } = string.Empty;

        /// <summary>
        /// 用户名
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// 密码哈希
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>
        /// 邮箱
        /// </summary>
        [MaxLength(200)]
        public string? Email { get; set; }

        // 角色信息已移除，改为通过UserRoles关联表管理多角色

        /// <summary>
        /// 所属部门
        /// </summary>
        [MaxLength(100)]
        public string? Department { get; set; }

        /// <summary>
        /// 所属组织ID
        /// </summary>
        public int? OrganizationId { get; set; }

        /// <summary>
        /// 职位
        /// </summary>
        [MaxLength(100)]
        public string? Position { get; set; }

        /// <summary>
        /// 直属上级ID
        /// </summary>
        public int? SuperiorId { get; set; }

        /// <summary>
        /// 手机号
        /// </summary>
        [MaxLength(20)]
        public string? Phone { get; set; }

        /// <summary>
        /// 入职时间
        /// </summary>
        public DateTime? JoinDate { get; set; }

        /// <summary>
        /// 用户状态（Active-正常, Locked-锁定, Resigned-离职）
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// 最后登录时间
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        #region 导航属性

        /// <summary>
        /// 所属组织
        /// </summary>
        [ForeignKey(nameof(OrganizationId))]
        public Organization? Organization { get; set; }

        /// <summary>
        /// 直属上级
        /// </summary>
        [ForeignKey(nameof(SuperiorId))]
        public User? Superior { get; set; }

        /// <summary>
        /// 下属列表
        /// </summary>
        [InverseProperty(nameof(Superior))]
        public List<User> Subordinates { get; set; } = new();

        /// <summary>
        /// 用户角色关联列表
        /// </summary>
        public List<UserRole> UserRoles { get; set; } = new();

        /// <summary>
        /// 用户角色列表（通过UserRoles获取）
        /// </summary>
        [NotMapped]
        public List<Role> Roles => UserRoles?.Select(ur => ur.Role).Where(r => r != null).Cast<Role>().ToList() ?? new();

        /// <summary>
        /// 用户权限列表（通过角色获得的所有权限）
        /// </summary>
        [NotMapped]
        public List<Permission> Permissions { get; set; } = new();

        #endregion
    }
}