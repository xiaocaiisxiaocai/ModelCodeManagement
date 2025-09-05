using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 战情中心服务接口
    /// </summary>
    public interface IWarRoomService
    {
        /// <summary>
        /// 获取战情中心完整数据
        /// </summary>
        /// <param name="query">查询参数</param>
        /// <returns>战情中心数据</returns>
        Task<ApiResponse<WarRoomDataDto>> GetWarRoomDataAsync(WarRoomQueryDto query);

        /// <summary>
        /// 获取年度新增机型统计
        /// </summary>
        /// <param name="startYear">开始年份</param>
        /// <param name="endYear">结束年份</param>
        /// <returns>年度新增机型数据</returns>
        Task<ApiResponse<List<YearlyNewModelsDto>>> GetYearlyNewModelsAsync(int? startYear = null, int? endYear = null);

        /// <summary>
        /// 获取规划占用统计
        /// </summary>
        /// <param name="startDate">开始日期</param>
        /// <param name="endDate">结束日期</param>
        /// <returns>规划占用数据</returns>
        Task<ApiResponse<List<PlanningUsageDto>>> GetPlanningUsageAsync(DateTime? startDate = null, DateTime? endDate = null);

        /// <summary>
        /// 获取机型码余量统计
        /// </summary>
        /// <returns>机型码余量数据</returns>
        Task<ApiResponse<List<ModelCodeRemainingDto>>> GetModelCodeRemainingAsync();

        /// <summary>
        /// 获取指定机型的新增代码清单
        /// </summary>
        /// <param name="query">查询参数</param>
        /// <returns>新增代码数据</returns>
        Task<ApiResponse<ModelNewCodeDataDto>> GetNewCodeDataByModelAsync(NewCodeQueryDto query);

        /// <summary>
        /// 获取动态新增代码数据（所有机型）
        /// </summary>
        /// <param name="startDate">开始日期</param>
        /// <param name="endDate">结束日期</param>
        /// <returns>按机型分组的新增代码数据</returns>
        Task<ApiResponse<Dictionary<string, ModelNewCodeDataDto>>> GetDynamicNewCodeDataAsync(DateTime? startDate = null, DateTime? endDate = null);

        /// <summary>
        /// 获取可用的年份范围
        /// </summary>
        /// <returns>可用的年份范围</returns>
        Task<ApiResponse<YearRangeDto>> GetAvailableYearRangeAsync();
    }
}