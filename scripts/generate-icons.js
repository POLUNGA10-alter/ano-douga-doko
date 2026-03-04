/**
 * PWAアイコン生成スクリプト (PNG)
 * 外部依存ゼロ — Node.js 組み込みの zlib のみ使用
 *
 * Usage: node scripts/generate-icons.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const publicDir = path.join(__dirname, "..", "public");

/**
 * シンプルなPNGファイルを生成（角丸風のインディゴ背景 + 中央に「?」テキスト）
 * ※ テキストは描画できないため、背景色のみの正方形PNG
 */
function createPng(size) {
  // RGBA ピクセルデータ生成
  const r = 99, g = 102, b = 241, a = 255; // #6366F1 (indigo-500)
  const darkR = 67, darkG = 56, darkB = 202; // #4338CA (indigo-700)
  const cornerRadius = Math.round(size * 0.18);

  const rawData = Buffer.alloc(size * (1 + size * 4)); // filter byte + RGBA per pixel
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // 角丸判定
      let inCorner = false;
      let dx = 0, dy = 0;
      if (x < cornerRadius && y < cornerRadius) { dx = cornerRadius - x; dy = cornerRadius - y; inCorner = true; }
      else if (x >= size - cornerRadius && y < cornerRadius) { dx = x - (size - cornerRadius - 1); dy = cornerRadius - y; inCorner = true; }
      else if (x < cornerRadius && y >= size - cornerRadius) { dx = cornerRadius - x; dy = y - (size - cornerRadius - 1); inCorner = true; }
      else if (x >= size - cornerRadius && y >= size - cornerRadius) { dx = x - (size - cornerRadius - 1); dy = y - (size - cornerRadius - 1); inCorner = true; }

      if (inCorner && (dx * dx + dy * dy) > cornerRadius * cornerRadius) {
        rawData.writeUInt32BE(0x00000000, pixelOffset); // 透明
      } else {
        // 上→下のグラデーション
        const t = y / size;
        const pr = Math.round(r + (darkR - r) * t);
        const pg = Math.round(g + (darkG - g) * t);
        const pb = Math.round(b + (darkB - b) * t);
        rawData[pixelOffset] = pr;
        rawData[pixelOffset + 1] = pg;
        rawData[pixelOffset + 2] = pb;
        rawData[pixelOffset + 3] = a;
      }
    }
  }

  // PNG構造を組み立て
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData) >>> 0);
    return Buffer.concat([len, typeB, data, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    createChunk("IHDR", ihdr),
    createChunk("IDAT", compressed),
    createChunk("IEND", iend),
  ]);
}

// CRC32
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

// 生成
[192, 512].forEach((size) => {
  const png = createPng(size);
  const filePath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`✅ icon-${size}.png (${(png.length / 1024).toFixed(1)} KB)`);
});

console.log("\n💡 より良いアイコンにするには Canva や Figma で作成して差し替えてください");
