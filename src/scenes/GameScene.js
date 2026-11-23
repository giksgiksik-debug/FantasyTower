import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x101827).setOrigin(0);

    this.add.text(width / 2, height / 2 - 28, 'FANTASYTOWER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 'clamp(28px, 5vw, 56px)',
      fontStyle: 'bold',
      color: '#f3d58a'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 30, 'Game foundation is ready', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#c4cedd'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 28, 'Gameplay systems and visual assets are not implemented yet', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#7f8da3'
    }).setOrigin(0.5);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  handleResize(gameSize) {
    // The scene is deliberately minimal; responsive layout will be refined with the game UI.
    this.children.getAll().forEach((child) => {
      if (child.type === 'Text' && child.text === 'FANTASYTOWER') {
        child.setPosition(gameSize.width / 2, gameSize.height / 2 - 28);
      } else if (child.type === 'Text' && child.text === 'Game foundation is ready') {
        child.setPosition(gameSize.width / 2, gameSize.height / 2 + 30);
      } else if (child.type === 'Text' && child.text.startsWith('Gameplay systems')) {
        child.setPosition(gameSize.width / 2, gameSize.height - 28);
      } else if (child.type === 'Rectangle') {
        child.setSize(gameSize.width, gameSize.height);
      }
    });
  }
}
