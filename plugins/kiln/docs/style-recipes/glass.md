# Style Recipe: Glass (and its one partner, Solid)

A glass system lets the scene behind a surface show through, blurred and dimmed, while the words on
top stay readable. This recipe is what Pane, the first system built with kiln, arrived at after
twenty-eight decisions (D-008 to D-035). Every number below was measured there. A new glass system
starts from these numbers and changes them only against its own anchor and its own scenes.

## The recipe has three parts, always together

Every glass surface runs one `backdrop-filter` built from the system's shared recipe tokens:

```css
backdrop-filter: blur(var(--ds-glass-blur)) saturate(var(--ds-glass-saturate)) brightness(var(--ds-glass-brightness));
```

1. **Blur** turns the scene into colour and light, so detail behind the words stops competing with
   them. Pane uses 32px (`blur.clear`) for panes and 20px (`blur.md`) for small controls. 64px made the
   scene a smear and the glass read as a slab (D-012, undone in D-035).
2. **Saturate** puts back the colour that blur and dimming wash out. Pane uses 1.8. Without it the
   glass turns grey over a colourful scene (D-010).
3. **Brightness** dims the scene behind the pane, which is where most of the contrast comes from.
   It is set per environment brightness tier, declared by the app (D-009, D-035).

A surface that uses blur alone is a bug. In Pane the Navbar, Sidebar, BottomNav and NavigationMenu
used blur only, and on the bright Aurora scene their text fell to 3.4:1 (D-035). Gate G-GR1 fails
any `backdrop-filter` in component CSS that is neither `none` nor built from the tokens listed in
`docs.glassRecipe` (for Pane, the blur, saturate and brightness tokens).

## Brightness by environment tier

| Environment the app declares | Brightness (dark theme) | When to use it |
|---|---|---|
| dim | 0.70 | a dark scene, a night photo, the black studio |
| mid | 0.56 | an ordinary photo with mixed light |
| bright | 0.48 | a scene with windows, sky or white walls (the safe default) |

The light theme brightens instead of dimming (1.12), because its words are dark. Measure each tier
against the brightest part of the scene a pane can scroll over, never the average. Pane's first
values came from a test harness and failed on the full page, where the scene stays fixed and every
part of the photo passes under the card (D-011).

## A thin body

The pane's own fill stays thin, so the scene still shows its shapes through it.

| Theme | Body | Pane token |
|---|---|---|
| dark | about 45% (`#14151873`) | `color.smoke.glass` |
| light | about 66% (`#F7F7F9A8`) | `color.smoke.glass-light` |

When text fails contrast, the fix is the brightness tier or the secondary text colour (Pane raised
it from white .85 to .92 in D-013). Thickening the body or the blur is the wrong fix. Pane did that one
number at a time (body 78%, brightness 0.42, blur 64px in D-010 to D-028), every step passed its
gate, and the sum looked like a dark smoked slab nobody had picked (R-032). Gate G-AN1 now compares
the current card with the locked anchor card on the same backdrop (body luminance and chroma, rim
contrast) and fails past the configured deltas.

## Solid is the opaque body

Solid keeps the same shapes, light and depth as glass. Its body is fully opaque (`surface.solid`,
100% at level 1) and every `backdrop-filter` under it is `none` (D-021, D-035). It exists for apps
whose backdrop redraws every frame, for users who turn on reduced transparency, and for anyone who
wants no see-through. A 78% body is neither material, and Pane's first solid had exactly that.

## Two materials only

A system has glass and solid, and nothing in between. The material is set once at the root of a
screen (`<Environment material>` in Pane). Glass and solid never sit side by side on one screen, and
an overlay takes the material of the screen it opens over (D-034, gate G-MT1, which looks for
`[data-surface]`). Reduced transparency switches the screen to solid.

People will ask for the material in their own words. The book's Materials chapter carries this
table so each word lands on one of the two.

| Word people use | Material |
|---|---|
| frosted, frosted glass | glass |
| smoked, smoked glass, tinted glass | glass |
| acrylic, translucent, see-through | glass |
| thick glass, heavy glass | glass (the body stays thin; ask for solid if it should hide the scene) |
| opaque, flat, matte | solid |
| plain, no transparency, reduced transparency | solid |

## Depth inside the material

Stacked glass needs visible levels. Pane has four: the pane, a thing inside the pane, an overlay
and a popover. Each has its own body and shadow, and a nested card becomes level 2 by itself. Each
step measures at least 1.15:1 against the level below it, and a scrim leaves the scene at 60% or
less (D-025, gate G-EL1).

## Where glass may not go

1. **Words never sit on the photo.** Every live example and every docs subject paints a surface
   under its words. A subject marked `bare` (it is its own surface) must actually paint one, through
   a backdrop-filter or a body with alpha of 0.9 or more. Pane's charts, chat, agent, accordion and
   feed subjects were marked `bare` and drew their text straight on the scene (D-035). Gate G-BR1.
2. **Mesh gradients are an accent.** A mesh or gradient-art element may cover at most 10% of its
   region (the section, stage or card that contains it). It is a scene or a piece of media, never a
   wallpaper and never a control fill (D-029, user rule 2026-10-31). Gate G-MS1.
3. **Highlights follow the shape.** The rim and the top sheen are the shape's own edge, faded toward
   the sides (R-021). Light falls from above, one source for the whole system (D-024).

## Checks while this recipe is active

- G-GR1 on every component stylesheet, G-BR1 and G-AN1 on the book, G-MS1 on every page with a mesh.
- Evidence on at least one dark photo, one bright photo and the studio, in both themes and both
  materials. Pane found its blur-only nav bars only on the bright mesh scene.
- A by-eye look at the anchor card next to the current card on a photo, after any change to a
  glass token.
