import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
      return NextResponse.json({ code: "API_KEY_MISSING" }, { status: 500 });
    }

    // Exchange custom token for an ID token.
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, returnSecureToken: true }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ code: data.error?.message || 'UNKNOWN_ERROR' }, { status: 400 });
    }

    // Lookup the user profile data (Custom Token exchange doesn't return displayName/photoURL by default).
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: data.idToken }),
    });
    
    const lookupData = await lookupRes.json();
    const userData = lookupData.users?.[0] || {};

    return NextResponse.json({
      idToken: data.idToken,
      user: {
        uid: userData.localId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL
      }
    });
  } catch (_error) {
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}