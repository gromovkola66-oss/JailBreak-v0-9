import * as THREE from 'three';

/**
 * Per-user graphics quality settings. Persisted in localStorage.
 *
 * Three presets: 'low' (integrated GPUs / weak laptops), 'medium' (default,
 * tuned for typical mid-range hardware) and 'high' (modern desktops).
 *
 * The 'low' preset turns off the dynamic shadow pass entirely — that is the
 * single biggest GPU cost in this game because the prison maps generate
 * thousands of detail meshes (every grout line, every locker handle is its
 * own mesh that participates in the shadow pass). On a machine reporting
 * ~12 FPS the dominant cost is shadow rendering plus high-DPI pixel work,
 * not the 3D scene itself.
 */

export type Quality = 'low' | 'medium' | 'high';

export interface QualityConfig {
  /** WebGLRenderer antialias flag — must be set at construction time. */
  antialias: boolean;
  /** Cap on devicePixelRatio. 1.0 disables high-DPI rendering. */
  pixelRatioCap: number;
  /** Master switch for the shadow pass. */
  shadowsEnabled: boolean;
  /** Square dimension of the shadow map, in texels. */
  shadowMapSize: number;
  /** Filter type. PCFSoft is highest quality, Basic is cheapest. */
  shadowType: THREE.ShadowMapType;
  /**
   * Meshes whose largest local-space dimension is below this threshold (m)
   * have their castShadow disabled. Drastically reduces shadow-pass cost
   * on prison maps, which are dominated by tiny decorative meshes (grout,
   * seams, dials, screws) that contribute nothing visible to the shadow.
   */
  shadowCasterMinSize: number;
  /** Scene fog. Cheap, but disabling on 'low' saves a per-fragment add. */
  fogEnabled: boolean;
}

const PRESETS: Record<Quality, QualityConfig> = {
  low: {
    antialias: false,
    pixelRatioCap: 1.0,
    shadowsEnabled: false,
    shadowMapSize: 0,
    shadowType: THREE.BasicShadowMap,
    shadowCasterMinSize: Number.POSITIVE_INFINITY, // all casters disabled anyway
    fogEnabled: false,
  },
  medium: {
    antialias: true,
    pixelRatioCap: 1.5,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    shadowType: THREE.PCFShadowMap, // hard edges but cheaper than PCFSoft
    shadowCasterMinSize: 0.3,
    fogEnabled: true,
  },
  high: {
    antialias: true,
    pixelRatioCap: 2.0,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    shadowType: THREE.PCFSoftShadowMap,
    shadowCasterMinSize: 0.1,
    fogEnabled: true,
  },
};

const STORAGE_KEY = 'jb_quality';
const DEFAULT_QUALITY: Quality = 'medium';

let cachedQuality: Quality | null = null;

export function getQuality(): Quality {
  if (cachedQuality !== null) return cachedQuality;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'low' || v === 'medium' || v === 'high') {
      cachedQuality = v;
      return v;
    }
  } catch {
    // localStorage may be unavailable (e.g. in a sandboxed iframe)
  }
  cachedQuality = DEFAULT_QUALITY;
  return DEFAULT_QUALITY;
}

export function setQuality(q: Quality): void {
  cachedQuality = q;
  try {
    localStorage.setItem(STORAGE_KEY, q);
  } catch {
    // ignore — non-persistent fallback is fine
  }
}

export function getConfig(): QualityConfig {
  return PRESETS[getQuality()];
}

/** Renderer construction options derived from the current preset. */
export function getRendererOptions(): THREE.WebGLRendererParameters {
  return {
    antialias: getConfig().antialias,
    powerPreference: 'high-performance',
  };
}

/**
 * Apply runtime renderer settings (those that don't require recreating the
 * renderer). Call once after constructing a WebGLRenderer.
 */
export function applyToRenderer(renderer: THREE.WebGLRenderer): void {
  const c = getConfig();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, c.pixelRatioCap));
  renderer.shadowMap.enabled = c.shadowsEnabled;
  renderer.shadowMap.type = c.shadowType;
}

/**
 * Configure a directional sun light according to the current preset.
 * `bounds` is the half-extent of the orthographic shadow camera frustum.
 * Pass a value large enough to cover the playable area.
 */
export function configureSunShadow(
  sun: THREE.DirectionalLight,
  bounds = 50,
  near = 1,
  far?: number
): void {
  const c = getConfig();
  sun.castShadow = c.shadowsEnabled;
  if (!c.shadowsEnabled) return;
  sun.shadow.mapSize.set(c.shadowMapSize, c.shadowMapSize);
  sun.shadow.camera.left = -bounds;
  sun.shadow.camera.right = bounds;
  sun.shadow.camera.top = bounds;
  sun.shadow.camera.bottom = -bounds;
  sun.shadow.camera.near = near;
  sun.shadow.camera.far = far ?? bounds * 4;
  sun.shadow.bias = -0.0012;
  sun.shadow.camera.updateProjectionMatrix();
}

/**
 * Walk a placed object's mesh tree and disable castShadow on meshes that
 * are too small to meaningfully affect the shadow. On 'low' quality this
 * disables every caster (shadows are off anyway). For prison maps this
 * commonly cuts shadow casters from ~20 per object to ~3, slashing the
 * shadow pass cost on Medium/High by an order of magnitude.
 */
const _bb = new THREE.Box3();
const _size = new THREE.Vector3();
export function pruneShadowCasters(root: THREE.Object3D): void {
  const c = getConfig();
  if (!c.shadowsEnabled) {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = false;
    });
    return;
  }
  const minSize = c.shadowCasterMinSize;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    if (!o.castShadow) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    if (!bb) return;
    _bb.copy(bb);
    bb.getSize(_size);
    const maxDim = Math.max(_size.x, _size.y, _size.z);
    if (maxDim < minSize) o.castShadow = false;
  });
}

/** Whether scene-level fog should be applied this preset. */
export function isFogEnabled(): boolean {
  return getConfig().fogEnabled;
}
