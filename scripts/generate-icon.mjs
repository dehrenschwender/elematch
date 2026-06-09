// Builds the ELEMATCH icon asset set from the pixel-art master.
//
// Source of truth: scripts/icon-source.png — a 1254x1254 pixel-art icon (the
// three elements on a dark navy rounded square, rendered on a light backdrop).
// This script, using only Node built-ins (zlib), turns it into the derived sizes:
//   - public/favicon.png          (64, transparent corners)
//   - public/apple-touch-icon.png (180, opaque navy — iOS adds its own rounding)
//   - public/icon-192.png         (192, transparent corners — PWA)
//   - public/icon-512.png         (512, transparent corners — PWA)
//   - public/icon-maskable-512.png(512, opaque navy full-bleed — PWA maskable)
//   - src/assets/icon.png         (512, transparent corners — in-game About panel)
//
// Pipeline: decode → flood-fill the light exterior to transparent (so the navy
// rounded square gets clean transparent corners without touching the bright
// pixels inside the flame/bolt) → crop to the square → area-average downscale →
// optionally composite over navy for the opaque variants.
//
// Run:  node scripts/generate-icon.mjs   (or `pnpm icon`)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync, deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(ROOT, 'scripts/icon-source.png')
const NAVY = [3, 10, 28] // background colour sampled from the master

// ---------------------------------------------------------------------------
// PNG decode (8-bit, colour types 2/6, non-interlaced) → RGBA buffer
// ---------------------------------------------------------------------------
function paeth (a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function decodePNG (buf) {
  let p = 8
  let w = 0, h = 0, colorType = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); p += 4
    const type = buf.toString('ascii', p, p + 4); p += 4
    const data = buf.subarray(p, p + len); p += len; p += 4
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
  }
  if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported PNG colour type ${colorType}`)
  const raw = inflateSync(Buffer.concat(idat))
  const ch = colorType === 6 ? 4 : 3
  const stride = w * ch
  const out = Buffer.alloc(w * h * 4)
  const prev = Buffer.alloc(stride)
  const cur = Buffer.alloc(stride)
  let rp = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++]
    raw.copy(cur, 0, rp, rp + stride); rp += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const b = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      let v = cur[i]
      if (filter === 1) v = (v + a) & 255
      else if (filter === 2) v = (v + b) & 255
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255
      else if (filter === 4) v = (v + paeth(a, b, c)) & 255
      cur[i] = v
    }
    for (let x = 0; x < w; x++) {
      const si = x * ch, oi = (y * w + x) * 4
      out[oi] = cur[si]; out[oi + 1] = cur[si + 1]; out[oi + 2] = cur[si + 2]
      out[oi + 3] = ch === 4 ? cur[si + 3] : 255
    }
    cur.copy(prev)
  }
  return { width: w, height: h, data: out }
}

// ---------------------------------------------------------------------------
// PNG encode (RGBA, filter 0 per row)
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
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG ({ width, height, data }) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6
  const stride = width * 4
  const rawData = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    rawData[y * (stride + 1)] = 0
    data.copy(rawData, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(rawData, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------
const bright = (data, i) => (data[i] + data[i + 1] + data[i + 2]) / 3

// Flood from the borders through light pixels, marking the exterior transparent.
// The navy square (dark) stops the flood, so bright pixels INSIDE it (flame core,
// bolt, sparkles) are never reached.
function cutoutExterior (img, threshold = 120) {
  const { width: W, height: H, data } = img
  const seen = new Uint8Array(W * H)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const k = y * W + x
    if (seen[k]) return
    if (bright(data, k * 4) <= threshold) return
    seen[k] = 1
    data[k * 4 + 3] = 0
    stack.push(k)
  }
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1) }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y) }
  while (stack.length) {
    const k = stack.pop()
    const x = k % W, y = (k - x) / W
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }
  return img
}

function opaqueBBox (img) {
  const { width: W, height: H, data } = img
  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 8) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
  return { minX, minY, maxX, maxY }
}

// Crop a centred square (side = max of the bbox dimensions) around the content.
function cropSquare (img) {
  const { width: W, height: H, data } = img
  const { minX, minY, maxX, maxY } = opaqueBBox(img)
  const side = Math.max(maxX - minX + 1, maxY - minY + 1)
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const ox = Math.round(cx - side / 2), oy = Math.round(cy - side / 2)
  const out = Buffer.alloc(side * side * 4)
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const sx = ox + x, sy = oy + y
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue
    const si = (sy * W + sx) * 4, oi = (y * side + x) * 4
    out[oi] = data[si]; out[oi + 1] = data[si + 1]; out[oi + 2] = data[si + 2]; out[oi + 3] = data[si + 3]
  }
  return { width: side, height: side, data: out }
}

// Area-average downscale with premultiplied alpha (clean edges over transparency).
function resize (img, T) {
  const { width: N, data } = img
  const out = Buffer.alloc(T * T * 4)
  const scale = N / T
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
  for (let ty = 0; ty < T; ty++) {
    const sy0 = ty * scale, sy1 = (ty + 1) * scale
    for (let tx = 0; tx < T; tx++) {
      const sx0 = tx * scale, sx1 = (tx + 1) * scale
      let r = 0, g = 0, b = 0, a = 0, wsum = 0
      for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++) {
        const wy = Math.min(sy1, sy + 1) - Math.max(sy0, sy)
        for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
          const wx = Math.min(sx1, sx + 1) - Math.max(sx0, sx)
          const wt = wx * wy
          const i = (sy * N + sx) * 4
          const al = data[i + 3] / 255
          r += data[i] * al * wt; g += data[i + 1] * al * wt; b += data[i + 2] * al * wt
          a += al * wt; wsum += wt
        }
      }
      const oi = (ty * T + tx) * 4
      if (a > 0) {
        out[oi] = clamp(r / a); out[oi + 1] = clamp(g / a); out[oi + 2] = clamp(b / a)
        out[oi + 3] = clamp((a / wsum) * 255)
      }
    }
  }
  return { width: T, height: T, data: out }
}

// Flatten over a solid colour (drops transparency for iOS / maskable variants).
function flatten (img, [br, bg, bb]) {
  const { width, height, data } = img
  const out = Buffer.from(data)
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3] / 255
    out[i] = Math.round(out[i] * a + br * (1 - a))
    out[i + 1] = Math.round(out[i + 1] * a + bg * (1 - a))
    out[i + 2] = Math.round(out[i + 2] * a + bb * (1 - a))
    out[i + 3] = 255
  }
  return { width, height, data: out }
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
const write = (rel, img) => {
  const abs = resolve(ROOT, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, encodePNG(img))
  console.log(`wrote ${rel} (${img.width}x${img.height})`)
}

const base = cropSquare(cutoutExterior(decodePNG(readFileSync(SOURCE))))
console.log(`cropped master: ${base.width}x${base.width}`)

const transparent = [
  ['public/favicon.png', 64],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['src/assets/icon.png', 512],
]
for (const [rel, size] of transparent) write(rel, resize(base, size))

write('public/apple-touch-icon.png', flatten(resize(base, 180), NAVY))
write('public/icon-maskable-512.png', flatten(resize(base, 512), NAVY))
