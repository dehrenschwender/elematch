// Generates the ELEMATCH app icon from a single vector source.
//
// One scene definition (a deep-blue rounded square bearing the game's three
// elements — a fire flame, a water droplet and an energy bolt — clustered in a
// triangular "match" emblem) drives BOTH outputs:
//   - public/icon.svg            scalable master / primary favicon
//   - public/favicon.png         legacy raster favicon
//   - public/apple-touch-icon.png
//   - public/icon-192.png        PWA manifest
//   - public/icon-512.png        PWA manifest
//   - public/icon-maskable-512.png  PWA maskable (full-bleed, no rounded corners)
//   - src/assets/icon.png        imported by Phaser for the in-game About panel
//
// Self-contained: a tiny supersampled scanline rasterizer + PNG encoder using
// only Node built-ins (zlib), so the build needs no native image dependency.
//
// Run:  node scripts/generate-icon.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SIZE = 512 // design coordinate space (square)

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const COL = {
  bgTop: [13, 78, 138],     // #0d4e8a
  bgMid: [1, 87, 155],      // #01579b  (theme color)
  bgBot: [3, 33, 61],       // #03213d
  glow: [120, 200, 255],    // soft cyan highlight behind the emblem
  outline: [4, 26, 46],     // dark glyph outline for pop on the blue
  fire: [233, 58, 38],      // #e93a26
  fireHi: [255, 176, 53],   // inner flame highlight
  water: [120, 214, 245],   // #78d6f5
  waterHi: [223, 248, 255], // droplet highlight
  bolt: [255, 209, 61],     // #ffd13d
  boltHi: [255, 240, 170],
}

// ---------------------------------------------------------------------------
// Geometry helpers — everything resolves to closed polylines (arrays of [x,y])
// so the SVG emitter and the rasterizer consume identical data.
// ---------------------------------------------------------------------------
const TAU = Math.PI * 2

function quad (p0, c, p1, steps = 18) {
  const out = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, u = 1 - t
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
    ])
  }
  return out
}

function cubic (p0, c1, c2, p1, steps = 20) {
  const out = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, u = 1 - t
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
    out.push([
      a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0],
      a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1],
    ])
  }
  return out
}

// Stitch a list of cubic segments [p0,c1,c2,p1] into one closed polyline.
function cubicPath (anchorsAndHandles) {
  let pts = [anchorsAndHandles[0][0]]
  for (const [p0, c1, c2, p1] of anchorsAndHandles) pts = pts.concat(cubic(p0, c1, c2, p1))
  return pts
}

function roundedRect (x, y, w, h, r, steps = 10) {
  const pts = []
  const corner = (cx, cy, a0, a1) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (a1 - a0) * (i / steps)
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
  }
  corner(x + w - r, y + r, -Math.PI / 2, 0)        // top-right
  corner(x + w - r, y + h - r, 0, Math.PI / 2)     // bottom-right
  corner(x + r, y + h - r, Math.PI / 2, Math.PI)   // bottom-left
  corner(x + r, y + r, Math.PI, Math.PI * 1.5)     // top-left
  return pts
}

function circlePoly (cx, cy, r, steps = 64) {
  const pts = []
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * TAU
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

function transform (pts, { s = 1, rot = 0, tx = 0, ty = 0 } = {}) {
  const co = Math.cos(rot), si = Math.sin(rot)
  return pts.map(([x, y]) => {
    const sx = x * s, sy = y * s
    return [sx * co - sy * si + tx, sx * si + sy * co + ty]
  })
}

function centroid (pts) {
  let x = 0, y = 0
  for (const p of pts) { x += p[0]; y += p[1] }
  return [x / pts.length, y / pts.length]
}

// Grow a polygon about its centroid — used to build a dark outline behind a glyph.
function outlinePoly (pts, scale) {
  const [cx, cy] = centroid(pts)
  return pts.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale])
}

// ---------------------------------------------------------------------------
// Glyphs — defined once in local space (centred near origin, ~110 tall),
// then scaled / rotated / placed into the emblem.
// ---------------------------------------------------------------------------
const FLAME = cubicPath([
  [[0, -56], [11, -41], [30, -20], [27, 2]],
  [[27, 2], [25, 20], [26, 34], [13, 46]],
  [[13, 46], [2, 54], [-3, 54], [-15, 45]],
  [[-15, 45], [-27, 35], [-24, 16], [-19, 0]],
  [[-19, 0], [-15, -12], [-17, -20], [-7, -26]],
  [[-7, -26], [-12, -14], [-2, -10], [-1, -24]],
  [[-1, -24], [0, -36], [-6, -44], [0, -56]],
])
const FLAME_HI = cubicPath([
  [[2, -18], [12, -6], [13, 8], [7, 24]],
  [[7, 24], [3, 34], [-2, 36], [-8, 28]],
  [[-8, 28], [-14, 18], [-9, 4], [-3, -6]],
  [[-3, -6], [0, -12], [-1, -14], [2, -18]],
])

function droplet () {
  const tip = [0, -54]
  const cx = 0, cy = 16, r = 34
  let pts = [tip]
  pts = pts.concat(quad(tip, [30, -30], [r, cy], 16))           // right shoulder
  for (let i = 0; i <= 40; i++) {                               // bottom arc R→L
    const a = (i / 40) * Math.PI                                 // 0..PI (lower half)
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  pts = pts.concat(quad([-r, cy], [-30, -30], tip, 16))          // left shoulder
  return pts
}
const DROPLET = droplet()
const DROPLET_HI = [
  ...circlePoly(-9, 18, 11, 24),
]

const BOLT = [
  [9, -52], [-19, 5], [-3, 5], [-13, 52],
  [22, -9], [5, -9], [20, -52],
]
const BOLT_HI = outlinePoly(BOLT, 0.52)

// ---------------------------------------------------------------------------
// Scene: ordered list of paints. Each entry is one of:
//   { rect, fill }                       — gradient/solid rounded rect (bg)
//   { glow:[cx,cy,r], color, alpha }     — soft radial highlight
//   { poly, color, alpha? }              — filled polygon (solid)
// Glyphs are emitted as outline-behind + colour + highlight.
// ---------------------------------------------------------------------------
function buildScene ({ maskable = false } = {}) {
  const paints = []
  const radius = maskable ? 0 : 104

  // Background: vertical 3-stop gradient inside the rounded square.
  paints.push({
    kind: 'rect',
    rect: roundedRect(0, 0, SIZE, SIZE, radius),
    grad: { y0: 0, y1: SIZE, stops: [[0, COL.bgTop], [0.55, COL.bgMid], [1, COL.bgBot]] },
  })

  // Soft glow behind the emblem so the glyphs read against the blue.
  paints.push({ kind: 'glow', cx: 256, cy: 250, r: 210, color: COL.glow, alpha: 0.22 })

  // Glyph placement (triangular cluster around centre 256,256).
  const placements = [
    { src: FLAME, hi: FLAME_HI, color: COL.fire, hiColor: COL.fireHi, s: 1.55, rot: -0.12, tx: 256, ty: 168 },
    { src: BOLT, hi: BOLT_HI, color: COL.bolt, hiColor: COL.boltHi, s: 1.42, rot: 0.0, tx: 168, ty: 338 },
    { src: DROPLET, hi: DROPLET_HI, color: COL.water, hiColor: COL.waterHi, s: 1.42, rot: 0.0, tx: 348, ty: 332 },
  ]

  for (const p of placements) {
    const body = transform(p.src, { s: p.s, rot: p.rot, tx: p.tx, ty: p.ty })
    paints.push({ kind: 'poly', poly: outlinePoly(body, 1.16), color: COL.outline })
    paints.push({ kind: 'poly', poly: body, color: p.color })
    if (p.hi) {
      const hi = transform(p.hi, { s: p.s, rot: p.rot, tx: p.tx, ty: p.ty })
      paints.push({ kind: 'poly', poly: hi, color: p.hiColor, alpha: 0.85 })
    }
  }

  return paints
}

// ---------------------------------------------------------------------------
// SVG emitter
// ---------------------------------------------------------------------------
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const dAttr = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z'

function toSVG (paints) {
  const defs = []
  const body = []
  let gid = 0
  for (const p of paints) {
    if (p.kind === 'rect') {
      const id = `g${gid++}`
      const stops = p.grad.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${hex(c)}"/>`).join('')
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>`)
      body.push(`<path d="${dAttr(p.rect)}" fill="url(#${id})"/>`)
    } else if (p.kind === 'glow') {
      const id = `g${gid++}`
      // Match the rasterizer's quadratic falloff (alpha * (1 - d)^2) with sampled
      // stops, so the SVG master and the PNG exports show the same halo.
      const stops = [0, 0.25, 0.5, 0.75, 1]
        .map((o) => `<stop offset="${o}" stop-color="${hex(p.color)}" stop-opacity="${(p.alpha * (1 - o) * (1 - o)).toFixed(4)}"/>`)
        .join('')
      defs.push(`<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5">${stops}</radialGradient>`)
      body.push(`<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="url(#${id})"/>`)
    } else if (p.kind === 'poly') {
      const op = p.alpha != null ? ` fill-opacity="${p.alpha}"` : ''
      body.push(`<path d="${dAttr(p.poly)}" fill="${hex(p.color)}"${op}/>`)
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="ELEMATCH">\n<defs>${defs.join('')}</defs>\n${body.join('\n')}\n</svg>\n`
}

// ---------------------------------------------------------------------------
// Rasterizer — supersampled scanline fill into a premultiplied float buffer.
// ---------------------------------------------------------------------------
function render (paints, outSize, ss = 4) {
  const W = outSize * ss, H = outSize * ss
  const scale = W / SIZE
  // premultiplied RGBA, floats 0..1
  const buf = new Float64Array(W * H * 4)

  const sc = (pts) => pts.map(([x, y]) => [x * scale, y * scale])

  const overPixel = (idx, r, g, b, a) => {
    // src is premultiplied (r,g,b already *a); composite over dst
    const ia = 1 - a
    buf[idx] = r + buf[idx] * ia
    buf[idx + 1] = g + buf[idx + 1] * ia
    buf[idx + 2] = b + buf[idx + 2] * ia
    buf[idx + 3] = a + buf[idx + 3] * ia
  }

  const fillPoly = (pts, paintAt) => {
    // paintAt(px,py) -> [R,G,B,A] straight (0..1); A may be 0 to skip
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity
    for (const [x, y] of pts) {
      if (y < minY) minY = y; if (y > maxY) maxY = y
      if (x < minX) minX = x; if (x > maxX) maxX = x
    }
    const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(H - 1, Math.ceil(maxY))
    const n = pts.length
    for (let py = y0; py <= y1; py++) {
      const yc = py + 0.5
      // gather x crossings (even-odd)
      const xs = []
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j]
        if ((yi > yc) !== (yj > yc)) {
          xs.push(xi + ((yc - yi) / (yj - yi)) * (xj - xi))
        }
      }
      if (xs.length < 2) continue
      xs.sort((a, b) => a - b)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.ceil(xs[k] - 0.5))
        const xb = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5))
        for (let px = xa; px <= xb; px++) {
          const col = paintAt(px + 0.5, yc)
          if (!col || col[3] <= 0) continue
          const a = col[3]
          overPixel((py * W + px) * 4, col[0] * a, col[1] * a, col[2] * a, a)
        }
      }
    }
  }

  for (const p of paints) {
    if (p.kind === 'rect') {
      const stops = p.grad.stops
      const y0 = p.grad.y0 * scale, y1 = p.grad.y1 * scale
      fillPoly(sc(p.rect), (_px, py) => {
        let t = (py - y0) / (y1 - y0)
        t = t < 0 ? 0 : t > 1 ? 1 : t
        // piecewise between stops
        let c = stops[0][1]
        for (let i = 1; i < stops.length; i++) {
          if (t <= stops[i][0]) {
            const a0 = stops[i - 1][0], a1 = stops[i][0]
            const f = a1 === a0 ? 0 : (t - a0) / (a1 - a0)
            const ca = stops[i - 1][1], cb = stops[i][1]
            c = [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f]
            break
          }
          c = stops[i][1]
        }
        return [c[0] / 255, c[1] / 255, c[2] / 255, 1]
      })
    } else if (p.kind === 'glow') {
      const cx = p.cx * scale, cy = p.cy * scale, r = p.r * scale
      const poly = sc(circlePoly(p.cx, p.cy, p.r, 96))
      const col = [p.color[0] / 255, p.color[1] / 255, p.color[2] / 255]
      fillPoly(poly, (px, py) => {
        const d = Math.hypot(px - cx, py - cy) / r
        if (d >= 1) return null
        const f = 1 - d
        return [col[0], col[1], col[2], p.alpha * f * f]
      })
    } else if (p.kind === 'poly') {
      const col = [p.color[0] / 255, p.color[1] / 255, p.color[2] / 255, p.alpha != null ? p.alpha : 1]
      fillPoly(sc(p.poly), () => col)
    }
  }

  // downsample ss×ss (premultiplied average) → straight RGBA8
  const out = Buffer.alloc(outSize * outSize * 4)
  const inv = 1 / (ss * ss)
  for (let y = 0; y < outSize; y++) {
    for (let x = 0; x < outSize; x++) {
      let pr = 0, pg = 0, pb = 0, pa = 0
      for (let dy = 0; dy < ss; dy++) {
        const row = (y * ss + dy) * W
        for (let dx = 0; dx < ss; dx++) {
          const i = (row + x * ss + dx) * 4
          pr += buf[i]; pg += buf[i + 1]; pb += buf[i + 2]; pa += buf[i + 3]
        }
      }
      pr *= inv; pg *= inv; pb *= inv; pa *= inv
      const o = (y * outSize + x) * 4
      if (pa > 0) {
        out[o] = Math.min(255, Math.round((pr / pa) * 255))
        out[o + 1] = Math.min(255, Math.round((pg / pa) * 255))
        out[o + 2] = Math.min(255, Math.round((pb / pa) * 255))
        out[o + 3] = Math.min(255, Math.round(pa * 255))
      }
    }
  }
  return { width: outSize, height: outSize, data: out }
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder (RGBA, filter 0 per row)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32 (buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk (type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG ({ width, height, data }) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------------------------------------------------------------------------
// Emit everything
// ---------------------------------------------------------------------------
const scene = buildScene()
const maskScene = buildScene({ maskable: true })

const write = (rel, data) => {
  const abs = resolve(ROOT, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, data)
}

write('public/icon.svg', toSVG(scene))
console.log('wrote public/icon.svg')

const pngTargets = [
  ['public/favicon.png', scene, 64],
  ['public/apple-touch-icon.png', scene, 180],
  ['public/icon-192.png', scene, 192],
  ['public/icon-512.png', scene, 512],
  ['public/icon-maskable-512.png', maskScene, 512],
  ['src/assets/icon.png', scene, 512],
]
for (const [rel, sc, size] of pngTargets) {
  const png = encodePNG(render(sc, size))
  write(rel, png)
  console.log(`wrote ${rel} (${size}x${size}, ${png.length} bytes)`)
}
