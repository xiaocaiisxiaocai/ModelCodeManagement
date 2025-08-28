using System.ComponentModel.DataAnnotations;

namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 数据字典查询DTO
    /// </summary>
    public class DataDictionaryQueryDto : QueryDto
    {
        /// <summary>
        /// 字典分类
        /// </summary>
        public string? Category { get; set; }
    }

    /// <summary>
    /// 数据字典响应DTO
    /// </summary>
    public class DataDictionaryDto
    {
        public int Id { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }
    }

    /// <summary>
    /// 创建数据字典DTO
    /// </summary>
    public class CreateDataDictionaryDto
    {
        [Required(ErrorMessage = "字典分类不能为空")]
        [StringLength(50, ErrorMessage = "字典分类长度不能超过50个字符")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "字典编码不能为空")]
        [StringLength(100, ErrorMessage = "字典编码长度不能超过100个字符")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "字典名称不能为空")]
        [StringLength(200, ErrorMessage = "字典名称长度不能超过200个字符")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 父级ID（用于层级关系，如厂区关联客户）
        /// </summary>
        public int? ParentId { get; set; }
    }

    /// <summary>
    /// 更新数据字典DTO
    /// </summary>
    public class UpdateDataDictionaryDto
    {
        [Required(ErrorMessage = "字典编码不能为空")]
        [StringLength(100, ErrorMessage = "字典编码长度不能超过100个字符")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "字典名称不能为空")]
        [StringLength(200, ErrorMessage = "字典名称长度不能超过200个字符")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// 父级ID（用于层级关系，如厂区关联客户）
        /// </summary>
        public int? ParentId { get; set; }
    }

    /// <summary>
    /// 数据字典选项DTO（用于下拉列表）
    /// </summary>
    public class DataDictionaryOptionDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 按分类分组的数据字典DTO
    /// </summary>
    public class DataDictionaryGroupDto
    {
        public string Category { get; set; } = string.Empty;
        public List<DataDictionaryOptionDto> Options { get; set; } = new();
    }
}