export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

export class LayerSystem {
  private layers: Layer[] = [];
  private assignments: Map<string, string> = new Map(); // objectId -> layerId
  private isolationLayerId: string | null = null;

  public onLayerChanged?: () => void;

  constructor() {
    this.layers = [
      { id: 'geometry', name: 'Geometry', visible: true, locked: false, color: '#6b7280' },
      { id: 'decorations', name: 'Decorations', visible: true, locked: false, color: '#f59e0b' },
      { id: 'lighting', name: 'Lighting', visible: true, locked: false, color: '#eab308' },
      { id: 'scripts', name: 'Scripts', visible: true, locked: false, color: '#8b5cf6' },
    ];
  }

  getLayers(): Layer[] {
    return [...this.layers];
  }

  addLayer(name: string, color: string): Layer {
    const id = `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const layer: Layer = { id, name, visible: true, locked: false, color };
    this.layers.push(layer);
    this.onLayerChanged?.();
    return layer;
  }

  removeLayer(layerId: string): void {
    // Don't remove default layers
    const defaultIds = ['geometry', 'decorations', 'lighting', 'scripts'];
    if (defaultIds.includes(layerId)) return;
    this.layers = this.layers.filter(l => l.id !== layerId);
    // Reassign objects from removed layer to geometry
    this.assignments.forEach((lid, objId) => {
      if (lid === layerId) this.assignments.set(objId, 'geometry');
    });
    if (this.isolationLayerId === layerId) this.isolationLayerId = null;
    this.onLayerChanged?.();
  }

  toggleVisibility(layerId: string): void {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      this.onLayerChanged?.();
    }
  }

  toggleLock(layerId: string): void {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.locked = !layer.locked;
      this.onLayerChanged?.();
    }
  }

  setIsolation(layerId: string | null): void {
    this.isolationLayerId = layerId;
    this.onLayerChanged?.();
  }

  getIsolationLayerId(): string | null {
    return this.isolationLayerId;
  }

  getLayerForObject(objectId: string): string {
    return this.assignments.get(objectId) || 'geometry';
  }

  assignObjectToLayer(objectId: string, layerId: string): void {
    this.assignments.set(objectId, layerId);
    this.onLayerChanged?.();
  }

  getVisibleObjects(allObjectIds: string[]): string[] {
    return allObjectIds.filter(id => {
      const layerId = this.getLayerForObject(id);
      if (this.isolationLayerId && layerId !== this.isolationLayerId) return false;
      const layer = this.layers.find(l => l.id === layerId);
      return layer ? layer.visible : true;
    });
  }

  isObjectEditable(objectId: string): boolean {
    const layerId = this.getLayerForObject(objectId);
    const layer = this.layers.find(l => l.id === layerId);
    if (!layer) return true;
    if (layer.locked) return false;
    if (this.isolationLayerId && layerId !== this.isolationLayerId) return false;
    return true;
  }

  getAssignments(): Record<string, string> {
    const result: Record<string, string> = {};
    this.assignments.forEach((layerId, objId) => {
      result[objId] = layerId;
    });
    return result;
  }

  importAssignments(data: Record<string, string>): void {
    this.assignments.clear();
    for (const [objId, layerId] of Object.entries(data)) {
      this.assignments.set(objId, layerId);
    }
  }

  importLayers(data: Array<{ id: string; name: string; color: string }>): void {
    for (const ld of data) {
      const existing = this.layers.find(l => l.id === ld.id);
      if (existing) {
        existing.name = ld.name;
        existing.color = ld.color;
      } else {
        this.layers.push({ id: ld.id, name: ld.name, visible: true, locked: false, color: ld.color });
      }
    }
  }

  exportLayers(): Array<{ id: string; name: string; color: string }> {
    return this.layers.map(l => ({ id: l.id, name: l.name, color: l.color }));
  }
}
