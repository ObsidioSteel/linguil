// Handles the entire Discord authentication process.
import { NextRequest, NextResponse } from 'next/server';
import * as admin from "firebase-admin";
import { getAuth } from 'firebase-admin/auth';

// The URL of the Firebase function to create a new user's database records.
const CREATE_USER_URL = process.env.NEXT_PUBLIC_FIREBASE_CREATE_USER_FUNCTION_URL!;

export async function POST(req: NextRequest) {
  await admin.initializeApp();
  const auth = getAuth();

  try {
    const { code } = await req.json();
    if (!code) {
      return new NextResponse(JSON.stringify({ message: 'Authorization code not provided.' }), { status: 400 });
    }

    // 1. Exchange the authorization code for an access token from Discord.
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Discord token exchange failed:', error);
      return new NextResponse(JSON.stringify({ message: 'Failed to authenticate with Discord.' }), { status: 500 });
    }

    const { access_token } = await tokenResponse.json();

    // 2. Use the access token to get the user's profile from Discord.
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile from Discord.');
    }

    const discordUser = await userResponse.json();
    const { id: discordId, username, avatar } = discordUser;
    const photoURL = avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png` : undefined;

    let customToken: string;

    try {
      // 3. Check if the user already exists in Firebase Auth.
      const userRecord = await auth.getUser(discordId);
      // If user exists, update their profile and mint a token.
      await auth.updateUser(userRecord.uid, { displayName: username, photoURL });
      customToken = await auth.createCustomToken(userRecord.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // 4. If user does not exist, create them in Firebase Auth.
        const newUserRecord = await auth.createUser({ uid: discordId, displayName: username, photoURL });

        // 5. Call existing Cloud Function to create the user documents.
        await fetch(CREATE_USER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: newUserRecord.uid, displayName: username, photoURL }),
        });

        customToken = await auth.createCustomToken(newUserRecord.uid);
      } else {
        // Handle other Firebase Admin SDK errors.
        throw error;
      }
    }

    // 6. Return the custom token to the client.
    return new NextResponse(JSON.stringify({ customToken }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('Discord auth route error:', errorMessage);
    return new NextResponse(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
}