import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'overview',          title: 'Overview' },
  { id: 'when-to-use',       title: 'When to use OAuth' },
  { id: 'pkce-flow',         title: 'PKCE flow' },
  { id: 'step1-start',       title: '1 · Start the flow',     depth: 3 },
  { id: 'step2-login',       title: '2 · Hosted login',        depth: 3 },
  { id: 'step3-callback',    title: '3 · Handle callback',     depth: 3 },
  { id: 'step4-exchange',    title: '4 · Exchange code',       depth: 3 },
  { id: 'step5-store',       title: '5 · Store tokens',        depth: 3 },
  { id: 'endpoints',         title: 'Endpoint reference' },
  { id: 'ep-authorize-get',  title: 'GET /oauth/authorize',    depth: 3 },
  { id: 'ep-authorize-post', title: 'POST /oauth/authorize',   depth: 3 },
  { id: 'ep-token',          title: 'POST /oauth/token',       depth: 3 },
  { id: 'security',          title: 'Security notes' },
  { id: 'full-example',      title: 'Next.js full example' },
];

export default function OAuthPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="OAuth 2.0 + PKCE"
          description="Delegate authentication to AuthSaas via a secure redirect flow — no password handling in your app."
        />

        <SectionHeading id="overview">Overview</SectionHeading>
        <p>
          AuthSaas implements the{' '}
          <strong>Authorization Code Flow with PKCE</strong> (RFC 7636). Your application redirects
          the user to a hosted AuthSaas login page; after the user authenticates, AuthSaas redirects
          back to your <code>redirect_uri</code> with a short-lived authorization code. Your server
          exchanges the code for access and refresh tokens.
        </p>
        <p>
          Your application <strong>never handles passwords</strong>. All credential validation
          happens on the AuthSaas server.
        </p>

        <SectionHeading id="when-to-use">When to use OAuth vs. direct login</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-border my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Scenario</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Recommended approach</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['You want a hosted login UI with no extra dev work', 'OAuth + PKCE ← this page'],
                ['You need a fully custom-branded login form', 'Direct SDK login'],
                ['Your app is an SPA with no backend', 'Direct SDK login'],
                ['Multiple apps share the same user session', 'OAuth + PKCE (SSO)'],
                ['Strict password isolation requirement', 'OAuth + PKCE'],
              ].map(([scenario, rec]) => (
                <tr key={scenario} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground">{scenario}</td>
                  <td className="px-4 py-2.5">{rec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── PKCE flow ── */}
        <SectionHeading id="pkce-flow">PKCE flow — step by step</SectionHeading>
        <p>The full flow involves five steps. Steps 1 and 3–4 run in your application; step 2 is handled entirely by AuthSaas.</p>

        <SubHeading id="step1-start">1 · Start the flow (your app)</SubHeading>
        <p>
          Generate a random <code>code_verifier</code>, derive a <code>code_challenge</code> from it
          (SHA-256 → base64url), and build an authorization URL. Save the verifier and a random{' '}
          <code>state</code> token in short-lived cookies for CSRF protection.
        </p>
        <CodeBlock lang="typescript" filename="app/api/auth/login-start/route.ts" code={`import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const AUTH_URL   = process.env.NEXT_PUBLIC_AUTH_URL!.trim(); // e.g. https://auth.royalda.com
const CLIENT_ID  = process.env.AUTH_CLIENT_ID!;
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL!.trim();

function generateVerifier(): string {
  return crypto.randomBytes(40).toString('base64url');
}

function deriveChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export async function GET(req: NextRequest) {
  const verifier   = generateVerifier();
  const challenge  = deriveChallenge(verifier);
  const state      = crypto.randomBytes(16).toString('hex');
  const redirectUri = \`\${APP_URL}/api/auth/callback\`;

  const url = new URL(\`\${AUTH_URL}/api/v1/oauth/authorize\`);
  url.searchParams.set('response_type',          'code');
  url.searchParams.set('client_id',              CLIENT_ID);
  url.searchParams.set('redirect_uri',           redirectUri);
  url.searchParams.set('code_challenge',         challenge);
  url.searchParams.set('code_challenge_method',  'S256');
  url.searchParams.set('state',                  state);

  const res = NextResponse.redirect(url.toString());

  const cookieBase = \`Path=/; HttpOnly; SameSite=Lax; Max-Age=300\${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }\`;
  res.headers.append('Set-Cookie', \`oauth_code_verifier=\${verifier}; \${cookieBase}\`);
  res.headers.append('Set-Cookie', \`oauth_state=\${state}; \${cookieBase}\`);
  return res;
}`} />

        <SubHeading id="step2-login">2 · Hosted login page (AuthSaas)</SubHeading>
        <p>
          AuthSaas validates the request parameters and redirects the user to{' '}
          <code>/oauth/login</code>. The user enters their credentials on the AuthSaas-hosted form.
          On success, AuthSaas redirects back to your <code>redirect_uri</code> with{' '}
          <code>?code=xxx&state=xxx</code>.
        </p>
        <Callout variant="note">
          No code changes needed for this step — it is handled entirely by AuthSaas.
        </Callout>

        <SubHeading id="step3-callback">3 · Handle the callback (your app)</SubHeading>
        <p>
          Your callback route verifies the <code>state</code>, then hands the <code>code</code>{' '}
          and <code>code_verifier</code> to the token exchange. Set cookies in a{' '}
          <strong>200 HTML response</strong> — cookie headers on 302 redirects are unreliable in
          Next.js route handlers.
        </p>
        <CodeBlock lang="typescript" filename="app/api/auth/callback/route.ts" code={`import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_URL  = process.env.NEXT_PUBLIC_AUTH_URL!.trim();
const CLIENT_ID = process.env.AUTH_CLIENT_ID!;
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL!.trim();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  const jar          = await cookies();
  const savedState   = jar.get('oauth_state')?.value;
  const codeVerifier = jar.get('oauth_code_verifier')?.value;

  if (!code || !state || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(\`\${APP_URL}?auth_error=invalid_state\`);
  }

  // Exchange code for tokens (server-to-server)
  const tokenRes = await fetch(\`\${AUTH_URL}/api/v1/oauth/token\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type:    'authorization_code',
      code,
      client_id:     CLIENT_ID,
      code_verifier: codeVerifier,
      redirect_uri:  \`\${APP_URL}/api/auth/callback\`,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(\`\${APP_URL}?auth_error=token_exchange_failed\`);
  }

  const { data } = await tokenRes.json();
  const { access_token, refresh_token } = data;

  // Return 200 HTML + explicit Set-Cookie headers (more reliable than 302 + cookies)
  const isProduction = process.env.NODE_ENV === 'production';
  const secure       = isProduction ? '; Secure' : '';

  const html = \`<!DOCTYPE html><html><head>
    <meta http-equiv="refresh" content="0;url=\${APP_URL}">
    <title>Signing in...</title>
  </head><body></body></html>\`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

  // httpOnly refresh token — readable only by /api routes
  res.headers.append('Set-Cookie',
    \`refresh_token=\${refresh_token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=604800\${secure}\`);

  // Short-lived readable cookie — consumed once on client init
  res.headers.append('Set-Cookie',
    \`_at_init=\${encodeURIComponent(access_token)}; SameSite=Lax; Path=/; Max-Age=30\${secure}\`);

  // Clear PKCE cookies
  res.headers.append('Set-Cookie', 'oauth_state=; Path=/; Max-Age=0');
  res.headers.append('Set-Cookie', 'oauth_code_verifier=; Path=/; Max-Age=0');

  return res;
}`} />

        <SubHeading id="step4-exchange">4 · Exchange the code (server-to-server)</SubHeading>
        <p>
          The <code>POST /api/v1/oauth/token</code> call in step 3 is a{' '}
          <strong>server-to-server</strong> request — it must never be called directly from the
          browser. The endpoint has no CORS headers. Sending the{' '}
          <code>code_verifier</code> proves possession of the original challenge without needing a
          client secret.
        </p>

        <SubHeading id="step5-store">5 · Store tokens (your client)</SubHeading>
        <p>
          Read the <code>_at_init</code> cookie on first load, store the access token in{' '}
          <code>sessionStorage</code>, then clear the cookie. For subsequent page loads, use the
          <code>refresh</code> endpoint to silently obtain a new access token from the httpOnly
          <code>refresh_token</code> cookie.
        </p>
        <CodeBlock lang="typescript" filename="lib/auth-client.ts (excerpt)" code={`// Called once on app init to consume the _at_init cookie
export function consumeInitToken(): string | null {
  const match = document.cookie.match(/(?:^|; )_at_init=([^;]*)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  // Clear the cookie immediately
  document.cookie = '_at_init=; Path=/; Max-Age=0';
  return token;
}

// Silent refresh via your own proxy route
export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch('/api/auth/refresh', { method: 'POST' });
  if (!res.ok) return null;
  const { data } = await res.json();
  return data.accessToken ?? null;
}`} />
        <Callout variant="warning">
          Never store tokens in <code>localStorage</code> — XSS attacks can steal them.
          Use <code>sessionStorage</code> for the access token and an httpOnly cookie for the
          refresh token.
        </Callout>

        {/* ── Endpoint reference ── */}
        <SectionHeading id="endpoints">Endpoint reference</SectionHeading>

        <SubHeading id="ep-authorize-get">GET /oauth/authorize</SubHeading>
        <p>
          Validates OAuth parameters and redirects to the hosted login page. Called directly by
          your <code>login-start</code> route via browser redirect — not via <code>fetch</code>.
        </p>
        <CodeBlock lang="text" filename="Query parameters" code={`client_id               string   required  Your app's clientId
redirect_uri            string   required  Must match an allowedOrigin for the app
response_type           string   required  Must be "code"
code_challenge          string   required  BASE64URL(SHA256(code_verifier))
code_challenge_method   string   required  Must be "S256"
state                   string   required  Random CSRF token — echo back to your callback`} />
        <CodeBlock lang="text" filename="Success" code={`302 → /oauth/login?client_id=...&redirect_uri=...&code_challenge=...&state=...`} />
        <CodeBlock lang="json" filename="Error · 400 / 403" code={`{ "success": false, "error": "redirect_uri not allowed", "code": "INVALID_REDIRECT_URI" }`} />

        <SubHeading id="ep-authorize-post">POST /oauth/authorize</SubHeading>
        <p>
          Authenticates user credentials and issues an authorization code. Called by the AuthSaas
          hosted login form — you do not call this directly.
        </p>
        <CodeBlock lang="json" filename="Request body" code={`{
  "client_id":             "your_client_id",
  "email":                 "user@example.com",
  "password":              "secret",
  "code_challenge":        "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256",
  "redirect_uri":          "https://your-app.com/api/auth/callback",
  "state":                 "a1b2c3d4e5f6"
}`} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": {
    "redirectTo": "https://your-app.com/api/auth/callback?code=abc123&state=a1b2c3d4e5f6"
  }
}`} />
        <Callout variant="note">
          The response is JSON (not a 302). The hosted login page reads <code>data.redirectTo</code>{' '}
          and navigates via <code>window.location.href</code>. This sidesteps the{' '}
          <code>opaqueredirect</code> fetch limitation.
        </Callout>

        <SubHeading id="ep-token">POST /oauth/token</SubHeading>
        <p>
          Exchanges an authorization code for access and refresh tokens.{' '}
          <strong>Server-to-server only</strong> — no CORS headers, never call from a browser.
        </p>
        <CodeBlock lang="json" filename="Request body" code={`{
  "grant_type":    "authorization_code",
  "code":          "abc123",
  "client_id":     "your_client_id",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
  "redirect_uri":  "https://your-app.com/api/auth/callback"
}`} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": {
    "access_token":  "eyJ...",
    "refresh_token": "eyJ...",
    "token_type":    "Bearer",
    "expires_in":    900
  }
}`} />
        <p>
          The refresh token is <strong>also</strong> set as an httpOnly cookie (
          <code>Path=/api/v1/auth</code>, 7 days) for server-side use.
        </p>
        <CodeBlock lang="json" filename="Error codes" code={`INVALID_GRANT         400   Code not found, already used, expired, or verifier mismatch
INVALID_CLIENT        401   client_id mismatch
UNSUPPORTED_GRANT_TYPE 400  grant_type must be authorization_code`} />

        {/* ── Security ── */}
        <SectionHeading id="security">Security notes</SectionHeading>
        <ul>
          <li>
            <strong>PKCE replaces client secrets</strong> for public clients. The{' '}
            <code>code_verifier</code> is never transmitted until step 4, so a stolen code alone
            cannot be exchanged.
          </li>
          <li>
            <strong>State prevents CSRF.</strong> Always verify that the <code>state</code> in
            the callback matches the cookie you set in step 1.
          </li>
          <li>
            <strong>Authorization codes expire in 10 minutes</strong> and are single-use.
            Replaying a used code returns <code>INVALID_GRANT</code>.
          </li>
          <li>
            <strong>redirect_uri validation</strong> — only URIs that start with an{' '}
            <code>allowedOrigin</code> configured for your app (or <code>localhost</code> during
            development) are accepted.
          </li>
          <li>
            <strong>Keep <code>POST /oauth/token</code> server-side.</strong> It has no CORS
            headers intentionally to prevent browser access.
          </li>
        </ul>

        {/* ── Full Next.js example ── */}
        <SectionHeading id="full-example">Next.js full example</SectionHeading>
        <p>
          The complete reference implementation (login-start, callback, refresh, logout) is
          available in the{' '}
          <a href="https://github.com/Krisantha-VS/TaskFlow" target="_blank" rel="noopener noreferrer">
            TaskFlow
          </a>{' '}
          open-source project under <code>app/api/auth/</code>.
        </p>
        <CodeBlock lang="text" filename="File layout" code={`app/
  api/
    auth/
      login-start/route.ts   ← Step 1: generate PKCE params, redirect to AuthSaas
      callback/route.ts      ← Step 3: verify state, exchange code, set cookies
      refresh/route.ts       ← Proxy: reads httpOnly cookie, returns new access token
      logout/route.ts        ← Clears httpOnly refresh_token cookie`} />
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
