using FluentValidation;
using Application.Auth.DTOs;

namespace Application.Auth.Validations;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PasswordResetToken).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().PasswordValida();
    }
}
