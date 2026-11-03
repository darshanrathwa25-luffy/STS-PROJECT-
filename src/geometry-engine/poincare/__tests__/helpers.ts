// @ts-nocheck -- upstream test helpers, kept close to the original JavaScript.
// Ported from hyperbolic-canvas by Nick Barry (MIT). See ../LICENSE and ../README.md.
//
// Upstream seeds Math.random with the seedrandom package. We use a small built-in
// generator instead, with a fixed default seed so runs are reproducible.
import assert from 'node:assert';
import { HyperbolicCanvas } from '../index';

const seed = process.env.SEED || '20261103';

function seededRandom(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  // mulberry32
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

Math.random = seededRandom(seed);

function assertApproximate(actual, expected, message) {
  if (actual === expected) return;
  if (Number.isNaN(actual) && Number.isNaN(expected)) return;
  assert(
    Math.abs(actual - expected) < HyperbolicCanvas.ZERO,
    message || `Expected ${actual} to approximate ${expected} (diff: ${Math.abs(actual - expected)})`,
  );
}

function assertIsRealNumber(value, message) {
  assert(
    typeof value === 'number' && !Number.isNaN(value) && value !== Infinity && value !== -Infinity,
    message || `Expected ${value} to be a real number`,
  );
}

function assertIsA(actual, expected, message) {
  assert(actual instanceof expected, message || `Expected ${actual} to be an instance of ${expected.name}`);
}

export { HyperbolicCanvas, assertApproximate, assertIsRealNumber, assertIsA };
