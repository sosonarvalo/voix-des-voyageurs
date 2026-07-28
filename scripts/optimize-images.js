/**
 * Optimise les images de assets/ : redimensionne au-dela de MAX_W et reencode.
 *
 * Tourne au build (Vercel) comme en local. Idempotent : une image deja conforme
 * est laissee telle quelle, donc relancer le script ne degrade jamais la qualite.
 *
 * Les photos arrivent du CMS directement depuis un telephone (4000+ px, plusieurs Mo)
 * alors qu'elles sont affichees dans des vignettes de ~380 px.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Sous Windows, libvips garde un handle sur les fichiers lus depuis un chemin,
// ce qui fait echouer la reecriture en place. On passe donc par des Buffers.
sharp.cache(false);

const MAX_W = 1600;
const QUALITY = 82;
const ASSETS = path.join(__dirname, "..", "assets");
const EXTS = new Set([".jpg", ".jpeg", ".png"]);

// Au-dela, on considere que l'image n'a pas encore ete traitee.
const SEUIL_OCTETS = 400 * 1024;

/*
 * Sans memoire, une image restee au-dessus du seuil apres optimisation serait
 * reencodee a chaque build, et perdrait un peu de qualite a chaque fois.
 * Le manifeste retient la taille obtenue : tant qu'elle n'a pas change,
 * l'image est consideree comme deja traitee. Un reenvoi depuis le CMS modifie
 * la taille, ce qui declenche naturellement un nouveau traitement.
 */
const MANIFESTE = path.join(ASSETS, ".optimized.json");

function lireManifeste() {
  try {
    return JSON.parse(fs.readFileSync(MANIFESTE, "utf8"));
  } catch (e) {
    return {};
  }
}

function lister(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? lister(p) : EXTS.has(path.extname(e.name).toLowerCase()) ? [p] : [];
  });
}

(async () => {
  if (!fs.existsSync(ASSETS)) return;

  const manifeste = lireManifeste();
  let avantTotal = 0;
  let apresTotal = 0;
  let traitees = 0;

  for (const fichier of lister(ASSETS)) {
    const cle = path.relative(ASSETS, fichier).split(path.sep).join("/");
    const source = fs.readFileSync(fichier);
    const avant = source.length;

    // Deja traitee lors d'un build precedent et inchangee depuis.
    if (manifeste[cle] === avant) {
      avantTotal += avant;
      apresTotal += avant;
      continue;
    }

    const meta = await sharp(source).metadata();

    // Rien a faire : deja petite ET deja dans les dimensions cibles.
    if (avant <= SEUIL_OCTETS && meta.width <= MAX_W) {
      manifeste[cle] = avant;
      avantTotal += avant;
      apresTotal += avant;
      continue;
    }

    const png = path.extname(fichier).toLowerCase() === ".png";
    let img = sharp(source).rotate(); // applique l'orientation EXIF avant de la perdre
    if (meta.width > MAX_W) img = img.resize({ width: MAX_W, withoutEnlargement: true });

    const buf = await (png
      ? img.png({ compressionLevel: 9, palette: true }).toBuffer()
      : img.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true }).toBuffer());

    // Garde-fou : ne jamais remplacer une image par une version plus lourde.
    if (buf.length >= avant) {
      manifeste[cle] = avant;
      avantTotal += avant;
      apresTotal += avant;
      continue;
    }

    fs.writeFileSync(fichier, buf);
    manifeste[cle] = buf.length;
    avantTotal += avant;
    apresTotal += buf.length;
    traitees++;

    const nom = path.relative(ASSETS, fichier);
    console.log(
      `  ${nom} : ${(avant / 1024).toFixed(0)} Ko -> ${(buf.length / 1024).toFixed(0)} Ko` +
        ` (-${(100 * (1 - buf.length / avant)).toFixed(0)} %)`
    );
  }

  // Ne conserve que les fichiers encore presents, sinon le manifeste enfle indefiniment.
  const presents = new Set(
    lister(ASSETS).map((f) => path.relative(ASSETS, f).split(path.sep).join("/"))
  );
  const propre = {};
  for (const k of Object.keys(manifeste).sort()) if (presents.has(k)) propre[k] = manifeste[k];
  fs.writeFileSync(MANIFESTE, JSON.stringify(propre, null, 2) + "\n");

  const mo = (n) => (n / 1048576).toFixed(2);
  console.log(
    traitees
      ? `${traitees} image(s) optimisee(s) : ${mo(avantTotal)} Mo -> ${mo(apresTotal)} Mo`
      : `Aucune image a optimiser (${mo(apresTotal)} Mo au total).`
  );
})().catch((e) => {
  console.error("Echec de l'optimisation des images :", e.message);
  process.exit(1);
});
