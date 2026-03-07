import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/',           destination: '/docs/introduction', permanent: false },
      { source: '/login',      destination: '/dashboard/login',   permanent: false },
      { source: '/register',   destination: '/dashboard/register',permanent: false },
    ];
  },
};

export default nextConfig;
