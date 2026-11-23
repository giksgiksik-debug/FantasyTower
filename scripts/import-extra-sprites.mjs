import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const archive = 'phaser_assets_final (1).zip';
if (!existsSync(archive)) throw new Error(`Required source archive not found: ${archive}`);

const entries = [
  ...Array.from({ length: 41 }, (_, index) => `sprites/sprite_${String(index).padStart(2, '0')}.png`),
  'sprites/gem_blue.png',
  'sprites/gem_green.png',
  'sprites/gem_purple.png',
  'sprites/gem_red.png',
  'sprites/gem_yellow.png'
];
const outputRoot = 'public/assets/phaser-assets/sprites';
const atlasPath = 'public/assets/phaser-assets/atlas.json';
mkdirSync(outputRoot, { recursive: true });

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

const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const results = [];
for (const entry of entries) {
  const source = execFileSync('unzip', ['-p', archive, entry], { maxBuffer: 16 * 1024 * 1024 });
  const sourceMeta = inspectPng(source, entry);
  const name = entry.split('/').at(-1);
  const target = join(outputRoot, name);
  const existed = existsSync(target);
  let repositoryMeta = null;

  if (existed) {
    repositoryMeta = inspectPng(readFileSync(target), target);
  } else {
    writeFileSync(target, source);
    repositoryMeta = inspectPng(readFileSync(target), target);
  }

  const frameName = name.replace(/\.png$/i, '');
  const atlasFrame = atlas.frames?.[frameName]?.frame ?? null;
  results.push({
    name,
    source: sourceMeta,
    repository: repositoryMeta,
    existed,
    identical: sourceMeta.sha256 === repositoryMeta.sha256,
    sameDimensions: sourceMeta.width === repositoryMeta.width && sourceMeta.height === repositoryMeta.height,
    atlasFrame,
    atlasDimensionsMatch: atlasFrame
      ? atlasFrame.w === sourceMeta.width && atlasFrame.h === sourceMeta.height
      : null
  });
}

const rows = results.map((item) => {
  const repoState = item.existed
    ? (item.identical ? 'identical' : item.sameDimensions ? 'same dimensions, different bytes' : 'DIFFERENT DIMENSIONS')
    : 'newly extracted';
  const atlasState = item.atlasFrame
    ? (item.atlasDimensionsMatch ? 'match' : 'MISMATCH')
    : 'no frame';
  const alpha = item.source.hasAlphaChannel ? 'alpha channel' : item.source.hasTransparencyChunk ? 'tRNS' : 'none';
  return `| ${item.name} | ${item.source.width} × ${item.source.height} | ${item.repository.width} × ${item.repository.height} | ${repoState} | ${atlasState} | ${alpha} | ${item.source.bitDepth}/${item.source.colorType} |`;
});
const summary = [
  '# Full sprite archive comparison',
  '',
  'Source: `phaser_assets_final (1).zip`',
  '',
  'All 41 numbered sprites and five gem images were inspected. Existing repository PNGs were not overwritten. Missing files were copied byte-for-byte from the archive.',
  '',
  '| File | Archive dimensions | Repository dimensions | Repository comparison | Atlas frame | Transparency metadata | PNG depth/type |',
  '|---|---:|---:|---|---|---|---|',
  ...rows,
  '',
  '## Summary',
  '',
  `- Source PNGs inspected: ${results.length}`,
  `- New files extracted: ${results.filter((item) => !item.existed).length}`,
  `- Byte-identical existing files: ${results.filter((item) => item.existed && item.identical).length}`,
  `- Existing files with matching dimensions but different bytes: ${results.filter((item) => item.existed && !item.identical && item.sameDimensions).length}`,
  `- Existing files with different dimensions: ${results.filter((item) => item.existed && !item.sameDimensions).length}`,
  `- Atlas frames dimension-matching source PNGs: ${results.filter((item) => item.atlasFrame && item.atlasDimensionsMatch).length}`,
  `- Atlas frames with dimension mismatches: ${results.filter((item) => item.atlasFrame && !item.atlasDimensionsMatch).length}`,
  '',
  'Transparency metadata indicates an alpha channel or tRNS chunk; pixel-level alpha values have not been decoded. Atlas frame checks compare dimensions only, not visual cropping or pixel content.',
  ''
];
writeFileSync('EXTRA_ASSET_REPORT.md', summary.join('\n'));
console.log(summary.join('\n'));
