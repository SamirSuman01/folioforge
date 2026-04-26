import ScoreCounter from './ScoreCounter'

// Relatable "before" state — 72/100, fixable, shows real weaknesses
// pct ≥ 90 → green (strong), pct < 75 → amber (needs work), else blue
const BREAKDOWN = [
  { name: 'Completeness', score: '16/25', pct: 64, delay: '0.90s' },
  { name: 'Impact',       score: '21/25', pct: 84, delay: '0.97s' },
  { name: 'Depth',        score: '12/20', pct: 60, delay: '1.04s' },
  { name: 'Relevance',    score: '13/15', pct: 87, delay: '1.11s' },
  { name: 'Presentation', score: '10/15', pct: 67, delay: '1.18s' },
]

const MATCHES = [
  { company: 'Razorpay',    score: '68/100', badge: 'medium', label: 'Medium' },
  { company: 'TCS Digital', score: '74/100', badge: 'high',   label: 'High'   },
  { company: 'Zepto',       score: '71/100', badge: 'medium', label: 'Medium' },
]

export default function SignalCard() {
  return (
    <div className="ll-card-wrap">
      {/* Ghost cards — stacked paper depth */}
      <div className="ll-card-ghost-2" />
      <div className="ll-card-ghost" />

      {/* Main card */}
      <div className="ll-signal-card">
        <div className="ll-card-inner">
          <div className="ll-card-scan" aria-hidden="true" />

          <div className="ll-card-header">
            <span className="ll-card-header-label">Signal Report</span>
            <span className="ll-card-header-tag">Your report in 60 seconds</span>
          </div>

          <div className="ll-card-identity">
            <div className="ll-card-row">
              <span className="ll-card-label">Name</span>
              <span className="ll-card-value ll-placeholder-blur">Rahul Sharma</span>
            </div>
            <div className="ll-card-row">
              <span className="ll-card-label">Role</span>
              <span className="ll-card-value">SDE-1 · Fresher</span>
            </div>
            <div className="ll-card-row">
              <span className="ll-card-label">College</span>
              <span className="ll-card-value ll-placeholder-blur">VIT Vellore · CSE</span>
            </div>
          </div>

          <div className="ll-card-score-section">
            <div>
              <div className="ll-score-label">Score</div>
              <div className="ll-score-num-wrap">
                <ScoreCounter value={72} className="ll-score-num ll-score-num--amber" delay={800} />
                <span className="ll-score-denom">/100</span>
              </div>
            </div>
            <div className="ll-score-right">
              <div className="ll-grade-tag b">B</div>
              <div className="ll-verdict">
                Solid foundation — 3 gaps blocking shortlists
              </div>
              <div className="ll-score-benchmark">Top 41% · fixable in 2 sessions</div>
            </div>
          </div>

          <div className="ll-card-breakdown">
            <div className="ll-breakdown-label">Breakdown</div>
            {BREAKDOWN.map(({ name, score, pct, delay }) => (
              <div key={name} className="ll-breakdown-row">
                <span className="ll-breakdown-name">{name}</span>
                <div
                  className="ll-bar-track"
                  role="progressbar"
                  aria-label={name}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`ll-bar-fill${pct >= 90 ? ' strong' : pct < 75 ? ' weak' : ''}`}
                    style={{ width: `${pct}%`, animationDelay: delay }}
                  />
                </div>
                <span className="ll-breakdown-score">{score}</span>
              </div>
            ))}
          </div>

          <div className="ll-card-matches">
            <div className="ll-matches-label">Top Matches</div>
            {MATCHES.map(({ company, score, badge, label }) => (
              <div key={company} className="ll-match-row">
                <span className="ll-match-company">{company}</span>
                <span className="ll-match-meta">
                  {score}
                  <span className={`ll-badge ${badge}`}>{label}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="ll-card-fix">
            <div className="ll-fix-label">Highest Impact Fix</div>
            <div className="ll-fix-text">
              Add quantified outcomes to 3 bullets — &ldquo;reduced load time by 40%&rdquo; beats &ldquo;improved performance&rdquo;
            </div>
            <div className="ll-fix-impact">
              → expected +8 to +12 pts
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
