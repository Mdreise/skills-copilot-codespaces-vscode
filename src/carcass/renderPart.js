/**
 * Standardized shop-floor part-card renderer.
 *
 * Face A — machining: gray inset dados, dashed cuts, dog-bones / rounded
 *          tenons, red stop tags, confirmat bores, notched deck outline.
 * Face B — light-blue dashed hidden detail only.
 * Hover titles carry Front Shoulder, Dado Depth, Groove Width, Bit Radius.
 */

import { GLOBAL, inchToMm } from './parameters.js';
import { fmtInch } from './render2d.js';

/**
 * @param {number} n
 * @param {number} [digits]
 */
function fmtMm(n, digits = 0) {
  const v = inchToMm(n);
  return digits === 0 ? String(Math.round(v)) : v.toFixed(digits);
}

/**
 * @param {object} hover
 */
function hoverTitle(hover) {
  if (!hover) return '';
  const lines = [
    `Front Shoulder Offset: ${fmtInch(hover.frontShoulderOffset ?? 0)}"`,
    hover.rearShoulderOffset
      ? `Rear Shoulder Offset: ${fmtInch(hover.rearShoulderOffset)}"`
      : null,
    `Dado Depth: ${fmtInch(hover.dadoDepth)}"`,
    `Material Groove Width: ${fmtInch(hover.materialGrooveWidth)}"`,
    `Bit Radius Allowance: ${fmtInch(hover.bitRadiusAllowance)}"`,
    hover.cornerRelief ? `Corner Relief: ${hover.cornerRelief}` : null,
    hover.cornerRadius ? `Tenon Corner Radius: ${fmtInch(hover.cornerRadius)}"` : null,
  ].filter(Boolean);
  return lines.join(' · ');
}

/**
 * @param {string} id
 */
function hatchDef(id) {
  return `
    <pattern id="${id}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line class="rabbet-hatch-line" x1="0" y1="0" x2="0" y2="3" />
    </pattern>
  `;
}

/**
 * Dog-bone ear path (45° overcut circle at blind corner).
 * @param {{ cx: number, cy: number, r: number, id: string }} ear
 * @param {number} svgY  flipped Y for end elevation
 */
function dogBonePath(ear, svgY) {
  return `
    <circle
      class="dogbone"
      data-ear="${ear.id}"
      cx="${ear.cx}"
      cy="${svgY}"
      r="${ear.r}"
    />
  `;
}

/**
 * Rounded rectangle path for tenon with fillet at front (blind) corners.
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} radius
 * @param {'left' | 'right'} side
 */
function roundedTenonPath(rect, radius, side) {
  const r = Math.min(radius, rect.width / 2, rect.height / 2);
  const { x, y, width: w, height: h } = rect;
  // Fillet the front corners of the tongue (min-y end in plan view)
  if (side === 'left') {
    // front-left outer + front-right (toward panel) at y
    return [
      `M ${x} ${y + r}`,
      `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
      `L ${x + w} ${y}`,
      `L ${x + w} ${y + h}`,
      `L ${x} ${y + h}`,
      'Z',
    ].join(' ');
  }
  return [
    `M ${x} ${y}`,
    `L ${x + w - r} ${y}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `L ${x + w} ${y + h}`,
    `L ${x} ${y + h}`,
    'Z',
  ].join(' ');
}

/**
 * @param {object} part
 * @param {'A' | 'B'} face
 * @param {object} feature
 */
function renderDado(part, face, feature) {
  const { rect, depth, width, frontShoulder, stopLabel, dogBones = [], hover } = feature;
  const title = hoverTitle(hover);

  if (face === 'B') {
    return `
      <g class="dado-hidden-group" data-feature="${feature.id}" data-face="B">
        <title>${title}</title>
        <rect
          class="dado-hidden"
          x="${rect.x}"
          y="${part.dimensions.v - rect.y - rect.height}"
          width="${rect.width}"
          height="${rect.height}"
        />
      </g>
    `;
  }

  const x = rect.x;
  const y = part.dimensions.v - rect.y - rect.height;
  const calloutX = x + rect.width * 0.45;
  const calloutY = y - 2.2;
  const stopX = x;
  const stopY = y + rect.height / 2;

  const bones = (dogBones || [])
    .map((ear) => {
      // Map ear cy (part UV y from bottom) into SVG y
      const svgY = part.dimensions.v - ear.cy;
      return dogBonePath(ear, svgY);
    })
    .join('\n');

  const stop =
    frontShoulder > 0 && stopLabel
      ? `
      <g class="stop-tag" data-stop="${frontShoulder}">
        <rect class="stop-tag-bg" x="${stopX - 0.15}" y="${stopY - 1.5}" width="5.2" height="3" rx="0.3" />
        <text class="stop-tag-label" x="${stopX + 2.45}" y="${stopY + 0.55}" text-anchor="middle">${stopLabel}</text>
      </g>`
      : '';

  return `
    <g class="dado-machine" data-feature="${feature.id}" data-face="A"
      data-mode="${feature.mode}" data-relief="${feature.cornerRelief}">
      <title>${title}</title>
      <rect class="dado-fill" x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" />
      <rect class="dado-cut" x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" />
      ${bones}
      ${stop}
      <g class="dado-callout">
        <line class="callout-leader" x1="${calloutX}" y1="${y}" x2="${calloutX}" y2="${calloutY + 0.6}" />
        <polygon class="callout-arrow" points="${calloutX},${y} ${calloutX - 0.55},${y - 1.1} ${calloutX + 0.55},${y - 1.1}" />
        <text class="callout-label" x="${calloutX}" y="${calloutY}" text-anchor="middle">Dado: ${fmtInch(depth)}" deep × ${fmtInch(width)}" wide</text>
      </g>
    </g>
  `;
}

/**
 * @param {object} part
 * @param {'A' | 'B'} face
 * @param {object} feature
 * @param {string} hatchId
 */
function renderRabbet(part, face, feature, hatchId) {
  const { rect } = feature;
  const x = rect.x;
  const y =
    part.role === 'bottom'
      ? rect.y
      : part.dimensions.v - rect.y - rect.height;

  if (face === 'B') {
    return `
      <rect class="rabbet-hidden" data-feature="${feature.id}" x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" />
    `;
  }

  return `
    <g class="rabbet-machine" data-feature="${feature.id}" data-face="A">
      <rect class="rabbet-fill" x="${x}" y="${y}" width="${rect.width}" height="${rect.height}" fill="url(#${hatchId})" />
      <path class="rabbet-cut" d="M ${x} ${y} L ${x + rect.width} ${y} L ${x + rect.width} ${y + rect.height} L ${x} ${y + rect.height}" />
      <text class="rabbet-label" x="${x + rect.width / 2}" y="${y + rect.height / 2 + 0.7}" text-anchor="middle">${feature.label}</text>
    </g>
  `;
}

/**
 * @param {object} feature
 * @param {object} part
 */
function renderThrough(feature, part) {
  const r = Math.max(feature.diameter / 2, 0.22);
  const cx = feature.cx;
  const cy = part.dimensions.v - feature.cy;
  return `
    <g class="confirmat-through" data-feature="${feature.id}" data-diameter-in="${feature.diameter}">
      <circle class="through-bore" cx="${cx}" cy="${cy}" r="${r}" />
      <line class="through-cross" x1="${cx - r * 1.35}" y1="${cy}" x2="${cx + r * 1.35}" y2="${cy}" />
      <line class="through-cross" x1="${cx}" y1="${cy - r * 1.35}" x2="${cx}" y2="${cy + r * 1.35}" />
    </g>
  `;
}

/**
 * @param {object} feature
 * @param {object} part
 */
function renderPilot(feature, part) {
  const isLeft = feature.side === 'left';
  const xEdge = isLeft ? 0 : part.dimensions.u;
  const y = feature.cy;
  const dir = isLeft ? 1 : -1;
  const tipX = xEdge + dir * 2.8;
  const label = `Ø${fmtMm(feature.diameter)} mm × ${fmtMm(feature.depth)} mm deep`;

  return `
    <g class="confirmat-pilot" data-feature="${feature.id}" data-side="${feature.side}">
      <line class="pilot-shaft" x1="${xEdge}" y1="${y}" x2="${tipX}" y2="${y}" />
      <polygon class="pilot-arrow" points="${tipX},${y} ${tipX - dir * 1.2},${y - 0.7} ${tipX - dir * 1.2},${y + 0.7}" />
      <text class="pilot-label" x="${xEdge + dir * 3.4}" y="${y - 1.1}" text-anchor="${isLeft ? 'start' : 'end'}">${label}</text>
    </g>
  `;
}

/**
 * @param {object[]} throughs
 * @param {object} part
 */
function renderPitch(throughs, part) {
  if (throughs.length < 2) return '';
  const sorted = [...throughs].sort((a, b) => a.cx - b.cx);
  const a = sorted[0];
  const b = sorted[1];
  const y = part.dimensions.v - a.cy - 2.4;
  const pitchMm = fmtMm(b.cx - a.cx);
  const mid = (a.cx + b.cx) / 2;
  return `
    <g class="pitch-dim" data-pitch-mm="${pitchMm}">
      <line class="dim-witness" x1="${a.cx}" y1="${y - 1.2}" x2="${a.cx}" y2="${y + 1.2}" />
      <line class="dim-witness" x1="${b.cx}" y1="${y - 1.2}" x2="${b.cx}" y2="${y + 1.2}" />
      <line class="dim-line" x1="${a.cx}" y1="${y}" x2="${b.cx}" y2="${y}" />
      <text class="dim-label" x="${mid}" y="${y - 1.3}" text-anchor="middle">${pitchMm} mm pitch</text>
    </g>
  `;
}

/**
 * @param {object} part
 */
function renderEdgebands(part) {
  const u = part.dimensions.u;
  const v = part.dimensions.v;
  const eb = part.edgebands || {};
  /** @type {string[]} */
  const lines = [];
  if (part.role === 'end') {
    if (eb.front) lines.push(`<line class="edgeband" data-edge="front" x1="0" y1="0" x2="0" y2="${v}" />`);
    if (eb.rear) lines.push(`<line class="edgeband" data-edge="rear" x1="${u}" y1="0" x2="${u}" y2="${v}" />`);
    if (eb.top) lines.push(`<line class="edgeband" data-edge="top" x1="0" y1="0" x2="${u}" y2="0" />`);
    if (eb.bottom) lines.push(`<line class="edgeband" data-edge="bottom" x1="0" y1="${v}" x2="${u}" y2="${v}" />`);
  } else {
    if (eb.front) {
      // Flush front edge between notches
      const t = GLOBAL.dadoDepth;
      lines.push(
        `<line class="edgeband" data-edge="front" x1="${t}" y1="0" x2="${u - t}" y2="0" />`,
      );
    }
    if (eb.rear) lines.push(`<line class="edgeband" data-edge="rear" x1="0" y1="${v}" x2="${u}" y2="${v}" />`);
  }
  return lines.join('\n');
}

/**
 * @param {object} feature
 * @param {'A' | 'B'} face
 */
function renderTenon(feature, face) {
  const { rect, cornerRadius = 0, side, hover } = feature;
  const title = hoverTitle(hover);

  if (face === 'B') {
    return `<rect class="tenon-hidden" data-feature="${feature.id}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" />`;
  }

  if (cornerRadius > 0) {
    const d = roundedTenonPath(rect, cornerRadius, side);
    return `
      <g class="tenon-machine" data-feature="${feature.id}" data-corner="rounded" data-radius="${cornerRadius}">
        <title>${title}</title>
        <path class="tenon-fill" d="${d}" />
        <path class="tenon-cut" d="${d}" />
      </g>
    `;
  }

  return `
    <g class="tenon-machine" data-feature="${feature.id}" data-corner="square">
      <title>${title}</title>
      <rect class="tenon-fill" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" />
      <rect class="tenon-cut" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" />
    </g>
  `;
}

/**
 * @param {object} part
 * @param {'A' | 'B'} face
 */
function renderStock(part, face) {
  const u = part.dimensions.u;
  const v = part.dimensions.v;
  if (part.role === 'bottom' && part.outlinePath) {
    return `
      <path class="stock" d="${part.outlinePath}" data-notched="true" data-front-shoulder="${part.frontShoulderNotch ?? 0}" />
      <path class="cut-perimeter" data-cut="perimeter" d="${part.outlinePath}" />
    `;
  }
  return `
    <rect class="stock" x="0" y="0" width="${u}" height="${v}" />
    <rect class="cut-perimeter" data-cut="perimeter" x="0" y="0" width="${u}" height="${v}" />
  `;
}

/**
 * @param {object} part
 * @param {{ face?: 'A' | 'B' }} [opts]
 * @returns {string}
 */
export function renderPartSvg(part, opts = {}) {
  const face = opts.face === 'B' ? 'B' : 'A';
  const u = part.dimensions.u;
  const v = part.dimensions.v;
  const pad = 10;
  const viewW = u + pad * 2;
  const viewH = v + pad * 2 + 8;
  const hatchId = `hatch-${part.id}-${face}`;

  const dados = part.features.filter((f) => f.kind === 'dado');
  const rabbets = part.features.filter((f) => f.kind === 'rabbet');
  const tenons = part.features.filter((f) => f.kind === 'tenon');
  const throughs = part.features.filter((f) => f.kind === 'confirmat-through');
  const pilots = part.features.filter((f) => f.kind === 'confirmat-pilot');

  /** @type {string[]} */
  const ops = [];
  for (const f of rabbets) ops.push(renderRabbet(part, face, f, hatchId));
  for (const f of dados) ops.push(renderDado(part, face, f));
  for (const f of tenons) ops.push(renderTenon(f, face));
  if (face === 'A') {
    for (const f of throughs) ops.push(renderThrough(f, part));
    if (throughs.length) ops.push(renderPitch(throughs, part));
    for (const f of pilots) ops.push(renderPilot(f, part));
  }

  const faceTitle = part.faceLabels?.[face] ?? `Face ${face}`;
  const reliefNote =
    face === 'A'
      ? `relief: ${GLOBAL.cornerRelief} · bit ⌀ ${fmtInch(GLOBAL.bitDiameter)}"`
      : '';

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img"
      aria-label="${part.name} ${faceTitle}"
      data-part="${part.id}"
      data-face="${face}"
      data-dado-mode="${GLOBAL.dadoMode}"
      data-corner-relief="${GLOBAL.cornerRelief}">
      <defs>${hatchDef(hatchId)}</defs>
      <g transform="translate(${pad} ${pad})">
        ${renderStock(part, face)}
        ${renderEdgebands(part)}
        ${ops.join('\n')}
        <text class="anno face-badge" x="1.2" y="-2.5" text-anchor="start">${faceTitle}</text>
        <text class="anno relief-badge" x="${u}" y="-2.5" text-anchor="end">${reliefNote}</text>
        <text class="anno" x="0" y="${v + 5}" text-anchor="start">front</text>
        <text class="anno" x="${u}" y="${v + 5}" text-anchor="end">rear</text>
      </g>
    </svg>
  `.trim();
}
