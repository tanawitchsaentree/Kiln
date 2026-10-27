---
name: new-component
description: เริ่มผลิต component ใหม่ 1 ตัวตาม inner loop เต็มรูปแบบ ใช้เมื่อ user สั่ง /new-component {Name} หรือถึงคิว component ถัดไปตาม dependency order
disable-model-invocation: false
---

# New Component Loop

เมื่อถูกเรียกด้วยชื่อ component (เช่น `/new-component Button`):

1. **Pre-check:** อ่าน system/STATE.md + system/DECISIONS.md → ยืนยันว่า dependencies ของตัวนี้เสร็จแล้ว (เช่น FormField ต้องมี Input ก่อน) ถ้ายัง → แจ้งและเสนอทำ dependency ก่อน · **เช็ค Rigor Tier** (ds-conventions/SKILL.md, ORDERS C1) — กำหนดว่าข้อ 5 (Gate) ต้องทำแค่ไหน (T1/T2 = diff-review, T3 = รันเต็ม+Gate Proof)
2. **Propose API (+RENDER ถ้ามีทางเลือกเชิงภาพ):** variant/รูปทรงที่เลือกด้วยตาได้ ให้เขียน candidates ลง apps/lab/candidates.js ให้ user เปิดเทียบก่อน — ให้ subagent `component-engineer` เสนอ props interface + variants + sizes + states → สรุปให้ user ยืนยัน (คำถามเดียว: "API นี้โอเคไหม มีอะไรเพิ่ม/ตัด?")
   - **FORM GOAL (บังคับ, มาก่อนโค้ด):** รัน `form goal <component>` (skill `form-language`) — ดึง
     1-3 ประโยคจาก `system/FORM.md`'s class table (control/input/surface/display/separator) ตาม
     class ของ component นี้ ใส่เป็น section ในสเปคที่ส่งต่อ component-engineer — ห้ามให้
     component-engineer เดา silhouette/depth เอง ต้องมาจาก FORM.md เท่านั้น
   - **Identity component** (Button, Input, Switch, Checkbox, Card, Slider) **ต้องผ่าน multi-
     candidate lab round ก่อนสร้างจริง** — render ≥3 candidate ที่ต่างกันจริง (ดู
     `form-language/SKILL.md`'s "Multi-candidate lab rounds") ลง apps/lab ให้ user เลือกด้วยตา
     ก่อน lock — เสนอ candidate เดียวแล้วถือว่า confirm คือ process violation (G-F3)
3. **Lock:** บันทึก API ที่ยืนยันแล้วผ่าน /lock-decision
4. **Build:** component-engineer เขียน tokens → โค้ด → stories → tests (hook lint ทำงานอัตโนมัติทุกการแก้ไฟล์)
5. **Gate:** ส่งให้ subagent `qa-a11y` ตรวจ → ถ้า FAIL วนกลับข้อ 4 พร้อมรายการแก้ (สูงสุด 3 รอบ เกินนั้นหยุดถาม user)
6. **Ship:** PASS แล้ว → subagent `publisher` ทำ docs page + จัด Storybook + changeset
7. **Close:** อัพเดต system/STATE.md (เพิ่มเข้าลิสต์ผ่าน QA, ระบุตัวถัดไปตามลำดับ) + commit ข้อความ `feat({name}): complete per anatomy contract`
