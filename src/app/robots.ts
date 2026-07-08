import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.renosmart.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/designer/pricing', '/blog', '/blog/', '/renovation-cost-malaysia'],
        disallow: ['/designer/', '/owner/', '/worker/', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
