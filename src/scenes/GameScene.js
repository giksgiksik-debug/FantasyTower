import Phaser from 'phaser';
import { addSprite, SPRITE_CATALOG } from '../systems/SpriteAssets.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;
    this.background = this.add
      .rectangle(0, 0, width, height, 0x14251d)
      .setOrigin(0)
      .setDepth(-1);

    this.assetGalleryMode =
      new URLSearchParams(window.location.search).get('assets') === '1';

    if (this.assetGalleryMode) {
      this.renderAssetGallery(width, height);
    } else if (this.textures.exists('world-map')) {
      this.mapImage = this.add
        .image(width / 2, height / 2, 'world-map')
        .setOrigin(0.5);
      this.fitMap(width, height);
    } else {
      this.add
        .text(width / 2, height / 2, 'World map asset not found', {
          fontFamily: 'Arial, sans-serif',
          fontSize: 20,
          color: '#ffffff'
        })
        .setOrigin(0.5);
    }

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  renderAssetGallery(width, height) {
    if (this.spriteDetailsOverlay) {
      this.spriteDetailsOverlay.destroy(true);
      this.spriteDetailsOverlay = null;
    }
    if (this.galleryContainer) {
      this.galleryContainer.destroy(true);
    }

    this.galleryContainer = this.add.container(0, 0);
    const atlas = this.textures.get('game-atlas');
    const frameNames = atlas
      .getFrameNames()
      .filter((name) => /^sprite_\d+$/.test(name))
      .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));

    const columns = width < 700 ? 4 : 8;
    const rows = Math.ceil(frameNames.length / columns);
    const galleryTop = 34;
    const cellWidth = width / columns;
    const cellHeight = (height - galleryTop) / rows;

    this.galleryContainer.add(
      this.add.text(12, 8, `ASSET GALLERY · ${frameNames.length} SPRITES`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: Math.max(13, Math.min(20, width * 0.018)),
        color: '#ffffff',
        backgroundColor: '#17251f',
        padding: { x: 7, y: 5 }
      }).setDepth(2)
    );

    frameNames.forEach((frameName, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const centerX = column * cellWidth + cellWidth / 2;
      const cellTop = galleryTop + row * cellHeight;
      const imageCenterY = cellTop + cellHeight * 0.34;
      const labelY = cellTop + cellHeight * 0.82;
      const frame = atlas.get(frameName);
      const metadata = SPRITE_CATALOG[frameName];
      const maxImageWidth = cellWidth - 16;
      const maxImageHeight = cellHeight * 0.48;
      const imageScale = Math.min(
        maxImageWidth / frame.width,
        maxImageHeight / frame.height,
        1
      );

      const image = addSprite(this, frameName, centerX, imageCenterY, { scale: imageScale });
      image.setInteractive({ useHandCursor: true });
      image.on('pointerdown', () => this.showSpriteDetails(frameName));
      const label = this.add.text(centerX, labelY, `${frameName} · ${metadata.width}×${metadata.height}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: Math.max(9, Math.min(12, cellWidth * 0.075)),
        color: '#ffffff'
      }).setOrigin(0.5);

      this.galleryContainer.add([image, label]);
    });
  }

  showSpriteDetails(spriteId) {
    if (this.spriteDetailsOverlay) {
      this.spriteDetailsOverlay.destroy(true);
      this.spriteDetailsOverlay = null;
    }

    const metadata = SPRITE_CATALOG[spriteId];
    if (!metadata) return;

    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0).setDepth(1000);
    this.spriteDetailsOverlay = overlay;

    const shade = this.add.rectangle(0, 0, width, height, 0x000000, 0.82)
      .setOrigin(0)
      .setInteractive();
    shade.on('pointerdown', () => {
      overlay.destroy(true);
      this.spriteDetailsOverlay = null;
    });

    const panelWidth = Math.min(width - 28, 520);
    const panelHeight = Math.min(height - 48, 430);
    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x20352b, 1)
      .setStrokeStyle(2, 0x9b8050);
    const previewScale = Math.min(
      (panelWidth * 0.58) / metadata.width,
      (panelHeight * 0.4) / metadata.height,
      1
    );
    const preview = addSprite(this, spriteId, width / 2, height / 2 - panelHeight * 0.08, {
      scale: previewScale
    });
    const title = this.add.text(width / 2, height / 2 - panelHeight * 0.39, spriteId, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 22,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const description = this.add.text(width / 2, height / 2 + panelHeight * 0.34,
      metadata.visual + '\n' + metadata.width + ' × ' + metadata.height + ' px\nCategory: ' + metadata.group,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: Math.max(12, Math.min(17, width * 0.025)),
        color: '#e8eee9',
        align: 'center',
        wordWrap: { width: panelWidth - 32 },
        lineSpacing: 5
      }).setOrigin(0.5);

    overlay.add([shade, panel, preview, title, description]);
  }

  fitMap(width, height) {
    if (!this.mapImage) return;

    // Keep the complete approved map visible; do not crop the castle,
    // enemy gate, road or tower placement pads on narrow screens.
    const scale = Math.min(
      width / this.mapImage.width,
      height / this.mapImage.height
    );

    this.mapImage
      .setPosition(width / 2, height / 2)
      .setScale(scale);
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.background.setSize(width, height);

    if (this.assetGalleryMode) {
      this.renderAssetGallery(width, height);
    } else {
      this.fitMap(width, height);
    }
  }
}
