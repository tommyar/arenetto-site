# Arenetto public website

Static public website for Arenetto, including the canonical privacy policy and
support information published at [arenetto.app](https://arenetto.app).

The site uses semantic HTML and CSS only. It has no JavaScript, analytics,
cookies, tracking, forms, package dependencies, or remote UI assets.

## Content and assets

- `index.html` is the product and release-status page for iPhone, iPad, and
  Android.
- `privacy/` and `support/` are the canonical cross-platform policy and help
  pages linked from the apps.
- `assets/images/` contains optimized copies of the production Arenetto icon
  and approved app screenshots. The source assets remain in the main
  `digitalAccordion` repository.
- `robots.txt` and `sitemap.xml` expose the public pages to search engines.

Store badges should only be added after the corresponding public listing URL
has been verified. Until then, the homepage intentionally reports both
platforms as launching soon.

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
