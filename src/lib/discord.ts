
import { DiscordSDK } from '@discord/embedded-app-sdk';

let discordSdk: DiscordSDK | null = null;

export const getDiscordSdk = () => {
    if (!discordSdk) {
        try {
            discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
        } catch (e) {
            console.error('Failed to initialize Discord SDK', e);
            return null;
        }
    }
    return discordSdk;
}

export async function setupDiscordActivity() {
    const sdk = getDiscordSdk();
    if (!sdk) return;

    try {
        // Wait for the SDK to be ready
        await sdk.ready();
        console.log("Discord SDK is ready. Setting activity...");

        // Set the activity for the user
        await sdk.commands.setActivity({
            activity: {
                details: "Guessing languages",
                state: "In-Game",
                timestamps: {
                    start: Date.now(),
                },
                assets: {
                    large_image: "linguil_logo",
                    large_text: "linguil | The daily language guessing game",
                },
                type: 0, // Playing
            },
        });

        console.log("Activity set successfully!");
    } catch (error) {
        console.error("Error setting up Discord activity:", error);
    }
}

export const openExternalLink = async (url: string) => {
    const sdk = getDiscordSdk();
    if (!sdk) return;
    await sdk.commands.openExternalLink({ url });
}