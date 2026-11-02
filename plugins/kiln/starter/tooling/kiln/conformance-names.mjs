// conformance-names: which components a check file covers, read without running it.
// A limited conformance run (KILN_CHECKS) skips most check files, yet must still know which components
// those files check, or it reports them as untested and writes the reds into conformance.json.
// A literal `check('Dialog', …)` is easy to read, but a file that loops (`for (const name of ['Dialog',
// 'Sheet']) await check(name, …)`) names its components only as strings in an array (Pane, 2026-11-01:
// KILN_CHECKS=09 reported Dialog, Sheet, Drawer and ActionSheet with "no check names"). So any quoted string
// in the file that is exactly a chapter's name counts as covered.

/** Names from `names` (the chapters) that the check file's source mentions as a quoted string. */
export function coveredIn(text, names) {
  const known = new Set(names);
  const out = new Set();
  for (const m of String(text).matchAll(/(['"`])([A-Z][A-Za-z0-9]*)\1/g)) if (known.has(m[2])) out.add(m[2]);
  return out;
}
