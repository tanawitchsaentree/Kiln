// @example A vertical stack, with the spacing set on the stack itself
import { Stack } from 'kiln-ds-react';

export default function StackBasic() {
  return (
    <div className="demo-box demo-card">
      <Stack gap="md">
        <h3 className="flush">Invite people</h3>
        <p className="flush muted">They’ll get a link that works for 7 days.</p>
        <Stack direction="row" gap="sm"><span className="demo-chip">Copy link</span><span className="demo-chip">Email</span></Stack>
      </Stack>
    </div>
  );
}
