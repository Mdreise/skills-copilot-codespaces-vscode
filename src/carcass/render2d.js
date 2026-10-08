/**
 * 2D part canvas helpers.
 * Mortises render as internal pocket paths inside the part boundary —
 * never as external blocks outside the stock outline.
 */

import { GLOBAL } from './parameters.js';

/**
 * @param {number} n
 * @returns {string}
 */
export function fmtInch(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Left/Right End edge section (thickness × depth).
 *
 * Full rectangular stock boundary with the blind dado drawn as a shaded
 * internal pocket path:
 *   - 0.25" deep from the inside face
 *   - starts 0.5" back from the front edge
 *   - terminates at the rear
 *
 * @param {ReturnType<import('./parts.js').leftEnd>} part
 * @param {{ mirror?: boolean }} [opts]
 * @returns {string} SVG markup
 */
export function renderEndSvg(part, opts = {}) {
  const mirror = Boolean(opts.mirror);
  const { width: partDepth, thickness: t } = part.dimensions;
  const { dadoDepth, blindShoulder } = GLOBAL;

  const padX = 14;
  const padY = 18;
  const thickScale = Math.max(10, Math.min(16, (partDepth * 0.4) / t));
  const stockW = partDepth;
  const stockH = t * thickScale;
  const viewW = stockW + padX * 2;
  const viewH = stockH + padY * 2;

  const x0 = padX;
  const y0 = padY;
  const xFront = x0;
  const xShoulder = x0 + blindShoulder;
  const xRear = x0 + stockW;
  const yOutside = y0;
  const yInside = y0 + stockH;
  const pocketH = dadoDepth * thickScale;
  const yPocket = yInside - pocketH;
  const pocketW = partDepth - blindShoulder;

  // Light hatch inside the pocket so it reads as a cut path, not a solid block.
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

  const depthLabelY = y0 - 5;
  const frontLabelX = mirror ? xRear : xFront;
  const rearLabelX = mirror ? xFront : xRear;
  const frontAnchor = mirror ? 'end' : 'start';
  const rearAnchor = mirror ? 'start' : 'end';

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="${part.name} edge view with blind dado pocket">
      <g ${transform}>
        <!-- Full part boundary — pocket stays strictly inside this rect -->
        <rect class="stock" x="${xFront}" y="${yOutside}" width="${stockW}" height="${stockH}" />
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
        <!-- Internal pocket lines: shoulder stop + pocket floor to rear -->
        <path
          class="pocket-outline"
          d="M ${xShoulder} ${yInside}
             L ${xShoulder} ${yPocket}
             L ${xRear} ${yPocket}"
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
      <text class="anno" x="${x0 + stockW / 2}" y="${yInside + 12}" text-anchor="middle">
        ${fmtInch(dadoDepth)}" pocket · ${fmtInch(blindShoulder)}" shoulder
      </text>
      <text class="anno muted" x="${x0 - 4}" y="${y0 + stockH / 2}" text-anchor="middle"
        transform="rotate(-90 ${x0 - 4} ${y0 + stockH / 2})">${fmtInch(t)}" T</text>
    </svg>
  `.trim();
}

/**
 * Bottom plan view with tenon paths drawn inside the part boundary
 * (shouldered tongues along the left/right edges).
 *
 * @param {ReturnType<import('./parts.js').bottom>} part
 * @returns {string}
 */
export function renderBottomSvg(part) {
  const { length: L, width: d } = part.dimensions;
  const [left, right] = part.features;
  const pad = 10;
  const viewW = L + pad * 2;
  const viewH = d + pad * 2;

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="${part.name}">
      <rect class="stock" x="${pad}" y="${pad}" width="${L}" height="${d}" />
      <rect class="pocket" x="${pad + left.x}" y="${pad + left.y}" width="${left.width}" height="${left.depth}">
        <title>Left tenon · inside part boundary</title>
      </rect>
      <rect class="pocket" x="${pad + right.x}" y="${pad + right.y}" width="${right.width}" height="${right.depth}">
        <title>Right tenon · inside part boundary</title>
      </rect>
      <path
        class="pocket-outline"
        d="M ${pad + left.x + left.width} ${pad + left.y}
           L ${pad + left.x} ${pad + left.y}
           L ${pad + left.x} ${pad + left.y + left.depth}
           L ${pad + left.x + left.width} ${pad + left.y + left.depth}"
      />
      <path
        class="pocket-outline"
        d="M ${pad + right.x} ${pad + right.y}
           L ${pad + right.x + right.width} ${pad + right.y}
           L ${pad + right.x + right.width} ${pad + right.y + right.depth}
           L ${pad + right.x} ${pad + right.y + right.depth}"
      />
      <text class="anno" x="${pad}" y="${pad - 2}" text-anchor="start">front</text>
      <text class="anno" x="${pad}" y="${pad + d + 10}" text-anchor="start">rear</text>
    </svg>
  `.trim();
}
