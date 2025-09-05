using FluentValidation;
using ModelCodeManagement.Api.DTOs;

namespace ModelCodeManagement.Api.Validators
{
    /// <summary>
    /// 分配编码DTO验证器
    /// </summary>
    public class AllocateCodeDtoValidator : AbstractValidator<AllocateCodeDto>
    {
        public AllocateCodeDtoValidator()
        {
            RuleFor(x => x.Extension)
                .MaximumLength(10)
                .WithMessage("延伸码长度不能超过10个字符")
                .Matches(@"^[A-Za-z0-9]*$")
                .WithMessage("延伸码只能包含字母和数字");

            RuleFor(x => x.ProductName)
                .MaximumLength(200)
                .WithMessage("品名长度不能超过200个字符");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("说明长度不能超过500个字符");

            RuleFor(x => x.OccupancyType)
                .MaximumLength(20)
                .WithMessage("占用类型长度不能超过20个字符")
                .Must(type => string.IsNullOrEmpty(type) || new[] { "规划", "暂停", "工令" }.Contains(type))
                .WithMessage("占用类型必须是：规划、暂停、工令 之一");

            RuleFor(x => x.Builder)
                .MaximumLength(100)
                .WithMessage("建档人长度不能超过100个字符");

            RuleFor(x => x.Requester)
                .MaximumLength(100)
                .WithMessage("需求人长度不能超过100个字符");
        }
    }

    /// <summary>
    /// 手动创建编码DTO验证器
    /// </summary>
    public class CreateManualCodeDtoValidator : AbstractValidator<CreateManualCodeDto>
    {
        public CreateManualCodeDtoValidator()
        {
            RuleFor(x => x.ModelClassificationId)
                .GreaterThan(0)
                .WithMessage("机型分类ID必须大于0");

            RuleFor(x => x.NumberPart)
                .NotEmpty()
                .WithMessage("编号部分不能为空")
                .Length(1, 10)
                .WithMessage("编号部分长度必须在1-10个字符之间")
                .Matches(@"^[0-9]+$")
                .WithMessage("编号部分只能包含数字");

            RuleFor(x => x.Extension)
                .MaximumLength(10)
                .WithMessage("延伸码长度不能超过10个字符")
                .Matches(@"^[A-Za-z0-9]*$")
                .WithMessage("延伸码只能包含字母和数字");

            RuleFor(x => x.ProductName)
                .MaximumLength(200)
                .WithMessage("品名长度不能超过200个字符");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("说明长度不能超过500个字符");

            RuleFor(x => x.OccupancyType)
                .MaximumLength(20)
                .WithMessage("占用类型长度不能超过20个字符")
                .Must(type => string.IsNullOrEmpty(type) || new[] { "规划", "暂停", "工令" }.Contains(type))
                .WithMessage("占用类型必须是：规划、暂停、工令 之一");

            RuleFor(x => x.Builder)
                .MaximumLength(100)
                .WithMessage("建档人长度不能超过100个字符");

            RuleFor(x => x.Requester)
                .MaximumLength(100)
                .WithMessage("需求人长度不能超过100个字符");
        }
    }

    /// <summary>
    /// 更新编码使用DTO验证器
    /// </summary>
    public class UpdateCodeUsageDtoValidator : AbstractValidator<UpdateCodeUsageDto>
    {
        public UpdateCodeUsageDtoValidator()
        {
            RuleFor(x => x.Extension)
                .MaximumLength(10)
                .WithMessage("延伸码长度不能超过10个字符")
                .Matches(@"^[A-Za-z0-9]*$")
                .WithMessage("延伸码只能包含字母和数字");

            RuleFor(x => x.ProductName)
                .MaximumLength(200)
                .WithMessage("品名长度不能超过200个字符");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("说明长度不能超过500个字符");

            RuleFor(x => x.OccupancyType)
                .MaximumLength(20)
                .WithMessage("占用类型长度不能超过20个字符")
                .Must(type => string.IsNullOrEmpty(type) || new[] { "规划", "暂停", "工令" }.Contains(type))
                .WithMessage("占用类型必须是：规划、暂停、工令 之一");

            RuleFor(x => x.Builder)
                .MaximumLength(100)
                .WithMessage("建档人长度不能超过100个字符");

            RuleFor(x => x.Requester)
                .MaximumLength(100)
                .WithMessage("需求人长度不能超过100个字符");
        }
    }
}