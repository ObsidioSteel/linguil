import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disables production source maps for security and performance.
  productionBrowserSourceMaps: false,

  // Optimizes images to modern formats like AVIF and WebP.
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Configures custom HTTP headers for all routes.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allows CDNs to serve stale content while revalidating.
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=31536000',
          },
          // Enforces HTTPS for all future visits.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevents the page from being displayed in a frame.
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevents browsers from MIME-sniffing the content type.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Controls browser features and APIs.
          {
            key: 'Permissions-Policy',
            value: "clipboard-write=(self)",
          },
          // Controls how much referrer information is sent.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Isolates the page from other browser contexts for security.
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
      // Apply long-term caching to static assets.
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(logo.png|icon.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Customizes the Webpack configuration.
  webpack: (config, { isServer }) => {
    // Excludes server-side packages from the client-side bundle.
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);