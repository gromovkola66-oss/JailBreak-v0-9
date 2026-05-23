// HealthSystem - thin interface wrapping Combat's health management.
// Combat.ts remains the single source of truth for HP.
// This module exports the HealthState type for external consumers.

export interface HealthState {
  hp: number;
  maxHp: number;
  isDead: boolean;
}

export class HealthSystem {
  private hp: number;
  private maxHp: number;
  private isDead = false;

  public onStateChange?: (state: HealthState) => void;
  public onDeath?: () => void;

  constructor(maxHp = 100) {
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  takeDamage(amount: number) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isDead = true;
      this.onDeath?.();
    }
    this.onStateChange?.(this.getState());
  }

  heal(amount: number) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.onStateChange?.(this.getState());
  }

  reset() {
    this.hp = this.maxHp;
    this.isDead = false;
    this.onStateChange?.(this.getState());
  }

  getState(): HealthState {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      isDead: this.isDead,
    };
  }
}
