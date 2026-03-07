'use client';

import { useState } from 'react';
import Link from 'next/link';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import type { PortfolioData, Template } from '@/lib/types';
import { TEMPLATES } from '@/lib/types';

const PERSONAS: { label: string; data: PortfolioData }[] = [
  {
    label: 'Engineer',
    data: {
      name: 'Alex Chen',
      role: 'Senior Full-Stack Engineer',
      tagline: 'I turn ambitious product ideas into shipped software that scales — 8 years building for startups and Fortune 500s alike.',
      stats: [
        { label: 'Years of Experience', value: '8+' },
        { label: 'Products Shipped', value: '23' },
        { label: 'Users Impacted', value: '2.4M' },
      ],
      experience: [
        {
          company: 'Stripe', title: 'Senior Software Engineer', period: '2021 – Present',
          bullets: [
            'Architected a real-time fraud detection pipeline processing 12M transactions/day, reducing chargebacks by 34% ($18M annual savings)',
            'Led a cross-functional team of 6 to rebuild the merchant onboarding flow, cutting drop-off rate from 23% to 9%',
            'Designed and shipped Stripe Tax auto-calculation API used by 40K+ businesses across 30 countries',
          ],
        },
        {
          company: 'Figma', title: 'Software Engineer', period: '2019 – 2021',
          bullets: [
            'Built the real-time multiplayer cursor system handling 500K+ concurrent sessions with sub-50ms latency',
            'Optimized canvas rendering engine, improving frame rate by 40% on complex files with 10K+ layers',
            'Created the plugin API sandbox architecture that enabled 5,000+ community plugins',
          ],
        },
        {
          company: 'Shopify', title: 'Junior Developer', period: '2017 – 2019',
          bullets: [
            'Developed inventory sync system processing 2M SKU updates daily across 800K+ stores',
            'Reduced checkout page load time by 1.8s through lazy-loading and edge caching optimizations',
          ],
        },
      ],
      education: [{ institution: 'University of Waterloo', degree: 'B.S. Computer Science, Honours Co-op', year: '2017' }],
      skills: ['TypeScript', 'React', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'AWS', 'Kubernetes', 'GraphQL', 'System Design', 'Team Leadership'],
    },
  },
  {
    label: 'Designer',
    data: {
      name: 'Maya Rodriguez',
      role: 'Senior Product Designer',
      tagline: 'Designing interfaces that feel inevitable — 6 years crafting products used by millions across fintech, health, and e-commerce.',
      stats: [
        { label: 'Products Designed', value: '15+' },
        { label: 'Design Systems Built', value: '4' },
        { label: 'User Satisfaction', value: '94%' },
      ],
      experience: [
        {
          company: 'Square', title: 'Senior Product Designer', period: '2022 – Present',
          bullets: [
            'Redesigned the merchant dashboard serving 2M+ businesses, increasing daily active usage by 28%',
            'Built and maintained a design system with 200+ components used across 8 product teams',
            'Led user research program interviewing 120+ merchants, directly shaping 3 major product pivots',
          ],
        },
        {
          company: 'Headspace', title: 'Product Designer', period: '2020 – 2022',
          bullets: [
            'Designed the onboarding flow that increased 7-day retention from 34% to 52% for new users',
            'Created the sleep experience feature used by 800K+ users nightly, driving 15% subscription growth',
          ],
        },
      ],
      education: [{ institution: 'RISD', degree: 'BFA Graphic Design', year: '2018' }],
      skills: ['Figma', 'Prototyping', 'Design Systems', 'User Research', 'UI/UX', 'Motion Design', 'Accessibility', 'Typography'],
    },
  },
  {
    label: 'Marketer',
    data: {
      name: 'Jordan Park',
      role: 'Growth Marketing Lead',
      tagline: 'Turning ad spend into revenue machines — $8M in managed budget, 340% average ROAS across B2B SaaS.',
      stats: [
        { label: 'Revenue Driven', value: '$12M+' },
        { label: 'Campaigns Led', value: '80+' },
        { label: 'Avg. ROAS', value: '340%' },
      ],
      experience: [
        {
          company: 'HubSpot', title: 'Growth Marketing Lead', period: '2021 – Present',
          bullets: [
            'Managed $3.2M annual ad budget across Google, LinkedIn, and Meta, delivering 4.2x blended ROAS',
            'Built the ABM program targeting 500 enterprise accounts, generating $5.8M in pipeline within 6 months',
            'Launched the partner co-marketing program driving 2,400 qualified leads per quarter',
          ],
        },
        {
          company: 'Mailchimp', title: 'Marketing Manager', period: '2019 – 2021',
          bullets: [
            'Grew organic traffic by 180% through a content strategy targeting 50 high-intent keywords',
            'Designed the email nurture sequence achieving 42% open rate and 8.5% conversion to paid plans',
          ],
        },
      ],
      education: [{ institution: 'NYU Stern', degree: 'MBA, Marketing', year: '2019' }],
      skills: ['Google Ads', 'SEO/SEM', 'HubSpot', 'Analytics', 'ABM', 'Content Strategy', 'Email Marketing', 'A/B Testing'],
    },
  },
];

export default function DemoPortfolioPage() {
  const [template, setTemplate] = useState<Template>('split-editorial');
  const [personaIdx, setPersonaIdx] = useState(0);

  return (
    <div className="relative">
      {/* Control bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-white/[0.04] no-print">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-bone font-semibold text-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-accent" />
            FolioForge
          </Link>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {/* Persona */}
            <div className="flex items-center gap-1 bg-bg2 border border-white/[0.04] rounded-lg p-0.5">
              {PERSONAS.map((p, i) => (
                <button key={i} onClick={() => setPersonaIdx(i)}
                  className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-all ${
                    personaIdx === i ? 'bg-white/10 text-bone font-medium' : 'text-bone4 hover:text-bone3'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-white/[0.06] shrink-0" />

            {/* Template */}
            <div className="flex items-center gap-1 bg-bg2 border border-white/[0.04] rounded-lg p-0.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-all ${
                    template === t.id ? 'bg-accent text-bg font-semibold' : 'text-bone4 hover:text-bone3'
                  }`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <Link href="/?upload=true"
            className="shrink-0 px-4 py-1.5 bg-accent text-bg text-xs font-bold rounded-lg hover:bg-accent2 transition-colors">
            Build yours
          </Link>
        </div>
      </div>

      <div className="pt-[48px]">
        <TemplateRenderer template={template} data={PERSONAS[personaIdx].data} showBadge={true} />
      </div>
    </div>
  );
}
