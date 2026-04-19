# Nisyros Wines — Project Context

> **Living document.** This file is the shared source of truth for the Nisyros Wines website project. It is maintained and updated by Claude across sessions so that Nicola, Sandro, and any collaborator landing on the repo have the full picture without archaeological digs through chat history.
>
> **Last updated:** 2026-04-19 · **Maintained by:** Claude (Cowork) · **Owners:** Nicola Zonca (nicola@nativeprime.com), Sandro (design + deploy)

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
| Live site | https://nw-ruby.vercel.app |
| Repo | https://github.com/hellosandro/nw |
| Deployment | Vercel, auto-deploy on merge to `main` |
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
│   ├── faces.html        # fullscreen photo slideshow (hardcoded, not CMS)
│   └── contact.html      # contact blocks + footer
├── js/
│   └── main.js           # scroll engine, CMS loader, nav, animations
├── assets/               # local images + SVG illustrations (1.svg–8.svg)
├── api/                  # Vercel Edge Functions (CMS proxy for Google Sheets)
├── nisyros.css           # all styles
├── build.sh              # concatenates sections + JS → index.html
├── index.html            # BUILD ARTIFACT — never edit by hand
├── styleguide.html       # internal design reference
└── server.py             # local dev server
```

**Build step:** run `./build.sh` inside the repo root. It produces `index.html`, which Vercel serves. Previously the build output was `nisyros.html`; this was renamed to `index.html` so Vercel serves it at the root (commit `bdc74ce`, merged via PR #4).

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

Wines are edited in a Google Sheet, published to CSV, fetched at runtime via a Vercel Edge Function proxy (`api/`) to avoid CORS and improve reliability.

**Wines sheet CSV URL:**
`https://docs.google.com/spreadsheets/d/e/2PACX-1vQGec_ewoWxtdcEXP05iJm4v2LHOoyW5sZc2bSBRVMzX7vlJIX8duf1JD--qMhpihBVgHMnHJxrgwkL/pub?gid=1993474932&single=true&output=csv`

**Body-text format:** the wine `body` field splits on `||` into exactly two non-empty parts — part 1 renders under *Story*, part 2 under *Winemaking & Tasting Notes*. The `specs` field splits on a single `|`, each part becoming a row.

**Google Drive images:** must use the `https://lh3.googleusercontent.com/d/[FILE_ID]` format, not the standard sharing URL.

**Faces section is NOT CMS-driven** — it is hardcoded in `sections/faces.html`.

**CMS loader invariant:** updates happen via `data-cms` attributes, not by replacing `innerHTML`. The CMS fails loud on bad data (no silent fallbacks, no duplicated runtime templates). See commit `c7c0abf`.

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

1. Pull latest: `git -C nw-repo pull origin main`
2. Create a branch: `git -C nw-repo checkout -b feature/description`
3. Edit source files (never `index.html`).
4. Build: `cd nw-repo && bash build.sh`
5. Commit and push branch to GitHub.
6. Provide PR link in this format: `https://github.com/hellosandro/nw/pull/new/[branch-name]`
7. Nicola opens the PR via the link; Sandro reviews and merges.
8. Vercel auto-deploys on merge.

> **Note for Claude:** the sandbox cannot call the GitHub API directly. Push the branch, then hand Nicola the PR-creation URL.

---

## 9. Current state (as of 2026-04-19)

**Branches in play:**

- `main` — last merged: PR #6 (removing unused `nisyros.html`), PR #4 (integration of wines redesign, CMS fixes, dark nav manifesto).
- `wines-redesign` — v3 wine card layout, contact table, nav updates (merged into integration).
- `integration/all-features` — merged to main.
- `fix/cms-fetch-reliability` — merged.
- `claude/*` branches — short-lived experimental branches.

**Recent notable commits:**

- `89edfe3` Merge PR #6 — remove unused `nisyros.html`
- `a9ef43d` Merge PR #4 — integration of all features
- `c0a247a` Manifesto: dark nav + Arabic counters inside panel-text
- `c7c0abf` Wines: CMS is single source of truth, fail loud on bad data
- `eb5d18e` Wines redesign v3: card layout, contact table, nav updates
- `bdc74ce` Build output renamed to `index.html` for Vercel
- Sanity-check cleanup (branch `claude/sanity-check-cleanup-egCqZ`): drop `assets/7.svg` + `nw-hero-original.jpg`, remove `w1-backup` card from `wines.html`, strip ~150 lines of unused CSS, fix `og:url` + drop OG preload, rename `NW-02-terraces.jpg` to match the crater caption.

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
| Deployment | Vercel (managed by Sandro) |
| CMS | Google Sheets (URL above) + Vercel Edge Function proxy |
| Social | Instagram `@nisyroswines` |
| Repo | GitHub `hellosandro/nw` |
