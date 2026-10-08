import { BaseCarcass, GLOBAL } from '../src/carcass/index.js';

const carcass = new BaseCarcass();

const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');
const depthInput = document.querySelector('#depth');
const globalsEl = document.querySelector('#globals');

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function renderGlobals() {
  globalsEl.innerHTML = `
    <div><dt>Material</dt><dd>${fmt(GLOBAL.materialThickness)}"</dd></div>
    <div><dt>Dado depth</dt><dd>${fmt(GLOBAL.dadoDepth)}"</dd></div>
    <div><dt>Blind shoulder</dt><dd>${fmt(GLOBAL.blindShoulder)}"</dd></div>
  `;
}

function endSvg(part, mirror = false) {
  const { width: d, height: h, thickness: t } = part.dimensions;
  const mortise = part.features[0];
  const pad = 8;
  const viewW = d + pad * 2;
  const viewH = h + pad * 2;
  // Inside-face elevation: Y horizontal (front→back), Z vertical.
  const mx = pad + mortise.y;
  const my = pad + (h - mortise.height - mortise.z);
  const mw = mortise.depth;
  const mh = mortise.height;
  const transform = mirror ? `transform="translate(${viewW},0) scale(-1,1)"` : '';

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="${part.name}">
      <g ${transform}>
        <rect class="stock" x="${pad}" y="${pad}" width="${d}" height="${h}" />
        <rect class="feature" x="${mx}" y="${my}" width="${mw}" height="${mh}">
          <title>Blind dado mortise · ${fmt(mortise.width)}" deep · ${fmt(GLOBAL.blindShoulder)}" shoulder</title>
        </rect>
      </g>
    </svg>
  `;
}

function bottomSvg(part) {
  const { length: L, width: d } = part.dimensions;
  const [left, right] = part.features;
  const pad = 8;
  const viewW = L + pad * 2;
  const viewH = d + pad * 2;

  return `
    <svg viewBox="0 0 ${viewW} ${viewH}" role="img" aria-label="${part.name}">
      <rect class="stock" x="${pad}" y="${pad}" width="${L}" height="${d}" />
      <rect class="feature" x="${pad + left.x}" y="${pad + left.y}" width="${left.width}" height="${left.depth}">
        <title>Left tenon</title>
      </rect>
      <rect class="feature" x="${pad + right.x}" y="${pad + right.y}" width="${right.width}" height="${right.depth}">
        <title>Right tenon</title>
      </rect>
    </svg>
  `;
}

function endDims(part) {
  const m = part.features[0];
  const d = part.dimensions;
  return [
    `${fmt(d.height)}" H × ${fmt(d.width)}" D × ${fmt(d.thickness)}" T`,
    `mortise: ${fmt(m.width)}" deep × ${fmt(m.height)}" tall × ${fmt(m.depth)}" long`,
    `front shoulder: ${fmt(m.y)}"`,
  ].join('\n');
}

function bottomDims(part) {
  const d = part.dimensions;
  const t = part.features[0];
  return [
    `${fmt(d.length)}" L × ${fmt(d.width)}" D × ${fmt(d.thickness)}" T`,
    `tenons: ${fmt(t.width)}" long × ${fmt(t.depth)}" deep run`,
    `front shoulder: ${fmt(t.y)}"`,
  ].join('\n');
}

function render() {
  const { leftEnd, rightEnd, bottom } = carcass.parts;

  heightInput.value = String(carcass.height);
  widthInput.value = String(carcass.width);
  depthInput.value = String(carcass.depth);

  document.querySelector('#svg-left').innerHTML = endSvg(leftEnd);
  document.querySelector('#svg-right').innerHTML = endSvg(rightEnd, true);
  document.querySelector('#svg-bottom').innerHTML = bottomSvg(bottom);

  document.querySelector('#dims-left').textContent = endDims(leftEnd);
  document.querySelector('#dims-right').textContent = endDims(rightEnd);
  document.querySelector('#dims-bottom').textContent = bottomDims(bottom);
}

function bind(input, setter) {
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    try {
      setter(value);
    } catch {
      // Keep previous valid geometry while the field is mid-edit.
    }
  });
}

renderGlobals();
render();
carcass.onChange(render);

bind(heightInput, (v) => carcass.setHeight(v));
bind(widthInput, (v) => carcass.setWidth(v));
bind(depthInput, (v) => carcass.setDepth(v));
