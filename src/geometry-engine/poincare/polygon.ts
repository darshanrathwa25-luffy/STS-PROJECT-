// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.
import { TAU } from './constants';
import { Angle } from './angle';
import { Point } from './point';
import { Line } from './line';

export interface PolygonOptions {
  vertices: Point[];
  lines?: Line[];
}

/** An ordered list of vertices. Its sides are hyperbolic lines when drawn hyperbolically. */
export class Polygon {
  private _vertices: Point[];
  private _lines?: Line[];

  constructor(options: PolygonOptions) {
    this._vertices = options.vertices;
    this._lines = options.lines;
  }

  getLines(): Line[] {
    if (this._lines === undefined) {
      const vertices = this.getVertices();
      const n = vertices.length;
      this._lines = vertices.map((v, i) => Line.givenTwoPoints(v, vertices[(i + 1) % n]));
    }
    return this._lines;
  }

  getVertices(): Point[] {
    return this._vertices;
  }

  /** A polygon whose vertices all lie on the boundary circle at these angles. */
  static givenAnglesOfIdealVertices(angles: number[]): Polygon | false {
    if (angles.length < 3) {
      return false;
    }
    return Polygon.givenVertices(angles.map((a) => Point.givenIdealAngle(a)));
  }

  static givenVertices(vertices: Point[]): Polygon | false {
    if (vertices.length < 3) {
      return false;
    }
    return new Polygon({ vertices });
  }

  /** A regular n-gon whose vertices are a Euclidean distance `radius` from `center`. */
  static givenEuclideanNCenterRadius(n: number, center: Point, radius: number, rotation?: number): Polygon | false {
    if (n < 3) {
      return false;
    }
    let angle = rotation ? Angle.normalize(rotation) : 0;
    const increment = TAU / n;
    const vertices: Point[] = [];
    for (let i = 0; i < n; i++) {
      vertices.push(center.euclideanDistantPoint(radius, angle));
      angle = Angle.normalize(angle + increment);
    }
    return new Polygon({ vertices });
  }

  /** A regular n-gon whose vertices are a hyperbolic distance `radius` from `center`. */
  static givenHyperbolicNCenterRadius(n: number, center: Point, radius: number, rotation?: number): Polygon | false {
    if (n < 3) {
      return false;
    }
    if (!center.isOnPlane()) {
      return false;
    }
    let angle = rotation ? Angle.normalize(rotation) : 0;
    const increment = TAU / n;
    const vertices: Point[] = [];
    for (let i = 0; i < n; i++) {
      vertices.push(center.hyperbolicDistantPoint(radius, angle));
      angle = Angle.normalize(angle + increment);
    }
    return new Polygon({ vertices });
  }
}
