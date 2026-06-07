/**
 * Physics engine for Space Odyssey
 * Custom physics: gravity, thrust, drag, orbital mechanics
 */

const G = 6.674e-11; // Gravitational constant

/**
 * Calculate gravitational force on an object
 * F = GMm/r^2, directed toward planet center
 */
export function calculateGravity(position, planetMass, planetRadius) {
  const dx = -position.x;
  const dy = -position.y + planetRadius;
  const r = Math.sqrt(dx * dx + dy * dy);

  if (r < 1) return { fx: 0, fy: 0 };

  const forceMag = (G * planetMass) / (r * r);
  const nx = dx / r;
  const ny = dy / r;

  return {
    fx: forceMag * nx,
    fy: forceMag * ny,
    r: r
  };
}

/**
 * Calculate atmospheric drag
 * Drag decreases exponentially with altitude
 * @param {object} velocity - {vx, vy}
 * @param {number} altitude - height above surface in meters
 * @param {number} maxAtmosphere - atmosphere height in meters
 * @returns {object} drag force per unit mass {fx, fy}
 */
export function calculateDrag(velocity, altitude, maxAtmosphere) {
  if (altitude > maxAtmosphere || altitude < 0) {
    return { fx: 0, fy: 0 };
  }

  const scaleHeight = maxAtmosphere / 7;
  const density = 1.225 * Math.exp(-altitude / scaleHeight);
  const dragCoeff = 0.5;
  const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);

  if (speed < 0.01) return { fx: 0, fy: 0 };

  const dragMag = 0.5 * dragCoeff * density * speed;

  return {
    fx: -dragMag * (velocity.vx / speed),
    fy: -dragMag * (velocity.vy / speed)
  };
}

/**
 * Calculate orbital parameters from state vectors
 * @param {object} position - {x, y} relative to planet center
 * @param {object} velocity - {vx, vy}
 * @param {number} planetMass - mass of the central body
 * @param {number} planetRadius - radius of the planet surface
 * @returns {object} orbital params
 */
export function calculateOrbitalParams(position, velocity, planetMass, planetRadius) {
  const mu = G * planetMass;

  const rx = position.x;
  const ry = position.y;
  const r = Math.sqrt(rx * rx + ry * ry);

  const vx = velocity.vx;
  const vy = velocity.vy;
  const v = Math.sqrt(vx * vx + vy * vy);

  // Specific orbital energy
  const energy = (v * v) / 2 - mu / r;

  // Specific angular momentum (2D cross product)
  const h = rx * vy - ry * vx;

  // Semi-major axis
  const a = -mu / (2 * energy);

  // Eccentricity vector
  const ex = (vy * h) / mu - rx / r;
  const ey = -(vx * h) / mu - ry / r;
  const e = Math.sqrt(ex * ex + ey * ey);

  // Apoapsis and periapsis distances from center
  let apoapsis, periapsis;
  if (e < 1) {
    periapsis = a * (1 - e);
    apoapsis = a * (1 + e);
  } else {
    // Hyperbolic or parabolic - no bound orbit
    periapsis = a * (1 - e);
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
 * @param {object} forces - {fx, fy} total force per unit mass (acceleration)
 * @param {number} dt - time step in seconds
 * @returns {object} new state
 */
export function integrateMotion(state, forces, dt) {
  const newVx = state.vx + forces.fx * dt;
  const newVy = state.vy + forces.fy * dt;

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

/**
 * Calculate thrust vector from engine parameters
 * @param {number} thrustForce - engine thrust in Newtons
 * @param {number} angle - rocket angle in radians (0 = up)
 * @param {number} throttle - 0 to 1
 * @returns {object} {fx, fy} thrust acceleration components
 */
export function calculateThrust(thrustForce, angle, throttle, totalMass) {
  const force = thrustForce * throttle;
  const ax = (force / totalMass) * Math.sin(angle);
  const ay = -(force / totalMass) * Math.cos(angle);
  return { fx: ax, fy: ay };
}
