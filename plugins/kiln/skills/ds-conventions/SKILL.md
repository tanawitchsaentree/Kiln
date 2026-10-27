---
name: ds-conventions
description: มาตรฐานกลางของ design system นี้ — Anatomy Contract 9 ข้อ, naming, โครงไฟล์ component, กฎ token ใช้ทุกครั้งที่สร้างหรือรีวิว component/token หรือเมื่อสงสัยว่ามาตรฐานคืออะไร
---

# DS Conventions

## Rigor Tiers (ORDERS C1 — เลิกทำทุก component เท่ากัน)
> ที่มา: user สั่งให้ลดต้นทุนการผลิต 3-5 เท่าหลัง Wave 5 — Anatomy Contract 9 ข้อ + full QA gate ทุกตัว
> เท่ากันไม่ว่าจะเป็น `Spacer` (ไม่มี behavior อะไรเลย) หรือ `Listbox` (React Aria + roving focus +
> ARIA pattern เต็ม) เป็นการเผา token ผิดที่ — component ที่ไม่มีอะไรให้พังไม่ควรผ่าน pipeline
> เดียวกับตัวที่พังได้หลายมิติ

| Tier | ตัวอย่าง | ต้องมี | ไม่ต้องมี |
|---|---|---|---|
| **T1 static** | Spacer, Divider, VisuallyHidden, Center, AspectRatio, Skeleton, Badge | lint, tsc, story, spec doc, contrast check | conformance spec, Gate Proof, QA รันซ้ำ (diff-review พอ) |
| **T2 interactive** | Button, Input, Card, Alert, Avatar, Link | + unit test (interaction + axe), QA review **diff** ไม่ใช่รันซ้ำทั้งชุด | Gate Proof mutation, conformance spec (ยกเว้นมี hover-only cue ที่ forced-colors ต้อง verify) |
| **T3 keyboard/focus** | Listbox, Select, Combobox, Menu, Dialog, Drawer | ทุกอย่าง + conformance (Playwright) + Gate Proof (mutation เดี่ยว+รวม ตาม Compound Invariant Clause) | — (ครบทุกข้อ ไม่มีข้อยกเว้น) |

**เกณฑ์ตัดสิน tier (T1↔T3 ตามที่ user กำหนดไว้ตรงๆ — T1↔T2 boundary เป็นส่วนที่ขาด ต้องเติมเองให้ชัดก่อนใช้จริง เขียนไว้ตรงนี้เพื่อไม่ให้ agent แต่ละตัวตีความเองคนละแบบ):**
- **T1 vs สูงกว่า:** component มี interactivity จริงไหม (มี `onClick`/`onChange`/state ที่เปลี่ยนตาม user action) — **ไม่มีเลย = T1** (ต่อให้มี `:hover` ใน CSS ก็นับเป็น decorative ไม่ใช่ interactivity ถ้าไม่ได้ผูกกับ prop/state อะไร)
- **T2 vs T3:** ถามคำถามนี้ — component มี **focus management** (focus trap, focus restore) / **keyboard nav ที่เกินกว่า native Tab** (arrow-key, roving tabindex, typeahead) / **overlay หรือ portal** / **state ที่ซับซ้อนพอจนต้องมี ARIA live region หรือ state machine** ข้อใดข้อหนึ่งไหม → **มีอย่างใดอย่างหนึ่ง = T3** ทันที (ไม่ต้องมีครบทุกข้อ) · **ไม่มีเลยแต่ผ่านเกณฑ์ T1 ไม่ได้ (มี interactivity จริง) = T2** — ตัวอย่าง: Button มี `onClick`+states แต่ keyboard behavior ทั้งหมดมาจาก native `<button>` เปล่าๆ ไม่มี roving/overlay → T2 · Listbox มี roving tabindex+typeahead จาก React Aria → T3 ทันทีแม้จะไม่มี overlay ของตัวเอง
- **เมื่อไม่แน่ใจ:** เลือก tier สูงกว่า ไม่ใช่ต่ำกว่า (ผิดพลาดด้านเข้มงวดเกินไป ปลอดภัยกว่าหลวมเกินไป)
- **Component ที่ QA เจอ finding จริงระหว่าง diff-review (T1/T2)** ต้อง escalate เป็นรันซ้ำเต็มรอบทันที ไม่ใช่แก้แล้วถือว่าจบ — diff-review คือการประหยัดต้นทุนสำหรับ component ที่ "ไม่ค่อยพัง" ไม่ใช่ใบอนุญาตให้ปิดตาข้าม finding ที่เจอจริง

## Anatomy Contract — Definition of Done ของทุก component (ครบ 10 ข้อเท่านั้นถึงนับว่าเสร็จ)
> ข้อ 10 (matches FORM GOAL) เพิ่มโดย skill `form-language` — Anatomy Contract เดิมคุม
> behavior/API/states ไม่มีข้อไหนคุม form (silhouette/depth/corner) มาก่อน นี่คือช่องที่ปิด
1. Anatomy: ชิ้นส่วนภายในมีชื่อครบ
2. Variants ประกาศครบ (เช่น Button: solid/outline/ghost/link × primary/neutral/danger)
3. Sizes ตาม t-shirt mapping ที่ lock ใน system/DECISIONS.md
4. States: default, hover, active, focus-visible, disabled + loading/error/read-only/indeterminate/selected ตามที่เกี่ยว
5. Tokens consumed: ลิสต์ component tokens ทั้งหมด — ไม่มีค่าดิบ
6. A11y spec: role/ARIA, keyboard map, focus behavior, SR notes
7. API: TS interface + defaults + forwardRef + asChild (ถ้า interactive) + controlled/uncontrolled (ถ้า input)
8. Stories: ทุก variant × size + states + playground
9. Docs page: demo, code, API table, Do/Don't, a11y, related
10. **Matches FORM GOAL** (G-F2): component spec มี FORM GOAL section ที่ trace ได้ตรงกับ
    `system/FORM.md`'s class table จริง (silhouette/depth/corner/label/pressed-metaphor ตาม class
    ของมัน) ไม่ใช่ค่าที่เดาเอง — identity component (Button/Input/Switch/Checkbox/Card/Slider)
    ต้องมี D-xxx entry ที่อ้าง multi-candidate lab screenshot ด้วย (G-F3)

## โครงไฟล์ต่อ component
```
packages/react/src/components/{Name}/
├── {Name}.tsx
├── {Name}.module.css      # CSS vars เท่านั้น, logical properties เท่านั้น
├── {Name}.stories.tsx
├── {Name}.test.tsx        # interaction + axe
└── index.ts
```
Token ของมัน: `packages/tokens/src/component/{name}.json`

## Naming
- Tokens: `{category}.{concept}.{property}.{variant}.{state}` · space.* ≠ size.* (คนละ namespace)
- CSS vars: `--ds-{token-path-kebab}` เช่น `--ds-button-bg-primary-default`
- Components: PascalCase · props: camelCase · variant values: lowercase

## ลำดับ dependency (ห้ามข้าม)
Layout primitives (Box, Stack, Grid, Container) → Tier 1 atoms → Tier 2 molecules → Tier 3 organisms

## Honesty Rule (บังคับทั้งระบบ)
ห้ามเคลมสิ่งที่ test ปัจจุบันทำให้มันแดงไม่ได้ · คำว่า verified ใช้ได้เฉพาะเมื่อมี test ที่จะ fail ถ้าพฤติกรรมหายไป · ที่เหลือเขียน `UNVERIFIED: {อะไร} (ต้องใช้ {เครื่องมือ})`

## Gate Proof Rule (Honesty Rule เวอร์ชันใช้กับเครื่องมือ — บังคับทั้งระบบ)
> ที่มา: no-hardcode-lint มีรูสองรอบ (W1 sizing/physical-inset หลุด, w5-preflight logical-property
> regex ไม่เห็น `-inline-start`/`-block-end` เลย) — เจอด้วยการรีวิว+โชคทั้งคู่ ไม่ใช่ระบบตรวจตัวเอง
> ปัญหาจริงไม่ใช่ regex พัง แต่คือ **ไม่มีอะไรพิสูจน์ว่า gate จับได้จริงก่อนเอาไปใช้**

**ทุกกฎ lint และทุก conformance helper ต้องมาพร้อมหลักฐานว่ามันแดงได้จริง ก่อนถือว่าใช้งานได้:**
1. **Mutate** — แก้โค้ด/CSS ให้ผิดตรงกับสิ่งที่กฎนี้ควรจับ (ตั้งใจทำผิดจริง ไม่ใช่เดา)
2. **Confirm red** — รันกฎ/test แล้วต้องแดงจริง ถ้าไม่แดง = กฎนี้ยังพิสูจน์ไม่ได้ว่ามีอยู่จริง ห้ามถือว่าใช้งานได้จนกว่าจะแก้
3. **Revert** — เอาโค้ดที่ mutate กลับคืนของเดิม ยืนยันเขียวอีกครั้ง
4. **เก็บเป็นหลักฐานถาวรถ้าทำได้** — ถ้า mutate-confirm-revert ทำเป็น automated test ได้ (เช่น conformance spec ที่ mutate ผ่าน fixture แล้วเช็ค) ให้เก็บไว้เป็น regression test จริง ไม่ใช่แค่รันมือครั้งเดียวแล้วทิ้ง — ถ้าทำเป็น automated ไม่ได้ (เช่น lint rule ที่ทดสอบกับไฟล์ทดสอบชั่วคราว) ให้บันทึกขั้นตอน mutate ที่ใช้ไว้ใน comment ของกฎนั้นเพื่อให้รอบหน้า reproduce ได้

**กฎที่ไม่เคยเห็นตัวเองแดง = ยังไม่พิสูจน์ว่ามีอยู่จริง** — ห้ามส่งมอบ lint rule/conformance helper ใหม่โดยไม่ผ่านขั้นตอนนี้ ไม่ว่าจะดูสมเหตุสมผลแค่ไหนตอนเขียน (v3's logical-property regex ก็ "ดูสมเหตุสมผล" ตอนเขียนเหมือนกัน)

### Compound Invariant Clause (เพิ่มจาก Listbox's `expectTabOut` — mutation เดี่ยวไม่แดง 2 รอบ)
> ที่มา: `expectTabOut` (roving-focus.md ข้อ 8) mutate เดี่ยว 2 แบบ (`tabIndex={0}` ทุก option / ลบ
> `listBoxProps` จาก root) ไม่แดงทั้งคู่ — ตอนแรกเกือบสรุปว่า "helper ใช้ได้ เพราะพฤติกรรมมีหลายชั้น
> cover กัน (redundancy)" **โดยไม่ได้เปิดเบราว์เซอร์พิสูจน์จริง** user สั่งให้เคลียร์ก่อนว่าอันไหนคือ
> redundancy จริง อันไหนคือ test อ่อน — ผลจริง: (a) เป็น degradation จริงที่ assertion เดิมจับไม่ได้
> (test อ่อน) (b) เป็น redundancy จริง (คนละ layer cover กันจริง) — ทั้งสองแบบมีทั้งคู่ ต้องแยกแยะทีละ
> เคส ห้ามเดา

**ถ้า helper/rule ครอบพฤติกรรมที่มีมากกว่า 1 mechanism ทำงานร่วมกัน (เช่น per-item property + parent
collection handler) ต้องทำตามลำดับนี้ ไม่ใช่ mutate รวมแล้วถือว่าจบ:**
1. **Mutate เดี่ยวทีละ mechanism** ก่อนเสมอ (ไม่ mutate รวมตั้งแต่แรก) แล้วรัน test
2. **ถ้า mutation เดี่ยวไม่แดง ห้ามสรุปเองว่า "redundancy เลยไม่เป็นไร"** — ต้อง**เปิดดูพฤติกรรมจริงใน
   เบราว์เซอร์** (เช่น log focus event sequence, inspect DOM attribute หลัง mutate) แล้วตอบให้ได้ว่า:
   - **พฤติกรรมยังถูก 100% จริง** (ไม่ใช่แค่ assertion ที่เช็คอยู่ผ่าน) → เป็น **redundancy จริง** — บันทึก
     **layer map** ไว้ในกฎ/helper นั้นว่า mechanism ไหน cover mechanism ไหน (เช่น "`optionProps`'s
     per-item tabindex เพียงพอเองสำหรับ invariant นี้ — `listBoxProps`'s handler เป็น extra safety net
     สำหรับเคส nested-tabbable-children ที่ component นี้ไม่มี")
   - **พฤติกรรมเสียบางส่วนจริง แต่ assertion เดิมไม่ครอบ degradation ระดับนั้น** → เป็น **test อ่อน** —
     ต้องเพิ่ม/แก้ assertion ให้จับ degradation นั้นได้ (ไม่ใช่แค่เช็คปลายทางที่ยัง "ดูถูก" อยู่ผิวๆ)
3. **Mutate รวมทุก mechanism พร้อมกัน** เพื่อพิสูจน์ compound failure ด้วย (ทำเพิ่ม ไม่ใช่ทำแทนขั้น 1-2)
4. **Revert ทุกอย่าง ยืนยันเขียว** ตามขั้นตอนปกติของ Gate Proof Rule ข้อ 3

**"Mutate เดี่ยวไม่แดง" ไม่ใช่ข้อสรุปในตัวมันเอง** — เป็นแค่จุดเริ่มของการสืบต่อว่าเป็น redundancy หรือ
test อ่อน ห้ามปิดเคสโดยไม่ทำขั้น 2 ให้จบด้วยหลักฐานจากการรันจริง (ไม่ใช่อ่าน node_modules/docs เดา)

### Repeat-Instance Clause (บั๊กคลาสเดียวกันเจอครั้งที่สาม = ต้องเขียน gate ไม่ใช่แก้ instance)
> ที่มา: "เลขที่พิมพ์มือแล้ว drift เงียบๆ" เจอ**หกครั้ง** — README ค้าง 108 · CATALOG หัวเรื่องค้าง 108 ·
> BLUEPRINT §5 เขียน 108 · DISTRIBUTION เขียน 108 · CHANGELOG เขียน "48 components" ที่ควรเป็น 46 ·
> "43/103" ที่จริงคือ 42 — **ทั้งหกครั้งแก้ถูกทุกครั้ง และไม่มีครั้งไหนช่วยอะไรเลย** เพราะแก้ instance
> ไม่ได้ปิดคลาส (instance ที่ 2 เจอหลัง "แก้เสร็จ" ไปแล้วสามเซสชัน) · ครั้งที่หกจึงเขียน
> `tooling/doc-count-check.mjs` แล้วมันจับ instance ที่ยังไม่มีใครเห็น (DISTRIBUTION) ได้**ตอนรันครั้งแรก**

**เจอบั๊กคลาสเดิมเป็นครั้งที่ 3 = หยุดแก้ instance แล้วถามว่า "อะไรที่ทำให้บั๊กนี้เงียบได้" แล้วปิดทางนั้น:**
1. **derive แทน declare ถ้าทำได้** — เลขที่คำนวณจาก source of truth ได้ ห้ามพิมพ์มือ (catalog total = ผลรวม
   per-wave marker ของ CATALOG.md เอง, shipped count = อ่านจาก `barrel.manifest.mjs`)
2. **ถ้า derive ไม่ได้ ต้องมี gate ที่แดงเมื่อ prose ขัดกับความจริง** — และ gate นั้นต้องผ่าน Gate Proof Rule
   เต็มรูปแบบเหมือน gate อื่นทุกตัว (two-sided proof + one-branch-one-proof)
3. **wire เข้า chain แล้ว gate-proof การ wire ด้วย** — script ที่ define แล้วแต่ chain ไม่เคยเรียกจริง
   = gate ที่ไม่มีตัวตน (เคยเกิดแล้วกับ `barrel:check`/`story:check`) ต้องเห็น chain แดง**ตรงขั้นนั้น**
   และหยุดก่อนขั้นถัดไป แล้ว revert ให้ byte-identical
4. **ยกเว้นไฟล์ append-only ให้ชัดเจนในตัว gate** — `docs/KIT-CHANGELOG.md` และ `system/DECISIONS.md` เลข
   108 คือ**ความจริงตอนที่เขียน** การไปแก้ย้อนหลังให้ตรงปัจจุบันคือสิ่งที่ไฟล์สองตัวนี้มีไว้เพื่อป้องกัน

**"แก้แล้ว" กับ "ปิดคลาสแล้ว" ไม่ใช่เรื่องเดียวกัน** — รายงานว่าแก้ instance ที่ N ได้ แต่ถ้ายังไม่มีกลไก
กันไม่ให้มี instance ที่ N+1 ต้องบอกตรงๆ ว่าคลาสยังเปิดอยู่ (Honesty Rule)

## Definition of Done เพิ่ม (ข้อ 10-11 ต่อจาก Anatomy Contract 9 ข้อ)
10. **Docs content เขียนตอนสร้าง ไม่ใช่ตอน Phase 6** — `packages/spec/{name}.md` ต้องมี: usage 3-5 บรรทัด, Do/Don't อย่างละ 2-3, a11y notes (keyboard map + SR behavior), props table, related components · Phase 6 มีหน้าที่แค่ประกอบเป็นเว็บ
11. **Browser-only behavior มี conformance spec** — keyboard nav / focus trap / positioning / non-color cue / hit area ต้องมีไฟล์ใน `packages/conformance/specs/` และรันเขียว (ข้อนี้ใช้กับ T2/T3 เท่านั้นตาม Rigor Tiers ด้านบน — T1 component ไม่มี browser-only behavior ให้ทดสอบตั้งแต่แรกโดยนิยาม ไม่ใช่ได้รับการยกเว้น)

## Exception Policy
ค่าที่ตกเกณฑ์แต่จะยอมรับ ต้องขึ้นทะเบียน `system/EXCEPTIONS.md` (E-xxx) พร้อมขอบเขตที่แคบที่สุด · System Sheet ต้องแสดง "AA · {n} exception" ห้ามประกาศ AA ลอยๆ
