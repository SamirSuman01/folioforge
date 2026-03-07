'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-bone font-semibold mb-10">
          <span className="w-2 h-2 rounded-full bg-accent" />
          FolioForge
        </Link>

        <div className="bg-bg2 rounded-xl border border-white/[0.04] p-7">
          <h1 className="text-xl font-bold text-bone font-display mb-1">Set new password</h1>
          <p className="text-bone3 text-sm mb-6">Choose a new password for your account.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/15 text-error text-sm">{error}</div>
          )}

          <form onSubmit={handleUpdate} className="space-y-3.5">
            <div>
              <label className="block text-xs text-bone3 mb-1.5">New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full px-3.5 py-2.5 bg-bg3/50 border border-white/[0.06] rounded-lg text-bone text-sm placeholder:text-bone4/40 focus:border-accent/40 focus:outline-none transition-colors"
                placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="block text-xs text-bone3 mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                className="w-full px-3.5 py-2.5 bg-bg3/50 border border-white/[0.06] rounded-lg text-bone text-sm placeholder:text-bone4/40 focus:border-accent/40 focus:outline-none transition-colors"
                placeholder="Repeat password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent2 transition-colors disabled:opacity-50">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
