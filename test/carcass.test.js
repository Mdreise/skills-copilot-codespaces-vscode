import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseCarcass,
  GLOBAL,
  DEFAULT_CARCASS,
  bottomLength,
} from '../src/carcass/index.js';

describe('global parameters', () => {
  it('uses 5/8" material with 1/4" deep blind dado and 1/2" shoulder', () => {
    assert.equal(GLOBAL.materialThickness, 5 / 8);
    assert.equal(GLOBAL.dadoDepth, 1 / 4);
    assert.equal(GLOBAL.blindShoulder, 1 / 2);
  });
});

describe('BaseCarcass', () => {
  it('builds Left End, Right End, and Bottom', () => {
    const carcass = new BaseCarcass();
    const { leftEnd, rightEnd, bottom } = carcass.parts;

    assert.equal(leftEnd.name, 'Left End');
    assert.equal(rightEnd.name, 'Right End');
    assert.equal(bottom.name, 'Bottom');
  });

  it('sizes ends from height and depth', () => {
    const carcass = new BaseCarcass({ height: 30, width: 18, depth: 22 });
    const { leftEnd, rightEnd } = carcass.parts;

    assert.equal(leftEnd.dimensions.height, 30);
    assert.equal(leftEnd.dimensions.width, 22);
    assert.equal(leftEnd.dimensions.thickness, GLOBAL.materialThickness);
    assert.deepEqual(rightEnd.dimensions, leftEnd.dimensions);
  });

  it('sizes bottom length from width with dado engagement', () => {
    const width = 24;
    const carcass = new BaseCarcass({ width, depth: 24 });
    const expected = bottomLength(width);

    assert.equal(carcass.parts.bottom.dimensions.length, expected);
    assert.equal(
      expected,
      width - 2 * GLOBAL.materialThickness + 2 * GLOBAL.dadoDepth,
    );
  });

  it('places blind dado mortises with 1/4" depth and 1/2" front shoulder', () => {
    const depth = 24;
    const carcass = new BaseCarcass({ depth });
    const mortise = carcass.parts.leftEnd.features[0];

    assert.equal(mortise.kind, 'mortise');
    assert.equal(mortise.joinery, 'blind-dado');
    assert.equal(mortise.width, GLOBAL.dadoDepth);
    assert.equal(mortise.y, GLOBAL.blindShoulder);
    assert.equal(mortise.depth, depth - GLOBAL.blindShoulder);
    assert.equal(mortise.height, GLOBAL.materialThickness);
  });

  it('places matching tenons on the bottom', () => {
    const carcass = new BaseCarcass({ width: 30, depth: 21 });
    const { bottom } = carcass.parts;
    const [left, right] = bottom.features;

    assert.equal(left.kind, 'tenon');
    assert.equal(right.kind, 'tenon');
    assert.equal(left.width, GLOBAL.dadoDepth);
    assert.equal(right.width, GLOBAL.dadoDepth);
    assert.equal(left.y, GLOBAL.blindShoulder);
    assert.equal(left.depth, 21 - GLOBAL.blindShoulder);
    assert.equal(right.x, bottom.dimensions.length - GLOBAL.dadoDepth);
  });

  it('recalculates parts instantly when height, width, or depth change', () => {
    const carcass = new BaseCarcass();
    const before = structuredClone(carcass.toJSON());

    carcass.setHeight(28);
    assert.equal(carcass.parts.leftEnd.dimensions.height, 28);
    assert.equal(carcass.parts.rightEnd.dimensions.height, 28);
    assert.notEqual(carcass.parts.leftEnd.dimensions.height, before.parts.leftEnd.dimensions.height);

    carcass.setWidth(36);
    assert.equal(
      carcass.parts.bottom.dimensions.length,
      bottomLength(36),
    );
    assert.equal(
      carcass.parts.bottom.features[1].x,
      bottomLength(36) - GLOBAL.dadoDepth,
    );

    carcass.setDepth(20);
    assert.equal(carcass.parts.leftEnd.dimensions.width, 20);
    assert.equal(carcass.parts.bottom.dimensions.width, 20);
    assert.equal(
      carcass.parts.leftEnd.features[0].depth,
      20 - GLOBAL.blindShoulder,
    );
    assert.equal(
      carcass.parts.bottom.features[0].depth,
      20 - GLOBAL.blindShoulder,
    );
  });

  it('notifies listeners after envelope updates', () => {
    const carcass = new BaseCarcass();
    let calls = 0;
    let seenDepth = 0;

    const off = carcass.onChange((c) => {
      calls += 1;
      seenDepth = c.depth;
    });

    carcass.setDepth(19.5);
    assert.equal(calls, 1);
    assert.equal(seenDepth, 19.5);

    off();
    carcass.setWidth(22);
    assert.equal(calls, 1);
  });

  it('updates multiple axes in one setEnvelope call', () => {
    const carcass = new BaseCarcass();
    carcass.setEnvelope({ height: 31, width: 27, depth: 23 });

    assert.deepEqual(carcass.envelope, { height: 31, width: 27, depth: 23 });
    assert.equal(carcass.parts.leftEnd.dimensions.height, 31);
    assert.equal(carcass.parts.bottom.dimensions.length, bottomLength(27));
    assert.equal(carcass.parts.rightEnd.features[0].depth, 23 - GLOBAL.blindShoulder);
  });

  it('rejects invalid envelope values', () => {
    assert.throws(() => new BaseCarcass({ height: 0 }), /height/);
    assert.throws(() => new BaseCarcass({ depth: GLOBAL.blindShoulder }), /blind shoulder/);
    assert.throws(
      () => new BaseCarcass({ width: 2 * GLOBAL.materialThickness }),
      /ends/,
    );
  });

  it('defaults to a standard base envelope', () => {
    const carcass = new BaseCarcass();
    assert.deepEqual(carcass.envelope, { ...DEFAULT_CARCASS });
  });
});
