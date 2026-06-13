// Generic pager for grids/lists that must never scroll: items beyond
// the current page get [data-page-hidden]. Page swap is opacity-only.
// Reads data-per-page / data-per-page-mobile; re-chunks on breakpoint
// change. The instance is exposed on el._pager for swipe ownership.

const mqMobile = window.matchMedia('(max-width: 768px)');

export function createPager(listEl) {
  const items = [...listEl.children];
  const target = listEl.dataset.pagerTarget
    ? document.querySelector(listEl.dataset.pagerTarget)
    : null;

  const ui = document.createElement('div');
  ui.className = 'pager';
  ui.innerHTML = `
    <button type="button" data-pg-prev aria-label="Previous page">←</button>
    <span class="pager-dots" aria-hidden="true"></span>
    <span class="pager-status" role="status" aria-live="polite"></span>
    <button type="button" data-pg-next aria-label="Next page">→</button>`;
  if (target) target.appendChild(ui);
  else listEl.insertAdjacentElement('afterend', ui);

  const prevBtn = ui.querySelector('[data-pg-prev]');
  const nextBtn = ui.querySelector('[data-pg-next]');
  const dots = ui.querySelector('.pager-dots');
  const status = ui.querySelector('.pager-status');

  let page = 0;

  const perPage = () =>
    mqMobile.matches
      ? parseInt(listEl.dataset.perPageMobile || listEl.dataset.perPage || items.length, 10)
      : parseInt(listEl.dataset.perPage || items.length, 10);

  const pages = () => Math.max(1, Math.ceil(items.length / perPage()));

  function render(animate) {
    const pp = perPage();
    const total = pages();
    page = Math.min(page, total - 1);
    items.forEach((it, i) => {
      const visible = i >= page * pp && i < (page + 1) * pp;
      if (visible) it.removeAttribute('data-page-hidden');
      else it.setAttribute('data-page-hidden', '');
    });
    ui.hidden = total <= 1;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page === total - 1;
    dots.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('');
    status.textContent = `${page + 1} / ${total}`;
    if (animate) {
      listEl.classList.remove('page-fade');
      void listEl.offsetWidth;
      listEl.classList.add('page-fade');
    }
  }

  const api = {
    pages,
    setPage(n) {
      const clamped = Math.max(0, Math.min(pages() - 1, n));
      if (clamped === page) return;
      page = clamped;
      render(true);
    },
    next() {
      api.setPage(page + 1);
    },
    prev() {
      api.setPage(page - 1);
    },
  };

  prevBtn.addEventListener('click', api.prev);
  nextBtn.addEventListener('click', api.next);
  mqMobile.addEventListener('change', () => {
    page = 0;
    render(false);
  });

  render(false);
  listEl._pager = api;
  return api;
}

export function initAllPagers() {
  document.querySelectorAll('[data-pager]').forEach((el) => createPager(el));
}
