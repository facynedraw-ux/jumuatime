const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ── HMAC verification ──
function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

async function verifyStripeSignature(payload, signature, secret) {
  const parts      = signature.split(',').map(s => s.trim()).filter(Boolean);
  const tPart      = parts.find(s => s.startsWith('t='));
  const signatures = parts.filter(s => s.startsWith('v1='));
  if (!tPart || !signatures.length) throw new Error('Invalid Stripe signature header');
  const signedPayload = `${tPart.slice(2)}.${payload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload)));
  const hex = Array.from(digest, b => b.toString(16).padStart(2,'0')).join('');
  return signatures.some(s => s.slice(3) === hex);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type':'application/json' } });
}

// ── Email via Resend ──
async function sendEmail(resendKey, { to, subject, html }) {
  if (!resendKey) return { skipped: 'no RESEND_API_KEY' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Jumua Time <contact@jumuatime.com>', to: Array.isArray(to) ? to : [to], subject, html }),
  });
  return res.ok ? { ok: true } : { error: await res.text() };
}

// ── Email templates ──
function emailBase(content) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jumua Time</title></head>
<body style="margin:0;padding:0;background:#FAF6F0;font-family:'DM Sans',Arial,sans-serif;color:#1A1208;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:white;border-radius:20px;overflow:hidden;border:1px solid #E2D4BC;">
  <!-- Header -->
  <tr><td style="background:#5B9EAD;padding:24px 32px;text-align:center;">
    <img src="https://jumuatime.com/Images/logo_version_white.png" alt="Jumua Time" style="height:48px;width:auto;display:inline-block;">
  </td></tr>
  <!-- Content -->
  <tr><td style="padding:32px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#FAF6F0;padding:20px 32px;text-align:center;border-top:1px solid #E2D4BC;">
    <p style="margin:0;font-size:12px;color:#8B7A5A;">Jumua Time · contact@jumuatime.com</p>
    <p style="margin:6px 0 0;font-size:11px;color:#C49A5A;">L'univers illustré pour la famille musulmane</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function emailConfirmationClient({ name, items, address, total, shipping }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F5EDE0;">
        <span style="font-weight:600;">${item.t || 'Produit'}</span>
        ${item.q > 1 ? `<span style="color:#8B7A5A;"> × ${item.q}</span>` : ''}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #F5EDE0;text-align:right;font-weight:600;color:#5B9EAD;">
        ${item.p ? ((item.p * (item.q||1)) / 100).toFixed(2) + ' €' : '—'}
      </td>
    </tr>`).join('');

  const adrHtml = address
    ? `<p style="margin:12px 0 0;font-size:13px;color:#8B7A5A;line-height:1.6;">
        Livraison prévue à :<br>
        <strong style="color:#1A1208;">${address}</strong>
       </p>`
    : '';

  const content = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A1208;">Commande confirmée ✓</h1>
    <p style="margin:0 0 20px;color:#8B7A5A;font-size:14px;">Assalamu alaikum ${name ? name.split(' ')[0] : ''}, merci pour ta commande !</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemsHtml}
      ${shipping ? `<tr><td style="padding:8px 0;color:#8B7A5A;font-size:13px;">Livraison</td><td style="padding:8px 0;text-align:right;color:#8B7A5A;font-size:13px;">${(shipping/100).toFixed(2)} €</td></tr>` : ''}
      <tr>
        <td style="padding:12px 0 0;font-weight:700;font-size:16px;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px;color:#5B9EAD;">${total ? (total/100).toFixed(2)+' €' : '—'}</td>
      </tr>
    </table>

    ${adrHtml}

    <div style="margin-top:24px;padding:16px;background:#FAF6F0;border-radius:12px;border:1px solid #E2D4BC;">
      <p style="margin:0;font-size:13px;color:#5B9EAD;font-weight:600;">📦 Et maintenant ?</p>
      <p style="margin:6px 0 0;font-size:13px;color:#8B7A5A;line-height:1.5;">
        Ta commande est bien enregistrée et sera traitée rapidement.<br>
        Tu recevras un email dès qu'elle est expédiée.
      </p>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#8B7A5A;">
      Une question ? Écris-moi à <a href="mailto:contact@jumuatime.com" style="color:#5B9EAD;">contact@jumuatime.com</a>
    </p>`;

  return emailBase(content);
}

function emailNotifAdmin({ customerName, customerEmail, items, address, total, sessionId }) {
  const itemsHtml = items.map(i => `<li style="margin:4px 0;">${i.t || i.i} × ${i.q||1}${i.tp==='physique'?(i.g?' (Gelato)':' (manuel)'):'(numérique)'}</li>`).join('');

  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#C96B8A;">🛒 Nouvelle commande !</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:16px;">
      <tr><td style="color:#8B7A5A;padding:4px 0;width:110px;">Client</td><td style="font-weight:600;">${customerName || '—'}</td></tr>
      <tr><td style="color:#8B7A5A;padding:4px 0;">Email</td><td>${customerEmail || '—'}</td></tr>
      <tr><td style="color:#8B7A5A;padding:4px 0;">Total</td><td style="font-weight:700;color:#5B9EAD;">${total ? (total/100).toFixed(2)+' €' : '—'}</td></tr>
      <tr><td style="color:#8B7A5A;padding:4px 0;">Adresse</td><td>${address || '—'}</td></tr>
    </table>

    <p style="margin:0 0 6px;font-size:13px;font-weight:700;">Articles :</p>
    <ul style="margin:0 0 20px;padding-left:18px;font-size:13px;color:#1A1208;">${itemsHtml}</ul>

    <a href="https://jumuatime.com/admin-commandes.html" style="display:inline-block;background:#C96B8A;color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px;">Voir les commandes →</a>

    <p style="margin:16px 0 0;font-size:11px;color:#C49A5A;font-family:monospace;">Ref: ${sessionId || '—'}</p>`;

  return emailBase(content);
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const stripeSecretKey = context.env.STRIPE_SECRET_KEY;
    const webhookSecret   = context.env.STRIPE_WEBHOOK_SECRET;
    const gelatoApiKey    = context.env.GELATO_API_KEY;
    const resendApiKey    = context.env.RESEND_API_KEY;

    const signature = context.request.headers.get('stripe-signature');
    const testToken = context.request.headers.get('x-test-token');
    const rawBody   = await context.request.text();

    let event;
    if (testToken) {
      // Mode test : bypass signature, seul GELATO_API_KEY requis
      if (testToken !== context.env.TEST_SECRET) return jsonResponse({ error: 'Invalid test token' }, 403);
      if (!gelatoApiKey) return jsonResponse({ error: 'Missing GELATO_API_KEY' }, 500);
      event = JSON.parse(rawBody);
    } else {
      if (!stripeSecretKey || !webhookSecret || !gelatoApiKey) {
        return jsonResponse({ error: 'Missing env vars' }, 500);
      }
      if (!signature) return jsonResponse({ error: 'Missing Stripe signature' }, 400);
      const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
      if (!isValid) return jsonResponse({ error: 'Invalid Stripe signature' }, 400);
      event = JSON.parse(rawBody);
    }
    if (event.type !== 'checkout.session.completed') return jsonResponse({ received: true }, 200);

    const session       = event.data.object;
    const metadata      = session.metadata || {};
    const type          = metadata.type;

    // ── IDEMPOTENCY : éviter de rejouer une commande déjà traitée ──
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && supabaseKey && (type === 'panier' || type === 'physique')) {
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/commandes_physiques?stripe_session_id=eq.${encodeURIComponent(session.id)}&select=id&limit=1`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          return jsonResponse({ received: true, skipped: 'already_processed', session_id: session.id }, 200);
        }
      }
    }
    const shipping      = session.shipping_details?.address || session.customer_details?.address || {};
    const customerName  = session.customer_details?.name || '';
    const customerEmail = session.customer_details?.email || '';
    const amountTotal   = session.amount_total;
    const amountShipping = session.total_details?.amount_shipping || 0;

    // Format address string
    const addressStr = [shipping.line1, shipping.line2, [shipping.postal_code, shipping.city].filter(Boolean).join(' '), shipping.country]
      .filter(Boolean).join(', ');

    // ── CAS PANIER ──
    if (type === 'panier') {
      let items = [];
      try { items = JSON.parse(metadata.items || '[]'); } catch {}

      const gelatoItems = items.filter(i => i.g);
      const manualItems = items.filter(i => i.tp === 'physique' && !i.g);
      const results = [];

      // Gelato orders
      for (const item of gelatoItems) {
        const nameParts  = (customerName || '').trim().split(/\s+/);
        const firstName  = nameParts[0] || 'Client';
        const lastName   = nameParts.slice(1).join(' ') || '-';
        const gelatoBody = {
          orderType:           'order',
          orderReferenceId:    `jt-${session.id.slice(-8)}-${(item.i||'').slice(-4)}`,
          customerReferenceId: customerEmail || session.id,
          currency:            'EUR',
          items: [{
            itemReferenceId: `jt-${(item.i||'').slice(-6)}-${(item.v||'0').slice(-4)}`,
            productUid:      item.g,
            quantity:        item.q || 1,
          }],
          shipmentMethodUid: 'standard',
          shippingAddress: {
            firstName,
            lastName,
            addressLine1: shipping.line1 || '',
            ...(shipping.line2 ? { addressLine2: shipping.line2 } : {}),
            city:         shipping.city || '',
            postCode:     shipping.postal_code || '',
            country:      shipping.country || '',
            email:        customerEmail,
          },
        };
        const gelatoRes = await fetch('https://order.gelatoapis.com/v4/orders', {
          method:  'POST',
          headers: { 'X-API-KEY': gelatoApiKey, 'Content-Type': 'application/json' },
          body:    JSON.stringify(gelatoBody),
        });
        const data = await gelatoRes.json().catch(() => null);
        results.push({ produit: item.t || item.i, ok: gelatoRes.ok, status: gelatoRes.status, data });
      }

      // Emails — envoi en parallèle, non bloquant
      const physiques = items.filter(i => i.tp === 'physique');
      if (physiques.length && customerEmail) {
        await Promise.allSettled([
          // Email client
          sendEmail(resendApiKey, {
            to: customerEmail,
            subject: 'Jumua Time — Commande confirmée ✓',
            html: emailConfirmationClient({ name: customerName, items: physiques, address: addressStr, total: amountTotal, shipping: amountShipping }),
          }),
          // Email admin (Facyne)
          sendEmail(resendApiKey, {
            to: 'facyne.draw@gmail.com',
            subject: `🛒 Nouvelle commande — ${customerName || customerEmail}`,
            html: emailNotifAdmin({ customerName, customerEmail, items, address: addressStr, total: amountTotal, sessionId: session.id }),
          }),
        ]);
      }

      return jsonResponse({ received:true, gelato_orders:results, manual_items:manualItems.length, session_id:session.id }, 200);
    }

    // ── CAS PHYSIQUE simple (rétrocompat) ──
    const gelatoProductId = metadata.gelato_product_id || context.env.GELATO_PRODUCT_ID;

    if (type !== 'physique' || !gelatoProductId) {
      return jsonResponse({ received:true, skipped:'No physical Gelato mapping' }, 200);
    }

    const nameParts2 = (customerName || '').trim().split(/\s+/);
    const gelatoRes  = await fetch('https://order.gelatoapis.com/v4/orders', {
      method:  'POST',
      headers: { 'X-API-KEY': gelatoApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderType:           'order',
        orderReferenceId:    `jt-${session.id.slice(-8)}`,
        customerReferenceId: customerEmail || session.id,
        currency:            'EUR',
        items: [{
          itemReferenceId: `jt-${session.id.slice(-8)}-0`,
          productUid:      gelatoProductId,
          quantity:        1,
        }],
        shipmentMethodUid: 'normal',
        shippingAddress: {
          firstName:    nameParts2[0] || 'Client',
          lastName:     nameParts2.slice(1).join(' ') || '-',
          addressLine1: shipping.line1 || '',
          ...(shipping.line2 ? { addressLine2: shipping.line2 } : {}),
          city:         shipping.city || '',
          postCode:     shipping.postal_code || '',
          country:      shipping.country || '',
          email:        customerEmail,
        },
      }),
    });

    const gelatoData = await gelatoRes.json().catch(() => null);
    if (!gelatoRes.ok) return jsonResponse({ error:'Gelato order creation failed', status:gelatoRes.status, detail:gelatoData }, 502);

    // Emails
    const singleItem = [{ t: metadata.product_title || 'Produit', p: amountTotal - amountShipping, q: 1, tp: 'physique' }];
    if (customerEmail) {
      await Promise.allSettled([
        sendEmail(resendApiKey, {
          to: customerEmail,
          subject: 'Jumua Time — Commande confirmée ✓',
          html: emailConfirmationClient({ name: customerName, items: singleItem, address: addressStr, total: amountTotal, shipping: amountShipping }),
        }),
        sendEmail(resendApiKey, {
          to: 'facyne.draw@gmail.com',
          subject: `🛒 Nouvelle commande — ${customerName || customerEmail}`,
          html: emailNotifAdmin({ customerName, customerEmail, items: singleItem, address: addressStr, total: amountTotal, sessionId: session.id }),
        }),
      ]);
    }

    return jsonResponse({ received:true, gelato:gelatoData, session_id:session.id }, 200);

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
