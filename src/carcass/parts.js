/**
 * Part builders for the 3-part base carcass.
 */

import { GLOBAL } from './parameters.js';
import {
  matingPanelWidth,
  notchedDeckPath,
  dadoSpan,
} from './dadoEngine.js';
import {
  endBottomDado,
  endBackRabbet,
  endConfirmatThrough,
  bottomTenon,
  bottomBackRabbet,
  bottomConfirmatPilots,
} from './joinery.js';

/**
 * Mating deck overall width = Clear Opening + (2 × Dado Depth).
 * @param {number} carcassWidth
 */
export function bottomLength(carcassWidth) {
  return matingPanelWidth(carcassWidth);
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
  const { materialThickness, dadoDepth } = GLOBAL;
  const length = bottomLength(width);
  const span = dadoSpan(depth);
  const outlinePath = notchedDeckPath(
    length,
    depth,
    span.frontShoulder,
    dadoDepth,
  );

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
      clearOpening: width - 2 * materialThickness,
    },
    outlinePath,
    frontShoulderNotch: span.frontShoulder,
    edgebands: {
      front: true,
      rear: false,
      left: false,
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
