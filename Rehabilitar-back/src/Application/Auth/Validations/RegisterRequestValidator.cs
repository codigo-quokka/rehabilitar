using Application.Auth.DTOs;
using FluentValidation;

namespace Application.Auth.Validations;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Debe proporcionar un correo electrónico válido.");
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("Debe proporcionar un nombre válido.");
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Debe proporcionar un apellido válido.");
        RuleFor(x => x.Dni).NotEmpty().DniValido().WithMessage("Debe proporcionar un DNI válido.");
        RuleFor(x => x.Password).NotEmpty().PasswordValida().WithMessage("Debe proporcionar una contraseña válida.");
        RuleFor(x => x.FechaNacimiento).NotEmpty().LessThan(DateOnly.FromDateTime(DateTime.Today.AddYears(-18))).WithMessage("Debe ser mayor de 18 años para registrarse.");        
    }
}
