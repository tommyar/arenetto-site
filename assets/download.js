(() => {
  "use strict";

  const page = document.body;
  const source = page.dataset.downloadSource || "download";
  const iosURL = page.dataset.iosUrl;
  const androidURL = page.dataset.androidUrl;
  const androidAvailable = page.dataset.androidAvailable === "true";
  const iosLinks = document.querySelectorAll('[data-store="ios"]');
  const androidLinks = document.querySelectorAll('[data-store="android"]');

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);

  iosLinks.forEach((link) => {
    if (iosURL) link.href = iosURL;
  });

  let resolvedAndroidURL = androidURL;
  if (androidURL && source !== "download") {
    const trackedAndroidURL = new URL(androidURL);
    trackedAndroidURL.searchParams.set("utm_source", source);
    trackedAndroidURL.searchParams.set("utm_medium", "social");
    trackedAndroidURL.searchParams.set("utm_campaign", "arenetto_download");
    resolvedAndroidURL = trackedAndroidURL.toString();
  }

  androidLinks.forEach((link) => {
    if (androidAvailable && resolvedAndroidURL) {
      link.href = resolvedAndroidURL;
      link.classList.remove("is-disabled");
      link.removeAttribute("aria-disabled");
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

  if (isIOS && iosURL) {
    window.location.replace(iosURL);
  } else if (isAndroid && androidAvailable && resolvedAndroidURL) {
    window.location.replace(resolvedAndroidURL);
  } else {
    document.documentElement.classList.add("download-page-ready");
  }
})();
