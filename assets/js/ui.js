// Shared page chrome: header state, mobile menu, active nav link, sewn-in reveals.

document.documentElement.classList.remove('no-js');

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// ---------- header ----------
const top = $('.top');
const solidAt = () => (document.body.dataset.page === 'home' ? innerHeight * 0.6 : 24);
const onScroll = () => top.classList.toggle('scrolled', scrollY > solidAt());
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- mobile menu ----------
const menuBtn = $('.menu-btn');
const sheet = $('.sheet');

if (menuBtn && sheet) {
  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('locked', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('span').textContent = open ? 'Close' : 'Menu';
    sheet.toggleAttribute('inert', !open);
    if (open) $('a', sheet).focus({ preventScroll: true });
  };
  sheet.setAttribute('inert', '');
  menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
  $$('a', sheet).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setOpen(false);
      menuBtn.focus();
    }
  });
  // the menu is a phone and tablet affordance
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// ---------- active section in the nav ----------
const links = $$('.nav a[href^="#"]');
if (links.length) {
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('on'));
      byId.get(e.target.id)?.classList.add('on');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
}

// ---------- sewn-in reveals ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

$$('.sew').forEach((el) => {
  const group = el.closest('.labels, .ribbon');
  if (group) el.style.transitionDelay = ([...group.children].indexOf(el) % 3) * 70 + 'ms';
  io.observe(el);
});

export { $, $$ };
