using System.ComponentModel.DataAnnotations;

namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 战情中心数据响应DTO
    /// </summary>
    public class WarRoomDataDto
    {
        /// <summary>
        /// 年度新增机型数据
        /// </summary>
        public List<YearlyNewModelsDto> YearlyNewModels { get; set; } = new();

        /// <summary>
        /// 规划占用数据
        /// </summary>
        public List<PlanningUsageDto> PlanningUsage { get; set; } = new();

        /// <summary>
        /// 机型码余量数据
        /// </summary>
        public List<ModelCodeRemainingDto> ModelCodeRemaining { get; set; } = new();

        /// <summary>
        /// 新增代码清单数据
        /// </summary>
        public Dictionary<string, ModelNewCodeDataDto> NewCodeData { get; set; } = new();
    }

    /// <summary>
    /// 年度新增机型数据DTO
    /// </summary>
    public class YearlyNewModelsDto
    {
        /// <summary>
        /// 年份
        /// </summary>
        public int Year { get; set; }

        /// <summary>
        /// SLU机型数量
        /// </summary>
        public int SLU { get; set; }

        /// <summary>
        /// SLUR机型数量
        /// </summary>
        public int SLUR { get; set; }

        /// <summary>
        /// SB机型数量
        /// </summary>
        public int SB { get; set; }

        /// <summary>
        /// ST机型数量
        /// </summary>
        public int ST { get; set; }

        /// <summary>
        /// AC机型数量
        /// </summary>
        public int AC { get; set; }
    }

    /// <summary>
    /// 规划占用数据DTO
    /// </summary>
    public class PlanningUsageDto
    {
        /// <summary>
        /// 机型类型
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 规划数量
        /// </summary>
        public int Planning { get; set; }

        /// <summary>
        /// 工令数量
        /// </summary>
        public int WorkOrder { get; set; }

        /// <summary>
        /// 暂停数量
        /// </summary>
        public int Pause { get; set; }
    }

    /// <summary>
    /// 机型码余量数据DTO
    /// </summary>
    public class ModelCodeRemainingDto
    {
        /// <summary>
        /// 机型类型
        /// </summary>
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 剩余数量
        /// </summary>
        public int Remaining { get; set; }

        /// <summary>
        /// 总容量
        /// </summary>
        public int Total { get; set; }

        /// <summary>
        /// 使用率百分比
        /// </summary>
        public double UsageRate { get; set; }
    }

    /// <summary>
    /// 机型新增代码数据DTO
    /// </summary>
    public class ModelNewCodeDataDto
    {
        /// <summary>
        /// 总数据条数
        /// </summary>
        public int TotalItems { get; set; }

        /// <summary>
        /// 代码清单
        /// </summary>
        public List<CodeEntryDto> Items { get; set; } = new();
    }

    /// <summary>
    /// 代码条目DTO
    /// </summary>
    public class CodeEntryDto
    {
        /// <summary>
        /// 编号ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 机型编号
        /// </summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// 代码编号
        /// </summary>
        public string CodeNumber { get; set; } = string.Empty;

        /// <summary>
        /// 产品名称
        /// </summary>
        public string ProductName { get; set; } = string.Empty;

        /// <summary>
        /// 占用类型
        /// </summary>
        public string OccupancyType { get; set; } = string.Empty;

        /// <summary>
        /// 建档人
        /// </summary>
        public string Builder { get; set; } = string.Empty;

        /// <summary>
        /// 创建日期
        /// </summary>
        public DateTime CreationDate { get; set; }
    }

    /// <summary>
    /// 战情中心查询参数DTO
    /// </summary>
    public class WarRoomQueryDto
    {
        /// <summary>
        /// 开始日期
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// 结束日期
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// 机型类型筛选
        /// </summary>
        public string? ModelType { get; set; }

        /// <summary>
        /// 时间范围类型
        /// </summary>
        public string? TimePeriod { get; set; } = "recent_month";
    }

    /// <summary>
    /// 新增代码查询参数DTO
    /// </summary>
    public class NewCodeQueryDto
    {
        /// <summary>
        /// 机型类型
        /// </summary>
        [Required]
        public string ModelType { get; set; } = string.Empty;

        /// <summary>
        /// 页面索引
        /// </summary>
        public int PageIndex { get; set; } = 1;

        /// <summary>
        /// 页面大小
        /// </summary>
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// 开始日期
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// 结束日期
        /// </summary>
        public DateTime? EndDate { get; set; }
    }
}