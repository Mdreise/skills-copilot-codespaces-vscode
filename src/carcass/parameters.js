/**
 * Mutable job defaults for the dado / CNC joinery engine.
 * Change once; parts, tenons, and relief geometry recompute from these.
 */

/** @typedef {'inch'} Unit */
/** @typedef {'blind' | 'stopped' | 'through'} DadoMode */
/** @typedef {'dogbone' | 'rounded-tenon'} CornerRelief */

const MM = 1 / 25.4;

/**
 * @typedef {object} JobDefaults
 * @property {number} materialThickness
 * @property {number} dadoDepth
 * @property {number} frontShoulder
 * @property {number} rearShoulder
 * @property {DadoMode} dadoMode
 * @property {number} bitDiameter
 * @property {CornerRelief} cornerRelief
 * @property {number} backThickness
 * @property {number} rabbetDepth
 * @property {number} backGrooveOffset
 * @property {number} confirmatDiameter
 * @property {number} confirmatPilotDepth
 * @property {number} confirmatPitch
 * @property {Unit} unit
 */

/** @type {JobDefaults} */
const defaults = {
  materialThickness: 5 / 8,
  dadoDepth: 1 / 4,
  /** Front blind setback / shoulder (1/2") — alias: blindShoulder */
  frontShoulder: 1 / 2,
  rearShoulder: 1 / 2,
  dadoMode: 'blind',
  /** e.g. 3/8" compression bit */
  bitDiameter: 3 / 8,
  cornerRelief: 'dogbone',
  backThickness: 1 / 4,
  rabbetDepth: 1 / 4,
  /** Captured back groove offset from rear edge */
  backGrooveOffset: 3 / 4,
  confirmatDiameter: 5 * MM,
  confirmatPilotDepth: 35 * MM,
  confirmatPitch: 32 * MM,
  unit: 'inch',
};

/**
 * Live job defaults. Mutate via setJobDefaults / patchJobDefaults.
 * `blindShoulder` is a read alias for `frontShoulder`.
 */
export const GLOBAL = new Proxy(defaults, {
  get(target, prop, receiver) {
    if (prop === 'blindShoulder') return target.frontShoulder;
    if (prop === 'bitRadius') return target.bitDiameter / 2;
    return Reflect.get(target, prop, receiver);
  },
});

/**
 * @param {Partial<JobDefaults>} patch
 * @returns {JobDefaults}
 */
export function patchJobDefaults(patch) {
  if (patch.materialThickness !== undefined) {
    defaults.materialThickness = requirePositive(patch.materialThickness, 'materialThickness');
  }
  if (patch.dadoDepth !== undefined) {
    defaults.dadoDepth = requirePositive(patch.dadoDepth, 'dadoDepth');
  }
  if (patch.frontShoulder !== undefined) {
    defaults.frontShoulder = requireNonNegative(patch.frontShoulder, 'frontShoulder');
  }
  if (patch.rearShoulder !== undefined) {
    defaults.rearShoulder = requireNonNegative(patch.rearShoulder, 'rearShoulder');
  }
  if (patch.dadoMode !== undefined) {
    if (!['blind', 'stopped', 'through'].includes(patch.dadoMode)) {
      throw new Error('dadoMode must be blind | stopped | through');
    }
    defaults.dadoMode = patch.dadoMode;
  }
  if (patch.bitDiameter !== undefined) {
    defaults.bitDiameter = requirePositive(patch.bitDiameter, 'bitDiameter');
  }
  if (patch.cornerRelief !== undefined) {
    if (!['dogbone', 'rounded-tenon'].includes(patch.cornerRelief)) {
      throw new Error('cornerRelief must be dogbone | rounded-tenon');
    }
    defaults.cornerRelief = patch.cornerRelief;
  }
  if (patch.backThickness !== undefined) {
    defaults.backThickness = requirePositive(patch.backThickness, 'backThickness');
  }
  if (patch.rabbetDepth !== undefined) {
    defaults.rabbetDepth = requirePositive(patch.rabbetDepth, 'rabbetDepth');
  }
  if (patch.backGrooveOffset !== undefined) {
    defaults.backGrooveOffset = requirePositive(patch.backGrooveOffset, 'backGrooveOffset');
  }
  return { ...defaults, blindShoulder: defaults.frontShoulder, bitRadius: defaults.bitDiameter / 2 };
}

/** Snapshot of current defaults (including aliases). */
export function getJobDefaults() {
  return {
    ...defaults,
    blindShoulder: defaults.frontShoulder,
    bitRadius: defaults.bitDiameter / 2,
  };
}

/** Restore factory job defaults (for tests / reset). */
export function resetJobDefaults() {
  defaults.materialThickness = 5 / 8;
  defaults.dadoDepth = 1 / 4;
  defaults.frontShoulder = 1 / 2;
  defaults.rearShoulder = 1 / 2;
  defaults.dadoMode = 'blind';
  defaults.bitDiameter = 3 / 8;
  defaults.cornerRelief = 'dogbone';
  defaults.backThickness = 1 / 4;
  defaults.rabbetDepth = 1 / 4;
  defaults.backGrooveOffset = 3 / 4;
  defaults.confirmatDiameter = 5 * MM;
  defaults.confirmatPilotDepth = 35 * MM;
  defaults.confirmatPitch = 32 * MM;
  defaults.unit = 'inch';
  return getJobDefaults();
}

export const DEFAULT_CARCASS = Object.freeze({
  height: 34.5,
  width: 24,
  depth: 24,
});

/**
 * @param {number} value
 * @param {string} name
 */
export function requirePositive(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite number greater than 0`);
  }
  return value;
}

/**
 * @param {number} value
 * @param {string} name
 */
export function requireNonNegative(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite number ≥ 0`);
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
