/**
 * Face-aware joinery features for the part-card renderer.
 * Dados, tenons, rabbets, confirmats — driven by job defaults + dado engine.
 */

import { GLOBAL } from './parameters.js';
import {
  dadoSpan,
  dogBoneEars,
  tenonCornerRadius,
  useDogBoneOnPocket,
  tenonShoulderNotches,
} from './dadoEngine.js';

/**
 * @typedef {'A' | 'B'} Face
 * @typedef {'dado' | 'tenon' | 'rabbet' | 'groove' | 'confirmat-through' | 'confirmat-pilot'} FeatureKind
 */

/**
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
 * Bottom-into-end dado on Face A (inside).
 * Part UV: x = front→back, y = bottom→top.
 *
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 * @param {number} [carcassHeight]
 */
export function endBottomDado(side, carcassDepth, carcassHeight = 34.5) {
  const { materialThickness, dadoDepth, bitDiameter } = GLOBAL;
  const span = dadoSpan(carcassDepth);
  const rect = {
    x: span.startX,
    y: 0,
    width: span.length,
    height: materialThickness,
  };

  return {
    id: `${side}-bottom-dado`,
    kind: /** @type {FeatureKind} */ ('dado'),
    joinery: span.mode === 'through' ? 'through-dado' : span.mode === 'stopped' ? 'stopped-dado' : 'blind-dado',
    mode: span.mode,
    side,
    face: /** @type {Face} */ ('A'),
    depth: dadoDepth,
    width: materialThickness,
    length: span.length,
    frontShoulder: span.frontShoulder,
    rearShoulder: span.rearShoulder,
    /** @deprecated alias */
    blindShoulder: span.frontShoulder,
    bitDiameter,
    bitRadius: bitDiameter / 2,
    cornerRelief: GLOBAL.cornerRelief,
    dogBones: useDogBoneOnPocket() && span.frontShoulder > 0 ? dogBoneEars(rect) : [],
    rect,
    label: `Dado: ${dadoDepth}" deep × ${materialThickness}" wide`,
    stopLabel: span.frontShoulder > 0 ? `${span.frontShoulder}" Stop` : null,
    hover: {
      frontShoulderOffset: span.frontShoulder,
      rearShoulderOffset: span.rearShoulder,
      dadoDepth,
      materialGrooveWidth: materialThickness,
      bitRadiusAllowance: bitDiameter / 2,
      mode: span.mode,
      cornerRelief: GLOBAL.cornerRelief,
    },
    x: side === 'left' ? materialThickness - dadoDepth : 0,
    y: span.startX,
    z: 0,
    _partHeight: carcassHeight,
  };
}

/**
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
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 */
export function endConfirmatThrough(side, carcassDepth) {
  const { materialThickness, confirmatDiameter } = GLOBAL;
  const span = dadoSpan(carcassDepth);
  const centers = confirmatCenters(span.startX, span.length);
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
 * Mating deck tenon with shoulder notching + optional rounded corners.
 *
 * @param {'left' | 'right'} side
 * @param {number} bottomLen
 * @param {number} carcassDepth
 */
export function bottomTenon(side, bottomLen, carcassDepth) {
  const { materialThickness, dadoDepth } = GLOBAL;
  const span = dadoSpan(carcassDepth);
  const cornerRadius = tenonCornerRadius();

  return {
    id: `bottom-tenon-${side}`,
    kind: /** @type {FeatureKind} */ ('tenon'),
    joinery: 'blind-dado',
    mode: span.mode,
    side,
    face: /** @type {Face} */ ('A'),
    depth: dadoDepth,
    width: materialThickness,
    length: span.length,
    frontShoulder: span.frontShoulder,
    rearShoulder: span.rearShoulder,
    blindShoulder: span.frontShoulder,
    cornerRadius,
    cornerRelief: GLOBAL.cornerRelief,
    squareCorners: GLOBAL.cornerRelief === 'dogbone',
    rect: {
      x: side === 'left' ? 0 : bottomLen - dadoDepth,
      y: span.startX,
      width: dadoDepth,
      height: span.length,
    },
    notches: tenonShoulderNotches(bottomLen, span.frontShoulder).filter(
      (n) => n.side === side,
    ),
    hover: {
      frontShoulderOffset: span.frontShoulder,
      dadoDepth,
      materialGrooveWidth: materialThickness,
      bitRadiusAllowance: GLOBAL.bitDiameter / 2,
      cornerRadius,
      cornerRelief: GLOBAL.cornerRelief,
    },
    x: side === 'left' ? 0 : bottomLen - dadoDepth,
    y: span.startX,
    z: 0,
    height: materialThickness,
  };
}

/**
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
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 */
export function bottomConfirmatPilots(side, carcassDepth) {
  const { confirmatDiameter, confirmatPilotDepth } = GLOBAL;
  const span = dadoSpan(carcassDepth);
  const centers = confirmatCenters(span.startX, span.length);
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

/** @deprecated Use endBottomDado */
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
