using Application.Actividades.DTOs;
using FluentValidation;

namespace Application.Actividades.Validators;

public class CrearActividadRecurrenteRequestValidator : AbstractValidator<CrearActividadRecurrenteRequest>
{
    public CrearActividadRecurrenteRequestValidator()
    {
        RuleFor(x => x.ActividadBase)
            .NotNull().WithMessage("La actividad base es requerida.")
            .SetValidator(new CrearActividadRequestValidator());

        RuleFor(x => x.FechaFinRecurrente)
            .NotEmpty().WithMessage("La fecha de fin de recurrencia es requerida.")
            .GreaterThan(x => x.ActividadBase.FechaYHora)
            .WithMessage("La fecha de fin de recurrencia debe ser posterior a la fecha y hora de la primera clase de la serie.");
    }
}
