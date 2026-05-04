namespace Domain.Exceptions;

public class EmailAlreadyVerifiedException : Exception
{
    public EmailAlreadyVerifiedException() { }

    public EmailAlreadyVerifiedException(string message) : base(message) { }

    public EmailAlreadyVerifiedException(string message, Exception inner) : base(message, inner) { }
}
