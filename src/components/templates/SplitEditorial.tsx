import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function SplitEditorial({ data, showBadge = true }: Props) {
  const {
    name, role, tagline, headline, about,
    stats, experience, education, skills, projects, contact,
  } = data;

  const initials = (name ?? '')
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] antialiased">
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* ─── Left sidebar ──────────────────────────────────── */}
        <aside className="lg:w-[340px] xl:w-[380px] bg-[#0F172A] text-[#CBD5E1] lg:sticky lg:top-0 lg:h-screen overflow-y-auto flex flex-col shrink-0">
          <div className="flex-1 p-8 xl:p-10 flex flex-col gap-8">

            {/* Avatar + name */}
            <div>
              <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mb-6">
                <span className="text-xl font-black text-[#10B981]">{initials}</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
                {name}
              </h1>
              <p className="text-[#10B981] text-sm font-mono mt-2 tracking-wide">{role}</p>
            </div>

            {/* About / tagline */}
            {(about || tagline || headline) && (
              <p className="text-[#64748B] text-sm leading-relaxed border-l-2 border-[#10B981]/30 pl-4">
                {about || tagline || headline}
              </p>
            )}

            {/* Stats */}
            {(stats ?? []).length > 0 && (
              <div data-section="stats">
                <p className="text-[10px] font-mono text-[#334155] uppercase tracking-[0.3em] mb-4">Impact</p>
                <div className="grid grid-cols-2 gap-4">
                  {(stats ?? []).map((stat, i) => (
                    <div key={i} className="bg-[#1E293B] rounded-xl p-4">
                      <div className="text-2xl font-black text-white font-mono leading-none">{stat.value}</div>
                      <div className="text-[10px] text-[#475569] mt-1.5 uppercase tracking-wider leading-tight">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {(skills ?? []).length > 0 && (
              <div data-section="skills">
                <p className="text-[10px] font-mono text-[#334155] uppercase tracking-[0.3em] mb-4">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(skills ?? []).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-mono text-[#94A3B8] bg-[#1E293B] rounded border border-[#1E293B] hover:border-[#10B981]/30 hover:text-[#10B981] transition-all"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {contact && (
              <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-xs text-[#475569] hover:text-[#10B981] transition-colors"
                  >
                    <span className="text-[#10B981]/40">✉</span>
                    {contact.email}
                  </a>
                )}
                {contact.github && (
                  <a
                    href={contact.github.startsWith('http') ? contact.github : `https://github.com/${contact.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#475569] hover:text-[#10B981] transition-colors"
                  >
                    <span className="text-[#10B981]/40">⌥</span>
                    {contact.github.replace('https://github.com/', '')}
                  </a>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#475569] hover:text-[#10B981] transition-colors"
                  >
                    <span className="text-[#10B981]/40">◈</span>
                    {contact.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}
          </div>

          {showBadge && (
            <div className="p-8 xl:p-10 pt-0">
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
                className="text-[10px] font-mono text-[#1E293B] hover:text-[#334155] transition-colors uppercase tracking-widest"
              >
                Built with ForgeFolio
              </a>
            </div>
          )}
        </aside>

        {/* ─── Right content ─────────────────────────────────── */}
        <main className="flex-1 p-8 xl:p-14 space-y-16 min-w-0">

          {/* Experience */}
          {(experience ?? []).length > 0 && (
            <section data-section="experience">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-xs font-mono text-[#94A3B8] uppercase tracking-[0.3em]">Experience</h2>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-3 bottom-0 w-px bg-[#E2E8F0]" />
                <div className="space-y-10">
                  {(experience ?? []).map((exp, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="relative shrink-0 mt-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#10B981] shadow-sm" />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                          <h3 className="text-lg font-bold text-[#0F172A]">{exp.company}</h3>
                          <span className="text-xs font-mono text-[#94A3B8] shrink-0">{exp.period}</span>
                        </div>
                        <p className="text-[#10B981] text-sm font-medium mb-3">{exp.title ?? exp.role}</p>
                        <ul className="space-y-2">
                          {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                            <li key={j} className="text-[#475569] text-sm leading-relaxed flex gap-3">
                              <span className="text-[#CBD5E1] shrink-0 mt-1">·</span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Projects */}
          {(projects ?? []).length > 0 && (
            <section data-section="projects">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-xs font-mono text-[#94A3B8] uppercase tracking-[0.3em]">Projects</h2>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(projects ?? []).map((proj, i) => (
                  <div
                    key={i}
                    className="group bg-white rounded-2xl p-6 border border-[#F1F5F9] hover:border-[#10B981]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-[#0F172A]">{proj.title}</h3>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#CBD5E1] hover:text-[#10B981] text-sm transition-colors ml-2 shrink-0"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                    <p className="text-[#64748B] text-sm leading-relaxed mb-4">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(proj.tech ?? []).map((t, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 text-[10px] font-mono text-[#10B981] bg-[#10B981]/5 border border-[#10B981]/15 rounded-full"
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

          {/* Education */}
          {(education ?? []).length > 0 && (
            <section data-section="education">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-xs font-mono text-[#94A3B8] uppercase tracking-[0.3em]">Education</h2>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
              <div className="space-y-5">
                {(education ?? []).map((edu, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between bg-white rounded-xl px-6 py-5 border border-[#F1F5F9]"
                  >
                    <div>
                      <p className="font-bold text-[#0F172A]">{edu.institution ?? edu.school}</p>
                      <p className="text-[#64748B] text-sm mt-0.5">{edu.degree}</p>
                    </div>
                    <span className="text-xs font-mono text-[#94A3B8] mt-1 sm:mt-0 shrink-0">
                      {edu.year ?? edu.period}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
