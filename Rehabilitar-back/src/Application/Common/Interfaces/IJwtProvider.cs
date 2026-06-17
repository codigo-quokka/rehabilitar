using Domain.Users;

namespace Application.Common.Interfaces;

public interface IJwtProvider
{
    string GenerateJwtToken(User user, IList<string> roles);
}
