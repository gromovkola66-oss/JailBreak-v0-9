/**
 * Space Odyssey - Main entry point
 * Phaser.js 3 game configuration and scene registration
 */
import BuilderScene from './builder.js';
import FlightScene from './flight.js';
import UIScene from './ui.js';
import OrbitScene from './orbit.js';

// Planet constants (scaled for gameplay)
export const PLANET = {
  mass: 5.97e24,              // kg (Earth-like)
  radius: 6371000,            // meters (Earth-like)
  atmosphereHeight: 100000,   // meters (100km atmosphere)
  surfaceGravity: 9.81,       // m/s^2
  // Display scaling
  metersPerPixel: 100,        // 1 pixel = 100 meters
  surfaceY: 0                 // y=0 is surface in screen coords
};

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'none'           // Custom physics engine
  },
  scene: [BuilderScene, FlightScene, UIScene, OrbitScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Initialize the game
const game = new Phaser.Game(config);
