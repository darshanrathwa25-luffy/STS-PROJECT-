// @ts-nocheck -- upstream test suite, kept close to the original JavaScript.
// Ported from hyperbolic-canvas by Nick Barry (MIT). See ../LICENSE and ../README.md.
import { describe, it } from 'vitest';
import assert from 'node:assert';
import { TAU } from '../constants';
import { HyperbolicCanvas } from './helpers';

describe('HyperbolicCanvas', function () {
  it('defines the natural and just constant tau', function () {
    assert.strictEqual(TAU, Math.PI * 2);
  });

  it('defines the threshold for effective zero values', function () {
    assert(typeof HyperbolicCanvas.ZERO === 'number');
  });

  it('defines the threshold for effective infinity values', function () {
    assert(typeof HyperbolicCanvas.INFINITY === 'number');
  });
});
