using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 创建代码分类DTO验证器
    /// </summary>
    public class CreateCodeClassificationDtoValidator : AbstractValidator<CreateCodeClassificationDto>
    {
        public CreateCodeClassificationDtoValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty()
                .WithMessage("代码分类代码不能为空")
                .Length(1, 10)
                .WithMessage("代码分类代码长度必须在1-10个字符之间")
                .Matches(@"^\d+$")
                .WithMessage("代码分类代码必须为纯数字，如：1、2、3等");

            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("代码分类名称不能为空")
                .MaximumLength(100)
                .WithMessage("代码分类名称长度不能超过100个字符");

            RuleFor(x => x.ModelClassificationId)
                .GreaterThan(0)
                .WithMessage("机型分类ID必须大于0");

            // 验证代码分类数字范围
            RuleFor(x => x.Code)
                .Must(code =>
                {
                    if (string.IsNullOrEmpty(code)) return false;
                    if (!int.TryParse(code, out int number)) return false;
                    return number >= 1 && number <= 99;
                })
                .WithMessage("代码分类编号必须在1-99之间")
                .When(x => !string.IsNullOrEmpty(x.Code));
        }
    }

    /// <summary>
    /// 更新代码分类DTO验证器
    /// </summary>
    public class UpdateCodeClassificationDtoValidator : AbstractValidator<UpdateCodeClassificationDto>
    {
        public UpdateCodeClassificationDtoValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty()
                .WithMessage("代码分类代码不能为空")
                .Length(1, 10)
                .WithMessage("代码分类代码长度必须在1-10个字符之间")
                .Matches(@"^\d+$")
                .WithMessage("代码分类代码必须为纯数字，如：1、2、3等")
                .When(x => !string.IsNullOrEmpty(x.Code));

            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("代码分类名称不能为空")
                .MaximumLength(100)
                .WithMessage("代码分类名称长度不能超过100个字符")
                .When(x => !string.IsNullOrEmpty(x.Name));

            // 验证代码分类数字范围
            RuleFor(x => x.Code)
                .Must(code =>
                {
                    if (string.IsNullOrEmpty(code)) return true; // 允许为空，表示不更新
                    if (!int.TryParse(code, out int number)) return false;
                    return number >= 1 && number <= 99;
                })
                .WithMessage("代码分类编号必须在1-99之间")
                .When(x => !string.IsNullOrEmpty(x.Code));
        }
    }
}