'use client';

import { getDiscordSdk } from '@/lib/discord';
import type { UserCredential } from 'firebase/auth';

// Handles the Discord sign-in process.
// Checks if the app is running inside the Discord client.
// If so, it uses the Discord Embedded App SDK for authentication.
// If not, it redirects the user to the standard Discord web OAuth flow.
export const handleSignInWithDiscord = async (): Promise<UserCredential | null> => {
  const discordSdk = await getDiscordSdk();

  if (discordSdk) {
    // Flow for when the app is embedded inside the Discord client.
    try {
      // 1. Authorize with the Discord client to get a temporary `code`.
      const { code } = await discordSdk.commands.authorize({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify', 'guilds.join'],
      });

      // 2. Send the `code` to our backend API to be exchanged for a Firebase custom token.
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

      console.log("Received custom token from backend:", customToken);
      
      // Returning null because the sign-in on the client is not completed in this flow.
      return null;

    } catch (error) {
        console.error("Discord SDK authorization failed:", error);
        return null;
    }
  } else {
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify guilds.join');

    window.location.href = authUrl.toString();

    return null;
  }
};
