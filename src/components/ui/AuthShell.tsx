'use client';

import Link from 'next/link';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="ff-page ff-page-grid flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_0.72fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="ff-kicker">Account access</div>
              <h1 className="ff-title-lg mt-5">
                Manage the portfolio without the UI feeling like a separate product.
              </h1>
              <p className="ff-copy-lg mt-5">
                The auth flow should feel as calm and intentional as the rest of the app:
                clear labels, short explanations, and one obvious next action.
              </p>
              <div className="mt-8 grid gap-3">
                {[
                  'Short forms with clear labels',
                  'No unnecessary filler or visual clutter',
                  'Consistent tone with the public funnel',
                ].map((item) => (
                  <div key={item} className="ff-meta-item max-w-md">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#173f35]" />
                    <p className="text-[14px] text-[#5f554c]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full">
            <Link href="/" className="mb-6 inline-flex items-center gap-3 text-[#171210]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(23,63,53,0.18)] bg-[#173f35] text-[14px] font-bold text-[#f7f1e8]">
                F
              </div>
              <div>
                <p className="font-display text-[18px] font-semibold tracking-[-0.03em]">ForgeFolio</p>
                <p className="text-[11px] text-[#7b6f63]">Resume to portfolio</p>
              </div>
            </Link>

            <div className="ff-panel-strong p-7 sm:p-8">
              <h2 className="text-[30px] font-display font-semibold tracking-[-0.04em] text-[#171210]">
                {title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#645950]">
                {description}
              </p>
              <div className="mt-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
