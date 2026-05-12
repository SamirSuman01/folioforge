import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function Broadsheet({ data, showBadge = true }: Props) {
  const {
    name, role, tagline, headline, about,
    stats, experience, education, skills, projects, contact,
  } = data;

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#1C1A17] antialiased" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>

      {/* Masthead */}
      <header className="max-w-5xl mx-auto px-8 pt-14 pb-8">

        {/* Top rule with date/edition */}
        <div className="flex items-center justify-between border-t-4 border-b border-[#1C1A17] pt-3 pb-2 mb-6">
          <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: 'monospace' }}>
            Professional Portfolio
          </span>
          <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: 'monospace' }}>
            {role}
          </span>
          <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: 'monospace' }}>
            {new Date().getFullYear()} Edition
          </span>
        </div>

        {/* Massive headline name */}
        <div className="text-center py-6 border-b border-[#1C1A17]">
          <h1
            className="font-black leading-none tracking-tight text-[#1C1A17]"
            style={{ fontSize: 'clamp(56px, 12vw, 140px)', letterSpacing: '-0.02em' }}
          >
            {name}
          </h1>

          {/* Red rule */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-0.5 w-16 bg-[#DC2626]" />
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-sm italic text-[#6B6560] hover:text-[#DC2626] transition-colors"
              >
                {contact.email}
              </a>
            )}
            {contact?.github && (
              <span className="text-[#6B6560] text-sm">·</span>
            )}
            {contact?.github && (
              <a
                href={contact.github.startsWith('http') ? contact.github : `https://github.com/${contact.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm italic text-[#6B6560] hover:text-[#DC2626] transition-colors"
              >
                {contact.github.replace('https://github.com/', '')}
              </a>
            )}
            <div className="h-0.5 w-16 bg-[#DC2626]" />
          </div>

          {(tagline || headline) && (
            <p className="mt-4 text-lg italic text-[#6B6560] max-w-xl mx-auto leading-relaxed">
              &ldquo;{tagline || headline}&rdquo;
            </p>
          )}
        </div>
      </header>

      {/* Stats ticker */}
      {(stats ?? []).length > 0 && (
        <div data-section="stats" className="bg-[#1C1A17] text-[#FDFAF5]">
          <div className="max-w-5xl mx-auto px-8 py-4 flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {(stats ?? []).map((stat, i) => (
              <div key={i} className="flex items-baseline gap-2 text-center">
                <span
                  className="font-black leading-none"
                  style={{ fontSize: '32px', fontFamily: 'Georgia, serif' }}
                >
                  {stat.value}
                </span>
                <span className="text-xs uppercase tracking-widest text-[#9CA3AF]" style={{ fontFamily: 'monospace' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About lede */}
      {(about || tagline) && (
        <div className="max-w-5xl mx-auto px-8 py-8 border-b border-[#E5DDD0]">
          <p className="text-xl leading-relaxed text-[#3C3830] max-w-3xl" style={{ fontFamily: 'Georgia, serif' }}>
            {about}
          </p>
        </div>
      )}

      {/* Body — newspaper columns */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12 lg:divide-x lg:divide-[#E5DDD0]">

          {/* Column 1: experience */}
          <div className="space-y-8">
            {(experience ?? []).length > 0 && (
              <section data-section="experience">
                <div className="border-b-2 border-[#1C1A17] pb-1 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                    Career History
                  </h2>
                </div>
                <div className="space-y-8">
                  {(experience ?? []).map((exp, i) => (
                    <article key={i} className={i < (experience ?? []).length - 1 ? 'pb-8 border-b border-[#E5DDD0]' : ''}>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                        <h3 className="text-xl font-black">{exp.company}</h3>
                        <span className="text-xs text-[#9C8B78] shrink-0" style={{ fontFamily: 'monospace' }}>
                          {exp.period}
                        </span>
                      </div>
                      <p className="text-sm italic text-[#DC2626] mb-3">{exp.title ?? exp.role}</p>
                      <div className="space-y-2">
                        {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                          <p key={j} className="text-[#3C3830] text-sm leading-relaxed">
                            {j === 0 && (
                              <span className="font-bold">{bullet.charAt(0)}</span>
                            )}
                            {j === 0 ? bullet.slice(1) : bullet}
                          </p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Projects below experience */}
            {(projects ?? []).length > 0 && (
              <section data-section="projects">
                <div className="border-b-2 border-[#1C1A17] pb-1 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                    Notable Projects
                  </h2>
                </div>
                <div className="space-y-6">
                  {(projects ?? []).map((proj, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-1 shrink-0 bg-[#DC2626] rounded-full" />
                      <div>
                        <div className="flex items-start gap-2">
                          <h3 className="font-bold">{proj.title}</h3>
                          {proj.link && (
                            <a
                              href={proj.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#DC2626] text-xs mt-0.5 hover:underline shrink-0"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-[#6B6560] leading-relaxed mt-1">{proj.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(proj.tech ?? []).map((t, j) => (
                            <span
                              key={j}
                              className="text-xs text-[#9C8B78] italic"
                            >
                              {j > 0 ? '· ' : ''}{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Column 2: skills + education */}
          <div className="lg:pl-8 space-y-8">
            {(skills ?? []).length > 0 && (
              <section data-section="skills">
                <div className="border-b-2 border-[#1C1A17] pb-1 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                    Competencies
                  </h2>
                </div>
                <div className="space-y-2">
                  {(skills ?? []).map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#E5DDD0] last:border-0">
                      <span className="text-[#DC2626] text-xs">◆</span>
                      <span className="text-sm">{skill}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(education ?? []).length > 0 && (
              <section data-section="education">
                <div className="border-b-2 border-[#1C1A17] pb-1 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                    Education
                  </h2>
                </div>
                <div className="space-y-5">
                  {(education ?? []).map((edu, i) => (
                    <div key={i}>
                      <h3 className="font-bold">{edu.institution ?? edu.school}</h3>
                      <p className="text-sm italic text-[#6B6560] mt-0.5">{edu.degree}</p>
                      <p className="text-xs text-[#9C8B78] mt-0.5" style={{ fontFamily: 'monospace' }}>
                        {edu.year ?? edu.period}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {contact && (
              <section>
                <div className="border-b-2 border-[#1C1A17] pb-1 mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                    Contact
                  </h2>
                </div>
                <div className="space-y-2">
                  {contact.linkedin && (
                    <a
                      href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-[#6B6560] hover:text-[#DC2626] transition-colors"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-[#6B6560] hover:text-[#DC2626] transition-colors"
                    >
                      {contact.website.replace(/^https?:\/\//, '')} ↗
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {showBadge && (
        <footer className="border-t-4 border-double border-[#1C1A17] mt-8">
          <div className="max-w-5xl mx-auto px-8 py-5 text-center">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
              className="text-[10px] uppercase tracking-widest text-[#9C8B78] hover:text-[#6B6560] transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              Crafted with ForgeFolio
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
