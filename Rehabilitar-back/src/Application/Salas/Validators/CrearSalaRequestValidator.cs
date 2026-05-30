using FluentValidation;
using Application.Salas.Requests;

namespace Application.Salas.Validators;

public class CrearSalaRequestValidator : AbstractValidator<CrearSalaRequest>
{
    public CrearSalaRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("Por favor, completa todos los campos obligatorios.");
        RuleFor(x => x.Capacidad).GreaterThan(0).WithMessage("Por favor, completa todos los campos obligatorios.");
    }
}
