import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

// Maps config keys to environment variables for clearer error messages.
const ENV_VAR_MAP: Record<keyof Omit<FirebaseOptions, 'databaseURL'>, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
};

// Loads and validates the client-side Firebase configuration from environment variables.
function getFirebaseConfig(): FirebaseOptions {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Ensure all required environment variables are present.
  for (const key in ENV_VAR_MAP) {
    const configKey = key as keyof Omit<FirebaseOptions, 'databaseURL'>;
    if (!config[configKey]) {
      const envVarName = ENV_VAR_MAP[configKey];
      throw new Error(`CRITICAL: Missing Firebase environment variable: ${envVarName}.`);
    }
  }

  return config as FirebaseOptions;
}

let app: FirebaseApp; // Singleton Firebase app instance.

// Lazily initializes and returns the singleton Firebase app instance.
const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    const firebaseConfig = getFirebaseConfig();
    app = getApps().length ? getApp() : initializeApp(firebaseConfig); // Use existing app or initialize a new one.
  }
  return app;
};

// Lazily imports and returns the Firebase Auth service.
export const getFirebaseAuth = async () => {
  const { getAuth } = await import('firebase/auth');
  return getAuth(getFirebaseApp());
};

// Lazily imports and returns the Firebase Firestore service.
export const getFirebaseFirestore = async () => {
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(getFirebaseApp());
};

// Lazily imports and returns the Firebase Functions service.
export const getFirebaseFunctions = async () => {
  const { getFunctions } = await import('firebase/functions');
  return getFunctions(getFirebaseApp(), 'europe-west1');
};

// Lazily imports and returns the Firebase Performance service.
export const getFirebasePerformance = async () => {
  const { getPerformance } = await import('firebase/performance');
  return getPerformance(getFirebaseApp());
};

// Lazily imports and returns the Firebase Analytics service if supported.
export const getFirebaseAnalytics = async () => {
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (await isSupported()) {
    return getAnalytics(getFirebaseApp()); // Return Analytics only if the browser supports it.
  }
  return null;
};