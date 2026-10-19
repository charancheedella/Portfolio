import { $, $$ } from './ui.js';
import { Cloth, weave, fitFont, stitchRect, grommets } from './cloth.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

const loadImg = (src) => new Promise((res) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = () => res(null);
  i.src = src;
});

// ==========================================================================
// Textures
// ==========================================================================

function paintHero(x, tw, th) {
  x.fillStyle = '#2230ff';
  x.fillRect(0, 0, tw, th);
  weave(x, tw, th);

  const m = tw * 0.025;
  const portrait = th / tw > 0.6;
  stitchRect(x, m, m * 1.6, tw, th, m);
  grommets(x, m * 1.4, m * 0.8, tw, portrait ? 6 : 8, tw * (portrait ? 0.009 : 0.006));

  const inner = tw - m * 5;
  const s1 = fitFont(x, 'CHARAN', inner, 800);
  const s2 = fitFont(x, 'CHEEDELLA', inner, 800);
  x.fillStyle = '#f4f1ea';
  x.textBaseline = 'alphabetic';

  if (portrait) {
    // tall banner for phones: name up top, roles below a stitched rule
    const topY = th * 0.17;
    x.font = `800 ${s1}px Unbounded`;
    x.fillText('CHARAN', m * 2.5, topY + s1 * 0.72);
    x.font = `800 ${s2}px Unbounded`;
    const nameEnd = topY + s1 * 0.72 + s2 * 0.92;
    x.fillText('CHEEDELLA', m * 2.5, nameEnd);

    const ruleY = nameEnd + th * 0.09;
    x.save();
    x.setLineDash([tw * 0.012, tw * 0.008]);
    x.lineWidth = Math.max(2, tw * 0.0028);
    x.strokeStyle = 'rgba(244, 241, 234, 0.55)';
    x.beginPath();
    x.moveTo(m * 2.5, ruleY);
    x.lineTo(tw - m * 2.5, ruleY);
    x.stroke();
    x.restore();

    const rs = tw * 0.043;
    x.font = `700 ${rs}px Unbounded`;
    x.fillText('PRESIDENT', m * 2.5, ruleY + th * 0.075);
    x.globalAlpha = 0.72;
    x.font = `500 ${rs * 0.72}px Unbounded`;
    x.fillText('CSE CLUBS COUNCIL', m * 2.5, ruleY + th * 0.075 + rs * 1.15);
    x.globalAlpha = 1;
    x.font = `700 ${rs}px Unbounded`;
    x.fillText('CO-FOUNDER', m * 2.5, ruleY + th * 0.19);
    x.globalAlpha = 0.72;
    x.font = `500 ${rs * 0.72}px Unbounded`;
    x.fillText('JUST BETWEEN US', m * 2.5, ruleY + th * 0.19 + rs * 1.15);
    x.globalAlpha = 1;

    x.font = `500 ${tw * 0.034}px Unbounded`;
    x.fillText('FULL-STACK DEVELOPER', m * 2.5, th - m * 3);
    x.globalAlpha = 0.72;
    x.font = `500 ${tw * 0.028}px Unbounded`;
    x.fillText('ANDHRA PRADESH, INDIA', m * 2.5, th - m * 3 - tw * 0.055);
    x.globalAlpha = 1;
    return;
  }

  const topY = th * 0.24;
  x.font = `800 ${s1}px Unbounded`;
  x.fillText('CHARAN', m * 2.5, topY + s1 * 0.72);
  x.font = `800 ${s2}px Unbounded`;
  x.fillText('CHEEDELLA', m * 2.5, topY + s1 * 0.72 + s2 * 0.92);

  x.font = `500 ${tw * 0.02}px Unbounded`;
  x.fillText('FULL-STACK DEVELOPER', m * 2.5, th - m * 3);
  x.textAlign = 'right';
  x.fillText('ANDHRA PRADESH · 2026', tw - m * 2.5, th - m * 3);
  x.textAlign = 'left';
  x.globalAlpha = 0.72;
  x.font = `500 ${tw * 0.016}px Unbounded`;
  x.fillText('PRESIDENT, CSE CLUBS COUNCIL  ·  CO-FOUNDER, JUST BETWEEN US', m * 2.5, topY - m * 0.9);
  x.globalAlpha = 1;
}

// a black and white photo printed on unbleached cotton
function paintPrint(photo) {
  return (x, tw, th) => {
    x.fillStyle = '#f1ede4';
    x.fillRect(0, 0, tw, th);
    weave(x, tw, th, 0.045);

    const m = tw * 0.07;
    const pw = tw - m * 2;
    const ph = pw * 1.25;
    if (photo) {
      x.drawImage(photo, m, m * 1.2, pw, ph);
      // the cotton shows through the ink a little
      weave(x, tw, th, 0.035);
    }
    x.fillStyle = '#161616';
    x.textBaseline = 'alphabetic';
    const capY = m * 1.2 + ph + (th - m * 1.2 - ph) * 0.48;
    x.font = `700 ${tw * 0.034}px Unbounded`;
    x.fillText('VENKATA SAI CHARAN', m, capY);
    x.textAlign = 'right';
    x.font = `500 ${tw * 0.03}px Unbounded`;
    x.globalAlpha = 0.6;
    x.fillText('2026', tw - m, capY);
    x.globalAlpha = 1;
    x.textAlign = 'left';
  };
}

// swallowtail pennant: transparent pixels are cut out of the cloth
function paintPennant({ color, logo, logoW = 0.62, role, sub }) {
  return (x, tw, th) => {
    const notch = th * 0.8;
    x.beginPath();
    x.moveTo(0, 0); x.lineTo(tw, 0); x.lineTo(tw, th); x.lineTo(tw / 2, notch); x.lineTo(0, th);
    x.closePath();
    x.save();
    x.clip();
    x.fillStyle = color;
    x.fillRect(0, 0, tw, th);
    weave(x, tw, th, 0.07);
    x.restore();

    const m = tw * 0.06;
    x.beginPath();
    x.moveTo(m, m * 1.5); x.lineTo(tw - m, m * 1.5); x.lineTo(tw - m, th - m * 1.6);
    x.lineTo(tw / 2, notch - m * 1.2); x.lineTo(m, th - m * 1.6);
    x.closePath();
    x.setLineDash([tw * 0.03, tw * 0.02]);
    x.lineWidth = Math.max(2, tw * 0.006);
    x.strokeStyle = 'rgba(244, 241, 234, 0.5)';
    x.stroke();
    x.setLineDash([]);

    grommets(x, m * 1.2, m * 0.75, tw, 3, tw * 0.014);

    if (logo) {
      const w = tw * logoW;
      const h = w * logo.height / logo.width;
      x.drawImage(logo, (tw - w) / 2, th * 0.3 - h / 2, w, h);
    }

    x.fillStyle = '#f4f1ea';
    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';
    const s = Math.min(fitFont(x, role, tw * 0.7, 800), tw * 0.1);
    x.font = `800 ${s}px Unbounded`;
    x.fillText(role, tw / 2, th * 0.56);
    x.globalAlpha = 0.72;
    x.font = `500 ${tw * 0.042}px Unbounded`;
    x.fillText(sub, tw / 2, th * 0.56 + s * 0.95);
    x.globalAlpha = 1;
  };
}

// ==========================================================================
// Layouts (CSS px inside each host)
// ==========================================================================

function heroLayout(W, H) {
  const narrow = W < 640;
  if (narrow) {
    // fill the space between the header and the intro + button underneath
    const below = document.querySelector('.controls').offsetHeight + 56;
    const oy = 100;
    const bw = W - 36;
    const bh = Math.max(260, Math.min(bw * 1.45, H - oy - below));
    return { bw, bh, ox: 18, oy, cols: 26 };
  }
  const bw = Math.min(W * 0.8, 1280);
  const bh = Math.min(bw * 0.46, H * 0.64);
  return { bw, bh, ox: (W - bw) / 2, oy: Math.max(110, H * 0.15), cols: 44 };
}

function printLayout(W, H) {
  const bw = Math.min(W * (W < 640 ? 0.78 : 0.82), 420);
  const bh = Math.min(bw * 1.48, H - 70);
  return { bw, bh, ox: (W - bw) / 2, oy: 34, cols: 15 };
}

function pennantLayout(W, H) {
  const bw = Math.min(W * (W < 640 ? 0.6 : 0.72), 330);
  const bh = Math.min(bw * 1.4, H - 70);
  return { bw, bh, ox: (W - bw) / 2, oy: 34, cols: 16 };
}

// ==========================================================================
// Cloths
// ==========================================================================

const [ccc, jbu, photo] = await Promise.all([
  loadImg('assets/images/leadership/ccc-white.webp'),
  loadImg('assets/images/leadership/jbu.webp'),
  loadImg('assets/images/about/charan-print.webp'),
  document.fonts.load('800 100px Unbounded'),
  document.fonts.load('700 100px Unbounded'),
  document.fonts.load('500 100px Unbounded')
]);

const hero = new Cloth({ host: $('#stage'), canvas: $('#hero-cloth'), rod: $('#hero-rod'), layout: heroLayout, paint: paintHero });
const cloths = [
  hero,
  new Cloth({ host: $('#print'), canvas: $('#print-cloth'), rod: $('#print-rod'), layout: printLayout, paint: paintPrint(photo), wind: 0.8 }),
  new Cloth({
    host: $('#ccc-host'), canvas: $('#ccc-cloth'), rod: $('#ccc-rod'), layout: pennantLayout, wind: 1.5,
    paint: paintPennant({ color: '#2230ff', logo: ccc, role: 'PRESIDENT', sub: '13 CLUBS, ONE COUNCIL' })
  }),
  new Cloth({
    host: $('#jbu-host'), canvas: $('#jbu-cloth'), rod: $('#jbu-rod'), layout: pennantLayout, wind: 1.5,
    paint: paintPennant({ color: '#161616', logo: jbu, logoW: 0.74, role: 'CO-FOUNDER', sub: 'DEPUTY SHOW DIRECTOR' })
  })
];
// the hero hangs straight away; the rest are cut and hung as you scroll toward them
hero.build();
const hang = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    cloths.find((c) => c.host === e.target)?.build();
    hang.unobserve(e.target);
  });
}, { rootMargin: '600px 0px' });
cloths.slice(1).forEach((c) => hang.observe(c.host));
document.body.classList.add('cloth-ready');

// let the page finish loading before the breeze starts
const start = () => setTimeout(() => Cloth.run(cloths), 250);
if (document.readyState === 'complete') start();
else addEventListener('load', start, { once: true });

// unhook the top-right corner: it flops over and hangs as a flap
const unhookBtn = $('#unhook');
// without WebGL the cloth is a flat print, so there's nothing to pull
if (!hero.gl) $$('#unhook, .hint-fine, .hint-touch').forEach((el) => el.remove());
const resetUnhook = () => { unhookBtn.textContent = 'Unhook a corner'; };
unhookBtn.addEventListener('click', () => {
  if (!hero.dropped) {
    hero.unhook((c, cols) => c >= cols - Math.max(3, Math.round(cols * 0.14)));
    unhookBtn.textContent = 'Hang it back up';
  } else {
    hero.build();
    resetUnhook();
  }
});

let lastW = innerWidth;
let rt;
addEventListener('resize', () => {
  if (innerWidth === lastW) return; // ignore mobile toolbar height changes
  lastW = innerWidth;
  clearTimeout(rt);
  rt = setTimeout(() => {
    cloths.forEach((c) => { if (c.P || c === hero) c.build(); });
    resetUnhook();
  }, 200);
});

// ==========================================================================
// Testimonials: one sheet on the line, name tags to choose
// ==========================================================================

const sheet = $('#t-sheet');
const quotes = $$('.kw', sheet);
const tabs = $$('.kind-tabs [role="tab"]');
const countEl = $('#t-count b');
let current = 0;

function show(i, { focus = false } = {}) {
  i = (i + quotes.length) % quotes.length;
  if (i === current) return;
  const dir = i > current ? 1 : -1;

  // hold the old height, swap the text, then ease to the new height
  const from = sheet.offsetHeight;
  quotes[current].classList.remove('on');
  quotes[i].classList.add('on');
  const to = sheet.offsetHeight;
  if (!reduce && from !== to) {
    sheet.style.height = from + 'px';
    void sheet.offsetHeight;
    sheet.style.height = to + 'px';
    sheet.addEventListener('transitionend', () => { sheet.style.height = ''; }, { once: true });
  }
  if (!reduce) {
    sheet.style.setProperty('--dir', dir * 1.4 + 'deg');
    sheet.classList.remove('swing');
    void sheet.offsetWidth;
    sheet.classList.add('swing');
  }

  tabs.forEach((t, k) => {
    t.setAttribute('aria-selected', String(k === i));
    t.tabIndex = k === i ? 0 : -1;
  });
  tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  if (focus) tabs[i].focus({ preventScroll: true });
  countEl.textContent = String(i + 1).padStart(2, '0');
  current = i;
  elapsed = 0;
}

tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
$('#t-prev').addEventListener('click', () => show(current - 1));
$('#t-next').addEventListener('click', () => show(current + 1));

// arrow keys move between the tags, like any tab list
$('.kind-tabs').addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (step) { e.preventDefault(); show(current + step, { focus: true }); }
  if (e.key === 'Home') { e.preventDefault(); show(0, { focus: true }); }
  if (e.key === 'End') { e.preventDefault(); show(quotes.length - 1, { focus: true }); }
});

// ---------- moving on its own ----------
// each testimonial stays up long enough to read: about 0.2s a word, plus a beat
const words = quotes.map((q) => q.textContent.trim().split(/\s+/).length);
const dwell = (i) => Math.max(9, 4 + words[i] * 0.2) * 1000;
let elapsed = 0;
let last = 0;
const hold = new Set(); // reasons to pause: hover, focus, touch, offscreen
let onScreen = false;

new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.35 }).observe(sheet);
const testimonials = $('#testimonials');
[sheet, $('.kind-tabs'), $('.t-ctrl')].forEach((el) => {
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold.add('hover'); });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hold.delete('hover'); });
});
testimonials.addEventListener('focusin', () => hold.add('focus'));
testimonials.addEventListener('focusout', (e) => { if (!testimonials.contains(e.relatedTarget)) hold.delete('focus'); });
let touchTimer;
const touched = () => { hold.add('touch'); clearTimeout(touchTimer); touchTimer = setTimeout(() => hold.delete('touch'), 6000); };
sheet.addEventListener('touchstart', touched, { passive: true });
$('.kind-tabs').addEventListener('touchstart', touched, { passive: true });

function tick(now) {
  const dt = last ? Math.min(now - last, 100) : 0;
  last = now;
  const paused = hold.size > 0 || !onScreen || document.hidden;
  testimonials.classList.toggle('paused', paused);
  if (!paused) {
    elapsed += dt;
    if (elapsed >= dwell(current)) show(current + 1);
  }
  const p = Math.min(elapsed / dwell(current), 1).toFixed(4);
  tabs[current].style.setProperty('--p', p);
  sheet.style.setProperty('--p', p);
  requestAnimationFrame(tick);
}
if (!reduce) {
  testimonials.classList.add('auto');
  requestAnimationFrame(tick);
}

// swipe the sheet sideways on touch screens
let sx = 0, sy = 0;
sheet.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
sheet.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(current + (dx < 0 ? 1 : -1));
}, { passive: true });

// ==========================================================================
// Skill patches: they come off. Drag them with a mouse or pen.
// ==========================================================================

if (finePointer) {
  $('#patch-hint').textContent = 'What I work with. They come off, try dragging one.';
  $$('.patch').forEach((p) => {
    let sx = 0, sy = 0, bx = 0, by = 0, on = false;
    p.classList.add('grab');
    p.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      on = true;
      sx = e.clientX;
      sy = e.clientY;
      p.setPointerCapture(e.pointerId);
      p.classList.add('dragging');
    });
    p.addEventListener('pointermove', (e) => {
      if (!on) return;
      p.style.setProperty('--x', bx + e.clientX - sx + 'px');
      p.style.setProperty('--y', by + e.clientY - sy + 'px');
    });
    const end = (e) => {
      if (!on) return;
      on = false;
      bx += e.clientX - sx;
      by += e.clientY - sy;
      p.classList.remove('dragging');
    };
    p.addEventListener('pointerup', end);
    p.addEventListener('pointercancel', end);
  });
} else {
  $$('.patch').forEach((p) => { p.style.touchAction = 'auto'; });
}

// ==========================================================================
// Contact: the luggage tag
// ==========================================================================

const form = $('#tag');
const status = $('#tag-status');
const sendBtn = $('#tag-send');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  sendBtn.disabled = true;
  form.classList.remove('sent');
  sendBtn.textContent = 'Send note ↗';
  status.className = 'status';
  status.textContent = 'Sending…';
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    if (!res.ok) throw new Error(res.status);
    form.classList.add('sent');
    form.reset();
    status.textContent = "Sent. I'll reply by email.";
    sendBtn.textContent = 'Send another';
  } catch {
    status.className = 'status err';
    status.innerHTML = 'That didn\'t go through. Email me at <a href="mailto:charancheedella012@gmail.com">charancheedella012@gmail.com</a>.';
  } finally {
    sendBtn.disabled = false;
  }
});
form.addEventListener('input', () => {
  if (form.classList.contains('sent')) {
    form.classList.remove('sent');
    status.textContent = '';
    sendBtn.textContent = 'Send note ↗';
  }
});
