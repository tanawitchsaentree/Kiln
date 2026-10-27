// @example A grid with a fixed column count
import { Grid, GridItem } from 'kiln-ds-react';

export default function GridColumns() {
  return (
    <Grid columns={3} className="demo-full">
      {['Room', 'Forest', 'City'].map((s) => <GridItem key={s} span={1}><div className="demo-box"><p className="flush">{s}</p></div></GridItem>)}
    </Grid>
  );
}
