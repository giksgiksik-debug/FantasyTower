import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const archive = 'phaser_assets_final (1).zip';
if (!existsSync(archive)) throw new Error(`Required source archive not found: ${archive}`);

const spriteEntries = [
  ...Array.from({ length: 41 }, (_, index) => `sprites/sprite_${String(index).padStart(2, '0')}.png`),
  'sprites/gem_blue.png',
  'sprites/gem_green.png',
  'sprites/gem_purple.png',
  'sprites/gem_red.png',
  'sprites/gem_yellow.png'
];
const stagingRoot = 'public/assets/phaser-assets/archive-final';
const stagingSprites = join(stagingRoot, 'sprites');
mkdirSync(stagingSprites, { recursive: true });

function readArchiveEntry(entry) {
  return execFileSync('unzip', ['-p', archive, entry], { maxBuffer: 20 * 1024 * 1024 });
}

function inspectPng(bytes, label) {
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG: ${label}`);
  }
  let hasTransparencyChunk = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'tRNS') hasTransparencyChunk = true;
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  const colorType = bytes[25];
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes: bytes.length,
    bitDepth: bytes[24],
    colorType,
    interlace: bytes[28],
    hasAlphaChannel: colorType === 4 || colorType === 6,
    hasTransparencyChunk,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
}

const currentAtlas = JSON.parse(readFileSync('public/assets/phaser-assets/atlas.json', 'utf8'));
const incomingAtlasBytes = readArchiveEntry('atlas.json');
const incomingAtlas = JSON.parse(incomingAtlasBytes.toString('utf8'));
const incomingAtlasPng = readArchiveEntry('atlas.png');
const incomingAtlasPngMeta = inspectPng(incomingAtlasPng, 'archive atlas.png');
const currentAtlasPngMeta = inspectPng(readFileSync('public/assets/phaser-assets/atlas.png'), 'current atlas.png');

writeFileSync(join(stagingRoot, 'atlas.json'), incomingAtlasBytes);
writeFileSync(join(stagingRoot, 'atlas.png'), incomingAtlasPng);

const results = [];
for (const entry of spriteEntries) {
  const source = readArchiveEntry(entry);
  const sourceMeta = inspectPng(source, entry);
  const name = entry.split('/').at(-1);
  const target = join(stagingSprites, name);
  writeFileSync(target, source);

  const currentPath = join('public/assets/phaser-assets/sprites', name);
  const currentExists = existsSync(currentPath);
  const currentMeta = currentExists ? inspectPng(readFileSync(currentPath), currentPath) : null;
  const frameName = name.replace(/\.png$/i, '');
  const incomingFrame = incomingAtlas.frames?.[frameName]?.frame ?? null;
  const currentFrame = currentAtlas.frames?.[frameName]?.frame ?? null;

  results.push({
    name,
    source: sourceMeta,
    current: currentMeta,
    currentExists,
    identical: currentMeta ? sourceMeta.sha256 === currentMeta.sha256 : null,
    sameDimensions: currentMeta ? sourceMeta.width === currentMeta.width && sourceMeta.height === currentMeta.height : null,
    incomingFrame,
    incomingFrameMatch: incomingFrame ? incomingFrame.w === sourceMeta.width && incomingFrame.h === sourceMeta.height : null,
    currentFrame,
    currentFrameMatch: currentFrame ? currentFrame.w === sourceMeta.width && currentFrame.h === sourceMeta.height : null
  });
}

const incomingFrameCount = Object.keys(incomingAtlas.frames ?? {}).length;
const currentFrameCount = Object.keys(currentAtlas.frames ?? {}).length;
const rows = results.map((item) => {
  const repoState = !item.currentExists
    ? 'not present in current folder'
    : item.identical ? 'identical' : item.sameDimensions ? 'same dimensions, different bytes' : 'DIFFERENT DIMENSIONS';
  const incomingState = item.incomingFrame
    ? (item.incomingFrameMatch ? 'match' : 'MISMATCH')
    : 'no frame';
  const currentState = item.currentFrame
    ? (item.currentFrameMatch ? 'match' : 'MISMATCH')
    : 'no frame';
  const alpha = item.source.hasAlphaChannel ? 'alpha channel' : item.source.hasTransparencyChunk ? 'tRNS' : 'none';
  return `| ${item.name} | ${item.source.width} × ${item.source.height} | ${item.current ? `${item.current.width} × ${item.current.height}` : '—'} | ${repoState} | ${incomingState} | ${currentState} | ${alpha} | `;
});

const summary = [
  '# Full sprite archive comparison',
  '',
  'Source: `phaser_assets_final (1).zip`',
  '',
  'The complete source atlas and all 46 individual PNGs were extracted byte-for-byte into `public/assets/phaser-assets/archive-final/`. The current production atlas and its sprite files were left unchanged.',
  '',
  '## Atlas comparison',
  '',
  `- Incoming atlas: ${incomingAtlasPngMeta.width} × ${incomingAtlasPngMeta.height} px, ${incomingAtlasPngMeta.bytes} bytes, ${incomingFrameCount} frames.`,
  `- Current atlas: ${currentAtlasPngMeta.width} × ${currentAtlasPngMeta.height} px, ${currentAtlasPngMeta.bytes} bytes, ${currentFrameCount} frames.`,
  `- Incoming atlas PNG alpha channel: ${incomingAtlasPngMeta.hasAlphaChannel ? 'yes' : 'no'}.`,
  '',
  '## Individual PNG comparison',
  '',
  '| File | Archive PNG dimensions | Current PNG dimensions | Current file comparison | Incoming atlas frame | Current atlas frame | Transparency metadata |',
  '|---|---:|---:|---|---|---|---|',
  ...rows,
  '',
  '## Summary',
  '',
  `- Source PNGs inspected: ${results.length}`,
  `- Incoming atlas frames matching source PNG dimensions: ${results.filter((item) => item.incomingFrame && item.incomingFrameMatch).length}`,
  `- Incoming atlas frame dimension mismatches: ${results.filter((item) => item.incomingFrame && !item.incomingFrameMatch).length}`,
  `- Existing current PNGs with different dimensions: ${results.filter((item) => item.currentExists && !item.sameDimensions).length}`,
  `- Existing current PNGs byte-identical to archive: ${results.filter((item) => item.currentExists && item.identical).length}`,
  '',
  'Transparency metadata indicates an alpha channel or tRNS chunk; pixel-level alpha values have not been decoded. Atlas frame checks compare dimensions only, not visual cropping or pixel content. No production asset was replaced.',
  ''
];
writeFileSync('EXTRA_ASSET_REPORT.md', summary.join('\n'));
console.log(summary.join('\n'));
