/**
 * Flight Scene - Real-time rocket flight with physics
 */
import { calculateGravity, calculateDrag, calculateThrust, integrateMotion, calculateOrbitalParams } from './physics.js';
import { PLANET } from './main.js';

export default class FlightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FlightScene' });
  }

  init(data) {
    this.rocketConfig = data.rocketConfig;
  }

  create() {
    // Flight state
    this.state = {
      x: 0,
      y: -PLANET.surfaceY,  // Start on surface (y is negative = up)
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0
    };

    this.fuel = this.rocketConfig.totalFuel;
    this.totalMass = this.rocketConfig.totalMass;
    this.thrust = this.rocketConfig.totalThrust;
    this.consumption = this.rocketConfig.totalConsumption;
    this.throttle = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.maxSpeed = 0;

    // Scale factor: 1 pixel = PLANET.metersPerPixel meters
    this.metersPerPixel = PLANET.metersPerPixel;

    // Camera setup
    this.cameras.main.setBackgroundColor('#000011');

    // Create background layers
    this.createBackground();

    // Create rocket visual
    this.createRocket();

    // Create exhaust particles
    this.createExhaust();

    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Start UI and orbit scenes
    this.scene.launch('UIScene', { flightScene: this });
    this.scene.launch('OrbitScene', { flightScene: this });

    // Time accumulator for fixed timestep
    this.accumulator = 0;
    this.fixedDt = 1 / 60;
  }

  createBackground() {
    // Starfield (far background)
    this.stars = this.add.graphics();
    for (let i = 0; i < 300; i++) {
      const sx = Phaser.Math.Between(-2000, 2000);
      const sy = Phaser.Math.Between(-5000, -500);
      const brightness = Phaser.Math.Between(100, 255);
      const size = Math.random() > 0.9 ? 2 : 1;
      this.stars.fillStyle(Phaser.Display.Color.GetColor(brightness, brightness, brightness));
      this.stars.fillRect(sx, sy, size, size);
    }

    // Atmosphere gradient (created as a series of rectangles)
    this.atmosphereGraphics = this.add.graphics();
    const atmosHeight = PLANET.atmosphereHeight / this.metersPerPixel;
    const surfaceY = PLANET.surfaceY;
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const alpha = (1 - t) * 0.3;
      const r = Math.floor(50 + t * 20);
      const g = Math.floor(100 + t * 50);
      const b = Math.floor(200 + t * 55);
      const y = -surfaceY - (t * atmosHeight);
      const h = atmosHeight / steps;
      this.atmosphereGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), alpha);
      this.atmosphereGraphics.fillRect(-3000, y, 6000, h);
    }

    // Ground
    this.groundGraphics = this.add.graphics();
    // Surface layer
    this.groundGraphics.fillStyle(0x2d5a27);
    this.groundGraphics.fillRect(-3000, -PLANET.surfaceY, 6000, 20);
    // Earth/soil
    this.groundGraphics.fillStyle(0x5c3a1e);
    this.groundGraphics.fillRect(-3000, -PLANET.surfaceY + 20, 6000, 200);
    // Deep ground
    this.groundGraphics.fillStyle(0x3d2815);
    this.groundGraphics.fillRect(-3000, -PLANET.surfaceY + 220, 6000, 500);

    // Surface details
    for (let i = -3000; i < 3000; i += 50) {
      const h = Phaser.Math.Between(3, 10);
      this.groundGraphics.fillStyle(0x3a7a33);
      this.groundGraphics.fillRect(i, -PLANET.surfaceY - h, 4, h);
    }
  }

  createRocket() {
    this.rocketContainer = this.add.container(0, 0);

    const modules = this.rocketConfig.modules;
    let currentY = 0;
    const scale = 0.8;

    // Draw from top (capsule) to bottom (engine)
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const h = mod.height * scale;
      const w = mod.width * scale;

      const rect = this.add.rectangle(0, currentY + h / 2, w, h, mod.color);
      rect.setStrokeStyle(1, 0xffffff);
      this.rocketContainer.add(rect);

      // Add details based on type
      if (mod.type === 'capsule') {
        // Window
        const window = this.add.circle(0, currentY + h / 2, 5, 0x88ccff);
        this.rocketContainer.add(window);
      } else if (mod.type === 'engine') {
        // Nozzle shape
        const nozzle = this.add.triangle(0, currentY + h, -8, 0, 8, 0, 0, 10, 0x888888);
        this.rocketContainer.add(nozzle);
      }

      currentY += h;
    }

    this.rocketHeight = currentY;
    this.rocketContainer.setPosition(
      this.state.x / this.metersPerPixel,
      this.state.y / this.metersPerPixel - this.rocketHeight
    );
  }

  createExhaust() {
    // Create particle emitter for exhaust
    this.exhaustGraphics = this.add.graphics();
    this.exhaustParticles = [];
  }

  updateExhaust() {
    // Remove old particles
    this.exhaustParticles = this.exhaustParticles.filter(p => {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.size *= 0.95;
      return p.life > 0;
    });

    // Add new particles if thrusting
    if (this.throttle > 0 && this.fuel > 0) {
      const rocketScreenX = this.state.x / this.metersPerPixel;
      const rocketScreenY = this.state.y / this.metersPerPixel;
      const exhaustX = rocketScreenX + Math.sin(this.state.angle) * this.rocketHeight * 0.5;
      const exhaustY = rocketScreenY + Math.cos(this.state.angle) * this.rocketHeight * 0.5;

      for (let i = 0; i < 3; i++) {
        this.exhaustParticles.push({
          x: exhaustX + (Math.random() - 0.5) * 6,
          y: exhaustY + (Math.random() - 0.5) * 6,
          vx: Math.sin(this.state.angle) * (2 + Math.random() * 3) + (Math.random() - 0.5) * 2,
          vy: Math.cos(this.state.angle) * (2 + Math.random() * 3) + (Math.random() - 0.5) * 2,
          size: 3 + Math.random() * 4,
          life: 20 + Math.random() * 15,
          color: Math.random() > 0.5 ? 0xff6600 : 0xffcc00
        });
      }
    }

    // Draw particles
    this.exhaustGraphics.clear();
    this.exhaustParticles.forEach(p => {
      const alpha = p.life / 35;
      this.exhaustGraphics.fillStyle(p.color, alpha);
      this.exhaustGraphics.fillCircle(p.x, p.y, p.size);
    });
  }

  update(time, delta) {
    if (this.gameOver) {
      if (this.escKey.isDown) {
        this.scene.stop('UIScene');
        this.scene.stop('OrbitScene');
        this.scene.start('BuilderScene');
      }
      return;
    }

    // Process input
    this.processInput();

    // Physics update with fixed timestep
    this.accumulator += delta / 1000;
    while (this.accumulator >= this.fixedDt) {
      this.physicsStep(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    // Update visuals
    this.updateRocketVisual();
    this.updateExhaust();
    this.updateCamera();

    // Check win/lose conditions
    this.checkConditions();
  }

  processInput() {
    // Throttle
    if (this.wKey.isDown || this.cursors.up.isDown) {
      this.throttle = Math.min(1, this.throttle + 0.05);
    } else {
      this.throttle = Math.max(0, this.throttle - 0.03);
    }

    // Rotation
    const rotSpeed = 2.5;
    if (this.aKey.isDown || this.cursors.left.isDown) {
      this.state.angularVel = -rotSpeed;
    } else if (this.dKey.isDown || this.cursors.right.isDown) {
      this.state.angularVel = rotSpeed;
    } else {
      this.state.angularVel *= 0.9;
    }
  }

  physicsStep(dt) {
    // Calculate altitude (distance from planet center minus radius)
    const posFromCenter = {
      x: this.state.x,
      y: this.state.y + PLANET.radius
    };
    const distFromCenter = Math.sqrt(posFromCenter.x * posFromCenter.x + posFromCenter.y * posFromCenter.y);
    this.altitude = distFromCenter - PLANET.radius;

    // Gravity (acceleration) - use full Newtonian vector from calculateGravity
    const gravity = calculateGravity(
      { x: this.state.x, y: -this.altitude },
      PLANET.mass,
      PLANET.radius
    );

    const gravAccelX = gravity.fx;
    const gravAccelY = gravity.fy;

    // Drag (acceleration)
    const drag = calculateDrag(
      { vx: this.state.vx, vy: this.state.vy },
      this.altitude,
      PLANET.atmosphereHeight
    );

    // Thrust (acceleration)
    let thrustAccel = { fx: 0, fy: 0 };
    if (this.throttle > 0 && this.fuel > 0) {
      thrustAccel = calculateThrust(
        this.thrust,
        this.state.angle,
        this.throttle,
        this.totalMass
      );
      const fuelConsumed = this.consumption * this.throttle * dt;
      this.fuel -= fuelConsumed;
      if (this.fuel < 0) {
        this.totalMass -= (fuelConsumed + this.fuel); // Only subtract what was actually consumed
        this.fuel = 0;
      } else {
        this.totalMass -= fuelConsumed;
      }
    }

    // Total acceleration
    const totalForce = {
      fx: gravAccelX + drag.fx + thrustAccel.fx,
      fy: gravAccelY + drag.fy + thrustAccel.fy
    };

    // Integrate
    const newState = integrateMotion(this.state, totalForce, dt);
    this.state = newState;

    // Ground collision
    if (this.altitude <= 0) {
      this.state.y = 0;
      const impactSpeed = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
      if (impactSpeed > 50) {
        this.crash();
      } else {
        // Landed safely
        this.state.vy = 0;
        this.state.vx *= 0.9;
        if (this.altitude < 0) this.altitude = 0;
      }
    }

    // Track max speed
    const speed = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
    if (speed > this.maxSpeed) this.maxSpeed = speed;

    // Calculate orbital params
    if (this.altitude > 1000) {
      const posRel = { x: this.state.x, y: distFromCenter };
      this.orbitalParams = calculateOrbitalParams(
        posRel,
        { vx: this.state.vx, vy: -this.state.vy },
        PLANET.mass,
        PLANET.radius
      );
    } else {
      this.orbitalParams = null;
    }
  }

  updateRocketVisual() {
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = -this.altitude / this.metersPerPixel - PLANET.surfaceY;
    this.rocketContainer.setPosition(screenX, screenY);
    this.rocketContainer.setRotation(this.state.angle);
  }

  updateCamera() {
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = -this.altitude / this.metersPerPixel - PLANET.surfaceY;
    this.cameras.main.centerOn(screenX, screenY - 50);
  }

  checkConditions() {
    if (this.orbitalParams && this.orbitalParams.isBound) {
      if (this.orbitalParams.periapsisAlt > PLANET.atmosphereHeight && this.orbitalParams.eccentricity < 1) {
        // Periapsis is above atmosphere - start or continue dwell timer
        if (!this.orbitDwellStart) {
          this.orbitDwellStart = this.time.now;
        } else if (this.time.now - this.orbitDwellStart > 2000) {
          // Stable orbit achieved after 2+ seconds of dwell!
          this.gameWon = true;
          this.gameOver = true;
        }
      } else {
        // Conditions not met, reset dwell timer
        this.orbitDwellStart = null;
      }
    } else {
      this.orbitDwellStart = null;
    }

    // Fuel depleted on suborbital trajectory
    if (this.fuel <= 0 && this.altitude > 100 && !this.gameWon) {
      if (!this.orbitalParams || this.orbitalParams.periapsisAlt <= 0) {
        // Still suborbital and out of fuel - will crash eventually
        // Only trigger after a few seconds
        if (!this.outOfFuelTime) {
          this.outOfFuelTime = this.time.now;
        } else if (this.time.now - this.outOfFuelTime > 3000) {
          if (this.state.vy > 0) {
            // Falling back down
            this.gameOver = true;
          }
        }
      }
    }
  }

  crash() {
    this.gameOver = true;
    this.gameWon = false;

    // Explosion effect
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = -PLANET.surfaceY;
    for (let i = 0; i < 20; i++) {
      this.exhaustParticles.push({
        x: screenX + (Math.random() - 0.5) * 20,
        y: screenY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: -(Math.random() * 6),
        size: 5 + Math.random() * 8,
        life: 40 + Math.random() * 20,
        color: Math.random() > 0.3 ? 0xff4400 : 0xffcc00
      });
    }
  }

  getFlightData() {
    const speed = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
    return {
      altitude: this.altitude || 0,
      speed: speed,
      fuel: this.fuel,
      maxFuel: this.rocketConfig.totalFuel,
      throttle: this.throttle,
      angle: this.state.angle,
      twr: this.totalMass > 0 ? this.thrust / (this.totalMass * 9.81) : 0,
      orbitalParams: this.orbitalParams,
      gameOver: this.gameOver,
      gameWon: this.gameWon,
      vx: this.state.vx,
      vy: this.state.vy
    };
  }
}
