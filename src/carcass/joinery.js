/**
 * Blind dado mortise (in ends) and matching tenon (on bottom).
 * Geometry is derived from global parameters + live carcass depth.
 */

import { GLOBAL } from './parameters.js';

/**
 * @typedef {object} Box3
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} width
 * @property {number} height
 * @property {number} depth
 */

/**
 * Mortise cut into an end panel's inside face for the bottom.
 * Local part coordinates: X = thickness, Y = depth (front→back), Z = height.
 *
 * @param {'left' | 'right'} side
 * @param {number} carcassDepth
 * @returns {Box3 & { kind: 'mortise', joinery: 'blind-dado', side: string }}
 */
export function bottomMortise(side, carcassDepth) {
  const { materialThickness, dadoDepth, blindShoulder } = GLOBAL;
  const dadoLength = carcassDepth - blindShoulder;

  // Left end: inside face is at +X (toward cabinet interior).
  // Right end: inside face is at -X from the outer face (local X=0 is outside).
  const x = side === 'left' ? materialThickness - dadoDepth : 0;

  return {
    kind: 'mortise',
    joinery: 'blind-dado',
    side,
    x,
    y: blindShoulder,
    z: 0,
    width: dadoDepth,
    height: materialThickness,
    depth: dadoLength,
  };
}

/**
 * Tenon on the bottom panel that seats in an end mortise.
 * Local part coordinates: X = length (left→right), Y = depth (front→back), Z = thickness.
 *
 * @param {'left' | 'right'} side
 * @param {number} bottomLength
 * @param {number} carcassDepth
 * @returns {Box3 & { kind: 'tenon', joinery: 'blind-dado', side: string }}
 */
export function bottomTenon(side, bottomLength, carcassDepth) {
  const { materialThickness, dadoDepth, blindShoulder } = GLOBAL;
  const tenonAlongDepth = carcassDepth - blindShoulder;

  return {
    kind: 'tenon',
    joinery: 'blind-dado',
    side,
    x: side === 'left' ? 0 : bottomLength - dadoDepth,
    y: blindShoulder,
    z: 0,
    width: dadoDepth,
    height: materialThickness,
    depth: tenonAlongDepth,
  };
}
