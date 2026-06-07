/**
 * UI Scene - HUD overlay for flight data
 */

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this.flightScene = data.flightScene;
  }

  create() {
    // HUD background panels
    this.add.rectangle(120, 100, 220, 180, 0x000000, 0.6).setStrokeStyle(1, 0x336699);
    this.add.rectangle(900, 100, 220, 180, 0x000000, 0.6).setStrokeStyle(1, 0x336699);

    // Left panel - Flight data
    const leftX = 25;
    const style = { fontSize: '13px', color: '#00ff88', fontFamily: 'monospace' };

    this.altitudeText = this.add.text(leftX, 20, 'ALT: 0 m', style);
    this.speedText = this.add.text(leftX, 42, 'SPD: 0 m/s', style);
    this.vxText = this.add.text(leftX, 64, 'Vx: 0 m/s', style);
    this.vyText = this.add.text(leftX, 86, 'Vy: 0 m/s', style);
    this.throttleText = this.add.text(leftX, 108, 'THR: 0%', style);
    this.twrText = this.add.text(leftX, 130, 'TWR: 0.00', style);
    this.angleText = this.add.text(leftX, 152, 'ANG: 0 deg', style);

    // Right panel - Orbital data
    const rightX = 800;
    const orbStyle = { fontSize: '13px', color: '#88ccff', fontFamily: 'monospace' };

    this.apoText = this.add.text(rightX, 20, 'APO: --- m', orbStyle);
    this.periText = this.add.text(rightX, 42, 'PER: --- m', orbStyle);
    this.eccText = this.add.text(rightX, 64, 'ECC: ---', orbStyle);
    this.orbStatusText = this.add.text(rightX, 86, 'ORB: Suborbital', orbStyle);

    // Fuel bar
    this.add.text(leftX, 175, 'FUEL', { fontSize: '11px', color: '#ffffff', fontFamily: 'monospace' });
    this.fuelBarBg = this.add.rectangle(120, 192, 180, 14, 0x333333).setStrokeStyle(1, 0x666666);
    this.fuelBar = this.add.rectangle(31, 186, 180, 10, 0x44cc44).setOrigin(0, 0);

    // Time warp display
    this.warpText = this.add.text(512, 20, 'WARP: x1', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stage indicator
    this.stageText = this.add.text(512, 45, 'STAGE: 1', {
      fontSize: '13px',
      color: '#cccccc',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Parachute status
    this.parachuteText = this.add.text(512, 65, '', {
      fontSize: '13px',
      color: '#ffdd00',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Game over text (hidden initially)
    this.gameOverText = this.add.text(512, 350, '', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setVisible(false);

    this.restartText = this.add.text(512, 400, 'Press ESC to return to builder', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setVisible(false);
  }

  update() {
    if (!this.flightScene || !this.flightScene.getFlightData) return;

    const data = this.flightScene.getFlightData();

    // Update flight data
    this.altitudeText.setText(`ALT: ${this.formatDistance(data.altitude)}`);
    this.speedText.setText(`SPD: ${data.speed.toFixed(1)} m/s`);
    this.vxText.setText(`Vx: ${data.vx.toFixed(1)} m/s`);
    this.vyText.setText(`Vy: ${data.vy.toFixed(1)} m/s`);
    this.throttleText.setText(`THR: ${(data.throttle * 100).toFixed(0)}%`);
    this.twrText.setText(`TWR: ${data.twr.toFixed(2)}`);
    this.angleText.setText(`ANG: ${(data.angle * 180 / Math.PI).toFixed(1)} deg`);

    // Update fuel bar
    const fuelRatio = data.maxFuel > 0 ? data.fuel / data.maxFuel : 0;
    this.fuelBar.setScale(fuelRatio, 1);
    if (fuelRatio < 0.2) {
      this.fuelBar.setFillStyle(0xff4444);
    } else if (fuelRatio < 0.5) {
      this.fuelBar.setFillStyle(0xffaa44);
    } else {
      this.fuelBar.setFillStyle(0x44cc44);
    }

    // Update time warp display
    const warp = data.warpMultiplier || 1;
    this.warpText.setText(`WARP: x${warp}`);
    if (warp > 1) {
      this.warpText.setColor('#ffff44');
    } else {
      this.warpText.setColor('#ffffff');
    }

    // Update stage indicator
    this.stageText.setText(`STAGE: ${data.currentStage || 1}`);

    // Update parachute status
    if (data.hasParachute) {
      if (data.parachuteDeployed) {
        this.parachuteText.setText('CHUTE: DEPLOYED');
        this.parachuteText.setColor('#44ff44');
      } else {
        this.parachuteText.setText('CHUTE: READY [P]');
        this.parachuteText.setColor('#ffdd00');
      }
    } else {
      this.parachuteText.setText('');
    }

    // Update orbital data
    if (data.orbitalParams) {
      this.apoText.setText(`APO: ${this.formatDistance(data.orbitalParams.apoapsisAlt)}`);
      this.periText.setText(`PER: ${this.formatDistance(data.orbitalParams.periapsisAlt)}`);
      this.eccText.setText(`ECC: ${data.orbitalParams.eccentricity.toFixed(3)}`);

      if (data.orbitalParams.periapsisAlt > 0 && data.orbitalParams.eccentricity < 1) {
        this.orbStatusText.setText('ORB: STABLE ORBIT!');
        this.orbStatusText.setColor('#44ff44');
      } else if (data.orbitalParams.isBound) {
        this.orbStatusText.setText('ORB: Elliptical');
        this.orbStatusText.setColor('#ffcc44');
      } else {
        this.orbStatusText.setText('ORB: Escape');
        this.orbStatusText.setColor('#ff8844');
      }
    } else {
      this.apoText.setText('APO: --- m');
      this.periText.setText('PER: --- m');
      this.eccText.setText('ECC: ---');
      this.orbStatusText.setText('ORB: Suborbital');
      this.orbStatusText.setColor('#88ccff');
    }

    // Game over display
    if (data.gameOver) {
      this.gameOverText.setVisible(true);
      this.restartText.setVisible(true);
      if (data.gameWon) {
        this.gameOverText.setText('ORBIT ACHIEVED!');
        this.gameOverText.setColor('#44ff44');
      } else {
        this.gameOverText.setText('MISSION FAILED');
        this.gameOverText.setColor('#ff4444');
      }
    }
  }

  formatDistance(meters) {
    if (meters === Infinity || meters === -Infinity || isNaN(meters)) return '---';
    if (Math.abs(meters) > 1000000) {
      return `${(meters / 1000000).toFixed(1)} Mm`;
    } else if (Math.abs(meters) > 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  }
}
