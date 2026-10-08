/**
 * Global shop parameters for a 5/8" material base carcass
 * with blind dado joinery. Change these once; all parts and
 * mortise/tenon features derive from them.
 */

/** @typedef {'inch'} Unit */

export const GLOBAL = Object.freeze({
  /** Material thickness (5/8") */
  materialThickness: 5 / 8,
  /** Blind dado depth into the end (1/4") */
  dadoDepth: 1 / 4,
  /** Front blind setback / shoulder (1/2") */
  blindShoulder: 1 / 2,
  /** Units for all linear values */
  unit: /** @type {Unit} */ ('inch'),
});

/**
 * Default outside carcass envelope for a kitchen base box.
 * Height / width / depth are the live controls that drive
 * part recalculation.
 */
export const DEFAULT_CARCASS = Object.freeze({
  height: 34.5,
  width: 24,
  depth: 24,
});

/**
 * Validate and normalize a numeric dimension.
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
