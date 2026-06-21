# Voix des Voyageurs

Site officiel de l'association **Voix des Voyageurs** (V.D.V), association loi 1901 basée à
Eragny-sur-Oise. Site statique (HTML/CSS/JS, sans build ni dépendances) livré par AbiWeb.

## Structure

```
index.html          ← squelette de la page + styles
site-content.js      ← tout le contenu du site (textes, bureau, missions, contact, SEO...)
site-engine.js/.css  ← moteur partagé (SEO, RGPD/cookies, mentions légales, Google Analytics)
assets/              ← logo et médias (déposer logo.png ici)
```

## Mettre à jour le contenu

Toutes les informations affichées sur le site (textes, bureau, missions, coordonnées, lien
d'adhésion HelloAsso, réseaux sociaux) se modifient dans `site-content.js`, sans toucher au reste
du code.

## Actualités (photos / vidéos)

La section "Actualités" est alimentée par un Google Sheet publié en CSV, modifiable par
l'association elle-même sans toucher au code. Voir [ACTUALITES-SETUP.md](ACTUALITES-SETUP.md).

## Avant mise en ligne

Voir [CHECKLIST.md](CHECKLIST.md) — contenu, SEO, RGPD/Analytics, technique, livraison.

## Prévisualiser en local

Ouvrir `index.html` directement dans un navigateur, ou servir le dossier avec n'importe quel
serveur statique (ex. `python -m http.server`).