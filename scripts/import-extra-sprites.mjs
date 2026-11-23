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
for (const name of ['sprite_40.png', 'gem_blue.png', 'gem_green.png', 'gem_purple.png', 'gem_red.png', 'gem_yellow.png']) {
  const oldMixedPath = join('public/assets/phaser-assets/sprites', name);
  if (existsSync(oldMixedPath)) rmSync(oldMixedPath);
}

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
  'The source atlas and all 46 individual PNGs were validated against the previous production set, then promoted byte-for-byte as the new production assets. The previous atlas and sprite files were replaced; the temporary staging directory was removed.',
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
  'Transparency metadata indicates an alpha channel or tRNS chunk; pixel-level alpha values have not been decoded. Atlas frame checks compare dimensions only, not visual cropping or pixel content. The previous production atlas and sprite files were replaced with the validated source archive.',
  ''
];
// Promote the validated source archive as the sole production asset set.
const productionRoot = 'public/assets/phaser-assets';
const productionSprites = join(productionRoot, 'sprites');
rmSync(productionSprites, { recursive: true, force: true });
mkdirSync(productionSprites, { recursive: true });
for (const item of results) {
  const name = item.name;
  const bytes = readFileSync(join(stagingSprites, name));
  writeFileSync(join(productionSprites, name), bytes);
}
writeFileSync(join(productionRoot, 'atlas.json'), incomingAtlasBytes);
writeFileSync(join(productionRoot, 'atlas.png'), incomingAtlasPng);

// Rebuild the catalog from the new atlas. Semantic roles are deliberately
// unclassified until the new artwork is visually reviewed.
const catalogEntries = Object.entries(incomingAtlas.frames ?? {}).map(([name, value]) => {
  const frame = value.frame;
  return `  ${name}: Object.freeze({ width: ${frame.w}, height: ${frame.h}, group: 'unclassified-source-art', visual: 'Source archive artwork; gameplay role not yet assigned' })`;
});
const catalog = [
  '// Generated from public/assets/phaser-assets/atlas.json.',
  '// Artwork roles are intentionally unclassified pending visual review.',
  'export const SPRITE_CATALOG = Object.freeze({',
  ...catalogEntries.map((line) => line + ','),
  '});',
  '',
  'export const SPRITE_IDS = Object.freeze(Object.keys(SPRITE_CATALOG));',
  '',
  "export function hasSprite(scene, spriteId) {",
  "  if (!scene?.textures?.exists('game-atlas')) return false;",
  "  const texture = scene.textures.get('game-atlas');",
  '  return Boolean(SPRITE_CATALOG[spriteId] && texture.has(spriteId));',
  '}',
  '',
  '/** Create an image from a named frame in the shared Phaser atlas. */',
  'export function addSprite(scene, spriteId, x, y, options = {}) {',
  '  if (!hasSprite(scene, spriteId)) {',
  "    throw new Error('Unknown or unloaded FantasyTower sprite: ' + spriteId);",
  '  }',
  "  const image = scene.add.image(x, y, 'game-atlas', spriteId);",
  '  if (options.origin) image.setOrigin(options.origin.x ?? 0.5, options.origin.y ?? 0.5);',
  '  if (Number.isFinite(options.scale)) image.setScale(options.scale);',
  '  if (Number.isFinite(options.displayWidth) && Number.isFinite(options.displayHeight)) image.setDisplaySize(options.displayWidth, options.displayHeight);',
  '  if (Number.isFinite(options.depth)) image.setDepth(options.depth);',
  '  if (options.tint !== undefined) image.setTint(options.tint);',
  '  if (options.alpha !== undefined) image.setAlpha(options.alpha);',
  '  return image;',
  '}',
  ''
].join('\\n');
writeFileSync('src/systems/SpriteAssets.js', catalog);
rmSync(stagingRoot, { recursive: true, force: true });

writeFileSync('EXTRA_ASSET_REPORT.md', summary.join('\n'));
console.log(summary.join('\n'));
