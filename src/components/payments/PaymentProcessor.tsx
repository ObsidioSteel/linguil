'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the PostPaymentHandler when the 'session_id' URL parameter is present.
const PostPaymentHandler = dynamic(() =>
  import('@/components/payments/PostPaymentHandler').then(mod => mod.PostPaymentHandler)
);

export function PaymentProcessor() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return sessionId ? <PostPaymentHandler /> : null;
}