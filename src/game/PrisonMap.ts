import * as THREE from 'three';

// Цвета для разных элементов (светлее)
const COLORS = {
  floor: 0x7a7a7a,
  ceiling: 0x6a6a6a,
  wall: 0x9b9b9b,
  wallAccent: 0x8a8a8a,
  cellBars: 0x4a4a4a,
  cellFloor: 0x6d6d6d,
  armoryFloor: 0x7a6a6a,
  armoryWall: 0x8a7a7a,
  door: 0x8b4513,
  metal: 0x90a0b0,
};

export interface CellDoorPosition {
  cellIndex: number;
  position: THREE.Vector3;
}

export class PrisonMap {
  public group: THREE.Group;
  public colliders: THREE.Box3[] = [];
  public cellDoorPositions: CellDoorPosition[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.buildMap();
  }

  private addWall(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: number = COLORS.wall
  ) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.8,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // Добавляем коллайдер
    const box = new THREE.Box3().setFromObject(mesh);
    this.colliders.push(box);

    return mesh;
  }

  private addFloor(
    x: number,
    z: number,
    width: number,
    depth: number,
    color: number = COLORS.floor
  ) {
    const geometry = new THREE.BoxGeometry(width, 0.5, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.9,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, -0.25, z);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  private addCeiling(x: number, z: number, width: number, depth: number) {
    const geometry = new THREE.BoxGeometry(width, 0.5, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS.ceiling,
      roughness: 0.9,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 4.25, z);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  

  private addLight(x: number, y: number, z: number) {
    // Лампа на потолке
    const lampGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.3);
    const lampMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffee,
      emissive: 0xffffaa,
      emissiveIntensity: 0.5
    });
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(x, y, z);
    this.group.add(lamp);

    // Точечный свет (без теней — экономия GPU)
    const light = new THREE.PointLight(0xffffee, 1, 15);
    light.position.set(x, y - 0.2, z);
    this.group.add(light);
  }

  private buildCells() {
    const cellWidth = 4;
    const cellDepth = 5;
    const cellCount = 4;

    for (let i = 0; i < cellCount; i++) {
      const cellX = -15;
      const cellZ = -10 + i * (cellDepth + 1);

      // Пол камеры
      this.addFloor(cellX, cellZ, cellWidth, cellDepth, COLORS.cellFloor);
      
      // Потолок камеры
      this.addCeiling(cellX, cellZ, cellWidth, cellDepth);

      // Левая стена
      this.addWall(cellX - cellWidth/2 - 0.25, 2, cellZ, 0.5, 4, cellDepth);
      
      // Задняя стена
      this.addWall(cellX, 2, cellZ - cellDepth/2 - 0.25, cellWidth, 4, 0.5);
      
      // Правая стена (между камерами)
      if (i < cellCount - 1) {
        this.addWall(cellX, 2, cellZ + cellDepth/2 + 0.25, cellWidth, 4, 0.5);
      }

      // Позиция для двери (вместо статичной решётки)
      this.cellDoorPositions.push({
        cellIndex: i,
        position: new THREE.Vector3(cellX, 0, cellZ + cellDepth/2 - 0.5)
      });
      
      // Рама двери (неподвижная часть)
      // Левый столб
      const leftPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3.5, 0.15),
        new THREE.MeshStandardMaterial({ color: COLORS.cellBars, metalness: 0.8 })
      );
      leftPost.position.set(cellX - cellWidth/2 + 0.75, 1.75, cellZ + cellDepth/2 - 0.5);
      this.group.add(leftPost);
      
      // Правый столб
      const rightPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3.5, 0.15),
        new THREE.MeshStandardMaterial({ color: COLORS.cellBars, metalness: 0.8 })
      );
      rightPost.position.set(cellX + cellWidth/2 - 0.75, 1.75, cellZ + cellDepth/2 - 0.5);
      this.group.add(rightPost);
      
      // Верхняя перекладина
      const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(cellWidth - 1.5, 0.15, 0.15),
        new THREE.MeshStandardMaterial({ color: COLORS.cellBars, metalness: 0.8 })
      );
      topFrame.position.set(cellX, 3.5, cellZ + cellDepth/2 - 0.5);
      this.group.add(topFrame);

      // === ДВУХЪЯРУСНАЯ КОЙКА ===
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.3, metalness: 0.8 });
      const mattressMat = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db });
      
      // Вертикальные стойки
      const poleGeo = new THREE.BoxGeometry(0.06, 2.2, 0.06);
      for (const dx of [-0.9, 0.9]) {
        for (const dz of [-0.9, 0.9]) {
          const pole = new THREE.Mesh(poleGeo, metalMat);
          pole.position.set(cellX + dx, 1.1, cellZ - 1.5 + dz);
          pole.castShadow = true;
          this.group.add(pole);
        }
      }
      
      // Нижняя койка
      const bedBase1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.8), metalMat);
      bedBase1.position.set(cellX, 0.5, cellZ - 1.5);
      this.group.add(bedBase1);
      this.colliders.push(new THREE.Box3().setFromObject(bedBase1));
      const mattress1 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.7), mattressMat);
      mattress1.position.set(cellX, 0.6, cellZ - 1.5);
      mattress1.castShadow = true;
      this.group.add(mattress1);
      const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.3), pillowMat);
      pillow1.position.set(cellX, 0.7, cellZ - 2.2);
      this.group.add(pillow1);
      
      // Верхняя койка
      const bedBase2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.8), metalMat);
      bedBase2.position.set(cellX, 1.7, cellZ - 1.5);
      this.group.add(bedBase2);
      this.colliders.push(new THREE.Box3().setFromObject(bedBase2));
      const mattress2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.7), mattressMat);
      mattress2.position.set(cellX, 1.8, cellZ - 1.5);
      mattress2.castShadow = true;
      this.group.add(mattress2);
      const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.3), pillowMat);
      pillow2.position.set(cellX, 1.9, cellZ - 2.2);
      this.group.add(pillow2);
      
      // Лестница
      for (let step = 0; step < 4; step++) {
        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), metalMat);
        stepMesh.position.set(cellX + 1, 0.4 + step * 0.4, cellZ - 1.5);
        this.group.add(stepMesh);
      }

      // === ТУАЛЕТ ===
      const toiletMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.6 });
      const toiletBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), toiletMat);
      toiletBase.position.set(cellX + 1.2, 0.2, cellZ + 1.5);
      toiletBase.castShadow = true;
      this.group.add(toiletBase);
      this.colliders.push(new THREE.Box3().setFromObject(toiletBase));
      const toiletSeat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.4), toiletMat);
      toiletSeat.position.set(cellX + 1.2, 0.45, cellZ + 1.55);
      this.group.add(toiletSeat);
      const toiletTank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.15), toiletMat);
      toiletTank.position.set(cellX + 1.2, 0.6, cellZ + 1.8);
      this.group.add(toiletTank);

      // === РАКОВИНА ===
      const sinkBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.35), toiletMat);
      sinkBase.position.set(cellX + 1.3, 0.9, cellZ + 0.5);
      this.group.add(sinkBase);
      // Кран
      const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), toiletMat);
      faucet.position.set(cellX + 1.3, 1.02, cellZ + 0.65);
      this.group.add(faucet);

      // === СТОЛ И ТАБУРЕТ ===
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.5), metalMat);
      tableTop.position.set(cellX - 1.3, 0.85, cellZ + 0.5);
      tableTop.castShadow = true;
      this.group.add(tableTop);
      const tableLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), metalMat);
      tableLeg.position.set(cellX - 1, 0.42, cellZ + 0.5);
      this.group.add(tableLeg);
      
      // Табурет
      const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), metalMat);
      stoolTop.position.set(cellX - 1.3, 0.52, cellZ + 1.2);
      stoolTop.castShadow = true;
      this.group.add(stoolTop);
      const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 8), metalMat);
      stoolLeg.position.set(cellX - 1.3, 0.25, cellZ + 1.2);
      this.group.add(stoolLeg);

      // Свет в камере
      this.addLight(cellX, 4, cellZ);
    }

    // Последняя стена
    this.addWall(-15, 2, -10 + cellCount * (cellDepth + 1) - 0.75, cellWidth, 4, 0.5);
  }

  private buildMainCorridor() {
    const corridorLength = 30;
    const corridorWidth = 6;

    // Пол коридора
    this.addFloor(0, 0, corridorWidth, corridorLength);
    
    // Потолок
    this.addCeiling(0, 0, corridorWidth, corridorLength);

    // === ЛЕВАЯ СТЕНА (со стороны камер) — с проходом ===
    // Камеры расположены от z=-10 до z=14 (4 камеры по 5 глубины + зазоры)
    // Проход к камерам: z от -11 до 15
    // Сегмент до камер (z от -15 до -11)
    this.addWall(-corridorWidth/2 - 0.25, 2, -13, 0.5, 4, 4);
    // Сегмент после камер (z от 15 до 15)
    // (пустой — стена коридора заканчивается)

    // === Коридор к камерам (соединяет основной коридор и камеры) ===
    const cellCorridorX = -9; // Центр между коридором(-3) и камерами(-15)
    const cellCorridorWidth = 10; // От x=-3 до x=-13
    const cellCorridorZ = 0; // Центр
    const cellCorridorLength = 26; // Длина

    // Пол коридора к камерам
    this.addFloor(cellCorridorX, cellCorridorZ, cellCorridorWidth, cellCorridorLength);
    
    // Потолок коридора к камерам
    this.addCeiling(cellCorridorX, cellCorridorZ, cellCorridorWidth, cellCorridorLength);
    
    // Верхняя стена коридора к камерам (z=-13)
    this.addWall(cellCorridorX, 2, -cellCorridorLength/2 - 0.25, cellCorridorWidth, 4, 0.5);
    
    // Нижняя стена коридора к камерам (z=13)
    this.addWall(cellCorridorX, 2, cellCorridorLength/2 + 0.25, cellCorridorWidth, 4, 0.5);

    // === ПРАВАЯ СТЕНА (со стороны оружейной) — с проходом ===
    // Сегмент 1: от z=-15 до z=-2.5 (до прохода)
    this.addWall(corridorWidth/2 + 0.25, 2, -8.75, 0.5, 4, 12.5);
    // Сегмент 2: от z=6.5 до z=15 (после прохода)
    this.addWall(corridorWidth/2 + 0.25, 2, 10.75, 0.5, 4, 8.5);

    // Торцевые стены основного коридора
    this.addWall(0, 2, -corridorLength/2 - 0.25, corridorWidth, 4, 0.5);
    this.addWall(0, 2, corridorLength/2 + 0.25, corridorWidth, 4, 0.5);

    // Освещение коридора
    this.addLight(0, 4, -10);
    this.addLight(0, 4, 0);
    this.addLight(0, 4, 10);
    
    // Освещение коридора к камерам
    this.addLight(-8, 4, -5);
    this.addLight(-8, 4, 5);
  }

  private buildArmory() {
    const armoryWidth = 8;
    const armoryDepth = 8;
    const armoryX = 8;
    const armoryZ = 2;

    // Пол оружейной
    this.addFloor(armoryX, armoryZ, armoryWidth, armoryDepth, COLORS.armoryFloor);
    
    // Потолок
    this.addCeiling(armoryX, armoryZ, armoryWidth, armoryDepth);

    // Стены
    this.addWall(armoryX, 2, armoryZ - armoryDepth/2 - 0.25, armoryWidth, 4, 0.5, COLORS.armoryWall);
    this.addWall(armoryX, 2, armoryZ + armoryDepth/2 + 0.25, armoryWidth, 4, 0.5, COLORS.armoryWall);
    this.addWall(armoryX + armoryWidth/2 + 0.25, 2, armoryZ, 0.5, 4, armoryDepth, COLORS.armoryWall);

    // Оружейные стойки
    for (let i = 0; i < 3; i++) {
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 2, 1.5),
        new THREE.MeshStandardMaterial({ color: COLORS.metal })
      );
      rack.position.set(armoryX + 2, 1, armoryZ - 2 + i * 2);
      rack.castShadow = true;
      this.group.add(rack);
      this.colliders.push(new THREE.Box3().setFromObject(rack));

      // "Оружие" на стойке
      const weapon = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.15, 1),
        new THREE.MeshStandardMaterial({ color: 0x2d2d2d })
      );
      weapon.position.set(armoryX + 2.3, 1.2, armoryZ - 2 + i * 2);
      this.group.add(weapon);
    }

    // Стол
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 3),
      new THREE.MeshStandardMaterial({ color: 0x5c4033 })
    );
    table.position.set(armoryX - 1, 0.9, armoryZ);
    table.castShadow = true;
    this.group.add(table);
    this.colliders.push(new THREE.Box3().setFromObject(table));

    // Ножки стола
    for (let dx of [-0.8, 0.8]) {
      for (let dz of [-1.3, 1.3]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.9, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x5c4033 })
        );
        leg.position.set(armoryX - 1 + dx, 0.45, armoryZ + dz);
        this.group.add(leg);
      }
    }

    // Свет
    this.addLight(armoryX, 4, armoryZ);

    // Табличка "ARMORY"
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xcc0000 })
    );
    sign.position.set(armoryX - 2, 3, armoryZ - armoryDepth/2 - 0.2);
    this.group.add(sign);
  }

  private buildYard() {
    const yardWidth = 15;
    const yardDepth = 15;
    const yardZ = -20;

    // Пол двора (бетон)
    this.addFloor(-5, yardZ, yardWidth, yardDepth, 0x555555);

    // Стены двора
    this.addWall(-5 - yardWidth/2 - 0.25, 2, yardZ, 0.5, 4, yardDepth);
    this.addWall(-5 + yardWidth/2 + 0.25, 2, yardZ, 0.5, 4, yardDepth);
    this.addWall(-5, 2, yardZ - yardDepth/2 - 0.25, yardWidth, 4, 0.5);

    // Небо (открытый верх - без потолка)

    // Баскетбольное кольцо
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
      new THREE.MeshStandardMaterial({ color: COLORS.metal })
    );
    pole.position.set(-8, 2, yardZ - 3);
    this.group.add(pole);

    const backboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    backboard.position.set(-8, 3.5, yardZ - 3);
    this.group.add(backboard);

    // Скамейки
    for (let i = 0; i < 2; i++) {
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.2, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x8b4513 })
      );
      bench.position.set(-2 + i * 4, 0.5, yardZ + 5);
      bench.castShadow = true;
      this.group.add(bench);
    }
  }

  private buildMap() {
    // Строим все части карты
    this.buildCells();
    this.buildMainCorridor();
    this.buildArmory();
    this.buildYard();

    // Глобальный свет (яркий)
    const ambientLight = new THREE.AmbientLight(0x808080, 1.2);
    this.group.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -40;
    directionalLight.shadow.camera.right = 40;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -40;
    directionalLight.shadow.bias = -0.001;
    this.group.add(directionalLight);
    
    // Дополнительный свет снизу для заполнения теней
    const fillLight = new THREE.DirectionalLight(0xffffee, 0.3);
    fillLight.position.set(-10, 5, -10);
    this.group.add(fillLight);
  }
}
