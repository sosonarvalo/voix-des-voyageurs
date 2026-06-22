(function () {
  "use strict";

  // Renseigner un ID Google Analytics ici (ex. "G-XXXXXXXXXX") pour l'activer
  // après consentement. Tant que ce champ est vide, aucun script de mesure
  // d'audience n'est chargé, que le visiteur accepte ou non.
  var GA_MEASUREMENT_ID = "";

  function loadAnalytics() {
    if (!GA_MEASUREMENT_ID) return;

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
  }

  function init() {
    var banner = document.getElementById("cookie-banner");
    if (!banner) return;

    var consent = localStorage.getItem("cookie-consent");

    if (consent === "accepted") {
      loadAnalytics();
      return;
    }
    if (consent === "refused") return;

    banner.style.display = "flex";

    document.getElementById("cookie-accept").addEventListener("click", function () {
      localStorage.setItem("cookie-consent", "accepted");
      banner.style.display = "none";
      loadAnalytics();
    });
    document.getElementById("cookie-refuse").addEventListener("click", function () {
      localStorage.setItem("cookie-consent", "refused");
      banner.style.display = "none";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
