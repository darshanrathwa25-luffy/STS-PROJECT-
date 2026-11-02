export type GeometryKind = 'euclidean' | 'spherical' | 'hyperbolic';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type SpacePoint = Point2D | Point3D;

export interface Circle2D {
  center: Point2D;
  radius: number;
}

export interface GeodesicCurve {
  id: string;
  kind: GeometryKind;
  /** Discretized points representing the visible arc/segment in 3D canvas space */
  points: Point3D[];
  /** Is this an infinite/complete geodesic line or a finite segment between endpoints? */
  isComplete: boolean;
  /** Ideal boundary endpoints if applicable (e.g., Poincaré disk boundary |z|=1) */
  idealEndpoints?: [Point2D, Point2D];
  /** Metadata describing the construction */
  label?: string;
  color?: string;
}

export type IntersectionType =
  | 'none'               // No intersection anywhere (parallel in Euclidean, ultraparallel in hyperbolic)
  | 'unique'             // Intersects at 1 interior point (Euclidean, Hyperbolic interior)
  | 'antipodal_pair'     // Spherical: intersects at exactly 2 antipodal points
  | 'limiting_parallel'  // Hyperbolic: intersects at infinity (exactly 1 ideal boundary point)
  | 'coincident'         // Lines are identical
  | 'divergent';         // Ultraparallel in hyperbolic space

export interface IntersectionInfo {
  type: IntersectionType;
  /** Coordinates of intersection(s) in appropriate space */
  points: SpacePoint[];
  /** Angle between geodesics at intersection in radians (if unique or antipodal) */
  angle?: number;
  /** For hyperbolic ultraparallels: hyperbolic distance of closest approach */
  ultraparallelDistance?: number;
  /** Human-readable mathematical explanation */
  description: string;
}

export interface ParallelComparisonResult {
  candidateId: string;
  angleRad: number;
  type: IntersectionType;
  label: string;
  color: string;
  intersectionInfo: IntersectionInfo;
}

export interface TriangleMeasurements {
  a: number; // side lengths
  b: number;
  c: number;
  alpha: number; // interior angles in radians
  beta: number;
  gamma: number;
  angleSum: number; // sum in radians
  angleSumDeg: number;
  area: number;
  excessOrDefect: number; // spherical excess or hyperbolic defect
}

