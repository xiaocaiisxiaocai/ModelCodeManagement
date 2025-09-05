using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 组织架构服务实现
    /// </summary>
    public class OrganizationService : IOrganizationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrganizationService> _logger;
        private readonly IAuditLogService _auditLogService;

        public OrganizationService(
            ApplicationDbContext context,
            ILogger<OrganizationService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<ApiResponse<PagedResult<OrganizationDto>>> GetPagedAsync(OrganizationQueryDto query)
        {
            try
            {
                // 验证分页参数
                if (query.PageIndex <= 0) query.PageIndex = 1;
                if (query.PageSize <= 0) query.PageSize = 20;
                if (query.PageSize > 100) query.PageSize = 100; // 限制最大页面大小
                var queryable = _context.Organizations.AsQueryable();

                // 根据条件筛选
                if (!string.IsNullOrWhiteSpace(query.Type))
                {
                    queryable = queryable.Where(x => x.Type == query.Type);
                }

                if (query.ParentId.HasValue)
                {
                    queryable = queryable.Where(x => x.ParentId == query.ParentId.Value);
                }

                if (query.IsActive.HasValue)
                {
                    queryable = queryable.Where(x => x.IsActive == query.IsActive.Value);
                }

                if (!string.IsNullOrWhiteSpace(query.Keyword))
                {
                    queryable = queryable.Where(x => 
                        x.Name.Contains(query.Keyword) ||
                        x.Description!.Contains(query.Keyword));
                }

                // 排序
                var sortField = string.IsNullOrWhiteSpace(query.SortField) ? "Level" : query.SortField;
                var isDesc = query.SortOrder?.ToLower() == "desc";

                // 根据排序字段动态排序
                switch (sortField.ToLower())
                {
                    case "name":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Name) : queryable.OrderBy(x => x.Name);
                        break;
                    case "type":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Type) : queryable.OrderBy(x => x.Type);
                        break;
                    case "level":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Level) : queryable.OrderBy(x => x.Level);
                        break;
                    case "createdat":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.CreatedAt) : queryable.OrderBy(x => x.CreatedAt);
                        break;
                    default:
                        queryable = queryable.OrderBy(x => x.Level).ThenBy(x => x.SortOrder);
                        break;
                }

                // 分页查询
                var total = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = new List<OrganizationDto>();
                foreach (var item in items)
                {
                    var dto = await MapToDto(item);
                    dtos.Add(dto);
                }

                var result = new PagedResult<OrganizationDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询组织架构成功 - 获取{Count}条记录，共{Total}条", dtos.Count, total);
                return ApiResponse<PagedResult<OrganizationDto>>.SuccessResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询组织架构失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<OrganizationDto>>.ErrorResult($"查询组织架构失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<OrganizationDto>> GetByIdAsync(int id)
        {
            try
            {
                var entity = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的组织架构", id);
                    return ApiResponse<OrganizationDto>.ErrorResult("组织架构不存在");
                }

                var dto = await MapToDto(entity);
                return ApiResponse<OrganizationDto>.SuccessResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取组织架构失败 - Id: {Id}", id);
                return ApiResponse<OrganizationDto>.ErrorResult($"获取组织架构失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<OrganizationTreeDto>>> GetTreeAsync()
        {
            try
            {
                var entities = await _context.Organizations
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.Level)
                    .ThenBy(x => x.SortOrder)
                    .ToListAsync();

                var tree = BuildTree(entities);
                _logger.LogInformation("获取组织架构树成功 - Count: {Count}", entities.Count);
                return ApiResponse<List<OrganizationTreeDto>>.SuccessResult(tree);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取组织架构树失败");
                return ApiResponse<List<OrganizationTreeDto>>.ErrorResult($"获取组织架构树失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<OrganizationDto>>> GetChildrenAsync(int? parentId = null)
        {
            try
            {
                var queryable = _context.Organizations
                    .Where(x => x.IsActive);

                if (parentId.HasValue)
                {
                    queryable = queryable.Where(x => x.ParentId == parentId.Value);
                }
                else
                {
                    queryable = queryable.Where(x => x.ParentId == null);
                }

                var entities = await queryable
                    .OrderBy(x => x.SortOrder)
                    .ToListAsync();

                var dtos = new List<OrganizationDto>();
                foreach (var entity in entities)
                {
                    var dto = await MapToDto(entity);
                    dtos.Add(dto);
                }

                _logger.LogInformation("获取子组织成功 - ParentId: {ParentId}, Count: {Count}", parentId, dtos.Count);
                return ApiResponse<List<OrganizationDto>>.SuccessResult(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取子组织失败 - ParentId: {ParentId}", parentId);
                return ApiResponse<List<OrganizationDto>>.ErrorResult($"获取子组织失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<OrganizationDto>> CreateAsync(CreateOrganizationDto dto, int? createdBy = null)
        {
            try
            {


                // 获取父级信息计算路径和层级
                var parentPath = "/";
                var level = 1;
                if (dto.ParentId.HasValue)
                {
                    var parent = await _context.Organizations
                        .FirstOrDefaultAsync(x => x.Id == dto.ParentId.Value);
                    
                    if (parent == null)
                    {
                        _logger.LogWarning("创建组织架构失败 - 父级组织不存在: {ParentId}", dto.ParentId.Value);
                        return ApiResponse<OrganizationDto>.ErrorResult("父级组织不存在");
                    }
                    
                    parentPath = parent.Path;
                    level = parent.Level + 1;
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var entity = new Organization
                    {
                        Name = dto.Name,
                        Type = dto.Type,
                        ParentId = dto.ParentId,
                        Level = level,
                        SortOrder = dto.SortOrder,
                        ManagerId = dto.ManagerId,
                        Description = dto.Description,
                        Phone = dto.Phone,
                        Email = dto.Email,
                        IsActive = dto.IsActive,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now,
                        CreatedBy = createdBy,
                        UpdatedBy = createdBy
                    };

                    _context.Organizations.Add(entity);
                    await _context.SaveChangesAsync();

                    // 更新路径
                    entity.Path = $"{parentPath}{entity.Id}/";
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    var result = await MapToDto(entity);
                    
                    await _auditLogService.LogActionAsync("CreateOrganization", 
                        $"创建组织架构: {dto.Name}", "Organization", entity.Id);
                    
                    _logger.LogInformation("创建组织架构成功 - Name: {Name}, Id: {Id}", 
                        dto.Name, entity.Id);
                    
                    return ApiResponse<OrganizationDto>.SuccessResult(result, "组织架构创建成功");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建组织架构失败 - Name: {Name}", dto.Name);
                return ApiResponse<OrganizationDto>.ErrorResult($"创建组织架构失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<OrganizationDto>> UpdateAsync(int id, UpdateOrganizationDto dto, int? updatedBy = null)
        {
            try
            {
                var entity = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的组织架构", id);
                    return ApiResponse<OrganizationDto>.ErrorResult("组织架构不存在");
                }

                // 检查编码是否已存在（排除当前记录）
                if (await ExistsAsync(dto.Name, id))
                {
                    _logger.LogWarning("更新组织架构失败 - 编码已存在: {Code}", dto.Name);
                    return ApiResponse<OrganizationDto>.ErrorResult($"组织编码 '{dto.Name}' 已存在");
                }

                // entity.Name = dto.Name;
                entity.Name = dto.Name;
                entity.Type = dto.Type;
                entity.SortOrder = dto.SortOrder;
                entity.ManagerId = dto.ManagerId;
                entity.Description = dto.Description;
                entity.Phone = dto.Phone;
                entity.Email = dto.Email;
                entity.IsActive = dto.IsActive;
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = updatedBy;

                await _context.SaveChangesAsync();

                var result = await MapToDto(entity);
                
                await _auditLogService.LogActionAsync("UpdateOrganization", 
                    $"更新组织架构: {dto.Name} ({dto.Name})", "Organization", entity.Id);
                
                _logger.LogInformation("更新组织架构成功 - Id: {Id}, Code: {Code}, Name: {Name}", 
                    id, dto.Name, dto.Name);
                
                return ApiResponse<OrganizationDto>.SuccessResult(result, "组织架构更新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新组织架构失败 - Id: {Id}", id);
                return ApiResponse<OrganizationDto>.ErrorResult($"更新组织架构失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var entity = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的组织架构", id);
                    return ApiResponse.ErrorResult("组织架构不存在");
                }

                if (!await CanDeleteAsync(id))
                {
                    _logger.LogWarning("删除组织架构失败 - 存在子组织或用户: Id={Id}", id);
                    return ApiResponse.ErrorResult("该组织下还有子组织或用户，不能删除");
                }

                _context.Organizations.Remove(entity);
                await _context.SaveChangesAsync();

                await _auditLogService.LogActionAsync("DeleteOrganization", 
                    $"删除组织架构: {entity.Name} ({entity.Name})", "Organization", entity.Id);
                
                _logger.LogInformation("删除组织架构成功 - Id: {Id}, Name: {Name}", id, entity.Name);

                return ApiResponse.SuccessResult("组织架构删除成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除组织架构失败 - Id: {Id}", id);
                return ApiResponse.ErrorResult($"删除组织架构失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> MoveAsync(int id, MoveOrganizationDto dto, int? updatedBy = null)
        {
            var entity = await _context.Organizations
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse.ErrorResult("组织架构不存在");
            }

            // 检查目标父级
            if (dto.TargetParentId.HasValue)
            {
                var targetParent = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == dto.TargetParentId.Value);
                
                if (targetParent == null)
                {
                    return ApiResponse.ErrorResult("目标父级组织不存在");
                }

                // 检查是否会形成循环引用
                if (targetParent.Path.Contains($"/{id}/"))
                {
                    return ApiResponse.ErrorResult("不能移动到自己的子级组织下");
                }
            }

            // 更新组织信息
            await UpdateOrganizationHierarchy(entity, dto.TargetParentId, dto.SortOrder, updatedBy);

            return ApiResponse.SuccessResult("组织架构移动成功");
        }

        public async Task<bool> ExistsAsync(string code, int? excludeId = null)
        {
            try
            {
                var queryable = _context.Organizations
                    .Where(x => x.Name == code);

                if (excludeId.HasValue)
                {
                    queryable = queryable.Where(x => x.Id != excludeId.Value);
                }

                return await queryable.AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查组织架构编码存在性失败 - Code: {Code}", code);
                return false;
            }
        }

        public async Task<bool> CanDeleteAsync(int id)
        {
            try
            {
                // 检查是否有子组织
                var hasChildren = await _context.Organizations
                    .Where(x => x.ParentId == id)
                    .AnyAsync();

                if (hasChildren)
                {
                    return false;
                }

                // 检查是否有用户
                var hasUsers = await _context.Users
                    .Where(x => x.OrganizationId == id)
                    .AnyAsync();

                return !hasUsers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查组织架构是否可删除失败 - Id: {Id}", id);
                return false;
            }
        }

        public async Task<ApiResponse<List<OrganizationDto>>> GetAncestorsAsync(int id)
        {
            var entity = await _context.Organizations
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse<List<OrganizationDto>>.ErrorResult("组织架构不存在");
            }

            var pathIds = entity.Path.Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Where(x => int.TryParse(x, out _))
                .Select(int.Parse)
                .Where(x => x != id)
                .ToList();

            if (!pathIds.Any())
            {
                return ApiResponse<List<OrganizationDto>>.SuccessResult(new List<OrganizationDto>());
            }

            var ancestors = await _context.Organizations
                .Where(x => pathIds.Contains(x.Id))
                .OrderBy(x => x.Level)
                .ToListAsync();

            var dtos = new List<OrganizationDto>();
            foreach (var ancestor in ancestors)
            {
                var dto = await MapToDto(ancestor);
                dtos.Add(dto);
            }

            return ApiResponse<List<OrganizationDto>>.SuccessResult(dtos);
        }

        public async Task<ApiResponse<List<OrganizationDto>>> GetDescendantsAsync(int id)
        {
            var entity = await _context.Organizations
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null)
            {
                return ApiResponse<List<OrganizationDto>>.ErrorResult("组织架构不存在");
            }

            var descendants = await _context.Organizations
                .Where(x => x.Path.Contains($"/{id}/") && x.Id != id)
                .OrderBy(x => x.Level)
                .ThenBy(x => x.SortOrder)
                .ToListAsync();

            var dtos = new List<OrganizationDto>();
            foreach (var descendant in descendants)
            {
                var dto = await MapToDto(descendant);
                dtos.Add(dto);
            }

            return ApiResponse<List<OrganizationDto>>.SuccessResult(dtos);
        }

        public async Task<ApiResponse<List<OrganizationDto>>> GetUserOrganizationPathAsync(int userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Id == userId);

            if (user == null)
            {
                return ApiResponse<List<OrganizationDto>>.ErrorResult("用户不存在");
            }

            if (!user.OrganizationId.HasValue)
            {
                return ApiResponse<List<OrganizationDto>>.SuccessResult(new List<OrganizationDto>());
            }

            return await GetAncestorsAsync(user.OrganizationId.Value);
        }

        #region 私有方法

        /// <summary>
        /// 获取组织的用户总数（支持所有层级挂载人员）
        /// 统计规则：当前组织直接人员 + 所有下级组织的人员总数
        /// </summary>
        /// <param name="organizationId">组织ID</param>
        /// <param name="path">组织路径</param>
        /// <returns>用户总数</returns>
        private async Task<int> GetTotalUserCountAsync(int organizationId, string path)
        {
            // 获取当前组织信息
            var currentOrg = await _context.Organizations
                .FirstOrDefaultAsync(x => x.Id == organizationId);
            
            if (currentOrg == null) return 0;

            // 1. 统计直接分配到当前组织的用户数量
            var directUserCount = await _context.Users
                .Where(x => x.OrganizationId == organizationId)
                .CountAsync();

            // 2. 统计所有下级组织的用户数量
            var subordinateUserCount = 0;
            
            // 获取所有下级组织ID（路径包含当前组织路径且不是当前组织本身）
            var subordinateOrgIds = await _context.Organizations
                .Where(x => x.Path.StartsWith(path) && x.Id != organizationId)
                .Select(x => x.Id)
                .ToListAsync();

            if (subordinateOrgIds.Any())
            {
                // 统计所有下级组织的用户总数
                subordinateUserCount = await _context.Users
                    .Where(x => x.OrganizationId.HasValue && subordinateOrgIds.Contains(x.OrganizationId.Value))
                    .CountAsync();
            }

            // 返回当前组织直接人员 + 所有下级组织人员的总数
            return directUserCount + subordinateUserCount;
        }

        private async Task<OrganizationDto> MapToDto(Organization entity)
        {
            var dto = new OrganizationDto
            {
                Id = entity.Id,

                Name = entity.Name,
                Type = entity.Type,
                ParentId = entity.ParentId,
                Path = entity.Path,
                Level = entity.Level,
                SortOrder = entity.SortOrder,
                ManagerId = entity.ManagerId,
                Description = entity.Description,
                Phone = entity.Phone,
                Email = entity.Email,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                CreatedBy = entity.CreatedBy,
                UpdatedBy = entity.UpdatedBy
            };

            // 获取父级名称
            if (entity.ParentId.HasValue)
            {
                var parent = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == entity.ParentId.Value);
                dto.ParentName = parent?.Name;
            }

            // 获取负责人名称
            if (entity.ManagerId.HasValue)
            {
                var manager = await _context.Users
                    .FirstOrDefaultAsync(x => x.Id == entity.ManagerId.Value);
                dto.ManagerName = manager?.UserName;
            }

            // 获取用户数量 - 包括当前组织及所有下级组织的用户
            dto.UserCount = await GetTotalUserCountAsync(entity.Id, entity.Path);

            return dto;
        }

        private List<OrganizationTreeDto> BuildTree(List<Organization> entities)
        {
            var tree = new List<OrganizationTreeDto>();
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

        private void BuildTreeNode(OrganizationTreeDto node, ILookup<int?, Organization> lookup)
        {
            var children = lookup[node.Id].ToList();
            foreach (var child in children)
            {
                var childNode = MapToTreeDto(child);
                BuildTreeNode(childNode, lookup);
                node.Children.Add(childNode);
            }
        }

        private OrganizationTreeDto MapToTreeDto(Organization entity)
        {
            return new OrganizationTreeDto
            {
                Id = entity.Id,

                Name = entity.Name,
                Type = entity.Type,
                ParentId = entity.ParentId,
                Level = entity.Level,
                SortOrder = entity.SortOrder,
                IsActive = entity.IsActive,
                UserCount = 0 // 可以后续优化批量查询
            };
        }

        private async Task UpdateOrganizationHierarchy(Organization entity, int? newParentId, int sortOrder, int? updatedBy)
        {
            var oldPath = entity.Path;
            var newPath = "/";
            var newLevel = 1;

            if (newParentId.HasValue)
            {
                var newParent = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == newParentId.Value);
                if (newParent != null)
                {
                    newPath = newParent.Path;
                    newLevel = newParent.Level + 1;
                }
            }

            // 更新当前组织
            entity.ParentId = newParentId;
            entity.Level = newLevel;
            entity.SortOrder = sortOrder;
            entity.Path = $"{newPath}{entity.Id}/";
            entity.UpdatedAt = DateTime.Now;
            entity.UpdatedBy = updatedBy;

            _context.Organizations.Update(entity);
            await _context.SaveChangesAsync();

            // 更新所有子级组织的路径和层级
            var descendants = await _context.Organizations
                .Where(x => x.Path.Contains(oldPath) && x.Id != entity.Id)
                .ToListAsync();

            foreach (var descendant in descendants)
            {
                var relativePath = descendant.Path.Replace(oldPath, "");
                descendant.Path = $"{entity.Path}{relativePath}";
                descendant.Level = entity.Level + descendant.Path.Split('/', StringSplitOptions.RemoveEmptyEntries).Length - 1;
                descendant.UpdatedAt = DateTime.Now;
                descendant.UpdatedBy = updatedBy;
            }

            if (descendants.Any())
            {
                _context.Organizations.UpdateRange(descendants);
                await _context.SaveChangesAsync();
            }
        }

        #endregion
    }
}