// הפטיש נגרות אישית - shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initGallery();
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
/* Full photo gallery (projects.html) - loads gallery-manifest.json,       */
/* renders filterable tiles + a lightbox. Manifest is built by             */
/* images/raw/curate.py from the raw photo dump.                          */
/* ---------------------------------------------------------------------- */
const GALLERY_CATEGORY_LABELS = {
  all: "הכל",
  kitchen: "מטבחים",
  bathroom: "חדרי רחצה",
  closet: "ארונות ואחסון",
  home: "נגרות לבית",
  special: "פינות מיוחדות",
  staircase: "מדרגות",
  commercial: "מסחרי",
};
const GALLERY_CATEGORY_ORDER = ["all", "kitchen", "bathroom", "closet", "home", "special", "staircase", "commercial"];

async function initGallery() {
  const root = document.querySelector("[data-gallery]");
  if (!root) return;

  const tabsEl = root.querySelector("[data-gallery-tabs]");
  const gridEl = root.querySelector("[data-gallery-grid]");
  const countEl = root.querySelector("[data-gallery-count]");

  let items;
  try {
    const res = await fetch("gallery-manifest.json");
    items = await res.json();
  } catch (err) {
    if (gridEl) gridEl.innerHTML = "<p>לא ניתן לטעון את הגלריה כרגע.</p>";
    return;
  }

  const counts = { all: items.length };
  items.forEach((it) => {
    counts[it.category] = (counts[it.category] || 0) + 1;
  });

  const presentCats = GALLERY_CATEGORY_ORDER.filter((c) => c === "all" || counts[c]);

  tabsEl.innerHTML = presentCats
    .map(
      (c, i) =>
        `<button class="filter-tab${i === 0 ? " is-active" : ""}" data-filter="${c}">${GALLERY_CATEGORY_LABELS[c] || c} <span class="filter-tab-count">${counts[c]}</span></button>`
    )
    .join("");

  gridEl.innerHTML = items
    .map(
      (it, i) =>
        `<a href="#" class="work-card project-tile" data-category="${it.category}" data-lightbox-index="${i}">
          <div class="ph-block ph-block--square ph-block--photo">
            <img class="ph-img" src="${it.file}" alt="${GALLERY_CATEGORY_LABELS[it.category] || ""}" loading="lazy" />
          </div>
        </a>`
    )
    .join("");

  const tiles = [...gridEl.querySelectorAll(".project-tile")];

  const setCount = (n) => {
    if (countEl) countEl.textContent = `מציגים ${n} תמונות`;
  };
  setCount(items.length);

  tabsEl.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      tabsEl.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const category = tab.dataset.filter;
      let shown = 0;
      tiles.forEach((tile) => {
        const match = category === "all" || tile.dataset.category === category;
        tile.hidden = !match;
        if (match) shown++;
      });
      setCount(shown);
    });
  });

  tiles.forEach((tile) => {
    tile.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox(items, Number(tile.dataset.lightboxIndex));
    });
  });
}

function openLightbox(items, startIndex) {
  let index = startIndex;
  let box = document.querySelector(".lightbox");
  if (!box) {
    box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `
      <button class="lightbox-close" aria-label="סגירה">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <button class="lightbox-nav lightbox-prev" aria-label="הקודם">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
      <img class="lightbox-img" src="" alt="" />
      <button class="lightbox-nav lightbox-next" aria-label="הבא">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>`;
    document.body.appendChild(box);

    box.querySelector(".lightbox-close").addEventListener("click", () => box.classList.remove("is-open"));
    box.addEventListener("click", (e) => {
      if (e.target === box) box.classList.remove("is-open");
    });
    box.querySelector(".lightbox-prev").addEventListener("click", () => show(index - 1));
    box.querySelector(".lightbox-next").addEventListener("click", () => show(index + 1));
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") box.classList.remove("is-open");
      if (e.key === "ArrowRight") show(index - 1);
      if (e.key === "ArrowLeft") show(index + 1);
    });
  }

  function show(i) {
    index = (i + items.length) % items.length;
    box.querySelector(".lightbox-img").src = items[index].file;
  }

  show(index);
  box.classList.add("is-open");
}

/* ---------------------------------------------------------------------- */
/* Contact form - submits to FormSubmit.co, which emails hnd.ltd@gmail.com */
/* First submission triggers a one-time confirmation email FormSubmit     */
/* sends to that inbox - it must be clicked once before mail flows.       */
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
