import Phaser from 'phaser';
import { addSprite, SPRITE_CATALOG } from '../systems/SpriteAssets.js';

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 1024;
const MAP_HEIGHT = 714;
const GEM_TYPES = ['gem_purple', 'gem_yellow', 'gem_green', 'gem_blue', 'gem_red'];

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
    this.worldRoot = null;
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

    this.enemyTimer = this.time.addEvent({
      delay: 4500,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    this.spawnEnemy();
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

  spawnEnemy() {
    if (!this.gameLayer || !this.textures.exists('game-atlas')) return;

    // Waypoints trace the visible stone road on the 1280x714 map.
    // The route is confined to the map region; the HUD starts below it.
    const route = new Phaser.Curves.Spline([
      120, 150,
      180, 205,
      280, 235,
      390, 240,
      500, 220,
      560, 180,
      650, 160,
      760, 185,
      835, 240,
      850, 310,
      820, 370,
      750, 395,
      650, 400,
      550, 420,
      490, 470,
      460, 540,
      490, 590,
      580, 610,
      700, 590,
      820, 560,
      940, 580,
      1060, 590,
      1130, 550,
      1160, 490,
      1130, 420,
      1090, 360,
      1100, 300,
      1160, 245,
      1220, 190
    ]);

    const enemy = addSprite(this, 'sprite_08', 92, 175, {
      displayWidth: 44,
      displayHeight: 44,
      depth: 2
    });
    this.gameLayer.add(enemy);

    const progress = { value: 0 };
    const tween = this.tweens.add({
      targets: progress,
      value: 1,
      duration: 30000,
      ease: 'Linear',
      onUpdate: () => {
        const point = route.getPoint(progress.value);
        const tangent = route.getTangent(progress.value);
        if (point) enemy.setPosition(point.x, point.y);
        // Keep the mob sprite upright; atlas artwork is not authored for directional rotation.
      },
      onComplete: () => {
        enemy.destroy();
        this.enemyTweens = this.enemyTweens.filter((item) => item !== tween);
      }
    });
    this.enemyTweens.push(tween);
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
