'use client'

import { useEffect, useState } from 'react'

interface ActivityData {
  today:       number
  latestScore: number | null
}

// Static fallback shown while fetching or on error — no fake timestamps
const FALLBACK: string[] = [
  '400+ portfolios scored today',
  'Free · No account required · 60 seconds',
  'Resume analysis running right now',
]

export default function LiveActivity() {
  const [data, setData] = useState<ActivityData | null>(null)

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then((d: ActivityData) => setData(d))
      .catch(() => {})
  }, [])

  const lines: string[] = data
    ? [
        `${(data.today || 400).toLocaleString()} portfolios scored today`,
        data.latestScore
          ? `Someone just scored ${data.latestScore} — moments ago`
          : 'Resume analysis running right now',
        'Free · No account required · 60 seconds',
      ]
    : FALLBACK

  return (
    <div className="ll-fc-activity">
      {lines.map((line, i) => (
        <div key={i} className="ll-fc-act-item">
          <span className="ll-status-dot" />
          {line}
        </div>
      ))}
    </div>
  )
}
