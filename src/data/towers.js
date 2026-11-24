/**
 * Конфигурация башен и позиции площадок на карте.
 * Баланс можно менять здесь, не затрагивая логику GameScene.
 */

export const TOWER_TYPES = {
  archer: {
    id: 'archer',
    name: 'Лучник',
    frame: 'sprite_00',
    cost: 80,
    range: 210,
    fireRate: 850,
    damage: 22,
    projectileSpeed: 680,
    projectileColor: 0xffdd55,
    vfxFrame: null,
    splashRadius: 0,
    slowFactor: 1,
    slowDuration: 0
  },
  mage: {
    id: 'mage',
    name: 'Маг огня',
    frame: 'sprite_01',
    cost: 130,
    range: 195,
    fireRate: 1450,
    damage: 38,
    projectileSpeed: 460,
    projectileColor: 0xff6611,
    vfxFrame: 'sprite_13',
    splashRadius: 75,
    slowFactor: 1,
    slowDuration: 0
  },
  ice: {
    id: 'ice',
    name: 'Лёд',
    frame: 'sprite_02',
    cost: 110,
    range: 185,
    fireRate: 1200,
    damage: 18,
    projectileSpeed: 520,
    projectileColor: 0x44ddff,
    vfxFrame: 'sprite_14',
    splashRadius: 55,
    slowFactor: 0.45,
    slowDuration: 2500
  },
  lightning: {
    id: 'lightning',
    name: 'Молния',
    frame: 'sprite_03',
    cost: 160,
    range: 225,
    fireRate: 1600,
    damage: 55,
    projectileSpeed: 900,
    projectileColor: 0xffee33,
    vfxFrame: 'sprite_15',
    splashRadius: 45,
    slowFactor: 1,
    slowDuration: 0
  }
};

// Координаты семи каменных площадок (+) на карте 1280x530.
export const TOWER_PADS = [
  { x: 558, y: 150 },
  { x: 776, y: 193 },
  { x: 210, y: 298 },
  { x: 563, y: 377 },
  { x: 320, y: 530 },
  { x: 1125, y: 380 },
  { x: 1039, y: 562 }
];
