import admin from 'firebase-admin';
import 'server-only';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Accesses a secret from Google Secret Manager.
async function accessSecret(client: SecretManagerServiceClient, name: string): Promise<string> {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/linguil/secrets/${name}/versions/latest`,
        });
        const payload = version.payload?.data?.toString();
        if (!payload) {
            throw new Error(`Payload for secret ${name} is empty.`);
        }
        return payload;
    } catch {
        throw new Error(`Failed to access secret: ${name}.`);
    }
}

// Initializes the Firebase Admin SDK.
async function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return; // Initialize only once.
    }

    try {
        const client = new SecretManagerServiceClient();

        const [projectId, clientEmail, rawPrivateKey] = await Promise.all([
            accessSecret(client, 'FIREBASE_PROJECT_ID'),
            accessSecret(client, 'FIREBASE_CLIENT_EMAIL'),
            accessSecret(client, 'FIREBASE_PRIVATE_KEY'),
        ]);

        const privateKey = rawPrivateKey.replace(/\\n/g, '\n'); // Replace escaped newlines.

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

    } catch {
        throw new Error('Failed to initialize Firebase Admin SDK'); // Critical failure.
    }
}

const adminInitializationPromise = initializeFirebaseAdmin(); // Ensure initialization is run only once.

// Gets the Firebase Admin Auth service, ensuring initialization is complete.
export const getAdminAuth = async (): Promise<admin.auth.Auth> => {
    await adminInitializationPromise;
    return admin.auth();
};

// Gets the Firebase Admin Firestore service, ensuring initialization is complete.
export const getAdminDb = async (): Promise<admin.firestore.Firestore> => {
    await adminInitializationPromise;
    return admin.firestore();
};