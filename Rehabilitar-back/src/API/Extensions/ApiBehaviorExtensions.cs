using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace API.Extensions;

public static class ApiBehaviorExtensions
{
    public static IServiceCollection ConfigureApiBehavior(this IServiceCollection services)
    {
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var fieldErrors = context.ModelState
                    .Where(e => e.Value?.Errors.Count > 0)
                    .ToDictionary(
                        e => e.Key,
                        e => e.Value!.Errors.Select(err => err.ErrorMessage).ToArray()
                    );

                var firstError = fieldErrors.FirstOrDefault();

                return new BadRequestObjectResult(new
                {
                    Error = firstError.Value?.FirstOrDefault() ?? "Error de validación",
                    ErrorCode = (string?)null,
                    FieldErrors = fieldErrors
                });
            };
        });

        return services;
    }
}
