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

    this.fuel = this.rocketConfig.totalFuel;
    this.totalMass = this.rocketConfig.totalMass;
    this.thrust = this.rocketConfig.totalThrust;
    this.consumption = this.rocketConfig.totalConsumption;
    this.throttle = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.maxSpeed = 0;
    this.altitude = 0;

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
    // Surface is at screen y=0, atmosphere extends upward to negative screen y
    this.atmosphereGraphics = this.add.graphics();
    const atmosHeightPx = PLANET.atmosphereHeight / this.metersPerPixel;
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const alpha = (1 - t) * 0.3;
      const r = Math.floor(50 + t * 20);
      const g = Math.floor(100 + t * 50);
      const b = Math.floor(200 + t * 55);
      // Each strip: from altitude t*atmosHeight to (t+1)*atmosHeight
      // Screen y: -t*atmosHeightPx to -(t+1)*atmosHeightPx (going up)
      const stripTop = -(t + 1) * (atmosHeightPx / steps) * steps / steps;
      const stripH = atmosHeightPx / steps;
      this.atmosphereGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b), alpha);
      this.atmosphereGraphics.fillRect(-3000, -(t + 1) * stripH, 6000, stripH);
    }

    // Ground - drawn BELOW screen y=0 (surface)
    this.groundGraphics = this.add.graphics();
    // Surface layer (green grass at y=0)
    this.groundGraphics.fillStyle(0x2d5a27);
    this.groundGraphics.fillRect(-3000, 0, 6000, 20);
    // Earth/soil below
    this.groundGraphics.fillStyle(0x5c3a1e);
    this.groundGraphics.fillRect(-3000, 20, 6000, 200);
    // Deep ground
    this.groundGraphics.fillStyle(0x3d2815);
    this.groundGraphics.fillRect(-3000, 220, 6000, 500);

    // Surface details (small plants above ground line)
    for (let i = -3000; i < 3000; i += 50) {
      const h = Phaser.Math.Between(3, 10);
      this.groundGraphics.fillStyle(0x3a7a33);
      this.groundGraphics.fillRect(i, -h, 4, h);
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
        const window = this.add.circle(0, currentY + h / 2, 5, 0x88ccff);
        this.rocketContainer.add(window);
      } else if (mod.type === 'engine') {
        const nozzle = this.add.triangle(0, currentY + h, -8, 0, 8, 0, 0, 10, 0x888888);
        this.rocketContainer.add(nozzle);
      }

      currentY += h;
    }

    this.rocketHeight = currentY;
    // Position rocket on ground initially
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
      p.vy += 0.2; // particles fall in screen coords (positive = down)
      p.size *= 0.95;
      return p.life > 0;
    });

    // Add new particles if thrusting
    if (this.throttle > 0 && this.fuel > 0) {
      const screenX = this.state.x / this.metersPerPixel;
      const screenY = -(this.altitude / this.metersPerPixel);
      // Exhaust comes from the bottom of the rocket
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
    this.altitude = this.state.y;

    // Gravity acceleration (points downward = negative ay)
    const grav = calculateGravity(
      this.altitude,
      this.state.x,
      PLANET.mass,
      PLANET.radius
    );

    // Drag acceleration (opposes velocity)
    const drag = calculateDrag(
      { vx: this.state.vx, vy: this.state.vy },
      this.altitude,
      PLANET.atmosphereHeight
    );

    // Thrust acceleration
    let thrustAccel = { ax: 0, ay: 0 };
    if (this.throttle > 0 && this.fuel > 0) {
      thrustAccel = calculateThrust(
        this.thrust,
        this.state.angle,
        this.throttle,
        this.totalMass
      );
      const fuelConsumed = this.consumption * this.throttle * dt;
      if (fuelConsumed >= this.fuel) {
        // Only consume remaining fuel
        this.totalMass -= this.fuel;
        this.fuel = 0;
      } else {
        this.fuel -= fuelConsumed;
        this.totalMass -= fuelConsumed;
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
      // Position relative to planet center:
      // planet center is at (0, -(radius)) in our coordinate system
      // rocket is at (state.x, state.y) above surface
      // so relative to planet center: (state.x, state.y + radius)
      const posFromCenter = {
        x: this.state.x,
        y: this.altitude + PLANET.radius
      };
      // Velocity in the same frame (vy positive = away from center)
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
    // Convert world coords to screen coords
    // Screen: x = state.x / metersPerPixel, y = -(altitude / metersPerPixel)
    // Rocket container origin is at its top, so offset by rocketHeight
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
    // Win: stable orbit with periapsis above 50km (lowered from 100km for playability)
    const orbitThreshold = 50000; // 50 km
    if (this.orbitalParams && this.orbitalParams.isBound) {
      if (this.orbitalParams.periapsisAlt > orbitThreshold && this.orbitalParams.eccentricity < 1) {
        if (!this.orbitDwellStart) {
          this.orbitDwellStart = this.time.now;
        } else if (this.time.now - this.orbitDwellStart > 2000) {
          this.gameWon = true;
          this.gameOver = true;
        }
      } else {
        this.orbitDwellStart = null;
      }
    } else {
      this.orbitDwellStart = null;
    }

    // Lose: fuel depleted on suborbital trajectory and falling back down
    if (this.fuel <= 0 && this.altitude > 100 && !this.gameWon) {
      if (!this.orbitalParams || this.orbitalParams.periapsisAlt <= 0) {
        if (!this.outOfFuelTime) {
          this.outOfFuelTime = this.time.now;
        } else if (this.time.now - this.outOfFuelTime > 3000) {
          // vy < 0 means falling back down in our coordinate system
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

    // Explosion effect at ground level
    const screenX = this.state.x / this.metersPerPixel;
    const screenY = 0; // ground level
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
