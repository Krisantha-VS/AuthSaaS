export interface NavItem {
  title: string;
  href: string;
  badge?: 'new' | 'beta' | 'soon';
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction',  href: '/docs/introduction' },
      { title: 'Quick Start',   href: '/docs/quickstart' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { title: 'Overview',            href: '/docs/concepts' },
      { title: 'RBAC & Permissions',  href: '/docs/rbac', badge: 'new' as const },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Authentication',    href: '/docs/api-reference' },
      { title: 'Tenant',            href: '/docs/api-reference#tenant' },
      { title: 'Email Verification', href: '/docs/api-reference#auth-verify' },
      { title: 'User Management',   href: '/docs/api-reference#users' },
      { title: 'Role Management',   href: '/docs/api-reference#roles' },
    ],
  },
  {
    title: 'SDKs',
    items: [
      { title: 'JavaScript / React', href: '/docs/sdk-js' },
      { title: 'C# / Blazor',        href: '/docs/sdk-js#csharp', badge: 'soon' },
    ],
  },
  {
    title: 'Security',
    items: [
      { title: 'Token Lifecycle', href: '/docs/security' },
    ],
  },
];
