using Application.Common.Interfaces;
using ErrorOr;

namespace Infrastructure.Email;

public class EmailService : IEmailService
{
    public async Task<ErrorOr<Success>> SendConfirmationEmail(Guid userId, string confirmationToken)
    {
        // user id y token para scalar:
        System.Console.WriteLine($"userId = {userId}");
        System.Console.WriteLine($"confirmationToken = {confirmationToken}");
        // TO-DO: IEmailService para enviar el correo y retornar el confirmationToken.
        // Para testear mientras no esté la verificación de email se imprime el link en consola.
        System.Console.WriteLine();
        System.Console.WriteLine("Enlace de verificación: ");
        System.Console.WriteLine();
        System.Console.WriteLine($"http://localhost:5173/email-verification?userId={userId}&confirmationToken={Uri.EscapeDataString(confirmationToken)}");
        return Result.Success;
    }
}
