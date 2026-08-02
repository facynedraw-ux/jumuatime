import Stripe from 'https://esm.sh/stripe@12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const stripeSecretKey = context.env.STRIPE_SECRET_KEY;
    const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;
    const gelatoApiKey = context.env.GELATO_API_KEY;

    if (!stripeSecretKey || !webhookSecret || !gelatoApiKey) {
      return jsonResponse({ error: 'Missing required Cloudflare env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET or GELATO_API_KEY' }, 500);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const signature = context.request.headers.get('stripe-signature');
    const rawBody = await context.request.text();

    if (!signature) {
      return jsonResponse({ error: 'Missing Stripe signature header' }, 400);
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type !== 'checkout.session.completed') {
      return jsonResponse({ received: true }, 200);
    }

    const session = event.data.object;
    const metadata = session.metadata || {};
    const type = metadata.type;
    const gelatoProductId = metadata.gelato_product_id || context.env.GELATO_PRODUCT_ID;

    if (type !== 'physique' || !gelatoProductId) {
      return jsonResponse({ received: true, skipped: 'No physical Gelato mapping' }, 200);
    }

    const shipping = session.shipping_details?.address || session.customer_details?.address || {};
    const customerName = session.customer_details?.name || 'Client Jumua Time';
    const customerEmail = session.customer_details?.email || '';

    const payload = {
      productId: gelatoProductId,
      quantity: 1,
      recipient: {
        name: customerName,
        email: customerEmail,
        address: {
          line1: shipping.line1 || '',
          line2: shipping.line2 || '',
          city: shipping.city || '',
          postalCode: shipping.postal_code || '',
          country: shipping.country || '',
          state: shipping.state || '',
        },
      },
      metadata: {
        source: 'jumuatime',
        stripe_session_id: session.id,
        produit_id: metadata.produit_id || '',
        variante_id: metadata.variante_id || '',
        personnalisation: metadata.personnalisation || '{}',
      },
    };

    const gelatoRes = await fetch('https://www.gelato.com/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gelatoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const gelatoData = await gelatoRes.json().catch(() => null);

    if (!gelatoRes.ok) {
      return jsonResponse({
        error: 'Gelato order creation failed',
        status: gelatoRes.status,
        detail: gelatoData,
      }, 502);
    }

    return jsonResponse({
      received: true,
      gelato: gelatoData,
      session_id: session.id,
    }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
