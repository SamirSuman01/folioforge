import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { portfolioId, interval } = await request.json();

  if (!portfolioId) {
    return NextResponse.json({ error: 'Missing portfolioId' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  // Dynamic import so Stripe is only loaded when needed
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeKey, { apiVersion: '2026-02-25.clover' });

  const priceId = interval === 'yearly'
    ? process.env.STRIPE_YEARLY_PRICE_ID
    : process.env.STRIPE_MONTHLY_PRICE_ID;

  if (!priceId) {
    // Fallback: create an ad-hoc price
    const amount = interval === 'yearly' ? 7200 : 800; // $72/yr or $8/mo
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          recurring: { interval: interval === 'yearly' ? 'year' : 'month' },
          product_data: { name: 'FolioForge Pro' },
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        portfolioId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade?id=${portfolioId}`,
    });

    return NextResponse.json({ url: session.url });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId: user.id,
      portfolioId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade?id=${portfolioId}`,
  });

  return NextResponse.json({ url: session.url });
}
