using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Data;
using ModelCodeManagement.Api.Entities;
using ModelCodeManagement.Api.Extensions;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 用户服务实现
    /// </summary>
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly ILogger<UserService> _logger;
        private readonly IAuditLogService _auditLogService;

        public UserService(
            ApplicationDbContext context, 
            IConfiguration configuration, 
            IRefreshTokenService refreshTokenService,
            ILogger<UserService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _configuration = configuration;
            _refreshTokenService = refreshTokenService;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// 用户登录
        /// </summary>
        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.EmployeeId == dto.EmployeeId && u.IsActive)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    _logger.LogWarning("登录失败 - 用户不存在或已禁用: {EmployeeId}", dto.EmployeeId);
                    return ApiResponse<LoginResponseDto>.ErrorResult("工号或密码错误");
                }

                // 验证密码
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                {
                    _logger.LogWarning("登录失败 - 密码错误: {EmployeeId}", dto.EmployeeId);
                    return ApiResponse<LoginResponseDto>.ErrorResult("工号或密码错误");
                }

                // 生成JWT令牌
                var (accessToken, jwtId) = GenerateJwtToken(user);
                var expireMinutes = int.Parse(_configuration["JwtSettings:ExpireMinutes"] ?? "120");
                var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);

                // 生成Refresh Token
                var refreshToken = await _refreshTokenService.GenerateRefreshTokenAsync(user.Id, jwtId, ipAddress, userAgent);

                // 更新最后登录时间
                await UpdateLastLoginAsync(user.Id);

                var response = new LoginResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    AccessTokenExpiresAt = accessTokenExpiresAt,
                    RefreshTokenExpiresAt = refreshToken.ExpiresAt,
                    User = user.ToDto()
                };

                await _auditLogService.LogActionAsync("UserLogin", 
                    $"用户登录: {user.UserName} ({user.EmployeeId})", "User", user.Id);

                _logger.LogInformation("用户登录成功 - EmployeeId: {EmployeeId}, UserName: {UserName}, IP: {IP}", 
                    dto.EmployeeId, user.UserName, ipAddress);

                return ApiResponse<LoginResponseDto>.SuccessResult(response, "登录成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "用户登录失败 - EmployeeId: {EmployeeId}", dto.EmployeeId);
                return ApiResponse<LoginResponseDto>.ErrorResult($"登录失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 获取当前用户信息
        /// </summary>
        public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId)
        {
            return await GetByIdAsync(userId);
        }

        /// <summary>
        /// 分页获取用户列表
        /// </summary>
        public async Task<ApiResponse<PagedResult<UserDto>>> GetPagedAsync(QueryDto query)
        {
            try
            {
                var queryable = _context.Users.AsQueryable();

                // 关键词搜索
                if (!string.IsNullOrEmpty(query.Keyword))
                {
                    queryable = queryable.Where(u => 
                        u.EmployeeId.Contains(query.Keyword) || 
                        u.UserName.Contains(query.Keyword) ||
                        (u.Email != null && u.Email.Contains(query.Keyword)) ||
                        (u.Department != null && u.Department.Contains(query.Keyword)));
                }

                var total = await queryable.CountAsync();

                var items = await queryable
                    .OrderBy(u => u.CreatedAt)
                    .Skip((query.PageIndex - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                var dtos = new List<UserDto>();
                foreach (var item in items)
                {
                    var dto = await MapToDto(item);
                    dtos.Add(dto);
                }

                var result = new PagedResult<UserDto>
                {
                    Items = dtos,
                    TotalCount = total,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                _logger.LogInformation("分页查询用户成功 - 获取{Count}条记录，共{Total}条", dtos.Count, total);
                return ApiResponse<PagedResult<UserDto>>.SuccessResult(result, $"成功获取{dtos.Count}个用户");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "查询用户列表失败 - Query: {@Query}", query);
                return ApiResponse<PagedResult<UserDto>>.ErrorResult($"获取用户列表失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据ID获取用户
        /// </summary>
        public async Task<ApiResponse<UserDto>> GetByIdAsync(int id)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的用户", id);
                    return ApiResponse<UserDto>.ErrorResult($"未找到ID为{id}的用户");
                }

                var dto = await MapToDto(user);
                return ApiResponse<UserDto>.SuccessResult(dto, "获取用户信息成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户信息失败 - Id: {Id}", id);
                return ApiResponse<UserDto>.ErrorResult($"获取用户信息失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 根据工号获取用户
        /// </summary>
        public async Task<ApiResponse<UserDto>> GetByEmployeeIdAsync(string employeeId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeId == employeeId);

                if (user == null)
                {
                    _logger.LogWarning("未找到工号为{EmployeeId}的用户", employeeId);
                    return ApiResponse<UserDto>.ErrorResult($"未找到工号为{employeeId}的用户");
                }

                var dto = await MapToDto(user);
                return ApiResponse<UserDto>.SuccessResult(dto, "获取用户信息成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取用户信息失败 - EmployeeId: {EmployeeId}", employeeId);
                return ApiResponse<UserDto>.ErrorResult($"获取用户信息失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 创建用户
        /// </summary>
        public async Task<ApiResponse<UserDto>> CreateAsync(CreateUserDto dto)
        {
            try
            {
                // 验证工号唯一性
                var employeeIdExists = await _context.Users
                    .AnyAsync(u => u.EmployeeId == dto.EmployeeId);

                if (employeeIdExists)
                {
                    _logger.LogWarning("创建用户失败 - 工号已存在: {EmployeeId}", dto.EmployeeId);
                    return ApiResponse<UserDto>.ErrorResult($"工号 {dto.EmployeeId} 已存在");
                }

                // 验证邮箱唯一性
                if (!string.IsNullOrEmpty(dto.Email))
                {
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Email == dto.Email);

                    if (emailExists)
                    {
                        _logger.LogWarning("创建用户失败 - 邮箱已存在: {Email}", dto.Email);
                        return ApiResponse<UserDto>.ErrorResult($"邮箱 {dto.Email} 已存在");
                    }
                }

                var entity = dto.ToEntity();
                _context.Users.Add(entity);
                await _context.SaveChangesAsync();

                var resultDto = await MapToDto(entity);
                
                await _auditLogService.LogActionAsync("CreateUser", 
                    $"创建用户: {dto.UserName} ({dto.EmployeeId})", "User", entity.Id);
                
                _logger.LogInformation("创建用户成功 - EmployeeId: {EmployeeId}, UserName: {UserName}, Id: {Id}", 
                    dto.EmployeeId, dto.UserName, entity.Id);
                
                return ApiResponse<UserDto>.SuccessResult(resultDto, "创建用户成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "创建用户失败 - EmployeeId: {EmployeeId}, UserName: {UserName}", dto.EmployeeId, dto.UserName);
                return ApiResponse<UserDto>.ErrorResult($"创建用户失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 更新用户信息
        /// </summary>
        public async Task<ApiResponse<UserDto>> UpdateAsync(int id, UpdateUserDto dto)
        {
            try
            {
                var entity = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (entity == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的用户", id);
                    return ApiResponse<UserDto>.ErrorResult($"未找到ID为{id}的用户");
                }

                // 验证邮箱唯一性（排除自身）
                if (!string.IsNullOrEmpty(dto.Email) && entity.Email != dto.Email)
                {
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Email == dto.Email && u.Id != id);

                    if (emailExists)
                    {
                        _logger.LogWarning("更新用户失败 - 邮箱已被使用: {Email}", dto.Email);
                        return ApiResponse<UserDto>.ErrorResult($"邮箱 {dto.Email} 已被其他用户使用");
                    }
                }

                entity.UpdateFromDto(dto);
                await _context.SaveChangesAsync();

                var resultDto = await MapToDto(entity);
                
                await _auditLogService.LogActionAsync("UpdateUser", 
                    $"更新用户: {entity.UserName} ({entity.EmployeeId})", "User", entity.Id);
                
                _logger.LogInformation("更新用户信息成功 - Id: {Id}, EmployeeId: {EmployeeId}, UserName: {UserName}", 
                    id, entity.EmployeeId, entity.UserName);
                
                return ApiResponse<UserDto>.SuccessResult(resultDto, "更新用户信息成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新用户信息失败 - Id: {Id}", id);
                return ApiResponse<UserDto>.ErrorResult($"更新用户信息失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 修改密码
        /// </summary>
        public async Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning("修改密码失败 - 用户不存在或已禁用: {UserId}", userId);
                    return ApiResponse.ErrorResult("用户不存在或已禁用");
                }

                // 验证旧密码
                if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
                {
                    _logger.LogWarning("修改密码失败 - 旧密码错误: UserId={UserId}", userId);
                    return ApiResponse.ErrorResult("旧密码错误");
                }

                // 更新密码
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                
                await _auditLogService.LogActionAsync("ChangePassword", 
                    $"用户修改密码: {user.UserName} ({user.EmployeeId})", "User", userId);
                
                _logger.LogInformation("用户修改密码成功 - UserId: {UserId}, EmployeeId: {EmployeeId}", 
                    userId, user.EmployeeId);
                
                return ApiResponse.SuccessResult("密码修改成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "修改密码失败 - UserId: {UserId}", userId);
                return ApiResponse.ErrorResult($"修改密码失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 重置密码
        /// </summary>
        public async Task<ApiResponse> ResetPasswordAsync(int id, string newPassword)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的用户", id);
                    return ApiResponse.ErrorResult($"未找到ID为{id}的用户");
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                user.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                
                await _auditLogService.LogActionAsync("ResetPassword", 
                    $"重置用户密码: {user.UserName} ({user.EmployeeId})", "User", id);
                
                _logger.LogInformation("重置用户密码成功 - Id: {Id}, EmployeeId: {EmployeeId}", 
                    id, user.EmployeeId);
                
                return ApiResponse.SuccessResult("密码重置成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置密码失败 - Id: {Id}", id);
                return ApiResponse.ErrorResult($"重置密码失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 删除用户
        /// </summary>
        public async Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                {
                    _logger.LogWarning("未找到ID为{Id}的用户", id);
                    return ApiResponse.ErrorResult($"未找到ID为{id}的用户");
                }

                // 检查是否为系统默认管理员
                if (user.EmployeeId == "admin")
                {
                    _logger.LogWarning("尝试删除系统默认管理员 - Id: {Id}, EmployeeId: {EmployeeId}", id, user.EmployeeId);
                    return ApiResponse.ErrorResult("系统默认管理员不能删除");
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                
                await _auditLogService.LogActionAsync("DeleteUser", 
                    $"删除用户: {user.UserName} ({user.EmployeeId})", "User", id);
                
                _logger.LogInformation("删除用户成功 - Id: {Id}, EmployeeId: {EmployeeId}", id, user.EmployeeId);

                return ApiResponse.SuccessResult("删除用户成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "删除用户失败 - Id: {Id}", id);
                return ApiResponse.ErrorResult($"删除用户失败: {ex.Message}");
            }
        }

        /// <summary>
        /// 更新最后登录时间
        /// </summary>
        public async Task UpdateLastLoginAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.LastLoginAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "更新用户最后登录时间失败 - UserId: {UserId}", userId);
                // 更新登录时间失败不影响主流程，忽略异常
            }
        }

        /// <summary>
        /// 生成JWT令牌
        /// </summary>
        private (string Token, string JwtId) GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expireMinutes = int.Parse(jwtSettings["ExpireMinutes"] ?? "120");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwtId = Guid.NewGuid().ToString();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                // new Claim(ClaimTypes.Role, user.Role), // Role字段已移除，使用JwtTokenService替代
                new Claim("EmployeeId", user.EmployeeId),
                new Claim("Department", user.Department ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, jwtId),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenString, jwtId);
        }

        /// <summary>
        /// 刷新Token（基于用户信息）
        /// </summary>
        public async Task<ApiResponse<RefreshTokenResponseDto>> RefreshTokenAsync(User user, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                // 生成新的JWT令牌
                var (accessToken, jwtId) = GenerateJwtToken(user);
                var expireMinutes = int.Parse(_configuration["JwtSettings:ExpireMinutes"] ?? "120");
                var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);

                // 生成新的Refresh Token
                var refreshToken = await _refreshTokenService.GenerateRefreshTokenAsync(user.Id, jwtId, ipAddress, userAgent);

                var response = new RefreshTokenResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    AccessTokenExpiresAt = accessTokenExpiresAt,
                    RefreshTokenExpiresAt = refreshToken.ExpiresAt
                };

                _logger.LogInformation("Token刷新成功 - UserId: {UserId}, EmployeeId: {EmployeeId}", 
                    user.Id, user.EmployeeId);

                return ApiResponse<RefreshTokenResponseDto>.SuccessResult(response, "Token刷新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token刷新失败 - UserId: {UserId}", user.Id);
                return ApiResponse<RefreshTokenResponseDto>.ErrorResult($"Token刷新失败: {ex.Message}");
            }
        }

        #region 私有方法

        /// <summary>
        /// 将User实体映射为UserDto
        /// </summary>
        private async Task<UserDto> MapToDto(User entity)
        {
            var dto = entity.ToDto();

            // 获取组织架构名称
            if (entity.OrganizationId.HasValue)
            {
                var organization = await _context.Organizations
                    .FirstOrDefaultAsync(x => x.Id == entity.OrganizationId.Value);
                dto.OrganizationName = organization?.Name;
            }

            // 获取上级名称
            if (entity.SuperiorId.HasValue)
            {
                var superior = await _context.Users
                    .FirstOrDefaultAsync(x => x.Id == entity.SuperiorId.Value);
                dto.SuperiorName = superior?.UserName;
            }

            return dto;
        }

        #endregion
    }
}