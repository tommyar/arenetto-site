import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const presentation = readFileSync(resolve(root, 'assets/arenetto.js'), 'utf8');
const router = readFileSync(resolve(root, 'assets/download.js'), 'utf8');
const ios = 'https://apps.apple.com/us/app/arenetto/id6791795300';
const android = 'https://play.google.com/store/apps/details?id=com.tomasarenas.arenetto';

// Minimal DOM double: test policies and state transitions without installing
// another browser/framework or making network/store requests.
class Element {
  constructor(attrs = {}) {
    this.attrs = {...attrs};
    this.dataset = {};
    this.listeners = {};
    this.children = [];
    this.hidden = false;
    this.classes = new Set();
    this.classList = {add: x => this.classes.add(x), remove: x => this.classes.delete(x)};
  }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  removeAttribute(name) { delete this.attrs[name]; }
  addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
  fire(name, overrides = {}) {
    const event = {target:this, clientX:10, clientY:10, prevented:false, preventDefault(){this.prevented=true;}, ...overrides};
    (this.listeners[name] ?? []).forEach(fn => fn(event));
    return event;
  }
  querySelector(selector) { return this.nodes?.[selector] ?? null; }
  replaceChildren(...children) { this.children = children; }
  prepend(child) { this.children = [child, ...this.children.filter(x => x !== child)]; }
  getBoundingClientRect() { return {left:0,top:0,right:100,bottom:100}; }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
}

function page({ua = 'Desktop', source = 'download', available = true, touch = false, loading = false} = {}) {
  const shell = new Element();
  shell.dataset = {downloadSource:source, iosUrl:ios, androidUrl:android, androidAvailable:String(available), androidAvailableCaption:'Android', androidAvailableStatus:'Disponible', androidAriaLabel:'Google Play'};
  const families = ['norteno','vallenato'].map(name => new Element({'aria-controls':`family-${name}`}));
  const panels = {'family-norteno':new Element(), 'family-vallenato':new Element()};
  const tabs = new Element(); tabs.hidden = true;
  const apple = new Element(), google = new Element();
  const badges = new Element(); badges.children = [apple, google]; badges.nodes = {'[data-store="android"]':google};
  const status = new Element(), note = new Element(); note.hidden = true;
  const slot = new Element(), title = new Element(), fallback = new Element(), close = new Element();
  const dialog = new Element(); dialog.nodes = {'.video-slot':slot,'#video-title':title,'.video-fallback':fallback,'.dialog-close':close};
  const video = new Element(); video.dataset = {video:'k02WsCjudA4', videoTitle:'Siempre te voy a querer'};
  const single = {'.family-tabs':tabs,'.video-dialog':dialog,'[data-android-status]':status,'[data-embedded-browser-note]':note};
  const multi = {'[data-family]':families,'.store-badges':[badges],'[data-video]':[video],'[data-store="ios"]':[apple],'[data-store="android"]':[google]};
  const document = new Element();
  Object.assign(document, {documentElement:shell, readyState:loading?'loading':'complete', querySelector:selector=>single[selector]??null, querySelectorAll:selector=>multi[selector]??[], getElementById:id=>panels[id], createElement:()=>new Element()});
  const redirects = [], popups = [];
  const context = {document, navigator:{userAgent:ua,platform:touch?'MacIntel':'other',maxTouchPoints:touch?5:0}, window:{location:{replace:url=>redirects.push(url)},open:(...args)=>popups.push(args)}, URL, encodeURIComponent};
  return {context,shell,document,families,panels,tabs,badges,apple,google,status,note,dialog,slot,title,fallback,close,video,redirects,popups};
}

test('families enhance static content and change one selected panel', () => {
  const p = page(); runInNewContext(presentation,p.context);
  assert.equal(p.tabs.hidden,false); assert.equal(p.panels['family-vallenato'].hidden,true);
  p.families[1].fire('click');
  assert.equal(p.panels['family-vallenato'].hidden,false); assert.equal(p.panels['family-norteno'].hidden,true);
  assert.equal(p.families[0].getAttribute('aria-pressed'),'false'); assert.equal(p.families[1].getAttribute('aria-pressed'),'true');
});
test('Android promotes its badge without removing Apple', () => {
  const p = page({ua:'Android'}); runInNewContext(presentation,p.context);
  assert.deepEqual(p.badges.children,[p.google,p.apple]);
});
test('no player or popup exists before an explicit click', () => {
  const p = page(); runInNewContext(presentation,p.context);
  assert.equal(p.slot.children.length,0); assert.equal(p.popups.length,0);
});
test('chosen video opens the privacy-enhanced embed with a direct fallback', () => {
  const p = page(); runInNewContext(presentation,p.context);
  assert.equal(p.video.fire('click').prevented,true);
  assert.equal(p.dialog.open,true); assert.equal(p.title.textContent,p.video.dataset.videoTitle);
  assert.equal(p.slot.children[0].src,'https://www.youtube-nocookie.com/embed/k02WsCjudA4?autoplay=1&playsinline=1&rel=0');
  assert.equal(p.fallback.href,'https://www.youtube.com/watch?v=k02WsCjudA4');
});
test('closing or escaping stops playback and restores trigger focus', () => {
  const p = page(); runInNewContext(presentation,p.context); p.video.fire('click'); p.close.fire('click');
  assert.equal(p.slot.children.length,0); assert.equal(p.video.focused,true); assert.equal(p.dialog.open,false);
  p.video.fire('click'); p.dialog.close(); assert.equal(p.slot.children.length,0);
});
test('backdrop closes but clicks inside the modal do not', () => {
  const p = page(); runInNewContext(presentation,p.context); p.video.fire('click');
  p.dialog.fire('click'); assert.equal(p.dialog.open,true);
  p.dialog.fire('click',{clientX:-1}); assert.equal(p.dialog.open,false);
});
test('unknown video identities cannot create a player', () => {
  const p = page(); runInNewContext(presentation,p.context); p.video.dataset.video='not-authorized';
  assert.equal(p.video.fire('click').prevented,false); assert.equal(p.slot.children.length,0);
});
test('modified clicks preserve normal browser link behavior', () => {
  const p = page(); runInNewContext(presentation,p.context);
  assert.equal(p.video.fire('click',{metaKey:true}).prevented,false); assert.equal(p.slot.children.length,0);
});
test('browsers without dialog support open the verified source', () => {
  const p = page(); p.dialog.showModal = undefined; runInNewContext(presentation,p.context); p.video.fire('click');
  assert.equal(p.popups[0][0],'https://www.youtube.com/watch?v=k02WsCjudA4'); assert.equal(p.slot.children.length,0);
});

for (const [name, options, expected] of [
  ['iPhone Safari',{ua:'iPhone Safari'},ios],
  ['iPad desktop mode',{touch:true},ios],
  ['Android Chrome',{ua:'Android Chrome'},android],
  ['desktop',{},undefined],
  ['unavailable Android',{ua:'Android Chrome',available:false},undefined],
  ['Instagram iPhone',{ua:'iPhone Instagram',source:'instagram'},undefined],
  ['Facebook Android',{ua:'Android FBAV'},undefined],
  ['TikTok iPhone',{ua:'iPhone TikTok'},undefined],
  ['YouTube iPhone',{ua:'iPhone YouTube'},undefined],
]) {
  test(`smart link: ${name}`, () => {
    const p = page(options); runInNewContext(router,p.context);
    assert.equal(p.redirects[0],expected);
    assert.equal(p.redirects.length,expected?1:0);
    if (options.source === 'instagram') { assert.equal(p.apple.hidden,true); assert.equal(p.note.hidden,false); }
  });
}
test('social Android handoff preserves all attribution parameters', () => {
  const p = page({ua:'Android Chrome',source:'youtube'}); runInNewContext(router,p.context);
  const url = new URL(p.redirects[0]);
  assert.equal(url.searchParams.get('id'),'com.tomasarenas.arenetto'); assert.equal(url.searchParams.get('utm_source'),'youtube');
  assert.equal(url.searchParams.get('utm_medium'),'social'); assert.equal(url.searchParams.get('utm_campaign'),'arenetto_download');
});
test('localized status initializes after DOM readiness', () => {
  const p = page({loading:true}); runInNewContext(router,p.context);
  assert.equal(p.status.textContent,undefined); p.document.fire('DOMContentLoaded');
  assert.equal(p.status.textContent,'Disponible'); assert.equal(p.google.getAttribute('aria-label'),'Google Play');
});
