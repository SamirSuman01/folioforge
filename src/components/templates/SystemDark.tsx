import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function SystemDark({ data, showBadge = true }: Props) {
  const { name, role, tagline, stats, experience, education, skills } = data;

  return (
    <div className="min-h-screen bg-[#07090F] text-[#F0EDE6]">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-20 pb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight font-display leading-tight">
          {name}
        </h1>
        <p className="text-[#4CC9FF] text-lg mt-3 tracking-wide font-mono">{role}</p>
        {tagline && (
          <p className="text-[#B8B3AA] italic font-serif mt-4 text-lg leading-relaxed">
            &ldquo;{tagline}&rdquo;
          </p>
        )}
      </header>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <section data-section="stats" className="max-w-3xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="text-center py-6 border border-white/5 rounded-lg bg-[#0D1120]"
              >
                <div className="text-3xl font-bold text-[#4CC9FF] font-mono">
                  {stat.value}
                </div>
                <div className="text-sm text-[#8A857E] mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section data-section="experience" className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#8A857E] mb-6 font-mono">
            Experience
          </h2>
          <div className="border-l border-white/10 pl-6 space-y-8">
            {experience.map((exp, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold text-bone">{exp.company}</h3>
                <p className="text-[#4CC9FF] text-sm font-mono">
                  {exp.title} · {exp.period}
                </p>
                <ul className="mt-3 space-y-2">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-[#B8B3AA] text-sm leading-relaxed flex gap-2">
                      <span className="text-[#4CC9FF] shrink-0">→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section data-section="education" className="max-w-3xl mx-auto px-6 pb-12">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#8A857E] mb-6 font-mono">
            Education
          </h2>
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold text-bone">{edu.institution}</h3>
                <p className="text-[#B8B3AA] text-sm">
                  {edu.degree} · {edu.year}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section data-section="skills" className="max-w-3xl mx-auto px-6 pb-16">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#8A857E] mb-6 font-mono">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-sm font-mono text-[#4CC9FF] border border-[#4CC9FF]/20 rounded bg-[#4CC9FF]/5"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Badge */}
      {showBadge && (
        <footer className="text-center py-8 border-t border-white/5">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || ''}?ref=badge`}
            className="text-xs text-[#5E5954] hover:text-[#8A857E] transition-colors"
          >
            Built with FolioForge · Create your own portfolio →
          </a>
        </footer>
      )}
    </div>
  );
}
