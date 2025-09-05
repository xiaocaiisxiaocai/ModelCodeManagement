using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Extensions
{
    /// <summary>
    /// 实体与DTO映射扩展方法
    /// </summary>
    public static class MapperExtensions
    {
        #region ProductType 映射

        /// <summary>
        /// ProductType 实体转 DTO
        /// </summary>
        public static ProductTypeDto ToDto(this ProductType entity)
        {
            return new ProductTypeDto
            {
                Id = entity.Id,
                Code = entity.Code,
                CreatedAt = entity.CreatedAt,
                ModelClassificationCount = entity.ModelClassifications?.Count ?? 0
            };
        }

        /// <summary>
        /// CreateProductTypeDto 转实体
        /// </summary>
        public static ProductType ToEntity(this CreateProductTypeDto dto)
        {
            return new ProductType
            {
                Code = dto.Code,
                CreatedAt = DateTime.Now
            };
        }

        /// <summary>
        /// 更新实体
        /// </summary>
        public static void UpdateFromDto(this ProductType entity, UpdateProductTypeDto dto)
        {
            entity.Code = dto.Code;
        }

        #endregion

        #region ModelClassification 映射

        /// <summary>
        /// ModelClassification 实体转 DTO
        /// </summary>
        public static ModelClassificationDto ToDto(this ModelClassification entity)
        {
            return new ModelClassificationDto
            {
                Id = entity.Id,
                Type = entity.Type,
                Description = entity.Description,
                ProductType = entity.ProductType?.Code ?? "",
                ProductTypeId = entity.ProductTypeId,
                HasCodeClassification = entity.HasCodeClassification,
                CreatedAt = entity.CreatedAt,
                CodeClassificationCount = entity.CodeClassifications?.Count ?? 0,
                CodeUsageCount = entity.CodeUsageEntries?.Count ?? 0
            };
        }

        /// <summary>
        /// CreateModelClassificationDto 转实体
        /// </summary>
        public static ModelClassification ToEntity(this CreateModelClassificationDto dto)
        {
            var entity = new ModelClassification
            {
                Type = dto.Type,
                ProductTypeId = dto.ProductTypeId,
                HasCodeClassification = dto.HasCodeClassification,
                CreatedAt = DateTime.Now
            };
            entity.Description = dto.Description;
            return entity;
        }

        /// <summary>
        /// 更新实体
        /// </summary>
        public static void UpdateFromDto(this ModelClassification entity, UpdateModelClassificationDto dto)
        {
            entity.Type = dto.Type;
            entity.ProductTypeId = dto.ProductTypeId;
            entity.HasCodeClassification = dto.HasCodeClassification;
            entity.Description = dto.Description;
        }

        #endregion

        #region CodeClassification 映射

        /// <summary>
        /// CodeClassification 实体转 DTO
        /// </summary>
        public static CodeClassificationDto ToDto(this CodeClassification entity)
        {
            var allocatedCount = entity.CodeUsageEntries?.Count(c => c.IsAllocated) ?? 0;
            var totalCount = entity.CodeUsageEntries?.Count ?? 0;

            return new CodeClassificationDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                ModelType = entity.ModelClassification?.Type ?? "",
                ModelClassificationId = entity.ModelClassificationId,
                CreatedAt = entity.CreatedAt,
                CodeUsageCount = totalCount,
                AllocatedCount = allocatedCount,
                AvailableCount = totalCount - allocatedCount
            };
        }

        /// <summary>
        /// CreateCodeClassificationDto 转实体
        /// </summary>
        public static CodeClassification ToEntity(this CreateCodeClassificationDto dto)
        {
            return new CodeClassification
            {
                Code = dto.Code,
                Name = dto.Name,
                ModelClassificationId = dto.ModelClassificationId,
                CreatedAt = DateTime.Now
            };
        }

        /// <summary>
        /// 更新实体
        /// </summary>
        public static void UpdateFromDto(this CodeClassification entity, UpdateCodeClassificationDto dto)
        {
            entity.Code = dto.Code;
            entity.Name = dto.Name;
        }

        #endregion

        #region CodeUsageEntry 映射

        /// <summary>
        /// CodeUsageEntry 实体转 DTO
        /// </summary>
        public static CodeUsageEntryDto ToDto(this CodeUsageEntry entity)
        {
            return new CodeUsageEntryDto
            {
                Id = entity.Id,
                Model = entity.Model,
                ModelType = entity.ModelType,
                CodeClassification = entity.CodeClassification?.Code,
                ActualNumber = entity.ActualNumber,
                Extension = entity.Extension,
                ProductName = entity.ProductName,
                Description = entity.Description,
                OccupancyType = entity.OccupancyType,
                OccupancyTypeDisplay = GetOccupancyTypeDisplayName(entity.OccupancyType),
                CustomerId = entity.CustomerId,
                Customer = entity.Customer?.Name,
                FactoryId = entity.FactoryId,
                Factory = entity.Factory?.Name,
                Builder = entity.Builder,
                Requester = entity.Requester,
                CreationDate = entity.CreationDate,
                IsAllocated = entity.IsAllocated,
                IsDeleted = entity.IsDeleted,
                DeletedReason = entity.DeletedReason,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        /// <summary>
        /// 更新实体（分配）
        /// </summary>
        public static void UpdateFromAllocateDto(this CodeUsageEntry entity, AllocateCodeDto dto)
        {
            if (!string.IsNullOrEmpty(dto.Extension))
            {
                entity.Extension = dto.Extension;
                entity.Model = entity.Model.TrimEnd() + dto.Extension;
            }

            entity.ProductName = dto.ProductName;
            entity.Description = dto.Description;
            entity.OccupancyType = dto.OccupancyType;
            entity.CustomerId = dto.CustomerId;
            entity.FactoryId = dto.FactoryId;
            entity.Builder = dto.Builder;
            entity.Requester = dto.Requester;
            entity.CreationDate = dto.CreationDate;
            entity.IsAllocated = true;
            entity.UpdatedAt = DateTime.Now;
        }

        /// <summary>
        /// 更新实体
        /// </summary>
        public static void UpdateFromDto(this CodeUsageEntry entity, UpdateCodeUsageDto dto)
        {
            // 更新延伸码需要重新构建完整编码
            if (entity.Extension != dto.Extension)
            {
                var baseModel = entity.Model;
                if (!string.IsNullOrEmpty(entity.Extension))
                {
                    baseModel = baseModel.Substring(0, baseModel.Length - entity.Extension.Length);
                }
                entity.Extension = dto.Extension;
                entity.Model = baseModel + (dto.Extension ?? "");
            }

            entity.ProductName = dto.ProductName;
            entity.Description = dto.Description;
            entity.OccupancyType = dto.OccupancyType;
            entity.Builder = dto.Builder;
            entity.Requester = dto.Requester;
            entity.CreationDate = dto.CreationDate;
            entity.UpdatedAt = DateTime.Now;
        }

        #endregion

        #region User 映射

        /// <summary>
        /// User 实体转 DTO
        /// </summary>
        public static UserDto ToDto(this User entity)
        {
            // 获取用户的主要角色
            string roleCode = "USER"; // 默认角色，使用数据库原始格式
            
            if (entity.Roles?.Any() == true)
            {
                // 直接使用数据库角色代码，不进行转换
                var primaryRole = entity.Roles.First();
                roleCode = primaryRole.Code;
            }
            else if (entity.EmployeeId == "admin")
            {
                // admin用户的默认角色映射
                roleCode = "SUPER_ADMIN";
            }
            
            return new UserDto
            {
                Id = entity.Id,
                EmployeeId = entity.EmployeeId,
                UserName = entity.UserName,
                Email = entity.Email,
                Role = roleCode,
                Department = entity.Department,
                OrganizationId = entity.OrganizationId,
                Position = entity.Position,
                Phone = entity.Phone,
                IsActive = entity.IsActive,
                LastLoginAt = entity.LastLoginAt,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                SuperiorId = entity.SuperiorId,
                JoinDate = entity.JoinDate,
                Status = entity.Status,
                OrganizationName = entity.Organization?.Name,
                SuperiorName = entity.Superior?.UserName
            };
        }



        /// <summary>
        /// CreateUserDto 转实体
        /// </summary>
        public static User ToEntity(this CreateUserDto dto)
        {
            return new User
            {
                EmployeeId = dto.EmployeeId,
                UserName = dto.UserName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Email = dto.Email,
                // Role字段已移除，通过UserRoles关联表管理
                Department = dto.Department,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
        }

        /// <summary>
        /// 更新实体
        /// </summary>
        public static void UpdateFromDto(this User entity, UpdateUserDto dto)
        {
            entity.UserName = dto.UserName;
            entity.Email = dto.Email;
            // Role字段已移除，通过UserRoles关联表管理
            entity.Department = dto.Department;
            entity.IsActive = dto.IsActive;
            entity.UpdatedAt = DateTime.Now;
        }

        #endregion

        #region DataDictionary 映射

        /// <summary>
        /// DataDictionary 实体转 DTO
        /// </summary>
        public static DataDictionaryDto ToDto(this DataDictionary entity)
        {
            return new DataDictionaryDto
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
        }

        #endregion

        #region Organization 映射

        /// <summary>
        /// Organization 实体转 DTO
        /// </summary>
        public static OrganizationDto ToDto(this Organization entity)
        {
            return new OrganizationDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Type = entity.Type,
                Level = entity.Level,
                ParentId = entity.ParentId,
                Path = entity.Path,
                SortOrder = entity.SortOrder,
                Description = entity.Description,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        #endregion

        #region Role 映射

        /// <summary>
        /// Role 实体转 DTO
        /// </summary>
        public static RoleDto ToDto(this Role entity)
        {
            return new RoleDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        #endregion

        #region Permission 映射

        /// <summary>
        /// Permission 实体转 DTO
        /// </summary>
        public static PermissionDto ToDto(this Permission entity)
        {
            return new PermissionDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Type = entity.Type,
                ParentId = entity.ParentId,
                Path = entity.Path,
                Resource = entity.Resource,
                Action = entity.Action,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        #endregion

        #region 辅助方法

        /// <summary>
        /// 获取占用类型显示名称
        /// </summary>
        private static string? GetOccupancyTypeDisplayName(string? occupancyType)
        {
            return occupancyType switch
            {
                "PLANNING" => "规划",
                "WORK_ORDER" => "工令", 
                "PAUSE" => "暂停",
                _ => occupancyType
            };
        }

        #endregion
    }
}