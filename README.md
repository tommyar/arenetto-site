# Arenetto public website

Static public website for Arenetto, including the canonical privacy policy and
support information published at [arenetto.app](https://arenetto.app).

The site uses semantic HTML and CSS only. It has no JavaScript, analytics,
cookies, tracking, forms, package dependencies, or remote UI assets.

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

GitHub Pages publishes the repository root from `main`. The custom domain is
added through a focused `CNAME` commit after the temporary Pages URL and DNS
configuration have been verified. DNS and HTTPS are managed outside this
repository.
