namespace AuthSaas.Client;

/// <summary>Thrown when the AuthSaas API returns an error or unexpected response.</summary>
public sealed class AuthSaasException : Exception
{
    public AuthSaasException(string message) : base(message) { }
    public AuthSaasException(string message, Exception inner) : base(message, inner) { }
}
