// @example Responsive spans
import { Grid, GridItem } from 'kiln-ds-react';

export default function GridResponsive() {
  return (
    <Grid className="demo-full">
      {['Followers', 'Posts', 'Saved'].map((k) => (
        <GridItem key={k} span="full" md={4} lg={4}>
          <div className="demo-box"><p className="flush muted">{k}</p><p className="flush stat-num">{k.length * 97}</p></div>
        </GridItem>
      ))}
    </Grid>
  );
}
