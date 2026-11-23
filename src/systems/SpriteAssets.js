// Generated from public/assets/phaser-assets/atlas.json.
// Group labels are visual classifications only; gameplay roles remain intentionally unassigned.
export const SPRITE_CATALOG = Object.freeze({
  sprite_00: Object.freeze({ width: 239, height: 389, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_01: Object.freeze({ width: 236, height: 424, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_02: Object.freeze({ width: 276, height: 439, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_03: Object.freeze({ width: 259, height: 404, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_04: Object.freeze({ width: 340, height: 765, group: 'unclassified-game-art' , visual: 'Tall fantasy character / unit artwork' }),
  sprite_05: Object.freeze({ width: 235, height: 383, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_06: Object.freeze({ width: 248, height: 344, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_07: Object.freeze({ width: 251, height: 340, group: 'unclassified-game-art' , visual: 'Fantasy character / unit artwork' }),
  sprite_08: Object.freeze({ width: 326, height: 339, group: 'unclassified-game-art' , visual: 'Fantasy creature / character artwork' }),
  sprite_09: Object.freeze({ width: 323, height: 331, group: 'unclassified-game-art' , visual: 'Fantasy creature / character artwork' }),
  sprite_10: Object.freeze({ width: 753, height: 330, group: 'unclassified-game-art' , visual: 'Wide composite creature artwork (contents need source confirmation)' }),
  sprite_11: Object.freeze({ width: 106, height: 75, group: 'placement-marker' , visual: 'Round platform / placement marker' }),
  sprite_12: Object.freeze({ width: 110, height: 169, group: 'effects-and-magic' , visual: 'Gold crystal' }),
  sprite_13: Object.freeze({ width: 241, height: 310, group: 'effects-and-magic' , visual: 'Multi-crystal cluster' }),
  sprite_14: Object.freeze({ width: 108, height: 171, group: 'effects-and-magic' , visual: 'Blue crystal' }),
  sprite_15: Object.freeze({ width: 296, height: 278, group: 'effects-and-magic' , visual: 'Organic / creature-like artwork (exact role unconfirmed)' }),
  sprite_16: Object.freeze({ width: 182, height: 228, group: 'effects-and-magic' , visual: 'Lightning / impact effect' }),
  sprite_17: Object.freeze({ width: 226, height: 227, group: 'effects-and-magic' , visual: 'Purple magic effect' }),
  sprite_18: Object.freeze({ width: 794, height: 406, group: 'interface-panels-and-controls' , visual: 'Wide framed interface panel' }),
  sprite_19: Object.freeze({ width: 318, height: 396, group: 'interface-panels-and-controls' , visual: 'Portrait interface panel' }),
  sprite_20: Object.freeze({ width: 238, height: 571, group: 'interface-panels-and-controls' , visual: 'Tall framed interface element' }),
  sprite_21: Object.freeze({ width: 222, height: 412, group: 'interface-panels-and-controls' , visual: 'Tall framed interface element' }),
  sprite_22: Object.freeze({ width: 222, height: 412, group: 'interface-panels-and-controls' , visual: 'Tall framed interface element' }),
  sprite_23: Object.freeze({ width: 519, height: 420, group: 'interface-panels-and-controls' , visual: 'Grid / inventory-style interface panel' }),
  sprite_24: Object.freeze({ width: 269, height: 270, group: 'interface-panels-and-controls' , visual: 'Green square frame / selection outline' }),
  sprite_25: Object.freeze({ width: 454, height: 151, group: 'interface-panels-and-controls' , visual: 'Green framed button' }),
  sprite_26: Object.freeze({ width: 446, height: 143, group: 'interface-panels-and-controls' , visual: 'Gold framed button' }),
  sprite_27: Object.freeze({ width: 173, height: 170, group: 'interface-panels-and-controls' , visual: 'Pause control icon' }),
  sprite_28: Object.freeze({ width: 658, height: 102, group: 'status-bars' , visual: 'Red health-style bar' }),
  sprite_29: Object.freeze({ width: 650, height: 120, group: 'status-bars' , visual: 'Purple/blue energy-style bar' }),
  sprite_30: Object.freeze({ width: 189, height: 187, group: 'icons-and-resources' , visual: 'Crossed swords icon' }),
  sprite_31: Object.freeze({ width: 168, height: 200, group: 'icons-and-resources' , visual: 'Shield icon' }),
  sprite_32: Object.freeze({ width: 455, height: 151, group: 'icons-and-resources' , visual: 'Blue framed button' }),
  sprite_33: Object.freeze({ width: 446, height: 143, group: 'icons-and-resources' , visual: 'Red framed button' }),
  sprite_34: Object.freeze({ width: 153, height: 154, group: 'icons-and-resources' , visual: 'Gold coin icon' }),
  sprite_35: Object.freeze({ width: 108, height: 166, group: 'icons-and-resources' , visual: 'Blue gem icon' }),
  sprite_36: Object.freeze({ width: 166, height: 147, group: 'icons-and-resources' , visual: 'Heart icon' }),
  sprite_37: Object.freeze({ width: 194, height: 167, group: 'icons-and-resources' , visual: 'Two-star rating icon' }),
  sprite_38: Object.freeze({ width: 149, height: 174, group: 'icons-and-resources' , visual: 'Skull icon' }),
  sprite_39: Object.freeze({ width: 319, height: 152, group: 'icons-and-resources' , visual: 'Three-star rating icon' }),
});

export const SPRITE_IDS = Object.freeze(Object.keys(SPRITE_CATALOG));

export function hasSprite(scene, spriteId) {
  if (!scene?.textures?.exists('game-atlas')) return false;
  const texture = scene.textures.get('game-atlas');
  return Boolean(SPRITE_CATALOG[spriteId] && texture.has(spriteId));
}

/** Create an image from a named frame in the shared Phaser atlas. */
export function addSprite(scene, spriteId, x, y, options = {}) {
  if (!hasSprite(scene, spriteId)) {
    throw new Error('Unknown or unloaded FantasyTower sprite: ' + spriteId);
  }

  const image = scene.add.image(x, y, 'game-atlas', spriteId);
  if (options.origin) image.setOrigin(options.origin.x ?? 0.5, options.origin.y ?? 0.5);
  if (Number.isFinite(options.scale)) image.setScale(options.scale);
  if (Number.isFinite(options.displayWidth) && Number.isFinite(options.displayHeight)) {
    image.setDisplaySize(options.displayWidth, options.displayHeight);
  }
  if (Number.isFinite(options.depth)) image.setDepth(options.depth);
  if (options.tint !== undefined) image.setTint(options.tint);
  if (options.alpha !== undefined) image.setAlpha(options.alpha);
  return image;
}
