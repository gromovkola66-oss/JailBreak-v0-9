// Generate a simple 256x256 PNG icon without native dependencies
// Uses raw PNG encoding (zlib is built into Node.js)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const size = 256;

// Create RGBA pixel buffer
const pixels = Buffer.alloc(size * size * 4);

// Helper to set a pixel
function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = (y * size + x) * 4;
  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

// Fill background #1a1a2e
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    setPixel(x, y, 0x1a, 0x1a, 0x2e);
  }
}

// Draw border (outer) #e94560
for (let i = 0; i < size; i++) {
  for (let t = 0; t < 8; t++) {
    setPixel(i, t, 0xe9, 0x45, 0x60);
    setPixel(i, size - 1 - t, 0xe9, 0x45, 0x60);
    setPixel(t, i, 0xe9, 0x45, 0x60);
    setPixel(size - 1 - t, i, 0xe9, 0x45, 0x60);
  }
}

// Draw inner border #0f3460
for (let i = 16; i < size - 16; i++) {
  for (let t = 0; t < 4; t++) {
    setPixel(i, 16 + t, 0x0f, 0x34, 0x60);
    setPixel(i, size - 17 - t, 0x0f, 0x34, 0x60);
    setPixel(16 + t, i, 0x0f, 0x34, 0x60);
    setPixel(size - 17 - t, i, 0x0f, 0x34, 0x60);
  }
}

// Draw "JB" text using a simple bitmap font (large block letters)
// Each letter is defined as a grid pattern
const letterJ = [
  '  11111',
  '     1 ',
  '     1 ',
  '     1 ',
  '     1 ',
  '     1 ',
  '     1 ',
  ' 1   1 ',
  ' 1   1 ',
  '  111  ',
];

const letterB = [
  '11111  ',
  '1    1 ',
  '1    1 ',
  '1    1 ',
  '11111  ',
  '1    1 ',
  '1    1 ',
  '1    1 ',
  '1    1 ',
  '11111  ',
];

function drawLetter(pattern, startX, startY, blockSize) {
  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      if (pattern[row][col] === '1') {
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            setPixel(startX + col * blockSize + bx, startY + row * blockSize + by, 255, 255, 255);
          }
        }
      }
    }
  }
}

const blockSize = 10;
const textHeight = 10 * blockSize;
const textStartY = Math.floor((size - textHeight) / 2);

// "J" starts at x=40, "B" starts at x=140
drawLetter(letterJ, 40, textStartY, blockSize);
drawLetter(letterB, 140, textStartY, blockSize);

// Encode as PNG
function createPNG(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // no filter
    rgbaBuffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);

  // Build chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData) >>> 0, 0);
    return Buffer.concat([len, typeBuffer, data, crc]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return crc ^ -1;
  }

  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const png = createPNG(size, size, pixels);

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'icon.png'), png);
console.log('Icon generated: assets/icon.png (256x256)');
