# CLAUDE.md

Guidance for Claude Code when working in this repo. Read this in full before making changes — it's the
condensed memory of everything decided in the build session, meant to survive a context compact/reset.

## What this is

A real client website: **הפטיש נגרות אישית** (HaPatish Carpentry), a static multi-page Hebrew/RTL site for a
real carpentry business. Plain HTML/CSS/JS — **no build step, no framework, no Node.js** (this machine doesn't
have Node installed; that's a deliberate choice, not a gap — a static site is also the right call for a small
business that needs cheap/simple hosting).

**Live site:** https://t3co.github.io/ (deployed from a *separate* repo — see "Deployment" below, this matters).

## The real business (do not invent facts — use these)

- Legal entity: **ה.ד הדר תעשיות עץ בע"מ** ("H.D. Hadar Wood Industries Ltd."), trading/brand name **הפטיש**
  (tagline: נגרות אישית). Founded **2002**, so "20 years' experience" per their own company profile PDF.
- Owner/CEO: **דוד ב.ר** (David B.R.) — signs the About page's closing quote.
- Serves private *and* commercial clients, nationwide.
- Real named commercial clients (from their own profile, used on the About page): קפה קפה, לחם ארז, דליסמו,
  כללית, מלון בוטיק בזיכרון יעקב.
- Real contact info (already wired into every page — header/footer/contact/about/services-equivalent blocks):
  - Phone / WhatsApp: **054-661-9935** (`tel:+972546619935`, `wa.me/972546619935`)
  - Email: **hnd.ltd@gmail.com** (contact-form destination, see below)
  - Instagram: https://www.instagram.com/hapatish.nagarut_/
  - Facebook: https://www.facebook.com/hapatish.nagarut
- Source material: `_source/` holds the original company-profile PDF (`__פרופיל חברה - ה_.pdf`) — it's
  gitignored, kept locally only. The 4 "featured project" photos (`images/kitchen-*.jpg`, `console-*.jpg`,
  `retail-deli-*.jpg`, `retail-wine-*.jpg`) were extracted from that PDF's embedded images.

## Repo layout — TWO repos, keep them in sync

This is the important gotcha: **`hapatish/` (this folder) is the working/source copy. It is not what's
live.** The live site is pushed to a *separate* GitHub repo, `T3co/T3co.github.io`, cloned locally at
`C:\Users\oryam\Documents\VSCODE\T3co.github.io\`. That repo used to be the user's personal CV/portfolio site
(now replaced — old content is still recoverable via `git log` there if ever needed, it was a normal commit,
not a force-push).

**Every change here has to be manually copied into that other repo, committed, and pushed** — there's no
automation for this yet. The pattern used throughout this session:
```bash
cd /c/Users/oryam/Documents/VSCODE/T3co.github.io
cp ../hapatish/<changed-file> .            # or the specific subpath
git add -A
git commit -m "..."
git push origin main
```
GitHub Pages auto-rebuilds on push to `main` (no manual "enable Pages" step needed — it's a `<user>.github.io`
repo, so Pages is automatic). Check build status: `gh api repos/T3co/T3co.github.io/pages/builds/latest`.

**`gh` CLI**: installed via winget at `C:\Program Files\GitHub CLI\gh.exe` (not on PATH in this shell session —
always call it by full path). Already authenticated as GitHub user **T3co**.

**`images/raw/`** is gitignored in both repos — it's the 557-file original photo/video dump (~1GB+), kept
locally only for reference. Never try to commit it.

## Pages

- `index.html` — Home. Hero (real kitchen photo), 4-icon feature strip, a **plain 6-photo showcase grid**
  (no links, no captions, no "view all" button — user explicitly asked for images-only, no fluff), a quote
  band, an about-teaser split, a closing CTA + contact form.
- `about.html` — real company story (2002, 20 years, real client list, owner quote).
- `projects.html` — **just the searchable gallery now**. No separate "featured projects" band (removed per
  feedback — see Decision log). Category filter tabs + lazy-loaded grid + lightbox, all driven by
  `gallery-manifest.json` (see "The photo gallery" below).
- `contact.html` — form (submits to FormSubmit, see below) + direct WhatsApp/phone/Instagram links.
- `project-kitchen.html`, `project-console.html`, `project-retail-deli.html`, `project-retail-wine.html` —
  the 4 detailed case-study pages, each with its own photo gallery + write-up. Still linked from the nav?
  **No** — they're not in the nav at all, only reachable via direct links (currently nothing links to them
  after the home-page grid became plain images with no hrefs — **potentially orphaned pages, worth checking
  if that's intended** or whether they should be linked from somewhere).
- `services.html` — **deleted** per user request (redundant with the gallery's category filters). Nav is now
  4 items: דף הבית / אודות / העבודות שלנו / צור קשר.

## The photo gallery (projects.html)

246 curated photos out of a 467-photo raw dump the user uploaded to `images/raw/` (a "twin"/backup of Hadar's
phone library — much bigger than the initial 177-file Google Drive share from earlier in the session).

**Pipeline** (scripts left in `images/raw/`, not needed again unless re-curating from scratch):
1. `analyze.py` — converts every HEIC/JPG/PNG to JPG (via `pillow-heif`), computes a blur score (Laplacian
   variance via OpenCV) and brightness, writes `analysis.json`.
2. `contact_sheets.py` — builds 13 numbered 6×6 contact sheets (`_sheets/sheet_00.jpg` etc.) for fast visual
   review instead of opening 467 images one at a time.
3. Manual review of all 13 sheets (blur score alone wasn't enough — most rejects were for composition/
   relevance: work-in-progress shots, CAD renders, screenshots, selfies, near-duplicate angles of the same
   piece, not blur).
4. `curate.py` — copies the picked indices into `images/gallery/<category>/<category>-NNN.jpg` and writes
   `gallery-manifest.json` (published at site root, paths prefixed `images/gallery/...`).

**Categories and current counts** (labels are in `js/main.js` → `GALLERY_CATEGORY_LABELS`):
kitchen (מטבחים) 82, home (נגרות לבית) 45, special (פינות מיוחדות) 36, closet (ארונות ואחסון) 31,
bathroom (חדרי רחצה) 22, commercial (מסחרי) ~16-17, staircase (מדרגות) 13. Total ~246.

If the user brings more raw photos later: drop them in `images/raw/` (any subfolder), rerun `analyze.py` +
`contact_sheets.py`, review sheets, extend the `CATEGORIES` dict in `curate.py` with new indices, rerun it.
It's additive-unsafe as written (reruns will re-copy everything with fresh sequential numbers) — if doing this
again, diff against the existing `gallery-manifest.json` first rather than blindly rerunning.

## Contact form

Both forms (home page CTA band + contact.html) POST via JS (`js/main.js` → `initContactForm`) to
**FormSubmit.co's AJAX endpoint**, hardcoded as `CONTACT_FORM_ENDPOINT = "https://formsubmit.co/ajax/hnd.ltd@gmail.com"`.
No backend, no API key needed — that's the whole point of FormSubmit.

**Known unresolved item**: FormSubmit requires one-time activation — the *first* submission to a new address
triggers an "Activate Form" email to that inbox, and until it's clicked, submissions come back with
`{"success":"false", message: "...needs Activation..."}` (HTTP 200, so don't just check `res.ok` — the JS
correctly parses the body and checks `result.success === "false"` too, already fixed). **Unknown whether David
has actually clicked that activation email yet** — worth confirming with the user before considering the
contact form "done."

## Decision log — things the user explicitly corrected (don't redo these)

- **No Oxford commas, no em dashes anywhere** — not just visible copy, also code comments. User's reasoning:
  both read as "AI tells" that make the site look non-human-made. Use plain hyphens, commas, colons, periods,
  or just restructure the sentence instead. Checked via `grep -rn '—' --include="*.html" --include="*.css"
  --include="*.js" --include="*.json"` — keep it clean going forward.
- **No "featured projects" band on the projects page** — just the searchable gallery, nothing else above it.
- **Home page's "latest projects" grid must be plain images** — no `<a>` wrapper, no hover caption, no
  "view all" button. Just a grid of distinct photos, one per subject, no repeats within the grid.
- **Services page removed entirely** — user's call after being asked "keep, repurpose as testimonials, or
  remove" — chose remove.
- **Real company facts over invented ones** — early drafts used a placeholder narrative before the real PDF
  showed up; always prefer the real 2002/20-years/real-client-list facts now that they're known.
- **Brand name "הפטיש"** is deliberate — it's a trade name distinct from the legal entity name, per the user's
  own instruction early on. Don't "correct" it to the legal name in headlines/nav.

## Design system

Warm wood-toned luxury palette (`css/style.css` `:root`): `--dark` (#1d1712, warm near-black, not a flat
`#111`), `--wood` (#a9723b accent/CTA), `--cream` (#f3ede3 body bg). Typefaces: **Frank Ruhl Libre** (serif,
headlines/brand) + **Assistant** (sans, body/UI), both Google Fonts, Hebrew subsets. RTL throughout
(`dir="rtl"` on `<html>`, logical CSS properties like `inset-inline-start` used instead of left/right).

**RTL CSS gotchas hit during the build** (both fixed, but worth knowing if adding new grid/flex layouts):
- A bare `1fr` grid track inherits an `auto` minimum from its content, which can make it overflow past the
  container when the content (e.g. an `aspect-ratio` image) has a large intrinsic size. Fix: always use
  `minmax(0, 1fr)`, not bare `1fr`, for any grid track that might contain an image.
- In a 2-column grid inside a `dir="rtl"` document, the *first* child in source order lands in the
  *rightmost* column. To get "image left, text right" (as the design wants), put the text markup first in
  the HTML, image second — backwards from how you'd write it for LTR.
- `.mobile-nav.is-open`'s transform needed `!important` to reliably beat the closed-state rule — tie-break
  behavior on equal-specificity RTL attribute-selector rules didn't work as expected in testing.

## Local preview

`.claude/launch.json` (one level up, in `VSCODE/`, since that's the harness's project root) runs
`python -m http.server 8123 --directory hapatish`. Use the `preview_start` tool with name `"hapatish"` to
open it in the browser pane. Note: this serves `hapatish/`, the *source* copy — not the same files as the
live `T3co.github.io` repo until you've done the copy/commit/push dance above.
