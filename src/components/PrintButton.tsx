'use client';

import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

export default function PrintButton({ className = '' }: { className?: string }) {
  return (
    <Button
      variant="secondary"
      onClick={() => window.print()}
      className={`no-print ${className}`}
      aria-label="Export portfolio as PDF"
    >
      <FileDown className="w-4 h-4 mr-1.5" />
      Export PDF
    </Button>
  );
}
