# Arenetto public website

A new bilingual, instrument-first website for [Arenetto](https://arenetto.app).
Built as static HTML, CSS and small vanilla JavaScript enhancements, with no
framework, production package dependencies, analytics or account forms.

## Edit and build

Edit `content/site.mjs` for English/Spanish product copy, verified social links,
performance videos and attributed review excerpts. Edit `assets/arenetto.css`
for the design and `assets/arenetto.js` for interactions.

```sh
node scripts/build-site.mjs
python3 scripts/check-site.py
node --test scripts/test-interactions.mjs
git diff --check
```

Node 22+ is required only to generate the committed HTML and run the tests.
Visitors and GitHub Pages need no Node runtime or build service. Do not edit
generated `index.html` files directly; regenerate them from their content and
templates. `content/legal.json` preserves the published policy and support text;
changes to that text require their own deliberate review.

The checks cover all 15 route documents, local assets/anchors, metadata,
English/Spanish alternate URLs, source-faithful policy text, JSON-LD, font
licenses, campaign attribution, no-JavaScript fallbacks, family selection,
video lifecycle and device-aware download behavior.

## Preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/` or `/es/`. Serve from the repository root: asset
paths are root-relative, and `file://` is not a supported preview environment.

## Design and content

- A real current instrument capture leads the page, followed by Norteño and
  Vallenato, playing basics, tablet customization, performances, reviews and FAQ.
- Black lacquer, warm ivory and restrained champagne accents connect the site
  to the app without reproducing the instrument as a complicated webpage.
- Cormorant Garamond and Manrope are served locally with their SIL OFL licenses.
- Current app captures have local responsive JPEG variants. Images below the
  hero load lazily; no social-player scripts or iframes load initially.
- Videos are attributed to the verified official Arenetto Accordion channel.
  Selecting a video loads YouTube's privacy-enhanced player. Closing the dialog
  removes the iframe, stops playback and returns keyboard focus. All videos
  also work as normal external links without JavaScript.
- Review excerpts are exact, short and attributed. Spanish originals remain
  visible on both pages; English translations are explicitly labeled. There
  are no invented reviews, aggregate ratings or anonymous creator endorsements.

See `docs/rebuild-2026-10-02.md` for asset sources, evidence and open content needs.

## Preserved public infrastructure

- `CNAME` remains `arenetto.app`; GitHub Pages publishes `main` from the root.
- English and Spanish `/privacy/`, `/terms/` and `/support/` retain their policy
  text and addresses. Privacy's website-only statement/effective date are updated
  to disclose the optional external player; the app's privacy promises are unchanged.
- `/download/`, `/instagram/`, `/facebook/`, `/youtube/` and `/tiktok/` preserve
  the existing device-aware router in `assets/download.js`. Embedded social
  browsers keep the established fallback rather than forcing a store handoff.
- Apple campaign labels and Google Play UTM attribution are preserved. Social
  download routes canonicalize to `/download/`, not nonexistent Spanish routes.
- Official store badges, app icon, `robots.txt`, bilingual sitemap and branded
  noindex `404.html` remain available.

## Review and publication

The previous site was frozen before replacement. The backup has a complete Git
bundle and a working-tree archive; retired presentation assets are recoverable
there. This rebuild is a local review candidate, not a live publication.

**Do not push to `main` until the new design is approved.** A push triggers the
existing GitHub Pages publication workflow. After approval, verify the published
English/Spanish pages, legal/download routes and assets as a distinct deployment
check; a local screenshot is not proof of a successful public deployment.
