using Microsoft.EntityFrameworkCore;
using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 用户角色权限服务实现
    /// </summary>
    public class UserRoleService : IUserRoleService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserRoleService> _logger;

        public UserRoleService(ApplicationDbContext context, ILogger<UserRoleService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<User?> GetUserWithRolesAndPermissionsAsync(int userId)
        {
            try
            {
                // 🔧 修复：使用Include一次性加载用户和角色关联数据
                var user = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .Where(u => u.Id == userId && u.IsActive)
                    .FirstOrDefaultAsync();

                if (user == null) return null;

                // 获取用户的权限（通过角色）- 使用UserRoles导航属性
                var roleIds = user.UserRoles.Select(ur => ur.RoleId).ToList();
                var permissions = await _context.RolePermissions
                    .Include(rp => rp.Permission)
                    .Where(rp => roleIds.Contains(rp.RoleId))
                    .Select(rp => rp.Permission!)
                    .Distinct()
                    .ToListAsync();

                user.Permissions = permissions;

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户角色权限信息失败 - UserId: {UserId}", userId);
                return null;
            }
        }

        public async Task<ApiResponse<object>> AssignRolesToUserAsync(int userId, List<int> roleIds, int assignedBy)
        {
            try
            {
                // 检查用户是否存在
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId && u.IsActive);
                if (!userExists)
                {
                    return ApiResponse<object>.ErrorResult("用户不存在或已被禁用");
                }

                // 检查角色是否都存在
                var existingRoleIds = await _context.Roles
                    .Where(r => roleIds.Contains(r.Id))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (existingRoleIds.Count != roleIds.Count)
                {
                    var missingRoles = roleIds.Except(existingRoleIds);
                    return ApiResponse<object>.ErrorResult($"以下角色不存在或已禁用: {string.Join(",", missingRoles)}");
                }

                // 获取现有的用户角色关联
                var existingUserRoles = await _context.UserRoles
                    .Where(ur => ur.UserId == userId)
                    .ToListAsync();

                // 移除现有的关联
                _context.UserRoles.RemoveRange(existingUserRoles);

                // 添加新的关联
                var newUserRoles = roleIds.Select(roleId => new UserRole
                {
                    UserId = userId,
                    RoleId = roleId,
                    AssignedBy = assignedBy,
                    AssignedAt = DateTime.Now
                }).ToList();

                _context.UserRoles.AddRange(newUserRoles);
                await _context.SaveChangesAsync();

                _logger.LogInformation("用户角色分配成功 - UserId: {UserId}, RoleIds: {RoleIds}, AssignedBy: {AssignedBy}",
                    userId, string.Join(",", roleIds), assignedBy);

                return ApiResponse<object>.SuccessResult(new { success = true }, "角色分配成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "用户角色分配失败 - UserId: {UserId}, RoleIds: {RoleIds}", userId, string.Join(",", roleIds));
                return ApiResponse<object>.ErrorResult("角色分配失败");
            }
        }

        public async Task<ApiResponse<object>> RemoveRolesFromUserAsync(int userId, List<int> roleIds)
        {
            try
            {
                var userRolesToRemove = await _context.UserRoles
                    .Where(ur => ur.UserId == userId && roleIds.Contains(ur.RoleId))
                    .ToListAsync();

                if (!userRolesToRemove.Any())
                {
                    return ApiResponse<object>.ErrorResult("没有找到要移除的角色关联");
                }

                _context.UserRoles.RemoveRange(userRolesToRemove);
                await _context.SaveChangesAsync();

                _logger.LogInformation("用户角色移除成功 - UserId: {UserId}, RoleIds: {RoleIds}", userId, string.Join(",", roleIds));
                return ApiResponse<object>.SuccessResult(new { success = true }, "角色移除成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "用户角色移除失败 - UserId: {UserId}, RoleIds: {RoleIds}", userId, string.Join(",", roleIds));
                return ApiResponse<object>.ErrorResult("角色移除失败");
            }
        }

        public async Task<List<RoleDto>> GetUserRolesAsync(int userId)
        {
            try
            {
                var roles = await _context.UserRoles
                    .Include(ur => ur.Role)
                    .Where(ur => ur.UserId == userId)
                    .Select(ur => ur.Role!)
                    .ToListAsync();

                return roles.Select(r => r.ToDto()).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户角色列表失败 - UserId: {UserId}", userId);
                return new List<RoleDto>();
            }
        }

        public async Task<List<PermissionDto>> GetUserPermissionsAsync(int userId)
        {
            try
            {
                var permissions = await (from ur in _context.UserRoles
                                         join rp in _context.RolePermissions on ur.RoleId equals rp.RoleId
                                         join p in _context.Permissions on rp.PermissionId equals p.Id
                                         where ur.UserId == userId
                                         select p).Distinct().ToListAsync();

                return permissions.Select(p => p.ToDto()).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户权限列表失败 - UserId: {UserId}", userId);
                return new List<PermissionDto>();
            }
        }

        public async Task<bool> HasPermissionAsync(int userId, string permissionCode)
        {
            try
            {
                return await (from ur in _context.UserRoles
                              join rp in _context.RolePermissions on ur.RoleId equals rp.RoleId
                              join p in _context.Permissions on rp.PermissionId equals p.Id
                              where ur.UserId == userId && p.Code == permissionCode
                              select p).AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查用户权限失败 - UserId: {UserId}, PermissionCode: {PermissionCode}", userId, permissionCode);
                return false;
            }
        }

        public async Task<bool> HasRoleAsync(int userId, string roleCode)
        {
            try
            {
                return await _context.UserRoles
                    .Include(ur => ur.Role)
                    .AnyAsync(ur => ur.UserId == userId && ur.Role!.Code == roleCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查用户角色失败 - UserId: {UserId}, RoleCode: {RoleCode}", userId, roleCode);
                return false;
            }
        }
    }
}