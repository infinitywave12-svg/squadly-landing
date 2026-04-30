// squadly — waitlist landing page script

// ------------------------------------------------------------
// CONFIG — à brancher sur ton backend de waitlist le moment venu
//   - Beehiiv : https://www.beehiiv.com (recommandé : free tier 2500 subs)
//   - Tally :   https://tally.so       (alternative gratuite)
//   - Resend + simple Cloudflare Worker (custom)
// ------------------------------------------------------------
const WAITLIST_ENDPOINT = ""; // ← REMPLACE avec l'endpoint Beehiiv ou Tally
const COUNTER_KEY = "squadly_signup_count_local"; // dev-only fallback

// ------------------------------------------------------------
// SIGNUP HANDLER
// ------------------------------------------------------------
const form = document.getElementById("signup");
const msgOk = document.getElementById("msg-ok");
const msgErr = document.getElementById("msg-err");
const counterEl = document.getElementById("counter");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgOk.hidden = true; msgErr.hidden = true;

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    // Validation rapide côté client
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      msgErr.textContent = "Email invalide.";
      msgErr.hidden = false;
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Inscription...";

    try {
      if (WAITLIST_ENDPOINT) {
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Server error");
      } else {
        // Mode dev : log local. À remplacer en prod.
        console.log("[squadly] Signup payload (no backend configured):", payload);
        await new Promise(r => setTimeout(r, 600));
      }

      // Track conversion
      if (window.posthog) window.posthog.capture("waitlist_signup", payload);
      if (window.plausible) window.plausible("WaitlistSignup");

      // Compteur local pour démo (à remplacer par appel API en prod)
      const current = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
      localStorage.setItem(COUNTER_KEY, String(current + 1));
      updateCounter();

      msgOk.hidden = false;
      form.reset();
      btn.textContent = "✓ Inscrit";

      // Reset bouton après 3s
      setTimeout(() => { btn.disabled = false; btn.textContent = "Je veux la beta"; }, 3000);

    } catch (err) {
      msgErr.textContent = "Petit souci, réessaie ?";
      msgErr.hidden = false;
      btn.disabled = false;
      btn.textContent = "Je veux la beta";
    }
  });
}

// ------------------------------------------------------------
// COUNTER (à brancher sur backend en prod — ici fallback local)
// ------------------------------------------------------------
function updateCounter() {
  if (!counterEl) return;
  // En prod : fetch GET /waitlist/count → mettre à jour
  const local = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
  // Affichage : ajoute un baseline pour donner de la crédibilité
  // (à remplacer par vrai compteur backend dès que dispo)
  const display = local; // ou : 127 + local pour amorcer
  counterEl.textContent = display.toLocaleString("fr-FR");
}
updateCounter();

// ------------------------------------------------------------
// SMOOTH SCROLL FALLBACK pour navigateurs sans CSS scroll-behavior
// ------------------------------------------------------------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

// ------------------------------------------------------------
// PostHog stub (à remplacer par snippet officiel)
// ------------------------------------------------------------
// Pour activer : https://posthog.com/docs/getting-started/install
// 1. Crée un compte gratuit sur posthog.com
// 2. Récupère ton project key
// 3. Remplace ce stub par le snippet officiel <script>
console.log("[squadly] Landing chargée. Branche WAITLIST_ENDPOINT et PostHog avant prod.");
