using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 修改密码DTO验证器
    /// </summary>
    public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
    {
        public ChangePasswordDtoValidator()
        {
            RuleFor(x => x.OldPassword)
                .NotEmpty().WithMessage("旧密码不能为空");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("新密码不能为空")
                .MinimumLength(8).WithMessage("新密码长度至少8位")
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$")
                .WithMessage("新密码必须包含至少一个大写字母、一个小写字母和一个数字")
                .NotEqual(x => x.OldPassword).WithMessage("新密码不能与旧密码相同");
        }
    }
}