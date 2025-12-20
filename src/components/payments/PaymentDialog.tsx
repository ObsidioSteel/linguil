'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { cn } from '@/lib/utils';

// Stripe Price IDs from environment variables.
const FIXED_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIXED;
const CUSTOM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CUSTOM;

// Props for PaymentDialog.
interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Presents links to the checkout page, ensuring reliable redirection on all browsers.
export const PaymentDialog = ({ open, onOpenChange }: PaymentDialogProps) => {

  // Renders the payment dialog.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-xs">
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
          
          {/* Payment links styled as buttons. */}
          <div className="flex flex-col gap-2 items-center">
            {/* Fixed price option link. */}
            <Link 
              href={`/checkout?priceId=${FIXED_PRICE_ID}&type=fixed`}
              className={cn(buttonVariants(), 'w-full')}
              aria-disabled={!FIXED_PRICE_ID}
              onClick={(e) => {
                if (!FIXED_PRICE_ID) e.preventDefault();
                onOpenChange(false);
              }}
            >
              Unlock
            </Link>
            {/* Custom/donation price option link. */}
            <Link 
              href={`/checkout?priceId=${CUSTOM_PRICE_ID}&type=custom`}
              className={cn(buttonVariants(), 'w-full')}
              aria-disabled={!CUSTOM_PRICE_ID}
              onClick={(e) => {
                if (!CUSTOM_PRICE_ID) e.preventDefault();
                onOpenChange(false);
              }}
            >
              Unlock + donate
            </Link>
          </div>
      </DialogContent>
    </Dialog>
  );
};

// Sets display name for debugging.
PaymentDialog.displayName = 'PaymentDialog';