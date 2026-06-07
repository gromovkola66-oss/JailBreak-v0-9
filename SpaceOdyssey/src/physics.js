/**
 * Physics engine for Space Odyssey
 * Custom physics: gravity, thrust, drag, orbital mechanics
 *
 * Coordinate system:
 *   state.x = horizontal position (meters)
 *   state.y = altitude above planet surface (meters, positive = up)
 *   state.vx = horizontal velocity
 *   state.vy = vertical velocity (positive = upward)
 *   Gravity acts downward (negative y)
 */

const G = 6.674e-11; // Gravitational constant

/**
 * Calculate gravitational acceleration toward planet center.
 * Returns acceleration (fx, fy) pointing DOWNWARD toward planet.
 * For a rocket at altitude h above the surface:
 *   distance from center = planetRadius + altitude
 *   acceleration magnitude = GM / r^2
 *   direction: straight down (negative fy), with x-component if rocket is offset
 *
 * @param {number} altitude - height above surface in meters
 * @param {number} x - horizontal offset from launch site
 * @param {number} planetMass - mass of the planet
 * @param {number} planetRadius - radius of the planet surface
 * @returns {object} {ax, ay} gravitational acceleration (ay is negative = downward)
 */
export function calculateGravity(altitude, x, planetMass, planetRadius) {
  const r = planetRadius + altitude;
  if (r < 1) return { ax: 0, ay: 0 };

  const accelMag = (G * planetMass) / (r * r);

  // Direction from rocket toward planet center
  // Rocket is at (x, r) relative to planet center (planet center at origin)
  // Direction to center is (-x, -r), normalized
  const dist = Math.sqrt(x * x + r * r);
  const nx = -x / dist;
  const ny = -r / dist;

  return {
    ax: accelMag * nx,
    ay: accelMag * ny
  };
}

/**
 * Calculate atmospheric drag deceleration
 * Drag decreases exponentially with altitude
 * @param {object} velocity - {vx, vy}
 * @param {number} altitude - height above surface in meters
 * @param {number} maxAtmosphere - atmosphere height in meters
 * @returns {object} drag acceleration {ax, ay} opposing motion
 */
export function calculateDrag(velocity, altitude, maxAtmosphere) {
  if (altitude > maxAtmosphere || altitude < 0) {
    return { ax: 0, ay: 0 };
  }

  const scaleHeight = maxAtmosphere / 7;
  const density = 1.225 * Math.exp(-altitude / scaleHeight);
  const dragCoeff = 0.5;
  const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);

  if (speed < 0.01) return { ax: 0, ay: 0 };

  // Drag magnitude (force per unit mass = acceleration)
  const dragMag = 0.5 * dragCoeff * density * speed;

  return {
    ax: -dragMag * (velocity.vx / speed),
    ay: -dragMag * (velocity.vy / speed)
  };
}

/**
 * Calculate thrust acceleration vector
 * angle = 0 means rocket pointing UP (thrust goes up = positive vy)
 * angle > 0 means rocket tilted clockwise
 * @param {number} thrustForce - engine thrust in Newtons
 * @param {number} angle - rocket angle in radians (0 = up, positive = clockwise tilt)
 * @param {number} throttle - 0 to 1
 * @param {number} totalMass - current mass in kg
 * @returns {object} {ax, ay} thrust acceleration
 */
export function calculateThrust(thrustForce, angle, throttle, totalMass) {
  if (totalMass <= 0) return { ax: 0, ay: 0 };
  const force = thrustForce * throttle;
  const accel = force / totalMass;
  // angle=0: thrust is purely upward (+y), sin(0)=0, cos(0)=1
  // angle>0 (clockwise tilt): thrust has positive x component
  return {
    ax: accel * Math.sin(angle),
    ay: accel * Math.cos(angle)
  };
}

/**
 * Calculate orbital parameters from state vectors
 * @param {object} position - {x, y} relative to planet center
 * @param {object} velocity - {vx, vy} in the same frame
 * @param {number} planetMass - mass of the central body
 * @param {number} planetRadius - radius of the planet surface
 * @returns {object} orbital params
 */
export function calculateOrbitalParams(position, velocity, planetMass, planetRadius) {
  const mu = G * planetMass;

  const rx = position.x;
  const ry = position.y;
  const r = Math.sqrt(rx * rx + ry * ry);

  if (r < 1) return null;

  const vx = velocity.vx;
  const vy = velocity.vy;
  const v = Math.sqrt(vx * vx + vy * vy);

  // Specific orbital energy
  const energy = (v * v) / 2 - mu / r;

  // Specific angular momentum (2D cross product: rx*vy - ry*vx)
  const h = rx * vy - ry * vx;

  // Semi-major axis (negative means bound orbit)
  const a = -mu / (2 * energy);

  // Eccentricity vector
  const ex = (vy * h) / mu - rx / r;
  const ey = -(vx * h) / mu - ry / r;
  const e = Math.sqrt(ex * ex + ey * ey);

  // Apoapsis and periapsis distances from center
  let apoapsis, periapsis;
  if (e < 1 && a > 0) {
    periapsis = a * (1 - e);
    apoapsis = a * (1 + e);
  } else {
    // Hyperbolic or parabolic
    periapsis = Math.abs(h * h / mu) / (1 + e);
    apoapsis = Infinity;
  }

  // Altitudes above surface
  const apoapsisAlt = apoapsis - planetRadius;
  const periapsisAlt = periapsis - planetRadius;

  // Orbital velocity for circular orbit at current radius
  const circularVelocity = Math.sqrt(mu / r);

  return {
    semiMajorAxis: a,
    eccentricity: e,
    apoapsis: apoapsis,
    periapsis: periapsis,
    apoapsisAlt: apoapsisAlt,
    periapsisAlt: periapsisAlt,
    specificEnergy: energy,
    angularMomentum: h,
    circularVelocity: circularVelocity,
    isBound: energy < 0
  };
}

/**
 * Integrate motion using semi-implicit Euler method
 * @param {object} state - {x, y, vx, vy, angle, angularVel}
 * @param {object} accel - {ax, ay} total acceleration
 * @param {number} dt - time step in seconds
 * @returns {object} new state
 */
export function integrateMotion(state, accel, dt) {
  // Semi-implicit Euler: update velocity first, then position
  const newVx = state.vx + accel.ax * dt;
  const newVy = state.vy + accel.ay * dt;

  const newX = state.x + newVx * dt;
  const newY = state.y + newVy * dt;

  return {
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    angle: state.angle + (state.angularVel || 0) * dt,
    angularVel: state.angularVel || 0
  };
}
