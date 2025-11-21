import LeaderboardPageClient from './LeaderboardPageClient';
import { AnalyticsTracker } from '@/components/common/AnalyticsTracker';

// Renders the leaderboard page, delegating client-side logic and data fetching.
export default function LeaderboardPage() {
  return (
    <>
      <LeaderboardPageClient />
      <AnalyticsTracker />
    </>
  );
}