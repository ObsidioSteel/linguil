'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import `ColorPicker` with a loading placeholder.
const ColorPicker = dynamic(() => import('./ColorPicker').then(mod => mod.ColorPicker), {
  loading: () => (
    <div className="absolute left-4 top-4 sm:left-6 sm:top-6 flex items-center gap-2">
      <p className="hidden sm:block text-sm text-muted-foreground dark:text-foreground">Colour:</p>
      <div className="w-8 h-8 rounded-md bg-muted" />
    </div>
  ),
  ssr: false, // Disable SSR.
});

// Props for LeaderboardHeader.
type LeaderboardHeaderProps = {
  // Selected color for the user's chart.
  chartColor?: string;
  // Callback on chart color change.
  onChartColorChange?: (color: string) => void;
};

// Header for the leaderboard with title and optional color picker.
const LeaderboardHeader = memo<LeaderboardHeaderProps>(({ chartColor, onChartColorChange }) => (
  <CardHeader className="relative items-center pt-14 pb-2 sm:pt-6">
    {/* Render ColorPicker if color and handler are provided. */}
    {chartColor && onChartColorChange && (
      <ColorPicker selectedColor={chartColor} onColorChange={onChartColorChange} />
    )}
    <CardTitle>Leaderboard</CardTitle>
  </CardHeader>
));

LeaderboardHeader.displayName = 'LeaderboardHeader';

export { LeaderboardHeader };