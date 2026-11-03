// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.
//
// A Line is the relationship between two points. It can be read as a Euclidean
// line or segment, or (via getHyperbolicGeodesic) as the hyperbolic straight line
// through the same points: a diameter of the disk, or an arc of a circle that
// meets the boundary at right angles.
import { INFINITY, ZERO } from './constants';
import { Angle } from './angle';
import { Point } from './point';
import { Circle } from './circle';

export interface LineOptions {
  p0: Point;
  p1?: Point;
  m?: number;
  euclideanUnitCircleIntersects?: Point[] | false;
  idealPoints?: Point[] | false;
}

/** A hyperbolic geodesic is drawn either as a straight diameter (Line) or as a circular arc (Circle). */
export type Geodesic = Line | Circle | false;

export class Line {
  private _p0: Point;
  private _p1?: Point;
  private _m?: number;
  private _euclideanUnitCircleIntersects?: Point[] | false;
  private _idealPoints?: Point[] | false;
  private _geodesic?: Geodesic;
  private _euclideanLength?: number;
  private _euclideanMidpoint?: Point;
  private _hyperbolicLength?: number;
  private _hyperbolicMidpoint?: Point | false;
  private _idealLine?: Line;

  constructor(options: LineOptions) {
    this._p0 = options.p0;
    this._p1 = options.p1;
    this._m = options.m === -Infinity ? Infinity : options.m;
    this._euclideanUnitCircleIntersects = options.euclideanUnitCircleIntersects;
    this._idealPoints = options.idealPoints;
  }

  getHyperbolicGeodesic(): Geodesic {
    if (this._geodesic === undefined) {
      if (this.getP0().isIdeal() || this.getP1().isIdeal()) {
        if (this.getP0().isIdeal() && this.getP1().isIdeal()) {
          this._calculateGeodesicThroughTwoIdealPoints();
        } else {
          this._calculateGeodesicThroughOnePointOnPlane();
        }
      } else if (!this.isOnPlane()) {
        // Either point is off the plane, so there is no geodesic
        this._geodesic = false;
      } else if (this.getP0().equals(Point.ORIGIN) || this.getP1().equals(Point.ORIGIN)) {
        // Through the origin: the geodesic is a straight diameter
        this._geodesic = this;
      } else {
        this._calculateGeodesicThroughOnePointOnPlane();
      }
    }
    return this._geodesic as Geodesic;
  }

  getEuclideanLength(): number {
    if (this._euclideanLength === undefined) {
      this._euclideanLength = this.getP0().euclideanDistanceTo(this.getP1());
    }
    return this._euclideanLength;
  }

  getEuclideanMidpoint(): Point {
    if (this._euclideanMidpoint === undefined) {
      this._euclideanMidpoint = Point.euclideanBetween(this.getP0(), this.getP1());
    }
    return this._euclideanMidpoint;
  }

  getHyperbolicLength(): number {
    if (this._hyperbolicLength === undefined) {
      this._hyperbolicLength = this.getP0().hyperbolicDistanceTo(this.getP1());
    }
    return this._hyperbolicLength;
  }

  getHyperbolicMidpoint(): Point | false {
    if (this._hyperbolicMidpoint === undefined) {
      this._hyperbolicMidpoint = this.isOnPlane()
        ? this.getP0().hyperbolicDistantPoint(this.getHyperbolicLength() / 2, this.getP0().hyperbolicAngleTo(this.getP1()))
        : false;
    }
    return this._hyperbolicMidpoint;
  }

  /** The line between the geodesic's two endpoints on the boundary. */
  getIdealLine(): Line {
    if (this._idealLine === undefined) {
      const ideal = this.getIdealPoints() as Point[];
      this._idealLine = Line.givenTwoPoints(ideal[0], ideal[1]);
    }
    return this._idealLine;
  }

  /** Where the hyperbolic line meets the boundary circle (its two "points at infinity"). */
  getIdealPoints(): Point[] | false {
    if (this._idealPoints === undefined) {
      const g = this.getHyperbolicGeodesic();
      if (g === false) {
        this._idealPoints = false;
      } else if (g === this) {
        this._idealPoints = this.getEuclideanUnitCircleIntersects();
      } else {
        this._idealPoints = (g as Circle).getUnitCircleIntersects();
      }
    }
    return this._idealPoints;
  }

  getP0(): Point {
    return this._p0;
  }

  getP1(): Point {
    if (this._p1 === undefined) {
      let x: number;
      let y: number;
      const p = this.getP0();
      const m = this.getSlope();
      if (m === Infinity) {
        x = p.getX();
        y = p.getY() ? p.getY() * 2 : p.getY() + 1;
      } else if (m === 0) {
        x = p.getX() ? p.getX() * 2 : p.getX() + 1;
        y = p.getY();
      } else {
        x = 0;
        y = p.getY() - m * p.getX();
      }
      this._p1 = Point.givenCoordinates(x, y);
    }
    return this._p1;
  }

  getSlope(): number {
    if (this._m === undefined) {
      this._m = (this.getP0().getY() - this.getP1().getY()) / (this.getP0().getX() - this.getP1().getX());
      if (Math.abs(this._m) > INFINITY) {
        this._m = Infinity;
      }
    }
    return this._m;
  }

  getEuclideanUnitCircleIntersects(): Point[] | false {
    if (this._euclideanUnitCircleIntersects === undefined) {
      const m = this.getSlope();

      if (m > INFINITY) {
        const x = this.getP0().getX();
        const y0 = Math.sqrt(1 - x * x);
        return [Point.givenCoordinates(x, y0), Point.givenCoordinates(x, -y0)];
      }

      // Quadratic formula
      const a = m ** 2 + 1;
      const x = this.getP0().getX();
      const y = this.getP0().getY();
      const b = m * 2 * (y - m * x);
      const c = y ** 2 + (x * m) ** 2 - 2 * m * x * y - 1;
      const discriminant = b * b - 4 * a * c;

      if (discriminant < -ZERO) {
        return false;
      }

      // Treat a near-zero discriminant as zero (tangent case)
      const x0 = (-1 * b - Math.sqrt(Math.abs(discriminant))) / (2 * a);
      const p0 = Point.givenCoordinates(x0, this.euclideanYAtX(x0) as number);

      if (Math.abs(discriminant) < ZERO) {
        return [p0];
      }

      const x1 = (-1 * b + Math.sqrt(discriminant)) / (2 * a);
      const p1 = Point.givenCoordinates(x1, this.euclideanYAtX(x1) as number);

      this._euclideanUnitCircleIntersects = [p0, p1];
    }
    return this._euclideanUnitCircleIntersects;
  }

  clone(): Line {
    return Line.givenTwoPoints(this.getP0(), this.getP1());
  }

  euclideanIncludesPoint(point: Point): boolean {
    if (this.getSlope() === Infinity) {
      return this.getP0().getX() === point.getX();
    }
    return Math.abs(point.getY() - this.getP0().getY() - this.getSlope() * (point.getX() - this.getP0().getX())) < ZERO;
  }

  hyperbolicIncludesPoint(point: Point): boolean {
    if (!(point.isOnPlane() !== point.isIdeal())) {
      return false;
    }
    const g = this.getHyperbolicGeodesic();
    if (g instanceof Circle) {
      return g.includesPoint(point);
    } else if (g instanceof Line) {
      return this.euclideanIncludesPoint(point);
    }
    return false;
  }

  equals(otherLine: Line): boolean {
    return this.isEuclideanParallelTo(otherLine) && this.euclideanIncludesPoint(otherLine.getP0());
  }

  hyperbolicEquals(otherLine: Line): boolean {
    const g = this.getHyperbolicGeodesic();
    const otherG = otherLine.getHyperbolicGeodesic();
    if (g instanceof Circle && otherG instanceof Circle) {
      return g.equals(otherG);
    } else if (g instanceof Line && otherG instanceof Line) {
      return g.equals(otherG);
    }
    return false;
  }

  euclideanIntersectsWithCircle(circle: Circle): Point[] {
    // Rotate circle and line about the origin until the line is horizontal
    const angleOffset = Angle.fromSlope(this.getSlope()) * -1;

    const offsetCircle = Circle.givenEuclideanCenterRadius(
      circle.getEuclideanCenter().rotateAboutOrigin(angleOffset),
      circle.getEuclideanRadius()
    );

    // Distance from the line to the origin, signed by which side it passes
    let lineOffset = (Line.euclideanIntersect(this, this.euclideanPerpindicularLineAt(Point.ORIGIN)) as Point).euclideanDistanceTo(
      Point.ORIGIN
    );
    lineOffset *= (this.euclideanYAtX(0) as number) > 0 ? 1 : -1;

    return offsetCircle.pointsAtY(lineOffset).map((p) => p.rotateAboutOrigin(angleOffset * -1));
  }

  hyperbolicIntersectsWithCircle(circle: Circle): Point[] | false {
    const g = this.getHyperbolicGeodesic();
    if (g instanceof Circle) {
      return Circle.intersects(g, circle);
    } else if (g instanceof Line) {
      return this.euclideanIntersectsWithCircle(circle);
    }
    return false;
  }

  /** x on the Euclidean line at height y. For a horizontal line, whether y is on it. */
  euclideanXAtY(y: number): number | boolean {
    if (this.getSlope() === 0) {
      return y === this.getP0().getY();
    }
    return (y - this.getP0().getY()) / this.getSlope() + this.getP0().getX();
  }

  /** y on the Euclidean line at x. For a vertical line, whether x is on it. */
  euclideanYAtX(x: number): number | boolean {
    if (this.getSlope() === Infinity) {
      return x === this.getP0().getX();
    }
    return (x - this.getP0().getX()) * this.getSlope() + this.getP0().getY();
  }

  isIdeal(): boolean {
    return this.getP0().isIdeal() || this.getP1().isIdeal();
  }

  isOnPlane(): boolean {
    return this.getP0().isOnPlane() && this.getP1().isOnPlane();
  }

  isEuclideanParallelTo(otherLine: Line): boolean {
    return Math.abs(this.getSlope() - otherLine.getSlope()) < ZERO;
  }

  /** True if the two hyperbolic lines never meet on the plane. */
  isHyperbolicParallelTo(otherLine: Line): boolean {
    return Line.hyperbolicIntersect(this, otherLine) === false;
  }

  euclideanPerpindicularBisector(): Line {
    return this.euclideanPerpindicularLineAt(this.getEuclideanMidpoint());
  }

  euclideanPerpindicularLineAt(point: Point): Line {
    return Line.givenPointSlope(point, this.euclideanPerpindicularSlope());
  }

  euclideanPerpindicularSlope(): number {
    const slope = this.getSlope();
    if (slope === Infinity) return 0;
    if (slope === 0) return Infinity;
    return -1 / slope;
  }

  pointAtEuclideanX(x: number): Point | false {
    let y = this.euclideanYAtX(x);
    if (typeof y === 'boolean') {
      if (!y) return false;
      y = 0;
    }
    return Point.givenCoordinates(x, y);
  }

  pointAtEuclideanY(y: number): Point | false {
    let x = this.euclideanXAtY(y);
    if (typeof x === 'boolean') {
      if (!x) return false;
      x = 0;
    }
    return Point.givenCoordinates(x, y);
  }

  private _calculateGeodesicThroughTwoIdealPoints(): void {
    const a0 = this.getP0().getAngle();
    const a1 = this.getP1().getAngle();
    if (Math.abs(a0 - Angle.opposite(a1)) < ZERO) {
      this._geodesic = this;
    } else {
      const t0 = Circle.UNIT.euclideanTangentAtPoint(this.getP0());
      const t1 = Circle.UNIT.euclideanTangentAtPoint(this.getP1());
      const center = Line.euclideanIntersect(t0, t1) as Point;
      this._geodesic = Circle.givenEuclideanCenterRadius(center, center.euclideanDistanceTo(this.getP0()));
    }
  }

  private _calculateGeodesicThroughOnePointOnPlane(): void {
    const l0 = Line.givenTwoPoints(this.getP0(), Point.ORIGIN);
    const l1 = Line.givenTwoPoints(this.getP1(), Point.ORIGIN);

    if (l0.equals(l1)) {
      // Both points are collinear with the origin: the geodesic is this diameter
      this._geodesic = this;
      return;
    }

    // The line through the on-plane point, perpendicular to its radius, meets the
    // boundary at two points whose tangents cross at the inversion of that point.
    const intersects = this.getP0().isIdeal()
      ? l1.euclideanPerpindicularLineAt(this.getP1()).getEuclideanUnitCircleIntersects()
      : l0.euclideanPerpindicularLineAt(this.getP0()).getEuclideanUnitCircleIntersects();

    if (!intersects || intersects.length < 2) {
      // Line is outside of or tangent to the unit circle
      this._geodesic = false;
      return;
    }

    const t0 = Circle.UNIT.euclideanTangentAtPoint(intersects[0]);
    const t1 = Circle.UNIT.euclideanTangentAtPoint(intersects[1]);
    const c = Line.euclideanIntersect(t0, t1);

    this._geodesic = Circle.givenThreePoints(this.getP0(), this.getP1(), c);
  }

  // ---- class functions ----

  static euclideanIntersect(l0: Line, l1: Line): Point | false {
    let x: number;
    let y: number;

    const l0m = l0.getSlope();
    const l1m = l1.getSlope();

    if (l0m === l1m) {
      // Parallel (or the same line)
      return false;
    }

    const l0x = l0.getP0().getX();
    const l1x = l1.getP0().getX();
    const l0y = l0.getP0().getY();
    const l1y = l1.getP0().getY();

    if (l0m === Infinity) {
      x = l0x;
    } else if (l1m === Infinity) {
      x = l1x;
    } else {
      x = (l0x * l0m - l1x * l1m + l1y - l0y) / (l0m - l1m);
    }

    if (l0m === 0) {
      y = l0y;
    } else if (l1m === 0) {
      y = l1y;
    } else {
      y = l0m === Infinity ? l1m * (x - l1x) + l1y : l0m * (x - l0x) + l0y;
    }

    return Point.givenCoordinates(x, y);
  }

  /** Where two hyperbolic lines cross on the plane, or false if they never do. */
  static hyperbolicIntersect(l0: Line, l1: Line): Point | false {
    if (!(l0.isOnPlane() && l1.isOnPlane())) {
      return false;
    }
    const g0 = l0.getHyperbolicGeodesic();
    const g1 = l1.getHyperbolicGeodesic();

    const g0IsLine = g0 instanceof Line;
    const g1IsLine = g1 instanceof Line;

    if (g0IsLine || g1IsLine) {
      if (g0IsLine && g1IsLine) {
        // Two diameters meet at the origin
        return Point.ORIGIN;
      }
      const circle = (g0IsLine ? g1 : g0) as Circle;
      const line = (g0IsLine ? g0 : g1) as Line;

      const angleOffset = Angle.fromSlope(line.getSlope()) * -1;
      const offsetCircle = Circle.givenEuclideanCenterRadius(
        circle.getEuclideanCenter().rotateAboutOrigin(angleOffset),
        circle.getEuclideanRadius()
      );

      const intersects = offsetCircle.pointsAtY(0).map((p) => p.rotateAboutOrigin(angleOffset * -1));
      return intersects.find((p) => p.isOnPlane()) ?? false;
    }

    const intersects = Circle.intersects(g0 as Circle, g1 as Circle);
    if (!intersects) {
      return false;
    }
    return intersects.find((p) => p.isOnPlane()) ?? false;
  }

  static randomSlope(): number {
    return Angle.toSlope(Angle.random());
  }

  static givenPointSlope(p: Point, slope: number): Line {
    return new Line({ p0: p, m: Math.abs(slope) > INFINITY ? Infinity : slope });
  }

  static givenTwoPoints(p0: Point, p1: Point): Line {
    return new Line({ p0, p1 });
  }

  /** The hyperbolic line whose two ends on the boundary are at these angles. */
  static givenAnglesOfIdealPoints(a0: number, a1: number): Line {
    const points = [Point.givenIdealAngle(a0), Point.givenIdealAngle(a1)];
    return new Line({ p0: points[0], p1: points[1], euclideanUnitCircleIntersects: points, idealPoints: points });
  }

  private static _xAxis?: Line;
  private static _yAxis?: Line;

  static get X_AXIS(): Line {
    return (Line._xAxis ??= new Line({ p0: Point.ORIGIN, m: 0 }));
  }

  static get Y_AXIS(): Line {
    return (Line._yAxis ??= new Line({ p0: Point.ORIGIN, m: Infinity }));
  }
}
