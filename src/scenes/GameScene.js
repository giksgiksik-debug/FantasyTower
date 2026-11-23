import Phaser from 'phaser';

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
    const cellWidth = width / columns;
    const cellHeight = height / rows;

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
      const centerY = row * cellHeight + cellHeight / 2 + 8;
      const frame = atlas.get(frameName);
      const maxImageWidth = cellWidth - 16;
      const maxImageHeight = cellHeight - 32;
      const imageScale = Math.min(
        maxImageWidth / frame.width,
        maxImageHeight / frame.height,
        1
      );

      const image = this.add.image(centerX, centerY - 7, 'game-atlas', frameName)
        .setScale(imageScale);
      const label = this.add.text(centerX, row * cellHeight + cellHeight - 19, frameName, {
        fontFamily: 'Arial, sans-serif',
        fontSize: Math.max(10, Math.min(14, cellWidth * 0.11)),
        color: '#ffffff'
      }).setOrigin(0.5);

      this.galleryContainer.add([image, label]);
    });
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
