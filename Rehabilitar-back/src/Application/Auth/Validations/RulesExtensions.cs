using FluentValidation;

namespace Application.Auth.Validations;

public static class ValidationRulesExtensions
{
    public static IRuleBuilderOptions<T, string> PasswordValida<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder.MinimumLength(8)
                        .MaximumLength(32)
                        
                        .NotEmpty();
    } 

    public static IRuleBuilderOptions<T, string> DniValido<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder.MinimumLength(7)
                        .MaximumLength(8)
                        .NotEmpty()
                        .Matches("^[0-9]{7,8}$");
    } 
}
