import LeaderboardPageClient from './LeaderboardPageClient';
import dynamic from 'next/dynamic';

// Dynamically import the AnalyticsTracker to prevent it from blocking the main thread.
const AnalyticsTracker = dynamic(
  () => import('@/components/common/AnalyticsTracker').then(mod => mod.AnalyticsTracker),
  { ssr: false }
);

// Renders the leaderboard page, delegating client-side logic and data fetching.
export default function LeaderboardPage() {
  return (
    <>
      <LeaderboardPageClient />
      <AnalyticsTracker />
    </>
  );
}