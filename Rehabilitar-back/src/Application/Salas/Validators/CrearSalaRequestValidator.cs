using FluentValidation;
using Application.Salas.Requests;

namespace Application.Salas.Validators;

public class CrearSalaRequestValidator : AbstractValidator<CrearSalaRequest>
{
    public CrearSalaRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty();
        RuleFor(x => x.Capacidad).GreaterThan(0);
    }
}
