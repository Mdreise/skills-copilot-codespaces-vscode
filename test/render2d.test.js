import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseCarcass,
  GLOBAL,
  renderEndSvg,
  renderBottomSvg,
} from '../src/carcass/index.js';

describe('renderEndSvg — internal dado pocket', () => {
  it('draws the mortise as a pocket class inside the stock, not an external feature block', () => {
    const carcass = new BaseCarcass({ depth: 24 });
    const svg = renderEndSvg(carcass.parts.leftEnd);

    assert.match(svg, /class="stock"/);
    assert.match(svg, /class="pocket"/);
    assert.match(svg, /class="pocket-outline"/);
    assert.doesNotMatch(svg, /class="feature"/);
    assert.match(svg, /Blind dado pocket/);
  });

  it('places a 0.25" deep pocket starting 0.5" from the front and running to the rear', () => {
    const depth = 24;
    const carcass = new BaseCarcass({ depth });
    const svg = renderEndSvg(carcass.parts.leftEnd);

    // Edge-view layout uses padX=14; pocket starts at padX + blindShoulder.
    const expectedPocketX = 14 + GLOBAL.blindShoulder;
    const expectedPocketW = depth - GLOBAL.blindShoulder;

    assert.equal(GLOBAL.dadoDepth, 0.25);
    assert.equal(GLOBAL.blindShoulder, 0.5);
    assert.match(svg, new RegExp(`x="${expectedPocketX}"`));
    assert.match(svg, new RegExp(`width="${expectedPocketW}"`));
    assert.match(svg, /0\.25" pocket/);
    assert.match(svg, /0\.5" shoulder/);
    assert.match(svg, />front</);
    assert.match(svg, />rear</);
  });

  it('keeps the pocket fully inside the part depth span', () => {
    const depth = 20;
    const carcass = new BaseCarcass({ depth });
    const svg = renderEndSvg(carcass.parts.rightEnd, { mirror: true });

    const pocketStart = GLOBAL.blindShoulder;
    const pocketEnd = pocketStart + (depth - GLOBAL.blindShoulder);
    assert.ok(pocketStart > 0);
    assert.equal(pocketEnd, depth);
    assert.match(svg, /scale\(-1,1\)/);
    assert.match(svg, new RegExp(`width="${depth - GLOBAL.blindShoulder}"`));
  });
});

describe('renderBottomSvg', () => {
  it('keeps tenon paths inside the stock boundary', () => {
    const carcass = new BaseCarcass();
    const svg = renderBottomSvg(carcass.parts.bottom);
    assert.match(svg, /class="stock"/);
    assert.match(svg, /class="pocket"/);
    assert.match(svg, /inside part boundary/);
  });
});
