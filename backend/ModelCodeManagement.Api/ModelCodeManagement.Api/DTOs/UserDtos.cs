namespace ModelCodeManagement.Api.DTOs
{
    /// <summary>
    /// 用户DTO
    /// </summary>
    public class UserDto
    {
        /// <summary>
        /// ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// 工号
        /// </summary>
        public string EmployeeId { get; set; } = string.Empty;

        /// <summary>
        /// 用户名
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// 邮箱
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// 角色
        /// </summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>
        /// 所属部门
        /// </summary>
        public string? Department { get; set; }

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// 最后登录时间
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// 所属组织ID
        /// </summary>
        public int? OrganizationId { get; set; }

        /// <summary>
        /// 职位
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// 直属上级ID
        /// </summary>
        public int? SuperiorId { get; set; }

        /// <summary>
        /// 手机号
        /// </summary>
        public string? Phone { get; set; }

        /// <summary>
        /// 入职时间
        /// </summary>
        public DateTime? JoinDate { get; set; }

        /// <summary>
        /// 用户状态
        /// </summary>
        public string Status { get; set; } = "Active";

        // 扩展信息
        public string? OrganizationName { get; set; }
        public string? SuperiorName { get; set; }
    }

    /// <summary>
    /// 登录DTO
    /// </summary>
    public class LoginDto
    {
        /// <summary>
        /// 工号
        /// </summary>
        public string EmployeeId { get; set; } = string.Empty;

        /// <summary>
        /// 密码
        /// </summary>
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// 登录响应DTO
    /// </summary>
    public class LoginResponseDto
    {
        /// <summary>
        /// Access Token (JWT令牌)
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// Refresh Token
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;

        /// <summary>
        /// Access Token过期时间
        /// </summary>
        public DateTime AccessTokenExpiresAt { get; set; }

        /// <summary>
        /// Refresh Token过期时间
        /// </summary>
        public DateTime RefreshTokenExpiresAt { get; set; }

        /// <summary>
        /// 用户信息
        /// </summary>
        public UserDto User { get; set; } = new();
    }

    /// <summary>
    /// 创建用户DTO
    /// </summary>
    public class CreateUserDto
    {
        /// <summary>
        /// 工号
        /// </summary>
        public string EmployeeId { get; set; } = string.Empty;

        /// <summary>
        /// 用户名
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// 密码
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// 邮箱
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// 角色 (SuperAdmin, Admin, User)
        /// </summary>
        public string Role { get; set; } = "User";

        /// <summary>
        /// 所属部门
        /// </summary>
        public string? Department { get; set; }

        /// <summary>
        /// 所属组织ID
        /// </summary>
        public int? OrganizationId { get; set; }

        /// <summary>
        /// 职位
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// 直属上级ID
        /// </summary>
        public int? SuperiorId { get; set; }

        /// <summary>
        /// 手机号
        /// </summary>
        public string? Phone { get; set; }

        /// <summary>
        /// 入职时间
        /// </summary>
        public DateTime? JoinDate { get; set; }

        /// <summary>
        /// 用户状态
        /// </summary>
        public string Status { get; set; } = "Active";

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// 更新用户DTO
    /// </summary>
    public class UpdateUserDto
    {
        /// <summary>
        /// 用户名
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// 邮箱
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// 角色 (SuperAdmin, Admin, User)
        /// </summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>
        /// 所属部门
        /// </summary>
        public string? Department { get; set; }

        /// <summary>
        /// 所属组织ID
        /// </summary>
        public int? OrganizationId { get; set; }

        /// <summary>
        /// 职位
        /// </summary>
        public string? Position { get; set; }

        /// <summary>
        /// 直属上级ID
        /// </summary>
        public int? SuperiorId { get; set; }

        /// <summary>
        /// 手机号
        /// </summary>
        public string? Phone { get; set; }

        /// <summary>
        /// 入职时间
        /// </summary>
        public DateTime? JoinDate { get; set; }

        /// <summary>
        /// 用户状态
        /// </summary>
        public string Status { get; set; } = "Active";

        /// <summary>
        /// 是否启用
        /// </summary>
        public bool IsActive { get; set; }
    }

    /// <summary>
    /// 修改密码DTO
    /// </summary>
    public class ChangePasswordDto
    {
        /// <summary>
        /// 旧密码
        /// </summary>
        public string OldPassword { get; set; } = string.Empty;

        /// <summary>
        /// 新密码
        /// </summary>
        public string NewPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// 刷新Token请求DTO
    /// </summary>
    public class RefreshTokenRequestDto
    {
        /// <summary>
        /// Refresh Token
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// 刷新Token响应DTO
    /// </summary>
    public class RefreshTokenResponseDto
    {
        /// <summary>
        /// 新的Access Token
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// 新的Refresh Token
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;

        /// <summary>
        /// Access Token过期时间
        /// </summary>
        public DateTime AccessTokenExpiresAt { get; set; }

        /// <summary>
        /// Refresh Token过期时间
        /// </summary>
        public DateTime RefreshTokenExpiresAt { get; set; }
    }
}