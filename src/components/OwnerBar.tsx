'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

interface Props {
  portfolioId: string;
  portfolioUserId: string;
  slug: string;
  viewCount: number;
}

export default function OwnerBar({ portfolioId, portfolioUserId, slug, viewCount }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === portfolioUserId) setIsOwner(true);
    }
    check();
  }, [portfolioUserId, supabase.auth]);

  if (!isOwner) return null;

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 no-print animate-[fadeInUp_0.3s_ease-out]">
      <div className="flex items-center gap-4 px-5 py-2.5 bg-bg2/95 backdrop-blur-xl border border-white/[0.08] rounded-full shadow-2xl shadow-black/50">
        <span className="text-gray4 text-xs font-mono">{viewCount} views</span>
        <div className="w-px h-3 bg-white/[0.08]" />
        <Link href={`/editor/${portfolioId}`} className="text-white text-xs font-medium hover:text-gray3 transition-colors">Edit</Link>
        <Link href={`/dashboard/analytics?id=${portfolioId}`} className="text-gray4 text-xs hover:text-gray3 transition-colors">Analytics</Link>
        <button onClick={handleCopy} className="text-gray4 text-xs hover:text-gray3 transition-colors">
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
