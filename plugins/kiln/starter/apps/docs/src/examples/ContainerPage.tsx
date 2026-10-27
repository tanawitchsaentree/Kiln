// @example A centred page body
import { Container } from 'kiln-ds-react';

export default function ContainerPage() {
  return (
    <Container size="lg" className="demo-full">
      <section className="demo-box" aria-labelledby="cp-h"><h3 id="cp-h" className="flush">Settings</h3><p className="flush muted">The container centres the page and keeps 16 / 32 / 48px of margin on each side.</p></section>
    </Container>
  );
}
