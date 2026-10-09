import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseCarcass,
  GLOBAL,
  DEFAULT_CARCASS,
  bottomLength,
  resetJobDefaults,
} from '../src/carcass/index.js';

beforeEach(() => {
  resetJobDefaults();
});

describe('global parameters', () => {
  it('uses 5/8" material with 1/4" deep blind dado and 1/2" shoulder', () => {
    assert.equal(GLOBAL.materialThickness, 5 / 8);
    assert.equal(GLOBAL.dadoDepth, 1 / 4);
    assert.equal(GLOBAL.blindShoulder, 1 / 2);
    assert.equal(GLOBAL.frontShoulder, 1 / 2);
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
    assert.deepEqual(
      { height: rightEnd.dimensions.height, width: rightEnd.dimensions.width },
      { height: leftEnd.dimensions.height, width: leftEnd.dimensions.width },
    );
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

  it('places Face A blind dados with 1/4" depth and 1/2" stop', () => {
    const depth = 24;
    const carcass = new BaseCarcass({ depth });
    const dado = carcass.parts.leftEnd.features.find((f) => f.kind === 'dado');

    assert.equal(dado.face, 'A');
    assert.equal(dado.depth, GLOBAL.dadoDepth);
    assert.equal(dado.width, GLOBAL.materialThickness);
    assert.equal(dado.blindShoulder, GLOBAL.blindShoulder);
    assert.equal(dado.rect.x, GLOBAL.blindShoulder);
    assert.equal(dado.rect.width, depth - GLOBAL.blindShoulder);
  });

  it('places matching tongues and confirmat pilots on the bottom', () => {
    const carcass = new BaseCarcass({ width: 30, depth: 21 });
    const { bottom } = carcass.parts;
    const tenons = bottom.features.filter((f) => f.kind === 'tenon');
    const pilots = bottom.features.filter((f) => f.kind === 'confirmat-pilot');

    assert.equal(tenons.length, 2);
    assert.equal(tenons[0].depth, GLOBAL.dadoDepth);
    assert.equal(tenons[0].blindShoulder, GLOBAL.blindShoulder);
    assert.ok(pilots.length >= 2);
  });

  it('includes rear rabbets with edgeband exclusion', () => {
    const carcass = new BaseCarcass();
    const rabbet = carcass.parts.leftEnd.features.find((f) => f.kind === 'rabbet');
    assert.ok(rabbet);
    assert.equal(rabbet.edgebandExcluded, true);
    assert.equal(carcass.parts.leftEnd.edgebands.rear, false);
  });

  it('recalculates parts instantly when height, width, or depth change', () => {
    const carcass = new BaseCarcass();

    carcass.setHeight(28);
    assert.equal(carcass.parts.leftEnd.dimensions.height, 28);

    carcass.setWidth(36);
    assert.equal(carcass.parts.bottom.dimensions.length, bottomLength(36));

    carcass.setDepth(20);
    const dado = carcass.parts.leftEnd.features.find((f) => f.kind === 'dado');
    assert.equal(carcass.parts.leftEnd.dimensions.width, 20);
    assert.equal(dado.rect.width, 20 - GLOBAL.blindShoulder);
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
  });

  it('rejects invalid envelope values', () => {
    assert.throws(() => new BaseCarcass({ height: 0 }), /height/);
    assert.throws(() => new BaseCarcass({ depth: GLOBAL.blindShoulder }), /Shoulders|less than panel depth/);
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
