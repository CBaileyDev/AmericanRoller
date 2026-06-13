// Hash routes: #/home … #/quote?type=tank-lining&industry=Glass
// Intercepts nothing — plain <a href="#/…"> anchors drive hashchange,
// and the "#/" prefix can never collide with an element id (no anchor
// scroll-jumps possible).

import { VIEW_ORDER, goToView, currentView } from './viewManager.js';

let applyParams = () => {};

export function parseHash(hash = window.location.hash) {
  const m = /^#\/([a-z-]+)(?:\?(.*))?$/.exec(hash || '');
  const slug = m && VIEW_ORDER.includes(m[1]) ? m[1] : 'home';
  const params = new URLSearchParams(m && m[2] ? m[2] : '');
  return { slug, params };
}

export function syncHash(slug) {
  const { slug: cur } = parseHash();
  if (cur === slug) return; // keep params when already on the right route
  window.location.hash = `#/${slug}`;
}

export function initRouter({ onParams } = {}) {
  if (onParams) applyParams = onParams;

  window.addEventListener('hashchange', () => {
    const { slug, params } = parseHash();
    applyParams(params, slug);
    if (slug !== currentView()) goToView(slug);
  });

  const initial = parseHash();
  applyParams(initial.params, initial.slug);
  return initial.slug;
}
