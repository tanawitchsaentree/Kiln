// @example Container sizes
import { Container, Stack } from 'kiln-ds-react';

export default function ContainerSizes() {
  return (
    // text sits on a surface, never straight on a backdrop
    <div className="demo-box demo-full">
    <Stack gap="sm">
      {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Container key={s} size={s} className="container-demo"><span>{s}</span></Container>
      ))}
    </Stack>
    </div>
  );
}
