import dynamic from 'next/dynamic';
import { GlobalLoadingSpinner } from '@/components/common/GlobalLoadingSpinner';

// Dynamically import the GamePageClient to reduce the initial bundle size and show a loading spinner as a fallback.
const GamePageClient = dynamic(() => import('./GamePageClient'), { loading: () => <GlobalLoadingSpinner /> });

// Dynamically import the AnalyticsTracker to prevent it from blocking the main thread.
const AnalyticsTracker = dynamic(
  () => import('@/components/common/AnalyticsTracker').then(mod => mod.AnalyticsTracker),
  { ssr: false }
);

// This server component renders the game page, delegating data fetching to the client-side GamePageClient component.
export default function GamePage() {
  return (
    <>
      <GamePageClient />
      <AnalyticsTracker />
    </>
  );
}