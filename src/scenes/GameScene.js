import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    this.background = this.add
      .rectangle(0, 0, width, height, 0x101827)
      .setOrigin(0);

    this.title = this.add
      .text(width / 2, height / 2 - 28, 'FANTASYTOWER', {
        fontFamily: 'Arial, sans-serif',
        fontSize: this.getTitleFontSize(width),
        fontStyle: 'bold',
        color: '#f3d58a'
      })
      .setOrigin(0.5);

    this.subtitle = this.add
      .text(width / 2, height / 2 + 30, 'Game foundation is ready', {
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        color: '#c4cedd'
      })
      .setOrigin(0.5);

    this.footer = this.add
      .text(width / 2, height - 28, 'Gameplay systems and visual assets are not implemented yet', {
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        color: '#7f8da3',
        align: 'center'
      })
      .setOrigin(0.5);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  getTitleFontSize(width) {
    return Math.max(22, Math.min(56, Math.round(width * 0.045)));
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;

    this.background.setSize(width, height);
    this.title
      .setPosition(width / 2, height / 2 - 28)
      .setFontSize(this.getTitleFontSize(width));
    this.subtitle.setPosition(width / 2, height / 2 + 30);
    this.footer.setPosition(width / 2, height - 28);
  }
}
