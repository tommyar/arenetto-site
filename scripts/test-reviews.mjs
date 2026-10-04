import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { copy, reviews } from '../content/site.mjs';

const root = resolve(import.meta.dirname, '..');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('testimonials retain distinct identities and valid attributed sources', () => {
  assert.equal(new Set(reviews.map(r => r.id)).size, reviews.length);
  assert.deepEqual(new Set(reviews.map(r => r.store)), new Set(['App Store', 'Google Play']));
  for (const r of reviews) {
    assert.ok(r.id && r.author && r.quote && r.translation);
    assert.equal(r.language, 'es');
    assert.ok(Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
    assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new URL(r.source).protocol, 'https:');
    const source = new URL(r.url);
    assert.equal(source.protocol, 'https:');
    if (r.store === 'Google Play') {
      assert.equal(source.hostname, 'play.google.com');
      assert.equal(source.searchParams.get('id'), 'com.tomasarenas.arenetto');
      assert.equal(source.searchParams.get('hl'), 'es_419');
      assert.equal(source.searchParams.get('gl'), 'MX');
      assert.match(r.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(r.country, undefined, 'storefront selection is not reviewer nationality');
    } else {
      assert.equal(source.hostname, 'apps.apple.com');
    }
  }
});

test('Google Play excerpts preserve the verified public Spanish wording', () => {
  const android = reviews.filter(r => r.store === 'Google Play');
  assert.deepEqual(android.map(r => [r.author, r.quote]), [
    ['Juan Alvarado', 'Excelente motor de sonido y muy buena respuesta.'],
    ['Maximiliano López', 'es perfecta sigan asi'],
  ]);
});

for (const c of Object.values(copy)) {
  const html = readFileSync(resolve(root, `${c.path.slice(1)}index.html`), 'utf8');
  const cards = [...html.matchAll(/<figure class="review"[^>]*>.*?<\/figure>/gs)].map(match => match[0]);

  test(`${c.lang}: every selected review is rendered once in static HTML`, () => {
    assert.equal(cards.length, reviews.length);
    for (const r of reviews) {
      assert.equal(cards.filter(card => card.includes(`data-review-id="${r.id}"`)).length, 1);
    }
    assert.ok(html.includes('id="reviews"'));
  });

  test(`${c.lang}: primary quotations use the page language and translations are disclosed`, () => {
    for (const r of reviews) {
      const card = cards.find(card => card.includes(`data-review-id="${r.id}"`));
      const translated = c.lang !== r.language;
      const quote = translated ? r.translation : r.quote;
      assert.ok(card.includes(`<blockquote lang="${c.lang}">“${esc(quote)}”</blockquote>`));
      if (translated) {
        assert.ok(card.includes(`<p class="review-translation">${esc(c.translated)}</p>`));
        assert.ok(card.includes('class="review-original" lang="es"'));
        assert.ok(card.includes(`“${esc(r.quote)}”`));
      } else {
        assert.ok(!card.includes('class="review-translation"'));
        assert.ok(!card.includes(esc(r.translation)));
      }
    }
  });

  test(`${c.lang}: author, individual rating and correct store source are preserved`, () => {
    for (const r of reviews) {
      const card = cards.find(card => card.includes(`data-review-id="${r.id}"`));
      assert.ok(card.includes(`<strong>${esc(r.author)}</strong>`));
      assert.ok(card.includes(`aria-label="${r.rating} / 5"`));
      assert.ok(card.includes(`href="${esc(r.url)}"`));
      assert.ok(card.includes(`data-review-store="${esc(r.store)}"`));
      assert.ok(card.includes('rel="noopener noreferrer"'));
      if (r.store === 'Google Play') assert.ok(!card.includes('Google Play ·'));
    }
    assert.ok(!html.includes('aggregateRating'));
  });
}
