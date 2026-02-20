'use client';

import { getDiscordSdk } from '@/lib/discord';
import { getFirebaseAuth } from '@/lib/firebase/firebase';
import { signInWithCustomToken, type UserCredential } from 'firebase/auth';

// Handles the Discord sign-in process.
// Checks if the app is running inside the Discord client.
// If so, it uses the Discord Embedded App SDK for authentication.
// If not, it redirects the user to the standard Discord web OAuth flow.
export const handleSignInWithDiscord = async (): Promise<UserCredential | null> => {
  const discordSdk = await getDiscordSdk();

  if (discordSdk) {
    try {
      const { access_token } = await discordSdk.commands.authenticate({});

      const response = await fetch('/api/auth/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to authenticate with Discord.');
      }

      const { customToken } = await response.json();
      const auth = await getFirebaseAuth();
      return await signInWithCustomToken(auth, customToken);

    } catch (error) {
        console.error("Discord SDK authentication failed:", error);
        return null;
    }
  } else {
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify guilds');

    window.location.href = authUrl.toString();

    return null;
  }
};
