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

    if (this.textures.exists('world-map')) {
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
    this.fitMap(width, height);
  }
}
