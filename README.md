# Arenetto public website

Static public website for Arenetto, including the canonical privacy policy and
support information published at [arenetto.app](https://arenetto.app).

The site uses semantic HTML and CSS only. It has no JavaScript, analytics,
cookies, tracking, forms, package dependencies, or remote UI assets.

## Content and assets

- `index.html` is the product and availability page for iPhone, iPad, and
  Android. The iOS download action points to the verified public listing at
  <https://apps.apple.com/us/app/arenetto/id6791795300>.
- `privacy/` and `support/` are the canonical cross-platform policy and help
  pages linked from the apps.
- `download/` is the device-aware download page. `/instagram/`, `/facebook/`,
  `/youtube/`, and `/tiktok/` are clean social routes that use the matching
  App Store campaign link and add matching Google Play UTM parameters when the
  Android listing is public.
- `assets/images/` contains optimized copies of the production Arenetto icon
  and approved app screenshots. It also contains the official Apple App Store
  badge used by the homepage. The source assets remain in the main
  `digitalAccordion` repository.
- `robots.txt` and `sitemap.xml` expose the public pages to search engines.

The App Store listing is public for iPhone and iPad. The homepage uses Apple's
official download badge and Smart App Banner for Apple ID `6791795300`; the
Android platform remains marked as in preparation until its Google Play URL is
verified.

The smart-link pages intentionally do not add analytics, cookies, or tracking
scripts. Attribution is passed to Apple through App Store Connect campaign
links and to Google Play through `utm_source`, `utm_medium`, and
`utm_campaign`. When the Android listing is public, change
`data-android-available="false"` to `true` in the five download route pages.

## Local preview

From the repository root:

```sh
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/`
- `http://localhost:8080/privacy/`
- `http://localhost:8080/support/`

## Deployment

GitHub Pages publishes the repository root from `main`. The `CNAME` file
declares `arenetto.app` as the canonical custom domain. DNS and HTTPS are
managed outside this repository.
