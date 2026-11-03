// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.
import { TAU } from './constants';

const DEGREES_TO_RADIANS = Math.PI / 180;

/** Angle helpers. Angles are in radians and normalised to [0, τ). */
export const Angle = {
  DEGREES_TO_RADIANS,

  /** The equivalent angle a with 0 ≤ a < τ. */
  normalize(angle: number): number {
    if (angle < 0) {
      return Math.abs(Math.floor(angle / TAU)) * TAU + angle;
    } else if (angle >= TAU) {
      return angle % TAU;
    }
    return angle;
  },

  fromDegrees(degrees: number): number {
    return Angle.normalize(degrees * DEGREES_TO_RADIANS);
  },

  toDegrees(radians: number): number {
    return (radians / DEGREES_TO_RADIANS) % 360;
  },

  opposite(angle: number): number {
    return Angle.normalize(angle + Math.PI);
  },

  toSlope(angle: number): number {
    return Math.tan(angle);
  },

  fromSlope(slope: number): number {
    return Math.atan(slope);
  },

  /** A random angle, optionally within quadrant 1–4. */
  random(quadrant?: number): number {
    const angle = Math.random() * TAU;
    return quadrant ? angle / 4 + (Math.PI / 2) * ((quadrant - 1) % 4) : angle;
  },
};
