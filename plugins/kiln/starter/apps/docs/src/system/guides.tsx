// Getting started guides and the Content and Accessibility foundations. Developing and Contributing
// are kiln's (true for every system built with it); Designing, Migrating, Content and Accessibility are
// the system's to write, and stay TODO until then (gate G-TODO1).
import type { ReactElement, ReactNode } from 'react';
import { FocusPlayground, LabelPlayground } from '../book/playgrounds';
import { Code, Page, Section } from '../book/kit';
import { NAME, PACKAGES } from './content';
import meta from '../book/meta.json';

const Todo = ({ title, eyebrow, what, children }: { title: string; eyebrow: string; what: string; children?: ReactNode }) => (
  <Page eyebrow={eyebrow} title={title} lede={<p>{`TODO(milestone) ${what}`}</p>}>
    {children}
    <Section id="todo" title="To write"><p>{`TODO(milestone) ${what}`}</p></Section>
  </Page>
);

function Designing() { return <Todo eyebrow="Getting started" title={`Designing with ${NAME}`} what="how to lay out a screen with this system, the rules that decide hierarchy, and a checklist before hand-off" />; }
function Migrating() { return <Todo eyebrow="Getting started" title="Migrating" what="what changed between versions and what to do about it, and how to move from another system" />; }
function ContentFoundation() { return <Todo eyebrow="Foundations" title="Content" what="voice, tone, labels, messages, numbers and dates, and writing for accessibility, in this system’s words"><Section id="labels" title="Labels"><LabelPlayground /></Section></Todo>; }
function AccessibilityFoundation() { return <Todo eyebrow="Foundations" title="Accessibility" what="what this system guarantees for keyboard, screen reader, high contrast and reduced motion users, and what is still missing"><Section id="focus" title="Focus"><FocusPlayground /></Section></Todo>; }

export function Developing() {
  return (
    <Page eyebrow="Getting started" title={`Developing with ${NAME}`} lede={<p>The set-up details the install steps leave out, covering TypeScript, themes and server rendering.</p>}>
      <Section id="css" title="Load the styles once">
        <p>Import one stylesheet once, at the root of the app. It holds the tokens and every component’s styles. It ships a type declaration, so <code>tsc</code> passes on TypeScript 6 and later, which check side-effect imports by default.</p>
        <Code label="main.tsx">{`import '${PACKAGES.react}/all.css';`}</Code>
      </Section>
      <Section id="theme" title="Themes">
        <p>Set <code>data-theme="dark"</code> or <code>data-theme="light"</code> on the root element. Every token switches with it. A subtree can set its own theme the same way. Follow the reader’s system setting by default and store their choice.</p>
        <Code label="theme">{"document.documentElement.dataset.theme =\n  matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';"}</Code>
      </Section>
      <Section id="ssr" title="Server rendering">
        <p>Every component renders on the server. The smoke test server-renders the components listed in system/kiln.config.json from the packed tarball on every verify run. Set the theme attribute in the HTML you send, so the first frame already has the right colours.</p>
      </Section>
      <Section id="versions" title="Versions">
        <p>The packages are at {meta.version}. Until 1.0 a minor version can change component APIs, and the change history lists every change per component. Every verify run tests React 18.</p>
      </Section>
    </Page>
  );
}

export function Contributing() {
  return (
    <Page eyebrow="Getting started" title="Contributing" lede={<p>How a component gets into the system, in the order the tooling enforces. Concept first, then derivation, a pick, the code, the docs and the gates.</p>}>
      <Section id="order" title="The order">
        <ol>
          <li>Read <code>system/CONCEPT.md</code>. Every form in this system comes from its principles.</li>
          <li>Write <code>&lt;Name&gt;.why.json</code> first. Name the pattern-library default it must not become, cite a reference from the system’s lineage, and derive the form in at least three steps that quote the principles word for word.</li>
          <li>Render three variants in <code>apps/lab/&lt;name&gt;/</code>, all with the same content. The pick is recorded in the component’s why.json and in <code>system/REVIEW.md</code> for the milestone review.</li>
          <li>Only then write the CSS and TSX. The derivation guard blocks those files until the pick is recorded.</li>
          <li>Write the docs pages the same day, with a depth file for the Usage tab, examples for the Code tab and a subject for the Style tab.</li>
          <li>Run <code>pnpm run verify</code>. It must be green.</li>
        </ol>
      </Section>
      <Section id="rules" title="Rules the build enforces">
        <ul>
          <li>Component CSS holds no raw values. Every colour, size and duration is a token, checked by <code>tooling/no-hardcode-lint.mjs</code>.</li>
          <li>Every token and every part, state and motion of a component has a reason tied to a principle, checked by <code>tooling/kiln/rationale.mjs</code>.</li>
          <li>Text is measured per pixel on every backdrop, in every theme and three display modes, checked by <code>tooling/kiln/evidence.mjs</code>.</li>
          <li>Keyboard, roles and measured values are tested in Chromium by <code>tooling/kiln/conformance.mjs</code>, which runs each component’s checks from <code>system/conformance/</code> and fails a component that has none.</li>
          <li>Every page’s prose passes the human-tone lint, checked by <code>tooling/kiln/tone-gate.mjs</code>.</li>
        </ul>
      </Section>
      <Section id="machine" title="Keeping the machine usable">
        <p>Use <code>pnpm run verify:quick</code> while working. The full verify measures both themes and takes the better part of an hour, so run it before a commit that changes how things look.</p>
      </Section>
    </Page>
  );
}


export const GUIDES: Record<string, () => ReactElement> = {
  '/getting-started/designing': Designing,
  '/getting-started/developing': Developing,
  '/getting-started/contributing': Contributing,
  '/getting-started/migrating': Migrating,
  '/foundations/content': ContentFoundation,
  '/foundations/accessibility': AccessibilityFoundation,
};
