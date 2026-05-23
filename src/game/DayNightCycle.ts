import * as THREE from 'three';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

const TOTAL_CYCLE_SECONDS = 15 * 60; // 15 minutes
const DAWN_END = 1 * 60;             // 0:00 - 1:00
const DAY_END = 9 * 60;              // 1:00 - 9:00
const DUSK_END = 10 * 60;            // 9:00 - 10:00
// NIGHT: 10:00 - 15:00

export class DayNightCycle {
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private skyUniforms: { uTime: THREE.IUniform<number>; uSunPosition: THREE.IUniform<THREE.Vector3> };

  private elapsedTime = 0;
  public timeOfDay = 0; // 0-1 normalized
  public phase: DayPhase = 'dawn';

  constructor(
    ambientLight: THREE.AmbientLight,
    sunLight: THREE.DirectionalLight,
    skyUniforms: { uTime: THREE.IUniform<number>; uSunPosition: THREE.IUniform<THREE.Vector3> }
  ) {
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;
    this.skyUniforms = skyUniforms;
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
    const sunPos = new THREE.Vector3(sunX * 40, sunY * 40, 10);
    this.sunLight.position.copy(sunPos);

    // Update sky uniforms
    this.skyUniforms.uTime.value = this.timeOfDay;
    this.skyUniforms.uSunPosition.value.copy(sunPos).normalize();

    // Ambient and sun based on phase
    this.updateLighting();
  }

  private updateLighting(): void {
    const seconds = this.elapsedTime;

    if (this.phase === 'dawn') {
      // Transition from night to day over 1 minute
      const t = seconds / DAWN_END;
      this.ambientLight.color.lerpColors(
        new THREE.Color(0x2233aa),
        new THREE.Color(0xffffff),
        t
      );
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.18, 0.35, t);
      this.sunLight.color.lerpColors(
        new THREE.Color(0xff8844),
        new THREE.Color(0xffffff),
        t
      );
      this.sunLight.intensity = THREE.MathUtils.lerp(0.1, 0.55, t);
    } else if (this.phase === 'day') {
      this.ambientLight.color.set(0xffffff);
      this.ambientLight.intensity = 0.35;
      this.sunLight.color.set(0xffffff);
      this.sunLight.intensity = 0.55;
    } else if (this.phase === 'dusk') {
      // Transition from day to night over 1 minute
      const t = (seconds - DAY_END) / (DUSK_END - DAY_END);
      this.ambientLight.color.lerpColors(
        new THREE.Color(0xffffff),
        new THREE.Color(0x2233aa),
        t
      );
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.35, 0.18, t);
      this.sunLight.color.lerpColors(
        new THREE.Color(0xffffff),
        new THREE.Color(0xff6633),
        t
      );
      this.sunLight.intensity = THREE.MathUtils.lerp(0.55, 0.05, t);
    } else {
      // Night
      this.ambientLight.color.set(0x2233aa);
      this.ambientLight.intensity = 0.18;
      this.sunLight.intensity = 0.0;
    }
  }
}
