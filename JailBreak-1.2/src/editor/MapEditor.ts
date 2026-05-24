import * as THREE from 'three';
import { EditorCamera } from './EditorCamera';
import { getAllEditorObjectTypes, getObjectById, EditorObjectType } from './EditorObjects';
import {
  applyToRenderer,
  configureSunShadow,
  getRendererOptions,
  pruneShadowCasters,
} from '../game/QualitySettings';
import { TerrainSystem, TerrainData } from '../game/TerrainSystem';
import { WaterZoneData } from '../game/WaterSystem';

export interface PlacedObject {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  rotationX?: number;
  rotationZ?: number;
  scale?: number;
  groupId?: number;
  label?: string;
}

export interface MapData {
  name: string;
  version: number;
  objects: PlacedObject[];
  terrain?: TerrainData;
  waterZones?: WaterZoneData[];
}

interface HistoryEntry {
  action: 'place' | 'delete' | 'move' | 'rotate' | 'multi_delete';
  data: PlacedObject;
  prevData?: PlacedObject;
  multiData?: PlacedObject[];
}

export class MapEditor {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private editorCamera: EditorCamera;

  private placedObjects: Map<string, THREE.Group> = new Map();
  private placedObjectsData: PlacedObject[] = [];

  private selectedObjectType: EditorObjectType | null = null;
  private ghostObject: THREE.Group | null = null;
  private selectedObject: THREE.Group | null = null;
  private currentRotation = 0;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  private isRunning = false;
  private prevTime = 0;

  private gridEnabled = false;
  private readonly gridSize = 1;
  private gridHelper: THREE.GridHelper;

  private isMovingSelected = false;

  // Gizmo
  private gizmoGroup: THREE.Group | null = null;
  private activeGizmoAxis: 'x' | 'y' | 'z' | null = null;
  private isDraggingGizmo = false;
  private gizmoDragStart = new THREE.Vector3();

  // Undo/Redo
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  // Multi-select
  private selectedObjects: Set<string> = new Set();
  private highlightedObjects: Set<string> = new Set();

  // Y height
  private placementY = 0.1;

  // Terrain mode
  private terrainSystem: TerrainSystem;
  private terrainMode = false;
  private isTerrainPainting = false;
  private terrainBrush = { type: 'raise' as 'raise' | 'lower' | 'flatten' | 'smooth' | 'paint', radius: 5, strength: 0.5, paintMaterial: 0 };

  // Callbacks
  public onObjectSelected?: (type: EditorObjectType | null) => void;
  public onObjectPlaced?: (count: number) => void;
  public onSelectionChanged?: (obj: PlacedObject | null) => void;
  public onGridChanged?: (enabled: boolean) => void;
  public onMoveModeChanged?: (moving: boolean) => void;
  public onHistoryChanged?: (canUndo: boolean, canRedo: boolean) => void;
  public onHeightChanged?: (y: number) => void;
  public onMultiSelectChanged?: (count: number) => void;
  public onTerrainModeChanged?: (mode: boolean) => void;
  public onTerrainBrushChanged?: (brush: { type: string; radius: number; strength: number; paintMaterial: number }) => void;
  public onTerrainResized?: (size: number) => void;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.renderer = new THREE.WebGLRenderer(getRendererOptions());
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    applyToRenderer(this.renderer);
    container.appendChild(this.renderer.domElement);

    this.editorCamera = new EditorCamera();

    this.scene.add(new THREE.AmbientLight(0x606060, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(20, 30, 10);
    // Bounds chosen to cover any realistic editor session. configureSunShadow
    // also disables sun.castShadow entirely on 'low' quality.
    configureSunShadow(sun, 50, 1, 200);
    this.scene.add(sun);

    // 200×200 covers any realistic prison map and keeps line geometry small
    this.gridHelper = new THREE.GridHelper(200, 200, 0x444444, 0x2a2a2a);
    this.gridHelper.visible = this.gridEnabled;
    this.scene.add(this.gridHelper);
    this.scene.add(new THREE.AxesHelper(8));

    // Terrain system
    this.terrainSystem = new TerrainSystem(this.scene, 200, 64);

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  // === GRID ===
  isGridActive() { return this.gridEnabled; }
  setGridEnabled(e: boolean) {
    this.gridEnabled = e;
    this.gridHelper.visible = e;
    this.onGridChanged?.(e);
  }
  toggleGrid() { this.setGridEnabled(!this.gridEnabled); }

  private snap(pos: THREE.Vector3) {
    if (!this.gridEnabled) return pos.clone();
    return new THREE.Vector3(
      Math.round(pos.x / this.gridSize) * this.gridSize,
      Math.round(pos.y / this.gridSize) * this.gridSize,
      Math.round(pos.z / this.gridSize) * this.gridSize
    );
  }

  // === PLACEMENT Y ===
  getPlacementY() { return this.placementY; }
  setPlacementY(y: number) {
    this.placementY = Math.round(y * 10) / 10;
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.placementY);
    this.onHeightChanged?.(this.placementY);
  }
  adjustPlacementY(delta: number) { this.setPlacementY(this.placementY + delta); }

  // === TERRAIN MODE ===
  setTerrainMode(on: boolean) {
    this.terrainMode = on;
    if (on) {
      this.stopMovingSelected();
      this.selectObjectType(null);
      this.clearSelection();
    }
    this.isTerrainPainting = false;
    this.onTerrainModeChanged?.(on);
  }
  getTerrainMode(): boolean { return this.terrainMode; }
  setTerrainBrush(brush: Partial<{ type: 'raise' | 'lower' | 'flatten' | 'smooth' | 'paint'; radius: number; strength: number; paintMaterial: number }>) {
    if (brush.type !== undefined) this.terrainBrush.type = brush.type;
    if (brush.radius !== undefined) this.terrainBrush.radius = brush.radius;
    if (brush.strength !== undefined) this.terrainBrush.strength = brush.strength;
    if (brush.paintMaterial !== undefined) this.terrainBrush.paintMaterial = brush.paintMaterial;
    this.onTerrainBrushChanged?.(this.terrainBrush);
  }
  getTerrainBrush() { return { ...this.terrainBrush }; }

  getTerrainSize(): number { return this.terrainSystem.getSize(); }

  resizeTerrain(size: number): void {
    const resolution = TerrainSystem.getResolutionForSize(size);
    this.terrainSystem.resize(size, resolution);

    // Remove old grid and create a new one matching the new size
    this.scene.remove(this.gridHelper);
    this.gridHelper = new THREE.GridHelper(size, size, 0x444444, 0x2a2a2a);
    this.gridHelper.visible = this.gridEnabled;
    this.scene.add(this.gridHelper);

    this.onTerrainResized?.(size);
  }

  private applyTerrainBrush(point: THREE.Vector3) {
    const { type, radius, strength, paintMaterial } = this.terrainBrush;
    switch (type) {
      case 'raise': this.terrainSystem.raise(point.x, point.z, radius, strength); break;
      case 'lower': this.terrainSystem.lower(point.x, point.z, radius, strength); break;
      case 'flatten': this.terrainSystem.flatten(point.x, point.z, radius, point.y); break;
      case 'smooth': this.terrainSystem.smooth(point.x, point.z, radius); break;
      case 'paint': this.terrainSystem.paint(point.x, point.z, radius, paintMaterial); break;
    }
  }

  private raycastTerrain(e: MouseEvent): THREE.Vector3 | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.editorCamera.camera);
    const hits = this.raycaster.intersectObject(this.terrainSystem.getMesh());
    if (hits.length > 0) return hits[0].point;
    return null;
  }

  // === SELECT OBJECT TYPE ===
  selectObjectType(typeId: string | null) {
    this.stopMovingSelected();
    if (this.ghostObject) { this.scene.remove(this.ghostObject); this.ghostObject = null; }
    if (!typeId) { this.selectedObjectType = null; this.onObjectSelected?.(null); return; }
    const t = getObjectById(typeId);
    if (!t) return;
    this.selectedObjectType = t;
    this.ghostObject = t.create();
    this.ghostObject.traverse(c => {
      if (c instanceof THREE.Mesh) {
        const m = (c.material as THREE.MeshStandardMaterial).clone();
        m.transparent = true; m.opacity = 0.5;
        c.material = m;
      }
    });
    this.scene.add(this.ghostObject);
    this.onObjectSelected?.(t);
  }

  selectObjectByIndex(index: number) {
    const cats = ['walls', 'items', 'lighting', 'scripts'];
    const all = getAllEditorObjectTypes();
    const allByCategory: Record<string, EditorObjectType[]> = {};
    for (const c of cats) allByCategory[c] = all.filter(o => o.category === c);
    let cat = 'walls';
    if (this.selectedObjectType) cat = this.selectedObjectType.category;
    const items = allByCategory[cat] || [];
    if (index >= 0 && index < items.length) this.selectObjectType(items[index].id);
  }

  // === MOVE MODE ===
  isMoveModeActive() { return this.isMovingSelected; }
  startMovingSelected() {
    if ((!this.selectedObject && this.selectedObjects.size === 0) || this.selectedObjectType) return;
    this.isMovingSelected = true;
    this.onMoveModeChanged?.(true);
  }
  stopMovingSelected() {
    if (!this.isMovingSelected) return;
    this.isMovingSelected = false;
    this.onMoveModeChanged?.(false);
  }
  toggleMoveSelected() {
    if (this.isMovingSelected) this.stopMovingSelected();
    else this.startMovingSelected();
  }

  // === MOUSE ===
  private getGroundPos(e: MouseEvent): THREE.Vector3 | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.editorCamera.camera);

    // Сначала проверяем попадание на существующие объекты (для стыковки по высоте)
    if (this.selectedObjectType) {
      const objs: THREE.Object3D[] = [];
      this.placedObjects.forEach(o => objs.push(o));
      const hits = this.raycaster.intersectObjects(objs, true).filter(h => !h.object.userData.isGizmo);
      if (hits.length > 0) {
        const hit = hits[0];
        // Ставим объект на верхнюю грань + смещение
        const pt = hit.point.clone();
        if (hit.face) {
          pt.add(hit.face.normal.clone().multiplyScalar(0.01));
        }
        return this.snap(pt);
      }
    }

    const pt = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, pt)) return this.snap(pt);
    return null;
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    // Terrain mode
    if (this.terrainMode) {
      const point = this.raycastTerrain(e);
      if (point) {
        this.isTerrainPainting = true;
        this.applyTerrainBrush(point);
      }
      return;
    }
    // Try gizmo first
    if (this.tryGizmoClick(e)) return;
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button !== 0) return;
    if (this.isTerrainPainting) { this.isTerrainPainting = false; return; }
    if (this.isDraggingGizmo) { this.stopGizmoDrag(); return; }
  }

  private onMouseMove(e: MouseEvent) {
    // Terrain painting
    if (this.isTerrainPainting && this.terrainMode) {
      const point = this.raycastTerrain(e);
      if (point) this.applyTerrainBrush(point);
      return;
    }

    // Gizmo drag
    if (this.isDraggingGizmo) { this.handleGizmoDrag(e); return; }

    const pos = this.getGroundPos(e);
    if (!pos) return;
    if (this.ghostObject) {
      this.ghostObject.position.copy(pos);
      this.ghostObject.rotation.y = THREE.MathUtils.degToRad(this.currentRotation);
    }
    if (this.isMovingSelected && this.selectedObject) {
      this.selectedObject.position.copy(pos);
      this.updateGizmoPosition();
      this.syncData(this.selectedObject);
    }
  }

  private onClick(e: MouseEvent) {
    if (e.button !== 0) return;
    if (this.isDraggingGizmo) return;
    if (this.terrainMode) return;
    if (this.selectedObjectType && this.ghostObject) { this.placeObject(); return; }
    if (this.isMovingSelected) { this.stopMovingSelected(); return; }
    this.trySelect(e);
  }

  // === PLACE ===
  private placeObject() {
    if (!this.selectedObjectType || !this.ghostObject) return;
    const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const obj = this.selectedObjectType.create();
    pruneShadowCasters(obj);
    obj.position.copy(this.ghostObject.position);
    obj.rotation.y = THREE.MathUtils.degToRad(this.currentRotation);
    obj.userData.editorId = id;
    obj.userData.objectType = this.selectedObjectType.id;
    this.scene.add(obj);
    obj.updateWorldMatrix(true, true);
    this.placedObjects.set(id, obj);
    const data: PlacedObject = {
      id, type: this.selectedObjectType.id,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: this.currentRotation,
    };
    if (this.selectedObjectType.id === 'terminal' || this.selectedObjectType.id === 'camera') {
      data.groupId = 1;
    }
    if (this.selectedObjectType.id === 'camera' || this.selectedObjectType.id === 'bars_door_rental' || this.selectedObjectType.id === 'storage_locker') {
      data.label = '';
    }
    this.placedObjectsData.push(data);
    this.pushHistory({ action: 'place', data: { ...data } });
    this.onObjectPlaced?.(this.placedObjectsData.length);
  }

  // === SELECT ===
  private trySelect(e: MouseEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.editorCamera.camera);

    const objs: THREE.Object3D[] = [];
    this.placedObjects.forEach(o => objs.push(o));
    const hits = this.raycaster.intersectObjects(objs, true).filter(h => {
      let o: THREE.Object3D | null = h.object;
      while (o) { if (o.userData.isGizmo) return false; o = o.parent; }
      return true;
    });

    const shiftHeld = e.shiftKey;

    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && !obj.userData.editorId) obj = obj.parent;
      if (!obj.userData.editorId) { this.clearSelection(); return; }

      const id = obj.userData.editorId as string;

      if (shiftHeld) {
        // Multi-select toggle
        if (this.selectedObjects.has(id)) {
          this.selectedObjects.delete(id);
          this.setHighlight(obj as THREE.Group, false);
          this.highlightedObjects.delete(id);
        } else {
          this.selectedObjects.add(id);
          this.setHighlight(obj as THREE.Group, true);
          this.highlightedObjects.add(id);
        }
        // Set primary selected
        if (this.selectedObjects.size > 0) {
          const lastId = Array.from(this.selectedObjects).pop()!;
          this.selectedObject = this.placedObjects.get(lastId) || null;
          const data = this.placedObjectsData.find(d => d.id === lastId) || null;
          this.onSelectionChanged?.(data);
        }
        this.onMultiSelectChanged?.(this.selectedObjects.size);
      } else {
        // Single select
        this.clearHighlights();
        this.selectedObjects.clear();
        this.selectedObject = obj as THREE.Group;
        this.selectedObjects.add(id);
        this.setHighlight(obj as THREE.Group, true);
        this.highlightedObjects.add(id);
        this.createGizmo();
        const data = this.placedObjectsData.find(d => d.id === id) || null;
        this.onSelectionChanged?.(data);
        this.onMultiSelectChanged?.(1);
      }
    } else {
      this.clearSelection();
    }
    this.stopMovingSelected();
  }

  private clearSelection() {
    this.clearHighlights();
    this.removeGizmo();
    this.selectedObject = null;
    this.selectedObjects.clear();
    this.onSelectionChanged?.(null);
    this.onMultiSelectChanged?.(0);
  }

  private clearHighlights() {
    this.highlightedObjects.forEach(id => {
      const obj = this.placedObjects.get(id);
      if (obj) this.setHighlight(obj, false);
    });
    this.highlightedObjects.clear();
  }

  private setHighlight(obj: THREE.Group, on: boolean) {
    obj.traverse(c => {
      if (c instanceof THREE.Mesh) {
        const m = c.material as THREE.MeshStandardMaterial;
        m.emissive = new THREE.Color(on ? 0x004400 : 0x000000);
        m.emissiveIntensity = on ? 0.3 : 0;
      }
    });
  }

  private syncData(obj: THREE.Group) {
    const d = this.placedObjectsData.find(d => d.id === obj.userData.editorId);
    if (!d) return;
    d.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
    d.rotation = Math.round(THREE.MathUtils.radToDeg(obj.rotation.y));
    d.rotationX = Math.round(THREE.MathUtils.radToDeg(obj.rotation.x));
    d.rotationZ = Math.round(THREE.MathUtils.radToDeg(obj.rotation.z));
    this.onSelectionChanged?.({ ...d });
  }

  // === GIZMO (3 оси — XYZ стрелки) ===
  private createGizmo() {
    this.removeGizmo();
    if (!this.selectedObject) return;

    this.gizmoGroup = new THREE.Group();
    this.gizmoGroup.userData.isGizmo = true;

    const makeArrow = (color: number, axis: 'x' | 'y' | 'z') => {
      const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.8 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8), mat);
      shaft.position.y = 1.25;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 8), mat);
      head.position.y = 2.7;

      const group = new THREE.Group();
      group.add(shaft, head);

      if (axis === 'x') group.rotation.z = -Math.PI / 2;
      if (axis === 'z') group.rotation.x = Math.PI / 2;

      group.traverse(c => {
        c.userData.isGizmo = true;
        c.userData.gizmoAxis = axis;
      });

      return group;
    };

    this.gizmoGroup.add(makeArrow(0xff4444, 'x')); // красная — X
    this.gizmoGroup.add(makeArrow(0x44ff44, 'y')); // зелёная — Y (высота)
    this.gizmoGroup.add(makeArrow(0x4444ff, 'z')); // синяя — Z

    this.gizmoGroup.position.copy(this.selectedObject.position);
    this.gizmoGroup.renderOrder = 9999;
    this.scene.add(this.gizmoGroup);
  }

  private removeGizmo() {
    if (this.gizmoGroup) {
      this.scene.remove(this.gizmoGroup);
      this.gizmoGroup = null;
    }
  }

  private updateGizmoPosition() {
    if (this.gizmoGroup && this.selectedObject) {
      this.gizmoGroup.position.copy(this.selectedObject.position);
    }
  }

  private tryGizmoClick(e: MouseEvent): boolean {
    if (!this.gizmoGroup || !this.selectedObject) return false;

    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.editorCamera.camera);

    const gizmoParts: THREE.Object3D[] = [];
    this.gizmoGroup.traverse(c => { if (c instanceof THREE.Mesh) gizmoParts.push(c); });

    const hits = this.raycaster.intersectObjects(gizmoParts, false);
    if (hits.length > 0) {
      const hit = hits[0].object;
      this.activeGizmoAxis = hit.userData.gizmoAxis || null;
      this.isDraggingGizmo = true;
      this.gizmoDragStart.copy(hits[0].point);
      return true;
    }
    return false;
  }

  private handleGizmoDrag(e: MouseEvent) {
    if (!this.isDraggingGizmo || !this.activeGizmoAxis || !this.selectedObject || !this.gizmoGroup) return;

    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.editorCamera.camera);

    const axis = this.activeGizmoAxis;

    if (axis === 'y') {
      // Y — от движения мыши вверх/вниз
      const dy = -(e.movementY || 0) * 0.03;
      this.selectedObject.position.y += dy;
      if (this.gridEnabled) this.selectedObject.position.y = Math.round(this.selectedObject.position.y * 4) / 4;
    } else {
      // X и Z — проецируем луч на горизонтальную плоскость
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.selectedObject.position.y);
      const pt = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(plane, pt)) {
        if (axis === 'x') {
          this.selectedObject.position.x = this.gridEnabled ? Math.round(pt.x) : pt.x;
        } else {
          this.selectedObject.position.z = this.gridEnabled ? Math.round(pt.z) : pt.z;
        }
      }
    }

    this.updateGizmoPosition();
    this.syncData(this.selectedObject);
  }

  private stopGizmoDrag() {
    this.isDraggingGizmo = false;
    this.activeGizmoAxis = null;
  }

  // === DELETE ===
  deleteObject(id: string) {
    const obj = this.placedObjects.get(id);
    if (!obj) return;
    const data = this.placedObjectsData.find(d => d.id === id);
    if (data) this.pushHistory({ action: 'delete', data: { ...data } });
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry.dispose();
      }
    });
    this.scene.remove(obj);
    this.placedObjects.delete(id);
    this.placedObjectsData = this.placedObjectsData.filter(d => d.id !== id);
    this.highlightedObjects.delete(id);
    this.selectedObjects.delete(id);
    if (this.selectedObject === obj) {
      this.selectedObject = null;
      this.onSelectionChanged?.(null);
    }
    this.onObjectPlaced?.(this.placedObjectsData.length);
    this.onMultiSelectChanged?.(this.selectedObjects.size);
  }

  deleteSelected() {
    if (this.selectedObjects.size > 1) {
      const ids = Array.from(this.selectedObjects);
      const multiData = ids.map(id => this.placedObjectsData.find(d => d.id === id)!).filter(Boolean);
      this.pushHistory({ action: 'multi_delete', data: multiData[0], multiData: multiData.map(d => ({ ...d })) });
      for (const id of ids) {
        const obj = this.placedObjects.get(id);
        if (obj) {
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              child.geometry.dispose();
            }
          });
          this.scene.remove(obj);
        }
        this.placedObjects.delete(id);
        this.placedObjectsData = this.placedObjectsData.filter(d => d.id !== id);
      }
      this.selectedObjects.clear();
      this.highlightedObjects.clear();
      this.selectedObject = null;
      this.onSelectionChanged?.(null);
      this.onObjectPlaced?.(this.placedObjectsData.length);
      this.onMultiSelectChanged?.(0);
    } else if (this.selectedObject) {
      this.deleteObject(this.selectedObject.userData.editorId);
    }
  }

  // === DUPLICATE ===
  duplicateSelected() {
    const ids = this.selectedObjects.size > 0 ? Array.from(this.selectedObjects) : (this.selectedObject ? [this.selectedObject.userData.editorId] : []);
    if (ids.length === 0) return;

    this.clearHighlights();
    this.selectedObjects.clear();

    for (const srcId of ids) {
      const srcData = this.placedObjectsData.find(d => d.id === srcId);
      if (!srcData) continue;
      const objType = getObjectById(srcData.type);
      if (!objType) continue;

      const newId = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const newObj = objType.create();
      pruneShadowCasters(newObj);
      newObj.position.set(srcData.position.x + 1, srcData.position.y, srcData.position.z + 1);
      newObj.rotation.y = THREE.MathUtils.degToRad(srcData.rotation);
      newObj.userData.editorId = newId;
      newObj.userData.objectType = srcData.type;
      this.scene.add(newObj);
      this.placedObjects.set(newId, newObj);

      const newData: PlacedObject = {
        id: newId, type: srcData.type,
        position: { x: newObj.position.x, y: newObj.position.y, z: newObj.position.z },
        rotation: srcData.rotation,
      };
      this.placedObjectsData.push(newData);
      this.pushHistory({ action: 'place', data: { ...newData } });

      this.selectedObjects.add(newId);
      this.setHighlight(newObj, true);
      this.highlightedObjects.add(newId);
      this.selectedObject = newObj;
    }

    const lastData = this.placedObjectsData.find(d => d.id === this.selectedObject?.userData.editorId);
    this.onSelectionChanged?.(lastData ? { ...lastData } : null);
    this.onObjectPlaced?.(this.placedObjectsData.length);
    this.onMultiSelectChanged?.(this.selectedObjects.size);
  }

  // === ROTATE ===
  rotateSelected() {
    if (!this.selectedObject) return;
    const prevData = { ...this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId)! };
    this.selectedObject.rotation.y += Math.PI / 2;
    const data = this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId);
    if (data) {
      data.rotation = (data.rotation + 90) % 360;
      this.pushHistory({ action: 'rotate', data: { ...data }, prevData });
      this.onSelectionChanged?.({ ...data });
    }
  }

  updateSelectedGroupId(groupId: number) {
    if (!this.selectedObject) return;
    const data = this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId);
    if (data) {
      data.groupId = groupId;
      this.onSelectionChanged?.({ ...data });
    }
  }

  updateSelectedLabel(label: string) {
    if (!this.selectedObject) return;
    const data = this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId);
    if (data) {
      data.label = label;
      this.onSelectionChanged?.({ ...data });
    }
  }

  scaleSelected(delta: number) {
    if (!this.selectedObject) return;
    const currentScale = this.selectedObject.scale.x;
    const newScale = Math.max(0.1, Math.min(5, currentScale + delta));
    this.selectedObject.scale.setScalar(newScale);
    const data = this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId);
    if (data) {
      data.scale = Math.round(newScale * 10) / 10;
      this.onSelectionChanged?.({ ...data });
    }
  }

  rotateSelectedAxis(axis: 'x' | 'z', degrees: number) {
    if (!this.selectedObject) return;
    const prevData = { ...this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId)! };
    const rad = THREE.MathUtils.degToRad(degrees);
    if (axis === 'x') this.selectedObject.rotation.x += rad;
    else this.selectedObject.rotation.z += rad;
    const data = this.placedObjectsData.find(d => d.id === this.selectedObject!.userData.editorId);
    if (data) {
      if (axis === 'x') data.rotationX = Math.round(THREE.MathUtils.radToDeg(this.selectedObject.rotation.x));
      else data.rotationZ = Math.round(THREE.MathUtils.radToDeg(this.selectedObject.rotation.z));
      this.pushHistory({ action: 'rotate', data: { ...data }, prevData });
      this.onSelectionChanged?.({ ...data });
    }
  }

  // === UNDO / REDO ===
  private pushHistory(entry: HistoryEntry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
    this.notifyHistory();
  }

  private notifyHistory() {
    this.onHistoryChanged?.(this.undoStack.length > 0, this.redoStack.length > 0);
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;

    switch (entry.action) {
      case 'place':
        this.removeById(entry.data.id);
        break;
      case 'delete':
        this.recreateObject(entry.data);
        break;
      case 'multi_delete':
        if (entry.multiData) {
          for (const d of entry.multiData) this.recreateObject(d);
        }
        break;
      case 'move':
      case 'rotate':
        if (entry.prevData) {
          this.updateObjectTransform(entry.prevData);
        }
        break;
    }
    this.redoStack.push(entry);
    this.notifyHistory();
    this.onObjectPlaced?.(this.placedObjectsData.length);
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;

    switch (entry.action) {
      case 'place':
        this.recreateObject(entry.data);
        break;
      case 'delete':
        this.removeById(entry.data.id);
        break;
      case 'multi_delete':
        if (entry.multiData) {
          for (const d of entry.multiData) this.removeById(d.id);
        }
        break;
      case 'move':
      case 'rotate':
        this.updateObjectTransform(entry.data);
        break;
    }
    this.undoStack.push(entry);
    this.notifyHistory();
    this.onObjectPlaced?.(this.placedObjectsData.length);
  }

  private removeById(id: string) {
    const obj = this.placedObjects.get(id);
    if (obj) {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          child.geometry.dispose();
        }
      });
      this.scene.remove(obj);
    }
    this.placedObjects.delete(id);
    this.placedObjectsData = this.placedObjectsData.filter(d => d.id !== id);
    this.selectedObjects.delete(id);
    this.highlightedObjects.delete(id);
    if (this.selectedObject?.userData.editorId === id) {
      this.selectedObject = null;
      this.onSelectionChanged?.(null);
    }
  }

  private recreateObject(data: PlacedObject) {
    const t = getObjectById(data.type);
    if (!t) return;
    const obj = t.create();
    pruneShadowCasters(obj);
    obj.position.set(data.position.x, data.position.y, data.position.z);
    obj.rotation.y = THREE.MathUtils.degToRad(data.rotation);
    obj.userData.editorId = data.id;
    obj.userData.objectType = data.type;
    this.scene.add(obj);
    this.placedObjects.set(data.id, obj);
    this.placedObjectsData.push({ ...data });
  }

  private updateObjectTransform(data: PlacedObject) {
    const obj = this.placedObjects.get(data.id);
    if (!obj) return;
    obj.position.set(data.position.x, data.position.y, data.position.z);
    obj.rotation.y = THREE.MathUtils.degToRad(data.rotation);
    if (data.rotationX !== undefined) obj.rotation.x = THREE.MathUtils.degToRad(data.rotationX);
    if (data.rotationZ !== undefined) obj.rotation.z = THREE.MathUtils.degToRad(data.rotationZ);
    const d = this.placedObjectsData.find(x => x.id === data.id);
    if (d) {
      d.position = { ...data.position };
      d.rotation = data.rotation;
      d.rotationX = data.rotationX;
      d.rotationZ = data.rotationZ;
    }
  }

  // === KEYS ===
  private onKeyDown(e: KeyboardEvent) {
    // Don't handle shortcuts when user is typing in an input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    // Ctrl combos
    if (e.ctrlKey || e.metaKey) {
      switch (e.code) {
        case 'KeyZ': e.preventDefault(); this.undo(); return;
        case 'KeyY': e.preventDefault(); this.redo(); return;
        case 'KeyD': e.preventDefault(); this.duplicateSelected(); return;
      }
    }

    switch (e.code) {
      case 'KeyR':
        if (this.selectedObject && !this.selectedObjectType) this.rotateSelected();
        else {
          this.currentRotation = (this.currentRotation + 90) % 360;
          if (this.ghostObject) this.ghostObject.rotation.y = THREE.MathUtils.degToRad(this.currentRotation);
        }
        break;
      case 'KeyF':
        // Наклон вперёд (ось X)
        if (this.selectedObject && !this.selectedObjectType) this.rotateSelectedAxis('x', 15);
        break;
      case 'KeyV':
        // Наклон вбок (ось Z)
        if (this.selectedObject && !this.selectedObjectType) this.rotateSelectedAxis('z', 15);
        break;
      case 'Delete': case 'Backspace': this.deleteSelected(); break;
      case 'Escape': this.stopMovingSelected(); this.selectObjectType(null); if (this.terrainMode) this.setTerrainMode(false); break;
      case 'KeyG': this.toggleGrid(); break;
      case 'KeyM': this.toggleMoveSelected(); break;
      case 'PageUp': this.adjustPlacementY(0.5); break;
      case 'PageDown': this.adjustPlacementY(-0.5); break;
      case 'Equal': case 'NumpadAdd':
        if (this.selectedObject) this.scaleSelected(0.1);
        break;
      case 'Minus': case 'NumpadSubtract':
        if (this.selectedObject) this.scaleSelected(-0.1);
        break;
      case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
      case 'Digit5': case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
        if (!e.ctrlKey) this.selectObjectByIndex(parseInt(e.code.replace('Digit', '')) - 1);
        break;
    }
  }

  // === IO ===
  exportMap(): MapData {
    const waterZones: WaterZoneData[] = [];
    for (const obj of this.placedObjectsData) {
      if (obj.type === 'water_shallow' || obj.type === 'water_deep') {
        waterZones.push({
          id: obj.id,
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          width: 4,
          depth: 4,
          type: obj.type === 'water_shallow' ? 'shallow' : 'deep',
        });
      }
    }
    return { name: 'Untitled Map', version: 1, objects: [...this.placedObjectsData], terrain: this.terrainSystem.exportData(), waterZones };
  }
  exportJSON(): string { return JSON.stringify(this.exportMap(), null, 2); }
  importMap(data: MapData) {
    this.clearMap();
    if (data.terrain) {
      this.terrainSystem.importData(data.terrain);
    }
    for (const d of data.objects) {
      const t = getObjectById(d.type);
      if (!t) continue;
      const obj = t.create();
      pruneShadowCasters(obj);
      obj.position.set(d.position.x, d.position.y, d.position.z);
      obj.rotation.y = THREE.MathUtils.degToRad(d.rotation);
      if (d.rotationX) obj.rotation.x = THREE.MathUtils.degToRad(d.rotationX);
      if (d.rotationZ) obj.rotation.z = THREE.MathUtils.degToRad(d.rotationZ);
      if (d.scale) obj.scale.setScalar(d.scale);
      obj.userData.editorId = d.id;
      obj.userData.objectType = d.type;
      this.scene.add(obj);
      obj.updateWorldMatrix(true, true);
      this.placedObjects.set(d.id, obj);
      this.placedObjectsData.push({ ...d });
    }
    this.onObjectPlaced?.(this.placedObjectsData.length);
  }
  importJSON(json: string) {
    try { this.importMap(JSON.parse(json) as MapData); return true; }
    catch { return false; }
  }
  clearMap() {
    this.placedObjects.forEach(o => this.scene.remove(o));
    this.placedObjects.clear();
    this.placedObjectsData = [];
    this.clearSelection();
    this.stopMovingSelected();
    this.undoStack = [];
    this.redoStack = [];
    this.notifyHistory();
    this.terrainSystem.resetTerrain();
    this.onObjectPlaced?.(0);
  }

  // === RENDER ===
  private onResize() {
    this.editorCamera.camera.aspect = window.innerWidth / window.innerHeight;
    this.editorCamera.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  private boundAnimate = this.animate.bind(this);
  start() { this.isRunning = true; this.prevTime = performance.now(); this.animate(); }
  stop() { this.isRunning = false; }
  private animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(this.boundAnimate);
    const t = performance.now();
    const d = Math.min((t - this.prevTime) / 1000, 0.1);
    this.prevTime = t;
    this.editorCamera.update(d);
    this.renderer.render(this.scene, this.editorCamera.camera);
  }
  getObjectTypes() { return getAllEditorObjectTypes(); }
  dispose() { this.stop(); this.terrainSystem.dispose(); this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement); this.renderer.dispose(); this.editorCamera.dispose(); }
}
