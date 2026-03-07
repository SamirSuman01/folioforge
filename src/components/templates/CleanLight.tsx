import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function CleanLight({ data, showBadge = true }: Props) {
  const { name, role, tagline, stats, experience, education, skills } = data;

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {name}
        </h1>
        <div className="w-12 h-0.5 bg-[#1a1a2e] mx-auto mt-4 mb-4" />
        <p className="text-[#1a1a2e]/70 text-lg tracking-wide">{role}</p>
        {tagline && (
          <p className="text-[#1a1a2e]/50 italic font-serif mt-4 text-lg leading-relaxed max-w-lg mx-auto">
            &ldquo;{tagline}&rdquo;
          </p>
        )}
      </header>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <section data-section="stats" className="max-w-2xl mx-auto px-6 pb-12">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#1a1a2e]">
                  {stat.value}
                </div>
                <div className="text-xs text-[#1a1a2e]/40 mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-[#1a1a2e]/10 mt-8" />
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section data-section="experience" className="max-w-2xl mx-auto px-6 pb-12">
          <h2 className="text-sm uppercase tracking-[0.15em] text-[#1a1a2e]/40 mb-8 text-center">
            Experience
          </h2>
          <div className="space-y-8">
            {experience.map((exp, i) => (
              <div key={i} className="text-center">
                <h3 className="text-lg font-semibold">{exp.company}</h3>
                <p className="text-[#1a1a2e]/60 text-sm">
                  {exp.title} · {exp.period}
                </p>
                <ul className="mt-3 space-y-1.5 max-w-lg mx-auto">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-[#1a1a2e]/70 text-sm leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-[#1a1a2e]/10 mt-8" />
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section data-section="education" className="max-w-2xl mx-auto px-6 pb-12 text-center">
          <h2 className="text-sm uppercase tracking-[0.15em] text-[#1a1a2e]/40 mb-8">
            Education
          </h2>
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold">{edu.institution}</h3>
                <p className="text-[#1a1a2e]/60 text-sm">
                  {edu.degree} · {edu.year}
                </p>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-[#1a1a2e]/10 mt-8" />
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section data-section="skills" className="max-w-2xl mx-auto px-6 pb-16 text-center">
          <h2 className="text-sm uppercase tracking-[0.15em] text-[#1a1a2e]/40 mb-8">
            Skills
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-sm text-[#1a1a2e]/70 border border-[#1a1a2e]/10 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Badge */}
      {showBadge && (
        <footer className="text-center py-8 border-t border-[#1a1a2e]/5">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || ''}?ref=badge`}
            className="text-xs text-[#1a1a2e]/30 hover:text-[#1a1a2e]/50 transition-colors"
          >
            Built with FolioForge · Create your own portfolio →
          </a>
        </footer>
      )}
    </div>
  );
}
