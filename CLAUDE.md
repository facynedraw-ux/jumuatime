# jumuatime.com — Context for Claude Code

## Stack
HTML statique + Tailwind CDN + Vanilla JS
Supabase (PostgreSQL + Auth + Storage) — project: qsvozaxqeamrdkmujoze.supabase.co
Stripe mode LIVE (paiements réels)
Resend (emails transactionnels) — From : contact@jumuatime.com
Cloudflare Pages — repo git : D:\DEV\jumuatime (git push → Cloudflare auto)
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
- personnalisation.html — commandes personnalisées (produits chargés depuis `produits_perso`, formulaire dynamique par type)
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
- admin-perso.html — fiches personnalisation (créer, modifier, dupliquer, supprimer, galerie multi-images)
- admin-stock.html — gestion du stock
- admin-feedbacks.html — gestion des feedbacks/avis Tilawa Tour

Pages légales :
- cgv.html, mentions.html, confidentialite.html

Autres :
- supabase-client.js — client Supabase partagé (NE JAMAIS re-déclarer _supabase)
- cart.js — panier localStorage (clé `jt_panier`) — Cart.add/remove/setQty/clear/count/subtotal/shipping/total
- protect.js — protection images : bloque clic droit, drag, long-press iOS (`-webkit-touch-callout`) — inclus dans index, ressources, ressource, produit-physique, personnalisation, tilawatour
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
- `is_active` (boolean) — produit actif/commandable
- `visible_boutique` (boolean, default true) — affiché en boutique et recommandations ; mettre false pour les produits bundle-only

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
| Coffret 4 Mugs Les 4 Saisons | 49,90 € |
| Carte/affiche physique (Gelato) | 12,00 € |

## Livraison
- Seuil livraison offerte produits manuels : **49 € minimum** (`SHIPPING_FREE = 4900` dans cart.js)
- Livraison lettre : 2,00 € (`SHIPPING_LETTRE = 200`)
- Livraison colis : 4,90 € (`SHIPPING_COLIS = 490`)
- Produits Gelato : livraison calculée par Gelato à l'étape panier

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
| `produit-physique.js` | `/produit-physique` | Injection OG tags server-side pour Pinterest/crawlers |

⚠️ **Règle obligatoire — Cloudflare Functions retournant du HTML dynamique** :
Toujours utiliser `Cache-Control: no-store` dans la réponse. Ne jamais mettre `s-maxage` ou `public` sur du HTML généré dynamiquement : Cloudflare CDN mettrait la réponse en cache et la servirait à tous les slugs/URLs suivants, causant une régression globale (toutes les fiches produit affichent le même contenu ou une page vide).

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
- Sauvegarde : UPDATE commandes_physiques (statut, numero_suivi, notes_admin) → panel se ferme automatiquement après succès
- Déclenche email expédition automatiquement quand statut passe à "expedie" (fire-and-forget, pas de confirmation dans le panel)
- Bouton "+ Nouvelle commande" : INSERT manuel avec stripe_session_id = 'MANUEL-' + Date.now()
- Récapitulatif montants : utilise `o.montant_produit` directement (centimes) — ne pas recalculer depuis `total - livraison` car `livraison = 0` est falsy

## Admin — personnalisation (admin-perso.html)
- Grille de fiches depuis `produits_perso` (ordonnées par `ordre`)
- Bouton "Nouvelle fiche" → panel création (name, type_key dropdown, prix, description, actif)
- Clic sur une carte → panel édition : photo principale, modèles, galerie multi-images, prix, description, actif, options par type
- Boutons panel : Enregistrer (→ ferme le panel) / Dupliquer (copie inactif) / Supprimer (confirm)
- Upload images : bucket Supabase Storage `perso-covers`
  - Photo principale : `{type_key}/cover-{timestamp}.{ext}` → colonne `image_url`
  - Modèles : `{type_key}/modele-{timestamp}.{ext}` → `options.modeles[]` (image + label éditable)
  - Galerie : `{type_key}/gallery-{timestamp}.{ext}` → `options.gallery[]`
  - Fonds calligraphie arabe : `calligraphie-arabe/fond-{timestamp}.{ext}` → `options.fonds[]`
- **RLS Storage** (à appliquer si le bucket est nouveau) :
  ```sql
  CREATE POLICY "Public read perso-covers" ON storage.objects FOR SELECT USING (bucket_id = 'perso-covers');
  CREATE POLICY "Auth insert perso-covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'perso-covers' AND auth.role() = 'authenticated');
  CREATE POLICY "Auth update perso-covers" ON storage.objects FOR UPDATE USING (bucket_id = 'perso-covers' AND auth.role() = 'authenticated');
  CREATE POLICY "Auth delete perso-covers" ON storage.objects FOR DELETE USING (bucket_id = 'perso-covers' AND auth.role() = 'authenticated');
  ```

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
- Bundles mugs fabriqués par **Realisaprint** (pas Gelato, pas à la main par Facyne) → fiche produit affiche "Fabriqué par Realisaprint, imprimeur partenaire"

## Protocole obligatoire avant chaque git push (PRODUCTION LIVE)

Avant de dire "déployé" ou de faire `git push`, vérifier systématiquement :

1. **Accolades JS** — après toute modification d'un bloc JS (`if`, `function`, template literal), recompter manuellement les `{` et `}` dans la zone modifiée. Une accolade manquante casse tout le script silencieusement.
2. **Template literals imbriquées** — les backticks `` ` `` dans un template literal doivent être échappés ou remplacés par `'`. Vérifier les `${}` dans les `.map()` imbriquées.
3. **Variables utilisées avant déclaration** — si une fonction appelle `escHtml`, `showToast`, etc., vérifier qu'elles sont définies dans la page.
4. **Test en conditions réelles** — ouvrir la page concernée après déploiement Cloudflare (1-2 min) et vérifier visuellement la fonctionnalité modifiée avant de marquer la tâche comme terminée. Si la page est blanche ou un chargement ne se fait plus → ouvrir la console (F12) et lire l'erreur exacte.
5. **Fichiers dépendants** — si un fichier partagé (supabase-client.js, cart.js) est modifié, tester toutes les pages qui l'importent.

⚠️ Ce site est en production LIVE (Stripe réel, vraies clientes). Tester avant de déclarer une tâche terminée.

## Règles importantes
- NE JAMAIS utiliser balise <form> → event handlers JS uniquement
- Les prix sont en CENTIMES dans Supabase, affichés en euros dans le HTML
- `resources.price` est en **euros** (ex: 49.9) — `variantes[*].prix` est en **centimes** — ne pas confondre
- `delai_livraison` peut contenir une valeur invalide (ex: 'numérique') si mal saisie dans admin → la regex `/\d|jour|semaine/i` la filtre dans produit-physique.html ; corriger aussi la fiche dans admin-ressources.html
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
- **a-propos.html** : pas de lien facyne.com — Instagram uniquement. Photo/avatar en bas de page (juste avant footer).

### tilawatour.html — landing page Tilawa Tour
- Hero : fond teal foncé, phone frame 380px (paysage), image `Images/screen_serenity_dash.png?v=2`, clic → lightbox
- **Lightbox** : CSS class `#lightbox.is-open { display:flex }` — `openLightbox(src)` / `closeLightbox()` — touche Escape ferme. Override global `img { max-width }` via `#lightbox > img` avec `max-height:90vh; max-width:90vw; width:auto; height:auto`
- **Avatars cliquables** : femme → `openLightbox('Images/screen1.png')` (Bloom), homme → `openLightbox('Images/screen_serenity.png')` (Serenity)
- **6 vignettes fonctionnalités** (toutes cliquables vers lightbox) :
  1. Lecture → `screen_lecteur.png?v=2`
  2. Suivi → `screen_programme.png?v=2`
  3. Ramadan → `screen_ramadan.png`
  4. Thème → `screen_profil.png`
  5. Tajwid → `screen_lexique.png`
  6. Khatma → `screen_khatma.png`
- **Feedbacks section** : table Supabase `feedbacks` (jumuatime project), affiche les validés (valide=true), formulaire type Avis/Suggestion/Bug + note étoiles pour Avis + nom + message
- **Formulaire inscription** (`submitTilawa`) : INSERT `email_subscribers` + upsert `beta_access` → appel `swift-function` type `tilawa_access` → message "Vérifie ta boîte mail" + lien direct vers l'app

### admin-feedbacks.html
- Page admin (role='admin') — gestion feedbacks : filtres Tous/Avis/Suggestions/Bugs/En attente/Validés
- Actions : valider/invalider (UPDATE valide), supprimer (DELETE avec confirm)

## Tilawa Tour — app PWA
- URL Cloudflare Pages : `https://tilawatour.pages.dev/` (lien dans emails et boutons)
- URL Workers (ancienne) : `https://tilawatour.jumuaandme.workers.dev/` (encore active)
- Supabase project séparé : `lekirecmfhewsnozgusm.supabase.co`, anon key = `sb_publishable_9O8kw2OwMKT5Kw4PBlHnew_l44qd46X`
- Repo git : `D:\tilawa-deploy` (git push → Cloudflare Pages auto)
- Auth : `signInWithOtp` (code 6 chiffres), `shouldCreateUser: true`
- **SMTP Auth email** : configuré avec Resend, From = `contact@jumuatime.com` (jumuatime.com vérifié) — ⚠️ NE PAS remettre contact@tilawatour.com (domaine non possédé → 403 Resend)
- **profil_bloom.html / profil_serenity.html** : section install PWA (beforeinstallprompt + iOS fallback), lien Assistance → `https://jumuatime.com/tilawatour#avis-section`
- **send-app-link.mjs** : script Node.js pour envoyer le lien aux inscrits en base (`node send-app-link.mjs` dans D:\DEV\jumuatime)

### Edge Function Tilawa Tour — notify-new-user
- Fichier : `D:\tilawa-deploy\supabase\functions\notify-new-user\index.ts`
- Projet Supabase : `lekirecmfhewsnozgusm` — JWT OFF
- Rôle : envoie un email à `jumuaandme@gmail.com` à chaque nouvelle inscription
- From : `Tilawa Tour <contact@jumuatime.com>` (domaine jumuatime.com vérifié dans Resend — tilawatour.com non acheté)
- Secret requis : `RESEND_API_KEY` = clé du compte Resend jumuatime
- Déclencheur : trigger PostgreSQL `on_auth_user_created` sur `auth.users` — INSERT uniquement (jamais sur UPDATE/reconnexion)
- Déployer : `npx supabase@2.113.0 functions deploy notify-new-user --project-ref lekirecmfhewsnozgusm --no-verify-jwt`

## Emails — swift-function (Supabase Edge Function)
Slug : `swift-function` — URL : `/functions/v1/swift-function` — JWT OFF
Types implémentés :
| type | usage | données |
|---|---|---|
| `tilawa_access` (ou `tilawa_gift`) | Email d'accès Tilawa Tour — déclenché à l'inscription sur index.html ET tilawatour.html | `{ to_email }` |
| `order_confirmation` | Confirmation commande (non-Stripe) | `{ to, order_id, items, total }` |

Template `tilawa_access` : fond crème (#FAF6F0), accents émeraude Tilawa Tour (#00917c — bouton, bordure italique, ligne sous header), texte foncé (#1A1A1A), liens teal (#5B9EAD). PAS de bandeau sombre. Lien vers `tilawatour.pages.dev`, logo en header sur fond clair.

**Appel depuis le front** (index.html ET tilawatour.html) :
```js
fetch('https://qsvozaxqeamrdkmujoze.supabase.co/functions/v1/swift-function', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
  body: JSON.stringify({ type: 'tilawa_access', data: { to_email: email } })
})
```

## Tables Supabase — nouvelles
### Table `feedbacks`
- `id`, `created_at`, `type` (text: 'avis'|'idée'|'bug'), `note` (int 1-5, nullable, pour avis), `nom` (text, nullable), `message` (text), `valide` (bool, default false)
- RLS : INSERT public (anon), SELECT public (valide=true seulement), ALL admin via profiles.role='admin'

### Table `beta_access`
- `email` (unique), `source`, `created_at`
- Remplie via upsert à chaque inscription Tilawa Tour

### Table `produits_perso`
Gère les fiches de commande personnalisée (pochons, calligraphies, cadres…)
- `id` (uuid)
- `name` (text) — nom affiché
- `type_key` (text) — identifiant type : `pochon` | `calligraphie-latine` | `calligraphie-arabe` | `cadre-argile` | tout autre slug
- `description` (text, nullable)
- `price_cents` (integer, centimes) — 0 = "Prix à définir", produit non commandable
- `actif` (boolean) — visible sur personnalisation.html (uniquement si actif ET price_cents > 0)
- `image_url` (text, nullable) — photo principale (cover) affichée dans le dropdown et la carte
- `options` (jsonb) — données spécifiques au type :
  - `colors` (array) — couleurs disponibles (pochon)
  - `tailles`, `couleurs`, `versions` (arrays) — options cadre argile
  - `fonds` (array {url, label}) — fonds calligraphie arabe (affichés côté client)
  - `gallery` (array {url, label}) — galerie multi-images (admin + miniatures sur personnalisation.html)
  - `modeles` (array {url, label}) — variantes visuelles que le client sélectionne (picker portrait sur personnalisation.html, sélection obligatoire si non vide)
- `ordre` (integer) — ordre d'affichage dans la grille
- `vedette` (boolean), `vedette_ordre` (integer 1-3)
- `updated_at` (timestamp)

⚠️ Le `type_key` est utilisé dans `personnalisation.html` → `getFormFields(key)` pour rendre les champs dynamiques. Un type_key inconnu affiche une section vide (formulaire de base uniquement).

## Phase 2 — à faire (non implémenté)
- Pré-remplissage automatique adresse dans panier depuis `adresses_livraison`
- Factures Stripe : activer `invoice_creation` dans stripe-checkout.ts + stocker `stripe_customer_id` dans profiles + Edge Function pour récupérer PDFs

## Ecosystème Jumua & Me
- jumuatime.com — boutique illustrée famille musulmane
- https://tilawatour.pages.dev/ — app récitation Coran (Tilawa Tour), Cloudflare Pages
- facyne.com — portfolio Facyne (projet séparé, aucun lien depuis jumuatime)
