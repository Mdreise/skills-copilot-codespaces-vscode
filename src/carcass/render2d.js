/**
 * 2D part canvas helpers.
 * Mortises render as internal pocket paths inside the part boundary —
 * never as external blocks outside the stock outline.
 *
 * Overlays:
 *   - solid  `cut-perimeter`  → outer profile cuts
 *   - dashed `cut-pocket`     → blind dado / tongue paths on the inside face
 *   - `dim-*` callouts        → live 0.5" front shoulder offset on the graphic
 */

import { GLOBAL } from './parameters.js';

/**
 * @param {number} n
 * @returns {string}
 */
export function fmtInch(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/** Padding used by end edge view — kept exported for tests. */
export const END_PAD_X = 16;
export const END_PAD_Y = 20;

/**
 * Horizontal dimension callout with witness lines + label.
 * @param {number} x1
 * @param {number} x2
 * @param {number} y
 * @param {string} label
 * @param {string} [id]
 */
export function dimHorizontal(x1, x2, y, label, id = 'dim') {
  const mid = (x1 + x2) / 2;
  const tick = 1.6;
  const value = String(label).replace(/"$/, '');
  return `
    <g class="dim" data-dim="${id}" data-value="${value}">
      <line class="dim-witness" x1="${x1}" y1="${y - tick}" x2="${x1}" y2="${y + tick}" />
      <line class="dim-witness" x1="${x2}" y1="${y - tick}" x2="${x2}" y2="${y + tick}" />
      <line class="dim-line" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />
      <polygon class="dim-arrow" points="${x1},${y} ${x1 + 1.4},${y - 0.7} ${x1 + 1.4},${y + 0.7}" />
      <polygon class="dim-arrow" points="${x2},${y} ${x2 - 1.4},${y - 0.7} ${x2 - 1.4},${y + 0.7}" />
      <text class="dim-label" x="${mid}" y="${y - 1.4}" text-anchor="middle">${label}</text>
    </g>
  `.trim();
}

/**
 * Vertical dimension callout with witness lines + label.
 * @param {number} x
 * @param {number} y1
 * @param {number} y2
 * @param {string} label
 * @param {string} [id]
 */
export function dimVertical(x, y1, y2, label, id = 'dim') {
  const mid = (y1 + y2) / 2;
  const tick = 1.6;
  const value = String(label).replace(/"$/, '');
  return `
    <g class="dim" data-dim="${id}" data-value="${value}">
      <line class="dim-witness" x1="${x - tick}" y1="${y1}" x2="${x + tick}" y2="${y1}" />
      <line class="dim-witness" x1="${x - tick}" y1="${y2}" x2="${x + tick}" y2="${y2}" />
      <line class="dim-line" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" />
      <polygon class="dim-arrow" points="${x},${y1} ${x - 0.7},${y1 + 1.4} ${x + 0.7},${y1 + 1.4}" />
      <polygon class="dim-arrow" points="${x},${y2} ${x - 0.7},${y2 - 1.4} ${x + 0.7},${y2 - 1.4}" />
      <text class="dim-label" x="${x + 2.2}" y="${mid + 0.9}" text-anchor="start">${label}</text>
    </g>
  `.trim();
}

/**
 * Left/Right End edge section (thickness × depth).
 *
 * @param {ReturnType<import('./parts.js').leftEnd>} part
 * @param {{ mirror?: boolean }} [opts]
 * @returns {string} SVG markup
 */
export function renderEndSvg(part, opts = {}) {
  const mirror = Boolean(opts.mirror);
  const { width: partDepth, thickness: t } = part.dimensions;
  const { dadoDepth, blindShoulder } = GLOBAL;

  const padX = END_PAD_X;
  const padY = END_PAD_Y;
  const thickScale = Math.max(10, Math.min(16, (partDepth * 0.4) / t));
  const stockW = partDepth;
  const stockH = t * thickScale;
  const viewW = stockW + padX * 2;
  const viewH = stockH + padY * 2 + 6;

  const xFront = padX;
  const xShoulder = padX + blindShoulder;
  const xRear = padX + stockW;
  const yOutside = padY;
  const yInside = padY + stockH;
  const pocketH = dadoDepth * thickScale;
  const yPocket = yInside - pocketH;
  const pocketW = partDepth - blindShoulder;

  const hatchGap = Math.max(1.1, pocketH * 0.55);
  /** @type {string[]} */
  const hatches = [];
  for (let x = xShoulder + hatchGap; x < xRear; x += hatchGap) {
    hatches.push(
      `<line class="pocket-hatch" x1="${x}" y1="${yPocket}" x2="${x}" y2="${yInside}" />`,
    );
  }

  const transform = mirror
    ? `transform="translate(${viewW},0) scale(-1,1)"`
    : '';

  const depthLabelY = padY - 6;
  const frontLabelX = mirror ? xRear : xFront;
  const rearLabelX = mirror ? xFront : xRear;
  const frontAnchor = mirror ? 'end' : 'start';
  const rearAnchor = mirror ? 'start' : 'end';

  const dimY = yInside + 5.5;
  const shoulderLabel = `${fmtInch(blindShoulder)}"`;
  // Dimension group stays outside the mirror transform so text is not reversed.
  const dimGroup = mirror
    ? dimHorizontal(viewW - xShoulder, viewW - xFront, dimY, shoulderLabel, 'front-shoulder')
    : dimHorizontal(xFront, xShoulder, dimY, shoulderLabel, 'front-shoulder');

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="${part.name} edge view with blind dado pocket">
      <g ${transform}>
        <rect class="stock" x="${xFront}" y="${yOutside}" width="${stockW}" height="${stockH}" />
        <rect
          class="cut-perimeter"
          x="${xFront}"
          y="${yOutside}"
          width="${stockW}"
          height="${stockH}"
          data-cut="perimeter"
        />
        <rect
          class="pocket"
          x="${xShoulder}"
          y="${yPocket}"
          width="${pocketW}"
          height="${pocketH}"
          data-pocket-depth="${dadoDepth}"
          data-pocket-start="${blindShoulder}"
          data-pocket-end="${partDepth}"
        >
          <title>Blind dado pocket · ${fmtInch(dadoDepth)}" deep · starts ${fmtInch(blindShoulder)}" from front · to rear</title>
        </rect>
        ${hatches.join('\n        ')}
        <path
          class="cut-pocket"
          data-cut="blind-dado"
          d="M ${xShoulder} ${yInside}
             L ${xShoulder} ${yPocket}
             L ${xRear} ${yPocket}
             L ${xRear} ${yInside}"
        />
        <line
          class="guide"
          x1="${xFront}"
          y1="${yInside}"
          x2="${xShoulder}"
          y2="${yInside}"
        />
      </g>
      <text class="anno" x="${frontLabelX}" y="${depthLabelY}" text-anchor="${frontAnchor}">front</text>
      <text class="anno" x="${rearLabelX}" y="${depthLabelY}" text-anchor="${rearAnchor}">rear</text>
      ${dimGroup}
      <text class="anno muted" x="${padX - 5}" y="${padY + stockH / 2}" text-anchor="middle"
        transform="rotate(-90 ${padX - 5} ${padY + stockH / 2})">${fmtInch(t)}" T</text>
      <text class="anno cut-legend" x="${padX + stockW / 2}" y="${viewH - 2.5}" text-anchor="middle">
        solid = perimeter · dashed = pocket
      </text>
    </svg>
  `.trim();
}

/**
 * Bottom plan view with tenon paths drawn inside the part boundary.
 *
 * @param {ReturnType<import('./parts.js').bottom>} part
 * @returns {string}
 */
export function renderBottomSvg(part) {
  const { length: L, width: d } = part.dimensions;
  const [left, right] = part.features;
  const { blindShoulder } = GLOBAL;
  const padX = 12;
  const padY = 14;
  const viewW = L + padX * 2;
  const viewH = d + padY * 2 + 8;

  const x0 = padX;
  const y0 = padY;
  const yShoulder = y0 + blindShoulder;
  const yRear = y0 + d;
  const shoulderLabel = `${fmtInch(blindShoulder)}"`;

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="${part.name}">
      <rect class="stock" x="${x0}" y="${y0}" width="${L}" height="${d}" />
      <rect
        class="cut-perimeter"
        x="${x0}"
        y="${y0}"
        width="${L}"
        height="${d}"
        data-cut="perimeter"
      />
      <rect class="pocket" x="${x0 + left.x}" y="${y0 + left.y}" width="${left.width}" height="${left.depth}">
        <title>Left tenon · inside part boundary</title>
      </rect>
      <rect class="pocket" x="${x0 + right.x}" y="${y0 + right.y}" width="${right.width}" height="${right.depth}">
        <title>Right tenon · inside part boundary</title>
      </rect>
      <path
        class="cut-pocket"
        data-cut="tongue-left"
        d="M ${x0 + left.x + left.width} ${y0 + left.y}
           L ${x0 + left.x} ${y0 + left.y}
           L ${x0 + left.x} ${y0 + left.y + left.depth}
           L ${x0 + left.x + left.width} ${y0 + left.y + left.depth}"
      />
      <path
        class="cut-pocket"
        data-cut="tongue-right"
        d="M ${x0 + right.x} ${y0 + right.y}
           L ${x0 + right.x + right.width} ${y0 + right.y}
           L ${x0 + right.x + right.width} ${y0 + right.y + right.depth}
           L ${x0 + right.x} ${y0 + right.y + right.depth}"
      />
      <line class="guide" x1="${x0}" y1="${yShoulder}" x2="${x0 + L}" y2="${yShoulder}" />
      ${dimVertical(x0 + L / 2, y0, yShoulder, shoulderLabel, 'front-shoulder')}
      <text class="anno" x="${x0}" y="${y0 - 5}" text-anchor="start">front</text>
      <text class="anno" x="${x0}" y="${yRear + 6}" text-anchor="start">rear</text>
      <text class="anno cut-legend" x="${x0 + L / 2}" y="${viewH - 2}" text-anchor="middle">
        solid = perimeter · dashed = tongue
      </text>
    </svg>
  `.trim();
}
