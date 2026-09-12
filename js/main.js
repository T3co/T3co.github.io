// הפטיש — נגרות אישית — shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initProjectFilter();
  initContactForm();
});

/* ---------------------------------------------------------------------- */
/* Mobile nav drawer                                                       */
/* ---------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".mobile-nav");
  const closeBtn = document.querySelector(".mobile-nav-close");
  if (!toggle || !drawer) return;

  const open = () => {
    drawer.classList.add("is-open");
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    drawer.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* ---------------------------------------------------------------------- */
/* Projects page category filter                                          */
/* ---------------------------------------------------------------------- */
function initProjectFilter() {
  const tabs = document.querySelectorAll(".filter-tab");
  const tiles = document.querySelectorAll(".project-tile");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const category = tab.dataset.filter;

      tiles.forEach((tile) => {
        const match = category === "all" || tile.dataset.category === category;
        tile.hidden = !match;
      });
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Contact form — submits to FormSubmit.co, which emails hnd.ltd@gmail.com */
/* First submission triggers a one-time confirmation email FormSubmit     */
/* sends to that inbox — it must be clicked once before mail flows.       */
/* ---------------------------------------------------------------------- */
const CONTACT_FORM_ENDPOINT = "https://formsubmit.co/ajax/hnd.ltd@gmail.com";

function initContactForm() {
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    const setStatus = (message, state) => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state || "";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name?.trim() || !data.phone?.trim()) {
        setStatus("נא למלא שם וטלפון כדי שנוכל לחזור אליכם.", "error");
        return;
      }

      submitBtn.disabled = true;
      setStatus("שולח...", "");

      try {
        const res = await fetch(CONTACT_FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...data, _subject: "פנייה חדשה מאתר הפטיש נגרות" }),
        });
        const result = await res.json().catch(() => null);
        if (!res.ok || result?.success === "false") throw new Error(result?.message || "request failed");
        setStatus("תודה! קיבלנו את הפנייה ונחזור אליכם בהקדם.", "success");
        form.reset();
      } catch (err) {
        setStatus("משהו השתבש בשליחה. אפשר לנסות שוב, או לפנות אלינו ישירות בוואטסאפ.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
}
