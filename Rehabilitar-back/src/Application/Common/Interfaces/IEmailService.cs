using ErrorOr;

namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task<ErrorOr<Success>> SendConfirmationEmail(string userEmail, string verificationLink);
    Task<ErrorOr<Success>> SendPasswordResetEmail(string userEmail, string verificationLink);
    Task<ErrorOr<Success>> SendNewUserWithCredentialsEmail(string userEmail, string password);
    Task<ErrorOr<Success>> SendAptoFisicoAprobadoEmail(string userEmail);
    Task<ErrorOr<Success>> SendAptoFisicoRechazadoEmail(string userEmail, string motivoRechazo);
    Task<ErrorOr<Success>> SendReservaConfirmadaEmail(string userEmail, string nombreActividad, DateTime fechaActividad);
    Task<ErrorOr<Success>> SendReservaCanceladaEmail(string userEmail, string nombreActividad, DateTime fechaActividad);
    Task<ErrorOr<Success>> SendCancelacionDeActividadParaClientesEmail(string userEmail, string nombreActividad, DateTime fechaActividad, string motivoCancelacion);
    Task<ErrorOr<Success>> SendCancelacionDeActividadParaProfesoresEmail(string userEmail, string nombreActividad, DateTime fechaActividad, string motivoCancelacion);
    Task<ErrorOr<Success>> SendOportunidadDeActividadParaProfesoresEmail(string userEmail, string nombreActividad, DateTime fechaActividad);
    Task<ErrorOr<Success>> SendCuentaSuspendidaEmail(string userEmail);
    Task<ErrorOr<Success>> SendCuentaReactivadaEmail(string userEmail, string nombreActividad, DateTime fechaActividad);

}
