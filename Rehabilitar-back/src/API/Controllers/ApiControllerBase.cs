using System.Security.Claims;
using ErrorOr;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    public class ApiControllerBase: ControllerBase
    {
        protected IActionResult Problem(List<Error> errors)
        {
            if (errors.Count is 0) return Ok();

            var primerError = errors.First();

            var statusCode = primerError.Type switch
            {
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Failure => StatusCodes.Status422UnprocessableEntity,
                _ => StatusCodes.Status500InternalServerError
            };

            var fieldErrors = errors
                .Where(e => e.Type == ErrorType.Validation)
                .GroupBy(e => e.Code)
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

            return StatusCode(statusCode, new
            {
                Error = !string.IsNullOrEmpty(primerError.Description) ? primerError.Description : primerError.Code,
                ErrorCode = primerError.Type != ErrorType.Validation ? primerError.Code : null,
                FieldErrors = fieldErrors
            });
        }

        protected Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userId, out var guidId))
                throw new UnauthorizedAccessException("Usuario no autenticado.");
            return guidId;
        }
    }

    
}
