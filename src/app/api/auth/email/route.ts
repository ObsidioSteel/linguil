import { NextResponse } from 'next/server';

// Proxies email auth to Firebase REST API to bypass Discord's iframe CSP.
export async function POST(req: Request) {
  const { action, email, password, name } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const endpoint = action === 'signup'
    ? `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
    : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error.message }, { status: 400 });

    // If signing up and a name is provided, update the profile.
    if (action === 'signup' && name) {
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: data.idToken, displayName: name, returnSecureToken: true }),
      });
    }

    return NextResponse.json({
      idToken: data.idToken,
      user: { uid: data.localId, email: data.email, displayName: name || data.displayName }
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}