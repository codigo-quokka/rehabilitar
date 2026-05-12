using ErrorOr;

namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task<ErrorOr<Success>> SendConfirmationEmail(Guid userId, string confirmationToken);
}
