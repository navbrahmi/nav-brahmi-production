/** @type {import('next').NextConfig} */

/**
 * Builds Content-Security-Policy header.
 * React in development mode requires eval() for debug callstack reconstruction and HMR.
 * Production, Vercel Preview, and non-development deployments strictly NEVER include 'unsafe-eval'.
 */
function buildCspHeader(env = process.env) {
  const isDev = env.NODE_ENV === 'development';
  const isVercelPreview = env.VERCEL_ENV === 'preview';
  const isVercelProduction = env.VERCEL_ENV === 'production';

  // React development mode requires eval() for debug callstack reconstruction and HMR.
  // Production and Vercel Preview deployments must strictly NEVER include 'unsafe-eval'.
  const allowUnsafeEval = isDev && !isVercelPreview && !isVercelProduction;

  const scriptSrcDirectives = [
    "'self'",
    "'unsafe-inline'",
    allowUnsafeEval ? "'unsafe-eval'" : null,
    "https://checkout.razorpay.com",
  ].filter(Boolean).join(' ');

  return [
    "default-src 'self'",
    `script-src ${scriptSrcDirectives}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://lumberjack.razorpay.com https://api.razorpay.com",
    "frame-src 'self' https://api.razorpay.com",
    "frame-ancestors 'none'",
  ].join('; ') + ';';
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: buildCspHeader(),
          },
        ],
      },
    ];
  },
};

export { buildCspHeader };
export default nextConfig;

