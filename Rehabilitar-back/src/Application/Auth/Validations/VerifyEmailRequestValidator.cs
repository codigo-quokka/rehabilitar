using FluentValidation;
using Application.Auth.DTOs;

namespace Application.Auth.Validations;

public class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ConfirmationToken).NotEmpty();
    }
}
