// ============================================================
// site-content.js — SOURCE DE VÉRITÉ DU SITE CLIENT
// Template Association Caritative / Aide & Plaidoyer v1 — AbiWeb
// ============================================================

window.SITE_CONTENT_DEFAULTS = {

  association: {
    nom:             "Voix des Voyageurs",
    sigle:           "V.D.V",
    domaine:         "Défense des droits des gens du voyage",
    accroche:        "Écouter · Défendre · Accompagner · Transmettre",
    ville:           "Eragny-sur-Oise",
    annee:           "2026",
    couleurPrimaire: "#dc2626",   // rouge vif — repris de la roue du logo
    logo:            "",          // déposer le fichier dans assets/logo.png puis renseigner "assets/logo.png"
  },

  contact: {
    email:     "[EMAIL]",   // non communiqué par le client — à demander
    telephone: "[TEL]",     // non communiqué par le client — à demander
    adresse:   "105 avenue Roger Guichard, 95610 Eragny-sur-Oise",
  },

  presentation: {
    texte: "Voix des Voyageurs (V.D.V) est une association loi 1901 qui agit, dans l'intérêt général, pour l'accès au droit commun des populations d'origine Gens du Voyage et tsigane, ainsi qu'à leurs côtés et aux côtés des autres acteurs de la société civile. Notre action s'inscrit en dehors de toute allégeance partisane ou confessionnelle, dans le respect des valeurs républicaines, de la laïcité et de la dignité de chacun et chacune.\n\nNous défendons la mémoire, les intérêts moraux et l'honneur des déportés Gens du Voyage et tsiganes contre toute apologie ou contestation de génocide et de crimes contre l'humanité, et nous œuvrons à transmettre leur histoire et leur culture. Ensemble, pour les droits, l'avenir et la dignité des voyageurs.",
  },

  // Cartes "Nos missions" / domaines d'action.
  // Couleurs reprises du logo (rouge de la roue, bleu de l'arc, vert des collines), en alternance comme sur le flyer.
  missions: [
    { icone: "📄", couleur: "#2563eb", titre: "Aide administrative", description: "Dossiers, papiers, CAF, RSA, santé, logement, etc." },
    { icone: "⚖️", couleur: "#16a34a", titre: "Défense des droits", description: "Soutien juridique, représentation, accès aux droits." },
    { icone: "🚐", couleur: "#dc2626", titre: "Terrains & aires d'accueil", description: "Accompagnement pour l'accès et l'amélioration des conditions d'accueil." },
    { icone: "📚", couleur: "#2563eb", titre: "Éducation & formation", description: "Soutien scolaire, alphabétisation, mémoire et culture des gens du voyage." },
    { icone: "🚗", couleur: "#16a34a", titre: "ASR & permis de conduire", description: "Cours ASR avec le GRETA pour accéder au permis de conduire." },
    { icone: "🤝", couleur: "#dc2626", titre: "Accompagnement social", description: "Écoute, orientation, insertion, projets personnalisés." },
  ],

  // Le bureau / les personnes qui gèrent l'association
  bureau: [
    {
      nom: "Gilles Dumesnil",
      role: "Président",
      bio: "Moniteur auto-école, entraîneur de boxe et comédien, issu de la communauté des gens du voyage. « Je connais les réalités, les difficultés mais aussi les richesses de notre mode de vie. À travers Voix des Voyageurs, je souhaite défendre nos droits, favoriser le dialogue et apporter une aide concrète à ceux qui en ont besoin. »",
      photo: "",
    },
    {
      nom: "Constant Fauveau",
      role: "Vice-président",
      bio: "Voyageur Yéniche de Pierrelaye, ancien vice-président de l'ADVOG aujourd'hui fermée. « Je poursuis mon engagement avec Voix des Voyageurs. Homme de terrain, je reste au plus près des voyageurs et de leurs préoccupations. Mon engagement vient de ma famille, notamment mon père et mon oncle, déportés au camp de Montreuil-Bellay ; je poursuis le militantisme en leur mémoire. »",
      photo: "",
    },
    {
      nom: "Robert Wagner",
      role: "Trésorier",
      bio: "Artisan à son compte dans le bâtiment, issu de la communauté des gens du voyage. « J'ai toujours accordé une grande importance au sérieux, à l'honnêteté et à l'entraide. En rejoignant Voix des Voyageurs, j'ai souhaité mettre mon énergie et mon engagement au service de notre communauté afin d'apporter une aide concrète à ceux qui en ont besoin. »",
      photo: "",
    },
    {
      nom: "Sonny Brion",
      role: "Porte-parole",
      bio: "Gérant d'une SARL de démolition, premier secrétaire du Parti Socialiste à Eragny-sur-Oise. « Notre communauté est en plein combat historique pour nos droits à exister et voyager en harmonie avec les gadjé. Mon engagement va du devoir de mémoire à l'accompagnement de notre communauté dans l'éducation et l'apprentissage de nos valeurs en adéquation avec celles de la République. »",
      photo: "",
    },
  ],

  lienAdhesion:  "",   // lien HelloAsso (adhésion / don) — à venir, le client n'a pas encore créé sa page
  lienFacebook:  "",
  lienInstagram: "",

  // Actualités (photos / vidéos) alimentées par un Google Sheet publié en CSV.
  // Voir ACTUALITES-SETUP.md pour la mise en place côté client.
  actualites: {
    sheetUrl: "",
  },

  seo: {
    titre:       "Voix des Voyageurs — Défense des droits des gens du voyage à Eragny-sur-Oise",
    description: "Association loi 1901 (V.D.V) : défense des droits, aide administrative et juridique, éducation et accompagnement social des gens du voyage à Eragny-sur-Oise.",
    motsCles:    "gens du voyage, association, droits, aide administrative, Eragny-sur-Oise, tsigane, médiation",
    googleAnalyticsId: "",   // Ex: "G-XXXXXXXXXX"
    googleSearchConsole: "", // Ex: "xxxxxxxxxxxxxxxxxxxxx" (meta tag verification)
  },

  mentionsLegales: {
    editeur:   "Voix des Voyageurs",
    adresse:   "105 avenue Roger Guichard, 95610 Eragny-sur-Oise",
    hebergeur: "[Ex: Vercel Inc. / Cloudflare, Inc.]",
    siret:     "", // pas de numéro RNA/SIRET communiqué — à demander si l'association en a un
  },
};

window.SITE_CONTENT_URL = "";

window.loadSiteContent = async function () {
  if (window.SITE_CONTENT_URL) {
    try {
      const res = await fetch(window.SITE_CONTENT_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("blob indisponible");
      const data = await res.json();
      return { ...window.SITE_CONTENT_DEFAULTS, ...data };
    } catch (e) {
      console.warn("Contenu distant indisponible, valeurs par défaut.", e);
    }
  }
  return window.SITE_CONTENT_DEFAULTS;
};