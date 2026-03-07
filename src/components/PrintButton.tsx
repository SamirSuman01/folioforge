'use client';

export default function PrintButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={`no-print flex items-center gap-2 px-4 py-2 bg-bg3 text-bone text-sm rounded-lg hover:bg-bg4 transition-colors ${className}`}
      title="Export as PDF"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/>
        <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
      </svg>
      Export PDF
    </button>
  );
}
