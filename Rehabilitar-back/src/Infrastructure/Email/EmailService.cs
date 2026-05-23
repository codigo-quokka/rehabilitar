using Application.Common.Interfaces;
using Application.Common.Settings;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Resend;

namespace Infrastructure.Email;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly IConfiguration _config;
    private readonly FrontendSettings _frontendSettings;

    public EmailService(IResend resend, IConfiguration config, FrontendSettings frontendSettings)
    {
        _resend = resend;
        _frontendSettings = frontendSettings;
        _config = config;
    }

    public async Task<ErrorOr<Success>> SendConfirmationEmail(string userEmail, string verificationLink)
    {
        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>Bienvenido a <strong>RehabilitAR</strong>. Para completar tu registro y empezar a reservar turnos, necesitamos que confirmes tu dirección de correo electrónico.</p>
            <div class='button-container'>
                <a href='{verificationLink}' class='confirm-button'>Confirmar mi cuenta</a>
            </div>
            <p class='alternative-text'>Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:</p>
            <p class='alternative-link'>{verificationLink}</p>
            <p class='message' style='margin-top: 20px; color: #666; font-size: 13px;'>
                Por razones de seguridad, este enlace expirará en 24 horas.
            </p>";

        return await SendEmailAsync(userEmail, "Confirmá tu cuenta en RehabilitAR", content);
    }

    public async Task<ErrorOr<Success>> SendPasswordResetEmail(string userEmail, string link)
    {
        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>RehabilitAR.</strong></p>
            <div class='button-container'>
                <a href='{link}' class='confirm-button'>Restablecer contraseña</a>
            </div>
            <p class='alternative-text'>Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:</p>
            <p class='alternative-link'>{link}</p>
            <p class='message' style='margin-top: 20px; color: #666; font-size: 13px;'>
                Por razones de seguridad, este enlace expirará en 24 horas.
            </p>";

        return await SendEmailAsync(userEmail, "Restablecé tu contraseña en RehabilitAR", content);
    }

    public async Task<ErrorOr<Success>> SendNewUserWithCredentialsEmail(string userEmail, string password)
    {
        var loginUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}/login";

        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>Te damos la bienvenida a <strong>RehabilitAR.</strong> Un administrador ha creado una cuenta para vos en nuestro sistema.</p>
            <p class='message'>A continuación, te enviamos una contraseña generada aleatoriamente para que puedas iniciar sesión por primera vez. Te recomendamos cambiarla una vez que ingreses.</p>
            
            <div class='credentials-box'>
                <p style='margin: 0 0 10px 0; color: #666; font-size: 14px;'>Tu contraseña es:</p>
                <p class='password'>{password}</p>
            </div>
            
            <div class='button-container'>
                <a href='{loginUrl}' class='confirm-button'>Ir al sitio</a>
            </div>
            
            <p class='message' style='color: #666; font-size: 13px;'>
                Ya podés acceder a nuestra plataforma y comenzar a utilizar nuestros servicios.
            </p>";

        return await SendEmailAsync(userEmail, "Te damos la bienvenida a RehabilitAR", content);
    }

    public async Task<ErrorOr<Success>> SendAptoFisicoAprobadoEmail(string userEmail)
    {
        var actividadesUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}/actividades";

        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>¡Tenemos excelentes noticias! Tu apto físico ha sido revisado y <strong>aprobado</strong>.</p>
            <p class='message'>Ya tenés tu cuenta habilitada al 100% para comenzar a reservar turnos y participar de nuestras actividades.</p>
            
            <div class='button-container'>
                <a href='{actividadesUrl}' class='confirm-button'>Ir a actividades</a>
            </div>";

        return await SendEmailAsync(userEmail, "¡Tu apto físico fue aprobado!", content);
    }

    public async Task<ErrorOr<Success>> SendAptoFisicoRechazadoEmail(string userEmail, string motivoRechazo)
    {
        var perfilUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}/perfil";

        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>Te informamos que tu apto físico ha sido revisado y <strong>rechazado</strong>.</p>
            <p class='message'>El motivo del rechazo es: {motivoRechazo}</p>
            <p class='message'>Podés cargar un nuevo apto físico en cualquier momento desde tu perfil en RehabilitAR.</p>
            <p class='message'>Por favor, contactá a un administrador para más información.</p>

            <div class='button-container'>
                <a href='{perfilUrl}' class='confirm-button'>Ir a perfil</a>
            </div>";

        return await SendEmailAsync(userEmail, "Apto físico rechazado", content);
    }

    public async Task<ErrorOr<Success>> SendReservaConfirmadaEmail(string userEmail, string nombreActividad, DateTime fechaActividad)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>Te informamos que tu reserva para la actividad <strong>{nombreActividad}</strong> con fecha {fechaActividad:dd/MM/yyyy} está confirmada.</p>

            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Reserva confirmada", content);
    }

    public async Task<ErrorOr<Success>> SendReservaCanceladaEmail(string userEmail, string nombreActividad, DateTime fechaActividad)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>¡Hola!</p>
            <p class='message'>Te informamos que la cancelación de tu reserva para la actividad <strong>{nombreActividad}</strong> con fecha {fechaActividad:dd/MM/yyyy} ha sido efectuada.</p>
            <p class='message'>Si corresponde, se te reembolsará el monto o el crédito correspondiente en los próximos días.</p>

            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Reserva cancelada", content);
    }

    public async Task<ErrorOr<Success>> SendCancelacionDeActividadParaClientesEmail(string userEmail, string nombreActividad, DateTime fechaActividad, string motivoCancelacion)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>Hola,</p>
            <p class='message'>Te informamos que la actividad <strong>{nombreActividad}</strong> con fecha {fechaActividad:dd/MM/yyyy} ha sido cancelada.</p>
            <p class='message'>El motivo de la cancelación es: {motivoCancelacion}</p>
            <p class='message'>Se te reembolsará el monto o el crédito correspondiente en los próximos días.</p>

            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Actividad cancelada", content);
    }

    public async Task<ErrorOr<Success>> SendCancelacionDeActividadParaProfesoresEmail(string userEmail, string nombreActividad, DateTime fechaActividad, string motivoCancelacion)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>Hola,</p>
            <p class='message'>Te informamos que la actividad <strong>{nombreActividad}</strong> con fecha {fechaActividad:dd/MM/yyyy} ha sido cancelada.</p>
            <p class='message'>El motivo de la cancelación es: {motivoCancelacion}</p>
            <p class='message'>Por favor, contactá a un administrador para más información sobre cómo se manejará tu situación laboral respecto a esta actividad.</p>
            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Actividad cancelada", content);
    }

    public async Task<ErrorOr<Success>> SendOportunidadDeActividadParaProfesoresEmail(string userEmail, string nombreActividad, DateTime fechaActividad)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>Hola,</p>
            <p class='message'>Te informamos que la actividad <strong>{nombreActividad}</strong> con fecha {fechaActividad:dd/MM/yyyy} no tiene profesor asignado.</p>
            <p class='message'>Si te interesa, podés dictarla.</p>
            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Oportunidad de actividad", content);
    }

    public async Task<ErrorOr<Success>> SendCuentaSuspendidaEmail(string userEmail)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>Hola,</p>
            <p class='message'>Te informamos que tu cuenta ha sido suspendida por haber infringido las políticas del sitio.</p>
            <p class='message'>Si creés que esto es un error, por favor contactá a un administrador para resolver la situación.</p>
            
            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Cuenta suspendida", content);
    }

    public async Task<ErrorOr<Success>> SendCuentaReactivadaEmail(string userEmail, string nombreActividad, DateTime fechaActividad)
    {
        var sitioUrl = $"{_frontendSettings.BaseUrl?.TrimEnd('/')}";

        var content = $@"
            <p class='greeting'>Hola,</p>
            <p class='message'>Te informamos que tu cuenta ha sido reactivada.</p>
            <p class='message'>Ya podés ingresar nuevamente a nuestra plataforma y participar de nuestras actividades.</p>

            <div class='button-container'>
                <a href='{sitioUrl}' class='confirm-button'>Ir al sitio</a>
            </div>";

        return await SendEmailAsync(userEmail, "Cuenta reactivada", content);
    }

    // --- MÉTODOS PRIVADOS DE INFRAESTRUCTURA ---

    private async Task<ErrorOr<Success>> SendEmailAsync(string userEmail, string subject, string htmlContent)
    {
        var message = new EmailMessage
        {
            From = _config["Resend:FromEmail"]!,
            To = "codigoquokka@hotmail.com", // TO-DO: Cambiar a userEmail cuando se tenga el dominio real
            Subject = subject,
            HtmlBody = BuildBaseHtml(htmlContent)
        };

        try
        {
            var response = await _resend.EmailSendAsync(message);
            if (response == null)
                return Error.Failure("Email.Send", "Error de resend al enviar el email.");

            return Result.Success;
        }
        catch (Exception)
        {
            return Error.Failure("Email.Connection", "No se pudo conectar con el servidor de correos.");
        }
    }

    private static string BuildBaseHtml(string content)
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
                        {content}
                    </div>
                    <div class='footer'>
                        <p class='footer-text'>© 2026 RehabilitAR. Todos los derechos reservados.</p>
                        <p class='footer-text'>Si este correo no es para vos, podés ignorarlo de forma segura.</p>
                    </div>
                </div>
            </body>
            </html>";
    }
}