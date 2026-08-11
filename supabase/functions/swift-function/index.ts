import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = 'Jumua Time <contact@jumuatime.com>';
const TILAWA_URL     = 'https://tilawatour.pages.dev/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendViaResend(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'type et data requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'tilawa_access' || type === 'tilawa_gift') {
      const { to_email, to } = data;
      const recipient = to_email || to;
      if (!recipient) throw new Error('Champ "to_email" manquant dans data');

      await sendViaResend(
        recipient,
        'Ton accès à Tilawa Tour',
        `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'DM Sans',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#FAF6F0;border-radius:16px;overflow:hidden;border:1px solid #E2D4BC;">

        <!-- Header -->
        <tr><td style="background:#FAF6F0;padding:28px 32px 20px;border-bottom:2px solid #00917c;text-align:center;">
          <img src="https://jumuatime.com/Images/logo_jumuatime.svg" alt="Jumua Time"
               style="height:36px;max-width:160px;display:block;margin:0 auto 12px;" onerror="this.style.display='none'">
          <p style="margin:0;color:#00917c;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;">Tilawa Tour</p>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:36px 32px 24px;">
          <p style="margin:0 0 16px;color:#1A1A1A;font-size:15px;line-height:1.7;">Salam alaikoum,</p>
          <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.8;">
            Cher voyageur ou voyageuse, voici ton lien pour accéder à l'application Tilawa Tour,
            notre application de lecture et de révision du Coran.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td style="border-radius:30px;background:#00917c;">
              <a href="https://tilawatour.pages.dev/"
                 style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">
                Accéder à Tilawa Tour →
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.8;">
            Un lien pour la télécharger sur ton téléphone va s'afficher au bout de quelques minutes
            d'utilisation pour plus de facilité, mais tu peux aussi la garder sur ordinateur et y accéder
            grâce à ce lien avec le même email que celui avec lequel tu te seras loggué·e la première fois.
          </p>

          <p style="margin:0 0 8px;color:#555;font-size:14px;line-height:1.8;">
            Cette application débute son aventure et il se peut que tu trouves des améliorations à suggérer,
            des bugs éventuels ou d'autres choses pertinentes à partager, je t'invite à les consigner
            dans la section avis en bas de cette page :
          </p>
          <p style="margin:0 0 28px;">
            <a href="https://jumuatime.com/tilawatour" style="color:#5B9EAD;font-size:14px;text-decoration:none;font-weight:600;">https://jumuatime.com/tilawatour</a>
          </p>

          <p style="margin:0 0 28px;color:#1A1A1A;font-size:15px;line-height:1.7;font-style:italic;border-left:3px solid #00917c;padding-left:16px;">
            Cheminez avec le Coran, mois après mois.
          </p>

          <p style="margin:0;color:#444;font-size:14px;line-height:1.7;">
            Fraternellement,<br>
            <strong style="color:#1A1A1A;">L'équipe Jumua Time</strong>
          </p>
        </td></tr>

        <!-- Note réponse -->
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #E2D4BC;">
          <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
            Si tu as la moindre question, n'hésite pas à nous écrire en réponse à cet email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#FAF6F0;padding:18px 32px;text-align:center;border-top:1px solid #E2D4BC;">
          <p style="margin:0;color:#aaa;font-size:11px;line-height:1.6;">
            Tu reçois cet email car tu t'es inscrit·e sur jumuatime.com.<br>
            Pour te désinscrire : <a href="mailto:contact@jumuatime.com" style="color:#5B9EAD;text-decoration:none;">contact@jumuatime.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
      );

      return new Response(JSON.stringify({ message: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'order_confirmation') {
      const { to, order_id, items, total } = data;
      if (!to) throw new Error('Champ "to" manquant dans data');

      const itemsHtml = (items || []).map((i: { title: string; price: string }) =>
        `<tr><td style="padding:8px 0;color:#1A1208;">${i.title}</td><td style="padding:8px 0;text-align:right;color:#C49A5A;font-weight:600;">${i.price}</td></tr>`
      ).join('');

      await sendViaResend(
        to,
        '✦ Votre commande Jumua Time est confirmée',
        `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FAF6F0;border-radius:16px;">
          <img src="https://jumuatime.com/Images/logo_jumuatime.svg" alt="Jumua Time" style="height:40px;margin-bottom:24px;">
          <h1 style="font-size:22px;color:#1A1208;margin:0 0 12px;">Commande confirmée ✦</h1>
          <p style="color:#5A4030;font-size:15px;line-height:1.7;margin:0 0 20px;">
            Merci pour votre commande ! Vous recevrez vos fichiers par email dès validation du paiement.
          </p>
          ${itemsHtml ? `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${itemsHtml}</table>` : ''}
          ${total ? `<p style="font-size:16px;font-weight:700;color:#1A1208;border-top:1px solid #E2D4BC;padding-top:12px;">Total : ${total}</p>` : ''}
          <a href="https://jumuatime.com/compte.html"
             style="display:inline-block;background:#5B9EAD;color:white;text-decoration:none;padding:12px 24px;border-radius:20px;font-weight:600;font-size:14px;margin-top:8px;">
            Voir mes achats →
          </a>
          <p style="color:#8B7A5A;font-size:13px;margin-top:24px;">
            Référence commande : ${order_id || '—'}
          </p>
        </div>
        `
      );

      return new Response(JSON.stringify({ message: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Type inconnu : ${type}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[send-email] erreur:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
