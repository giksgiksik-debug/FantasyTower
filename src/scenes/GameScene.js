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
    this.assetGalleryMode = new URLSearchParams(window.location.search).get('assets') === '1';

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
    });
  }

  buildWorld() {
    // BootScene owns asset loading; preserve the established project-wide texture keys.
    this.backgroundLayer.add(
      this.add.image(DESIGN_WIDTH / 2, MAP_HEIGHT / 2, 'world-map').setDisplaySize(DESIGN_WIDTH, MAP_HEIGHT)
    );
    this.uiLayer.add(this.add.rectangle(0, MAP_HEIGHT, DESIGN_WIDTH, DESIGN_HEIGHT - MAP_HEIGHT, 0x101a2d)
      .setOrigin(0).setDepth(0));

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
    this.uiLayer.add(addSprite(this, 'sprite_28', 885, 32, { scale: 0.42, depth: 1801 }));
    this.uiLayer.add(addSprite(this, 'sprite_29', 945, 32, { scale: 0.42, depth: 1801 }));
    this.updateHud();
  }

  updateHud() {
    this.hpText?.setText(`${Math.max(0, this.castleHp)}/${this.maxCastleHp}`);
    this.manaText?.setText(String(this.mana));
    this.goldText?.setText(String(this.gold));
    this.refreshCardStates();
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
    this.uiLayer.add(addSprite(this, 'sprite_17', 180, 870, {
      displayWidth: 350, displayHeight: 230, depth: 5
    }));

    TOWER_CARD_ORDER.forEach((key, index) => {
      const cfg = TOWER_TYPES[key];
      const x = 55 + index * 83;
      const y = 870;
      const cardBg = addSprite(this, 'sprite_19', x, y, { scale: 0.57, depth: 6 });
      cardBg.setInteractive({ useHandCursor: true });
      const icon = addSprite(this, cfg.frame, x, y - 19, { scale: 0.34, depth: 7 });
      const coin = addSprite(this, 'sprite_32', x - 20, y + 43, { scale: 0.25, depth: 7 });
      const priceText = this.add.text(x - 5, y + 34, String(cfg.cost), {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffd859'
      }).setDepth(7);
      this.uiLayer.add([cardBg, icon, coin, priceText]);
      cardBg.on('pointerdown', () => this.selectTowerCard(key));
      this.towerCards[key] = { cardBg, icon, priceText, cfg };
    });

    this.uiLayer.add(addSprite(this, 'sprite_22', 640, 870, {
      displayWidth: 430, displayHeight: 290, depth: 4
    }));
    this.uiLayer.add(addSprite(this, 'sprite_18', 1090, 870, {
      displayWidth: 300, displayHeight: 230, depth: 5
    }));

    this.refreshCardStates();
  }

  selectTowerCard(key) {
    const cfg = TOWER_TYPES[key];
    const card = this.towerCards[key]?.cardBg;
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
      item.cardBg.setTint(selected ? 0x99ff99 : 0xffffff);
      item.cardBg.setScale(selected ? 0.61 : 0.57);
    });
    const showRings = Boolean(this.selectedTowerKey);
    this.pads.forEach((pad) => pad.ring.setVisible(showRings && !pad.occupied));
  }

  onPadClick(pad) {
    if (pad.occupied) return;
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
      if (!this.worldRoot || this.isResolvingBoard) return;
      const point = this.screenToWorld(pointer.x, pointer.y);
      const gem = this.findGemAt(point.x, point.y);
      if (gem) this.dragStart = { x: point.x, y: point.y, gem };
    });
    this.input.on('pointerup', (pointer) => {
      if (!this.dragStart || !this.worldRoot || this.isResolvingBoard) return;
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
      gem.setTint(0xaaffaa);
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
    if (this.selectedGem?.active) this.selectedGem.clearTint();
    this.selectedGem = null;
  }

  swapGems(first, second) {
    if (!first?.active || !second?.active || this.isSwapping || this.isResolvingBoard) return;
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
    const removed = new Set(matches);
    matches.forEach((gem) => {
      this.board[gem.row][gem.col] = null;
      this.tweens.add({ targets: gem, scale: 0, alpha: 0, duration: 140,
        onComplete: () => gem.destroy() });
    });
    this.gold += matches.length * 2;
    this.mana += matches.length;
    this.updateHud();
    this.time.delayedCall(155, () => this.dropAndRefill(removed));
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
      if (nextMatches.length) this.resolveMatches(nextMatches);
      else this.isResolvingBoard = false;
    });
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
