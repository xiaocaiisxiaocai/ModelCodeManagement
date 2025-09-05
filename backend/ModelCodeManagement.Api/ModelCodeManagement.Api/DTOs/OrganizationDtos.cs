using System.ComponentModel.DataAnnotations;

namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 组织架构查询DTO
    /// </summary>
    public class OrganizationQueryDto : QueryDto
    {
        /// <summary>
        /// 组织类型
        /// </summary>
        public string? Type { get; set; }

        /// <summary>
        /// 父级组织ID
        /// </summary>
        public int? ParentId { get; set; }

        /// <summary>
        /// 是否只查询启用的
        /// </summary>
        public new bool? IsActive { get; set; }

        /// <summary>
        /// 是否包含子级
        /// </summary>
        public bool IncludeChildren { get; set; } = false;
    }

    /// <summary>
    /// 组织架构响应DTO
    /// </summary>
    public class OrganizationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public string Path { get; set; } = string.Empty;
        public int Level { get; set; }
        public int SortOrder { get; set; }
        public int? ManagerId { get; set; }
        public string? Description { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }

        // 扩展信息
        public string? ParentName { get; set; }
        public string? ManagerName { get; set; }
        public int UserCount { get; set; }
        public List<OrganizationDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 创建组织架构DTO
    /// </summary>
    public class CreateOrganizationDto
    {
        [Required(ErrorMessage = "组织名称不能为空")]
        [StringLength(100, ErrorMessage = "组织名称长度不能超过100个字符")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "组织类型不能为空")]
        [StringLength(20, ErrorMessage = "组织类型长度不能超过20个字符")]
        public string Type { get; set; } = "Department";

        public int? ParentId { get; set; }

        public int SortOrder { get; set; } = 0;

        public int? ManagerId { get; set; }

        [StringLength(500, ErrorMessage = "描述长度不能超过500个字符")]
        public string? Description { get; set; }

        [StringLength(50, ErrorMessage = "电话长度不能超过50个字符")]
        public string? Phone { get; set; }

        [StringLength(100, ErrorMessage = "邮箱长度不能超过100个字符")]
        [EmailAddress(ErrorMessage = "邮箱格式不正确")]
        public string? Email { get; set; }

        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// 更新组织架构DTO
    /// </summary>
    public class UpdateOrganizationDto
    {
        [Required(ErrorMessage = "组织名称不能为空")]
        [StringLength(100, ErrorMessage = "组织名称长度不能超过100个字符")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "组织类型不能为空")]
        [StringLength(20, ErrorMessage = "组织类型长度不能超过20个字符")]
        public string Type { get; set; } = "Department";

        public int SortOrder { get; set; } = 0;

        public int? ManagerId { get; set; }

        [StringLength(500, ErrorMessage = "描述长度不能超过500个字符")]
        public string? Description { get; set; }

        [StringLength(50, ErrorMessage = "电话长度不能超过50个字符")]
        public string? Phone { get; set; }

        [StringLength(100, ErrorMessage = "邮箱长度不能超过100个字符")]
        [EmailAddress(ErrorMessage = "邮箱格式不正确")]
        public string? Email { get; set; }

        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// 组织架构树DTO
    /// </summary>
    public class OrganizationTreeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public int Level { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public int UserCount { get; set; }
        public List<OrganizationTreeDto> Children { get; set; } = new();
    }

    /// <summary>
    /// 移动组织架构DTO
    /// </summary>
    public class MoveOrganizationDto
    {
        [Required(ErrorMessage = "目标父级组织ID不能为空")]
        public int? TargetParentId { get; set; }

        public int SortOrder { get; set; } = 0;
    }
}