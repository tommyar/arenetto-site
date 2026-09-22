# Arenetto public website

Static public website for Arenetto, including the canonical privacy policy and
support information published at [arenetto.app](https://arenetto.app).

The public pages use semantic HTML and CSS. The download and social routes use
one small vanilla JavaScript router for device-aware store navigation; there
are no analytics, cookies, tracking scripts, forms, package dependencies, or
remote UI assets.

## Content and assets

- `index.html` is the product and availability page for iPhone, iPad, and
  Android. The store links point to the verified public listings at
  <https://apps.apple.com/us/app/arenetto/id6791795300> and
  <https://play.google.com/store/apps/details?id=com.tomasarenas.arenetto>.
- `privacy/` and `support/` are the canonical cross-platform policy and help
  pages linked from the apps. `terms/` contains the website terms in English
  and Spanish.
- `download/` is the device-aware download page. `/instagram/`, `/facebook/`,
  `/youtube/`, and `/tiktok/` are clean social routes that use the matching
  App Store campaign link and Google Play UTM parameters.
- `assets/images/` contains optimized copies of the production Arenetto icon
  and approved app screenshots. It also contains the official Apple App Store
  badge and official Google Play badges used by the homepage. The homepage
  also uses the owned `assets/videos/arenetto-demo.mp4` interaction capture and
  a distinct 31-button screenshot. The source assets remain in the main
  `digitalAccordion` repository.
- `robots.txt` and `sitemap.xml` expose the public pages to search engines.

The App Store listing is public for iPhone and iPad, and the Google Play listing
is public for Android. The homepage uses the official Apple and Google Play
download badges plus Smart App Banner for Apple ID `6791795300`.

The smart-link pages intentionally do not add analytics, cookies, or tracking
scripts. Attribution is passed to Apple through App Store Connect campaign
links and to Google Play through `utm_source`, `utm_medium`, and
`utm_campaign`. The six device-aware and social download routes keep Android
enabled with `data-android-available="true"`.

## Local preview

From the repository root:

```sh
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/`
- `http://localhost:8080/privacy/`
- `http://localhost:8080/terms/`
- `http://localhost:8080/support/`

## Checks

Run the dependency-free structural checks before committing:

```sh
python3 scripts/check-site.py
```

## Deployment

GitHub Pages publishes the repository root from `main`. The `CNAME` file
declares `arenetto.app` as the canonical custom domain. DNS and HTTPS are
managed outside this repository.
