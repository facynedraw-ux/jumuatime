import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // ── CAS 1 : produit physique personnalisé (ancien système) ──
    if (body.type === 'physical_product') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: body.product_name,
              description: body.customization,
            },
            unit_amount: body.price_cents,
          },
          quantity: body.quantity,
        }],
        mode: 'payment',
        success_url: `${body.origin}/commande-confirmee.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${body.origin}/personnalisation.html`,
        customer_email: body.email_client || undefined,
        metadata: {
          type:          'physical_product',
          product:       body.product_name,
          customization: body.customization,
          prenom:        body.prenom,
          langue_prenom: body.langue_prenom,
          couleur:       body.couleur,
          quantite:      String(body.quantity),
          nom_client:    body.nom_client,
          adresse:       body.adresse,
          email_client:  body.email_client,
          message:       body.message || '',
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CAS 2 : produit physique Gelato simple (fiche produit directe) ──
    if (body.type === 'physique') {
      const produitId  = body.produit_id;
      const varianteId = body.variante_id;

      const { data: produit } = await supabase
        .from('resources')
        .select('*')
        .eq('id', produitId)
        .single();

      if (!produit) throw new Error('Produit introuvable');

      const variante       = (produit.variantes || []).find((v: any) => v.id === varianteId);
      const prixProduit    = variante ? variante.prix : produit.price; // price déjà en centimes
      const prixLivraison  = produit.prix_livraison || 490;
      const livraisonFinal = prixProduit >= (produit.livraison_offerte_a_partir || 4500) ? 0 : prixLivraison;
      const nomProduit     = variante ? variante.label : produit.title;

      const lineItems: any[] = [{
        price_data: {
          currency: 'eur',
          unit_amount: prixProduit,
          product_data: {
            name: nomProduit,
            ...(produit.preview_url ? { images: [produit.preview_url] } : {}),
          },
        },
        quantity: 1,
      }];

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

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        metadata: {
          type:              'physique',
          produit_id:        produitId,
          variante_id:       varianteId || '',
          personnalisation:  JSON.stringify(body.personnalisation || {}),
          montant_livraison: String(livraisonFinal),
        },
        shipping_address_collection: {
          allowed_countries: ['FR', 'BE', 'CH', 'CA', 'MA', 'DZ', 'TN', 'SN', 'CI'],
        },
        success_url: `${body.origin}/confirmation-physique.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${body.origin}/produit-physique.html?slug=${produit.slug}`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CAS 3 : panier mixte (physique + numérique) ──
    if (body.type === 'panier') {
      const items: any[] = body.items || [];
      if (!items.length) throw new Error('Panier vide');

      const hasPhysical = items.some((i: any) => i.type_produit === 'physique' || i.type_produit === 'bundle');

      // Livraison : uniquement les produits manuels (non-Gelato)
      const manualPhysical = items.filter((i: any) => i.type_produit === 'physique' && !i.gelato_product_id);
      const manualSubtotal = manualPhysical.reduce((sum: number, i: any) => sum + (i.price_cents || 0) * (i.quantity || 1), 0);

      // Récupérer mode_livraison depuis la DB (source de vérité, pas le client)
      let hasColis = false;
      if (manualPhysical.length > 0) {
        const produitIds = [...new Set(manualPhysical.map((i: any) => i.produit_id))];
        const { data: produits } = await supabase
          .from('resources')
          .select('id, mode_livraison')
          .in('id', produitIds);
        const modeMap: Record<string, string> = Object.fromEntries(
          (produits || []).map((p: any) => [p.id, p.mode_livraison || 'colis'])
        );
        hasColis = manualPhysical.some((i: any) => (modeMap[i.produit_id] || 'colis') !== 'lettre');
      }

      const shippingAmount = manualPhysical.length === 0 ? 0
        : manualSubtotal >= 4500 ? 0
        : hasColis ? 490 : 200;

      // Construire les line_items
      const lineItems: any[] = items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          unit_amount: item.price_cents,
          product_data: {
            name: item.title || 'Produit',
            ...(item.preview_url ? { images: [item.preview_url] } : {}),
          },
        },
        quantity: item.quantity || 1,
      }));

      if (shippingAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: shippingAmount,
            product_data: { name: 'Frais de livraison' },
          },
          quantity: 1,
        });
      }

      // Métadonnées pour les webhooks (format compact)
      const itemsMeta = items.map((i: any) => ({
        i: i.produit_id,
        t: (i.title || '').slice(0, 30),
        p: i.price_cents,
        q: i.quantity || 1,
        tp: i.type_produit,
        g: i.gelato_product_id || '',
        v: i.variante_id || '',
      }));

      const sessionParams: any = {
        mode: 'payment',
        line_items: lineItems,
        metadata: {
          type:              'panier',
          items:             JSON.stringify(itemsMeta),
          montant_livraison: String(shippingAmount),
        },
        success_url: `${body.origin}/confirmation-physique.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${body.origin}/panier.html`,
      };

      const prefilledAddress = body.shipping_address as any;

      if (hasPhysical && !prefilledAddress) {
        // Pas d'adresse pré-collectée → Stripe la demande
        sessionParams.shipping_address_collection = {
          allowed_countries: ['FR', 'BE', 'CH', 'CA', 'MA', 'DZ', 'TN', 'SN', 'CI'],
        };
      }

      if (prefilledAddress) {
        // Adresse déjà saisie dans le panier (Gelato) → stocker dans metadata
        sessionParams.metadata.adresse_livraison = JSON.stringify({
          nom:         `${prefilledAddress.firstName || ''} ${prefilledAddress.lastName || ''}`.trim(),
          rue:         prefilledAddress.line1 || '',
          complement:  prefilledAddress.line2 || '',
          ville:       prefilledAddress.city || '',
          code_postal: prefilledAddress.postalCode || '',
          pays:        prefilledAddress.country || '',
        });
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CAS 4 (par défaut) : ressource numérique ──
    const { resource_id, user_email, origin } = body;

    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, price, slug")
      .eq("id", resource_id)
      .eq("is_active", true)
      .single();

    if (!resource) {
      return new Response(
        JSON.stringify({ error: "Ressource introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: resource.title,
            description: "PDF imprimable — Jumuatime",
          },
          unit_amount: resource.price, // déjà en centimes
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/ressource.html?slug=${resource.slug}`,
      customer_email: user_email || undefined,
      metadata: { resource_id: resource.id },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
