// Verlet cloth rendered with WebGL2, one instance per canvas.
//
//   const c = new Cloth({ host, canvas, rod, layout, paint, wind });
//   c.build();                   // (re)measure the host, rebuild grid and texture
//   c.unhook((c, cols) => ...);  // release top-row pins matching the predicate
//   Cloth.run([c, ...]);         // one shared animation loop
//
// layout(W, H) -> { bw, bh, ox, oy, cols }   cloth size and position inside the host, in CSS px
// paint(ctx, tw, th)                          draws the texture; transparent pixels are cut out
//
// On touch screens the host uses `touch-action: pan-y`: a vertical swipe scrolls the page
// (the browser cancels our pointer), a sideways drag pulls the cloth.

const VS = `#version 300 es
in vec3 aPos; in vec3 aNor; in vec2 aUv;
uniform vec2 uRes;
out vec3 vNor; out vec2 vUv;
void main() {
  vec2 clip = (aPos.xy / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, clamp(aPos.z / 3000.0, -1.0, 1.0), 1.0);
  vNor = aNor; vUv = aUv;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vNor; in vec2 vUv;
uniform sampler2D uTex;
out vec4 o;
void main() {
  vec4 tex = texture(uTex, vUv);
  if (tex.a < 0.5) discard;
  vec3 n = normalize(vNor);
  if (n.z > 0.0) n = -n; // both sides of the cloth face the viewer
  vec3 L = normalize(vec3(-0.45, -0.7, -0.55));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float sheen = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, -1.0)), 0.0, 1.0), 18.0);
  o = vec4(tex.rgb * (0.42 + 0.72 * diff) + sheen * 0.08, 1.0);
}`;

const WALL = 90; // how far the cloth can be pushed back before it meets the wall
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = () => Math.min(devicePixelRatio || 1, 2);

export class Cloth {
  constructor(opts) {
    Object.assign(this, { wind: 1, iterations: 10, resting: 6, rod: null }, opts);
    this.ptr = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, grab: -1 };
    this.visible = false;
    this.dropped = false;
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(this.host);
  }

  // a GL context is the most expensive thing here, so it's only made when the cloth is first hung
  context() {
    if (this.gl || this.ctx2d) return;
    this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (this.gl) {
      this.initGL();
      this.bindPointer();
    } else {
      this.ctx2d = this.canvas.getContext('2d');
    }
  }

  // ---------- setup ----------
  initGL() {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    this.buf = { pos: gl.createBuffer(), nor: gl.createBuffer(), uv: gl.createBuffer(), idx: gl.createBuffer() };
    this.tex = gl.createTexture();
    this.uRes = gl.getUniformLocation(prog, 'uRes');

    const bind = (buf, name, size) => {
      const loc = gl.getAttribLocation(prog, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    bind(this.buf.pos, 'aPos', 3);
    bind(this.buf.nor, 'aNor', 3);
    bind(this.buf.uv, 'aUv', 2);
    gl.enable(gl.DEPTH_TEST);
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  }

  build() {
    this.context();
    const W = this.W = this.host.clientWidth;
    const H = this.H = this.host.clientHeight;
    this.canvas.width = Math.round(W * DPR());
    this.canvas.height = Math.round(H * DPR());

    const { bw, bh, ox, oy, cols } = this.layout(W, H);
    Object.assign(this, { bw, bh, ox, oy, cols });
    const gap = this.gap = bw / (cols - 1);
    const rows = this.rows = Math.round(bh / gap) + 1;
    const n = cols * rows;

    if (this.rod) {
      this.rod.style.left = ox - 24 + 'px';
      this.rod.style.width = bw + 48 + 'px';
      this.rod.style.top = oy - 7 + 'px';
      this.rod.style.visibility = 'visible';
    }

    const texture = this.texture();

    if (!this.gl) {
      // no WebGL2: show the artwork flat, still on its rod
      const x = this.ctx2d;
      x.setTransform(DPR(), 0, 0, DPR(), 0, 0);
      x.clearRect(0, 0, W, H);
      x.drawImage(texture, ox, oy, bw, bh);
      return;
    }

    this.P = new Float32Array(n * 3);
    this.PP = new Float32Array(n * 3);
    this.N = new Float32Array(n * 3);
    this.pinned = new Uint8Array(n);
    const P = this.P, PP = this.PP;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = (r * cols + c) * 3;
      P[k] = PP[k] = ox + c * gap;
      P[k + 1] = PP[k + 1] = oy + r * gap;
      P[k + 2] = 0;
      PP[k + 2] = (Math.random() - 0.5) * 3; // a small kick so it settles with some life
    }
    for (let c = 0; c < cols; c++) this.pinned[c] = 1;

    // constraints: [a, b, restLength, kind] where kind 0 = structural, 1 = bend, 2 = shear
    const list = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (c < cols - 1) list.push(i, i + 1, gap, 0);
      if (r < rows - 1) list.push(i, i + cols, gap, 0);
      // shear: keeps each cell square, so lettering doesn't step sideways between columns
      if (c < cols - 1 && r < rows - 1) {
        list.push(i, i + cols + 1, gap * Math.SQRT2, 2);
        list.push(i + 1, i + cols, gap * Math.SQRT2, 2);
      }
      if (c < cols - 2) list.push(i, i + 2, gap * 2, 1);
      if (r < rows - 2) list.push(i, i + cols * 2, gap * 2, 1);
    }
    this.cons = new Float32Array(list);
    this.dropped = false;
    this.upload(texture);
    this.render();
  }

  // texture at roughly device resolution, capped
  texture() {
    const tw = Math.min(2048, Math.pow(2, Math.ceil(Math.log2(this.bw * DPR()))));
    const th = Math.round(tw * this.bh / this.bw);
    const cv = document.createElement('canvas');
    cv.width = tw;
    cv.height = th;
    this.paint(cv.getContext('2d'), tw, th);
    return cv;
  }

  upload(texture) {
    const gl = this.gl, { cols, rows } = this;
    const uv = new Float32Array(cols * rows * 2);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      uv[i * 2] = c / (cols - 1);
      uv[i * 2 + 1] = r / (rows - 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.uv);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.pos);
    gl.bufferData(gl.ARRAY_BUFFER, this.P.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.nor);
    gl.bufferData(gl.ARRAY_BUFFER, this.N.byteLength, gl.DYNAMIC_DRAW);

    const idx = [];
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const i = r * cols + c;
      idx.push(i, i + 1, i + cols, i + 1, i + cols + 1, i + cols);
    }
    this.count = idx.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buf.idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  unhook(pred) {
    if (!this.P) return;
    for (let c = 0; c < this.cols; c++) if (pred(c, this.cols)) this.pinned[c] = 0;
    this.dropped = true;
  }

  // ---------- pointer ----------
  local(e) {
    const r = this.host.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  nearest(x, y, maxD) {
    const P = this.P;
    let best = -1, bd = maxD * maxD;
    for (let i = 0, n = this.cols * this.rows; i < n; i++) {
      const dx = P[i * 3] - x, dy = P[i * 3 + 1] - y;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  bindPointer() {
    const h = this.host, p = this.ptr;
    const skip = (e) => e.target.closest('button, a, input, textarea');

    h.addEventListener('pointermove', (e) => {
      [p.x, p.y] = this.local(e);
      if (e.pointerType === 'mouse' && p.grab < 0 && this.P) {
        h.classList.toggle('over', this.nearest(p.x, p.y, this.gap * 1.2) >= 0);
      }
    });
    h.addEventListener('pointerdown', (e) => {
      if (skip(e) || !this.P) return;
      [p.x, p.y] = this.local(e);
      p.px = p.x;
      p.py = p.y;
      p.grab = this.nearest(p.x, p.y, this.gap * 1.6);
      if (p.grab >= 0) {
        h.classList.add('drag');
        h.setPointerCapture(e.pointerId);
        if (e.pointerType === 'mouse') e.preventDefault();
      }
    });
    const release = (e) => {
      p.grab = -1;
      h.classList.remove('drag');
      // a finger that lifted shouldn't keep brushing the cloth
      if (e.pointerType !== 'mouse') p.x = p.y = p.px = p.py = -1e4;
    };
    h.addEventListener('pointerup', release);
    h.addEventListener('pointercancel', release); // fired when the browser takes over to scroll
    h.addEventListener('pointerleave', () => { if (p.grab < 0) p.x = p.y = p.px = p.py = -1e4; });
  }

  // ---------- simulation ----------
  step(t) {
    const { P, PP, pinned, cons, cols, rows, gap, W, H, ptr } = this;
    const n = cols * rows;
    const g = 0.42;
    const floor = H - 6;

    if (ptr.px < -9e3) { ptr.px = ptr.x; ptr.py = ptr.y; }
    const mvx = Math.max(-40, Math.min(40, ptr.x - ptr.px));
    const mvy = Math.max(-40, Math.min(40, ptr.y - ptr.py));
    ptr.px = ptr.x;
    ptr.py = ptr.y;
    const R = gap * 4.5;
    const wind = REDUCE ? 0 : this.wind;

    for (let i = 0; i < n; i++) {
      if (pinned[i]) continue;
      const k = i * 3;
      const x = P[k], y = P[k + 1], z = P[k + 2];
      let vx = (x - PP[k]) * 0.985;
      let vy = (y - PP[k + 1]) * 0.985;
      // the cloth hangs in front of a wall: a soft pull back toward its plane keeps it facing you
      let vz = (z - PP[k + 2]) * 0.97 - z * 0.004;

      // a slow breeze, stronger toward the free bottom edge
      const r = ((i / cols) | 0) / rows;
      vz += (Math.sin(t * 1.4 + x * 0.008 + y * 0.004) * 0.11 * r + Math.sin(t * 0.6 + x * 0.002) * 0.05) * wind;

      // the cursor brushes the cloth: pushes it back and drags it along
      const dx = x - ptr.x, dy = y - ptr.y;
      const d2 = dx * dx + dy * dy;
      if (ptr.grab < 0 && d2 < R * R) {
        const f = 1 - Math.sqrt(d2) / R;
        vz += f * 1.6;
        vx += mvx * f * 0.08;
        vy += mvy * f * 0.08;
      }

      PP[k] = x; PP[k + 1] = y; PP[k + 2] = z;
      P[k] = x + vx;
      P[k + 1] = y + vy + g;
      P[k + 2] = z + vz;
    }

    const grab = ptr.grab;
    if (grab >= 0) {
      const k = grab * 3;
      P[k] = ptr.x; P[k + 1] = ptr.y; P[k + 2] = 0;
    }

    // a hanging cloth settles fine with fewer passes; pulling or dropping it needs the full count
    const passes = grab >= 0 || this.dropped ? this.iterations : this.resting;
    for (let it = 0; it < passes; it++) {
      for (let c = 0; c < cons.length; c += 4) {
        const ia0 = cons[c], ib0 = cons[c + 1], len = cons[c + 2];
        const a = ia0 * 3, b = ib0 * 3;
        const dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        let diff = (d - len) / d;
        // bend constraints barely resist compression, so folds can form; shear is soft
        const kind = cons[c + 3];
        if (kind === 1) diff *= diff < 0 ? 0.12 : 0.5;
        else if (kind === 2) diff *= 0.35;
        const ia = pinned[ia0] || ia0 === grab ? 0 : 1;
        const ib = pinned[ib0] || ib0 === grab ? 0 : 1;
        const s = ia + ib;
        if (!s) continue;
        const ka = (ia / s) * diff, kb = (ib / s) * diff;
        P[a] += dx * ka; P[a + 1] += dy * ka; P[a + 2] += dz * ka;
        P[b] -= dx * kb; P[b + 1] -= dy * kb; P[b + 2] -= dz * kb;
      }
      for (let i = 0; i < n; i++) {
        const k = i * 3;
        if (P[k + 1] > floor) {
          P[k + 1] = floor;
          PP[k] += (P[k] - PP[k]) * 0.5;
          PP[k + 2] += (P[k + 2] - PP[k + 2]) * 0.5;
        }
        if (P[k] < 4) P[k] = 4;
        else if (P[k] > W - 4) P[k] = W - 4;
        if (P[k + 2] > WALL) P[k + 2] = WALL;
      }
    }
  }

  // ---------- rendering ----------
  normals() {
    const { P, N, cols, rows } = this;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const l = (c > 0 ? i - 1 : i) * 3, rr = (c < cols - 1 ? i + 1 : i) * 3;
      const u = (r > 0 ? i - cols : i) * 3, d = (r < rows - 1 ? i + cols : i) * 3;
      const ax = P[rr] - P[l], ay = P[rr + 1] - P[l + 1], az = P[rr + 2] - P[l + 2];
      const bx = P[d] - P[u], by = P[d + 1] - P[u + 1], bz = P[d + 2] - P[u + 2];
      N[i * 3] = ay * bz - az * by;
      N[i * 3 + 1] = az * bx - ax * bz;
      N[i * 3 + 2] = ax * by - ay * bx;
    }
  }

  render() {
    const gl = this.gl;
    if (!gl || !this.P) return;
    this.normals();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.pos);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.P);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.nor);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.N);
    gl.uniform2f(this.uRes, this.W, this.H);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }

  static run(list) {
    let raf = 0;
    const loop = (now) => {
      const t = now / 1000;
      for (const c of list) if (c.visible && c.P) { c.step(t); c.render(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // nothing to animate while the tab is in the background
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  }
}

// ---------- shared texture helpers ----------
// one 4px tile of weave (a dark weft row, a light warp column), filled as a pattern
let weaveTile;
export function weave(x, tw, th, alpha = 0.06) {
  if (!weaveTile) {
    weaveTile = document.createElement('canvas');
    weaveTile.width = weaveTile.height = 4;
    const t = weaveTile.getContext('2d');
    t.fillStyle = '#000';
    t.fillRect(0, 0, 4, 1);
    t.fillStyle = '#fff';
    t.fillRect(0, 0, 1, 4);
  }
  x.save();
  x.globalAlpha = alpha;
  x.fillStyle = x.createPattern(weaveTile, 'repeat');
  x.fillRect(0, 0, tw, th);
  x.restore();
}

export function fitFont(x, text, maxW, weight, family = 'Unbounded') {
  x.font = `${weight} 100px ${family}`;
  return (100 * maxW) / x.measureText(text).width;
}

// a dashed stitch line inset from the edges
export function stitchRect(x, m, top, tw, th, bottom, color = 'rgba(244, 241, 234, 0.55)') {
  x.save();
  x.setLineDash([tw * 0.012, tw * 0.008]);
  x.lineWidth = Math.max(2, tw * 0.0028);
  x.strokeStyle = color;
  x.strokeRect(m, top, tw - m * 2, th - top - bottom);
  x.restore();
}

// grommets along the top hem
export function grommets(x, m, y, tw, count, r, color = 'rgba(0, 0, 0, 0.35)') {
  x.fillStyle = color;
  for (let i = 0; i <= count; i++) {
    x.beginPath();
    x.arc(m + (tw - m * 2) * i / count, y, r, 0, Math.PI * 2);
    x.fill();
  }
}
