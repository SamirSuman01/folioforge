import type { Metadata } from 'next'
import Link from 'next/link'
import AuthCard from './AuthCard'

export const metadata: Metadata = {
  title: 'Sign in — ForgeFolio',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#0C0C0E' }}
    >

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(27,79,216,0.08), transparent)' }}
        aria-hidden="true"
      />

      {/* Floating card */}
      <main
        id="main-content"
        className="relative w-full max-w-[420px] rounded-2xl border p-8 sm:p-10"
        style={{
          background:  '#F8F7F4',
          borderColor: 'rgba(0,0,0,0.06)',
          boxShadow:   '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
          colorScheme: 'light',
          color:       '#0F172A',
        }}
      >
        <AuthCard>{children}</AuthCard>
      </main>

      {/* Footer */}
      <footer className="relative mt-8">
        <p className="text-[10px] font-mono" style={{ color: '#444' }}>
          © {new Date().getFullYear()} ForgeFolio
        </p>
      </footer>

    </div>
  )
}
