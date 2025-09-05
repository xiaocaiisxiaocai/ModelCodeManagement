using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using ModelCodeManagement.Api.Entities;
using System.Text.Json;

namespace ModelCodeManagement.Api.Data
{
    /// <summary>
    /// EF Core 数据库上下文
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // 核心业务表
        public DbSet<ProductType> ProductTypes { get; set; }
        public DbSet<ModelClassification> ModelClassifications { get; set; }
        public DbSet<CodeClassification> CodeClassifications { get; set; }
        public DbSet<CodeUsageEntry> CodeUsageEntries { get; set; }
        public DbSet<SystemConfig> SystemConfigs { get; set; }

        // 用户权限表
        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }

        // 辅助表
        public DbSet<DataDictionary> DataDictionaries { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<CodePreAllocationLog> CodePreAllocationLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 配置实体关系和约束
            ConfigureProductType(modelBuilder);
            ConfigureModelClassification(modelBuilder);
            ConfigureCodeClassification(modelBuilder);
            ConfigureCodeUsageEntry(modelBuilder);
            ConfigureSystemConfig(modelBuilder);
            ConfigureUser(modelBuilder);
            ConfigureRefreshToken(modelBuilder);
            ConfigureOrganization(modelBuilder);
            ConfigureRole(modelBuilder);
            ConfigurePermission(modelBuilder);
            ConfigureUserRole(modelBuilder);
            ConfigureRolePermission(modelBuilder);
            ConfigureDataDictionary(modelBuilder);
            ConfigureAuditLog(modelBuilder);
            ConfigureCodePreAllocationLog(modelBuilder);
        }

        private void ConfigureProductType(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ProductType>(entity =>
            {
                entity.ToTable("ProductTypes");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Code).HasMaxLength(20).IsRequired();

                // 配置导航属性
                entity.HasMany(e => e.ModelClassifications)
                      .WithOne(m => m.ProductType)
                      .HasForeignKey(m => m.ProductTypeId);
            });
        }

        private void ConfigureModelClassification(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ModelClassification>(entity =>
            {
                entity.ToTable("ModelClassifications");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Type).HasMaxLength(50).IsRequired();

                // 修复：为Description属性配置JSON值转换器
                entity.Property(e => e.Description)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>(),
                        new ValueComparer<List<string>>(
                            (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
                            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                            c => c.ToList()));

                entity.Property(e => e.HasCodeClassification).HasDefaultValue(true);

                // 配置外键关系
                entity.HasOne(e => e.ProductType)
                      .WithMany(p => p.ModelClassifications)
                      .HasForeignKey(e => e.ProductTypeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void ConfigureCodeClassification(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CodeClassification>(entity =>
            {
                entity.ToTable("CodeClassifications");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ModelClassificationId).IsRequired();

                // 配置外键关系
                entity.HasOne(e => e.ModelClassification)
                      .WithMany(m => m.CodeClassifications)
                      .HasForeignKey(e => e.ModelClassificationId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureCodeUsageEntry(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CodeUsageEntry>(entity =>
            {
                entity.ToTable("CodeUsageEntries");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Model).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ModelType).HasMaxLength(20).IsRequired();
                entity.Property(e => e.ActualNumber).HasMaxLength(10).IsRequired();
                entity.Property(e => e.Extension).HasMaxLength(10);
                entity.Property(e => e.ModelClassificationId).IsRequired();
                entity.Property(e => e.CodeClassificationId).IsRequired(false);
                entity.Property(e => e.CodeClassificationNumber).IsRequired(false);
                entity.Property(e => e.ProductName).HasMaxLength(200);
                entity.Property(e => e.Description).HasColumnType("TEXT");
                entity.Property(e => e.OccupancyType).HasMaxLength(20);
                entity.Property(e => e.CustomerId).IsRequired(false);
                entity.Property(e => e.FactoryId).IsRequired(false);
                entity.Property(e => e.Builder).HasMaxLength(100);
                entity.Property(e => e.Requester).HasMaxLength(100);
                entity.Property(e => e.CreationDate).HasColumnType("DATE");
                entity.Property(e => e.IsAllocated).HasDefaultValue(false);
                entity.Property(e => e.IsDeleted).HasDefaultValue(false);
                entity.Property(e => e.NumberDigits).HasDefaultValue(2);

                // 配置外键关系
                entity.HasOne(e => e.Customer)
                      .WithMany()
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Factory)
                      .WithMany()
                      .HasForeignKey(e => e.FactoryId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureSystemConfig(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SystemConfig>(entity =>
            {
                entity.ToTable("SystemConfigs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.ConfigKey).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ConfigValue).HasColumnType("TEXT");
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });
        }

        private void ConfigureUser(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.EmployeeId).HasMaxLength(50).IsRequired();
                entity.Property(e => e.UserName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(200);
                // Role字段已移除，改为通过UserRoles关联表管理
                entity.Property(e => e.Department).HasMaxLength(100);
                entity.Property(e => e.Position).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // 🔧 修复：配置User与UserRole的一对多关系
                entity.HasMany(u => u.UserRoles)
                      .WithOne(ur => ur.User)
                      .HasForeignKey(ur => ur.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                // 🔧 修复：忽略计算属性，避免EF映射错误
                entity.Ignore(u => u.Roles);
                entity.Ignore(u => u.Permissions);
            });
        }

        private void ConfigureRefreshToken(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("RefreshTokens");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Token).HasMaxLength(255).IsRequired();
                entity.Property(e => e.JwtId).HasMaxLength(255).IsRequired();
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.IsUsed).HasDefaultValue(false);
                entity.Property(e => e.IsRevoked).HasDefaultValue(false);
            });
        }

        private void ConfigureOrganization(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Organization>(entity =>
            {
                entity.ToTable("Organizations");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Path).HasMaxLength(500);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });
        }

        private void ConfigureRole(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            });
        }

        private void ConfigurePermission(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.ToTable("Permissions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Resource).HasMaxLength(500);
            });
        }

        private void ConfigureUserRole(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("UserRoles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.RoleId).IsRequired();
                entity.Property(e => e.AssignedBy).IsRequired(false);

                // 🔧 修复：配置UserRole与Role的多对一关系
                entity.HasOne(ur => ur.Role)
                      .WithMany()
                      .HasForeignKey(ur => ur.RoleId)
                      .OnDelete(DeleteBehavior.Restrict);

                // 🔧 修复：配置UserRole与User的多对一关系（反向关系在ConfigureUser中已配置）
                entity.HasOne(ur => ur.User)
                      .WithMany(u => u.UserRoles)
                      .HasForeignKey(ur => ur.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureRolePermission(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("RolePermissions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.RoleId).IsRequired();
                entity.Property(e => e.PermissionId).IsRequired();
                entity.Property(e => e.AssignedBy).IsRequired(false);
            });
        }

        private void ConfigureDataDictionary(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DataDictionary>(entity =>
            {
                entity.ToTable("DataDictionaries");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            });
        }

        private void ConfigureAuditLog(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Action).HasMaxLength(50).IsRequired();
                entity.Property(e => e.EntityType).HasMaxLength(100);
                entity.Property(e => e.EntityId).IsRequired(false);
                entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
                entity.Property(e => e.OldValue).HasColumnType("TEXT");
                entity.Property(e => e.NewValue).HasColumnType("TEXT");
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.RequestPath).HasMaxLength(200);
                entity.Property(e => e.HttpMethod).HasMaxLength(10);
                entity.Property(e => e.Result).HasMaxLength(20).IsRequired();
                entity.Property(e => e.ErrorMessage).HasMaxLength(500);
                entity.Property(e => e.DurationMs).IsRequired(false);
            });
        }

        private void ConfigureCodePreAllocationLog(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CodePreAllocationLog>(entity =>
            {
                entity.ToTable("code_pre_allocation_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.ModelClassificationId).IsRequired();
                entity.Property(e => e.CodeClassificationId).IsRequired(false);
                entity.Property(e => e.ModelType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ClassificationNumber).HasMaxLength(100).IsRequired();
                entity.Property(e => e.AllocationCount).IsRequired();
                entity.Property(e => e.NumberDigits).IsRequired();
                entity.Property(e => e.StartCode).HasMaxLength(100).IsRequired();
                entity.Property(e => e.EndCode).HasMaxLength(100).IsRequired();
                entity.Property(e => e.CreatedBy).IsRequired();
            });
        }
    }
}