# Style Recipe — Neumorphism (Braun-derived)

> เงาทำหน้าที่อารมณ์ 100% แต่ห้ามแบกข้อมูลใดๆ ทั้งสิ้น
> ค่าคงที่: แสงจากบนซ้ายเสมอ — เงาทุกตัว derive จากมุมเดียวกัน

## 5 กฎเอาตัวรอด (QA บังคับทุกข้อ)
1. **Material offset** — canvas / surface.raised / surface.inset ต้องห่างกันเป็น lightness step บน neutral ramp (default: canvas=neutral.75, raised=neutral.0, inset=neutral.150) ขอบ element ยืนได้โดยไม่มีเงา
2. **Hairline armor** — interactive ทุกตัวมี `border.hairline` (1px, neutral.300 ขึ้นไป) — คือเหตุผลที่รอดใน forced-colors mode ที่เงาถูกลบทั้งจอ
3. **No-shadow-only states** — ทุก state change มี non-shadow cue ≥1: pressed = shadow.inset **+ fill เข้ม 1 stop**, disabled = ลด contrast ของ fill+text ไม่ใช่ลบเงาเฉยๆ
4. **Ink & accent ไม่ต่อรอง** — text ≥4.5:1, action accent ≥3:1 บน canvas, focus ring = accent ทึบ 2px + offset 2px ห้ามใช้เงาแทน ring
5. **Adaptive fallback** — `prefers-contrast: more` = ปิดเงา + border เข้มขึ้น 2 stop · dark mode = เงาไร้ผล ใช้บันได surface lightness แทน (ยิ่งสูงยิ่งสว่าง) · forced-colors ผ่านอัตโนมัติจากกฎ 2

## Tokens ที่ต้องมี (token-architect)
- `shadow.raised.sm|md|lg` — composite เงาคู่: [สว่าง −x,−y] + [มืด +x,+y] จากมุมแสงเดียว
- `shadow.inset.sm|md` — กลับทิศ สำหรับ pressed / input / ร่องสไลเดอร์
- `surface.canvas / surface.raised / surface.inset / surface.overlay` — บันได lightness ทั้ง light และ dark
- `border.hairline` + `border.hairline-strong` (สำหรับ prefers-contrast)
- `overlay.hover / overlay.pressed` — alpha บางๆ ทับ fill (non-shadow cue สำเร็จรูป)

## เช็คเพิ่มของ qa-a11y เมื่อ style นี้ active
- ทุก interactive มี border.hairline จริง (grep ได้)
- ไม่มี state ไหนต่างจาก default ด้วยเงาอย่างเดียว
- มี `@media (prefers-contrast: more)` block ในชั้น theme
- snapshot forced-colors: element ยังแยกจากพื้นได้
