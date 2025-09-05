using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 更新用户DTO验证器
    /// </summary>
    public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
    {
        public UpdateUserDtoValidator()
        {
            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("用户名不能为空")
                .Length(2, 50).WithMessage("用户名长度必须在2-50位之间");

            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("邮箱格式不正确")
                .When(x => !string.IsNullOrEmpty(x.Email));

            // 🔧 修复：Role字段已移除，现在通过UserRoles关联表管理，不再验证Role字段
            // RuleFor(x => x.Role)
            //     .NotEmpty().WithMessage("角色不能为空")
            //     .Must(role => new[] { "SuperAdmin", "Admin", "User" }.Contains(role))
            //     .WithMessage("角色必须是SuperAdmin、Admin或User");

            RuleFor(x => x.Phone)
                .Matches(@"^1[3-9]\d{9}$").WithMessage("手机号格式不正确")
                .When(x => !string.IsNullOrEmpty(x.Phone));

            RuleFor(x => x.Status)
                .Must(status => new[] { "Active", "Inactive", "Suspended" }.Contains(status))
                .WithMessage("状态必须是Active、Inactive或Suspended")
                .When(x => !string.IsNullOrEmpty(x.Status));
        }
    }
}