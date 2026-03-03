import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from '@/lib/api/auth-utils';
import { cookies } from 'next/headers';

// The URL of the Firebase function that creates a Stripe Checkout session.
const checkoutFunctionUrl = "https://us-central1-linguil.cloudfunctions.net/createCheckoutSession";

// Proxies an authenticated request from the client to the Firebase checkout function to avoid Safari cross-origin issues.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { isInsideDiscord } = body;
  
  let idToken: string | undefined;

  if (isInsideDiscord) {
    // 1. Discord: Ensure the user is authenticated via cookie.
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 if not logged in.
    }
    const cookieStore = await cookies();
    idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      return NextResponse.json({error: "Token missing from cookie"}, {status: 401});
    }
  } else {
    // 2. Browser: Get the token from the Authorization header.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({error: "You must be logged in to do that."}, {status: 401});
    }
    idToken = authHeader.split('Bearer ')[1];
  }

  try {
    // 3. Call the Firebase function, passing the resolved token as the Authorization header.
    const response = await fetch(checkoutFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Return the response from the Firebase function to the client.
    return NextResponse.json(data, {status: response.status});

  } catch (error) {
    console.error("Error in create-checkout-session proxy:", error);
    // Return an error response if the request fails.
    return NextResponse.json({error: "An unexpected error occurred."}, {status: 500});
  }
}