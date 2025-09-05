using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Repositories;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 用户管理服务实现
    /// </summary>
    public class UserManagementService : IUserManagementService
    {
        private readonly IUserRepository _userRepository;
        private readonly IAuthenticationService _authenticationService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserManagementService> _logger;

        public UserManagementService(
            IUserRepository userRepository,
            IAuthenticationService authenticationService,
            ApplicationDbContext context,
            ILogger<UserManagementService> logger)
        {
            _userRepository = userRepository;
            _authenticationService = authenticationService;
            _context = context;
            _logger = logger;
        }

        public async Task<ApiResponse<PagedResult<UserDto>>> GetPagedAsync(QueryDto query)
        {
            try
            {
                var result = await _userRepository.GetPagedWithSearchAsync(query);
                var userDtos = result.Items.Select(u => u.ToDto()).ToList();

                var pagedResult = new PagedResult<UserDto>
                {
                    Items = userDtos,
                    TotalCount = result.TotalCount,
                    PageIndex = result.PageIndex,
                    PageSize = result.PageSize
                };

                return ApiResponse<PagedResult<UserDto>>.SuccessResult(pagedResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户列表时发生错误");
                return ApiResponse<PagedResult<UserDto>>.ErrorResult("获取用户列表失败");
            }
        }

        public async Task<ApiResponse<UserDto>> GetByIdAsync(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                {
                    return ApiResponse<UserDto>.ErrorResult("用户不存在");
                }

                return ApiResponse<UserDto>.SuccessResult(user.ToDto());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户信息时发生错误 - UserId: {UserId}", id);
                return ApiResponse<UserDto>.ErrorResult("获取用户信息失败");
            }
        }

        public async Task<ApiResponse<UserDto>> GetByEmployeeIdAsync(string employeeId)
        {
            try
            {
                var user = await _userRepository.GetByEmployeeIdAsync(employeeId);
                if (user == null)
                {
                    return ApiResponse<UserDto>.ErrorResult("用户不存在");
                }

                return ApiResponse<UserDto>.SuccessResult(user.ToDto());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据工号获取用户信息时发生错误 - EmployeeId: {EmployeeId}", employeeId);
                return ApiResponse<UserDto>.ErrorResult("获取用户信息失败");
            }
        }

        public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId)
        {
            return await GetByIdAsync(userId);
        }

        public async Task<ApiResponse<UserDto>> CreateAsync(CreateUserDto dto)
        {
            try
            {
                // 验证工号是否已存在
                if (await IsEmployeeIdExistAsync(dto.EmployeeId))
                {
                    return ApiResponse<UserDto>.ErrorResult("工号已存在");
                }

                // 验证邮箱是否已存在
                if (!string.IsNullOrEmpty(dto.Email) && await IsEmailExistAsync(dto.Email))
                {
                    return ApiResponse<UserDto>.ErrorResult("邮箱已存在");
                }

                // 🔧 修复：根据OrganizationId查找部门名称
                string? departmentName = null;
                if (dto.OrganizationId.HasValue)
                {
                    var organization = await _context.Organizations
                        .FirstOrDefaultAsync(o => o.Id == dto.OrganizationId.Value);
                    departmentName = organization?.Name;
                }

                var user = new User
                {
                    EmployeeId = dto.EmployeeId,
                    UserName = dto.UserName,
                    PasswordHash = _authenticationService.HashPassword(dto.Password),
                    Email = dto.Email,
                    // Role字段已移除，将通过UserRoles关联表设置
                    Department = departmentName, // 使用查找到的部门名称
                    OrganizationId = dto.OrganizationId,
                    Position = dto.Position,
                    SuperiorId = dto.SuperiorId,
                    Phone = dto.Phone,
                    JoinDate = dto.JoinDate ?? DateTime.Now,
                    Status = dto.Status,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                var createdUser = await _userRepository.AddAsync(user);
                await _userRepository.SaveChangesAsync(); // 🔧 修复：保存更改到数据库
                
                // 🔧 修复：为新用户设置角色关联
                if (!string.IsNullOrEmpty(dto.Role))
                {
                    await UpdateUserRoleAsync(createdUser.Id, dto.Role);
                }
                
                _logger.LogInformation("用户创建成功 - UserId: {UserId}, EmployeeId: {EmployeeId}", createdUser.Id, createdUser.EmployeeId);

                // 重新查询用户以获取完整的角色信息
                var userWithRole = await _userRepository.GetByIdAsync(createdUser.Id);
                return ApiResponse<UserDto>.SuccessResult(userWithRole?.ToDto() ?? createdUser.ToDto(), "用户创建成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建用户时发生错误 - EmployeeId: {EmployeeId}", dto.EmployeeId);
                return ApiResponse<UserDto>.ErrorResult("创建用户失败");
            }
        }

        public async Task<ApiResponse<UserDto>> UpdateAsync(int id, UpdateUserDto dto)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                {
                    return ApiResponse<UserDto>.ErrorResult("用户不存在");
                }

                // 验证邮箱是否已存在
                if (!string.IsNullOrEmpty(dto.Email) && await IsEmailExistAsync(dto.Email, id))
                {
                    return ApiResponse<UserDto>.ErrorResult("邮箱已存在");
                }

                // 🔧 修复：根据OrganizationId查找部门名称
                string? departmentName = null;
                if (dto.OrganizationId.HasValue)
                {
                    var organization = await _context.Organizations
                        .FirstOrDefaultAsync(o => o.Id == dto.OrganizationId.Value);
                    departmentName = organization?.Name;
                }

                // 更新用户信息
                user.UserName = dto.UserName;
                user.Email = dto.Email;
                user.Department = departmentName; // 使用查找到的部门名称
                user.OrganizationId = dto.OrganizationId;
                user.Position = dto.Position;
                user.SuperiorId = dto.SuperiorId;
                user.Phone = dto.Phone;
                user.JoinDate = dto.JoinDate;
                user.Status = dto.Status;
                user.IsActive = dto.IsActive;
                user.UpdatedAt = DateTime.Now;

                // 🔧 修复：更新用户角色关联
                if (!string.IsNullOrEmpty(dto.Role))
                {
                    await UpdateUserRoleAsync(user.Id, dto.Role);
                }

                await _userRepository.UpdateAsync(user);
                await _userRepository.SaveChangesAsync();
                _logger.LogInformation("用户信息更新成功 - UserId: {UserId}", id);

                // 重新查询用户以获取完整的角色信息
                var updatedUserWithRole = await _userRepository.GetByIdAsync(id);
                return ApiResponse<UserDto>.SuccessResult(updatedUserWithRole?.ToDto() ?? user.ToDto(), "用户信息更新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新用户信息时发生错误 - UserId: {UserId}", id);
                return ApiResponse<UserDto>.ErrorResult("更新用户信息失败");
            }
        }

        public async Task<ApiResponse<object>> DeleteAsync(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                {
                    return ApiResponse<object>.ErrorResult("用户不存在");
                }

                await _userRepository.DeleteAsync(user);
                await _userRepository.SaveChangesAsync();
                var deleted = true;
                if (!deleted)
                {
                    return ApiResponse<object>.ErrorResult("删除用户失败");
                }

                _logger.LogInformation("用户删除成功 - UserId: {UserId}, EmployeeId: {EmployeeId}", id, user.EmployeeId);
                return ApiResponse<object>.SuccessResult(new { success = true }, "用户删除成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除用户时发生错误 - UserId: {UserId}", id);
                return ApiResponse<object>.ErrorResult("删除用户失败");
            }
        }

        public async Task<ApiResponse<UserStatisticsDto>> GetStatisticsAsync()
        {
            try
            {
                // 优化查询：使用单个查询获取统计信息，避免加载所有用户数据
                var totalUsers = await _userRepository.CountAsync();
                var activeUsers = await _userRepository.CountAsync(u => u.IsActive);
                var inactiveUsers = totalUsers - activeUsers;

                // 使用RBAC结构统计用户角色分布
                var usersByRole = await _context.UserRoles
                    .Include(ur => ur.Role)
                    .GroupBy(ur => ur.Role!.Code)
                    .Select(g => new { Role = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Role, x => x.Count);

                var usersByDepartment = await _userRepository.FindAsync(u => !string.IsNullOrEmpty(u.Department))
                    .ContinueWith(task => task.Result
                        .Where(u => !string.IsNullOrEmpty(u.Department))
                        .GroupBy(u => u.Department!)
                        .ToDictionary(g => g.Key, g => g.Count()));

                var statistics = new UserStatisticsDto
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    InactiveUsers = inactiveUsers,
                    UsersByRole = usersByRole,
                    UsersByDepartment = usersByDepartment
                };

                _logger.LogInformation("用户统计信息获取成功 - 总用户数: {TotalUsers}, 活跃用户: {ActiveUsers}", 
                    totalUsers, activeUsers);
                return ApiResponse<UserStatisticsDto>.SuccessResult(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户统计信息时发生错误");
                return ApiResponse<UserStatisticsDto>.ErrorResult("获取统计信息失败");
            }
        }

        public async Task<bool> IsEmployeeIdExistAsync(string employeeId, int? excludeId = null)
        {
            return await _userRepository.IsEmployeeIdExistAsync(employeeId, excludeId);
        }

        public async Task<bool> IsEmailExistAsync(string email, int? excludeId = null)
        {
            return await _userRepository.IsEmailExistAsync(email, excludeId);
        }

        public async Task<ApiResponse<List<UserDto>>> GetByOrganizationAsync(int organizationId)
        {
            try
            {
                var users = await _userRepository.GetByOrganizationIdAsync(organizationId);
                var userDtos = users.Select(u => u.ToDto()).ToList();
                return ApiResponse<List<UserDto>>.SuccessResult(userDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据组织获取用户列表时发生错误 - OrganizationId: {OrganizationId}", organizationId);
                return ApiResponse<List<UserDto>>.ErrorResult("获取用户列表失败");
            }
        }

        public async Task<ApiResponse<List<UserDto>>> GetByRoleAsync(string role)
        {
            try
            {
                var users = await _userRepository.GetByRoleAsync(role);
                var userDtos = users.Select(u => u.ToDto()).ToList();
                return ApiResponse<List<UserDto>>.SuccessResult(userDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据角色获取用户列表时发生错误 - Role: {Role}", role);
                return ApiResponse<List<UserDto>>.ErrorResult("获取用户列表失败");
            }
        }

        /// <summary>
        /// 更新用户角色关联
        /// </summary>
        private async Task UpdateUserRoleAsync(int userId, string roleCode)
        {
            // 直接使用传入的角色代码（统一使用数据库格式）
            
            // 查找角色ID
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == roleCode);
            if (role == null)
            {
                _logger.LogWarning("角色不存在: {RoleCode}", roleCode);
                return;
            }

            // 删除现有角色关联
            var existingUserRoles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .ToListAsync();
                
            if (existingUserRoles.Any())
            {
                _context.UserRoles.RemoveRange(existingUserRoles);
            }

            // 添加新的角色关联
            var newUserRole = new UserRole
            {
                UserId = userId,
                RoleId = role.Id,
                AssignedBy = userId, // 简化处理，实际应该是当前操作用户
                AssignedAt = DateTime.Now
            };

            _context.UserRoles.Add(newUserRole);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("用户角色更新成功 - UserId: {UserId}, Role: {Role}", userId, roleCode);
        }


    }
}