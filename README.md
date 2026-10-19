# Charan Cheedella · Portfolio

The personal site of Venkata Sai Charan Cheedella, full-stack developer from Andhra Pradesh, India, and CS (AIML) student at Vel Tech University, Chennai.

**Live:** [www.charancheedella.xyz](https://www.charancheedella.xyz)

## The idea

The whole site is built around fabric. The name hangs on a cloth banner you can grab and pull, the portrait is a black and white print on cotton, the leadership roles are pennants, projects are woven labels, experience is a row of care labels, testimonials are notes pegged to a line, and the contact form is a luggage tag.

The cloth is a real simulation: a Verlet particle grid with structural, shear and bend constraints, rendered with WebGL2 and lit so the folds catch light. Each cloth only simulates while it is on screen.

## Stack

- HTML, CSS and JavaScript (ES modules). No framework, no build step.
- WebGL2 for the cloth, with a flat canvas fallback where WebGL isn't available.
- Hosted on GitHub Pages with a custom domain.

## Structure

```
├── index.html              home page
├── projects/               one case study per project
├── pro.html                old "all projects" URL, redirects to /#work
├── 404.html
├── assets/
│   ├── css/site.css        all styles, mobile first
│   ├── js/
│   │   ├── cloth.js        the cloth simulation and renderer
│   │   ├── ui.js           header, mobile menu, active nav, reveals
│   │   ├── home.js         home page: cloths, testimonials line, patches, contact form
│   │   └── case.js         case study swatch
│   ├── images/             portrait print, logos, project photos, social image
│   └── icons/              favicons and web manifest
├── favicon.ico
└── CNAME
```

## Running it locally

Any static server works, because the scripts are ES modules:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Accessibility and behaviour

- Mobile first, tested from 360px phones up to wide desktops.
- On touch screens a vertical swipe over the cloth scrolls the page and a sideways drag pulls it.
- Respects `prefers-reduced-motion`: no breeze, no reveal animations.
- Every piece of text drawn on a cloth is also in the page as real text.

## Contact

[charancheedella012@gmail.com](mailto:charancheedella012@gmail.com) · [LinkedIn](https://www.linkedin.com/in/charan-cheedella) · [GitHub](https://github.com/charancheedella)

Designed and built by Venkata Sai Charan Cheedella.
