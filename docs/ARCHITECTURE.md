# Kiến trúc ứng dụng – BS Nội Trú Helper (TAHospital)

> Đây là một **Tampermonkey userscript** được inject vào website TAHospital (`tahospital.vn`, `hsba.tahospital.vn`, `otm.tahospital.vn`) để hỗ trợ bác sĩ nội trú quản lý bệnh nhân, y lệnh, phẫu thuật & báo cáo trực.

---

## 1. Tổng quan kiến trúc

```
src/
├── bs-noitru-fetch.user.js     ← Entry point chính (bundle qua Browserify)
├── BS_CAI_DAT_GIAO_DIEN.js     ← File cấu hình tập trung (config object)
├── DanhSachBenhNhan.js         ← Class fetch danh sách bệnh nhân (legacy MABN cố định)
├── googleAppsScript.js         ← Uploader lên Google Apps Script
├── utils.js                    ← Utils cơ bản (date, clipboard) - legacy
│
├── components/                 ← UI Components (inject vào sidebar/trang)
│   ├── patientInfoSection.js   ← Phần thông tin bệnh nhân trong sidebar
│   ├── yLenhHandlers.js        ← Log y lệnh & quick actions
│   ├── phauThuatHandlers.js    ← Thao tác thêm/sửa/xóa phẫu thuật
│   ├── hsbaDataFetcher.js      ← Lấy HSBA V2 qua GraphQL & background tab
│   ├── copyDienTienAI.js       ← Copy diễn tiến bệnh án cho AI
│   ├── actionButtons.js        ← Nút hành động trên card bệnh nhân
│   ├── dialogManager.js        ← Quản lý các dialog popup
│   ├── modalManager.js         ← Quản lý modal overlay
│   ├── khoaSelect.js           ← Dropdown chọn khoa
│   ├── listView.js             ← Hiển thị bệnh nhân dạng list
│   ├── autoLoginToggle.js      ← Nút bật/tắt auto-login trên topbar
│   ├── loginHandler.js         ← Xử lý redirect login
│   └── sidebarSession.js       ← Quản lý session sidebar (ctxId)
│
├── pages/                      ← Xử lý từng trang/route
│   ├── page.dashboard.js       ← Dashboard bệnh nhân (/?nln)
│   ├── page.dashboard.support.js ← Hàm hỗ trợ dashboard (fetch, render cards)
│   ├── page.settings.js        ← Trang cài đặt (/?caidat=*)
│   ├── page.lichmo.homnay.js   ← Trang lịch mổ hôm nay ( /lichmo route)
│   ├── page.settings.otm.quanlyphauthuat.js ← OTM quản lý phẫu thuật
│   ├── page.settings-open-world.js ← Settings Open World
│   ├── otm-entry.js            ← Entry point cho otm.tahospital.vn
│   └── otm.content.script.js   ← Logic chính cho trang OTM
│
├── services/                   ← Business logic & API calls
│   ├── apiService.js           ← Tất cả API calls primitive (fetch wrappers)
│   ├── checklistService.js     ← CRUD checklist (load, save, cache)
│   ├── patientService.js       ← Fetch & enrich dữ liệu bệnh nhân
│   ├── reportService.js        ← Tạo báo cáo trực (HTML + text)
│   ├── settingsService.js      ← Lưu/tải cài đặt bác sĩ vào phiếu đặc biệt
│   ├── surgeonSettingsService.js ← Lưu/tải danh sách bác sĩ theo khoa
│   └── saveQueue.js            ← Hàng đợi lưu offline (localStorage)
│
└── utils/                      ← Utility functions thuần túy
    ├── dateUtils.js            ← Chuyển đổi format ngày (VN/US)
    ├── patientDataMapper.js    ← Map raw API → patient object + sort
    ├── surgeryUtils.js         ← Tính HPN (ngày hậu phẫu), icon, format
    ├── tagUtils.js             ← Tạo ylenh-tags, meds-done badge
    ├── checklistUtils.js       ← Tạo HTML item checklist, copy y lệnh
    ├── domUpdaters.js          ← Cập nhật DOM card/list row (HXT, CDKT, tags)
    ├── uiUtils.js              ← showToast, copyToClipboard
    ├── htmlUtils.js            ← escapeHtml
    ├── khoaUtils.js            ← getSelectedKhoa() từ localStorage
    ├── hsbaV2Download.js       ← Tải toàn bộ tài liệu HSBA V2
    └── surgeryUtils.js         ← (đã liệt kê ở trên)
```

---

## 2. Luồng khởi động (Entry Point)

**File:** `src/bs-noitru-fetch.user.js`

```
Script inject vào trang
        │
        ├─► openHSBAV2() — global function (window + unsafeWindow)
        │
        └─► IIFE (function() { ... })()
              │
              ├─► require('./components/hsbaDataFetcher')
              │       └─► tự chạy hsbaBackgroundFetcherIfNeeded() nếu ở hsba.tahospital.vn
              │
              ├─► require('./pages/otm-entry')
              │       └─► tự chạy nếu ở otm.tahospital.vn
              │
              ├─► showDashboardBenhNhanIfNeeded()   ─ /?nln hoặc ?show=true
              ├─► showSettingsIfNeeded()             ─ /?caidat=*
              ├─► showLichMoHomNayIfNeeded()         ─ /lichmo route
              │
              ├─► DanhSachBenhNhan.startAutoFetch()  ─ auto fetch 7:00 sáng
              ├─► DanhSachBenhNhan.addFetchButtonToBottomBar()
              │
              ├─► initCopyDienTienAI()               ─ /to-dieu-tri
              ├─► autoClickCbTaCaIfNeeded()           ─ /DanhSachBenhNhan
              │
              ├─► Auto-login logic (/?/Home/Login)
              │
              ├─► addDashboardMenuToSidebar()
              ├─► addDashboardMenuToTopbar()
              ├─► addAutoLoginToggleToTopbar()
              │
              ├─► HSBAV2HideEmptySectionsIfNeeded()  ─ hsba.tahospital.vn
              └─► TaiToanBoTaiLieuHSBAV2()
```

---

## 3. Luồng Dashboard Bệnh Nhân (`/?nln`)

```
showDashboardBenhNhanIfNeeded()    [page.dashboard.js]
    │
    └─► PatientService.loadPatientDataWithErrorHandling()
             │
             ├─► fetchToDieuTriData()                [page.dashboard.support.js]
             │        └─► POST /ToDieuTri/Search
             │
             ├─► PatientDataMapper.mapPatientArray()  [utils/patientDataMapper.js]
             │        └─► Chuẩn hóa field names
             │
             ├─► window.dr_data = basicData          (render ngay, fast)
             │
             └─► enrichPatientDataInBackground()     (background, không block)
                      │
                      └─► Mỗi batch 5 BN:
                               ChecklistService.loadChecklistState()
                                    └─► POST /DanhSachBenhNhan/DSPhieu...
                               PatientDataMapper.mapPhauThuatData()
                               → patient.checklistState & patient.phauThuatInfo
                          └─► refreshPatientCards(enrichedData)
```

---

## 4. Luồng Sidebar Bệnh Nhân (Click vào card)

```
Click card bệnh nhân
    │
    └─► open sidebar (page.dashboard.support.js)
             │
             ├─► ChecklistService.loadChecklistData(patient)
             │        ├─► Cache hit → return cached
             │        └─► POST /DanhSachBenhNhan/DSPhieu... (mabn + 9898)
             │                   └─► fallback nếu ko có kết quả
             │
             ├─► window.checklistState = parseChecklistState(checklistObj)
             ├─► window.checklistObj = checklistObj
             │
             ├─► createPatientInfoSection(patient)  [components/patientInfoSection.js]
             │        ├─► setupYLenhHandlers()
             │        │        ├─► loadYLenhLog() — render log y lệnh
             │        │        ├─► updateQuickActionButtonStates()
             │        │        └─► poll 100ms/20 lần nếu patient.checklistState chưa có
             │        │
             │        ├─► setupPhauThuatHandlers()
             │        │        └─► loadPhauThuatLog() — render log phẫu thuật
             │        │
             │        └─► HXT textarea auto-save (debounce 700ms + blur)
             │
             └─► addHSBATab() — tab HSBA Data trong sidebar
```

---

## 5. Luồng Lưu Checklist (Save Flow)

```
User thay đổi dữ liệu (y lệnh, phẫu thuật, HXT, CDKT)
    │
    ├─► Cập nhật window.checklistState (in-memory)
    ├─► Cập nhật patient.checklistState (object reference)
    ├─► Cập nhật window.dr_data[patient].checklistState
    │
    └─► ChecklistService.updateChecklistState(checklistObj, state)
             │
             ├─► navigator.onLine === false?
             │        └─► SaveQueue.enqueueUpdate() → localStorage
             │
             └─► Serialize per-patient (lock Map để tránh race condition)
                      └─► ApiService.updateChecklistData()
                               └─► POST /ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/EditAjax
                                        └─► chuky = JSON.stringify(state)
```

---

## 6. Hệ thống Lưu Trữ Dữ Liệu

Ứng dụng sử dụng một cách thông minh: **dùng chính phiếu bệnh nhân của hệ thống HIS** làm nơi lưu dữ liệu.

| Loại dữ liệu | Lưu vào đâu | Field |
|---|---|---|
| Checklist bộ mổ, y lệnh log, phẫu thuật log, HXT | Phiếu `ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN` | `chuky` (JSON) |
| Cài đặt bác sĩ (danDoRaVien...) | Phiếu đặc biệt `mabn=tênbácsĩ` | `chuky` (JSON) |
| Danh sách BS theo khoa (OTM) | Phiếu đặc biệt `mabn=khoaId%h991h otm.dsbacsi` | `chuky.otm.dsbacsi` |
| Khoa đã chọn | `localStorage['bsnt_khoa_dashboard']` | string |
| Tài khoản & auto-login | `localStorage['dr_accounts_json']` etc. | JSON |
| Save queue offline | `localStorage['dr_save_queue_v1']` | JSON array |

**Trick nhận dạng phiếu đặc biệt:** `hoten` field kết thúc bằng `%` (ví dụ: `"Nguyễn Văn A%"`).

---

## 7. Sơ đồ phụ thuộc Module

```
bs-noitru-fetch.user.js
    ├─ utils.js
    ├─ DanhSachBenhNhan.js
    │       └─ utils/khoaUtils.js
    ├─ googleAppsScript.js
    ├─ pages/page.dashboard.js
    │       └─ pages/page.dashboard.support.js
    │               ├─ services/patientService.js
    │               │       ├─ services/checklistService.js
    │               │       │       ├─ services/apiService.js
    │               │       │       │       └─ utils/khoaUtils.js
    │               │       │       ├─ services/saveQueue.js
    │               │       │       └─ utils/dateUtils.js
    │               │       ├─ utils/patientDataMapper.js
    │               │       └─ components/loginHandler.js
    │               ├─ services/reportService.js
    │               │       ├─ utils/dateUtils.js
    │               │       ├─ utils/patientDataMapper.js
    │               │       ├─ services/checklistService.js
    │               │       └─ utils/surgeryUtils.js
    │               └─ utils/ (tagUtils, domUpdaters, checklistUtils, surgeryUtils...)
    ├─ components/patientInfoSection.js
    │       ├─ components/yLenhHandlers.js
    │       │       ├─ services/checklistService.js
    │       │       └─ BS_CAI_DAT_GIAO_DIEN.js
    │       ├─ components/phauThuatHandlers.js
    │       │       ├─ services/checklistService.js
    │       │       ├─ BS_CAI_DAT_GIAO_DIEN.js
    │       │       └─ utils/surgeryUtils.js
    │       ├─ services/checklistService.js
    │       └─ services/reportService.js
    └─ components/hsbaDataFetcher.js
            ├─ components/dialogManager.js
            ├─ services/checklistService.js
            └─ BS_CAI_DAT_GIAO_DIEN.js
```

---

## 8. Đa trang (Multi-domain)

| Domain | Vai trò |
|---|---|
| `tahospital.vn` | Trang chính – dashboard, sidebar, login, danh sách BN |
| `hsba.tahospital.vn` | HSBA V2 – background fetcher GraphQL, viewer tài liệu |
| `otm.tahospital.vn` | OTM – lịch mổ, quản lý phẫu thuật |

Script được inject vào cả 3 domain nhờ Tampermonkey `@match` rule. Mỗi module tự kiểm tra `window.location.hostname` trước khi chạy.

---

## 9. Globals quan trọng

| Biến | Ý nghĩa |
|---|---|
| `window.dr_data` | Mảng bệnh nhân hiện tại (raw + enriched) |
| `window.checklistState` | Checklist state của BN đang mở sidebar |
| `window.checklistObj` | Checklist DB record của BN đang mở sidebar |
| `window.dr_sidebar_ctx` | `{ id, signal }` – context hiện tại của sidebar |
| `window.DanhSachBenhNhanManager` | Instance của `DanhSachBenhNhan` class |
| `window.GoogleAppsScriptUploader` | Instance của Google Apps Script uploader |
| `window.updatePatientCardTags(mabn)` | Cập nhật tags trên card |
| `window.checkAllCelebrationAnimations(patients)` | Kiểm tra animation xuất viện |
| `window.refreshPatientCards(data)` | Re-render toàn bộ cards |
| `window.BS_CAI_DAT` | Object cấu hình giao diện |
