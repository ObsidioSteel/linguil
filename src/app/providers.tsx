'use client';

import { ThemeProvider } from "next-themes";
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AuthProvider with SSR disabled.
const AuthProvider = dynamic(
  () => import('@/hooks/use-auth').then(mod => mod.AuthProvider),
  { ssr: false }
);

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