(function () {
  "use strict";

  // Reconnaît youtube.com/watch?v=, youtu.be/, youtube.com/embed/ et /shorts/,
  // avec ou sans www., http ou https, paramètres supplémentaires (&t=, &list=...).
  function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const re of patterns) {
      const match = url.match(re);
      if (match) return match[1];
    }
    return null;
  }

  function buildYoutubeEmbed(id) {
    return (
      '<div style="position:relative; width:100%; aspect-ratio:16/9; border-radius:9px; overflow:hidden; background:#000">' +
      '<iframe src="https://www.youtube.com/embed/' + id + '" title="Vidéo YouTube" loading="lazy" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ' +
      'style="position:absolute; top:0; left:0; width:100%; height:100%; border:0"></iframe>' +
      "</div>"
    );
  }

  // Miniature YouTube pour les cartes — évite le conflit de clic avec l'iframe.
  // La vraie vidéo est jouée dans le modal.
  function buildYoutubeThumbnail(id) {
    return (
      '<div style="position:relative; width:100%; aspect-ratio:16/9; border-radius:9px; overflow:hidden; background:#000">' +
      '<img src="https://img.youtube.com/vi/' + id + '/hqdefault.jpg" alt="Miniature vidéo" style="width:100%; height:100%; object-fit:cover; display:block">' +
      '<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.22)">' +
      '<div style="width:52px; height:52px; background:rgba(255,255,255,0.93); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,0,0,0.18)">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="#215E42"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
      '</div></div></div>'
    );
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  // Rendu Markdown volontairement minimal (paragraphes, gras, italique, liens) :
  // pas de dépendance externe sur ce site statique sans build front.
  // Sécurité vidéo n°2 : un paragraphe contenant uniquement un lien YouTube brut
  // est automatiquement converti en iframe, sans que le client ait à utiliser
  // le champ dédié.
  function renderMarkdownLite(markdown) {
    if (!markdown) return "";
    const blocks = markdown.split(/\n\s*\n/);

    return blocks
      .map((rawBlock) => {
        const block = rawBlock.trim();
        if (!block) return "";

        if (/^https?:\/\/\S+$/.test(block)) {
          const id = extractYouTubeId(block);
          if (id) return buildYoutubeEmbed(id);
        }

        let html = escapeHtml(block);
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
        html = html.replace(
          /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>'
        );
        html = html.replace(/\n/g, "<br>");
        return '<p style="margin:0 0 14px; font-size:0.95rem; line-height:1.7; color:#647182">' + html + "</p>";
      })
      .join("");
  }

  function formatDateFr(iso) {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  }

  // Ne garde que le premier paragraphe pour la carte. Le reste s'affiche dans le modal.
  function splitBodyPreview(markdown) {
    const blocks = (markdown || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    return {
      preview: blocks.slice(0, 1).join("\n\n"),
      hasMore: blocks.length > 1,
    };
  }

  // --- Modal ---
  var modalEl = null;
  var modalBodyEl = null;

  function injectModal() {
    modalEl = document.createElement("div");
    modalEl.id = "actu-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-label", "Actualité complète");
    modalEl.style.cssText =
      "display:none; position:fixed; inset:0; z-index:500; overflow-y:auto; padding:24px 16px;";

    modalEl.innerHTML =
      '<div id="actu-modal-backdrop" style="position:fixed; inset:0; background:rgba(18,29,43,0.78); backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px)"></div>' +
      '<div id="actu-modal-inner" style="position:relative; background:#FCFAF6; border-radius:20px; max-width:720px; width:100%; margin:40px auto; padding:32px 28px 44px; box-shadow:0 24px 64px -12px rgba(26,39,53,.3)">' +
        '<button id="actu-modal-close" aria-label="Fermer" style="position:absolute; top:16px; right:16px; background:#F3EFE6; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#1A2735; flex-shrink:0; transition:background 0.2s">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
        '</button>' +
        '<div id="actu-modal-body"></div>' +
      '</div>';

    document.body.appendChild(modalEl);
    modalBodyEl = document.getElementById("actu-modal-body");

    document.getElementById("actu-modal-backdrop").addEventListener("click", closeModal);
    document.getElementById("actu-modal-close").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function openModal(actu) {
    var dedicatedVideoId = extractYouTubeId(actu.youtube);
    var media = dedicatedVideoId
      ? '<div style="margin-bottom:24px">' + buildYoutubeEmbed(dedicatedVideoId) + "</div>"
      : actu.image
      ? '<img src="' + escapeHtml(actu.image) + '" alt="' + escapeHtml(actu.titre || "") +
        '" style="width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:12px; display:block; margin-bottom:24px">'
      : "";

    modalBodyEl.innerHTML =
      media +
      '<div style="font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#647182; margin-bottom:10px">' +
      formatDateFr(actu.date) +
      "</div>" +
      '<h2 style="font-family:\'Spectral\',serif; font-size:clamp(1.4rem,3vw,1.85rem); font-weight:600; color:#1A2735; margin:0 0 20px; line-height:1.15; letter-spacing:-0.02em">' +
      escapeHtml(actu.titre || "") +
      "</h2>" +
      '<div style="border-top:1px solid #E2DDD5; padding-top:20px">' +
      renderMarkdownLite(actu.body) +
      "</div>";

    modalEl.style.display = "block";
    document.body.style.overflow = "hidden";
    modalEl.scrollTop = 0;
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
    document.body.style.overflow = "";
  }

  // --- Cartes ---
  function renderActuCard(actu, index) {
    var dedicatedVideoId = extractYouTubeId(actu.youtube);

    // Miniature en carte, embed complet dans le modal
    var media = dedicatedVideoId
      ? buildYoutubeThumbnail(dedicatedVideoId)
      : actu.image
      ? '<img src="' + escapeHtml(actu.image) + '" alt="' + escapeHtml(actu.titre || "") +
        '" style="width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:9px; display:block">'
      : "";

    var { preview, hasMore } = splitBodyPreview(actu.body);

    return (
      '<div class="bento-card" data-actu-index="' + index + '" style="cursor:pointer; user-select:none">' +
      media +
      '<div style="font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#647182">' +
      formatDateFr(actu.date) +
      "</div>" +
      '<h3 class="serif" style="font-size:19px; font-weight:600; color:#1A2735; margin:0">' +
      escapeHtml(actu.titre || "") +
      "</h3>" +
      "<div>" + renderMarkdownLite(preview) + "</div>" +
      (hasMore
        ? '<span style="font-size:13px; font-weight:600; color:#215E42; text-decoration:underline">Lire la suite →</span>'
        : "") +
      "</div>"
    );
  }

  async function initActualites() {
    const grid = document.getElementById("actualites-grid");
    const empty = document.getElementById("actualites-empty");
    if (!grid) return;

    injectModal();

    try {
      const res = await fetch("actualites.json", { cache: "no-store" });
      if (!res.ok) throw new Error("actualites.json indisponible");
      const actualites = await res.json();

      if (!Array.isArray(actualites) || actualites.length === 0) return;

      grid.innerHTML = actualites.map((actu, i) => renderActuCard(actu, i)).join("");
      grid.style.display = "grid";
      if (empty) empty.style.display = "none";

      grid.addEventListener("click", function (e) {
        var card = e.target.closest("[data-actu-index]");
        if (!card) return;
        var index = parseInt(card.dataset.actuIndex, 10);
        if (!isNaN(index) && actualites[index]) {
          openModal(actualites[index]);
        }
      });
    } catch (err) {
      console.warn("Actualités indisponibles :", err);
    }
  }

  document.addEventListener("DOMContentLoaded", initActualites);
})();
