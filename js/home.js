// Home behaviors: stat counters animate once on the view's first
// entry (view:enter event — not IntersectionObserver, which is
// unreliable across stacked hidden views), plus the mobile pillar
// "ticker". The ticker is manual — tap to advance — because
// auto-advancing carousels are explicitly out of scope.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function runCounters(viewEl) {
  viewEl.querySelectorAll('.count').forEach((el) => {
    const to = parseInt(el.dataset.count, 10);
    const from = parseInt(el.dataset.countFrom || '0', 10);
    if (reduced()) {
      el.textContent = String(to);
      return;
    }
    const t0 = performance.now();
    const dur = 950;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(from + (to - from) * easeOut(p)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function buildTicker() {
  const ticker = document.querySelector('.pillar-ticker');
  if (!ticker) return;
  const items = [...document.querySelectorAll('.pillar')].map((p) => ({
    title: p.querySelector('h3').textContent.replace(/New$/, '').trim(),
    text: p.querySelector('p').textContent,
  }));
  ticker.removeAttribute('aria-hidden');
  ticker.innerHTML = `
    <button class="pt-slot" type="button" aria-label="Show next service pillar"></button>
    <span class="pt-dots" aria-hidden="true">${items.map(() => '<i></i>').join('')}</span>`;
  const slot = ticker.querySelector('.pt-slot');
  const dots = [...ticker.querySelectorAll('.pt-dots i')];
  let i = 0;
  const render = () => {
    slot.innerHTML = `<strong>${items[i].title}</strong> — ${items[i].text}`;
    dots.forEach((d, n) => d.classList.toggle('on', n === i));
  };
  slot.addEventListener('click', () => {
    i = (i + 1) % items.length;
    render();
  });
  render();
}

export function initHome() {
  let counted = false;
  document.addEventListener('view:enter', (e) => {
    if (e.detail.view !== 'home' || counted) return;
    counted = true;
    runCounters(e.detail.el);
  });
  buildTicker();
}
