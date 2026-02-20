'use client';

import type { DiscordSDK } from '@discord/embedded-app-sdk';

// Sets the user's activity in Discord to playing Linguil.
export const setLinguilActivity = async (discordSdk: DiscordSDK) => {
  try {
    await discordSdk.commands.setActivity({
      activity: {
        details: 'Daily',
        state: 'Guessing languages',
        assets: {
          large_image: 'icon',
          large_text: 'linguil',
        },
      },
    });
  } catch (error) {
    console.error('Failed to set Discord activity:', error);
  }
}; 