using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace AuthSaas.Client;

/// <summary>
/// HTTP client implementation of <see cref="IAuthService"/>.
/// Register via <c>services.AddAuthSaas(...)</c>.
/// </summary>
public sealed class AuthSaasClient : IAuthService
{
    private readonly HttpClient      _http;
    private readonly AuthSaasOptions _options;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public AuthSaasClient(HttpClient http, IOptions<AuthSaasOptions> options)
    {
        _http    = http;
        _options = options.Value;
        _http.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/') + "/api/v1/");
    }

    /// <inheritdoc />
    public async Task<AuthSession> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var body = new { clientId = _options.ClientId, request.Email, request.Password, request.Name };
        var resp = await PostAsync<RegisterSessionData>("auth/register", body, ct);
        return new AuthSession
        {
            User   = resp.User,
            Tokens = resp.Tokens,
        };
    }

    /// <inheritdoc />
    public async Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var body = new { clientId = _options.ClientId, request.Email, request.Password };
        var resp = await PostAsync<LoginSessionData>("auth/login", body, ct);
        return new AuthSession
        {
            User   = resp.User,
            Tokens = resp.Tokens,
        };
    }

    /// <inheritdoc />
    public async Task<RefreshResult> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var body = new { refreshToken };
        var resp = await PostAsync<TokenData>("auth/refresh", body, ct);
        return new RefreshResult
        {
            Tokens = new AuthTokens
            {
                AccessToken  = resp.AccessToken,
                RefreshToken = resp.RefreshToken,
                ExpiresIn    = resp.ExpiresIn,
            },
        };
    }

    /// <inheritdoc />
    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var body = new { refreshToken };
        using var message = new HttpRequestMessage(HttpMethod.Post, "auth/logout")
        {
            Content = JsonContent.Create(body, options: _json),
        };
        var response = await _http.SendAsync(message, ct);
        response.EnsureSuccessStatusCode();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<T> PostAsync<T>(string path, object body, CancellationToken ct)
    {
        using var response = await _http.PostAsJsonAsync(path, body, _json, ct);
        var wrapper = await response.Content.ReadFromJsonAsync<ApiResponse<T>>(_json, ct)
            ?? throw new AuthSaasException("Empty response from AuthSaas API");

        if (!wrapper.Success || wrapper.Data is null)
            throw new AuthSaasException(wrapper.Error ?? "AuthSaas API error");

        return wrapper.Data;
    }

    // ── Internal response shapes (match API JSON) ────────────────────────────

    private sealed class RegisterSessionData
    {
        public required AuthUser   User   { get; init; }
        public required AuthTokens Tokens { get; init; }
    }

    private sealed class LoginSessionData
    {
        public required AuthUser   User   { get; init; }
        public required AuthTokens Tokens { get; init; }
    }

    private sealed class TokenData
    {
        public required string AccessToken  { get; init; }
        public required string RefreshToken { get; init; }
        public required long   ExpiresIn    { get; init; }
    }
}
