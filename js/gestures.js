// Input affordances: arrow keys, optional wheel (debounced against
// trackpad inertia), pointer-event swipe with axis lock and
// [data-swipe-scope] ownership, plus the iOS rubber-band guard.

import { next, prev } from './viewManager.js';

const WHEEL_THRESHOLD = 120;
const WHEEL_WINDOW = 200;
const WHEEL_COOLDOWN = 800;
const SWIPE_DIST = 56;
const SWIPE_VELOCITY = 0.4;

function inFormField(t) {
  return t.closest('input, textarea, select, [contenteditable="true"]');
}

function popoverOpen() {
  return document.querySelector('.nav-pop:not([hidden]), .util-pop:not([hidden])');
}

export function initGestures() {
  // --- keyboard ---
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (inFormField(e.target) || popoverOpen()) return;
    if (e.target.closest('[role="tablist"], .pager, .ind-detail')) return;
    if (e.key === 'ArrowRight') next();
    else prev();
  });

  // --- wheel (optional affordance; visible nav is primary) ---
  let acc = 0;
  let accT = 0;
  let coolUntil = 0;
  document.querySelector('.stage').addEventListener(
    'wheel',
    (e) => {
      const now = performance.now();
      if (now < coolUntil || document.hidden) return;
      if (now - accT > WHEEL_WINDOW) acc = 0;
      accT = now;
      acc += e.deltaY;
      if (Math.abs(acc) >= WHEEL_THRESHOLD) {
        coolUntil = now + WHEEL_COOLDOWN;
        if (acc > 0) next();
        else prev();
        acc = 0;
      }
    },
    { passive: true }
  );

  // --- swipe (touch/pen pointers) ---
  const stage = document.querySelector('.stage');
  let p = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    p = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      scope: e.target.closest('[data-swipe-scope]'),
      fromField: !!inFormField(e.target),
    };
  });
  stage.addEventListener('pointerup', (e) => {
    if (!p || e.pointerId !== p.id) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    const dt = Math.max(1, performance.now() - p.t);
    const v = Math.abs(dx) / dt;
    const swipe =
      !p.fromField &&
      Math.abs(dx) > Math.abs(dy) * 1.2 &&
      Math.abs(dx) > 10 &&
      (Math.abs(dx) > SWIPE_DIST || v > SWIPE_VELOCITY);
    if (swipe) {
      const pager = p.scope && p.scope._pager;
      if (pager && pager.pages() > 1) {
        if (dx < 0) pager.next();
        else pager.prev();
      } else if (dx < 0) next();
      else prev();
    }
    p = null;
  });
  stage.addEventListener('pointercancel', () => {
    p = null;
  });

  // --- iOS rubber-band guard: overscroll-behavior alone is not
  //     enough on older Safari; the stage already has touch-action:none ---
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!e.target.closest('select, input, textarea')) e.preventDefault();
    },
    { passive: false }
  );
}
