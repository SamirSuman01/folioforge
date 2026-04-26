'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RefinedNavbarProps {
  primaryHref?: string;
  primaryLabel?: string;
}

export default function RefinedNavbar({
  primaryHref = '/upload',
  primaryLabel = 'Upload resume',
}: RefinedNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(124,105,89,0.14)] bg-[rgba(248,242,234,0.82)] backdrop-blur-xl">
      <div className="ff-shell flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3 text-[#171210]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(23,63,53,0.18)] bg-[#173f35] text-[14px] font-bold text-[#f7f1e8] shadow-[0_12px_28px_rgba(23,63,53,0.18)]">
            F
          </div>
          <div className="min-w-0">
            <p className="font-display text-[18px] font-semibold tracking-[-0.03em]">ForgeFolio</p>
            <p className="text-[11px] text-[#7b6f63]">Resume to portfolio</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-[14px] text-[#5f554c] md:flex">
          <Link href="/" className="transition-colors hover:text-[#171210]">Home</Link>
          <Link href="/upload" className="transition-colors hover:text-[#171210]">Upload</Link>
          <Link href="/current" className="transition-colors hover:text-[#171210]">Current build</Link>
        </nav>

        <Link href={primaryHref} className="ff-button-primary px-4 py-2.5 text-[13px]">
          {primaryLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
