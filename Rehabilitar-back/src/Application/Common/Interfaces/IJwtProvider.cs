using Domain;

namespace Application.Common.Interfaces;

public interface IJwtProvider
{
    string GenerateJwtToken(Domain.User user, IList<string> roles);
}
