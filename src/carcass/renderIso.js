/**
 * 2.5D isometric exploded assembly view.
 * Parts separate along their axes so blind-dado pockets on the ends
 * and matching tongues on the deck stay readable together.
 */

import { GLOBAL } from './parameters.js';
import { fmtInch } from './render2d.js';

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

/**
 * Project world (x right, y depth/back, z up) → isometric screen.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{ x: number, y: number }}
 */
export function projectIso(x, y, z) {
  return {
    x: (x - y) * COS30,
    y: (x + y) * SIN30 - z,
  };
}

/**
 * @param {{ x: number, y: number, z: number }} origin
 * @param {{ x: number, y: number, z: number }} size
 */
function boxCorners(origin, size) {
  const { x, y, z } = origin;
  const { x: sx, y: sy, z: sz } = size;
  return {
    b000: projectIso(x, y, z),
    b100: projectIso(x + sx, y, z),
    b010: projectIso(x, y + sy, z),
    b110: projectIso(x + sx, y + sy, z),
    t000: projectIso(x, y, z + sz),
    t100: projectIso(x + sx, y, z + sz),
    t010: projectIso(x, y + sy, z + sz),
    t110: projectIso(x + sx, y + sy, z + sz),
  };
}

/**
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @param {{ x: number, y: number }} c
 * @param {{ x: number, y: number }} d
 * @param {string} className
 */
function quad(a, b, c, d, className) {
  return `<path class="${className}" d="M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} L ${d.x} ${d.y} Z" />`;
}

/**
 * Axis-aligned box in isometric view (visible faces).
 * @param {{ x: number, y: number, z: number }} origin
 * @param {{ x: number, y: number, z: number }} size
 * @param {{ stock?: string, top?: string, side?: string }} [classes]
 */
export function renderIsoBox(origin, size, classes = {}) {
  const c = boxCorners(origin, size);
  const stock = classes.stock ?? 'iso-stock';
  const top = classes.top ?? 'iso-face-top';
  const side = classes.side ?? 'iso-face-side';
  return [
    quad(c.b010, c.b110, c.t110, c.t010, side),
    quad(c.b100, c.b110, c.t110, c.t100, side),
    quad(c.b000, c.b100, c.t100, c.t000, stock),
    quad(c.b000, c.b010, c.t010, c.t000, side),
    quad(c.t000, c.t100, c.t110, c.t010, top),
  ].join('\n');
}

/**
 * Explode offsets along world axes (inches).
 * @param {{ height: number, width: number, depth: number }} envelope
 * @param {number} [factor]
 */
export function explodeOffsets(envelope, factor = 0.28) {
  const span = Math.max(envelope.width, envelope.depth, envelope.height);
  const gap = Math.max(2.5, span * factor);
  return {
    leftX: -gap,
    rightX: gap,
    bottomZ: -gap * 0.85,
    bottomY: -gap * 0.2,
  };
}

/**
 * World placement for each part (assembled or exploded).
 * @param {import('./BaseCarcass.js').BaseCarcass} carcass
 * @param {{ exploded?: boolean }} [opts]
 */
export function assemblyLayout(carcass, opts = {}) {
  const exploded = Boolean(opts.exploded);
  const { height: H, width: W, depth: D } = carcass.envelope;
  const { materialThickness: T, dadoDepth, blindShoulder } = GLOBAL;
  const ex = exploded
    ? explodeOffsets(carcass.envelope)
    : { leftX: 0, rightX: 0, bottomZ: 0, bottomY: 0 };

  const bottomLength = W - 2 * T + 2 * dadoDepth;

  return {
    leftEnd: {
      origin: { x: ex.leftX, y: 0, z: 0 },
      size: { x: T, y: D, z: H },
      pocket: {
        origin: {
          x: ex.leftX + T - dadoDepth,
          y: blindShoulder,
          z: 0,
        },
        size: {
          x: dadoDepth,
          y: D - blindShoulder,
          z: T,
        },
      },
    },
    rightEnd: {
      origin: { x: W - T + ex.rightX, y: 0, z: 0 },
      size: { x: T, y: D, z: H },
      pocket: {
        origin: {
          x: W - T + ex.rightX,
          y: blindShoulder,
          z: 0,
        },
        size: {
          x: dadoDepth,
          y: D - blindShoulder,
          z: T,
        },
      },
    },
    bottom: {
      origin: {
        x: T - dadoDepth,
        y: ex.bottomY,
        z: ex.bottomZ,
      },
      size: { x: bottomLength, y: D, z: T },
      tongues: {
        left: {
          origin: {
            x: T - dadoDepth,
            y: ex.bottomY + blindShoulder,
            z: ex.bottomZ,
          },
          size: {
            x: dadoDepth,
            y: D - blindShoulder,
            z: T,
          },
        },
        right: {
          origin: {
            x: T - dadoDepth + bottomLength - dadoDepth,
            y: ex.bottomY + blindShoulder,
            z: ex.bottomZ,
          },
          size: {
            x: dadoDepth,
            y: D - blindShoulder,
            z: T,
          },
        },
      },
    },
    explode: ex,
    envelope: { H, W, D },
  };
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {string} text
 * @param {string} [className]
 */
function labelAt(x, y, z, text, className = 'iso-label') {
  const p = projectIso(x, y, z);
  return `<text class="${className}" x="${p.x}" y="${p.y}" text-anchor="middle">${text}</text>`;
}

/**
 * @param {Array<{ x: number, y: number, z: number }>} points
 */
function collectBounds(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    const s = projectIso(p.x, p.y, p.z);
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x);
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y);
  }
  return {
    minX: minX - 4,
    minY: minY - 6,
    maxX: maxX + 4,
    maxY: maxY + 6,
  };
}

/**
 * Corners of an origin+size box for bounds fitting.
 * @param {{ x: number, y: number, z: number }} origin
 * @param {{ x: number, y: number, z: number }} size
 */
function boxPoints(origin, size) {
  const xs = [origin.x, origin.x + size.x];
  const ys = [origin.y, origin.y + size.y];
  const zs = [origin.z, origin.z + size.z];
  /** @type {Array<{ x: number, y: number, z: number }>} */
  const pts = [];
  for (const x of xs) for (const y of ys) for (const z of zs) pts.push({ x, y, z });
  return pts;
}

/**
 * Exploded (or assembled) isometric SVG for the 3-part carcass.
 *
 * @param {import('./BaseCarcass.js').BaseCarcass} carcass
 * @param {{ exploded?: boolean }} [opts]
 * @returns {string}
 */
export function renderIsoAssembly(carcass, opts = {}) {
  const exploded = opts.exploded !== false;
  const layout = assemblyLayout(carcass, { exploded });
  const { leftEnd, rightEnd, bottom, envelope } = layout;

  const parts = [
    `<g class="iso-part" data-part="left-end">`,
    renderIsoBox(leftEnd.origin, leftEnd.size),
    renderIsoBox(leftEnd.pocket.origin, leftEnd.pocket.size, {
      stock: 'iso-pocket',
      top: 'iso-pocket',
      side: 'iso-pocket',
    }),
    `</g>`,
    `<g class="iso-part" data-part="bottom">`,
    renderIsoBox(bottom.origin, bottom.size, {
      stock: 'iso-deck',
      top: 'iso-deck-top',
      side: 'iso-deck',
    }),
    renderIsoBox(bottom.tongues.left.origin, bottom.tongues.left.size, {
      stock: 'iso-tongue',
      top: 'iso-tongue',
      side: 'iso-tongue',
    }),
    renderIsoBox(bottom.tongues.right.origin, bottom.tongues.right.size, {
      stock: 'iso-tongue',
      top: 'iso-tongue',
      side: 'iso-tongue',
    }),
    `</g>`,
    `<g class="iso-part" data-part="right-end">`,
    renderIsoBox(rightEnd.origin, rightEnd.size),
    renderIsoBox(rightEnd.pocket.origin, rightEnd.pocket.size, {
      stock: 'iso-pocket',
      top: 'iso-pocket',
      side: 'iso-pocket',
    }),
    `</g>`,
  ];

  const callouts = exploded
    ? [
        labelAt(
          leftEnd.pocket.origin.x + leftEnd.pocket.size.x,
          leftEnd.pocket.origin.y + leftEnd.pocket.size.y * 0.55,
          leftEnd.pocket.origin.z + leftEnd.pocket.size.z + 1.4,
          `pocket ${fmtInch(GLOBAL.dadoDepth)}"`,
          'iso-callout',
        ),
        labelAt(
          bottom.tongues.left.origin.x + bottom.tongues.left.size.x * 0.5,
          bottom.tongues.left.origin.y + bottom.tongues.left.size.y * 0.4,
          bottom.tongues.left.origin.z - 1.6,
          'tongue',
          'iso-callout',
        ),
        labelAt(
          rightEnd.pocket.origin.x,
          rightEnd.pocket.origin.y + rightEnd.pocket.size.y * 0.55,
          rightEnd.pocket.origin.z + rightEnd.pocket.size.z + 1.4,
          `pocket ${fmtInch(GLOBAL.dadoDepth)}"`,
          'iso-callout',
        ),
        labelAt(
          bottom.tongues.right.origin.x + bottom.tongues.right.size.x * 0.5,
          bottom.tongues.right.origin.y + bottom.tongues.right.size.y * 0.4,
          bottom.tongues.right.origin.z - 1.6,
          'tongue',
          'iso-callout',
        ),
        labelAt(
          leftEnd.origin.x + leftEnd.size.x * 0.5,
          -1.4,
          envelope.H * 0.55,
          'Left End',
          'iso-label',
        ),
        labelAt(
          rightEnd.origin.x + rightEnd.size.x * 0.5,
          -1.4,
          envelope.H * 0.55,
          'Right End',
          'iso-label',
        ),
        labelAt(
          bottom.origin.x + bottom.size.x * 0.5,
          bottom.origin.y + bottom.size.y * 0.55,
          bottom.origin.z - 2.4,
          'Bottom (deck)',
          'iso-label',
        ),
      ].join('\n')
    : labelAt(envelope.W * 0.5, -1.8, envelope.H + 1.8, 'Assembled', 'iso-label');

  const bounds = collectBounds([
    ...boxPoints(leftEnd.origin, leftEnd.size),
    ...boxPoints(rightEnd.origin, rightEnd.size),
    ...boxPoints(bottom.origin, bottom.size),
  ]);

  const viewW = bounds.maxX - bounds.minX;
  const viewH = bounds.maxY - bounds.minY;
  const tx = -bounds.minX;
  const ty = -bounds.minY;

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img"
      aria-label="${exploded ? 'Exploded' : 'Assembled'} isometric carcass showing blind dado pockets and deck tongues"
      data-view="${exploded ? 'exploded-iso' : 'assembled-iso'}"
      data-exploded="${exploded ? 'true' : 'false'}">
      <g transform="translate(${tx} ${ty})">
        ${parts.join('\n')}
        ${callouts}
      </g>
    </svg>
  `.trim();
}
