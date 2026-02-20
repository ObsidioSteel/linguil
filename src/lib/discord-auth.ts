'use client';

import { getDiscordSdk } from '@/lib/discord';

// A simplified user type for the object we will get back from our API
// when authenticating from within the Discord client.
export interface DiscordClientUser {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

// The expected shape of the successful response from our API route
// when authenticating from within the Discord client.
export interface DiscordClientAuthResponse {
  user: DiscordClientUser;
  hasPaid: boolean;
}

// Handles the Discord sign-in process.
// Returns a `DiscordClientAuthResponse` when inside the client, otherwise null.
export const handleSignInWithDiscord = async (): Promise<DiscordClientAuthResponse | null> => {
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
        scope: ['identify', 'guilds.join', 'rpc.activities.write'],
      });

      // Send the code to our backend, including a flag to indicate the request
      // is from the Discord client.
      const response = await fetch('/api/auth/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isFromDiscordClient: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to authenticate with Discord.');
      }

      // Our backend returns the user object and payment status directly.
      const authResponse: DiscordClientAuthResponse = await response.json();
      return authResponse;

    } catch (error) {
        console.error("Discord SDK authorization failed:", error);
        return null;
    }
  } else {
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify guilds.join rpc.activities.write');

    window.location.href = authUrl.toString();

    return null;
  }
};
