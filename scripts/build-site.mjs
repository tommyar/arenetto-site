import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { copy, stores, social, performances, reviews } from '../content/site.mjs';

const root = resolve(import.meta.dirname, '..');
const legal = JSON.parse(readFileSync(resolve(root, 'content/legal.json'), 'utf8'));
const websitePrivacy = JSON.parse(readFileSync(resolve(root, 'content/website-privacy.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
const heroVideo = performances[0].id;
const campaigns = {instagram:'Instagram', facebook:'Facebook', youtube:'YouTube', tiktok:'TikTok'};
const heading = lines => `${esc(lines[0])}<br><em>${esc(lines[1])}</em>`;
const image = (file, alt, width = 1600, height = 900, extra = '') => {
  const poster = performances.find(video => video.image === file);
  if (poster) { width = poster.width; height = poster.height; }
  const responsive = /^(phone|tablet)-/.test(file)
    ? `srcset="/assets/images/${file.replace('.jpg','-800.jpg')} 800w, /assets/images/${file} ${width}w" sizes="(max-width: 850px) calc(100vw - 48px), 52vw"`
    : '';
  return `<img src="/assets/images/${file}" ${responsive} alt="${esc(alt)}" width="${width}" height="${height}" ${extra}>`;
};

function badges(c) {
  return `<div class="store-badges"><a data-store="ios" href="${stores.ios}" aria-label="${esc(c.iosLabel)}">${image('app-store-badge.svg', c.iosLabel, 120, 40)}</a><a data-store="android" href="${stores.android}" aria-label="${esc(c.androidLabel)}">${image(c.lang === 'es' ? 'google-play-badge-es.png' : 'google-play-badge.png', c.androidLabel, 646, 250)}</a></div>`;
}

function head(c, title = c.title, description = c.description, path = c.path, noindex = false) {
  const counterpart = c.lang === 'es' ? path.replace(/^\/es\//, '/') : `/es${path}`;
  const schema = {
    '@context': 'https://schema.org', '@graph': [
      {'@type': 'Organization', '@id': 'https://arenetto.app/#organization', name:'Arenetto', url:'https://arenetto.app/', logo:'https://arenetto.app/assets/images/app-icon.png', sameAs:social.map(s=>s.url)},
      {'@type': 'SoftwareApplication', name:'Arenetto', applicationCategory:'MusicApplication', operatingSystem:'iOS, iPadOS, Android', url:'https://arenetto.app/', downloadUrl:[stores.ios,stores.android], image:'https://arenetto.app/assets/images/phone-norteno.jpg', offers:{'@type':'Offer', price:'0', priceCurrency:'USD'}, publisher:{'@id':'https://arenetto.app/#organization'}},
    ],
  };
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#111311"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="apple-itunes-app" content="app-id=6791795300">${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="https://arenetto.app${path}"><link rel="alternate" hreflang="${c.lang}" href="https://arenetto.app${path}"><link rel="alternate" hreflang="${c.lang==='es'?'en':'es'}" href="https://arenetto.app${counterpart}"><link rel="alternate" hreflang="x-default" href="https://arenetto.app${path.replace(/^\/es\//,'/')}">`}<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://arenetto.app${path}"><meta property="og:image" content="https://arenetto.app/assets/images/phone-norteno.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="https://arenetto.app/assets/images/phone-norteno.jpg"><link rel="icon" href="/assets/images/app-icon.png"><link rel="preload" href="/assets/fonts/cormorant-regular.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/arenetto.css">${path === c.path ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>`:''}`;
}

function header(c, home = true, page = '') {
  const other = page ? `${c.other}${page}/` : c.other;
  return `<a class="skip-link" href="#main-content">${esc(c.skip)}</a><header class="site-header"><div class="container header-inner"><a class="wordmark" href="${c.path}" aria-label="Arenetto"><span class="brand-symbol" aria-hidden="true">✣</span> ARENETTO</a><nav class="main-nav" aria-label="${esc(c.navLabel)}"><a href="${home?'':c.path}#instrument">${esc(c.nav[0])}</a><a href="${home?'':c.path}#sessions">${esc(c.nav[1])}</a><a href="${home?'':c.path}#questions">${esc(c.nav[2])}</a></nav><div class="header-actions"><a class="language-link" href="${other}" lang="${c.lang === 'es' ? 'en' : 'es'}">${esc(c.otherLabel)}</a><a class="button button-small" href="${home?'':c.path}#download">${esc(c.download)} ${arrow}</a></div></div></header>`;
}

function footer(c) {
  return `<footer class="site-footer"><div class="container footer-top"><div><a class="wordmark" href="${c.path}">ARENETTO</a><p>${esc(c.footerDescription)}</p></div><nav aria-label="${esc(c.footerNav)}">${['privacy','terms','support'].map((p,i)=>`<a href="${c.path}${p}/">${esc(c.footerLinks[i])}</a>`).join('')}<a href="mailto:support@arenetto.app">Contact${c.lang === 'es' ? 'o':''}</a></nav></div><div class="container footer-bottom"><small>© 2026 Arenetto</small><div>${social.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ${arrow}</a>`).join('')}<a href="${c.other}" lang="${c.lang==='es'?'en':'es'}">${esc(c.otherLabel)}</a></div></div></footer>`;
}

function family(c, name) {
  const f = c[name], active = name === 'norteno', id = name === 'norteno' ? 'k02WsCjudA4' : 'i9teGjhY3Ak';
  return `<section class="family-panel" id="family-${name}" aria-labelledby="heading-${name}"><div class="family-visual"><figure>${image(`phone-${name}.jpg`, f.alt,1600,900,'loading="lazy"')}<figcaption>${esc(f.caption)}</figcaption></figure></div><div class="family-copy"><span class="section-number">${active?'01':'02'} / ${esc(f.title)}</span><h3 id="heading-${name}">${esc(f.title)}</h3><p>${esc(f.text)}</p><ul class="feature-list">${f.features.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a class="text-button" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer" data-video="${id}" data-video-title="${esc(f.demo)}">${play} ${esc(f.demo)}</a></div></section>`;
}

function review(c, r) {
  const translated = c.lang !== r.language;
  const quote = translated ? r.translation : r.quote;
  const country = r.country === 'MX' ? ` · ${c.lang === 'es' ? 'México' : 'Mexico'}` : '';
  return `<figure class="review" data-review-id="${esc(r.id)}" data-review-store="${esc(r.store)}"><span class="stars" role="img" aria-label="${r.rating} / 5">${'★'.repeat(r.rating)}</span><blockquote lang="${c.lang}">“${esc(quote)}”</blockquote>${translated ? `<p class="review-translation">${esc(c.translated)}</p><p class="review-original" lang="${esc(r.language)}"><span lang="${c.lang}">${esc(c.original)}</span>“${esc(r.quote)}”</p>` : ''}<figcaption><strong>${esc(r.author)}</strong><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(c.reviewSource)} — ${esc(r.author)} (${esc(r.store)})">${esc(r.store)}${country} ${arrow}</a></figcaption></figure>`;
}

function homepage(c) {
  return `${header(c)}<main id="main-content">
  <section class="hero"><div class="container hero-grid"><div class="hero-copy"><p class="eyebrow"><span class="live-dot" aria-hidden="true"></span>${esc(c.eyebrow)}</p><h1>${heading(c.hero)}</h1><p class="hero-intro">${esc(c.intro)}</p>${badges(c)}<p class="hero-trust">${esc(c.free)}</p><a class="text-button hero-demo" href="https://www.youtube.com/watch?v=${heroVideo}" target="_blank" rel="noopener noreferrer" data-video="${heroVideo}" data-video-title="${esc(c.hear)}">${play} ${esc(c.hear)} <span aria-hidden="true">→</span></a></div><figure class="hero-instrument"><div class="instrument-frame">${image('phone-norteno.jpg',c.heroAlt,1600,900,'fetchpriority="high"')}</div><figcaption><span class="caption-line"></span>${esc(c.heroCaption)}</figcaption><span class="hero-script" aria-hidden="true">Arenetto</span></figure></div><div class="container hero-facts">${[0,2,4].map(i=>`<div><strong>${esc(c.proof[i])}</strong><span>${esc(c.proof[i+1])}</span></div>`).join('')}<span class="landscape-mark" aria-hidden="true">✣</span></div></section>
  <section class="instrument-section section" id="instrument"><div class="container"><div class="section-heading"><div><p class="eyebrow">${esc(c.instrumentEye)}</p><h2>${heading(c.instrumentTitle)}</h2></div><p>${esc(c.instrumentIntro)}</p></div><div class="family-tabs" role="group" aria-label="${esc(c.familyLabel)}" hidden><button id="tab-norteno" class="family-tab" aria-pressed="true" aria-controls="family-norteno" data-family="norteno">Norteño</button><button id="tab-vallenato" class="family-tab" aria-pressed="false" aria-controls="family-vallenato" data-family="vallenato">Vallenato</button></div>${family(c,'norteno')}${family(c,'vallenato')}</div></section>
  <section class="playing-section section"><div class="container"><div class="section-heading"><div><p class="eyebrow">${esc(c.playingEye)}</p><h2>${heading(c.playingTitle)}</h2></div></div><div class="playing-grid">${c.playing.map((p,i)=>`<article><span class="step-number">0${i+1}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join('')}</div></div></section>
  <section class="tablet-section section"><div class="container tablet-grid"><div class="tablet-copy"><p class="eyebrow">${esc(c.tabletEye)}</p><h2>${heading(c.tabletTitle)}</h2><p>${esc(c.tabletText)}</p><ul class="feature-list"><li>${esc(c.labels)}</li><li>${esc(c.layouts)}</li><li>${esc(c.tabletPresets)}</li></ul></div><figure class="tablet-visual">${image('tablet-norteno.jpg',c.tabletAlt,1400,965,'loading="lazy"')}<figcaption>${esc(c.tabletCaption)}</figcaption></figure></div></section>
  <section class="sessions-section section" id="sessions"><div class="container"><div class="section-heading"><div><p class="eyebrow">${esc(c.sessionsEye)}</p><h2>${heading(c.sessionsTitle)}</h2></div><p>${esc(c.sessionsText)}</p></div><div class="sessions-grid">${performances.map((v,i)=>`<article class="session-card"><a class="session-poster" href="https://www.youtube.com/shorts/${v.id}" target="_blank" rel="noopener noreferrer" data-video="${v.id}" data-video-title="${esc(v.title)}" aria-label="${esc(c.playVideo)} ${esc(v.title)}">${image(v.image, `${v.title} — ${v.creator}`,600,1067,'loading="lazy"')}<span class="session-tag">${esc(v.genre)}</span><span class="play-circle">${play}</span><span class="session-index">0${i+1}</span></a><div class="session-caption"><div><h3>${esc(v.title)}</h3><p>${esc(v.creator)}</p></div><a href="https://www.youtube.com/shorts/${v.id}" target="_blank" rel="noopener noreferrer" aria-label="${esc(c.youtube)}: ${esc(v.title)}">${arrow}</a></div></article>`).join('')}</div><div class="social-row"><p>${esc(c.socialInvite)}</p><div aria-label="${esc(c.socialHeading)}">${social.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ${arrow}</a>`).join('')}</div></div></div></section>
  <section class="reviews-section section" id="reviews"><div class="container"><div class="section-heading"><div><p class="eyebrow">${esc(c.reviewEye)}</p><h2>${heading(c.reviewTitle)}</h2></div><p>${esc(c.reviewText)}</p></div><div class="reviews-grid">${reviews.map(r=>review(c,r)).join('')}</div><p class="review-disclaimer">${esc(c.reviewDisclaimer)}</p></div></section>
  <section class="privacy-section"><div class="container"><h2>${esc(c.privacyTitle)}</h2><div class="privacy-grid">${c.privacyItems.map((p,i)=>`<div><span class="privacy-icon" aria-hidden="true">${['◌','↗','⌁'][i]}</span><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p></div>`).join('')}</div></div></section>
  <section class="faq-section section" id="questions"><div class="container faq-grid"><div><p class="eyebrow">${esc(c.faqEye)}</p><h2>${esc(c.faqTitle)}</h2><p class="faq-help">${esc(c.help)}<br><a href="${c.path}support/">${esc(c.contact)} ${arrow}</a></p></div><div class="faq-list">${c.faq.map(([q,a])=>`<details><summary>${esc(q)}<span aria-hidden="true">+</span></summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>
  <section class="download-section section" id="download"><div class="container"><p class="eyebrow">${esc(c.closingEye)}</p><h2>${heading(c.closingTitle)}</h2><p>${esc(c.closingText)}</p>${badges(c)}<p class="hero-trust">${esc(c.free)}</p></div></section>
  </main>${footer(c)}<dialog class="video-dialog" aria-labelledby="video-title"><div class="dialog-header"><h2 id="video-title"></h2><button class="dialog-close" aria-label="${esc(c.dialogClose)}">×</button></div><div class="video-slot"></div><p class="video-notice">${esc(c.dialogNotice)}</p><a class="video-fallback" target="_blank" rel="noopener noreferrer">${esc(c.videoError)} ${arrow}</a></dialog><script src="/assets/arenetto.js" defer></script>`;
}

function policy(c, page) {
  let body = legal[c.lang][page].replaceAll('href="../', `href="${c.path}`);
  const notice = websitePrivacy[c.lang];
  // The app's privacy promises remain intact. The website statement/date must
  // accurately disclose the newly introduced, opt-in external player.
  if (page === 'privacy') body = body.replace(notice.previousDate,notice.date).replace(notice.previousStatement,notice.statement);
  const external = page === 'privacy' ? `<section class="content-section"><h2>${esc(notice.heading)}</h2><p>${esc(notice.disclosure)} <a href="https://policies.google.com/privacy">YouTube / Google</a>.</p></section>` : '';
  return `${header(c,false,page)}<main class="content-page container" id="main-content">${body}${external}</main>${footer(c)}`;
}

function downloadPage(c, source = 'download') {
  return `${header(c,false,'download')}<main class="standalone-download container" id="main-content"><p class="eyebrow">ARENETTO / ${source.toUpperCase()}</p><h1>${esc(c.downloadTitle)}</h1><p>${esc(c.downloadText)}</p>${badges(c)}<p data-android-status role="status" aria-live="polite">${esc(c.androidStatus)}</p><p data-embedded-browser-note hidden>${esc(c.downloadEmbedded)}</p><p>${esc(c.free)}</p><a class="text-link" href="${c.path}">${esc(c.home)} ${arrow}</a></main>${footer(c)}<script src="${source==='download'?(c.lang==='es'?'../../':'../'):'../'}assets/download.js" defer></script>`;
}

function save(path, c, body, options = {}) {
  const {title, description, noindex, downloadSource} = options;
  let attrs = `lang="${c.lang}"`;
  if (downloadSource) {
    const campaign = downloadSource === 'download' ? stores.ios : `${stores.ios}?pt=129182357&ct=${encodeURIComponent(`Arenetto ${campaigns[downloadSource]}`)}&mt=8`;
    attrs += ` data-download-source="${downloadSource}" data-android-available="true" data-ios-url="${esc(campaign)}" data-android-url="${esc(stores.android)}" data-android-available-caption="${esc(c.androidLabel)}" data-android-available-status="${esc(c.androidStatus)}" data-android-aria-label="${esc(c.androidLabel)}"`;
  }
  const target = resolve(root,path==='404.html'?path:`${path.replace(/^\//,'')}index.html`);
  mkdirSync(resolve(target,'..'),{recursive:true});
  const canonicalPath = campaigns[downloadSource] ? '/download/' : path;
  writeFileSync(target,`<!doctype html>\n<html ${attrs}>\n<head>${head(c,title,description,canonicalPath,noindex)}</head>\n<body>${body}</body>\n</html>\n`);
}

for (const c of Object.values(copy)) {
  save(c.path,c,homepage(c));
  for (const page of ['privacy','terms','support']) save(`${c.path}${page}/`,c,policy(c,page),{title:`Arenetto — ${c.pageNames[page]}`});
  save(`${c.path}download/`,c,downloadPage(c),{title:`Arenetto — ${c.download}`,downloadSource:'download'});
}
for (const source of ['instagram','facebook','youtube','tiktok']) save(`/${source}/`,copy.en,downloadPage(copy.en,source),{title:`Arenetto — ${source}`,downloadSource:source});
save('404.html',copy.en,`${header(copy.en,false)}<main class="standalone-download container" id="main-content"><p class="eyebrow">404 / ARENETTO</p><h1>${esc(copy.en.notFound)}</h1><p>${esc(copy.en.notFoundText)}</p><a class="button" href="/">${esc(copy.en.home)} ${arrow}</a></main>${footer(copy.en)}`,{title:'Arenetto — Page not found',noindex:true});
console.log('Built 15 static bilingual documents from the new presentation.');
