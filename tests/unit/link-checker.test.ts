import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { siteConfig } from '../../src/content/site';
import { productCategories } from '../../src/content/categories';
import sitemap from '../../src/app/sitemap';
import robots from '../../src/app/robots';

describe('Phase 3 Link Checker & Sitemap Route Validation', () => {
  it('should verify all navigation links point to existing page components', () => {
    const knownStaticRoutes = new Set([
      '/',
      '/products',
      '/instructions',
      '/faq',
      '/story',
      '/resources',
      '/contact',
      '/recover',
    ]);

    for (const link of siteConfig.navLinks) {
      assert.ok(knownStaticRoutes.has(link.href), `Header nav link has unknown target: ${link.href}`);
    }

    for (const link of siteConfig.footerLinks) {
      assert.ok(knownStaticRoutes.has(link.href), `Footer link has unknown target: ${link.href}`);
    }
  });

  it('should verify physical page route files exist on disk for all static pages', () => {
    const routeFileMap: Record<string, string> = {
      '/': 'src/app/page.tsx',
      '/products': 'src/app/products/page.tsx',
      '/instructions': 'src/app/instructions/page.tsx',
      '/faq': 'src/app/faq/page.tsx',
      '/story': 'src/app/story/page.tsx',
      '/resources': 'src/app/resources/page.tsx',
      '/contact': 'src/app/contact/page.tsx',
      '/recover': 'src/app/recover/page.tsx',
    };

    for (const [route, relativePath] of Object.entries(routeFileMap)) {
      const fullPath = path.join(process.cwd(), relativePath);
      assert.ok(fs.existsSync(fullPath), `Missing page route file for ${route}: ${relativePath}`);
    }
  });

  it('should generate a comprehensive sitemap including all 13 categories and static pages', () => {
    const map = sitemap();
    assert.ok(Array.isArray(map));
    // 9 static pages + 13 category pages = 22 URLs
    assert.strictEqual(map.length, 22);

    const urls = new Set(map.map((item) => item.url));
    assert.ok(urls.has('https://www.brahmicomputing.in/'));
    assert.ok(urls.has('https://www.brahmicomputing.in/products'));
    assert.ok(urls.has('https://www.brahmicomputing.in/instructions'));
    assert.ok(urls.has('https://www.brahmicomputing.in/faq'));
    assert.ok(urls.has('https://www.brahmicomputing.in/story'));
    assert.ok(urls.has('https://www.brahmicomputing.in/resources'));
    assert.ok(urls.has('https://www.brahmicomputing.in/contact'));
    assert.ok(urls.has('https://www.brahmicomputing.in/recover'));
    assert.ok(urls.has('https://www.brahmicomputing.in/purchase'));

    for (const cat of productCategories) {
      assert.ok(
        urls.has(`https://www.brahmicomputing.in/products/${cat.slug}`),
        `Sitemap missing category: ${cat.slug}`
      );
    }
  });

  it('should configure robots.txt with disallows on sensitive API endpoints', () => {
    const rob = robots();
    assert.strictEqual(rob.sitemap, 'https://www.brahmicomputing.in/sitemap.xml');
    assert.ok(Array.isArray(rob.rules));
    const rule = rob.rules[0];
    assert.strictEqual(rule.userAgent, '*');
    assert.strictEqual(rule.allow, '/');
    assert.deepStrictEqual(rule.disallow, ['/api/', '/orders/']);
  });
});
