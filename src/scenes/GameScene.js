import Phaser from 'phaser';
import { addSprite, SPRITE_CATALOG } from '../systems/SpriteAssets.js';
import { TOWER_TYPES, TOWER_PADS } from '../data/towers.js';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 1024;
const MAP_HEIGHT = 714;
const GEM_TYPES = ['gem_purple', 'gem_yellow', 'gem_green', 'gem_blue', 'gem_red'];
const ENEMY_CONFIGS = Object.freeze({
  goblin:   { frame: 'sprite_08', scale: 0.28, hp: 70, reward: 15, duration: 20000, stepSpeed: 13, hop: 4, tilt: 6 },
  orc:      { frame: 'sprite_09', scale: 0.23, hp: 220, reward: 35, duration: 26000, stepSpeed: 9, hop: 3, tilt: 5 },
  skeleton: { frame: 'sprite_10', scale: 0.24, hp: 130, reward: 25, duration: 22000, stepSpeed: 11, hop: 3.5, tilt: 6 },
  wolf:     { frame: 'sprite_11', scale: 0.27, hp: 95, reward: 20, duration: 17000, stepSpeed: 15, hop: 4, tilt: 4 },
  boss:     { frame: 'sprite_12', scale: 0.24, hp: 650, reward: 90, duration: 34000, stepSpeed: 6, hop: 2.5, tilt: 4 }
});
const ENEMY_TYPES = Object.freeze(Object.keys(ENEMY_CONFIGS));
const TOWER_CARD_ORDER = ['archer', 'mage', 'ice', 'lightning'];
const CARD_STYLES = Object.freeze({
  archer: { accent: 0x38d96b, bgTint: 0x163824, label: 'Лучник' },
  mage: { accent: 0xff6a2b, bgTint: 0x3b1d14, label: 'Маг огня' },
  ice: { accent: 0x38c6ff, bgTint: 0x142e42, label: 'Лёд' },
  lightning: { accent: 0xffd633, bgTint: 0x362d14, label: 'Молния' }
});
const GEM_COLORS = Object.freeze({
  gem_purple: 0xc855ff, gem_yellow: 0xffd633, gem_green: 0x38e06b,
  gem_blue: 0x38b6ff, gem_red: 0xff4747
});

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.rows = 5;
    this.cols = 7;
    this.gemSize = 56;
    this.startX = 472;
    this.startY = 758;
    this.board = [];
    this.selectedGem = null;
    this.dragStart = null;
    this.isSwapping = false;
    this.isResolvingBoard = false;
    this.gold = 250;
    this.mana = 120;
    this.combo = 1;
    this.waveNumber = 1;
    this.maxWaves = 15;
    this.isPaused = false;
    this.gemSelectCursor = null;
    this.spellBtnBg = null;
    this.spellBtnText = null;
    this.castleHp = 20;
    this.maxCastleHp = 20;
    this.selectedTowerKey = null;
    this.towerCards = {};
    this.pads = [];
    this.towers = [];
    this.enemies = [];
    this.enemyTweens = [];
    this.enemySpawnIndex = 0;
    this.enemyTimer = null;
    this.worldRoot = null;
    this.DEBUG_PATH = false;
    this.roadPath = null;
    this.pathEditor = null;
  }

  create() {
    const { width, height } = this.scale;
    this.background = this.add.rectangle(0, 0, width, height, 0x14251d).setOrigin(0).setDepth(-10);
    const params = new URLSearchParams(window.location.search);
    this.assetGalleryMode = params.get('assets') === '1';
    this.padEditorMode = params.get('pads') === '1';

    if (this.assetGalleryMode) {
      this.renderAssetGallery(width, height);
    } else {
      this.worldRoot = this.add.container(0, 0);
      this.backgroundLayer = this.add.container(0, 0);
      this.gameLayer = this.add.container(0, 0);
      this.uiLayer = this.add.container(0, 0);
      this.worldRoot.add([this.backgroundLayer, this.gameLayer, this.uiLayer]);
      this.buildWorld();
      this.fitWorld(width, height);
    }

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      if (this.enemyTimer) this.enemyTimer.remove(false);
      this.enemyTweens.forEach((tween) => tween.stop());
      this.enemyTweens = [];
      if (this.pathEditor?.pointerHandler) this.input.off('pointerdown', this.pathEditor.pointerHandler);
      if (this.padEditorPointerHandler) this.input.off('pointerdown', this.padEditorPointerHandler);
      this.padEditorLabels?.forEach((label) => label.destroy());
    });
  }

  buildWorld() {
    // BootScene owns asset loading; preserve the established project-wide texture keys.
    this.backgroundLayer.add(
      this.add.image(DESIGN_WIDTH / 2, MAP_HEIGHT / 2, 'world-map').setDisplaySize(DESIGN_WIDTH, MAP_HEIGHT)
    );
    this.uiLayer.add(this.add.rectangle(0, MAP_HEIGHT, DESIGN_WIDTH, DESIGN_HEIGHT - MAP_HEIGHT, 0x101a2d)
      .setOrigin(0).setDepth(0));

    if (this.padEditorMode) {
      this.enablePadEditor();
      return;
    }

    this.createRoadPath();
    this.createTowerPads();
    this.createTopHud();
    this.createBottomUi();
    this.createMatch3Board();
    this.createInputHandlers();

    if (!this.DEBUG_PATH) {
      this.enemyTimer = this.time.addEvent({
        delay: 2800,
        callback: () => this.spawnNextEnemy(),
        loop: true
      });
      this.spawnEnemy('goblin');
    }
  }

  update(time, delta) {
    if (this.isPaused) return;
    for (const enemy of this.enemies) {
      if (enemy.isDead || enemy.slowTimer <= 0) continue;
      enemy.slowTimer -= delta;
      if (enemy.slowTimer <= 0) {
        enemy.setSpeedMultiplier(1);
        enemy.sprite.clearTint();
      }
    }

    for (const tower of this.towers) {
      if (time - tower.lastShotTime < tower.cfg.fireRate) continue;
      const target = this.findBestTarget(tower.x, tower.y, tower.cfg.range);
      if (target) {
        tower.lastShotTime = time;
        this.fireTower(tower, target);
      }
    }
  }

  createTopHud() {
    const bg = this.add.graphics().setDepth(1800);
    bg.fillStyle(0x0d1322, 0.82);
    bg.fillRoundedRect(280, 8, 720, 48, 12);
    bg.lineStyle(2, 0xc89d42, 0.9);
    bg.strokeRoundedRect(280, 8, 720, 48, 12);
    const style = { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff' };

    this.uiLayer.add(bg);
    this.uiLayer.add(addSprite(this, 'sprite_34', 325, 32, { scale: 0.45, depth: 1801 }));
    this.hpText = this.add.text(350, 21, '', style).setDepth(1801);
    this.uiLayer.add(this.hpText);
    this.uiLayer.add(addSprite(this, 'sprite_33', 520, 32, { scale: 0.45, depth: 1801 }));
    this.manaText = this.add.text(545, 21, '', style).setDepth(1801);
    this.uiLayer.add(this.manaText);
    this.uiLayer.add(addSprite(this, 'sprite_32', 710, 32, { scale: 0.45, depth: 1801 }));
    this.goldText = this.add.text(735, 21, '', { ...style, color: '#ffd859' }).setDepth(1801);
    this.uiLayer.add(this.goldText);
    const pauseButton = addSprite(this, 'sprite_28', 885, 32, { scale: 0.42, depth: 1801 });
    pauseButton.setInteractive({ useHandCursor: true });
    pauseButton.on('pointerdown', () => this.togglePause(pauseButton));
    this.uiLayer.add(pauseButton);
    this.uiLayer.add(addSprite(this, 'sprite_29', 945, 32, { scale: 0.42, depth: 1801 }));
    this.updateHud();
  }

  togglePause(button) {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.tweens.pauseAll();
      this.time.timeScale = 0;
      button?.setTint(0xffaa44);
    } else {
      this.time.timeScale = 1;
      this.tweens.resumeAll();
      button?.clearTint();
    }
  }

  updateHud() {
    this.hpText?.setText(`${Math.max(0, this.castleHp)}/${this.maxCastleHp}`);
    this.manaText?.setText(String(this.mana));
    this.goldText?.setText(String(this.gold));
    this.refreshCardStates();
    this.refreshSpellButton();
  }

  createTowerPads() {
    TOWER_PADS.forEach((point, index) => {
      const ring = this.add.ellipse(point.x, point.y + 4, 76, 44)
        .setStrokeStyle(3, 0x55ff77, 0.9)
        .setFillStyle(0x55ff77, 0.18)
        .setVisible(false)
        .setDepth(point.y - 1);
      this.gameLayer.add(ring);
      this.tweens.add({ targets: ring, scaleX: 1.08, scaleY: 1.08, alpha: 0.45,
        duration: 650, yoyo: true, repeat: -1 });

      const hitZone = this.add.zone(point.x, point.y, 82, 56)
        .setInteractive({ useHandCursor: true })
        .setDepth(point.y + 2);
      this.gameLayer.add(hitZone);
      const pad = { index, x: point.x, y: point.y, occupied: false, ring, hitZone };
      hitZone.on('pointerdown', () => this.onPadClick(pad));
      this.pads.push(pad);
    });
  }

  createBottomUi() {
    const dock = this.add.graphics().setDepth(1490);
    dock.fillGradientStyle(0x0d1526, 0x0d1526, 0x070b14, 0x070b14, 0.98);
    dock.fillRect(0, MAP_HEIGHT, DESIGN_WIDTH, DESIGN_HEIGHT - MAP_HEIGHT);
    dock.lineStyle(3, 0xc8963e, 0.95);
    dock.lineBetween(0, MAP_HEIGHT, DESIGN_WIDTH, MAP_HEIGHT);
    this.uiLayer.add(dock);

    this.uiLayer.add(addSprite(this, 'sprite_17', 244, 870, {
      displayWidth: 472, displayHeight: 196, depth: 1500
    }));
    this.uiLayer.add(addSprite(this, 'sprite_25', 244, 738, {
      displayWidth: 236, displayHeight: 30, depth: 1505
    }));
    this.uiLayer.add(this.add.text(244, 738, 'Башни Обороны', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#fff6d6', stroke: '#3b2306', strokeThickness: 3
    }).setOrigin(0.5).setDepth(1506));

    TOWER_CARD_ORDER.forEach((key, index) => {
      const cfg = TOWER_TYPES[key];
      const style = CARD_STYLES[key];
      const x = 73 + index * 114;
      const y = 870;
      const container = this.add.container(x, y).setDepth(1502);
      const glow = this.add.graphics();
      glow.fillStyle(style.bgTint, 0.95);
      glow.fillRoundedRect(-46, -74, 92, 148, 10);
      glow.lineStyle(2, style.accent, 0.9);
      glow.strokeRoundedRect(-44, -72, 88, 144, 9);
      const frame = addSprite(this, 'sprite_19', 0, 0, { displayWidth: 104, displayHeight: 160 });
      const namePlate = this.add.graphics();
      namePlate.fillStyle(0x0b111e, 0.9);
      namePlate.fillRoundedRect(-41, -69, 82, 20, 5);
      namePlate.lineStyle(1, style.accent, 0.85);
      namePlate.strokeRoundedRect(-41, -69, 82, 20, 5);
      const name = this.add.text(0, -59, style.label, {
        fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5);
      const icon = addSprite(this, cfg.frame, 0, -4, { scale: 0.43 });
      const pricePlate = this.add.graphics();
      pricePlate.fillStyle(0x090e1a, 0.94);
      pricePlate.fillRoundedRect(-38, 46, 76, 22, 6);
      pricePlate.lineStyle(1.5, 0xd4a446, 0.9);
      pricePlate.strokeRoundedRect(-38, 46, 76, 22, 6);
      const coin = addSprite(this, 'sprite_32', -19, 57, { scale: 0.26 });
      const price = this.add.text(8, 57, String(cfg.cost), {
        fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#ffd859', stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5);
      const outline = this.add.graphics().setVisible(false);
      outline.lineStyle(3, 0x66ff88, 1);
      outline.strokeRoundedRect(-51, -79, 102, 158, 11);
      container.add([glow, frame, namePlate, name, icon, pricePlate, coin, price, outline]);
      container.setSize(104, 160).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.selectTowerCard(key));
      this.uiLayer.add(container);
      this.towerCards[key] = {
        container, baseY: y, frame, icon, priceText: price, selectOutline: outline, cfg
      };
    });

    this.uiLayer.add(addSprite(this, 'sprite_22', 640, 870, {
      displayWidth: 432, displayHeight: 316, depth: 1500
    }));
    this.gemSelectCursor = addSprite(this, 'sprite_23', 0, 0, {
      displayWidth: 58, displayHeight: 58, depth: 1515
    }).setVisible(false);
    this.uiLayer.add(this.gemSelectCursor);
    this.tweens.add({
      targets: this.gemSelectCursor, scaleX: this.gemSelectCursor.scaleX * 1.07,
      scaleY: this.gemSelectCursor.scaleY * 1.07, duration: 450, yoyo: true, repeat: -1
    });

    this.uiLayer.add(addSprite(this, 'sprite_18', 1099, 870, {
      displayWidth: 342, displayHeight: 196, depth: 1500
    }));
    const rightDeco = this.add.graphics().setDepth(1501);
    rightDeco.fillStyle(0x131d33, 0.85);
    rightDeco.fillRoundedRect(942, 785, 148, 170, 8);
    rightDeco.fillStyle(0x231c14, 0.88);
    rightDeco.fillRoundedRect(1096, 785, 160, 170, 8);
    rightDeco.lineStyle(1.5, 0xc8963e, 0.75);
    rightDeco.strokeRoundedRect(942, 785, 148, 170, 8);
    rightDeco.strokeRoundedRect(1096, 785, 160, 170, 8);
    this.uiLayer.add(rightDeco);

    this.comboText = this.add.text(1016, 804, 'Комбо x1', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffd859', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(1503);
    this.uiLayer.add(this.comboText);
    const manaCrystal = addSprite(this, 'sprite_33', 1016, 852, { scale: 0.56, depth: 1503 });
    this.uiLayer.add(manaCrystal);
    this.tweens.add({ targets: manaCrystal, y: 847, duration: 900, yoyo: true,
      repeat: -1, ease: 'Sine.easeInOut' });
    this.manaGainText = this.add.text(1016, 892, '+15 маны', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#6ee2ff', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(1503);
    this.uiLayer.add(this.manaGainText);

    this.spellBtnBg = addSprite(this, 'sprite_26', 1016, 948, {
      displayWidth: 134, displayHeight: 32, depth: 1503
    }).setInteractive({ useHandCursor: true });
    this.spellBtnText = this.add.text(1016, 948, '⚡ Разряд (50)', {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffffff', stroke: '#081b33', strokeThickness: 2
    }).setOrigin(0.5).setDepth(1504);
    this.uiLayer.add([this.spellBtnBg, this.spellBtnText]);
    this.spellBtnBg.on('pointerdown', () => this.castLightningSpell());

    this.uiLayer.add(addSprite(this, 'sprite_39', 1176, 808, { scale: 0.44, depth: 1503 }));
    this.waveGoalTitle = this.add.text(1176, 846, `Волна ${this.waveNumber}/${this.maxWaves}`, {
      fontSize: '17px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffd859', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(1503);
    this.uiLayer.add(this.waveGoalTitle);
    this.uiLayer.add(this.add.text(1176, 904, 'Отразить 15 волн\\nи защитить замок', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#f3e5c2', align: 'center', lineSpacing: 4,
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(1503));

    this.refreshCardStates();
    this.refreshSpellButton();
  }

  refreshSpellButton() {
    if (!this.spellBtnBg || !this.spellBtnText) return;
    const canCast = this.mana >= 50;
    this.spellBtnBg.setAlpha(canCast ? 1 : 0.45);
    this.spellBtnText.setAlpha(canCast ? 1 : 0.6);
  }

  castLightningSpell() {
    if (this.isPaused || this.mana < 50) return;
    let target = null;
    let furthestProgress = -1;
    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy.progress > furthestProgress) {
        target = enemy;
        furthestProgress = enemy.progress;
      }
    }
    if (!target) return;
    this.mana -= 50;
    this.updateHud();
    const strikeX = target.x;
    const strikeY = target.y - 16;
    const effect = addSprite(this, 'sprite_15', strikeX, strikeY, { scale: 0.35, depth: 1700 });
    this.gameLayer.add(effect);
    this.cameras.main.shake(140, 0.006);
    this.tweens.add({ targets: effect, scaleX: 0.95, scaleY: 0.95, alpha: 0,
      duration: 420, ease: 'Quad.easeOut', onComplete: () => effect.destroy() });
    const spellCfg = { damage: 120, slowFactor: 1, slowDuration: 0 };
    [...this.enemies].forEach((enemy) => {
      if (!enemy.isDead &&
        Phaser.Math.Distance.Between(strikeX, strikeY, enemy.x, enemy.y - 15) <= 95) {
        this.damageEnemy(enemy, spellCfg);
      }
    });
  }

  selectTowerCard(key) {
    if (this.isPaused) return;
    const cfg = TOWER_TYPES[key];
    const card = this.towerCards[key]?.container;
    if (!cfg || !card) return;
    if (this.gold < cfg.cost) {
      this.tweens.add({ targets: card, x: card.x + 5, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.selectedTowerKey = this.selectedTowerKey === key ? null : key;
    this.refreshCardStates();
  }

  refreshCardStates() {
    Object.entries(this.towerCards).forEach(([key, item]) => {
      const canAfford = this.gold >= item.cfg.cost;
      const selected = this.selectedTowerKey === key;
      item.icon.setAlpha(canAfford ? 1 : 0.45);
      item.priceText.setColor(canAfford ? '#ffd859' : '#ff6666');
      item.selectOutline.setVisible(selected);
      this.tweens.add({ targets: item.container, y: selected ? item.baseY - 7 : item.baseY,
        scaleX: selected ? 1.05 : 1, scaleY: selected ? 1.05 : 1,
        duration: 120, ease: 'Quad.easeOut' });
    });
    const showRings = Boolean(this.selectedTowerKey);
    this.pads.forEach((pad) => pad.ring.setVisible(showRings && !pad.occupied));
  }

  onPadClick(pad) {
    if (this.isPaused || pad.occupied) return;
    if (!this.selectedTowerKey) {
      const affordable = TOWER_CARD_ORDER.find((key) => this.gold >= TOWER_TYPES[key].cost);
      if (!affordable) return;
      this.selectedTowerKey = affordable;
    }
    const cfg = TOWER_TYPES[this.selectedTowerKey];
    if (!cfg || this.gold < cfg.cost) return;

    this.gold -= cfg.cost;
    pad.occupied = true;
    pad.ring.setVisible(false);
    const sprite = this.add.sprite(pad.x, pad.y + 8, 'game-atlas', cfg.frame)
      .setOrigin(0.5, 0.85).setScale(0.1).setDepth(pad.y + 10);
    this.gameLayer.add(sprite);
    this.tweens.add({ targets: sprite, scaleX: 0.46, scaleY: 0.46,
      duration: 240, ease: 'Back.easeOut' });
    this.towers.push({ x: pad.x, y: pad.y - 18, cfg, sprite, lastShotTime: 0 });
    this.selectedTowerKey = null;
    this.updateHud();
  }

  findBestTarget(x, y, range) {
    let best = null;
    let furthestProgress = -1;
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y - 15);
      if (distance <= range && enemy.progress > furthestProgress) {
        best = enemy;
        furthestProgress = enemy.progress;
      }
    }
    return best;
  }

  fireTower(tower, target) {
    this.tweens.add({ targets: tower.sprite, scaleX: 0.49, scaleY: 0.42,
      duration: 90, yoyo: true });
    const startX = tower.x;
    const startY = tower.y - 16;
    const bullet = this.add.circle(startX, startY, 5, tower.cfg.projectileColor)
      .setStrokeStyle(2, 0xffffff, 0.9).setDepth(1400);
    this.gameLayer.add(bullet);

    const trail = this.add.graphics().setDepth(1399);
    this.gameLayer.add(trail);
    const flightTime = Math.max(90,
      Phaser.Math.Distance.Between(startX, startY, target.x, target.y - 18) /
      tower.cfg.projectileSpeed * 1000);
    this.tweens.add({
      targets: bullet, x: target.x, y: target.y - 18, duration: flightTime,
      onUpdate: () => {
        trail.clear();
        trail.lineStyle(3, tower.cfg.projectileColor, 0.35);
        trail.lineBetween(startX, startY, bullet.x, bullet.y);
      },
      onComplete: () => {
        const hitX = bullet.x;
        const hitY = bullet.y;
        bullet.destroy();
        trail.destroy();
        this.onProjectileImpact(tower.cfg, target, hitX, hitY);
      }
    });
  }

  onProjectileImpact(cfg, primaryTarget, hitX, hitY) {
    if (cfg.vfxFrame) {
      const effect = this.add.sprite(hitX, hitY + 8, 'game-atlas', cfg.vfxFrame)
        .setScale(0.22).setDepth(hitY + 30);
      this.gameLayer.add(effect);
      this.tweens.add({ targets: effect, scaleX: 0.55, scaleY: 0.55,
        alpha: 0, duration: 360, ease: 'Quad.easeOut',
        onComplete: () => effect.destroy() });
    } else {
      const flash = this.add.circle(hitX, hitY, 8, 0xffe066, 0.9).setDepth(1400);
      this.gameLayer.add(flash);
      this.tweens.add({ targets: flash, scale: 2.8, alpha: 0,
        duration: 220, onComplete: () => flash.destroy() });
    }

    if (cfg.splashRadius > 0) {
      [...this.enemies].forEach((enemy) => {
        if (!enemy.isDead &&
          Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y - 15) <= cfg.splashRadius) {
          this.damageEnemy(enemy, cfg);
        }
      });
    } else if (primaryTarget && !primaryTarget.isDead) {
      this.damageEnemy(primaryTarget, cfg);
    }
  }

  damageEnemy(enemy, cfg) {
    if (enemy.isDead) return;
    enemy.hp -= cfg.damage;
    enemy.sprite.setTintFill(0xffffff);
    this.time.delayedCall(75, () => {
      if (!enemy.active || enemy.isDead) return;
      if (enemy.slowTimer > 0) enemy.sprite.setTint(0x66ddff);
      else enemy.sprite.clearTint();
    });

    if (cfg.slowFactor < 1) {
      enemy.slowTimer = cfg.slowDuration;
      enemy.setSpeedMultiplier(cfg.slowFactor);
      enemy.sprite.setTint(0x66ddff);
    }
    enemy.hpFill.width = 40 * Math.max(0, enemy.hp / enemy.maxHp);

    if (enemy.hp <= 0) {
      enemy.isDead = true;
      this.gold += enemy.reward;
      this.updateHud();
      enemy.moveTween.stop();
      this.tweens.add({ targets: enemy, alpha: 0, scaleX: 1.15, scaleY: 0.75,
        duration: 180, onComplete: () => {
          this.enemies = this.enemies.filter((item) => item !== enemy);
          this.enemyTweens = this.enemyTweens.filter((item) => item !== enemy.moveTween);
          enemy.destroy();
        } });
    }
  }

  createRoadPath() {
    // Exact route previously traced and approved by the user. Keep these coordinates unchanged.
    const points = [
      155, 175, 163, 177, 149, 174, 213, 234, 298, 245, 354, 266,
      407, 252, 483, 257, 562, 229, 628, 185, 664, 146, 729, 121,
      792, 139, 846, 172, 867, 227, 837, 257, 775, 287, 700, 298,
      641, 313, 580, 319, 538, 320, 477, 335, 429, 334, 378, 335,
      345, 349, 305, 381, 254, 443, 208, 484, 203, 528, 195, 567,
      223, 601, 279, 625, 337, 638, 398, 625, 464, 616, 535, 613,
      605, 610, 664, 560, 730, 538, 817, 529, 857, 553, 900, 591,
      971, 630, 1062, 632, 1132, 603, 1166, 557, 1162, 507, 1142, 471,
      1091, 457, 1065, 429, 1040, 408, 1025, 369, 1038, 326, 1083, 302,
      1115, 280, 1137, 256
    ];
    this.roadPoints = [...points];
    this.roadPath = new Phaser.Curves.Spline(this.roadPoints);
    if (this.DEBUG_PATH) this.enablePathEditor();
  }

  spawnNextEnemy() {
    const type = ENEMY_TYPES[this.enemySpawnIndex % ENEMY_TYPES.length];
    this.enemySpawnIndex += 1;
    this.spawnEnemy(type);
    if (this.enemySpawnIndex % 6 === 0 && this.waveNumber < this.maxWaves) {
      this.waveNumber += 1;
      this.waveGoalTitle?.setText(`Волна ${this.waveNumber}/${this.maxWaves}`);
    }
  }

  spawnEnemy(type = 'goblin') {
    if (!this.gameLayer || !this.roadPath || !this.textures.exists('game-atlas')) return null;
    const cfg = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goblin;
    const start = this.roadPath.getPoint(0.001);
    const container = this.add.container(start.x, start.y);
    const shadow = this.add.ellipse(0, 0, 56 * cfg.scale * 1.6,
      20 * cfg.scale * 1.6, 0x000000, 0.38);
    const sprite = this.add.sprite(0, 0, 'game-atlas', cfg.frame)
      .setOrigin(0.5, 0.92).setScale(cfg.scale);
    const hpY = -sprite.displayHeight - 7;
    const hpBg = this.add.rectangle(0, hpY, 44, 6, 0x111111, 0.9)
      .setStrokeStyle(1, 0x000000);
    const hpFill = this.add.rectangle(-21, hpY, 42, 4, 0xee3333).setOrigin(0, 0.5);
    container.add([shadow, sprite, hpBg, hpFill]);
    this.gameLayer.add(container);
    container.setDepth(start.y);
    Object.assign(container, {
      hp: cfg.hp, maxHp: cfg.hp, reward: cfg.reward, isDead: false,
      progress: 0.001, slowTimer: 0, sprite, hpFill
    });

    const position = new Phaser.Math.Vector2();
    const tangent = new Phaser.Math.Vector2();
    let facing = 1;
    let stride = Math.random() * Math.PI * 2;
    let speedMultiplier = 1;
    const moveTween = this.tweens.addCounter({
      from: 0.001, to: 1, duration: cfg.duration, ease: 'Linear',
      onUpdate: (tween) => {
        if (!container.active || container.isDead) return;
        const progress = tween.getValue();
        container.progress = progress;
        this.roadPath.getPoint(progress, position);
        this.roadPath.getTangent(progress, tangent);
        container.setPosition(position.x, position.y).setDepth(position.y);
        if (tangent.x < -0.08) { facing = -1; sprite.setFlipX(true); }
        else if (tangent.x > 0.08) { facing = 1; sprite.setFlipX(false); }

        stride += (this.game.loop.delta / 1000) * speedMultiplier * cfg.stepSpeed;
        const lift = Math.abs(Math.sin(stride));
        const sway = Math.sin(stride);
        sprite.y = -lift * cfg.hop;
        sprite.setScale(cfg.scale * (1 + (1 - lift) * 0.06),
          cfg.scale * (1 - (1 - lift) * 0.05));
        sprite.angle = sway * cfg.tilt + facing * 4;
        shadow.setScale(1 - lift * 0.22);
      },
      onComplete: () => {
        if (!container.active || container.isDead) return;
        container.isDead = true;
        this.castleHp = Math.max(0, this.castleHp - 1);
        this.updateHud();
        this.cameras.main.shake(180, 0.008);
        this.enemies = this.enemies.filter((item) => item !== container);
        this.enemyTweens = this.enemyTweens.filter((item) => item !== moveTween);
        container.destroy();
      }
    });
    container.moveTween = moveTween;
    container.setSpeedMultiplier = (multiplier) => {
      speedMultiplier = Number.isFinite(multiplier) ? Math.max(0, multiplier) : 1;
      moveTween.timeScale = speedMultiplier;
    };
    this.enemies.push(container);
    this.enemyTweens.push(moveTween);
    return container;
  }

  createMatch3Board() {
    for (let row = 0; row < this.rows; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.cols; col++) {
        let type;
        do {
          type = Phaser.Math.RND.pick(GEM_TYPES);
        } while (
          (col >= 2 && this.board[row][col - 1]?.gemType === type &&
            this.board[row][col - 2]?.gemType === type) ||
          (row >= 2 && this.board[row - 1]?.[col]?.gemType === type &&
            this.board[row - 2]?.[col]?.gemType === type)
        );
        const gem = this.add.sprite(this.startX + col * this.gemSize,
          this.startY + row * this.gemSize, 'game-atlas', type)
          .setDisplaySize(46, 46).setDepth(7).setInteractive({ useHandCursor: true });
        gem.row = row;
        gem.col = col;
        gem.gemType = type;
        this.uiLayer.add(gem);
        this.board[row][col] = gem;
      }
    }
  }

  createInputHandlers() {
    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || !this.worldRoot || this.isResolvingBoard) return;
      const point = this.screenToWorld(pointer.x, pointer.y);
      const gem = this.findGemAt(point.x, point.y);
      if (gem) this.dragStart = { x: point.x, y: point.y, gem };
    });
    this.input.on('pointerup', (pointer) => {
      if (this.isPaused || !this.dragStart || !this.worldRoot || this.isResolvingBoard) return;
      const start = this.dragStart;
      const point = this.worldRoot.getLocalPoint(pointer.x, pointer.y);
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      this.dragStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
        this.selectGem(start.gem);
        return;
      }
      let row = start.gem.row;
      let col = start.gem.col;
      if (Math.abs(dx) > Math.abs(dy)) col += dx > 0 ? 1 : -1;
      else row += dy > 0 ? 1 : -1;
      if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        this.clearSelection();
        this.swapGems(start.gem, this.board[row][col]);
      }
    });
  }

  screenToWorld(x, y) {
    const scale = this.worldRoot.scaleX || 1;
    return { x: (x - this.worldRoot.x) / scale, y: (y - this.worldRoot.y) / scale };
  }

  findGemAt(x, y) {
    const col = Math.round((x - this.startX) / this.gemSize);
    const row = Math.round((y - this.startY) / this.gemSize);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    const gem = this.board[row]?.[col];
    return gem?.active && Phaser.Math.Distance.Between(x, y, gem.x, gem.y) <= 30 ? gem : null;
  }

  selectGem(gem) {
    if (!gem?.active || this.isResolvingBoard || this.isSwapping) return;
    if (!this.selectedGem) {
      this.selectedGem = gem;
      this.gemSelectCursor?.setPosition(gem.x, gem.y).setVisible(true);
      return;
    }
    const previous = this.selectedGem;
    this.clearSelection();
    if (previous === gem) return;
    const dr = Math.abs(gem.row - previous.row);
    const dc = Math.abs(gem.col - previous.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) this.swapGems(previous, gem);
  }

  clearSelection() {
    this.selectedGem = null;
    this.gemSelectCursor?.setVisible(false);
  }

  swapGems(first, second) {
    if (!first?.active || !second?.active || this.isSwapping || this.isResolvingBoard || this.isPaused) return;
    this.combo = 1;
    this.comboText?.setText('Комбо x1');
    this.isSwapping = true;
    const a = { row: first.row, col: first.col, x: first.x, y: first.y };
    const b = { row: second.row, col: second.col, x: second.x, y: second.y };
    this.tweens.add({ targets: first, x: b.x, y: b.y, duration: 160, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: second, x: a.x, y: a.y, duration: 160, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.board[a.row][a.col] = second;
        this.board[b.row][b.col] = first;
        first.row = b.row; first.col = b.col;
        second.row = a.row; second.col = a.col;
        this.isSwapping = false;
        const matches = this.findMatches();
        if (matches.length) this.resolveMatches(matches);
        else this.swapGemsBack(first, second, a, b);
      }
    });
  }

  swapGemsBack(first, second, a, b) {
    this.isSwapping = true;
    this.tweens.add({ targets: first, x: a.x, y: a.y, duration: 130 });
    this.tweens.add({ targets: second, x: b.x, y: b.y, duration: 130,
      onComplete: () => {
        this.board[a.row][a.col] = first;
        this.board[b.row][b.col] = second;
        first.row = a.row; first.col = a.col;
        second.row = b.row; second.col = b.col;
        this.isSwapping = false;
      }
    });
  }

  findMatches() {
    const matched = new Set();
    for (let row = 0; row < this.rows; row++) {
      let col = 0;
      while (col < this.cols) {
        const gem = this.board[row][col];
        if (!gem?.active) { col++; continue; }
        let end = col + 1;
        while (end < this.cols && this.board[row][end]?.gemType === gem.gemType) end++;
        if (end - col >= 3) {
          for (let c = col; c < end; c++) matched.add(this.board[row][c]);
        }
        col = end;
      }
    }
    for (let col = 0; col < this.cols; col++) {
      let row = 0;
      while (row < this.rows) {
        const gem = this.board[row][col];
        if (!gem?.active) { row++; continue; }
        let end = row + 1;
        while (end < this.rows && this.board[end][col]?.gemType === gem.gemType) end++;
        if (end - row >= 3) {
          for (let r = row; r < end; r++) matched.add(this.board[r][col]);
        }
        row = end;
      }
    }
    return [...matched];
  }

  resolveMatches(matches) {
    if (!matches.length) { this.isResolvingBoard = false; return; }
    this.isResolvingBoard = true;
    matches.forEach((gem) => {
      this.board[gem.row][gem.col] = null;
      const burst = this.add.circle(gem.x, gem.y, 5, GEM_COLORS[gem.gemType] || 0xffffff)
        .setDepth(1520);
      this.uiLayer.add(burst);
      this.tweens.add({ targets: burst, scale: 3.2, alpha: 0, duration: 220,
        onComplete: () => burst.destroy() });
      this.tweens.add({ targets: gem, scale: 0.05, alpha: 0, duration: 170,
        onComplete: () => gem.destroy() });
    });
    const gainedMana = matches.length * 5 * this.combo;
    this.mana += gainedMana;
    this.manaGainText?.setText(`+${gainedMana} маны`);
    this.comboText?.setText(`Комбо x${this.combo}`);
    this.tweens.add({ targets: [this.comboText, this.manaGainText],
      scaleX: 1.2, scaleY: 1.2, duration: 120, yoyo: true });
    this.updateHud();
    this.time.delayedCall(190, () => this.dropAndRefill());
  }

  dropAndRefill() {
    for (let col = 0; col < this.cols; col++) {
      const survivors = [];
      for (let row = this.rows - 1; row >= 0; row--) {
        const gem = this.board[row][col];
        if (gem?.active) survivors.push(gem);
      }
      for (let row = this.rows - 1; row >= 0; row--) {
        const gem = survivors[this.rows - 1 - row] || null;
        this.board[row][col] = gem;
        if (gem) {
          gem.row = row;
          gem.col = col;
          this.tweens.add({ targets: gem, x: this.startX + col * this.gemSize,
            y: this.startY + row * this.gemSize, duration: 190, ease: 'Quad.easeIn' });
        }
      }
      const missing = this.rows - survivors.length;
      for (let i = 0; i < missing; i++) {
        const row = missing - 1 - i;
        const type = Phaser.Math.RND.pick(GEM_TYPES);
        const gem = this.add.sprite(this.startX + col * this.gemSize,
          this.startY - (i + 1) * this.gemSize, 'game-atlas', type)
          .setDisplaySize(46, 46).setDepth(7);
        gem.row = row;
        gem.col = col;
        gem.gemType = type;
        this.uiLayer.add(gem);
        this.board[row][col] = gem;
        this.tweens.add({ targets: gem, y: this.startY + row * this.gemSize,
          duration: 220, ease: 'Bounce.easeOut' });
      }
    }
    this.time.delayedCall(240, () => {
      const nextMatches = this.findMatches();
      if (nextMatches.length) {
        this.combo += 1;
        this.resolveMatches(nextMatches);
      } else {
        this.combo = 1;
        this.comboText?.setText('Комбо x1');
        this.isResolvingBoard = false;
      }
    });
  }

  enablePadEditor() {
    // Standalone touch editor for choosing tower build-pad positions.
    // Open with ?pads=1; exported coordinates are copied into src/data/towers.js later.
    this.padEditorPoints = [];
    this.padEditorGraphics = this.add.graphics().setDepth(2500);
    this.uiLayer.add(this.padEditorGraphics);

    const style = {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#ffffff',
      backgroundColor: '#172235',
      padding: { x: 9, y: 7 }
    };
    const addControl = (x, label, callback) => {
      const control = this.add.text(x, 12, label, style)
        .setDepth(3000).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      control.on('pointerdown', (pointer) => {
        pointer.event?.stopPropagation?.();
        callback();
        this.drawPadEditor();
      });
      this.uiLayer.add(control);
      return control;
    };

    addControl(12, 'Очистить', () => { this.padEditorPoints = []; });
    addControl(118, 'Отменить', () => { this.padEditorPoints.pop(); });
    addControl(230, 'Координаты', () => {
      const pairs = this.padEditorPoints.map((p) => `{ x: ${p.x}, y: ${p.y} }`).join(',\\n  ');
      window.prompt('Скопируй координаты площадок:', pairs);
    });
    addControl(385, 'Готово', () => {
      const pairs = this.padEditorPoints.map((p) => `{ x: ${p.x}, y: ${p.y} }`).join(', ');
      window.prompt('Координаты для src/data/towers.js:', pairs);
    });

    this.padEditorPointerHandler = (pointer) => {
      const point = this.screenToWorld(pointer.x, pointer.y);
      if (point.y < 58 || point.y > MAP_HEIGHT || point.x < 0 || point.x > DESIGN_WIDTH) return;
      this.padEditorPoints.push({ x: Math.round(point.x), y: Math.round(point.y) });
      this.drawPadEditor();
    };
    this.input.on('pointerdown', this.padEditorPointerHandler);
    this.drawPadEditor();
  }

  drawPadEditor() {
    if (!this.padEditorGraphics) return;
    this.padEditorLabels?.forEach((label) => label.destroy());
    this.padEditorLabels = [];
    this.padEditorInstruction?.destroy();
    const g = this.padEditorGraphics;
    g.clear();
    this.padEditorPoints.forEach((point, index) => {
      g.lineStyle(4, 0xffffff, 0.95);
      g.strokeEllipse(point.x, point.y, 78, 48);
      g.fillStyle(0x00e676, 0.3);
      g.fillEllipse(point.x, point.y, 78, 48);
      g.fillStyle(0x101010, 0.95);
      g.fillCircle(point.x, point.y, 13);
      const number = this.add.text(point.x, point.y, String(index + 1), {
        fontFamily: 'Arial, sans-serif', fontSize: '15px',
        fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5).setDepth(2502);
      this.gameLayer.add(number);
      this.padEditorLabels.push(number);
    });
    this.padEditorInstruction = this.add.text(14, 58,
      `РЕЖИМ РАССТАНОВКИ · Точек: ${this.padEditorPoints.length} · Нажимай по центру каждой площадки`,
      { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#ffffff',
        backgroundColor: '#172235', padding: { x: 8, y: 5 } })
      .setDepth(3000).setScrollFactor(0);
  }

  enablePathEditor() {
    if (this.pathEditor) {
      this.pathEditor.graphics.destroy();
      this.pathEditor.controls.forEach((control) => control.destroy());
      if (this.pathEditor.pointerHandler) this.input.off('pointerdown', this.pathEditor.pointerHandler);
    }
    const graphics = this.add.graphics();
    this.gameLayer.add(graphics);
    const controls = [];
    const redraw = () => {
      graphics.clear();
      if (this.roadPoints.length >= 4) {
        this.roadPath = new Phaser.Curves.Spline(this.roadPoints);
        graphics.lineStyle(5, 0x00ff66, 0.95);
        this.roadPath.draw(graphics, 192);
        graphics.fillStyle(0xffcc00, 1);
        for (let i = 0; i < this.roadPoints.length; i += 2) {
          graphics.fillCircle(this.roadPoints[i], this.roadPoints[i + 1], 5);
        }
      } else this.roadPath = null;
    };
    const style = { fontFamily: 'Arial, sans-serif', fontSize: '17px',
      color: '#00ff66', backgroundColor: '#101010', padding: { x: 9, y: 7 } };
    const addControl = (x, label, callback) => {
      const control = this.add.text(x, 14, label, style).setDepth(3000)
        .setScrollFactor(0).setInteractive({ useHandCursor: true });
      control.on('pointerdown', (pointer) => { pointer.event?.stopPropagation?.(); callback(); });
      this.uiLayer.add(control);
      controls.push(control);
    };
    addControl(18, 'Очистить', () => { this.roadPoints = []; redraw(); });
    addControl(132, 'Убрать', () => { this.roadPoints.splice(-2, 2); redraw(); });
    addControl(230, 'Координаты', () => window.prompt('Координаты маршрута:', this.roadPoints.join(', ')));
    const pointerHandler = (pointer) => {
      const point = this.screenToWorld(pointer.x, pointer.y);
      if (point.y < 62 || point.y > MAP_HEIGHT || point.x < 0 || point.x > DESIGN_WIDTH) return;
      this.roadPoints.push(Math.round(point.x), Math.round(point.y));
      redraw();
    };
    this.input.on('pointerdown', pointerHandler);
    this.pathEditor = { graphics, controls, pointerHandler };
    redraw();
  }

  fitWorld(width, height) {
    if (!this.worldRoot) return;
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    this.worldRoot.setScale(scale);
    this.worldRoot.setPosition((width - DESIGN_WIDTH * scale) / 2,
      (height - DESIGN_HEIGHT * scale) / 2);
  }

  renderAssetGallery(width, height) {
    if (this.galleryContainer) this.galleryContainer.destroy(true);
    this.galleryContainer = this.add.container(0, 0);
    const atlas = this.textures.get('game-atlas');
    const frameNames = atlas.getFrameNames()
      .filter((name) => /^sprite_\d+$/.test(name))
      .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
    const columns = width < 700 ? 4 : 8;
    const rows = Math.max(1, Math.ceil(frameNames.length / columns));
    const top = 38;
    const cellWidth = width / columns;
    const cellHeight = (height - top) / rows;
    this.galleryContainer.add(this.add.text(12, 8,
      `ASSET GALLERY · ${frameNames.length} SPRITES`,
      { fontFamily: 'Arial, sans-serif', fontSize: 16, color: '#ffffff' }));
    frameNames.forEach((name, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const frame = atlas.get(name);
      const metadata = SPRITE_CATALOG[name];
      const scale = Math.min((cellWidth - 16) / frame.width,
        (cellHeight * 0.55) / frame.height, 1);
      const image = addSprite(this, name, column * cellWidth + cellWidth / 2,
        top + row * cellHeight + cellHeight * 0.38, { scale });
      const label = this.add.text(column * cellWidth + cellWidth / 2,
        top + row * cellHeight + cellHeight * 0.82,
        `${name} · ${metadata.width}×${metadata.height}`,
        { fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#ffffff' }).setOrigin(0.5);
      this.galleryContainer.add([image, label]);
    });
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.background.setSize(width, height);
    if (this.assetGalleryMode) this.renderAssetGallery(width, height);
    else this.fitWorld(width, height);
  }
}
