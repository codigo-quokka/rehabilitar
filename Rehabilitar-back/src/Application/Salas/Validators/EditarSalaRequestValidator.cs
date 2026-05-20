using FluentValidation;
using Application.Salas.Requests;

namespace Application.Salas.Validators;

public class EditarSalaRequestValidator : AbstractValidator<EditarSalaRequest>
{
    public EditarSalaRequestValidator()
    {
        RuleFor(x => x.Capacidad).GreaterThan(0).When(x => x.Capacidad.HasValue);
    }
}
