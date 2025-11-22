'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';

// The main site header, displaying the logo which links to the homepage.
const Header = memo(() => {
  return (
    <header className="mb-2 flex justify-center">
      <Link href="/" aria-label="Homepage" className="block">
          <Image
            src="/logo.png"
            alt="linguil logo"
            width={240}
            height={70}
            priority
            fetchPriority="high"
            data-ai-hint="linguil logo"
          />
      </Link>
    </header>
  );
});

Header.displayName = 'Header';

export { Header };