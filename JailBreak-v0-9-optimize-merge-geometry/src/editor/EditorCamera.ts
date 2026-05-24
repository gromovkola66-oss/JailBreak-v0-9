import * as THREE from 'three';

export class EditorCamera {
  public camera: THREE.PerspectiveCamera;
  public onFreeFlyChanged?: (active: boolean) => void;
  
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;
  
  private isRightMouseDown = false;
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  
  private speed = 15;
  private fastSpeed = 30;
  private shiftPressed = false;
  private freeFlyMode = false;

  private boundKeyDown = this.onKeyDown.bind(this);
  private boundKeyUp = this.onKeyUp.bind(this);
  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundWheel = this.onWheel.bind(this);
  private boundPointerLockChange = this.onPointerLockChange.bind(this);

  constructor() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
    
    this.setupEvents();
  }

  private setupEvents() {
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);
    document.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('wheel', this.boundWheel);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
  }

  private onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'KeyQ': this.moveDown = true; break;
      case 'KeyE': this.moveUp = true; break;
      case 'Space': this.moveUp = true; break;
      case 'KeyZ':
        this.freeFlyMode = !this.freeFlyMode;
        if (this.freeFlyMode) {
          document.body.requestPointerLock();
        } else {
          document.exitPointerLock();
        }
        this.onFreeFlyChanged?.(this.freeFlyMode);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.shiftPressed = true;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'KeyQ': this.moveDown = false; break;
      case 'KeyE': this.moveUp = false; break;
      case 'Space': this.moveUp = false; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.shiftPressed = false;
        break;
    }
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button === 2) {
      this.isRightMouseDown = true;
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 2) {
      this.isRightMouseDown = false;
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isRightMouseDown && !this.freeFlyMode) return;

    const sensitivity = 0.003;
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= e.movementX * sensitivity;
    this.euler.x -= e.movementY * sensitivity;
    
    // Ограничение вертикального угла
    this.euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onWheel(e: WheelEvent) {
    // Зум через колёсико - движение вперёд/назад
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const zoomSpeed = e.deltaY > 0 ? -2 : 2;
    this.camera.position.addScaledVector(direction, zoomSpeed);
  }

  update(delta: number) {
    const currentSpeed = this.shiftPressed ? this.fastSpeed : this.speed;
    
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    if (!this.freeFlyMode) {
      forward.y = 0;
      forward.normalize();
    }
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    const velocity = new THREE.Vector3();
    
    if (this.moveForward) velocity.add(forward);
    if (this.moveBackward) velocity.sub(forward);
    if (this.moveRight) velocity.add(right);
    if (this.moveLeft) velocity.sub(right);
    if (this.moveUp) velocity.y += 1;
    if (this.moveDown) velocity.y -= 1;
    
    velocity.normalize().multiplyScalar(currentSpeed * delta);
    this.camera.position.add(velocity);
  }

  private onPointerLockChange() {
    if (!document.pointerLockElement && this.freeFlyMode) {
      this.freeFlyMode = false;
      this.onFreeFlyChanged?.(false);
    }
  }

  get isFreeFlyActive(): boolean {
    return this.freeFlyMode;
  }

  dispose() {
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    document.removeEventListener('mousedown', this.boundMouseDown);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('wheel', this.boundWheel);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
  }
}
