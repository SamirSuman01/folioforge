import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function WarmEditorial({ data, showBadge = true }: Props) {
  const { name, role, tagline, stats, experience, education, skills } = data;

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#E7E5E4]">
      {/* Header with warm accent */}
      <header className="max-w-3xl mx-auto px-6 pt-20 pb-12">
        <div className="w-16 h-1 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] mb-8 rounded-full" />
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight font-serif">
          {name}
        </h1>
        <p className="text-[#F59E0B] text-lg mt-4 font-medium">{role}</p>
        {tagline && (
          <p className="text-[#A8A29E] mt-6 text-h3 leading-relaxed font-serif italic max-w-2xl">
            &ldquo;{tagline}&rdquo;
          </p>
        )}
      </header>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <section data-section="stats" className="max-w-3xl mx-auto px-6 pb-12">
          <div className="flex gap-8 flex-wrap">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-h1 font-bold text-[#F59E0B] font-mono">{stat.value}</span>
                <span className="text-small text-[#78716C] uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-white/5 mt-8" />
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section data-section="experience" className="max-w-3xl mx-auto px-6 pb-16">
          <h2 className="text-small uppercase tracking-[0.15em] text-[#78716C] mb-10 flex items-center gap-3">
            <span className="w-8 h-px bg-[#F59E0B]" />
            Experience
          </h2>
          <div className="space-y-12">
            {experience.map((exp, i) => (
              <div key={i} className="group">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-3">
                  <div>
                    <h3 className="text-h3 font-bold font-serif">{exp.company}</h3>
                    <p className="text-[#F59E0B] text-small mt-0.5">{exp.title}</p>
                  </div>
                  <span className="text-small text-[#78716C] font-mono mt-1 sm:mt-0">{exp.period}</span>
                </div>
                <ul className="space-y-3 ml-4">
                  {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                    <li key={j} className="text-[#A8A29E] text-small leading-relaxed flex gap-3">
                      <span className="text-[#F59E0B]/50 shrink-0 mt-1.5">•</span>
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
        <section data-section="education" className="max-w-3xl mx-auto px-6 pb-16">
          <h2 className="text-small uppercase tracking-[0.15em] text-[#78716C] mb-10 flex items-center gap-3">
            <span className="w-8 h-px bg-[#F59E0B]" />
            Education
          </h2>
          <div className="space-y-6">
            {education.map((edu, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold font-serif">{edu.institution}</h3>
                  <p className="text-[#A8A29E] text-small">{edu.degree}</p>
                </div>
                <span className="text-small text-[#78716C] font-mono mt-1 sm:mt-0">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section data-section="skills" className="max-w-3xl mx-auto px-6 pb-16">
          <h2 className="text-small uppercase tracking-[0.15em] text-[#78716C] mb-10 flex items-center gap-3">
            <span className="w-8 h-px bg-[#F59E0B]" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-small text-[#E7E5E4] border border-white/10 rounded-full bg-white/5 hover:border-[#F59E0B]/30 transition-colors"
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
            href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
            className="text-micro text-[#78716C] hover:text-[#A8A29E] transition-colors"
          >
            Built with ForgeFolio · Create your own portfolio →
          </a>
        </footer>
      )}
    </div>
  );
}
