/**
 * Generates placeholder PWA icons (192x192 and 512x512) in public/.
 * Uses Node built-ins only. Run from frontend: node scripts/generate-pwa-icons.js
 */

const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

const crc32 = (data) => {
  let crc = -1
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c >>> 0
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ (-1)) >>> 0
}

const writeChunk = (out, type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  out.push(len, Buffer.from(type), data)
  const chunk = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(chunk), 0)
  out.push(crc)
}

function createPng(size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const out = [signature]

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)   // width
  ihdr.writeUInt32BE(size, 4)   // height
  ihdr.writeUInt8(8, 8)         // bit depth
  ihdr.writeUInt8(2, 9)         // color type (RGB)
  ihdr.writeUInt8(0, 10)        // compression
  ihdr.writeUInt8(0, 11)        // filter
  ihdr.writeUInt8(0, 12)        // interlace
  writeChunk(out, 'IHDR', ihdr)

  const raw = Buffer.alloc(size * (1 + size * 3))
  let off = 0
  const themeR = 14, themeG = 165, themeB = 233
  for (let y = 0; y < size; y++) {
    raw[off++] = 0
    for (let x = 0; x < size; x++) {
      raw[off++] = themeR
      raw[off++] = themeG
      raw[off++] = themeB
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 6 })
  writeChunk(out, 'IDAT', compressed)
  writeChunk(out, 'IEND', Buffer.alloc(0))

  return Buffer.concat(out)
}

const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192))
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512))
console.log('Generated public/icon-192.png and public/icon-512.png')