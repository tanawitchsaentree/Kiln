// @example Cross-axis alignment
import { Stack } from 'kiln-ds-react';

export default function StackAlign() {
  return (
    <div className="demo-box demo-card">
      {(['start', 'center', 'end'] as const).map((a) => (
        <Stack key={a} gap="xs" align={a} className="align-row"><span className="demo-chip">{a}</span></Stack>
      ))}
    </div>
  );
}
