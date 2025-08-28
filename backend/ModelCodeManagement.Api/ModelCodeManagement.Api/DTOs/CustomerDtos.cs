using System.ComponentModel.DataAnnotations;

namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 客户响应DTO - 匹配前端Customer接口
    /// </summary>
    public class CustomerDto
    {
        public string Id { get; set; } = string.Empty; // 前端使用string类型
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 创建客户DTO
    /// </summary>
    public class CreateCustomerDto
    {
        [Required(ErrorMessage = "客户名称不能为空")]
        [StringLength(200, ErrorMessage = "客户名称不能超过200个字符")]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 更新客户DTO
    /// </summary>
    public class UpdateCustomerDto
    {
        [Required(ErrorMessage = "客户名称不能为空")]
        [StringLength(200, ErrorMessage = "客户名称不能超过200个字符")]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 厂区响应DTO - 匹配前端Factory接口
    /// </summary>
    public class FactoryDto
    {
        public string Id { get; set; } = string.Empty; // 前端使用string类型
        public string Name { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty; // 前端使用string类型
    }

    /// <summary>
    /// 创建厂区DTO
    /// </summary>
    public class CreateFactoryDto
    {
        [Required(ErrorMessage = "厂区名称不能为空")]
        [StringLength(200, ErrorMessage = "厂区名称不能超过200个字符")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "客户ID不能为空")]
        public int CustomerId { get; set; }
    }

    /// <summary>
    /// 更新厂区DTO
    /// </summary>
    public class UpdateFactoryDto
    {
        [Required(ErrorMessage = "厂区名称不能为空")]
        [StringLength(200, ErrorMessage = "厂区名称不能超过200个字符")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "客户ID不能为空")]
        public int CustomerId { get; set; }
    }

    /// <summary>
    /// 品名字典响应DTO - 匹配前端ProductNameDict接口
    /// </summary>
    public class ProductNameDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 占用类型响应DTO - 匹配前端OccupancyTypeDict接口
    /// </summary>
    public class OccupancyTypeDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// 机型分类字典响应DTO - 匹配前端ModelTypeDict接口
    /// </summary>
    public class ModelTypeDictDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string[] Description { get; set; } = new string[0];
        public string ProductType { get; set; } = string.Empty;
    }
}