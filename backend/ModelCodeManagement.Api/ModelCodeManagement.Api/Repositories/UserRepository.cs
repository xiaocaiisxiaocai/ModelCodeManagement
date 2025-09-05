using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Repositories
{
    /// <summary>
    /// 用户仓储实现
    /// </summary>
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IBaseRepository<User> _baseRepository;

        public UserRepository(ApplicationDbContext context, IBaseRepository<User> baseRepository)
        {
            _context = context;
            _baseRepository = baseRepository;
        }

        // 委托给基础仓储的通用方法 - 重载以支持角色关联加载
        public async Task<User?> GetByIdAsync(int id)
        {
            // 🔧 修复：加载用户时包含角色关联数据
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);
        }
        public async Task<IEnumerable<User>> GetAllAsync() => await _baseRepository.GetAllAsync();
        public async Task<IEnumerable<User>> FindAsync(System.Linq.Expressions.Expression<System.Func<User, bool>> expression) => await _baseRepository.FindAsync(expression);
        public async Task<User?> SingleOrDefaultAsync(System.Linq.Expressions.Expression<System.Func<User, bool>> expression) => await _baseRepository.SingleOrDefaultAsync(expression);
        public async Task<User> AddAsync(User entity) => await _baseRepository.AddAsync(entity);
        public async Task<IEnumerable<User>> AddRangeAsync(IEnumerable<User> entities) => await _baseRepository.AddRangeAsync(entities);
        public async Task UpdateAsync(User entity) => await _baseRepository.UpdateAsync(entity);
        public async Task UpdateRangeAsync(IEnumerable<User> entities) => await _baseRepository.UpdateRangeAsync(entities);
        public async Task DeleteAsync(User entity) => await _baseRepository.DeleteAsync(entity);
        public async Task DeleteRangeAsync(IEnumerable<User> entities) => await _baseRepository.DeleteRangeAsync(entities);
        public async Task<int> CountAsync(System.Linq.Expressions.Expression<System.Func<User, bool>>? expression = null) => await _baseRepository.CountAsync(expression);
        public async Task<bool> ExistsAsync(System.Linq.Expressions.Expression<System.Func<User, bool>> expression) => await _baseRepository.ExistsAsync(expression);
        public async Task<int> SaveChangesAsync() => await _baseRepository.SaveChangesAsync();

        public async Task<User?> GetByEmployeeIdAsync(string employeeId)
        {
            // 🔧 修复：登录验证时同样需要加载角色信息
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.EmployeeId == employeeId)
                .FirstOrDefaultAsync();
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Email != null && u.Email == email)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> IsEmployeeIdExistAsync(string employeeId, int? excludeId = null)
        {
            var query = _context.Users.Where(u => u.EmployeeId == employeeId);
            
            if (excludeId.HasValue)
            {
                query = query.Where(u => u.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<bool> IsEmailExistAsync(string email, int? excludeId = null)
        {
            var query = _context.Users.Where(u => u.Email == email);
            
            if (excludeId.HasValue)
            {
                query = query.Where(u => u.Id != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        public async Task<List<User>> GetByOrganizationIdAsync(int organizationId)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.OrganizationId == organizationId)
                .ToListAsync();
        }

        public async Task<List<User>> GetByRoleAsync(string role)
        {
            return await _context.Users
                .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { User = u, UserRole = ur })
                .Join(_context.Roles, ur => ur.UserRole.RoleId, r => r.Id, (ur, r) => new { ur.User, Role = r })
                .Where(x => x.Role.Code == role)
                .Select(x => x.User)
                .Distinct()
                .ToListAsync();
        }

        public async Task<PagedResult<User>> GetPagedWithSearchAsync(QueryDto query)
        {
            // 验证分页参数
            if (query.PageIndex <= 0) query.PageIndex = 1;
            if (query.PageSize <= 0) query.PageSize = 20;
            if (query.PageSize > 100) query.PageSize = 100; // 限制最大页面大小
            
            var efQuery = _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(query.Keyword))
            {
                efQuery = efQuery.Where(u => 
                    u.EmployeeId.Contains(query.Keyword) || 
                    u.UserName.Contains(query.Keyword) ||
                    (u.Email != null && u.Email.Contains(query.Keyword)) ||
                    (u.Department != null && u.Department.Contains(query.Keyword)));
            }

            if (query.IsActive.HasValue)
            {
                efQuery = efQuery.Where(u => u.IsActive == query.IsActive.Value);
            }

            efQuery = efQuery.OrderByDescending(u => u.CreatedAt);

            var totalCount = await efQuery.CountAsync();
            var items = await efQuery
                .Skip((query.PageIndex - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<User>
            {
                Items = items,
                TotalCount = totalCount,
                PageIndex = query.PageIndex,
                PageSize = query.PageSize
            };
        }

        public async Task<bool> UpdateLastLoginAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.LastLoginAt = DateTime.Now;
            _context.Users.Update(user);
            var result = await _context.SaveChangesAsync();

            return result > 0;
        }

        public async Task<int> GetActiveUserCountAsync()
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .CountAsync();
        }

        public async Task<List<User>> GetSubordinatesAsync(int superiorId)
        {
            return await _context.Users
                .Where(u => u.SuperiorId == superiorId)
                .ToListAsync();
        }
    }
}