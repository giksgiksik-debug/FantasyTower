import Phaser from 'phaser';
import { addSprite, SPRITE_CATALOG } from '../systems/SpriteAssets.js';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 1024;
const MAP_HEIGHT = 714;
const GEM_TYPES = ['gem_purple', 'gem_yellow', 'gem_green', 'gem_blue', 'gem_red'];
const ENEMY_CONFIGS = Object.freeze({
  goblin:   { frame: 'sprite_08', scale: 0.28, duration: 20000, stepSpeed: 13, hop: 4, tilt: 6 },
  orc:      { frame: 'sprite_09', scale: 0.23, duration: 26000, stepSpeed: 9, hop: 3, tilt: 5 },
  skeleton: { frame: 'sprite_10', scale: 0.24, duration: 22000, stepSpeed: 11, hop: 3.5, tilt: 6 },
  wolf:     { frame: 'sprite_11', scale: 0.27, duration: 17000, stepSpeed: 15, hop: 4, tilt: 4 },
  boss:     { frame: 'sprite_12', scale: 0.24, duration: 34000, stepSpeed: 6, hop: 2.5, tilt: 4 }
});
const ENEMY_TYPES = Object.freeze(Object.keys(ENEMY_CONFIGS));

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.board = [];
    this.rows = 5;
    this.cols = 7;
    this.gemSize = 56;
    this.startX = 472;
    this.startY = 758;
    this.selectedGem = null;
    this.dragStart = null;
    this.enemyTimer = null;
    this.enemyTweens = [];
    this.enemySpawnIndex = 0;
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
    // The map and atlas are loaded by BootScene under these project-wide keys.
    this.backgroundLayer.add(
      this.add.image(DESIGN_WIDTH / 2, MAP_HEIGHT / 2, 'world-map')
        .setDisplaySize(DESIGN_WIDTH, MAP_HEIGHT)
    );

    // Dedicated opaque HUD shelf below the complete map: no road is hidden by UI frames.
    this.uiLayer.add(this.add.rectangle(0, MAP_HEIGHT, DESIGN_WIDTH, DESIGN_HEIGHT - MAP_HEIGHT, 0x101a2d)
      .setOrigin(0).setDepth(0));

    // Interface frame placement follows the supplied layout reference.
    this.uiLayer.add(addSprite(this, 'sprite_17', 180, 870, {
      displayWidth: 350, displayHeight: 230, depth: 5
    }));

    for (let i = 0; i < 3; i++) {
      this.uiLayer.add(addSprite(this, 'sprite_19', 85 + i * 95, 870, {
        scale: 0.68, depth: 6
      }));
    }

    this.uiLayer.add(addSprite(this, 'sprite_22', 640, 870, {
      displayWidth: 430, displayHeight: 290, depth: 4
    }));
    this.uiLayer.add(addSprite(this, 'sprite_18', 1090, 870, {
      displayWidth: 300, displayHeight: 230, depth: 5
    }));

    this.createBoard();
    this.createInputHandlers();
    this.createRoadPath();

    if (!this.DEBUG_PATH) {
      this.enemyTimer = this.time.addEvent({
        delay: 4500,
        callback: () => this.spawnNextEnemy(),
        loop: true
      });
      this.spawnEnemy('goblin');
    }
  }

  createBoard() {
    for (let row = 0; row < this.rows; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const type = Phaser.Math.RND.pick(GEM_TYPES);
        const x = this.startX + col * this.gemSize;
        const y = this.startY + row * this.gemSize;
        const gem = this.add.sprite(x, y, 'game-atlas', type)
          .setDisplaySize(46, 46)
          .setDepth(7)
          .setInteractive({ useHandCursor: true });
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
      if (!this.worldRoot) return;
      const point = this.screenToWorld(pointer.x, pointer.y);
      const gem = this.findGemAt(point.x, point.y);
      if (!gem) return;
      this.dragStart = { x: point.x, y: point.y, gem };
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragStart || !this.worldRoot) return;
      const start = this.dragStart;
      const point = this.worldRoot.getLocalPoint(pointer.x, pointer.y);
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      this.dragStart = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
        this.selectGem(start.gem);
        return;
      }

      let targetRow = start.gem.row;
      let targetCol = start.gem.col;
      if (Math.abs(dx) > Math.abs(dy)) targetCol += dx > 0 ? 1 : -1;
      else targetRow += dy > 0 ? 1 : -1;

      if (targetRow < 0 || targetRow >= this.rows || targetCol < 0 || targetCol >= this.cols) return;
      this.clearSelection();
      this.swapGems(start.gem, this.board[targetRow][targetCol]);
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
    if (!gem || !gem.active) return null;
    return Phaser.Math.Distance.Between(x, y, gem.x, gem.y) <= 30 ? gem : null;
  }

  selectGem(gem) {
    if (!this.selectedGem) {
      this.selectedGem = gem;
      gem.setTint(0xaaffaa);
      return;
    }

    const previous = this.selectedGem;
    this.clearSelection();
    if (previous === gem) return;

    const rowDistance = Math.abs(gem.row - previous.row);
    const colDistance = Math.abs(gem.col - previous.col);
    if ((rowDistance === 1 && colDistance === 0) || (rowDistance === 0 && colDistance === 1)) {
      this.swapGems(previous, gem);
    }
  }

  clearSelection() {
    if (!this.selectedGem) return;
    this.selectedGem.clearTint();
    this.selectedGem = null;
  }

  swapGems(first, second) {
    if (!first?.active || !second?.active || this.isSwapping) return;
    this.isSwapping = true;
    const firstRow = first.row;
    const firstCol = first.col;
    const secondRow = second.row;
    const secondCol = second.col;

    this.tweens.add({
      targets: first,
      x: second.x,
      y: second.y,
      duration: 160,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: second,
      x: first.x,
      y: first.y,
      duration: 160,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.board[firstRow][firstCol] = second;
        this.board[secondRow][secondCol] = first;
        first.row = secondRow;
        first.col = secondCol;
        second.row = firstRow;
        second.col = firstCol;
        this.isSwapping = false;
      }
    });
  }

  createRoadPath() {
    // User-traced route coordinates in the 1280x714 map design space.
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
    const progress = { value: 0.001 };
    const start = this.roadPath.getPoint(progress.value);

    // The container follows the road; the sprite animates independently inside it.
    const container = this.add.container(start.x, start.y);
    const shadow = this.add.ellipse(
      0, 0,
      56 * cfg.scale * 1.6,
      20 * cfg.scale * 1.6,
      0x000000,
      0.38
    );
    const sprite = this.add.sprite(0, 0, 'game-atlas', cfg.frame)
      .setOrigin(0.5, 0.92)
      .setScale(cfg.scale);

    container.add([shadow, sprite]);
    this.gameLayer.add(container);
    container.setDepth(start.y);

    const pos = new Phaser.Math.Vector2();
    const tangent = new Phaser.Math.Vector2();
    let facingDir = 1;
    let stridePhase = Math.random() * Math.PI * 2;
    let speedMultiplier = 1;
    let moveTween;

    moveTween = this.tweens.addCounter({
      from: progress.value,
      to: 1,
      duration: cfg.duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        const t = tween.getValue();
        this.roadPath.getPoint(t, pos);
        this.roadPath.getTangent(t, tangent);

        container.setPosition(pos.x, pos.y);
        container.setDepth(pos.y);

        // Keep the last facing direction around near-vertical path sections.
        if (tangent.x < -0.08) {
          facingDir = -1;
          sprite.setFlipX(true);
        } else if (tangent.x > 0.08) {
          facingDir = 1;
          sprite.setFlipX(false);
        }

        const deltaSeconds = (this.game.loop.delta / 1000) * speedMultiplier;
        stridePhase += deltaSeconds * cfg.stepSpeed;

        const lift = Math.abs(Math.sin(stridePhase));
        const sway = Math.sin(stridePhase);

        sprite.y = -lift * cfg.hop;
        sprite.setScale(
          cfg.scale * (1 + (1 - lift) * 0.06),
          cfg.scale * (1 - (1 - lift) * 0.05)
        );
        sprite.angle = sway * cfg.tilt + facingDir * 4;
        shadow.setScale(1 - lift * 0.22);
      },
      onComplete: () => {
        container.destroy();
        this.enemyTweens = this.enemyTweens.filter((item) => item !== moveTween);
      }
    });

    container.setSpeedMultiplier = (multiplier) => {
      const nextMultiplier = Number.isFinite(multiplier) ? Math.max(0, multiplier) : 1;
      speedMultiplier = nextMultiplier;
      moveTween.timeScale = nextMultiplier;
    };

    this.enemyTweens.push(moveTween);
    return container;
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
    const drawPath = () => {
      graphics.clear();
      if (this.roadPoints.length >= 4) {
        this.roadPath = new Phaser.Curves.Spline(this.roadPoints);
        graphics.lineStyle(5, 0x00ff66, 0.95);
        this.roadPath.draw(graphics, 192);
        graphics.fillStyle(0xffcc00, 1);
        for (let i = 0; i < this.roadPoints.length; i += 2) {
          graphics.fillCircle(this.roadPoints[i], this.roadPoints[i + 1], 5);
        }
      } else {
        this.roadPath = null;
      }
    };

    const style = {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#00ff66',
      backgroundColor: '#101010',
      padding: { x: 9, y: 7 }
    };
    const addControl = (x, label, callback) => {
      const control = this.add.text(x, 14, label, style)
        .setDepth(3000)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      control.on('pointerdown', (pointer) => {
        pointer.event?.stopPropagation?.();
        callback();
      });
      this.uiLayer.add(control);
      controls.push(control);
    };

    addControl(18, 'Очистить', () => {
      this.roadPoints = [];
      drawPath();
    });
    addControl(132, 'Убрать', () => {
      this.roadPoints.splice(-2, 2);
      drawPath();
    });
    addControl(230, 'Тест моба', () => {
      if (this.roadPath) this.spawnEnemy(24000);
    });
    addControl(355, 'Координаты', () => {
      const value = this.roadPoints.join(', ');
      window.prompt('Скопируй массив координат в createRoadPath():', value);
    });

    const pointerHandler = (pointer) => {
      const point = this.screenToWorld(pointer.x, pointer.y);
      // Keep edits on the map only; reserve the top strip for editor controls.
      if (point.y < 62 || point.y > MAP_HEIGHT || point.x < 0 || point.x > DESIGN_WIDTH) return;
      this.roadPoints.push(Math.round(point.x), Math.round(point.y));
      drawPath();
    };
    this.input.on('pointerdown', pointerHandler);
    this.pathEditor = { graphics, controls, pointerHandler };
    drawPath();
  }

  fitWorld(width, height) {
    if (!this.worldRoot) return;
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    this.worldRoot.setScale(scale);
    this.worldRoot.setPosition(
      (width - DESIGN_WIDTH * scale) / 2,
      (height - DESIGN_HEIGHT * scale) / 2
    );
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

    this.galleryContainer.add(this.add.text(12, 8, `ASSET GALLERY · ${frameNames.length} SPRITES`, {
      fontFamily: 'Arial, sans-serif', fontSize: 16, color: '#ffffff'
    }));

    frameNames.forEach((name, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const frame = atlas.get(name);
      const metadata = SPRITE_CATALOG[name];
      const maxWidth = cellWidth - 16;
      const maxHeight = cellHeight * 0.55;
      const scale = Math.min(maxWidth / frame.width, maxHeight / frame.height, 1);
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
