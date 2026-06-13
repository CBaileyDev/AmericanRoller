// View state machine: one active view, directional transitions,
// inert/visibility lifecycle, dot-rail + nav sync, transition lock
// with a timeout failsafe (a swallowed transitionend must never
// deadlock navigation).

export const VIEW_ORDER = ['home', 'products', 'lining', 'industries', 'way', 'locations', 'quote'];

const TITLES = {
  home: 'American Roller Company · Rollers, Coatings & Linings',
  products: 'Products & Services · American Roller',
  lining: 'Tank & Rubber Lining · American Roller',
  industries: 'Industries · American Roller',
  way: 'The American Roller Way',
  locations: 'Locations · American Roller',
  quote: 'Request a Quote · American Roller',
};

const state = {
  current: null,
  locked: false,
  pending: null, // latest target requested mid-transition; honored on settle
  views: new Map(),
  onChanged: null,
  failsafe: 0,
};

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function indexOf(slug) {
  return VIEW_ORDER.indexOf(slug);
}

export function currentView() {
  return state.current;
}

function el(slug) {
  return state.views.get(slug);
}

function dispatch(name, slug) {
  document.dispatchEvent(new CustomEvent(name, { detail: { view: slug, el: el(slug) } }));
}

function syncChrome(slug) {
  document.querySelectorAll('[data-view-link]').forEach((a) => {
    if (a.dataset.viewLink === slug) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('.dot-rail [data-go]').forEach((b) => {
    if (b.dataset.go === slug) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  const label = document.querySelector(`.nav-pop a[data-view-link="${slug}"]`);
  const cur = document.querySelector('.nav-pop-current');
  if (cur && label) cur.textContent = label.dataset.short || label.textContent;
  document.title = TITLES[slug] || TITLES.home;
}

function settle(oldSlug, newSlug) {
  clearTimeout(state.failsafe);
  const oldEl = oldSlug ? el(oldSlug) : null;
  const newEl = el(newSlug);
  if (oldEl) {
    oldEl.classList.remove('is-active', 'is-leaving');
    oldEl.inert = true;
  }
  newEl.classList.remove('is-entering');
  state.locked = false;
  dispatch('view:enter', newSlug);
  const queued = state.pending;
  state.pending = null;
  if (queued && queued !== state.current) goToView(queued);
}

export function goToView(slug, { instant = false } = {}) {
  if (!state.views.has(slug)) return false;
  if (slug === state.current) return false;
  if (state.locked && !instant) {
    state.pending = slug; // don't drop intent mid-transition
    return false;
  }

  const oldSlug = state.current;
  const oldEl = oldSlug ? el(oldSlug) : null;
  const newEl = el(slug);
  const dir = oldSlug === null || indexOf(slug) > indexOf(oldSlug) ? 1 : -1;

  state.current = slug;
  syncChrome(slug);
  if (state.onChanged) state.onChanged(slug);
  if (oldSlug) dispatch('view:leave', oldSlug);

  newEl.inert = false;
  newEl.style.setProperty('--dir', dir);
  if (oldEl) oldEl.style.setProperty('--dir', dir);

  if (instant) {
    newEl.style.transition = 'none';
    newEl.classList.add('is-active');
    if (oldEl) {
      oldEl.style.transition = 'none';
      oldEl.classList.remove('is-active', 'is-leaving');
      oldEl.inert = true;
    }
    void newEl.offsetWidth;
    newEl.style.transition = '';
    if (oldEl) oldEl.style.transition = '';
    state.locked = false;
    dispatch('view:enter', slug);
    return true;
  }

  state.locked = true;
  newEl.classList.add('is-entering');
  void newEl.offsetWidth; // commit start position before transitioning
  newEl.classList.remove('is-entering');
  newEl.classList.add('is-active');
  if (oldEl) oldEl.classList.add('is-leaving');

  const dur = reduced() ? 260 : 620;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    newEl.removeEventListener('transitionend', onEnd);
    settle(oldSlug, slug);
  };
  const onEnd = (e) => {
    if (e.target === newEl && (e.propertyName === 'transform' || e.propertyName === 'opacity')) finish();
  };
  newEl.addEventListener('transitionend', onEnd);
  state.failsafe = setTimeout(finish, dur + 150);
  return true;
}

export function next() {
  const i = indexOf(state.current);
  if (i < VIEW_ORDER.length - 1) return goToView(VIEW_ORDER[i + 1]);
  return false;
}

export function prev() {
  const i = indexOf(state.current);
  if (i > 0) return goToView(VIEW_ORDER[i - 1]);
  return false;
}

export function initViewManager({ onChanged } = {}) {
  state.onChanged = onChanged || null;
  document.querySelectorAll('.view').forEach((v) => {
    state.views.set(v.dataset.view, v);
    v.inert = true;
  });
  document.querySelectorAll('.dot-rail [data-go]').forEach((b) => {
    b.addEventListener('click', () => goToView(b.dataset.go));
  });
  return { goToView, next, prev };
}
