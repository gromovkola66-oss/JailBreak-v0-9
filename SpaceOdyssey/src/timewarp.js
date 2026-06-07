/**
 * Time Warp Manager - Accelerate simulation time
 * Keys 1/2/3/4 map to x1/x2/x5/x10 multipliers.
 * Auto-resets to x1 when throttle > 0.
 */

const WARP_LEVELS = {
  1: 1,
  2: 2,
  3: 5,
  4: 10
};

class TimeWarp {
  constructor() {
    this.currentMultiplier = 1;
  }

  setWarp(level) {
    if (WARP_LEVELS[level] !== undefined) {
      this.currentMultiplier = WARP_LEVELS[level];
    }
  }

  getMultiplier() {
    return this.currentMultiplier;
  }

  reset() {
    this.currentMultiplier = 1;
  }
}

export default TimeWarp;
