namespace AuthSaas.Client;

/// <summary>Configuration for the AuthSaas client.</summary>
public sealed class AuthSaasOptions
{
    /// <summary>Your tenant client ID (proj_xxx).</summary>
    public required string ClientId { get; set; }

    /// <summary>Base URL of the AuthSaas API (e.g. https://auth-saas.vercel.app).</summary>
    public required string BaseUrl { get; set; }
}

/// <summary>Auth tokens returned by login/register/refresh.</summary>
public sealed class AuthTokens
{
    public required string AccessToken  { get; init; }
    public required string RefreshToken { get; init; }
    public required long   ExpiresIn    { get; init; }
}

/// <summary>Authenticated user info.</summary>
public sealed class AuthUser
{
    public required string Id    { get; init; }
    public required string Email { get; init; }
    public string?         Name  { get; init; }
    public string?         Role  { get; init; }  // null for new users with no role assigned yet
}

/// <summary>Result of a login or register operation.</summary>
public sealed class AuthSession
{
    public required AuthUser   User   { get; init; }
    public required AuthTokens Tokens { get; init; }
}

/// <summary>Payload returned from token refresh.</summary>
public sealed class RefreshResult
{
    public required AuthTokens Tokens { get; init; }
}

// ── Request DTOs ─────────────────────────────────────────────────────────────

public sealed record RegisterRequest(string Email, string Password, string Name);
public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);

// ── Internal API response wrapper ────────────────────────────────────────────

internal sealed class ApiResponse<T>
{
    public bool    Success { get; init; }
    public T?      Data    { get; init; }
    public string? Error   { get; init; }
}
