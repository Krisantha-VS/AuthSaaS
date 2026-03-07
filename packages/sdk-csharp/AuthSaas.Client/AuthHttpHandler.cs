using System.Net;
using System.Net.Http.Headers;

namespace AuthSaas.Client;

/// <summary>
/// A <see cref="DelegatingHandler"/> that attaches a Bearer token to every outgoing
/// request and transparently refreshes it on 401 using <see cref="IAuthService"/>.
///
/// Usage:
/// <code>
/// services.AddHttpClient&lt;MyApiClient&gt;()
///         .AddAuthSaasHandler();
/// </code>
/// Your code must supply the token store via <see cref="ITokenStore"/>.
/// </summary>
public sealed class AuthHttpHandler : DelegatingHandler
{
    private readonly IAuthService _auth;
    private readonly ITokenStore  _store;

    public AuthHttpHandler(IAuthService auth, ITokenStore store)
    {
        _auth  = auth;
        _store = store;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var token = await _store.GetAccessTokenAsync(ct);
        if (token is not null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await base.SendAsync(request, ct);

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            var refreshToken = await _store.GetRefreshTokenAsync(ct);
            if (refreshToken is null) return response;

            try
            {
                var result = await _auth.RefreshAsync(refreshToken, ct);
                await _store.SaveTokensAsync(
                    result.Tokens.AccessToken,
                    result.Tokens.RefreshToken, ct);

                // Retry with new token
                request.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", result.Tokens.AccessToken);
                response = await base.SendAsync(request, ct);
            }
            catch (AuthSaasException)
            {
                await _store.ClearAsync(ct);
            }
        }

        return response;
    }
}

/// <summary>
/// Implement this to tell <see cref="AuthHttpHandler"/> where tokens are stored
/// (e.g. in-memory, cookie, secure storage).
/// </summary>
public interface ITokenStore
{
    Task<string?> GetAccessTokenAsync(CancellationToken ct = default);
    Task<string?> GetRefreshTokenAsync(CancellationToken ct = default);
    Task SaveTokensAsync(string accessToken, string refreshToken, CancellationToken ct = default);
    Task ClearAsync(CancellationToken ct = default);
}
