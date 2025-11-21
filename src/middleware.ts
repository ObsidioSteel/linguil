import { NextRequest, NextResponse } from 'next/server';

// Defines the Content Security Policy rules.
const cspPolicies = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Firebase and Google APIs.
    // Nonce will be added here by the middleware.
    "'strict-dynamic'",
    'https://www.gstatic.com/firebasejs/',
    'https://js.stripe.com',
    'https://apis.google.com',
    'https://*.googletagmanager.com',
    'https://accounts.google.com',
    'https://*.linguil.app',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://*.firebaseio.com',
    'wss://*.firebaseio.com',
    'https://*.googleapis.com',
    'https://firebaseperformance.googleapis.com',
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
    'https://*.google.com',
    'https://ssl.gstatic.com',
    'https://*.linguil.app',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://lh3.googleusercontent.com',
    'blob:',
    'https://*.googletagmanager.com',
    'https://www.google.com',
    'https://*.linguil.app',
  ],
  'frame-src': ["'self'", 'https://*.firebaseapp.com', 'https://*.stripe.com', 'https://accounts.google.com', 'https://linguil.app', 'https://*.linguil.app'],
  'media-src': ['https://storage.googleapis.com', 'https://*.linguil.app'],
  'require-trusted-types-for': ["'script'"],
};

// Constructs a Content-Security-Policy string from a policy object.
const buildCsp = (policies: Record<string, string[]>, nonce: string) => {
  const policyStrings = Object.entries(policies).map(([key, value]) => {
    if (key === 'script-src') {
      // Add the nonce to the script-src directive.
      return `${key} ${[...value, `'nonce-${nonce}'`].join(' ')}`;
    }
    return `${key} ${value.join(' ')}`;
  });
  return policyStrings.join('; ');
};

export function middleware(request: NextRequest) {
  // Generate a random nonce for each request.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Clone the request headers and set the nonce.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create the response object with the updated headers.
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Build and set the Content-Security-Policy header on the response.
  const csp = buildCsp(cspPolicies, nonce);
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

// Configure the middleware to run on all paths except for specific Next.js and asset folders.
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};