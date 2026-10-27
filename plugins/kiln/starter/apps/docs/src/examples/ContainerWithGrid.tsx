// @example Container around a grid
import { Container, Grid, GridItem } from 'kiln-ds-react';

export default function ContainerWithGrid() {
  return (
    <Container size="xl" className="demo-full">
      <Grid>
        <GridItem span="full" md={4} lg={3}><div className="demo-box"><p className="flush">Sidebar</p></div></GridItem>
        <GridItem span="full" md={4} lg={9}><div className="demo-box"><p className="flush">Content</p></div></GridItem>
      </Grid>
    </Container>
  );
}
