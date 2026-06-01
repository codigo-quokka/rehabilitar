using FluentValidation;
using Application.Reservas.DTOs;

namespace Application.Reservas.Validators;

public class ReservaRecurrenteRequestValidator : AbstractValidator<ReservaRecurrenteRequest>
{
    public ReservaRecurrenteRequestValidator()
    {
        RuleFor(x => x.ActividadesIds).NotEmpty();
        RuleFor(x => x.ClienteId).NotEmpty();
    }
}
