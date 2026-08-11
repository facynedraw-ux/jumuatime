const SUPABASE_URL = 'https://qsvozaxqeamrdkmujoze.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdm96YXhxZWFtcmRrbXVqb3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzgyMDUsImV4cCI6MjA5NTcxNDIwNX0.3n6D7gfxb7qNi24brfxc59qwG-g4cT0s0kRq5fbSE-o';

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export async function onRequestGet({ request, env }) {
  const url  = new URL(request.url);
  const slug = url.searchParams.get('slug');

  // Pas de slug → sert le fichier statique normalement
  if (!slug) return env.ASSETS.fetch(request);

  // Récupère le produit depuis Supabase
  let product = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/resources?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=title,description,preview_url,price`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    product = Array.isArray(data) && data.length ? data[0] : null;
  } catch {}

  // Récupère le HTML statique
  const assetReq = new Request(new URL('/produit-physique.html', url.origin));
  const staticRes = await env.ASSETS.fetch(assetReq);

  // Produit introuvable → sert le HTML tel quel
  if (!product) return staticRes;

  let html = await staticRes.text();

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
    `<meta property="og:description" content="${esc(desc)}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    price ? `<meta property="product:price:amount" content="${price}">` : '',
    price ? `<meta property="product:price:currency" content="EUR">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    image ? `<meta name="twitter:image" content="${esc(image)}">` : '',
  ].filter(Boolean).join('\n  ');

  // Injecte dans le <head> avant </head>
  html = html.replace('</head>', `  ${ogBlock}\n</head>`);

  // Met aussi à jour le <title> et la meta description statiques
  // (visibles par les crawlers qui n'attendent pas le JS)
  html = html.replace(/<title[^>]*>.*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${esc(desc)}$2`
  );

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
