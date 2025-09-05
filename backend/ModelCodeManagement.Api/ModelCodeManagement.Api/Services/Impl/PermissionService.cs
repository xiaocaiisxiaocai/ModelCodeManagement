using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 权限服务实现
    /// </summary>
    public class PermissionService : IPermissionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PermissionService> _logger;
        private readonly IAuditLogService _auditLogService;

        public PermissionService(
            ApplicationDbContext context,
            ILogger<PermissionService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<ApiResponse<PagedResult<PermissionDto>>> GetPagedAsync(PermissionQueryDto query)
        {
            try
            {
                // 验证分页参数
                if (query.PageIndex <= 0) query.PageIndex = 1;
                if (query.PageSize <= 0) query.PageSize = 20;
                if (query.PageSize > 100) query.PageSize = 100; // 限制最大页面大小
                var queryable = _context.Permissions.AsQueryable();

                // 根据条件筛选
                if (!string.IsNullOrWhiteSpace(query.Type))
                {
                    queryable = queryable.Where(x => x.Type == query.Type);
                }

                if (query.ParentId.HasValue)
                {
                    queryable = queryable.Where(x => x.ParentId == query.ParentId.Value);
                }

                if (!string.IsNullOrWhiteSpace(query.Keyword))
                {
                    queryable = queryable.Where(x => 
                        x.Code.Contains(query.Keyword) || 
                        x.Name.Contains(query.Keyword));
                }

                // 排序
                var sortField = string.IsNullOrWhiteSpace(query.SortField) ? "Level" : query.SortField;
                var isDesc = query.SortOrder?.ToLower() == "desc";

                // 根据排序字段动态排序
                switch (sortField.ToLower())
                {
                    case "code":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Code) : queryable.OrderBy(x => x.Code);
                        break;
                    case "name":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Name) : queryable.OrderBy(x => x.Name);
                        break;
                    case "type":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Type) : queryable.OrderBy(x => x.Type);
                        break;

                    case "createdat":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.CreatedAt) : queryable.OrderBy(x => x.CreatedAt);
                        break;
                    default:
                        queryable = queryable.OrderBy(x => x.Type).ThenBy(x => x.Id);
                        break;
                }

                // 分页查询
                var total = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = new List<PermissionDto>();
                foreach (var item in items)
                {
                    var dto = await MapToDto(item);
                    dtos.Add(dto);
                }

                var result = new PagedResult<PermissionDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询权限成功 - 获取{Count}条记录，共{Total}条", dtos.Count, total);
                return ApiResponse<PagedResult<PermissionDto>>.SuccessResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询权限失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<PermissionDto>>.ErrorResult($"查询权限失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<PermissionDto>> GetByIdAsync(int id)
        {
            var entity = await _context.Permissions
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse<PermissionDto>.ErrorResult("权限不存在");
            }

            var dto = await MapToDto(entity);
            return ApiResponse<PermissionDto>.SuccessResult(dto);
        }

        public async Task<ApiResponse<List<PermissionTreeDto>>> GetTreeAsync()
        {
            var entities = await _context.Permissions
                .OrderBy(x => x.Type)
                .ThenBy(x => x.Id)
                .ToListAsync();

            var tree = BuildTree(entities);
            return ApiResponse<List<PermissionTreeDto>>.SuccessResult(tree);
        }

        public async Task<ApiResponse<List<PermissionDto>>> GetChildrenAsync(int? parentId = null)
        {
            var queryable = _context.Permissions.AsQueryable();

            if (parentId.HasValue)
            {
                queryable = queryable.Where(x => x.ParentId == parentId.Value);
            }
            else
            {
                queryable = queryable.Where(x => x.ParentId == null);
            }

            var entities = await queryable
                .OrderBy(x => x.Id)
                .ToListAsync();

            var dtos = new List<PermissionDto>();
            foreach (var entity in entities)
            {
                var dto = await MapToDto(entity);
                dtos.Add(dto);
            }

            return ApiResponse<List<PermissionDto>>.SuccessResult(dtos);
        }

        public async Task<ApiResponse<PermissionDto>> CreateAsync(CreatePermissionDto dto, int? createdBy = null)
        {
            // 检查编码是否已存在
            if (await ExistsAsync(dto.Code))
            {
                return ApiResponse<PermissionDto>.ErrorResult($"权限编码 '{dto.Code}' 已存在");
            }

            // 获取父级信息计算路径
            var parentPath = "/";
            if (dto.ParentId.HasValue)
            {
                var parent = await _context.Permissions
                    .FirstOrDefaultAsync(x => x.Id == dto.ParentId.Value);
                
                if (parent == null)
                {
                    return ApiResponse<PermissionDto>.ErrorResult("父级权限不存在");
                }
                
                parentPath = parent.Path;
            }

            var entity = new Permission
            {
                Code = dto.Code,
                Name = dto.Name,
                Type = dto.Type,
                Resource = dto.Resource,
                Action = dto.Action,
                ParentId = dto.ParentId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                CreatedBy = createdBy,
                UpdatedBy = createdBy
            };

            await _context.Permissions.AddAsync(entity);
            await _context.SaveChangesAsync();

            // 更新路径
            entity.Path = $"{parentPath}{entity.Id}/";
            _context.Permissions.Update(entity);
            await _context.SaveChangesAsync();

            var result = await MapToDto(entity);
            return ApiResponse<PermissionDto>.SuccessResult(result, "权限创建成功");
        }

        public async Task<ApiResponse<PermissionDto>> UpdateAsync(int id, UpdatePermissionDto dto, int? updatedBy = null)
        {
            var entity = await _context.Permissions
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse<PermissionDto>.ErrorResult("权限不存在");
            }

            // 检查编码是否已存在（排除当前记录）
            if (await ExistsAsync(dto.Code, id))
            {
                return ApiResponse<PermissionDto>.ErrorResult($"权限编码 '{dto.Code}' 已存在");
            }

            entity.Code = dto.Code;
            entity.Name = dto.Name;
            entity.Type = dto.Type;
            entity.Resource = dto.Resource;
            entity.Action = dto.Action;
            entity.UpdatedAt = DateTime.Now;
            entity.UpdatedBy = updatedBy;

            _context.Permissions.Update(entity);
            await _context.SaveChangesAsync();

            var result = await MapToDto(entity);
            return ApiResponse<PermissionDto>.SuccessResult(result, "权限更新成功");
        }

        public async Task<ApiResponse> DeleteAsync(int id)
        {
            var entity = await _context.Permissions
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse.ErrorResult("权限不存在");
            }


            if (!await CanDeleteAsync(id))
            {
                return ApiResponse.ErrorResult("该权限下还有子权限或被角色使用，不能删除");
            }

            var entityToDelete = await _context.Permissions.FindAsync(id);
            if (entityToDelete != null)
            {
                _context.Permissions.Remove(entityToDelete);
                await _context.SaveChangesAsync();
            }

            return ApiResponse.SuccessResult("权限删除成功");
        }

        public async Task<ApiResponse> MoveAsync(int id, MovePermissionDto dto, int? updatedBy = null)
        {
            var entity = await _context.Permissions
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse.ErrorResult("权限不存在");
            }

            // 移除IsSystem检查，因为该字段已被删除

            // 检查目标父级
            if (dto.TargetParentId.HasValue)
            {
                var targetParent = await _context.Permissions
                    .FirstOrDefaultAsync(x => x.Id == dto.TargetParentId.Value);
                
                if (targetParent == null)
                {
                    return ApiResponse.ErrorResult("目标父级权限不存在");
                }

                // 检查是否会形成循环引用
                if (targetParent.Path.Contains($"/{id}/"))
                {
                    return ApiResponse.ErrorResult("不能移动到自己的子级权限下");
                }
            }

            // 更新权限层级
            await UpdatePermissionHierarchy(entity, dto.TargetParentId, updatedBy);

            return ApiResponse.SuccessResult("权限移动成功");
        }

        public async Task<bool> ExistsAsync(string code, int? excludeId = null)
        {
            var queryable = _context.Permissions.AsQueryable()
                .Where(x => x.Code == code);

            if (excludeId.HasValue)
            {
                queryable = queryable.Where(x => x.Id != excludeId.Value);
            }

            return await queryable.AnyAsync();
        }

        public async Task<bool> CanDeleteAsync(int id)
        {
            // 检查是否有子权限
            var hasChildren = await _context.Permissions
                .Where(x => x.ParentId == id)
                .AnyAsync();

            if (hasChildren)
            {
                return false;
            }

            // 检查是否被角色使用
            var hasRoles = await _context.RolePermissions
                .Where(x => x.PermissionId == id)
                .AnyAsync();

            return !hasRoles;
        }

        public async Task<ApiResponse<List<PermissionDto>>> GetUserPermissionsAsync(int userId)
        {
            // 通过用户角色获取权限
            var permissions = await _context.Permissions
                .Where(p => _context.RolePermissions
                    .Any(rp => rp.PermissionId == p.Id && _context.UserRoles
                        .Any(ur => ur.RoleId == rp.RoleId && ur.UserId == userId)))
                .Distinct()
                .OrderBy(p => p.Type)
                .ThenBy(p => p.Id)
                .ToListAsync();

            var dtos = new List<PermissionDto>();
            foreach (var permission in permissions)
            {
                var dto = await MapToDto(permission);
                dtos.Add(dto);
            }

            return ApiResponse<List<PermissionDto>>.SuccessResult(dtos);
        }

        public async Task<bool> HasPermissionAsync(int userId, string permissionCode)
        {
            var hasPermission = await _context.Permissions
                .Where(p => p.Code == permissionCode && 
                       _context.RolePermissions.Any(rp => rp.PermissionId == p.Id && 
                           _context.UserRoles.Any(ur => ur.RoleId == rp.RoleId && ur.UserId == userId)))
                .AnyAsync();

            return hasPermission;
        }

        public async Task<bool> HasResourcePermissionAsync(int userId, string resource, string action)
        {
            var hasPermission = await _context.Permissions
                .Where(p => p.Resource == resource && p.Action == action && 
                       _context.RolePermissions.Any(rp => rp.PermissionId == p.Id && 
                           _context.UserRoles.Any(ur => ur.RoleId == rp.RoleId && ur.UserId == userId)))
                .AnyAsync();

            return hasPermission;
        }

        #region 私有方法

        private async Task<PermissionDto> MapToDto(Permission entity)
        {
            var dto = new PermissionDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                Type = entity.Type,
                Resource = entity.Resource,
                Action = entity.Action,
                ParentId = entity.ParentId,
                Path = entity.Path,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                CreatedBy = entity.CreatedBy,
                UpdatedBy = entity.UpdatedBy
            };

            // 获取父级名称
            if (entity.ParentId.HasValue)
            {
                var parent = await _context.Permissions
                    .FirstOrDefaultAsync(x => x.Id == entity.ParentId.Value);
                dto.ParentName = parent?.Name;
            }

            return dto;
        }

        private List<PermissionTreeDto> BuildTree(List<Permission> entities)
        {
            var tree = new List<PermissionTreeDto>();
            var lookup = entities.ToLookup(x => x.ParentId);

            var roots = lookup[null].ToList();
            foreach (var root in roots)
            {
                var node = MapToTreeDto(root);
                BuildTreeNode(node, lookup);
                tree.Add(node);
            }

            return tree;
        }

        private void BuildTreeNode(PermissionTreeDto node, ILookup<int?, Permission> lookup)
        {
            var children = lookup[node.Id].ToList();
            foreach (var child in children)
            {
                var childNode = MapToTreeDto(child);
                BuildTreeNode(childNode, lookup);
                node.Children.Add(childNode);
            }
        }

        private PermissionTreeDto MapToTreeDto(Permission entity)
        {
            return new PermissionTreeDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                Type = entity.Type,
                ParentId = entity.ParentId
            };
        }

        private async Task UpdatePermissionHierarchy(Permission entity, int? newParentId, int? updatedBy)
        {
            var oldPath = entity.Path;
            var newPath = "/";


            if (newParentId.HasValue)
            {
                var newParent = await _context.Permissions
                    .FirstOrDefaultAsync(x => x.Id == newParentId.Value);
                if (newParent != null)
                {
                    newPath = newParent.Path;

                }
            }

            // 更新当前权限
            entity.ParentId = newParentId;

            entity.Path = $"{newPath}{entity.Id}/";
            entity.UpdatedAt = DateTime.Now;
            entity.UpdatedBy = updatedBy;

            _context.Permissions.Update(entity);
            await _context.SaveChangesAsync();

            // 更新所有子级权限的路径和层级
            var descendants = await _context.Permissions
                .Where(x => x.Path.Contains(oldPath) && x.Id != entity.Id)
                .ToListAsync();

            foreach (var descendant in descendants)
            {
                var relativePath = descendant.Path.Replace(oldPath, "");
                descendant.Path = $"{entity.Path}{relativePath}";

                descendant.UpdatedAt = DateTime.Now;
                descendant.UpdatedBy = updatedBy;
            }

            if (descendants.Any())
            {
                _context.Permissions.UpdateRange(descendants);
                await _context.SaveChangesAsync();
            }
        }

        #endregion
    }
}