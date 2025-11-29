import * as admin from "firebase-admin";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { db } from "./init";
import { getStripe } from "./stripe";
import Stripe from "stripe";

// Define a secret for the Stripe webhook.
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Callable Cloud Function to create a Stripe Checkout session for a payment.
export const createCheckoutSession = onCall({
  region: "us-central1",
  secrets: ["STRIPE_SECRET_KEY"],
  memory: "256MiB",
  cors: [ "https://www.linguil.app", "https://linguil.web.app", "https://linguil.firebaseapp.com", /^https:\/\/.*\.cloudworkstations\.dev$/ ]
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
export const stripeWebhook = onRequest({ region: "us-central1", secrets: ["STRIPE_SECRET_KEY", stripeWebhookSecret], memory: "256MiB" }, async (req, res) => {
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
    const session = event.data.object as Stripe.Checkout.Session;
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