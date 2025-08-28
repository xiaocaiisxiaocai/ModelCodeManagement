using ModelCodeManagement.Api.DTOs;
using System.Linq.Expressions;

namespace ModelCodeManagement.Api.Repositories
{
    /// <summary>
    /// 通用仓储接口
    /// </summary>
    /// <typeparam name="T">实体类型</typeparam>
    public interface IRepository<T> where T : class
    {
        /// <summary>
        /// 根据ID获取实体
        /// </summary>
        Task<T?> GetByIdAsync(int id);

        /// <summary>
        /// 根据条件获取实体
        /// </summary>
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// 获取所有实体
        /// </summary>
        Task<List<T>> GetAllAsync();

        /// <summary>
        /// 根据条件获取实体列表
        /// </summary>
        Task<List<T>> GetListAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// 分页查询
        /// </summary>
        Task<PagedResult<T>> GetPagedAsync(int pageIndex, int pageSize, Expression<Func<T, bool>>? predicate = null);

        /// <summary>
        /// 检查是否存在
        /// </summary>
        Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// 获取数量
        /// </summary>
        Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);

        /// <summary>
        /// 添加实体
        /// </summary>
        Task<T> AddAsync(T entity);

        /// <summary>
        /// 批量添加
        /// </summary>
        Task<List<T>> AddRangeAsync(List<T> entities);

        /// <summary>
        /// 更新实体
        /// </summary>
        Task<T> UpdateAsync(T entity);

        /// <summary>
        /// 批量更新
        /// </summary>
        Task<List<T>> UpdateRangeAsync(List<T> entities);

        /// <summary>
        /// 删除实体
        /// </summary>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// 根据条件删除
        /// </summary>
        Task<bool> DeleteAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// 批量删除
        /// </summary>
        Task<bool> DeleteRangeAsync(List<int> ids);
    }
}