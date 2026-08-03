const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type':'application/json' } });
}

function emailExpedition({ name, produit, tracking, email }) {
  const trackingHtml = tracking
    ? `<div style="margin:20px 0;text-align:center;">
        <a href="https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(tracking)}"
           style="display:inline-block;background:#5B9EAD;color:white;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:700;font-size:14px;">
          Suivre ma commande →
        </a>
        <p style="margin:8px 0 0;font-size:12px;color:#8B7A5A;">Numéro : <span style="font-family:monospace;font-weight:700;">${tracking}</span></p>
       </div>`
    : `<p style="margin:16px 0;font-size:13px;color:#8B7A5A;">Le numéro de suivi sera disponible auprès du transporteur.</p>`;

  const content = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A1208;">C'est parti ! 🚚</h1>
    <p style="margin:0 0 20px;color:#8B7A5A;font-size:14px;">Assalamu alaikum ${name ? name.split(' ')[0] : ''}, ta commande vient d'être expédiée !</p>

    <div style="padding:16px;background:#FAF6F0;border-radius:12px;border:1px solid #E2D4BC;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#8B7A5A;">Produit expédié</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1A1208;">${produit || 'Ta commande'}</p>
    </div>

    ${trackingHtml}

    <p style="margin:20px 0 0;font-size:13px;color:#8B7A5A;">
      Des questions ? Écris-moi à <a href="mailto:contact@jumuatime.com" style="color:#5B9EAD;">contact@jumuatime.com</a>
    </p>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FAF6F0;font-family:Arial,sans-serif;color:#1A1208;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:white;border-radius:20px;overflow:hidden;border:1px solid #E2D4BC;">
  <tr><td style="background:#5B9EAD;padding:24px 32px;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:white;">🌙 Jumua Time</span>
  </td></tr>
  <tr><td style="padding:32px;">${content}</td></tr>
  <tr><td style="background:#FAF6F0;padding:20px 32px;text-align:center;border-top:1px solid #E2D4BC;">
    <p style="margin:0;font-size:12px;color:#8B7A5A;">Jumua Time · contact@jumuatime.com</p>
    <p style="margin:6px 0 0;font-size:11px;color:#C49A5A;">L'univers illustré pour la famille musulmane</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const resendApiKey = context.env.RESEND_API_KEY;
    if (!resendApiKey) return jsonResponse({ error: 'RESEND_API_KEY manquant' }, 500);

    const { email, name, produit, tracking } = await context.request.json();

    if (!email) return jsonResponse({ error: 'email requis' }, 400);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Jumua Time <contact@jumuatime.com>',
        to: [email],
        subject: '🚚 Ta commande Jumua Time est en route !',
        html: emailExpedition({ name, produit, tracking, email }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return jsonResponse({ error: err }, 502);
    }

    return jsonResponse({ sent: true });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
