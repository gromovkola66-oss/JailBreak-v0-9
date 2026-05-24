import { ECONOMY } from './EconomyConfig';

export interface WalletState {
  balance: number;
  maxCarry: number;
}

export class WalletSystem {
  private balance = 0;
  private maxCarry = ECONOMY.MAX_CARRY_DEFAULT;

  public onStateChange?: (state: WalletState) => void;

  addMoney(amount: number): boolean {
    if (this.balance >= this.maxCarry) return false;
    this.balance = Math.min(this.balance + amount, this.maxCarry);
    this.notifyStateChange();
    return true;
  }

  spendMoney(amount: number): boolean {
    if (this.balance < amount) return false;
    this.balance -= amount;
    this.notifyStateChange();
    return true;
  }

  canAfford(amount: number): boolean {
    return this.balance >= amount;
  }

  getBalance(): number {
    return this.balance;
  }

  dropOnDeath(): number {
    const dropped = Math.floor(this.balance * ECONOMY.DEATH_DROP_PERCENT / 100);
    this.balance -= dropped;
    this.notifyStateChange();
    return dropped;
  }

  getState(): WalletState {
    return {
      balance: this.balance,
      maxCarry: this.maxCarry,
    };
  }

  reset(): void {
    this.balance = 0;
    this.notifyStateChange();
  }

  private notifyStateChange() {
    this.onStateChange?.(this.getState());
  }
}
