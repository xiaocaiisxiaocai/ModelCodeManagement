using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Services
{
    /// <summary>
    /// 数据字典服务接口
    /// </summary>
    public interface IDataDictionaryService
    {
        /// <summary>
        /// 分页获取数据字典列表
        /// </summary>
        Task<ApiResponse<PagedResult<DataDictionaryDto>>> GetPagedAsync(DataDictionaryQueryDto query);

        /// <summary>
        /// 根据ID获取数据字典
        /// </summary>
        Task<ApiResponse<DataDictionaryDto>> GetByIdAsync(int id);

        /// <summary>
        /// 根据类型获取数据字典选项
        /// </summary>
        Task<ApiResponse<List<DataDictionaryOptionDto>>> GetOptionsByTypeAsync(string type);

        /// <summary>
        /// 获取所有类型的数据字典（按类型分组）
        /// </summary>
        Task<ApiResponse<List<DataDictionaryGroupDto>>> GetAllGroupedAsync();

        /// <summary>
        /// 创建数据字典
        /// </summary>
        Task<ApiResponse<DataDictionaryDto>> CreateAsync(CreateDataDictionaryDto dto, int? createdBy = null);

        /// <summary>
        /// 更新数据字典
        /// </summary>
        Task<ApiResponse<DataDictionaryDto>> UpdateAsync(int id, UpdateDataDictionaryDto dto, int? updatedBy = null);

        /// <summary>
        /// 删除数据字典
        /// </summary>
        Task<ApiResponse> DeleteAsync(int id);

        /// <summary>
        /// 批量删除数据字典
        /// </summary>
        Task<ApiResponse> BatchDeleteAsync(List<int> ids);

        /// <summary>
        /// 检查键值是否存在
        /// </summary>
        Task<bool> ExistsAsync(string type, string key, int? excludeId = null);

        /// <summary>
        /// 获取所有字典类型
        /// </summary>
        Task<ApiResponse<List<string>>> GetAllTypesAsync();

        // === 前端数据字典接口适配 ===

        /// <summary>
        /// 获取客户列表（匹配前端Customer接口）
        /// </summary>
        Task<ApiResponse<List<CustomerDto>>> GetCustomersAsync();

        /// <summary>
        /// 获取厂区列表（匹配前端Factory接口）
        /// </summary>
        Task<ApiResponse<List<FactoryDto>>> GetFactoriesAsync();

        /// <summary>
        /// 根据客户ID获取厂区列表
        /// </summary>
        Task<ApiResponse<List<FactoryDto>>> GetFactoriesByCustomerAsync(string customerId);

        /// <summary>
        /// 获取品名字典（匹配前端ProductNameDict接口）
        /// </summary>
        Task<ApiResponse<List<ProductNameDto>>> GetProductNamesAsync();

        /// <summary>
        /// 获取占用类型字典（匹配前端OccupancyTypeDict接口）
        /// </summary>
        Task<ApiResponse<List<OccupancyTypeDto>>> GetOccupancyTypesAsync();

    }
}