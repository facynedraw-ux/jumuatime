const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type':'application/json' } });
}

function emailAlphabet({ email }) {
  const downloadUrl = 'https://jumuatime.com/assets/gabarit_210x297_alphabet_arabe.pdf';

  const content = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A1208;">Votre affiche Alphabet Arabe est prête !</h1>
    <p style="margin:0 0 20px;color:#8B7A5A;font-size:14px;">Assalamu alaikum, merci pour votre intérêt. Voici votre affiche A4 illustrée de l'alphabet arabe, prête à imprimer.</p>

    <div style="padding:16px;background:#FAF6F0;border-radius:12px;border:1px solid #E2D4BC;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#8B7A5A;">Votre cadeau</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1A1208;">Affiche Alphabet Arabe — A4 PDF</p>
    </div>

    <div style="margin:20px 0;text-align:center;">
      <a href="${downloadUrl}"
         style="display:inline-block;background:#C49A5A;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
        Télécharger l'affiche →
      </a>
    </div>

    <p style="margin:20px 0 0;font-size:13px;color:#8B7A5A;">
      Des questions ? Écris-moi à <a href="mailto:contact@jumuatime.com" style="color:#5B9EAD;">contact@jumuatime.com</a>
    </p>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FAF6F0;font-family:Arial,sans-serif;color:#1A1208;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:white;border-radius:20px;overflow:hidden;border:1px solid #E2D4BC;">
  <tr><td style="background:#5B9EAD;padding:24px 32px;text-align:center;">
    <img src="https://jumuatime.com/Images/logo_version_white.png" alt="Jumua Time" width="160" style="height:auto;display:block;margin:0 auto;" />
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

    const { email } = await context.request.json();
    if (!email) return jsonResponse({ error: 'email requis' }, 400);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Jumua Time <contact@jumuatime.com>',
        to: [email],
        subject: '🎁 Votre affiche Alphabet Arabe — Jumua Time',
        html: emailAlphabet({ email }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return jsonResponse({ error: err }, 502);
    }

    // Notification à Facyne — context.waitUntil() pour ne pas être annulé
    context.waitUntil(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Jumua Time <contact@jumuatime.com>',
          to: ['facyne.draw@gmail.com'],
          subject: '📥 Nouveau téléchargement — Alphabet Arabe',
          html: `<p style="font-family:Arial,sans-serif;color:#1A1208;">Un nouveau visiteur a récupéré l'affiche Alphabet Arabe.</p><p style="color:#8B7A5A;">Email : <strong>${email}</strong></p>`,
        }),
      }).catch(() => {})
    );

    return jsonResponse({ sent: true });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
