import { Point2D, Point3D } from './types';
import { approxEqual, EPSILON } from './numerical';

// 2D Vector Operations
export function add2D(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub2D(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale2D(v: Point2D, s: number): Point2D {
  return { x: v.x * s, y: v.y * s };
}

export function dot2D(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

export function cross2D(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x;
}

export function normSq2D(v: Point2D): number {
  return v.x * v.x + v.y * v.y;
}

export function norm2D(v: Point2D): number {
  return Math.sqrt(normSq2D(v));
}

export function distSq2D(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dist2D(a: Point2D, b: Point2D): number {
  return Math.sqrt(distSq2D(a, b));
}

export function normalize2D(v: Point2D): Point2D {
  const n = norm2D(v);
  if (n < EPSILON) return { x: 0, y: 0 };
  return { x: v.x / n, y: v.y / n };
}

export function perp2D(v: Point2D): Point2D {
  return { x: -v.y, y: v.x };
}

// 3D Vector Operations
export function add3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale3D(v: Point3D, s: number): Point3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function dot3D(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross3D(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normSq3D(v: Point3D): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

export function norm3D(v: Point3D): number {
  return Math.sqrt(normSq3D(v));
}

export function dist3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalize3D(v: Point3D): Point3D {
  const n = norm3D(v);
  if (n < EPSILON) return { x: 0, y: 0, z: 0 };
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

export function pointsEqual2D(a: Point2D, b: Point2D, eps = EPSILON): boolean {
  return approxEqual(a.x, b.x, eps) && approxEqual(a.y, b.y, eps);
}

export function pointsEqual3D(a: Point3D, b: Point3D, eps = EPSILON): boolean {
  return (
    approxEqual(a.x, b.x, eps) &&
    approxEqual(a.y, b.y, eps) &&
    approxEqual(a.z, b.z, eps)
  );
}

