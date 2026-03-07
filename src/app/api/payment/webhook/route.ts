import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event;
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 400 });
  }

  const supabase = getSupabase();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { userId?: string; portfolioId?: string } };
    const userId = session.metadata?.userId;
    const portfolioId = session.metadata?.portfolioId;

    if (userId && portfolioId) {
      await supabase
        .from('portfolios')
        .update({ is_pro: true })
        .eq('id', portfolioId)
        .eq('user_id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as { metadata?: { userId?: string; portfolioId?: string } };
    const userId = subscription.metadata?.userId;
    const portfolioId = subscription.metadata?.portfolioId;

    if (userId && portfolioId) {
      await supabase
        .from('portfolios')
        .update({ is_pro: false })
        .eq('id', portfolioId)
        .eq('user_id', userId);
    }
  }

  return new Response('ok', { status: 200 });
}
