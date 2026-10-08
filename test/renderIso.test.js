import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseCarcass,
  GLOBAL,
  projectIso,
  explodeOffsets,
  assemblyLayout,
  renderIsoAssembly,
} from '../src/carcass/index.js';

describe('projectIso', () => {
  it('maps world axes into a 2.5D screen plane', () => {
    const a = projectIso(0, 0, 0);
    const b = projectIso(10, 0, 0);
    const c = projectIso(0, 10, 0);
    assert.notEqual(a.x, b.x);
    assert.notEqual(a.x, c.x);
    assert.ok(projectIso(0, 0, 10).y < a.y);
  });
});

describe('explodeOffsets', () => {
  it('separates ends on X and drops the deck on Z', () => {
    const ex = explodeOffsets({ height: 34.5, width: 24, depth: 24 });
    assert.ok(ex.leftX < 0);
    assert.ok(ex.rightX > 0);
    assert.ok(ex.bottomZ < 0);
    assert.equal(ex.leftX, -ex.rightX);
  });
});

describe('assemblyLayout', () => {
  it('keeps pockets and tongues aligned to the same joinery parameters', () => {
    const carcass = new BaseCarcass({ width: 30, depth: 22, height: 28 });
    const layout = assemblyLayout(carcass, { exploded: true });

    assert.equal(layout.leftEnd.pocket.size.x, GLOBAL.dadoDepth);
    assert.equal(layout.leftEnd.pocket.origin.y, GLOBAL.blindShoulder);
    assert.equal(
      layout.leftEnd.pocket.size.y,
      22 - GLOBAL.blindShoulder,
    );
    assert.equal(layout.bottom.tongues.left.size.x, GLOBAL.dadoDepth);
    assert.equal(layout.bottom.tongues.left.origin.y, layout.explode.bottomY + GLOBAL.blindShoulder);
    assert.ok(layout.leftEnd.origin.x < 0);
    assert.ok(layout.rightEnd.origin.x > carcass.width - GLOBAL.materialThickness);
    assert.ok(layout.bottom.origin.z < 0);
  });

  it('collapses explode offsets when assembled', () => {
    const carcass = new BaseCarcass();
    const layout = assemblyLayout(carcass, { exploded: false });
    assert.equal(layout.explode.leftX, 0);
    assert.equal(layout.explode.rightX, 0);
    assert.equal(layout.explode.bottomZ, 0);
  });
});

describe('renderIsoAssembly', () => {
  it('emits an exploded isometric SVG with pocket and tongue parts', () => {
    const carcass = new BaseCarcass();
    const svg = renderIsoAssembly(carcass, { exploded: true });

    assert.match(svg, /data-view="exploded-iso"/);
    assert.match(svg, /data-part="left-end"/);
    assert.match(svg, /data-part="right-end"/);
    assert.match(svg, /data-part="bottom"/);
    assert.match(svg, /iso-pocket/);
    assert.match(svg, /iso-tongue/);
    assert.match(svg, /pocket 0\.25"/);
    assert.match(svg, />tongue</);
  });

  it('can render the assembled (non-exploded) state', () => {
    const carcass = new BaseCarcass();
    const svg = renderIsoAssembly(carcass, { exploded: false });
    assert.match(svg, /data-view="assembled-iso"/);
    assert.match(svg, /Assembled/);
  });
});
