// The state matrix rows: every interactive component in every state it promises. System-owned. kiln's
// gate G-SV1 opens /patterns/states and checks that each cell looks different from its row's first cell
// and carries the state's ARIA (a cell named "disabled" must hold a disabled control, and so on). A
// missing route or an empty matrix fails the gate, so wave 1 adds a row the moment a component with
// states passes QA. Hover and focus are forced by the gates; the cells here are the static states.
//
// Shape of a row, from Pane (one line per component, the first cell is the default):
//   { component: 'Checkbox', family: 'Choices', cells: [
//       ['default', <Checkbox label="Prints" />],
//       ['checked', <Checkbox label="Prints" defaultChecked />],
//       ['disabled', <Checkbox label="Prints" disabled />],
//       ['invalid', <Checkbox label="Prints" invalid />],
//   ] }
// State words with an ARIA rule in G-SV1: disabled, invalid, readonly, required, checked, indeterminate,
// selected, loading, sorted. A cell may combine them ("disabled checked").
import type { ReactNode } from 'react';

export type StateRow = { component: string; family: string; cells: [string, ReactNode][] };

/** Families in reading order. Each family gets one section and the sentence in FAMILY_TEXT. */
export const FAMILIES: string[] = ['Fields', 'Choices', 'Ranges', 'Actions', 'Tables'];

/** One plain paragraph per family: how a state shows itself in this system (shape, tone, words). */
export const FAMILY_TEXT: Record<string, string> = {};

/** The rows. Empty in the starter on purpose: G-SV1 stays red until wave 1 fills it. */
export const STATE_ROWS: StateRow[] = [];
