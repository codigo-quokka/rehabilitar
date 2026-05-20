using FluentValidation;
using Application.Usuarios.Requests;
using Application.Auth.Validations;

namespace Application.Usuarios.Validators;

public class CrearUsuarioRequestValidator : AbstractValidator<CrearUsuarioRequest>
{
    public CrearUsuarioRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty();
        RuleFor(x => x.Apellido).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Rol).NotEmpty();
        // RuleFor(x => x.Password).PasswordValida().When(x => !string.IsNullOrEmpty(x.Password));
        // lo comento porque da null warning y la contraseña al crear un usuario nunca viene por la request. Se genera random en el service y se le envía al usuario por mail.
    }
}
