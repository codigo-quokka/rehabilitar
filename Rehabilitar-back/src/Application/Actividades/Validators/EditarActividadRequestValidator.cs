using Application.Actividades.DTOs;
using FluentValidation;
using System;

namespace Application.Actividades.Validators;

public class EditarActividadRequestValidator : AbstractValidator<EditarActividadRequest>
{
    public EditarActividadRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder los 100 caracteres.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(500).WithMessage("La descripción no puede exceder los 500 caracteres.");

        RuleFor(x => x.CupoMaximo)
            .GreaterThan(0).WithMessage("El cupo máximo debe ser mayor a 0.")
            .LessThanOrEqualTo(100).WithMessage("El cupo máximo no puede exceder 100.");

        RuleFor(x => x.SalaId)
            .NotEmpty().WithMessage("Debe asignar una sala válida.");
    }
}
