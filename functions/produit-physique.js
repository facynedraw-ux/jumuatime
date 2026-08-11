const SUPABASE_URL = 'https://qsvozaxqeamrdkmujoze.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdm96YXhxZWFtcmRrbXVqb3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzgyMDUsImV4cCI6MjA5NTcxNDIwNX0.3n6D7gfxb7qNi24brfxc59qwG-g4cT0s0kRq5fbSE-o';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export async function onRequestGet({ request, env }) {
  const url  = new URL(request.url);
  const slug = url.searchParams.get('slug');

  // Pas de slug → fichier statique tel quel
  if (!slug) return env.ASSETS.fetch(request);

  // Récupère le produit depuis Supabase
  let product = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/resources?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=title,description,preview_url,price`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (res.ok) {
      const data = await res.json();
      product = Array.isArray(data) && data.length ? data[0] : null;
    }
  } catch {}

  // Récupère le HTML statique — toujours via la requête originale pour éviter les redirects
  let staticRes;
  try {
    // On passe la requête originale mais en retirant le query string pour cibler le fichier HTML
    staticRes = await env.ASSETS.fetch(new Request(`${url.origin}/produit-physique.html`));
    if (!staticRes.ok) staticRes = await env.ASSETS.fetch(request);
  } catch {
    return env.ASSETS.fetch(request);
  }

  // Produit introuvable → HTML statique intact (le JS client prendra le relais)
  if (!product) return staticRes;

  let html;
  try {
    html = await staticRes.text();
  } catch {
    return env.ASSETS.fetch(request);
  }

  const pageUrl = `https://jumuatime.com/produit-physique.html?slug=${encodeURIComponent(slug)}`;
  const title   = `${product.title} — Jumua Time`;
  const desc    = (product.description || `${product.title} — Créations illustrées Jumua Time`).slice(0, 200);
  const image   = product.preview_url || '';
  const price   = product.price ? Number(product.price).toFixed(2) : null;

  const ogBlock = [
    `<link rel="canonical" href="${esc(pageUrl)}">`,
    `<meta property="og:url" content="${esc(pageUrl)}">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:site_name" content="Jumua Time">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc.replace(/\n/g, ' '))}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    price ? `<meta property="product:price:amount" content="${price}">` : '',
    price ? `<meta property="product:price:currency" content="EUR">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc.replace(/\n/g, ' '))}">`,
    image ? `<meta name="twitter:image" content="${esc(image)}">` : '',
  ].filter(Boolean).join('\n');

  // Injection uniquement dans </head> — pas de remplacement regex sur le body ou le titre
  const injected = html.includes('</head>')
    ? html.replace('</head>', `${ogBlock}\n</head>`)
    : html;

  return new Response(injected, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      // Pas de s-maxage : on laisse Cloudflare CDN ne pas mettre en cache côté edge
      'Cache-Control': 'no-store',
    },
  });
}
