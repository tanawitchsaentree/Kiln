// @example The responsive column grid
import { Grid, GridItem } from 'kiln-ds-react';

// One plate per column: 4 on a phone, 8 on a tablet, 12 on a desktop. Plates past the column count
// wrap to the next row, which is how you can see the count change as the window resizes.
export default function GridBasic() {
  return (
    <Grid className="demo-full">
      {Array.from({ length: 12 }, (_, i) => (
        <GridItem key={i} span={1}><div className="grid-demo-cell">{i + 1}</div></GridItem>
      ))}
    </Grid>
  );
}
