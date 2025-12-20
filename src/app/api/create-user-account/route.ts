import { NextRequest, NextResponse } from 'next/server';

// The URL of the Firebase function to create a new user via email/password.
const CREATE_USER_URL = process.env.NEXT_PUBLIC_FIREBASE_CREATE_USER_FUNCTION_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward the request to the Firebase function.
    const response = await fetch(CREATE_USER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return new NextResponse(JSON.stringify({ error: data.error || 'Function call failed' }), { status: response.status });
    }

    return new NextResponse(JSON.stringify(data), { status: 200 });

  } catch {
    return new NextResponse(JSON.stringify({ error: 'Proxy error' }), { status: 500 });
  }
}