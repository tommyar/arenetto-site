#!/usr/bin/env python3
"""Dependency-free checks of the rebuilt site's actual public contracts."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = "https://arenetto.app"
IOS = "https://apps.apple.com/us/app/arenetto/id6791795300"
ANDROID = "https://play.google.com/store/apps/details?id=com.tomasarenas.arenetto"
CAMPAIGNS = {"instagram": "Instagram", "facebook": "Facebook", "youtube": "YouTube", "tiktok": "TikTok"}
PUBLIC = [f"{prefix}{page}" for prefix in ("", "es/") for page in
          ("index.html", "download/index.html", "privacy/index.html", "terms/index.html", "support/index.html")]
ROUTES = PUBLIC + [f"{source}/index.html" for source in CAMPAIGNS] + ["404.html"]


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.text = []
        self.jsonld = []
        self.script_parts = None

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        self.elements.append((tag, values))
        if tag == "script" and values.get("type") == "application/ld+json":
            self.script_parts = []

    def handle_endtag(self, tag):
        if tag == "script" and self.script_parts is not None:
            self.jsonld.append(json.loads("".join(self.script_parts)))
            self.script_parts = None

    def handle_data(self, text):
        self.text.append(text)
        if self.script_parts is not None:
            self.script_parts.append(text)

    def attrs(self, tag):
        return [attrs for kind, attrs in self.elements if kind == tag]

    def meta(self):
        return {a.get("name", a.get("property")): a.get("content") for a in self.attrs("meta")}


def parse(text):
    document = Document()
    document.feed(text)
    return document


def local_target(path, reference):
    parts = urlsplit(reference)
    if parts.netloc and parts.netloc != "arenetto.app":
        return None, ""
    if parts.scheme and parts.scheme not in ("https", "http"):
        return None, ""
    raw = unquote(parts.path)
    target = (ROOT / raw.lstrip("/") if raw.startswith("/") else path.parent / raw).resolve() if raw else path
    if target.is_dir():
        target /= "index.html"
    return target, parts.fragment


def main():
    errors = []
    documents = {}
    expected_legal = json.loads((ROOT / "content/legal.json").read_text())
    website_privacy = json.loads((ROOT / "content/website-privacy.json").read_text())

    def require(condition, message):
        if not condition:
            errors.append(message)

    for route in ROUTES:
        path = ROOT / route
        if not path.is_file():
            errors.append(f"missing preserved route: {route}")
            continue
        try:
            document = parse(path.read_text())
        except (json.JSONDecodeError, ValueError) as exc:
            errors.append(f"invalid document/schema: {route}: {exc}")
            continue
        documents[route] = document
        meta = document.meta()
        lang = "es" if route.startswith("es/") else "en"
        require(document.attrs("html")[0].get("lang") == lang, f"wrong language: {route}")
        require(len(document.attrs("h1")) == 1, f"expected one h1: {route}")
        require(len(document.attrs("title")) == 1, f"expected one title: {route}")
        require(bool(meta.get("description")) and "viewport" in meta, f"missing page metadata: {route}")
        require(meta.get("apple-itunes-app") == "app-id=6791795300", f"wrong Smart App Banner: {route}")
        ids = [a["id"] for _, a in document.elements if "id" in a]
        require(len(ids) == len(set(ids)), f"duplicate element ids: {route}")
        require("main-content" in ids, f"missing skip-link target: {route}")
        require(not document.attrs("iframe"), f"third-party iframe loads before consent: {route}")
        require(not document.attrs("video"), f"obsolete self-hosted demo: {route}")

        for tag, attrs in document.elements:
            if "srcset" in attrs:
                for candidate in attrs["srcset"].split(","):
                    reference = candidate.strip().split()[0]
                    target, _ = local_target(path, reference)
                    require(target is not None and target.is_file(), f"missing responsive image: {route} → {reference}")
            for key in ("href", "src", "poster"):
                if key not in attrs:
                    continue
                reference = attrs[key]
                target, fragment = local_target(path, reference)
                if target is not None:
                    require(target.is_file(), f"broken local reference: {route} → {reference}")
                    if fragment and target.is_file() and target.suffix == ".html":
                        target_ids = [a.get("id") for _, a in parse(target.read_text()).elements]
                        require(fragment in target_ids, f"broken fragment: {route} → {reference}")
                if tag in ("img", "script") and key == "src":
                    require(not urlsplit(reference).netloc, f"remote startup asset: {route} → {reference}")
            for key in ("aria-controls", "aria-labelledby"):
                if key in attrs:
                    require(all(value in ids for value in attrs[key].split()), f"invalid {key}: {route}")
            if tag == "img":
                require(bool(attrs.get("alt")), f"missing image alternative: {route}")
                require("width" in attrs and "height" in attrs, f"missing image dimensions: {route}")
            if tag == "a" and attrs.get("target") == "_blank":
                require("noopener" in attrs.get("rel", ""), f"unsafe external tab: {route}")

        canonicals = [a["href"] for a in document.attrs("link") if a.get("rel") == "canonical"]
        if route == "404.html":
            require(meta.get("robots") == "noindex" and not canonicals, "404 indexing contract changed")
        else:
            url_path = "/" + route.removesuffix("index.html")
            if route.split("/")[0] in CAMPAIGNS:
                url_path = "/download/"
            require(canonicals == [HOST + url_path], f"unexpected canonical: {route}")
            alternates = [a for a in document.attrs("link") if a.get("rel") == "alternate"]
            require({a.get("hreflang") for a in alternates} == {"en", "es", "x-default"}, f"missing bilingual alternates: {route}")

        if route in ("index.html", "es/index.html"):
            require(len(document.jsonld) == 1, f"missing homepage schema: {route}")
            graph = document.jsonld[0].get("@graph", []) if document.jsonld else []
            app = next((x for x in graph if x.get("@type") == "SoftwareApplication"), {})
            require(app.get("downloadUrl") == [IOS, ANDROID], f"wrong schema store links: {route}")
            require("aggregateRating" not in app, f"unverified aggregate rating: {route}")
            videos = [a for tag, a in document.elements if "data-video" in a]
            require(len(videos) == 6 and all("href" in a for a in videos), f"video no-JS fallback missing: {route}")
            presentation = (ROOT / "assets/arenetto.js").read_text()
            require(all(f"'{a['data-video']}'" in presentation for a in videos), f"video missing from allowed player identities: {route}")
            panels = [a for _, a in document.elements if a.get("id", "").startswith("family-")]
            require(len(panels) == 2 and all("hidden" not in a for a in panels), f"no-JS family content missing: {route}")
            require(len(document.attrs("details")) == 6, f"FAQ count changed: {route}")
            reviews = [a for a in document.attrs("figure") if a.get("class") == "review"]
            require(bool(reviews) and len(document.attrs("blockquote")) == len(reviews), f"review quotation missing: {route}")
            review_ids = [a.get("data-review-id") for a in reviews]
            require(all(review_ids) and len(review_ids) == len(set(review_ids)), f"missing or duplicate review identity: {route}")
            require({a.get("data-review-store") for a in reviews} == {"App Store", "Google Play"}, f"review store attribution missing: {route}")
            require(all(a.get("lang") == lang for a in document.attrs("blockquote")), f"review not localized to page language: {route}")

        for policy in ("privacy", "terms", "support"):
            if route == f"{'es/' if lang == 'es' else ''}{policy}/index.html":
                expected = expected_legal[lang][policy]
                if policy == "privacy":
                    notice = website_privacy[lang]
                    require(notice["previousDate"] in expected and notice["previousStatement"] in expected, f"privacy migration source mismatch: {route}")
                    expected = expected.replace(notice["previousDate"], notice["date"]).replace(notice["previousStatement"], notice["statement"])
                original = parse(expected).text
                # Exact existing policy text must remain in its original order.
                body = " ".join(" ".join(document.text).split())
                offset = 0
                for text in original:
                    normalized = " ".join(text.split())
                    if not normalized:
                        continue
                    found = body.find(normalized, offset)
                    require(found >= 0, f"published legal/help text removed: {route}: {normalized[:50]}")
                    if found >= 0:
                        offset = found + len(normalized)

        source = route.split("/")[0]
        is_download = "download/" in route or source in CAMPAIGNS
        if is_download:
            html = document.attrs("html")[0]
            expected_source = source if source in CAMPAIGNS else "download"
            require(html.get("data-download-source") == expected_source, f"wrong download source: {route}")
            require(html.get("data-android-available") == "true", f"Android disabled: {route}")
            require(html.get("data-android-url") == ANDROID, f"wrong Android destination: {route}")
            require(html.get("data-ios-url", "").startswith(IOS), f"wrong Apple destination: {route}")
            if source in CAMPAIGNS:
                query = parse_qs(urlsplit(html.get("data-ios-url", "")).query)
                require(query.get("ct") == [f"Arenetto {CAMPAIGNS[source]}"], f"Apple attribution changed: {route}")
            require(any(a.get("src", "").endswith("assets/download.js") for a in document.attrs("script")), f"missing smart router: {route}")
            require(any("data-android-status" in a and a.get("aria-live") == "polite" for _, a in document.elements), f"missing download status: {route}")

    css = (ROOT / "assets/arenetto.css").read_text()
    for reference in re.findall(r"url\(['\"]?([^)'\"]+)", css):
        require(reference.startswith("/assets/"), f"remote CSS asset: {reference}")
        require((ROOT / reference.lstrip("/")).is_file(), f"missing CSS asset: {reference}")
    for font in (ROOT / "assets/fonts").glob("*.woff2"):
        require(font.read_bytes()[:4] == b"wOF2", f"invalid WOFF2: {font.name}")
    for license_name in ("OFL-Cormorant.txt", "OFL-Manrope.txt"):
        require((ROOT / "assets/fonts" / license_name).is_file(), f"missing font license: {license_name}")
    require((ROOT / "CNAME").read_text().strip() == "arenetto.app", "custom domain changed")
    try:
        sitemap = ET.parse(ROOT / "sitemap.xml")
        locations = {node.text for node in sitemap.findall(".//{*}loc")}
        require(locations == {HOST + "/" + route.removesuffix("index.html") for route in PUBLIC}, "sitemap route mismatch")
    except (ET.ParseError, FileNotFoundError) as exc:
        errors.append(f"invalid sitemap: {exc}")
    require("Sitemap: https://arenetto.app/sitemap.xml" in (ROOT / "robots.txt").read_text(), "robots sitemap missing")

    if errors:
        print("\n".join(f"FAIL: {error}" for error in errors))
        return 1
    print(f"PASS: {len(documents)} pages, local links/fragments/assets, bilingual metadata, schema, legal text, smart-link attribution, fonts and sitemap")
    return 0


if __name__ == "__main__":
    sys.exit(main())
