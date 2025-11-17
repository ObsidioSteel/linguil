// Import Firebase Admin SDK and Cloud Functions modules.
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

// Import Stripe and its utility functions.
import Stripe from "stripe";
import { getStripe } from "./stripe";

// Export the seed function for daily words.
export { seedDailyWord } from "./seed";

// Initialize Firebase Admin SDK.
admin.initializeApp();
const db = admin.firestore();

// Define a secret for the Stripe webhook.
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Handle creation of user records for all auth providers.
export const onUserCreate = functions.region("europe-west1").runWith({secrets: ["STRIPE_SECRET_KEY"]}).auth.user().onCreate(async (user: admin.auth.UserRecord) => {
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
      displayName: user.displayName,
      photoURL: user.photoURL,
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
  }
});

// Cloud Function to create a new user account.
export const createUserAccount = onCall({ region: "europe-west1", secrets: ["STRIPE_SECRET_KEY"], memory: "256MiB", cors: true }, async (request) => {
  // Destructure required parameters from the request data.
  const { name, email, password } = request.data;

  // Validate that all required parameters are present.
  if (!name || !email || !password) {
    throw new HttpsError("invalid-argument", "Missing required parameters: name, email, or password");
  }

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
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Generate a custom token for the client to use for a reliable sign-in.
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Return the token to the client.
    return { token: customToken };

  } catch (err: unknown) {
    // Handle any errors that occur during the process.
    const error = err as { code?: string; message?: string };

    // Handle specific Firebase Authentication errors.
    if (error.code && error.code.startsWith('auth/')) {
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

// Firestore trigger that updates a user's aggregated scores when a new daily score is created.
export const onDailyScoreCreate = onDocumentCreated({ document: "users/{userId}/dailyScores/{dailyScoreId}", region: "europe-west1" }, async (event) => {
  try {
    // Get the user ID from the event parameters.
    const userId = event.params.userId;
    if (!userId) return;
    
    // Get a reference to the user's daily scores collection.
    const dailyScoresCollection = db.collection("users").doc(userId).collection("dailyScores");
    const snapshot = await dailyScoresCollection.get();

    // If there are no daily scores, reset the public scores.
    if (snapshot.empty) {
      await db.collection("users_public").doc(userId).update({
        "scores.perfectScores": 0,
        "scores.totalAnswered": 0,
        "scores.totalCorrect": 0,
      });
      return;
    }

    // Initialize score counters.
    let perfectScores = 0;
    let totalCorrect = 0;
    const totalAnswered = snapshot.size * 3; // Assuming 3 questions per day.

    // Iterate over each daily score to calculate the totals.
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && typeof data.score === "number") {
        totalCorrect += data.score;
        if (data.score === 3) { // A score of 3 is considered perfect.
          perfectScores += 1;
        }
      }
    });

    // Update the user's public profile with the new aggregated scores.
    await db.collection("users_public").doc(userId).update({
      "scores.perfectScores": perfectScores,
      "scores.totalAnswered": totalAnswered,
      "scores.totalCorrect": totalCorrect,
    });

  } catch(err) {
    // Log any errors that occur.
    console.error(`Error in onDailyScoreCreate for user ${event.params.userId}:`, err);
  }
});

// Callable Cloud Function to create a Stripe Checkout session for a payment.
export const createCheckoutSession = onCall({
  region: "europe-west1",
  secrets: ["STRIPE_SECRET_KEY"],
  memory: "256MiB",
  cors: true
}, async (request) => {
  // Initialize Stripe.
  const stripe = getStripe();

  // Ensure the user is authenticated.
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to make a purchase");
  }

  // Get required parameters from the request.
  const { priceId, successUrl, cancelUrl } = request.data;
  if (!priceId || !successUrl || !cancelUrl) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }

  try {
    // Get the user's document from Firestore to find their Stripe Customer ID.
    const userRef = db.collection("users").doc(request.auth.uid);
    const userDoc = await userRef.get();
    let customerId = userDoc.data()?.stripeCustomerId;

    // If the user doesn't have a Stripe Customer ID, create one.
    if (!customerId) {
      if (!request.auth.token.email) {
        throw new HttpsError("failed-precondition", "User email is missing, cannot create Stripe customer");
      }

      // Create a new Stripe customer.
      const customer = await stripe.customers.create({
        email: request.auth.token.email,
        metadata: { firebaseUID: request.auth.uid },
      });
      customerId = customer.id;

      // Save the new Stripe Customer ID to the user's document.
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    // Create a new Stripe Checkout session.
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customerId,
      metadata: {
        firebaseUID: request.auth.uid,
      },
    });

    // Return the session URL to the client.
    return { url: session.url };

  } catch (err) {
    // Handle any errors.
    const error = err as { message: string }; 
    throw new HttpsError("internal", error.message);
  }
});

// HTTP-triggered Cloud Function to handle Stripe webhooks.
export const stripeWebhook = onRequest({ region: "europe-west1", secrets: ["STRIPE_SECRET_KEY", stripeWebhookSecret], memory: "256MiB" }, async (req, res) => {
  // Initialize Stripe and get webhook signature.
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];
  const secret = stripeWebhookSecret.value();

  let event: Stripe.Event;
  try {
    // Verify the webhook signature to ensure the request is from Stripe.
    event = stripe.webhooks.constructEvent(req.rawBody, signature as string, secret);
  } catch (err) {
    // If the signature is invalid, return a 400 error.
    res.status(400).send("Webhook Error: " + (err as Error).message);
    return;
  }

  // Handle the 'checkout.session.completed' event.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const uid = session.metadata?.firebaseUID;

    // If the Firebase UID is missing from metadata, return an error.
    if (!uid) {
      res.status(400).send("No firebaseUID in metadata");
      return;
    }

    try {
      // Set a custom claim on the user's auth token to indicate they have paid.
      await admin.auth().setCustomUserClaims(uid, { hasPaid: true });
      // Update the user's document in Firestore to reflect their payment status.
      await db.collection("users").doc(uid).set({ hasPaid: true }, { merge: true });

      // Send a success response.
      res.status(200).send({ received: true });
    } catch {
      // Handle errors during user data update.
      res.status(500).send("Internal server error while updating user data");
    }
  } else {
    // For any other event type, acknowledge receipt.
    res.status(200).send({ received: true });
  }
});

// Firestore trigger to synchronize the 'hasPaid' status with Firebase Auth custom claims.
export const onUserUpdate = onDocumentUpdated({ document: "users/{userId}", region: "europe-west1" }, async (event) => {
  try {
    // Exit if there's no event data.
    if (!event.data) {
      return;
    }

    // Get the data before and after the update.
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const userId = event.params.userId;

    // Exit if the 'hasPaid' status hasn't changed or there's no 'after' data.
    if (beforeData?.hasPaid === afterData?.hasPaid || !afterData) {
      return;
    }

    // Determine the new 'hasPaid' status.
    const hasPaid = afterData.hasPaid === true;

    // Update the custom claims on the user's auth token.
    const user = await admin.auth().getUser(userId);
    await admin.auth().setCustomUserClaims(userId, { ...user.customClaims, hasPaid: hasPaid });
  } catch {
    // Silently catch errors to prevent function crashes from non-critical sync issues.
  }
});