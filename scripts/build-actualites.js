/**
 * Genere, a partir de data/actualites/*.json (alimente par le CMS) :
 *   - actualites.json         : consomme par la page d'accueil (cartes + modal)
 *   - actualites/<slug>/      : une page autonome par actualite, indexable et partageable
 *   - sitemap.xml             : accueil + toutes les actualites
 *   - 404.html                : page d'erreur aux couleurs du site
 *
 * Le modal de la page d'accueil est conserve : les pages dediees s'ajoutent,
 * elles ne le remplacent pas. Elles existent pour que Google puisse indexer
 * chaque actualite et pour qu'un lien partage sur les reseaux ait un apercu.
 */
const fs = require("fs");
const path = require("path");

const RACINE = path.join(__dirname, "..");
const SOURCE_DIR = path.join(RACINE, "data", "actualites");
const OUTPUT_FILE = path.join(RACINE, "actualites.json");
const ACTUS_DIR = path.join(RACINE, "actualites");
const SITEMAP = path.join(RACINE, "sitemap.xml");

const SITE = "https://www.voixdesvoyageurs.fr";

/* ------------------------------------------------------------------ outils */

// Tout ce qui vient du CMS passe par ici avant d'atteindre le HTML genere.
function echapper(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Marqueur interne pour mettre les liens de cote pendant le rendu du gras/italique.
// Un caractere de controle ne peut pas etre saisi dans le CMS : pas de collision
// possible avec un texte reel.
const MARQUEUR = "\u0000";

// Gras et italique. Applique separement pour pouvoir traiter le texte des liens
// sans toucher a leur URL.
function emphase(html) {
  return html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// Espaces multiples, tabulations et espaces insecables.
const ESPACES = new RegExp("[ \\t\\u00a0]+", "g");
// Espace parasite avant une ponctuation ("Ritchy Thibault  , ce 8 Juillet").
const AVANT_PONCTUATION = / +([,.;:!?])/g;

// Les titres saisis dans le CMS arrivent avec des espaces doubles et des espaces
// de fin ("Devenez Benevole ", "Constant Fauveau  et   Aurelie Garand").
// On normalise ici plutot que de demander au client de se relire.
function normaliserTexte(str) {
  return String(str == null ? "" : str)
    .replace(ESPACES, " ")
    .replace(AVANT_PONCTUATION, "$1")
    .trim();
}

function normaliserCorps(str) {
  return String(str == null ? "" : str)
    .split("\n")
    .map((ligne) => ligne.replace(ESPACES, " ").replace(AVANT_PONCTUATION, "$1").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugifier(str) {
  return String(str)
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // retire les diacritiques isoles par NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extraireIdYouTube(url) {
  if (!url) return null;
  const motifs = [
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of motifs) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function dateFr(iso) {
  const d = new Date(iso);
  return isNaN(d)
    ? ""
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function dateIso(iso) {
  const d = new Date(iso);
  return isNaN(d) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

// Meme rendu Markdown minimal que actualites.js, mais cote build.
function rendreMarkdown(md) {
  if (!md) return "";
  return md
    .split(/\n\s*\n/)
    .map((brut) => {
      const bloc = brut.trim();
      if (!bloc) return "";

      if (/^https?:\/\/\S+$/.test(bloc)) {
        const id = extraireIdYouTube(bloc);
        if (id) return embedYouTube(id);
      }

      let html = echapper(bloc);

      // Les liens sont extraits AVANT le gras/italique : sinon une URL contenant
      // des etoiles (https://exemple.fr/a*b*c) se retrouvait coupee par un <em>
      // injecte au milieu du href.
      const liens = [];
      html = html.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, (m, texte, url) => {
        liens.push('<a href="' + url + '" target="_blank" rel="noopener">' + emphase(texte) + "</a>");
        return MARQUEUR + "L" + (liens.length - 1) + MARQUEUR;
      });

      html = emphase(html);
      html = html.replace(new RegExp(MARQUEUR + "L(\\d+)" + MARQUEUR, "g"), (m, i) =>
        liens[i] === undefined ? m : liens[i]
      );
      html = html.replace(/\n/g, "<br>");
      return "<p>" + html + "</p>";
    })
    .join("");
}

function embedYouTube(id) {
  return (
    '<div class="ratio"><iframe src="https://www.youtube.com/embed/' + id + '"' +
    ' title="Video YouTube" loading="lazy" allowfullscreen' +
    ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>'
  );
}

/* --------------------------------------------------------- page actualite */

function gabaritPage(actu) {
  const titre = actu.titre || "Actualite";
  const url = SITE + "/actualites/" + actu.slug + "/";
  const idVideo = extraireIdYouTube(actu.youtube);

  // Premier paragraphe tronque : sert de meta description et de description OG.
  const resume = normaliserTexte((actu.body || "").split(/\n\s*\n/)[0] || titre).slice(0, 160);

  const imageAbs = actu.image
    ? SITE + (actu.image.startsWith("/") ? actu.image : "/" + actu.image)
    : idVideo
    ? "https://img.youtube.com/vi/" + idVideo + "/hqdefault.jpg"
    : SITE + "/assets/logo.jpeg";

  const media = idVideo
    ? embedYouTube(idVideo)
    : actu.image
    ? '<img class="couverture" src="' + echapper(actu.image) + '" alt="' + echapper(titre) +
      '" width="1600" height="900" decoding="async">'
    : "";

  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: titre,
    datePublished: actu.date,
    dateModified: actu.date,
    image: [imageAbs],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "Voix des Voyageurs", url: SITE + "/" },
    publisher: {
      "@type": "Organization",
      name: "Voix des Voyageurs",
      logo: { "@type": "ImageObject", url: SITE + "/assets/logo.jpeg" },
    },
    description: resume,
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<title>${echapper(titre)} — Voix des Voyageurs</title>
<meta name="description" content="${echapper(resume)}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="article">
<meta property="og:title" content="${echapper(titre)}">
<meta property="og:description" content="${echapper(resume)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${echapper(imageAbs)}">
<meta property="article:published_time" content="${echapper(actu.date || "")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${echapper(titre)}">
<meta name="twitter:description" content="${echapper(resume)}">
<meta name="twitter:image" content="${echapper(imageAbs)}">

<script type="application/ld+json">
${JSON.stringify(donneesStructurees, null, 2)}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Spectral:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">

<style>
  :root { --bg:#FCFAF6; --surface:#fff; --text:#1A2735; --muted:#647182; --emerald:#215E42; --border:#E2DDD5; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html { background:var(--bg); font-family:'Public Sans',sans-serif; color:var(--text); font-size:16px; }
  body { line-height:1.6; -webkit-font-smoothing:antialiased; }
  .serif { font-family:'Spectral',serif; }
  a { color:var(--emerald); }

  .skip-link { position:absolute; left:-9999px; top:0; z-index:20; background:var(--emerald); color:#fff; padding:14px 22px; font-weight:600; text-decoration:none; }
  .skip-link:focus { left:0; }

  nav { display:flex; align-items:center; padding-inline:clamp(16px,5vw,32px); height:72px; border-bottom:1px solid var(--border); background:var(--surface); }
  .retour { display:inline-flex; align-items:center; gap:10px; min-height:44px; text-decoration:none; font-family:'Spectral',serif; font-size:16px; font-weight:600; color:var(--text); }
  .retour img { width:34px; height:34px; border-radius:50%; object-fit:cover; }

  main { max-width:760px; margin:0 auto; padding-block:clamp(32px,6vw,56px) 88px; padding-inline:clamp(16px,5vw,32px); }
  .date { font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; }
  h1 { font-family:'Spectral',serif; font-weight:600; font-size:clamp(1.7rem,4.5vw,2.4rem); line-height:1.15; letter-spacing:-.02em; margin-bottom:28px; }
  .couverture, .ratio { width:100%; border-radius:12px; display:block; margin-bottom:28px; }
  /* height:auto est indispensable : sans lui, l'attribut height="900" du <img>
     s'applique comme hauteur CSS et ecrase l'aspect-ratio. */
  .couverture { height:auto; aspect-ratio:16/9; object-fit:cover; }
  .ratio { position:relative; aspect-ratio:16/9; overflow:hidden; background:#000; }
  .ratio iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
  .corps { border-top:1px solid var(--border); padding-top:26px; }
  .corps p { font-size:1rem; line-height:1.75; color:var(--muted); margin-bottom:16px; }
  .corps .ratio { margin-block:22px; }

  .pied { margin-top:44px; padding-top:26px; border-top:1px solid var(--border); }
  .pied a { display:inline-flex; align-items:center; min-height:44px; font-weight:600; text-decoration:none; }
  .pied a:hover { text-decoration:underline; }
</style>
</head>
<body>

<a href="#contenu" class="skip-link">Aller au contenu principal</a>

<nav>
  <a class="retour" href="/">
    <img src="/assets/logo.jpeg" alt="" width="34" height="34" decoding="async">
    Voix des Voyageurs
  </a>
</nav>

<main id="contenu">
  <article>
    <div class="date">${echapper(dateFr(actu.date))}</div>
    <h1 class="serif">${echapper(titre)}</h1>
    ${media}
    <div class="corps">${rendreMarkdown(actu.body)}</div>
  </article>

  <div class="pied">
    <a href="/#actualites">&larr; Toutes les actualit&eacute;s</a>
  </div>
</main>

</body>
</html>
`;
}

/* -------------------------------------------------------------- page 404 */

function gabarit404() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<title>Page introuvable — Voix des Voyageurs</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&family=Spectral:wght@600&display=swap" rel="stylesheet">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  html { background:#FCFAF6; font-family:'Public Sans',sans-serif; color:#1A2735; font-size:16px; }
  body { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px; line-height:1.6; }
  .boite { max-width:520px; text-align:center; }
  img { width:64px; height:64px; border-radius:50%; object-fit:cover; margin-bottom:24px; }
  .code { font-size:12px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#A62B39; margin-bottom:12px; }
  h1 { font-family:'Spectral',serif; font-weight:600; font-size:clamp(1.6rem,5vw,2.1rem); line-height:1.2; margin-bottom:14px; }
  p { color:#647182; margin-bottom:28px; }
  a { display:inline-flex; align-items:center; justify-content:center; min-height:48px; padding-inline:26px; border-radius:9999px; background:#215E42; color:#fff; font-weight:600; text-decoration:none; }
  a:hover { background:#184732; }
</style>
</head>
<body>
  <div class="boite">
    <img src="/assets/logo.jpeg" alt="Logo Voix des Voyageurs" width="64" height="64">
    <div class="code">Erreur 404</div>
    <h1 class="serif">Cette page n'existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.</h1>
    <p>Le lien que vous avez suivi est peut-&ecirc;tre ancien. Vous retrouverez nos actions, notre &eacute;quipe et nos actualit&eacute;s depuis l'accueil.</p>
    <a href="/">Retour &agrave; l'accueil</a>
  </div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ build */

function build() {
  if (!fs.existsSync(SOURCE_DIR)) {
    fs.writeFileSync(OUTPUT_FILE, "[]\n");
    console.log("Aucun dossier data/actualites — actualites.json vide genere.");
    return;
  }

  const fichiers = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".json"));

  const actualites = fichiers.map((fichier) => {
    const brut = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, fichier), "utf-8"));
    const titre = normaliserTexte(brut.titre);
    return {
      ...brut,
      titre,
      body: normaliserCorps(brut.body),
      // Slug tire du titre nettoye ; repli sur le nom de fichier si le titre est vide.
      slug: slugifier(titre) || slugifier(path.basename(fichier, ".json")),
    };
  });

  actualites.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Deux actualites peuvent produire le meme slug : on suffixe pour garder des URL uniques.
  const vus = new Map();
  for (const actu of actualites) {
    const n = vus.get(actu.slug) || 0;
    vus.set(actu.slug, n + 1);
    if (n) actu.slug += "-" + (n + 1);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(actualites, null, 2) + "\n");

  // Regeneration complete : une actualite supprimee dans le CMS doit disparaitre du site.
  fs.rmSync(ACTUS_DIR, { recursive: true, force: true });
  for (const actu of actualites) {
    const dossier = path.join(ACTUS_DIR, actu.slug);
    fs.mkdirSync(dossier, { recursive: true });
    fs.writeFileSync(path.join(dossier, "index.html"), gabaritPage(actu));
  }

  fs.writeFileSync(path.join(RACINE, "404.html"), gabarit404());

  const derniere = actualites.length ? dateIso(actualites[0].date) : dateIso(Date.now());
  const urls = [
    "  <url>\n    <loc>" + SITE + "/</loc>\n    <lastmod>" + derniere +
      "</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>",
    ...actualites.map(
      (a) =>
        "  <url>\n    <loc>" + SITE + "/actualites/" + a.slug + "/</loc>\n    <lastmod>" +
        dateIso(a.date) +
        "</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>"
    ),
  ];
  fs.writeFileSync(
    SITEMAP,
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.join("\n") +
      "\n</urlset>\n"
  );

  console.log(
    actualites.length +
      " actualite(s) : actualites.json, " +
      actualites.length +
      " page(s) dediee(s), sitemap.xml et 404.html generes."
  );
}

build();
