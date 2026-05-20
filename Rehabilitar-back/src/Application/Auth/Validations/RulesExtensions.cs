using FluentValidation;

namespace Application.Auth.Validations;

public static class ValidationRulesExtensions
{
    public static IRuleBuilderOptions<T, string> PasswordValida<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        // regEx para chequear que la contraseña tenga al menos una mayúscula, una minúscula, un número y un caracter especial
        const string passwordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$";

        return ruleBuilder.MinimumLength(8)
                        .MaximumLength(32)
                        .Matches(passwordPattern)
                        .WithMessage("La contraseña debe tener al menos una mayúscula, una minúscula, un número y un caracter especial.");
    } 

    public static IRuleBuilderOptions<T, string> DniValido<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder.MinimumLength(7)
                        .MaximumLength(8)
                        .Matches("^[0-9]{7,8}$")
                        .WithMessage("El DNI debe tener 7 u 8 dígitos.");
    } 
}
