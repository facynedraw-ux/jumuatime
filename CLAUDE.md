# jumuatime.com — Context for Claude Code

## Stack
HTML statique + Tailwind CDN + Vanilla JS
Supabase (PostgreSQL + Auth + Storage) — project: qsvozaxqeamrdkmujoze.supabase.co
Stripe mode LIVE (paiements réels)
Resend via Edge Function "swift-function" (emails)
Cloudflare Pages — repo: facynedraw-ux/jumuatime (ou maktaba-tour, à vérifier)

## Palette
- Teal principal : #5B9EAD
- Rose pêche : #F2C4B2
- Crème : #FDF6F0
- Texte foncé : #1A1A1A
- Blanc : #FFFFFF

## Typographie
- Titres : Playfair Display
- Body : DM Sans

## Identité
- Nom : Jumua Time
- Sous-titre : "L'univers illustré de la famille musulmane"
- Slogan : "Des créations qui ont du sens."
- Proposé par : Jumua & Me (Facyne)

## Structure fichiers
- Pages principales : index.html, boutique.html, a-propos.html
- Pages légales : cgv.html, mentions.html, confidentialite.html
- Pages auth : login.html, compte.html
- Pages admin : admin.html, admin-commandes.html
- Edge Functions : functions/api/
- Assets : Images/, assets/

## Base de données Supabase
Tables existantes :
- ressources (produits — numériques et physiques)
- profiles (utilisateurs)
- commandes_physiques (commandes produits physiques)

Colonnes importantes dans ressources :
- type_produit : 'numerique' | 'physique'
- categorie_boutique : 'ressources-digitales' | 'affiches' | 'objets' | 'cadeaux'
- personnalisable : boolean
- options_personnalisation : JSONB
- variantes : JSONB
- stripe_price_id_defaut : text
- prix_livraison : integer (centimes)
- delai_livraison : text

## Architecture boutique (brief juin 2026)
- UNE seule page boutique : boutique.html
- Filtres catégories côté JS (pas de rechargement)
- Fiche produit universelle : fiche-produit.html?id=UUID
- Personnalisation inline dans la fiche produit (pas de page séparée)
- PAS de page personnalisation.html — supprimée

## Stripe
- Mode LIVE (vraie carte)
- Prix en centimes dans Supabase
- Checkout numérique : Edge Function existante
- Checkout physique : functions/api/physique-checkout.js
- Webhook : functions/api/swift-function.js

## Emails (Resend)
- From : contact@jumuatime.com
- Templates : confirmation numérique, confirmation physique, notif admin, expédition

## Règles importantes
- NE JAMAIS utiliser balise <form> → event handlers JS uniquement
- Les prix sont en CENTIMES dans Supabase, affichés en euros dans le HTML
- NE JAMAIS modifier le système Stripe en mode TEST (on est en LIVE)
- NE JAMAIS supprimer de données Supabase sans confirmation explicite
- Toujours RLS activé sur les nouvelles tables
- Commit par correction : git commit -m "fix: [description]"
- Push final : git add . && git commit -m "..." && git push

## Pages à exclure de l'indexation Google
- compte.html → meta robots: noindex
- login.html → meta robots: noindex
- admin.html → meta robots: noindex
- admin-commandes.html → meta robots: noindex

## Ce qui a déjà été fait (ne pas refaire)
- Logo SVG nettoyé (teal + pêche, fond transparent)
- Positionnement "L'univers illustré de la famille musulmane" partout
- Bloc Facyne sur index.html avec 2 CTAs vers facyne.com
- Footer fond #2D3154 (bleu nuit)
- Section "univers numériques" supprimée de facyne.com (pas jumuatime)
- Schema.org Store sur index.html
- robots.txt + sitemap.xml à créer (pas encore fait)

## Ecosystème Jumua & Me
- jumuatime.com — boutique illustrée famille musulmane
- tilawatour.pages.dev — app récitation Coran
- maktaba-tour — plateforme livres jeunesse musulmans (en construction)
- facyne.com — portfolio et freelance de Facyne
