using ErrorOr;

namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task<ErrorOr<Success>> SendConfirmationEmail(string userEmail, string verificationLink);
}
