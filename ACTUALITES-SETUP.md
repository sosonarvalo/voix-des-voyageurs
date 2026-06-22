# Mise en place des actualités (texte / photo / vidéo) via Decap CMS

Le client publie lui-même ses actualités depuis une interface d'administration en ligne — aucun
accès au code, aucune base de données à gérer côté AbiWeb.

## 1. Publier une actualité

1. Se rendre sur `https://voix-des-voyageurs.vercel.app/admin/`
2. Se connecter avec son compte GitHub (autorisé sur ce dépôt)
3. Cliquer sur "Actualités" → "Nouvelle Actualité"
4. Remplir les champs :
   - **Titre**
   - **Date**
   - **Image d'illustration** (optionnel) — glisser-déposer un fichier
   - **Lien YouTube** (optionnel) — coller l'adresse complète de la vidéo
     (ex. `https://www.youtube.com/watch?v=...` ou `https://youtu.be/...`).
     La vidéo s'affiche automatiquement, pas besoin de coller un code d'intégration.
   - **Contenu** — le texte de l'actualité. Si un lien YouTube est collé seul sur sa
     propre ligne dans ce texte, il sera lui aussi automatiquement transformé en vidéo.
5. Cliquer sur "Publier" — le site se met à jour automatiquement (1-2 minutes).

## 2. Mise en place technique (AbiWeb, une seule fois)

Decap CMS s'authentifie via GitHub, ce qui nécessite un petit serveur OAuth (GitHub ne fait pas
confiance à un site purement statique). On utilise [`ublabs/netlify-cms-oauth`](https://github.com/ublabs/netlify-cms-oauth),
un projet open-source dédié à ça, déployé séparément sur Vercel en un clic — il ne touche pas au
code du site principal.

1. Cliquer sur le bouton "Deploy" en haut du [README de ublabs/netlify-cms-oauth](https://github.com/ublabs/netlify-cms-oauth)
   (ou directement [ce lien de déploiement](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fublabs%2Fnetlify-cms-oauth)).
   Cela crée un nouveau projet Vercel séparé (ex. `netlify-cms-oauth.vercel.app`).
2. Lors de l'import, Vercel demande 4 variables d'environnement. Pour le moment, mettre une
   valeur quelconque partout (on corrigera `OAUTH_GITHUB_*` à l'étape suivante) :
   - `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET` (à corriger après l'étape 3)
   - `OAUTH_GITLAB_CLIENT_ID`, `OAUTH_GITLAB_CLIENT_SECRET` (non utilisées ici, peuvent rester
     à n'importe quelle valeur, ex. `unused`)
3. Noter l'URL du projet déployé à l'étape 1, puis créer une GitHub OAuth App
   (`https://github.com/settings/developers` → "New OAuth App") avec :
   - Homepage URL : l'URL du site principal
   - Authorization callback URL : `<url-du-projet-oauth>/callback`
   - Noter le **Client ID**, puis générer et noter le **Client Secret**.
4. Sur le projet Vercel de l'étape 1 (Settings → Environment Variables), mettre à jour
   `OAUTH_GITHUB_CLIENT_ID` et `OAUTH_GITHUB_CLIENT_SECRET` avec les valeurs de l'étape 3, puis
   redéployer (Deployments → "Redeploy").
5. Dans `admin/config.yml` (sur le dépôt du site), remplacer le placeholder `base_url` par
   l'URL du projet OAuth notée à l'étape 1, puis commit/push.

## 3. Transfert complet au client (fin de mission AbiWeb)

Trois éléments sont répartis sur deux comptes différents (GitHub + Vercel) et doivent être
transférés séparément — Vercel ne peut pas "tout copier" en un clic.

1. **Dépôt GitHub** (`Abudara25/voix-des-voyageurs`) : Settings → Danger Zone →
   "Transfer ownership" → indiquer le compte/l'organisation GitHub du client. Conserve tout
   l'historique, les commits Decap CMS, etc.
2. **Projet Vercel du site** (`voix-des-voyageurs`) : Project Settings → Transfer Project →
   choisir le compte Vercel du client. Le client doit accepter le transfert depuis son tableau de
   bord. À faire **après** le transfert GitHub, pour que Vercel retrouve bien le dépôt.
3. **Projet Vercel de l'OAuth** (`voix-des-voyageurs-cms-oauth`) : même procédure (Transfer
   Project).
4. **GitHub OAuth App** : elle ne peut pas être transférée — elle appartient au compte qui l'a
   créée. Une fois que le client possède le dépôt, recréer une OAuth App
   (`https://github.com/settings/developers`) **depuis son propre compte GitHub**, avec le même
   "Authorization callback URL" (`<url-du-projet-oauth>/callback`), puis mettre à jour
   `OAUTH_GITHUB_CLIENT_ID` / `OAUTH_GITHUB_CLIENT_SECRET` sur le projet OAuth (étape 4 de la
   section précédente) avec les nouvelles valeurs, et redéployer.
5. Vérifier que le client a bien un compte GitHub avec accès en écriture au dépôt (lui-même, ou
   un collaborateur qu'il désigne) — c'est ce compte qui sert à se connecter sur `/admin`.

Une fois ces 4 étapes faites, AbiWeb n'a plus aucune dépendance technique sur le projet.

## Comment ça marche techniquement

- Chaque actualité est un fichier JSON dans `data/actualites/`, créé/modifié par Decap CMS via
  un commit direct sur la branche `main`.
- Au moment du déploiement, Vercel exécute `npm run build`, qui lance
  `scripts/build-actualites.js` : ce script lit tous les fichiers de `data/actualites/`, les
  trie par date et génère un unique `actualites.json` à la racine.
- `actualites.js`, chargé sur la page, récupère ce fichier et affiche les actualités (avec
  conversion automatique des liens YouTube en vidéo intégrée).
