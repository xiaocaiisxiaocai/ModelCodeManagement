using System.ComponentModel.DataAnnotations;

namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 角色查询DTO
    /// </summary>
    public class RoleQueryDto : QueryDto
    {
    }

    /// <summary>
    /// 角色响应DTO
    /// </summary>
    public class RoleDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }

        // 扩展信息
        public int UserCount { get; set; }
        public int PermissionCount { get; set; }
        public List<PermissionDto> Permissions { get; set; } = new();
    }

    /// <summary>
    /// 创建角色DTO
    /// </summary>
    public class CreateRoleDto
    {
        [Required(ErrorMessage = "角色编码不能为空")]
        [StringLength(50, ErrorMessage = "角色编码长度不能超过50个字符")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "角色名称不能为空")]
        [StringLength(100, ErrorMessage = "角色名称长度不能超过100个字符")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 权限ID列表
        /// </summary>
        public List<int> PermissionIds { get; set; } = new();
    }

    /// <summary>
    /// 更新角色DTO
    /// </summary>
    public class UpdateRoleDto
    {
        [Required(ErrorMessage = "角色编码不能为空")]
        [StringLength(50, ErrorMessage = "角色编码长度不能超过50个字符")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "角色名称不能为空")]
        [StringLength(100, ErrorMessage = "角色名称长度不能超过100个字符")]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 角色权限分配DTO
    /// </summary>
    public class AssignRolePermissionDto
    {
        [Required(ErrorMessage = "权限ID列表不能为空")]
        public List<int> PermissionIds { get; set; } = new();
    }

    /// <summary>
    /// 用户角色分配DTO
    /// </summary>
    public class AssignUserRoleDto
    {
        [Required(ErrorMessage = "用户ID列表不能为空")]
        public List<int> UserIds { get; set; } = new();
    }
}