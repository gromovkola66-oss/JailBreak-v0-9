import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  applyToRenderer,
  getQuality,
  getRendererOptions,
  setQuality,
  type Quality,
} from '../game/QualitySettings';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenEditor: () => void;
}

// === 3D SCENE - prison corridor with guard ===
const MenuScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const W = containerRef.current.clientWidth, H = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    scene.fog = new THREE.FogExp2(0x080810, 0.035);

    const renderer = new THREE.WebGLRenderer(getRendererOptions());
    renderer.setSize(W, H);
    applyToRenderer(renderer);
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);

    // Materials
    const conc = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9 });
    const concD = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.95 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.3, metalness: 0.9 });
    const metalL = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.7 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75 });
    const guardBlue = new THREE.MeshStandardMaterial({ color: 0x1e3a6e, roughness: 0.8 });
    const guardBlueD = new THREE.MeshStandardMaterial({ color: 0x162e58, roughness: 0.85 });
    const bootsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.85 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x3a3020, roughness: 0.8 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4513, roughness: 0.8 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 1.2 });
    const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.6 });
    const puddle = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.6 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0xcccc44, roughness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 });
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.9 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.7, metalness: 0.4 });
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xccaa22, roughness: 0.5, metalness: 0.6 });
    const holsterMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.85 });
    const beretMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, roughness: 0.8 });
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
    const steamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });

    // Helpers
    const bx = (w: number, h: number, d: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
    };
    const cy = (r: number, h: number, m: THREE.Material, seg = 10) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
      mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
    };
    const ps = (mesh: THREE.Object3D, x: number, y: number, z: number) => {
      mesh.position.set(x, y, z); return mesh;
    };

    // === LIGHTING ===
    scene.add(new THREE.AmbientLight(0x1a1a2e, 0.4));
    const lamps: THREE.PointLight[] = [];
    for (let z = -8; z <= 8; z += 4) {
      const lampMesh = bx(0.5, 0.04, 0.15, lampMat);
      ps(lampMesh, 0, 3.8, z);
      scene.add(lampMesh);
      const pl = new THREE.PointLight(0xffeecc, 0.8, 8);
      pl.position.set(0, 3.6, z);
      pl.castShadow = true;
      pl.shadow.mapSize.set(512, 512);
      scene.add(pl);
      lamps.push(pl);
    }

    // Directional light for bar shadows
    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    dirLight.position.set(2, 3.5, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 10;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    scene.add(dirLight);

    // Red emergency light in the distance
    const redLightMesh = bx(0.15, 0.15, 0.15, redLightMat);
    ps(redLightMesh, 1.8, 3.5, -8);
    scene.add(redLightMesh);
    const redPL = new THREE.PointLight(0xff2200, 0.4, 6);
    redPL.position.set(1.8, 3.5, -8);
    scene.add(redPL);

    // === CORRIDOR ===
    const floor = bx(4, 0.1, 20, concD);
    floor.receiveShadow = true;
    ps(floor, 0, 0, 0);
    scene.add(floor);
    scene.add(ps(bx(4, 0.15, 20, concD), 0, 4, 0));
    scene.add(ps(bx(0.3, 4, 20, conc), -2.15, 2, 0));
    scene.add(ps(bx(0.3, 4, 20, conc), 2.15, 2, 0));

    // Cell bars (left wall)
    for (let z = -6; z <= 6; z += 4) {
      scene.add(ps(bx(0.1, 3, 0.1, metal), -1.95, 1.6, z - 0.8));
      scene.add(ps(bx(0.1, 3, 0.1, metal), -1.95, 1.6, z + 0.8));
      scene.add(ps(bx(0.1, 0.1, 1.7, metal), -1.95, 3.1, z));
      for (let dz = -0.6; dz <= 0.6; dz += 0.25) {
        const bar = cy(0.02, 3, metal);
        bar.castShadow = true;
        ps(bar, -1.95, 1.6, z + dz);
        scene.add(bar);
      }
      for (const y of [0.5, 1.6, 2.7]) {
        scene.add(ps(bx(0.05, 0.05, 1.6, metalL), -1.95, y, z));
      }
      // Cell interiors
      scene.add(ps(bx(0.6, 0.15, 0.3, bedMat), -2.8, 0.3, z - 0.2));
      scene.add(ps(bx(0.6, 0.02, 0.3, whiteMat), -2.8, 0.38, z - 0.2));
      scene.add(ps(bx(0.15, 0.25, 0.15, whiteMat), -2.5, 0.15, z + 0.5));
      scene.add(ps(bx(0.4, 0.03, 0.15, wood), -2.8, 1.5, z + 0.4));
    }

    // Pipes on ceiling
    const pipe1 = cy(0.06, 20, pipeMat);
    pipe1.rotation.x = Math.PI / 2;
    ps(pipe1, 1.2, 3.85, 0);
    scene.add(pipe1);
    const pipe2 = cy(0.04, 20, pipeMat);
    pipe2.rotation.x = Math.PI / 2;
    ps(pipe2, -1.0, 3.9, 0);
    scene.add(pipe2);

    // Floor markings
    scene.add(ps(bx(0.08, 0.01, 18, new THREE.MeshStandardMaterial({ color: 0xccaa00, roughness: 0.7 })), 0, 0.06, 0));

    // Puddles
    scene.add(ps(bx(0.8, 0.005, 0.5, puddle), 0.5, 0.06, 2));
    scene.add(ps(bx(0.6, 0.005, 0.4, puddle), -0.3, 0.06, -4));
    scene.add(ps(bx(0.5, 0.005, 0.6, puddle), 0.8, 0.06, -7));

    // Warning signs on right wall
    scene.add(ps(bx(0.02, 0.3, 0.4, signMat), 2.0, 2.2, 3));
    scene.add(ps(bx(0.02, 0.2, 0.15, redLightMat), 2.0, 2.25, 3));
    // Bulletin board
    scene.add(ps(bx(0.02, 0.5, 0.7, new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.85 })), 2.0, 2.0, -2));
    scene.add(ps(bx(0.02, 0.08, 0.12, whiteMat), 2.0, 2.1, -1.85));
    scene.add(ps(bx(0.02, 0.08, 0.12, whiteMat), 2.0, 2.0, -2.1));
    scene.add(ps(bx(0.02, 0.08, 0.12, signMat), 2.0, 2.15, -2.15));

    // Security camera on ceiling
    const camGroup = new THREE.Group();
    camGroup.add(ps(bx(0.12, 0.08, 0.12, metal), 0, 0, 0));
    const camCyl = cy(0.04, 0.15, metal);
    camCyl.rotation.z = Math.PI / 2;
    ps(camCyl, 0.08, -0.04, 0);
    camGroup.add(camCyl);
    const camLens = cy(0.03, 0.04, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 }));
    camLens.rotation.z = Math.PI / 2;
    ps(camLens, 0.16, -0.04, 0);
    camGroup.add(camLens);
    ps(camGroup, 1.5, 3.9, 1);
    scene.add(camGroup);

    // Clock on wall
    const clockGroup = new THREE.Group();
    const clockFace = cy(0.15, 0.03, clockMat, 20);
    clockFace.rotation.x = Math.PI / 2;
    clockGroup.add(clockFace);
    const clockRim = cy(0.16, 0.04, metal, 20);
    clockRim.rotation.x = Math.PI / 2;
    ps(clockRim, 0, 0, -0.005);
    clockGroup.add(clockRim);
    const hourHand = bx(0.01, 0.08, 0.005, metal);
    ps(hourHand, 0, 0.03, 0.02);
    clockGroup.add(hourHand);
    const minHand = bx(0.008, 0.11, 0.005, metal);
    ps(minHand, 0, 0.04, 0.02);
    minHand.rotation.z = 1.2;
    clockGroup.add(minHand);
    ps(clockGroup, 2.0, 2.8, 5);
    clockGroup.rotation.y = -Math.PI / 2;
    scene.add(clockGroup);

    // Dust particles
    const dustCount = 300;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 4;
      dustPositions[i * 3 + 1] = Math.random() * 3.8;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.005;
      dustVelocities[i * 3 + 1] = Math.random() * 0.008 + 0.002;
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMtl = new THREE.PointsMaterial({ color: 0xccccaa, size: 0.02, transparent: true, opacity: 0.4, sizeAttenuation: true, depthWrite: false });
    const dustPoints = new THREE.Points(dustGeo, dustMtl);
    scene.add(dustPoints);

    // Steam particles from pipes
    const steamParticles: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const steam = bx(0.04, 0.04, 0.04, steamMat);
      steam.castShadow = false;
      steam.receiveShadow = false;
      ps(steam, 1.2 + (Math.random() - 0.5) * 0.1, 3.5 + Math.random() * 0.4, (Math.random() - 0.5) * 8);
      scene.add(steam);
      steamParticles.push(steam);
    }

    // === GUARD (improved voxel-style) ===
    const guard = new THREE.Group();

    // Head
    const head = bx(0.2, 0.26, 0.22, skin);
    ps(head, 0, 1.78, 0);
    guard.add(head);

    // Beret
    const beret = cy(0.14, 0.06, beretMat, 8);
    ps(beret, 0, 1.94, 0);
    guard.add(beret);
    const beretTop = cy(0.11, 0.03, beretMat, 8);
    ps(beretTop, 0.02, 1.97, 0);
    guard.add(beretTop);

    // Neck
    guard.add(ps(bx(0.1, 0.06, 0.1, skin), 0, 1.62, 0));

    // Torso (chest) - for breathing animation
    const chest = bx(0.36, 0.3, 0.22, guardBlue);
    ps(chest, 0, 1.42, 0);
    guard.add(chest);

    // Lower torso
    guard.add(ps(bx(0.34, 0.2, 0.2, guardBlueD), 0, 1.17, 0));

    // Badge on chest
    guard.add(ps(bx(0.08, 0.06, 0.01, badgeMat), 0.1, 1.48, 0.115));

    // Shoulders
    guard.add(ps(bx(0.12, 0.04, 0.1, guardBlueD), -0.2, 1.55, 0));
    guard.add(ps(bx(0.12, 0.04, 0.1, guardBlueD), 0.2, 1.55, 0));

    // Belt
    guard.add(ps(bx(0.37, 0.06, 0.23, beltMat), 0, 1.05, 0));
    guard.add(ps(bx(0.06, 0.05, 0.02, badgeMat), 0, 1.05, 0.12));

    // Holster
    guard.add(ps(bx(0.06, 0.12, 0.08, holsterMat), 0.2, 0.98, 0.05));

    // Legs
    const legL = bx(0.14, 0.5, 0.16, pantsMat);
    ps(legL, -0.09, 0.73, 0);
    guard.add(legL);
    const legR = bx(0.14, 0.5, 0.16, pantsMat);
    ps(legR, 0.09, 0.73, 0);
    guard.add(legR);

    // Boots
    const bootL = bx(0.12, 0.15, 0.22, bootsMat);
    ps(bootL, -0.09, 0.42, 0.02);
    guard.add(bootL);
    const bootR = bx(0.12, 0.15, 0.22, bootsMat);
    ps(bootR, 0.09, 0.42, 0.02);
    guard.add(bootR);

    // Arms
    const armL = bx(0.1, 0.38, 0.1, guardBlue);
    ps(armL, -0.25, 1.35, 0);
    guard.add(armL);
    const armR = bx(0.1, 0.38, 0.1, guardBlue);
    ps(armR, 0.25, 1.35, 0);
    guard.add(armR);

    // Hands
    const handL = bx(0.07, 0.1, 0.07, skin);
    ps(handL, -0.25, 1.12, 0.1);
    guard.add(handL);
    const handR = bx(0.07, 0.1, 0.07, skin);
    ps(handR, 0.25, 1.12, 0.15);
    guard.add(handR);

    // AK rifle
    const ak = new THREE.Group();
    ak.add(ps(bx(0.03, 0.03, 0.55, metal), 0, 0, -0.15));
    ak.add(ps(bx(0.06, 0.07, 0.24, metal), 0, -0.01, 0.05));
    ak.add(ps(bx(0.04, 0.14, 0.06, metal), 0, -0.09, 0.08));
    ak.add(ps(bx(0.05, 0.06, 0.22, wood), 0, -0.02, 0.28));
    ak.add(ps(bx(0.04, 0.04, 0.16, wood), 0, -0.02, -0.2));
    ak.add(ps(bx(0.02, 0.02, 0.06, metal), 0, 0, -0.45));
    ak.position.set(0.12, 1.18, 0.18);
    ak.rotation.set(0.2, 0.05, -0.7);
    guard.add(ak);

    guard.position.set(0.5, 0.05, 5);
    scene.add(guard);

    // === ANIMATION STATE ===
    let time = 0;
    let animId = 0;

    // Patrol state
    const patrolPoints = [-6, 6];
    let patrolTarget = 1;
    let guardZ = 5;
    let guardFacing = 0;
    let facingTarget = 0;
    let idlePauseTimer = 0;
    let isIdle = false;
    let lookAroundPhase = 0;
    let walkSpeed = 0;
    const maxWalkSpeed = 1.8;

    // Helpers
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smoothstep = (t: number) => t * t * (3 - 2 * t);

    // Camera state
    let camAngle = 0;
    let camCurrentY = 1.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = 0.016;
      time += delta;

      // === GUARD PATROL LOGIC ===
      const targetZ = patrolPoints[patrolTarget];
      const distToTarget = Math.abs(guardZ - targetZ);

      if (isIdle) {
        idlePauseTimer -= delta;
        lookAroundPhase += delta * 1.5;
        walkSpeed = lerp(walkSpeed, 0, 0.1);

        if (idlePauseTimer <= 0) {
          isIdle = false;
          patrolTarget = patrolTarget === 0 ? 1 : 0;
          facingTarget = patrolTarget === 1 ? 0 : Math.PI;
        }
      } else {
        if (distToTarget < 0.1) {
          isIdle = true;
          idlePauseTimer = 2.0 + Math.random() * 1.5;
          lookAroundPhase = 0;
          walkSpeed = lerp(walkSpeed, 0, 0.15);
        } else {
          const dir = targetZ > guardZ ? 1 : -1;
          facingTarget = dir > 0 ? 0 : Math.PI;
          const accelZone = Math.min(distToTarget / 2, 1.0);
          const targetSpeed = maxWalkSpeed * smoothstep(Math.min(accelZone, 1));
          walkSpeed = lerp(walkSpeed, targetSpeed, 0.05);
          guardZ += dir * walkSpeed * delta;
        }
      }

      // Smooth facing
      let facingDiff = facingTarget - guardFacing;
      if (facingDiff > Math.PI) facingDiff -= Math.PI * 2;
      if (facingDiff < -Math.PI) facingDiff += Math.PI * 2;
      guardFacing += facingDiff * 0.06;
      guard.rotation.y = guardFacing;
      guard.position.z = guardZ;

      // Walk cycle
      const walkPhase = time * 6;
      const walkAmount = Math.min(walkSpeed / maxWalkSpeed, 1);

      // Head bob
      guard.position.y = 0.05 + Math.abs(Math.sin(walkPhase)) * 0.015 * walkAmount;

      // Body lean
      const leanDir = facingTarget === 0 ? 1 : -1;
      guard.rotation.x = walkAmount * 0.03 * leanDir;

      // Breathing
      const breathe = Math.sin(time * 2.0) * 0.005;
      chest.scale.y = 1 + breathe * 2;
      chest.position.y = 1.42 + breathe;

      // Weight shift when idle
      if (isIdle) {
        guard.position.x = 0.5 + Math.sin(time * 0.8) * 0.01;
      } else {
        guard.position.x = 0.5;
      }

      // Head animation
      if (isIdle) {
        head.rotation.y = Math.sin(lookAroundPhase) * 0.4;
        head.rotation.x = Math.sin(lookAroundPhase * 0.7) * 0.08;
      } else {
        head.rotation.y = lerp(head.rotation.y, Math.sin(time * 0.9) * 0.08, 0.05);
        head.rotation.x = lerp(head.rotation.x, 0, 0.05);
      }

      // Leg swing
      const legSwing = Math.sin(walkPhase) * 0.4 * walkAmount;
      legL.rotation.x = -legSwing;
      legR.rotation.x = legSwing;
      bootL.rotation.x = -legSwing * 0.3;
      bootR.rotation.x = legSwing * 0.3;
      bootL.position.y = 0.42 + Math.max(0, Math.sin(walkPhase)) * 0.02 * walkAmount;
      bootR.position.y = 0.42 + Math.max(0, -Math.sin(walkPhase)) * 0.02 * walkAmount;

      // Arm swing
      const armSwing = Math.sin(walkPhase) * 0.2 * walkAmount;
      armL.rotation.x = armSwing + 0.15;
      armR.rotation.x = -armSwing * 0.5 + 0.2;
      handL.position.z = 0.1 + armSwing * 0.02;
      handR.position.z = 0.15 - armSwing * 0.01;

      // Weapon sway
      ak.rotation.z = -0.7 + Math.sin(walkPhase * 0.5) * 0.03 * walkAmount;
      ak.rotation.x = 0.2 + Math.sin(walkPhase) * 0.02 * walkAmount;
      ak.position.y = 1.18 + Math.sin(walkPhase) * 0.005 * walkAmount;

      // === CAMERA ===
      camAngle += delta * 0.12;
      const camRadius = 2.8 + Math.sin(camAngle * 0.3) * 0.4;
      const camX = Math.sin(camAngle) * camRadius * 0.4;
      const camZ = guardZ + 2.5 + Math.cos(camAngle) * camRadius * 0.6;
      const camTargetY = 1.0 + Math.sin(camAngle * 0.2) * 0.1;
      camCurrentY = lerp(camCurrentY, camTargetY, 0.02);
      camera.position.set(camX, camCurrentY, camZ);
      camera.lookAt(new THREE.Vector3(0.5, 1.3, guardZ));

      // === LAMP FLICKER ===
      for (let i = 0; i < lamps.length; i++) {
        lamps[i].intensity = 0.8 + Math.sin(time * (6 + i * 3)) * 0.06 + Math.sin(time * (11 + i * 7)) * 0.04;
      }
      redPL.intensity = 0.4 + Math.sin(time * 8) * 0.1 + Math.sin(time * 13) * 0.05;

      // === DUST ===
      const posAttr = dustGeo.getAttribute("position");
      for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] += dustVelocities[i * 3];
        dustPositions[i * 3 + 1] += dustVelocities[i * 3 + 1];
        dustPositions[i * 3 + 2] += dustVelocities[i * 3 + 2];
        if (dustPositions[i * 3 + 1] > 3.8) {
          dustPositions[i * 3 + 1] = 0.1;
          dustPositions[i * 3] = (Math.random() - 0.5) * 4;
          dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
        }
      }
      posAttr.needsUpdate = true;

      // === STEAM ===
      for (let i = 0; i < steamParticles.length; i++) {
        const sp = steamParticles[i];
        sp.position.y += 0.003;
        if (sp.position.y > 3.95) {
          sp.position.y = 3.5;
          sp.position.x = 1.2 + (Math.random() - 0.5) * 0.1;
          sp.position.z = (Math.random() - 0.5) * 8;
        }
        sp.scale.setScalar(1 + (sp.position.y - 3.5) * 2);
      }

      renderer.render(scene, camera);
      if (!containerRef.current) cancelAnimationFrame(animId);
    };
    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth, h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

// === SETTINGS ===
const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const [volume, setVolume] = useState(50);
  const [quality, setQualityState] = useState<Quality>(() => getQuality());

  const changeQuality = (q: Quality) => {
    setQualityState(q);
    setQuality(q);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 rounded-2xl p-8 w-[550px] max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.3s ease' }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Настройки</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
        </div>

        {/* Sound */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-blue-400 mb-4">Звук</h3>
          <div className="bg-black/30 rounded-xl p-4 space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 text-sm">Громкость</span>
                <span className="text-white font-mono text-sm">{volume}%</span>
              </div>
              <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </div>

        {/* Graphics */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-green-400 mb-4">Графика</h3>
          <div className="bg-black/30 rounded-xl p-4 space-y-3">
            <span className="text-gray-300 text-sm block">Качество</span>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map(q => (
                <button key={q} onClick={() => changeQuality(q)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all ${quality === q
                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/50 scale-105'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                  {q === 'low' ? 'Низкое' : q === 'medium' ? 'Среднее' : 'Высокое'}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              {quality === 'low' && (
                <>Для слабых ноутбуков: тени отключены, без сглаживания, без ретины.
                <span className="text-yellow-400"> Применится при следующем запуске игры/редактора.</span></>
              )}
              {quality === 'medium' && (
                <>Сбалансированный режим: тени 1024², умеренная плотность пикселей.
                <span className="text-yellow-400"> Применится при следующем запуске игры/редактора.</span></>
              )}
              {quality === 'high' && (
                <>Максимум: тени 2048², ретина-плотность.
                <span className="text-yellow-400"> Применится при следующем запуске игры/редактора.</span></>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Управление</h3>
          <div className="bg-black/30 rounded-xl p-4 space-y-2">
            {[
              ['WASD', 'Движение'], ['Мышь', 'Обзор'], ['SPACE', 'Прыжок'],
              ['ЛКМ', 'Атака / Стрельба'], ['E', 'Подобрать / Взаимодействие'],
              ['G', 'Выбросить оружие'], ['R', 'Перезарядка'], ['M', 'Меню охраны'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0">
                <kbd className="bg-gray-700 text-yellow-300 px-3 py-1 rounded text-xs font-mono">{key}</kbd>
                <span className="text-gray-300 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02]">
          Закрыть
        </button>
      </div>
    </div>
  );
};

// === SERVERS ===
const ServersPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
    <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 rounded-2xl p-8 w-[500px] shadow-2xl text-center"
      onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.3s ease' }}>
      <h2 className="text-2xl font-bold text-white mb-2">Серверы</h2>
      <p className="text-gray-400 mb-6">Мультиплеер находится в разработке</p>
      <div className="bg-black/30 rounded-xl p-6 mb-6">
        <p className="text-gray-500 text-sm">Список серверов появится здесь в будущих обновлениях.</p>
      </div>
      <button onClick={onClose} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02]">
        Понятно
      </button>
    </div>
  </div>
);

// === MAIN MENU ===
export const MainMenu = ({ onStartGame, onOpenEditor }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const buttons = [
    { id: 'play', label: 'Начать игру', color: 'from-blue-600 to-blue-800', hoverColor: 'from-blue-500 to-blue-700', action: onStartGame },
    { id: 'servers', label: 'Серверы', color: 'from-purple-600 to-purple-800', hoverColor: 'from-purple-500 to-purple-700', action: () => setShowServers(true) },
    { id: 'editor', label: 'Редактор карт', color: 'from-emerald-600 to-emerald-800', hoverColor: 'from-emerald-500 to-emerald-700', action: onOpenEditor },
    { id: 'settings', label: 'Настройки', color: 'from-gray-600 to-gray-800', hoverColor: 'from-gray-500 to-gray-700', action: () => setShowSettings(true) },
    { id: 'exit', label: 'Выход', color: 'from-red-700 to-red-900', hoverColor: 'from-red-600 to-red-800', action: () => window.close() },
  ];

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden relative">

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-blue-500/5"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-12 z-10">
        <div className="text-center" style={{ animation: 'slideDown 0.8s ease' }}>
          <h1 className="text-7xl font-black tracking-wider mb-2" style={{ animation: 'titleGlow 3s ease-in-out infinite' }}>
            <span className="text-blue-400" style={{ textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>Jail</span>
            <span className="text-orange-400" style={{ textShadow: '0 0 30px rgba(249,115,22,0.5)' }}>Break</span>
          </h1>
          <p className="text-gray-500 text-sm tracking-[0.3em] uppercase" style={{ animation: 'fadeIn 1s ease 0.5s forwards', opacity: 0 }}>
            Версия 0.8
          </p>
        </div>
      </div>

      {/* Buttons (left half) */}
      <div className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center z-10">
        <div className="pl-16 pr-8 w-full max-w-md space-y-3">
          {buttons.map((btn, i) => (
            <button key={btn.id}
              onClick={btn.action}
              onMouseEnter={() => setHoveredBtn(btn.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{ animationDelay: `${0.3 + i * 0.1}s`, animation: 'fadeIn 0.5s ease forwards', opacity: 0 }}
              className={`w-full text-left px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer flex items-center gap-4 group
                bg-gradient-to-r ${hoveredBtn === btn.id ? btn.hoverColor : btn.color}
                ${hoveredBtn === btn.id ? 'translate-x-3 shadow-2xl scale-[1.03]' : 'shadow-lg'}
                border border-white/10 hover:border-white/25`}
            >
              <span className="text-white">{btn.label}</span>
              <span className={`ml-auto text-white/40 transition-all duration-300 ${hoveredBtn === btn.id ? 'text-white/80 translate-x-1' : ''}`}>
                →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3D Scene (right half) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 z-0">
        <MenuScene />
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-950 to-transparent pointer-events-none" />
      </div>

      {/* Modals */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showServers && <ServersPanel onClose={() => setShowServers(false)} />}

      {/* Animation styles */}
      <style>{`
        @keyframes titleGlow {
          0%, 100% { transform: translateY(0px); filter: brightness(1); }
          50% { transform: translateY(-3px); filter: brightness(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-25px) translateX(8px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
