// @example A settings group with rows in a column and each label beside its value
import { Stack } from 'kiln-ds-react';

export default function StackForm() {
  return (
    <section className="demo-box demo-card" aria-labelledby="sf-h">
      <Stack gap="md">
        <h3 id="sf-h" className="flush">Notifications</h3>
        {[['Mentions', 'On'], ['New followers', 'Off']].map(([k, v]) => (
          <Stack key={k} direction="row" gap="md" align="center" className="split-row"><span>{k}</span><span className="demo-chip">{v}</span></Stack>
        ))}
      </Stack>
    </section>
  );
}
