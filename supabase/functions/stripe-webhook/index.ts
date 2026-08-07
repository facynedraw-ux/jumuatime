import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<boolean> {
  const parts: Record<string, string> = {};
  for (const part of sig.split(',')) {
    const idx = part.indexOf('=');
    if (idx > 0) parts[part.slice(0, idx)] = part.slice(idx + 1);
  }
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC', key,
    new TextEncoder().encode(`${timestamp}.${body}`)
  );
  const computed = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const verify = url.searchParams.get("verify");

  if (verify) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("download_token")
      .eq("stripe_session_id", verify)
      .maybeSingle();

    return new Response(
      JSON.stringify({ download_token: purchase?.download_token || null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  const valid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!valid) {
    console.error("[webhook] Signature invalide");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  console.log("[webhook] event type:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta = session.metadata ?? {};
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // ── CAS 1 : COMMANDE PHYSIQUE CRICUT ──────────────────────────────
    if (meta.type === "physical_product") {
      const { error: insertError } = await supabase.from("orders").insert({
        stripe_session_id: session.id,
        product_name:      meta.product,
        customization:     meta.customization,
        prenom:            meta.prenom,
        langue_prenom:     meta.langue_prenom,
        couleur:           meta.couleur,
        quantity:          parseInt(meta.quantite) || 1,
        amount:            session.amount_total ?? 0,
        nom_client:        meta.nom_client,
        adresse:           meta.adresse,
        email_client:      meta.email_client,
        message:           meta.message || null,
        status:            "confirmed",
      });
      if (insertError) console.warn("[webhook] orders insert:", insertError.message);

      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
        body: JSON.stringify({
          type: "order_received",
          data: {
            to_email:      meta.email_client,
            product:       meta.product,
            customization: meta.customization,
            quantite:      meta.quantite,
            adresse:       meta.adresse,
          },
        }),
      });

      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
        body: JSON.stringify({
          type: "order_admin",
          data: {
            product:       meta.product,
            customization: meta.customization,
            quantite:      meta.quantite,
            nom_client:    meta.nom_client,
            email_client:  meta.email_client,
            adresse:       meta.adresse,
            message:       meta.message || "",
            amount:        ((session.amount_total ?? 0) / 100).toFixed(2),
          },
        }),
      });

      console.log("[webhook] commande physique Cricut enregistrée:", session.id);

    // ── CAS 2 : COMMANDE PHYSIQUE GELATO (produit unique) ─────────────
    } else if (meta.type === "physique") {
      const shippingDetails = session.shipping_details;
      const adresseLivraison = shippingDetails ? {
        nom:         shippingDetails.name,
        rue:         shippingDetails.address.line1,
        complement:  shippingDetails.address.line2 || "",
        ville:       shippingDetails.address.city,
        code_postal: shippingDetails.address.postal_code,
        pays:        shippingDetails.address.country,
      } : null;

      const persoData = meta.personnalisation ? JSON.parse(meta.personnalisation) : {};

      const montantLivraisonCas2 = parseInt(meta.montant_livraison || "0");
      const { data: cmdInsert, error: cmdErr } = await supabase
        .from("commandes_physiques")
        .insert({
          stripe_session_id: session.id,
          ressource_id:      meta.produit_id,
          variante_id:       meta.variante_id || null,
          personnalisation:  persoData,
          montant_produit:   (session.amount_total ?? 0) - montantLivraisonCas2,
          montant_total:     session.amount_total ?? 0,
          montant_livraison: montantLivraisonCas2,
          email_client:      session.customer_details?.email,
          nom_client:        session.customer_details?.name,
          adresse_livraison: adresseLivraison,
          statut:            "en_attente",
        })
        .select()
        .single();

      if (cmdErr) console.warn("[webhook] commandes_physiques insert:", cmdErr.message);

      // Décrémenter le stock
      await supabase.rpc("decrement_stock", { product_id: meta.produit_id });

      const { data: produitData } = await supabase
        .from("resources")
        .select("title")
        .eq("id", meta.produit_id)
        .single();

      const emailClient  = session.customer_details?.email;
      const nomClient    = session.customer_details?.name || "";
      const titreAffiche = produitData?.title || "Affiche personnalisée";
      const prenomPerso  = persoData.prenom || "";

      if (emailClient) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
          body: JSON.stringify({
            type: "physique_confirmation",
            data: {
              to_email:          emailClient,
              nom:               nomClient,
              titre_affiche:     titreAffiche,
              prenom_perso:      prenomPerso,
              adresse_livraison: adresseLivraison,
              montant_total:     ((session.amount_total || 0) / 100).toFixed(2),
              commande_id:       cmdInsert?.id || "",
            },
          }),
        });
      }

      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
        body: JSON.stringify({
          type: "physique_admin",
          data: {
            nom:               nomClient,
            email_client:      emailClient,
            titre_affiche:     titreAffiche,
            prenom_perso:      prenomPerso,
            adresse_livraison: adresseLivraison,
            montant_total:     ((session.amount_total || 0) / 100).toFixed(2),
            commande_id:       cmdInsert?.id || "",
          },
        }),
      });

      console.log("[webhook] commande physique Gelato enregistrée:", session.id);

    // ── CAS 3 : PANIER (physique + numérique mélangés) ────────────────
    } else if (meta.type === "panier") {
      let items: any[] = [];
      try { items = JSON.parse(meta.items || "[]"); } catch {}

      const digitalItems  = items.filter((i: any) => i.tp === "numerique");
      const physicalItems = items.filter((i: any) => i.tp === "physique" || i.tp === "bundle");

      const shippingDetails = session.shipping_details;
      const adresseLivraison = shippingDetails ? {
        nom:         shippingDetails.name,
        rue:         shippingDetails.address.line1,
        complement:  shippingDetails.address.line2 || "",
        ville:       shippingDetails.address.city,
        code_postal: shippingDetails.address.postal_code,
        pays:        shippingDetails.address.country,
      } : (meta.adresse_livraison ? JSON.parse(meta.adresse_livraison) : null);

      const emailClient = session.customer_details?.email;
      const nomClient   = session.customer_details?.name || "";

      // Produits numériques : enregistrer achat + envoyer lien téléchargement
      for (const item of digitalItems) {
        const token = crypto.randomUUID();

        const { data: res } = await supabase
          .from("resources")
          .select("price")
          .eq("id", item.i)
          .single();

        const { error: purchaseErr } = await supabase.from("purchases").insert({
          resource_id:       item.i,
          amount:            res?.price ?? 0,
          stripe_session_id: session.id,
          download_token:    token,
        });
        if (purchaseErr) console.warn("[webhook] panier purchase insert:", purchaseErr.message);

        if (emailClient) {
          const downloadUrl = `https://jumuatime.com/telechargement.html?token=${token}`;
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
            body: JSON.stringify({
              type: "resource_purchased",
              data: { to_email: emailClient, resource_title: item.t, download_url: downloadUrl },
            }),
          });
        }
      }

      // Produits physiques : enregistrer commande + emails
      for (const item of physicalItems) {
        console.log("[webhook] panier physique item:", JSON.stringify({ i: item.i, v: item.v, t: item.t, tp: item.tp }));
        console.log("[webhook] panier physique session:", JSON.stringify({ id: session.id, email: emailClient, nom: nomClient, montant: session.amount_total, shipping: adresseLivraison }));
        const { data: cmdInsert, error: cmdErr } = await supabase
          .from("commandes_physiques")
          .insert({
            stripe_session_id: session.id,
            ressource_id:      item.i,
            variante_id:       item.v || null,
            personnalisation:  {},
            montant_produit:   (item.p || 0) * (item.q || 1),
            montant_total:     session.amount_total ?? 0,
            montant_livraison: parseInt(meta.montant_livraison || "0"),
            email_client:      emailClient,
            nom_client:        nomClient,
            adresse_livraison: adresseLivraison,
            statut:            "en_attente",
          })
          .select().single();
        if (cmdErr) {
          console.error("[webhook] ERREUR insert commandes_physiques:", JSON.stringify({ code: cmdErr.code, message: cmdErr.message, details: cmdErr.details, hint: cmdErr.hint }));
        } else {
          console.log("[webhook] commandes_physiques OK, id:", cmdInsert?.id);
        }

        // Décrémenter le stock
        await supabase.rpc("decrement_stock", { product_id: item.i });

        if (emailClient) {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
            body: JSON.stringify({
              type: "physique_confirmation",
              data: {
                to_email: emailClient, nom: nomClient,
                titre_affiche: item.t, prenom_perso: "",
                adresse_livraison: adresseLivraison,
                montant_total: ((session.amount_total || 0) / 100).toFixed(2),
                commande_id: cmdInsert?.id || "",
              },
            }),
          });
        }

        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
          body: JSON.stringify({
            type: "physique_admin",
            data: {
              nom: nomClient, email_client: emailClient, titre_affiche: item.t,
              prenom_perso: "", adresse_livraison: adresseLivraison,
              montant_total: ((session.amount_total || 0) / 100).toFixed(2),
              commande_id: cmdInsert?.id || "",
            },
          }),
        });
      }

      console.log("[webhook] panier:", session.id, "- digital:", digitalItems.length, "- physique:", physicalItems.length);

    // ── CAS 4 : RESSOURCE PDF (achat direct, hors panier) ────────────
    } else {
      const resourceId = meta.resource_id ?? "";
      const token = crypto.randomUUID();

      console.log("[webhook] resourceId:", resourceId);

      const { error: insertError } = await supabase.from("purchases").insert({
        resource_id:       resourceId,
        amount:            (session.amount_total ?? 0) / 100,
        stripe_session_id: session.id,
        download_token:    token,
      });
      if (insertError) console.warn("[webhook] insert:", insertError.message);

      const { data: resource } = await supabase
        .from("resources")
        .select("title")
        .eq("id", resourceId)
        .single();

      const customerEmail =
        session.customer_email ?? session.customer_details?.email ?? null;
      const downloadUrl = `https://jumuatime.com/telechargement.html?token=${token}`;

      console.log("[webhook] email →", customerEmail, "| ressource:", resource?.title);

      const emailRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/swift-function`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            type: "resource_purchased",
            data: {
              to_email:       customerEmail,
              resource_title: resource?.title ?? "",
              download_url:   downloadUrl,
            },
          }),
        }
      );
      const emailBody = await emailRes.text();
      console.log("[webhook] send-email →", emailRes.status, emailBody);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
});
