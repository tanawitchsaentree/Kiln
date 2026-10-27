// Behaviour checks for the layout primitives, run by tooling/kiln/conformance.mjs on the built book.
// Every expected number is read from the built tokens, so a Phase 2 change to the scale moves the
// expectation with it. One file per component family; each check names the component it proves.
export default async function layout({ check, expect, page, go, main, tokens }) {
  const v = (k) => tokens[k]?.value;
  const at = (k, bp) => (bp ? tokens[k]?.breakpoints?.[bp]?.value ?? at(k, bp === 'lg' ? 'md' : null) : v(k));
  const px = (s) => parseFloat(s);
  const widths = [['base', 375], ['md', px(v('breakpoint.md'))], ['lg', px(v('breakpoint.lg')) + 256]];
  const each = async (route, fn) => {
    const out = [];
    for (const [bp, w] of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      await go(route);
      out.push([bp === 'base' ? null : bp, await fn()]);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    return out;
  };

  await check('Grid', 'column count follows layout.columns at each breakpoint', async () => {
    const got = await each('/components/grid/code', () => main().locator('[data-component="Grid"]').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length));
    const bad = got.filter(([bp, n]) => String(n) !== at('layout.columns', bp));
    expect(!bad.length, got.map(([bp, n]) => `${bp ?? 'base'} ${n} (want ${at('layout.columns', bp)})`).join(', '));
    return got.map(([, n]) => n).join(' → ');
  });
  await check('Grid', 'gutter follows grid.gutter at each breakpoint', async () => {
    const got = await each('/components/grid/code', () => main().locator('[data-component="Grid"]').first().evaluate((el) => getComputedStyle(el).columnGap));
    const bad = got.filter(([bp, g]) => g !== at('layout.gutter', bp));
    expect(!bad.length, got.map(([bp, g]) => `${bp ?? 'base'} ${g} (want ${at('layout.gutter', bp)})`).join(', '));
    return got.map(([, g]) => g).join(' → ');
  });
  await check('GridItem', 'an item spans the columns it asks for at each breakpoint', async () => {
    const got = await each('/components/grid/code', () => main().locator('[data-component="Grid"]').evaluateAll((grids) => grids.flatMap((g) => [...g.children].map((c) => {
      const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
      const want = Number(getComputedStyle(c).getPropertyValue('--ds-span').trim() || cols);
      const gap = parseFloat(getComputedStyle(g).columnGap);
      const col = (g.getBoundingClientRect().width - gap * (cols - 1)) / cols;
      const span = Math.round((c.getBoundingClientRect().width + gap) / (col + gap));
      return span === Math.min(want, cols) ? null : `${span}/${cols} for span ${want}`;
    }))));
    const bad = got.flatMap(([bp, r]) => r.filter(Boolean).map((x) => `${bp ?? 'base'} ${x}`));
    expect(got.every(([, r]) => r.length), 'no Grid children on the page');
    expect(!bad.length, bad.slice(0, 4).join(' | '));
    return `${got[0][1].length} items`;
  });
  await check('Container', 'side margin follows container.margin at each breakpoint and xl caps the width', async () => {
    const got = await each('/components/container/code', () => main().locator('[data-component="Container"]').first().evaluate((el) => getComputedStyle(el).paddingInlineStart));
    const bad = got.filter(([bp, p]) => p !== at('layout.margin', bp));
    expect(!bad.length, got.map(([bp, p]) => `${bp ?? 'base'} ${p} (want ${at('layout.margin', bp)})`).join(', '));
    await go('/components/container/code');
    const caps = await main().locator('[data-component="Container"]').evaluateAll((els) => els.map((e) => getComputedStyle(e).maxInlineSize));
    expect(caps.includes(v('container.max-xl')), `no Container caps at ${v('container.max-xl')} (saw ${[...new Set(caps)].join(', ')})`);
    return got.map(([, p]) => p).join(' → ');
  });
  await check('Stack', 'every Stack gap is a stack.gap token', async () => {
    await go('/components/stack/code');
    const allowed = new Set(Object.entries(tokens).filter(([k]) => k.startsWith('stack.gap-')).map(([, t]) => t.value));
    const gaps = await main().locator('[data-component="Stack"]').evaluateAll((els) => els.map((e) => getComputedStyle(e).rowGap));
    expect(gaps.length, 'no Stack on the page');
    const bad = gaps.filter((g) => !allowed.has(g));
    expect(!bad.length, `gaps off the scale: ${[...new Set(bad)].join(', ')} (allowed ${[...allowed].join(', ')})`);
    return [...new Set(gaps)].join(' · ');
  });
  await check('Stack', 'a row Stack wraps instead of overflowing at 375px', async () => {
    await page.setViewportSize({ width: 375, height: 900 });
    await go('/components/stack/code');
    const r = await main().locator('[data-component="Stack"]').evaluateAll((els) => els.filter((e) => getComputedStyle(e).flexDirection === 'row').map((e) => [getComputedStyle(e).flexWrap, e.scrollWidth <= e.clientWidth + 1]));
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(r.length, 'no row Stack on the page');
    expect(r.every(([w, fit]) => w === 'wrap' && fit), JSON.stringify(r));
    return `${r.length} row stacks`;
  });
}
