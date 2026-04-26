import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Override defaults — no arbitrary values allowed
    // Every value used in the product lives here
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      // ── Core surfaces ──────────────────────────────────
      background: '#F8F7F4',   // off-white with warmth — page background
      surface:    '#FFFFFF',   // inputs, raised elements — sits above background

      // ── Text ───────────────────────────────────────────
      text: {
        primary:   '#0F172A',  // slate-900 — near-black, cool authority
        secondary: '#475569',  // slate-600 — readable supporting text
        disabled:  '#94A3B8',  // slate-400 — muted, non-interactive
        inverse:   '#F8F7F4',  // text on dark backgrounds
      },

      // ── Border ─────────────────────────────────────────
      border: {
        DEFAULT: '#E2E8F0',    // slate-200 — standard dividers
        strong:  '#CBD5E1',    // slate-300 — emphasized borders
        subtle:  '#F1F5F9',    // slate-100 — very subtle separators
      },

      // ── Brand accent ───────────────────────────────────
      // Deep navy — institutional, precise, not LinkedIn
      accent: {
        DEFAULT: '#1E3A8A',    // blue-900 — AAA contrast on white
        hover:   '#1B3278',
        active:  '#162966',
        subtle:  '#EFF6FF',    // blue-50 — tinted background for accent elements
        muted:   '#93C5FD',    // blue-300 — de-emphasized accent
      },

      // ── Semantic ────────────────────────────────────────
      success: {
        DEFAULT: '#166534',    // green-800 — authoritative, not playful
        hover:   '#14532D',
        subtle:  '#F0FDF4',    // green-50 — success background tint
        border:  '#BBF7D0',    // green-200
      },
      warning: {
        DEFAULT: '#92400E',    // amber-800 — considered caution
        hover:   '#78350F',
        subtle:  '#FFFBEB',
        border:  '#FDE68A',
      },
      error: {
        DEFAULT: '#991B1B',    // red-800 — serious, not alarming
        hover:   '#7F1D1D',
        subtle:  '#FEF2F2',
        border:  '#FECACA',
      },
    },

    // ── Spacing — named tokens only, no arbitrary values ──
    spacing: {
      px:  '1px',
      0:   '0px',
      0.5: '2px',
      1:   '4px',
      2:   '8px',
      3:   '12px',
      4:   '16px',
      5:   '20px',
      6:   '24px',
      7:   '28px',
      8:   '32px',
      9:   '36px',
      10:  '40px',
      11:  '44px',
      12:  '48px',
      14:  '56px',
      16:  '64px',
      20:  '80px',
      24:  '96px',
      28:  '112px',
      32:  '128px',
      36:  '144px',
      40:  '160px',
      48:  '192px',
      56:  '224px',
      64:  '256px',
      72:  '288px',
      80:  '320px',
      96:  '384px',
    },

    // ── Border radius ──────────────────────────────────────
    borderRadius: {
      none: '0px',
      sm:   '4px',   // badges, tags, credentials — precise, official
      DEFAULT: '6px', // inputs, buttons — considered, not generic
      md:   '8px',   // cards, panels
      lg:   '12px',  // modals, sheets, overlays
      xl:   '16px',  // feature cards (marketing only)
      full: '9999px', // avatars, pills, toggles
    },

    // ── Box shadows — functional only ─────────────────────
    boxShadow: {
      none:  'none',
      sm:    '0 1px 2px rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.08)',
      md:    '0 4px 16px rgba(0, 0, 0, 0.10)',
      lg:    '0 8px 32px rgba(0, 0, 0, 0.12)',
      focus: '0 0 0 3px rgba(28, 61, 90, 0.20)',
    },

    // ── Typography ─────────────────────────────────────────
    fontFamily: {
      sans:  ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      mono:  ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      serif: ['Georgia', 'Times New Roman', 'serif'], // portfolio templates only
    },

    fontSize: {
      // Platform UI scale — intentional, not browser defaults
      'display': ['3rem',       { lineHeight: '3.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
      'h1':      ['2.25rem',    { lineHeight: '2.5rem',  letterSpacing: '-0.02em', fontWeight: '700' }],
      'h2':      ['1.5rem',     { lineHeight: '2rem',    letterSpacing: '-0.01em', fontWeight: '600' }],
      'h3':      ['1.125rem',   { lineHeight: '1.625rem',letterSpacing: '-0.01em', fontWeight: '600' }],
      'h4':      ['0.9375rem',  { lineHeight: '1.375rem',letterSpacing: '0em',     fontWeight: '600' }],
      'body':    ['0.9375rem',  { lineHeight: '1.5rem',  letterSpacing: '0em',     fontWeight: '400' }],
      'small':   ['0.8125rem',  { lineHeight: '1.25rem', letterSpacing: '0em',     fontWeight: '400' }],
      'micro':   ['0.6875rem',  { lineHeight: '1rem',    letterSpacing: '0.02em',  fontWeight: '500' }],
    },

    fontWeight: {
      normal:   '400',
      medium:   '500',
      semibold: '600',
      bold:     '700',
    },

    lineHeight: {
      none:    '1',
      tight:   '1.2',
      snug:    '1.35',
      normal:  '1.5',
      relaxed: '1.6',
      loose:   '1.8',
    },

    // ── Transitions ────────────────────────────────────────
    transitionDuration: {
      instant:  '0ms',
      micro:    '100ms',  // button press feedback
      fast:     '150ms',  // hover transitions
      DEFAULT:  '200ms',  // appearing/disappearing elements
      slow:     '300ms',  // modals maximum
    },

    transitionTimingFunction: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear:  'linear',
      enter:   'cubic-bezier(0, 0, 0.2, 1)',   // ease-out: elements entering
      leave:   'cubic-bezier(0.4, 0, 1, 1)',   // ease-in: elements leaving
    },

    // ── Z-index ────────────────────────────────────────────
    zIndex: {
      0:       '0',
      10:      '10',   // elevated content
      20:      '20',   // sticky headers
      30:      '30',   // dropdowns
      40:      '40',   // modals
      50:      '50',   // toasts, tooltips
      overlay: '100',  // full-screen overlays
    },

    extend: {
      // Breakpoints — unchanged from Tailwind defaults
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1536px',
      },

      // Max widths for containers
      maxWidth: {
        prose: '65ch',
        page:  '1180px',
        form:  '480px',
        card:  '380px',
      },

      // Keyframes — minimal, only what communicates something
      keyframes: {
        // State change: element appearing
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // State change: element appearing from below
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Progress indicator: something is happening
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        // Skeleton loading
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Toast entering
        toastEnter: {
          '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Toast leaving
        toastLeave: {
          '0%':   { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-4px) scale(0.97)' },
        },
      },

      animation: {
        'fade-in':     'fadeIn 200ms ease-out forwards',
        'slide-up':    'slideUp 200ms ease-out forwards',
        // Staggered reveals — apply to successive children
        'slide-up-1':  'slideUp 180ms cubic-bezier(0, 0, 0.2, 1) 0ms both',
        'slide-up-2':  'slideUp 180ms cubic-bezier(0, 0, 0.2, 1) 50ms both',
        'slide-up-3':  'slideUp 180ms cubic-bezier(0, 0, 0.2, 1) 100ms both',
        'slide-up-4':  'slideUp 180ms cubic-bezier(0, 0, 0.2, 1) 150ms both',
        'slide-up-5':  'slideUp 180ms cubic-bezier(0, 0, 0.2, 1) 200ms both',
        'slide-up-6':  'slideUp 180ms cubic-bezier(0, 0, 0.2, 1) 250ms both',
        'pulse-slow':  'pulse 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s linear infinite',
        'toast-enter': 'toastEnter 200ms cubic-bezier(0, 0, 0.2, 1) forwards',
        'toast-leave': 'toastLeave 150ms cubic-bezier(0.4, 0, 1, 1) forwards',
      },
    },
  },
  plugins: [],
}

export default config
