using Application.Auth.DTOs;
using FluentValidation;

namespace Application.Auth.Validations;

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("La contraseña actual es requerida.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().PasswordValida().NotEqual(x => x.CurrentPassword).WithMessage("La nueva contraseña no puede ser igual a la contraseña actual.");

        RuleFor(x => x.ConfirmNewPassword)
            .NotEmpty().Equal(x => x.NewPassword).WithMessage("La confirmación de la nueva contraseña no coincide con la nueva contraseña.");
    }
}
