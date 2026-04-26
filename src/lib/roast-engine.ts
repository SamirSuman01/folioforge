import type { PortfolioData } from './types';

export interface RoastResult {
  roasts: { line: string; tip: string }[];
  savageryLevel: 'mild' | 'medium' | 'brutal';
  overallRoast: string;
}

// Each roast function checks a specific weakness and returns a roast + real tip
type RoastCheck = (data: PortfolioData) => { line: string; tip: string } | null;

const checks: RoastCheck[] = [
  // No metrics in bullets
  (data) => {
    const bullets = data.experience.flatMap(e => e.bullets ?? e.highlights ?? []).filter(b => b && b.length > 0);
    const withMetrics = bullets.filter(b => /\d+[%$KMBx]|\$\d/i.test(b));
    if (bullets.length > 0 && withMetrics.length === 0) {
      return {
        line: `${bullets.length} bullets and not a single number. You "improved processes"? So does restarting my router.`,
        tip: 'Add metrics to every bullet: "Reduced load time by 40%" beats "Improved performance" every time.',
      };
    }
    if (bullets.length > 3 && withMetrics.length / bullets.length < 0.3) {
      return {
        line: `Only ${withMetrics.length} out of ${bullets.length} bullets have actual numbers. The rest read like a fortune cookie.`,
        tip: 'Quantify at least 60% of your bullets. Recruiters scan for numbers first.',
      };
    }
    return null;
  },

  // Generic tagline
  (data) => {
    const buzzwords = ['passionate', 'driven', 'innovative', 'dynamic', 'results-oriented', 'self-starter', 'team player', 'problem solver', 'detail-oriented', 'motivated'];
    const lower = data.tagline?.toLowerCase() || '';
    const found = buzzwords.filter(w => lower.includes(w));
    if (found.length >= 2) {
      return {
        line: `"${found.join(', ')}" — congrats, your tagline matches 4 million other LinkedIn profiles. You're basically a horoscope.`,
        tip: 'Replace buzzwords with specifics: "I build payment systems that process $2B annually" beats "passionate engineer" forever.',
      };
    }
    if (data.tagline && data.tagline.length < 30) {
      return {
        line: `Your tagline is ${data.tagline.length} characters. Tweets are longer. My grocery list is longer.`,
        tip: 'Aim for 50-150 characters. Lead with your biggest impact, not your job title.',
      };
    }
    return null;
  },

  // No stats
  (data) => {
    const realStats = (data.stats ?? []).filter(s => s.value && s.label);
    if (realStats.length === 0) {
      return {
        line: `Zero stats? You've been working for years and can't name ONE number? Even my Uber driver has a 4.9 rating.`,
        tip: 'Add 2-3 stats: years of experience, users impacted, projects shipped, revenue generated.',
      };
    }
    return null;
  },

  // Too many skills
  (data) => {
    if (data.skills.length > 15) {
      return {
        line: `${data.skills.length} skills listed. You're either a genius polymath or you added "Microsoft Word" to fill space. I know which one.`,
        tip: 'Keep 8-12 strongest skills. Quality > quantity. Remove anything you couldn\'t discuss in an interview.',
      };
    }
    return null;
  },

  // Too few skills
  (data) => {
    if (data.skills.length < 3 && data.skills.length > 0) {
      return {
        line: `${data.skills.length} skills? That's not a portfolio, that's a sticky note.`,
        tip: 'Add 5-8 core skills relevant to your field. Include both technical skills and tools.',
      };
    }
    if (data.skills.length === 0) {
      return {
        line: `No skills section at all. Bold strategy — let recruiters guess what you're good at.`,
        tip: 'Add your top 8 skills immediately. This is the most-scanned section after your name.',
      };
    }
    return null;
  },

  // Short experience bullets
  (data) => {
    const shortBullets = data.experience.flatMap(e => e.bullets ?? e.highlights ?? []).filter(b => b && b.length > 0 && b.length < 40);
    if (shortBullets.length >= 2) {
      return {
        line: `"${shortBullets[0].slice(0, 35)}..." — that's not a bullet point, that's a text message. To yourself. At 2am.`,
        tip: 'Each bullet should follow: Action verb + what you did + how + measurable result. Aim for 80-200 characters.',
      };
    }
    return null;
  },

  // Single bullet per experience
  (data) => {
    const singleBulletJobs = data.experience.filter(e => (e.bullets ?? e.highlights ?? []).filter(b => b.length > 0).length === 1);
    if (singleBulletJobs.length > 0) {
      const job = singleBulletJobs[0];
      return {
        line: `One bullet for ${job.company || 'a whole job'}? Either the role was "professional chair warmer" or you're hiding your best work.`,
        tip: `Add 2-3 more bullets for ${job.company || 'this role'}. Cover: biggest project, team impact, and a metric.`,
      };
    }
    return null;
  },

  // No education
  (data) => {
    if ((data.education ?? []).length === 0) {
      return {
        line: `No education listed. Either you're a self-taught genius or you're hoping nobody asks. Plot twist: they will.`,
        tip: 'Add at least one education entry. Bootcamps, certifications, and online courses count too.',
      };
    }
    return null;
  },

  // Missing period in experience
  (data) => {
    const noPeriod = data.experience.filter(e => !e.period || e.period.length < 4);
    if (noPeriod.length > 0) {
      return {
        line: `No dates on your experience? Are you a time traveler, or just hoping nobody calculates the gaps?`,
        tip: 'Add time periods (e.g., "2021 – Present"). It shows career progression and tenure.',
      };
    }
    return null;
  },

  // Passive voice bullets
  (data) => {
    const passiveStarts = ['was', 'were', 'been', 'being', 'responsible', 'worked', 'helped', 'assisted', 'participated', 'involved'];
    const bullets = data.experience.flatMap(e => e.bullets ?? e.highlights ?? []).filter(b => b && b.length > 0);
    const passiveBullets = bullets.filter(b => {
      const first = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      return passiveStarts.includes(first);
    });
    if (passiveBullets.length >= 2) {
      return {
        line: `"Responsible for..." "Helped with..." "Participated in..." — you sound like a bystander at your own career.`,
        tip: 'Replace passive voice: "Responsible for deployment" → "Deployed 12 microservices to production, reducing downtime by 40%"',
      };
    }
    return null;
  },

  // Duplicate skills
  (data) => {
    const lower = data.skills.map(s => s.toLowerCase().trim());
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const s of lower) {
      if (seen.has(s)) dupes.push(s);
      seen.add(s);
    }
    if (dupes.length > 0) {
      return {
        line: `You listed "${dupes[0]}" twice. Were you worried the recruiter might miss it the first time?`,
        tip: 'Remove duplicate skills. Use that space for a skill you actually want to highlight.',
      };
    }
    return null;
  },

  // Name is too generic or missing
  (data) => {
    if (!data.name || data.name.length < 2) {
      return {
        line: `No name? Bold choice. "Anonymous Career Person" doesn't exactly build trust.`,
        tip: 'Add your full name. It\'s literally the first thing recruiters look for.',
      };
    }
    return null;
  },
];

export function roastPortfolio(data: PortfolioData): RoastResult {
  const roasts: { line: string; tip: string }[] = [];

  for (const check of checks) {
    const result = check(data);
    if (result) roasts.push(result);
  }

  // Determine savagery based on number of issues found
  let savageryLevel: 'mild' | 'medium' | 'brutal';
  if (roasts.length <= 2) savageryLevel = 'mild';
  else if (roasts.length <= 4) savageryLevel = 'medium';
  else savageryLevel = 'brutal';

  // Overall summary roast
  let overallRoast: string;
  if (roasts.length === 0) {
    overallRoast = "Honestly? I tried to roast this and couldn't find anything. Your portfolio is actually solid. I hate you a little bit.";
  } else if (roasts.length <= 2) {
    overallRoast = `Not bad — only ${roasts.length} issue${roasts.length > 1 ? 's' : ''}. You're in the top 30% of portfolios I've seen. Fix these and you're golden.`;
  } else if (roasts.length <= 4) {
    overallRoast = `${roasts.length} issues found. Your portfolio is like a first draft that went straight to production. It works, but it hurts to look at.`;
  } else {
    overallRoast = `${roasts.length} issues. This portfolio is less "hire me" and more "send help." The good news? Every fix here will make a real difference.`;
  }

  return {
    roasts: roasts.slice(0, 6),
    savageryLevel,
    overallRoast,
  };
}
