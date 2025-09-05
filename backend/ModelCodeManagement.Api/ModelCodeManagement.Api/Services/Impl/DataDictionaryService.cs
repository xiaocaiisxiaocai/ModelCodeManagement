using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 数据字典服务实现
    /// </summary>
    public class DataDictionaryService : IDataDictionaryService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DataDictionaryService> _logger;
        private readonly IAuditLogService _auditLogService;

        public DataDictionaryService(
            ApplicationDbContext context,
            ILogger<DataDictionaryService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<ApiResponse<PagedResult<DataDictionaryDto>>> GetPagedAsync(DataDictionaryQueryDto query)
        {
            try
            {
                // 验证分页参数
                if (query.PageIndex <= 0) query.PageIndex = 1;
                if (query.PageSize <= 0) query.PageSize = 20;
                if (query.PageSize > 100) query.PageSize = 100; // 限制最大页面大小
                var queryable = _context.DataDictionaries.AsQueryable();

                // 根据条件筛选
                if (!string.IsNullOrWhiteSpace(query.Category))
                {
                    queryable = queryable.Where(x => x.Category == query.Category);
                }

                if (!string.IsNullOrWhiteSpace(query.Keyword))
                {
                    queryable = queryable.Where(x => 
                        x.Code.Contains(query.Keyword) || 
                        x.Name.Contains(query.Keyword));
                }

                // 排序
                var sortField = string.IsNullOrWhiteSpace(query.SortField) ? "Category" : query.SortField;
                var isDesc = query.SortOrder?.ToLower() == "desc";

                // 根据排序字段动态排序
                switch (sortField.ToLower())
                {
                    case "category":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Category) : queryable.OrderBy(x => x.Category);
                        break;
                    case "code":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Code) : queryable.OrderBy(x => x.Code);
                        break;
                    case "name":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.Name) : queryable.OrderBy(x => x.Name);
                        break;
                    case "createdat":
                        queryable = isDesc ? queryable.OrderByDescending(x => x.CreatedAt) : queryable.OrderBy(x => x.CreatedAt);
                        break;
                    default:
                        queryable = queryable.OrderBy(x => x.Category).ThenBy(x => x.Id);
                        break;
                }

                // 分页查询
                var total = await queryable.CountAsync();
                var items = await queryable
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = items.Select(x => new DataDictionaryDto
                {
                    Id = x.Id,
                    Category = x.Category,
                    Code = x.Code,
                    Name = x.Name,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt,
                    CreatedBy = x.CreatedBy,
                    UpdatedBy = x.UpdatedBy
                }).ToList();

                var result = new PagedResult<DataDictionaryDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询数据字典成功 - 获取{Count}条记录，共{Total}条", dtos.Count, total);
                return ApiResponse<PagedResult<DataDictionaryDto>>.SuccessResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询数据字典失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<DataDictionaryDto>>.ErrorResult($"查询数据字典失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<DataDictionaryDto>> GetByIdAsync(int id)
        {
            try
            {
                var entity = await _context.DataDictionaries
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的数据字典", id);
                    return ApiResponse<DataDictionaryDto>.ErrorResult("数据字典不存在");
                }

                var dto = new DataDictionaryDto
                {
                    Id = entity.Id,
                    Category = entity.Category,
                    Code = entity.Code,
                    Name = entity.Name,
                    CreatedAt = entity.CreatedAt,
                    UpdatedAt = entity.UpdatedAt,
                    CreatedBy = entity.CreatedBy,
                    UpdatedBy = entity.UpdatedBy
                };

                return ApiResponse<DataDictionaryDto>.SuccessResult(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取数据字典失败 - ID: {Id}", id);
                return ApiResponse<DataDictionaryDto>.ErrorResult($"获取数据字典失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<DataDictionaryOptionDto>>> GetOptionsByTypeAsync(string type)
        {
            try
            {
                var entities = await _context.DataDictionaries
                    .Where(x => x.Category == type)
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                var options = entities.Select(x => new DataDictionaryOptionDto
                {
                    Code = x.Code,
                    Name = x.Name
                }).ToList();

                _logger.LogInformation("按类型查询数据字典选项成功 - Type: {Type}, Count: {Count}", type, options.Count);
                return ApiResponse<List<DataDictionaryOptionDto>>.SuccessResult(options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "按类型查询数据字典选项失败 - Type: {Type}", type);
                return ApiResponse<List<DataDictionaryOptionDto>>.ErrorResult($"按类型查询数据字典选项失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<DataDictionaryGroupDto>>> GetAllGroupedAsync()
        {
            try
            {
                var entities = await _context.DataDictionaries
                    .OrderBy(x => x.Category)
                    .ThenBy(x => x.Id)
                    .ToListAsync();

                var grouped = entities
                    .GroupBy(x => x.Category)
                    .Select(g => new DataDictionaryGroupDto
                    {
                        Category = g.Key,
                        Options = g.Select(x => new DataDictionaryOptionDto
                        {
                            Code = x.Code,
                            Name = x.Name
                        }).ToList()
                    })
                    .ToList();

                _logger.LogInformation("获取全部分组数据字典成功 - GroupCount: {Count}", grouped.Count);
                return ApiResponse<List<DataDictionaryGroupDto>>.SuccessResult(grouped);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取全部分组数据字典失败");
                return ApiResponse<List<DataDictionaryGroupDto>>.ErrorResult($"获取全部分组数据字典失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<DataDictionaryDto>> CreateAsync(CreateDataDictionaryDto dto, int? createdBy = null)
        {
            try
            {
                // 检查键值是否已存在
                if (await ExistsAsync(dto.Category, dto.Code))
                {
                    _logger.LogWarning("创建数据字典失败 - 编码已存在: Category={Category}, Code={Code}", dto.Category, dto.Code);
                    return ApiResponse<DataDictionaryDto>.ErrorResult($"分类 '{dto.Category}' 下的编码 '{dto.Code}' 已存在");
                }

                var entity = new DataDictionary
                {
                    Category = dto.Category,
                    Code = dto.Code,
                    Name = dto.Name,
                    ParentId = dto.ParentId,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    CreatedBy = createdBy,
                    UpdatedBy = createdBy
                };

                _context.DataDictionaries.Add(entity);
                await _context.SaveChangesAsync();

                var result = new DataDictionaryDto
                {
                    Id = entity.Id,
                    Category = entity.Category,
                    Code = entity.Code,
                    Name = entity.Name,
                    ParentId = entity.ParentId,
                    CreatedAt = entity.CreatedAt,
                    UpdatedAt = entity.UpdatedAt,
                    CreatedBy = entity.CreatedBy,
                    UpdatedBy = entity.UpdatedBy
                };

                await _auditLogService.LogActionAsync("CreateDataDictionary", 
                    $"创建数据字典: {dto.Category} - {dto.Code}", "DataDictionary", entity.Id);
                
                _logger.LogInformation("创建数据字典成功 - Category: {Category}, Code: {Code}, Id: {Id}", 
                    dto.Category, dto.Code, entity.Id);
                
                return ApiResponse<DataDictionaryDto>.SuccessResult(result, "数据字典创建成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建数据字典失败 - Category: {Category}, Code: {Code}", dto.Category, dto.Code);
                return ApiResponse<DataDictionaryDto>.ErrorResult($"创建数据字典失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<DataDictionaryDto>> UpdateAsync(int id, UpdateDataDictionaryDto dto, int? updatedBy = null)
        {
            try
            {
                var entity = await _context.DataDictionaries
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的数据字典", id);
                    return ApiResponse<DataDictionaryDto>.ErrorResult("数据字典不存在");
                }

                // 检查键值是否已存在（排除当前记录）
                if (await ExistsAsync(entity.Category, dto.Code, id))
                {
                    _logger.LogWarning("更新数据字典失败 - 编码已存在: Category={Category}, Code={Code}", entity.Category, dto.Code);
                    return ApiResponse<DataDictionaryDto>.ErrorResult($"分类 '{entity.Category}' 下的编码 '{dto.Code}' 已存在");
                }

                entity.Code = dto.Code;
                entity.Name = dto.Name;
                entity.ParentId = dto.ParentId; // 支持ParentId字段更新
                entity.UpdatedAt = DateTime.Now;
                entity.UpdatedBy = updatedBy;

                await _context.SaveChangesAsync();

                var result = new DataDictionaryDto
                {
                    Id = entity.Id,
                    Category = entity.Category,
                    Code = entity.Code,
                    Name = entity.Name,
                    ParentId = entity.ParentId,
                    CreatedAt = entity.CreatedAt,
                    UpdatedAt = entity.UpdatedAt,
                    CreatedBy = entity.CreatedBy,
                    UpdatedBy = entity.UpdatedBy
                };

                await _auditLogService.LogActionAsync("UpdateDataDictionary", 
                    $"更新数据字典: {entity.Category} - {dto.Code}", "DataDictionary", entity.Id);
                
                _logger.LogInformation("更新数据字典成功 - Id: {Id}, Category: {Category}, Code: {Code}", 
                    id, entity.Category, dto.Code);

                return ApiResponse<DataDictionaryDto>.SuccessResult(result, "数据字典更新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新数据字典失败 - Id: {Id}", id);
                return ApiResponse<DataDictionaryDto>.ErrorResult($"更新数据字典失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var entity = await _context.DataDictionaries
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的数据字典", id);
                    return ApiResponse.ErrorResult("数据字典不存在");
                }


                _context.DataDictionaries.Remove(entity);
                await _context.SaveChangesAsync();

                await _auditLogService.LogActionAsync("DeleteDataDictionary", 
                    $"删除数据字典: {entity.Category} - {entity.Code}", "DataDictionary", entity.Id);
                
                _logger.LogInformation("删除数据字典成功 - Id: {Id}, Category: {Category}, Code: {Code}", 
                    id, entity.Category, entity.Code);

                return ApiResponse.SuccessResult("数据字典删除成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除数据字典失败 - Id: {Id}", id);
                return ApiResponse.ErrorResult($"删除数据字典失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse> BatchDeleteAsync(List<int> ids)
        {
            try
            {
                if (ids == null || ids.Count == 0)
                {
                    return ApiResponse.ErrorResult("请选择要删除的数据");
                }


                var entitiesToDelete = await _context.DataDictionaries
                    .Where(x => ids.Contains(x.Id))
                    .ToListAsync();

                _context.DataDictionaries.RemoveRange(entitiesToDelete);
                await _context.SaveChangesAsync();

                await _auditLogService.LogActionAsync("BatchDeleteDataDictionary", 
                    $"批量删除数据字典: {entitiesToDelete.Count}条");
                
                _logger.LogInformation("批量删除数据字典成功 - Count: {Count}", entitiesToDelete.Count);

                return ApiResponse.SuccessResult($"成功删除 {entitiesToDelete.Count} 条数据字典");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量删除数据字典失败 - Ids: {Ids}", string.Join(",", ids));
                return ApiResponse.ErrorResult($"批量删除数据字典失败: {ex.Message}");
            }
        }

        public async Task<bool> ExistsAsync(string type, string key, int? excludeId = null)
        {
            try
            {
                var queryable = _context.DataDictionaries
                    .Where(x => x.Category == type && x.Code == key);

                if (excludeId.HasValue)
                {
                    queryable = queryable.Where(x => x.Id != excludeId.Value);
                }

                return await queryable.AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "检查数据字典存在性失败 - Type: {Type}, Key: {Key}", type, key);
                return false;
            }
        }

        public async Task<ApiResponse<List<string>>> GetAllTypesAsync()
        {
            try
            {
                var types = await _context.DataDictionaries
                    .Select(x => x.Category)
                    .Distinct()
                    .OrderBy(x => x)
                    .ToListAsync();

                _logger.LogInformation("获取所有数据字典类型成功 - Count: {Count}", types.Count);
                return ApiResponse<List<string>>.SuccessResult(types);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取所有数据字典类型失败");
                return ApiResponse<List<string>>.ErrorResult($"获取所有数据字典类型失败: {ex.Message}");
            }
        }

        // === 前端数据字典接口适配实现 ===

        public async Task<ApiResponse<List<CustomerDto>>> GetCustomersAsync()
        {
            try
            {
                var customers = await _context.DataDictionaries
                    .Where(x => x.Category == "Customer")
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                var customerDtos = customers.Select(x => new CustomerDto
                {
                    Id = x.Id.ToString(),
                    Name = x.Name
                }).ToList();

                _logger.LogInformation("获取客户列表成功 - Count: {Count}", customerDtos.Count);
                return ApiResponse<List<CustomerDto>>.SuccessResult(customerDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取客户列表失败");
                return ApiResponse<List<CustomerDto>>.ErrorResult($"获取客户列表失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<FactoryDto>>> GetFactoriesAsync()
        {
            try
            {
                // 获取所有厂区数据
                var factories = await _context.DataDictionaries
                    .Where(x => x.Category == "Factory")
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                // 获取所有客户数据用于名称映射
                var customers = await _context.DataDictionaries
                    .Where(x => x.Category == "Customer")
                    .ToListAsync();

                var factoryDtos = factories.Select(x => 
                {
                    // 通过ParentId找到关联的客户
                    var customer = customers.FirstOrDefault(c => c.Id == x.ParentId);
                    return new FactoryDto
                    {
                        Id = x.Id.ToString(),
                        Name = x.Name,
                        CustomerId = x.ParentId?.ToString() ?? "" // 直接返回ParentId作为CustomerId
                    };
                }).ToList();

                _logger.LogInformation("获取厂区列表成功 - Count: {Count}", factoryDtos.Count);
                return ApiResponse<List<FactoryDto>>.SuccessResult(factoryDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取厂区列表失败");
                return ApiResponse<List<FactoryDto>>.ErrorResult($"获取厂区列表失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<FactoryDto>>> GetFactoriesByCustomerAsync(string customerId)
        {
            try
            {
                // 将customerId转换为int进行查询
                if (!int.TryParse(customerId, out int customerIdInt))
                {
                    _logger.LogWarning("客户ID格式无效 - CustomerId: {CustomerId}", customerId);
                    return ApiResponse<List<FactoryDto>>.ErrorResult("客户ID格式无效");
                }

                // 验证客户是否存在
                var customer = await _context.DataDictionaries
                    .Where(x => x.Category == "Customer" && x.Id == customerIdInt)
                    .FirstOrDefaultAsync();
                
                if (customer == null)
                {
                    _logger.LogWarning("未找到客户 - CustomerId: {CustomerId}", customerId);
                    return ApiResponse<List<FactoryDto>>.ErrorResult("客户不存在");
                }

                // 根据ParentId获取厂区
                var factories = await _context.DataDictionaries
                    .Where(x => x.Category == "Factory" && x.ParentId == customerIdInt)
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                var factoryDtos = factories.Select(x => new FactoryDto
                {
                    Id = x.Id.ToString(),
                    Name = x.Name,
                    CustomerId = x.ParentId?.ToString() ?? "" // 返回ParentId作为CustomerId
                }).ToList();

                _logger.LogInformation("根据客户ID获取厂区列表成功 - CustomerId: {CustomerId}, Count: {Count}", customerId, factoryDtos.Count);
                return ApiResponse<List<FactoryDto>>.SuccessResult(factoryDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "根据客户ID获取厂区列表失败 - CustomerId: {CustomerId}", customerId);
                return ApiResponse<List<FactoryDto>>.ErrorResult($"获取厂区列表失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<ProductNameDto>>> GetProductNamesAsync()
        {
            try
            {
                var productNames = await _context.DataDictionaries
                    .Where(x => x.Category == "ProductName")
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                var productNameDtos = productNames.Select(x => new ProductNameDto
                {
                    Id = x.Id.ToString(),
                    Name = x.Name
                }).ToList();

                _logger.LogInformation("获取品名列表成功 - Count: {Count}", productNameDtos.Count);
                return ApiResponse<List<ProductNameDto>>.SuccessResult(productNameDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取品名列表失败");
                return ApiResponse<List<ProductNameDto>>.ErrorResult($"获取品名列表失败: {ex.Message}");
            }
        }

        public async Task<ApiResponse<List<OccupancyTypeDto>>> GetOccupancyTypesAsync()
        {
            try
            {
                var occupancyTypes = await _context.DataDictionaries
                    .Where(x => x.Category == "OccupancyType")
                    .OrderBy(x => x.Id)
                    .ToListAsync();

                var occupancyTypeDtos = occupancyTypes.Select(x => new OccupancyTypeDto
                {
                    Id = x.Id.ToString(),
                    Name = x.Name
                }).ToList();

                _logger.LogInformation("获取占用类型列表成功 - Count: {Count}", occupancyTypeDtos.Count);
                return ApiResponse<List<OccupancyTypeDto>>.SuccessResult(occupancyTypeDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取占用类型列表失败");
                return ApiResponse<List<OccupancyTypeDto>>.ErrorResult($"获取占用类型列表失败: {ex.Message}");
            }
        }

    }
}