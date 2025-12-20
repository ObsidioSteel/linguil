import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./init";
import { getStripe } from "./stripe";

// Internal function to set up a new user's documents and Stripe customer.
const setupNewUser = async (user: admin.auth.UserRecord) => {
  const stripe = getStripe();
  try {
    // Create a new customer in Stripe.
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { firebaseUID: user.uid },
    });

    // Use a Firestore batch to perform multiple writes atomically.
    const batch = db.batch();

    // Create a document for the user in the 'users' collection.
    const userDocRef = db.collection("users").doc(user.uid);
    batch.set(userDocRef, {
      stripeCustomerId: customer.id,
      email: user.email,
      hasPaid: false,
    });

    // Create a document for the user in the 'users_public' collection.
    const userPublicDocRef = db.collection("users_public").doc(user.uid);
    batch.set(userPublicDocRef, {
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      friendCode: user.uid,
      scores: {
        perfectScores: 0,
        totalAnswered: 0,
        totalCorrect: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Commit the batch write.
    await batch.commit();

  } catch (err) {
    console.error(`Error in setupNewUser for UID: ${user.uid}`, err);
  }
};

// Background trigger (v1) to set up a new user.
export const onUserCreate = functions.region("us-central1").runWith({ secrets: ["STRIPE_SECRET_KEY"] }).auth.user().onCreate(setupNewUser);

// Cloud Function to create a new user account.
export const createUserAccount = onCall({ region: "us-central1", secrets: ["STRIPE_SECRET_KEY"], memory: "256MiB", cors: [ "https://www.linguil.app", "https://linguil.web.app", "https://linguil.firebaseapp.com", /^https:\/\/.*\.cloudworkstations\.dev$/ ] }, async (request) => {
  // Destructure required parameters from the request data.
  const { name, email, password } = request.data;

  // Validate that all required parameters are present.
  if (!name || !email || !password) {
    throw new HttpsError("invalid-argument", "Missing required parameters: name, email, or password");
  }
  
  let userRecord: admin.auth.UserRecord | null = null;

  try {
    // Check if a user with the given email already exists.
    try {
      await admin.auth().getUserByEmail(email);
      throw new HttpsError("already-exists", "A user with this email address already exists");
    } catch (error: any) {
      // If the error is anything other than 'user-not-found', re-throw it.
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create a new user in Firebase Authentication.
    userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });
    
    // Set up the user's data in Stripe and Firestore.
    await setupNewUser(userRecord);

    // Generate a custom token for the client to use for a reliable sign-in.
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Return the token to the client.
    return { token: customToken };

  } catch (err: unknown) {
    // Clean up user record if user creation or setup fails.
    if (userRecord) {
        try {
            await admin.auth().deleteUser(userRecord.uid);
        } catch (cleanupError) {
            console.error(`CRITICAL: Failed to clean up user ${userRecord.uid} after a failed signup.`, cleanupError);
        }
    }
    // Handle any errors that occur during the process.
    const error = err as { code?: string; message?: string };

    // Handle specific Firebase Authentication errors.
    if (error.code && error.code.startsWith("auth/")) {
      const message = error.message || "An unexpected authentication error occurred.";
      throw new HttpsError("failed-precondition", message, { code: error.code });
    }

    // Handle HttpsError instances.
    if (err instanceof HttpsError) {
      throw err;
    }

    // Log and throw a generic internal error for any other cases.
    console.error("Error in createUserAccount:", err);
    throw new HttpsError("internal", "An unexpected error occurred while creating the user account");
  }
});