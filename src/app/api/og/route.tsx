import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'ForgeFolio'
  const sub   = searchParams.get('sub')   ?? 'Career Signal'
  const score = searchParams.get('score') ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#F8F7F4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          borderLeft: '6px solid #1E3A8A',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '5px', color: '#1E3A8A', textTransform: 'uppercase', fontWeight: 700 }}>
            FF
          </span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>·</span>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '2px', color: '#94A3B8' }}>
            FORGEFOLIO
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, color: '#0F172A', lineHeight: 1.05, letterSpacing: '-2px' }}>
            {title}
          </div>
          <div style={{ fontSize: '28px', color: '#475569', fontWeight: 400 }}>
            {sub}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#CBD5E1', letterSpacing: '2px' }}>
            forgefolio.com
          </span>
          {score && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '48px', fontWeight: 700, color: '#1E3A8A', lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '18px', color: '#94A3B8' }}>/100</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
