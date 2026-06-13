// Generic ARIA tabs / segmented control (APG pattern: roving
// tabindex + arrow keys). Panel swap is a transform/opacity
// animation — panels are absolutely stacked, never scrolled.

function select(tabs, panels, tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    t.tabIndex = on ? 0 : -1;
  });
  panels.forEach((pn) => {
    const on = pn.id === tab.getAttribute('aria-controls');
    if (on) {
      pn.hidden = false;
      pn.classList.remove('is-in');
      void pn.offsetWidth; // restart entry animation
      pn.classList.add('is-in');
    } else {
      pn.hidden = true;
    }
  });
}

export function initTabs(root) {
  const tablist = root.querySelector('[role="tablist"]');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tabs, panels, tab));
    tab.addEventListener('keydown', (e) => {
      let to = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = tabs.length - 1;
      if (to >= 0) {
        e.preventDefault(); // also stops view-level arrow nav
        tabs[to].focus({ preventScroll: true });
        select(tabs, panels, tabs[to]);
      }
    });
  });

  select(tabs, panels, tabs[0]);
  return { select: (i) => select(tabs, panels, tabs[i]) };
}

export function initAllTabs() {
  document.querySelectorAll('[data-tabs]').forEach((root) => initTabs(root));
}
