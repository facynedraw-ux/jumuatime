const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function verifyStripeSignature(payload, signature, secret) {
  const parts = signature.split(',').map((item) => item.trim()).filter(Boolean);
  const timestampPart = parts.find((item) => item.startsWith('t='));
  const signatures = parts.filter((item) => item.startsWith('v1='));

  if (!timestampPart || signatures.length === 0) {
    throw new Error('Invalid Stripe signature header');
  }

  const timestamp = timestampPart.slice(2);
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload)));
  const digestHex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');

  for (const signaturePart of signatures) {
    const expectedSignature = signaturePart.slice(3);
    if (digestHex === expectedSignature) {
      return true;
    }
  }

  return false;
}

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

    const signature = context.request.headers.get('stripe-signature');
    const rawBody = await context.request.text();

    if (!signature) {
      return jsonResponse({ error: 'Missing Stripe signature header' }, 400);
    }

    const isValidSignature = await verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!isValidSignature) {
      return jsonResponse({ error: 'Invalid Stripe signature' }, 400);
    }

    const event = JSON.parse(rawBody);

    if (event.type !== 'checkout.session.completed') {
      return jsonResponse({ received: true }, 200);
    }

    const session  = event.data.object;
    const metadata = session.metadata || {};
    const type     = metadata.type;

    const shipping      = session.shipping_details?.address || session.customer_details?.address || {};
    const customerName  = session.customer_details?.name || 'Client Jumua Time';
    const customerEmail = session.customer_details?.email || '';

    // ── CAS PANIER (physique + numérique) ──
    if (type === 'panier') {
      let items = [];
      try { items = JSON.parse(metadata.items || '[]'); } catch {}

      const gelatoItems = items.filter(i => i.g);                    // g = gelato_product_id
      const manualItems = items.filter(i => i.tp === 'physique' && !i.g); // tp = type_produit

      const results = [];
      for (const item of gelatoItems) {
        const gelatoPayload = {
          productId: item.g,
          quantity:  item.q || 1,
          recipient: {
            name: customerName,
            email: customerEmail,
            address: {
              line1:      shipping.line1 || '',
              line2:      shipping.line2 || '',
              city:       shipping.city || '',
              postalCode: shipping.postal_code || '',
              country:    shipping.country || '',
              state:      shipping.state || '',
            },
          },
          metadata: {
            source:            'jumuatime',
            stripe_session_id: session.id,
            produit_id:        item.i || '',
            variante_id:       item.v || '',
          },
        };

        const gelatoRes  = await fetch('https://www.gelato.com/api/orders', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${gelatoApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(gelatoPayload),
        });
        const gelatoData = await gelatoRes.json().catch(() => null);
        results.push({ produit: item.t || item.i, ok: gelatoRes.ok, data: gelatoData });
      }

      return jsonResponse({
        received:      true,
        gelato_orders: results,
        manual_items:  manualItems.length, // traitement manuel par Facyne
        session_id:    session.id,
      }, 200);
    }

    // ── CAS PHYSIQUE simple (rétrocompat) ──
    const gelatoProductId = metadata.gelato_product_id || context.env.GELATO_PRODUCT_ID;

    if (type !== 'physique' || !gelatoProductId) {
      return jsonResponse({ received: true, skipped: 'No physical Gelato mapping' }, 200);
    }

    const payload = {
      productId: gelatoProductId,
      quantity:  1,
      recipient: {
        name: customerName,
        email: customerEmail,
        address: {
          line1:      shipping.line1 || '',
          line2:      shipping.line2 || '',
          city:       shipping.city || '',
          postalCode: shipping.postal_code || '',
          country:    shipping.country || '',
          state:      shipping.state || '',
        },
      },
      metadata: {
        source:            'jumuatime',
        stripe_session_id: session.id,
        produit_id:        metadata.produit_id || '',
        variante_id:       metadata.variante_id || '',
        personnalisation:  metadata.personnalisation || '{}',
      },
    };

    const gelatoRes = await fetch('https://www.gelato.com/api/orders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${gelatoApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const gelatoData = await gelatoRes.json().catch(() => null);

    if (!gelatoRes.ok) {
      return jsonResponse({ error: 'Gelato order creation failed', status: gelatoRes.status, detail: gelatoData }, 502);
    }

    return jsonResponse({ received: true, gelato: gelatoData, session_id: session.id }, 200);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
