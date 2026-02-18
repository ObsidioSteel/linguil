import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// Initialize the Firebase Admin SDK if it hasn't been already.
if (!admin.apps.length) {
  admin.initializeApp();
}

// Handles the POST request to mint a custom Firebase token; expects a Discord access_token in the request body.
export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Access token not provided' }, { status: 400 });
    }

    // Use the access_token to get the user's profile from the Discord API.
    const discordResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Failed to get user from Discord:', errorText);
      return NextResponse.json({ error: 'Failed to validate Discord token' }, { status: 401 });
    }

    const discordUser = await discordResponse.json();
    const { id: discordId, username } = discordUser;

    // Mint a custom Firebase token using the Discord user ID as the UID.
    const firebaseToken = await getAuth().createCustomToken(discordId, { username });

    // Return the newly minted Firebase token to the client.
    return NextResponse.json({ token: firebaseToken });

  } catch (error) {
    console.error('Error minting custom token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}