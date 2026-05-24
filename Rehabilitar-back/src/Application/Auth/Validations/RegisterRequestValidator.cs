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
        RuleFor(x => x.Dni).NotEmpty().DniValido();
        RuleFor(x => x.Password).NotEmpty().PasswordValida();
        RuleFor(x => x.FechaNacimiento).NotEmpty().LessThan(DateOnly.FromDateTime(DateTime.Today.AddYears(-18))).WithMessage("Debe ser mayor de 18 años para registrarse.");        
    }
}
