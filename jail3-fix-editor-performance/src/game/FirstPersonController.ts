import * as THREE from 'three';

export class FirstPersonController {
  public camera: THREE.PerspectiveCamera;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public direction: THREE.Vector3 = new THREE.Vector3();

  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = true;
  private isCrouching = false;
  private isSprinting = false;

  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly PI_2 = Math.PI / 2;

  private walkSpeed = 8;
  private sprintSpeed = 14;
  private crouchSpeed = 4;
  private jumpForce = 8;
  private gravity = 25;
  private standHeight = 1.7;
  private crouchHeight = 1.0;
  private currentHeight = 1.7;

  // Fall damage
  private lastGroundY = 0;
  private wasInAir = false;
  private fallDamageThreshold = 5; // min fall distance for damage
  private fallDamageMultiplier = 8; // damage per unit fallen beyond threshold

  // Camera effects
  public cameraShakeAmount = 0;
  public recoilPitch = 0;

  private prevFeetY = 0;
  private colliders: THREE.Box3[] = [];
  private pointerLockEnabled = true;

  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnClick: (e: MouseEvent) => void;

  // Callbacks
  public onFallDamage?: (damage: number) => void;
  public onLand?: () => void;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.set(0, this.standHeight, 5);
    this.lastGroundY = this.standHeight;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnClick = this.onClick.bind(this);

    this.setupEventListeners();
  }

  private resetMovement() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
  }

  setColliders(colliders: THREE.Box3[]) {
    this.colliders = colliders;
    console.log('[FPC] setColliders called, count:', colliders.length);
  }

  /** Initialize prevFeetY to current feet position - call after setting spawn position */
  initFeetPosition() {
    this.prevFeetY = this.camera.position.y - this.currentHeight;
  }

  private setupEventListeners() {
    document.addEventListener('keydown', this.boundOnKeyDown);
    document.addEventListener('keyup', this.boundOnKeyUp);
    document.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('click', this.boundOnClick);
    window.addEventListener('blur', () => this.resetMovement());
    document.addEventListener('pointerlockchange', () => { if (!this.isLocked) this.resetMovement(); });
  }

  private get isLocked(): boolean { return document.pointerLockElement !== null; }

  setPointerLockEnabled(enabled: boolean) { this.pointerLockEnabled = enabled; }

  getCrouching() { return this.isCrouching; }
  getSprinting() { return this.isSprinting; }

  private onClick() {
    if (!this.isLocked && this.pointerLockEnabled) document.body.requestPointerLock();
  }

  addRecoil(amount: number) { this.recoilPitch += amount; }

  private onMouseMove(event: MouseEvent) {
    if (!this.isLocked) return;
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= (event.movementX || 0) * 0.002;
    this.euler.x -= (event.movementY || 0) * 0.002;
    this.euler.x = Math.max(-this.PI_2 + 0.01, Math.min(this.PI_2 - 0.01, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Tab') { event.preventDefault(); return; }
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
      case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
      case 'Space':
        if (this.canJump && this.isLocked) {
          this.velocity.y = this.jumpForce;
          this.canJump = false;
          this.wasInAir = true;
        }
        break;
      case 'ShiftLeft': case 'ShiftRight':
        if (!this.isCrouching) this.isSprinting = true;
        break;
      case 'ControlLeft': case 'ControlRight':
        this.isCrouching = true;
        this.isSprinting = false;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
      case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
      case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
      case 'ControlLeft': case 'ControlRight': this.isCrouching = false; break;
    }
  }

  private _collisionLogCount = 0;

  private checkCollision(newPosition: THREE.Vector3): boolean {
    const h = this.currentHeight;
    // Small feet clearance to avoid z-fighting with floor seams but catch real objects
    const feetClearance = 0.05;
    const feetY = newPosition.y - h;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(newPosition.x - 0.3, feetY + feetClearance, newPosition.z - 0.3),
      new THREE.Vector3(newPosition.x + 0.3, newPosition.y + 0.2, newPosition.z + 0.3)
    );
    for (const collider of this.colliders) {
      // Skip colliders the player is currently standing on top of.
      // If the collider's top is at or below the player's feet + tolerance, it should
      // not block horizontal movement (player is walking on it).
      if (collider.max.y <= feetY + 0.1) continue;
      if (playerBox.intersectsBox(collider)) {
        if (this._collisionLogCount < 3) {
          console.log('[FPC] COLLISION DETECTED with collider:', collider.min.toArray(), collider.max.toArray());
          this._collisionLogCount++;
        }
        return true;
      }
    }
    return false;
  }

  isMoving(): boolean { return this.moveForward || this.moveBackward || this.moveLeft || this.moveRight; }

  update(delta: number) {
    if (!this.isLocked) return;

    // Track previous frame feet position for fall-through detection
    this.prevFeetY = this.camera.position.y - this.currentHeight;

    // Height transition (crouch)
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * delta * 10;

    // Gravity
    this.velocity.y -= this.gravity * delta;

    // Speed
    let speed = this.walkSpeed;
    if (this.isSprinting && this.isMoving()) speed = this.sprintSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;

    // Direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const moveX = (forward.x * this.direction.z + right.x * this.direction.x) * speed * delta;
    const moveZ = (forward.z * this.direction.z + right.z * this.direction.x) * speed * delta;

    // Horizontal collision with step-up
    const stepUpHeight = 0.55; // Maximum height player can step up (stairs are 0.5 per step)

    const newPosX = this.camera.position.clone(); newPosX.x += moveX;
    if (this.checkCollision(newPosX)) {
      // Try stepping up
      const steppedX = newPosX.clone();
      steppedX.y += stepUpHeight;
      if (!this.checkCollision(steppedX)) {
        // Can step up - find the exact height needed
        this.camera.position.x = newPosX.x;
        const feetYForStep = this.camera.position.y - this.currentHeight;
        for (const collider of this.colliders) {
          if (this.camera.position.x + 0.3 > collider.min.x &&
              this.camera.position.x - 0.3 < collider.max.x &&
              this.camera.position.z + 0.3 > collider.min.z &&
              this.camera.position.z - 0.3 < collider.max.z &&
              collider.max.y > feetYForStep &&
              collider.max.y <= feetYForStep + stepUpHeight) {
            this.camera.position.y = collider.max.y + this.currentHeight;
            this.velocity.y = 0;
            this.canJump = true;
            break;
          }
        }
      }
      // else: blocked, don't move
    } else {
      this.camera.position.x = newPosX.x;
    }

    const newPosZ = this.camera.position.clone(); newPosZ.z += moveZ;
    if (this.checkCollision(newPosZ)) {
      // Try stepping up
      const steppedZ = newPosZ.clone();
      steppedZ.y += stepUpHeight;
      if (!this.checkCollision(steppedZ)) {
        // Can step up - find the exact height needed
        this.camera.position.z = newPosZ.z;
        const feetYForStep = this.camera.position.y - this.currentHeight;
        for (const collider of this.colliders) {
          if (this.camera.position.x + 0.3 > collider.min.x &&
              this.camera.position.x - 0.3 < collider.max.x &&
              this.camera.position.z + 0.3 > collider.min.z &&
              this.camera.position.z - 0.3 < collider.max.z &&
              collider.max.y > feetYForStep &&
              collider.max.y <= feetYForStep + stepUpHeight) {
            this.camera.position.y = collider.max.y + this.currentHeight;
            this.velocity.y = 0;
            this.canJump = true;
            break;
          }
        }
      }
      // else: blocked, don't move
    } else {
      this.camera.position.z = newPosZ.z;
    }

    // Vertical
    this.camera.position.y += this.velocity.y * delta;

    // Check if player lands on top of a collider
    const feetY = this.camera.position.y - this.currentHeight;
    let groundY = 0; // default floor level
    for (const collider of this.colliders) {
      // Check if player is horizontally overlapping this collider
      if (this.camera.position.x + 0.3 > collider.min.x &&
          this.camera.position.x - 0.3 < collider.max.x &&
          this.camera.position.z + 0.3 > collider.min.z &&
          this.camera.position.z - 0.3 < collider.max.z) {
        // Player's feet are at or below the top of this collider and within range, and falling
        if (feetY <= collider.max.y && (feetY > collider.min.y || this.prevFeetY >= collider.max.y) && this.velocity.y <= 0) {
          if (collider.max.y > groundY) {
            groundY = collider.max.y;
          }
        }
      }
    }

    // Apply ground (either collider top or floor at y=0)
    const minCameraY = groundY + this.currentHeight;
    if (this.camera.position.y < minCameraY) {
      // Fall damage
      if (this.wasInAir) {
        const fallDist = this.lastGroundY - this.camera.position.y;
        if (fallDist > this.fallDamageThreshold) {
          const damage = Math.round((fallDist - this.fallDamageThreshold) * this.fallDamageMultiplier);
          this.onFallDamage?.(damage);
        }
        this.onLand?.();
        this.wasInAir = false;
      }
      this.camera.position.y = minCameraY;
      this.velocity.y = 0;
      this.canJump = true;
      this.lastGroundY = this.camera.position.y;
    } else if (!this.canJump && this.velocity.y < -2) {
      this.wasInAir = true;
    }

    // Ceiling
    if (this.camera.position.y > 100) { this.camera.position.y = 100; this.velocity.y = 0; }

    // Camera recoil recovery
    if (this.recoilPitch > 0) {
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.x -= this.recoilPitch * delta * 0.5;
      this.recoilPitch -= this.recoilPitch * delta * 8;
      if (this.recoilPitch < 0.001) this.recoilPitch = 0;
      this.camera.quaternion.setFromEuler(this.euler);
    }

    // Camera shake recovery
    if (this.cameraShakeAmount > 0) {
      this.cameraShakeAmount -= delta * 3;
      if (this.cameraShakeAmount < 0) this.cameraShakeAmount = 0;
    }
  }

  dispose() {
    document.removeEventListener('keydown', this.boundOnKeyDown);
    document.removeEventListener('keyup', this.boundOnKeyUp);
    document.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('click', this.boundOnClick);
  }
}
