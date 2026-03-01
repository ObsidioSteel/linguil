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

// Attempts a silent authentication on app launch inside the Discord client.
// It will only succeed if the user has previously authorized the app.
export const handleSilentSignIn = async (): Promise<DiscordClientAuthResponse | null> => {
  const discordSdk = await getDiscordSdk();
  if (!discordSdk) return null;

  try {
    // 1. Authorize with the Discord client.
    const { code } = await discordSdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
      response_type: 'code',
      state: '',
      scope: ['identify', 'guilds.join', 'rpc.activities.write'],
    });

    const apiUrl = new URL('/api/auth/discord', window.location.origin);

    // 2. Send the code to our backend for token exchange and user authentication.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, isFromDiscordClient: true }),
    });

    if (!response.ok) {
      console.warn('Silent sign-in failed during backend fetch.');
      return null;
    }

    // 3. Our backend returns the user object and payment status directly.
    const authResponse: DiscordClientAuthResponse = await response.json();
    return authResponse;

  } catch (error) {
    // Fails silently if the user has not previously authorized the app.
    console.warn("Silent Discord SDK authentication failed. This is expected for new users.", error);
    return null;
  }
};

// Handles the Discord sign-in process for user authentication.
// In a browser, this initiates a redirect and the promise may not resolve.
export const handleSignInWithDiscord = async (): Promise<DiscordClientAuthResponse | { customToken: string } | null> => {
  const discordSdk = await getDiscordSdk();

  if (discordSdk) {
    // Flow for when the app is embedded inside the Discord client.
    try {
      // 1. Authorize with the Discord client, requesting all necessary scopes.
      // This will show a popup to the user if they have not yet authorized the app.
      const { code } = await discordSdk.commands.authorize({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        response_type: 'code',
        state: '',
        scope: ['identify', 'guilds.join', 'rpc.activities.write'],
      });

      const apiUrl = new URL('/api/auth/discord', window.location.origin);

      // 2. Send the code to our backend for token exchange and user creation.
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isFromDiscordClient: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to authenticate with Discord.');
      }

      // 3. Our backend returns the user object and payment status directly.
      const authResponse: DiscordClientAuthResponse = await response.json();
      return authResponse;

    } catch (error) {
        console.error("Discord SDK authorization failed:", error);
        return null;
    }
  } else {
    // Standard browser flow (redirect to Discord auth page).
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify guilds.join rpc.activities.write');

    window.location.href = authUrl.toString();

    return null;
  }
};
