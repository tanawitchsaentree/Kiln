# Component Catalog — 108 ตัว จัดเป็น 10 waves ตาม dependency
> ทุกตัวต้องครบ Anatomy Contract 9 ข้อ · X-class = ยืน engine ที่พิสูจน์แล้ว (คอลัมน์ engine) ห่อด้วย token ของ system

**W1 Layout+Primitives (10):** Box, Stack, Grid, Container, Spacer, Divider, VisuallyHidden, AspectRatio, Center, Flex
**W2 Atoms-Core (12):** Text, Heading, Icon, Button, IconButton, Link, Badge, Avatar, Spinner, Skeleton, Kbd, Image
**W3 Forms-Core (11):** Input, Textarea, Checkbox, Radio, Switch, Label, FormField, HelperText, Fieldset, InputGroup, PinInput
**W4 Mobile-first Overlays (10):** Sheet/BottomSheet, Drawer, Dialog/Modal, ActionSheet, Popover, Tooltip(tap), Toast, Snackbar, FAB, PullToRefresh
**W5 Selection (10):** Select, Combobox, Autocomplete, MultiSelect, Menu/Dropdown, ContextMenu, Listbox, RadioCards, Rating, TagInput
**W6 Navigation (11):** Tabs, BottomNav, Navbar, Sidebar, Breadcrumb, Pagination, Stepper, SegmentedControl, Accordion, NavigationMenu, Anchor/TOC
**W7 Data Display (11):** Card, Table(basic), List, DescriptionList, Stat, Timeline, Tag/Chip, Alert/Banner, EmptyState, Progress, Meter
**W8 Advanced Input (10):** Slider, RangeSlider, NumberInput, FileUpload, Dropzone, ColorPicker, Editable, PasswordInput, SearchInput, OTPFlow
**W9 X-class (12):** DataGrid[TanStack Table+Virtual], TreeView[headless-tree], DatePicker/Calendar/RangePicker[React Aria], TimePicker, Charts×4: Line/Bar/Pie/Sparkline[visx/ECharts+chart tokens], Carousel[Embla], VirtualList[TanStack Virtual], TransferList
**W10 Patterns+Shell (11):** CommandPalette[cmdk], RichTextEditor[TipTap], Form(orchestration)[react-hook-form], Wizard, AppShell, AuthForms, SettingsLayout, NotificationCenter, Onboarding/CoachMark, KanbanBoard[dnd-kit], Feed

รวม 108 · แต่ละ wave = 1 BATCH API REVIEW = 1 checkpoint ของ user

## catalog นี้คือค่าตั้งต้นของ engine ไม่ใช่ของ system ใด
ตัด/รวม/ย้าย wave ได้ต่อ system เท่านั้น และต้องผ่าน `/lock-decision` ลง `system/DECISIONS.md` พร้อมเหตุผล — ห้ามแก้ไฟล์นี้แทน
ตัวอย่างจริงจาก Dial (system แรกที่สร้างด้วย kiln, web-first): ตัด Sheet/BottomSheet เป็น variant ของ Drawer, ตัด ActionSheet/FAB/PullToRefresh (mobile-only), ยุบ Autocomplete เข้า Combobox เป็น `aria-autocomplete` mode ตาม ARIA spec → เหลือ 103
