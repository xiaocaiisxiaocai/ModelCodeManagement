using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 创建产品类型DTO验证器
    /// </summary>
    public class CreateProductTypeDtoValidator : AbstractValidator<CreateProductTypeDto>
    {
        public CreateProductTypeDtoValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("产品代码不能为空")
                .Length(2, 20).WithMessage("产品代码长度必须在2-20位之间")
                .Matches("^[A-Z0-9]+$").WithMessage("产品代码只能包含大写字母和数字");
        }
    }

    /// <summary>
    /// 更新产品类型DTO验证器
    /// </summary>
    public class UpdateProductTypeDtoValidator : AbstractValidator<UpdateProductTypeDto>
    {
        public UpdateProductTypeDtoValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("产品代码不能为空")
                .Length(2, 20).WithMessage("产品代码长度必须在2-20位之间")
                .Matches("^[A-Z0-9]+$").WithMessage("产品代码只能包含大写字母和数字");
        }
    }
}