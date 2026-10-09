import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseCarcass,
  GLOBAL,
  resetJobDefaults,
  dadoSpan,
  matingPanelWidth,
  clearOpening,
  tenonShoulderNotches,
  notchedDeckPath,
  dogBoneEars,
  tenonCornerRadius,
  renderPartSvg,
} from '../src/carcass/index.js';

beforeEach(() => {
  resetJobDefaults();
});

describe('dado modes', () => {
  it('blind dado starts at front shoulder and runs to the rear', () => {
    const span = dadoSpan(24);
    assert.equal(span.mode, 'blind');
    assert.equal(span.startX, 0.5);
    assert.equal(span.endX, 24);
    assert.equal(span.length, 23.5);
  });

  it('stopped dado applies front and rear shoulders', () => {
    const carcass = new BaseCarcass();
    carcass.setJobDefaults({ dadoMode: 'stopped', frontShoulder: 0.5, rearShoulder: 0.5 });
    const span = dadoSpan(24);
    assert.equal(span.startX, 0.5);
    assert.equal(span.endX, 23.5);
    assert.equal(span.length, 23);
  });

  it('through dado has zero shoulders', () => {
    const carcass = new BaseCarcass();
    carcass.setJobDefaults({ dadoMode: 'through' });
    const span = dadoSpan(24);
    assert.equal(span.frontShoulder, 0);
    assert.equal(span.rearShoulder, 0);
    assert.equal(span.length, 24);
  });
});

describe('mating deck tenon matching', () => {
  it('sets deck width to clear opening + 2 × dado depth', () => {
    const width = 24;
    assert.equal(clearOpening(width), 24 - 2 * (5 / 8));
    assert.equal(matingPanelWidth(width), clearOpening(width) + 2 * (1 / 4));
    const carcass = new BaseCarcass({ width });
    assert.equal(carcass.parts.bottom.dimensions.length, matingPanelWidth(width));
  });

  it('notches front corners by the front shoulder for a flush box front', () => {
    const length = matingPanelWidth(24);
    const notches = tenonShoulderNotches(length, 0.5);
    assert.equal(notches.length, 2);
    assert.equal(notches[0].height, 0.5);
    assert.equal(notches[0].width, GLOBAL.dadoDepth);
    assert.equal(notches[1].x, length - GLOBAL.dadoDepth);

    const path = notchedDeckPath(length, 24, 0.5, GLOBAL.dadoDepth);
    assert.match(path, new RegExp(`M ${GLOBAL.dadoDepth} 0`));
    assert.match(path, /L 0 0\.5/);
  });
});

describe('corner relief engine', () => {
  it('dog-bone mode adds ears on the pocket; tenon stays square', () => {
    const carcass = new BaseCarcass();
    carcass.setJobDefaults({
      cornerRelief: 'dogbone',
      bitDiameter: 3 / 8,
      dadoMode: 'blind',
    });
    const dado = carcass.parts.leftEnd.features.find((f) => f.kind === 'dado');
    const tenon = carcass.parts.bottom.features.find((f) => f.kind === 'tenon');

    assert.equal(dado.dogBones.length, 2);
    assert.equal(dado.dogBones[0].r, 0.1875);
    assert.equal(tenon.cornerRadius, 0);
    assert.equal(tenon.squareCorners, true);

    const svg = renderPartSvg(carcass.parts.leftEnd, { face: 'A' });
    assert.match(svg, /class="dogbone"/);
    assert.match(svg, /data-relief="dogbone"/);
  });

  it('rounded-tenon mode fillets mating corners to bit radius; no dog-bones', () => {
    const carcass = new BaseCarcass();
    carcass.setJobDefaults({
      cornerRelief: 'rounded-tenon',
      bitDiameter: 3 / 8,
    });
    assert.equal(tenonCornerRadius(), 0.1875);

    const dado = carcass.parts.leftEnd.features.find((f) => f.kind === 'dado');
    const tenon = carcass.parts.bottom.features.find((f) => f.kind === 'tenon');
    assert.equal(dado.dogBones.length, 0);
    assert.equal(tenon.cornerRadius, 0.1875);

    const svg = renderPartSvg(carcass.parts.bottom, { face: 'A' });
    assert.match(svg, /data-corner="rounded"/);
    assert.match(svg, /data-radius="0\.1875"/);
    assert.match(svg, /data-notched="true"/);
  });

  it('dogBoneEars sit at the blind end corners', () => {
    const ears = dogBoneEars({ x: 0.5, y: 0, width: 23.5, height: 0.625 }, 0.1875);
    assert.equal(ears[0].cx, 0.5);
    assert.equal(ears[0].cy, 0);
    assert.equal(ears[1].cy, 0.625);
  });
});

describe('Face flip + hover callouts', () => {
  it('Face A shows shaded pocket; Face B shows dashed hidden detail', () => {
    const carcass = new BaseCarcass();
    const a = renderPartSvg(carcass.parts.leftEnd, { face: 'A' });
    const b = renderPartSvg(carcass.parts.leftEnd, { face: 'B' });
    assert.match(a, /class="dado-fill"/);
    assert.match(a, /0\.5" Stop/);
    assert.match(a, /Front Shoulder Offset: 0\.5"/);
    assert.match(b, /class="dado-hidden"/);
    assert.doesNotMatch(b, /class="dado-fill"/);
  });
});
