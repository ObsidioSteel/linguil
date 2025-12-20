import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";

// The URL of the Firebase function that creates a Stripe Checkout session.
const checkoutFunctionUrl = "https://us-central1-linguil.cloudfunctions.net/createCheckoutSession";

// Proxies an authenticated request from the client to the Firebase checkout function to avoid Safari cross-origin issues.
export async function POST(req: NextRequest) {
  // Get the user's Firebase authentication token from the cookies.
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;

  // Ensure the user is authenticated.
  if (!token) {
    return NextResponse.json({error: "You must be logged in to do that."}, {status: 401});
  }

  try {
    // Get the request body from the client.
    const body = await req.json();

    // Call the Firebase function with the user's authentication token and the request body from the client.
    const response = await fetch(checkoutFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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