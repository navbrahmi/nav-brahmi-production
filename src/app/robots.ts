import { MetadataRoute } from 'next';
import { siteConfig } from '../content/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/orders/'],
      },
    ],
    sitemap: `${siteConfig.canonicalBase}/sitemap.xml`,
  };
}
