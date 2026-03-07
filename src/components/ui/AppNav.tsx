import Link from 'next/link';

interface AppNavProps {
  rightContent?: React.ReactNode;
}

export default function AppNav({ rightContent }: AppNavProps) {
  return (
    <nav className="border-b border-white/[0.08] px-6 lg:px-8 h-14 flex items-center justify-between">
      <Link href="/" className="text-white text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        FolioForge
      </Link>
      {rightContent && <div className="flex items-center gap-5">{rightContent}</div>}
    </nav>
  );
}
