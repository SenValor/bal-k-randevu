import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin/*'],
      },
    ],
    sitemap: 'https://baliksefasi.com/sitemap.xml',
  }
} 