// Locations view: the dot-matrix North America map (a hand-tweakable
// ASCII bitmap rendered as a circle grid — deliberately blocky, so it
// reads as stylized rather than mis-drawn), facility pins, pin↔list
// hover sync, and the UI-only "find a rep" selects.

const CELL = 14;
const OFFSET_Y = 6;

// 40×26 cells. '#' = land dot. The Great Lakes void (cols ~21-24,
// rows 8-9) is what makes the WI/IL/MI facility cluster legible.
const MAP_ROWS = [
  '....................####................',
  '.####..............######..##...........',
  '.#####.........##########.###..#........',
  '..####...##########...#######.####......',
  '...##..##########....########..####.....',
  '....#..##########....#########..####....',
  '......##########....##########..###.....',
  '......###########...###########...#.....',
  '.......##############....######.........',
  '......################..########........',
  '......#########################.........',
  '.......#######################..........',
  '.......######################...........',
  '........#####################...........',
  '........##..######........##............',
  '........#..#####..........##............',
  '.........#..####...........#............',
  '............#####..##...................',
  '.............#####.##...................',
  '..............####.##...................',
  '...............#####....................',
  '................####....................',
  '.................###....................',
  '..................##....................',
  '...................##...................',
  '....................#...................',
];

// Facility pins, hand-placed on the same cell grid (col, row, label).
const PINS = [
  ['union-grove', 20.2, 8.75, 'UNION GROVE, WI'],
  ['oshkosh', 20.1, 8.1, 'OSHKOSH, WI'],
  ['chicago', 21.2, 9.7, 'CHICAGO, IL'],
  ['riverdale', 21.65, 9.95, 'RIVERDALE, IL'],
  ['walkerton', 22.6, 10.15, 'WALKERTON, IN'],
  ['redford', 23.9, 9.25, 'REDFORD, MI'],
  ['mississauga', 24.9, 8.35, 'MISSISSAUGA, ON'],
  ['waterbury', 29.3, 9.45, 'WATERBURY, CT'],
  ['covington', 27.8, 10.9, 'COVINGTON, VA'],
  ['rock-hill', 27.0, 12.0, 'ROCK HILL, SC'],
  ['arlington', 23.0, 12.25, 'ARLINGTON, TN'],
  ['paris', 20.8, 12.8, 'PARIS, AR'],
];

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildDots(host) {
  const frag = document.createDocumentFragment();
  MAP_ROWS.forEach((row, r) => {
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] !== '#') continue;
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', c * CELL + CELL / 2);
      dot.setAttribute('cy', r * CELL + CELL / 2 + OFFSET_Y);
      dot.setAttribute('r', 3.1);
      frag.appendChild(dot);
    }
  });
  host.appendChild(frag);
}

function buildPins(host) {
  PINS.forEach(([id, col, row, label]) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('pin');
    g.dataset.pin = id;
    const x = col * CELL + CELL / 2;
    const y = row * CELL + CELL / 2 + OFFSET_Y;
    g.setAttribute('transform', `translate(${x} ${y})`);
    g.innerHTML = `
      <circle class="pin-ring" r="5"></circle>
      <circle class="pin-core" r="3.6"></circle>
      <text class="pin-label" x="9" y="4">${label}</text>`;
    if (id === 'redford') g.classList.add('pin--new');
    host.appendChild(g);
  });
}

function syncListToPins(view) {
  const pinFor = (id) => view.querySelector(`.pin[data-pin="${id}"]`);
  view.querySelectorAll('.loc-list li[data-pin]').forEach((li) => {
    const hot = (on) => {
      const pin = pinFor(li.dataset.pin);
      if (pin) pin.classList.toggle('is-hot', on);
    };
    li.addEventListener('mouseenter', () => hot(true));
    li.addEventListener('mouseleave', () => hot(false));
    li.addEventListener('focusin', () => hot(true));
    li.addEventListener('focusout', () => hot(false));
  });
}

function initFindRep(view) {
  const country = view.querySelector('#rep-country');
  const state = view.querySelector('#rep-state');
  const note = view.querySelector('[data-rep-note]');
  const update = () => {
    const where = state.value || country.value;
    note.innerHTML = where
      ? `Your ${where} rep is one call away — <a class="tel" href="tel:+12628788665">262.878.8665</a>`
      : `Find a rep — call <a class="tel" href="tel:+12628788665">262.878.8665</a>`;
  };
  country.addEventListener('change', update);
  state.addEventListener('change', update);
}

export function initLocations() {
  const view = document.querySelector('.view--locations');
  buildDots(view.querySelector('[data-map-dots]'));
  buildPins(view.querySelector('[data-map-pins]'));
  syncListToPins(view);
  initFindRep(view);

  // Mobile: crop the viewBox to the continent so the dots stay legible
  // in the short map band.
  const svg = view.querySelector('.map-svg');
  const mq = window.matchMedia('(max-width: 768px)');
  const applyCrop = () => svg.setAttribute('viewBox', mq.matches ? '14 14 480 366' : '0 0 560 400');
  mq.addEventListener('change', applyCrop);
  applyCrop();
}
