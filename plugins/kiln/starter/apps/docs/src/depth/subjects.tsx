// How to render each component for the Style tab and the header's live demo, given the enum props
// a reader picks. Only the content is fixed here; which options exist comes from meta.json.
import type { ReactNode } from 'react';
import { Container, Grid, GridItem, Stack } from 'kiln-ds-react';

type P = Record<string, string>;
// bare: the subject is itself a surface (Card, Environment, layout) and must not sit on a second pane
export interface Subject { render: (p: P, disabled?: boolean) => ReactNode; code: (p: P) => string; disabled?: boolean; bare?: boolean }

const attrs = (p: P) => Object.entries(p).map(([k, v]) => ` ${k}="${v}"`).join('');

/** The surface a subject sits on in the docs. A system whose components need a surface under them
 *  (text over imagery, translucent material) replaces this with its own surface. */
export const OnSurface = ({ children }: { children: ReactNode }) => <div className="demo-row spec-row">{children}</div>;

export const SUBJECTS: Record<string, Subject> = {
  Container: { bare: true, render: (p) => <Container {...p}><div className="demo-box"><p className="flush">Content column</p></div></Container>, code: (p) => `<Container${attrs(p)}>…</Container>` },
  Grid: { bare: true, render: () => <Grid><GridItem span={6}><div className="demo-box">Half</div></GridItem><GridItem span={6}><div className="demo-box">Half</div></GridItem></Grid>, code: () => '<Grid>\n  <GridItem span={6}>…</GridItem>\n  <GridItem span={6}>…</GridItem>\n</Grid>' },
  Stack: { render: () => <Stack direction="row" gap="md"><span className="demo-chip">One</span><span className="demo-chip">Two</span><span className="demo-chip">Three</span></Stack>, code: () => '<Stack direction="row" gap="md">…</Stack>' },
};
