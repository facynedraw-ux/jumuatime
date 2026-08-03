# jumuatime.com — Context for Claude Code

## Stack
HTML statique + Tailwind CDN + Vanilla JS
Supabase (PostgreSQL + Auth + Storage) — project: qsvozaxqeamrdkmujoze.supabase.co
Stripe mode LIVE (paiements réels)
Resend via Edge Function "swift-function" (emails)
Cloudflare Pages — repo: C:\Users\conta\OneDrive\Documents\GitHub\maktaba-tour
Répertoire de travail local : D:\DEV\jumuatime\

## Palette
- Teal principal : #5B9EAD
- Gold : #C49A5A
- Crème : #FAF6F0
- Texte foncé : #1A1A1A
- Footer : #2D3154 (bleu nuit)

## Typographie
- Titres : Playfair Display
- Body : DM Sans

## Identité
- Nom : Jumua Time
- Marque boutique : Jumuatime (pas Facyne)
- Sous-titre : "L'univers illustré de la famille musulmane"
- Slogan : "Des créations qui ont du sens."
- Créatrice : Facyne (Oum Safya)

## Structure fichiers

Pages principales :
- index.html
- ressources.html — boutique (filtres JS, pas de rechargement)
- a-propos.html

Fiches produit :
- ressource.html?slug=... — produit numérique
- produit-physique.html?slug=... — produit physique (Gelato)

Pages auth/compte :
- login.html (noindex)
- compte.html (noindex)
- telechargement.html — téléchargement après achat numérique
- commande-confirmee.html — confirmation commande physique
- confirmation-physique.html

Pages admin (noindex) :
- admin.html — tableau de bord principal (3 items : stats, achats, abonnés)
- admin-commandes.html — gestion commandes
- admin-ressources.html — ajout/édition des produits en boutique

Pages légales :
- cgv.html, mentions.html, confidentialite.html, personnalisation.html

Autres :
- supabase-client.js — client Supabase partagé (NE JAMAIS re-déclarer _supabase)
- sw.js — service worker
- media-picker.js
- functions/ — Edge Functions Cloudflare
- assets/, Images/, Products/ — médias

## Base de données Supabase — NOMS RÉELS

### Table `resources` (anglais, sans accent)
Colonnes :
- `id` (uuid)
- `slug` (text) — utilisé dans les URLs (?slug=...)
- `title` (text)
- `preview_url` (text) — image principale (PAS cover_url)
- `price` (integer, centimes)
- `category` (text) — valeurs : `enfants` | `spiritualite` | `decoration` | `cadeaux`
- `type_produit` (text) — `numerique` | `physique`
- `gelato_product_id` (text, nullable) — ID produit Gelato pour les physiques
- `format` (text, nullable)

Filtre technique côté front uniquement (pas en base) : `__physique__`

### Autres tables actives
- `profiles` — utilisateurs
- `purchases` — achats numériques
- `email_subscribers`

### ⚠️ Tables reliquats à supprimer (vérifier avant)
`books`, `authors`, `publishers`, `submissions`, `themes`, `reviews`, `reading_list`

## Gelato (fulfillment physique)
- Compte créé, clé API générée
- Produit connecté : Carte At-Tin (La Figue), ID `9375c91b-67e0-4568-ac45-a2f8f76226a7`
- Formats : affiches A4 uniquement ; cartes = deux fiches séparées (carré / rectangulaire)
- Pas de PDF téléchargeable pour les affiches/cartes

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
- Checkout numérique : Edge Function stripe-checkout (JWT OFF)
- Checkout physique : à connecter avec Gelato
- Webhook : stripe-webhook (JWT OFF)

## Edge Functions Supabase
| Fonction | URL | JWT |
|---|---|---|
| `send-email` | `/functions/v1/swift-function` | OFF |
| `stripe-checkout` | `/functions/v1/stripe-checkout` | OFF |
| `stripe-webhook` | `/functions/v1/stripe-webhook` | OFF |

## Emails (Resend)
- From : contact@jumuatime.com
- Templates : confirmation numérique, confirmation physique, notif admin, expédition

## Règles importantes
- NE JAMAIS utiliser balise <form> → event handlers JS uniquement
- Les prix sont en CENTIMES dans Supabase, affichés en euros dans le HTML
- NE JAMAIS modifier Stripe en mode TEST (on est en LIVE)
- NE JAMAIS supprimer de données Supabase sans confirmation explicite
- Toujours RLS activé sur les nouvelles tables
- Commit par correction : git commit -m "fix: [description]"
- `supabase-client.js` est le seul endroit où `_supabase` est déclaré

## Ecosystème Jumua & Me
- jumuatime.com — boutique illustrée famille musulmane
- tilawatour.com — app récitation Coran
- facyne.com — portfolio et freelance de Facyne
