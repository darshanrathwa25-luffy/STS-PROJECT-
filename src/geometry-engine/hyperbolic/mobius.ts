import { Point2D, MobiusMatrix } from '../shared/types';

/**
 * Creates an SU(1, 1) Möbius transformation matrix mapping point `a` to the origin (0, 0).
 * m(z) = (z - a) / (1 - conj(a) * z)
 * Matrix representation: [[p, q], [conj(q), conj(p)]] with |p|^2 - |q|^2 = 1.
 */
export function translate(a: Point2D): MobiusMatrix {
  const normSq = a.x * a.x + a.y * a.y;
  // Clamp norm to avoid division by zero near or on the boundary
  const safeNormSq = Math.min(normSq, 0.9999999999);
  const factor = Math.sqrt(1 - safeNormSq);

  return {
    p: { re: 1 / factor, im: 0 },
    q: { re: -a.x / factor, im: -a.y / factor },
  };
}

/**
 * Composes two SU(1, 1) Möbius transformations m1 and m2: (m1 ∘ m2)(z) = m1(m2(z)).
 * Matrix product: M = M1 * M2.
 */
export function compose(m1: MobiusMatrix, m2: MobiusMatrix): MobiusMatrix {
  const p1 = m1.p;
  const q1 = m1.q;
  const p2 = m2.p;
  const q2 = m2.q;

  // p_comp = p1 * p2 + q1 * conj(q2)
  const pRe = (p1.re * p2.re - p1.im * p2.im) + (q1.re * q2.re + q1.im * q2.im);
  const pIm = (p1.re * p2.im + p1.im * p2.re) + (-q1.re * q2.im + q1.im * q2.re);

  // q_comp = p1 * q2 + q1 * conj(p2)
  const qRe = (p1.re * q2.re - p1.im * q2.im) + (q1.re * p2.re + q1.im * p2.im);
  const qIm = (p1.re * q2.im + p1.im * q2.re) + (-q1.re * p2.im + q1.im * p2.re);

  return renormalize({
    p: { re: pRe, im: pIm },
    q: { re: qRe, im: qIm },
  });
}

/**
 * Returns the inverse SU(1, 1) Möbius transformation.
 * For M = [[p, q], [conj(q), conj(p)]], M^(-1) = [[conj(p), -q], [-conj(q), p]].
 */
export function inverse(m: MobiusMatrix): MobiusMatrix {
  return {
    p: { re: m.p.re, im: -m.p.im },
    q: { re: -m.q.re, im: -m.q.im },
  };
}

/**
 * Applies the Möbius transformation to a point z in the Poincaré disk:
 * w = (p * z + q) / (conj(q) * z + conj(p)).
 */
export function apply(m: MobiusMatrix, z: Point2D): Point2D {
  const p = m.p;
  const q = m.q;

  // Numerator: p * z + q
  const numRe = p.re * z.x - p.im * z.y + q.re;
  const numIm = p.re * z.y + p.im * z.x + q.im;

  // Denominator: conj(q) * z + conj(p)
  // conj(q) = (q.re, -q.im), conj(p) = (p.re, -p.im)
  const denRe = q.re * z.x + q.im * z.y + p.re;
  const denIm = q.re * z.y - q.im * z.x - p.im;

  const denomSq = denRe * denRe + denIm * denIm;
  if (denomSq < 1e-14) {
    return { x: 0, y: 0 };
  }

  return {
    x: (numRe * denRe + numIm * denIm) / denomSq,
    y: (numIm * denRe - numRe * denIm) / denomSq,
  };
}

/**
 * Renormalizes the SU(1, 1) matrix so that |p|^2 - |q|^2 = 1.
 */
export function renormalize(m: MobiusMatrix): MobiusMatrix {
  const normPSq = m.p.re * m.p.re + m.p.im * m.p.im;
  const normQSq = m.q.re * m.q.re + m.q.im * m.q.im;
  const det = normPSq - normQSq;

  if (det > 1e-12) {
    const scale = Math.sqrt(det);
    return {
      p: { re: m.p.re / scale, im: m.p.im / scale },
      q: { re: m.q.re / scale, im: m.q.im / scale },
    };
  }

  // Fallback to identity matrix if numerical breakdown occurs
  return {
    p: { re: 1, im: 0 },
    q: { re: 0, im: 0 },
  };
}
