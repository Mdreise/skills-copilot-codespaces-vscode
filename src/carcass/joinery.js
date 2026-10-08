/**
 * Face-aware joinery features for the part-card renderer.
 *
 * Face A = machining face (operations visible as cut overlays)
 * Face B = opposite / non-machined face (hidden detail only)
 */

import { GLOBAL } from './parameters.js';

/**
 * @typedef {'A' | 'B'} Face
 * @typedef {'dado' | 'tenon' | 'rabbet' | 'confirmat-through' | 'confirmat-pilot'} FeatureKind
 *
 * @typedef {object} Rect2
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * Place confirmat centers along a joint run (32 mm pitch),
 * inset from each end of the open span. Caps count for shop-typical
 * deck-to-end joints (2–5 fasteners).
 *
 * @param {number} runStart
 * @param {number} runLength
 * @returns {number[]}
 */
export function confirmatCenters(runStart, runLength) {
  const { confirmatPitch } = GLOBAL;
  const inset = Math.min(confirmatPitch, runLength / 4);
  const usable = runLength - 2 * inset;
  if (usable <= 0) return [runStart + runLength / 2];

  const maxByPitch = Math.floor(usable / confirmatPitch) + 1;
  const count = Math.max(2, Math.min(5, maxByPitch));
  const span = (count - 1) * confirmatPitch;
  const origin = runStart + inset + Math.max(0, (usable - span) / 2);
  /** @type {number[]} */
  const centers = [];
  for (let i = 0; i < count; i += 1) centers.push(origin + i * confirmatPitch);
  return centers;
}

/**
 * Blind dado on an end panel's machining face (Face A = inside).
 * Part UV: x = front→back, y = bottom→top.
 *
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 * @param {number} [carcassHeight]
 */
export function endBottomDado(side, carcassDepth, carcassHeight = 34.5) {
  const { materialThickness, dadoDepth, blindShoulder } = GLOBAL;
  return {
    id: `${side}-bottom-dado`,
    kind: /** @type {FeatureKind} */ ('dado'),
    joinery: 'blind-dado',
    side,
    /** Machined on the inside face */
    face: /** @type {Face} */ ('A'),
    depth: dadoDepth,
    width: materialThickness,
    length: carcassDepth - blindShoulder,
    blindShoulder,
    /** 2D pocket on Face A */
    rect: {
      x: blindShoulder,
      y: 0,
      width: carcassDepth - blindShoulder,
      height: materialThickness,
    },
    label: `Dado: ${dadoDepth}" deep × ${materialThickness}" wide`,
    stopLabel: `${blindShoulder}" Stop`,
    // Keep legacy Box3 fields for iso / older tests
    x: side === 'left' ? materialThickness - dadoDepth : 0,
    y: blindShoulder,
    z: 0,
    // unused height param reserved for future shelf dados
    _partHeight: carcassHeight,
  };
}

/**
 * Rear rabbet for a captured 1/4" back on an end panel.
 * Breaks through the rear edge → edgeband excluded on that edge.
 *
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 * @param {number} carcassHeight
 */
export function endBackRabbet(side, carcassDepth, carcassHeight) {
  const { backThickness, rabbetDepth } = GLOBAL;
  return {
    id: `${side}-back-rabbet`,
    kind: /** @type {FeatureKind} */ ('rabbet'),
    joinery: 'back-rabbet',
    side,
    face: /** @type {Face} */ ('A'),
    depth: rabbetDepth,
    width: backThickness,
    edge: 'rear',
    edgebandExcluded: true,
    rect: {
      x: carcassDepth - backThickness,
      y: 0,
      width: backThickness,
      height: carcassHeight,
    },
    label: `Rabbet: ${rabbetDepth}" deep × ${backThickness}" wide`,
  };
}

/**
 * Confirmat through-bores on the end Face A (into the bottom dado).
 *
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 */
export function endConfirmatThrough(side, carcassDepth) {
  const { blindShoulder, materialThickness, confirmatDiameter } = GLOBAL;
  const runStart = blindShoulder;
  const runLength = carcassDepth - blindShoulder;
  const centers = confirmatCenters(runStart, runLength);
  return centers.map((cx, i) => ({
    id: `${side}-confirmat-through-${i}`,
    kind: /** @type {FeatureKind} */ ('confirmat-through'),
    joinery: 'confirmat',
    side,
    face: /** @type {Face} */ ('A'),
    diameter: confirmatDiameter,
    cx,
    cy: materialThickness / 2,
    pitch: GLOBAL.confirmatPitch,
  }));
}

/**
 * Tongue / tenon on the deck that seats in an end dado.
 * Part UV: x = left→right, y = front→back.
 *
 * @param {'left' | 'right'} side
 * @param {number} bottomLen
 * @param {number} carcassDepth
 */
export function bottomTenon(side, bottomLen, carcassDepth) {
  const { materialThickness, dadoDepth, blindShoulder } = GLOBAL;
  return {
    id: `bottom-tenon-${side}`,
    kind: /** @type {FeatureKind} */ ('tenon'),
    joinery: 'blind-dado',
    side,
    face: /** @type {Face} */ ('A'),
    depth: dadoDepth,
    width: materialThickness,
    length: carcassDepth - blindShoulder,
    blindShoulder,
    rect: {
      x: side === 'left' ? 0 : bottomLen - dadoDepth,
      y: blindShoulder,
      width: dadoDepth,
      height: carcassDepth - blindShoulder,
    },
    // legacy
    x: side === 'left' ? 0 : bottomLen - dadoDepth,
    y: blindShoulder,
    z: 0,
    height: materialThickness,
  };
}

/**
 * Rear rabbet on the deck for the captured back.
 * @param {number} bottomLen
 * @param {number} carcassDepth
 */
export function bottomBackRabbet(bottomLen, carcassDepth) {
  const { backThickness, rabbetDepth } = GLOBAL;
  return {
    id: 'bottom-back-rabbet',
    kind: /** @type {FeatureKind} */ ('rabbet'),
    joinery: 'back-rabbet',
    face: /** @type {Face} */ ('A'),
    depth: rabbetDepth,
    width: backThickness,
    edge: 'rear',
    edgebandExcluded: true,
    rect: {
      x: 0,
      y: carcassDepth - backThickness,
      width: bottomLen,
      height: backThickness,
    },
    label: `Rabbet: ${rabbetDepth}" deep × ${backThickness}" wide`,
  };
}

/**
 * Confirmat pilot bores into the left/right edges of the deck.
 *
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 */
export function bottomConfirmatPilots(side, carcassDepth) {
  const { blindShoulder, confirmatDiameter, confirmatPilotDepth } = GLOBAL;
  const runStart = blindShoulder;
  const runLength = carcassDepth - blindShoulder;
  const centers = confirmatCenters(runStart, runLength);
  return centers.map((cy, i) => ({
    id: `bottom-confirmat-pilot-${side}-${i}`,
    kind: /** @type {FeatureKind} */ ('confirmat-pilot'),
    joinery: 'confirmat',
    side,
    face: /** @type {Face} */ ('A'),
    diameter: confirmatDiameter,
    depth: confirmatPilotDepth,
    edge: side,
    cy,
    pitch: GLOBAL.confirmatPitch,
  }));
}

/** @deprecated Use endBottomDado — kept for iso layout compatibility */
export function bottomMortise(side, carcassDepth) {
  const d = endBottomDado(side, carcassDepth);
  return {
    kind: 'mortise',
    joinery: 'blind-dado',
    side,
    x: d.x,
    y: d.y,
    z: d.z,
    width: d.depth,
    height: d.width,
    depth: d.length,
  };
}
