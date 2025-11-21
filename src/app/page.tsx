'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Header } from '@/components/common/Header';
import dynamic from 'next/dynamic';
import { DarkModeToggleSwitch } from '@/components/common/DarkModeToggleSwitch';
import { Info } from 'lucide-react';

// Dynamically import components to reduce the initial bundle size.
const AuthButton = dynamic(() => import('@/components/auth/AuthButton').then(mod => mod.AuthButton), {
  ssr: false,
});
const AnalyticsTracker = dynamic(() => import('@/components/common/AnalyticsTracker').then(mod => mod.AnalyticsTracker), {
    ssr: false,
});

// The main landing page, providing options to play, authenticate, and toggle dark mode.
export default function HomePage() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center text-center gap-6 w-full flex-grow min-h-screen">
          <Header />
          {/* Link to the main game page. */}
          <Link href="/game" className="w-full max-w-xs">
              <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xl h-14">
                  Play
              </Button>
          </Link>
          {/* Authentication button for users. */}
          <div className="w-full max-w-xs">
            <AuthButton />
          </div>
          {/* Dark mode toggle switch. */}
          <div className="w-full max-w-xs flex justify-center">
            <DarkModeToggleSwitch variant="gamepage" />
          </div>
           {/* Privacy policy link. */}
          <Button asChild variant="ghost" size="icon" className="text-primary hover:bg-transparent hover:text-primary -mt-3">
            <Link href="/privacy" aria-label="Privacy Policy">
              <Info />
            </Link>
          </Button>
          <AnalyticsTracker />
      </div>
    </ErrorBoundary>
  );
}