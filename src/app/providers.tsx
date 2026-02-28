'use client';

import { ThemeProvider } from "next-themes";
import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';

// Wraps the application with theme and authentication providers.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}