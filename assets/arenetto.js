(() => {
  'use strict';

  // Keep the complete content in HTML. This is progressive enhancement only.
  const families = [...document.querySelectorAll('[data-family]')];
  function selectFamily(button) {
    families.forEach(candidate => {
      const active = candidate === button;
      candidate.setAttribute('aria-pressed', String(active));
      const panel = document.getElementById(candidate.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
  }
  if (families.length) {
    document.querySelector('.family-tabs').hidden = false;
    selectFamily(families[0]);
    families.forEach(button => button.addEventListener('click', () => selectFamily(button)));
  }

  // Both store badges remain visible. Only their ordering is device-aware.
  if (/Android/i.test(navigator.userAgent)) {
    document.querySelectorAll('.store-badges').forEach(group => {
      const android = group.querySelector('[data-store="android"]');
      if (android) group.prepend(android);
    });
  }

  const dialog = document.querySelector('.video-dialog');
  if (!dialog) return;
  const slot = dialog.querySelector('.video-slot');
  const title = dialog.querySelector('#video-title');
  const fallback = dialog.querySelector('.video-fallback');
  let previousFocus;
  const permittedVideos = new Set(['k02WsCjudA4', 'i9teGjhY3Ak', 'qBVwqO7cG_w']);

  function clearPlayer() {
    // Removing the iframe stops audio, downloads, and background playback.
    slot.replaceChildren();
    previousFocus?.focus();
  }
  dialog.addEventListener('close', clearPlayer);
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', event => {
    const id = button.dataset.video;
    if (!permittedVideos.has(id)) return;
    // Preserve standard open-in-new-tab gestures and the no-JavaScript link.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    if (typeof dialog.showModal !== 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    previousFocus = button;
    title.textContent = button.dataset.videoTitle || 'Arenetto';
    fallback.href = url;
    const frame = document.createElement('iframe');
    frame.title = title.textContent;
    // No external media or script loads until this explicit user action.
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    slot.replaceChildren(frame);
    dialog.showModal();
  }));
})();
