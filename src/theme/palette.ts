// Byrne notebook palette: cream paper, black ink, and the red / yellow / blue
// primaries of Oliver Byrne's 1847 colour edition of Euclid.
//
// Keep in sync with `theme.extend.colors` in tailwind.config.js. Tailwind
// classes (bg-paper, text-ink, border-rule, ...) cover DOM styling; this module
// is for places that need a literal colour: Three.js materials and SVG attributes.

export const palette = {
  paper: '#F3EEE2',
  paperRaised: '#FAF7F0',
  paperSunk: '#E9E2D2',
  rule: '#D3CAB6',
  ruleStrong: '#B3A991',

  ink: '#1C1B19',
  inkSoft: '#4A463F',
  inkMuted: '#756E61',
  inkFaint: '#A0988A',

  blue: '#1F4E8C',
  blueDeep: '#163B6C',
  red: '#C23B22',
  yellow: '#E0A526',
  ochre: '#8C6310',
} as const;

// One primary per world, used consistently across HUD, scenes and copy.
export const worldColor = {
  flat: palette.blue,
  sphere: palette.red,
  hyperbolic: palette.yellow,
} as const;

// Readable text variant of each world colour on paper (yellow is too light).
export const worldInk = {
  flat: palette.blue,
  sphere: palette.red,
  hyperbolic: palette.ochre,
} as const;
