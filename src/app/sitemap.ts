import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://artcurve.io';

  return [
    { url: baseUrl,                 lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${baseUrl}/trade`,       lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${baseUrl}/guild`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/studio`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/vault`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
  ];
}
