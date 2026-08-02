const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function stripeRequest(path, secret, body = null, method = 'POST') {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe request failed: ${response.status}`);
  }

  return data;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  try {
    const { produit_id, variante_id, personnalisation } = await context.request.json();

    const SUPABASE_URL     = context.env.SUPABASE_URL;
    const SUPABASE_SERVICE = context.env.SUPABASE_SERVICE_KEY;
    const STRIPE_SECRET    = context.env.STRIPE_SECRET_KEY;

    // Récupérer le produit depuis Supabase
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/resources?id=eq.${produit_id}&select=*`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE,
          'Authorization': `Bearer ${SUPABASE_SERVICE}`,
        },
      }
    );
    const [produit] = await res.json();

    if (!produit) {
      return new Response(JSON.stringify({ error: 'Produit introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trouver la variante et son prix
    const variantes = produit.variantes || [];
    const variante  = variantes.find(v => v.id === variante_id);
    const prixProduit = variante ? variante.prix : (produit.price * 100 || 0);

    // Calculer frais de livraison
    const prixLivraison = produit.prix_livraison || 300;
    const seuilGratuit  = produit.livraison_offerte_a_partir || 4580;
    const livraisonFinal = prixProduit >= seuilGratuit ? 0 : prixLivraison;

    // Trouver le Stripe Price ID
    const priceIds    = produit.stripe_price_ids || {};
    const stripePriceId = variante_id ? priceIds[variante_id] : priceIds['default'];
    const gelatoProductId = produit.gelato_product_id || produit.gelato_product || '';

    if (!stripePriceId) {
      return new Response(JSON.stringify({ error: 'Price ID Stripe manquant pour ce produit.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lineItems = [
      { price: stripePriceId, quantity: 1 },
    ];

    // Ajouter les frais de livraison si > 0
    if (livraisonFinal > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: livraisonFinal,
          product_data: { name: 'Frais de livraison' },
        },
        quantity: 1,
      });
    }

    const session = await stripeRequest('/checkout/sessions', STRIPE_SECRET, {
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        type: 'physique',
        produit_id: produit_id,
        variante_id: variante_id || '',
        personnalisation: JSON.stringify(personnalisation || {}),
        montant_livraison: String(livraisonFinal),
        gelato_product_id: gelatoProductId,
      },
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'CA', 'MA', 'DZ', 'TN', 'SN', 'CI'],
      },
      success_url: `https://jumuatime.com/confirmation-physique.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://jumuatime.com/produit-physique.html?id=${produit_id}`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
