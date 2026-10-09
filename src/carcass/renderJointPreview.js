/**
 * Compact isometric joint preview: male tongue / confirmat entering
 * the female dado / bore on the mating end.
 */

import { GLOBAL } from './parameters.js';
import { projectIso, renderIsoBox } from './renderIso.js';
import { fmtInch } from './render2d.js';

/**
 * @param {'left' | 'right'} [side]
 * @returns {string}
 */
export function renderJointPreview(side = 'left') {
  const { materialThickness: T, dadoDepth, blindShoulder } = GLOBAL;
  const run = 6;
  const endH = 4;
  const gap = 1.4;

  const endOrigin = { x: 0, y: 0, z: 0 };
  const endSize = { x: T, y: run + blindShoulder, z: endH };
  const pocketOrigin = {
    x: side === 'left' ? T - dadoDepth : 0,
    y: blindShoulder,
    z: 0,
  };
  const pocketSize = { x: dadoDepth, y: run, z: T };

  const tongueOrigin = {
    x: side === 'left' ? T - dadoDepth + gap : -gap,
    y: blindShoulder,
    z: -gap * 0.9,
  };
  const tongueSize = { x: dadoDepth, y: run, z: T };

  const screwX =
    side === 'left'
      ? tongueOrigin.x + dadoDepth / 2
      : tongueOrigin.x + dadoDepth / 2;
  const screwY = blindShoulder + run * 0.45;
  const screwZ0 = tongueOrigin.z + T;
  const screwZ1 = pocketOrigin.z + T + 0.8;
  const s0 = projectIso(screwX, screwY, screwZ0);
  const s1 = projectIso(screwX, screwY, screwZ1);

  const pts = [
    endOrigin,
    { x: endOrigin.x + endSize.x, y: endOrigin.y + endSize.y, z: endOrigin.z + endSize.z },
    tongueOrigin,
    { x: tongueOrigin.x + tongueSize.x, y: tongueOrigin.y + tongueSize.y, z: tongueOrigin.z + tongueSize.z },
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    for (const z of [p.z, p.z + (p.z === endOrigin.z ? endSize.z : 0)]) {
      const s = projectIso(p.x, p.y, z === p.z ? p.z : z);
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y);
    }
  }
  // sample more corners
  for (const o of [endOrigin, tongueOrigin]) {
    const sz = o === endOrigin ? endSize : tongueSize;
    for (const x of [o.x, o.x + sz.x]) {
      for (const y of [o.y, o.y + sz.y]) {
        for (const z of [o.z, o.z + sz.z]) {
          const s = projectIso(x, y, z);
          minX = Math.min(minX, s.x);
          maxX = Math.max(maxX, s.x);
          minY = Math.min(minY, s.y);
          maxY = Math.max(maxY, s.y);
        }
      }
    }
  }
  minX -= 2;
  maxX += 2;
  minY -= 3;
  maxY += 3;

  return `
    <svg viewBox="0 0 ${maxX - minX} ${maxY - minY}" role="img"
      aria-label="Joint preview: tongue and confirmat into blind dado"
      data-joint-preview="blind-dado-confirmat"
      class="joint-preview-svg">
      <g transform="translate(${-minX} ${-minY})">
        ${renderIsoBox(endOrigin, endSize)}
        ${renderIsoBox(pocketOrigin, pocketSize, {
          stock: 'iso-pocket',
          top: 'iso-pocket',
          side: 'iso-pocket',
        })}
        ${renderIsoBox(tongueOrigin, tongueSize, {
          stock: 'iso-tongue',
          top: 'iso-tongue',
          side: 'iso-tongue',
        })}
        <line class="joint-screw" x1="${s0.x}" y1="${s0.y}" x2="${s1.x}" y2="${s1.y}" />
        <circle class="joint-screw-head" cx="${s1.x}" cy="${s1.y}" r="0.35" />
        <text class="iso-callout" x="${projectIso(pocketOrigin.x + pocketSize.x, pocketOrigin.y + run * 0.5, pocketOrigin.z + T + 1.2).x}"
          y="${projectIso(pocketOrigin.x + pocketSize.x, pocketOrigin.y + run * 0.5, pocketOrigin.z + T + 1.2).y}"
          text-anchor="middle">dado ${fmtInch(dadoDepth)}"</text>
        <text class="iso-callout" x="${projectIso(tongueOrigin.x + tongueSize.x * 0.5, tongueOrigin.y + run * 0.3, tongueOrigin.z - 1.1).x}"
          y="${projectIso(tongueOrigin.x + tongueSize.x * 0.5, tongueOrigin.y + run * 0.3, tongueOrigin.z - 1.1).y}"
          text-anchor="middle">tongue</text>
      </g>
    </svg>
  `.trim();
}
