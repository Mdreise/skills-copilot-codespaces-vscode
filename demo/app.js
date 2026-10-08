import {
  BaseCarcass,
  GLOBAL,
  fmtInch,
  renderEndSvg,
  renderBottomSvg,
} from '../src/carcass/index.js';

const carcass = new BaseCarcass();

const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');
const depthInput = document.querySelector('#depth');
const globalsEl = document.querySelector('#globals');

function renderGlobals() {
  globalsEl.innerHTML = `
    <div><dt>Material</dt><dd>${fmtInch(GLOBAL.materialThickness)}"</dd></div>
    <div><dt>Dado depth</dt><dd>${fmtInch(GLOBAL.dadoDepth)}"</dd></div>
    <div><dt>Blind shoulder</dt><dd>${fmtInch(GLOBAL.blindShoulder)}"</dd></div>
  `;
}

function endDims(part) {
  const m = part.features[0];
  const d = part.dimensions;
  return [
    `${fmtInch(d.height)}" H × ${fmtInch(d.width)}" D × ${fmtInch(d.thickness)}" T`,
    `pocket: ${fmtInch(m.width)}" deep × ${fmtInch(m.height)}" tall × ${fmtInch(m.depth)}" long`,
    `starts ${fmtInch(m.y)}" from front → rear`,
  ].join('\n');
}

function bottomDims(part) {
  const d = part.dimensions;
  const t = part.features[0];
  return [
    `${fmtInch(d.length)}" L × ${fmtInch(d.width)}" D × ${fmtInch(d.thickness)}" T`,
    `tenons: ${fmtInch(t.width)}" long × ${fmtInch(t.depth)}" deep run`,
    `front shoulder: ${fmtInch(t.y)}"`,
  ].join('\n');
}

function render() {
  const { leftEnd, rightEnd, bottom } = carcass.parts;

  heightInput.value = String(carcass.height);
  widthInput.value = String(carcass.width);
  depthInput.value = String(carcass.depth);

  document.querySelector('#svg-left').innerHTML = renderEndSvg(leftEnd);
  document.querySelector('#svg-right').innerHTML = renderEndSvg(rightEnd, {
    mirror: true,
  });
  document.querySelector('#svg-bottom').innerHTML = renderBottomSvg(bottom);

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
