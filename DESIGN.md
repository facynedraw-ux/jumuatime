---
name: Jumua Time
description: L'univers illustré de la famille musulmane — boutique de ressources pédagogiques et produits illustrés par Facyne.
colors:
  turquoise-du-soir: "#5B9EAD"
  turquoise-clair: "#EBF5F7"
  turquoise-profond: "#3D7A8A"
  or-artisanal: "#C49A5A"
  dorure-pale: "#F5EDE0"
  bronze-de-chauffe: "#8B6230"
  rose-aquarelle: "#F2C4B2"
  encre-profonde: "#1A1208"
  ivoire-chaleureux: "#FAF6F0"
  blanc-de-page: "#FFFFFF"
  sable-clair: "#E2D4BC"
  sable-voile: "#8B7A5A"
  mauve-doux: "#9B7FA6"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.953rem, 5vw, 2.441rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.953rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "16px"
  md: "20px"
  lg: "24px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
components:
  btn-gold:
    backgroundColor: "{colors.or-artisanal}"
    textColor: "{colors.blanc-de-page}"
    rounded: "{rounded.lg}"
    padding: "12px 28px"
  btn-gold-hover:
    backgroundColor: "{colors.bronze-de-chauffe}"
    textColor: "{colors.blanc-de-page}"
    rounded: "{rounded.lg}"
    padding: "12px 28px"
  btn-teal:
    backgroundColor: "{colors.turquoise-du-soir}"
    textColor: "{colors.blanc-de-page}"
    rounded: "{rounded.md}"
    padding: "10px 22px"
  btn-teal-hover:
    backgroundColor: "{colors.turquoise-profond}"
    textColor: "{colors.blanc-de-page}"
    rounded: "{rounded.md}"
    padding: "10px 22px"
  btn-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.blanc-de-page}"
    rounded: "{rounded.lg}"
    padding: "12px 28px"
  resource-card:
    backgroundColor: "{colors.blanc-de-page}"
    rounded: "{rounded.md}"
    padding: "0"
  filter-pill:
    backgroundColor: "{colors.blanc-de-page}"
    textColor: "{colors.sable-voile}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  filter-pill-active:
    backgroundColor: "{colors.turquoise-du-soir}"
    textColor: "{colors.blanc-de-page}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
---

# Design System: Jumua Time

## 1. Overview

**Creative North Star: "L'Atelier de l'Illustratrice"**

Jumua Time est un atelier, pas une boutique. Chaque page révèle la main de Facyne — l'illustration est le produit, le produit est l'illustration. Le système visuel part de ce fait et en tire toutes les conséquences : fond ivoire chaud comme une feuille de papier aquarelle, typographie serif qui rappelle les albums jeunesse illustrés, palettes douces inspirées des pigments naturels. L'interface ne doit jamais paraître plus froide, plus technique, ou plus générique que l'œuvre qu'elle présente.

Ce n'est pas un e-commerce islamique. Ce n'est pas une boutique généraliste. C'est un univers cohérent, bienveillant et sincère, destiné aux familles qui cherchent à ancrer la culture islamique dans le quotidien — par le beau, pas par l'injonction. Le ton est celui d'une illustratrice qui partage son travail, jamais d'une marque qui vend.

La chaleur de la palette, la douceur des rayons et la présence de l'illustration sont les gardes-fous contre la standardisation. Quand un nouveau composant est créé, la question n'est pas "est-ce que ça ressemble à un e-commerce ?" mais "est-ce que Facyne aurait dessiné ça dans ses marges ?"

**Key Characteristics:**
- Fond ivoire chaud (pas blanc pur, pas crème générique — le papier de l'atelier)
- Typographie serif en display, sans-serif en corps : le dialogue entre l'album et le texte courant
- Palette issue des pigments naturels : turquoise mat, or chaud, rose aquarelle
- Cartes blanches sur fond ivoire : l'illustration ressort sans compétition
- Mouvements doux et organiques (flottement, fondu) — jamais mécaniques
- Zéro chrome inutile : pas de bordures décoratives, pas d'ombres architecturales, pas d'effets glass

## 2. Colors: La Palette de l'Atelier

Une palette tirée des pigments naturels de l'aquarelle. Chaque couleur existe dans l'œuvre de Facyne avant d'exister dans l'interface.

### Primary
- **Turquoise du soir** (`#5B9EAD`): La couleur principale de la marque. Utilisée comme fond de hero, couleur de bouton secondaire, état actif de navigation, et accent de hover sur les cartes. Saturation modérée — un turquoise mat qui évoque le carrelage zellige, pas le cyan digital.
- **Turquoise profond** (`#3D7A8A`): Réservé aux états hover des boutons teal et aux liens actifs. Plus sombre, jamais utilisé en fond large.
- **Turquoise clair** (`#EBF5F7`): Fond de surface teal dilué. Badges "numérique", fond de cartes de catégorie, hover léger sur icônes.

### Secondary
- **Or artisanal** (`#C49A5A`): L'accent chaud. Utilisé pour les CTA primaires (btn-gold), les prix, les italiques d'emphase dans les titres, les pastilles de panier, et les eyebrows de section. Son rôle est de signifier "valeur" et "action principale".
- **Dorure pâle** (`#F5EDE0`): Version diluée de l'or. Fonds de surface chaude, badges "physique".
- **Bronze de chauffe** (`#8B6230`): Hover de `btn-gold`. Plus sombre que l'or, jamais utilisé en fond.

### Tertiary
- **Rose aquarelle** (`#F2C4B2`): Accent décoratif, présent dans les illustrations. Utilisé ponctuellement dans des éléments graphiques (hero cards flottantes, cercles décoratifs). Jamais comme couleur fonctionnelle.
- **Mauve doux** (`#9B7FA6`): Accent secondaire rare, pour les mises en avant de la page personnalisation ou certains badges.

### Neutral
- **Encre profonde** (`#1A1208`): Couleur de texte principale. Brun-noir chaud (pas noir pur) — cohérent avec la palette pigmentaire.
- **Ivoire chaleureux** (`#FAF6F0`): Fond de page. Le papier de l'atelier. Chaud sans être crème générique.
- **Blanc de page** (`#FFFFFF`): Fond des cartes produit. Le blanc pur contraste avec l'ivoire du fond et fait ressortir l'illustration.
- **Sable clair** (`#E2D4BC`): Bordures subtiles sur cartes, dividers, separateurs. La ligne de crayon.
- **Sable voilé** (`#8B7A5A`): Texte secondaire, labels, descriptions muted. Lisible à 4.5:1 sur blanc et sur ivoire.

### Named Rules
**La Règle de l'Or Rare.** L'or (`#C49A5A`) apparaît sur ≤15 % de n'importe quel écran. Sa rareté est sa valeur. Le saturer sur tous les titres, tous les liens, toutes les sections annule son signal d'action.

**La Règle Pigment.** Toute nouvelle couleur introduite dans l'interface doit pouvoir exister dans une boîte d'aquarelle. Pas de couleurs saturées au max (HSL saturation > 70 %), pas de teintes fluo, pas de couleurs "web-safe".

## 3. Typography: Le Dialogue Serif / Sans

**Display Font:** Playfair Display (Georgia, serif en fallback)
**Body Font:** DM Sans (sans-serif)

**Character:** Playfair Display apporte le caractère éditorial et illustré des albums jeunesse — ses empattements, ses contrastes de plein et de déliés. DM Sans le contrebalance avec une lisibilité sans effort, neutre et chaleureuse. Le dialogue entre les deux est celui d'un album illustré : le titre est une image, le corps est un texte.

### Hierarchy
- **Display** (700, clamp 1.953rem–2.441rem, lh 1.15): Titres de hero et de page. Italique en `#C49A5A` autorisé sur les mots d'emphase ("toute la famille", "vous ressemble"). `text-wrap: balance`.
- **Headline** (600, 1.953rem / 31px, lh 1.2): Titres de sections principales (h2). Playfair Display. `text-wrap: balance`.
- **Title** (600, 1.25rem / 20px, lh 1.35): Noms de produit dans les cartes, sous-titres de section, titres de dialogue. DM Sans.
- **Body** (400, 1rem / 16px, lh 1.65): Corps de texte courant. DM Sans. Max 65–75ch sur prose longue. `text-wrap: pretty` pour les paragraphes.
- **Label** (700, 0.75rem / 12px, ls 0.12em, uppercase): Eyebrows de section (✦ LA BOUTIQUE), badges de catégorie. Utilisé avec parcimonie — un par section maximum.

### Named Rules
**La Règle du Dialogue.** Playfair Display est la voix de l'illustratrice : émotionnelle, légèrement italique, visible. DM Sans est la voix du quotidien : neutre, lisible, fonctionnelle. Ne les mélange pas dans un même élément de text. Un titre, un corps — jamais les deux dans la même balise.

**La Règle du Plafond.** Aucun titre en display ne dépasse 2.441rem (clamp max) sur les pages publiques. La page ne doit pas crier.

## 4. Elevation

Ce système est **plat par défaut**. Les surfaces sont au même niveau au repos — aucune ombre au repos sur les cartes, les boutons, ou les en-têtes.

La profondeur est communiquée par deux moyens : le **contraste de fond** (cartes blanches sur ivoire = séparation naturelle) et la **réponse au hover** (élévation transitoire quand l'utilisateur interagit).

**Le header** utilise `backdrop-filter: blur` + fond blanc semi-transparent (`bg-white/90`) pour signifier sa superposition au scroll — sans ombre structurelle.

### Shadow Vocabulary

- **hover-card** (`0 10px 28px rgba(91,158,173,0.14)`): Appliqué aux `.resource-card` au hover. Teinte turquoise volontaire — l'ombre porte la couleur de la marque, pas le gris générique. Disparaît au mouseout.
- **hover-card-strong** (`0 12px 32px rgba(91,158,173,0.15)`): Variante légèrement plus prononcée pour les cartes de catégorie (hero index).

### Named Rules
**La Règle du Repos Plat.** Les ombres n'existent qu'en réponse à l'interaction. Une ombre au repos sur une carte signifie que cette carte est "au-dessus" de la page en permanence — ce qui n'est pas le cas. Le hover élève, le repos est plat.

## 5. Components

### Buttons

Tactiles, arrondis, jamais agressifs. Le rayon pilule (20–24px) rappelle les formes organiques de l'illustration — pas les rectangles du logiciel.

- **Shape:** Pilule (border-radius 24px pour gold, 20px pour teal)
- **Primary (btn-gold):** Fond `#C49A5A`, texte blanc, padding 12px 28px, weight 600, 15px. CTA principal : "Ajouter au panier", "Voir la ressource". Hover: `#8B6230`. Active: `scale(0.98)`.
- **Secondary (btn-teal):** Fond `#5B9EAD`, texte blanc, padding 10px 22px, weight 600, 14px. Actions secondaires : "Mon compte", navigation contextuelle. Hover: `#3D7A8A`.
- **Ghost (btn-outline-white):** Transparent, bordure 1.5px `rgba(255,255,255,0.75)`, texte blanc. Exclusivement sur fond teal (hero, footer foncé). Hover: fond `rgba(255,255,255,0.1)`. Ne jamais utiliser sur fond ivoire.
- **Transitions:** `background 0.2s`, `transform 0.1s`. Toujours `@media (prefers-reduced-motion: reduce)` pour annuler.

### Chips / Filter Pills

- **Style:** Fond blanc, bordure 1.5px `#E2D4BC`, texte `#8B7A5A`, 13px weight 500, radius 20px.
- **Hover:** Bordure `#5B9EAD`, texte `#5B9EAD`.
- **Active/selected:** Fond `#5B9EAD`, texte blanc, bordure `#5B9EAD`.
- **Usage:** Filtres de catégorie sur la boutique. Jamais comme badges de statut (utiliser le badge pour ça).

### Cards / Containers

- **Resource Card:** Fond blanc, bordure 1px `#E2D4BC`, radius 20px, overflow hidden. L'image produit occupe 60–65 % de la hauteur — c'est l'illustration qui domine. Corps : titre (600, 14–15px), prix en or (`#C49A5A`, 700). Hover: translateY(-3px) + ombre teal-tinted.
- **Internal Padding:** Corps de carte 14–16px horizontal/vertical.
- **No nested cards.** Les containers de section (fond ivoire) ne sont pas des cartes. Une carte est blanche et a une bordure. Un container est un fond de section.

### Badges

- **Style:** Pill 20px radius, 11px 500, padding 3px 10px.
- **Numérique:** fond `#EBF5F7`, texte `#3D7A8A`.
- **Physique:** fond `#F5EDE0`, texte `#8B6230`.
- **Nouveau:** fond `#F7EDE8`, texte `#C96B8A` (rose admin — rare sur le site public).

### Inputs / Fields

- **Style:** Fond `rgba(255,255,255,0.7)`, bordure 1.5px `rgba(28,53,64,0.2)`, radius 16px, 14px DM Sans.
- **Focus:** bordure `#1C3540` (variant sombre du teal).
- **Placeholder:** `rgba(26,18,8,0.4)` — WCAG AA sur fond semi-transparent garanti.
- **Usage:** Email newsletter (hero), formulaires de contact. Les champs de commande Stripe sont hors du design system.

### Navigation

- **Header:** Sticky, `background: white/90 + backdrop-blur-sm`, border-bottom `#E2D4BC`, height 64px. Logo SVG à gauche, nav links au centre (desktop), CTA btn-teal + icône panier à droite.
- **Nav links (desktop):** DM Sans 14px weight 500, couleur `#8B7A5A`, hover couleur `#5B9EAD`, transition-colors 0.2s. Lien actif : weight 600, couleur `#5B9EAD`.
- **Mobile:** Bottom nav fixe (`fixed bottom-0 md:hidden`), fond blanc, bordure top, ~60px de hauteur. 4 icônes Material Symbols : Accueil, Boutique, Panier, Compte. Padding bottom `max(1.25rem, env(safe-area-inset-bottom))` pour safe area iOS.
- **Mobile header burger:** Bouton carré 40×40px, radius 12px, bordure `#E2D4BC`, fond blanc. Menu déroulant en-dessous du header, fond blanc, padding 12px 16px.

### Skeleton Loader (Signature)

- Shimmer de gauche à droite (`background-position` animation), dégradé linéaire `#E2D4BC → #F5EDE0 → #E2D4BC`. Rythme 1.4–1.5s. Supprimé avec `prefers-reduced-motion`.
- Utilisé systématiquement pendant le chargement Supabase des grilles de produits. Radius identique à la carte qu'il remplace (20px).

## 6. Do's and Don'ts

### Do:
- **Do** utiliser Playfair Display exclusivement pour les titres (h1–h3) et les mots d'emphase en italique or dans les headlines.
- **Do** placer les cartes produit sur fond ivoire `#FAF6F0` — le contraste blanc/ivoire remplace toute ombre au repos.
- **Do** utiliser l'italique Playfair + couleur `#C49A5A` pour souligner un mot-clé dans un titre hero.
- **Do** afficher l'illustration en priorité : le ratio image/texte dans une carte doit favoriser l'image (≥60 % de la surface).
- **Do** maintenir le padding bottom `max(80px, env(safe-area-inset-bottom))` sur tout contenu scrollable mobile, pour dégager la bottom nav fixe.
- **Do** écrire les labels d'eyebrow en format `✦ MOT CLÉ` — le symbole ✦ est partie intégrante du système. Limiter à un par page.
- **Do** appliquer `prefers-reduced-motion: reduce` à toutes les animations (fadeUp, float, shimmer, transitions).
- **Do** vérifier le contraste à 4.5:1 minimum pour tout texte corps, notamment le texte muted `#8B7A5A` sur fond ivoire (ratio : ~4.6:1, plancher WCAG AA).

### Don't:
- **Don't** créer une grille de cartes identiques avec icône + titre + texte. L'illustration est le produit — les cartes sans image produit réelle sont interdites.
- **Don't** utiliser de dégradé de texte (`background-clip: text`). La couleur d'emphase, c'est l'or `#C49A5A` en solide.
- **Don't** imiter l'e-commerce générique (style Amazon/Cdiscount) : grilles froides, pas d'illustration, hiérarchie purement fonctionnelle. Ce système est l'inverse : l'illustration d'abord.
- **Don't** reproduire les codes de la boutique islamique traditionnelle : fond vert foncé, arabesque chargée en décoration, texte doré sur foncé. L'identité islamique de Jumua Time est intégrée dans l'illustration, jamais dans le décor.
- **Don't** faire du minimalisme scandinave (blanc total, typographie fine, zéro couleur). La chaleur et la couleur sont volontaires.
- **Don't** introduire un eyebrow uppercase-tracké sur chaque section. Un seul eyebrow par page, sur la section hero ou la section la plus importante. Partout devient nulle part.
- **Don't** utiliser des ombres structurelles au repos sur les cartes ou les sections. L'ombre au repos signifie flottement permanent — ce qui contredit le registre artisanal et planaire de l'atelier.
- **Don't** saturer l'or `#C49A5A` sur tous les textes, tous les titres, tous les liens. Son pouvoir vient de sa rareté.
- **Don't** employer des mots marketing génériques dans le copy : "innovant", "unique", "qualité supérieure". Le copy de Jumua Time est concret, sincère, et parle des illustrations spécifiques.
- **Don't** utiliser `btn-ghost` (outline blanc) sur fond ivoire ou blanc — il est invisible. `btn-ghost` est réservé aux fonds foncés (hero teal, footer).
