using FluentValidation;
using Application.Actividades.DTOs;

namespace Application.Actividades.Validators;

public class RemoverProfesorRequestValidator : AbstractValidator<RemoverProfesorRequest>
{
    public RemoverProfesorRequestValidator()
    {
        RuleFor(x => x.ProfesorId).NotEmpty();
    }
}
