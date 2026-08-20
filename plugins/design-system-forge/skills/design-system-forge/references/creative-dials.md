# Creative Dials — the 4 levels as concrete policy

The dial controls **expression**, never **completeness**. Every level ships the same three token layers, the same nine-state matrix (`component-specs.md`), the same WCAG AA floor, the same dark mode parity, the same docs depth. What changes is how loud the result is.

Read the level you're on. Do not blend levels — a Level 2 system with one Level 4 component reads as a mistake, not as range.

## Visitor mode — a second axis, not a substitute for the dial

The dial answers "how loud." It does not answer "loud in service of what," and a Level 2 dashboard
and a Level 2 landing page that both stop at "one dominant hue plus one sharp accent" can still be
wrong in opposite directions — the dashboard for having any decoration at all in a tool run all day,
the landing page for being too restrained to earn a click. Decide both, every time; neither implies
the other. Four modes, and every surface is exactly one:

| Mode | For | Job | What changes |
|---|---|---|---|
| **Persuade** | Landing pages, marketing, pricing, launch pages | Earn attention and a specific action | The dial's full loudness for the level applies; `creative-frontend`'s signature-moment and pacing rules (System 4's "climax at 40-60% of the page") are load-bearing here, not optional |
| **Operate** | Apps, dashboards, internal tools, admin | Task completion, often for hours at a stretch, often daily | Motion budget caps at `feedback`/`orientation` purpose tags **regardless of dial level** — a Level 4 Operate tool still ships zero `delight`-tagged ambient motion. Same logic `shell-blueprint.md` already applies to docs chrome, generalized to any Operate surface: the interface should recede so the work stays legible |
| **Read** | Documentation, articles, long-form content | Comprehension, at length, without fatigue | Type scale, line length (65-78ch), and leading carry the hierarchy; decorative motion is minimal even at high dial levels; interactive chrome recedes the same way Operate's does |
| **Experience** | Portfolios, galleries, art direction, games | The artifact or interaction is the point, not a means to a task | The dial's vocabulary is a floor, not a ceiling — even a Level 1 Experience surface (a restrained, accessibility-led portfolio, say) still needs the one signature moment a Level 1 Operate tool would never get |

**The composition rule:** Visitor mode adjusts the *motion and decoration budget* the dial level
would otherwise set — Operate and Read compress it toward the quiet end regardless of level,
Experience holds it open, Persuade takes the level at face value. Everything else the dial governs
(type pairing, colour distribution, shape, depth) is unaffected by mode; a Level 3 Operate tool can
still have a saturated accent and a real type pairing, it just doesn't get the orchestrated
page-load reveal a Level 3 Persuade surface would.

State both the level and the mode in the locked brief (`Level: 2 (Refined), Operate`), and ask for
mode alongside the level in System 0 — a brief that names "a dashboard" or "a landing page" usually
answers this without a separate question, but an ambiguous one ("a tool for our sales team to make
pitches" — Operate internally, Persuade externally) needs it asked.

---

## Level 1 — Safe

**For:** banks, insurance, healthcare, government, enterprise admin, anything regulated, anything where a user is doing serious work under time pressure and errors are expensive.

**The goal:** invisible competence. The user should never notice the design, only finish the task. This is genuinely harder than Level 4 — there is nowhere to hide sloppiness behind style.

| Dimension | Policy |
|-----------|--------|
| Type | One highly legible sans, ≤2 weights for UI (400/600), one optional third for headings. Neutral grotesque or humanist. |
| Fonts | IBM Plex Sans, Source Sans 3, Public Sans, Atkinson Hyperlegible, Libre Franklin |
| Color | Near-neutral base (gray/slate), exactly one brand hue for interactive, 4 status hues (success/warning/error/info). Saturation stays moderate. |
| Distribution | ~90% neutral surface, ~8% brand, ~2% status. Color carries meaning only — never decoration. |
| Shape | 2–6px radius, consistent everywhere. 1px borders. No mixed radii. |
| Depth | Flat, or one very soft shadow for overlays only. No gradients on surfaces. |
| Motion | 120–200ms, `var(--ease-neutral)` only, per `motion-system.md`'s timing hierarchy. Fades and 2–4px position shifts, every one purpose-tagged `feedback` or `orientation` — this level has no `delight` motion at all. No scale, no spring, no stagger. |
| Density | Compact to medium. Information density is a feature here. |
| Backgrounds | Solid. This is the one level where solid is correct. |

**Forbidden:** display/decorative fonts, gradients on interactive elements, animation over 250ms, decorative color, low-contrast "elegant" gray-on-gray, custom scrollbars, dark-mode-only designs, anything that draws attention to itself.

**Raise the floor instead of the volume:** if this feels boring, the correct response is better contrast, better alignment, better spacing rhythm, better empty and error states — not a gradient.

---

## Level 2 — Refined  ← default

**For:** SaaS products, dashboards, internal tools with pride, developer tools, B2B with taste. The default when the user gives no signal.

**The goal:** clearly designed, obviously professional, memorable without being loud. Someone should be able to tell your product from a competitor's screenshot.

| Dimension | Policy |
|-----------|--------|
| Type | A real pairing: one distinctive display/heading face + one workhorse text face. Optional mono for data and code. |
| Fonts | Headings: Instrument Sans, Söhne, General Sans, Geist, Manrope, Outfit, Familjen Grotesk. Text: Inter Tight, Public Sans, Figtree, Supreme. Mono: JetBrains Mono, Söhne Mono, Geist Mono, Berkeley Mono. |
| Color | One committed dominant hue plus **one sharp accent** used sparingly. Full 11-step ramps. |
| Distribution | ~70% neutral, ~25% dominant, ~5% accent. The 5% is what people remember. |
| Shape | Deliberate radius choice (4/6/8/12px) applied with a rule — e.g. inputs 6, cards 12, pills full. |
| Depth | One or two shadow layers with correct optical falloff, or a hairline-border system. Subtle surface gradient allowed on hero only. |
| Motion | 150–400ms per `motion-system.md`'s timing hierarchy. `var(--ease-out-quart)` for movement, `var(--ease-out-expo)` for arrivals. Stagger allowed on lists via `var(--motion-stagger-step)`. One orchestrated page-load reveal, purpose-tagged `delight` and disabled under `prefers-reduced-motion: reduce`; everything else stays `feedback`/`orientation` and simplifies rather than vanishing. |
| Density | Medium. Generous but not precious. |
| Backgrounds | Subtle: a soft radial glow, a faint grid, a 1–3% noise layer. Depth without distraction. |

**Forbidden:** Inter/Roboto/Arial/system as the *primary* face, purple-gradient-on-white, evenly distributed timid palettes, 6 accent colors with no hierarchy, hover states that only change opacity.

**The convergence trap:** Space Grotesk + slate + one teal accent is the "safe creative" default that shows up constantly. If your first instinct lands there, take the second option.

---

## Level 3 — Bold

**For:** consumer apps, brand-forward products, marketing-adjacent UI, launch pages, anything where the design is part of the value proposition.

**The goal:** distinctive and confident. Someone screenshots it because it looks good.

| Dimension | Policy |
|-----------|--------|
| Type | Display face used at real scale — 48px+ headlines, extreme weight contrast (200 next to 800, not 400 next to 600), size jumps of 3x+. Tight display tracking (-0.02 to -0.04em). |
| Fonts | Display: Clash Display, Bricolage Grotesque, Fraunces, Gambarino, Editorial New, Boska, PP Neue Montreal. Text: Satoshi, Switzer, Cabinet Grotesk, Newsreader. |
| Color | Full commitment to a saturated dominant, or a confident dark theme. Accent is loud and used at exactly one job. |
| Distribution | ~60% dominant surface, ~30% neutral, ~10% accent. The dominant color *is* the identity. |
| Shape | An opinion: fully sharp (0px), or notably round (16–24px), or asymmetric. Mixing sharp and round intentionally is allowed if the rule is legible. |
| Depth | Layered — gradient meshes, colored shadows tinted by the surface beneath, glass or blur where justified, visible grain. |
| Motion | 300–800ms. Orchestrated entrance with staggered reveals. One signature interaction — magnetic hover, scroll-linked reveal, or text mask, built per `motion-system.md`'s recipes, not invented ad hoc. `var(--ease-spring)` allowed on discrete state changes; a signature interaction the user can interrupt mid-gesture needs real spring physics, not a fixed-duration approximation (motion-system.md's "physics-based" tier). |
| Density | Spacious. Whitespace is doing work. |
| Backgrounds | Active participant: gradient mesh, large-scale type as texture, geometric pattern, animated ambient movement. |

**Forbidden:** timidity. A Level 3 system that could pass for Level 2 has failed. Also still forbidden: 3+ competing display faces, illegible contrast in service of style, motion that blocks interaction.

**Discipline requirement:** exactly one signature moment. Three signature moments is noise, and noise reads as amateur.

---

## Level 4 — Experimental

**For:** editorial, agency and studio sites, portfolios, art projects, music, games, anything where the interface is the statement.

**The goal:** unmistakable. Nobody could confuse this for a template.

| Dimension | Policy |
|-----------|--------|
| Type | Type as the primary visual element. Variable font axes, mixed classifications, mono where nobody uses mono, huge scale contrast, deliberate overlap or rotation. |
| Fonts | Anything with a point of view: Redaction, Ranade, Pilowlava, Zodiak, Tanker, Sligoil, Neue Bit, Departure Mono, Times/serif used defiantly, plus any well-cut Google Fonts oddity. |
| Color | Any coherent extreme — duotone, monochrome + single scream, risograph, terminal phosphor, CMYK misregistration, paper-and-ink. Coherence matters more than convention. |
| Distribution | Whatever the concept demands, applied with total consistency. |
| Shape | Concept-driven: brutalist boxes, organic blobs, hard grid violation, visible construction lines. |
| Depth | Material metaphor — paper, print, CRT, terminal, plastic, ceramic. Texture is expected. |
| Motion | Unconventional but purposeful: cursor-reactive, physics-based, glitch, typewriter, scroll-scrubbed sequences — every one built from `motion-system.md`'s recipes (scroll-driven techniques from `~/.claude/skills/creative-frontend/references/scroll-choreography.md`) and still purpose-tagged. "Unconventional" is not an exemption from the one non-negotiable — a glitch effect still needs a real trigger and a real stop condition, not a loop. |
| Density | Extreme in either direction — near-empty or deliberately dense. |
| Backgrounds | Full canvas. Animated, textural, reactive, or type-as-background. |

**Still absolutely required — this is what separates experimental from broken:**
- WCAG AA contrast on all functional text. Style is never an excuse for unreadable.
- Visible focus states, complete keyboard navigation.
- Reduced-motion fallback that still looks intentional, not stripped.
- All 7 component states present.
- The shell chrome stays calm via `--shell-*` so the work remains navigable and evaluable.

**Forbidden:** randomness mistaken for art direction, effects with no concept behind them, sacrificing usability for novelty, and — most common — a wild homepage attached to Level-1 form controls. Commit through the whole system, including the boring components.

---

## Choosing when the user is vague

| Signal | Level |
|--------|-------|
| "enterprise", "compliance", "our users are non-technical", "accessible", "clinical" | 1 |
| "clean", "modern", "professional", "like Linear/Stripe", no signal at all | 2 |
| "bold", "memorable", "brand", "consumer", "make it pop", "อยากให้ดูเท่" | 3 |
| "creative", "editorial", "agency", "weird", "artistic", "แปลกๆ", "ไม่ซ้ำใคร" | 4 |

Mixed signals resolve downward one level, then note the choice in a single line so the user can push back cheaply. Being one level too quiet is recoverable; being one level too loud can be unusable.
