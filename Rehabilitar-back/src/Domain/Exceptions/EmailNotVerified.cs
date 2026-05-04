namespace Domain.Exceptions;

public class EmailNotVerifiedException : DomainException
{
    public EmailNotVerifiedException() { }

    public EmailNotVerifiedException(string message) : base(message) { }

    public EmailNotVerifiedException(string message, Exception inner) : base(message, inner) { }
}
