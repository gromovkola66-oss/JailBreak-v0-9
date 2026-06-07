/**
 * Tutorial Manager - Sequential tooltip popups for first-time players
 * Checks localStorage to avoid re-showing.
 */

const STORAGE_KEY = 'spaceOdyssey_tutorialSeen';

const BUILDER_TIPS = [
  'Собери ракету из модулей слева',
  'Тебе нужна как минимум Капсула и Двигатель',
  'Нажми LAUNCH когда готов'
];

const FLIGHT_TIPS = [
  'W \u2014 тяга, A/D \u2014 поворот, Space \u2014 отделить ступень'
];

class TutorialManager {
  constructor() {
    this.shown = false;
    this.currentTips = [];
    this.currentIndex = 0;
    this.tooltipObjects = [];
  }

  isSeen() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // localStorage not available
    }
  }

  showBuilderTips(scene) {
    if (this.isSeen()) return;
    this.showTips(scene, BUILDER_TIPS);
  }

  showFlightTips(scene) {
    if (this.isSeen()) return;
    this.showTips(scene, FLIGHT_TIPS, true);
  }

  showTips(scene, tips, markDone) {
    this.currentTips = tips;
    this.currentIndex = 0;
    this.scene = scene;
    this.markDone = markDone || false;
    this.showCurrentTip();
  }

  showCurrentTip() {
    if (this.currentIndex >= this.currentTips.length) {
      if (this.markDone) {
        this.markSeen();
      }
      return;
    }

    const scene = this.scene;
    const text = this.currentTips[this.currentIndex];

    // Clean up previous tooltip
    this.clearTooltip();

    // Background rectangle
    const bg = scene.add.rectangle(512, 700, 500, 60, 0x000000, 0.85);
    bg.setStrokeStyle(2, 0x44aaff);
    bg.setDepth(1000);

    // Tip text
    const tipText = scene.add.text(512, 692, text, {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: 'monospace',
      wordWrap: { width: 460 }
    }).setOrigin(0.5).setDepth(1001);

    // Next button text
    const nextText = scene.add.text(512, 718, '[Далее]', {
      fontSize: '12px',
      color: '#44aaff',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(1001).setInteractive({ useHandCursor: true });

    nextText.on('pointerdown', () => {
      this.currentIndex++;
      this.showCurrentTip();
    });

    this.tooltipObjects = [bg, tipText, nextText];

    // Auto-advance after 5 seconds
    this.autoTimer = scene.time.delayedCall(5000, () => {
      this.currentIndex++;
      this.showCurrentTip();
    });
  }

  clearTooltip() {
    this.tooltipObjects.forEach(obj => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.tooltipObjects = [];
    if (this.autoTimer) {
      this.autoTimer.remove(false);
      this.autoTimer = null;
    }
  }
}

export default TutorialManager;
