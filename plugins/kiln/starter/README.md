# kiln — โรงงานผลิต Design System (วางลง repo แล้วเริ่มได้เลย)

**หลักการ:** kit นี้คือโรงงาน ไม่มีสไตล์เป็นของตัวเอง — decision ทั้งหมด (สไตล์, platform, สี, ฯลฯ) อยู่ใน `system/` เท่านั้น สลับงานใหม่ด้วย `/new-system {ชื่อ}` โดยไม่ปนกัน

## ติดตั้ง (Session 0)
```bash
mkdir design-system && cd design-system && git init
# แตกไฟล์ kit นี้ทับลงไป (ทั้ง .claude/ ต้องอยู่ root ของ repo)
npm install -g @anthropic-ai/claude-code   # ถ้ายังไม่มี
corepack enable && corepack prepare pnpm@latest --activate
git add -A && git commit -m "chore: kiln factory"
claude
```
แล้วพิมพ์: `อ่าน CLAUDE.md แล้ว scaffold monorepo ตาม docs/BLUEPRINT.md ข้อ 2`

## เริ่มงานจริง
1. ลากภาพ ref ใส่ `system/refs/`
2. พิมพ์: `เริ่ม Phase 0 กับ system/refs/`
3. ตอบคำถามทีละข้อ (ข้อ 0 = platform ก่อนเสมอ) → agent จะ `/lock-decision` ให้เอง → ถ้าเป็นเรื่องเห็นด้วยตาได้ จะ render ให้ดูใน `apps/lab/` ก่อนถาม → ไล่ phase ตามลำดับ
4. เริ่มงานใหม่คนละ system? สั่ง `/new-system {ชื่อ}` — ระบบเดิมจะถูกเก็บไว้ที่ `systems-archive/{ชื่อเดิม}/` ไม่ลบ

## Memory ของระบบ (สำคัญ)
| ไฟล์ | ทำหน้าที่ | ใครเขียน |
|------|-----------|----------|
| `CLAUDE.md` | กฎถาวรของโรงงาน — โหลดอัตโนมัติทุก session | คุณ (แก้ได้) |
| `system/DECISIONS.md` | ความจำระยะยาวของ system ปัจจุบัน: ทุกอย่างที่ lock | skill `lock-decision` เท่านั้น |
| `system/STATE.md` | ความจำใช้งาน: อยู่ไหน ค้างอะไร ต่ออะไร | agent อัพเดตทุก task ใหญ่ |
| `system/reports/` | หลักฐานจาก ref | subagent `intake` |
| `system/sheets/` | โปสเตอร์ PNG สรุประบบ (timeline วิวัฒนาการ) | skill `system-sheet` |
| `apps/lab/candidates.js` | ตัวเลือกเชิงภาพที่รอ user เทียบ/ตัดสิน | agent ต่างๆ ตอน PROPOSE→RENDER |
| hooks | กฎที่ไม่พึ่งความจำเลย (รันเสมอ) | `.claude/settings.json` |

เปิด session ใหม่เมื่อไหร่ agent อ่าน `CLAUDE.md` + `system/STATE.md` + `system/DECISIONS.md` แล้วทำงานต่อจากเดิมได้ทันที
สั่งแค่คำว่า `ทำต่อ` ก็พอ

## โครงไฟล์
```
CLAUDE.md                          กฎ orchestrator ของโรงงาน
README.md                          ไฟล์นี้
docs/
├── BLUEPRINT.md                   engine spec ฉบับเต็ม (อ่านเมื่อต้องรายละเอียด)
├── KIT-CHANGELOG.md                version history ของตัวโรงงาน
├── CATALOG.md                      component inventory 103 ตัว / 10 waves (ปรับจาก 108 เดิม —
│                                   ดู D-017/D-022 ใน system/DECISIONS.md)
├── SCALING.md                      กลไกสเกลถึงระดับ MUI-X
└── style-recipes/                  recipe ต่อสไตล์ที่มีความเสี่ยง a11y (เช่น neumorphism.md)
system/                            *** ของ system ที่กำลังทำอยู่ — ไม่ share ข้าม system ***
├── DECISIONS.md                    locked decisions
├── STATE.md                        working memory
├── refs/                           โยนภาพ ref ที่นี่ (archive/ เก็บ ref ที่แพ้)
├── reports/                        extraction reports
└── sheets/                         System Sheet PNG (เก็บทุกใบ)
templates/system/                  blank template สำหรับ /new-system scaffold ใหม่
apps/
├── lab/                            Layout Lab — เทียบ candidate ก่อน CONFIRM
└── sheet/                          System Sheet generator (template.html + render.mjs)
tooling/no-hardcode-lint.mjs
.claude/
├── settings.json                   hooks
├── agents/                         subagents 6 ตัว (intake, foundation-inference, token-architect,
│                                   component-engineer, qa-a11y, docs-publisher)
└── skills/                         ds-conventions · new-component · lock-decision ·
                                    production-run · new-system · system-sheet · abstract-interpreter
```
