using Application.Actividades.DTOs;
using FluentValidation;

namespace Application.Actividades.Validators;

public class EditarActividadRecurrenteRequestValidator : AbstractValidator<EditarActividadRecurrenteRequest>
{
    public EditarActividadRecurrenteRequestValidator()
    {
        RuleFor(x => x.ActividadBase)
            .NotNull().WithMessage("Los datos base de la actividad son requeridos.")
            .SetValidator(new EditarActividadRequestValidator());
            
        RuleFor(x => x.SerieId)
            .NotEmpty().WithMessage("El ID de la serie es requerido para editar una actividad recurrente.");
    }
}
