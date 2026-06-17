using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Application.Common.Interfaces;
using Domain.Users;
using Microsoft.AspNetCore.Identity;

namespace API.Middlewares;

public class JwtRenewalMiddleware
{
    private readonly RequestDelegate _next;

    public JwtRenewalMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<User> userManager, IJwtProvider jwtProvider)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var expClaim = context.User.FindFirst(JwtRegisteredClaimNames.Exp) ?? context.User.FindFirst("exp");
            if (expClaim != null && long.TryParse(expClaim.Value, out var exp))
            {
                var expirationTime = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;
                var timeRemaining = expirationTime - DateTime.UtcNow;

                // Renew if less than 1 hour remains
                if (timeRemaining < TimeSpan.FromHours(1) && timeRemaining > TimeSpan.Zero)
                {
                    var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier) ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub);
                    if (userIdClaim != null)
                    {
                        var user = await userManager.FindByIdAsync(userIdClaim.Value);
                        if (user != null)
                        {
                            var roles = await userManager.GetRolesAsync(user);
                            var newToken = jwtProvider.GenerateJwtToken(user, roles);
                            context.Response.Headers.Append("X-Renewed-Token", newToken);
                        }
                    }
                }
            }
        }

        await _next(context);
    }
}
