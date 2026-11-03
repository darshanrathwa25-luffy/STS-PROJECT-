import type { WorldKind, LabKind, DiskExploration } from '../store/geometryStore';

/**
 * The site is a short book. Each chapter asks one question; its pages ask it
 * again on different surfaces (or, in chapter III, in different ways).
 * Every page has an address, e.g. #/triangles/sphere.
 */
export interface Chapter {
  number: number;
  numeral: string;
  slug: string;
  title: string;
  summary: string;
}

/** One page: a lab, set up a particular way. */
export interface Step {
  chapter: number;
  slug: string;
  lab: LabKind;
  world?: WorldKind;
  exploration?: DiskExploration;
  /** Tab label, e.g. "Sphere". */
  label: string;
  /** Question answered on this page, for the tick in the contents. */
  questionId?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    numeral: 'I',
    slug: 'triangles',
    title: 'Triangles',
    summary: 'Do the angles of a triangle always add up to 180°? Try it on a plane, a sphere and a saddle.',
  },
  {
    number: 2,
    numeral: 'II',
    slug: 'parallels',
    title: 'Parallel lines',
    summary: "Euclid's fifth postulate: how many lines through a point never meet a given line?",
  },
  {
    number: 3,
    numeral: 'III',
    slug: 'circles',
    title: 'Circles',
    summary: 'Is the distance around a circle always 2πr? Grow one on each surface and see.',
  },
  {
    number: 4,
    numeral: 'IV',
    slug: 'disk',
    title: 'The hyperbolic plane',
    summary: 'The Poincaré disk maps the whole infinite plane. Walk it, tile it, slide it around.',
  },
  {
    number: 5,
    numeral: 'V',
    slug: 'meaning',
    title: 'What it means',
    summary: 'What you found, why it changed mathematics, and how we measure our own universe.',
  },
];

export const STEPS: Step[] = [
  { chapter: 1, slug: 'flat', lab: 'triangle', world: 'flat', label: 'Flat', questionId: 'tri_flat' },
  { chapter: 1, slug: 'sphere', lab: 'triangle', world: 'sphere', label: 'Sphere', questionId: 'tri_sphere' },
  { chapter: 1, slug: 'saddle', lab: 'triangle', world: 'hyperbolic', label: 'Saddle', questionId: 'tri_hyperbolic' },
  { chapter: 2, slug: 'flat', lab: 'parallel', world: 'flat', label: 'Flat', questionId: 'par_flat' },
  { chapter: 2, slug: 'sphere', lab: 'parallel', world: 'sphere', label: 'Sphere', questionId: 'par_sphere' },
  { chapter: 2, slug: 'saddle', lab: 'parallel', world: 'hyperbolic', label: 'Saddle', questionId: 'par_hyperbolic' },
  { chapter: 3, slug: 'flat', lab: 'circle', world: 'flat', label: 'Flat', questionId: 'circ_flat' },
  { chapter: 3, slug: 'sphere', lab: 'circle', world: 'sphere', label: 'Sphere', questionId: 'circ_sphere' },
  { chapter: 3, slug: 'saddle', lab: 'circle', world: 'hyperbolic', label: 'Saddle', questionId: 'circ_hyperbolic' },
  { chapter: 4, slug: 'walk', lab: 'disk', exploration: 'walk', label: 'Walk', questionId: 'disk_walk' },
  { chapter: 4, slug: 'tiles', lab: 'disk', exploration: 'tiles', label: 'Tiles', questionId: 'disk_tiles' },
  { chapter: 4, slug: 'tiling', lab: 'disk', exploration: 'tiling', label: 'Tiling', questionId: 'disk_tiling' },
  { chapter: 4, slug: 'polygons', lab: 'disk', exploration: 'polygon', label: 'Polygons', questionId: 'disk_polygon' },
  { chapter: 5, slug: '', lab: 'reflection', label: 'Reading' },
];

export const chapterOf = (step: Step): Chapter => CHAPTERS.find((c) => c.number === step.chapter)!;

export const pagesOf = (chapter: number): Step[] => STEPS.filter((s) => s.chapter === chapter);

/** The page matching what is on screen, or -1 if none does. */
export function currentStepIndex(lab: LabKind, world: WorldKind, exploration: DiskExploration): number {
  return STEPS.findIndex((s) => {
    if (s.lab !== lab) return false;
    if (lab === 'disk') return s.exploration === exploration;
    if (lab === 'reflection') return true;
    return s.world === world;
  });
}

export function firstStepOfChapter(chapter: number): number {
  return STEPS.findIndex((s) => s.chapter === chapter);
}

/** "#/triangles/sphere", or "#/meaning" for a single-page chapter. */
export function stepToHash(step: Step): string {
  const chapter = chapterOf(step);
  return step.slug ? `#/${chapter.slug}/${step.slug}` : `#/${chapter.slug}`;
}

/**
 * The page a hash points at. "#/" or "" is the cover (null). A chapter without a
 * page ("#/parallels") opens its first page. Unknown addresses give undefined.
 */
/** Addresses from earlier versions of the book, and where they live now. */
const MOVED: Record<string, string> = { 'disk/circles': 'circles/saddle' };

export function hashToStep(hash: string): Step | null | undefined {
  const path = hash.replace(/^#\/?/, '');
  const parts = (MOVED[path] ?? path).split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const chapter = CHAPTERS.find((c) => c.slug === parts[0]);
  if (!chapter) return undefined;
  const pages = pagesOf(chapter.number);
  if (parts.length === 1) return pages[0];
  return pages.find((p) => p.slug === parts[1]);
}
