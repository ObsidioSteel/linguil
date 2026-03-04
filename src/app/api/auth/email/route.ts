import { NextResponse } from 'next/server';

// Proxies email auth to Firebase REST API to bypass Discord's iframe CSP.
// Signup is securely handled via /api/create-user-account + /api/auth/exchange.
export async function POST(req: Request) {
  const { email, password } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ code: "API_KEY_MISSING" }, { status: 500 });
  }

  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        return NextResponse.json({ code: data.error?.message || "UNKNOWN_ERROR" }, { status: 400 });
    }

    return NextResponse.json({
      idToken: data.idToken,
      user: { uid: data.localId, email: data.email, displayName: data.displayName }
    });
  } catch (_error) {
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}