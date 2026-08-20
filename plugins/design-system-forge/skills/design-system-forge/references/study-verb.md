# The `study` verb — extract the DNA, build nothing

Read a seed — an image, a screenshot, a site, an object — and emit a portable
`design.md` describing its aesthetic. No tokens, no components, no code.

This is System 1 pulled out and made a deliverable. It exists because
interpretation and construction fail differently: if you build straight from an
image, a wrong reading of the seed gets baked into 200 tokens before anyone can
object. A one-page DNA doc can be corrected in a sentence.

Use it when the user says "interpret this first", "ตีความก่อน", "what's the
aesthetic here", "extract the design language", or when they hand you a reference
and you can tell one wrong read would waste the whole build.

## The one hard rule

**Separate what to steal from what is incidental.**

A photograph of a bass compressor pedal is not a UI. Take its palette, its
material logic, its proportion, its density. Do **not** take its literal shapes —
no drawn knobs, no brushed-metal texture, no pedal chrome. The material *logic*
ports; the hardware does not. Getting this wrong produces a costume instead of a
system, and it is the single most common failure of image-to-design work.

State both lists explicitly. The "left behind" list is as useful as the other one
because it forecloses the obvious bad move.

## Sample the pixels if you can

If the seed is an image file you can read, sample it — do not eyeball it.

```bash
python3 -c "
from PIL import Image
from collections import Counter
im = Image.open('seed.jpg').convert('RGB').resize((160,160))
c = Counter(im.getdata())
for (r,g,b),n in c.most_common(12):
    print(f'#{r:02X}{g:02X}{b:02X}  {n*100/25600:.1f}%')
"
```

No PIL, or the path is unreadable? Read it visually — but **say so in the doc**,
under a Confidence heading, with the likely error. A palette read by eye off a
photograph can be 5% out, which is enough to move a contrast ratio across its
floor. Downstream work needs to know which numbers are measured and which are
estimated. Never present an eyeballed hex as if it were sampled.

Also note that a photograph carries its own lighting: white balance, exposure,
and specular highlights are properties of the photo, not the object. The anodised
face under warm light is not the anodised colour.

## What `design.md` contains

Nine sections. Keep it to one page — this is a brief, not an essay.

```markdown
# Design DNA — <seed name>

**Mood:** <one sentence. the tiebreaker for every later decision>
**Era / lineage:** <Swiss 60s · 80s terminal · 90s print · brutalist · …>
**Level:** <1–4 the seed implies, with one line of why>

## Palette
| Role | Value | Share | Note |
|---|---|---|---|
| dominant | #D97A2B | ~60% of the object | warm, high chroma |
| … | | | |

Temperature and saturation character in one line.
**The inversion:** the object may be 60% saturated colour; a screen must not be.
State the intended UI share, which is usually far lower, and say it is deliberate.

## Type character
Classification, not a font name: serif/sans/mono · wide/narrow · high/low stroke
contrast · geometric/humanist · tight/loose. Then two or three real faces that
match, and what to avoid.

## Density
Cramped and information-rich, or spacious and calm. Base unit and body leading
this implies. This drives "does it feel like the reference" more than colour does.

## Shape
Radius range, stroke weight, rectangular/rounded/organic/angular.

## Material and depth
Flat · soft shadow · hard shadow · grain · paper · glass · CRT. One light source
and where it comes from.

## Motion character
Not durations — character. Detented, floaty, mechanical, elastic. What must
never happen (e.g. "nothing bounces: wrong for machined hardware").

## Take / Leave
**Take:** …
**Leave:** … ← the literal shapes, the photo's lighting, the skeuomorphism

## Confidence
Measured: … / Estimated: … / How to re-solve if the estimate is wrong: …
```

## Path B — a text seed instead of an image

No image, just "a fintech for farmers" or "ระบบจัดคิวร้านตัดผม". Answer these
five, inventing and committing where the seed is silent, then write the same nine
sections:

1. **Who uses it, in what physical context?** Outdoors on a cracked phone in
   sunlight is a different system from a dark office on a 27-inch display. This
   sets contrast floor, tap target, and base size before anything else.
2. **What is the emotional job?** Reassure · energise · disappear · impress ·
   feel official.
3. **What domain vocabulary should the design echo?** Farming = earth, seasons,
   weather, sturdiness. Legal = paper, seals, restraint.
4. **What is the closest real aesthetic lineage?** A tradition to draw from, not
   a brand to clone.
5. **What must not happen?** "Must not look like a crypto app." Constraints
   sharpen output more than freedoms do.

Invent decisively. A brief hedging between two directions produces a system that
commits to neither.

## Handing off

`design.md` is portable on purpose: it feeds `build` here, or a different tool, or
a human designer. Two rules at the boundary:

- **Stop after emitting it.** Do not slide into building. The user asked to
  interpret; let them correct the reading first. That is the entire point.
- **When `build` later consumes it, the BRIEF block must match it.** If the build
  drifts from the DNA, either the DNA was wrong — fix it and say so — or the
  build drifted, which is a defect. Silent divergence between the two means the
  study bought nothing.
