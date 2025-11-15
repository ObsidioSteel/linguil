import type { MetadataRoute } from 'next';

// Generates the sitemap for the website.
export default function sitemap(): MetadataRoute.Sitemap {
  // Define the base URL for the website.
  const baseUrl = 'https://linguil.app';

  // Return an array of sitemap entries.
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/game`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
  ];
}
