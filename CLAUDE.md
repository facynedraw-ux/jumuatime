# jumuatime.com — Context for Claude Code

## Stack
HTML statique + Tailwind CDN + Vanilla JS
Supabase (PostgreSQL + Auth + Storage) — project: qsvozaxqeamrdkmujoze.supabase.co
Stripe mode LIVE (paiements réels)
Resend (emails transactionnels) — From : contact@jumuatime.com
Cloudflare Pages — repo: C:\Users\conta\OneDrive\Documents\GitHub\maktaba-tour
Répertoire de travail local : D:\DEV\jumuatime\

## Palette
- Teal principal : #5B9EAD
- Gold : #C49A5A
- Crème : #FAF6F0
- Texte foncé : #1A1A1A
- Footer : #2D5A66 (teal foncé)
- Admin : #C96B8A (rose)

## Typographie
- Titres : Playfair Display
- Body : DM Sans

## Identité
- Nom : Jumua Time
- Marque boutique : Jumuatime (pas Facyne)
- Sous-titre : "L'univers illustré de la famille musulmane"
- Slogan : "Des créations qui ont du sens." (baseline officielle de la marque)
- Accroche hero (index.html) : "Pensées avec du sens." (variante utilisée dans le hero uniquement)
- Créatrice : Facyne (facyne.draw@gmail.com)

## Structure fichiers

Pages principales :
- index.html
- ressources.html — boutique (filtres JS, pas de rechargement)
- a-propos.html

Fiches produit :
- ressource.html?slug=... — produit numérique
- produit-physique.html?slug=... — produit physique (Gelato ou manuel)

Pages auth/compte :
- login.html (noindex)
- compte.html (noindex) — profil, achats numériques, commandes physiques, adresses, suppression compte
- telechargement.html — téléchargement après achat numérique
- commande-confirmee.html — confirmation commande physique
- confirmation-physique.html

Pages admin (noindex) :
- admin.html — tableau de bord principal (stats, achats récents, abonnés)
- admin-commandes.html — gestion commandes physiques + achats numériques
- admin-ressources.html — ajout/édition des produits en boutique

Pages légales :
- cgv.html, mentions.html, confidentialite.html, personnalisation.html

Autres :
- supabase-client.js — client Supabase partagé (NE JAMAIS re-déclarer _supabase)
- cart.js — panier localStorage (clé `jt_panier`) — Cart.add/remove/setQty/clear/count/subtotal/shipping/total
- sw.js — service worker
- media-picker.js
- functions/api/ — Edge Functions Cloudflare Pages
- assets/, Images/, Products/ — médias

## Base de données Supabase — NOMS RÉELS

### Table `resources` (anglais, sans accent)
Colonnes :
- `id` (uuid)
- `slug` (text) — utilisé dans les URLs (?slug=...)
- `title` (text)
- `description` (text, nullable)
- `preview_url` (text) — image principale (PAS cover_url — cover_url N'EXISTE PAS)
- `preview_pdf_url` (text, nullable)
- `file_url` (text, nullable) — PDF téléchargeable (numériques uniquement)
- `price` (numeric, euros — ex: 3.9 pour 3,90 €) ⚠️ PAS en centimes ; `variantes[*].prix` est en centimes
- `category` (text) — valeurs : `enfants` | `spiritualite` | `decoration` | `cadeaux`
- `type_produit` (text) — `numerique` | `physique` | `bundle`
- `gelato_product_id` (text, nullable) — ID produit Gelato pour les physiques Gelato
- `bundle_items` (jsonb[], nullable) — articles d'un bundle : `[{g, p, t, img, rid, vid}]` ; `g: null` = livraison manuelle (pas Gelato)
- `format` (text, nullable)
- `gallery_urls` (text[], nullable) — galerie d'images supplémentaires
- `is_active` (boolean) — visible en boutique si true

### Table `commandes_physiques`
Colonnes :
- `id` (uuid)
- `created_at`
- `stripe_session_id` (text)
- `statut` (text) — CHECK constraint : `en_attente` | `en_creation` | `commande_gelato` | `en_preparation` | `expedie` | `livre` | `annule`
- `ressource_id` (uuid) → join resources  ⚠️ PAS resource_id
- `variante_id` (text, nullable)
- `email_client` (text)
- `nom_client` (text)
- `adresse_livraison` (jsonb) — { nom, rue, complement, ville, code_postal, pays }
- `personnalisation` (jsonb)
- `montant_produit` (integer, centimes, NOT NULL) — obligatoire à l'insert
- `montant_livraison` (integer, centimes)
- `montant_total` (integer, centimes, nullable)
- `numero_suivi` (text, nullable)
- `notes_admin` (text, nullable)

RLS policies actives :
- `admin_read`   — SELECT — admin via `profiles.role = 'admin'` + `auth.uid()`
- `admin_update` — UPDATE — admin via `profiles.role = 'admin'` + `auth.uid()`
- `admin_delete` — DELETE — admin via `profiles.role = 'admin'` + `auth.uid()`
- `client_read_own` — SELECT — clientes : `auth.email() = email_client`

### Table `profiles` — utilisateurs
- `id` (uuid, FK auth.users)
- `display_name` (text)
- `avatar_url` (text, nullable)
- `role` (text) — `'admin'` pour Facyne, null pour clientes
- `created_at`
- `author_id` (uuid, nullable — reliquat, ignorer)

### Table `adresses_livraison` — adresses sauvegardées clientes
- `id` (uuid)
- `user_id` (uuid, FK auth.users ON DELETE CASCADE)
- `nom` (text, NOT NULL)
- `rue` (text, NOT NULL)
- `complement` (text, nullable)
- `code_postal` (text, NOT NULL)
- `ville` (text, NOT NULL)
- `pays` (text, NOT NULL, default 'FR')
- `created_at`

RLS : `owner_all` — `USING (auth.uid() = user_id)` + `WITH CHECK (auth.uid() = user_id)`

### Table `purchases` — achats numériques
- `id`, `created_at`, `user_id`, `resource_id`, `download_token`, `downloaded_at`

RLS : les clientes lisent leurs propres achats via `user_id = auth.uid()`

### Table `email_subscribers`
(abonnées newsletter)

### ⚠️ Tables reliquats à supprimer (vérifier avant)
`books`, `authors`, `publishers`, `submissions`, `themes`, `reviews`, `reading_list`, `orders`

## Gelato (fulfillment physique automatique)
- Compte créé, clé API dans Cloudflare env: `GELATO_API_KEY`
- Produit Gelato actif : Carte At-Tin (La Figue), ID `9375c91b-67e0-4568-ac45-a2f8f76226a7`
- Formats : affiches A4 uniquement ; cartes = deux fiches séparées (carré / rectangulaire)
- Pas de PDF téléchargeable pour les affiches/cartes
- Flux : paiement Stripe → webhook Cloudflare → API Gelato → impression + envoi direct client

## Grille tarifaire
| Produit | Prix |
|---|---|
| Affiche digitale (1 design) | 11,90 € |
| Poster alphabet arabe | 12,90 € |
| Carte simple (unité) | 4,50 € |
| Set de cartes | 12,90 € |
| Bundle 4 saisons | 34,90 € |
| Carte/affiche physique (Gelato) | 12,00 € |

## Stripe
- Mode LIVE (vraie carte) — NE JAMAIS passer en mode TEST
- Prix en centimes dans Supabase
- Checkout panier : Edge Function `stripe-checkout` (Supabase, JWT OFF)
- Webhooks Stripe configurés (2 endpoints) :
  1. Supabase : `https://qsvozaxqeamrdkmujoze.supabase.co/functions/v1/stripe-webhook` → DB (commandes_physiques)
  2. Cloudflare : `https://jumuatime.com/api/swift-function` → Gelato + emails

## Edge Functions Supabase
| Fonction | URL | JWT |
|---|---|---|
| `swift-function` | `/functions/v1/swift-function` | OFF |
| `stripe-checkout` | `/functions/v1/stripe-checkout` | OFF |
| `stripe-webhook` | `/functions/v1/stripe-webhook` | OFF |
| `delete-account` | `/functions/v1/delete-account` | ON — vérifie le JWT, anonymise commandes_physiques puis supprime auth.users |

## Cloudflare Functions (functions/api/)
| Fichier | Route | Rôle |
|---|---|---|
| `swift-function.js` | `/api/swift-function` | Webhook Stripe → Gelato + emails confirmation |
| `physique-checkout.js` | `/api/physique-checkout` | Checkout produit physique simple |
| `email-expedition.js` | `/api/email-expedition` | Email suivi expédition (appelé depuis admin-commandes) |

## Variables d'environnement Cloudflare
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` — secret du webhook Cloudflare (≠ secret webhook Supabase)
- `GELATO_API_KEY`
- `RESEND_API_KEY`

## Emails (Resend)
- From : contact@jumuatime.com
- Admin notif : facyne.draw@gmail.com
- Templates implémentés dans swift-function.js :
  - Confirmation client (panier physique payé)
  - Notification admin nouvelle commande
- Template dans email-expedition.js :
  - Email expédition avec numéro de suivi → déclenché depuis admin-commandes quand statut → "expedie"
  - Header : logo `Images/logo_version_white.png` sur fond teal (pas emoji)
  - Lien suivi La Poste : `https://www.laposte.fr/outils/suivre-vos-envois?code=<tracking>`

## Admin — commandes (admin-commandes.html)
- Onglet Physiques : liste commandes_physiques avec filtres statut
- Onglet Numériques : liste purchases (lecture seule)
- Panel glissant : détails commande + adresse + changement statut + numéro de suivi + notes internes
- Sauvegarde : UPDATE commandes_physiques (statut, numero_suivi, notes_admin)
- Déclenche email expédition automatiquement quand statut passe à "expedie"
- Bouton "+ Nouvelle commande" : INSERT manuel avec stripe_session_id = 'MANUEL-' + Date.now()

## Admin — ressources (admin-ressources.html)
- Bouton corbeille rouge sur chaque produit → confirm() + DELETE resources (RLS admin_delete requis)
- "Voir la fiche" route vers produit-physique.html pour type_produit = 'physique' OU 'bundle'

## Bundles — livraison manuelle (bypass Gelato)
- Si `bundle_items[*].g = null` en DB → bundle traité comme livraison manuelle (pas de quote Gelato)
- `addBundleToCart()` met `gelato_product_id: 'bundle'` si items Gelato, `null` sinon (sentinelle)
- `hasGelatoItems()` dans panier.html teste `i.gelato_product_id` (pas juste `type_produit === 'bundle'`)
- `_manualPhysical()` dans cart.js inclut les bundles sans gelato_product_id
- `stripe-checkout` : manualPhysical inclut bundles sans gelato_product_id → port 4,90 € calculé
- Bundle "Coffret 4 Mugs Les 4 saisons" : g=null en DB depuis 2026-08-08 → livraison manuelle

## Règles importantes
- NE JAMAIS utiliser balise <form> → event handlers JS uniquement
- Les prix sont en CENTIMES dans Supabase, affichés en euros dans le HTML
- NE JAMAIS modifier Stripe en mode TEST (on est en LIVE)
- NE JAMAIS supprimer de données Supabase sans confirmation explicite
- Toujours RLS activé sur les nouvelles tables
- `supabase-client.js` est le seul endroit où `_supabase` est déclaré — clé anon = JWT (eyJ...), PAS sb_publishable_
- cover_url N'EXISTE PAS dans la table resources → toujours utiliser preview_url
- Dans `commandes_physiques`, la colonne s'appelle `ressource_id` (PAS resource_id, PAS produit_id)
- `montant_produit` est NOT NULL dans commandes_physiques — toujours l'inclure à l'insert
- Les 2 webhooks Stripe ont chacun leur propre `STRIPE_WEBHOOK_SECRET` — ne pas les mélanger
- RLS admin : toujours utiliser `auth.uid()` + check `profiles.role = 'admin'` (PAS auth.email() pour identifier l'admin)
- RLS clientes : `auth.email() = email_client` est correct pour que chaque cliente voie ses propres commandes

## Pages statiques — notes importantes
- **Footer** : Instagram handle = `@jumuatime` / `instagram.com/jumuatime` (PAS `jumua_time` avec underscore)
- **Footer newsletter** : `submitNewsletter(e)` est définie dans `supabase-client.js` — ne pas la redéfinir dans chaque page
- **tilawatour.html** : landing page Tilawa Tour — hero teal foncé + 6 cartes fonctionnalités (bloom/serenity) + carte Suivi wide avec screenshot `Images/dashboard_bloom.jpg`

## Phase 2 — à faire (non implémenté)
- Pré-remplissage automatique adresse dans panier depuis `adresses_livraison`
- Factures Stripe : activer `invoice_creation` dans stripe-checkout.ts + stocker `stripe_customer_id` dans profiles + Edge Function pour récupérer PDFs
- Screenshots cartes Lecture et Khatma dans tilawatour.html (en attente captures de l'interface)

## Ecosystème Jumua & Me
- jumuatime.com — boutique illustrée famille musulmane
- https://tilawatour.jumuaandme.workers.dev/ — app récitation Coran (Tilawa Tour)
- facyne.com — portfolio et freelance de Facyne
