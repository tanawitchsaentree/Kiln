# Design System Factory — Master Blueprint

> เป้าหมาย: **โรงงาน** multi-agent ที่รับ ref อะไรก็ได้ (screenshot, Pinterest, component image, URL, hardware/ภาพนอก-UI)
> หรือเริ่มจากศูนย์ แล้วผลิต Design System ที่ **ติดตั้งใช้ได้จริง + มีเว็บ docs แบบ MUI + มี Storybook**
> ตัวโรงงาน (kit) ไม่มีสไตล์เป็นของตัวเอง — สไตล์/platform/สีทั้งหมดเป็น decision ของ **system** ที่กำลังทำอยู่เท่านั้น (ดู §0)

> ไฟล์นี้คือ engine spec ฉบับเดียว รวมทุก gap-audit + ทุก addendum ที่เคยแปะท้ายเข้าเป็นเนื้อเดียวแล้ว ดู `docs/KIT-CHANGELOG.md` สำหรับ diff ระหว่าง version ของ**ตัวโรงงาน**

---

## 0. Factory vs System (สำคัญที่สุด — อ่านก่อนทุกอย่าง)

โครง repo แยก 2 ชั้นเด็ดขาด:

| ชั้น | อยู่ที่ไหน | มีอะไร | แก้เมื่อไหร่ |
|------|-----------|--------|-------------|
| **Factory (kit)** | root, `.claude/`, `docs/`, `tooling/`, `templates/` | engine ที่ใช้ซ้ำได้ทุกงาน — agents, skills, blueprint, catalog, lint | แก้เมื่อจะปรับ**วิธีทำงาน** ไม่ใช่ปรับ**ดีไซน์** |
| **System (งานปัจจุบัน)** | `system/` | decisions, state, reports, refs ของ design system **ตัวที่กำลังสร้างอยู่** | แก้ทุกครั้งที่ทำงานจริง ผ่าน `/lock-decision` เท่านั้น |

**เริ่ม design system ใหม่ = `/new-system {ชื่อ}`** — ย้าย `system/` เดิมไป `systems-archive/{ชื่อเดิม}/` (ไม่ลบ) แล้ว scaffold `system/` ใหม่จาก `templates/system/` DECISIONS ของแต่ละ system **ไม่ใช้ร่วมกันเด็ดขาด**

---

## 1. Deliverables ปลายทาง (3 ก้อน)

| # | Artifact | รูปแบบ | ผู้ใช้ทำอะไรได้ |
|---|----------|--------|----------------|
| 1 | `@{brand}/tokens` | npm package (DTCG JSON → CSS vars, Tailwind preset, SCSS, JSON, TS types) | ใช้กับ stack ไหนก็ได้ แม้ไม่ใช้ component lib |
| 2 | `@{brand}/react` | npm package (React components, styled ด้วย CSS vars) | `npm i` แล้วเรียกใช้ทันที |
| 3 | Docs Site + Storybook | เว็บแบบ mui.com — Getting started, Foundations, ทุก component มี demo/โค้ด/API table/a11y notes | เปิดดู พรีวิว copy code |

**เหตุผลที่เลือก React + CSS Variables (ไม่ hardcode Tailwind ใน component):**
- CSS vars คือชั้นที่ framework-agnostic ที่สุด → theme สลับได้ runtime (dark mode, multi-brand, density)
- Tailwind preset export แยกต่างหาก → คนใช้ Tailwind ก็ได้ประโยชน์เต็ม
- ถ้าอนาคตอยากได้ Vue/Web Components → tokens ชั้นล่างใช้ซ้ำได้ 100%

---

## 2. Monorepo Structure

```
design-system/
├── packages/
│   ├── tokens/              # DTCG JSON (source of truth)
│   │   ├── src/
│   │   │   ├── primitive/   # color.json, dimension.json, typography.json ...
│   │   │   ├── semantic/    # light.json, dark.json, contrast-more.json
│   │   │   └── component/   # button.json, input.json ...
│   │   ├── build/           # generated: css/, tailwind/, scss/, ts/, json/
│   │   └── preview/         # HTML token preview
│   ├── react/               # component library
│   │   └── src/components/{Button,Input,...}/
│   │       ├── Button.tsx
│   │       ├── Button.module.css
│   │       ├── Button.stories.tsx
│   │       ├── Button.test.tsx
│   │       └── index.ts
│   └── icons/               # icon set (SVG → React components)
├── apps/
│   ├── docs/                 # docs site แบบ MUI (Next.js/Nextra)
│   ├── storybook/             # Storybook workshop
│   ├── lab/                  # Layout Lab — render candidates ให้ user เทียบก่อน CONFIRM (§8.2)
│   └── sheet/                 # System Sheet generator — โปสเตอร์ PNG สรุประบบ (§8.3)
├── content/
│   └── voice-and-tone.md     # content guidelines (§12)
├── tooling/
│   ├── style-dictionary/     # token transform config
│   ├── eslint-plugin-ds/      # lint: ห้าม hardcode ค่า
│   └── no-hardcode-lint.mjs
└── turbo.json, pnpm-workspace.yaml, .changeset/
```

Toolchain: **pnpm workspaces + Turborepo + Changesets** (versioning/publish), **Style Dictionary หรือ Terrazzo** (token transform — ทั้งคู่รองรับ DTCG 2025.10), **Storybook** (workshop + visual test), **Playwright/Chromatic** (visual regression + system-sheet render), **axe-core** (automated a11y ใน CI)

---

## 3. Token Architecture (หัวใจ — invest ตรงนี้มากที่สุด)

### 3.1 สามชั้น

```
ชั้น 1 PRIMITIVE (raw values — ไม่มีความหมาย มีแต่ค่า)
  color.blue.500 = #3B82F6
  dimension.400  = 16px
  font.size.300  = 1rem

ชั้น 2 SEMANTIC (ความหมาย — ชี้ไปที่ primitive)
  color.bg.surface        → {color.neutral.0}     (light) / {color.neutral.900} (dark)
  color.action.primary    → {color.blue.600}
  color.text.subtle       → {color.neutral.500}
  space.inset.md          → {dimension.400}
  text.body.md            → composite: {font.size.300} + line-height + weight

ชั้น 3 COMPONENT (เจาะจง — ชี้ไปที่ semantic เท่านั้น)
  button.bg.primary.default → {color.action.primary}
  button.height.md          → {size.control.md}    (40px)
  card.padding              → {space.inset.lg}
```

**กฎเหล็ก:**
- Component tokens ห้ามชี้ primitive ตรงๆ (ต้องผ่าน semantic)
- Component code ห้ามมีค่าดิบเลย (lint บังคับ)
- Theme = สลับ mapping ชั้น semantic เท่านั้น (light/dark/contrast-more/density ทั้งหมดเป็น mapping ไม่ใช่ primitive ใหม่)

### 3.2 Naming Convention

`{category}.{concept}.{property}.{variant}.{state}`
ตัวอย่าง: `color.action.primary.hover`, `button.border.radius`, `text.heading.xl`

**Namespace แยกกันเด็ดขาด แม้ค่าจะซ้ำกันบางตัว:**
- `space.*` = ช่องว่าง**ระหว่าง**ของ (gap, padding, margin) — แกนที่ density mode สลับ
- `size.*` = ขนาด**ของตัว**ของ (width/height ของ icon, avatar, control, container min/max) — แกนที่คงที่ไม่ขึ้นกับ density

ทำไมต้องแยก: ถ้าใช้ scale เดียวกัน วันที่อยากปรับ density (ลดช่องว่าง) จะพัง avatar/icon size ไปด้วยทั้งที่ไม่ได้ตั้งใจ

### 3.3 Format

DTCG JSON (spec 2025.10) เป็น source of truth เสมอ ใช้ type ให้ครบตามที่เกี่ยวข้อง:

**Primitive types:** `color`, `dimension`, `duration`, `cubicBezier`, `fontFamily`, `fontWeight`, `number`
**Composite types:** `typography`, `shadow`, `gradient`, `border`, `transition`, `strokeStyle`

```json
{
  "color": {
    "blue": {
      "500": { "$type": "color", "$value": "#3B82F6" }
    }
  },
  "space": {
    "md": { "$type": "dimension", "$value": "{dimension.400}" }
  },
  "size": {
    "icon": {
      "md": { "$type": "dimension", "$value": "{dimension.500}" }
    }
  }
}
```

### 3.4 Token Categories ครบชุด (checklist ตอนสร้าง token-architect ห้ามข้าม)

| Category | ตัวอย่าง | หมายเหตุ |
|----------|----------|----------|
| `color.*` | ramp 50-950 ต่อ hue | §4.4 |
| `space.*` | inset/stack/inline sm-xl | §4.1 — ช่องว่างเท่านั้น |
| `size.*` | icon, avatar, control height, container min/max | §4.2 — ขนาดตัวของเท่านั้น |
| `ratio.*` | square 1:1, video 16:9, photo 4:3, portrait 3:4, golden 1.618:1 | media, thumbnail, skeleton |
| `text.*` | composite typography (size+lineHeight+weight+letterSpacing+family) | §4.3 |
| `radius.*` / `shadow.*` / `border.*` | composite ตาม DTCG | §4.6 |
| `gradient.*` | composite `$type: gradient` | ref สมัยนี้ใช้ gradient เยอะ — ห้ามลืม |
| `duration.*` / `cubicBezier.*` / `transition.*` | motion primitives + composite | §4.7 |
| `overlay.*` | hover 4%, pressed 8%, scrim 50% (black/white alpha) | วิธีทำ hover state แบบ systematic แทน hand-pick สีทีละตัว |
| `blur.*` | sm/md/lg + backdrop-blur | glassmorphism |
| `cursor.*` | pointer/grab/not-allowed ต่อ interaction type | |
| `zIndex.*` | base 0 → toast 1700 | §4.8 |
| `opacity.*` | 0-100 scale | §4.8 |
| `viz.*` | categorical (8-12 สี colorblind-safe), sequential, diverging | จำเป็นทันทีที่มี chart |
| `focusRing.*` | สี+width+offset | a11y-critical กำหนดครั้งเดียวใช้ทั้งระบบ |

ถ้า style ที่ lock ไว้มี recipe ใน `docs/style-recipes/` (§8.4) ต้อง generate token กลุ่ม "Tokens ที่ต้องมี" ของ recipe นั้นเพิ่มให้ครบด้วย

---

## 4. Foundations Spec (สิ่งที่มองไม่เห็น)

Agent ต้อง lock ชั้นนี้ก่อนแตะ component ทุกครั้ง — ลำดับการตัดสินใจ (ดู §8.1 ข้อ 0 ก่อนเริ่ม §4.1):

### 4.1 Spacing (ช่องว่างระหว่างของ)
- **Base unit:** default 4px (ถาม user: 4 หรือ 8)
- **Scale:** 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
- **Naming:** ตัวเลข (space.100 = 4px, space.400 = 16px) + semantic alias (inset.sm/md/lg, stack.sm/md/lg, inline.sm/md/lg)
- **Inference จาก ref:** วัดระยะทั้งหมด → histogram → หา GCD → snap ค่าเพี้ยน (13px → 12, 17px → 16) แล้วเสนอ user ยืนยัน
- **แกนที่ density mode สลับ** — ดู §4.10.1

### 4.2 Sizing (ขนาดของตัวของ — คนละ scale จาก spacing)
- **Scale:** อ้าง dimension primitive เดียวกับ space ได้ แต่ประกาศเป็น namespace `size.*` แยก
- **Icon:** 16, 20, 24, 32 (ผูกกับ icon grid §4.8)
- **Avatar:** 24, 32, 40, 48, 64, 96
- **Control height:** ตามตาราง t-shirt §4.9 (เป็น scale จริง ไม่ใช่ตารางลอย)
- **Container min/max width:** ผูกกับ breakpoints §4.5
- **Aspect ratio:** `ratio.square` 1:1, `ratio.video` 16:9, `ratio.photo` 4:3, `ratio.portrait` 3:4, `ratio.golden` 1.618:1 — ใช้กับ media, card thumbnail, skeleton
- **กฎ:** ปรับ density แล้ว size.* ต้อง**ไม่เปลี่ยน** — เปลี่ยนแค่ space.* รอบๆ มัน

### 4.3 Typography
- **Base:** 16px (1rem) + **ratio** เลือกจากตาราง:
  | Ratio | ชื่อ | คาแรกเตอร์ |
  |-------|------|-----------|
  | 1.2 | Minor Third | ปลอดภัย, dense UI, dashboard |
  | 1.25 | Major Third | สมดุล, product ทั่วไป |
  | 1.333 | Perfect Fourth | editorial, marketing |
  | 1.5 | Perfect Fifth | display หนักๆ, landing |
- ได้ scale: xs, sm, md(base), lg, xl, 2xl, 3xl, 4xl, 5xl
- **Composite tokens:** `text.body.md`, `text.heading.lg` = size + lineHeight + weight + letterSpacing + family
- **Line-height:** body 1.5–1.6, heading 1.1–1.3 (ยิ่งใหญ่ยิ่งแน่น)
- **Font stacks:** heading / body / mono (สูงสุด 2 families + mono)
- **Fluid variant (marketing pages เท่านั้น):** `clamp(min, preferred, max)` ตาม Utopia fluid type scale — ประกาศเป็น token ชุดคู่กับ static ไม่ใช่แทนที่
- **Inference จาก ref:** เก็บ font-size ที่พบ → fit หา ratio ใกล้สุด → เสนอ

### 4.4 Color
- **โครงสร้างต่อ hue:** ramp 50–950 (11 steps) — generate ใน **OKLCH** เพื่อให้ lightness สม่ำเสมอทั้ง ramp
- **Roles ขั้นต่ำ:** brand/primary, secondary(optional), neutral(gray), success, warning, danger, info
- **Semantic layer ขั้นต่ำ:** bg (canvas/surface/raised/overlay), text (default/subtle/disabled/inverse/on-primary), border (default/subtle/focus), action (primary/hover/active/disabled)
- **Overlay/alpha tokens:** `overlay.hover` (black 4%), `overlay.pressed` (black 8%), `overlay.scrim` (black 50%) — สร้าง hover/pressed state แบบ systematic ไม่ hand-pick สีทีละตัว
- **Contrast policy:** ทุกคู่ text/bg ที่ประกาศต้องผ่าน WCAG AA (4.5:1 body, 3:1 large text) — QA agent บังคับ พิจารณา **APCA** (WCAG 3 draft) เป็น policy รองเมื่อ WCAG 2 ratio ให้ผลกำกวม
- **Forced-colors / high-contrast:** เตรียม `contrast-more` เป็น theme ที่สามควบคู่ light/dark ตั้งแต่ชั้น semantic (ไม่ใช่ patch ทีหลัง)
- **Inference จาก ref:** cluster สีจากภาพ → แยก role (dominant = bg, saturated น้อยจำนวนมาก = neutral, saturated pop = primary/accent) → generate ramp เต็มจากสีตัวแทน → เสนอ

### 4.5 Grid & Breakpoints
- Breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536 (ปรับได้ — ถ้า platform = mobile-first ให้เพิ่ม breakpoint first-class ที่ 390 ด้วย ดู §8.1)
- Container max-widths ต่อ breakpoint, 12-column grid, gutter = space token
- **Container queries:** component (เช่น Card) ต้องปรับตัวตามขนาด container ไม่ใช่แค่ viewport — ประกาศ container-type ที่ layout primitive ชั้นบนสุดที่เกี่ยวข้อง

### 4.6 Radius / Shadow / Border / Gradient
- Radius scale: none, sm(4), md(8), lg(12), xl(16), 2xl(24), full — บุคลิกของแบรนด์อยู่ตรงนี้ (sharp vs soft)
- Elevation: 0–5 levels, แต่ละ level = shadow composite + (dark mode ใช้ surface lightness แทนเงา)
- Border widths: 1, 2, 4
- Gradient tokens: `$type: gradient` — ประกาศเมื่อ ref มี gradient (hero, badge, CTA)

### 4.7 Motion
- Duration: instant 0, fast 100ms, base 200ms, slow 300ms, slower 500ms
- Easing: standard, decelerate (เข้า), accelerate (ออก), spring (optional)
- `prefers-reduced-motion` ต้องรองรับทุก component

### 4.8 อื่นๆ ที่ห้ามลืม
- Z-index scale: base 0, dropdown 1000, sticky 1100, overlay 1300, modal 1400, popover 1500, toast 1700
- Opacity scale: 0, 5, 10, 20, 40, 60, 80, 100
- Icon grid: 16/20/24/32 บน 24px grid, stroke width คงที่ (ผูกกับ `size.icon.*`)
- Blur scale: sm/md/lg + backdrop-blur (glassmorphism)
- Cursor tokens: pointer/grab/not-allowed ต่อ interaction type
- Focus ring spec: สี + width + offset (a11y-critical, กำหนดครั้งเดียวใช้ทั้งระบบ)
- Data-viz palette: categorical (8-12 สีแยกแยะได้+colorblind-safe), sequential, diverging — lock ทันทีที่ scope มี chart

### 4.9 T-shirt Size Mapping (ตอบโจทย์ S/M/L/XL/XXL)

Size ไม่ใช่ค่าดิบ — เป็น **ชุด token ที่ประกอบกัน** ต่อ component โดยอ้าง `size.*` และ `space.*` ที่ lock แล้วเท่านั้น เช่น control heights:

| Size | Height (`size.control.*`) | Padding-x (`space.*`) | Font | Icon (`size.icon.*`) | ใช้กับ |
|------|--------|-----------|------|------|--------|
| xs | 24px | space.200 | text.xs | 14 | dense table actions |
| sm | 32px | space.300 | text.sm | 16 | toolbar, filter |
| md | 40px | space.400 | text.md | 20 | **default** |
| lg | 48px | space.500 | text.md | 20 | form หลัก, CTA |
| xl | 56px | space.600 | text.lg | 24 | hero CTA |

Agent เสนอ default นี้ → user ปรับ → lock เป็น component tokens · ถ้า platform = mobile-first ต้องคุมให้ md ≥ 44px touch target ตั้งแต่ต้น (ดู §4.10.3)

### 4.10 System Dimensions (มิติเชิงระบบ — คนละแกนจาก theme×size)

#### 4.10.1 Density Modes
compact / comfortable / spacious เป็น **แกนที่สาม** นอกจาก theme × size: สลับชุด `space.*` ทั้งระบบ (แบบ Gmail) โดย **`size.*` ต้องไม่เปลี่ยน** ออกแบบตั้งแต่ชั้น semantic mapping ของ token ไม่ใช่มาเติมทีหลัง

#### 4.10.2 RTL / Logical Properties
ใช้ logical properties (`padding-inline-start` ไม่ใช่ `padding-left`) **ทั้งระบบตั้งแต่บรรทัดแรก** — ถ้าไม่ทำแต่แรก การรองรับภาษา RTL ทีหลัง = rewrite ทั้ง component library. Lint บังคับ (ดู `tooling/no-hardcode-lint.mjs`)

#### 4.10.3 Touch Targets
hit area ขั้นต่ำ 44×44px บน touch — component ตัวเล็กกว่าได้ (เช่น icon 24px) แต่ hit area (padding/pseudo-element) ต้องถึง 44px เสมอ ถ้า platform = mobile-first นี่คือกฎ ไม่ใช่คำแนะนำ (ดู §8.1)

#### 4.10.4 CSS Cascade Layers
จัดชั้น specificity ด้วย `@layer`: `reset → tokens → components → utilities` ป้องกันสงคราม specificity กับโค้ดฝั่ง user ที่ import lib ไปใช้

#### 4.10.5 Container Queries
ดู §4.5 — ประกาศที่ layout primitive ไม่ใช่ทำซ้ำในทุก component

---

## 5. Component Inventory (ลำดับการสร้างตาม dependency)

Catalog เต็มอยู่ที่ `docs/CATALOG.md` (103 ตัว / 10 waves เป็น default — ปรับจำนวน/ลำดับได้ตาม system; เลขนี้ต้องตรงกับหัวเรื่องของ CATALOG.md จริง ซึ่งเคย drift มาแล้วสามครั้ง) โครง tier มาตรฐาน:

### Tier 1 — Atoms (สร้างก่อน ทุกอย่างพึ่งพวกนี้)
Text/Typography, Icon, Button, IconButton, Input, Textarea, Checkbox, Radio, Switch, Badge, Avatar, Spinner, Divider, Link, Kbd, Skeleton

### Tier 2 — Molecules
FormField (label+input+helper+error), Select/Dropdown, Combobox, Tooltip, Popover, Tabs, Accordion, Card, Alert/Banner, Toast, Tag/Chip, Breadcrumb, Pagination, Progress, Slider, DatePicker(ยาก—ท้ายๆ)

### Tier 3 — Organisms / Patterns
Modal/Dialog, Drawer/Sheet, Table (sort/select/pagination), Navbar, Sidebar, Command Palette, EmptyState, Stepper, FileUpload

### Layout Primitives (สร้างพร้อม Tier 1)
Box, Stack (V/H), Grid, Container, Spacer — พวกนี้คือวิธีบังคับให้ spacing scale ถูกใช้จริง และเป็นที่ที่ประกาศ container-type (§4.5)

### Platform reorder (ถาม §8.1 ข้อ 0 ก่อนล็อกลำดับจริง)
ถ้า platform = mobile-first: เลื่อน BottomNav, Sheet/BottomSheet, ActionSheet, FAB, PullToRefresh ขึ้นก่อน · เลื่อน Sidebar, ContextMenu, hover-only Tooltip (เปลี่ยนเป็น press-and-hold/tap variant), Breadcrumb ไปท้าย — บันทึกลำดับที่เลือกจริงเป็น decision ใน `system/DECISIONS.md`

### X-class components (engine-backed)
Component ที่ทศวรรษของ edge case ทำเองไม่คุ้ม (DataGrid, TreeView, DatePicker/Calendar, Charts, Carousel, VirtualList, CommandPalette, RichTextEditor, Kanban) — **สืบทอด** behavior จาก headless engine ที่พิสูจน์แล้ว (TanStack Table/Virtual, React Aria, visx/ECharts, Embla, cmdk, TipTap, dnd-kit) แล้วห่อด้วย token ของ system เท่านั้น กฎ: engine ต้อง headless, MIT/Apache license, ห้าม fork — ดู `docs/SCALING.md` §3

---

## 6. Component Anatomy Contract

**ทุก component ต้องส่งมอบครบ 10 ข้อ ถึงจะนับว่าเสร็จ** (ข้อ 10 เพิ่มโดย skill `form-language` —
ข้อ 1-9 คุม behavior/API/states ไม่มีข้อไหนคุม form มาก่อน จนกว่า Phase 2.5/§8.6 ปิดช่องนี้):

1. **Anatomy diagram** — ชิ้นส่วนภายในชื่ออะไรบ้าง
2. **Variants** — เช่น Button: solid / outline / ghost / link × primary / neutral / danger
3. **Sizes** — จากตาราง t-shirt §4.9 (ระบุว่ามีกี่ size, อ้าง `size.*` scale ที่ lock แล้ว)
4. **States** — default, hover, active, focus-visible, disabled, loading, error/invalid, read-only, indeterminate, selected (ตามที่เกี่ยว)
5. **Tokens consumed** — รายการ component tokens ทั้งหมด (ตรวจได้ว่าไม่มี hardcode, ตรวจ space.\*/size.\* ใช้ namespace ถูก)
6. **A11y spec** — role/ARIA, keyboard map (Tab/Enter/Esc/Arrow), focus behavior, screen-reader notes, touch target ≥44px
7. **API (props)** — TypeScript interface + defaults ตามมาตรฐาน §7 + ตาราง docs
8. **Stories** — ทุก variant × size × state + playground story (controls ครบ)
9. **Docs page** — demo, copy-paste code, Do/Don't, related components
10. **Matches FORM GOAL** — spec มี FORM GOAL section (1-3 ประโยค) ที่ derive จาก `system/FORM.md`'s
    component-class table จริง (§8.6) ไม่ใช่เดาเอง · identity component (Button/Input/Switch/
    Checkbox/Card/Slider) ต้องผ่าน multi-candidate lab round มาก่อน มี D-xxx อ้าง screenshot จริง

---

## 7. Component API Standards (มาตรฐานเดียวทั้ง lib)

- **Polymorphic rendering:** เลือกมาตรฐานเดียว — `asChild` (Radix-style) แนะนำเหนือ `as` prop เพราะไม่เสี่ยง prop bleed ไปยัง element เป้าหมาย
- **Compound components:** molecule ขึ้นไปใช้ pattern `<Tabs.List>`, `<Tabs.Trigger>`, `<Select.Option>` แทน prop เดี่ยวที่ยัดทุกอย่าง
- **Controlled/Uncontrolled duality:** input component ทุกตัวรองรับทั้ง `value`+`onChange` และ `defaultValue`
- **forwardRef:** ทุก component ที่ render DOM element จริง
- **SSR/RSC:** ประกาศ `"use client"` เฉพาะตัวที่จำเป็น (มี state/effect/event handler) ห้ามแตะ `window`/`document` ตอน render แรก รองรับ Next.js App Router ตั้งแต่วันแรก
- **States เพิ่มที่มักถูกมองข้าม:** `read-only` (ต่างจาก disabled — ยัง focus/select ได้), `indeterminate` (checkbox/progress), `invalid` (สถานะ ต่างจาก error message ที่เป็น content)
- ยืม behavior/a11y จาก React Aria หรือ Radix primitive แล้วห่อด้วย token ของ system เสมอ — ห้ามเขียน focus trap / typeahead / roving tabindex เอง

---

## 8. Multi-Agent Architecture

### 8.0 Orchestrator + 6 Specialist Subagents + Skills

```
                    ┌─────────────────┐
   user ⇄ chat ⇄    │  ORCHESTRATOR   │  ← ถือ system/DECISIONS.md, ลำดับงาน, ถาม user
                    └────────┬────────┘
     ┌──────────┬────────────┼────────────┬──────────┐
     ▼          ▼            ▼            ▼          ▼
  INTAKE    FOUNDATION    TOKEN       COMPONENT     QA/A11y
  (vision)  INFERENCE     ARCHITECT   ENGINEER      GATE
     └──────────┴────────────┴────────────┴──────────┘
                             ▼
                      DOCS & PUBLISHER
```

| Subagent | Input | Output | คำถามที่ถาม user |
|-------|-------|--------|------------------|
| **Intake** | ภาพ/URL/คำอธิบาย/ความว่างเปล่า ใน `system/refs/` | Extraction Report → `system/reports/` + routing (UI ตรง / non-UI → `abstract-interpreter`) | "ref นี้เอา vibe หรือเอาเป๊ะ?" / "หลาย ref ขัดกัน เอาทางไหนเป็นหลัก?" |
| **Foundation Inference** | Extraction Report (+ interpretation ถ้าผ่าน abstract-interpreter มา) | ข้อเสนอ scales ทั้งหมด (§4 ครบทุกหัวข้อ รวม sizing และ density) พร้อมเหตุผล + ทางเลือก + candidate render ลง `apps/lab/` | ข้อ 0 platform ก่อนเสมอ (§8.1) แล้วค่อย "base 4 หรือ 8?" / "type ratio 1.25 หรือ 1.333?" / ฯลฯ ทีละเรื่อง |
| **Token Architect** | Scales ที่ lock แล้วใน `system/DECISIONS.md` | DTCG JSON 3 ชั้น + theme (light/dark/contrast-more) + naming | "ทำ dark mode เลยไหม?" / "multi-brand ในอนาคต?" |
| **Component Engineer** | Tokens + Anatomy Contract | โค้ด React + stories ตาม dependency order (เรียกทีละตัวผ่าน `/new-component` หรือเป็น wave ผ่าน `production-run`) | "Button ต้องมี variant อะไรบ้างนอกจาก default set?" |
| **QA/A11y Gate** | ทุก output | pass/fail: contrast AA, no-hardcode lint, keyboard nav, visual diff, forced-colors, touch target, style-recipe checks | (ไม่ถาม — report อย่างเดียว, read-only เสมอ) |
| **Docs & Publisher** | ทุกอย่างที่ผ่าน QA | docs site pages, Storybook build, npm publish, changelog, content guidelines pages | "ชื่อ package/scope?" |

Skills เสริม orchestrator (ไม่ใช่ subagent — รันใน main context เพราะต้อง coordinate หลาย subagent/ไฟล์):
- `lock-decision` — เขียน `system/DECISIONS.md` format เดียวเสมอ
- `new-component` — inner loop เต็มของ component เดี่ยว (ดู §8.5)
- `production-run` — inner loop เดียวกันแต่รันเป็น wave 8-12 ตัว (ดู §8.5)
- `abstract-interpreter` — ตีความ ref non-UI (ดู §9.1)
- `form-language` — derive `system/FORM.md` ต่อ component class + gates G-F1-G-F3 (ดู §8.6)
- `new-system` — สลับ/เริ่ม system ใหม่ (ดู §0)
- `system-sheet` — render โปสเตอร์สรุประบบ (ดู §8.3)
- `ds-conventions` — reference doc มาตรฐานกลาง (Anatomy Contract, naming) ไม่ใช่ action

### 8.1 Interaction Loop (สำคัญ — ตรงกับ "suggest แล้วคอยถาม")

ทุก layer ใช้ loop เดียวกัน:

```
PROPOSE  → agent เสนอ + เหตุผล + 2-3 ทางเลือก
RENDER   → ถ้าเป็นเรื่องที่เห็นด้วยตาได้ (สี, style, spacing, component variant)
             ต้อง render candidates ลง apps/lab/ (§8.2) ก่อนถาม ห้ามให้ user ตัดสินเรื่องภาพจากตัวหนังสือ
CONFIRM  → user เลือก/ปรับ (ถามทีละเรื่อง ไม่ dump 20 คำถาม)
LOCK     → บันทึกลง system/DECISIONS.md ผ่าน /lock-decision (ADR สั้นๆ) — แนบ path screenshot ของ candidate ที่ชนะถ้ามี RENDER
NEXT     → ไป layer ถัดไป — layer บนห้ามขัดกับที่ lock แล้ว · หลังทุก LOCK ใน Phase 1 และหลังทุก WAVE REPORT ให้รัน system-sheet (§8.3)
```

**Platform question (ข้อ 0 — ถามก่อน §4.1 เสมอ):** mobile-first / web-first / both — คำตอบบิด default ทั้งกระดาน: touch target, ความหมายของ hover (mobile-first = hover เป็น enhancement ห้ามแบกข้อมูล), density เริ่มต้น, breakpoint แรก, ลำดับ component inventory (§5)

`system/DECISIONS.md` คือ state กลางของทั้ง system นี้ — ทุก agent อ่าน/เขียนไฟล์เดียวกัน ถ้า user ขอเปลี่ยนของที่ lock แล้ว → orchestrator แจ้ง impact ("เปลี่ยน base unit = regenerate ทุกอย่าง") ก่อน execute เสมอ

### 8.2 Layout Lab (`apps/lab/`)

ที่ที่ decision เชิงภาพถูกเทียบก่อนถาม user — เขียน candidate ใหม่ลง `apps/lab/candidates.js` (key ใหม่ต่อทางเลือก) แล้วให้ user เปิด `apps/lab/index.html`: เลือก candidate × ฉากทดสอบ × frame (mobile/tablet/desktop) เทียบกัน `locked: true` = baseline ปัจจุบันของ system (ใช้เทียบ regression ตอนเสนอทางเลือกใหม่) เมื่อ user ตัดสินแล้ว candidate ที่ชนะ → `/lock-decision` พร้อมตั้ง `locked: true` ให้ตัวนั้น (ปลด flag ตัวเก่า)

### 8.3 System Sheet (`apps/sheet/`)

โปสเตอร์ PNG สรุปทั้งระบบ — ให้ user เห็นภาพรวมหลังทุกรอบ lock ของ Phase 1 และหลังทุก WAVE REPORT (ไม่ใช่อ่าน JSON) เนื้อหาบนแผ่นอ่านจาก `system/DECISIONS.md` + tokens จริงเท่านั้น ห้ามใส่ค่าที่ยังไม่ lock วิธี render: เติม `apps/sheet/template.html` แล้วรัน `node apps/sheet/render.mjs` → ได้ `system/sheets/sheet-{YYYY-MM-DD}.png` (เก็บทุกใบ = timeline วิวัฒนาการของระบบ ห้ามลบของเก่า)

### 8.4 Style Recipes (`docs/style-recipes/`)

เมื่อ ref (โดยเฉพาะ non-UI ที่ผ่าน `abstract-interpreter`) นำไปสู่การเลือก style ทางภาพที่มีความเสี่ยง a11y ในตัว (เช่น neumorphism, glassmorphism, claymorphism) — เขียน recipe ก่อนเข้า Phase 2: นิยาม / จุดเสี่ยง QA / กฎเอาตัวรอด (บังคับ) / token ที่ต้องมี `token-architect` ต้อง generate token กลุ่มที่ recipe เรียกร้องให้ครบ และ `qa-a11y` ต้องรันหัวข้อ "เช็คเพิ่ม" ของ recipe นั้นเป็นส่วนหนึ่งของ gate เสมอที่ style นั้น active

### 8.5 Scaling การผลิต — Single component vs Wave

- **`/new-component {Name}`** — inner loop เต็ม รอบเดียวต่อ component: pre-check dependency → propose API (+render ถ้ามีทางเลือกเชิงภาพ) → lock → build → qa gate (สูงสุด 3 รอบ) → docs+publish → close (`system/STATE.md` + commit) ใช้ตอนงานเล็ก/component เดี่ยว
- **`production-run`** — สำหรับ 10-100+ ตัว รวบ checkpoint ไว้ **หัว wave เดียว** (WAVE PLAN → BATCH API REVIEW คือ checkpoint เดียวของทั้ง wave → EXECUTE เป็น parallel batch 4-6 ตัว/ครั้งตาม Rigor Tier → WAVE REPORT เป็นรายงานสั้น ไม่ใช่ checkpoint ที่สอง — เดินต่อ wave ถัดไปทันทีเว้นแต่ชน STOP CONDITION, ORDERS C3/C4) ข้อยกเว้นเดียว: component ที่เป็นแม่แบบของ pattern ใหม่ (Template Checkpoint) หยุดรอ user ตรวจก่อนยิง batch ที่ reuse มันต่อ STOP CONDITIONS (หยุดถามทันที): component เดิมตก QA ครบ 3 รอบ, ต้องเพิ่ม dependency ใหม่หรือกระทบ token ชั้น semantic, งานจริงเกิน per-component budget ตาม tier ~2 เท่า, QA เจอ finding จริงระหว่าง diff-review ของ T1/T2 (escalate เป็น T3-style review), หรือผ่านมา ~5 components/session ใกล้เต็ม (เขียน checkpoint ลง `system/STATE.md` กันไฟดับ) — resume ทุก session ใหม่จาก `system/STATE.md` โดยไม่ถามซ้ำ ดูรายละเอียดเต็มที่ skill `production-run`

### 8.6 Form Language (`system/FORM.md`, skill `form-language`)

Foundations (§8.1's loop, D-001 class decisions) reliably captures palette/type/spacing/shadow-
policy from a lineage — it does not reliably capture the lineage's actual object SHAPES, because no
step before this one ever asked "what does a control look like as a physical thing," and the
Anatomy Contract's original 9 points cover behavior/API/states, never form. This is the step that
closes that gap, once per system, after radius/shadow lock (§4.6) and before token-architect starts
Phase 2 (a real derivation may require new shadow tokens `token-architect` doesn't have a category
for yet — see the skill's own "real gaps" section).

Derives a form treatment per COMPONENT CLASS (control/input/surface/display/separator, not per
individual component — a new component slots in by class lookup) into `system/FORM.md`: silhouette
vocabulary, depth treatment (which shadow/inset tokens, if any), corner logic, label placement,
pressed/checked physical metaphor, and 2-3 NEVER rules per class — written in geometry+tokens, never
adjectives. Locked via `/lock-decision` once the user confirms it's a fair reading of the lineage
(narrower than the identity-component ship decision below).

**Every component spec gains a mandatory FORM GOAL section** (1-3 sentences, derived from FORM.md's
class table, never invented per-component) before `component-engineer` builds — wired into
`new-component`'s Propose-API step. QA's Anatomy Contract point 10 checks it (`matches FORM GOAL`).

**Identity components** (Button, Input, Switch, Checkbox, Card, Slider — the ones that carry the
system's face) get a **mandatory multi-candidate Lab round** before shipping: ≥3 genuinely different
form candidates rendered on the same scene in `apps/lab/` (not three cosmetic variations of one
idea) — for a system reconsidering its current form, one candidate should honor the current shipped
form, one should apply the FORM.md derivation faithfully, one should take a harder/more literal read
of the same lineage. User picks with eyes; `/lock-decision` attaches the winning screenshot path.
Presenting one safe-default candidate alone for an identity component is a process violation
(G-F3) — the eyes-on round is the real gate; G-F1/G-F2/G-F3 in the skill's `references/gates.md`
are measured PROXIES for it, not substitutes.

Extends the project's EVASION/anti-attractor discipline (`.claude/skills/kiln/references/
baseline.md`'s measured-ban-list mechanism, if active) with form-specific rows — the flat-rounded-
pill-button, bordered-rect-input, white-card-soft-shadow, iOS-clone-switch attractors that font/
palette/motion/background checks never covered. See `form-language/references/evasion-form.md`.

### ลำดับ Pipeline เต็ม

```
Phase 0  Intake          → Extraction Report / routing ผ่าน abstract-interpreter ถ้า non-UI / interview ถ้าเริ่มจาก 0
Phase 1  Foundations     → ข้อ 0 platform → spacing → sizing → type → color → grid → radius/shadow
                            → form language (§8.6, `system/FORM.md` — silhouette/depth/corner ต่อ
                            component class, ก่อนเข้า Phase 2) → motion → density
Phase 2  Tokens          → DTCG 3 ชั้น + build pipeline + themes (light/dark/contrast-more) + style recipe tokens ถ้ามี
Phase 3  Layout + Atoms  → Box/Stack ก่อน แล้ว Tier 1 ทีละตัวหรือเป็น wave (ผ่าน QA ทุกตัว)
Phase 4  Molecules       → Tier 2
Phase 5  Organisms       → Tier 3 + X-class
Phase 6  Docs + Publish  → docs site, Storybook, npm, versioning
```

---

## 9. Inference Heuristics (แกะจาก ref ยังไง)

### 9.1 Ref แบบ UI ตรง (screenshot, mockup)

| สิ่งที่มองไม่เห็น | วิธีแกะ |
|-------------------|---------|
| Base unit (space) | วัดทุก gap/padding → histogram → GCD → เสนอ snap |
| Sizing (size.\*) | วัดขนาด icon/avatar/control ที่ปรากฏ → group เป็น scale ไม่เกิน 6 ขั้น → เทียบกับ default §4.9 |
| Type scale | เก็บ font-sizes → ลอง fit กับ ratio มาตรฐาน → เลือก error ต่ำสุด |
| Color system | cluster → จัด role ตามปริมาณ+saturation → generate ramp OKLCH จากสีตัวแทน |
| Grid | ขอบซ้าย-ขวาของบล็อกเนื้อหา → columns + gutter |
| Radius/Shadow | เก็บค่าที่พบ → จัดเป็น scale ไม่เกิน 5-6 ขั้น |
| Density | นับความถี่/ความแน่นของ element ต่อพื้นที่ → เทียบ compact/comfortable/spacious |
| บุคลิก (มองไม่เห็นสุด) | density (แน่น/โปร่ง), contrast (จัด/นุ่ม), corner (คม/มน), motion (นิ่ง/เด้ง) → สรุปเป็น "design principles" 3-5 ข้อให้ user ยืนยัน |

**หลักการ:** ref คือหลักฐาน ไม่ใช่คำสั่ง — agent มีหน้าที่เสนอ "ระบบที่ ref นี้ *ควรจะ* เป็น" (ค่าเพี้ยนของต้นฉบับคือ bug ไม่ใช่ feature)

### 9.2 Ref แบบ non-UI (hardware, โปสเตอร์, ภาพถ่าย, งานศิลปะ, moodboard)

วัดค่าตรงๆ ไม่ได้ — ใช้ skill `abstract-interpreter` แปล 3 ชั้น: **เห็นอะไร (กายภาพ) → หลักการที่ซ่อนอยู่ → decision ของ DS**

DS-Knowledge Checklist ที่ต้องไล่ให้ครบทุก ref:
- **Color role:** สีไหนคือวัสดุ (canvas) สีไหนคือ affordance (interactive) สีไหนคือข้อมูล
- **Dimension → space:** ความหนา/ระยะห่างของวัตถุจริง แปลเป็น density และ base unit
- **Materiality → style:** ผิววัสดุแปลเป็นสไตล์ไหน (skeuomorphism / neumorphism / claymorphism / glassmorphism / flat) และมี recipe รองรับหรือยัง (§8.4)
- **Hierarchy:** ref ใช้อะไรสร้างลำดับ — ขนาด? ตำแหน่ง? สี?
- **Texture:** ลวดลายมีหน้าที่หรือเป็นการตกแต่ง — อนุญาตเฉพาะที่มีหน้าที่
- **สิ่งที่ ref ตอบไม่ได้:** ลิสต์ให้ชัด (เช่น hardware ไม่มี error state) → ต้อง generate + ให้ user เคาะ

**Conflict Protocol** (ref ใหม่ชน decision เดิม): อ่าน `system/DECISIONS.md` ทั้งหมด → ระบุว่าขัดกับ D-xxx ไหนตรงไหน → เสนอ 3 ทางเสมอ (**Supersede** / **Merge** / **Archive** ไป `system/refs/archive/` พร้อมโน้ต ห้ามลบ) → ถ้าเห็นด้วยตาได้ render ลง lab ก่อนเคาะ → lock ผลตามด้วย

---

## 10. Quality Gates (ทุก component ต้องผ่านก่อนเข้า docs)

1. **No-hardcode lint** — ห้ามมี hex/px ดิบใน component code, ห้ามมี physical property (left/right) ในที่ที่ต้องเป็น logical
2. **Contrast AA** (WCAG 2) ทุก state ทุก theme รวม `contrast-more` — พิจารณา APCA เมื่อกำกวม
3. **Keyboard nav** — ตาม a11y spec ของ component นั้น
4. **Type check + unit tests** — props/behavior รวม controlled/uncontrolled ทั้งสองโหมด
5. **Visual regression** — snapshot ทุก story รวม density mode ถ้าเกี่ยว
6. **Bundle budget** — tree-shakeable, size ต่อ component มีเพดาน
7. **Touch target** — hit area ≥44×44px บน touch
8. **Automated a11y (axe-core)** — รันทุก story ใน CI ไม่ใช่แค่ contrast check ตอน dev
9. **Style recipe checks** — ถ้า system มี style ที่ผูก recipe (§8.4) ต้องผ่านเช็คเพิ่มของ recipe นั้นด้วย
10. **Mobile-first checks** (เมื่อ platform = mobile-first/both) — hover เป็น enhancement เท่านั้น (ข้อมูล/ฟังก์ชันต้องเข้าถึงได้ทาง tap/focus ด้วย), ทุก story ต้องดูรู้เรื่องที่ 390px ก่อน 1280px

---

## 11. Docs Site Structure (แบบ MUI)

```
/                      landing + install command
/getting-started       install, setup provider, theming quick start
/foundations/          colors, typography, spacing, sizing, grid, motion, icons, density
                       (แต่ละหน้า: ตาราง token + ตัวอย่างเห็นภาพ + copy ค่า)
/components/{name}     live demo + code toggle + API table + a11y + Do/Don't
/theming               สร้าง theme ใหม่, dark mode, contrast-more, density mode, custom brand
/content-guidelines    voice & tone, error message pattern, empty state copy, capitalization
/tokens                วิธีใช้ token ตรงๆ (CSS vars / Tailwind / SCSS)
/changelog
```

Storybook แยกเป็น workshop (dev เล่น controls) — docs site เป็นหน้าบ้าน (เหมือน mui.com)

---

## 12. Governance & Content Layer

ชั้นที่ทำให้ระบบเป็น "design system จริง" ไม่ใช่แค่ component library:

- **Content guidelines** — voice & tone, รูปแบบ error message, empty state copy, capitalization rules — เก็บที่ `content/voice-and-tone.md`, publish ขึ้น `/content-guidelines`
- **Governance** — deprecation policy (เตือน 2 minor ก่อนลบ), contribution model, RFC process, semver policy (token เปลี่ยนค่า = minor, ลบ/เปลี่ยนชื่อ = major)
- **Figma sync** — tokens DTCG → Figma Variables (ผ่าน Tokens Studio) ให้ designer กับโค้ดใช้ค่าชุดเดียวกัน — ทำหลัง Phase 2 เมื่อ token คงตัวแล้ว
- **Automated a11y ใน CI** — axe-core รันทุก story ทุก PR ไม่ใช่แค่ contrast check ตอน dev (ดู §10.8)

---

## 13. Scaling to MUI-X class

รายละเอียดเต็มที่ `docs/SCALING.md` — สรุปกลไกที่ปิด 4 ข้อกังวลของการสเกล:

1. **ปริมาณ (100+ components)** → `production-run` waves: ~10 checkpoint แทน 300 ครั้ง, resume ได้ทุก session จาก `system/STATE.md`
2. **ทศวรรษของ edge cases** → สืบทอด behavior จาก React Aria/Radix/TanStack (ไม่ไล่เก็บบั๊กเอง) + Hardening Harness: Playwright matrix (Chromium/WebKit/Firefox × 390/1280), axe ทุก story, RTL snapshot, IME test, forced-colors snapshot
3. **X-class components** → ทุกตัวใน catalog ระบุ engine ที่ยืนอยู่ (§5) — เขียนชั้น token+UX เท่านั้น ไม่เขียน engine เอง
4. **Trademark** → ห้ามตั้งชื่อ system ว่า Material/MUI หรือชื่อ trademark อื่น ศึกษาโค้ด open source ได้ ห้าม copy docs/brand

**นิยามความสำเร็จที่ซื่อสัตย์:** โครงสร้าง+a11y+docs เทียบชั้น MUI ได้จริง — ความเก๋าจาก user นับหมื่นต้องแลกด้วยการถูกใช้งานจริง Hardening Harness คือการซื้อเวลาส่วนนั้นล่วงหน้าให้มากที่สุด

---

## 14. Roadmap สร้างตัว Factory เอง

| Milestone | ทำอะไร | Definition of Done |
|-----------|--------|-------------------|
| M0 | เขียน skill spec + Decision Log format + คลัง default scales | blueprint นี้กลายเป็น skill files |
| M1 | Intake + Foundation Inference (แกะจากภาพ 1 ใบได้) | โยน screenshot → ได้ข้อเสนอ scales ครบ รวม sizing/density |
| M2 | Token Architect + build pipeline | ได้ npm package tokens ที่ import ใช้ได้ รวม token categories ครบ §3.4 |
| M3 | Component Engineer: Layout + 5 atoms แรก | Button/Input/etc ผ่าน QA ครบ 9 ข้อ + API standards §7 |
| M4 | Storybook + docs site generator | เปิดเว็บดู component ได้แบบ MUI |
| M5 | Tier 2-3 + publish flow + versioning | end-to-end: ref → เว็บ docs + npm |
| M6 | Governance + content layer + Figma sync | `/content-guidelines` live, deprecation policy ใช้จริง |
| M7 | Layout Lab + `production-run` waves | เห็น candidate ก่อนเลือกทุกครั้ง, ผลิต 100+ ตัวได้โดย checkpoint ~10 ครั้ง |
| M8 | System Sheet + multi-system (`new-system`) | โปสเตอร์สรุป refresh อัตโนมัติ, สลับงานใหม่ได้โดยไม่ปนกัน |

---

## 15. Open Questions (ตัดสินใจก่อนเริ่ม M0 — ยังไม่ lock เป็น decision จริงจนกว่า user ยืนยันใน Phase 1 ของแต่ system)

1. Styling ภายใน component: CSS Modules + vars / vanilla-extract / Tailwind internal? (แนะนำ: CSS vars + CSS Modules — เบาสุด lock-in ต่ำสุด)
2. Headless base: เขียนเอง หรือยืม behavior จาก Radix/React Aria แล้วห่อด้วย token ของเรา? (แนะนำ: React Aria/Radix — a11y ยากมาก อย่า reinvent)
3. Docs site: Storybook autodocs อย่างเดียวพอ หรือ Next.js site แยก? (แบบ MUI จริงๆ = site แยก, Storybook เป็น workshop)
4. Icon set: วาดเอง / ยืม Lucide แล้ว re-export ผ่าน icon grid ของเรา?
5. Polymorphic API: `asChild` หรือ `as` prop? (แนะนำ: `asChild` — ดู §7)

---

## 16. Claude Code Setup (ทำงานใน terminal)

### 16.1 Mapping: agent ใน blueprint → primitive ของ Claude Code

| Blueprint | Claude Code primitive | ไฟล์ |
|-----------|----------------------|------|
| Orchestrator | main session + `CLAUDE.md` | `CLAUDE.md` (root) |
| 6 specialist agents | **Subagents** (context แยก ไม่เปลือง main context) | `.claude/agents/*.md` |
| Workflow ความรู้ (สร้าง component ยังไง, lock decision ยังไง, ผลิตเป็น wave ยังไง) | **Skills** | `.claude/skills/*/SKILL.md` |
| บังคับกฎแบบ deterministic (lint no-hardcode หลังแก้ไฟล์) | **Hooks** | `.claude/settings.json` |
| Decision Log ของ system ปัจจุบัน | ไฟล์ธรรมดาใน repo | `system/DECISIONS.md` |
| Ref images ของ system ปัจจุบัน | โฟลเดอร์ + อ่านด้วย multimodal | `system/refs/` |

หลักจำ: **Skills = ความรู้ (how-to), Subagents = คนงานที่มี context แยก, Hooks = กฎที่รันเสมอไม่ว่า agent จะทำอะไร**

### 16.2 Checklist ติดตั้งตามลำดับ (ครั้งแรกที่ใช้ kit)

```bash
node -v
npm install -g @anthropic-ai/claude-code
corepack enable && corepack prepare pnpm@latest --activate
# แตกไฟล์ kit นี้ทับลง repo (.claude/ ต้องอยู่ root)
pnpm init && pnpm add -D turbo
pnpm add -D style-dictionary --filter tokens   # หรือ terrazzo
claude
```
แล้วพิมพ์: `อ่าน CLAUDE.md แล้วเริ่ม Phase 0 กับ system/refs/`

### 16.3 Hooks ที่ตั้งไว้แล้ว (ตัวบังคับกฎเหล็ก)

- **PostToolUse (Edit/Write)** → รัน no-hardcode lint ทันทีที่ agent แก้ไฟล์ component — ถ้าเจอ hex/px ดิบ หรือ physical property ให้ fail ดังๆ agent จะแก้เอง
- **PreToolUse (Edit บน `system/DECISIONS.md`)** → เตือนว่าแก้ decision ที่ lock แล้ว = ต้องประเมิน impact ก่อน

**ข้อควรระวัง:** อย่าเพิ่ง add MCP servers เยอะ — กิน context หนัก เริ่มจาก skills+subagents+hooks ให้ workflow นิ่งก่อน ค่อยเติม Playwright MCP ตอนถึงขั้น visual QA ของ Storybook (playwright ใช้ render system-sheet อยู่แล้วเป็น dev dependency เล็กๆ ไม่ใช่ MCP)

📖 Docs ทางการ: https://code.claude.com/docs/en/skills (skills), https://code.claude.com/docs/en/sub-agents (subagents)

---

## 17. Keywords ให้ไปศึกษาต่อ

`OKLCH` · `APCA` (contrast algorithm ของ WCAG 3 draft — แม่นกว่า WCAG 2 ratio) · `Utopia fluid type` · `CSS logical properties` · `forced-colors` · `CSS cascade layers` · `container queries` · `compound components` · `asChild pattern` · `polymorphic components` · `Tokens Studio` · `Style Dictionary transforms` · `design lint` · `density scale` · `colorblind-safe categorical palette` · `progressive disclosure (docs)`

---

ดู `docs/KIT-CHANGELOG.md` สำหรับ version history ของตัวโรงงาน (kit) ไม่ใช่ของ design system ที่ผลิตออกมา
