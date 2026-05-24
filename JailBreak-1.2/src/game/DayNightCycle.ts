import * as THREE from 'three';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

const TOTAL_CYCLE_SECONDS = 13 * 60; // 13 minutes
const DAWN_END = 1 * 60;             // 0:00 - 1:00
const DAY_END = 9 * 60;              // 1:00 - 9:00
const DUSK_END = 10 * 60;            // 9:00 - 10:00
// NIGHT: 10:00 - 13:00 (3 minutes)

// Pre-allocated color constants to avoid per-frame GC pressure
const COLOR_NIGHT_AMBIENT = new THREE.Color(0x2233aa);
const COLOR_DAY_AMBIENT = new THREE.Color(0xffffff);
const COLOR_DAWN_SUN = new THREE.Color(0xff8844);
const COLOR_DAY_SUN = new THREE.Color(0xffffff);
const COLOR_DUSK_SUN = new THREE.Color(0xff6633);

const COLOR_FOG_DAY = new THREE.Color(0xc8e0f0);
const COLOR_FOG_NIGHT = new THREE.Color(0x0a0a1a);

// Reusable Vector3 for sun position computation
const _sunPos = new THREE.Vector3();

// Sun elevation threshold below which shadows are disabled
const SUN_SHADOW_THRESHOLD = 0.1;

export class DayNightCycle {
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private skyUniforms: { uTime: THREE.IUniform<number>; uSunPosition: THREE.IUniform<THREE.Vector3>; uElapsedSeconds: THREE.IUniform<number> };
  private fog: THREE.Fog | null;

  private elapsedTime = 90;
  public timeOfDay = 0; // 0-1 normalized
  public phase: DayPhase = 'dawn';

  constructor(
    ambientLight: THREE.AmbientLight,
    sunLight: THREE.DirectionalLight,
    skyUniforms: { uTime: THREE.IUniform<number>; uSunPosition: THREE.IUniform<THREE.Vector3>; uElapsedSeconds: THREE.IUniform<number> },
    fog: THREE.Fog | null
  ) {
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;
    this.skyUniforms = skyUniforms;
    this.fog = fog;
  }

  update(delta: number): void {
    this.elapsedTime += delta;
    if (this.elapsedTime >= TOTAL_CYCLE_SECONDS) {
      this.elapsedTime -= TOTAL_CYCLE_SECONDS;
    }

    this.timeOfDay = this.elapsedTime / TOTAL_CYCLE_SECONDS;

    // Determine phase
    if (this.elapsedTime < DAWN_END) {
      this.phase = 'dawn';
    } else if (this.elapsedTime < DAY_END) {
      this.phase = 'day';
    } else if (this.elapsedTime < DUSK_END) {
      this.phase = 'dusk';
    } else {
      this.phase = 'night';
    }

    // Compute sun orbital position
    // Sun goes from east (dawn) through top (midday) to west (dusk) then below horizon (night)
    const sunAngle = this.timeOfDay * Math.PI * 2 - Math.PI * 0.5;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);
    _sunPos.set(sunX * 40, sunY * 40, 10);
    this.sunLight.position.copy(_sunPos);

    // Disable shadows when sun is below threshold to avoid wasted shadow passes
    if (sunY < SUN_SHADOW_THRESHOLD) {
      this.sunLight.castShadow = false;
    } else {
      this.sunLight.castShadow = true;
    }

    // Update sky uniforms
    this.skyUniforms.uTime.value = this.timeOfDay;
    this.skyUniforms.uElapsedSeconds.value = this.elapsedTime;
    this.skyUniforms.uSunPosition.value.copy(_sunPos).normalize();

    // Ambient, sun, and fog based on phase
    this.updateLighting();
  }

  private updateLighting(): void {
    const seconds = this.elapsedTime;

    if (this.phase === 'dawn') {
      // Transition from night to day over 1 minute
      const t = seconds / DAWN_END;
      this.ambientLight.color.lerpColors(COLOR_NIGHT_AMBIENT, COLOR_DAY_AMBIENT, t);
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.18, 0.35, t);
      this.sunLight.color.lerpColors(COLOR_DAWN_SUN, COLOR_DAY_SUN, t);
      this.sunLight.intensity = THREE.MathUtils.lerp(0.1, 0.55, t);
      if (this.fog) {
        this.fog.color.lerpColors(COLOR_FOG_NIGHT, COLOR_FOG_DAY, t);
      }
    } else if (this.phase === 'day') {
      this.ambientLight.color.set(0xffffff);
      this.ambientLight.intensity = 0.35;
      this.sunLight.color.set(0xffffff);
      this.sunLight.intensity = 0.55;
      if (this.fog) {
        this.fog.color.copy(COLOR_FOG_DAY);
      }
    } else if (this.phase === 'dusk') {
      // Transition from day to night over 1 minute
      const t = (seconds - DAY_END) / (DUSK_END - DAY_END);
      this.ambientLight.color.lerpColors(COLOR_DAY_AMBIENT, COLOR_NIGHT_AMBIENT, t);
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.35, 0.18, t);
      this.sunLight.color.lerpColors(COLOR_DAY_SUN, COLOR_DUSK_SUN, t);
      this.sunLight.intensity = THREE.MathUtils.lerp(0.55, 0.05, t);
      if (this.fog) {
        this.fog.color.lerpColors(COLOR_FOG_DAY, COLOR_FOG_NIGHT, t);
      }
    } else {
      // Night
      this.ambientLight.color.set(0x2233aa);
      this.ambientLight.intensity = 0.18;
      this.sunLight.intensity = 0.0;
      if (this.fog) {
        this.fog.color.copy(COLOR_FOG_NIGHT);
      }
    }
  }
}
