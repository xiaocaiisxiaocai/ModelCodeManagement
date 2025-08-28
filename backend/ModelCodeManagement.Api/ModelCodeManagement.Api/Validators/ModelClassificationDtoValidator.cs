using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 创建机型分类DTO验证器
    /// </summary>
    public class CreateModelClassificationDtoValidator : AbstractValidator<CreateModelClassificationDto>
    {
        public CreateModelClassificationDtoValidator()
        {
            RuleFor(x => x.Type)
                .NotEmpty()
                .WithMessage("机型类型不能为空")
                .Length(2, 20)
                .WithMessage("机型类型长度必须在2-20个字符之间")
                .Matches(@"^[A-Z0-9]+-?$")
                .WithMessage("机型类型格式错误，应如：SLU-、SLUR-、AC-等");


            RuleForEach(x => x.Description)
                .MaximumLength(500)
                .WithMessage("每个描述项长度不能超过500个字符");

            RuleFor(x => x.ProductTypeId)
                .GreaterThan(0)
                .WithMessage("产品类型ID必须大于0");
        }
    }

    /// <summary>
    /// 更新机型分类DTO验证器
    /// </summary>
    public class UpdateModelClassificationDtoValidator : AbstractValidator<UpdateModelClassificationDto>
    {
        public UpdateModelClassificationDtoValidator()
        {
            RuleFor(x => x.Type)
                .NotEmpty()
                .WithMessage("机型类型不能为空")
                .Length(2, 20)
                .WithMessage("机型类型长度必须在2-20个字符之间")
                .Matches(@"^[A-Z0-9]+-?$")
                .WithMessage("机型类型格式错误，应如：SLU-、SLUR-、AC-等")
                .When(x => !string.IsNullOrEmpty(x.Type));


            RuleForEach(x => x.Description)
                .MaximumLength(500)
                .WithMessage("每个描述项长度不能超过500个字符");

            RuleFor(x => x.ProductTypeId)
                .GreaterThan(0)
                .WithMessage("产品类型ID必须大于0");
        }
    }
}