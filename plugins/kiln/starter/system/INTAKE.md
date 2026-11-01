# INTAKE — every question, asked once, at the start

kiln asks these in one batch before any work starts (user setting: questions up front only). The
answers are the brief; after the anchor pick the agent works to the end of the milestone without
asking again, and records every choice it made in `system/REVIEW.md`.

| # | Question | Answer |
|---|---|---|
| 1 | Name of the system and its packages (`<name>-tokens`, `<name>-react`) | |
| 2 | What it is for: who uses it, where (platform, device) | |
| 3 | App type, one of `tooling/kiln/app-types.json` (dashboard, commerce, media, booking, chat, ai-assistant, finance, productivity, learning, home-iot, content). It picks wave 1's extra components, the next waves and the book's working scenarios; write it to kiln.config `intake.appType` | |
| 4 | References: images, sites or objects in `system/refs/`, and which one leads | |
| 5 | Lineage: the tradition outside web UI it borrows from (kiln proposes three if blank) | |
| 6 | Must never become (the failure the concept guards against) | |
| 7 | Themes: light, dark or both, and which is the base | |
| 8 | Backdrops: does the UI sit on plain surfaces, imagery or video | |
| 9 | Targets beyond React: Tailwind, SwiftUI, Compose, Flutter, Figma (the token build makes all of them; a native target means colours are written as hex, docs/TARGETS.md) | |
| 10 | Budget: lean, standard or full (docs/BUDGET.md). Lean builds the core and the app type's wave 1 with shorter prose; nothing that is measured gets lighter. Write it to kiln.config `budget` | |
| 11 | Anchor pick: one of the 3–4 anchor variants rendered in `apps/lab/anchor/` (the only visual question) | |
