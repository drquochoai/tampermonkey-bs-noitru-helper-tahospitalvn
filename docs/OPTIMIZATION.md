# Phân tích Tối ưu Code – BS Nội Trú Helper

Tài liệu này liệt kê các vấn đề về code trùng lặp, hàm thừa và đề xuất tối ưu hóa.

---

## 1. Hàm trùng lặp

### 1.1. `escapeHtml` – xuất hiện ở 2 nơi

| File | Hàm |
|---|---|
| `utils/htmlUtils.js` | `escapeHtml(str)` |
| `services/reportService.js` | `_escapeHtml(str)` (method nội bộ) |

Cả hai làm cùng một việc: escape `&`, `<`, `>`, `"`, `'`. Sự khác biệt duy nhất là `htmlUtils.js` còn thêm `\n → <br/>`.

**Đề xuất:** Xóa `_escapeHtml` trong `reportService.js`, thay bằng `require('../utils/htmlUtils').escapeHtml`.

---

### 1.2. Format ngày – `formatDateDDMMYYYY` trong `hsbaDataFetcher.js` vs `dateUtils.js`

| File | Hàm |
|---|---|
| `utils/dateUtils.js` | `convertToUSFormat()`, `getChecklistDateRange()` |
| `components/hsbaDataFetcher.js` | `formatDateDDMMYYYY(dt)`, `formatDateYYYYMMDD(d)`, `formatDateTimeDDMMYYYYHHmm(dt)`, `parseDateSafe(s)` |
| `utils.js` (root) | `formatDate()`, `formatDateForApi()`, `_normalizeDateInput()` |

`hsbaDataFetcher.js` tự định nghĩa 4 hàm date riêng thay vì dùng `dateUtils.js` có sẵn.

**Đề xuất:** Chuyển các hàm `parseDateSafe`, `formatDateDDMMYYYY`, `formatDateYYYYMMDD`, `formatDateTimeDDMMYYYYHHmm` vào `utils/dateUtils.js` và export. `hsbaDataFetcher.js` import từ đó.

---

### 1.3. Copy sang Clipboard – 2 implementations

| File | Hàm |
|---|---|
| `utils.js` (root) | `copyToClipboard(text)` – không async |
| `utils/uiUtils.js` | `copyToClipboard(text)` – async, có fallback tốt hơn |

`utils.js` root là file legacy, còn `uiUtils.js` là bản mới hơn với Promise.

**Đề xuất:** Loại bỏ `copyToClipboard` trong `utils.js` root hoặc có thể xóa toàn bộ `utils.js` root nếu không còn nơi nào require trực tiếp ngoài entry point (entry point import `utils.js` nhưng chỉ dùng một ký hiệu `Utils` mà không dùng hàm nào cụ thể).

---

### 1.4. "Resolve function across scopes" pattern – lặp lại ở nhiều nơi

Cùng một pattern để tìm kiếm function qua nhiều scope `window`, `unsafeWindow`, `globalThis`, `this` xuất hiện ở **ít nhất 4 chỗ**:

- `patientInfoSection.js`: `invokeUpdatePatientCardHXT(p)` — tìm `updatePatientCardHXT`
- `patientInfoSection.js`: tìm `updatePatientCardCDKT`
- `patientService.js`: tìm `refreshPatientCards`
- `patientService.js`: tìm `checkAllCelebrationAnimations`
- `phauThuatHandlers.js`: `updatePatientCardPhauThuatLocal`

```js
// Đây là pattern lặp đi lặp lại:
if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.fn === 'function') {
    unsafeWindow.fn(p);
} else if (typeof this !== 'undefined' && typeof this.fn === 'function') {
    this.fn(p);
} else if (typeof globalThis !== 'undefined' && typeof globalThis.fn === 'function') {
    globalThis.fn(p);
} else if (typeof window !== 'undefined' && typeof window.fn === 'function') {
    window.fn(p);
}
```

**Đề xuất:** Tạo một helper utility:

```js
// utils/globalFnUtils.js
function callGlobalFn(fnName, ...args) {
    const scopes = [
        typeof unsafeWindow !== 'undefined' ? unsafeWindow : null,
        typeof globalThis !== 'undefined' ? globalThis : null,
        typeof window !== 'undefined' ? window : null
    ];
    for (const scope of scopes) {
        if (scope && typeof scope[fnName] === 'function') {
            try { scope[fnName](...args); return true; } catch(e) {}
        }
    }
    return false;
}
module.exports = { callGlobalFn };
```

Sau đó thay tất cả block 5-15 dòng bằng: `callGlobalFn('updatePatientCardHXT', patient)`.

---

### 1.5. `checkCelebrationForCard` vs `checkAndAddCelebrationClass` – logic gần giống nhau

| File | Hàm | Khác biệt |
|---|---|---|
| `utils/checklistUtils.js` | `checkCelebrationForCard(card, patient)` | Không lọc theo ngày hôm nay |
| `utils/tagUtils.js` | `checkAndAddCelebrationClass(card, patient)` | Lọc theo ngày hôm nay + check quick actions |

Cả hai đều toggle class `xuatvienanimation` trên card.

**Đề xuất:** Hợp nhất thành một hàm duy nhất trong `tagUtils.js` (vì logic về ngày và quick actions là behavior đúng), export ra và dùng ở cả hai nơi.

---

### 1.6. Cập nhật `dr_data` sau khi thay đổi checklist – lặp lại ở 3 component

Đoạn code sau (hoặc tương tự) xuất hiện trong `yLenhHandlers.js`, `phauThuatHandlers.js`, và `patientInfoSection.js`:

```js
if (window.dr_data && patient.mabn) {
    const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
    if (patientInData) {
        patientInData.checklistState = { ...window.checklistState };
    }
}
```

**Đề xuất:** Tạo một helper trong `domUpdaters.js` hoặc tạo `utils/stateSync.js`:

```js
function syncPatientStateToGlobal(mabn, newState) {
    if (!window.dr_data || !mabn) return;
    const p = window.dr_data.find(p => p.mabn === mabn);
    if (p) p.checklistState = { ...newState };
}
```

---

### 1.7. `todayStr` tính toán lặp lại nhiều lần

Format ngày hôm nay `dd/mm/yyyy` được tính trong:
- `tagUtils.js` – `createYLenhTags`, `updatePatientCardTags`, `checkAndAddCelebrationClass`
- `yLenhHandlers.js` – `findTodayQuickEntryByAction`, `updateQuickActionButtonStates`, `toggleQuickYLenh`
- `checklistUtils.js` – `checkAllCelebrationAnimations`

**Đề xuất:** Tạo một hàm utility `getTodayStr()` trong `dateUtils.js`:

```js
getTodayStr() {
    const d = new Date();
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}
```

---

## 2. Code thừa / Dead code

### 2.1. File có backup/refactored versions

```
pages/page.lichmo.homnay.js.backup   ← Có thể xóa
pages/page.lichmo.homnay.js.new      ← Có thể xóa
pages/page.settings.otm.quanlyphauthuat.js.backup ← Có thể xóa
```

Các file `.backup` và `.new` không được require bởi bất kỳ file nào.

---

### 2.2. `services/patientService.js` – `getPatientData()` có check không cần thiết

```js
// Dòng 132: Check này không bao giờ false vì fetchToDieuTriData luôn được require ở đầu file
if (typeof fetchToDieuTriData !== 'function') {
    throw new Error('fetchToDieuTriData function not available');
}
```

**Đề xuất:** Xóa đoạn check này.

---

### 2.3. `DanhSachBenhNhan.prototype.luuDanhSachBenhNhanVoiNgayVVMacDinh`

Phương thức này chỉ làm một việc: tạo copy của array với `ngayvv = "01/01/1001 01:01"` và gọi `alert()`. Không có nơi nào trong codebase gọi hàm này trực tiếp (chỉ có thể test thủ công qua console).

**Đề xuất:** Xóa nếu không còn dùng, hoặc comment rõ mục đích test.

---

### 2.4. `reportService.js` – `getPatientTreatmentPlan()` đã được đánh dấu Deprecated

```js
// Deprecated: kept for reference; reports now load full checklist state
async getPatientTreatmentPlan(mabn, ngayvv) { ... }
```

**Đề xuất:** Xóa hoàn toàn phương thức này.

---

### 2.5. `utils.js` (root) - Legacy file

File này chứa `Utils` object với các hàm: `_normalizeDateInput`, `calculateAge`, `formatDate`, `formatDateForApi`, `pad`, `getQueryParam`, `copyToClipboard`.

- `formatDate` và `formatDateForApi` trùng chức năng với `dateUtils.js`
- `copyToClipboard` trùng với `uiUtils.js`
- `calculateAge` và `getQueryParam` chỉ được dùng trong entry point nhưng có thể chuyển vào `dateUtils.js`

**Đề xuất:** Migrate các hàm cần thiết sang đúng module chuyên biệt rồi xóa `utils.js` root.

---

### 2.6. Console.log debug statements

Có rất nhiều `console.log('DEBUG - ...')` trong production code, đặc biệt trong:
- `checklistService.js` (10+ dòng DEBUG)
- `patientService.js` (5+ dòng DEBUG)
- `dateUtils.js` (5+ dòng DEBUG)

**Đề xuất:** Wrap trong `BS_CAI_DAT.debug.enableLogging` check (đã có sẵn field này trong config!):

```js
if (BS_CAI_DAT.debug.enableLogging) {
    console.log('DEBUG - ...');
}
```

Hoặc dùng một helper:

```js
const debug = (...args) => BS_CAI_DAT.debug.enableLogging && console.log(...args);
```

---

## 3. Cơ hội tối ưu hóa logic

### 3.1. `hsbaDataFetcher.js` – File quá lớn (797 dòng)

File này có nhiều trách nhiệm:
1. Background fetcher (domain `hsba.tahospital.vn`) – GraphQL fetch
2. Tab manager (mở/đóng background tab)
3. HSBA rule engine (match & filter theo `tenmau`)
4. UI renderer (show danh sách HSBA)
5. Inline PDF viewer
6. Sync với checklist state

**Đề xuất split:**
- `utils/hsbaRules.js` – logic `shouldShowTenmau`, `shouldSyncTenmau`, rule processing
- `utils/hsbaViewer.js` – `showInlineViewer` & PDF rendering
- `components/hsbaTabUI.js` – `addHSBATab`, `renderResult`, `attachTabToggleBehavior`
- Giữ `hsbaDataFetcher.js` chỉ làm: background fetch & tab lifecycle

---

### 3.2. `page.dashboard.js` và `page.dashboard.support.js` – Phân chia chưa rõ ràng

`page.dashboard.support.js` (38KB) đang làm rất nhiều thứ: rendering cards, sidebar HTML, checklist rendering, report dialog, etc. Trong khi `page.dashboard.js` (84KB) tiếp tục có nhiều logic.

**Đề xuất:** Tạo thêm các module con:
- `pages/dashboard/cardRenderer.js` – chỉ render 1 card
- `pages/dashboard/sidebarRenderer.js` – chỉ tạo HTML sidebar
- `pages/dashboard/filterBar.js` – logic lọc bệnh nhân

---

### 3.3. `patientInfoSection.js` – Pattern `softUpdate` lặp lại

Có 2 function gần giống nhau: `softUpdateHXT` và `softUpdateCDKT`. Cả hai đều cập nhật `window.checklistState`, `patient.checklistState`, và `window.dr_data`.

**Đề xuất:**

```js
function softUpdate(key, value) {
    if (!window.checklistState) window.checklistState = {};
    window.checklistState = { ...(window.checklistState || {}), [key]: value };
    patient.checklistState = { ...(patient.checklistState || {}), [key]: value };
    syncPatientStateToGlobal(patient.mabn, window.checklistState); // helper từ mục 1.6
}

// Thay thế:
softUpdateHXT(val) → softUpdate('huongXuTri', val)
softUpdateCDKT(val) → softUpdate('chanDoanKemTheo', val)
```

---

### 3.4. `saveQueue.js` – Tốt, giữ nguyên

File này ngắn, rõ ràng, có trách nhiệm đơn. Không cần thay đổi.

---

## 4. Tóm tắt ưu tiên thay đổi

| Mức độ | Thay đổi | Tiết kiệm ước tính |
|---|---|---|
| 🔴 **Cao** | Tạo `callGlobalFn()` helper | Giảm ~100 dòng trùng lặp |
| 🔴 **Cao** | Xóa file .backup, consolidate `escapeHtml` | Giảm ~50 dòng |
| 🟡 **Trung bình** | Tạo `getTodayStr()` trong `dateUtils.js` | Giảm ~20 dòng |
| 🟡 **Trung bình** | Tạo `syncPatientStateToGlobal()` helper | Giảm ~30 dòng |
| 🟡 **Trung bình** | Wrap DEBUG logs trong `debug.enableLogging` | UX tốt hơn ở production |
| 🟡 **Trung bình** | Merge `checkCelebrationForCard` & `checkAndAddCelebrationClass` | Giảm ~30 dòng |
| 🟢 **Thấp** | Chuyển date helpers từ `hsbaDataFetcher` sang `dateUtils.js` | Code rõ ràng hơn |
| 🟢 **Thấp** | Split `hsbaDataFetcher.js` thành 3-4 file nhỏ | Dễ maintain |
| 🟢 **Thấp** | Xóa `getPatientTreatmentPlan` deprecated | Giảm ~25 dòng |
| 🟢 **Thấp** | Hợp nhất `softUpdateHXT`/`softUpdateCDKT` | Giảm ~15 dòng |
