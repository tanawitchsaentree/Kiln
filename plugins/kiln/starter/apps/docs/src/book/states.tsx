// The state matrix page (/patterns/states), built from system/states.tsx. Every interactive component in
// every state it promises, side by side, so a missing or invisible state is seen at once and measured by
// kiln G-SV1. Each cell's stage is a plain raised surface, so two cells that look alike rasterise alike.
import type { ReactElement } from 'react';
import { Page, Section } from './kit';
import { FAMILIES, FAMILY_TEXT, STATE_ROWS } from '../system/states';

export function StatesPage(): ReactElement {
  const families = FAMILIES.filter((f) => STATE_ROWS.some((r) => r.family === f));
  return (
    <Page eyebrow="Patterns" title="States" lede={<p>Every interactive component in every state it promises, side by side. A state that is missing or looks the same as its default shows up here first, and the gates measure each cell against its row.</p>}>
      {families.length === 0 && (
        <Section id="none-yet" title="No states yet">
          <p className="fail">TODO(wave-1) add a row to system/states.tsx for each component with states as it passes QA.</p>
        </Section>
      )}
      {families.map((f) => (
        <Section key={f} id={f.toLowerCase()} title={f} wide>
          {FAMILY_TEXT[f] ? <p>{FAMILY_TEXT[f]}</p> : <p className="fail">TODO(wave-1) how a state shows itself in {f.toLowerCase()}.</p>}
          {STATE_ROWS.filter((r) => r.family === f).map((r) => (
            <div key={r.component} className="state-row">
              <h3 className="state-name">{r.component}</h3>
              <div className="state-cells">
                {r.cells.map(([state, el]) => (
                  <figure key={state} className="state-cell" data-state-cell={`${r.component}|${state}`}>
                    <div className="state-stage" data-harness="" data-tone-skip="">{el}</div>
                    <figcaption>{state}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </Section>
      ))}
    </Page>
  );
}
