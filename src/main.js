import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#101827',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  scene: [BootScene, GameScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true
  }
};

new Phaser.Game(config);
