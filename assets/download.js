(() => {
  "use strict";

  const shell = document.documentElement;
  const source = shell.dataset.downloadSource || "download";
  const iosURL = shell.dataset.iosUrl;
  const androidURL = shell.dataset.androidUrl;
  const androidAvailable = shell.dataset.androidAvailable === "true";
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isEmbeddedBrowser = /Instagram|FBAN|FBAV|FBIOS|TikTok|BytedanceWebview|musical_ly|YouTube/i
    .test(navigator.userAgent);
  let resolvedAndroidURL = androidURL;

  if (androidURL && source !== "download") {
    const trackedAndroidURL = new URL(androidURL);
    trackedAndroidURL.searchParams.set("utm_source", source);
    trackedAndroidURL.searchParams.set("utm_medium", "social");
    trackedAndroidURL.searchParams.set("utm_campaign", "arenetto_download");
    resolvedAndroidURL = trackedAndroidURL.toString();
  }

  const shouldRedirect = Boolean(
    !isEmbeddedBrowser && (
      (isIOS && iosURL)
      || (isAndroid && androidAvailable && resolvedAndroidURL)
    ),
  );

  if (shouldRedirect) {
    window.location.replace(isIOS ? iosURL : resolvedAndroidURL);
  }

  const initializePage = () => {
    const iosLinks = document.querySelectorAll('[data-store="ios"]');
    const androidLinks = document.querySelectorAll('[data-store="android"]');

    iosLinks.forEach((link) => {
      if (iosURL) link.href = iosURL;
    });

    androidLinks.forEach((link) => {
      if (androidAvailable && resolvedAndroidURL) {
        link.href = resolvedAndroidURL;
        link.classList.remove("is-disabled");
        link.removeAttribute("aria-disabled");
        link.setAttribute("aria-label", "Download Arenetto from Google Play");
        const caption = link.querySelector("[data-android-caption]");
        if (caption) caption.textContent = "Download for Android";
      } else {
        link.classList.add("is-disabled");
        link.setAttribute("aria-disabled", "true");
        link.addEventListener("click", (event) => event.preventDefault());
      }
    });

    const androidStatus = document.querySelector("[data-android-status]");
    if (androidStatus && androidAvailable) {
      androidStatus.textContent = "Available now on Google Play.";
    }

    const embeddedBrowserNote = document.querySelector("[data-embedded-browser-note]");
    if (embeddedBrowserNote && isEmbeddedBrowser) {
      embeddedBrowserNote.hidden = false;
    }

    if (!shouldRedirect) shell.classList.add("download-page-ready");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, { once: true });
  } else {
    initializePage();
  }
})();
