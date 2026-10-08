/**
 * Part builders for the 3-part base carcass.
 * Each part carries Face A (machining) / Face B metadata and
 * joinery features (dados, rabbets, confirmats, tongues).
 */

import { GLOBAL } from './parameters.js';
import {
  endBottomDado,
  endBackRabbet,
  endConfirmatThrough,
  bottomTenon,
  bottomBackRabbet,
  bottomConfirmatPilots,
} from './joinery.js';

/**
 * Outside length of the bottom panel (left→right), including
 * tenon engagement into each end dado.
 *
 * @param {number} carcassWidth
 * @returns {number}
 */
export function bottomLength(carcassWidth) {
  const { materialThickness, dadoDepth } = GLOBAL;
  return carcassWidth - 2 * materialThickness + 2 * dadoDepth;
}

/**
 * @param {number} height
 * @param {number} depth
 */
export function leftEnd(height, depth) {
  const { materialThickness } = GLOBAL;
  return {
    id: 'left-end',
    name: 'Left End',
    role: 'end',
    side: 'left',
    /** Face A = inside (machining). Face B = outside finished. */
    machiningFace: 'A',
    faceLabels: { A: 'Face A · Inside (machine)', B: 'Face B · Outside' },
    dimensions: {
      height,
      width: depth,
      thickness: materialThickness,
      /** UV for face view */
      u: depth,
      v: height,
    },
    edgebands: {
      front: true,
      rear: false, // broken by back rabbet
      top: true,
      bottom: false, // sits on floor / in toe context
    },
    features: [
      endBottomDado('left', depth, height),
      endBackRabbet('left', depth, height),
      ...endConfirmatThrough('left', depth),
    ],
  };
}

/**
 * @param {number} height
 * @param {number} depth
 */
export function rightEnd(height, depth) {
  const { materialThickness } = GLOBAL;
  return {
    id: 'right-end',
    name: 'Right End',
    role: 'end',
    side: 'right',
    machiningFace: 'A',
    faceLabels: { A: 'Face A · Inside (machine)', B: 'Face B · Outside' },
    dimensions: {
      height,
      width: depth,
      thickness: materialThickness,
      u: depth,
      v: height,
    },
    edgebands: {
      front: true,
      rear: false,
      top: true,
      bottom: false,
    },
    features: [
      endBottomDado('right', depth, height),
      endBackRabbet('right', depth, height),
      ...endConfirmatThrough('right', depth),
    ],
  };
}

/**
 * @param {number} width
 * @param {number} depth
 */
export function bottom(width, depth) {
  const { materialThickness } = GLOBAL;
  const length = bottomLength(width);

  return {
    id: 'bottom',
    name: 'Bottom',
    role: 'bottom',
    machiningFace: 'A',
    faceLabels: { A: 'Face A · Top (machine)', B: 'Face B · Underside' },
    dimensions: {
      length,
      width: depth,
      thickness: materialThickness,
      u: length,
      v: depth,
    },
    edgebands: {
      front: true,
      rear: false,
      left: false, // tenon into dado
      right: false,
    },
    features: [
      bottomTenon('left', length, depth),
      bottomTenon('right', length, depth),
      bottomBackRabbet(length, depth),
      ...bottomConfirmatPilots('left', depth),
      ...bottomConfirmatPilots('right', depth),
    ],
  };
}

/**
 * @param {{ height: number, width: number, depth: number }} envelope
 */
export function buildParts(envelope) {
  const { height, width, depth } = envelope;
  return {
    leftEnd: leftEnd(height, depth),
    rightEnd: rightEnd(height, depth),
    bottom: bottom(width, depth),
  };
}
