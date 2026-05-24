using ErrorOr;

namespace Application.Common.Interfaces;

public interface IMercadoPagoService
{
    Task<ErrorOr<(string PreferenceId, string InitPoint)>> CreatePreferenceAsync(string externalReference, decimal amount, string description);
    Task<ErrorOr<(bool IsApproved, string ExternalReference)>> GetPaymentStatusAsync(string paymentId);
}
