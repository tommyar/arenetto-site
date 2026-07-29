#!/usr/bin/env python3
"""Run dependency-free structural checks for the static Arenetto site."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import sys
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOCIAL_CAMPAIGNS = {
    "instagram": "Arenetto Instagram",
    "facebook": "Arenetto Facebook",
    "youtube": "Arenetto YouTube",
    "tiktok": "Arenetto TikTok",
}
ROUTES = ["index.html", "download/index.html", "privacy/index.html", "support/index.html"]


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_attrs = {}
        self.links = []
        self.assets = []
        self.scripts = []
        self.meta = {}
        self.jsonld = []
        self._jsonld_parts = None

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "html":
            self.html_attrs = values
        if tag == "a" and values.get("href"):
            self.links.append(values["href"])
        if tag in {"img", "link"} and values.get("href", values.get("src")):
            self.assets.append(values.get("href", values.get("src")))
        if tag == "script":
            if values.get("src"):
                self.scripts.append(values["src"])
            if values.get("type") == "application/ld+json":
                self._jsonld_parts = []
        if tag == "meta":
            key = values.get("name") or values.get("property")
            if key and values.get("content") is not None:
                self.meta[key] = values["content"]

    def handle_data(self, data):
        if self._jsonld_parts is not None:
            self._jsonld_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._jsonld_parts is not None:
            self.jsonld.append("".join(self._jsonld_parts))
            self._jsonld_parts = None


def parse(path):
    document = Document()
    document.feed(path.read_text(encoding="utf-8"))
    return document


def check_local_references(path, document):
    errors = []
    for reference in document.links + document.assets + document.scripts:
        parsed = urlsplit(reference)
        if parsed.scheme or parsed.netloc or reference.startswith("#"):
            continue
        target = (path.parent / parsed.path).resolve()
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            errors.append(f"{path.relative_to(ROOT)} -> {reference}")
    return errors


def main():
    errors = []
    documents = {}

    for route in ROUTES:
        path = ROOT / route
        if not path.is_file():
            errors.append(f"missing route file: {route}")
            continue
        document = parse(path)
        documents[route] = document
        errors.extend(check_local_references(path, document))
        if "description" not in document.meta:
            errors.append(f"missing description: {route}")
        if "viewport" not in document.meta:
            errors.append(f"missing viewport: {route}")
        if "title" not in path.read_text(encoding="utf-8").lower():
            errors.append(f"missing title: {route}")
        raw = path.read_text(encoding="utf-8")
        if 'rel="canonical"' not in raw:
            errors.append(f"missing canonical: {route}")

    homepage = documents.get("index.html")
    if homepage is not None:
        if not homepage.jsonld:
            errors.append("homepage is missing JSON-LD")
        else:
            try:
                payload = json.loads(homepage.jsonld[0])
                if not payload.get("@graph"):
                    errors.append("homepage JSON-LD is missing @graph")
            except json.JSONDecodeError as exc:
                errors.append(f"homepage JSON-LD is invalid: {exc}")

    for source, campaign in SOCIAL_CAMPAIGNS.items():
        route = f"{source}/index.html"
        path = ROOT / route
        if not path.is_file():
            errors.append(f"missing social route file: {route}")
            continue
        document = parse(path)
        errors.extend(check_local_references(path, document))
        if document.html_attrs.get("data-download-source") != source:
            errors.append(f"wrong source on {source}")
        if document.html_attrs.get("data-android-available") != "false":
            errors.append(f"Android must remain disabled on {source}")
        if not document.html_attrs.get("data-ios-url", "").startswith("https://apps.apple.com/"):
            errors.append(f"unexpected iOS destination on {source}")
        if document.html_attrs.get("data-android-url") != "https://play.google.com/store/apps/details?id=com.tomasarenas.arenetto":
            errors.append(f"unexpected Android destination on {source}")
        if campaign.replace(" ", "%20") not in document.html_attrs.get("data-ios-url", ""):
            errors.append(f"missing Apple campaign token on {source}")
        if "../assets/download.js" not in " ".join(document.scripts):
            errors.append(f"missing download router on {source}")
        if "role=\"status\"" not in path.read_text(encoding="utf-8"):
            errors.append(f"missing live Android status on {source}")

    download = documents.get("download/index.html")
    if download is not None:
        if download.html_attrs.get("data-download-source") != "download":
            errors.append("wrong source on download")
        if download.html_attrs.get("data-android-available") != "false":
            errors.append("Android must remain disabled on download")

    error_page = ROOT / "404.html"
    if not error_page.is_file():
        errors.append("missing branded 404.html")
    else:
        error_document = parse(error_page)
        errors.extend(check_local_references(error_page, error_document))
        error_raw = error_page.read_text(encoding="utf-8").lower()
        if error_raw.count("<h1") != 1:
            errors.append("404.html must contain exactly one h1")
        if 'name="robots" content="noindex"' not in error_raw:
            errors.append("404.html must be noindex")
        if 'rel="canonical"' in error_raw:
            errors.append("404.html must not declare a canonical URL")

    sitemap = ROOT / "sitemap.xml"
    try:
        ET.parse(sitemap)
    except (ET.ParseError, FileNotFoundError) as exc:
        errors.append(f"invalid sitemap.xml: {exc}")

    download_script = (ROOT / "assets/download.js").read_text(encoding="utf-8")
    if "window.location.replace" not in download_script:
        errors.append("download router has no store redirect")
    if "window.location.search" in download_script:
        errors.append("download router must not accept arbitrary query redirects")

    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1

    print(f"PASS: checked {len(ROUTES) + len(SOCIAL_CAMPAIGNS)} route documents plus 404.html, redirects, links, JSON-LD, and sitemap")
    return 0


if __name__ == "__main__":
    sys.exit(main())
