// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.
//
// A circle in the disk. Every hyperbolic circle is also a Euclidean circle, but
// with a different centre and radius; either description can be given and the
// other is derived on demand.
import { ZERO, TAU } from './constants';
import { Angle } from './angle';
import { Point } from './point';
import { Line } from './line';

export interface CircleOptions {
  euclideanCenter?: Point;
  euclideanRadius?: number;
  hyperbolicCenter?: Point | false;
  hyperbolicRadius?: number;
}

export class Circle {
  protected _euclideanCenter?: Point;
  protected _euclideanRadius?: number;
  protected _hyperbolicCenter?: Point | false;
  protected _hyperbolicRadius?: number;
  private _euclideanArea?: number;
  private _euclideanCircumference?: number;
  private _hyperbolicArea?: number;
  private _hyperbolicCircumference?: number;
  private _unitCircleIntersects?: Point[] | false;

  constructor(options: CircleOptions) {
    this._euclideanCenter = options.euclideanCenter;
    this._euclideanRadius =
      options.euclideanRadius !== undefined && options.euclideanRadius < 0
        ? Math.abs(options.euclideanRadius)
        : options.euclideanRadius;
    this._hyperbolicCenter = options.hyperbolicCenter;
    this._hyperbolicRadius =
      options.hyperbolicRadius !== undefined && options.hyperbolicRadius < 0
        ? Math.abs(options.hyperbolicRadius)
        : options.hyperbolicRadius;
  }

  getEuclideanArea(): number {
    if (this._euclideanArea === undefined) {
      this._euclideanArea = Math.PI * this.getEuclideanRadius() ** 2;
    }
    return this._euclideanArea;
  }

  getEuclideanCenter(): Point {
    if (this._euclideanCenter === undefined) {
      this._calculateEuclideanCenterRadius();
    }
    return this._euclideanCenter as Point;
  }

  getEuclideanCircumference(): number {
    if (this._euclideanCircumference === undefined) {
      this._euclideanCircumference = TAU * this.getEuclideanRadius();
    }
    return this._euclideanCircumference;
  }

  getEuclideanDiameter(): number {
    return this.getEuclideanRadius() * 2;
  }

  getEuclideanRadius(): number {
    if (this._euclideanRadius === undefined) {
      this._calculateEuclideanCenterRadius();
    }
    return this._euclideanRadius as number;
  }

  /** 2π(cosh r − 1): grows exponentially with r, unlike πr² on a flat plane. */
  getHyperbolicArea(): number {
    if (this._hyperbolicArea === undefined) {
      this._hyperbolicArea = TAU * (Math.cosh(this.getHyperbolicRadius()) - 1);
    }
    return this._hyperbolicArea;
  }

  getHyperbolicCenter(): Point | false {
    if (this._hyperbolicCenter === undefined) {
      this._calculateHyperbolicCenterRadius();
    }
    return this._hyperbolicCenter as Point | false;
  }

  /** 2π sinh r: grows exponentially with r, unlike 2πr on a flat plane. */
  getHyperbolicCircumference(): number {
    if (this._hyperbolicCircumference === undefined) {
      this._hyperbolicCircumference = TAU * Math.sinh(this.getHyperbolicRadius());
    }
    return this._hyperbolicCircumference;
  }

  getHyperbolicDiameter(): number {
    return this.getHyperbolicRadius() * 2;
  }

  getHyperbolicRadius(): number {
    if (this._hyperbolicRadius === undefined) {
      this._calculateHyperbolicCenterRadius();
    }
    return this._hyperbolicRadius as number;
  }

  getUnitCircleIntersects(): Point[] | false {
    if (this._unitCircleIntersects === undefined) {
      this._unitCircleIntersects = Circle.intersects(this, Circle.UNIT);
    }
    return this._unitCircleIntersects;
  }

  clone(): Circle {
    return Circle.givenEuclideanCenterRadius(this.getEuclideanCenter(), this.getEuclideanRadius());
  }

  equals(otherCircle: Circle): boolean {
    return (
      this.getEuclideanCenter().equals(otherCircle.getEuclideanCenter()) &&
      Math.abs(this.getEuclideanRadius() - otherCircle.getEuclideanRadius()) < ZERO
    );
  }

  /** Strictly inside the circle. */
  containsPoint(point: Point): boolean {
    return this.getEuclideanRadius() > point.euclideanDistanceTo(this.getEuclideanCenter());
  }

  /** On the circle's edge. */
  includesPoint(point: Point): boolean {
    return Math.abs(this.getEuclideanRadius() - point.euclideanDistanceTo(this.getEuclideanCenter())) < ZERO;
  }

  euclideanAngleAt(p: Point): number {
    const dx = p.getX() - this.getEuclideanCenter().getX();
    const dy = p.getY() - this.getEuclideanCenter().getY();
    return Angle.normalize(Math.atan2(dy, dx));
  }

  euclideanPointAt(angle: number): Point {
    return Point.givenCoordinates(
      this.getEuclideanRadius() * Math.cos(angle) + this.getEuclideanCenter().getX(),
      this.getEuclideanRadius() * Math.sin(angle) + this.getEuclideanCenter().getY()
    );
  }

  hyperbolicAngleAt(p: Point): number {
    return (this.getHyperbolicCenter() as Point).hyperbolicAngleTo(p);
  }

  hyperbolicPointAt(angle: number): Point {
    return (this.getHyperbolicCenter() as Point).hyperbolicDistantPoint(this.getHyperbolicRadius(), angle);
  }

  pointsAtX(x: number): Point[] {
    return this.yAtX(x).map((y) => Point.givenCoordinates(x, y));
  }

  pointsAtY(y: number): Point[] {
    return this.xAtY(y).map((x) => Point.givenCoordinates(x, y));
  }

  euclideanTangentAtAngle(angle: number): Line {
    return Line.givenPointSlope(this.euclideanPointAt(angle), -1 / Angle.toSlope(angle));
  }

  /** Tangent at the point of the circle in the direction of `p` (p need not lie on the circle). */
  euclideanTangentAtPoint(p: Point): Line {
    return this.euclideanTangentAtAngle(this.euclideanAngleAt(p));
  }

  xAtY(y: number): number[] {
    const center = this.getEuclideanCenter();
    const a = this._pythagoreanTheorem(y - center.getY());
    if (a) {
      return Math.abs(a) < ZERO ? [center.getX()] : [center.getX() + a, center.getX() - a];
    }
    return a === 0 ? [center.getX()] : [];
  }

  yAtX(x: number): number[] {
    const center = this.getEuclideanCenter();
    const a = this._pythagoreanTheorem(x - center.getX());
    if (a) {
      return Math.abs(a) < ZERO ? [center.getY()] : [center.getY() + a, center.getY() - a];
    }
    return a === 0 ? [center.getY()] : [];
  }

  private _pythagoreanTheorem(b: number): number {
    const c = this.getEuclideanRadius();
    const aSquared = c ** 2 - b ** 2;
    return Math.abs(aSquared) < ZERO ? 0 : Math.sqrt(aSquared);
  }

  private _calculateEuclideanCenterRadius(): void {
    const center = this.getHyperbolicCenter() as Point;
    const farPoint = this.hyperbolicPointAt(center.getAngle());
    const nearPoint = this.hyperbolicPointAt(Angle.opposite(center.getAngle()));
    const diameter = Line.givenTwoPoints(farPoint, nearPoint);
    this._euclideanCenter = diameter.getEuclideanMidpoint();
    this._euclideanRadius = diameter.getEuclideanLength() / 2;
  }

  private _calculateHyperbolicCenterRadius(): void {
    const center = this.getEuclideanCenter();

    if (center.getEuclideanRadius() + this.getEuclideanRadius() >= 1) {
      // Touches or leaves the disk: no hyperbolic centre (horocycles are not handled)
      if (this.equals(Circle.UNIT)) {
        this._hyperbolicCenter = center;
        this._hyperbolicRadius = Infinity;
      } else {
        this._hyperbolicCenter = false;
        this._hyperbolicRadius = NaN;
      }
    } else {
      const farPoint = this.euclideanPointAt(center.getAngle());
      const nearPoint = this.euclideanPointAt(Angle.opposite(center.getAngle()));
      const diameter = Line.givenTwoPoints(farPoint, nearPoint);
      this._hyperbolicCenter = diameter.getHyperbolicMidpoint();
      this._hyperbolicRadius = diameter.getHyperbolicLength() / 2;
    }
  }

  // ---- class functions ----

  static intersects(c0: Circle, c1: Circle): Point[] | false {
    // this function adapted from a post on Stack Overflow by 01AutoMonkey
    // and licensed CC BY-SA 3.0:
    // https://creativecommons.org/licenses/by-sa/3.0/legalcode
    const x0 = c0.getEuclideanCenter().getX();
    const y0 = c0.getEuclideanCenter().getY();
    const r0 = c0.getEuclideanRadius();
    const x1 = c1.getEuclideanCenter().getX();
    const y1 = c1.getEuclideanCenter().getY();
    const r1 = c1.getEuclideanRadius();

    // Horizontal and vertical distances between the centres, and the straight-line distance
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.sqrt(dy * dy + dx * dx);

    if (d > r0 + r1) {
      // Separate: no intersection
      return false;
    }
    if (d < Math.abs(r0 - r1)) {
      // One circle inside the other
      return false;
    }
    if (d < ZERO) {
      // Concentric
      return false;
    }

    // Point 2 is where the chord through the intersections crosses the line between centres
    const a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d);
    const x2 = x0 + (dx * a) / d;
    const y2 = y0 + (dy * a) / d;

    // Offset from point 2 to either intersection
    const h = Math.sqrt(r0 * r0 - a * a);
    const rx = -dy * (h / d);
    const ry = dx * (h / d);

    const p0 = Point.givenCoordinates(x2 + rx, y2 + ry);
    const p1 = Point.givenCoordinates(x2 - rx, y2 - ry);
    return p0.equals(p1) ? [p0] : [p0, p1];
  }

  static givenEuclideanCenterRadius(center: Point, radius: number): Circle {
    return new Circle({ euclideanCenter: center, euclideanRadius: radius });
  }

  /** A circle of hyperbolic radius `radius` around `center`, or false if the centre is off the plane. */
  static givenHyperbolicCenterRadius(center: Point, radius: number): Circle | false {
    if (!center.isOnPlane()) {
      return false;
    }
    return new Circle({ hyperbolicCenter: center, hyperbolicRadius: radius });
  }

  /** The circle with p0 and p1 at opposite ends of a diameter. */
  static givenTwoPoints(p0: Point, p1: Point): Circle {
    const l = Line.givenTwoPoints(p0, p1);
    return new Circle({ euclideanCenter: l.getEuclideanMidpoint(), euclideanRadius: l.getEuclideanLength() / 2 });
  }

  /** The circle through three points, or false if they are missing, repeated or collinear. */
  static givenThreePoints(p0: Point | false, p1: Point | false, p2: Point | false): Circle | false {
    if (!(p0 && p1 && p2)) {
      return false;
    }
    if (p0.equals(p1) || p0.equals(p2) || p1.equals(p2)) {
      return false;
    }
    const b0 = Line.givenTwoPoints(p0, p1);
    const b1 = Line.givenTwoPoints(p1, p2);
    if (b0.equals(b1)) {
      return false;
    }
    const center = Line.euclideanIntersect(b0.euclideanPerpindicularBisector(), b1.euclideanPerpindicularBisector()) as Point;
    const radius = Line.givenTwoPoints(p0, center).getEuclideanLength();
    return new Circle({ euclideanCenter: center, euclideanRadius: radius });
  }

  private static _unit?: Circle;

  /** The boundary of the disk: Euclidean radius 1, hyperbolic radius Infinity. */
  static get UNIT(): Circle {
    return (Circle._unit ??= new UnitCircle());
  }
}

class UnitCircle extends Circle {
  constructor() {
    super({});
  }

  getEuclideanArea(): number {
    return Math.PI;
  }
  getEuclideanCenter(): Point {
    return Point.ORIGIN;
  }
  getHyperbolicCenter(): Point {
    return Point.ORIGIN;
  }
  getEuclideanCircumference(): number {
    return TAU;
  }
  getEuclideanDiameter(): number {
    return 2;
  }
  getEuclideanRadius(): number {
    return 1;
  }
  getHyperbolicArea(): number {
    return Infinity;
  }
  getHyperbolicCircumference(): number {
    return Infinity;
  }
  getHyperbolicDiameter(): number {
    return Infinity;
  }
  getHyperbolicRadius(): number {
    return Infinity;
  }
  hyperbolicAngleAt(point: Point): number {
    return point.getAngle();
  }
  euclideanAngleAt(point: Point): number {
    return point.getAngle();
  }
  hyperbolicPointAt(angle: number): Point {
    return Point.givenEuclideanPolarCoordinates(1, angle);
  }
  euclideanPointAt(angle: number): Point {
    return Point.givenEuclideanPolarCoordinates(1, angle);
  }
}
