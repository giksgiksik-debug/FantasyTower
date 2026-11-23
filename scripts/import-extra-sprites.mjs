import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const archive = 'phaser_assets_final (1).zip';
if (!existsSync(archive)) throw new Error(`Required source archive not found: ${archive}`);

const expected = [
  'sprites/sprite_40.png',
  'sprites/gem_blue.png',
  'sprites/gem_green.png',
  'sprites/gem_purple.png',
  'sprites/gem_red.png',
  'sprites/gem_yellow.png'
];
const outputRoot = 'public/assets/phaser-assets/sprites';
mkdirSync(outputRoot, { recursive: true });

function extract(entry) {
  const bytes = execFileSync('unzip', ['-p', archive, entry], { maxBuffer: 16 * 1024 * 1024 });
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Invalid or missing PNG in archive: ${entry}`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const interlace = bytes[28];
  let hasTransparencyChunk = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'tRNS') hasTransparencyChunk = true;
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  const hasAlphaChannel = colorType === 4 || colorType === 6;
  const outputName = entry.split('/').at(-1);
  const outputPath = join(outputRoot, outputName);
  writeFileSync(outputPath, bytes);
  return {
    file: outputPath,
    sourceEntry: entry,
    bytes: bytes.length,
    width,
    height,
    bitDepth,
    colorType,
    interlace,
    hasAlphaChannel,
    hasTransparencyChunk,
    transparencyEncoding: hasAlphaChannel ? 'alpha-channel-present' : hasTransparencyChunk ? 'tRNS-chunk-present' : 'no-alpha-metadata'
  };
}

const results = expected.map(extract);
const lines = [
  '# Extra sprite assets — extraction report',
  '',
  'Source archive: `phaser_assets_final (1).zip`',
  '',
  'The six additional PNG files were extracted without resizing, recompression, cropping, or modification.',
  '',
  '| File | Dimensions | Bytes | Bit depth | PNG color type | Alpha channel | tRNS | Interlace |',
  '|---|---:|---:|---:|---:|---|---|---:|',
  ...results.map((item) => `| ${item.file.split('/').at(-1)} | ${item.width} × ${item.height} | ${item.bytes} | ${item.bitDepth} | ${item.colorType} | ${item.hasAlphaChannel ? 'yes' : 'no'} | ${item.hasTransparencyChunk ? 'yes' : 'no'} | ${item.interlace} |`),
  '',
  'Transparency metadata reports whether the PNG stores an alpha channel or a tRNS transparency chunk. It does not claim that any particular pixel is fully or partially transparent.',
  ''
];
writeFileSync('EXTRA_ASSET_REPORT.md', lines.join('\n'));
console.log(`Extracted and validated ${results.length} PNG files.`);
for (const item of results) console.log(`${item.file}: ${item.width}x${item.height}, ${item.bytes} bytes, colorType=${item.colorType}, alpha=${item.hasAlphaChannel}, tRNS=${item.hasTransparencyChunk}`);
