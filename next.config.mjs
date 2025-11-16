import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Constructs a Content-Security-Policy string from a policy object.
const buildCsp = (policies) => {
  return Object.entries(policies)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');
};

// Defines the Content Security Policy rules.
const cspPolicies = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Firebase and Google APIs.
    "'unsafe-inline'", // Required for specific inline scripts.
    'https://www.gstatic.com/firebasejs/',
    'https://js.stripe.com',
    'https://apis.google.com',
    'https://*.googletagmanager.com',
    'https://accounts.google.com',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://*.firebaseio.com',
    'wss://*.firebaseio.com',
    'https://*.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://accounts.google.com',
    'https://*.stripe.com',
    'https://*.google-analytics.com',
    'https://*.cloudfunctions.net',
    'https://*.paypal.com',
    'https://apis.google.com',
    'https://play.google.com',
    'https://*.analytics.google.com',
    'https://clientservices.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://lh3.googleusercontent.com',
    'blob:',
    'https://*.googletagmanager.com',
    'https://www.google.com',
  ],
  'frame-src': ["'self'", 'https://*.firebaseapp.com', 'https://*.stripe.com', 'https://accounts.google.com'],
  'media-src': ['https://storage.googleapis.com'],
};

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
          // Restricts how cross-origin openers are identified.
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          // Mitigates cross-site scripting (XSS) attacks.
          {
            key: 'Content-Security-Policy',
            value: buildCsp(cspPolicies),
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