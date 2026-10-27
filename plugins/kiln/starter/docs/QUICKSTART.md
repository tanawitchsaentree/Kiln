# Quickstart — 15 นาทีแรก

```bash
mkdir my-ds && cd my-ds && git init
# แตก kit ลงที่นี่ (.claude/ ต้องอยู่ root)
npm install -g @anthropic-ai/claude-code
corepack enable && corepack prepare pnpm@latest --activate
git add -A && git commit -m "chore: ds factory"
claude
```

พิมพ์ตามลำดับ:
1. `อ่าน CLAUDE.md แล้ว scaffold monorepo` → ได้โครง packages/apps ที่ build ผ่าน
2. *(ทางเลือก)* `npm create storybook@latest && npx storybook add @storybook/addon-mcp` → agent เห็น component ที่มีอยู่ + ได้ผล test อัตโนมัติ (ต้อง SB v10.3+, React) ข้ามได้ ระบบทำงานปกติ — ดู `docs/STORYBOOK-MCP.md`
3. `/new-system {ชื่อระบบของคุณ}` → เริ่ม memory เปล่า
4. ลากภาพ ref ลง `system/refs/` แล้ว `เริ่ม Phase 0`
5. ตอบคำถามทีละข้อ (platform → adapter → spacing → type → color → …) — ทุกรอบเชิงภาพจะได้ `apps/lab` ให้เทียบก่อนเคาะ
6. `/system-sheet` เมื่อไหร่ก็ได้ → PNG สรุประบบ
7. `เริ่ม production run W1` → ผลิตเป็น wave

**เริ่มจาก 0 ไม่มี ref?** ข้าม Phase 0 ได้เลย — พิมพ์ `เริ่ม Phase 1 แบบไม่มี ref` แล้วตอบคำถามจากบุคลิกที่อยากได้ (interpreter จะสัมภาษณ์แทนการแกะภาพ)

**มี design system อยู่แล้ว อยากย้ายเข้าระบบ?** วาง tokens/screenshot เดิมลง `system/refs/` แล้วบอกว่า `ingest ของเดิม` → agent จะ reverse-engineer เป็น DECISIONS + tokens 3 ชั้นให้

## ปุ่มลัดที่ใช้บ่อย
| สั่ง | ได้อะไร |
|---|---|
| `/new-system {ชื่อ}` | เริ่มระบบใหม่ (เก็บของเก่าเข้า archive) |
| `/new-component {Name}` | ผลิตทีละตัวครบ contract |
| `/lock-decision` | ปิดการตัดสินใจ + บันทึกหลักฐาน |
| `/system-sheet` | โปสเตอร์ PNG สรุประบบ |
| `production run W{n}` | ผลิตทั้ง wave |
| `port --to vue` | เพิ่ม adapter ใหม่ |
| `ทำต่อ` | resume จาก STATE (session ใหม่) |
