using FluentValidation;
using Application.Pagos.Requests;

namespace Application.Pagos.Validators;

public class RegistrarPagoRequestValidator : AbstractValidator<RegistrarPagoRequest>
{
    public RegistrarPagoRequestValidator()
    {
        RuleFor(x => x.ActividadId).NotEmpty();
        RuleFor(x => x.Monto).GreaterThan(0);
    }
}
