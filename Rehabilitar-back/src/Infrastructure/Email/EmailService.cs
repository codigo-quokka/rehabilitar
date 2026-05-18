using Application.Common.Interfaces;
using ErrorOr;
using Microsoft.Extensions.Configuration;
// using Microsoft.Extensions.Logging;
using Resend;

namespace Infrastructure.Email;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly IConfiguration _config;
    // private readonly ILogger<EmailService> _logger; se puede implementar logger eventualmente.

    public EmailService(IResend resend, IConfiguration config)
    {
        _resend = resend;
        _config = config;
    }

    public async Task<ErrorOr<Success>> SendConfirmationEmail(string userEmail, string verificationLink)
    {
        // TO-DO: IEmailService para enviar el correo y retornar el confirmationToken.
        // Para testear mientras no esté la verificación de email se imprime el link en consola.
        System.Console.WriteLine();
        System.Console.WriteLine("Enlace de verificación: ");
        System.Console.WriteLine(verificationLink);
        System.Console.WriteLine();
        try
        {
            var response = await _resend.EmailSendAsync(ConfirmationEmail(userEmail, verificationLink));
            if (response == null)
                return Error.Failure("Error de resend al enviar el email.");
            
            return Result.Success;
        }
        catch (Exception)
        {
            return Error.Failure("Email.Connection", "No se pudo conectar con el servidor de correos.");
        }

    }

    public async Task<ErrorOr<Success>> SendPasswordResetEmail(string userEmail, string link)
    {
        // TO-DO: IEmailService para enviar el correo y retornar el confirmationToken.
        // Para testear mientras no esté la verificación de email se imprime el link en consola.
        // System.Console.WriteLine();
        // System.Console.WriteLine("Enlace de verificación: ");
        // System.Console.WriteLine(link);
        // System.Console.WriteLine();
        try
        {
            var response = await _resend.EmailSendAsync(PasswordResetEmail(userEmail, link));
            if (response == null)
                return Error.Failure("Error de resend al enviar el email.");
            
            return Result.Success;
        }
        catch (Exception)
        {
            return Error.Failure("Email.Connection", "No se pudo conectar con el servidor de correos.");
        }

    }

    public async Task<ErrorOr<Success>> SendNewUserWithCredentialsEmail(string userEmail, string password)
    {
        try
        {
            var response = await _resend.EmailSendAsync(NewUserWithCredentialsEmail(userEmail, password));
            if (response == null)
                return Error.Failure("Error de resend al enviar el email.");
            
            return Result.Success;
        }
        catch (Exception)
        {
            return Error.Failure("Email.Connection", "No se pudo conectar con el servidor de correos.");
        }

    }

    private EmailMessage ConfirmationEmail(string userEmail, string verificationLink)
    {
        return new EmailMessage
        {
            From = _config["Resend:FromEmail"]!,
            To = "codigoquokka@hotmail.com", // debería ser To = userEmail pero hasta que haya dominio real sólo podemos enviarlo al mail de codigoquokka
            Subject = "Confirmá tu cuenta en RehabilitAR",
            HtmlBody = BuildConfirmationHtml(verificationLink)
        };
    }

    private EmailMessage PasswordResetEmail(string userEmail, string link)
    {
        return new EmailMessage
        {
            From = _config["Resend:FromEmail"]!,
            To = "codigoquokka@hotmail.com", // debería ser To = userEmail pero hasta que haya dominio real sólo podemos enviarlo al mail de codigoquokka
            Subject = "Restablecé tu contraseña en RehabilitAR",
            HtmlBody = BuildPasswordResetHtml(link)
        };
    }

    private EmailMessage NewUserWithCredentialsEmail(string userEmail, string password)
    {
        return new EmailMessage
        {
            From = _config["Resend:FromEmail"]!,
            To = "codigoquokka@hotmail.com", // debería ser To = userEmail pero hasta que haya dominio real sólo podemos enviarlo al mail de codigoquokka
            Subject = "Te damos la bienvenida a RehabilitAR",
            HtmlBody = BuildNewUserWithCredentialsHtml(password)
        };
    }

    private static string BuildConfirmationHtml(string verificationLink)
    {
        return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #2F4858; background-color: #FBFBFB; margin: 0; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(47, 72, 88, 0.05), 0 2px 4px -1px rgba(47, 72, 88, 0.03); overflow: hidden; border: 1px solid #E8E8ED; }}
                    .header {{ text-align: center; padding: 30px 20px; background-color: #2F6274; color: #ffffff; border-bottom: 4px solid #6DD3A8; }}
                    .logo {{ font-size: 28px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
                    .logo span {{ color: #6DD3A8; }}
                    .content {{ padding: 40px 30px; }}
                    .greeting {{ font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #2F6274; }}
                    .message {{ color: #2F4858; margin-bottom: 30px; font-size: 16px; }}
                    .button-container {{ text-align: center; margin: 40px 0; }}
                    .confirm-button {{ display: inline-block; padding: 14px 40px; background-color: #48B7A5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; }}
                    .confirm-button:hover {{ background-color: #309B9B; }}
                    .alternative-text {{ color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #E8E8ED; padding-top: 20px; }}
                    .alternative-link {{ color: #48B7A5; word-break: break-all; font-size: 13px; }}
                    .footer {{ background-color: #F5F5F7; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #E8E8ED; }}
                    .footer-text {{ margin: 5px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <p class='logo'>Rehabilit<span>AR</span></p>
                    </div>
                    <div class='content'>
                        <p class='greeting'>¡Hola!</p>
                        <p class='message'>Bienvenido a <strong>RehabilitAR</strong>. Para completar tu registro y empezar a reservar turnos, necesitamos que confirmes tu dirección de correo electrónico.</p>
                        <div class='button-container'>
                            <a href='{verificationLink}' class='confirm-button'>Confirmar mi cuenta</a>
                        </div>
                        <p class='alternative-text'>
                            Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:
                        </p>
                        <p class='alternative-link'>{verificationLink}</p>
                        <p class='message' style='margin-top: 20px; color: #666; font-size: 13px;'>
                            Por razones de seguridad, este enlace expirará en 24 horas.
                        </p>
                    </div>
                    <div class='footer'>
                        <p class='footer-text'>© 2026 RehabilitAR. Todos los derechos reservados.</p>
                        <p class='footer-text'>Si no solicitaste crear esta cuenta, podés ignorar este correo de forma segura.</p>
                    </div>
                </div>
            </body>
            </html>";
    }

    private static string BuildPasswordResetHtml(string link)
    {
        return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #2F4858; background-color: #FBFBFB; margin: 0; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(47, 72, 88, 0.05), 0 2px 4px -1px rgba(47, 72, 88, 0.03); overflow: hidden; border: 1px solid #E8E8ED; }}
                    .header {{ text-align: center; padding: 30px 20px; background-color: #2F6274; color: #ffffff; border-bottom: 4px solid #6DD3A8; }}
                    .logo {{ font-size: 28px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
                    .logo span {{ color: #6DD3A8; }}
                    .content {{ padding: 40px 30px; }}
                    .greeting {{ font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #2F6274; }}
                    .message {{ color: #2F4858; margin-bottom: 30px; font-size: 16px; }}
                    .button-container {{ text-align: center; margin: 40px 0; }}
                    .confirm-button {{ display: inline-block; padding: 14px 40px; background-color: #48B7A5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; }}
                    .confirm-button:hover {{ background-color: #309B9B; }}
                    .alternative-text {{ color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #E8E8ED; padding-top: 20px; }}
                    .alternative-link {{ color: #48B7A5; word-break: break-all; font-size: 13px; }}
                    .footer {{ background-color: #F5F5F7; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #E8E8ED; }}
                    .footer-text {{ margin: 5px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <p class='logo'>Rehabilit<span>AR</span></p>
                    </div>
                    <div class='content'>
                        <p class='greeting'>¡Hola!</p>
                        <p class='message'>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>RehabilitAR.</strong></p>
                        <div class='button-container'>
                            <a href='{link}' class='confirm-button'>Restablecer contraseña</a>
                        </div>
                        <p class='alternative-text'>
                            Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:
                        </p>
                        <p class='alternative-link'>{link}</p>
                        <p class='message' style='margin-top: 20px; color: #666; font-size: 13px;'>
                            Por razones de seguridad, este enlace expirará en 24 horas.
                        </p>
                    </div>
                    <div class='footer'>
                        <p class='footer-text'>© 2026 RehabilitAR. Todos los derechos reservados.</p>
                        <p class='footer-text'>Si no solicitaste un restablecimiento de contraseña, por favor ignora este correo de forma segura.</p>
                    </div>
                </div>
            </body>
            </html>";
    }

    private static string BuildNewUserWithCredentialsHtml(string password)
    {
        return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #2F4858; background-color: #FBFBFB; margin: 0; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(47, 72, 88, 0.05), 0 2px 4px -1px rgba(47, 72, 88, 0.03); overflow: hidden; border: 1px solid #E8E8ED; }}
                    .header {{ text-align: center; padding: 30px 20px; background-color: #2F6274; color: #ffffff; border-bottom: 4px solid #6DD3A8; }}
                    .logo {{ font-size: 28px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
                    .logo span {{ color: #6DD3A8; }}
                    .content {{ padding: 40px 30px; }}
                    .greeting {{ font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #2F6274; }}
                    .message {{ color: #2F4858; margin-bottom: 30px; font-size: 16px; }}
                    .credentials-box {{ background-color: #F5F5F7; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; border: 1px dashed #E8E8ED; }}
                    .password {{ font-size: 24px; font-weight: bold; color: #2F6274; letter-spacing: 2px; }}
                    .footer {{ background-color: #F5F5F7; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #E8E8ED; }}
                    .footer-text {{ margin: 5px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <p class='logo'>Rehabilit<span>AR</span></p>
                    </div>
                    <div class='content'>
                        <p class='greeting'>¡Hola!</p>
                        <p class='message'>Te damos la bienvenida a <strong>RehabilitAR.</strong> Un administrador ha creado una cuenta para vos en nuestro sistema.</p>
                        <p class='message'>A continuación, te enviamos tu contraseña temporal para que puedas iniciar sesión por primera vez. Te recomendamos cambiarla una vez que ingreses.</p>
                        
                        <div class='credentials-box'>
                            <p style='margin: 0 0 10px 0; color: #666; font-size: 14px;'>Tu contraseña temporal es:</p>
                            <p class='password'>{password}</p>
                        </div>
                        
                        <div class='button-container'>
                            <a href='http://localhost:5173/login' class='confirm-button'>Ir al sitio</a>
                        </div>
                        
                        <p class='message' style='color: #666; font-size: 13px;'>
                            Ya podés acceder a nuestra plataforma y comenzar a utilizar nuestros servicios.
                        </p>
                    </div>
                    <div class='footer'>
                        <p class='footer-text'>© 2026 RehabilitAR. Todos los derechos reservados.</p>
                        <p class='footer-text'>Este es un correo automático, por favor no respondas a esta dirección.</p>
                    </div>
                </div>
            </body>
            </html>";
    }
}