import { Point3D } from '../shared/types';

export interface PseudosphereVertex {
  position: Point3D;
  normal: Point3D;
  u: number;
  v: number;
}

export interface PseudosphereMeshDef {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  uGridLines: Float32Array[];
  vGridLines: Float32Array[];
}

/**
 * Generate parametric pseudosphere (tractricoid) surface:
 * x = R * sech(u) * cos(v)
 * y = R * (u - tanh(u))  (oriented along vertical axis)
 * z = R * sech(u) * sin(v)
 *
 * Gaussian Curvature K = -1 / R^2
 * u ranges from uMin (cusp edge) to uMax (asymptotic horn)
 * v ranges from 0 to 2*PI
 */
export function generatePseudosphereGeometry(
  R = 1.8,
  uMin = 0.08,
  uMax = 2.6,
  uSteps = 40,
  vSteps = 60
): PseudosphereMeshDef {
  const numVertices = (uSteps + 1) * (vSteps + 1);
  const positions = new Float32Array(numVertices * 3);
  const normals = new Float32Array(numVertices * 3);
  const indices = new Uint32Array(uSteps * vSteps * 6);

  // Helper hyperbolic functions
  const sech = (u: number) => 1 / Math.cosh(u);

  let vIdx = 0;
  for (let i = 0; i <= uSteps; i++) {
    const u = uMin + (i / uSteps) * (uMax - uMin);
    const sechU = sech(u);
    const tanhU = Math.tanh(u);
    const yVal = R * (u - tanhU) - 1.2; // center vertically

    for (let j = 0; j <= vSteps; j++) {
      const v = (j / vSteps) * 2 * Math.PI;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);

      const x = R * sechU * cosV;
      const y = yVal;
      const z = R * sechU * sinV;

      const pOffset = vIdx * 3;
      positions[pOffset] = x;
      positions[pOffset + 1] = y;
      positions[pOffset + 2] = z;

      // Surface normal:
      // dx/du = -R * sech(u)*tanh(u)*cos(v)
      // dy/du = R * (1 - sech^2(u)) = R * tanh^2(u)
      // dz/du = -R * sech(u)*tanh(u)*sin(v)
      // dx/dv = -R * sech(u)*sin(v)
      // dy/dv = 0
      // dz/dv = R * sech(u)*cos(v)
      // Cross product (du x dv) gives the outward normal:
      const nx = tanhU * cosV;
      const ny = sechU;
      const nz = tanhU * sinV;
      const nLen = Math.hypot(nx, ny, nz) || 1;

      normals[pOffset] = nx / nLen;
      normals[pOffset + 1] = ny / nLen;
      normals[pOffset + 2] = nz / nLen;

      vIdx++;
    }
  }

  // Triangulation indices
  let iIdx = 0;
  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * (vSteps + 1) + j;
      const b = (i + 1) * (vSteps + 1) + j;
      const c = (i + 1) * (vSteps + 1) + (j + 1);
      const d = i * (vSteps + 1) + (j + 1);

      indices[iIdx++] = a;
      indices[iIdx++] = b;
      indices[iIdx++] = d;

      indices[iIdx++] = b;
      indices[iIdx++] = c;
      indices[iIdx++] = d;
    }
  }

  // Coordinate grid lines
  const uGridLines: Float32Array[] = [];
  // Sample a few meridian curves (fixed v)
  const meridianCount = 12;
  for (let m = 0; m < meridianCount; m++) {
    const v = (m / meridianCount) * 2 * Math.PI;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);
    const pts = new Float32Array((uSteps + 1) * 3);

    for (let i = 0; i <= uSteps; i++) {
      const u = uMin + (i / uSteps) * (uMax - uMin);
      const sechU = sech(u);
      const tanhU = Math.tanh(u);
      pts[i * 3] = R * sechU * cosV;
      pts[i * 3 + 1] = R * (u - tanhU) - 1.2;
      pts[i * 3 + 2] = R * sechU * sinV;
    }
    uGridLines.push(pts);
  }

  // Sample parallel rings (fixed u)
  const vGridLines: Float32Array[] = [];
  const parallelCount = 10;
  for (let p = 0; p < parallelCount; p++) {
    const u = uMin + (p / (parallelCount - 1)) * (uMax - uMin);
    const sechU = sech(u);
    const tanhU = Math.tanh(u);
    const yVal = R * (u - tanhU) - 1.2;
    const pts = new Float32Array((vSteps + 1) * 3);

    for (let j = 0; j <= vSteps; j++) {
      const v = (j / vSteps) * 2 * Math.PI;
      pts[j * 3] = R * sechU * Math.cos(v);
      pts[j * 3 + 1] = yVal;
      pts[j * 3 + 2] = R * sechU * Math.sin(v);
    }
    vGridLines.push(pts);
  }

  return {
    vertices: positions,
    normals,
    indices,
    uGridLines,
    vGridLines,
  };
}

