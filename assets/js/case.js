import { $ } from './ui.js';
import { Cloth, weave, fitFont, stitchRect, grommets } from './cloth.js';

// each case study hangs a swatch in the project's colour, like the selvedge on its label
const host = $('#swatch');
const { color, num, name, kind } = host.dataset;
const fg = 'ink' in host.dataset ? '#161616' : '#f4f1ea';

function paint(x, tw, th) {
  x.fillStyle = color;
  x.fillRect(0, 0, tw, th);
  weave(x, tw, th, 0.07);

  const m = tw * 0.06;
  stitchRect(x, m, m * 1.7, tw, th, m, fg === '#161616' ? 'rgba(22, 22, 22, 0.4)' : 'rgba(244, 241, 234, 0.55)');
  grommets(x, m * 1.3, m * 0.85, tw, 4, tw * 0.013);

  x.fillStyle = fg;
  x.textBaseline = 'alphabetic';
  x.font = `800 ${tw * 0.3}px Unbounded`;
  x.fillText(num, m * 1.9, m * 1.9 + tw * 0.27);

  x.globalAlpha = 0.72;
  x.font = `500 ${tw * 0.042}px Unbounded`;
  x.fillText(kind.toUpperCase(), m * 1.9, th - m * 2.1);
  x.globalAlpha = 1;

  // the name, set as large as it fits on up to three lines
  const words = name.toUpperCase().split(' ');
  const maxW = tw - m * 3.8;
  const lines = [];
  let cur = '';
  x.font = `800 100px Unbounded`;
  const fits = (s) => fitFont(x, s, maxW, 800) >= tw * 0.085;
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && !fits(next)) { lines.push(cur); cur = w; } else cur = next;
  }
  lines.push(cur);
  const size = Math.min(tw * 0.13, ...lines.map((l) => fitFont(x, l, maxW, 800)));
  x.font = `800 ${size}px Unbounded`;
  const base = th - m * 2.1 - tw * 0.07;
  lines.reverse().forEach((l, i) => x.fillText(l, m * 1.9, base - i * size * 0.98));
}

function layout(W, H) {
  const bw = Math.min(W * (W < 640 ? 0.62 : 0.74), 360);
  const bh = Math.min(bw * 1.32, H - 70);
  return { bw, bh, ox: (W - bw) / 2, oy: 34, cols: 16 };
}

await Promise.all([document.fonts.load('800 100px Unbounded'), document.fonts.load('500 100px Unbounded')]);
const swatch = new Cloth({ host, canvas: $('#swatch-cloth'), rod: $('#swatch-rod'), layout, paint, wind: 1.3 });
swatch.build();
Cloth.run([swatch]);

let lastW = innerWidth;
addEventListener('resize', () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  swatch.build();
});
