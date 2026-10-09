/**
 * Single 3-part base carcass (Left End, Right End, Bottom).
 *
 * Changing height, width, or depth recomputes part stock sizes
 * and blind-dado mortise/tenon features immediately — no manual
 * G-code or geometry edits.
 */

import {
  DEFAULT_CARCASS,
  GLOBAL,
  patchJobDefaults,
  requirePositive,
} from './parameters.js';
import { buildParts } from './parts.js';
import { dadoSpan } from './dadoEngine.js';

/**
 * @typedef {'height' | 'width' | 'depth'} EnvelopeAxis
 */

export class BaseCarcass {
  /**
   * @param {Partial<{ height: number, width: number, depth: number }>} [envelope]
   */
  constructor(envelope = {}) {
    this._height = requirePositive(
      envelope.height ?? DEFAULT_CARCASS.height,
      'height',
    );
    this._width = requirePositive(
      envelope.width ?? DEFAULT_CARCASS.width,
      'width',
    );
    this._depth = requirePositive(
      envelope.depth ?? DEFAULT_CARCASS.depth,
      'depth',
    );

    /** @type {ReturnType<typeof buildParts> | null} */
    this._parts = null;
    /** @type {Set<(carcass: BaseCarcass) => void>} */
    this._listeners = new Set();

    this._recompute();
  }

  /** Frozen global joinery / material parameters. */
  get globals() {
    return GLOBAL;
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  get depth() {
    return this._depth;
  }

  /**
   * Latest computed parts. Always in sync with the envelope.
   * @returns {ReturnType<typeof buildParts>}
   */
  get parts() {
    if (!this._parts) this._recompute();
    return /** @type {ReturnType<typeof buildParts>} */ (this._parts);
  }

  /**
   * Outside envelope used for layout / cutlist headers.
   */
  get envelope() {
    return {
      height: this._height,
      width: this._width,
      depth: this._depth,
    };
  }

  /**
   * @param {number} value
   * @returns {this}
   */
  setHeight(value) {
    return this.setEnvelope({ height: value });
  }

  /**
   * @param {number} value
   * @returns {this}
   */
  setWidth(value) {
    return this.setEnvelope({ width: value });
  }

  /**
   * @param {number} value
   * @returns {this}
   */
  setDepth(value) {
    return this.setEnvelope({ depth: value });
  }

  /**
   * Update one or more envelope axes. Part dimensions and
   * mortise/tenon features recalculate in the same call.
   *
   * @param {Partial<{ height: number, width: number, depth: number }>} patch
   * @returns {this}
   */
  setEnvelope(patch) {
    if (patch.height !== undefined) {
      this._height = requirePositive(patch.height, 'height');
    }
    if (patch.width !== undefined) {
      this._width = requirePositive(patch.width, 'width');
    }
    if (patch.depth !== undefined) {
      this._depth = requirePositive(patch.depth, 'depth');
    }
    this._recompute();
    this._emit();
    return this;
  }

  /**
   * Patch job defaults (dado mode, bit, relief, shoulders).
   * Parts and mating tenons recompute immediately.
   * @param {Parameters<typeof patchJobDefaults>[0]} patch
   * @returns {this}
   */
  setJobDefaults(patch) {
    patchJobDefaults(patch);
    this._recompute();
    this._emit();
    return this;
  }

  /**
   * Subscribe to automatic recomputes (e.g. UI / cutlist).
   * @param {(carcass: BaseCarcass) => void} listener
   * @returns {() => void} unsubscribe
   */
  onChange(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Serializable snapshot for cutlists / UI — not G-code.
   */
  toJSON() {
    return {
      globals: {
        materialThickness: GLOBAL.materialThickness,
        dadoDepth: GLOBAL.dadoDepth,
        frontShoulder: GLOBAL.frontShoulder,
        rearShoulder: GLOBAL.rearShoulder,
        dadoMode: GLOBAL.dadoMode,
        bitDiameter: GLOBAL.bitDiameter,
        bitRadius: GLOBAL.bitRadius,
        cornerRelief: GLOBAL.cornerRelief,
        blindShoulder: GLOBAL.blindShoulder,
      },
      envelope: this.envelope,
      parts: this.parts,
    };
  }

  _recompute() {
    this._assertJoineryFits();
    this._parts = buildParts(this.envelope);
  }

  _assertJoineryFits() {
    const { dadoDepth, materialThickness } = GLOBAL;
    // Validates shoulder span for current dado mode
    dadoSpan(this._depth);
    if (this._width <= 2 * materialThickness) {
      throw new Error(
        `width (${this._width}) must leave room for both ${materialThickness}" ends`,
      );
    }
    if (dadoDepth >= materialThickness) {
      throw new Error('dadoDepth must be less than materialThickness');
    }
  }

  _emit() {
    for (const listener of this._listeners) listener(this);
  }
}
