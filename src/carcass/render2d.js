/**
 * Legacy 2D helpers + shared formatting.
 * Part cards now render through renderPartSvg (Face A/B engine).
 */

import { renderPartSvg } from './renderPart.js';

/**
 * @param {number} n
 * @returns {string}
 */
export function fmtInch(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/** @deprecated padding constant from prior edge-view renderer */
export const END_PAD_X = 16;

/**
 * @param {number} x1
 * @param {number} x2
 * @param {number} y
 * @param {string} label
 * @param {string} [id]
 */
export function dimHorizontal(x1, x2, y, label, id = 'dim') {
  const mid = (x1 + x2) / 2;
  const value = String(label).replace(/"$/, '');
  return `
    <g class="dim" data-dim="${id}" data-value="${value}">
      <line class="dim-line" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />
      <text class="dim-label" x="${mid}" y="${y - 1.4}" text-anchor="middle">${label}</text>
    </g>
  `.trim();
}

/**
 * @param {number} x
 * @param {number} y1
 * @param {number} y2
 * @param {string} label
 * @param {string} [id]
 */
export function dimVertical(x, y1, y2, label, id = 'dim') {
  const mid = (y1 + y2) / 2;
  const value = String(label).replace(/"$/, '');
  return `
    <g class="dim" data-dim="${id}" data-value="${value}">
      <line class="dim-line" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" />
      <text class="dim-label" x="${x + 2.2}" y="${mid + 0.9}" text-anchor="start">${label}</text>
    </g>
  `.trim();
}

/**
 * @param {object} part
 * @param {{ mirror?: boolean, face?: 'A' | 'B' }} [opts]
 */
export function renderEndSvg(part, opts = {}) {
  return renderPartSvg(part, { face: opts.face ?? 'A' });
}

/**
 * @param {object} part
 * @param {{ face?: 'A' | 'B' }} [opts]
 */
export function renderBottomSvg(part, opts = {}) {
  return renderPartSvg(part, { face: opts.face ?? 'A' });
}
