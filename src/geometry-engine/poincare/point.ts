// Ported from hyperbolic-canvas by Nick Barry (MIT). See ./LICENSE and ./README.md.
//
// A point of the Poincaré disk: the unit disk centred on (0, 0), with y up.
// Properties are computed lazily from whichever description the point was
// created with (Cartesian, Euclidean polar or hyperbolic polar) and cached.
import { ZERO } from './constants';
import { Angle } from './angle';
import { Line } from './line';
import { Circle } from './circle';

export interface PointOptions {
  angle?: number;
  euclideanRadius?: number;
  hyperbolicRadius?: number;
  direction?: number;
  x?: number;
  y?: number;
}

export class Point {
  protected _angle?: number;
  protected _euclideanRadius?: number;
  protected _hyperbolicRadius?: number;
  protected _direction?: number;
  protected _x?: number;
  protected _y?: number;

  constructor(options: PointOptions) {
    this._angle = options.angle;
    this._euclideanRadius = options.euclideanRadius;
    this._direction = options.direction;
    this._hyperbolicRadius = options.hyperbolicRadius;
    this._x = options.x;
    this._y = options.y;
  }

  getAngle(): number {
    if (this._angle === undefined) {
      this._angle = Angle.normalize(Math.atan2(this.getY(), this.getX()));
    }
    return this._angle;
  }

  /**
   * The direction of travel: the given direction if any, else the direction this
   * point was reached in by hyperbolicDistantPoint, else its angle from the origin.
   */
  getDirection(direction?: number): number {
    if (direction !== undefined) {
      return Angle.normalize(direction);
    }
    if (this._direction !== undefined) {
      return this._direction;
    }
    return this.getAngle();
  }

  getEuclideanRadius(): number {
    if (this._euclideanRadius === undefined) {
      if (this._x === undefined || this._y === undefined) {
        if (this.getHyperbolicRadius() === Infinity) {
          this._euclideanRadius = 1;
        } else {
          const e = Math.exp(this.getHyperbolicRadius());
          this._euclideanRadius = (e - 1) / (e + 1);
        }
      } else {
        this._euclideanRadius = Math.sqrt(this.getX() ** 2 + this.getY() ** 2);
      }
      if (Math.abs(this._euclideanRadius - 1) < ZERO) {
        this._euclideanRadius = 1;
      }
    }
    return this._euclideanRadius;
  }

  getHyperbolicRadius(): number {
    if (this._hyperbolicRadius === undefined) {
      this._hyperbolicRadius = this.isIdeal() ? Infinity : 2 * Math.atanh(this.getEuclideanRadius());
    }
    return this._hyperbolicRadius;
  }

  getX(): number {
    if (this._x === undefined) {
      this._x = this.getEuclideanRadius() * Math.cos(this.getAngle());
    }
    return this._x;
  }

  getY(): number {
    if (this._y === undefined) {
      this._y = this.getEuclideanRadius() * Math.sin(this.getAngle());
    }
    return this._y;
  }

  equals(otherPoint: Point): boolean {
    return Math.abs(this.getX() - otherPoint.getX()) < ZERO && Math.abs(this.getY() - otherPoint.getY()) < ZERO;
  }

  clone(): Point {
    return new Point({
      angle: this._angle,
      direction: this._direction,
      euclideanRadius: this._euclideanRadius,
      hyperbolicRadius: this._hyperbolicRadius,
      x: this._x,
      y: this._y,
    });
  }

  euclideanAngleFrom(otherPoint: Point): number {
    return otherPoint.euclideanAngleTo(this);
  }

  euclideanAngleTo(otherPoint: Point): number {
    return Angle.normalize(Math.atan2(otherPoint.getY() - this.getY(), otherPoint.getX() - this.getX()));
  }

  euclideanDistanceTo(otherPoint: Point): number {
    return Math.sqrt((this.getX() - otherPoint.getX()) ** 2 + (this.getY() - otherPoint.getY()) ** 2);
  }

  euclideanDistantPoint(distance: number, direction?: number): Point {
    const bearing = this.getDirection(direction);
    const distantPoint = Point.givenCoordinates(
      this.getX() + Math.cos(bearing) * distance,
      this.getY() + Math.sin(bearing) * distance
    );
    distantPoint._setDirection(bearing);
    return distantPoint;
  }

  hyperbolicAngleFrom(otherPoint: Point): number {
    return otherPoint.hyperbolicAngleTo(this);
  }

  /** The direction in which the geodesic from this point to `otherPoint` leaves this point. */
  hyperbolicAngleTo(otherPoint: Point): number {
    const geodesic = Line.givenTwoPoints(this, otherPoint).getHyperbolicGeodesic();

    let intersect: Point | false;
    if (geodesic instanceof Circle) {
      const t0 = geodesic.euclideanTangentAtPoint(this);
      const t1 = geodesic.euclideanTangentAtPoint(otherPoint);
      intersect = Line.euclideanIntersect(t0, t1);
    } else {
      intersect = otherPoint;
    }
    // As in the original: if the tangents are parallel there is no intersect.
    return this.euclideanAngleTo(intersect as Point);
  }

  hyperbolicDistanceTo(otherPoint: Point): number {
    if (this.isIdeal() || otherPoint.isIdeal()) {
      return Infinity;
    }
    const b = this.getHyperbolicRadius();
    const c = otherPoint.getHyperbolicRadius();
    const alpha = this.getAngle() - otherPoint.getAngle();
    return Math.acosh(Math.cosh(b) * Math.cosh(c) - Math.sinh(b) * Math.sinh(c) * Math.cos(alpha));
  }

  /**
   * Walk `distance` (hyperbolic) along the geodesic leaving this point in `direction`.
   * The returned point remembers the direction you'd be facing on arrival, so calling
   * this repeatedly without a direction keeps walking in a straight line.
   *
   * Uses the hyperbolic law of cosines, cosh(a) = cosh(b)cosh(c) − sinh(b)sinh(c)cos(α),
   * on the triangle (this point A, distant point B, origin C).
   */
  hyperbolicDistantPoint(distance: number, direction?: number): Point {
    const bearing = this.getDirection(direction);
    const c = distance;

    if (Math.abs(c) < ZERO) {
      const point = this.clone();
      point._setDirection(bearing);
      return point;
    }
    if (this.equals(Point.ORIGIN)) {
      const point = Point.givenHyperbolicPolarCoordinates(c, bearing);
      point._setDirection(bearing);
      return point;
    }

    const aAngle = this.getAngle();
    const b = this.getHyperbolicRadius();

    if (Math.abs(aAngle - bearing) < ZERO) {
      const point = Point.givenHyperbolicPolarCoordinates(b + c, aAngle);
      point._setDirection(bearing);
      return point;
    }

    const alpha = Math.abs(Math.PI - Math.abs(aAngle - bearing));

    if (alpha < ZERO) {
      const point = Point.givenHyperbolicPolarCoordinates(b - c, aAngle);
      point._setDirection(bearing);
      return point;
    }

    const coshb = Math.cosh(b);
    const coshc = Math.cosh(c);
    const sinhb = Math.sinh(b);
    const sinhc = Math.sinh(c);

    const a = Math.acosh(coshb * coshc - sinhb * sinhc * Math.cos(alpha));

    const cosha = Math.cosh(a);
    const sinha = Math.sinh(a);

    // Clamp floating-point error before acos
    let cosgamma = (cosha * coshb - coshc) / (sinha * sinhb);
    cosgamma = cosgamma > 1 ? 1 : cosgamma < -1 ? -1 : cosgamma;
    const gamma = Math.acos(cosgamma);

    // Is the distant point at aAngle + gamma or aAngle − gamma?
    const aAngleOpposite = Angle.opposite(aAngle);
    const dir =
      aAngle > aAngleOpposite
        ? bearing > aAngleOpposite && bearing < aAngle
          ? -1
          : 1
        : bearing > aAngle && bearing < aAngleOpposite
        ? 1
        : -1;
    const bAngle = Angle.normalize(aAngle + gamma * dir);
    const distantPoint = Point.givenHyperbolicPolarCoordinates(a, bAngle);

    let cosbeta = (cosha * coshc - coshb) / (sinha * sinhc);
    cosbeta = cosbeta > 1 ? 1 : cosbeta < -1 ? -1 : cosbeta;
    const beta = Math.acos(cosbeta);

    distantPoint._setDirection(bAngle + beta * dir);
    return distantPoint;
  }

  /** On the boundary circle: infinitely far from every point of the plane. */
  isIdeal(): boolean {
    return this._euclideanRadius === 1 || this._hyperbolicRadius === Infinity || this.getEuclideanRadius() === 1;
  }

  /** Strictly inside the unit disk. */
  isOnPlane(): boolean {
    return (
      (this._euclideanRadius !== undefined && this._euclideanRadius < 1) ||
      (this._hyperbolicRadius !== undefined && this._hyperbolicRadius < Infinity) ||
      this.getEuclideanRadius() < 1
    );
  }

  opposite(): Point {
    return Point.givenEuclideanPolarCoordinates(this.getEuclideanRadius(), Angle.opposite(this.getAngle()));
  }

  quadrant(): number {
    return Math.floor(this.getAngle() / (Math.PI / 2) + 1);
  }

  rotateAboutOrigin(angle: number): Point {
    return Point.givenEuclideanPolarCoordinates(this.getEuclideanRadius(), this.getAngle() + angle);
  }

  /** @internal */
  _setDirection(direction: number): void {
    this._direction = Angle.normalize(direction);
  }

  // ---- factories ----

  static euclideanBetween(p0: Point, p1: Point): Point {
    return new Point({ x: (p0.getX() + p1.getX()) / 2, y: (p0.getY() + p1.getY()) / 2 });
  }

  /** The hyperbolic midpoint, or false if either point is off the plane. */
  static hyperbolicBetween(p0: Point, p1: Point): Point | false {
    if (!(p0.isOnPlane() && p1.isOnPlane())) {
      return false;
    }
    const d = p0.hyperbolicDistanceTo(p1);
    return p0.hyperbolicDistantPoint(d / 2, p0.hyperbolicAngleTo(p1));
  }

  static givenCoordinates(x: number, y: number): Point {
    return new Point({ x, y });
  }

  static givenEuclideanPolarCoordinates(radius: number, angle: number): Point {
    if (radius < 0) {
      angle += Math.PI;
      radius = Math.abs(radius);
    }
    return new Point({ angle: Angle.normalize(angle), euclideanRadius: radius });
  }

  /**
   * A point at hyperbolic distance `radius` from the origin. Coordinates become NaN
   * past about 709, and are indistinguishable from the boundary past about 36.
   */
  static givenHyperbolicPolarCoordinates(radius: number, angle: number): Point {
    if (radius < 0) {
      angle += Math.PI;
      radius = Math.abs(radius);
    }
    return new Point({ angle: Angle.normalize(angle), hyperbolicRadius: radius });
  }

  /** A point on the boundary circle at the given angle. */
  static givenIdealAngle(angle: number): Point {
    return Point.givenEuclideanPolarCoordinates(1, angle);
  }

  static random(quadrant?: number): Point {
    return Point.givenEuclideanPolarCoordinates(Math.random(), Angle.random(quadrant));
  }

  private static _origin?: Point;

  /** The centre of the disk. */
  static get ORIGIN(): Point {
    if (!Point._origin) {
      Point._origin = new OriginPoint();
    }
    return Point._origin;
  }

  static get CENTER(): Point {
    return Point.ORIGIN;
  }
}

/** The origin, with exact shortcuts for everything measured from it. */
class OriginPoint extends Point {
  constructor() {
    super({ x: 0, y: 0 });
  }

  getAngle(): number {
    return 0;
  }
  getEuclideanRadius(): number {
    return 0;
  }
  getHyperbolicRadius(): number {
    return 0;
  }
  getX(): number {
    return 0;
  }
  getY(): number {
    return 0;
  }

  euclideanAngleFrom(otherPoint: Point): number {
    return Angle.opposite(this.euclideanAngleTo(otherPoint));
  }
  hyperbolicAngleFrom(otherPoint: Point): number {
    return Angle.opposite(this.euclideanAngleTo(otherPoint));
  }
  euclideanAngleTo(otherPoint: Point): number {
    return otherPoint.getAngle();
  }
  hyperbolicAngleTo(otherPoint: Point): number {
    return otherPoint.getAngle();
  }
  euclideanDistanceTo(otherPoint: Point): number {
    return otherPoint.getEuclideanRadius();
  }
  hyperbolicDistanceTo(otherPoint: Point): number {
    return otherPoint.getHyperbolicRadius();
  }
  euclideanDistantPoint(distance: number, direction?: number): Point {
    return Point.givenEuclideanPolarCoordinates(distance, this.getDirection(direction));
  }
  hyperbolicDistantPoint(distance: number, direction?: number): Point {
    return Point.givenHyperbolicPolarCoordinates(distance, this.getDirection(direction));
  }
}
