using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 登录DTO验证器
    /// </summary>
    public class LoginDtoValidator : AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            RuleFor(x => x.EmployeeId)
                .NotEmpty().WithMessage("工号不能为空")
                .Length(3, 20).WithMessage("工号长度必须在3-20位之间")
                .Matches("^[a-zA-Z0-9]+$").WithMessage("工号只能包含字母和数字");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("密码不能为空")
                .MinimumLength(6).WithMessage("密码长度至少6位");
        }
    }
}