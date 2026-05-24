using FluentValidation;
using Application.Auth.DTOs;

namespace Application.Auth.Validations;

public class EmailRequestValidator : AbstractValidator<EmailRequest>
{
    public EmailRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
