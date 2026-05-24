import { PlacedObject } from './MapEditor';

export interface Prefab {
  id: string;
  name: string;
  objects: PlacedObject[];
  createdAt: number;
}

const STORAGE_KEY = 'editor_prefabs';

export class PrefabSystem {
  private prefabs: Prefab[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.prefabs = JSON.parse(raw);
      }
    } catch {
      this.prefabs = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefabs));
    } catch {
      // storage full or unavailable
    }
  }

  savePrefab(name: string, objects: PlacedObject[]): Prefab {
    const id = `prefab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const prefab: Prefab = {
      id,
      name,
      objects: objects.map(o => ({ ...o })),
      createdAt: Date.now(),
    };
    this.prefabs.push(prefab);
    this.saveToStorage();
    return prefab;
  }

  getPrefabs(): Prefab[] {
    return [...this.prefabs];
  }

  deletePrefab(id: string): void {
    this.prefabs = this.prefabs.filter(p => p.id !== id);
    this.saveToStorage();
  }

  exportJSON(): string {
    return JSON.stringify(this.prefabs, null, 2);
  }

  importJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        this.prefabs = data;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
