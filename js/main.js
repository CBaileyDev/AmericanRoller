// Boot + wiring. Order matters: the quote form must exist before the
// router applies deep-link params, and the router decides the first
// view before the view manager animates it in.

import { initViewManager, goToView } from './viewManager.js';
import { initRouter, syncHash } from './router.js';
import { initGestures } from './gestures.js';
import { initAllTabs } from './tabs.js';
import { initAllPagers } from './pagination.js';
import { initIndustries } from './flip.js';
import { initSignatures } from './signature.js';
import { initQuoteForm } from './quoteForm.js';
import { initHome } from './home.js';
import { initLocations } from './locations.js';

const mqMobile = window.matchMedia('(max-width: 768px)');
const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function assignStaggerIndices() {
  document.querySelectorAll('.view').forEach((view) => {
    view.querySelectorAll('[data-stagger]').forEach((el, i) => {
      el.style.setProperty('--i', i);
    });
  });
}

// ---- popovers (mobile nav, Resources, More) ----
function initPopovers() {
  const buttons = document.querySelectorAll('.nav-pop-btn, .util-pop-btn');
  const closeAll = () => {
    buttons.forEach((b) => {
      b.setAttribute('aria-expanded', 'false');
      const pop = document.getElementById(b.getAttribute('aria-controls'));
      if (pop) pop.hidden = true;
    });
  };
  buttons.forEach((btn) => {
    const pop = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = pop.hidden;
      closeAll();
      if (open) {
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-pop, .util-pop, .nav-pop-btn, .util-pop-btn')) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
  document.querySelectorAll('.nav-pop a').forEach((a) => a.addEventListener('click', closeAll));
}

// ---- dead-end links from the brief (labels only, no targets given) ----
function initStubs() {
  document.addEventListener('click', (e) => {
    const stub = e.target.closest('[data-stub]');
    if (stub) e.preventDefault();
  });
}

// ---- magnetic primary CTA (fine pointers, full-motion only) ----
function initMagnetic() {
  if (!mqFine.matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (mqReduced.matches) return;
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width - 0.5) * 8;
      const my = ((e.clientY - r.top) / r.height - 0.5) * 6;
      el.style.setProperty('--mx', `${mx.toFixed(1)}px`);
      el.style.setProperty('--my', `${my.toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  });
}

// ---- "The Way" quadrants become tap-to-read tiles on mobile ----
function initWayMobile() {
  const grid = document.querySelector('[data-way]');
  const quads = [...grid.querySelectorAll('.quad')];
  const detail = document.createElement('div');
  detail.className = 'way-detail';
  detail.innerHTML = '<h4></h4><p></p>';
  grid.appendChild(detail);

  const show = (quad) => {
    quads.forEach((q) => q.setAttribute('aria-expanded', q === quad ? 'true' : 'false'));
    detail.querySelector('h4').textContent = quad.querySelector('h3').textContent;
    detail.querySelector('p').textContent = quad.querySelector('p').textContent;
  };

  const apply = () => {
    if (mqMobile.matches) {
      quads.forEach((q) => {
        q.setAttribute('role', 'button');
        q.tabIndex = 0;
      });
      show(quads[0]);
    } else {
      quads.forEach((q) => {
        q.removeAttribute('role');
        q.removeAttribute('tabindex');
        q.removeAttribute('aria-expanded');
      });
    }
  };

  grid.addEventListener('click', (e) => {
    const quad = e.target.closest('.quad');
    if (quad && mqMobile.matches) show(quad);
  });
  grid.addEventListener('keydown', (e) => {
    const quad = e.target.closest('.quad');
    if (quad && mqMobile.matches && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      show(quad);
    }
  });
  mqMobile.addEventListener('change', apply);
  apply();
}

function boot() {
  assignStaggerIndices();
  initViewManager({ onChanged: syncHash });
  const quoteForm = initQuoteForm();
  initGestures();
  initAllTabs();
  initAllPagers();
  initIndustries();
  initSignatures();
  initHome();
  initLocations();
  initPopovers();
  initStubs();
  initMagnetic();
  initWayMobile();

  const initialSlug = initRouter({ onParams: (params) => quoteForm.applyParams(params) });
  document.documentElement.classList.add('js-ready');
  goToView(initialSlug, { instant: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
