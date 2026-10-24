import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

// When set (on Vercel), browser calls to /api go through this site to the API, so the
// auth and CSRF cookies stay first-party. Locally the browser calls the API directly.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return apiProxyTarget
            ? [{ source: '/api/:path*', destination: `${apiProxyTarget}/api/:path*` }]
            : [];
    },
};

export default withNextIntl(nextConfig);
