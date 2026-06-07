/**
 * Builder Scene - Rocket construction with drag-and-drop modules
 */

const MODULE_DEFS = {
  capsule: {
    name: 'Capsule',
    mass: 500,
    fuel: 0,
    thrust: 0,
    consumption: 0,
    color: 0x4488cc,
    width: 40,
    height: 50,
    type: 'capsule'
  },
  smallTank: {
    name: 'Small Tank',
    mass: 200,
    fuel: 1000,
    thrust: 0,
    consumption: 0,
    color: 0x88aa44,
    width: 40,
    height: 40,
    type: 'tank'
  },
  largeTank: {
    name: 'Large Tank',
    mass: 400,
    fuel: 3000,
    thrust: 0,
    consumption: 0,
    color: 0x66cc44,
    width: 40,
    height: 70,
    type: 'tank'
  },
  weakEngine: {
    name: 'Weak Engine',
    mass: 150,
    thrust: 15000,
    fuel: 0,
    consumption: 10,
    color: 0xcc6644,
    width: 40,
    height: 35,
    type: 'engine'
  },
  strongEngine: {
    name: 'Strong Engine',
    mass: 300,
    thrust: 40000,
    fuel: 0,
    consumption: 25,
    color: 0xff4444,
    width: 40,
    height: 45,
    type: 'engine'
  }
};

export default class BuilderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BuilderScene' });
    this.rocketModules = [];
    this.moduleSprites = [];
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add.text(512, 30, 'ROCKET BUILDER', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(512, 60, 'Click modules on the left to add them to your rocket. Build from top to bottom.', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Module palette area
    this.add.rectangle(120, 400, 200, 600, 0x222244, 0.8).setStrokeStyle(2, 0x4444aa);
    this.add.text(120, 110, 'MODULES', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Create module buttons in palette
    let paletteY = 160;
    const keys = Object.keys(MODULE_DEFS);
    keys.forEach((key) => {
      const def = MODULE_DEFS[key];
      this.createPaletteItem(120, paletteY, key, def);
      paletteY += 90;
    });

    // Rocket assembly area
    this.add.rectangle(512, 450, 200, 500, 0x111133, 0.5).setStrokeStyle(2, 0x333366);
    this.add.text(512, 210, 'ROCKET', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Stats panel
    this.statsPanel = this.add.rectangle(850, 400, 220, 300, 0x222244, 0.8).setStrokeStyle(2, 0x4444aa);
    this.add.text(850, 260, 'STATS', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.massText = this.add.text(760, 290, 'Mass: 0 kg', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });
    this.fuelText = this.add.text(760, 315, 'Fuel: 0', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });
    this.thrustText = this.add.text(760, 340, 'Thrust: 0 N', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });
    this.twrText = this.add.text(760, 365, 'TWR: 0', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });
    this.consumptionText = this.add.text(760, 390, 'Burn rate: 0/s', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });

    // Launch button
    const launchBtn = this.add.rectangle(850, 480, 160, 50, 0x44aa44).setStrokeStyle(2, 0x66ff66);
    const launchText = this.add.text(850, 480, 'LAUNCH', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    launchBtn.setInteractive({ useHandCursor: true });
    launchBtn.on('pointerover', () => launchBtn.setFillStyle(0x55cc55));
    launchBtn.on('pointerout', () => launchBtn.setFillStyle(0x44aa44));
    launchBtn.on('pointerdown', () => this.launchRocket());

    // Clear button
    const clearBtn = this.add.rectangle(850, 540, 160, 40, 0xaa4444).setStrokeStyle(2, 0xff6666);
    this.add.text(850, 540, 'CLEAR', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    clearBtn.setInteractive({ useHandCursor: true });
    clearBtn.on('pointerover', () => clearBtn.setFillStyle(0xcc5555));
    clearBtn.on('pointerout', () => clearBtn.setFillStyle(0xaa4444));
    clearBtn.on('pointerdown', () => this.clearRocket());

    this.updateStats();
  }

  createPaletteItem(x, y, key, def) {
    const bg = this.add.rectangle(x, y, 180, 75, 0x333355, 0.8).setStrokeStyle(1, 0x5555aa);
    bg.setInteractive({ useHandCursor: true });

    // Module visual
    const moduleRect = this.add.rectangle(x - 55, y, def.width * 0.6, def.height * 0.6, def.color);
    moduleRect.setStrokeStyle(1, 0xffffff);

    // Module info
    this.add.text(x - 25, y - 20, def.name, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace'
    });

    let info = `M:${def.mass}kg`;
    if (def.fuel > 0) info += ` F:${def.fuel}`;
    if (def.thrust > 0) info += ` T:${(def.thrust / 1000).toFixed(0)}kN`;

    this.add.text(x - 25, y + 5, info, {
      fontSize: '10px',
      color: '#aaaaaa',
      fontFamily: 'monospace'
    });

    bg.on('pointerdown', () => this.addModule(key));
  }

  addModule(key) {
    const def = MODULE_DEFS[key];
    this.rocketModules.push({ ...def, key });
    this.redrawRocket();
    this.updateStats();
  }

  clearRocket() {
    this.rocketModules = [];
    this.moduleSprites.forEach(s => s.destroy());
    this.moduleSprites = [];
    this.updateStats();
  }

  redrawRocket() {
    this.moduleSprites.forEach(s => s.destroy());
    this.moduleSprites = [];

    const baseX = 512;
    let currentY = 680;

    // Draw from bottom to top
    for (let i = this.rocketModules.length - 1; i >= 0; i--) {
      const mod = this.rocketModules[i];
      const h = mod.height * 0.8;
      currentY -= h;

      const rect = this.add.rectangle(baseX, currentY + h / 2, mod.width * 0.9, h, mod.color);
      rect.setStrokeStyle(1, 0xffffff);
      this.moduleSprites.push(rect);

      const label = this.add.text(baseX, currentY + h / 2, mod.name, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      this.moduleSprites.push(label);

      // Make module clickable to remove it
      rect.setInteractive({ useHandCursor: true });
      const idx = i;
      rect.on('pointerdown', () => {
        this.rocketModules.splice(idx, 1);
        this.redrawRocket();
        this.updateStats();
      });
    }
  }

  updateStats() {
    let totalMass = 0;
    let totalFuel = 0;
    let totalThrust = 0;
    let totalConsumption = 0;

    this.rocketModules.forEach(mod => {
      totalMass += mod.mass;
      totalFuel += mod.fuel;
      totalThrust += mod.thrust;
      totalConsumption += mod.consumption;
    });

    const twr = totalMass > 0 ? totalThrust / (totalMass * 9.81) : 0;

    this.massText.setText(`Mass: ${totalMass} kg`);
    this.fuelText.setText(`Fuel: ${totalFuel}`);
    this.thrustText.setText(`Thrust: ${(totalThrust / 1000).toFixed(1)} kN`);
    this.twrText.setText(`TWR: ${twr.toFixed(2)}`);
    this.consumptionText.setText(`Burn rate: ${totalConsumption}/s`);

    // Color TWR indicator
    if (twr > 1.2) {
      this.twrText.setColor('#44ff44');
    } else if (twr > 1.0) {
      this.twrText.setColor('#ffff44');
    } else {
      this.twrText.setColor('#ff4444');
    }
  }

  launchRocket() {
    if (this.rocketModules.length === 0) return;

    // Verify rocket has at least a capsule and an engine
    const hasCapsule = this.rocketModules.some(m => m.type === 'capsule');
    const hasEngine = this.rocketModules.some(m => m.type === 'engine');

    if (!hasCapsule || !hasEngine) {
      const warnText = this.add.text(512, 750, 'Need at least a Capsule and an Engine!', {
        fontSize: '14px',
        color: '#ff4444',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      this.time.delayedCall(2000, () => warnText.destroy());
      return;
    }

    // Calculate rocket stats
    let totalMass = 0;
    let totalFuel = 0;
    let totalThrust = 0;
    let totalConsumption = 0;

    this.rocketModules.forEach(mod => {
      totalMass += mod.mass;
      totalFuel += mod.fuel;
      totalThrust += mod.thrust;
      totalConsumption += mod.consumption;
    });

    const rocketConfig = {
      modules: [...this.rocketModules],
      totalMass,
      totalFuel,
      totalThrust,
      totalConsumption,
      dryMass: totalMass - 0 // fuel mass is separate
    };

    this.scene.start('FlightScene', { rocketConfig });
  }
}
