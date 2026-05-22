using ErrorOr;

namespace Application.Common.Interfaces;

public interface IMercadoPagoService
{
    Task<ErrorOr<(string PreferenceId, string InitPoint)>> CreatePreferenceAsync(string reservaId, decimal amount, string description);
    Task<ErrorOr<(bool IsApproved, string ReservaId)>> GetPaymentStatusAsync(string paymentId);
}
