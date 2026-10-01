import '@fontsource/press-start-2p/400.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';

import { createStage } from './stage.js';

const slides = [...document.querySelectorAll('.slide')];
const dotsEl = document.getElementById('dots');
const tocBtn = document.getElementById('toc-btn');
const toc = document.getElementById('toc');
const tocList = document.getElementById('toc-list');

let current = 0;
let stage = null;

// ---------- navegação ----------
function clamp(i) {
  return Math.max(0, Math.min(slides.length - 1, i));
}

function render() {
  slides.forEach((el, i) => {
    const active = i === current;
    el.classList.toggle('is-active', active);
    el.toggleAttribute('inert', !active);
    el.setAttribute('aria-hidden', String(!active));
    if (active) el.scrollTop = 0;
  });
  document.querySelectorAll('[data-nav-index]').forEach((btn) => {
    if (Number(btn.dataset.navIndex) === current) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
  stage?.setSlide(current, slides.length);
}

function go(index, { updateHash = true } = {}) {
  const next = clamp(index);
  if (next === current && document.querySelector('.slide.is-active')) return;
  current = next;
  render();
  if (updateHash) history.replaceState(null, '', `#${slides[current].id}`);
}

const next = () => go(current + 1);
const prev = () => go(current - 1);

document.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', next));
document.querySelectorAll('[data-prev]').forEach((b) => b.addEventListener('click', prev));

// pontos e índice
slides.forEach((slide, i) => {
  const title = slide.dataset.title || `Slide ${i + 1}`;

  const dotLi = document.createElement('li');
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.dataset.navIndex = i;
  dot.setAttribute('aria-label', `${i + 1}. ${title}`);
  dot.addEventListener('click', () => go(i));
  dotLi.append(dot);
  dotsEl.append(dotLi);

  const tocLi = document.createElement('li');
  const tocBtnItem = document.createElement('button');
  tocBtnItem.type = 'button';
  tocBtnItem.dataset.navIndex = i;
  tocBtnItem.textContent = `${i + 1}. ${title}`;
  tocBtnItem.addEventListener('click', () => {
    go(i);
    setToc(false);
  });
  tocLi.append(tocBtnItem);
  tocList.append(tocLi);
});

function setToc(open) {
  toc.hidden = !open;
  tocBtn.setAttribute('aria-expanded', String(open));
  if (open) toc.querySelector('button[aria-current="true"]')?.focus();
}

tocBtn.addEventListener('click', () => setToc(toc.hidden));

// ---------- teclado, roda e toque ----------
window.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      if (e.key === ' ' && e.target instanceof HTMLElement && e.target.closest('button, a')) return;
      e.preventDefault();
      next();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      prev();
      break;
    case 'Home':
      go(0);
      break;
    case 'End':
      go(slides.length - 1);
      break;
    case 'Escape':
      setToc(false);
      break;
    default:
      if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1);
  }
});

let wheelLock = false;
window.addEventListener(
  'wheel',
  (e) => {
    if (wheelLock || Math.abs(e.deltaY) < 24) return;
    const el = slides[current];
    const canScroll = el.scrollHeight > el.clientHeight + 2;
    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    if (canScroll && ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop))) return;
    wheelLock = true;
    setTimeout(() => (wheelLock = false), 700);
    if (e.deltaY > 0) next();
    else prev();
  },
  { passive: true },
);

let touch = null;
window.addEventListener(
  'touchstart',
  (e) => {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  },
  { passive: true },
);
window.addEventListener(
  'touchend',
  (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
  },
  { passive: true },
);

// ---------- hash inicial ----------
function fromHash() {
  const id = location.hash.slice(1);
  const i = slides.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}
window.addEventListener('hashchange', () => go(fromHash(), { updateHash: false }));

current = fromHash();
render();

// ---------- cena PixiJS ----------
createStage(document.getElementById('stage'))
  .then((s) => {
    stage = s;
    stage.setSlide(current, slides.length);
  })
  .catch((err) => {
    // a apresentação continua funcionando sem a cena animada
    console.warn('Cena PixiJS indisponível:', err);
  });
