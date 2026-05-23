import * as THREE from 'three';

export interface CellDoorPosition {
  cellIndex: number;
  position: THREE.Vector3;
}

export interface PrisonMapDetailedOptions {
  shadows?: boolean;
  shadowMapSize?: number;
}

export class PrisonMapDetailed {
  public group: THREE.Group;
  public colliders: THREE.Box3[] = [];
  public cellDoorPositions: CellDoorPosition[] = [];

  // ОБЩИЕ МАТЕРИАЛЫ (переиспользуются!)
  private mats: Record<string, THREE.MeshStandardMaterial>;
  private options: Required<PrisonMapDetailedOptions>;

  constructor(options: PrisonMapDetailedOptions = {}) {
    this.group = new THREE.Group();
    this.options = {
      shadows: options.shadows ?? true,
      shadowMapSize: options.shadowMapSize ?? 1024,
    };

    // Создаём все материалы ОДИН раз
    this.mats = {
      concrete:   new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.85 }),
      concDark:   new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.85 }),
      floor:      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }),
      floorDark:  new THREE.MeshStandardMaterial({ color: 0x6d6d6d, roughness: 0.9 }),
      floorRed:   new THREE.MeshStandardMaterial({ color: 0x7a5a5a, roughness: 0.9 }),
      floorYard:  new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.95 }),
      metal:      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.3, metalness: 0.8 }),
      metalLight: new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.3, metalness: 0.7 }),
      metalBlue:  new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.3, metalness: 0.7 }),
      metalRust:  new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.5, metalness: 0.5 }),
      wood:       new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 }),
      mattress:   new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.9 }),
      pillow:     new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 }),
      blanket:    new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
      warning:    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 }),
      danger:     new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 }),
      white:      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
      mirror:     new THREE.MeshStandardMaterial({ color: 0xaabbcc, roughness: 0.1, metalness: 0.9 }),
      sky:        new THREE.MeshStandardMaterial({ color: 0x87ceeb, roughness: 1 }),
      book1:      new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9 }),
      book2:      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.9 }),
      book3:      new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 }),
      ammo:       new THREE.MeshStandardMaterial({ color: 0x5a5a3a, roughness: 0.8 }),
      vest:       new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.8 }),
      armoryWall: new THREE.MeshStandardMaterial({ color: 0x8a7a7a, roughness: 0.85 }),
      glow:       new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 0.8 }),
    };

    this.buildMap();
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ===
  
  private box(x: number, y: number, z: number, w: number, h: number, d: number, mat: string, _collider = false) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mats[mat]);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.group.add(m);
    // Always create collider - compute directly from known position and size
    const halfW = w / 2, halfH = h / 2, halfD = d / 2;
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(x - halfW, y - halfH, z - halfD),
      new THREE.Vector3(x + halfW, y + halfH, z + halfD)
    ));
    return m;
  }

  private cyl(x: number, y: number, z: number, rt: number, rb: number, h: number, mat: string) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), this.mats[mat]);
    m.position.set(x, y, z);
    m.castShadow = true;
    this.group.add(m);
    return m;
  }

  private light(x: number, y: number, z: number, intensity = 1, dist = 12) {
    this.box(x, y, z, 0.8, 0.08, 0.25, 'metalLight');
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.18), this.mats['glow']);
    g.position.set(x, y - 0.07, z);
    this.group.add(g);

    const l = new THREE.PointLight(0xffffee, intensity, dist);
    l.position.set(x, y - 0.2, z);
    // Тени только у нескольких ключевых ламп
    l.castShadow = false;
    this.group.add(l);
  }

  // === КАМЕРА ===
  private buildCell(i: number, cx: number, cz: number) {
    const w = 4, d = 5, h = 4;

    // Пол, потолок
    this.box(cx, -0.15, cz, w, 0.3, d, 'floorDark');
    this.box(cx, h + 0.15, cz, w, 0.3, d, 'concDark');

    // Стены
    this.box(cx - w/2 - 0.15, h/2, cz, 0.3, h, d, 'concrete', true);
    this.box(cx, h/2, cz - d/2 - 0.15, w, h, 0.3, 'concrete', true);
    if (i < 3) this.box(cx, h/2, cz + d/2 + 0.15, w - 0.5, h, 0.3, 'concrete', true);

    // === ДВУХЪЯРУСНАЯ КОЙКА ===
    for (const dx of [-0.9, 0.9]) {
      for (const dz of [-0.9, 0.9]) {
        this.box(cx + dx, 1.1, cz - 1.5 + dz, 0.06, 2.2, 0.06, 'metal');
      }
    }
    // Перекладины
    for (const y of [0.8, 2.2]) {
      this.box(cx, y, cz - 2.3, 1.75, 0.05, 0.05, 'metal');
      this.box(cx, y, cz - 0.7, 1.75, 0.05, 0.05, 'metal');
    }
    // Нижняя койка
    this.box(cx, 0.5, cz - 1.5, 1.75, 0.08, 1.55, 'metal', true);
    this.box(cx, 0.6, cz - 1.5, 1.6, 0.12, 1.5, 'mattress');
    this.box(cx, 0.7, cz - 2.1, 0.6, 0.1, 0.3, 'pillow');
    this.box(cx, 0.62, cz - 0.9, 1.4, 0.08, 0.8, 'blanket');
    // Верхняя койка
    this.box(cx, 1.7, cz - 1.5, 1.75, 0.08, 1.55, 'metal', true);
    this.box(cx, 1.8, cz - 1.5, 1.6, 0.12, 1.5, 'mattress');
    this.box(cx, 1.9, cz - 2.1, 0.6, 0.1, 0.3, 'pillow');
    // Лестница
    this.box(cx + 1, 1, cz - 1.25, 0.04, 2, 0.04, 'metal');
    this.box(cx + 1, 1, cz - 1.75, 0.04, 2, 0.04, 'metal');
    for (let s = 0; s < 4; s++) this.box(cx + 1, 0.3 + s * 0.45, cz - 1.5, 0.04, 0.04, 0.5, 'metal');

    // === ТУАЛЕТ ===
    this.box(cx + 1.2, 0.22, cz + 1.5, 0.5, 0.44, 0.5, 'metalLight', true);
    this.box(cx + 1.2, 0.48, cz + 1.6, 0.44, 0.08, 0.35, 'metalLight');
    this.box(cx + 1.2, 0.65, cz + 1.82, 0.38, 0.35, 0.14, 'metalLight');

    // === РАКОВИНА ===
    this.box(cx + 1.3, 0.95, cz + 0.5, 0.45, 0.08, 0.35, 'metalLight');
    this.cyl(cx + 1.3, 1.12, cz + 0.65, 0.025, 0.025, 0.18, 'metalLight');
    this.box(cx + 1.45, 1.45, cz + 0.5, 0.02, 0.35, 0.28, 'mirror');

    // === СТОЛ + ТАБУРЕТ ===
    this.box(cx - 1.35, 0.85, cz + 0.5, 0.7, 0.05, 0.5, 'metalLight', true);
    this.box(cx - 1.05, 0.42, cz + 0.5, 0.05, 0.85, 0.05, 'metal');
    this.cyl(cx - 1.35, 0.52, cz + 1.2, 0.18, 0.18, 0.04, 'metalLight');
    this.cyl(cx - 1.35, 0.27, cz + 1.2, 0.03, 0.04, 0.5, 'metal');

    // === ПОЛКА С КНИГАМИ ===
    this.box(cx - 1.4, 1.6, cz - 0.5, 0.6, 0.04, 0.25, 'metalLight');
    this.box(cx - 1.5, 1.7, cz - 0.5, 0.08, 0.2, 0.15, 'book1');
    this.box(cx - 1.38, 1.68, cz - 0.5, 0.06, 0.16, 0.15, 'book2');
    this.box(cx - 1.28, 1.69, cz - 0.5, 0.07, 0.18, 0.15, 'book3');

    // === ВЕНТИЛЯЦИЯ ===
    this.box(cx, h - 0.3, cz - d/2 + 0.2, 0.6, 0.4, 0.1, 'metal');
    for (let j = 0; j < 5; j++) this.box(cx - 0.25 + j * 0.12, h - 0.3, cz - d/2 + 0.16, 0.02, 0.3, 0.02, 'metalLight');

    // === ОКНО С РЕШЁТКОЙ ===
    this.box(cx - 1.5, 3, cz, 0.3, 0.8, 1, 'sky');
    for (let j = 0; j < 4; j++) this.box(cx - 1.35, 3, cz - 0.35 + j * 0.23, 0.04, 0.8, 0.04, 'metal');
    this.box(cx - 1.35, 2.7, cz, 0.04, 0.04, 0.9, 'metal');
    this.box(cx - 1.35, 3.3, cz, 0.04, 0.04, 0.9, 'metal');

    // Номер камеры
    this.box(cx, 3.2, cz + d/2 - 0.6, 0.4, 0.3, 0.02, 'warning');
    
    // Царапины
    for (let j = 0; j < 5; j++) this.box(cx - 1.48 + j * 0.08, 1.5 + j * 0.06, cz + 1.8, 0.01, 0.15, 0.01, 'metal');

    // Свет
    this.light(cx, h - 0.2, cz, 0.8, 10);

    // Рама двери
    this.cellDoorPositions.push({ cellIndex: i, position: new THREE.Vector3(cx, 0, cz + d/2 - 0.5) });
    this.box(cx - w/2 + 0.85, h/2, cz + d/2 - 0.5, 0.15, h, 0.15, 'metal');
    this.box(cx + w/2 - 0.85, h/2, cz + d/2 - 0.5, 0.15, h, 0.15, 'metal');
    this.box(cx, h - 0.1, cz + d/2 - 0.5, w - 1.5, 0.2, 0.15, 'metal');
  }

  // === КОРИДОР К КАМЕРАМ ===
  private buildCellCorridor() {
    const cx = -9, w = 10, len = 26, h = 4;

    this.box(cx, -0.15, 0, w, 0.3, len, 'floor');
    this.box(cx, h + 0.15, 0, w, 0.3, len, 'concDark');

    this.box(cx, h/2, -len/2 - 0.15, w, h, 0.3, 'concrete', true);
    this.box(cx, h/2, len/2 + 0.15, w, h, 0.3, 'concrete', true);

    // Трубы
    this.cyl(cx - 2, h - 0.3, 0, 0.08, 0.08, len, 'metalRust');
    this.cyl(cx + 2, h - 0.3, 0, 0.06, 0.06, len, 'metalLight');
    for (let z = -10; z <= 10; z += 5) {
      this.box(cx - 2, h - 0.2, z, 0.2, 0.15, 0.1, 'metal');
      this.box(cx + 2, h - 0.2, z, 0.2, 0.15, 0.1, 'metal');
    }

    // Скамейки
    for (const z of [-8, 0, 8]) {
      this.box(cx + 4, 0.5, z, 0.5, 0.05, 2, 'metalLight', true);
      this.box(cx + 4, 0.25, z - 0.8, 0.4, 0.5, 0.05, 'metal');
      this.box(cx + 4, 0.25, z + 0.8, 0.4, 0.5, 0.05, 'metal');
    }

    this.box(cx + 4.85, 2, -5, 0.02, 0.6, 0.8, 'warning');
    this.box(cx + 4.85, 2, 5, 0.02, 0.6, 0.8, 'danger');

    for (let z = -10; z <= 10; z += 5) this.light(cx, h - 0.2, z);
  }

  // === ГЛАВНЫЙ КОРИДОР ===
  private buildMainCorridor() {
    const len = 30, w = 6, h = 4;

    this.box(0, -0.15, 0, w, 0.3, len, 'floor');
    this.box(0, h + 0.15, 0, w, 0.3, len, 'concDark');

    this.cyl(2, h - 0.25, 0, 0.1, 0.1, len, 'metalRust');

    // Стены
    this.box(-w/2 - 0.15, h/2, -13, 0.3, h, 4, 'concrete', true);
    this.box(w/2 + 0.15, h/2, -8.75, 0.3, h, 12.5, 'concrete', true);
    this.box(w/2 + 0.15, h/2, 10.75, 0.3, h, 8.5, 'concrete', true);
    this.box(0, h/2, -len/2 - 0.15, w, h, 0.3, 'concrete', true);
    this.box(0, h/2, len/2 + 0.15, w, h, 0.3, 'concrete', true);

    // Разметка
    this.box(0, 0.02, 0, 0.1, 0.01, len - 2, 'warning');

    // Огнетушитель
    this.cyl(2.7, 0.8, -12, 0.12, 0.12, 0.6, 'danger');
    this.box(2.85, 0.8, -12, 0.15, 0.3, 0.03, 'metal');

    // Камера наблюдения
    this.box(-2.5, h - 0.5, -10, 0.15, 0.15, 0.25, 'metal');
    this.cyl(-2.5, h - 0.7, -10.2, 0.05, 0.08, 0.15, 'metal');

    for (let z = -10; z <= 10; z += 5) this.light(0, h - 0.2, z);
  }

  // === ОРУЖЕЙНАЯ ===
  private buildArmory() {
    const ax = 8, az = 2, aw = 8, ad = 8, h = 4;

    this.box(ax, -0.15, az, aw, 0.3, ad, 'floorRed');
    this.box(ax, h + 0.15, az, aw, 0.3, ad, 'concDark');

    this.box(ax, h/2, az - ad/2 - 0.15, aw, h, 0.3, 'armoryWall', true);
    this.box(ax, h/2, az + ad/2 + 0.15, aw, h, 0.3, 'armoryWall', true);
    this.box(ax + aw/2 + 0.15, h/2, az, 0.3, h, ad, 'armoryWall', true);

    // Оружейные шкафы
    for (let j = 0; j < 3; j++) {
      const sz = az - 2 + j * 2;
      this.box(ax + 3, 1.2, sz, 0.4, 2.4, 0.8, 'metalBlue', true);
      this.box(ax + 2.75, 1.2, sz, 0.05, 2.2, 0.7, 'metalLight');
      this.box(ax + 2.7, 1.2, sz + 0.2, 0.03, 0.15, 0.03, 'metal');
      this.box(ax + 3.1, 2, sz, 0.08, 0.1, 0.6, 'metal');
      this.box(ax + 3.1, 1.5, sz, 0.08, 0.1, 0.6, 'metal');
    }

    // Стол
    this.box(ax - 1, 0.9, az, 2, 0.08, 3, 'wood', true);
    for (const dx of [-0.8, 0.8]) for (const dz of [-1.3, 1.3]) {
      this.box(ax - 1 + dx, 0.45, az + dz, 0.08, 0.9, 0.08, 'wood');
    }
    this.box(ax - 1.5, 1.1, az - 0.8, 0.5, 0.3, 0.4, 'ammo');
    this.box(ax - 0.8, 1.05, az + 0.5, 0.4, 0.2, 0.3, 'ammo');

    // Стеллаж
    this.box(ax - 3.5, 1.5, az, 0.4, 3, 3, 'metal', true);
    for (let y = 0.8; y <= 2.5; y += 0.6) this.box(ax - 3.3, y, az, 0.35, 0.05, 2.8, 'metalLight');
    for (let j = 0; j < 3; j++) this.cyl(ax - 3.2, 2.0, az - 1 + j, 0.15, 0.18, 0.2, 'metal');

    // Жилеты
    this.box(ax - 3.5, 3, az + 3.5, 1.5, 0.05, 0.05, 'metalLight');
    for (let j = 0; j < 3; j++) this.box(ax - 3.9 + j * 0.5, 2.3, az + 3.5, 0.35, 0.7, 0.15, 'vest');

    this.box(ax - 2, 3, az - ad/2 + 0.2, 1.5, 0.5, 0.05, 'danger');

    this.light(ax, h - 0.2, az, 1.2, 15);
  }

  // === ДВОР ===
  private buildYard() {
    const yx = -5, yz = -22, yw = 18, yd = 18, wh = 5;

    this.box(yx, -0.15, yz, yw, 0.3, yd, 'floorYard');

    this.box(yx - yw/2 - 0.15, wh/2, yz, 0.3, wh, yd, 'concrete', true);
    this.box(yx + yw/2 + 0.15, wh/2, yz, 0.3, wh, yd, 'concrete', true);
    this.box(yx, wh/2, yz - yd/2 - 0.15, yw, wh, 0.3, 'concrete', true);

    // Колючка
    for (let z = -8; z <= 8; z += 2) {
      this.cyl(yx - yw/2, wh + 0.2, yz + z, 0.1, 0.1, 0.05, 'metal');
      this.cyl(yx + yw/2, wh + 0.2, yz + z, 0.1, 0.1, 0.05, 'metal');
    }

    // Баскетбол
    this.cyl(yx - 5, 2.5, yz - 5, 0.12, 0.15, 5, 'metalLight');
    this.box(yx - 5, 4, yz - 4.7, 1.5, 1, 0.1, 'white');
    this.box(yx - 5, 4, yz - 4.65, 0.6, 0.5, 0.02, 'danger');

    // Скамейки
    for (let j = 0; j < 3; j++) {
      const bz = yz + 3 + j * 3;
      this.box(yx + 5, 0.5, bz, 2.5, 0.1, 0.5, 'wood', true);
      this.box(yx + 5.3, 1, bz, 0.1, 0.6, 0.5, 'wood');
      this.box(yx + 4, 0.25, bz, 0.08, 0.5, 0.08, 'metal');
      this.box(yx + 6, 0.25, bz, 0.08, 0.5, 0.08, 'metal');
    }

    // Турник
    this.cyl(yx, 1.5, yz, 0.06, 0.06, 3, 'metalLight');
    this.cyl(yx + 2, 1.5, yz, 0.06, 0.06, 3, 'metalLight');
    const bar = this.cyl(yx + 1, 2.8, yz, 0.04, 0.04, 2.2, 'metalLight');
    bar.rotation.z = Math.PI / 2;

    // Вышка
    const tx = yx + 7, tz = yz - 7;
    for (const [dx, dz] of [[-1,-1],[1,-1],[-1,1],[1,1]] as [number,number][]) {
      this.box(tx + dx, 3, tz + dz, 0.15, 6, 0.15, 'metal', true);
    }
    this.box(tx, 5.5, tz, 2.5, 0.1, 2.5, 'metalLight');
    this.box(tx, 6.3, tz - 1.2, 2.4, 0.8, 0.05, 'metal');
    this.box(tx, 6.3, tz + 1.2, 2.4, 0.8, 0.05, 'metal');
    this.box(tx - 1.2, 6.3, tz, 0.05, 0.8, 2.4, 'metal');
    this.box(tx + 1.2, 6.3, tz, 0.05, 0.8, 2.4, 'metal');
    this.box(tx, 7, tz, 3, 0.1, 3, 'metal');
    this.cyl(tx, 6.8, tz - 0.5, 0.2, 0.3, 0.4, 'warning');

    // Фонари
    for (const x of [-6, 6]) {
      this.cyl(yx + x, 2.5, yz + 5, 0.08, 0.1, 5, 'metal');
      this.light(yx + x, 5, yz + 5, 1, 15);
    }
  }

  // === СБОРКА ===
  private buildMap() {
    for (let i = 0; i < 4; i++) this.buildCell(i, -15, -10 + i * 6);
    this.buildCellCorridor();
    this.buildMainCorridor();
    this.buildArmory();
    this.buildYard();

    this.optimizeShadows();

    this.group.add(new THREE.AmbientLight(0x808080, 1.35));

    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(20, 30, 10);
    sun.castShadow = this.options.shadows;
    sun.shadow.mapSize.set(this.options.shadowMapSize, this.options.shadowMapSize);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -42;
    sun.shadow.camera.right = 42;
    sun.shadow.camera.top = 42;
    sun.shadow.camera.bottom = -42;
    sun.shadow.bias = -0.0012;
    this.group.add(sun);

    const fill = new THREE.DirectionalLight(0xffffee, 0.25);
    fill.position.set(-20, 10, -10);
    this.group.add(fill);
  }

  private optimizeShadows() {
    const box = new THREE.Box3();
    const size = new THREE.Vector3();

    this.group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      box.setFromObject(child);
      box.getSize(size);

      const areaXZ = size.x * size.z;
      const isLargeStructure = size.y > 1.5 || size.x > 2.5 || size.z > 2.5 || areaXZ > 3;
      const isMajorProp = size.y > 0.6 && (size.x > 0.18 || size.z > 0.18);
      const isThinDetail = size.x < 0.08 || size.y < 0.08 || size.z < 0.08;

      child.castShadow = !isThinDetail && (isLargeStructure || isMajorProp);
      child.receiveShadow = isLargeStructure || size.y < 0.4;
    });
  }
}
