/**
 * Orbit Scene - Mini orbital map overlay
 * Shows planet, rocket position, and trajectory
 */
import { PLANET } from './main.js';

export default class OrbitScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OrbitScene' });
  }

  init(data) {
    this.flightScene = data.flightScene;
  }

  create() {
    // Mini-map in bottom-right corner
    this.mapX = 880;
    this.mapY = 620;
    this.mapRadius = 100;

    // Background for mini-map
    this.add.circle(this.mapX, this.mapY, this.mapRadius + 10, 0x000000, 0.7)
      .setStrokeStyle(2, 0x336699);

    // Planet circle
    this.planetRadius = 35;
    this.planetCircle = this.add.circle(this.mapX, this.mapY, this.planetRadius, 0x224488)
      .setStrokeStyle(1, 0x4488cc);

    // Atmosphere ring
    this.add.circle(this.mapX, this.mapY, this.planetRadius + 5, 0x000000, 0)
      .setStrokeStyle(1, 0x4488aa, 0.4);

    // Rocket dot
    this.rocketDot = this.add.circle(this.mapX, this.mapY - this.planetRadius, 3, 0xff4444);

    // Trajectory graphics
    this.trajectoryGraphics = this.add.graphics();

    // Apoapsis marker
    this.apoMarker = this.add.circle(0, 0, 4, 0x44ff44).setVisible(false);
    this.apoLabel = this.add.text(0, 0, 'AP', {
      fontSize: '9px',
      color: '#44ff44',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setVisible(false);

    // Periapsis marker
    this.periMarker = this.add.circle(0, 0, 4, 0xff8844).setVisible(false);
    this.periLabel = this.add.text(0, 0, 'PE', {
      fontSize: '9px',
      color: '#ff8844',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setVisible(false);

    // Labels
    this.add.text(this.mapX, this.mapY - this.mapRadius - 15, 'ORBIT MAP', {
      fontSize: '10px',
      color: '#88aacc',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
  }

  update() {
    if (!this.flightScene || !this.flightScene.getFlightData) return;

    const data = this.flightScene.getFlightData();
    const state = this.flightScene.state;

    if (!state) return;

    const altitude = data.altitude || 0;

    // Dynamic scale based on orbit size
    let maxAlt = altitude * 2;
    if (data.orbitalParams && data.orbitalParams.apoapsisAlt > 0 && isFinite(data.orbitalParams.apoapsisAlt)) {
      maxAlt = Math.max(maxAlt, data.orbitalParams.apoapsisAlt * 1.2);
    }
    maxAlt = Math.max(maxAlt, 50000); // Minimum view range

    const scale = (this.mapRadius - this.planetRadius) / maxAlt;

    // Rocket position on the mini-map
    // In our coordinate system: state.x = horizontal, state.y = altitude
    // On the map, angle from vertical based on x offset and distance from center
    const distFromCenter = altitude + PLANET.radius;
    const angle = Math.atan2(state.x, distFromCenter);
    const rocketMapDist = this.planetRadius + altitude * scale;
    const rocketMapX = this.mapX + Math.sin(angle) * rocketMapDist;
    const rocketMapY = this.mapY - Math.cos(angle) * rocketMapDist;

    this.rocketDot.setPosition(rocketMapX, rocketMapY);

    // Draw trajectory
    this.trajectoryGraphics.clear();

    if (data.orbitalParams && data.orbitalParams.isBound && data.orbitalParams.eccentricity < 1) {
      const params = data.orbitalParams;

      const a = params.semiMajorAxis;
      const e = params.eccentricity;

      if (a > 0 && isFinite(a)) {
        this.trajectoryGraphics.lineStyle(1, 0x44aaff, 0.6);

        // Draw orbit as series of points using the orbit equation r = a(1-e^2)/(1+e*cos(theta))
        const points = [];
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
          const orbitAlt = r - PLANET.radius;
          const orbitDist = this.planetRadius + orbitAlt * scale;

          // Clamp to map bounds
          const clampedDist = Math.min(Math.max(orbitDist, 0), this.mapRadius);
          const px = this.mapX + Math.sin(theta + angle) * clampedDist;
          const py = this.mapY - Math.cos(theta + angle) * clampedDist;
          points.push({ x: px, y: py });
        }

        this.trajectoryGraphics.beginPath();
        if (points.length > 0) {
          this.trajectoryGraphics.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            this.trajectoryGraphics.lineTo(points[i].x, points[i].y);
          }
        }
        this.trajectoryGraphics.strokePath();

        // Apoapsis marker (top of orbit on map)
        const apoMapDist = this.planetRadius + params.apoapsisAlt * scale;
        if (apoMapDist < this.mapRadius && apoMapDist > 0) {
          this.apoMarker.setPosition(this.mapX, this.mapY - apoMapDist).setVisible(true);
          this.apoLabel.setPosition(this.mapX + 10, this.mapY - apoMapDist).setVisible(true);
        } else {
          this.apoMarker.setVisible(false);
          this.apoLabel.setVisible(false);
        }

        // Periapsis marker (bottom of orbit on map)
        const periMapDist = this.planetRadius + Math.max(0, params.periapsisAlt) * scale;
        if (periMapDist < this.mapRadius && periMapDist > 0) {
          this.periMarker.setPosition(this.mapX, this.mapY + periMapDist).setVisible(true);
          this.periLabel.setPosition(this.mapX + 10, this.mapY + periMapDist).setVisible(true);
        } else {
          this.periMarker.setVisible(false);
          this.periLabel.setVisible(false);
        }
      } else {
        this.apoMarker.setVisible(false);
        this.apoLabel.setVisible(false);
        this.periMarker.setVisible(false);
        this.periLabel.setVisible(false);
      }
    } else {
      this.apoMarker.setVisible(false);
      this.apoLabel.setVisible(false);
      this.periMarker.setVisible(false);
      this.periLabel.setVisible(false);

      // Draw suborbital trajectory prediction
      if (altitude > 100) {
        this.trajectoryGraphics.lineStyle(1, 0xff6644, 0.4);
        this.trajectoryGraphics.beginPath();
        this.trajectoryGraphics.moveTo(rocketMapX, rocketMapY);

        // Simple trajectory prediction using gravity
        let predX = state.x;
        let predAlt = altitude;
        let predVx = state.vx;
        let predVy = state.vy;
        const predDt = 2;

        for (let step = 0; step < 50; step++) {
          // Gravity pulls down (negative vy)
          predVy -= 9.81 * predDt;
          predX += predVx * predDt;
          predAlt += predVy * predDt;

          if (predAlt < 0) break;

          const pDistFromCenter = predAlt + PLANET.radius;
          const pAngle = Math.atan2(predX, pDistFromCenter);
          const pDist = this.planetRadius + predAlt * scale;
          const px = this.mapX + Math.sin(pAngle) * Math.min(pDist, this.mapRadius);
          const py = this.mapY - Math.cos(pAngle) * Math.min(pDist, this.mapRadius);
          this.trajectoryGraphics.lineTo(px, py);
        }
        this.trajectoryGraphics.strokePath();
      }
    }
  }
}
