import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function SystemDark({ data, showBadge = true }: Props) {
  const {
    name, role, tagline, headline, about,
    stats, experience, education, skills, projects, contact,
  } = data;

  return (
    <div className="min-h-screen bg-[#030712] text-[#E2E8F0] font-sans antialiased">

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top bar */}
      <div className="relative border-b border-white/5">
        <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-xs font-mono text-white/20 tracking-widest uppercase">Portfolio</span>
          </div>
          {contact?.email && (
            <a
              href={`mailto:${contact.email}`}
              className="text-xs font-mono text-white/20 hover:text-[#3B82F6] transition-colors"
            >
              {contact.email}
            </a>
          )}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-8">

        {/* Hero */}
        <header className="pt-20 pb-16 border-b border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <p className="text-xs font-mono text-[#3B82F6] tracking-[0.3em] uppercase mb-6">
                {role ?? 'Engineer'}
              </p>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none text-white">
                {name}
              </h1>
              {(tagline || headline) && (
                <p className="mt-6 text-lg text-white/40 max-w-xl leading-relaxed font-light">
                  {tagline || headline}
                </p>
              )}
            </div>

            {/* Contact links */}
            <div className="flex flex-col gap-2 shrink-0">
              {contact?.github && (
                <a
                  href={contact.github.startsWith('http') ? contact.github : `https://github.com/${contact.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-mono text-white/30 hover:text-[#3B82F6] transition-colors group"
                >
                  <span className="text-[#3B82F6]/50 group-hover:text-[#3B82F6]">→</span>
                  github
                </a>
              )}
              {contact?.linkedin && (
                <a
                  href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-mono text-white/30 hover:text-[#3B82F6] transition-colors group"
                >
                  <span className="text-[#3B82F6]/50 group-hover:text-[#3B82F6]">→</span>
                  linkedin
                </a>
              )}
              {contact?.website && (
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-mono text-white/30 hover:text-[#3B82F6] transition-colors group"
                >
                  <span className="text-[#3B82F6]/50 group-hover:text-[#3B82F6]">→</span>
                  website
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Stats row */}
        {(stats ?? []).length > 0 && (
          <div data-section="stats" className="py-10 border-b border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden">
              {(stats ?? []).map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#030712] px-8 py-7 hover:bg-[#0A0F1E] transition-colors"
                >
                  <div className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/30 mt-2 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {about && (
          <div className="py-10 border-b border-white/5 max-w-3xl">
            <p className="text-white/50 text-base leading-relaxed">{about}</p>
          </div>
        )}

        {/* Main grid: experience + sidebar */}
        <div className="py-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16">

          {/* Left: Experience + Projects */}
          <div className="space-y-16">

            {/* Experience */}
            {(experience ?? []).length > 0 && (
              <section data-section="experience">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-xs font-mono text-[#3B82F6] tracking-[0.3em] uppercase">Experience</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="space-y-10">
                  {(experience ?? []).map((exp, i) => (
                    <div
                      key={i}
                      className="group grid grid-cols-[1fr_auto] gap-6 items-start p-6 rounded-xl border border-white/5 hover:border-[#3B82F6]/20 hover:bg-[#0A0F1E] transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-bold text-lg leading-tight">{exp.company}</h3>
                        </div>
                        <p className="text-[#3B82F6] text-sm font-mono mb-4">
                          {exp.title ?? exp.role}
                        </p>
                        <ul className="space-y-2">
                          {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                            <li key={j} className="text-white/40 text-sm leading-relaxed flex gap-3">
                              <span className="text-[#3B82F6]/40 shrink-0 mt-0.5">▸</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-mono text-white/20 whitespace-nowrap">{exp.period}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {(projects ?? []).length > 0 && (
              <section data-section="projects">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-xs font-mono text-[#3B82F6] tracking-[0.3em] uppercase">Projects</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(projects ?? []).map((proj, i) => (
                    <div
                      key={i}
                      className="group p-6 rounded-xl border border-white/5 hover:border-[#3B82F6]/30 hover:bg-[#0A0F1E] transition-all relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-semibold">{proj.title}</h3>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3B82F6]/40 hover:text-[#3B82F6] text-xs font-mono transition-colors ml-2 shrink-0"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                      <p className="text-white/35 text-sm leading-relaxed mb-4">{proj.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(proj.tech ?? []).map((t, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 text-[10px] font-mono text-[#3B82F6]/60 bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded"
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
          </div>

          {/* Right sidebar: skills + education */}
          <div className="space-y-10">

            {/* Skills */}
            {(skills ?? []).length > 0 && (
              <section data-section="skills">
                <p className="text-xs font-mono text-[#3B82F6] tracking-[0.3em] uppercase mb-5">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(skills ?? []).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-xs font-mono text-white/50 border border-white/8 rounded hover:border-[#3B82F6]/30 hover:text-white/70 transition-all bg-white/2"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {(education ?? []).length > 0 && (
              <section data-section="education">
                <p className="text-xs font-mono text-[#3B82F6] tracking-[0.3em] uppercase mb-5">Education</p>
                <div className="space-y-4">
                  {(education ?? []).map((edu, i) => (
                    <div key={i} className="p-4 rounded-lg border border-white/5">
                      <p className="text-white/70 font-medium text-sm">{edu.institution ?? edu.school}</p>
                      <p className="text-white/30 text-xs mt-1 font-mono">{edu.degree}</p>
                      <p className="text-white/20 text-xs mt-0.5 font-mono">{edu.year ?? edu.period}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {showBadge && (
        <footer className="relative border-t border-white/5 py-6">
          <div className="max-w-6xl mx-auto px-8">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
              className="text-[10px] font-mono text-white/15 hover:text-white/30 transition-colors tracking-widest uppercase"
            >
              Built with ForgeFolio
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
