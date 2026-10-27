---
name: lock-decision
description: บันทึกการตัดสินใจที่ user ยืนยันแล้วลง system/DECISIONS.md ใน format มาตรฐาน ใช้ทุกครั้งที่จบ loop PROPOSE→CONFIRM หรือ user สั่ง /lock-decision ห้ามเขียน system/DECISIONS.md ด้วยวิธีอื่น
---

# Lock Decision

1. สรุปสิ่งที่ user เพิ่งยืนยันให้เห็นอีกครั้งบรรทัดเดียว — ถ้าคลุมเครือ ถามยืนยันก่อน ห้ามเดา
2. หาเลขรันถัดไป (D-{nnn}) จาก system/DECISIONS.md
3. Append entry ตาม format ในหัวไฟล์ system/DECISIONS.md เป๊ะๆ: วันที่/Phase/เลือก/เพราะ/ตัวเลือกที่ตัดทิ้ง/กระทบ
4. ช่อง **กระทบ** ต้องคิดจริง: ถ้าแก้ decision นี้ทีหลัง อะไรต้อง regenerate บ้าง — นี่คือข้อมูลที่ช่วยชีวิตตอน user ขอเปลี่ยนใจ
5. อัพเดต system/STATE.md บรรทัด "งานล่าสุด/งานถัดไป"
6. ตอบ user สั้นๆ: "🔒 D-{nnn} locked" + เรื่องถัดไปที่จะเสนอ

## กรณีแก้ decision เก่า
ห้ามลบ entry เดิม — เพิ่ม entry ใหม่ที่อ้างว่า supersedes D-{เก่า} และก่อนทำต้องแจ้ง impact จากช่อง "กระทบ" ของตัวเก่าให้ user ยืนยันก่อนเสมอ
