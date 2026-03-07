import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import OwnerBar from '@/components/OwnerBar';
import type { Template, PortfolioData } from '@/lib/types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('portfolios')
    .select('data, slug')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!data) return { title: 'Portfolio Not Found' };

  const portfolioData = data.data as PortfolioData;
  return {
    title: `${portfolioData.name} — ${portfolioData.role} | Portfolio`,
    description: portfolioData.tagline,
    openGraph: {
      title: `${portfolioData.name} — ${portfolioData.role}`,
      description: portfolioData.tagline,
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/p/${data.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${portfolioData.name} — ${portfolioData.role}`,
      description: portfolioData.tagline,
    },
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const supabase = getSupabase();
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!portfolio) {
    notFound();
  }

  return (
    <>
      <TemplateRenderer
        template={portfolio.template as Template}
        data={portfolio.data as PortfolioData}
        showBadge={!portfolio.is_pro}
      />
      <AnalyticsTracker portfolioId={portfolio.id} />
      <OwnerBar
        portfolioId={portfolio.id}
        portfolioUserId={portfolio.user_id}
        slug={portfolio.slug}
        viewCount={portfolio.view_count || 0}
      />
    </>
  );
}
