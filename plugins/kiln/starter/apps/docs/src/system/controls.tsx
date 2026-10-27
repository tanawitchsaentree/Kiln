// The controls the docs need (playgrounds, filters). System-owned: during wave 1 these must become the
// system's own Select and Slider, derived like every other component (USER-STANDARDS #13, gate G-N1).
// Until then they are native controls, so G-N1 stays red on purpose and the milestone cannot pass.
export function Range({ label, min, max, step, value, onChange, unit = '' }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label className="pg-control"><span className="pg-label">{label} <span className="muted">{value}{unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <label className="pg-control"><span className="pg-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );
}
