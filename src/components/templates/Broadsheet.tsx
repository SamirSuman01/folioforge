import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function Broadsheet({ data, showBadge = true }: Props) {
  const { name, role, tagline, stats, experience, education, skills } = data;

  return (
    <div className="min-h-screen bg-[#FDF6EC] text-[#2A2A2A]">
      {/* Newspaper header */}
      <header className="max-w-4xl mx-auto px-8 pt-12 pb-6 text-center border-b-4 border-double border-[#2A2A2A]">
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#8A857E] mb-2 font-mono">
          Professional Portfolio · {new Date().getFullYear()} Edition
        </div>
        <h1 className="text-5xl md:text-7xl font-black font-serif leading-none tracking-tight">
          {name}
        </h1>
        <div className="w-full h-px bg-[#2A2A2A]/20 my-4" />
        <p className="text-lg font-serif italic text-[#4A4A5A]">{role}</p>
        {tagline && (
          <p className="mt-3 text-[#6A6A7A] text-small max-w-lg mx-auto leading-relaxed">
            {tagline}
          </p>
        )}
      </header>

      {/* Stats bar */}
      {stats && stats.length > 0 && (
        <div data-section="stats" className="max-w-4xl mx-auto px-8 py-4 border-b border-[#2A2A2A]/10 flex flex-wrap justify-center gap-6 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-black font-serif">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A857E] mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left column — experience */}
          <div>
            {experience && experience.length > 0 && (
              <section data-section="experience">
                <h2 className="text-micro uppercase tracking-[0.3em] text-[#2A2A2A] font-bold border-b-2 border-[#2A2A2A] pb-1 mb-6">
                  Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp, i) => (
                    <article key={i}>
                      <h3 className="text-body font-bold font-serif">{exp.company}</h3>
                      <p className="text-micro text-[#6A6A7A] mb-2">
                        {exp.title} · {exp.period}
                      </p>
                      {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                        <p key={j} className="text-small text-[#4A4A5A] leading-relaxed mb-1 indent-4 first-letter:font-bold">
                          {bullet}
                        </p>
                      ))}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column — education + skills */}
          <div>
            {education && education.length > 0 && (
              <section data-section="education" className="mb-8">
                <h2 className="text-micro uppercase tracking-[0.3em] text-[#2A2A2A] font-bold border-b-2 border-[#2A2A2A] pb-1 mb-6">
                  Education
                </h2>
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <div key={i}>
                      <h3 className="text-body font-bold font-serif">{edu.institution}</h3>
                      <p className="text-small text-[#6A6A7A]">
                        {edu.degree} · {edu.year}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {skills && skills.length > 0 && (
              <section data-section="skills">
                <h2 className="text-micro uppercase tracking-[0.3em] text-[#2A2A2A] font-bold border-b-2 border-[#2A2A2A] pb-1 mb-6">
                  Competencies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-micro font-serif border border-[#2A2A2A]/20 bg-[#2A2A2A]/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Badge */}
      {showBadge && (
        <footer className="max-w-4xl mx-auto px-8 py-6 border-t border-[#2A2A2A]/10 text-center">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
            className="text-[10px] uppercase tracking-[0.3em] text-[#8A857E] hover:text-[#4A4A5A] transition-colors"
          >
            Built with ForgeFolio · Create your own portfolio →
          </a>
        </footer>
      )}
    </div>
  );
}
