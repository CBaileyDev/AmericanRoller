// Industries grid → detail FLIP morph. Only the card shell
// transforms (translate+scale); content fades in after. Escape,
// backdrop click, and view changes all close it; focus is managed
// with preventScroll everywhere.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initIndustries() {
  const view = document.querySelector('.view--industries');
  const grid = view.querySelector('[data-ind-grid]');
  const detail = view.querySelector('[data-ind-detail]');
  const card = detail.querySelector('.detail-card');
  const icon = detail.querySelector('.detail-icon use');
  const title = detail.querySelector('#ind-detail-title');
  const blurb = detail.querySelector('.detail-blurb');
  const quoteLink = detail.querySelector('[data-ind-quote]');
  const closeBtn = detail.querySelector('.detail-close');
  let lastTile = null;

  function open(tile) {
    lastTile = tile;
    const name = tile.dataset.industry;
    title.textContent = name;
    blurb.textContent = tile.dataset.blurb;
    icon.setAttribute('href', tile.querySelector('use').getAttribute('href'));
    quoteLink.href = `#/quote?industry=${encodeURIComponent(name)}`;

    detail.hidden = false;
    detail.classList.add('fade-prep');
    grid.classList.add('is-dimmed');

    if (!reduced()) {
      const first = tile.getBoundingClientRect();
      const last = card.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = first.width / last.width;
      const sy = first.height / last.height;
      card.classList.add('flip-prep');
      card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      void card.offsetWidth;
      card.classList.remove('flip-prep');
      card.classList.add('flip-play');
      card.style.transform = '';
      card.addEventListener('transitionend', () => card.classList.remove('flip-play'), { once: true });
    }

    detail.classList.remove('fade-prep');
    detail.classList.add('fade-in');
    closeBtn.focus({ preventScroll: true });
  }

  function close({ restoreFocus = true } = {}) {
    if (detail.hidden) return;
    detail.hidden = true;
    detail.classList.remove('fade-in');
    grid.classList.remove('is-dimmed');
    card.style.transform = '';
    if (restoreFocus && lastTile) lastTile.focus({ preventScroll: true });
  }

  grid.querySelectorAll('.tile').forEach((tile, i) => {
    tile.dataset.index = String(i + 1).padStart(2, '0');
    tile.addEventListener('click', () => open(tile));
  });
  closeBtn.addEventListener('click', () => close());
  detail.addEventListener('click', (e) => {
    if (e.target === detail) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !detail.hidden) {
      e.preventDefault();
      close();
    }
  });
  document.addEventListener('view:leave', (e) => {
    if (e.detail.view === 'industries') close({ restoreFocus: false });
  });
  // Navigating to the quote deep-link should also drop the overlay.
  quoteLink.addEventListener('click', () => close({ restoreFocus: false }));

  return { open, close };
}
