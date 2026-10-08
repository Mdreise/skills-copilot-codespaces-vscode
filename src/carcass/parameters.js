/**
 * Global shop parameters for a 5/8" material base carcass
 * with blind dado joinery, rear rabbet, and confirmat fasteners.
 */

/** @typedef {'inch'} Unit */

const MM = 1 / 25.4;

export const GLOBAL = Object.freeze({
  /** Material thickness (5/8") */
  materialThickness: 5 / 8,
  /** Blind dado depth into the end (1/4") */
  dadoDepth: 1 / 4,
  /** Front blind setback / shoulder (1/2") */
  blindShoulder: 1 / 2,
  /** Captured back panel thickness */
  backThickness: 1 / 4,
  /** Rabbet depth into face for the back */
  rabbetDepth: 1 / 4,
  /** Confirmat through / pilot diameter (5 mm) */
  confirmatDiameter: 5 * MM,
  /** Confirmat pilot depth into deck edge (35 mm) */
  confirmatPilotDepth: 35 * MM,
  /** Hole pitch along the joint (32 mm system) */
  confirmatPitch: 32 * MM,
  /** Units for linear carcass values */
  unit: /** @type {Unit} */ ('inch'),
});

export const DEFAULT_CARCASS = Object.freeze({
  height: 34.5,
  width: 24,
  depth: 24,
});

/**
 * @param {number} value
 * @param {string} name
 * @returns {number}
 */
export function requirePositive(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite number greater than 0`);
  }
  return value;
}

/** @param {number} inches */
export function inchToMm(inches) {
  return inches * 25.4;
}

/** @param {number} mm */
export function mmToInch(mm) {
  return mm / 25.4;
}
