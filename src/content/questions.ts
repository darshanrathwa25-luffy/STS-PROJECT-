import type { WorldKind, LabKind, DiskExploration } from '../store/geometryStore';

export interface QuestionSpec {
  id: string;
  lab: LabKind;
  /** Which world the question belongs to (triangle and parallel labs). */
  world?: WorldKind;
  /** Which exploration the question belongs to (disk lab). */
  exploration?: DiskExploration;
  title: string;
  prompt: string;
  hint: string;
  reveal: string;
  /** A few words for the findings table once the question is solved. */
  finding: string;
}

export const QUESTIONS: QuestionSpec[] = [
  {
    id: 'tri_flat',
    world: 'flat',
    lab: 'triangle',
    title: 'Can you break 180°?',
    prompt: 'Drag the corners. Try to make a triangle whose angles add up to anything other than 180°.',
    hint: 'Stretch it long and thin, or squash it flat. Watch the bar: it never passes the 180° mark.',
    reveal: "On a flat plane the sum is always exactly 180°. This follows from Euclid's fifth postulate, and for two thousand years it was taken as a plain fact about space, built into surveying, architecture and Newton's mechanics.",
    finding: 'exactly 180°',
  },
  {
    id: 'tri_sphere',
    world: 'sphere',
    lab: 'triangle',
    title: 'Where does the extra come from?',
    prompt: 'On a sphere the angles add up to more than 180°. Make the triangle bigger. What happens to the excess?',
    hint: 'Compare a small triangle with one that covers a large part of the globe. The excess tracks the area enclosed.',
    reveal: "The excess is proportional to the triangle's area (Girard's theorem, a case of Gauss–Bonnet). It's why no flat map of the Earth can keep every distance and angle true, a problem navigators and mapmakers lived with for centuries.",
    finding: 'more than 180°',
  },
  {
    id: 'tri_hyperbolic',
    world: 'hyperbolic',
    lab: 'triangle',
    title: 'Where did the missing degrees go?',
    prompt: 'On a saddle the angles add up to less than 180°. Spread the triangle out. Does the defect grow or shrink?',
    hint: 'Negative curvature pulls straight lines apart, so the corners get sharper as the triangle grows.',
    reveal: "The defect grows with area. In 1829 Lobachevsky published a geometry built on exactly this, and showed it was as consistent as Euclid's. Euclid's axioms turned out to be one choice among several, not a law of nature.",
    finding: 'less than 180°',
  },
  {
    id: 'par_flat',
    world: 'flat',
    lab: 'parallel',
    title: "Euclid's fifth postulate",
    prompt: 'Rotate the line through P. How many positions never meet line L?',
    hint: 'Look for the angle where the two lines stop converging on either side.',
    reveal: "Exactly one. On a flat plane a single parallel passes through P. For two thousand years mathematicians tried to prove this from Euclid's other axioms, and couldn't.",
    finding: 'exactly one',
  },
  {
    id: 'par_sphere',
    world: 'sphere',
    lab: 'parallel',
    title: 'Do parallels exist on a sphere?',
    prompt: 'Straight lines on a sphere are great circles. Can you find one through P that never meets L?',
    hint: 'Follow any great circle all the way round. Where does it cross the other one?',
    reveal: "None exist: every pair of great circles meets twice, at opposite points. Riemann showed that a consistent geometry with no parallels at all is possible, and it became a foundation for Einstein's curved spacetime.",
    finding: 'none',
  },
  {
    id: 'par_hyperbolic',
    world: 'hyperbolic',
    lab: 'parallel',
    title: 'How many parallels?',
    prompt: 'Rotate the line through P. How many positions avoid line L? Find the boundary angle Π(d).',
    hint: 'There are two limiting lines. Everything between them misses L.',
    reveal: "Infinitely many. Between the two limiting parallels at angle Π(d) lies a whole fan of lines that never meet L, the discovery Lobachevsky and Bolyai made independently in the 1820s and 30s.",
    finding: 'infinitely many',
  },
  {
    id: 'disk_walk',
    lab: 'disk',
    exploration: 'walk',
    title: 'Can you reach the edge?',
    prompt: 'Walk in a straight line towards the rim of the disk. Every step is the same length. How many steps until you get there?',
    hint: 'Watch the footprints. Each one is the same size where you are, but the map draws them smaller and closer together near the rim.',
    reveal: 'You never arrive. The rim is infinitely far away, so the disk is a map of a whole infinite plane squeezed into a circle, the way a world map squeezes the globe. On this map angles are drawn true, but distances shrink towards the edge.',
    finding: 'the edge is infinitely far',
  },
  {
    id: 'disk_circles',
    lab: 'disk',
    exploration: 'circles',
    title: 'How big is a circle?',
    prompt: 'Set the radius to 1, then 2, then 3. Compare the distance around the circle with a flat circle of the same radius.',
    hint: 'On a flat plane, doubling the radius doubles the circumference. Does that happen here?',
    reveal: 'Circumference is 2π·sinh r, which grows exponentially: at radius 5 it is about 15 times a flat circle. There is far more room in hyperbolic space than in flat space, which is why it suits drawing trees and networks that branch without crowding.',
    finding: 'circles grow exponentially',
  },
  {
    id: 'disk_tiles',
    lab: 'disk',
    exploration: 'tiles',
    title: 'How many hexagons fit at a corner?',
    prompt: 'On a flat floor exactly three hexagons meet at every corner. Make the hexagon bigger. Can you fit four around one corner? Seven?',
    hint: 'Bigger shapes have sharper corners here. Use the “fit” buttons to find the right size.',
    reveal: "Any number from four up will fit, if the tiles are big enough. Hyperbolic space can be tiled in infinitely many regular ways, where flat space has only three. M. C. Escher's Circle Limit prints are tilings like these drawn on this same disk.",
    finding: 'more tiles fit around a corner',
  },
  {
    id: 'disk_polygon',
    lab: 'disk',
    exploration: 'polygon',
    title: 'What does a big triangle cost?',
    prompt: 'Click to place three corners, then drag them apart. How do the angles compare with 180°? What about four or five corners?',
    hint: 'Compare the angle sum with the flat value shown under it as the shape grows.',
    reveal: 'The angles always fall short of the flat total, and the shortfall is exactly the area (Gauss–Bonnet, with K = −1). So no triangle can have an area bigger than π, however far apart its corners are.',
    finding: 'angles fall short by the area',
  },
];

export function findQuestion(lab: LabKind, world: WorldKind, exploration: DiskExploration): QuestionSpec | undefined {
  if (lab === 'disk') {
    return QUESTIONS.find((q) => q.lab === 'disk' && q.exploration === exploration);
  }
  return QUESTIONS.find((q) => q.lab === lab && q.world === world);
}

export function questionById(id: string): QuestionSpec | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
