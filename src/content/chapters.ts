import type { WorldKind, LabKind, DiskExploration } from '../store/geometryStore';

/** One stop on the guided path: a lab, set up a particular way. */
export interface Step {
  chapter: number;
  lab: LabKind;
  world?: WorldKind;
  exploration?: DiskExploration;
  /** Short label for the strip, e.g. "Triangles". */
  label: string;
}

export interface Chapter {
  number: number;
  numeral: string;
  title: string;
  summary: string;
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    numeral: 'I',
    title: "Euclid's world",
    summary: 'A flat plane: triangles add up to 180° and there is exactly one parallel.',
  },
  {
    number: 2,
    numeral: 'II',
    title: 'Curving outward',
    summary: 'On a sphere the angles add up to more, and parallels disappear.',
  },
  {
    number: 3,
    numeral: 'III',
    title: 'Curving both ways',
    summary: 'On a saddle the angles add up to less, and parallels multiply.',
  },
  {
    number: 4,
    numeral: 'IV',
    title: 'A map of an infinite world',
    summary: 'The Poincaré disk shows the whole hyperbolic plane at once. Walk it, measure it, tile it.',
  },
  {
    number: 5,
    numeral: 'V',
    title: 'So what shape is space?',
    summary: 'What you found, why it changed mathematics, and how we measure our own universe.',
  },
];

export const STEPS: Step[] = [
  { chapter: 1, lab: 'triangle', world: 'flat', label: 'Triangles' },
  { chapter: 1, lab: 'parallel', world: 'flat', label: 'Parallels' },
  { chapter: 2, lab: 'triangle', world: 'sphere', label: 'Triangles' },
  { chapter: 2, lab: 'parallel', world: 'sphere', label: 'Parallels' },
  { chapter: 3, lab: 'triangle', world: 'hyperbolic', label: 'Triangles' },
  { chapter: 3, lab: 'parallel', world: 'hyperbolic', label: 'Parallels' },
  { chapter: 4, lab: 'disk', exploration: 'walk', label: 'Walk' },
  { chapter: 4, lab: 'disk', exploration: 'circles', label: 'Circles' },
  { chapter: 4, lab: 'disk', exploration: 'tiles', label: 'Tiles' },
  { chapter: 4, lab: 'disk', exploration: 'polygon', label: 'Polygons' },
  { chapter: 5, lab: 'reflection', label: 'Reflection' },
];

/** The step matching what is on screen, or -1 if the view is not on the path. */
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
