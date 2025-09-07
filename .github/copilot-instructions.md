# AI contributor guide for tampermonkey-bs-noitru-helper-tahospitalvn

Purpose: A Tampermonkey userscript that enhances TA Hospital inpatient dashboards. Code is modular (components/services/utils) and bundled to a single userscript.

## Key architecture and data flow
- **Entrypoint**: `src/bs-noitru-fetch.user.js` (bundled to `dist/bs-noitru-fetch.user.js` via Browserify). Do not edit `dist/*`.
- **UI layer**:
  - `src/dashboard.js` renders patient cards (`.dr-card`), injects CSS, and creates the fixed bottom bar.
  - Sidebar and dialogs live under `src/components/*`.
  - Settings pages (`?caidat`) are rendered by `src/pages/page.settings.js` and its submodules (e.g., `page.settings-open-world.js`).
- **State**:
  - Global `window.dr_data` holds the patient list.
  - Per-patient checklist state is in `window.checklistObj` + `window.checklistState`; merged back into the patient object (`patient.checklistState`) and optionally into `window.dr_data`.
- **Services**:
  - `src/services/checklistService.js` loads/parses/saves checklist JSON (API retries with `mabn+9898`, then plain `mabn`).
  - `src/services/reportService.js` prepares the direct report (HTML/text) by batch-loading checklist states.
  - `src/services/patientService.js`, `apiService.js` support data fetching and persistence.
  - `src/services/settingsService.js` manages user-specific settings (e.g., default khoa/phòng).
- **Utilities**:
  - `src/utils/surgeryUtils.js` formats surgery rows, computes status labels (e.g., "Hôm nay PT", "Ngày mai PT"), and updates cards.
  - `src/utils/patientDataMapper.js` sorts patients and maps surgery data from checklist logs.

## UI conventions and patterns
- **Card markup**: Rows use `.dr-value`, labels use `.dr-label`. Surgery container is `.dr-pt-info`. HXT line uses `.dr-hxt-block` and is inserted after `.dr-pt-info` when present.
- **Card targeting**: Prefer `.dr-card[data-mabn="<mabn>"]`; fallback to text search if needed.
- **Idempotent updates**: Always remove/replace an existing block before inserting a new one.
- **Dialogs**: Use `DialogManager.createDialog(id)` → `{ dialog, inner }`. The `inner` container has a max-height and vertical scrollbar. Create action buttons with `DialogManager.createActionButtons([{ id, className, text, onclick }])`.
- **Class or ID of elements**: Always start with `dr-`.
- **Settings pages**: Rendered dynamically with tabs (e.g., discharge instructions, account management, khoa/phòng info). See `page.settings.js` and `page.settings-open-world.js`.

## Direct report (bottom bar → modal)
- Button injected in `dashboard.js` (`#dr-btn-direct-report`). Handler in `src/pages/page.dashboard.support.js` → `createDirectReportGeneration()`.
- Report content from `ReportService.generateHTMLReport/generateTextReport`. Data loaded via `ReportService.getBatchChecklistStates()`.
- Rows include Chẩn đoán and, when available: `PPPT`, `Ngày PT`, `HXT` (mirrors card logic and surgery labels).

## Persistence and side effects
- To save per-patient fields (e.g., HXT):
  1. Update `window.checklistState`.
  2. Persist via `ChecklistService.updateChecklistState(window.checklistObj, window.checklistState)`.
  3. Call the relevant updater (e.g., `updatePatientCardHXT`) to refresh the UI.
- Avoid state leakage: Only prefill from `patient.checklistState` (never from a stale global default). Merge new state back into the matching `window.dr_data` entry before UI updates when appropriate.

## Build and dev workflow
- **Build + copy to clipboard**: `npm run build-and-copy` (VS Code task: “Build and Copy (npm)”).
  - `build`: Browserify bundles `src/bs-noitru-fetch.user.js` then `tampermonkey-header-name-and-version.js` injects the @header metadata.
  - `copy`: `clipboardy` writes `dist/bs-noitru-fetch.user.js` to the clipboard. Paste into Tampermonkey to update the installed script.

## Examples for common changes
- **Add a new card row**: Render in the card creator (next to `.dr-pt-info`/diagnosis), add an updater that targets the card by `data-mabn` and replaces an existing block (follow `updatePatientCardHXT` or `updatePatientCardPhauThuat`).
- **Extend the report**: Modify `generateHTMLReport`/`generateTextReport` and fetch required state in `getBatchChecklistStates`.
- **Reuse utilities**: Compute surgery labels with `SurgeryUtils.getSurgeryDateInfo` instead of reimplementing logic.
- **Add a settings tab**: Update `page.settings.js` to include a new tab and its corresponding content renderer.

## External endpoints (used in services)
- `/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien` (POST FormData: `mabn` [try `<mabn>9898` first], `tungay`, `denngay`).
- `/ToDieuTri/LoadLinkHsba` (POST x-www-form-urlencoded: `code=<mabn>`) for HSBA V2 links.

If something here seems off or incomplete, ask for the specific workflow/file and we’ll refine this doc.
