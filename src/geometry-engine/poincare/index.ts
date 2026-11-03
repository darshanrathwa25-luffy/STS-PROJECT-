// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.
import { INFINITY, ZERO, TAU } from './constants';
import { Angle } from './angle';
import { Point } from './point';
import { Line } from './line';
import { Circle } from './circle';
import { Polygon } from './polygon';

export { INFINITY, ZERO, TAU, Angle, Point, Line, Circle, Polygon };
export type { PointOptions } from './point';
export type { LineOptions, Geodesic } from './line';
export type { CircleOptions } from './circle';
export type { PolygonOptions } from './polygon';
export * from './measure';
export * from './mobius';
export * from './tiling';

/** The original library's namespace shape, kept so ported code and tests read the same. */
export const HyperbolicCanvas = { INFINITY, ZERO, Angle, Point, Line, Circle, Polygon };
