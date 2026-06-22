# Voix des Voyageurs

Site officiel de l'association **Voix des Voyageurs** (V.D.V), association loi 1901 basée à
Eragny-sur-Oise. Site statique (HTML/CSS, sans framework front) livré par AbiWeb, avec une
section "Actualités" administrable via Decap CMS.

## Structure

```
index.html              ← page complète (styles inline + sections)
actualites.js            ← affichage des actualités + conversion automatique des liens YouTube
admin/                   ← interface d'administration Decap CMS (admin/index.html + config.yml)
data/actualites/         ← une actualité = un fichier JSON (généré par Decap CMS)
scripts/build-actualites.js ← prebuild Vercel : fusionne data/actualites/*.json → actualites.json
assets/                  ← logo, médias, et assets/uploads/ (images uploadées via le CMS)
```

## Actualités (texte / photos / vidéos)

La section "Actualités" est administrée via Decap CMS (`/admin`), sans toucher au code.
Voir [ACTUALITES-SETUP.md](ACTUALITES-SETUP.md).

## Avant mise en ligne

Voir [CHECKLIST.md](CHECKLIST.md) — contenu, SEO, RGPD/Analytics, technique, livraison.

## Prévisualiser en local

Ouvrir `index.html` directement dans un navigateur, ou servir le dossier avec n'importe quel
serveur statique (ex. `python -m http.server`).