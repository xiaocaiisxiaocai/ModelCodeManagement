using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// Refresh Token实体
    /// </summary>
    [Table("RefreshTokens")]
    public class RefreshToken
    {
        /// <summary>
        /// ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// Token值（唯一标识）
        /// </summary>
        [Required]
        [MaxLength(128)]
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// 关联的用户ID
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// 关联的JWT Token ID (jti)
        /// </summary>
        [Required]
        [MaxLength(64)]
        public string JwtId { get; set; } = string.Empty;

        /// <summary>
        /// 过期时间
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// 是否已使用
        /// </summary>
        public bool IsUsed { get; set; } = false;

        /// <summary>
        /// 是否已撤销
        /// </summary>
        public bool IsRevoked { get; set; } = false;

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        /// <summary>
        /// 使用时间
        /// </summary>
        public DateTime? UsedAt { get; set; }

        /// <summary>
        /// 创建时的IP地址
        /// </summary>
        [MaxLength(45)]
        public string? IpAddress { get; set; }

        /// <summary>
        /// 创建时的User Agent
        /// </summary>
        [MaxLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>
        /// 导航属性：关联用户
        /// </summary>
        [NotMapped]
        public User? User { get; set; }

        /// <summary>
        /// 检查是否有效
        /// </summary>
        [NotMapped]
        public bool IsValid => !IsUsed && !IsRevoked && ExpiresAt > DateTime.UtcNow;
    }
}