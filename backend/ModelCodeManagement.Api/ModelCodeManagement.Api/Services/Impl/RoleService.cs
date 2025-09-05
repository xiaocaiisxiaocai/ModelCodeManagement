using Microsoft.EntityFrameworkCore;
using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.Extensions;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 角色服务实现
    /// </summary>
    public class RoleService : IRoleService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoleService> _logger;
        private readonly IAuditLogService _auditLogService;

        public RoleService(
            ApplicationDbContext context,
            ILogger<RoleService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<ApiResponse<PagedResult<RoleDto>>> GetPagedAsync(RoleQueryDto query)
        {
            try
            {
                // 验证分页参数
                if (query.PageIndex <= 0) query.PageIndex = 1;
                if (query.PageSize <= 0) query.PageSize = 20;
                if (query.PageSize > 100) query.PageSize = 100; // 限制最大页面大小
                var queryable = _context.Roles.AsQueryable();

                if (!string.IsNullOrWhiteSpace(query.Keyword))
                {
                    queryable = queryable.Where(x => 
                        x.Code.Contains(query.Keyword) || 
                        x.Name.Contains(query.Keyword));
                }

                // 排序
                var sortField = string.IsNullOrWhiteSpace(query.SortField) ? "SortOrder" : query.SortField;
                var isDesc = query.SortOrder?.ToLower() == "desc";

                // 根据排序字段动态排序
                queryable = sortField.ToLower() switch
                {
                    "code" => isDesc ? queryable.OrderByDescending(x => x.Code) : queryable.OrderBy(x => x.Code),
                    "name" => isDesc ? queryable.OrderByDescending(x => x.Name) : queryable.OrderBy(x => x.Name),
                    "createdat" => isDesc ? queryable.OrderByDescending(x => x.CreatedAt) : queryable.OrderBy(x => x.CreatedAt),
                    _ => queryable.OrderBy(x => x.Id)
                };

                // 分页查询
                var total = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = new List<RoleDto>();
                foreach (var item in items)
                {
                    var dto = await MapToDto(item);
                    dtos.Add(dto);
                }

                var result = new PagedResult<RoleDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询角色成功 - 获取{Count}条记录，共{Total}条", dtos.Count, total);
                return ApiResponse<PagedResult<RoleDto>>.SuccessResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询角色失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<RoleDto>>.ErrorResult($"查询角色失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<RoleDto>> GetByIdAsync(int id)
        {
            try
            {
                var entity = await _context.Roles
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的角色", id);
                    return ApiResponse<RoleDto>.ErrorResult("角色不存在");
                }

                var dto = await MapToDto(entity, true); // 包含权限信息
                return ApiResponse<RoleDto>.SuccessResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取角色失败 - Id: {Id}", id);
                return ApiResponse<RoleDto>.ErrorResult($"获取角色失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<RoleDto>>> GetAllActiveAsync()
        {
            try
            {
                var entities = await _context.Roles
                    .ToListAsync();

                var dtos = new List<RoleDto>();
                foreach (var entity in entities)
                {
                    var dto = await MapToDto(entity);
                    dtos.Add(dto);
                }

                _logger.LogInformation("获取活跃角色成功 - Count: {Count}", entities.Count);
                return ApiResponse<List<RoleDto>>.SuccessResult(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取活跃角色失败");
                return ApiResponse<List<RoleDto>>.ErrorResult($"获取活跃角色失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<RoleDto>> CreateAsync(CreateRoleDto dto, int? createdBy = null)
        {
            try
            {
                // 检查编码是否已存在
                if (await ExistsAsync(dto.Code))
                {
                    _logger.LogWarning("创建角色失败 - 编码已存在: {Code}", dto.Code);
                    return ApiResponse<RoleDto>.ErrorResult($"角色编码 '{dto.Code}' 已存在");
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var entity = new Role
                    {
                        Code = dto.Code,
                        Name = dto.Name,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now,
                        CreatedBy = createdBy,
                        UpdatedBy = createdBy
                    };

                    _context.Roles.Add(entity);
                    await _context.SaveChangesAsync();

                    // 分配权限
                    if (dto.PermissionIds.Any())
                    {
                        await AssignPermissionsInternalAsync(entity.Id, dto.PermissionIds, createdBy);
                    }

                    await transaction.CommitAsync();

                    var result = await MapToDto(entity, true);
                    
                    await _auditLogService.LogActionAsync("CreateRole", 
                        $"创建角色: {dto.Name} ({dto.Code})", "Role", entity.Id);
                    
                    _logger.LogInformation("创建角色成功 - Code: {Code}, Name: {Name}, Id: {Id}", 
                        dto.Code, dto.Name, entity.Id);
                    
                    return ApiResponse<RoleDto>.SuccessResult(result, "角色创建成功");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建角色失败 - Code: {Code}, Name: {Name}", dto.Code, dto.Name);
                return ApiResponse<RoleDto>.ErrorResult($"创建角色失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<RoleDto>> UpdateAsync(int id, UpdateRoleDto dto, int? updatedBy = null)
        {
            try
            {
                var entity = await _context.Roles
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的角色", id);
                    return ApiResponse<RoleDto>.ErrorResult("角色不存在");
                }

                // 检查编码是否已存在（排除当前记录）
                if (await ExistsAsync(dto.Code, id))
                {
                    _logger.LogWarning("更新角色失败 - 编码已存在: {Code}", dto.Code);
                    return ApiResponse<RoleDto>.ErrorResult($"角色编码 '{dto.Code}' 已存在");
                }

                entity.Code = dto.Code;
                entity.Name = dto.Name;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = updatedBy;

                await _context.SaveChangesAsync();

                var result = await MapToDto(entity, true);
                
                await _auditLogService.LogActionAsync("UpdateRole", 
                    $"更新角色: {dto.Name} ({dto.Code})", "Role", entity.Id);
                
                _logger.LogInformation("更新角色成功 - Id: {Id}, Code: {Code}, Name: {Name}", 
                    id, dto.Code, dto.Name);
                
                return ApiResponse<RoleDto>.SuccessResult(result, "角色更新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新角色失败 - Id: {Id}", id);
                return ApiResponse<RoleDto>.ErrorResult($"更新角色失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var entity = await _context.Roles
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的角色", id);
                    return ApiResponse.ErrorResult("角色不存在");
                }

                if (!await CanDeleteAsync(id))
                {
                    _logger.LogWarning("删除角色失败 - 存在用户关联: Id={Id}", id);
                    return ApiResponse.ErrorResult("该角色还有用户使用，不能删除");
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 先删除角色权限关联
                    var rolePermissions = await _context.RolePermissions
                        .Where(x => x.RoleId == id)
                        .ToListAsync();
                    _context.RolePermissions.RemoveRange(rolePermissions);

                    // 删除角色
                    _context.Roles.Remove(entity);
                    
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    await _auditLogService.LogActionAsync("DeleteRole", 
                        $"删除角色: {entity.Name} ({entity.Code})", "Role", entity.Id);
                    
                    _logger.LogInformation("删除角色成功 - Id: {Id}, Name: {Name}", id, entity.Name);

                    return ApiResponse.SuccessResult("角色删除成功");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除角色失败 - Id: {Id}", id);
                return ApiResponse.ErrorResult($"删除角色失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> AssignPermissionsAsync(int roleId, AssignRolePermissionDto dto, int? assignedBy = null)
        {
            try
            {
                var role = await _context.Roles
                    .FirstOrDefaultAsync(x => x.Id == roleId);

                if (role == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的角色", roleId);
                    return ApiResponse.ErrorResult("角色不存在");
                }

                await AssignPermissionsInternalAsync(roleId, dto.PermissionIds, assignedBy);
                
                await _auditLogService.LogActionAsync("AssignRolePermissions", 
                    $"为角色{role.Name}分配{dto.PermissionIds.Count}个权限", "Role", roleId);
                
                _logger.LogInformation("角色权限分配成功 - RoleId: {RoleId}, Count: {Count}", 
                    roleId, dto.PermissionIds.Count);
                
                return ApiResponse.SuccessResult("权限分配成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "角色权限分配失败 - RoleId: {RoleId}", roleId);
                return ApiResponse.ErrorResult($"权限分配失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<PermissionDto>>> GetRolePermissionsAsync(int roleId)
        {
            try
            {
                var permissions = await _context.Permissions
                    .Join(_context.RolePermissions,
                        p => p.Id,
                        rp => rp.PermissionId,
                        (p, rp) => new { Permission = p, RolePermission = rp })
                    .Where(x => x.RolePermission.RoleId == roleId)
                    .Select(x => x.Permission)
                    .OrderBy(p => p.Type)
                    .ThenBy(p => p.Id)
                    .ToListAsync();

                var dtos = permissions.Select(permission => new PermissionDto
                {
                    Id = permission.Id,
                    Code = permission.Code,
                    Name = permission.Name,
                    Type = permission.Type,
                    Resource = permission.Resource,
                    Action = permission.Action,
                    ParentId = permission.ParentId,
                    Path = permission.Path,
                    CreatedAt = permission.CreatedAt,
                    UpdatedAt = permission.UpdatedAt,
                    CreatedBy = permission.CreatedBy,
                    UpdatedBy = permission.UpdatedBy
                }).ToList();

                return ApiResponse<List<PermissionDto>>.SuccessResult(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取角色权限失败 - RoleId: {RoleId}", roleId);
                return ApiResponse<List<PermissionDto>>.ErrorResult($"获取角色权限失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> AssignUsersAsync(int roleId, AssignUserRoleDto dto, int? assignedBy = null)
        {
            try
            {
                var role = await _context.Roles
                    .FirstOrDefaultAsync(x => x.Id == roleId);

                if (role == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的角色", roleId);
                    return ApiResponse.ErrorResult("角色不存在");
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 先删除现有的用户角色关联
                    var existingUserRoles = await _context.UserRoles
                        .Where(x => x.RoleId == roleId)
                        .ToListAsync();
                    _context.UserRoles.RemoveRange(existingUserRoles);

                    // 添加新的用户角色关联
                    if (dto.UserIds.Any())
                    {
                        var userRoles = dto.UserIds.Select(userId => new UserRole
                        {
                            UserId = userId,
                            RoleId = roleId,
                            AssignedAt = DateTime.Now,
                            AssignedBy = assignedBy
                        }).ToList();

                        _context.UserRoles.AddRange(userRoles);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    await _auditLogService.LogActionAsync("AssignRoleUsers", 
                        $"为角色{role.Name}分配{dto.UserIds.Count}个用户", "Role", roleId);
                    
                    _logger.LogInformation("角色用户分配成功 - RoleId: {RoleId}, UserCount: {Count}", 
                        roleId, dto.UserIds.Count);

                    return ApiResponse.SuccessResult("用户分配成功");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "角色用户分配失败 - RoleId: {RoleId}", roleId);
                return ApiResponse.ErrorResult($"用户分配失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<UserDto>>> GetRoleUsersAsync(int roleId)
        {
            try
            {
                var users = await _context.Users
                    .Join(_context.UserRoles,
                        u => u.Id,
                        ur => ur.UserId,
                        (u, ur) => new { User = u, UserRole = ur })
                    .Where(x => x.UserRole.RoleId == roleId && x.User.IsActive)
                    .Select(x => x.User)
                    .OrderBy(u => u.UserName)
                    .ToListAsync();

                var dtos = users.Select(user => user.ToDto()).ToList();

                return ApiResponse<List<UserDto>>.SuccessResult(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取角色用户失败 - RoleId: {RoleId}", roleId);
                return ApiResponse<List<UserDto>>.ErrorResult($"获取角色用户失败: {ex.Message}");
            }
        }

        public async Task<bool> ExistsAsync(string code, int? excludeId = null)
        {
            try
            {
                var queryable = _context.Roles
                    .Where(x => x.Code == code);

                if (excludeId.HasValue)
                {
                    queryable = queryable.Where(x => x.Id != excludeId.Value);
                }

                return await queryable.AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查角色编码存在性失败 - Code: {Code}", code);
                return false;
            }
        }

        public async Task<bool> CanDeleteAsync(int id)
        {
            try
            {
                // 检查是否有用户使用该角色
                var hasUsers = await _context.UserRoles
                    .Where(x => x.RoleId == id)
                    .AnyAsync();

                return !hasUsers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查角色是否可删除失败 - Id: {Id}", id);
                return false;
            }
        }

        #region 私有方法

        private async Task<RoleDto> MapToDto(Role entity, bool includePermissions = false)
        {
            var dto = new RoleDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                CreatedBy = entity.CreatedBy,
                UpdatedBy = entity.UpdatedBy
            };

            // 获取用户数量
            dto.UserCount = await _context.UserRoles
                .Where(x => x.RoleId == entity.Id)
                .CountAsync();

            // 获取权限数量
            dto.PermissionCount = await _context.RolePermissions
                .Where(x => x.RoleId == entity.Id)
                .CountAsync();

            // 如果需要包含权限信息
            if (includePermissions)
            {
                var permissionsResult = await GetRolePermissionsAsync(entity.Id);
                if (permissionsResult.Success && permissionsResult.Data != null)
                {
                    dto.Permissions = permissionsResult.Data;
                }
            }

            return dto;
        }

        private async Task AssignPermissionsInternalAsync(int roleId, List<int> permissionIds, int? assignedBy = null)
        {
            // 先删除现有的角色权限关联
            var existingRolePermissions = await _context.RolePermissions
                .Where(x => x.RoleId == roleId)
                .ToListAsync();
            _context.RolePermissions.RemoveRange(existingRolePermissions);

            // 添加新的角色权限关联
            if (permissionIds.Any())
            {
                var rolePermissions = permissionIds.Select(permissionId => new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permissionId,
                    AssignedAt = DateTime.Now,
                    AssignedBy = assignedBy
                }).ToList();

                _context.RolePermissions.AddRange(rolePermissions);
            }

            await _context.SaveChangesAsync();
        }

        #endregion
    }
}