import type { PortfolioData } from '@/lib/types';

interface Props {
  data: PortfolioData;
  showBadge?: boolean;
}

export default function SplitEditorial({ data, showBadge = true }: Props) {
  const { name, role, tagline, stats, experience, education, skills } = data;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left column — identity */}
        <div className="lg:w-[40%] bg-[#1A1A2E] text-[#F0EDE6] lg:sticky lg:top-0 lg:h-screen p-8 lg:p-12 flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            {name}
          </h1>
          <p className="text-[#C77DFF] text-lg mt-3 font-mono tracking-wide">{role}</p>
          {tagline && (
            <p className="text-[#B8B3AA] italic font-serif mt-6 text-lg leading-relaxed border-l-2 border-[#C77DFF]/30 pl-4">
              &ldquo;{tagline}&rdquo;
            </p>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div data-section="stats" className="mt-8 grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-bold text-[#C77DFF] font-mono">{stat.value}</div>
                  <div className="text-micro text-[#8A857E] uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div data-section="skills" className="mt-8">
              <h3 className="text-micro uppercase tracking-[0.2em] text-[#8A857E] mb-3 font-mono">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-micro font-mono text-[#C77DFF] border border-[#C77DFF]/20 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — content */}
        <div className="lg:w-[60%] p-8 lg:p-12 lg:pl-16">
          {/* Experience */}
          {experience && experience.length > 0 && (
            <section data-section="experience" className="mb-12">
              <h2 className="text-micro uppercase tracking-[0.2em] text-[#8A857E] mb-8 font-mono">
                Experience
              </h2>
              <div className="space-y-10">
                {experience.map((exp, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-[#1A1A2E]/10">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#C77DFF]" />
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
                      <h3 className="text-lg font-bold text-[#1A1A2E]">{exp.company}</h3>
                      <span className="text-small text-[#8A857E] font-mono">{exp.period}</span>
                    </div>
                    <p className="text-[#C77DFF] text-small font-medium mb-3">{exp.title}</p>
                    <ul className="space-y-2">
                      {(exp.bullets ?? exp.highlights ?? []).map((bullet, j) => (
                        <li key={j} className="text-[#4A4A5A] text-small leading-relaxed">
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
            <section data-section="education" className="mb-12">
              <h2 className="text-micro uppercase tracking-[0.2em] text-[#8A857E] mb-8 font-mono">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, i) => (
                  <div key={i} className="pl-6 border-l-2 border-[#1A1A2E]/10">
                    <h3 className="text-lg font-bold text-[#1A1A2E]">{edu.institution}</h3>
                    <p className="text-[#4A4A5A] text-small">
                      {edu.degree} · {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Badge */}
          {showBadge && (
            <footer className="pt-8 border-t border-[#1A1A2E]/5">
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgefolio.com'}?ref=badge`}
                className="text-micro text-[#8A857E] hover:text-[#4A4A5A] transition-colors"
              >
                Built with ForgeFolio · Create your own portfolio →
              </a>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
