using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ModelCodeManagement.Api.Entities
{
    /// <summary>
    /// 审计日志实体
    /// </summary>
    [Table("audit_logs")]
    public class AuditLog
    {
        /// <summary>
        /// 日志ID
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }
        
        /// <summary>
        /// 操作用户ID
        /// </summary>
        [Column("user_id")]
        public int UserId { get; set; }
        
        /// <summary>
        /// 操作用户名
        /// </summary>
        [Column("username")]
        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;
        
        /// <summary>
        /// 操作类型（Create/Update/Delete/Login/Logout等）
        /// </summary>
        [Column("action")]
        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;
        
        /// <summary>
        /// 实体类型（ProductType/ModelClassification等）
        /// </summary>
        [Column("entity_type")]
        [MaxLength(100)]
        public string? EntityType { get; set; }
        
        /// <summary>
        /// 实体ID
        /// </summary>
        [Column("entity_id")]
        public int? EntityId { get; set; }
        
        /// <summary>
        /// 操作描述
        /// </summary>
        [Column("description")]
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// 变更前数据（JSON格式）
        /// </summary>
        [Column("old_value", TypeName = "text")]
        public string? OldValue { get; set; }
        
        /// <summary>
        /// 变更后数据（JSON格式）
        /// </summary>
        [Column("new_value", TypeName = "text")]
        public string? NewValue { get; set; }
        
        /// <summary>
        /// IP地址
        /// </summary>
        [Column("ip_address")]
        [MaxLength(50)]
        public string? IpAddress { get; set; }
        
        /// <summary>
        /// 用户代理
        /// </summary>
        [Column("user_agent")]
        [MaxLength(500)]
        public string? UserAgent { get; set; }
        
        /// <summary>
        /// 请求路径
        /// </summary>
        [Column("request_path")]
        [MaxLength(200)]
        public string? RequestPath { get; set; }
        
        /// <summary>
        /// HTTP方法
        /// </summary>
        [Column("http_method")]
        [MaxLength(10)]
        public string? HttpMethod { get; set; }
        
        /// <summary>
        /// 操作结果（Success/Failed）
        /// </summary>
        [Column("result")]
        [Required]
        [MaxLength(20)]
        public string Result { get; set; } = "Success";
        
        /// <summary>
        /// 错误信息
        /// </summary>
        [Column("error_message")]
        [MaxLength(500)]
        public string? ErrorMessage { get; set; }
        
        /// <summary>
        /// 操作时间
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        /// <summary>
        /// 执行时长（毫秒）
        /// </summary>
        [Column("duration_ms")]
        public int? DurationMs { get; set; }
    }
}