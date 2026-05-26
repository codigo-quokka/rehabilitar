using FluentValidation;
using Application.Actividades.DTOs;

namespace Application.Actividades.Validators;

public class AsignarProfesorRequestValidator : AbstractValidator<AsignarProfesorRequest>
{
    public AsignarProfesorRequestValidator()
    {
        RuleFor(x => x.ProfesorId).NotEmpty();
    }
}
