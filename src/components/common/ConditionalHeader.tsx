'use client';

import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { Header } from '@/components/common/Header';

// Renders the main site header on all pages except for the homepage.
const ConditionalHeader = memo(() => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return isHomePage ? null : <Header />;
});

ConditionalHeader.displayName = 'ConditionalHeader';

export { ConditionalHeader };