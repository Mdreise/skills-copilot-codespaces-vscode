import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseCarcass,
  GLOBAL,
  resetJobDefaults,
  renderPartSvg,
  renderEndSvg,
  renderBottomSvg,
  renderJointPreview,
} from '../src/carcass/index.js';

beforeEach(() => {
  resetJobDefaults();
});

describe('renderPartSvg — Face A machining', () => {
  it('renders Face A dados as gray inset fill with dashed cut path', () => {
    const carcass = new BaseCarcass({ depth: 24 });
    const svg = renderPartSvg(carcass.parts.leftEnd, { face: 'A' });

    assert.match(svg, /data-face="A"/);
    assert.match(svg, /class="dado-fill"/);
    assert.match(svg, /class="dado-cut"/);
    assert.match(svg, /Dado: 0\.25" deep × 0\.625" wide/);
  });

  it('shows a solid red 0.5" Stop tag at the blind shoulder', () => {
    const carcass = new BaseCarcass();
    const svg = renderPartSvg(carcass.parts.leftEnd, { face: 'A' });

    assert.match(svg, /class="stop-tag"/);
    assert.match(svg, /data-stop="0\.5"/);
    assert.match(svg, /0\.5" Stop/);
    assert.equal(GLOBAL.blindShoulder, 0.5);
  });

  it('draws confirmat through-bores with crosshairs and pitch', () => {
    const carcass = new BaseCarcass();
    const svg = renderPartSvg(carcass.parts.leftEnd, { face: 'A' });

    assert.match(svg, /class="confirmat-through"/);
    assert.match(svg, /class="through-bore"/);
    assert.match(svg, /class="through-cross"/);
    assert.match(svg, /mm pitch/);
  });

  it('draws rear rabbet hatch and excludes rear edgeband', () => {
    const carcass = new BaseCarcass();
    const svg = renderPartSvg(carcass.parts.leftEnd, { face: 'A' });

    assert.match(svg, /class="rabbet-machine"/);
    assert.match(svg, /class="rabbet-fill"/);
    assert.match(svg, /data-edge="front"/);
    assert.doesNotMatch(svg, /data-edge="rear"/);
  });
});

describe('renderPartSvg — Face B hidden detail', () => {
  it('renders dados as light-blue dashed hidden detail only', () => {
    const carcass = new BaseCarcass();
    const svg = renderPartSvg(carcass.parts.leftEnd, { face: 'B' });

    assert.match(svg, /data-face="B"/);
    assert.match(svg, /class="dado-hidden"/);
    assert.doesNotMatch(svg, /class="dado-fill"/);
    assert.doesNotMatch(svg, /0\.5" Stop/);
    assert.doesNotMatch(svg, /confirmat-through/);
  });
});

describe('renderPartSvg — bottom deck', () => {
  it('shows tongues, pilots with green depth callouts, and shoulder stop context', () => {
    const carcass = new BaseCarcass();
    const svg = renderPartSvg(carcass.parts.bottom, { face: 'A' });

    assert.match(svg, /class="tenon-machine"/);
    assert.match(svg, /class="confirmat-pilot"/);
    assert.match(svg, /Ø5 mm × 35 mm deep/);
    assert.match(svg, /class="rabbet-machine"/);
  });
});

describe('legacy wrappers', () => {
  it('renderEndSvg / renderBottomSvg delegate to Face A part cards', () => {
    const carcass = new BaseCarcass();
    assert.match(renderEndSvg(carcass.parts.leftEnd), /data-face="A"/);
    assert.match(renderBottomSvg(carcass.parts.bottom), /data-face="A"/);
  });
});

describe('renderJointPreview', () => {
  it('shows tongue entering dado with confirmat indicator', () => {
    const svg = renderJointPreview('left');
    assert.match(svg, /data-joint-preview="blind-dado-confirmat"/);
    assert.match(svg, /iso-pocket/);
    assert.match(svg, /iso-tongue/);
    assert.match(svg, /joint-screw/);
  });
});
