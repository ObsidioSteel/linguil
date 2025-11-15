'use client';

import { useReducer, useCallback } from 'react';
import { getFirebaseFunctions } from '@/lib/firebase/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

// State structure for payment processing.
interface PaymentsState {
  isProcessing: boolean;
  error: string | null;
}

// Actions available for the payments reducer.
type PaymentsAction =
  | { type: 'PROCESS_START' }
  | { type: 'PROCESS_SUCCESS' }
  | { type: 'PROCESS_ERROR'; payload: string };

// Initial state for the payment process.
const initialState: PaymentsState = {
  isProcessing: false,
  error: null,
};

// Manages the state of payment operations.
const paymentsReducer = (state: PaymentsState, action: PaymentsAction): PaymentsState => {
  switch (action.type) {
    case 'PROCESS_START':
      return { isProcessing: true, error: null };
    case 'PROCESS_SUCCESS':
      return { isProcessing: false, error: null };
    case 'PROCESS_ERROR':
      return { isProcessing: false, error: action.payload };
    default:
      return state;
  }
};

// Custom hook for handling Stripe payment checkout sessions.
export const usePayments = () => {
  const { user } = useAuth(); // Get the current user from auth context.
  const [state, dispatch] = useReducer(paymentsReducer, initialState); // Manage payment processing state.
  const { toast } = useToast(); // Access the toast notification system.

  // Displays an error notification.
  const showErrorToast = useCallback((title: string, description: string) => {
    toast({ title, description, variant: 'destructive' });
  }, [toast]);

  // Creates a Stripe checkout session and redirects the user to checkout.
  const createCheckoutSession = useCallback(async (priceId: string, successUrl?: string) => {
    dispatch({ type: 'PROCESS_START' }); // Signal the start of the payment process.

    if (!user) { // Ensure a user is signed in.
      showErrorToast("Authentication error", "You must be signed in to make a purchase");
      dispatch({ type: 'PROCESS_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      const functions = await getFirebaseFunctions(); // Get the Firebase Functions service.
      if (!functions) {
        throw new Error('Firebase Functions service is not available');
      }

      if (!priceId) { // Ensure a product price ID is provided.
        showErrorToast("Payment error", "No product selected");
        dispatch({ type: 'PROCESS_ERROR', payload: 'Price ID not specified' });
        return;
      }
      
      const { httpsCallable } = await import('firebase/functions'); // Dynamically import `httpsCallable`.
      const createCheckout = httpsCallable(functions, 'createCheckoutSession'); // Reference the cloud function.

      const baseUrl = successUrl || window.location.href; // Determine the success URL.
      const finalUrl = new URL(baseUrl);
      finalUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}'); // Append the session ID placeholder.
      
      const cancelUrl = window.location.origin; // Set the cancellation URL.

      // Call the cloud function with the necessary parameters.
      const response: any = await createCheckout({ 
        priceId, 
        successUrl: finalUrl.toString(),
        cancelUrl 
      });

      const url = response.data.url;
      if (!url) {
        throw new Error("Failed to retrieve checkout session URL");
      }

      window.location.href = url; // Redirect to the Stripe Checkout page.

    } catch (err: any) {
      const errorMessage = "Failed to create checkout session"; // Handle any errors.
      dispatch({ type: 'PROCESS_ERROR', payload: errorMessage });
      showErrorToast("Payment error", err.message || errorMessage);
    }
  }, [showErrorToast, user]);

  // Return the payment state and the checkout session function.
  return { ...state, createCheckoutSession };
};