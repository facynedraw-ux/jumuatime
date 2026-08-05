# Récap session — 3 août 2026

---

## BUGS CORRIGÉS ✅

### Décalages de noms (colonnes/tables) — cause de la plupart des bugs du jour
La documentation (CLAUDE.md, DESIGN.md, PRODUCT.md) contenait des noms obsolètes qui ne correspondent plus au code réel. Vérifiés et corrigés dans cette session :

| Documenté (obsolète) | Réel (en base) |
|---|---|
| Table `ressources` | Table `resources` (anglais, sans accent) |
| Colonne `categorie_boutique` | Colonne `category` |
| Valeurs enum `ressources-digitales/affiches/objets/cadeaux` | Valeurs réelles : `enfants`, `spiritualite`, `decoration`, `cadeaux` (+ `__physique__` en filtre technique côté front, pas en base) |
| Colonne `cover_url` (utilisée dans le code) | Colonne réelle : `preview_url` |

**⚠️ CLAUDE.md doit être mis à jour avec ces vrais noms — pas encore fait.**

### Colonnes ajoutées à la table `resources`
- `gelato_product_id` (text, nullable) — ID produit Gelato pour les produits physiques
- `format` (text, nullable)

### Bug bloquant la page boutique (ressources.html)
La requête `.select('id, slug, title, subtitle, cover_url, price, category, type_produit')` demandait deux colonnes inexistantes (`subtitle`, `cover_url`) → erreur 400 → aucune ressource ne s'affichait, jamais. Corrigé :
```js
.select('id, slug, title, cover_url, price, category, type_produit')
// puis cover_url → preview_url
```
Idem pour l'affichage de l'image dans `renderGrid()` (`r.cover_url` → `r.preview_url`).

### Bug d'affichage image sur les fiches produit
- `ressource.html` (fiche produit numérique, via `?slug=`) : `cover_url` → `preview_url` corrigé
- `produit-physique.html` (fiche produit physique, via Gelato) : idem, `cover_url` → `preview_url` corrigé

### URL propre sur produit-physique.html
Avant : `produit-physique.html?id=UUID` (illisible, pas partageable proprement)
Après : `produit-physique.html?slug=...` (même logique que ressource.html)
Modifié dans 2 endroits :
1. `ressources.html` — génération du lien dans `renderGrid()` : `produit-physique.html?id=${r.id}` → `produit-physique.html?slug=${r.slug}`
2. `produit-physique.html` — lecture du paramètre : `params.get('id')` + `.eq('id', produitId)` → `params.get('slug')` + `.eq('slug', produitSlug)`

### Formulaire admin-ressources
- Ajout des champs "ID Produit Gelato (physique)" et "Format" au formulaire (déjà en place)
- ⚠️ Toujours à faire : les champs Âge min/max, Nombre de pages, Thèmes (Ramadan, Prophètes, etc.) sont des reliquats de l'ancien projet Maktaba Tour, jamais retirés du formulaire

---

## DÉCOUVERTE IMPORTANTE — reliquats du pivot Maktaba Tour → Jumuatime

Le projet a été pensé à l'origine comme un catalogue de livres jeunesse islamiques avec avis communautaires ("Maktaba Tour" / positionnement "La Libraire de Confiance", palette rose pivoine). Il a évolué vers la boutique de créations actuelle (palette teal/gold/crème). Ce pivot n'a jamais été nettoyé complètement :

- **DESIGN.md et PRODUCT.md** décrivent l'ancien projet (obsolètes, à archiver/remplacer)
- **Deux interfaces admin coexistent** : `/admin` (propre, 3 items) et `/admin-ressources` (reliquat, 8 items dont Livres/Soumissions/Avis/Annuaire/Thèmes)
- **Tables Supabase reliquats** : `books`, `authors`, `publishers`, `illustrators`, `illustrator_portfolio`, `submissions`, `themes`, `reviews`, `reading_list`, `purchases_*`
- Maktaba Tour est un **projet définitivement abandonné** (confirmé par Facyne) → peut être nettoyé sans risque, après vérification qu'aucune vraie donnée client n'y est stockée

**Reste à faire : nettoyage complet une fois l'accès Claude Code retrouvé.**

---

## DÉCISIONS STRATÉGIQUES PRISES

### Marque boutique : Jumuatime (pas Facyne)
Les créations à thème familial/spirituel musulman (calligraphie, spiritualité) sont vendues sous **Jumuatime**, pas Facyne. Nom de boutique disponible tel quel (pas besoin de suffixe Shop/Creations).

### Etsy : abandonné pour l'instant
Comparé aux frais (installation ~16€, ~15-20% de commission cumulée par vente) vs Stripe direct sur jumuatime.com (~1,5-2%), et vu la contrainte de temps de Facyne, la priorité reste 100% sur jumuatime.com. Etsy pourra être reconsidéré plus tard comme canal de découverte complémentaire, une fois le site personnel bien rodé.

### Grille tarifaire revue à la hausse
Après étude comparative marché (Etsy niche islamique : 8-19$/7-17€ ; concurrent Maryam's Market en prints physiques premium : ~19-25€), nouveaux prix :

| Produit | Prix |
|---|---|
| Affiche digitale (1 design) | 11,90 € |
| Poster alphabet arabe | 12,90 € |
| Carte simple (unité) | 4,50 € |
| Set de cartes | 12,90 € |
| Bundle 4 saisons | 34,90 € |
| Carte/affiche physique (Gelato, ex: At-Tin) | 12,00 € (déjà en ligne) |
| Mugs | à calculer selon coût de revient Gelato |

### Fulfillment physique : Gelato (pas de PDF téléchargeable pour les affiches/cartes)
Qualité d'impression jugée insuffisante en auto-impression. Formats fixes pour le lancement :
- Affiches : A4 uniquement
- Cartes : format carré OU rectangulaire = deux fiches produit séparées (designs adaptés, pas une simple variante)

Compte Gelato créé, clé API générée, premier produit connecté (poster A4 "La figue"/At-Tin, ID `9375c91b-67e0-4568-ac45-a2f8f76226a7`).

**À faire plus tard : galerie multi-images sur les fiches produit**, en utilisant les mockups déjà générés par Gelato (actuellement une seule image `preview_url` par fiche) — nécessite nouvelle colonne (array d'URLs), modif formulaire admin (upload multiple), modif affichage (carrousel/galerie) sur produit-physique.html.

---

## CATALOGUE PRODUITS — état des lieux

### En ligne et fonctionnel ✅
- **Carte Illustrée At-Tin (Figue)** — calligraphie arabe aquarelle, 12,00 €, physique via Gelato, catégorie `decoration`

### Fiches prêtes (textes rédigés), pas encore en ligne
- Lettre arabe ض (Dad) — calligraphie décorative colorée
- Poster alphabet arabe (illustré, palette rafraîchie rose/bleu par Facyne)
- Femme hijab sous le soleil (à rédiger si besoin)
- Mugs collection saisons (hiver/automne/printemps — été à créer pour compléter le cycle complet)
- Bundle "Coffret 4 saisons" (affiches complètes : hiver/automne/printemps/été)

### Idée notée pour plus tard
Décliner la lettre ض en **série alphabet arabe complet** (26 lettres) → vendable à l'unité (prénoms personnalisés, très demandé) ou en bundle complet.

### Visuels identifiés, disponibles
- 4 saisons complètes en affiches (chitaa/hiver, kharif/automne, rabii/printemps, sayf/été)
- Mugs 3 saisons (manque été)
- Carte "La figue" en version carte (différent du format affiche)

---

## À FAIRE — prochaine session

### Technique (nécessite accès Claude Code, actuellement indisponible — abonnement Pro suspendu par Facyne)
- [ ] Mettre à jour CLAUDE.md avec les vrais noms de colonnes/tables (voir tableau en haut)
- [ ] Ajouter bouton "✕" pour retirer un fichier déjà uploadé dans le formulaire admin (image, PDF, PDF aperçu) — code déjà préparé, pas encore implémenté par prudence (étapes trop nombreuses d'un coup)
- [ ] Nettoyer les reliquats Maktaba Tour (tables Supabase + interface admin dupliquée + DESIGN.md/PRODUCT.md obsolètes)
- [ ] Retirer les champs obsolètes du formulaire admin (Âge min/max, Nombre de pages, Thèmes)
- [ ] Compléter l'intégration Gelato (commande automatique déclenchée au paiement Stripe, gestion webhook statut/suivi colis, email de confirmation physique)
- [ ] Tester le flow complet d'achat (numérique ET physique) avant toute communication publique
- [ ] Galerie multi-images sur les fiches produit (mockups Gelato)

### Produits à ajouter en boutique
- [ ] Lettre ض (Dad)
- [ ] Poster alphabet arabe
- [ ] Mugs collection saisons (créer visuel été pour compléter)
- [ ] Bundle 4 saisons
- [ ] Cartes (formats carré + rectangulaire séparés)

### Marketing / Pinterest
- [ ] Faire pointer les épingles Pinterest vers les bonnes fiches Jumuatime une fois en ligne
- [ ] Rédiger bandeau + bio + page "À propos" Etsy → **non applicable** (Etsy abandonné), à adapter plutôt pour jumuatime.com si pas déjà fait

---

## REPOS (rappel)

| Projet | Repo local | URL |
|---|---|---|
| Jumua Time | `C:\Users\conta\OneDrive\Documents\GitHub\maktaba-tour` | jumuatime.com |
| facyne.com | `C:\Users\conta\OneDrive\Documents\GitHub\facyne-site` | facyne.com |
| Tilawa Tour | `D:\tilawa-deploy` | tilawatour.com |

**Note session actuelle :** sans accès Claude Code, les corrections ont été faites directement via l'éditeur de fichiers GitHub (icône crayon sur chaque fichier) + Supabase Table Editor pour les données. Fonctionne bien pour des corrections ciblées, mais plus laborieux pour des changements structurels (d'où plusieurs tâches reportées à la prochaine session avec accès Claude Code retrouvé).
