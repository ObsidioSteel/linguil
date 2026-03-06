import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    // Exchange custom token for an ID token.
    const exchangeResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': 'https://linguil.app/' 
      },
      body: JSON.stringify({ token, returnSecureToken: true }),
    });

    const exchangeData = await exchangeResponse.json();

    if (!exchangeResponse.ok) {
        const googleError = exchangeData.error?.message || "UNKNOWN_GOOGLE_ERROR";
        console.error("Token exchange failed:", JSON.stringify(exchangeData));
        return NextResponse.json({ 
            message: `Google API Error: ${googleError}` 
        }, { status: 500 });
    }

    // Lookup the user profile data (Custom Token exchange doesn't return displayName/photoURL by default).
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Referer': 'https://linguil.app/'
      },
      body: JSON.stringify({ idToken: exchangeData.idToken }),
    });
    
    const lookupData = await lookupRes.json();

    if (!lookupRes.ok) {
        const googleError = lookupData.error?.message || "UNKNOWN_GOOGLE_ERROR";
        console.error("User lookup failed:", JSON.stringify(lookupData));
        return NextResponse.json({ 
            message: `Google API Error: ${googleError}` 
        }, { status: 500 });
    }

    const userData = lookupData.users?.[0] || {};

    return NextResponse.json({
      idToken: exchangeData.idToken,
      user: {
        uid: userData.localId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL
      }
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('Exchange route error:', errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}