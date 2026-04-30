// squadly — landing v3 interactions

const WAITLIST_ENDPOINT = "";
const COUNTER_KEY = "squadly_signup_count_local";

// =========================================================
// REVEAL ON SCROLL
// =========================================================
const reveal = (selector, threshold = 0.1) => {
  const items = document.querySelectorAll(selector);
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold });
  items.forEach(el => io.observe(el));
};
reveal(".scroll-section", 0.08);

// =========================================================
// NAV SCROLL
// =========================================================
const nav = document.querySelector(".nav");
const onScroll = () => {
  if (window.scrollY > 20) nav.classList.add("scrolled");
  else nav.classList.remove("scrolled");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// =========================================================
// MAGNETIC BUTTONS
// =========================================================
document.querySelectorAll(".btn-magnetic").forEach(btn => {
  let rafId = null;
  btn.addEventListener("mousemove", (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      btn.style.setProperty("--mx", `${(e.clientX - r.left) / r.width * 100}%`);
      btn.style.setProperty("--my", `${(e.clientY - r.top) / r.height * 100}%`);
    });
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
  });
});

// =========================================================
// 3D TILT (phone)
// =========================================================
document.querySelectorAll("[data-tilt]").forEach(el => {
  const max = 6;
  let rafId = null;
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = ((py - 0.5) * -2 * max).toFixed(2);
    const ry = ((px - 0.5) * 2 * max).toFixed(2);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const baseRy = -3, baseRx = 4;
      el.style.transform = `perspective(1200px) rotateX(${baseRx + parseFloat(rx)}deg) rotateY(${baseRy + parseFloat(ry)}deg)`;
    });
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});

// =========================================================
// SMOOTH SCROLL
// =========================================================
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

// =========================================================
// MATCH CLOCK — animate the timer tile (01:47 ± few seconds)
// =========================================================
const clockEl = document.getElementById("match-clock");
if (clockEl) {
  const baseSec = 1 * 60 + 47; // 01:47
  let t = 0;
  const tick = () => {
    // gentle oscillation between 01:32 and 02:14
    const v = baseSec + Math.round(15 * Math.sin(t / 18));
    const m = Math.floor(v / 60);
    const s = v % 60;
    clockEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    t++;
    setTimeout(tick, 1200);
  };
  tick();
}

// =========================================================
// WAITLIST FORM
// =========================================================
const form = document.getElementById("signup");
const msgOk = document.getElementById("msg-ok");
const msgErr = document.getElementById("msg-err");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgOk.hidden = true; msgErr.hidden = true;

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      msgErr.textContent = "Email invalide.";
      msgErr.hidden = false;
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const btnSpan = btn.querySelector("span");
    const originalText = btnSpan.textContent;
    btn.disabled = true;
    btnSpan.textContent = "Inscription...";

    try {
      if (WAITLIST_ENDPOINT) {
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Server error");
      } else {
        console.log("[squadly] Signup payload (no backend configured):", payload);
        await new Promise(r => setTimeout(r, 600));
      }

      if (window.posthog) window.posthog.capture("waitlist_signup", payload);
      if (window.plausible) window.plausible("WaitlistSignup");

      const current = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
      localStorage.setItem(COUNTER_KEY, String(current + 1));

      msgOk.hidden = false;
      form.reset();
      btnSpan.textContent = "✓ Inscrit";
      burst(btn);

      setTimeout(() => { btn.disabled = false; btnSpan.textContent = originalText; }, 3500);

    } catch (err) {
      msgErr.textContent = "Petit souci, réessaie ?";
      msgErr.hidden = false;
      btn.disabled = false;
      btnSpan.textContent = originalText;
    }
  });
}

// =========================================================
// PARTICLE BURST
// =========================================================
function burst(anchor) {
  const r = anchor.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const colors = ["#FF1F6E", "#DAFF00", "#4D9EFF", "#F8F4ED"];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("div");
    p.style.cssText = `
      position: fixed; top: ${cy}px; left: ${cx}px;
      width: 9px; height: 9px;
      background: ${colors[i % colors.length]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transition: transform 1.1s cubic-bezier(0.2, 0.7, 0.3, 1), opacity 1.1s;
      box-shadow: 0 0 12px ${colors[i % colors.length]};
    `;
    document.body.appendChild(p);
    requestAnimationFrame(() => {
      const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.5;
      const dist = 90 + Math.random() * 100;
      p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0.2)`;
      p.style.opacity = "0";
    });
    setTimeout(() => p.remove(), 1300);
  }
}

// =========================================================
// AURORA PARALLAX
// =========================================================
const blobs = document.querySelectorAll(".blob");
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
window.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});
function tick() {
  targetX += (mouseX - targetX) * 0.04;
  targetY += (mouseY - targetY) * 0.04;
  blobs.forEach((b, i) => {
    const factor = (i + 1) * 8;
    b.style.translate = `${targetX * factor}px ${targetY * factor}px`;
  });
  requestAnimationFrame(tick);
}
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) tick();

console.log("[squadly] v3 chargée.");
