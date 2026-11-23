import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Asset loading will be added when the approved art assets are available.
    this.scene.start('GameScene');
  }
}
