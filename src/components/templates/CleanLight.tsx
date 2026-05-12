import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function CleanLight({ data, showBadge = true }: Props) {
  const {
    name, role, tagline, headline, about,
    stats, experience, education, skills, projects, contact,
  } = data;

  return (
    <div className="min-h-screen bg-white text-[#111827] antialiased">

      {/* Hero — massive name treatment */}
      <header className="max-w-5xl mx-auto px-8 pt-24 pb-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <h1
              className="font-black leading-none tracking-tighter"
              style={{ fontSize: 'clamp(64px, 10vw, 120px)', letterSpacing: '-0.03em' }}
            >
              {name}
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-px w-12 bg-[#111827]" />
              <p className="text-sm tracking-widest uppercase text-[#6B7280]">{role}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right shrink-0">
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors"
              >
                {contact.email}
              </a>
            )}
            {contact?.github && (
              <a
                href={contact.github.startsWith('http') ? contact.github : `https://github.com/${contact.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors"
              >
                GitHub ↗
              </a>
            )}
            {contact?.linkedin && (
              <a
                href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#9CA3AF] hover:text-[#111827] transition-colors"
              >
                LinkedIn ↗
              </a>
            )}
          </div>
        </div>

        {/* Tagline / about */}
        {(tagline || headline || about) && (
          <p className="mt-10 text-xl text-[#6B7280] leading-relaxed max-w-2xl font-light">
            {about || tagline || headline}
          </p>
        )}
      </header>

      {/* Stats band */}
      {(stats ?? []).length > 0 && (
        <div data-section="stats" className="border-y border-[#F3F4F6]">
          <div className="max-w-5xl mx-auto px-8 py-8">
            <div className="flex flex-wrap gap-12">
              {(stats ?? []).map((stat, i) => (
                <div key={i}>
                  <div
                    className="font-black text-[#111827] leading-none"
                    style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[#9CA3AF] mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-8 py-16 space-y-20">

        {/* Experience */}
        {(experience ?? []).length > 0 && (
          <section data-section="experience">
            <h2 className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-10">Experience</h2>
            <div className="space-y-12">
              {(experience ?? []).map((exp, i) => (
                <div key={i} className="group">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-baseline mb-3">
                    <h3 className="text-2xl font-bold tracking-tight">{exp.company}</h3>
                    <span className="text-sm text-[#9CA3AF] font-mono shrink-0">{exp.period}</span>
                  </div>
                  <p className="text-sm text-[#6B7280] mb-4 tracking-wide uppercase">{exp.title ?? exp.role}</p>
                  <ul className="space-y-2.5">
                    {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                      <li key={j} className="text-[#374151] leading-relaxed flex gap-4 text-sm">
                        <span className="text-[#D1D5DB] shrink-0 mt-1">—</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  {i < (experience ?? []).length - 1 && (
                    <div className="h-px bg-[#F9FAFB] mt-12" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {(projects ?? []).length > 0 && (
          <section data-section="projects">
            <h2 className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-10">Selected Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(projects ?? []).map((proj, i) => (
                <div
                  key={i}
                  className="group border border-[#F3F4F6] rounded-2xl p-7 hover:border-[#E5E7EB] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold">{proj.title}</h3>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9CA3AF] hover:text-[#111827] text-sm transition-colors ml-2 shrink-0"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  <p className="text-[#6B7280] text-sm leading-relaxed mb-5">{proj.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(proj.tech ?? []).map((t, j) => (
                      <span
                        key={j}
                        className="px-2.5 py-1 text-xs text-[#6B7280] bg-[#F9FAFB] border border-[#F3F4F6] rounded-full"
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

        {/* Two-column: skills + education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {(skills ?? []).length > 0 && (
            <section data-section="skills">
              <h2 className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-8">Skills</h2>
              <div className="flex flex-wrap gap-2.5">
                {(skills ?? []).map((skill, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 text-sm text-[#374151] border border-[#E5E7EB] rounded-full hover:border-[#111827] hover:text-[#111827] transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(education ?? []).length > 0 && (
            <section data-section="education">
              <h2 className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-8">Education</h2>
              <div className="space-y-6">
                {(education ?? []).map((edu, i) => (
                  <div key={i}>
                    <p className="text-lg font-bold">{edu.institution ?? edu.school}</p>
                    <p className="text-[#6B7280] text-sm mt-1">{edu.degree}</p>
                    <p className="text-[#9CA3AF] text-sm mt-0.5">{edu.year ?? edu.period}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {showBadge && (
        <footer className="max-w-5xl mx-auto px-8 py-10 border-t border-[#F3F4F6]">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
            className="text-xs uppercase tracking-widest text-[#D1D5DB] hover:text-[#9CA3AF] transition-colors"
          >
            Built with ForgeFolio
          </a>
        </footer>
      )}
    </div>
  );
}
