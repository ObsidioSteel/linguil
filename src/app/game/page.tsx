import dynamic from 'next/dynamic';
import { GlobalLoadingSpinner } from '@/components/common/GlobalLoadingSpinner';
import { AnalyticsTracker } from '@/components/common/AnalyticsTracker';

// Dynamically import the GamePageClient to reduce the initial bundle size and show a loading spinner as a fallback.
const GamePageClient = dynamic(() => import('./GamePageClient'), { loading: () => <GlobalLoadingSpinner /> });

// This server component renders the game page, delegating data fetching to the client-side GamePageClient component.
export default function GamePage() {
  return (
    <>
      <GamePageClient />
      <AnalyticsTracker />
    </>
  );
}