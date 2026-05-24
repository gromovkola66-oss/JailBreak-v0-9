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
  onOpenEditor: () => void;
}

// === 3D SCENE - prison yard cutscene ===
const MenuScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const W = containerRef.current.clientWidth, H = containerRef.current.clientHeight;

    const scene = new THREE.Scene();

    // Sky gradient via Canvas texture
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 256;
    const ctx = skyCanvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(0.4, '#2a1040');
    grad.addColorStop(0.7, '#803820');
    grad.addColorStop(1.0, '#ff8030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    scene.background = skyTex;

    const renderer = new THREE.WebGLRenderer(getRendererOptions());
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    applyToRenderer(renderer);
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);

    // Shared materials
    const concMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.95 });
    const concDark = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.95 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xe86820, roughness: 0.8 });
    const orangeDark = new THREE.MeshStandardMaterial({ color: 0xc05818, roughness: 0.85 });
    const orangeCollar = new THREE.MeshStandardMaterial({ color: 0xd06020, roughness: 0.8 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.9 });
    const bootLace = new THREE.MeshStandardMaterial({ color: 0x888870, roughness: 0.8 });
    const tattooMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.8 });
    const buzzMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.85 });
    const yellowLine = new THREE.MeshStandardMaterial({ color: 0xccaa22, roughness: 0.7 });
    const whiteLine = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4020, roughness: 0.85 });

    // Helpers
    const bx = (w: number, h: number, d: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      return mesh;
    };
    const cy = (r: number, h: number, m: THREE.Material, seg = 8) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
      return mesh;
    };
    const ps = (mesh: THREE.Object3D, x: number, y: number, z: number) => {
      mesh.position.set(x, y, z); return mesh;
    };

    // === GROUND ===
    const ground = bx(30, 0.1, 30, concMat);
    ground.receiveShadow = true;
    ps(ground, 0, 0, 0);
    scene.add(ground);

    // Painted lines
    scene.add(ps(bx(0.08, 0.02, 12, yellowLine), -2, 0.06, -2));
    scene.add(ps(bx(0.08, 0.02, 12, yellowLine), 2, 0.06, -2));
    scene.add(ps(bx(6, 0.02, 0.08, whiteLine), 0, 0.06, 3));
    scene.add(ps(bx(4, 0.02, 0.06, whiteLine), 0, 0.06, -1));

    // Cracks/wear patches
    scene.add(ps(bx(1.2, 0.01, 0.8, concDark), 1, 0.06, 1));
    scene.add(ps(bx(0.7, 0.01, 1.5, concDark), -1.5, 0.06, -2));
    scene.add(ps(bx(0.9, 0.01, 0.6, concDark), 2, 0.06, -3));

    // === CHAIN-LINK FENCE ===
    const fenceZ = -4;
    const fencePosts: THREE.Mesh[] = [];
    for (let x = -3; x <= 3; x += 2) {
      const post = cy(0.04, 3, metalMat);
      post.castShadow = true;
      ps(post, x, 1.5, fenceZ);
      scene.add(post);
      fencePosts.push(post);

      // Top rail
      if (x < 3) {
        const rail = bx(2, 0.04, 0.04, metalMat);
        ps(rail, x + 1, 3, fenceZ);
        scene.add(rail);
        // Bottom rail
        const bRail = bx(2, 0.04, 0.04, metalMat);
        ps(bRail, x + 1, 0.1, fenceZ);
        scene.add(bRail);
      }

      // Vertical wires between posts
      if (x < 3) {
        for (let i = 1; i <= 4; i++) {
          const wire = cy(0.008, 2.8, metalMat, 4);
          ps(wire, x + i * 0.4, 1.5, fenceZ);
          scene.add(wire);
        }
        // Horizontal wires
        for (let hy = 1.0; hy <= 2.2; hy += 1.2) {
          const hWire = bx(2, 0.015, 0.015, metalMat);
          ps(hWire, x + 1, hy, fenceZ);
          scene.add(hWire);
        }
      }

      // Barbed wire on top
      if (x < 3) {
        for (let bw = 0; bw < 3; bw++) {
          const barb = bx(0.06, 0.06, 0.02, metalMat);
          barb.rotation.z = Math.PI / 4;
          ps(barb, x + 0.6 * bw + 0.3, 3.1, fenceZ);
          scene.add(barb);
        }
      }
    }

    // === GUARD TOWER ===
    const tower = new THREE.Group();
    // 4 legs
    for (const tx of [-1.2, 1.2]) {
      for (const tz of [-1.2, 1.2]) {
        const leg = cy(0.15, 6, metalMat);
        ps(leg, tx, 3, tz);
        tower.add(leg);
      }
    }
    // Platform
    const platform = bx(3, 0.2, 3, concMat);
    ps(platform, 0, 6, 0);
    tower.add(platform);
    // Cabin
    const cabin = bx(2, 2.5, 2, concDark);
    ps(cabin, 0, 7.35, 0);
    tower.add(cabin);
    // Roof
    const roof = bx(2.4, 0.15, 2.4, metalMat);
    ps(roof, 0, 8.7, 0);
    tower.add(roof);
    tower.position.set(0, 0, -10);
    scene.add(tower);

    // === BENCH ===
    const bench = new THREE.Group();
    bench.add(ps(bx(1.2, 0.06, 0.3, woodMat), 0, 0.45, 0));
    bench.add(ps(bx(0.08, 0.45, 0.08, woodMat), -0.5, 0.22, 0));
    bench.add(ps(bx(0.08, 0.45, 0.08, woodMat), 0.5, 0.22, 0));
    bench.position.set(3, 0, 1);
    scene.add(bench);

    // Debris
    scene.add(ps(bx(0.15, 0.08, 0.12, concDark), -2.5, 0.04, 0.5));
    scene.add(ps(bx(0.1, 0.06, 0.1, concDark), 2.8, 0.03, -1));
    scene.add(ps(bx(0.2, 0.05, 0.08, concDark), -1, 0.03, 2));

    // === PRISONER CHARACTER ===
    const prisoner = new THREE.Group();

    // Head
    const head = bx(0.2, 0.24, 0.2, skinMat);
    ps(head, 0, 1.63, 0);
    prisoner.add(head);
    // Nose
    prisoner.add(ps(bx(0.04, 0.06, 0.04, skinMat), 0, 1.6, 0.12));
    // Ears
    prisoner.add(ps(bx(0.04, 0.06, 0.04, skinMat), -0.12, 1.63, 0));
    prisoner.add(ps(bx(0.04, 0.06, 0.04, skinMat), 0.12, 1.63, 0));
    // Buzz cut
    prisoner.add(ps(bx(0.2, 0.06, 0.2, buzzMat), 0, 1.77, 0));

    // Neck
    prisoner.add(ps(bx(0.08, 0.06, 0.08, skinMat), 0, 1.48, 0));

    // Torso
    const chest = bx(0.38, 0.4, 0.22, orangeMat);
    ps(chest, 0, 1.24, 0);
    prisoner.add(chest);
    // Collar
    prisoner.add(ps(bx(0.3, 0.04, 0.18, orangeCollar), 0, 1.46, 0));
    // Pocket patches
    prisoner.add(ps(bx(0.08, 0.08, 0.01, orangeDark), -0.08, 1.3, 0.115));
    prisoner.add(ps(bx(0.08, 0.08, 0.01, orangeDark), 0.08, 1.3, 0.115));

    // Belt
    prisoner.add(ps(bx(0.4, 0.06, 0.24, beltMat), 0, 1.02, 0));

    // Arms
    const armL = bx(0.1, 0.4, 0.1, orangeMat);
    ps(armL, -0.26, 1.24, 0);
    prisoner.add(armL);
    const armR = bx(0.1, 0.4, 0.1, orangeMat);
    ps(armR, 0.26, 1.24, -0.15);
    armR.rotation.x = -0.8;
    prisoner.add(armR);

    // Tattoo patches on arms
    prisoner.add(ps(bx(0.04, 0.06, 0.02, tattooMat), -0.26, 1.15, 0.06));
    prisoner.add(ps(bx(0.03, 0.05, 0.02, tattooMat), -0.26, 1.28, 0.06));
    prisoner.add(ps(bx(0.04, 0.05, 0.02, tattooMat), 0.26, 1.15, 0.06));

    // Hands
    const handL = bx(0.08, 0.1, 0.06, skinMat);
    ps(handL, -0.26, 1.0, 0.02);
    prisoner.add(handL);
    // Left fingers
    for (let f = 0; f < 4; f++) {
      const finger = bx(0.015, 0.06, 0.015, skinMat);
      ps(finger, -0.26 + (f - 1.5) * 0.018, 0.93, 0.02);
      prisoner.add(finger);
    }

    // Right hand gripping fence
    const handR = bx(0.08, 0.1, 0.06, skinMat);
    ps(handR, 0.26, 1.42, -0.38);
    prisoner.add(handR);
    // Right fingers (gripping)
    for (let f = 0; f < 4; f++) {
      const finger = bx(0.015, 0.06, 0.015, skinMat);
      finger.rotation.x = 1.2;
      ps(finger, 0.26 + (f - 1.5) * 0.018, 1.44, -0.41);
      prisoner.add(finger);
    }

    // Legs
    const legL = bx(0.14, 0.45, 0.16, orangeDark);
    ps(legL, -0.1, 0.72, 0);
    prisoner.add(legL);
    const legR = bx(0.14, 0.45, 0.16, orangeDark);
    ps(legR, 0.1, 0.72, 0.04);
    legR.rotation.x = -0.05;
    prisoner.add(legR);

    // Boots
    const bootL = bx(0.13, 0.15, 0.22, bootMat);
    ps(bootL, -0.1, 0.42, 0.02);
    prisoner.add(bootL);
    const bootR = bx(0.13, 0.15, 0.22, bootMat);
    ps(bootR, 0.1, 0.42, 0.06);
    prisoner.add(bootR);
    // Boot laces
    prisoner.add(ps(bx(0.06, 0.015, 0.01, bootLace), -0.1, 0.46, 0.12));
    prisoner.add(ps(bx(0.06, 0.015, 0.01, bootLace), -0.1, 0.49, 0.12));
    prisoner.add(ps(bx(0.06, 0.015, 0.01, bootLace), 0.1, 0.46, 0.16));
    prisoner.add(ps(bx(0.06, 0.015, 0.01, bootLace), 0.1, 0.49, 0.16));

    // Pose: slight lean forward
    prisoner.rotation.x = 0.05;
    prisoner.position.set(0, 0.05, -3.5);
    scene.add(prisoner);

    // === SEARCHLIGHT ===
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, -3);
    scene.add(spotTarget);
    const spotLight = new THREE.SpotLight(0xffffff, 2, 30, 0.4, 0.5);
    spotLight.position.set(0, 8.5, -10);
    spotLight.target = spotTarget;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(512, 512);
    scene.add(spotLight);

    // Visible light cone (semi-transparent)
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.04, side: THREE.DoubleSide });
    const coneGeo = new THREE.ConeGeometry(2.5, 8, 12, 1, true);
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    ps(coneMesh, 0, 4.5, -10);
    coneMesh.rotation.x = Math.PI;
    scene.add(coneMesh);

    // === LIGHTING ===
    // Warm dusk sun
    const sunLight = new THREE.DirectionalLight(0xff8844, 0.7);
    sunLight.position.set(5, 1, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(512, 512);
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -2;
    scene.add(sunLight);

    // Cold blue ambient
    scene.add(new THREE.AmbientLight(0x334466, 0.3));

    // Tower point light (warm flicker)
    const towerLight = new THREE.PointLight(0xffaa44, 0.3, 15);
    towerLight.position.set(0, 7.5, -10);
    scene.add(towerLight);

    // === DUST PARTICLES ===
    const dustCount = 150;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 10;
      dustPositions[i * 3 + 1] = Math.random() * 4;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.003;
      dustVelocities[i * 3 + 1] = Math.random() * 0.006 + 0.002;
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMtl = new THREE.PointsMaterial({ color: 0xddcc88, size: 0.03, transparent: true, opacity: 0.5, sizeAttenuation: true, depthWrite: false });
    const dustPoints = new THREE.Points(dustGeo, dustMtl);
    scene.add(dustPoints);

    // === ANIMATION ===
    let time = 0;
    let animId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms to avoid jumps
      lastTime = now;
      time += delta;

      // Breathing
      const breathe = Math.sin(time * 2) * 0.004;
      chest.scale.y = 1 + breathe;
      chest.position.y = 1.24 + breathe * 0.5;

      // Head turn
      head.rotation.y = Math.sin(time * 0.4) * 0.15;

      // Weight shift
      prisoner.position.x = Math.sin(time * 0.6) * 0.005;

      // Right hand micro-adjustment
      handR.scale.x = 1 + Math.sin(time * 3) * 0.02;
      handR.position.y = 1.42 + Math.sin(time * 2.5) * 0.003;

      // Searchlight sweep
      const slAngle = time * (Math.PI * 2 / 12);
      spotTarget.position.x = Math.cos(slAngle) * 5;
      spotTarget.position.z = -3 + Math.sin(slAngle) * 5;
      coneMesh.position.x = Math.cos(slAngle) * 1.5;
      coneMesh.rotation.z = Math.sin(slAngle) * 0.3;

      // Tower light flicker
      towerLight.intensity = 0.3 + Math.sin(time * 5) * 0.1 + Math.sin(time * 11) * 0.05;

      // Dust particles
      const posAttr = dustGeo.getAttribute('position');
      for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] += dustVelocities[i * 3];
        dustPositions[i * 3 + 1] += dustVelocities[i * 3 + 1];
        dustPositions[i * 3 + 2] += dustVelocities[i * 3 + 2];
        if (dustPositions[i * 3 + 1] > 4.5) {
          dustPositions[i * 3 + 1] = 0.1;
          dustPositions[i * 3] = (Math.random() - 0.5) * 10;
          dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        }
      }
      posAttr.needsUpdate = true;

      // Camera orbit
      const camPeriod = 30;
      const camAngle = (time / camPeriod) * Math.PI * 2;
      const camRadius = 4.5;
      const camX = Math.sin(camAngle) * camRadius;
      const camZ = -3.5 + Math.cos(camAngle) * camRadius;
      const camY = 1.5 + Math.sin(camAngle * 0.5) * 0.3;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(new THREE.Vector3(0, 1.2, -3.5));

      renderer.render(scene, camera);
      if (!containerRef.current) cancelAnimationFrame(animId);
    };
    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth, h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      skyTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)' }} />
    </div>
  );
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
export const MainMenu = ({ onOpenEditor }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const buttons = [
    { id: 'editor', label: 'Редактор карт', color: 'from-emerald-600 to-emerald-800', hoverColor: 'from-emerald-500 to-emerald-700', action: onOpenEditor },
    { id: 'servers', label: 'Серверы', color: 'from-purple-600 to-purple-800', hoverColor: 'from-purple-500 to-purple-700', action: () => setShowServers(true) },
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
            Версия 1.1
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
