# Nisyros Wines — Project Context

> **Living document.** This file is the shared source of truth for the Nisyros Wines website project. It is maintained and updated by Claude across sessions so that Nicola, Sandro, and any collaborator landing on the repo have the full picture without archaeological digs through chat history.
>
> **Last updated:** 2026-04-29 · **Maintained by:** Claude (Cowork) · **Owners:** Nicola Zonca (nicola@nativeprime.com), Sandro (design + deploy)

---

## 1. What this site is

The website for **Nisyros Wines**, a natural wine producer on the volcanic island of Nisyros in the Aegean Sea, Greece.

Brand philosophy:

- Minimal intervention winemaking.
- Freedom from certifications and dogma.
- Elegance in the wines.
- Deep respect for the volcanic terroir.
- Humility as a core value — we write "we study" rather than "we understand."

Tone in copy: short, declarative sentences. No marketing fluff. The site reads like a manifesto, not a brochure.

---

## 2. Live site & repository

| | |
|---|---|
| Live site | https://nisyroswines.com |
| Repo (origin) | https://github.com/hellosandro/nw |
| Repo (production) | https://github.com/nicolazonca/nw |
| Deployment | Netlify, auto-deploy on merge to `main` of `nicolazonca/nw` |
| Instagram | https://www.instagram.com/nisyroswines/ |

---

## 3. Architecture

Multi-file source repo, assembled by a shell build script into a single deployable HTML file.

```
nw/
├── sections/         # HTML fragments, one per page section
│   ├── head.html         # <head>, meta, fonts, CSS link
│   ├── nav.html          # fixed nav bar + full-screen overlay menu
│   ├── manifesto.html    # horizontal-scroll manifesto (VII slides + credo)
│   ├── hero.html         # hero section with inline SVG logo
│   ├── wines.html        # horizontal-scroll wine cards (CMS overwrites at runtime)
│   ├── faces.html        # photo gallery wall + lightbox (CMS overwrites at runtime)
│   └── contact.html      # contact blocks + footer
├── js/
│   └── main.js           # scroll engine, CMS loader, nav, animations
├── assets/               # local images + SVG illustrations (1.svg–8.svg)
├── nisyros.css           # all styles
├── build.sh              # concatenates sections + JS → index.html
├── index.html            # BUILD ARTIFACT — never edit by hand
├── styleguide.html       # internal design reference
└── server.py             # local dev server
```

**Build step:** run `./build.sh` inside the repo root. It produces `index.html`, which Netlify serves at the site root.

---

## 4. Design language

Manifesto-style, quiet, confident, deliberately spare.

**Type:**

- **Bookmania** (Adobe Typekit — `https://use.typekit.net/jyf6llr.css`) — all display type.
- **JetBrains Mono**, weight 300 (Google Fonts) — body copy and labels.
- No ghost / stroke / outlined text. Type is always solid color.

**Color palette:**

| Token | Hex | Role |
|---|---|---|
| Warm white | `#F5F2EE` | Page background |
| Dark ink | `#2B2725` | Primary text |
| Volcanic red | `#C46E4B` | Primary accent + Volcanica collection |
| Amber | `#EA9332` | Manifesto II/IV/VII accent + Monopàtia collection |
| Nereides sand | `#C7BCA3` | Nereides collection |

**Layout:** full-screen horizontal-scroll sections for manifesto and wines. Scroll-reveal animations. Fully mobile-responsive.

**Collection brand colors apply to:** wine card badges · spec tag divider bars · collection names with underline accents.

**Note:** the CMS stores the collection name as `Volcanica` (column J). The code appends the word "Collection" at render time; everything else — name, slug (`volcanica`), color matching — flows from that single value.

---

## 5. Wines & collections

Three collections:

| Collection | Color | Positioning |
|---|---|---|
| **Monopàtia** | `#EA9332` | Unconventional wines, creative freedom |
| **Nereides** | `#C7BCA3` | Selected Dodecanese grapes and varieties |
| **Volcanica** | `#C46E4B` | Single-island wines, every grape grown on Nisyros |

Five wines currently on the site:

1. **3,2,1** — Nereides
2. **40 Milia Konda** — Nereides
3. **Roudià** — Volcanica
4. **Apiri** — Monopàtia
5. **Atmida** — Monopàtia

Wine data is driven by the CMS (Google Sheets). The five wines hardcoded in `sections/wines.html` are a fallback; the CMS loader in `js/main.js` overwrites them at runtime.

---

## 6. CMS (Google Sheets)

Wines and faces are edited in a Google Sheet, published as CSV per tab, and fetched at runtime via Netlify redirects (`/api/cms?sheet=…` → Google's published-CSV URL). The redirects are defined in `netlify.toml` and exist purely to give the client a same-origin path so we don't fight CORS.

**Sheet tabs:**

- `wines` — gid `1993474932` — drives the Wines section.
- `faces` — gid `1521558789` — drives the Faces & Places gallery.
- `config` — gid `1620319001` — global text snippets.

**Body-text format (wines):** the `body` field splits on `||` into exactly two non-empty parts — part 1 renders under *Story*, part 2 under *Winemaking & Tasting Notes*. The `specs` field splits on a single `|`, each part becoming a row.

**Faces columns:** `oredr | img_url | label | text`. Display order currently follows the sheet row order. `oredr` is reserved for future numeric ordering.

**Google Drive images:** the CMS accepts standard Drive share links (`https://drive.google.com/file/d/<ID>/view…`) — `js/main.js` extracts the file ID and rewrites to `https://lh3.googleusercontent.com/d/<ID>`, which is then routed through the Netlify Image CDN (`/.netlify/images?url=…&w=…`) for AVIF/WebP transcoding and CDN caching. The `[images].remote_images` whitelist in `netlify.toml` allows this.

**CMS loader invariants:**
- Wines: updates happen via `data-cms` attributes, not by replacing `innerHTML`. **Fails loud on bad data** — no silent fallbacks, no duplicated runtime templates (commit `c7c0abf`).
- Faces: replaces the hardcoded fallback `<figure>`s when the sheet returns ≥1 valid row. **Falls back gracefully** if the CMS fails or returns zero rows (the hardcoded fallback in `sections/faces.html` stays on screen).

---

## 7. Rules of engagement (the non-negotiables)

1. **Always edit source files** (`sections/`, `js/main.js`, `nisyros.css`). Never edit `index.html` directly — it is a build artifact.
2. **Run `./build.sh` after every set of changes.**
3. **Never change established design choices without explicit instruction.** Fonts and palette were chosen deliberately.
4. **Propose options before implementing visual changes.** No surprise redesigns.
5. **Confirm exact wording before applying copy changes.**
6. **No silent failures.** If the CMS returns bad data, the site should fail visibly, not quietly degrade.
7. **Git identity:** commit as `nicolazonca` / `nicolazonca@me.com`. Nicola has a second GitHub account that should not be used here.

---

## 8. Workflow for every change

1. Pull latest: `git pull origin main`
2. Create a branch: `git checkout -b feature/description` (or `claude/<topic>` for AI work).
3. Edit source files (never `index.html`).
4. Build: `bash build.sh`
5. Commit (as `nicolazonca <nicolazonca@me.com>`) and push the branch to `nicolazonca/nw`.
6. Provide PR link in this format: `https://github.com/nicolazonca/nw/compare/main...nicolazonca:nw:[branch-name]?expand=1` — this forces both base and head to `nicolazonca/nw` so the PR is opened *within* the fork (the default GitHub compare page targets `hellosandro/nw` because of the fork relationship and is not what we want).
7. Nicola opens the PR via the link, reviews the deploy preview at `https://deploy-preview-<N>--nisyros-wines.netlify.app`, and merges.
8. Netlify auto-deploys main to https://nisyroswines.com on merge.

> **Note for Claude:** the GitHub MCP integration cannot create PRs on this repo (`403 Resource not accessible by integration`). Push the branch, then hand Nicola the compare URL above.

---

## 9. Current state (as of 2026-04-29)

**Deployment:** Netlify only. Production repo is the fork `nicolazonca/nw`; merging to its `main` triggers an auto-deploy to https://nisyroswines.com. `hellosandro/nw` is the upstream of the fork relationship but is **not** in the deploy path — Nicola's repo is fully independent. DNS is hosted on Google Cloud DNS (`ns-cloud-d1.googledomains.com`), with the apex pointing to Netlify's load balancer (`75.2.60.5`) and `www` CNAME'd to `nisyros-wines.netlify.app`.

**CMS routing:** Google Sheets CSVs are reached via `/api/cms?sheet=…`, which `netlify.toml` 200-redirects to the published CSV URL on Google's side (no server function involved). Image transforms go through Netlify's Image CDN (`/.netlify/images?url=…&w=…`) with the `lh3.googleusercontent.com/*` host on the `remote_images` allowlist.

**Faces section:** wired to the `faces` tab of the CMS sheet. Polaroids load at `w=800`, lightbox at `w=1600`. Lightbox shows label + caption text overlaid on the photo, anchored to the photo's own bounds (not the viewport). Falls back to the hardcoded `<figure>`s in `sections/faces.html` if the CMS fails or is empty.

**Branches in play:**

- `main` — production. Last sync: 2026-04-29.
- `claude/organize-photo-management-BYsdN` — Faces CMS wiring + lightbox caption overlay + scroll fixes. PR pending merge.

---

## 10. How this document is maintained

This file is Claude's project memory made visible. It should be updated whenever:

- A branch is merged or a significant feature ships.
- A design or content rule changes.
- The CMS structure evolves (new sheets, new columns, new separators).
- A new wine or collection is added.
- The deployment or tooling setup changes.

When updating, bump the **Last updated** date at the top and, for anything non-trivial, add a one-line note to the *Current state* section so the running history stays readable.

If you are Nicola or Sandro and something in this doc is wrong or out of date, flag it — Claude will fix it in the next working session.

---

## 11. Tooling & external resources

| Purpose | Resource |
|---|---|
| Display type | Adobe Typekit — `https://use.typekit.net/jyf6llr.css` |
| Body type | Google Fonts JetBrains Mono |
| Deployment | Netlify (auto-deploy from `nicolazonca/nw` main) |
| Image CDN | Netlify Image CDN (`/.netlify/images?…`) |
| CMS | Google Sheets, proxied via Netlify redirects in `netlify.toml` |
| DNS | Google Cloud DNS |
| Social | Instagram `@nisyroswines` |
| Repo (production) | GitHub `nicolazonca/nw` |
| Repo (upstream fork parent) | GitHub `hellosandro/nw` (not in the deploy path) |
