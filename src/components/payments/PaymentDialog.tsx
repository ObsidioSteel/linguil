'use client';

import { useEffect } from 'react';
import { usePayments } from '@/hooks/use-payments';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

// Stripe Price IDs from environment variables.
const FIXED_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIXED;
const CUSTOM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CUSTOM;

// Props for PaymentDialog.
interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The PaymentDialog handles the UI for making payments.
export const PaymentDialog = ({ open, onOpenChange }: PaymentDialogProps) => {
  // Custom hooks for payment processing and toasts.
  const { createCheckoutSession, isProcessing, error } = usePayments();
  const { toast } = useToast();

  // Shows a toast message on payment error.
  useEffect(() => {
    if (error) {
      toast({
        title: 'Payment Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Handles the payment process on button click.
  const handlePayment = async (priceId: string | undefined, type: 'fixed' | 'custom') => {
    // Checks if Price ID is configured.
    if (priceId) {
      // Constructs success URL for post-payment redirect.
      let successUrl = `${window.location.origin}${window.location.pathname}`;
      // Appends query params for fixed price post-payment handling.
      if (type === 'fixed') {
        successUrl += '?value=1.99&currency=USD'; // Default currency is USD
      }

      // Creates a Stripe Checkout session.
      await createCheckoutSession(priceId, successUrl);

    } else {
      // Shows error toast if Price ID is not set up.
      toast({
        title: 'Configuration error',
        description: 'Payment processing is not set up correctly',
        variant: 'destructive',
      });
    }
  };

  // Prevents closing the dialog during payment processing.
  const handleOpenChange = (newOpenState: boolean) => {
    if (isProcessing) return;
    onOpenChange(newOpenState);
  };

  // Renders the payment dialog.
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-xs">
        <div className="relative">
          {/* Shows loading spinner overlay during processing. */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
              <LoadingSpinner />
            </div>
          )}
          {/* Dialog header. */}
          <DialogHeader>
            <DialogTitle>linguil+</DialogTitle>
            {/* Accessibility description. */}
            <VisuallyHidden>
              <DialogDescription>
                Choose a payment option to unlock unlimited, offline games. You can choose a fixed price or a custom contribution.
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          {/* Dialog main content. */}
          <p className="mb-2 mt-2">Unlimited, offline games</p>
          <p className="text-sm text-muted-foreground mb-4 italic">
            Note: Offline games do not affect leaderboards.
          </p>
          
          {/* Payment buttons. */}
          <div className="flex flex-col gap-2 items-center">
            {/* Fixed price option button. */}
            <Button 
              onClick={() => handlePayment(FIXED_PRICE_ID, 'fixed')}
              className="w-full"
              disabled={isProcessing}
            >
              Unlock
            </Button>
            {/* Custom/donation price option button. */}
            <Button 
              onClick={() => handlePayment(CUSTOM_PRICE_ID, 'custom')}
              className="w-full"
              disabled={isProcessing}
            >
              Unlock + donate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Sets display name for debugging.
PaymentDialog.displayName = 'PaymentDialog';