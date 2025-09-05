using System.ComponentModel.DataAnnotations;

namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 权限查询DTO
    /// </summary>
    public class PermissionQueryDto : QueryDto
    {
        /// <summary>
        /// 权限类型
        /// </summary>
        public string? Type { get; set; }

        /// <summary>
        /// 父级权限ID
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 是否包含子级
        /// </summary>
        public bool IncludeChildren { get; set; } = false;
    }

    /// <summary>
    /// 权限响应DTO
    /// </summary>
    public class PermissionDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Resource { get; set; }
        public string? Action { get; set; }
        public int? ParentId { get; set; }
        public string Path { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }

        // 扩展信息
        public string? ParentName { get; set; }
        public List<PermissionDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 创建权限DTO
    /// </summary>
    public class CreatePermissionDto
    {
        [Required(ErrorMessage = "权限编码不能为空")]
        [StringLength(100, ErrorMessage = "权限编码长度不能超过100个字符")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "权限名称不能为空")]
        [StringLength(100, ErrorMessage = "权限名称长度不能超过100个字符")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "权限类型不能为空")]
        [StringLength(20, ErrorMessage = "权限类型长度不能超过20个字符")]
        public string Type { get; set; } = "Action";

        [StringLength(200, ErrorMessage = "资源标识长度不能超过200个字符")]
        public string? Resource { get; set; }

        [StringLength(50, ErrorMessage = "操作类型长度不能超过50个字符")]
        public string? Action { get; set; }

        public int? ParentId { get; set; }
    }

    /// <summary>
    /// 更新权限DTO
    /// </summary>
    public class UpdatePermissionDto
    {
        [Required(ErrorMessage = "权限编码不能为空")]
        [StringLength(100, ErrorMessage = "权限编码长度不能超过100个字符")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "权限名称不能为空")]
        [StringLength(100, ErrorMessage = "权限名称长度不能超过100个字符")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "权限类型不能为空")]
        [StringLength(20, ErrorMessage = "权限类型长度不能超过20个字符")]
        public string Type { get; set; } = "Action";

        [StringLength(200, ErrorMessage = "资源标识长度不能超过200个字符")]
        public string? Resource { get; set; }

        [StringLength(50, ErrorMessage = "操作类型长度不能超过50个字符")]
        public string? Action { get; set; }
    }

    /// <summary>
    /// 权限树DTO
    /// </summary>
    public class PermissionTreeDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public List<PermissionTreeDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 移动权限DTO
    /// </summary>
    public class MovePermissionDto
    {
        public int? TargetParentId { get; set; }
    }
}