'use client';

import { getDiscordSdk } from '@/lib/discord/sdk';
import { getFirebaseAuth } from '@/lib/firebase/firebase';
import { signInWithCustomToken, type UserCredential } from 'firebase/auth';

// Handles the entire Discord authentication flow.
// 1. Initializes the Discord SDK.
// 2. Gets an OAuth2 code from the Discord client.
// 3. Sends the code to our backend to be exchanged for a Firebase custom token.
// 4. Signs the user into Firebase using the custom token.
export const handleSignInWithDiscord = async (): Promise<UserCredential> => {
  const discordSdk = await getDiscordSdk();

  // Get an OAuth2 code from the Discord client.
  const { code } = await discordSdk.commands.authenticate({
    client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
    response_type: 'code',
    scope: ['identify', 'guilds.members.read'],
    prompt: 'none',
  });

  // Send the code to our backend.
  const response = await fetch('/api/auth/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to authenticate with Discord.');
  }

  const { customToken } = await response.json();

  // Sign the user into Firebase.
  const auth = await getFirebaseAuth();
  const userCredential = await signInWithCustomToken(auth, customToken);

  return userCredential;
};