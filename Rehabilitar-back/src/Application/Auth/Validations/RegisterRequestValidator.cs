using Application.Auth.DTOs;
using FluentValidation;

namespace Application.Auth.Validations;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.FirstName).NotEmpty();
        RuleFor(x => x.LastName).NotEmpty();
        RuleFor(x => x.Dni).DniValido();
        RuleFor(x => x.Password).PasswordValida();
        RuleFor(x => x.FechaNacimiento).NotEmpty();
    }
}
