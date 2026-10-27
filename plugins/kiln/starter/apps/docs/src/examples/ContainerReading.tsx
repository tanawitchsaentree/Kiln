// @example A reading column
import { Container } from 'kiln-ds-react';

export default function ContainerReading() {
  return (
    <Container size="sm" className="demo-full">
      <article className="demo-box" aria-label="Article"><p className="flush">Long-form text reads best at roughly 60–75 characters per line. A small container holds that measure on wide screens without a special style.</p></article>
    </Container>
  );
}
