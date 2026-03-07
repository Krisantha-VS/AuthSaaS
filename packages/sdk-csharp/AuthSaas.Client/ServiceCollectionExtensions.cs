using Microsoft.Extensions.DependencyInjection;

namespace AuthSaas.Client;

/// <summary>Extension methods for registering AuthSaas in an ASP.NET Core or Blazor DI container.</summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers <see cref="IAuthService"/> and related services.
    ///
    /// <para>Minimal setup:</para>
    /// <code>
    /// builder.Services.AddAuthSaas(o =>
    /// {
    ///     o.ClientId = "proj_xxx";
    ///     o.BaseUrl  = "https://auth-saas.vercel.app";
    /// });
    /// </code>
    ///
    /// <para>With auto-refresh handler on your own HttpClient:</para>
    /// <code>
    /// builder.Services.AddAuthSaas(o => { ... })
    ///                 .AddTokenStore&lt;MyTokenStore&gt;()
    ///                 .AddAuthHandler&lt;MyApiClient&gt;();
    /// </code>
    /// </summary>
    public static AuthSaasBuilder AddAuthSaas(
        this IServiceCollection services,
        Action<AuthSaasOptions> configure)
    {
        services.Configure(configure);
        services.AddHttpClient<IAuthService, AuthSaasClient>();
        return new AuthSaasBuilder(services);
    }
}

/// <summary>Fluent builder returned by <see cref="ServiceCollectionExtensions.AddAuthSaas"/>.</summary>
public sealed class AuthSaasBuilder(IServiceCollection services)
{
    public IServiceCollection Services { get; } = services;

    /// <summary>Register a custom <see cref="ITokenStore"/> implementation (singleton).</summary>
    public AuthSaasBuilder AddTokenStore<TStore>()
        where TStore : class, ITokenStore
    {
        Services.AddSingleton<ITokenStore, TStore>();
        return this;
    }

    /// <summary>
    /// Add <see cref="AuthHttpHandler"/> as a delegating handler on a named/typed HttpClient.
    /// Requires a registered <see cref="ITokenStore"/>.
    /// </summary>
    public AuthSaasBuilder AddAuthHandler<TClient>()
        where TClient : class
    {
        Services.AddTransient<AuthHttpHandler>();
        Services.AddHttpClient<TClient>()
                .AddHttpMessageHandler<AuthHttpHandler>();
        return this;
    }
}
