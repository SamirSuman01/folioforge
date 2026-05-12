import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function WarmEditorial({ data, showBadge = true }: Props) {
  const {
    name, role, tagline, headline, about,
    stats, experience, education, skills, projects, contact,
  } = data;

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] antialiased" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Nav strip */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
          <span className="text-xs font-mono text-[#30363D] tracking-widest">PORTFOLIO.EXE</span>
          <div className="flex gap-4">
            {contact?.github && (
              <a
                href={contact.github.startsWith('http') ? contact.github : `https://github.com/${contact.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#30363D] hover:text-[#58A6FF] transition-colors"
              >
                gh/{contact.github.replace(/.*github\.com\//, '')}
              </a>
            )}
            {contact?.linkedin && (
              <a
                href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#30363D] hover:text-[#58A6FF] transition-colors"
              >
                li/{contact.linkedin.replace(/.*linkedin\.com\/in\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8">

        {/* Hero — large name + stats grid */}
        <header className="py-16 border-b border-white/5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 rounded-full bg-[#3FB950] shadow-[0_0_8px_rgba(63,185,80,0.6)]" />
                <span className="text-xs font-mono text-[#3FB950] tracking-widest">AVAILABLE</span>
              </div>
              <h1
                className="font-black leading-none"
                style={{ fontSize: 'clamp(52px, 8vw, 96px)', letterSpacing: '-0.03em' }}
              >
                {name}
              </h1>
              <p className="text-[#3FB950] font-mono text-sm mt-4 tracking-wider">{role}</p>
              {(tagline || headline || about) && (
                <p className="text-[#7D8590] text-base leading-relaxed max-w-xl mt-5 font-light">
                  {about || tagline || headline}
                </p>
              )}
            </div>

            {/* Stats panel */}
            {(stats ?? []).length > 0 && (
              <div data-section="stats" className="shrink-0">
                <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 space-y-5 min-w-[200px]">
                  <p className="text-[10px] font-mono text-[#30363D] uppercase tracking-widest">Metrics</p>
                  {(stats ?? []).map((stat, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-8">
                      <span className="text-[#7D8590] text-xs font-mono uppercase tracking-wider whitespace-nowrap">
                        {stat.label}
                      </span>
                      <span className="text-white font-black text-2xl font-mono leading-none">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Skills strip */}
        {(skills ?? []).length > 0 && (
          <div data-section="skills" className="py-6 border-b border-white/5 overflow-x-auto">
            <div className="flex gap-2 flex-wrap">
              {(skills ?? []).map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs font-mono text-[#7D8590] bg-[#161B22] border border-white/5 rounded-md hover:border-[#3FB950]/30 hover:text-[#3FB950] transition-all whitespace-nowrap"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Two-column main content */}
        <div className="py-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">

          {/* Left: experience */}
          {(experience ?? []).length > 0 && (
            <section data-section="experience">
              <h2 className="text-xs font-mono text-[#30363D] uppercase tracking-[0.3em] mb-8">
                // experience
              </h2>
              <div className="space-y-8">
                {(experience ?? []).map((exp, i) => (
                  <div
                    key={i}
                    className="group relative bg-[#161B22] rounded-xl border border-white/5 p-6 hover:border-[#3FB950]/20 transition-all"
                  >
                    {/* Accent line */}
                    <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-[#3FB950]/20 rounded-full group-hover:bg-[#3FB950]/40 transition-colors" />

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                      <h3 className="font-bold text-white text-lg">{exp.company}</h3>
                      <span className="text-xs font-mono text-[#3FB950]/60 shrink-0">{exp.period}</span>
                    </div>
                    <p className="text-[#3FB950] text-sm font-mono mb-4">{exp.title ?? exp.role}</p>
                    <ul className="space-y-2.5">
                      {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                        <li key={j} className="text-[#7D8590] text-sm leading-relaxed flex gap-3">
                          <span className="text-[#3FB950]/30 shrink-0 mt-0.5 font-mono">›</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Right: projects + education */}
          <div className="space-y-10">

            {(projects ?? []).length > 0 && (
              <section data-section="projects">
                <h2 className="text-xs font-mono text-[#30363D] uppercase tracking-[0.3em] mb-6">
                  // projects
                </h2>
                <div className="space-y-4">
                  {(projects ?? []).map((proj, i) => (
                    <div
                      key={i}
                      className="bg-[#161B22] rounded-xl border border-white/5 p-5 hover:border-[#3FB950]/20 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-white text-sm">{proj.title}</h3>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3FB950]/40 hover:text-[#3FB950] text-xs transition-colors shrink-0"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                      <p className="text-[#7D8590] text-xs leading-relaxed mb-3">{proj.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(proj.tech ?? []).map((t, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 text-[10px] font-mono text-[#3FB950]/50 bg-[#3FB950]/5 border border-[#3FB950]/10 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(education ?? []).length > 0 && (
              <section data-section="education">
                <h2 className="text-xs font-mono text-[#30363D] uppercase tracking-[0.3em] mb-6">
                  // education
                </h2>
                <div className="space-y-3">
                  {(education ?? []).map((edu, i) => (
                    <div
                      key={i}
                      className="bg-[#161B22] rounded-xl border border-white/5 p-5"
                    >
                      <p className="text-white font-semibold text-sm">{edu.institution ?? edu.school}</p>
                      <p className="text-[#7D8590] text-xs mt-1">{edu.degree}</p>
                      <p className="text-[#3FB950]/50 text-xs mt-1 font-mono">{edu.year ?? edu.period}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact card */}
            {contact && (
              <div className="bg-[#161B22] rounded-xl border border-white/5 p-5">
                <p className="text-xs font-mono text-[#30363D] uppercase tracking-[0.3em] mb-4">// contact</p>
                <div className="space-y-2">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-xs text-[#7D8590] hover:text-[#3FB950] transition-colors font-mono"
                    >
                      <span className="text-[#3FB950]/40">@</span>
                      {contact.email}
                    </a>
                  )}
                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#7D8590] hover:text-[#3FB950] transition-colors font-mono"
                    >
                      <span className="text-[#3FB950]/40">#</span>
                      {contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBadge && (
        <footer className="border-t border-white/5 py-5">
          <div className="max-w-5xl mx-auto px-8">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
              className="text-[10px] font-mono text-[#21262D] hover:text-[#30363D] transition-colors uppercase tracking-widest"
            >
              Built with ForgeFolio
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
