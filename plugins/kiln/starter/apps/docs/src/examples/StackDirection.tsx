// @example Column and row stacks
import { Stack } from 'kiln-ds-react';

export default function StackDirection() {
  return (
    <div className="demo-box demo-card">
      <Stack direction="row" gap="sm">{['Design', 'Layout', 'Colour', 'Motion', 'Tokens'].map((t) => <span key={t} className="demo-chip">{t}</span>)}</Stack>
      <Stack gap="xs"><span>Column item 1</span><span>Column item 2</span></Stack>
    </div>
  );
}
