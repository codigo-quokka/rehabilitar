using FluentValidation;
using Application.Auth.DTOs;

namespace Application.Auth.Validations;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("El email no es válido.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("La contraseña es requerida.");
    }
}
