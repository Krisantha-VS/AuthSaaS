import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },

  async redirects() {
    return [
      { source: '/login',     destination: '/dashboard/login',   permanent: false },
      { source: '/register',  destination: '/dashboard/register',permanent: false },
    ];
  },
};

export default nextConfig;
