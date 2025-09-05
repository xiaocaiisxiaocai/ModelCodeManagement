using ModelCodeManagement.Api.DTOs;
using ModelCodeManagement.Api.Extensions;
using ModelCodeManagement.Api.Repositories;

namespace ModelCodeManagement.Api.Services.Impl
{
    /// <summary>
    /// 身份认证服务实现
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly IUserRoleService _userRoleService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthenticationService> _logger;

        public AuthenticationService(
            IUserRepository userRepository,
            IJwtTokenService jwtTokenService,
            IRefreshTokenService refreshTokenService,
            IUserRoleService userRoleService,
            IConfiguration configuration,
            ILogger<AuthenticationService> logger)
        {
            _userRepository = userRepository;
            _jwtTokenService = jwtTokenService;
            _refreshTokenService = refreshTokenService;
            _userRoleService = userRoleService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                // 验证用户存在且激活
                var user = await _userRepository.GetByEmployeeIdAsync(dto.EmployeeId);
                if (user == null || !user.IsActive)
                {
                    _logger.LogWarning("登录失败: 用户不存在或已被禁用 - {EmployeeId}", dto.EmployeeId);
                    return ApiResponse<LoginResponseDto>.ErrorResult("工号或密码错误");
                }

                // 验证密码
                if (!VerifyPassword(dto.Password, user.PasswordHash))
                {
                    _logger.LogWarning("登录失败: 密码错误 - {EmployeeId}", dto.EmployeeId);
                    return ApiResponse<LoginResponseDto>.ErrorResult("工号或密码错误");
                }

                // 获取用户的角色和权限信息
                var userWithRoles = await _userRoleService.GetUserWithRolesAndPermissionsAsync(user.Id);
                if (userWithRoles != null)
                {
                    user = userWithRoles; // 使用包含角色权限信息的用户对象
                }

                // 生成JWT Token
                var (accessToken, jwtId) = _jwtTokenService.GenerateAccessToken(user);
                var expireMinutes = int.Parse(_configuration["JwtSettings:ExpireMinutes"] ?? "120");
                var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);

                // 生成Refresh Token
                var refreshToken = await _refreshTokenService.GenerateRefreshTokenAsync(user.Id, jwtId, ipAddress, userAgent);

                // 更新最后登录时间
                await _userRepository.UpdateLastLoginAsync(user.Id);

                var response = new LoginResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    AccessTokenExpiresAt = accessTokenExpiresAt,
                    RefreshTokenExpiresAt = refreshToken.ExpiresAt,
                    User = user.ToDto()
                };

                _logger.LogInformation("用户登录成功 - {EmployeeId}", dto.EmployeeId);
                return ApiResponse<LoginResponseDto>.SuccessResult(response, "登录成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "登录过程中发生错误 - {EmployeeId}", dto.EmployeeId);
                return ApiResponse<LoginResponseDto>.ErrorResult("登录失败，请稍后重试");
            }
        }

        public async Task<ApiResponse<RefreshTokenResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto dto, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                // 验证并使用Refresh Token
                var (isValid, refreshToken, user) = await _refreshTokenService.ValidateAndUseRefreshTokenAsync(dto.RefreshToken);
                if (!isValid || refreshToken == null || user == null)
                {
                    return ApiResponse<RefreshTokenResponseDto>.ErrorResult("Refresh Token无效或已过期");
                }

                if (!user.IsActive)
                {
                    return ApiResponse<RefreshTokenResponseDto>.ErrorResult("用户已被禁用");
                }

                // 生成新的Token
                var (accessToken, jwtId) = _jwtTokenService.GenerateAccessToken(user);
                var expireMinutes = int.Parse(_configuration["JwtSettings:ExpireMinutes"] ?? "120");
                var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);

                // 生成新的Refresh Token
                var newRefreshToken = await _refreshTokenService.GenerateRefreshTokenAsync(user.Id, jwtId, ipAddress, userAgent);

                var response = new RefreshTokenResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = newRefreshToken.Token,
                    AccessTokenExpiresAt = accessTokenExpiresAt,
                    RefreshTokenExpiresAt = newRefreshToken.ExpiresAt
                };

                _logger.LogInformation("Token刷新成功 - UserId: {UserId}", user.Id);
                return ApiResponse<RefreshTokenResponseDto>.SuccessResult(response, "Token刷新成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token刷新过程中发生错误");
                return ApiResponse<RefreshTokenResponseDto>.ErrorResult("Token刷新失败");
            }
        }

        public async Task<ApiResponse<object>> LogoutAsync(string refreshToken)
        {
            try
            {
                await _refreshTokenService.RevokeRefreshTokenAsync(refreshToken);
                _logger.LogInformation("用户登出成功");
                return ApiResponse<object>.SuccessResult(new { success = true }, "登出成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "登出过程中发生错误");
                return ApiResponse<object>.ErrorResult("登出失败");
            }
        }

        public bool VerifyPassword(string plainPassword, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public async Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponse<object>.ErrorResult("用户不存在");
                }

                // 验证旧密码
                if (!VerifyPassword(dto.OldPassword, user.PasswordHash))
                {
                    return ApiResponse<object>.ErrorResult("原密码错误");
                }

                // 更新密码
                user.PasswordHash = HashPassword(dto.NewPassword);
                user.UpdatedAt = DateTime.Now;

                await _userRepository.UpdateAsync(user);

                _logger.LogInformation("用户密码修改成功 - UserId: {UserId}", userId);
                return ApiResponse<object>.SuccessResult(new { success = true }, "密码修改成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "修改密码过程中发生错误 - UserId: {UserId}", userId);
                return ApiResponse<object>.ErrorResult("密码修改失败");
            }
        }

        public async Task<ApiResponse<object>> ResetPasswordAsync(int userId, string newPassword)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return ApiResponse<object>.ErrorResult("用户不存在");
                }

                // 重置密码
                user.PasswordHash = HashPassword(newPassword);
                user.UpdatedAt = DateTime.Now;

                await _userRepository.UpdateAsync(user);

                _logger.LogInformation("用户密码重置成功 - UserId: {UserId}", userId);
                return ApiResponse<object>.SuccessResult(new { success = true }, "密码重置成功");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "重置密码过程中发生错误 - UserId: {UserId}", userId);
                return ApiResponse<object>.ErrorResult("密码重置失败");
            }
        }
    }
}