// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.

/** Stand-in for Infinity in internal comparisons (e.g. near-vertical slopes). */
export const INFINITY = 1e12;

/** Stand-in for 0 in internal comparisons. */
export const ZERO = 1e-6;

/** A full turn, 2π. The original library defined this on the global Math object. */
export const TAU = 2 * Math.PI;
