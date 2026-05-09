namespace Domain.Exceptions;

public class EmailAlreadyVerifiedException : DomainException
{
    public EmailAlreadyVerifiedException() { }

    public EmailAlreadyVerifiedException(string message) : base(message) { }

    public EmailAlreadyVerifiedException(string message, Exception inner) : base(message, inner) { }
}
