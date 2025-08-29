using Microsoft.EntityFrameworkCore;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Data;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 战情中心服务实现
    /// </summary>
    public class WarRoomService : IWarRoomService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WarRoomService> _logger;

        public WarRoomService(ApplicationDbContext context, ILogger<WarRoomService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ApiResponse<WarRoomDataDto>> GetWarRoomDataAsync(WarRoomQueryDto query)
        {
            try
            {
                // 设置默认时间范围
                var (startDate, endDate) = GetDateRange(query.StartDate, query.EndDate, query.TimePeriod);

                var warRoomData = new WarRoomDataDto
                {
                    YearlyNewModels = await GetYearlyNewModelsDataAsync(startDate.Year, endDate.Year),
                    PlanningUsage = await GetPlanningUsageDataAsync(startDate, endDate, query.ModelType),
                    ModelCodeRemaining = await GetModelCodeRemainingDataAsync(),
                    NewCodeData = await GetNewCodeDataAsync(startDate, endDate)
                };

                _logger.LogInformation("获取战情中心数据成功 - 时间范围: {StartDate} to {EndDate}", startDate, endDate);
                return ApiResponse<WarRoomDataDto>.SuccessResult(warRoomData, "获取战情中心数据成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取战情中心数据失败 - Query: {@Query}", query);
                return ApiResponse<WarRoomDataDto>.ErrorResult($"获取战情中心数据失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<YearlyNewModelsDto>>> GetYearlyNewModelsAsync(int? startYear = null, int? endYear = null)
        {
            try
            {
                var currentYear = DateTime.Now.Year;
                startYear ??= currentYear - 4; // 默认最近5年
                endYear ??= currentYear;

                var yearlyData = await GetYearlyNewModelsDataAsync(startYear.Value, endYear.Value);
                
                _logger.LogInformation("获取年度新增机型统计成功 - 年份范围: {StartYear}-{EndYear}", startYear, endYear);
                return ApiResponse<List<YearlyNewModelsDto>>.SuccessResult(yearlyData, "获取年度新增机型统计成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取年度新增机型统计失败 - StartYear: {StartYear}, EndYear: {EndYear}", startYear, endYear);
                return ApiResponse<List<YearlyNewModelsDto>>.ErrorResult($"获取年度新增机型统计失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<PlanningUsageDto>>> GetPlanningUsageAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var (start, end) = GetDateRange(startDate, endDate);
                var planningData = await GetPlanningUsageDataAsync(start, end);

                _logger.LogInformation("获取规划占用统计成功 - 时间范围: {StartDate} to {EndDate}", start, end);
                return ApiResponse<List<PlanningUsageDto>>.SuccessResult(planningData, "获取规划占用统计成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取规划占用统计失败 - StartDate: {StartDate}, EndDate: {EndDate}", startDate, endDate);
                return ApiResponse<List<PlanningUsageDto>>.ErrorResult($"获取规划占用统计失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<ModelCodeRemainingDto>>> GetModelCodeRemainingAsync()
        {
            try
            {
                var remainingData = await GetModelCodeRemainingDataAsync();

                _logger.LogInformation("获取机型码余量统计成功 - 机型数量: {Count}", remainingData.Count);
                return ApiResponse<List<ModelCodeRemainingDto>>.SuccessResult(remainingData, "获取机型码余量统计成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型码余量统计失败");
                return ApiResponse<List<ModelCodeRemainingDto>>.ErrorResult($"获取机型码余量统计失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<ModelNewCodeDataDto>> GetNewCodeDataByModelAsync(NewCodeQueryDto query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query.ModelType))
                {
                    return ApiResponse<ModelNewCodeDataDto>.ErrorResult("机型类型不能为空");
                }

                // 验证分页参数
                if (query.PageIndex <= 0) query.PageIndex = 1;
                if (query.PageSize <= 0) query.PageSize = 10;
                if (query.PageSize > 100) query.PageSize = 100;

                var (startDate, endDate) = GetDateRange(query.StartDate, query.EndDate);

                var queryable = _context.CodeUsageEntries
                    .Where(x => !x.IsDeleted && 
                               x.ModelType == query.ModelType &&
                               x.CreatedAt >= startDate &&
                               x.CreatedAt <= endDate)
                    .OrderByDescending(x => x.CreatedAt);

                var total = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(x => new CodeEntryDto
                    {
                        Id = x.Id,
                        Model = x.Model,
                        CodeNumber = x.ActualNumber,
                        ProductName = x.ProductName ?? "",
                        OccupancyType = x.OccupancyType ?? "",
                        Builder = x.Builder ?? "",
                        CreationDate = x.CreatedAt
                    })
                    .ToListAsync();

                var result = new ModelNewCodeDataDto
                {
                    TotalItems = total,
                    Items = items
                };

                _logger.LogInformation("获取机型新增代码数据成功 - ModelType: {ModelType}, Count: {Count}", query.ModelType, items.Count);
                return ApiResponse<ModelNewCodeDataDto>.SuccessResult(result, "获取机型新增代码数据成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取机型新增代码数据失败 - Query: {@Query}", query);
                return ApiResponse<ModelNewCodeDataDto>.ErrorResult($"获取机型新增代码数据失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<Dictionary<string, ModelNewCodeDataDto>>> GetDynamicNewCodeDataAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var (start, end) = GetDateRange(startDate, endDate);

                // 获取所有机型类型
                var modelTypes = await _context.ModelClassifications
                    .Select(x => x.Type)
                    .Distinct()
                    .ToListAsync();

                var result = new Dictionary<string, ModelNewCodeDataDto>();

                // 为每个机型类型获取数据
                foreach (var modelType in modelTypes)
                {
                    var items = await _context.CodeUsageEntries
                        .Where(x => !x.IsDeleted && 
                                   x.ModelType == modelType &&
                                   x.CreatedAt >= start &&
                                   x.CreatedAt <= end)
                        .OrderByDescending(x => x.CreatedAt)
                        .Take(10) // 每个机型最多取10条最新记录
                        .Select(x => new CodeEntryDto
                        {
                            Id = x.Id,
                            Model = x.Model,
                            CodeNumber = x.ActualNumber,
                            ProductName = x.ProductName ?? "",
                            OccupancyType = x.OccupancyType ?? "",
                            Builder = x.Builder ?? "",
                            CreationDate = x.CreatedAt
                        })
                        .ToListAsync();

                    var totalCount = await _context.CodeUsageEntries
                        .Where(x => !x.IsDeleted && 
                                   x.ModelType == modelType &&
                                   x.CreatedAt >= start &&
                                   x.CreatedAt <= end)
                        .CountAsync();

                    result[modelType] = new ModelNewCodeDataDto
                    {
                        TotalItems = totalCount,
                        Items = items
                    };
                }

                _logger.LogInformation("获取动态新增代码数据成功 - 机型数量: {Count}, 时间范围: {StartDate} to {EndDate}", 
                    result.Count, start, end);
                return ApiResponse<Dictionary<string, ModelNewCodeDataDto>>.SuccessResult(result, "获取动态新增代码数据成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取动态新增代码数据失败 - StartDate: {StartDate}, EndDate: {EndDate}", startDate, endDate);
                return ApiResponse<Dictionary<string, ModelNewCodeDataDto>>.ErrorResult($"获取动态新增代码数据失败: {ex.Message}");
            }
        }

        #region 私有辅助方法

        /// <summary>
        /// 获取日期范围
        /// </summary>
        private (DateTime startDate, DateTime endDate) GetDateRange(DateTime? startDate = null, DateTime? endDate = null, string? timePeriod = null)
        {
            var end = endDate ?? DateTime.Now;
            var start = startDate;

            if (!start.HasValue)
            {
                switch (timePeriod)
                {
                    case "recent_half_year":
                        start = end.AddMonths(-6);
                        break;
                    case "recent_year":
                        start = end.AddYears(-1);
                        break;
                    case "all_time":
                        start = new DateTime(2020, 1, 1);
                        break;
                    default: // recent_month
                        start = end.AddMonths(-1);
                        break;
                }
            }

            return (start.Value, end);
        }

        /// <summary>
        /// 获取年度新增机型数据 - 统计每年首次出现的机型类型数量
        /// </summary>
        private async Task<List<YearlyNewModelsDto>> GetYearlyNewModelsDataAsync(int startYear, int endYear)
        {
            var result = new List<YearlyNewModelsDto>();
            var allSeenModelTypes = new HashSet<string>(); // 记录所有已出现过的机型类型

            for (int year = startYear; year <= endYear; year++)
            {
                var yearStart = new DateTime(year, 1, 1);
                var yearEnd = new DateTime(year, 12, 31, 23, 59, 59);

                // 统计该年份中出现的机型类型种类（去重）
                var yearModelTypes = await _context.CodeUsageEntries
                    .Where(x => !x.IsDeleted && x.CreatedAt >= yearStart && x.CreatedAt <= yearEnd)
                    .Select(x => x.ModelType)
                    .Distinct()
                    .ToListAsync();

                // 过滤出真正"新增"的机型类型（首次出现的）
                var newModelTypes = yearModelTypes.Where(modelType => !allSeenModelTypes.Contains(modelType)).ToList();

                // 将本年度出现的所有机型类型加入已见过的集合
                foreach (var modelType in yearModelTypes)
                {
                    allSeenModelTypes.Add(modelType);
                }

                // 构建机型类型统计字典 - 只包含新增的
                var modelTypeStats = new Dictionary<string, int>();
                foreach (var modelType in newModelTypes)
                {
                    modelTypeStats[modelType] = 1; // 1表示该年份新增该机型类型
                }

                // 动态构建年度数据
                var yearlyData = new YearlyNewModelsDto
                {
                    Year = year,
                    NewModelCount = newModelTypes.Count, // 真正新增的机型类型数量
                    ModelTypes = newModelTypes, // 新增的机型类型列表
                    ModelTypeStats = modelTypeStats // 新增机型类型详细统计
                };

                result.Add(yearlyData);
            }

            return result;
        }

        /// <summary>
        /// 获取规划占用数据
        /// </summary>
        private async Task<List<PlanningUsageDto>> GetPlanningUsageDataAsync(DateTime startDate, DateTime endDate, string? modelTypeFilter = null)
        {
            var query = _context.CodeUsageEntries
                .Where(x => !x.IsDeleted && x.CreatedAt >= startDate && x.CreatedAt <= endDate);

            if (!string.IsNullOrWhiteSpace(modelTypeFilter))
            {
                query = query.Where(x => x.ModelType == modelTypeFilter);
            }

            var occupancyStats = await query
                .GroupBy(x => new { x.ModelType, x.OccupancyType })
                .Select(g => new { g.Key.ModelType, g.Key.OccupancyType, Count = g.Count() })
                .ToListAsync();

            var result = occupancyStats
                .GroupBy(x => x.ModelType)
                .Select(g => new PlanningUsageDto
                {
                    ModelType = g.Key,
                    Planning = g.Where(x => x.OccupancyType == "PLANNING").Sum(x => x.Count),
                    WorkOrder = g.Where(x => x.OccupancyType == "WORK_ORDER").Sum(x => x.Count),
                    Pause = g.Where(x => x.OccupancyType == "PAUSE").Sum(x => x.Count)
                })
                .ToList();

            return result;
        }

        /// <summary>
        /// 获取机型码余量数据
        /// </summary>
        private async Task<List<ModelCodeRemainingDto>> GetModelCodeRemainingDataAsync()
        {
            // 获取所有机型分类及其理论最大容量
            var modelTypes = await _context.ModelClassifications.ToListAsync();
            var result = new List<ModelCodeRemainingDto>();

            foreach (var modelType in modelTypes)
            {
                // 计算已使用的编码数量
                var usedCount = await _context.CodeUsageEntries
                    .Where(x => !x.IsDeleted && x.ModelType == modelType.Type)
                    .CountAsync();

                // 根据编码规则估算总容量 (假设每种机型类型最大容量为999)
                var totalCapacity = 999;
                var remaining = Math.Max(0, totalCapacity - usedCount);
                var usageRate = totalCapacity > 0 ? (double)usedCount / totalCapacity * 100 : 0;

                result.Add(new ModelCodeRemainingDto
                {
                    ModelType = modelType.Type,
                    Remaining = remaining,
                    Total = totalCapacity,
                    UsageRate = Math.Round(usageRate, 2)
                });
            }

            return result;
        }

        /// <summary>
        /// 获取新增代码数据
        /// </summary>
        private async Task<Dictionary<string, ModelNewCodeDataDto>> GetNewCodeDataAsync(DateTime startDate, DateTime endDate)
        {
            var modelTypes = await _context.ModelClassifications
                .Select(x => x.Type)
                .Distinct()
                .ToListAsync();

            var result = new Dictionary<string, ModelNewCodeDataDto>();

            foreach (var modelType in modelTypes)
            {
                var items = await _context.CodeUsageEntries
                    .Where(x => !x.IsDeleted && 
                               x.ModelType == modelType &&
                               x.CreatedAt >= startDate &&
                               x.CreatedAt <= endDate)
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(10)
                    .Select(x => new CodeEntryDto
                    {
                        Id = x.Id,
                        Model = x.Model,
                        CodeNumber = x.ActualNumber,
                        ProductName = x.ProductName ?? "",
                        OccupancyType = x.OccupancyType ?? "",
                        Builder = x.Builder ?? "",
                        CreationDate = x.CreatedAt
                    })
                    .ToListAsync();

                var totalCount = await _context.CodeUsageEntries
                    .Where(x => !x.IsDeleted && 
                               x.ModelType == modelType &&
                               x.CreatedAt >= startDate &&
                               x.CreatedAt <= endDate)
                    .CountAsync();

                result[modelType] = new ModelNewCodeDataDto
                {
                    TotalItems = totalCount,
                    Items = items
                };
            }

            return result;
        }

        #endregion
    }
}