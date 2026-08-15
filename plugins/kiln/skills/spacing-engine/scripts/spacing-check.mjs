#!/usr/bin/env node
/**
 * spacing-engine measurement harness — G-S1 (clearance), G-S2 (scale purity), G-S4 (heading
 * binding), G-S5 (rhythm) against a real rendered page via Playwright. G-S3 (monotonic
 * proximity) needs a per-page relationship-ladder declaration (which selector is "section",
 * which is "component", etc.) that varies per page — this script exposes the primitives
 * (measureGap, resolveScaleSteps) `spacing-audit-ladder.mjs`-style per-page scripts can compose,
 * rather than guessing a generic ladder that would false-positive on unrelated sibling pairs.
 *
 * Every check reads the system's real resolved token values from the live page's own computed
 * styles (`getComputedStyle` on `:root`) — never a hardcoded pixel list — so this script works
 * against ANY system's tokens, not just Dial's, per docs-engine's own "adapt the parameters, not
 * the laws" rule.
 *
 * Usage:
 *   node spacing-check.mjs --url http://localhost:3000/ --scale-var-prefix --ds-space- [--json]
 *
 * Must be run somewhere `playwright` resolves via node_modules (repo root or a workspace app).
 */
import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return args;
}

/** Reads every real resolved `{prefix}NNN` custom property from :root — the system's own real
 * scale, never a hardcoded list, so this works for any token naming a project actually has. */
async function resolveScaleSteps(page, prefix) {
  return page.evaluate((prefix) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const styleSheets = [...document.styleSheets];
    const names = new Set();
    for (const sheet of styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of rules) {
        if (!rule.style) continue;
        for (let i = 0; i < rule.style.length; i++) {
          const propName = rule.style[i];
          if (propName.startsWith(prefix)) names.add(propName);
        }
      }
    }
    const steps = [];
    for (const name of names) {
      const raw = rootStyle.getPropertyValue(name).trim();
      const px = parseFloat(raw);
      if (!Number.isNaN(px)) steps.push({ name, px });
    }
    return steps.sort((a, b) => a.px - b.px);
  }, prefix);
}

function nearestScaleStep(px, steps) {
  if (steps.length === 0) return null;
  let best = steps[0];
  let bestDiff = Math.abs(px - best.px);
  for (const s of steps) {
    const diff = Math.abs(px - s.px);
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return { step: best, diff: bestDiff };
}

/** G-S1: clearance — for every element with a visible border on some side, measure the distance
 * from its own content (text/child bounding box) to that border, on the facing side.
 *
 * Deliberately does NOT check a side whose child is meant to bleed to the edge (a real,
 * intentional pattern — e.g. an image filling its frame) — confirmed via Gate Proof that a naive
 * "any bordered element with any child" check false-positives on exactly that case. A child opts
 * out of the clearance check on a given side by carrying `data-bleed` (the element itself, not a
 * global selector guess) — this makes bleed content an explicit, auditable declaration rather
 * than the checker silently assuming intent it can't actually know. */
async function checkClearance(page, selector, clearancePx) {
  return page.evaluate(
    ({ selector, clearancePx }) => {
      const violations = [];
      const els = [...document.querySelectorAll(selector)];
      for (const el of els) {
        if (el.hasAttribute('data-bleed')) continue;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const sides = ['Left', 'Right', 'Top', 'Bottom'];
        for (const side of sides) {
          const borderWidth = parseFloat(cs[`border${side}Width`]);
          if (borderWidth <= 0) continue;
          const firstChild = el.firstElementChild;
          if (!firstChild) continue;
          const childRect = firstChild.getBoundingClientRect();
          let gap;
          if (side === 'Left') gap = childRect.left - rect.left - borderWidth;
          else if (side === 'Right') gap = rect.right - childRect.right - borderWidth;
          else if (side === 'Top') gap = childRect.top - rect.top - borderWidth;
          else gap = rect.bottom - childRect.bottom - borderWidth;
          if (gap < clearancePx) {
            violations.push({
              selector: el.className || el.tagName,
              side,
              measuredGap: Math.round(gap * 10) / 10,
              requiredClearance: clearancePx,
            });
          }
        }
      }
      return violations;
    },
    { selector, clearancePx },
  );
}

/** G-S2: scale purity — sample computed margin/padding/gap on a selector set, flag any resolved
 * pixel value with no matching real scale step (beyond an explicit data-optical tolerance).
 *
 * Excludes any margin the DECLARED (not computed) value resolves to `auto` — confirmed via Gate
 * Proof that `margin: 0 auto` (ordinary block-centering, not an authored spacing decision at
 * all) computes to an arbitrary real pixel number depending on viewport width, which is not a
 * spacing value to snap to a token — it's the browser doing arithmetic, not a design choice.
 *
 * Excludes elements with no rendered box (`offsetParent === null` — covers `display: none` on the
 * element or any ancestor) — `getComputedStyle` still resolves a hidden element's own declared
 * padding/margin even though nothing paints, confirmed via a live false-positive sweeping
 * Storybook's own hidden `.sb-errordisplay` fallback markup (present on every story's DOM,
 * `display: none`, but its `<li>`s still measured a real 12px padding). A hidden element's
 * spacing was never authored to be seen at all — not a spacing decision to hold to L1. */
async function checkScalePurity(page, selector, scaleSteps, opticalTolerancePx = 2) {
  return page.evaluate(
    ({ selector, scaleSteps, opticalTolerancePx }) => {
      function nearest(px, steps) {
        if (steps.length === 0) return null;
        let best = steps[0];
        let bestDiff = Math.abs(px - best.px);
        for (const s of steps) {
          const diff = Math.abs(px - s.px);
          if (diff < bestDiff) {
            best = s;
            bestDiff = diff;
          }
        }
        return { step: best, diff: bestDiff };
      }
      const marginProps = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
      const otherProps = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap', 'rowGap', 'columnGap'];
      const violations = [];
      const els = [...document.querySelectorAll(selector)].filter((el) => el.offsetParent !== null || el === document.body);
      for (const el of els) {
        const cs = getComputedStyle(el);
        const hasOptical = el.hasAttribute('data-optical');
        const inlineMarginDeclared = el.style.margin || '';
        const isAutoCentered = /\bauto\b/.test(inlineMarginDeclared);
        const props = isAutoCentered ? otherProps : [...marginProps, ...otherProps];
        for (const prop of props) {
          const raw = cs[prop];
          const px = parseFloat(raw);
          if (Number.isNaN(px) || px === 0) continue;
          const match = nearest(px, scaleSteps);
          if (!match) continue;
          const tolerance = hasOptical ? opticalTolerancePx : 0;
          if (match.diff > tolerance) {
            violations.push({
              selector: el.className || el.tagName,
              property: prop,
              measuredPx: px,
              nearestToken: match.step.name,
              nearestTokenPx: match.step.px,
              diff: Math.round(match.diff * 10) / 10,
            });
          }
        }
      }
      return violations;
    },
    { selector, scaleSteps, opticalTolerancePx },
  );
}

/** G-S4: heading binding — for every heading matching selector, measure real rendered gap to the
 * previous and next sibling (accounting for margin collapse — measured position, not declared
 * margin) and assert above > below.
 *
 * Excludes headings rendered INSIDE a live component-demo sandbox (`.docs-demo-preview`,
 * `.docs-playground-preview`) — found live sweeping every component page that a doc page
 * showcasing the `<Heading>` component itself renders real `<h1>`/`<h2>`/`<h3>` tags as DEMO
 * CONTENT (e.g. a "Size md" label), which is a component instance under test, not real page
 * prose structure L5 governs. */
async function checkHeadingBinding(page, selector) {
  return page.evaluate((selector) => {
    const violations = [];
    const headings = [...document.querySelectorAll(selector)].filter(
      (h) => !h.closest('.docs-demo-preview, .docs-playground-preview'),
    );
    for (const h of headings) {
      const rect = h.getBoundingClientRect();
      const prev = h.previousElementSibling;
      const next = h.nextElementSibling;
      if (!prev || !next) continue;
      const prevRect = prev.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const spaceAbove = rect.top - prevRect.bottom;
      const spaceBelow = nextRect.top - rect.bottom;
      if (spaceAbove <= spaceBelow) {
        violations.push({
          selector: h.textContent?.slice(0, 40) || h.tagName,
          spaceAbove: Math.round(spaceAbove * 10) / 10,
          spaceBelow: Math.round(spaceBelow * 10) / 10,
        });
      }
    }
    return violations;
  }, selector);
}

/** G-S5: rhythm — for a set of structurally-equivalent siblings, measure the gap between every
 * consecutive pair and assert they're all equal (±0px, ±2px if data-optical).
 *
 * Uses `:scope > itemSelector` (direct children ONLY, scoped to each matched container
 * individually) rather than a descendant selector — confirmed via Gate Proof that a descendant
 * selector pulls in elements from nested/unrelated containers that happen to match the same
 * class fragment, producing nonsensical negative gaps between bounding boxes that were never
 * laid out as siblings in the first place. Also skips a container whose items aren't roughly
 * same-row (different `top`) — comparing horizontal gaps only makes sense for items actually
 * laid out in a row. */
async function checkRhythm(page, containerSelector, itemSelector) {
  return page.evaluate(
    ({ containerSelector, itemSelector }) => {
      const violations = [];
      const containers = [...document.querySelectorAll(containerSelector)];
      for (const container of containers) {
        const items = [...container.children].filter((c) => c.matches(itemSelector));
        if (items.length < 3) continue; // need at least 2 gaps to compare
        const rects = items.map((el) => el.getBoundingClientRect());
        const sameRow = rects.every((r) => Math.abs(r.top - rects[0].top) < 2);
        if (!sameRow) continue;
        const gaps = [];
        for (let i = 0; i < rects.length - 1; i++) {
          gaps.push(Math.round((rects[i + 1].left - rects[i].right) * 10) / 10);
        }
        const first = gaps[0];
        for (let i = 1; i < gaps.length; i++) {
          const hasOptical = items[i].hasAttribute('data-optical');
          const tolerance = hasOptical ? 2 : 0;
          if (Math.abs(gaps[i] - first) > tolerance) {
            violations.push({
              container: container.className || container.tagName,
              gapIndex: i,
              gap: gaps[i],
              expectedGap: first,
            });
          }
        }
      }
      return violations;
    },
    { containerSelector, itemSelector },
  );
}

/** G-S3: monotonic proximity — given an explicit ladder of {level, betweenSelector, withinSelector}
 * (declared per-page, since a generic guess would compare unrelated sibling pairs — see SKILL.md's
 * own note on why this isn't auto-detected), measure the real "between" gap at each level and the
 * real "within" gap at the level below, assert strictly-greater at every adjacent pair.
 *
 * Measures from each element's CONTENT (its own first/last descendant with real text or a real
 * child element), not its border/margin box — confirmed via Gate Proof against a real page (this
 * repo's own landing-page panel) that a flush, hairline-divided, padding-separated layout (no
 * inter-item CSS margin/gap at all — a real, deliberate design choice, not a bug) measures a
 * false 0px "gap" at the container level even though real visible clearance exists via padding.
 * A border-box-to-border-box measurement is only correct for margin/gap-based layouts; content-
 * box-to-content-box is the general-purpose measurement that works for both. */
async function checkMonotonicProximity(page, ladder) {
  return page.evaluate((ladder) => {
    function contentRect(el) {
      // Walk to the innermost element with actual rendered content (text or a leaf child) so the
      // measurement reflects real visible separation, not an empty/whitespace wrapper's box.
      let current = el;
      while (current.children.length === 1 && !current.textContent?.trim()) {
        current = current.children[0];
      }
      return current.getBoundingClientRect();
    }
    function measureGap(selector) {
      const els = [...document.querySelectorAll(selector)];
      if (els.length < 2) return null;
      const rects = els.map((el) => contentRect(el)).sort((a, b) => a.top - b.top || a.left - b.left);
      const gaps = [];
      for (let i = 0; i < rects.length - 1; i++) {
        const a = rects[i];
        const b = rects[i + 1];
        const vGap = b.top - a.bottom;
        const hGap = b.left - a.right;
        gaps.push(Math.max(vGap, hGap));
      }
      return Math.min(...gaps);
    }

    // A divider-based level (spacing-engine laws.md: "L2 has two valid separation mechanisms")
    // has no real border-box gap to measure at all — separation comes from a hairline + each
    // element's own L3 clearance. For that level, the check is "clearance is >= the level
    // below's clearance," not "gap > gap" — measured as the element's OWN computed padding
    // (the real, direct definition of L3 clearance), not by walking into children — walking
    // into children breaks the instant a row's OWN text content is non-empty (its own
    // `textContent` check short-circuits before reaching a real descendant), confirmed via a
    // live Gate Proof miss where a genuinely inverted clearance (16px vs 32px, confirmed by
    // direct getBoundingClientRect measurement) was silently reported as passing because this
    // function was comparing a row's own border-box against itself. */
    function measureClearance(selector, axis) {
      const els = [...document.querySelectorAll(selector)].filter((el) => !el.hasAttribute('data-bleed'));
      const insets = [];
      for (const el of els) {
        const cs = getComputedStyle(el);
        if (axis === 'block') {
          insets.push(Math.min(parseFloat(cs.paddingTop) || 0, parseFloat(cs.paddingBottom) || 0));
        } else {
          insets.push(Math.min(parseFloat(cs.paddingLeft) || 0, parseFloat(cs.paddingRight) || 0));
        }
      }
      return insets.length ? Math.min(...insets) : null;
    }

    const violations = [];
    for (let i = 0; i < ladder.length - 1; i++) {
      const outer = ladder[i];
      const inner = ladder[i + 1];
      if (outer.mechanism === 'divider') {
        const outerClearance = measureClearance(outer.betweenSelector, outer.axis || 'block');
        const innerClearance = measureClearance(inner.withinSelector || inner.betweenSelector, outer.axis || 'block');
        if (outerClearance == null || innerClearance == null) continue;
        if (outerClearance < innerClearance) {
          violations.push({
            outerLevel: outer.level,
            innerLevel: inner.level,
            mechanism: 'divider',
            outerClearance: Math.round(outerClearance * 10) / 10,
            innerClearance: Math.round(innerClearance * 10) / 10,
          });
        }
        continue;
      }
      const betweenGap = measureGap(outer.betweenSelector);
      const withinGap = measureGap(inner.withinSelector || inner.betweenSelector);
      if (betweenGap == null || withinGap == null) continue;
      if (betweenGap <= withinGap) {
        violations.push({
          outerLevel: outer.level,
          innerLevel: inner.level,
          mechanism: 'gap',
          betweenGap: Math.round(betweenGap * 10) / 10,
          withinGap: Math.round(withinGap * 10) / 10,
        });
      }
    }
    return violations;
  }, ladder);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = args.url;
  const scalePrefix = args['scale-var-prefix'] || '--ds-space-';
  const asJson = args.json === true;

  if (!url) {
    console.error('Usage: node spacing-check.mjs --url <url> [--scale-var-prefix --ds-space-] [--json]');
    process.exit(2);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

  const scaleSteps = await resolveScaleSteps(page, scalePrefix);

  // G-S3 ladder is page-specific (a generic guess would compare unrelated sibling pairs) — the
  // landing page's own real structure: panel-row (section-level, content-to-content) vs
  // panel-control (item-level, content-to-content) — both measured via content boxes since this
  // page's real layout is flush/padding-separated, not gap-separated (see checkMonotonicProximity's
  // own header comment for why content-box measurement is the general-purpose choice).
  const ladder = [
    { level: 'panel-row', betweenSelector: '.docs-panel-row', mechanism: 'divider', axis: 'block' },
    { level: 'panel-control', withinSelector: '.docs-panel-control' },
  ];

  const results = {
    url,
    scaleSteps,
    clearance: await checkClearance(page, '[class*="stat"], [class*="panel-control"]', 24),
    scalePurity: await checkScalePurity(page, 'div, section, article, li', scaleSteps),
    monotonicProximity: await checkMonotonicProximity(page, ladder),
    headingBinding: await checkHeadingBinding(page, 'h1, h2, h3'),
    rhythm: await checkRhythm(page, '[class*="grid"], [class*="stats"], [class*="controls"]', '*'),
  };

  await browser.close();

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`Spacing check: ${url}`);
  console.log(`Real scale steps found: ${scaleSteps.length}`);
  console.log(`G-S1 clearance violations: ${results.clearance.length}`);
  for (const v of results.clearance) console.log(`  ${JSON.stringify(v)}`);
  console.log(`G-S2 scale purity violations: ${results.scalePurity.length}`);
  for (const v of results.scalePurity.slice(0, 20)) console.log(`  ${JSON.stringify(v)}`);
  console.log(`G-S3 monotonic proximity violations: ${results.monotonicProximity.length}`);
  for (const v of results.monotonicProximity) console.log(`  ${JSON.stringify(v)}`);
  console.log(`G-S4 heading binding violations: ${results.headingBinding.length}`);
  for (const v of results.headingBinding) console.log(`  ${JSON.stringify(v)}`);
  console.log(`G-S5 rhythm violations: ${results.rhythm.length}`);
  for (const v of results.rhythm) console.log(`  ${JSON.stringify(v)}`);
}

export { resolveScaleSteps, checkClearance, checkScalePurity, checkMonotonicProximity, checkHeadingBinding, checkRhythm };

// Only auto-run when invoked directly (not when imported by a per-page composition script).
if (process.argv[1] && process.argv[1].endsWith('spacing-check.mjs')) {
  main();
}
