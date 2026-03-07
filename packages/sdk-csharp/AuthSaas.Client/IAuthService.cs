namespace AuthSaas.Client;

/// <summary>
/// Core authentication operations for AuthSaas.
/// Inject this interface in your services/controllers.
/// </summary>
public interface IAuthService
{
    /// <summary>Register a new user under your tenant app.</summary>
    Task<AuthSession> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    /// <summary>Log in an existing user and return tokens.</summary>
    Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken ct = default);

    /// <summary>Rotate a refresh token and return new tokens.</summary>
    Task<RefreshResult> RefreshAsync(string refreshToken, CancellationToken ct = default);

    /// <summary>Revoke the given refresh token (logout).</summary>
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
