import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nextConfig, { buildCspHeader } from '../../next.config.mjs';

describe('Content-Security-Policy Security Policy & Environment Scoping', () => {
  it('should strictly OMIT unsafe-eval in production (NODE_ENV=production)', () => {
    const csp = buildCspHeader({
      NODE_ENV: 'production',
    });

    assert.equal(csp.includes("'unsafe-eval'"), false, "Production CSP must NOT contain 'unsafe-eval'");
    assert.ok(csp.includes("script-src 'self' 'unsafe-inline' https://checkout.razorpay.com"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
  });

  it('should strictly OMIT unsafe-eval in Vercel Preview deployments (VERCEL_ENV=preview)', () => {
    const csp = buildCspHeader({
      NODE_ENV: 'development',
      VERCEL_ENV: 'preview',
    });

    assert.equal(csp.includes("'unsafe-eval'"), false, "Vercel Preview CSP must NOT contain 'unsafe-eval'");
  });

  it('should strictly OMIT unsafe-eval in Vercel Production deployments (VERCEL_ENV=production)', () => {
    const csp = buildCspHeader({
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
    });

    assert.equal(csp.includes("'unsafe-eval'"), false, "Vercel Production CSP must NOT contain 'unsafe-eval'");
  });

  it('should include unsafe-eval in local development mode for React callstack reconstruction', () => {
    const csp = buildCspHeader({
      NODE_ENV: 'development',
    });

    assert.equal(csp.includes("'unsafe-eval'"), true, "Local development CSP must contain 'unsafe-eval' for React debugging");
    assert.ok(csp.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com"));
  });

  it('should preserve all required Razorpay payment gateway integration sources', () => {
    const csp = buildCspHeader({ NODE_ENV: 'production' });

    assert.ok(csp.includes('https://checkout.razorpay.com'), 'script-src must include Razorpay checkout');
    assert.ok(csp.includes('https://lumberjack.razorpay.com'), 'connect-src must include Razorpay telemetry');
    assert.ok(csp.includes('https://api.razorpay.com'), 'connect-src and frame-src must include Razorpay API');
    assert.ok(csp.includes("frame-ancestors 'none'"), 'frame-ancestors must prevent clickjacking');
  });

  it('should verify nextConfig.headers() includes Content-Security-Policy header in header rules', async () => {
    const headersConfig = await nextConfig.headers();
    assert.ok(Array.isArray(headersConfig));
    const globalRule = headersConfig.find((r) => r.source === '/:path*');
    assert.ok(globalRule, 'Global path rule /:path* must exist');

    const cspHeader = globalRule.headers.find((h) => h.key === 'Content-Security-Policy');
    assert.ok(cspHeader, 'Content-Security-Policy header must be configured');
    assert.ok(typeof cspHeader.value === 'string');
    assert.ok(cspHeader.value.startsWith("default-src 'self';"));
  });
});
