'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-bone font-semibold mb-10">
          <span className="w-2 h-2 rounded-full bg-accent" />
          FolioForge
        </Link>

        <div className="bg-bg2 rounded-xl border border-white/[0.04] p-7">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h1 className="text-xl font-bold text-bone font-display mb-2">Check your email</h1>
              <p className="text-bone3 text-sm mb-5">We sent a reset link to <strong className="text-bone">{email}</strong>.</p>
              <Link href="/auth/login" className="text-accent text-sm hover:text-accent2 transition-colors">Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-bone font-display mb-1">Reset password</h1>
              <p className="text-bone3 text-sm mb-6">Enter your email to receive a reset link.</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/15 text-error text-sm">{error}</div>
              )}

              <form onSubmit={handleReset} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-bone3 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-3.5 py-2.5 bg-bg3/50 border border-white/[0.06] rounded-lg text-bone text-sm placeholder:text-bone4/40 focus:border-accent/40 focus:outline-none transition-colors"
                    placeholder="you@email.com" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent2 transition-colors disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-5 text-center">
                <Link href="/auth/login" className="text-bone4 text-sm hover:text-bone3 transition-colors">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
