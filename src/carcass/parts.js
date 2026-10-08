/**
 * Part builders for the 3-part base carcass.
 * Dimensions and joinery features are pure functions of
 * global parameters + live carcass height / width / depth.
 */

import { GLOBAL } from './parameters.js';
import { bottomMortise, bottomTenon } from './joinery.js';

/**
 * @typedef {import('./joinery.js').Box3} Box3
 */

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
    dimensions: {
      height,
      width: depth,
      thickness: materialThickness,
    },
    features: [bottomMortise('left', depth)],
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
    dimensions: {
      height,
      width: depth,
      thickness: materialThickness,
    },
    features: [bottomMortise('right', depth)],
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
    dimensions: {
      length,
      width: depth,
      thickness: materialThickness,
    },
    features: [
      bottomTenon('left', length, depth),
      bottomTenon('right', length, depth),
    ],
  };
}

/**
 * Build the full 3-part set for a carcass envelope.
 *
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
