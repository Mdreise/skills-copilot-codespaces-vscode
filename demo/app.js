import {
  BaseCarcass,
  GLOBAL,
  fmtInch,
  inchToMm,
  renderPartSvg,
  renderJointPreview,
  renderIsoAssembly,
  explodeOffsets,
} from '../src/carcass/index.js';

const carcass = new BaseCarcass();

/** @type {'parts' | 'iso'} */
let viewMode = 'parts';

/** @type {Record<string, 'A' | 'B'>} */
const faces = { left: 'A', right: 'A', bottom: 'A' };

/** @type {Record<string, boolean>} */
const jointOpen = { left: false, right: false, bottom: false };

const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');
const depthInput = document.querySelector('#depth');
const globalsEl = document.querySelector('#globals');
const partsView = document.querySelector('#parts-view');
const isoView = document.querySelector('#iso-view');
const viewPartsBtn = document.querySelector('#view-parts');
const viewIsoBtn = document.querySelector('#view-iso');
const viewHint = document.querySelector('#view-hint');
const dadoModeEl = document.querySelector('#dado-mode');
const frontShoulderEl = document.querySelector('#front-shoulder');
const rearShoulderEl = document.querySelector('#rear-shoulder');
const bitDiameterEl = document.querySelector('#bit-diameter');
const cornerReliefEl = document.querySelector('#corner-relief');

function syncJobControls() {
  dadoModeEl.value = GLOBAL.dadoMode;
  frontShoulderEl.value = String(GLOBAL.frontShoulder);
  rearShoulderEl.value = String(GLOBAL.rearShoulder);
  bitDiameterEl.value = String(GLOBAL.bitDiameter);
  cornerReliefEl.value = GLOBAL.cornerRelief;
}

function renderGlobals() {
  globalsEl.innerHTML = `
    <div><dt>Material</dt><dd>${fmtInch(GLOBAL.materialThickness)}"</dd></div>
    <div><dt>Dado depth</dt><dd>${fmtInch(GLOBAL.dadoDepth)}"</dd></div>
    <div><dt>Front stop</dt><dd>${fmtInch(GLOBAL.frontShoulder)}"</dd></div>
    <div><dt>Bit ⌀</dt><dd>${fmtInch(GLOBAL.bitDiameter)}"</dd></div>
    <div><dt>Relief</dt><dd>${GLOBAL.cornerRelief}</dd></div>
    <div><dt>Mode</dt><dd>${GLOBAL.dadoMode}</dd></div>
  `;
}

function endDims(part) {
  const dado = part.features.find((f) => f.kind === 'dado');
  const throughs = part.features.filter((f) => f.kind === 'confirmat-through');
  const d = part.dimensions;
  const bones = dado.dogBones?.length
    ? ` · ${dado.dogBones.length} dog-bones`
    : '';
  return [
    `${fmtInch(d.height)}" H × ${fmtInch(d.width)}" D × ${fmtInch(d.thickness)}" T`,
    `${dado.mode} dado: ${fmtInch(dado.depth)}" deep × ${fmtInch(dado.width)}" wide · front ${fmtInch(dado.frontShoulder)}"${bones}`,
    `Confirmats: ${throughs.length}× Ø${Math.round(inchToMm(GLOBAL.confirmatDiameter))} mm · bit r ${fmtInch(GLOBAL.bitRadius)}"`,
  ].join('\n');
}

function bottomDims(part) {
  const tenon = part.features.find((f) => f.kind === 'tenon');
  const pilots = part.features.filter((f) => f.kind === 'confirmat-pilot');
  const d = part.dimensions;
  const corner =
    tenon.cornerRadius > 0
      ? `rounded r=${fmtInch(tenon.cornerRadius)}"`
      : 'square corners (dog-bone pocket)';
  return [
    `${fmtInch(d.length)}" L (= clear ${fmtInch(d.clearOpening)}" + 2×${fmtInch(GLOBAL.dadoDepth)}") × ${fmtInch(d.width)}" D`,
    `Shoulder notches: ${fmtInch(part.frontShoulderNotch)}" · tongues ${fmtInch(tenon.length)}" · ${corner}`,
    `Pilots: ${pilots.length}× Ø${Math.round(inchToMm(GLOBAL.confirmatDiameter))} × ${Math.round(inchToMm(GLOBAL.confirmatPilotDepth))} mm deep`,
  ].join('\n');
}

function isoDims() {
  const ex = explodeOffsets(carcass.envelope);
  return [
    `explode: left ${fmtInch(Math.abs(ex.leftX))}" −X · right ${fmtInch(ex.rightX)}" +X`,
    `deck ${fmtInch(Math.abs(ex.bottomZ))}" −Z · relief ${GLOBAL.cornerRelief}`,
    `${GLOBAL.dadoMode} pocket ${fmtInch(GLOBAL.dadoDepth)}" deep · front stop ${fmtInch(GLOBAL.frontShoulder)}"`,
  ].join('\n');
}

function partByKey(key) {
  if (key === 'left') return carcass.parts.leftEnd;
  if (key === 'right') return carcass.parts.rightEnd;
  return carcass.parts.bottom;
}

function svgId(key) {
  if (key === 'left') return '#svg-left';
  if (key === 'right') return '#svg-right';
  return '#svg-bottom';
}

function jointId(key) {
  if (key === 'left') return '#joint-left';
  if (key === 'right') return '#joint-right';
  return '#joint-bottom';
}

function dimsId(key) {
  if (key === 'left') return '#dims-left';
  if (key === 'right') return '#dims-right';
  return '#dims-bottom';
}

function setView(mode) {
  viewMode = mode;
  const isIso = mode === 'iso';

  viewPartsBtn.classList.toggle('is-active', !isIso);
  viewIsoBtn.classList.toggle('is-active', isIso);
  viewPartsBtn.setAttribute('aria-pressed', String(!isIso));
  viewIsoBtn.setAttribute('aria-pressed', String(isIso));

  partsView.classList.toggle('is-hidden', isIso);
  isoView.classList.toggle('is-hidden', !isIso);
  partsView.hidden = isIso;
  isoView.hidden = !isIso;

  viewHint.textContent = isIso
    ? 'Isometric explode: verify tenon into blind mortise before nesting.'
    : 'Hover dados for shoulder / depth / bit-radius callouts. Flip Face A/B.';

  render();
}

function renderPartCard(key) {
  const part = partByKey(key);
  const face = faces[key];
  document.querySelector(svgId(key)).innerHTML = renderPartSvg(part, { face });
  document.querySelector(dimsId(key)).textContent =
    key === 'bottom' ? bottomDims(part) : endDims(part);

  const flipBtn = document.querySelector(`.face-flip[data-target="${key}"]`);
  flipBtn.setAttribute('aria-pressed', String(face === 'B'));
  flipBtn.classList.toggle('is-active', face === 'B');
  flipBtn.textContent =
    face === 'A' ? 'Flip Part (Face A / B)' : 'Flip Part (Face B / A)';

  const jointEl = document.querySelector(jointId(key));
  const jointBtn = document.querySelector(`.joint-toggle[data-target="${key}"]`);
  const open = jointOpen[key];
  jointBtn.setAttribute('aria-pressed', String(open));
  jointBtn.classList.toggle('is-active', open);
  jointEl.classList.toggle('is-hidden', !open);
  jointEl.hidden = !open;
  if (open) {
    const side = key === 'right' ? 'right' : 'left';
    jointEl.innerHTML = renderJointPreview(side);
  }
}

function render() {
  heightInput.value = String(carcass.height);
  widthInput.value = String(carcass.width);
  depthInput.value = String(carcass.depth);
  syncJobControls();
  renderGlobals();

  if (viewMode === 'iso') {
    document.querySelector('#svg-iso').innerHTML = renderIsoAssembly(carcass, {
      exploded: true,
    });
    document.querySelector('#dims-iso').textContent = isoDims();
    return;
  }

  renderPartCard('left');
  renderPartCard('right');
  renderPartCard('bottom');
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

function applyJobPatch(patch) {
  try {
    carcass.setJobDefaults(patch);
  } catch {
    syncJobControls();
  }
}

render();
carcass.onChange(render);

bind(heightInput, (v) => carcass.setHeight(v));
bind(widthInput, (v) => carcass.setWidth(v));
bind(depthInput, (v) => carcass.setDepth(v));

dadoModeEl.addEventListener('change', () =>
  applyJobPatch({ dadoMode: /** @type {'blind'|'stopped'|'through'} */ (dadoModeEl.value) }),
);
frontShoulderEl.addEventListener('input', () =>
  applyJobPatch({ frontShoulder: Number(frontShoulderEl.value) }),
);
rearShoulderEl.addEventListener('input', () =>
  applyJobPatch({ rearShoulder: Number(rearShoulderEl.value) }),
);
bitDiameterEl.addEventListener('change', () =>
  applyJobPatch({ bitDiameter: Number(bitDiameterEl.value) }),
);
cornerReliefEl.addEventListener('change', () =>
  applyJobPatch({
    cornerRelief: /** @type {'dogbone'|'rounded-tenon'} */ (cornerReliefEl.value),
  }),
);

viewPartsBtn.addEventListener('click', () => setView('parts'));
viewIsoBtn.addEventListener('click', () => setView('iso'));

document.querySelectorAll('.face-flip').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-target');
    faces[key] = faces[key] === 'A' ? 'B' : 'A';
    renderPartCard(key);
  });
});

document.querySelectorAll('.joint-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-target');
    jointOpen[key] = !jointOpen[key];
    renderPartCard(key);
  });
});
