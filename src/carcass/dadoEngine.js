/**
 * Dado span, tenon matching, and CNC corner-relief geometry.
 */

import { GLOBAL } from './parameters.js';

/**
 * @typedef {object} DadoSpan
 * @property {number} startX  front→back start of pocket
 * @property {number} endX    front→back end of pocket
 * @property {number} length
 * @property {number} frontShoulder
 * @property {number} rearShoulder
 * @property {'blind' | 'stopped' | 'through'} mode
 */

/**
 * Compute pocket span along panel depth for the active dado mode.
 * @param {number} panelDepth
 * @returns {DadoSpan}
 */
export function dadoSpan(panelDepth) {
  const mode = GLOBAL.dadoMode;
  let frontShoulder = 0;
  let rearShoulder = 0;

  if (mode === 'blind') {
    frontShoulder = GLOBAL.frontShoulder;
    rearShoulder = 0;
  } else if (mode === 'stopped') {
    frontShoulder = GLOBAL.frontShoulder;
    rearShoulder = GLOBAL.rearShoulder;
  } else {
    frontShoulder = 0;
    rearShoulder = 0;
  }

  if (frontShoulder + rearShoulder >= panelDepth) {
    throw new Error(
      `Shoulders (${frontShoulder}+${rearShoulder}) must be less than panel depth (${panelDepth})`,
    );
  }

  const startX = frontShoulder;
  const endX = panelDepth - rearShoulder;
  return {
    startX,
    endX,
    length: endX - startX,
    frontShoulder,
    rearShoulder,
    mode,
  };
}

/**
 * Clear opening between inside faces of the ends.
 * @param {number} carcassWidth
 */
export function clearOpening(carcassWidth) {
  return carcassWidth - 2 * GLOBAL.materialThickness;
}

/**
 * Mating deck/shelf overall width = Clear Opening + (2 × Dado Depth).
 * @param {number} carcassWidth
 */
export function matingPanelWidth(carcassWidth) {
  return clearOpening(carcassWidth) + 2 * GLOBAL.dadoDepth;
}

/**
 * Front-corner shoulder notches on the mating deck.
 * Returns the two notch rectangles in deck UV (x left→right, y front→back).
 *
 * @param {number} deckLength  overall length including tenons
 * @param {number} frontShoulder
 */
export function tenonShoulderNotches(deckLength, frontShoulder) {
  const { dadoDepth } = GLOBAL;
  if (frontShoulder <= 0) return [];
  return [
    {
      side: 'left',
      x: 0,
      y: 0,
      width: dadoDepth,
      height: frontShoulder,
    },
    {
      side: 'right',
      x: deckLength - dadoDepth,
      y: 0,
      width: dadoDepth,
      height: frontShoulder,
    },
  ];
}

/**
 * SVG path for the notched deck outline (plan view).
 * Front edge is flush; corners notched back by front shoulder.
 *
 * @param {number} length
 * @param {number} depth
 * @param {number} frontShoulder
 * @param {number} tenonDepth
 */
export function notchedDeckPath(length, depth, frontShoulder, tenonDepth) {
  const fs = frontShoulder;
  const t = tenonDepth;
  if (fs <= 0) {
    return `M 0 0 L ${length} 0 L ${length} ${depth} L 0 ${depth} Z`;
  }
  // Walk clockwise from front-left of flush face
  return [
    `M ${t} 0`,
    `L ${length - t} 0`,
    `L ${length - t} ${fs}`,
    `L ${length} ${fs}`,
    `L ${length} ${depth}`,
    `L 0 ${depth}`,
    `L 0 ${fs}`,
    `L ${t} ${fs}`,
    'Z',
  ].join(' ');
}

/**
 * Dog-bone ear centers at the blind (front) end of a pocket.
 * 45° overcuts allow a square tenon to seat fully.
 *
 * Pocket rect in face UV: x along depth, y across groove width.
 *
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} [radius]
 */
export function dogBoneEars(rect, radius = GLOBAL.bitDiameter / 2) {
  const r = radius;
  // Blind end is the front of the pocket (min x) for standard blind/stopped
  return [
    { id: 'blind-top', cx: rect.x, cy: rect.y, r, angle: 225 },
    { id: 'blind-bottom', cx: rect.x, cy: rect.y + rect.height, r, angle: 135 },
  ];
}

/**
 * Rounded-tenon fillet radius (= bit radius) when relief mode is rounded-tenon.
 */
export function tenonCornerRadius() {
  if (GLOBAL.cornerRelief !== 'rounded-tenon') return 0;
  return GLOBAL.bitDiameter / 2;
}

/**
 * Whether the pocket side gets dog-bone ears.
 */
export function useDogBoneOnPocket() {
  return GLOBAL.cornerRelief === 'dogbone';
}

/**
 * Captured-back groove rect on an end (Face A UV).
 * @param {number} panelDepth
 * @param {number} panelHeight
 */
export function capturedBackGroove(panelDepth, panelHeight) {
  const { backThickness, backGrooveOffset, dadoDepth } = GLOBAL;
  const x = panelDepth - backGrooveOffset - backThickness;
  return {
    id: 'captured-back-groove',
    kind: 'groove',
    joinery: 'captured-back',
    face: 'A',
    depth: dadoDepth,
    width: backThickness,
    rect: {
      x: Math.max(0, x),
      y: 0,
      width: backThickness,
      height: panelHeight,
    },
    offsetFromRear: backGrooveOffset,
    label: `Back groove: ${dadoDepth}" deep × ${backThickness}" @ ${backGrooveOffset}" from rear`,
  };
}
