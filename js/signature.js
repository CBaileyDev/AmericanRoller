// Signature element behavior: explode/peel toggle on both the
// roller (Home) and the tank cutaway (Lining), plus the mobile
// viewBox crop that keeps the tank's layered wall readable in a
// 150px band.

const mqMobile = window.matchMedia('(max-width: 768px)');
const TANK_FULL = '0 0 560 470';
const TANK_BAND = '180 170 240 250';

export function initSignatures() {
  document.querySelectorAll('.signature').forEach((btn) => {
    btn.addEventListener('click', () => {
      const on = btn.classList.toggle('is-exploded');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  const tankSvg = document.querySelector('.tank-svg');
  if (tankSvg) {
    const applyCrop = () => {
      tankSvg.setAttribute('viewBox', mqMobile.matches ? TANK_BAND : TANK_FULL);
    };
    mqMobile.addEventListener('change', applyCrop);
    applyCrop();
  }
}
