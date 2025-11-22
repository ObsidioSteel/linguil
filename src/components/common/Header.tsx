'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';

// The main site header, displaying the logo which links to the homepage.
const Header = memo(() => {
  return (
    <header className="mb-2 flex justify-center">
      <Link href="/" aria-label="Homepage" className="block">
        <div style={{ width: '240px', height: '70px', position: 'relative' }}>
          <Image
            src="/logo.png"
            alt="linguil logo"
            fill
            style={{ objectFit: 'contain' }}
            priority
            fetchPriority="high"
            data-ai-hint="logo simple"
          />
        </div>
      </Link>
    </header>
  );
});

Header.displayName = 'Header';

export { Header };