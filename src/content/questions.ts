import type { WorldKind, LabKind, DiskExploration } from '../store/geometryStore';

export interface Prediction {
  /** Asked before the student sees any measurements (tutorial mode). */
  prompt: string;
  options: { id: string; label: string }[];
  /** id of the correct option. */
  answer: string;
}

export interface QuestionSpec {
  id: string;
  lab: LabKind;
  /** Which world the question belongs to (triangle and parallel labs). */
  world?: WorldKind;
  /** Which exploration the question belongs to (disk lab). */
  exploration?: DiskExploration;
  title: string;
  /** What to look at on this page. Shown in both modes. */
  prompt: string;
  /** The tutorial task. Checked in src/tutorial/goals.ts. */
  goal: string;
  predict: Prediction;
  hint: string;
  reveal: string;
  /** A few words for the findings table once the question is solved. */
  finding: string;
}

const SUM_OPTIONS = [
  { id: 'less', label: 'Less than 180°' },
  { id: 'equal', label: 'Exactly 180°' },
  { id: 'more', label: 'More than 180°' },
];

const CIRCLE_OPTIONS = [
  { id: 'less', label: 'Less than 2πr' },
  { id: 'equal', label: 'Exactly 2πr' },
  { id: 'more', label: 'More than 2πr' },
];

const PARALLEL_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'one', label: 'Exactly one' },
  { id: 'many', label: 'Infinitely many' },
];

export const QUESTIONS: QuestionSpec[] = [
  {
    id: 'tri_flat',
    world: 'flat',
    lab: 'triangle',
    title: 'Can you break 180°?',
    prompt: 'Drag the corners. Try to make a triangle whose angles add up to anything other than 180°.',
    goal: 'Make a long, thin triangle: one angle over 120°, or one under 15°.',
    predict: {
      prompt: 'On a flat sheet of paper, what do the three angles of a triangle add up to?',
      options: [
        { id: 'always', label: 'Always 180°' },
        { id: 'shape', label: 'It depends on the shape' },
        { id: 'size', label: 'It depends on the size' },
      ],
      answer: 'always',
    },
    hint: 'Stretch it long and thin, or squash it flat. Watch the bar: it never passes the 180° mark.',
    reveal: "On a flat plane the sum is always exactly 180°. This follows from Euclid's fifth postulate, and for two thousand years it was taken as a plain fact about space, built into surveying, architecture and Newton's mechanics.",
    finding: 'exactly 180°',
  },
  {
    id: 'tri_sphere',
    world: 'sphere',
    lab: 'triangle',
    title: 'Where does the extra come from?',
    prompt: 'Drag the corners across the sphere. Make the triangle bigger and watch the excess over 180°.',
    goal: 'Drag the corners apart until the angles add up to at least 200°.',
    predict: {
      prompt: 'Draw a triangle on a ball, using the straightest lines you can. Its angles add up to…',
      options: SUM_OPTIONS,
      answer: 'more',
    },
    hint: 'Compare a small triangle with one that covers a large part of the globe. Or try the “three right angles” button.',
    reveal: "Always more than 180°, and the excess is proportional to the triangle's area (Girard's theorem, a case of Gauss–Bonnet). A triangle from the North Pole down to two points on the equator can have three right angles: 270°. It's also why no flat map of the Earth can keep every distance and angle true, a problem navigators and mapmakers lived with for centuries.",
    finding: 'more than 180°',
  },
  {
    id: 'tri_hyperbolic',
    world: 'hyperbolic',
    lab: 'triangle',
    title: 'Where did the missing degrees go?',
    prompt: 'Drag the corners over the saddle. Try a triangle around the middle, then the same size off to one side.',
    goal: 'Spread the triangle around the middle of the saddle until the angles add up to 140° or less.',
    predict: {
      prompt: 'Now draw a triangle on a saddle, which curves up one way and down the other. Its angles add up to…',
      options: SUM_OPTIONS,
      answer: 'less',
    },
    hint: 'This saddle curves most strongly at its centre and flattens out towards its edges. Keep the triangle around the middle.',
    reveal: 'Always less than 180°. The shortfall (the defect) equals the total curvature the triangle encloses, Gauss–Bonnet again. This saddle curves most at its centre, so a triangle around the middle loses more than one of the same size off to the side. On the hyperbolic plane of Chapter III the curvature is the same everywhere, and there the defect is exactly the area. In 1829 Lobachevsky published a geometry built on triangles like these, and showed it was as consistent as Euclid\'s.',
    finding: 'less than 180°',
  },
  {
    id: 'par_flat',
    world: 'flat',
    lab: 'parallel',
    title: "Euclid's fifth postulate",
    prompt: 'Rotate the line through P. How many positions never meet line L?',
    goal: 'Tilt the line away from level, then find the one angle where it never meets L.',
    predict: {
      prompt: 'On a flat plane, how many straight lines through P never meet the line L?',
      options: PARALLEL_OPTIONS,
      answer: 'one',
    },
    hint: 'Tilt the line a little and see where it crosses L. As the tilt gets smaller the crossing moves further away. When does it vanish?',
    reveal: "Exactly one. On a flat plane a single parallel passes through P. For two thousand years mathematicians tried to prove this from Euclid's other axioms, and couldn't.",
    finding: 'exactly one',
  },
  {
    id: 'par_sphere',
    world: 'sphere',
    lab: 'parallel',
    title: 'Do parallels exist on a sphere?',
    prompt: 'Straight lines on a sphere are great circles, like the equator L. Can you find one through P that never meets L?',
    goal: 'Try the level line, then turn it at least 60° either way. Does any of them miss L?',
    predict: {
      prompt: 'On a sphere, how many straight lines (great circles) through P never meet the equator L?',
      options: PARALLEL_OPTIONS,
      answer: 'none',
    },
    hint: 'The dotted circle of latitude through P never meets the equator, but it isn’t a straight line: it is a small circle, curving around the pole. Only great circles count.',
    reveal: "None. Every pair of great circles meets twice, at opposite sides of the globe. The circle of latitude through P stays clear of the equator only because it keeps turning towards the pole, so it isn't straight. Riemann showed that a consistent geometry with no parallels at all is possible, and it became a foundation for Einstein's curved spacetime.",
    finding: 'none',
  },
  {
    id: 'par_hyperbolic',
    world: 'hyperbolic',
    lab: 'parallel',
    title: 'How many parallels?',
    prompt: 'Rotate the line through P. How many positions avoid line L? Look for the two limiting lines.',
    goal: 'Find the steepest line through P that still never meets L: a limiting parallel.',
    predict: {
      prompt: 'On the hyperbolic plane, how many straight lines through P never meet L?',
      options: PARALLEL_OPTIONS,
      answer: 'many',
    },
    hint: 'Turn the line slowly away from level. Just before it starts crossing L, it meets L only at the rim, which is infinitely far away.',
    reveal: "Infinitely many. Between the two limiting parallels lies a whole fan of lines that never meet L. The angle between a limiting parallel and the perpendicular from P to L is the angle of parallelism Π(d); it depends only on the distance d. Lobachevsky and Bolyai found this independently in the 1820s and 30s.",
    finding: 'infinitely many',
  },
  {
    id: 'circ_flat',
    world: 'flat',
    lab: 'circle',
    title: 'How big is a circle?',
    prompt: 'Drag the edge of the circle. Compare the distance around it with 2πr.',
    goal: 'Make the radius 2 or more and check the distance around against 2πr.',
    predict: {
      prompt: 'On a flat sheet, the distance around a circle of radius r is…',
      options: CIRCLE_OPTIONS,
      answer: 'equal',
    },
    hint: 'Try r = 0.5, then 1, then 2. Divide the distance around by the radius each time.',
    reveal: 'Exactly 2πr, at every size: the distance around is always π times the width. That fixed ratio is itself a fact about flat space. On a curved surface it changes with the size of the circle.',
    finding: 'exactly 2πr',
  },
  {
    id: 'circ_sphere',
    world: 'sphere',
    lab: 'circle',
    title: 'Circles on a ball',
    prompt: 'This circle is centred on the North Pole. Grow it and compare the distance around it with 2πr.',
    goal: 'Grow the circle past the equator. What happens to the distance around?',
    predict: {
      prompt: 'On a sphere, the distance around a circle of radius r is…',
      options: CIRCLE_OPTIONS,
      answer: 'less',
    },
    hint: 'The radius is measured along the surface, from the pole. Watch what the edge does as it reaches the equator.',
    reveal: "Less than 2πr, and the gap grows with size: 2πR·sin(r/R). The biggest circle is the equator; grow the radius further and the circle shrinks again, to a point at the South Pole. An ant on the surface could measure the curvature this way without ever leaving it. Gauss proved in 1827 that curvature can be measured from inside a surface (his Theorema Egregium).",
    finding: 'less than 2πr',
  },
  {
    id: 'circ_hyperbolic',
    lab: 'circle',
    world: 'hyperbolic',
    title: 'How big is a circle?',
    prompt: 'Grow the circle on the hyperbolic plane and compare the distance around it with a flat circle of the same radius.',
    goal: 'Make the radius at least 3 and compare with the flat circle.',
    predict: {
      prompt: 'On the hyperbolic plane, the distance around a circle of radius r is…',
      options: CIRCLE_OPTIONS,
      answer: 'more',
    },
    hint: 'On a flat plane, doubling the radius doubles the circumference. Try r = 1, then 2, then 3.',
    reveal: 'Circumference is 2π·sinh r, which grows exponentially: at radius 5 it is about 15 times a flat circle. There is far more room in hyperbolic space than in flat space, which is why it suits drawing trees and networks that branch without crowding.',
    finding: 'more than 2πr',
  },
  {
    id: 'disk_walk',
    lab: 'disk',
    exploration: 'walk',
    title: 'Can you reach the edge?',
    prompt: 'Walk in a straight line towards the rim of the disk. Every step is the same length. How many steps until you get there?',
    goal: 'Walk at least 4 units away from the centre.',
    predict: {
      prompt: 'You walk in a straight line from the centre, one equal step at a time. How long until you reach the rim?',
      options: [
        { id: 'few', label: 'About 4 steps' },
        { id: 'some', label: 'About 20 steps' },
        { id: 'never', label: 'Never' },
      ],
      answer: 'never',
    },
    hint: 'Watch the footprints. Each one is the same size where you are, but the map draws them smaller and closer together near the rim.',
    reveal: 'You never arrive. The rim is infinitely far away, so the disk is a map of a whole infinite plane squeezed into a circle, the way a world map squeezes the globe. On this map angles are drawn true, but distances shrink towards the edge.',
    finding: 'the edge is infinitely far',
  },
  {
    id: 'disk_tiles',
    lab: 'disk',
    exploration: 'tiles',
    title: 'How many hexagons fit at a corner?',
    prompt: 'On a flat floor exactly three hexagons meet at every corner. Change the size of the hexagons and count how many fit around one corner.',
    goal: 'Make exactly four (or more) hexagons meet at one corner, with no gap.',
    predict: {
      prompt: 'On a flat floor, three regular hexagons meet at every corner. On the hyperbolic plane, can four?',
      options: [
        { id: 'no', label: 'No, only three ever fit' },
        { id: 'yes', label: 'Yes, if they are big enough' },
        { id: 'small', label: 'Yes, if they are small enough' },
      ],
      answer: 'yes',
    },
    hint: 'Bigger shapes have sharper corners here. Use the “fit” buttons, or drag the size slider until the red gap closes.',
    reveal: "Any number from four up will fit, if the tiles are big enough. Hyperbolic space can be tiled in infinitely many regular ways, where flat space has only three. M. C. Escher's Circle Limit prints are tilings like these drawn on this same disk.",
    finding: 'more tiles fit around a corner',
  },
  {
    id: 'disk_tiling',
    lab: 'disk',
    exploration: 'tiling',
    title: 'Is the centre special?',
    prompt: 'Drag the plane. The red tile is home. Watch it move towards the rim, and look at the tiles that replace it.',
    goal: 'Drag the home tile at least 2 units away from the centre.',
    predict: {
      prompt: 'The disk has a centre and a rim. On the hyperbolic plane itself, is the middle of the disk a special place?',
      options: [
        { id: 'centre', label: 'Yes, it is the centre of the plane' },
        { id: 'none', label: 'No, every point is just like it' },
        { id: 'edge', label: 'Only the rim is special' },
      ],
      answer: 'none',
    },
    hint: 'Drag from the middle towards the rim, a few times. Does any tile ever look different from the one in the middle?',
    reveal: "No point is special. The hyperbolic plane looks the same from everywhere; the disk simply draws one point in the middle. Sliding the map like this is a hyperbolic translation, the disk's version of sliding a sheet of paper. Every tile is the same shape and size; only the map makes the far ones look small. This is the picture Escher drew in his Circle Limit prints.",
    finding: 'every point is alike',
  },
  {
    id: 'disk_polygon',
    lab: 'disk',
    exploration: 'polygon',
    title: 'What does a big triangle cost?',
    prompt: 'Drag the corners of the triangle apart, or click to add corners. Compare the angle sum with the flat value.',
    goal: 'Make a triangle that falls short of 180° by at least 90°.',
    predict: {
      prompt: 'Stretch a triangle out towards the rim of the disk. Its angles add up to…',
      options: [
        { id: 'flat', label: 'About 180°, as always' },
        { id: 'less', label: 'Much less than 180°' },
        { id: 'more', label: 'More than 180°' },
      ],
      answer: 'less',
    },
    hint: 'Drag the corners towards the rim, or press “Stretch to the rim”.',
    reveal: 'The angles always fall short of the flat total, and the shortfall is exactly the area (Gauss–Bonnet, with K = −1). So no triangle can have an area bigger than π, however far apart its corners are: its angles would all have to be zero.',
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
