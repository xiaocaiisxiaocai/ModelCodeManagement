using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 创建用户DTO验证器
    /// </summary>
    public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
    {
        public CreateUserDtoValidator()
        {
            RuleFor(x => x.EmployeeId)
                .NotEmpty().WithMessage("工号不能为空")
                .Length(3, 20).WithMessage("工号长度必须在3-20位之间")
                .Matches("^[a-zA-Z0-9]+$").WithMessage("工号只能包含字母和数字");

            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("用户名不能为空")
                .Length(2, 50).WithMessage("用户名长度必须在2-50位之间");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("密码不能为空")
                .MinimumLength(4).WithMessage("密码长度至少4位");

            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("邮箱格式不正确")
                .When(x => !string.IsNullOrEmpty(x.Email));

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("角色不能为空")
                .Must(role => new[] { "SuperAdmin", "Admin", "User" }.Contains(role))
                .WithMessage("角色必须是SuperAdmin、Admin或User");

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