using Application.Reservas.DTOs;
using FluentValidation;

namespace Application.Reservas.Validators;

public class ReservarActividadRequestValidator : AbstractValidator<ReservarActividadRequest>
{
    public ReservarActividadRequestValidator()
    {
        RuleFor(x => x.ActividadId)
            .NotEmpty().WithMessage("La actividad es requerida.");

        RuleFor(x => x.ClienteId)
            .NotEmpty().WithMessage("El cliente es requerido.");

        RuleFor(x => x.TipoCliente)
            .IsInEnum().WithMessage("El tipo de cliente especificado no es válido.");
    }
}
