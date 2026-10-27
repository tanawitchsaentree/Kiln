# Style Recipe — Braun Flat (hairline-armored, no decorative shadow)

> ขอบ/definition มาจาก border+fill เท่านั้น เงาไม่มีหน้าที่ตกแต่งเลย
> ต่างจาก neumorphism ตรงจุดนี้: ไม่มีเงาคู่จำลองความนูน — ความสงบมาจากพื้นผิวเรียบ + สีสงวนจุดเดียว (D-001)

## 5 กฎเอาตัวรอด (QA บังคับทุกข้อ)
1. **No decorative shadow** — card/button/input ปกติห้ามมี drop-shadow เพื่อความสวยงามเด็ดขาด ใช้ `border.hairline` (1px, neutral.200-300) สร้างขอบ/definition แทนเสมอ
2. **Elevation สงวนไว้เฉพาะ "ลอยจริง"** — shadow ใช้ได้เฉพาะ layer ที่ลอยเหนือ content จริง (modal, popover, toast, dropdown) ระดับ 0-2 เบาๆ เท่านั้น ห้ามใช้กับ element ที่นิ่งอยู่ใน flow ปกติ
3. **Accent scarcity (สืบทอดจาก D-001)** — `color.action.primary` (accent เข้ม) ใช้ได้เฉพาะ interactive element ที่สำคัญที่สุดของ view นั้นเท่านั้น ห้ามใช้ตกแต่ง/เน้นข้อความทั่วไป/ไอคอนรอง — เช็คได้ด้วยการนับจำนวน element ที่ใช้ accent ต่อหน้าจอ (ควรเป็นหลักเดียว)
4. **No-shadow-only states** — ทุก state change ต้องมี non-shadow cue ≥1: hover = fill/border เปลี่ยน (ไม่ใช่เงาลอยขึ้น), pressed = fill เข้ม 1 stop + border เข้มขึ้น, disabled = ลด contrast ของ fill+text
5. **Adaptive fallback** — `prefers-contrast: more` = border เข้มขึ้น 2 stop (ไม่มีเงาให้ปิดอยู่แล้วตามกฎ 1) · dark mode = ใช้บันได surface lightness แทนเงาเสมอ (ยิ่งสูงยิ่งสว่าง) เหมือน neumorphism recipe · forced-colors ผ่านอัตโนมัติจากกฎ 1

## Tokens ที่ต้องมี (token-architect)
- `border.hairline` + `border.hairline-strong` (สำหรับ prefers-contrast) — ตัวหลักที่แทนเงาทั้งระบบ
- `shadow.elevation.sm|md|lg` — composite เบา ใช้เฉพาะ modal/popover/toast/dropdown เท่านั้น (ไม่ใช่ทุก raised element)
- `surface.canvas / surface.raised / surface.inset / surface.overlay` — บันได lightness (warm neutral ตาม D-006) ทั้ง light และ dark ใช้แยก layer โดยไม่พึ่งเงา
- `overlay.hover / overlay.pressed` — alpha บางๆ ทับ fill (non-shadow cue สำเร็จรูปสำหรับ hover/pressed)

## เช็คเพิ่มของ qa-a11y เมื่อ style นี้ active
- grep ไม่พบ `box-shadow` บน card/button/input/badge ปกติ (เจอได้เฉพาะ modal/popover/toast/dropdown)
- ทุก interactive มี `border.hairline` จริง
- ไม่มี state ไหนต่างจาก default ด้วยเงาอย่างเดียว
- นับจำนวน element ที่ใช้ `color.action.primary` ต่อ story/view — ถ้าเกิน 1-2 จุดต่อ view ให้ flag ว่าขัด accent scarcity
- มี `@media (prefers-contrast: more)` block ในชั้น theme
