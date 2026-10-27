// @example Main content with a sidebar
import { Grid, GridItem } from 'kiln-ds-react';

export default function GridPage() {
  return (
    <Grid className="demo-full">
      <GridItem span="full" lg={8}><section className="demo-box" aria-labelledby="gp-main"><h3 id="gp-main" className="flush">Feed</h3><p className="flush muted">8 of 12 columns from lg up; full width below.</p></section></GridItem>
      <GridItem span="full" lg={4}><aside className="demo-box" aria-labelledby="gp-side"><h3 id="gp-side" className="flush">Trends</h3><p className="flush muted">4 of 12 columns from lg up.</p></aside></GridItem>
    </Grid>
  );
}
