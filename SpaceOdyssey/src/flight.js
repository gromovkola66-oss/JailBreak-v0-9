/**
 * Flight Scene - Real-time rocket flight with physics
 *
 * Coordinate system:
 *   state.x = horizontal position (meters, 0 = launch site)
 *   state.y = altitude above surface (meters, positive = up)
 *   state.vx = horizontal velocity (positive = right)
 *   state.vy = vertical velocity (positive = up)
 *
 * Screen mapping (Phaser y-axis points down):
 *   screenX = state.x / metersPerPixel
 *   screenY = -(state.y / metersPerPixel)
 *   Ground is at screenY = 0
 */
import { calculateGravity, calculateDrag, calculateThrust, integrateMotion, calculateOrbitalParams } from './physics.js';
import { PLANET } from './main.js';
import AudioManager from './audio.js';
import TimeWarp from './timewarp.js';
import TutorialManager from './tutorial.js';

export default class FlightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FlightScene' });
  }

  init(data) {
    this.rocketConfig = data.rocketConfig;
  }

  create() {
    // Flight state: rocket starts on surface
    this.state = {
      x: 0,
      y: 0,        // altitude = 0 (on ground)
      vx: 0,
      vy: 0,       // positive = upward
      angle: 0,    // 0 = pointing up
      angularVel: 0
    };

    this.thrust = this.rocketConfig.totalThrust;
    this.consumption = this.rocketConfig.totalConsumption;
    this.throttle = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.maxSpeed = 0;
    this.altitude = 0;

    // Active modules (copy for staging)
    this.activeModules = [...this.rocketConfig.modules];

    // Separate fuel pools by type to avoid double-counting
    this.fuel = 0;
    this.boosterFuel = 0;
    this.rcsFuel = 0;
    this.activeModules.forEach(mod => {
      if (mod.type === 'tank') this.fuel += mod.fuel;
      else if (mod.type === 'booster') this.boosterFuel += mod.fuel;
      else if (mod.type === 'rcs') this.rcsFuel += mod.fuel;
    });

    // Total mass = dry mass + all fuel pools
    this.totalMass = this.rocketConfig.dryMass + this.fuel + this.boosterFuel + this.rcsFuel;

    // Parachute state
    this.hasParachute = this.activeModules.some(m => m.type === 'parachute');
    this.parachuteDeployed = false;

    // Stage tracking
    this.stageCount = this.countStages();
    this.currentStage = 1;

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

    // New key bindings
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

    // Audio manager
    this.audio = new AudioManager();
    this.audio.init();

    // Time warp manager
    this.timeWarp = new TimeWarp();

    // Tutorial
    this.tutorial = new TutorialManager();
    this.tutorial.showFlightTips(this);

    // Detached stages visuals
    this.detachedStages = [];

    // Start UI and orbit scenes
    this.scene.launch('UIScene', { flightScene: this });
    this.scene.launch('OrbitScene', { flightScene: this });

    // Time accumulator for fixed timestep
    this.accumulator = 0;
    this.fixedDt = 1 / 60;

    // RCS active flag (fuel consumed in physicsStep)
    this.rcsActive = false;

    // Track space key to detect single press
    this.spaceWasDown = false;
  }

  countStages() {
    let stages = 1;
    this.activeModules.forEach(mod => {
      if (mod.type === 'decoupler') stages++;
    });
    return stages;
  }

  createBackground() {
    // Starfield (far background) - drawn above ground (negative screen Y)
    this.stars = this.add.graphics();
    for (let i = 0; i < 300; i++) {
      const sx = Phaser.Math.Between(-2000, 2000);
      const sy = Phaser.Math.Between(-5000, -100);
      const brightness = Phaser.Math.Between(100, 255);
      const size = Math.random() > 0.9 ? 2 : 1;
      this.stars.fillStyle(Phaser.Display.Color.GetColor(brightness, brightness, brightness));
      this.stars.fillRect(sx, sy, size, size);
    }

    // Atmosphere gradient (from surface upward)
    this.atmosphereGraphics = this.add.graphics();
    const atmosHeightPx = PLANET.atmosphereHeight / this.metersPerPixel;
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const alpha = (1 - t) * 0.3;
      const r = Math.floor(50 + t * 20);
      const g = Math.floor(100 + t * 50);
      const b = Math.floor(200 + t * 55);
      const stripH = atmosHeightPx / steps;
      this.atmosphereGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), alpha);
      this.atmosphereGraphics.fillRect(-3000, -(t + 1) * stripH, 6000, stripH);
    }

    // Ground
    this.groundGraphics = this.add.graphics();
    this.groundGraphics.fillStyle(0x2d5a27);
    this.groundGraphics.fillRect(-3000, 0, 6000, 20);
    this.groundGraphics.fillStyle(0x5c3a1e);
    this.groundGraphics.fillRect(-3000, 20, 6000, 200);
    this.groundGraphics.fillStyle(0x3d2815);
    this.groundGraphics.fillRect(-3000, 220, 6000, 500);

    // Surface details
    for (let i = -3000; i < 3000; i += 50) {
      const h = Phaser.Math.Between(3, 10);
      this.groundGraphics.fillStyle(0x3a7a33);
      this.groundGraphics.fillRect(i, -h, 4, h);
    }
  }

  createRocket() {
    this.rocketContainer = this.add.container(0, 0);
    this.rebuildRocketVisual();
  }

  rebuildRocketVisual() {
    this.rocketContainer.removeAll(true);

    const modules = this.activeModules;
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
        const window = this.add.circle(0, currentY + h / 2, 5, 0x88ccff);
        this.rocketContainer.add(window);
      } else if (mod.type === 'engine' || mod.type === 'booster') {
        const nozzle = this.add.triangle(0, currentY + h, -8, 0, 8, 0, 0, 10, 0x888888);
        this.rocketContainer.add(nozzle);
      }

      currentY += h;
    }

    this.rocketHeight = currentY;
    this.updateRocketVisual();
  }

  createExhaust() {
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
    if (this.throttle > 0 && (this.fuel + this.boosterFuel) > 0) {
      const screenX = this.state.x / this.metersPerPixel;
      const screenY = -(this.altitude / this.metersPerPixel);
      const exhaustX = screenX - Math.sin(this.state.angle) * (this.rocketHeight * 0.5);
      const exhaustY = screenY + Math.cos(this.state.angle) * (this.rocketHeight * 0.5);

      for (let i = 0; i < 3; i++) {
        this.exhaustParticles.push({
          x: exhaustX + (Math.random() - 0.5) * 6,
          y: exhaustY + (Math.random() - 0.5) * 6,
          vx: -Math.sin(this.state.angle) * (2 + Math.random() * 3) + (Math.random() - 0.5) * 2,
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
        this.audio.stopEngine();
        this.scene.stop('UIScene');
        this.scene.stop('OrbitScene');
        this.scene.start('BuilderScene');
      }
      return;
    }

    // Process input
    this.processInput();

    // Auto-reset warp if throttle is active
    if (this.throttle > 0) {
      this.timeWarp.reset();
    }

    // Physics update with fixed timestep, accounting for time warp
    const warpMultiplier = this.timeWarp.getMultiplier();
    this.accumulator += (delta / 1000) * warpMultiplier;

    // Cap accumulator to prevent spiral of death
    const maxAccum = this.fixedDt * 20;
    if (this.accumulator > maxAccum) {
      this.accumulator = maxAccum;
    }

    while (this.accumulator >= this.fixedDt) {
      this.physicsStep(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    // Update visuals
    this.updateRocketVisual();
    this.updateExhaust();
    this.updateCamera();
    this.updateDetachedStages(delta / 1000 * warpMultiplier);

    // Update audio
    if (this.throttle > 0 && (this.fuel + this.boosterFuel) > 0) {
      if (!this.audio.engineNodes) {
        this.audio.startEngine();
      }
      this.audio.updateEngine(this.throttle);
    } else {
      if (this.audio.engineNodes) {
        this.audio.stopEngine();
      }
    }

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
    } else if (this.qKey.isDown && this.rcsFuel > 0) {
      // RCS fine rotation left (fuel consumed in physicsStep)
      this.state.angularVel = -0.5;
      this.rcsActive = true;
    } else if (this.eKey.isDown && this.rcsFuel > 0) {
      // RCS fine rotation right (fuel consumed in physicsStep)
      this.state.angularVel = 0.5;
      this.rcsActive = true;
    } else {
      this.rcsActive = false;
      this.state.angularVel *= 0.9;
    }

    // Time warp keys
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.timeWarp.setWarp(1);
    } else if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.timeWarp.setWarp(2);
    } else if (Phaser.Input.Keyboard.JustDown(this.key3)) {
      this.timeWarp.setWarp(3);
    } else if (Phaser.Input.Keyboard.JustDown(this.key4)) {
      this.timeWarp.setWarp(4);
    }

    // Stage separation (Space key, single press)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.separateStage();
    }

    // Parachute (P key)
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.deployParachute();
    }
  }

  separateStage() {
    // Find the lowest decoupler in active modules
    let decouplerIndex = -1;
    for (let i = this.activeModules.length - 1; i >= 0; i--) {
      if (this.activeModules[i].type === 'decoupler') {
        decouplerIndex = i;
        break;
      }
    }

    if (decouplerIndex === -1) return; // No decoupler found

    // Remove all modules below (and including) the decoupler
    const detachedModules = this.activeModules.splice(decouplerIndex);

    // Recalculate stats from remaining active modules
    let totalMass = 0;
    let totalFuel = 0;
    let totalThrust = 0;
    let totalConsumption = 0;
    let boosterFuel = 0;
    let rcsFuel = 0;

    this.activeModules.forEach(mod => {
      totalMass += mod.mass;
      if (mod.type === 'tank') totalFuel += mod.fuel;
      if (mod.type === 'booster') {
        totalThrust += mod.thrust;
        totalConsumption += mod.consumption;
        boosterFuel += mod.fuel;
      }
      if (mod.type === 'engine') {
        totalThrust += mod.thrust;
        totalConsumption += mod.consumption;
      }
      if (mod.type === 'rcs') {
        rcsFuel += mod.fuel;
      }
    });

    // Maintain current fuel level proportionally, but cap to new max
    this.fuel = Math.min(this.fuel, totalFuel);
    this.boosterFuel = Math.min(this.boosterFuel, boosterFuel);
    this.rcsFuel = Math.min(this.rcsFuel, rcsFuel);
    this.totalMass = totalMass + this.fuel + this.boosterFuel + this.rcsFuel;
    this.thrust = totalThrust;
    this.consumption = totalConsumption;

    // Update parachute status
    this.hasParachute = this.activeModules.some(m => m.type === 'parachute');

    // Update stage counter
    this.currentStage++;
    this.stageCount = this.countStages();

    // Create visual for detached stage falling away
    this.createDetachedStageVisual(detachedModules);

    // Rebuild rocket visual
    this.rebuildRocketVisual();
  }

  createDetachedStageVisual(modules) {
    const container = this.add.container(
      this.state.x / this.metersPerPixel,
      -(this.altitude / this.metersPerPixel)
    );

    let currentY = 0;
    const scale = 0.8;
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const h = mod.height * scale;
      const w = mod.width * scale;
      const rect = this.add.rectangle(0, currentY + h / 2, w, h, mod.color, 0.7);
      rect.setStrokeStyle(1, 0x999999);
      container.add(rect);
      currentY += h;
    }

    this.detachedStages.push({
      container,
      vy: 2, // starts drifting down in screen coords (positive = down)
      life: 2 // seconds to live
    });
  }

  updateDetachedStages(dt) {
    this.detachedStages = this.detachedStages.filter(stage => {
      stage.vy += 18 * dt; // gravity in screen coords (scaled by dt)
      stage.container.y += stage.vy * dt * 60; // normalize drift to ~60fps equivalent
      stage.container.alpha -= 0.3 * dt; // fade over time
      stage.life -= dt;
      if (stage.life <= 0) {
        stage.container.destroy();
        return false;
      }
      return true;
    });
  }

  deployParachute() {
    if (!this.hasParachute) return;
    if (this.parachuteDeployed) return;
    if (this.altitude > PLANET.atmosphereHeight) return;

    this.parachuteDeployed = true;
  }

  physicsStep(dt) {
    this.altitude = this.state.y;

    // RCS fuel consumption (frame-rate independent, scaled by dt)
    if (this.rcsActive && this.rcsFuel > 0) {
      const rcsDrain = 6.0 * dt; // 6 units/sec (consistent with original 0.1/frame at 60fps)
      this.rcsFuel = Math.max(0, this.rcsFuel - rcsDrain);
    }

    // Gravity acceleration (points downward = negative ay)
    const grav = calculateGravity(
      this.altitude,
      this.state.x,
      PLANET.mass,
      PLANET.radius
    );

    // Drag acceleration (opposes velocity)
    let dragMultiplier = 1;
    if (this.parachuteDeployed && this.altitude < PLANET.atmosphereHeight) {
      dragMultiplier = 10;
    }

    const drag = calculateDrag(
      { vx: this.state.vx, vy: this.state.vy },
      this.altitude,
      PLANET.atmosphereHeight
    );
    drag.ax *= dragMultiplier;
    drag.ay *= dragMultiplier;

    // Thrust acceleration
    let thrustAccel = { ax: 0, ay: 0 };
    const totalAvailableFuel = this.fuel + this.boosterFuel;
    if (this.throttle > 0 && totalAvailableFuel > 0) {
      thrustAccel = calculateThrust(
        this.thrust,
        this.state.angle,
        this.throttle,
        this.totalMass
      );
      const fuelConsumed = this.consumption * this.throttle * dt;

      // Drain booster fuel first
      if (this.boosterFuel > 0) {
        if (fuelConsumed >= this.boosterFuel) {
          const remainder = fuelConsumed - this.boosterFuel;
          this.totalMass -= this.boosterFuel;
          this.boosterFuel = 0;
          // Drain remainder from main fuel
          if (remainder > 0 && this.fuel > 0) {
            const mainDrain = Math.min(remainder, this.fuel);
            this.fuel -= mainDrain;
            this.totalMass -= mainDrain;
          }
        } else {
          this.boosterFuel -= fuelConsumed;
          this.totalMass -= fuelConsumed;
        }
      } else if (this.fuel > 0) {
        if (fuelConsumed >= this.fuel) {
          this.totalMass -= this.fuel;
          this.fuel = 0;
        } else {
          this.fuel -= fuelConsumed;
          this.totalMass -= fuelConsumed;
        }
      }
    }

    // Total acceleration
    const totalAccel = {
      ax: grav.ax + drag.ax + thrustAccel.ax,
      ay: grav.ay + drag.ay + thrustAccel.ay
    };

    // Integrate state
    const newState = integrateMotion(this.state, totalAccel, dt);
    this.state = newState;

    // Ground collision: altitude cannot go below 0
    if (this.state.y <= 0) {
      this.state.y = 0;
      this.altitude = 0;
      const impactSpeed = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
      if (impactSpeed > 50) {
        this.crash();
      } else {
        // Landed safely - stop downward movement
        if (this.state.vy < 0) {
          this.state.vy = 0;
        }
        this.state.vx *= 0.9;
      }
    }

    this.altitude = this.state.y;

    // Track max speed
    const speed = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
    if (speed > this.maxSpeed) this.maxSpeed = speed;

    // Calculate orbital params when above surface
    if (this.altitude > 1000) {
      const posFromCenter = {
        x: this.state.x,
        y: this.altitude + PLANET.radius
      };
      this.orbitalParams = calculateOrbitalParams(
        posFromCenter,
        { vx: this.state.vx, vy: this.state.vy },
        PLANET.mass,
        PLANET.radius
      );
    } else {
      this.orbitalParams = null;
    }
  }

  updateRocketVisual() {
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = -(this.altitude / this.metersPerPixel) - this.rocketHeight;
    this.rocketContainer.setPosition(screenX, screenY);
    this.rocketContainer.setRotation(this.state.angle);
  }

  updateCamera() {
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = -(this.altitude / this.metersPerPixel);
    this.cameras.main.centerOn(screenX, screenY - 100);
  }

  checkConditions() {
    // Win: stable orbit with periapsis above 50km
    const orbitThreshold = 50000;
    if (this.orbitalParams && this.orbitalParams.isBound) {
      if (this.orbitalParams.periapsisAlt > orbitThreshold && this.orbitalParams.eccentricity < 1) {
        if (!this.orbitDwellStart) {
          this.orbitDwellStart = this.time.now;
        } else if (this.time.now - this.orbitDwellStart > 2000) {
          this.gameWon = true;
          this.gameOver = true;
          this.audio.stopEngine();
          this.audio.playVictory();
        }
      } else {
        this.orbitDwellStart = null;
      }
    } else {
      this.orbitDwellStart = null;
    }

    // Lose: fuel depleted on suborbital trajectory and falling back down
    const totalAvailableFuel = this.fuel + this.boosterFuel;
    if (totalAvailableFuel <= 0 && this.altitude > 100 && !this.gameWon) {
      if (!this.orbitalParams || this.orbitalParams.periapsisAlt <= 0) {
        if (!this.outOfFuelTime) {
          this.outOfFuelTime = this.time.now;
        } else if (this.time.now - this.outOfFuelTime > 3000) {
          if (this.state.vy < 0) {
            this.gameOver = true;
          }
        }
      }
    }
  }

  crash() {
    this.gameOver = true;
    this.gameWon = false;
    this.audio.stopEngine();
    this.audio.playExplosion();

    // Explosion effect at ground level
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = 0;
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
    // Compute maxFuel from currently active modules (updates after staging)
    let maxFuel = 0;
    this.activeModules.forEach(mod => {
      if (mod.type === 'tank') maxFuel += mod.fuel;
      if (mod.type === 'booster') maxFuel += mod.fuel;
    });
    return {
      altitude: this.altitude || 0,
      speed: speed,
      fuel: this.fuel + this.boosterFuel,
      maxFuel: maxFuel,
      throttle: this.throttle,
      angle: this.state.angle,
      twr: this.totalMass > 0 ? this.thrust / (this.totalMass * 9.81) : 0,
      orbitalParams: this.orbitalParams,
      gameOver: this.gameOver,
      gameWon: this.gameWon,
      vx: this.state.vx,
      vy: this.state.vy,
      warpMultiplier: this.timeWarp ? this.timeWarp.getMultiplier() : 1,
      currentStage: this.currentStage,
      parachuteDeployed: this.parachuteDeployed,
      hasParachute: this.hasParachute
    };
  }
}
