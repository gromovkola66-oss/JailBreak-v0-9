export interface AnimationKeyframe {
  time: number; // seconds from start
  position?: { x: number; y: number; z: number };
  rotation?: number; // degrees
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface AnimationTrack {
  objectId: string;
  keyframes: AnimationKeyframe[];
  loop: boolean;
  duration: number;
}

export interface AnimationData {
  tracks: AnimationTrack[];
}

function easingFunction(t: number, easing: AnimationKeyframe['easing']): number {
  switch (easing) {
    case 'linear': return t;
    case 'ease-in': return t * t;
    case 'ease-out': return 1 - (1 - t) * (1 - t);
    case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class AnimationSystem {
  private tracks: AnimationTrack[] = [];
  private playing: boolean = false;
  private currentTime: number = 0;

  addTrack(objectId: string): AnimationTrack {
    const existing = this.tracks.find(t => t.objectId === objectId);
    if (existing) return existing;
    const track: AnimationTrack = {
      objectId,
      keyframes: [],
      loop: false,
      duration: 5,
    };
    this.tracks.push(track);
    return track;
  }

  removeTrack(objectId: string): void {
    this.tracks = this.tracks.filter(t => t.objectId !== objectId);
  }

  addKeyframe(objectId: string, keyframe: AnimationKeyframe): void {
    let track = this.tracks.find(t => t.objectId === objectId);
    if (!track) {
      track = this.addTrack(objectId);
    }
    track.keyframes.push(keyframe);
    track.keyframes.sort((a, b) => a.time - b.time);
    // Update duration to encompass all keyframes
    if (track.keyframes.length > 0) {
      const maxTime = track.keyframes[track.keyframes.length - 1].time;
      if (maxTime > track.duration) {
        track.duration = maxTime;
      }
    }
  }

  removeKeyframe(objectId: string, keyframeIndex: number): void {
    const track = this.tracks.find(t => t.objectId === objectId);
    if (!track) return;
    if (keyframeIndex >= 0 && keyframeIndex < track.keyframes.length) {
      track.keyframes.splice(keyframeIndex, 1);
    }
  }

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  stop(): void {
    this.playing = false;
    this.currentTime = 0;
  }

  scrubTo(time: number): void {
    this.currentTime = Math.max(0, time);
  }

  update(
    delta: number,
    moveCallback: (objectId: string, pos: { x: number; y: number; z: number }, rot: number) => void,
  ): void {
    if (!this.playing) return;

    this.currentTime += delta;
    const duration = this.getDuration();
    if (duration <= 0) return;

    // Check if past duration
    if (this.currentTime > duration) {
      // Check if any track loops
      const anyLoop = this.tracks.some(t => t.loop);
      if (anyLoop) {
        this.currentTime = this.currentTime % duration;
      } else {
        this.currentTime = duration;
        this.playing = false;
      }
    }

    for (const track of this.tracks) {
      if (track.keyframes.length === 0) continue;

      let trackTime = this.currentTime;
      if (track.loop && track.duration > 0) {
        trackTime = trackTime % track.duration;
      }

      const result = this.interpolateTrack(track, trackTime);
      moveCallback(track.objectId, result.position, result.rotation);
    }
  }

  private interpolateTrack(
    track: AnimationTrack,
    time: number,
  ): { position: { x: number; y: number; z: number }; rotation: number } {
    const keyframes = track.keyframes;

    if (keyframes.length === 0) {
      return { position: { x: 0, y: 0, z: 0 }, rotation: 0 };
    }

    if (keyframes.length === 1) {
      const kf = keyframes[0];
      return {
        position: kf.position ? { ...kf.position } : { x: 0, y: 0, z: 0 },
        rotation: kf.rotation ?? 0,
      };
    }

    // Find surrounding keyframes
    if (time <= keyframes[0].time) {
      const kf = keyframes[0];
      return {
        position: kf.position ? { ...kf.position } : { x: 0, y: 0, z: 0 },
        rotation: kf.rotation ?? 0,
      };
    }

    if (time >= keyframes[keyframes.length - 1].time) {
      const kf = keyframes[keyframes.length - 1];
      return {
        position: kf.position ? { ...kf.position } : { x: 0, y: 0, z: 0 },
        rotation: kf.rotation ?? 0,
      };
    }

    // Find the two keyframes to interpolate between
    let prevKf = keyframes[0];
    let nextKf = keyframes[1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        prevKf = keyframes[i];
        nextKf = keyframes[i + 1];
        break;
      }
    }

    const segmentDuration = nextKf.time - prevKf.time;
    const rawT = segmentDuration > 0 ? (time - prevKf.time) / segmentDuration : 0;
    const t = easingFunction(rawT, nextKf.easing);

    const prevPos = prevKf.position || { x: 0, y: 0, z: 0 };
    const nextPos = nextKf.position || { x: 0, y: 0, z: 0 };

    return {
      position: {
        x: lerp(prevPos.x, nextPos.x, t),
        y: lerp(prevPos.y, nextPos.y, t),
        z: lerp(prevPos.z, nextPos.z, t),
      },
      rotation: lerp(prevKf.rotation ?? 0, nextKf.rotation ?? 0, t),
    };
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    if (this.tracks.length === 0) return 0;
    return Math.max(...this.tracks.map(t => t.duration));
  }

  getTracks(): AnimationTrack[] {
    return this.tracks;
  }

  getTrackForObject(objectId: string): AnimationTrack | undefined {
    return this.tracks.find(t => t.objectId === objectId);
  }

  exportData(): AnimationData {
    return { tracks: this.tracks.map(t => ({ ...t, keyframes: t.keyframes.map(k => ({ ...k })) })) };
  }

  importData(data: AnimationData): void {
    this.tracks = data.tracks.map(t => ({
      ...t,
      keyframes: t.keyframes.map(k => ({ ...k })),
    }));
    this.currentTime = 0;
    this.playing = false;
  }
}
