// Every sentence the engine pages say about this system. kiln create leaves each one as a
// TODO(phase): the book renders from day one, and gate G-TODO1 fails the milestone while any TODO is
// still visible. Write these in the system's own voice, through human-tone (tone gate), with numbers
// read from tokens rather than typed (the kit's `tok()` helper), and true to the code.
import type { ReactNode } from 'react';

export const NAME = 'kiln-ds';
export const PACKAGES = { tokens: 'kiln-ds-tokens', react: 'kiln-ds-react' };

const todo = (phase: string, what: string) => `TODO(${phase}) ${what}`;

export const CONTENT: {
  overview: { title: string; lede: ReactNode; status: ReactNode };
  partBlurb: Record<string, string>;
  foundations: Record<string, { lede: ReactNode; prose?: ReactNode }>;
  credits: ReactNode;
} = {
  overview: {
    title: todo('phase 1', 'a one-line title saying what this system is'),
    lede: todo('phase 1', 'two or three sentences from system/CONCEPT.md, saying what it is for and what it must never become'),
    status: todo('milestone', 'what the system can and cannot build today, counted from meta.json'),
  },
  partBlurb: {
    Introduction: 'What the system is, and the principles behind every trade-off.',
    'Getting started': 'Install it, design with it, build with it, contribute to it.',
    Foundations: 'Colour, type, space, shape, motion, icons and the rest, each with live values.',
    Components: 'Every component in depth, in four tabs, with tested keyboard and contrast.',
    Patterns: 'Common problems solved with the components, with live examples.',
    Accessibility: 'How every claim in this book is measured and tested.',
    Reference: 'All tokens, the change history, the decision log and the exceptions register.',
  },
  foundations: {
    color: { lede: todo('phase 2', 'how this system uses colour and why, in two sentences') },
    themes: { lede: todo('phase 2', 'which themes exist and what changes between them') },
    typography: { lede: todo('phase 2', 'the typeface, the scale and why') },
    spacing: { lede: todo('phase 2', 'the base unit and the scale') },
    grid: { lede: todo('phase 2', 'columns, gutters and margins, and what the grid places') },
    dimensions: { lede: todo('phase 2', 'every fixed size, from breakpoints and controls to touch targets and layers') },
    shape: { lede: todo('phase 2', 'corners and elevation, and how they nest') },
    motion: { lede: todo('phase 2', 'durations, easing and what moves') },
    icons: { lede: todo('phase 2', 'the icon set, its grid and stroke') },
  },
  credits: todo('milestone', 'images, fonts and libraries the system uses, with their licences'),
};
