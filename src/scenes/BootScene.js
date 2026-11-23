import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('world-map', '/assets/maps/world-map.jpg');
    this.load.atlas(
      'game-atlas',
      '/assets/phaser-assets/atlas.png',
      '/assets/phaser-assets/atlas.json'
    );
  }

  create() {
    this.scene.start('GameScene');
  }
}
