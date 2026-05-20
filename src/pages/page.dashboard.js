// dashboard.js

const Utils = require('../utils');
const {
    addGlobalStyles
} = require('./page.dashboard.support');

// Import cài đặt giao diện
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

// Import refactored modules
const PatientService = require('../services/patientService');
const ChecklistService = require('../services/checklistService');
const SettingsService = require('../services/settingsService');
const ApiService = require('../services/apiService');
const PatientDataMapper = require('../utils/patientDataMapper');
const ModalManager = require('../components/modalManager');
const LoginHandler = require('../components/loginHandler');

// Import newly refactored components
const { removeAccents, hasAccents } = require('../utils/textUtils');
const { createPatientInfoSection } = require('../components/patientInfoSection');
const cardTooltip = require('../components/cardTooltip');
const SidebarSession = require('../components/sidebarSession');
const { createYLenhTags, updatePatientCardTags, hasDischargeTag, updateMedsDoneBadge } = require('../utils/tagUtils');
const { setupPhauThuatHandlers } = require('../components/phauThuatHandlers');
const { setupAdvancedFilter, matchesAdvancedFilter, advancedFilterState } = require('../components/advancedFilter');
const { setupCopyMenu } = require('../components/copyMenu');

// Import utility functions
const { showToast, copyToClipboard } = require('../utils/uiUtils');
const { addSurgeryStatusIcon, formatSurgeryInfo, updatePatientCardPhauThuat } = require('../utils/surgeryUtils');
const { escapeHtml } = require('../utils/htmlUtils');
const DomUpdaters = require('../utils/domUpdaters');
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('../utils/checklistUtils');
const { getSelectedKhoa } = require('../utils/khoaUtils');

// Global variable for OTM tabs
if (typeof window !== 'undefined') {
    window.openTabs = window.openTabs || [];
} else if (typeof global !== 'undefined') {
    global.openTabs = global.openTabs || [];
} else {
    this.openTabs = this.openTabs || [];
}

function showDashboardBenhNhanIfNeeded() {
    // Use global openTabs variable for OTM tabs
    if (!window.openTabs) window.openTabs = [];
    let openTabs = window.openTabs;

    if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
    
    // Set page title
    document.title = 'Dashboard by drquochoai';
    
    addGlobalStyles(); // Đảm bảo style chỉ chèn 1 lần

    // Make utility functions globally available for onclick handlers
    // Không sử dụng window để tránh lỗi undefined - sử dụng global assignment trực tiếp
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.showToast = showToast;
        unsafeWindow.copyToClipboard = copyToClipboard;
        unsafeWindow.copyYLenhText = copyYLenhText;
        unsafeWindow.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
        unsafeWindow.updatePatientCardHXT = DomUpdaters.updateHXT;
        unsafeWindow.updatePatientCardCDKT = DomUpdaters.updateCDKT;
    } else if (typeof this !== 'undefined') {
        this.showToast = showToast;
        this.copyToClipboard = copyToClipboard;
        this.copyYLenhText = copyYLenhText;
        this.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
        this.updatePatientCardHXT = DomUpdaters.updateHXT;
        this.updatePatientCardCDKT = DomUpdaters.updateCDKT;
    } else {
        // Fallback - tạo global functions không qua window
        globalThis.showToast = showToast;
        globalThis.copyToClipboard = copyToClipboard;
        globalThis.copyYLenhText = copyYLenhText;
        globalThis.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
        globalThis.updatePatientCardHXT = DomUpdaters.updateHXT;
        globalThis.updatePatientCardCDKT = DomUpdaters.updateCDKT;
    }

    // Styles are injected via addGlobalStyles() only

    const checklistItems = BS_CAI_DAT.checklistItems;
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;
    const VIEW_KEY = 'dr-card-view';
    const CARD_HOVER_TOOLTIP_KEY = cardTooltip.STORAGE_KEY || 'dr-card-hover-preview';
    const DASHBOARD_CLOUD_KEYS = [
        VIEW_KEY,
        'dr-view-mode',
        CARD_HOVER_TOOLTIP_KEY,
        'dr-filter-type',
        'dr-filter-khoa',
        'dr-tracking-pids'
    ];
    let dashboardCloudContext = {
        doctorName: '',
        chungThuSo: '',
        checklistObj: null,
        settings: SettingsService.getDefaultSettings(),
        cloudAccounts: [],
        bootstrapLoaded: false
    };
    let dashboardSaveTimeout = null;
    let khoaSelectRefreshToken = 0;
    let khoaSelectOptionsCache = null;
    let lastManualKhoaId = '';

    function applyCardHoverTooltipSetting() {
        if (localStorage.getItem(CARD_HOVER_TOOLTIP_KEY) === null) {
            localStorage.setItem(CARD_HOVER_TOOLTIP_KEY, '1');
        }
        if (cardTooltip && typeof cardTooltip.setEnabled === 'function') {
            cardTooltip.setEnabled(localStorage.getItem(CARD_HOVER_TOOLTIP_KEY) !== '0');
        }
    }

    function applyDashboardSettingsToLocalStorage(dashboardSettings) {
        if (!dashboardSettings || typeof dashboardSettings !== 'object') return;

        Object.keys(dashboardSettings).forEach((key) => {
            const value = dashboardSettings[key];
            if (value === undefined || value === null) return;
            localStorage.setItem(key, String(value));
        });

        if (!dashboardSettings[VIEW_KEY] && dashboardSettings['dr-view-mode']) {
            localStorage.setItem(VIEW_KEY, String(dashboardSettings['dr-view-mode']));
        }
    }

    function readDashboardSettingsFromLocalStorage() {
        const dashboardSettings = {};
        DASHBOARD_CLOUD_KEYS.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value !== null) dashboardSettings[key] = value;
        });

        if (dashboardSettings['dr-view-mode'] && !dashboardSettings[VIEW_KEY]) {
            dashboardSettings[VIEW_KEY] = dashboardSettings['dr-view-mode'];
        }

        return dashboardSettings;
    }

    function getAccessibleKhoaIds(settingsObj) {
        const userInfo = settingsObj && settingsObj.userInfo ? settingsObj.userInfo : {};
        const ids = Array.isArray(userInfo.accessibleKhoaIds)
            ? userInfo.accessibleKhoaIds
            : (Array.isArray(userInfo.accessibleKhoa) ? userInfo.accessibleKhoa.map((it) => it && it.id) : []);
        return (ids || []).map((id) => String(id || '').trim()).filter(Boolean);
    }

    function filterDataByAccessibleKhoa(data, settingsObj) {
        if (!Array.isArray(data)) return [];
        const ids = getAccessibleKhoaIds(settingsObj);
        if (!ids.length) return data;
        const allowSet = new Set(ids);
        return data.filter((item) => allowSet.has(String((item && item.makp) || '').trim()));
    }

    async function refreshKhoaSelectByAccess({ reloadDataIfChanged = false, forceReloadList = false } = {}) {
        const select = document.getElementById('dr-khoa-select');
        if (!select) return;

        const requestId = ++khoaSelectRefreshToken;
        const previousValue = String(select.value || getSelectedKhoa('551'));

        try {
            select.disabled = true;
            let list = khoaSelectOptionsCache;
            if (forceReloadList || !Array.isArray(list) || !list.length) {
                list = await ApiService.fetchKhoaPhong();
                khoaSelectOptionsCache = Array.isArray(list) ? list : [];
            }
            if (requestId !== khoaSelectRefreshToken) return;

            const userInfo = ((dashboardCloudContext.settings || {}).userInfo) || {};
            const accessibleIds = getAccessibleKhoaIds(dashboardCloudContext.settings || {});
            const allowSet = new Set(accessibleIds);
            const defaultAllowedList = accessibleIds.length
                ? list.filter((k) => allowSet.has(String((k && k.id) || '').trim()))
                : list;

            let filteredList = defaultAllowedList;
            if (accessibleIds.length) {
                const mapById = new Map();
                defaultAllowedList.forEach((k) => {
                    const id = String((k && k.id) || '').trim();
                    if (!id) return;
                    mapById.set(id, {
                        id,
                        name: String((k && k.name) || id)
                    });
                });

                const accessibleMeta = Array.isArray(userInfo.accessibleKhoa) ? userInfo.accessibleKhoa : [];
                accessibleIds.forEach((id) => {
                    if (mapById.has(id)) return;
                    const meta = accessibleMeta.find((x) => String((x && x.id) || '').trim() === id);
                    mapById.set(id, {
                        id,
                        name: (meta && meta.name) ? String(meta.name) : `Khoa ${id}`
                    });
                });

                filteredList = Array.from(mapById.values());
            }

            select.innerHTML = '';
            if (!filteredList.length) {
                select.innerHTML = '<option value="">Khong co khoa duoc cap quyen</option>';
                select.disabled = true;
                return;
            }

            filteredList.forEach((k) => {
                const opt = document.createElement('option');
                opt.value = String(k.id);
                opt.textContent = k.name || k.id;
                select.appendChild(opt);
            });

            let nextValue = String(lastManualKhoaId || previousValue || '').trim();
            if (!filteredList.some((k) => String(k.id) === nextValue)) {
                nextValue = String(filteredList[0].id || '');
            }

            if (nextValue) {
                select.value = nextValue;
                try { localStorage.setItem('bsnt_khoa_dashboard', nextValue); } catch (_) {}
            }
            select.disabled = false;

            if (reloadDataIfChanged && nextValue && nextValue !== previousValue) {
                const selectedOpt = select.options[select.selectedIndex];
                const selectedName = (selectedOpt && selectedOpt.textContent) || nextValue;
                await reloadDashboardForSelectedKhoa(selectedName);
            }
        } catch (e) {
            console.warn('Refresh khoa select failed', e);
            select.disabled = false;
        }
    }

    function applyRealtimeUserInfo(detail) {
        const userInfo = detail && detail.userInfo;
        if (!userInfo || typeof userInfo !== 'object') return;

        dashboardCloudContext.settings = {
            ...(dashboardCloudContext.settings || SettingsService.getDefaultSettings()),
            userInfo: {
                ...(((dashboardCloudContext.settings || {}).userInfo) || {}),
                ...userInfo
            }
        };

        refreshKhoaSelectByAccess({ reloadDataIfChanged: true, forceReloadList: true });
    }

    function setKhoaLoadingStatus(text, isError) {
        const el = document.getElementById('dr-khoa-loading-status');
        if (!el) return;
        el.textContent = text || '';
        el.style.color = isError ? '#b91c1c' : '#475569';
    }

    async function reloadDashboardForSelectedKhoa(selectedName) {
        const khoaName = String(selectedName || '').trim() || 'khoa da chon';
        setKhoaLoadingStatus(`Dang tai thong tin ${khoaName}...`);
        showToast(`Dang tai thong tin ${khoaName}...`, 'info', 1800);

        try {
            const fresh = await PatientService.loadPatientDataWithErrorHandling({ forceRefresh: true });
            if (!fresh) {
                setKhoaLoadingStatus('Khong tai duoc du lieu khoa/phong', true);
                return;
            }

            // PatientService background enrichment already calls checklist endpoint
            // DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien for checklist details.
            renderCards(filterDataByAccessibleKhoa(fresh, dashboardCloudContext.settings || {}));
            setKhoaLoadingStatus('');
        } catch (e) {
            console.warn('Reload dashboard by khoa failed', e);
            setKhoaLoadingStatus('Loi tai du lieu khoa/phong', true);
            showToast('Loi tai du lieu khoa/phong', 'error', 2200);
        }
    }

    if (!window.__drUserInfoSyncBound) {
        window.__drUserInfoSyncBound = true;

        window.addEventListener('dr-user-info-updated', (event) => {
            applyRealtimeUserInfo(event && event.detail);
        });

        window.addEventListener('storage', (event) => {
            if (!event || event.key !== 'dr_user_info_sync' || !event.newValue) return;
            try {
                const payload = JSON.parse(event.newValue);
                applyRealtimeUserInfo(payload);
            } catch (_) {}
        });
    }

    async function ensureDashboardChecklistObj() {
        if (dashboardCloudContext.checklistObj) return dashboardCloudContext.checklistObj;
        if (!dashboardCloudContext.chungThuSo) return null;

        const created = await SettingsService.createSettingsPhieu({
            name: dashboardCloudContext.doctorName,
            chungThuSo: dashboardCloudContext.chungThuSo
        });
        if (created && created.isValid) {
            dashboardCloudContext.checklistObj = await SettingsService.loadSettingsPhieu(dashboardCloudContext.chungThuSo);
        }
        return dashboardCloudContext.checklistObj;
    }

    async function persistDashboardSettingsToCloud({ silent = true } = {}) {
        try {
            const checklistObj = await ensureDashboardChecklistObj();
            if (!checklistObj) return false;

            const nextSettings = {
                ...(dashboardCloudContext.settings || SettingsService.getDefaultSettings()),
                dashboard: {
                    ...((dashboardCloudContext.settings && dashboardCloudContext.settings.dashboard) || {}),
                    ...readDashboardSettingsFromLocalStorage()
                }
            };

            const ok = await SettingsService.updateSettingsState(checklistObj, nextSettings);
            if (ok) {
                dashboardCloudContext.settings = nextSettings;
                return true;
            }

            if (!silent) showToast('Không thể lưu cài đặt dashboard', 'error', 2500);
            return false;
        } catch (e) {
            console.warn('Persist dashboard settings failed', e);
            if (!silent) showToast('Không thể lưu cài đặt dashboard', 'error', 2500);
            return false;
        }
    }

    function scheduleDashboardSettingsSync() {
        clearTimeout(dashboardSaveTimeout);
        dashboardSaveTimeout = setTimeout(() => {
            persistDashboardSettingsToCloud({ silent: true });
        }, 800);
    }

    // Helper function to create checklist section
    async function createChecklistSectionAsync(patient) {
        const checklistDiv = document.createElement('div');

        // Determine if patient has discharge tag
        const hasDischarge = hasDischargeTag(patient);
        const defaultTab = hasDischarge ? 'xuatvien' : 'bomo';

        checklistDiv.innerHTML = `
            <h3 style="margin-top:0">Checklist</h3>
            <div class="checklist-tabs" style="display:flex;margin-bottom:16px;border-bottom:2px solid #e0e0e0;">
                <button class="tab-btn ${defaultTab === 'bomo' ? 'active' : ''}" data-tab="bomo" style="padding:8px 16px;border:none;background:${defaultTab === 'bomo' ? '#1976d2' : 'transparent'};color:${defaultTab === 'bomo' ? 'white' : '#666'};border-radius:4px 4px 0 0;cursor:pointer;font-weight:${defaultTab === 'bomo' ? 'bold' : 'normal'};">Bộ mổ</button>
                <button class="tab-btn ${defaultTab === 'xuatvien' ? 'active' : ''}" data-tab="xuatvien" style="padding:8px 16px;border:none;background:${defaultTab === 'xuatvien' ? '#4caf50' : 'transparent'};color:${defaultTab === 'xuatvien' ? 'white' : '#666'};border-radius:4px 4px 0 0;cursor:pointer;margin-left:4px;font-weight:${defaultTab === 'xuatvien' ? 'bold' : 'normal'};">Xuất viện</button>
            </div>
            <div class="tab-content">
                <div class="tab-pane ${defaultTab === 'bomo' ? 'active' : ''}" data-tab="bomo" style="display:${defaultTab === 'bomo' ? 'block' : 'none'};">
                    <ul id="checklist-bomo" style="overflow-y:auto;padding-left:0;list-style:none;margin:0 0 16px 0;"></ul>
                </div>
                <div class="tab-pane ${defaultTab === 'xuatvien' ? 'active' : ''}" data-tab="xuatvien" style="display:${defaultTab === 'xuatvien' ? 'block' : 'none'};">
                    <ul id="checklist-xuatvien" style="overflow-y:auto;padding-left:0;list-style:none;margin:0 0 16px 0;"></ul>
                </div>
            </div>
        `;

        // Setup tab switching
        setTimeout(() => {
            const tabBtns = checklistDiv.querySelectorAll('.tab-btn');
            const tabPanes = checklistDiv.querySelectorAll('.tab-pane');

            tabBtns.forEach(btn => {
                btn.addEventListener('click', function () {
                    const targetTab = this.getAttribute('data-tab');

                    // Update buttons
                    tabBtns.forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'transparent';
                        b.style.color = '#666';
                        b.style.fontWeight = 'normal';
                    });

                    this.classList.add('active');
                    this.style.background = targetTab === 'bomo' ? '#1976d2' : '#4caf50';
                    this.style.color = 'white';
                    this.style.fontWeight = 'bold';

                    // Update panes
                    tabPanes.forEach(pane => {
                        pane.classList.remove('active');
                        pane.style.display = 'none';
                    });

                    const targetPane = checklistDiv.querySelector(`.tab-pane[data-tab="${targetTab}"]`);
                    if (targetPane) {
                        targetPane.classList.add('active');
                        targetPane.style.display = 'block';
                    }
                });
            });
        }, 10);

        // Load both checklists asynchronously
        const bomoList = checklistDiv.querySelector('#checklist-bomo');
        const xuatvienList = checklistDiv.querySelector('#checklist-xuatvien');

        // Await the async loadChecklist for bomo
        if (bomoList) {
            await loadChecklist(patient, bomoList, 'bomo');
        }

        // For xuatvien, it's not async but we can wait a bit for the setTimeout
        if (xuatvienList) {
            loadChecklistXuatVien(patient, xuatvienList);
            // Wait for the setTimeout in loadChecklistXuatVien
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        return checklistDiv;
    }

    // Helper function to load checklist data
    async function loadChecklist(patient, checklistUl, checklistType = 'bomo', retryCount = 0) {
        try {
            checklistUl.innerHTML = '<li>Đang tải checklist...</li>';

            // Use unified ChecklistAPIModule for consistent mabn handling
            const ChecklistAPIModule = require('../services/checklistAPIModule');
            const result = await ChecklistAPIModule.getChecklistData(patient, { forceRefresh: true });
            checklistUl.innerHTML = '';

            if (!result || !result.checklistObj) {
                checklistUl.innerHTML = '<li>Không có dữ liệu</li>';
                const createResult = await ChecklistAPIModule.createChecklist(patient);
                if (createResult.ok) {
                    loadChecklist(patient, checklistUl, checklistType, retryCount + 1);
                } else {
                    checklistUl.innerHTML = '<li>Lỗi tạo mới checklist phiếu!</li>';
                    if (retryCount < 1) {
                        setTimeout(() => {
                            const sidebar = document.getElementById('dr-sidebar');
                            const backdrop = document.getElementById('dr-sidebar-backdrop');
                            ModalManager.hideModal(sidebar, backdrop);
                            setTimeout(() => {
                                showSidebar(patient);
                            }, 300);
                        }, 500);
                    }
                }
                return;
            }

            const checklistObj = result.checklistObj;

            window.checklistObj = checklistObj;
            // Parse into a fresh object; avoid leaking prior patient's HXT into others
            window.checklistState = { ...result.state };
            // Merge standardized OTM surgeries (if any) for this patient into state (append-only)
            try {
                const otmLogs = Array.isArray(patient && patient._otmPhauThuatLog) ? patient._otmPhauThuatLog : [];
                if (otmLogs.length > 0) {
                    if (!Array.isArray(window.checklistState.phauThuatLog)) window.checklistState.phauThuatLog = [];
                    const keyOf = (e) => `${e.date}|${e.time}|${(e.method || '').trim().toLowerCase()}`;
                    const existingKeys = new Set(window.checklistState.phauThuatLog.map(keyOf));
                    let added = 0;
                    for (const e of otmLogs) {
                        const k = keyOf(e);
                        if (!existingKeys.has(k)) {
                            window.checklistState.phauThuatLog.push({ ...e });
                            existingKeys.add(k);
                            added++;
                        }
                    }
                    if (added > 0) {
                        const parseDDMMYYYY = (s) => { const [d, m, y] = String(s || '').split('/').map(n => parseInt(n, 10)); return new Date(y || 1970, (m || 1) - 1, d || 1); };
                        const toTs = (e) => { const dt = parseDDMMYYYY(e.date); const [hh, mm] = String(e.time || '00:00').split(':').map(n => parseInt(n, 10) || 0); dt.setHours(hh, mm, 0, 0); return dt.getTime(); };
                        window.checklistState.phauThuatLog.sort((a, b) => toTs(b) - toTs(a));
                        // Persist silently in background using unified module
                        try { ChecklistAPIModule.saveChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) }); } catch (_) { }
                    }
                }
            } catch (e) { console.warn('OTM merge into checklistState failed', e); }

            // Load y lệnh log if exists
            const yLenhLogContainer = document.getElementById('dr-y-lenh-log');
            if (yLenhLogContainer && window.checklistState && window.checklistState.yLenhLog) {
                loadYLenhLogFromState();
            }

            // Load phẫu thuật log if exists
            const ptLogContainer = document.getElementById('dr-pt-log');
            if (ptLogContainer && window.checklistState && window.checklistState.phauThuatLog) {
                loadPhauThuatLogFromState();
            }

            // Render checklist items for bộ mổ
            if (checklistType === 'bomo') {
                renderChecklistItems(checklistUl);
            }

        } catch (error) {
            console.error('Error loading checklist:', error);
            checklistUl.innerHTML = '<li>Lỗi tải checklist</li>';
        }
    }

    // Helper function to load checklist xuất viện
    function loadChecklistXuatVien(patient, checklistUl) {
        try {
            checklistUl.innerHTML = '<li>Đang tải checklist xuất viện...</li>';

            setTimeout(() => {
                renderChecklistXuatVien(checklistUl, patient);
            }, 100);

        } catch (error) {
            console.error('Error loading xuất viện checklist:', error);
            checklistUl.innerHTML = '<li>Lỗi tải checklist xuất viện</li>';
        }
    }

    // Helper function to render checklist xuất viện
    function renderChecklistXuatVien(checklistUl, patient) {
        checklistUl.innerHTML = '';

        BS_CAI_DAT.checklistXuatVien.forEach((item, idx) => {
            const li = document.createElement('li');
            li.style = 'margin-bottom:8px;';

            if (typeof item === 'string') {
                // Simple checklist item
                const id = 'dr-checklist-xv-' + idx;
                const isChecked = window.checklistState && window.checklistState[`xuatvien_${item}`] || false;

                li.innerHTML = createChecklistItemHTML(item, id, isChecked, patient);
            } else if (item.children) {
                // Parent item with children - Special handling for "Tờ điều trị"
                if (item.label === 'Tờ điều trị') {
                    // Render as header without checkbox
                    li.innerHTML = `
                        <div style="margin-bottom:12px;">
                            <h4 style="margin:0 0 8px 0;color:#1976d2;font-weight:bold;border-bottom:2px solid #e3f2fd;padding-bottom:4px;">📋 ${item.label}</h4>
                            <ul style="margin-left:0;margin-top:8px;list-style:none;padding:0;">
                                ${item.children.map((child, childIdx) => {
                        const childId = `dr-checklist-xv-child-${idx}-${childIdx}`;
                        const isChildChecked = window.checklistState && window.checklistState[`xuatvien_${child}`] || false;
                        return `<li style="margin-bottom:4px;">${createChecklistItemHTML(child, childId, isChildChecked, patient)}</li>`;
                    }).join('')}
                            </ul>
                        </div>
                    `;
                } else {
                    // Normal parent item with checkbox
                    const parentId = 'dr-checklist-xv-parent-' + idx;
                    const isParentChecked = window.checklistState && window.checklistState[`xuatvien_${item.label}`] || false;

                    li.innerHTML = `
                        <div style="margin-bottom:8px;">
                            <label style="display:flex;align-items:center;gap:8px;font-weight:bold;">
                                <input type="checkbox" id="${parentId}" ${isParentChecked ? 'checked' : ''}>${item.label}
                            </label>
                            <ul style="margin-left:24px;margin-top:8px;list-style:none;padding:0;">
                                ${item.children.map((child, childIdx) => {
                        const childId = `dr-checklist-xv-child-${idx}-${childIdx}`;
                        const isChildChecked = window.checklistState && window.checklistState[`xuatvien_${child}`] || false;
                        return `<li style="margin-bottom:4px;">${createChecklistItemHTML(child, childId, isChildChecked, patient)}</li>`;
                    }).join('')}
                            </ul>
                        </div>
                    `;
                }
            }

            checklistUl.appendChild(li);
        });

        // Setup checkbox change handlers for xuất viện
        setTimeout(() => {
            checklistUl.querySelectorAll('input[type=checkbox]').forEach((cb, idx) => {
                cb.addEventListener('change', async function () {
                    const item = BS_CAI_DAT.checklistXuatVien[idx];
                    let label = '';
                    if (typeof item === 'string') {
                        label = item;
                    } else if (item.label) {
                        label = item.label;
                    } else {
                        // Fallback for child items - extract from data attribute or parent text
                        const dataLabel = this.getAttribute('data-original-label');
                        if (dataLabel) {
                            label = dataLabel;
                        } else {
                            label = this.parentNode.textContent.trim();
                        }
                    }
                    const key = `xuatvien_${label}`;

                    if (!window.checklistState) {
                        window.checklistState = {};
                    }

                    window.checklistState[key] = this.checked;

                    const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
                    if (!res || (!res.ok && !res.queued)) {
                        console.error('Lưu checklist xuất viện thất bại!');
                    }
                });
            });
        }, 10);

        // Make function available for reuse
        window.renderChecklistXuatVien = renderChecklistXuatVien;
    }



    // Helper function to load y lệnh log from state
    function loadYLenhLogFromState() {
        const logContainer = document.getElementById('dr-y-lenh-log');
        if (!logContainer) return;

        function renderYLenhLog(yLenhArray) {
            if (!Array.isArray(yLenhArray) || yLenhArray.length === 0) {
                logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>';
                return;
            }

            logContainer.innerHTML = yLenhArray.map((entry, index) => `
                <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;word-break: break-word; overflow-wrap: anywhere;">
                    <button class="remove-y-lenh-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-y-lenh-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const index = parseInt(this.getAttribute('data-index'));
                        if (window.currentRemoveYLenh) {
                            window.currentRemoveYLenh(index);
                        } else {
                            // Fallback removal function
                            if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
                                window.checklistState.yLenhLog.splice(index, 1);
                                // Re-render after removal
                                renderYLenhLog(window.checklistState.yLenhLog);
                                // Save to server
                                if (window.checklistObj) {
                                    ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
                                }
                            }
                        }
                    });
                });
            }, 10);
        }

        if (window.checklistState && window.checklistState.yLenhLog) {
            renderYLenhLog(window.checklistState.yLenhLog);
        }
    }

    // Helper function to load phẫu thuật log from state
    function loadPhauThuatLogFromState() {
        const logContainer = document.getElementById('dr-pt-log');
        if (!logContainer) return;

        // Use the current render function if available
        if (window.currentRenderPhauThuatLog && window.checklistState && window.checklistState.phauThuatLog) {
            window.currentRenderPhauThuatLog(window.checklistState.phauThuatLog);
            return;
        }

        // Fallback render function
        function renderPhauThuatLog(phauThuatArray) {
            if (!Array.isArray(phauThuatArray) || phauThuatArray.length === 0) {
                logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>';
                return;
            }

            logContainer.innerHTML = phauThuatArray.map((entry, index) => `
                <div class="pt-entry-clickable" data-index="${index}" style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #4caf50;position:relative;cursor:pointer;transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='#fff'">
                    <button class="remove-pt-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;z-index:1;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;"><strong>Ngày PT:</strong> ${entry.date} ${entry.time}</div>
                    <div style="font-weight:bold;color:#333;margin-bottom:2px;"><strong>PPPT:</strong> ${entry.method}</div>
                    <div style="font-size:0.85em;color:#555;"><strong>BS:</strong> ${entry.doctors}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation(); // Prevent triggering edit popup
                        const index = parseInt(this.getAttribute('data-index'));
                        if (window.currentRemovePhauThuat) {
                            window.currentRemovePhauThuat(index);
                        } else {
                            // Fallback removal function
                            if (window.checklistState.phauThuatLog && Array.isArray(window.checklistState.phauThuatLog)) {
                                window.checklistState.phauThuatLog.splice(index, 1);
                                // Re-render after removal
                                renderPhauThuatLog(window.checklistState.phauThuatLog);
                                // Save to server
                                if (window.checklistObj) {
                                    ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
                                }
                            }
                        }
                    });
                });

                // Add event listeners for edit functionality
                logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                    entry.addEventListener('click', function (e) {
                        // Don't trigger if clicking the remove button
                        if (e.target.classList.contains('remove-pt-btn')) return;

                        const index = parseInt(this.getAttribute('data-index'));
                        if (window.currentEditPhauThuat) {
                            window.currentEditPhauThuat(index);
                        } else {
                            console.warn('Edit function not available');
                        }
                    });
                });
            }, 10);
        }

        if (window.checklistState && window.checklistState.phauThuatLog) {
            renderPhauThuatLog(window.checklistState.phauThuatLog);
        }
    }

    // Helper function to render checklist items with HSBA badges and sync note
    function renderChecklistItems(checklistUl) {
        checklistUl.innerHTML = '';
        const hsbaSynced = (window.checklistState && window.checklistState.hsbaSynced) || {};
        const lastSyncAt = hsbaSynced.__lastSyncAt || null;
        checklistItems.forEach((item, idx) => {
            const li = document.createElement('li');
            // No margin/padding; keep optional background and radius only
            let liStyle = 'border-radius:6px;';
            const id = 'dr-checklist-' + idx;
            const isChecked = !!(window.checklistState && window.checklistState[item]);
            const auto = hsbaSynced[item] && hsbaSynced[item].matched === true;
            const badge = auto ? `<span class="dr-hsba-badge" title="Đã có trong HSBA" style="color:#16a34a; font-weight:700;">✔</span>` : '';
            const hint = auto ? `<span class="dr-hsba-hint" style="color:#16a34a; font-size:12px;">(HSBA)</span>` : '';
            if (auto) {
                const hl = (BS_CAI_DAT && BS_CAI_DAT.colors && BS_CAI_DAT.colors.blueCardBackground) ? BS_CAI_DAT.colors.blueCardBackground : '#e3f2fd';
                liStyle += `background:${hl};`;
            }
            li.style = liStyle;
            li.innerHTML = `<label style="display:flex;align-items:center;gap:0;min-height:28px;"><input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''}>${item}${auto ? ' ' : ''}${badge}${auto ? ' ' : ''}${hint}</label>`;
            checklistUl.appendChild(li);
        });

        // Add sync note under list
        const note = document.createElement('div');
        note.className = 'dr-hsba-sync-note';
        note.style.cssText = 'margin-top:6px; font-size:12px; color:#64748b;';
        if (lastSyncAt) {
            const dt = new Date(lastSyncAt);
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const yyyy = dt.getFullYear();
            const hh = String(dt.getHours()).padStart(2, '0');
            const mi = String(dt.getMinutes()).padStart(2, '0');
            note.textContent = `Đồng bộ HSBA: ${dd}/${mm}/${yyyy} ${hh}:${mi}`;
        } else {
            note.textContent = 'Đồng bộ HSBA: chưa có';
        }
        checklistUl.parentElement.appendChild(note);

        // Setup checkbox change handlers
        setTimeout(() => {
            checklistUl.querySelectorAll('input[type=checkbox]').forEach((cb, idx) => {
                cb.addEventListener('change', async function () {
                    const itemText = checklistItems[idx]; // Use original item text, not display text
                    window.checklistState[itemText] = this.checked;
                    const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
                    if (!res || (!res.ok && !res.queued)) {
                        console.error('Lưu checklist thất bại!');
                    }
                });
            });
        }, 10);
    }

    // Public refresh to update HSBA badges and note after sync
    window.dr_refreshChecklistBadges = function () {
        try {
            const ul = document.querySelector('#checklist-bomo');
            if (ul) renderChecklistItems(ul);
        } catch (_) { }
    };

    async function showSidebar(patient) {
        const backdrop = ModalManager.getOrCreateBackdrop();
        const sidebar = ModalManager.getOrCreateSidebar();

        // ─── Bug 1 fix: Clear stale global state from previous patient IMMEDIATELY ───
        // Reset shared globals so no previous patient's data leaks into new sidebar.
        window.checklistState = null;
        window.checklistObj = null;
        window.currentRemoveYLenh = null;
        window.currentRenderPhauThuatLog = null;
        window.currentRemovePhauThuat = null;
        window.currentEditPhauThuat = null;

        // Clear and setup sidebar with loading spinner right away (no stale DOM)
        sidebar.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 18px; color: #666;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 16px;">Đang tải thông tin bệnh nhân...</div>
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        // Show/reveal sidebar immediately so user sees the spinner (not old content)
        ModalManager.showModal(sidebar, backdrop);

        // Start a new session for this sidebar open
        const sessionId = SidebarSession.startSession(patient && patient.mabn);
        sidebar.style = `position:fixed;top:0;right:0;width:80vw;max-width:80vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;`;

        // Create responsive container
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: 100%;
        `;

        // Responsive styles are handled in addGlobalStyles()

        container.className = 'dr-sidebar-container';

        // Left column: Patient info with surgery and y lệnh
        const leftColumn = document.createElement('div');
        leftColumn.className = 'dr-sidebar-left';
        leftColumn.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        // Sidebar action buttons (reuse card actions behavior)
        const sidebarActions = document.createElement('div');
        sidebarActions.className = 'dr-sidebar-actions';
        sidebarActions.style.cssText = `
            display: flex; justify-content: flex-end; gap: 10px; 
            margin-bottom: 12px; flex-wrap: wrap;
        `;
        // Import shared action creators
        const { createToDieuTriButton, createHsbaButton, createHsbaV1Button } = require('../components/actionButtons');
        const { initCopyDienTienAI } = require('../components/copyDienTienAI');
        sidebarActions.appendChild(createToDieuTriButton({ item: patient, variant: 'full' }));
        sidebarActions.appendChild(createHsbaV1Button(patient));
        sidebarActions.appendChild(createHsbaButton({ item: patient, variant: 'full' }));

        // Copy diễn tiến button (AI) inside sidebar actions
        try {
            const btnCopy = document.createElement('button');
            btnCopy.type = 'button';
            btnCopy.className = 'btn btn-sm btn-success';
            btnCopy.textContent = 'Copy diễn tiến';
            // Copy-again icon button
            const btnCopyAgain = document.createElement('button');
            btnCopyAgain.type = 'button';
            btnCopyAgain.title = 'Copy lại';
            btnCopyAgain.className = 'btn btn-sm btn-outline-secondary';
            btnCopyAgain.style.marginLeft = '6px';
            btnCopyAgain.textContent = '📋';
            btnCopyAgain.style.display = 'none';
            btnCopy.addEventListener('click', async () => {
                // Build a minimal runner that reuses CopyDienTienAI logic with explicit mabn
                const mabn = (patient && (patient.pid || patient.mabn)) ? String(patient.pid || patient.mabn) : '';
                const wrap = document.createElement('div');
                const statusBar = document.createElement('div');
                statusBar.id = 'dr-copy-dien-tien-status';
                statusBar.style.cssText = 'margin-left:8px; font-size:12px; color:#0f172a;';
                // Place status near the button
                btnCopyAgain.insertAdjacentElement('afterend', statusBar);

                if (!mabn) {
                    const mod = require('../components/copyDienTienAI');
                    mod.setStatus(statusBar, 'Không tìm thấy MABN (pid)', '#b91c1c', true);
                    return;
                }

                // Import functions from module
                const mod = require('../components/copyDienTienAI');
                const { fetchPatientInfo } = mod.__esModule ? mod : { fetchPatientInfo: undefined };
                // Fallback: call via window by reusing internal helpers through duplicated minimal flow
                try {
                    mod.setStatus(statusBar, 'Đang lấy thông tin người bệnh...', '#0f172a', false);
                    // use internal method via module reference already loaded in bundle
                    const info = await mod.fetchPatientInfo(mabn);
                    const mavaovien = info.maVaoVien || info.mavaovien || '';
                    const ngayvv = mod.parseMMDDYYYYtoDDMMYYYY(info.ngayVV || info.ngayvv || '');
                    const maql = info.maql || '';
                    if (!mavaovien || !ngayvv || !maql) {
                        mod.setStatus(statusBar, 'Thiếu tham số (mã vào viện/ngày vào/maql)', '#b91c1c', true);
                        return;
                    }
                    const denngay = mod.todayDDMMYYYY();
                    const pdfUrl = `/todieutri/DienBien/PrintPDF?id=&mabn=${encodeURIComponent(mabn)}&mavaovien=${encodeURIComponent(mavaovien)}&tungay=${encodeURIComponent(ngayvv)}&denngay=${encodeURIComponent(denngay)}&maql=${encodeURIComponent(maql)}`;

                    mod.setStatus(statusBar, 'Đang tải và xử lý PDF...', '#0f172a', false);
                    const buf = await mod.fetchPdfArrayBuffer(pdfUrl);
                    const rawText = await mod.extractAllTextFromPdfBuffer(buf);
                    const text = mod.sanitizeCopiedText(rawText);

                    mod.setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
                    const ok = await mod.copyToClipboard(text);
                    if (ok) {
                        mod.setStatus(statusBar, 'Đã copy toàn bộ diễn tiến vào clipboard.', '#166534', true);
                        btnCopyAgain.dataset.clipboardText = text;
                        btnCopyAgain.style.display = 'inline-block';
                    } else {
                        mod.setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
                    }
                } catch (err) {
                    console.error(err);
                    mod.setStatus(statusBar, 'Lỗi: ' + (err && err.message ? err.message : 'Không rõ'), '#b91c1c', true);
                }
            });
            // Copy-again behavior
            btnCopyAgain.addEventListener('click', async () => {
                const mod = require('../components/copyDienTienAI');
                const cached = btnCopyAgain.dataset.clipboardText || '';
                const statusBar = document.getElementById('dr-copy-dien-tien-status') || document.createElement('div');
                if (!cached) {
                    mod.setStatus(statusBar, 'Chưa có dữ liệu để copy lại.', '#b91c1c', true);
                    return;
                }
                mod.setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
                const ok = await mod.copyToClipboard(cached);
                if (ok) mod.setStatus(statusBar, 'Đã copy lại vào clipboard.', '#166534', true);
                else mod.setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
            });
            sidebarActions.appendChild(btnCopy);
            sidebarActions.appendChild(btnCopyAgain);
        } catch (_) { }
        // HSBAv1 button now comes from components/actionButtons.js
        leftColumn.appendChild(sidebarActions);

        // Provide sidebar context for children (ctx id + abort signal)
        window.dr_sidebar_ctx = { id: sessionId, signal: SidebarSession.getSignal() };
        const info = createPatientInfoSection(patient, quickYLenhActions);
        leftColumn.appendChild(info);

        // Setup phẫu thuật handlers for the info section
        setupPhauThuatHandlers(info, patient);

        // Right column: Checklist section
        const rightColumn = document.createElement('div');
        rightColumn.className = 'dr-sidebar-right';
        rightColumn.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const checklistDiv = await createChecklistSectionAsync(patient);
        rightColumn.appendChild(checklistDiv);
        // Add HSBA Data tab into the same tabs bar
        try {
            const { addHSBATab } = require('../components/hsbaDataFetcher');
            addHSBATab(checklistDiv, patient);
        } catch (e) { console.warn('HSBA tab init failed', e); }

        // Add columns to container
        container.appendChild(leftColumn);
        container.appendChild(rightColumn);

        // Add container to sidebar plus an offline banner
        const offlineBanner = document.createElement('div');
        offlineBanner.className = 'dr-offline-banner';
        offlineBanner.textContent = 'Đang offline — thay đổi sẽ được lưu tạm và đồng bộ khi có mạng.';
        sidebar.appendChild(offlineBanner);
        // Replace loading content with actual content
        sidebar.innerHTML = '';
        sidebar.appendChild(offlineBanner);
        sidebar.appendChild(container);

        // Close button
        const closeBtn = ModalManager.setupCloseHandlers(sidebar, backdrop);
        sidebar.appendChild(closeBtn);

        // Modal is already visible (shown when spinner displayed); just ensure it stays shown
        ModalManager.showModal(sidebar, backdrop);

        // Toggle offline banner visibility
        const toggleOffline = () => {
            try {
                const b = document.querySelector('#dr-sidebar .dr-offline-banner');
                if (!b) return;
                b.style.display = (navigator && navigator.onLine === false) ? 'block' : 'none';
            } catch (_) { }
        };
        toggleOffline();
        try {
            window.addEventListener('online', toggleOffline, { once: true });
        } catch (_) { }

        // ─── Auto-sync checklist data every 800ms ───
        // This ensures sidebar data stays in sync if other users are updating the same patient
        const ChecklistAPIModule = require('../services/checklistAPIModule');
        let autoSyncInterval = null;
        const startAutoSync = () => {
            autoSyncInterval = setInterval(async () => {
                // Check if sidebar session is still active
                if (!SidebarSession.isActive(sessionId)) {
                    clearInterval(autoSyncInterval);
                    return;
                }

                try {
                    const freshData = await ChecklistAPIModule.getChecklistData(patient, { skipCache: true });
                    if (!freshData || !freshData.state) return;

                    // Compare and update if state changed
                    const oldStateStr = JSON.stringify(window.checklistState || {});
                    const newStateStr = JSON.stringify(freshData.state);
                    
                    if (oldStateStr !== newStateStr) {
                        console.log('Sidebar auto-sync: detected state change for patient', patient.mabn);
                        window.checklistObj = freshData.checklistObj;
                        window.checklistState = { ...freshData.state };
                        
                        // Update UI elements that may have changed (y lệnh, phẫu thuật)
                        try {
                            // Re-render y lệnh section if it exists
                            const yLenhList = document.querySelector('#dr-sidebar #dr-y-lenh-list');
                            if (yLenhList && typeof window.currentRenderYLenh === 'function') {
                                window.currentRenderYLenh(window.checklistState);
                            }
                        } catch (e) { console.warn('Sidebar auto-sync: failed to update y-lenh', e); }

                        try {
                            // Re-render phẫu thuật section if it exists
                            const phauThuatList = document.querySelector('#dr-sidebar #dr-phau-thuat-log-list');
                            if (phauThuatList && typeof window.currentRenderPhauThuatLog === 'function') {
                                window.currentRenderPhauThuatLog(window.checklistState);
                            }
                        } catch (e) { console.warn('Sidebar auto-sync: failed to update phau-thuat', e); }
                    }
                } catch (e) {
                    console.warn('Sidebar auto-sync error:', e);
                }
            }, 800);
        };

        // Start auto-sync when sidebar is fully rendered and visible
        startAutoSync();

        // Clean up auto-sync when sidebar closes
        const originalEndSession = SidebarSession.endSession;
        window.__drSidebarAutoSyncCleanup = () => {
            if (autoSyncInterval) {
                clearInterval(autoSyncInterval);
                autoSyncInterval = null;
            }
        };
        // Hook into modal close to stop auto-sync
        const origHideModal = ModalManager.hideModal;
        if (origHideModal) {
            ModalManager.hideModal = function(...args) {
                window.__drSidebarAutoSyncCleanup && window.__drSidebarAutoSyncCleanup();
                return origHideModal.apply(this, args);
            };
        }
    }



    function normalizePatientFilterText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function parseDashboardDate(dateStr) {
        if (!dateStr) return null;
        try {
            const raw = String(dateStr).trim();
            if (!raw) return null;

            let normalized = raw;
            if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
                normalized = raw.replace(' ', 'T');
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
                const [part1, part2, part3] = raw.split('/');
                const [year, time = '00:00'] = part3.split(' ');
                const num1 = parseInt(part1, 10);
                const num2 = parseInt(part2, 10);

                let day = part1;
                let month = part2;

                if (num1 <= 12 && num2 > 12) {
                    month = part1;
                    day = part2;
                }

                normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time || '00:00'}`;
            }

            const date = new Date(normalized);
            if (isNaN(date.getTime())) return null;
            date.setHours(0, 0, 0, 0);
            return date;
        } catch (_) {
            return null;
        }
    }

    function getPatientAdmissionTimestamp(item) {
        const admitDate = parseDashboardDate(item && (item.ngayvv || item.tungay));
        return admitDate ? admitDate.getTime() : null;
    }

    function getPatientStayDays(item) {
        const admitTs = getPatientAdmissionTimestamp(item);
        if (admitTs == null) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.floor((today.getTime() - admitTs) / (24 * 60 * 60 * 1000));
    }

    function decoratePatientFilterTarget(element, item, defaultOrder) {
        if (!element || !item) return element;

        element.__drPatientData = item;

        if (item.mabn) element.setAttribute('data-mabn', item.mabn);
        element.setAttribute('data-name', normalizePatientFilterText(item.hoten));
        element.setAttribute('data-cd', normalizePatientFilterText(item.chandoanvk));

        const loc = PatientDataMapper.formatRoomLocation(
            item.teN_PHONG,
            item.teN_GIUONG,
            item.teN_TANG,
            item.teN_TOANHA
        );
        element.setAttribute('data-loc', normalizePatientFilterText(loc));

        if (defaultOrder !== undefined && defaultOrder !== null) {
            element.dataset.defaultOrder = String(defaultOrder);
        }

        const admitTs = getPatientAdmissionTimestamp(item);
        if (admitTs != null) element.dataset.admitTs = String(admitTs);
        else delete element.dataset.admitTs;

        const stayDays = getPatientStayDays(item);
        if (stayDays != null) element.dataset.stayDays = String(stayDays);
        else delete element.dataset.stayDays;

        try {
            const today = new Date();
            const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            const log = item && item.checklistState && Array.isArray(item.checklistState.yLenhLog) ? item.checklistState.yLenhLog : [];
            let hasXV = false;
            let hasCLS = false;

            for (const entry of log) {
                if (!entry.timestamp || !entry.content) continue;
                if (!entry.timestamp.startsWith(todayStr)) continue;

                const content = entry.content.toLowerCase();
                if (content.includes('xuất viện')) {
                    if (entry.q === true && entry.action === 'Xuất viện') {
                        if (entry.status === 'active' || entry.status === 'done') hasXV = true;
                    } else {
                        hasXV = true;
                    }
                }
                if (content.includes('cận lâm sàng')) hasCLS = true;
            }

            element.dataset.hasxv = hasXV ? '1' : '0';
            element.dataset.hascls = hasCLS ? '1' : '0';
        } catch (_) {
            element.dataset.hasxv = '0';
            element.dataset.hascls = '0';
        }

        return element;
    }

    function renderCards(data) {
        const sortedData = PatientDataMapper.sortPatients([...data]);

        document.body.innerHTML = '';

        // Create top filter/search bar
        const topBar = document.createElement('div');
        topBar.className = 'dr-top-filter-bar';
        topBar.style.cssText = `
            position: sticky; top: 0; z-index: 1000;
            display: flex; align-items: center; gap: 12px;
            padding: 12px 16px; margin: 0 0 8px 0;
            background: #fff; border-bottom: 1px solid #e0e0e0;
        `;
        topBar.innerHTML = `
            <div class="dr-topbar-left" style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                <div class="dr-topbar-btn-wrap" style="position:relative;">
                    <button id="dr-tracking-btn" class="dr-topbar-control-btn" title="Danh sách bệnh nhân theo dõi khác khoa">
                        <i class="fas fa-user-clock"></i>
                        <span class="dr-topbar-btn-text">Theo dõi</span>
                    </button>
                    <span id="dr-tracking-badge" style="position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.2);">0</span>
                </div>
                <!-- Authors / Quick Login Dropdown -->
                <div class="dr-view-dropdown dr-topbar-dropdown" id="dr-authors-dropdown-container">
                    <button id="dr-authors-btn" class="dr-topbar-control-btn" title="Quản lý tài khoản & Đăng nhập nhanh">
                        <i class="fas fa-user-shield"></i>
                        <span class="dr-topbar-btn-text">Authors</span>
                    </button>
                    <div class="dr-dropdown-menu" style="min-width:240px; padding:8px 0;">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 16px; border-bottom:1px solid #f1f5f9; margin-bottom:4px;">
                            <span style="font-weight:700; color:#475569; font-size:13px;">Tài khoản đã lưu</span>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <button id="dr-authors-reload-btn" type="button" title="Tải lại danh sách account cloud" style="appearance:none; border:none; background:#f8fafc; color:#64748b; width:28px; height:28px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                                    <i class="fas fa-rotate-right"></i>
                                </button>
                                <a href="/?caidat=account-cloud" target="_blank" title="Cài đặt account cloud" style="color:#64748b; transition:color 0.2s; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f8fafc;"><i class="fas fa-cog"></i></a>
                            </div>
                        </div>
                        <div id="dr-authors-list" style="max-height:300px; overflow-y:auto;">
                            <div style="padding:12px; text-align:center; color:#94a3b8; font-size:12px;">Đang tải...</div>
                        </div>
                    </div>
                </div>
                <input id="dr-search-input" type="text" placeholder="Lọc BN theo tên, MABN, phòng, chẩn đoán... [/] để tìm nhanh"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                    style="flex:1; min-width: 220px; height:38px; padding: 0 10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">
            </div>
            <div class="dr-topbar-center" style="flex:0 0 auto; display:flex; justify-content:center; min-width:140px;">
                <span id="dr-total-compact" style="display:inline-block; text-align:center; color:#0f172a; font-weight:700; white-space:nowrap; background:#f1f5f9; border:1px solid #e2e8f0; padding:4px 10px; border-radius:9999px; min-width:110px;">0/0</span>
            </div>
            <div class="dr-topbar-right" style="flex:1; display:flex; align-items:center; justify-content:flex-end; gap:12px;">
                <div class="dr-view-dropdown dr-topbar-dropdown dr-sort-dropdown" id="dr-sort-dropdown-container">
                    <div class="dr-dropdown-toggle dr-topbar-control-btn" id="dr-sort-toggle" title="Sắp xếp danh sách bệnh nhân">
                        <span><i class="fas fa-sort-amount-down-alt" style="margin-right:0px; color:#1e88e5;"></i> <span class="dr-topbar-btn-text">Sắp xếp</span></span>
                        <i class="fas fa-chevron-down" style="font-size:0.8em; opacity:0.7;"></i>
                    </div>
                    <div class="dr-dropdown-menu">
                        <div class="dr-dropdown-item" data-sort="admit-asc">
                            <i class="fas fa-calendar-plus"></i> Sắp xếp theo ngày nhập viện (tăng dần)
                        </div>
                        <div class="dr-dropdown-item" data-sort="admit-desc">
                            <i class="fas fa-calendar-minus"></i> Sắp xếp theo ngày nhập viện (giảm dần)
                        </div>
                        <div class="dr-dropdown-item" data-sort="stay-asc">
                            <i class="fas fa-hourglass-start"></i> Sắp xếp theo tổng số ngày nằm viện (tăng dần)
                        </div>
                        <div class="dr-dropdown-item" data-sort="stay-desc">
                            <i class="fas fa-hourglass-end"></i> Sắp xếp theo tổng số ngày nằm viện (giảm dần)
                        </div>
                    </div>
                </div>

                <!-- Premium View Dropdown -->
                <div class="dr-view-dropdown dr-topbar-dropdown" id="dr-view-dropdown-container">
                    <div class="dr-dropdown-toggle dr-topbar-control-btn" id="dr-view-toggle-premium" style="height:38px; display:flex; align-items:center; box-sizing:border-box; padding: 0 12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; font-weight:600; color:#475569; gap:8px; cursor:pointer;">
                        <span><i class="fas fa-eye" style="margin-right:0px; color:#1e88e5;"></i> <span id="dr-view-label-text">Kiểu hiển thị</span></span>
                        <i class="fas fa-chevron-down" style="font-size:0.8em; opacity:0.7;"></i>
                    </div>
                    <div class="dr-dropdown-menu">
                        <div class="dr-dropdown-item" data-view="grid">
                            <i class="fas fa-th-large"></i> Lưới
                        </div>
                        <div class="dr-dropdown-item" data-view="list">
                            <i class="fas fa-list"></i> Danh sách
                        </div>
                        <div class="dr-dropdown-item" data-view="fit">
                            <i class="fas fa-expand-arrows-alt"></i> Vừa màn hình
                        </div>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        // View state
        let view = (localStorage.getItem(VIEW_KEY) || localStorage.getItem('dr-view-mode') || 'grid');

        // Safety: ensure view is one of supported
        if (!['grid', 'list', 'fit'].includes(view)) view = 'grid';

        const dropdownContainer = topBar.querySelector('#dr-view-dropdown-container');
        const viewLabelText = topBar.querySelector('#dr-view-label-text');
        const dropdownItems = topBar.querySelectorAll('#dr-view-dropdown-container .dr-dropdown-item');
        const sortDropdownContainer = topBar.querySelector('#dr-sort-dropdown-container');
        const sortToggle = topBar.querySelector('#dr-sort-toggle');
        const sortItems = topBar.querySelectorAll('#dr-sort-dropdown-container .dr-dropdown-item');
        const authorsContainer = topBar.querySelector('#dr-authors-dropdown-container');
        const authorsBtn = topBar.querySelector('#dr-authors-btn');
        const authorsReloadBtn = topBar.querySelector('#dr-authors-reload-btn');
        const authorsList = topBar.querySelector('#dr-authors-list');

        const SORT_KEY = 'dr-card-sort';
        const validSortKeys = new Set(['default', 'admit-asc', 'admit-desc', 'stay-asc', 'stay-desc']);
        let currentSort = localStorage.getItem(SORT_KEY) || 'default';
        let cloudAccounts = Array.isArray(dashboardCloudContext.cloudAccounts) ? [...dashboardCloudContext.cloudAccounts] : [];
        let cloudAccountsLoaded = !!dashboardCloudContext.bootstrapLoaded;
        let cloudAccountsLoading = null;

        const setAuthorsReloadButtonState = (loading) => {
            if (!authorsReloadBtn) return;
            authorsReloadBtn.disabled = !!loading;
            authorsReloadBtn.style.opacity = loading ? '0.65' : '1';
            authorsReloadBtn.style.cursor = loading ? 'wait' : 'pointer';
            authorsReloadBtn.innerHTML = loading
                ? '<i class="fas fa-spinner fa-spin"></i>'
                : '<i class="fas fa-rotate-right"></i>';
        };

        if (!validSortKeys.has(currentSort)) currentSort = 'default';

        const updateViewUI = (newView) => {
            const labels = { 'grid': 'Lưới', 'list': 'Danh sách', 'fit': 'Vừa màn hình' };
            if (viewLabelText) viewLabelText.textContent = labels[newView] || 'Kiểu hiển thị';
            dropdownItems.forEach(item => {
                if (item.getAttribute('data-view') === newView) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        const getDefaultOrder = (element) => Number(element && element.dataset ? element.dataset.defaultOrder || '0' : '0');
        const getNumericSortValue = (element, sortKey) => {
            if (!element) return null;

            if (sortKey === 'admit-asc' || sortKey === 'admit-desc') {
                const value = Number(element.dataset.admitTs);
                return Number.isFinite(value) ? value : null;
            }

            if (sortKey === 'stay-asc' || sortKey === 'stay-desc') {
                const value = Number(element.dataset.stayDays);
                return Number.isFinite(value) ? value : null;
            }

            return null;
        };

        const compareNullableNumbers = (aValue, bValue, direction, aFallback, bFallback) => {
            const aMissing = !Number.isFinite(aValue);
            const bMissing = !Number.isFinite(bValue);

            if (aMissing && bMissing) return aFallback - bFallback;
            if (aMissing) return 1;
            if (bMissing) return -1;
            if (aValue !== bValue) return direction === 'asc' ? aValue - bValue : bValue - aValue;
            return aFallback - bFallback;
        };

        const updateSortUI = (sortKey) => {
            sortItems.forEach(item => {
                if (item.getAttribute('data-sort') === sortKey) item.classList.add('active');
                else item.classList.remove('active');
            });

            if (sortDropdownContainer) {
                sortDropdownContainer.classList.toggle('dr-sort-active', sortKey !== 'default');
            }

            if (sortToggle) {
                const titleMap = {
                    'admit-asc': 'Sắp xếp theo ngày nhập viện (tăng dần)',
                    'admit-desc': 'Sắp xếp theo ngày nhập viện (giảm dần)',
                    'stay-asc': 'Sắp xếp theo tổng số ngày nằm viện (tăng dần)',
                    'stay-desc': 'Sắp xếp theo tổng số ngày nằm viện (giảm dần)'
                };
                sortToggle.title = sortKey === 'default'
                    ? 'Sắp xếp danh sách bệnh nhân'
                    : `Đang ${titleMap[sortKey]}. Click lại lựa chọn đang bật để về mặc định.`;
            }
        };

        const applySelectedSort = () => {
            const elements = Array.from(container.children);
            if (elements.length === 0) return;

            elements.sort((a, b) => {
                const aFallback = getDefaultOrder(a);
                const bFallback = getDefaultOrder(b);

                if (currentSort === 'default') return aFallback - bFallback;

                const direction = currentSort.endsWith('desc') ? 'desc' : 'asc';
                return compareNullableNumbers(
                    getNumericSortValue(a, currentSort),
                    getNumericSortValue(b, currentSort),
                    direction,
                    aFallback,
                    bFallback
                );
            });

            elements.forEach(element => container.appendChild(element));
            updateSortUI(currentSort);
        };

        const setCurrentSort = (sortKey) => {
            currentSort = validSortKeys.has(sortKey) ? sortKey : 'default';

            if (currentSort === 'default') localStorage.removeItem(SORT_KEY);
            else localStorage.setItem(SORT_KEY, currentSort);

            applySelectedSort();
        };

        const normalizeCloudAccounts = (accounts) => {
            if (!Array.isArray(accounts)) return [];
            return accounts
                .map(acc => {
                    if (!acc || typeof acc !== 'object') return null;
                    return {
                        title: String(acc.title || '').trim(),
                        username: String(acc.username || '').trim(),
                        password: String(acc.password || '')
                    };
                })
                .filter(acc => acc && acc.username);
        };

        const loadCloudAccounts = async ({ force = false, showLoading = false } = {}) => {
            if (cloudAccountsLoaded && !force) return cloudAccounts;
            if (cloudAccountsLoading) return cloudAccountsLoading;

            if (showLoading && authorsList) {
                authorsList.innerHTML = '<div style="padding:12px; text-align:center; color:#94a3b8; font-size:12px;">Đang tải...</div>';
            }
            setAuthorsReloadButtonState(true);

            cloudAccountsLoading = (async () => {
                try {
                    const SettingsService = require('../services/settingsService');
                    const cloudData = await SettingsService.getOrCreateSettings();
                    const s = cloudData && cloudData.settings ? cloudData.settings : null;
                    const list = await SettingsService.getCloudAccounts(s || {}, {
                        doctorName: cloudData && cloudData.doctorName,
                        chungThuSo: cloudData && cloudData.chungThuSo
                    });
                    cloudAccounts = normalizeCloudAccounts(list);
                    dashboardCloudContext = {
                        doctorName: cloudData && cloudData.doctorName,
                        chungThuSo: cloudData && cloudData.chungThuSo,
                        checklistObj: cloudData && cloudData.checklistObj,
                        settings: s || SettingsService.getDefaultSettings(),
                        cloudAccounts: [...cloudAccounts],
                        bootstrapLoaded: true
                    };

                    if (s && s.dashboard && typeof s.dashboard === 'object') {
                        applyDashboardSettingsToLocalStorage(s.dashboard);
                        applyCardHoverTooltipSetting();
                    }
                } catch (e) {
                    console.warn('Cloud authors load failed', e);
                    cloudAccounts = [];
                } finally {
                    cloudAccountsLoaded = true;
                    cloudAccountsLoading = null;
                    setAuthorsReloadButtonState(false);
                }
                return cloudAccounts;
            })();

            return cloudAccountsLoading;
        };

        const renderAuthorsList = () => {
            if (!authorsList) return;
            const accounts = cloudAccounts;
            if (accounts.length === 0) {
                authorsList.innerHTML = `
                    <div style="padding:16px; text-align:center;">
                        <div style="color:#64748b; font-size:12px; margin-bottom:8px;">Chưa có account cloud nào được lưu</div>
                        <a href="/?caidat=account-cloud" target="_blank" style="display:inline-block; background:#2563eb; color:#fff; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; text-decoration:none;">Thêm ngay</a>
                    </div>
                `;
                return;
            }
            authorsList.innerHTML = '';
            accounts.forEach(acc => {
                const item = document.createElement('div');
                item.className = 'dr-dropdown-item';
                item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px 16px;';
                item.innerHTML = `
                    <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                        <span style="font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${acc.title || acc.username}</span>
                        <span style="font-size:11px; color:#64748b;">${acc.username}</span>
                    </div>
                    <button class="dr-quick-login-btn" style="background:#f1f5f9; color:#2563eb; border:none; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s;">Login 🕵️</button>
                `;
                item.querySelector('.dr-quick-login-btn').onclick = async (e) => {
                    e.stopPropagation();
                    if (!acc.username || !acc.password) return;

                    // Save credentials to GM storage
                    const loginKey = `dr_quick_login_${acc.username}`;
                    await GM.setValue(loginKey, JSON.stringify({
                        username: acc.username,
                        password: acc.password,
                        ts: Date.now()
                    }));

                    // Open incognito tab
                    if (typeof GM_openInTab === 'function') {
                        GM_openInTab(window.location.origin + '/Home/Login?quicklogin=' + encodeURIComponent(acc.username), {
                            active: true,
                            insert: true,
                            incognito: true
                        });
                    } else {
                        alert('Tiện ích cần quyền GM_openInTab để thực hiện tính năng này.');
                    }
                };
                authorsList.appendChild(item);
            });
        };

        // Initialize UI
        updateViewUI(view);
        updateSortUI(currentSort);

        if (cloudAccountsLoaded) {
            renderAuthorsList();
        } else {
            (async () => {
                try {
                    await loadCloudAccounts({ showLoading: true });
                } catch(e) { console.warn('Cloud sync failed on start', e); }
                renderAuthorsList();
            })();
        }

        if (sortToggle) {
            sortToggle.onclick = (e) => {
                e.stopPropagation();
                sortDropdownContainer.classList.toggle('open');
            };
        }

        if (authorsBtn) {
            authorsBtn.onclick = (e) => {
                e.stopPropagation();
                authorsContainer.classList.toggle('open');
                if (authorsContainer.classList.contains('open') && cloudAccountsLoaded) {
                    renderAuthorsList();
                }
            };
        }

        if (authorsReloadBtn) {
            authorsReloadBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await loadCloudAccounts({ force: true, showLoading: true });
                    renderAuthorsList();
                    showToast('Đã tải lại danh sách account cloud', 'success', 2200);
                } catch (err) {
                    console.warn('Manual cloud authors reload failed', err);
                    showToast('Không thể tải lại account cloud', 'error', 2500);
                }
            };
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (sortDropdownContainer) sortDropdownContainer.classList.remove('open');
            if (authorsContainer) authorsContainer.classList.remove('open');
        });

        // Handle item selection
        dropdownItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const targetView = item.getAttribute('data-view');
                if (targetView === view) return;

                localStorage.setItem(VIEW_KEY, targetView);
                localStorage.setItem('dr-view-mode', targetView);
                scheduleDashboardSettingsSync();

                // If switching between fit and others, we might need a full re-render or reload
                // For now, let's try to just re-trigger renderCards if it's fit mode,
                // but since the container structure changes much, a reload or re-exec of renderCards with original data is safer.
                // However, the requested behavior is "không reload lại trang web".

                if (targetView === 'fit' || view === 'fit') {
                    // Re-render everything with the new view
                    renderCards(data);
                } else {
                    // Classic behavior for grid/list (might involve reload if complex)
                    renderCards(data);
                }
            };
        });

        sortItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const targetSort = item.getAttribute('data-sort') || 'default';
                const nextSort = targetSort === currentSort ? 'default' : targetSort;
                setCurrentSort(nextSort);
                if (sortDropdownContainer) sortDropdownContainer.classList.remove('open');
                applyFilter();
            };
        });

        if (!localStorage.getItem(VIEW_KEY)) localStorage.setItem(VIEW_KEY, view);

        if (view === 'fit') {
            container.className = 'dr-fit-container';
            container.style.paddingBottom = '0'; // Clean slate for fit mode
            document.body.classList.add('dr-fit-mode');
        } else {
            container.className = view === 'list' ? 'dr-list-container' : 'dr-card-list';
            container.style.paddingBottom = '90px';
            document.body.classList.remove('dr-fit-mode');
        }

        const renderItemGrid = (item) => createPatientCard(item);
        const { createListRow } = require('../components/listView');
        const renderItemList = (item) => createListRow(item, { onOpen: () => showSidebar(item) });
        const renderer = view === 'list' ? renderItemList : renderItemGrid;
        sortedData.forEach((item, index) => {
            const card = renderer(item);
            decoratePatientFilterTarget(card, item, index);
            container.appendChild(card);
        });

        // Introduce a generalized wrapper for ALL views so layout padding/margins apply consistently
        const wrapper = document.createElement('div');
        wrapper.id = 'dr-main-wrapper';
        wrapper.style.cssText = 'transition: margin-left 0.2s ease; width: 100%; box-sizing: border-box;';
        wrapper.appendChild(container);

        // Append top bar then wrapper
        document.body.appendChild(topBar);
        document.body.appendChild(wrapper);

        // Add bottom bar
        createBottomBar();

        try {
            const displaySettings = require('../components/displaySettings');
            displaySettings.createIcon(topBar);
        } catch(e) { console.warn('Lỗi init display settings', e); }

        // Setup Advanced Filter
        setupAdvancedFilter(topBar, () => applyFilter());

        // Setup Tracking UI
        try {
            const { setupTrackingUI } = require('../components/trackingUI');
            setupTrackingUI(topBar, wrapper, createPatientCard, applyFilter);
        } catch (e) {
            console.error('Lỗi khi setup Tracking UI:', e);
        }

        // Filter logic
        const searchInput = topBar.querySelector('#dr-search-input');
        const totalCompact = topBar.querySelector('#dr-total-compact');

        function getCardVisibilityState(card, keywords) {
            const nameAttr = card.getAttribute('data-name') || '';
            const mabnAttr = card.getAttribute('data-mabn') || '';
            const cdAttr = card.getAttribute('data-cd') || '';
            const locAttr = card.getAttribute('data-loc') || '';
            const fullTxt = card.textContent || '';

            const matchesText = keywords.length === 0 || keywords.every(k => {
                const searchKey = k.toLowerCase();
                const useExactMatch = hasAccents(k);

                if (useExactMatch) {
                    return nameAttr.toLowerCase().includes(searchKey) ||
                        mabnAttr.toLowerCase().includes(searchKey) ||
                        cdAttr.toLowerCase().includes(searchKey) ||
                        locAttr.toLowerCase().includes(searchKey) ||
                        fullTxt.toLowerCase().includes(searchKey);
                }

                const normKey = removeAccents(searchKey);
                return removeAccents(nameAttr).includes(normKey) ||
                    removeAccents(mabnAttr).includes(normKey) ||
                    removeAccents(cdAttr).includes(normKey) ||
                    removeAccents(locAttr).includes(normKey) ||
                    removeAccents(fullTxt).includes(normKey);
            });

            const matchesXV = !advancedFilterState.onlyXuatVien || card.dataset.hasxv === '1' || card.classList.contains('xuatvienanimation');
            const matchesCLS = !advancedFilterState.onlyCanLamSang || card.dataset.hascls === '1';
            const item = card.__drPatientData || sortedData.find(p => p.mabn === card.getAttribute('data-mabn'));
                // Only run advanced filter logic if there are advanced criteria (not just quick filters)
                const hasAdvancedCriteria = !!(advancedFilterState.surgeryName || advancedFilterState.surgeons.length > 0 || advancedFilterState.surgeryDate || advancedFilterState.yLenhTags.length > 0);
                const matchesAdvanced = !hasAdvancedCriteria || (item && matchesAdvancedFilter(item));

            return matchesText && matchesXV && matchesCLS && matchesAdvanced;
        }

        function updateCardDisplay(card, show) {
            const trackingWrapper = card.closest('.dr-tracking-card-wrap');
            if (trackingWrapper) {
                trackingWrapper.style.display = show ? '' : 'none';
                card.style.display = '';
                return;
            }

            card.style.display = show ? '' : 'none';
        }

        function applyFilter() {
            const rawQ = (searchInput.value || '').trim();
            let visible = 0;

            // Split by comma and process each keyword
            const keywords = rawQ.split(',')
                .map(k => k.trim())
                .filter(k => k !== '');

            const mainCards = container.querySelectorAll('.dr-card, .dr-list-row');
            mainCards.forEach(card => {
                const show = getCardVisibilityState(card, keywords);
                updateCardDisplay(card, show);
                if (show) visible++;
            });

            const trackingCards = document.querySelectorAll('#dr-tracking-active-list .dr-card');
            trackingCards.forEach(card => {
                const show = getCardVisibilityState(card, keywords);
                updateCardDisplay(card, show);
            });

            // Update centered compact total, integrating the filter count
            if (totalCompact) {
                const hasFilter = !!(keywords.length > 0 || advancedFilterState.active);
                totalCompact.textContent = hasFilter ? `Hiển thị: ${visible}/${sortedData.length}` : `${visible}/${sortedData.length}`;
                // Color accents: blue when filtered, neutral otherwise
                if (hasFilter) {
                    totalCompact.style.background = '#e3f2fd';
                    totalCompact.style.borderColor = '#bbdefb';
                    totalCompact.style.color = '#1976d2';
                } else {
                    totalCompact.style.background = '#f1f5f9';
                    totalCompact.style.borderColor = '#e2e8f0';
                    totalCompact.style.color = '#0f172a';
                }
            }

            if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
        }

        searchInput.addEventListener('input', applyFilter);

        // Escape key to clear search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                applyFilter();
                // Optionally blur after clearing
                // searchInput.blur();
            }
        });

        // Hotkey support: "/" to focus search
        const hotkeyHandler = (e) => {
            // Only trigger if not already in an input/textarea
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                const input = document.getElementById('dr-search-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
        };
        document.addEventListener('keydown', hotkeyHandler);

        // Fit to Screen dynamic adjustment logic
        function updateFitLayout() {
            if (view !== 'fit') return;
            
            const cards = Array.from(container.querySelectorAll('.dr-card')).filter(card => card.style.display !== 'none');
            if (cards.length === 0) return;
            
            const count = cards.length;
            const w = window.innerWidth - 30; // 15px padding each side
            
            const topBarH = topBar.offsetHeight;
            const bottomBar = document.querySelector('.dr-bottom-bar');
            const bottomBarH = bottomBar ? bottomBar.offsetHeight : 0;
            
            const h = window.innerHeight - (topBarH + bottomBarH + 30); // 15px padding top/bottom
            
            // Try to find best grid (rows x cols)
            let bestCols = 1;
            let bestRows = count;
            let minDiff = Infinity;
            
            for (let cols = 1; cols <= count; cols++) {
                const rows = Math.ceil(count / cols);
                const cardW = w / cols;
                const cardH = h / rows;
                const ratio = cardW / cardH;
                const diff = Math.abs(ratio - 1.4); // Target aspect ratio ~1.4
                if (diff < minDiff) {
                    minDiff = diff;
                    bestCols = cols;
                    bestRows = rows;
                }
            }
            
            container.style.gridTemplateColumns = `repeat(${bestCols}, 1fr)`;
            // Use minmax(0, 1fr) to prevent content from expanding the row height
            container.style.gridTemplateRows = `repeat(${bestRows}, minmax(0, 1fr))`;
            container.style.height = `${h + 30}px`; // +30 for the internal padding of container
            
            // Scale text based on card height
            const cardH = h / bestRows;
            const baseSize = Math.max(10, Math.min(16, cardH / 15));
            container.style.setProperty('--fit-title-size', `${baseSize * 1.2}px`);
            container.style.setProperty('--fit-name-size', `${baseSize * 1.1}px`);
            container.style.setProperty('--fit-text-size', `${baseSize}px`);
        }

        // Expose to window for post-enrichment updates
        if (typeof unsafeWindow !== 'undefined') unsafeWindow.dr_updateFitLayout = updateFitLayout;
        else globalThis.dr_updateFitLayout = updateFitLayout;

        if (view === 'fit') {
            window.addEventListener('resize', updateFitLayout);
            setTimeout(updateFitLayout, 0);
        }

        // Run first filter
        const totalCompactInit = document.getElementById('dr-total-compact');
        if (totalCompactInit) {
            totalCompactInit.textContent = `${sortedData.length}/${sortedData.length}`;
            totalCompactInit.style.background = '#f1f5f9';
            totalCompactInit.style.borderColor = '#e2e8f0';
            totalCompactInit.style.color = '#0f172a';
        }
        applySelectedSort();
        applyFilter();

        // Prefill from query param ?q=
        try {
            const u = new URL(window.location.href);
            const qParam = u.searchParams.get('q');
            if (qParam) {
                searchInput.value = qParam;
                applyFilter();
            }
        } catch (_) { }

        const refreshPatientCards = function (newData) {
            const cardsByPid = new Map();
            container.querySelectorAll('.dr-card, .dr-list-row').forEach(card => {
                const mabn = card.getAttribute('data-mabn');
                if (mabn) cardsByPid.set(mabn, card);
            });

            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const card = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (card) {
                    decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                    // Update merged diagnosis line (Chẩn đoán + CD kèm theo)
                    try {
                        const diagnosisEl = card.querySelector('.dr-diagnosis-line');
                        if (diagnosisEl) {
                            const { composeDiagnosis } = DomUpdaters;
                            const { baseText: baseCdNew, cdktText, combinedHtml } = composeDiagnosis(item);
                            diagnosisEl.dataset.baseCd = baseCdNew;
                            diagnosisEl.dataset.cdkt = cdktText || '';
                            diagnosisEl.innerHTML = `<span class="dr-label">Chẩn đoán:</span> ${combinedHtml}`;
                        }
                        // remove any legacy block if present
                        const oldCdkt = card.querySelector('.dr-cdkt-block');
                        if (oldCdkt) oldCdkt.remove();
                    } catch (_) { }
                    // Update surgery info with post-op days using shared updater
                    DomUpdaters.updateSurgeryInfo(card, item);

                    // Update HXT line in the card/list row
                    DomUpdaters.updateHXT(item);

                    // Update y lệnh tags if checklistState is available
                    if (item.checklistState) {
                        DomUpdaters.updateTagsAndMedsBadge(card, item);
                    }

                    // Update surgery status icon
                    DomUpdaters.updateSurgeryIcon(card, item);

                    // Re-evaluate filter visibility and layout after updates
                    // Delay to allow DOM/class updates done elsewhere
                    setTimeout(() => {
                        applySelectedSort();
                        applyFilter();
                        if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
                    }, 0);
                }
            });
        };

        // Make functions available for global use
        if (typeof unsafeWindow !== 'undefined') {
            unsafeWindow.refreshPatientCards = refreshPatientCards;
            unsafeWindow.checkAllCelebrationAnimations = checkAllCelebrationAnimations;
        } else if (typeof this !== 'undefined') {
            this.refreshPatientCards = refreshPatientCards;
            this.checkAllCelebrationAnimations = checkAllCelebrationAnimations;
        } else {
            globalThis.refreshPatientCards = refreshPatientCards;
            globalThis.checkAllCelebrationAnimations = checkAllCelebrationAnimations;
        }

        // View toggle logic removed as it's now handled by the premium dropdown
    }



    function createPatientCard(item) {
        const room = item.teN_PHONG || '';
        const isWhite = PatientDataMapper.isWhiteCard(room);
        const card = document.createElement('div');
        card.className = 'dr-card' + (isWhite ? '' : ' dr-blue');
        decoratePatientFilterTarget(card, item);

        // Format location using the new utility function
        const formattedLocation = PatientDataMapper.formatRoomLocation(
            item.teN_PHONG,
            item.teN_GIUONG,
            item.teN_TANG,
            item.teN_TOANHA
        );

        const ptInfo = formatSurgeryInfo(item);

        const hxtText = (item.checklistState && item.checklistState.huongXuTri) ? String(item.checklistState.huongXuTri).trim() : '';
        const hxtHtml = hxtText ? `<div class="dr-value dr-hxt-block"><span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}</div>` : '';
        const { baseText: baseDiagnosis, cdktText, combinedHtml: combinedDiagnosis } = DomUpdaters.composeDiagnosis(item);
        card.innerHTML = `
            <div class="dr-room-label">${formattedLocation}</div>
            <h2 class="dr-patient-name">${item.hoten || ''}</h2>
            <div class="dr-patient-sub-info">
                <span class="dr-patient-mabn" style="cursor:pointer;" title="Click để copy mã BN">${item.mabn || ''}</span>
                <span class="dr-patient-gender">${item.phai === 1 ? 'Nữ' : 'Nam'}</span>
            </div>
            <div class="dr-value dr-dob-line"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
            <div class="dr-value dr-diagnosis-line" data-base-cd="${baseDiagnosis.replace(/"/g, '&quot;')}" data-cdkt="${escapeHtml(cdktText).replace(/"/g, '&quot;')}"><span class="dr-label">Chẩn đoán:</span> ${combinedDiagnosis}</div>
            ${ptInfo}
            ${hxtHtml}
            ${createYLenhTags(item)}
        `;
        // mark base diagnosis for future updates
        try {
            const diagEl = card.querySelector('.dr-diagnosis-line');
            if (diagEl) {
                diagEl.dataset.baseCd = baseDiagnosis;
                diagEl.dataset.cdkt = cdktText || '';
            }
        } catch (_) { }
        if (item && item.mabn && !card.getAttribute('data-mabn')) {
            card.setAttribute('data-mabn', item.mabn);
        }

        // Add action buttons
        const btnGroup = createActionButtons(item);
        card.appendChild(btnGroup);

        // Add surgery status icon
        addSurgeryStatusIcon(card, item);
        // Show meds-done badge if applicable
        try { updateMedsDoneBadge(card, item); } catch (_) { }

        card.onclick = () => showSidebar(item);
        
        try {
            const contextMenu = require('../components/contextMenu');
            contextMenu.attachToCard(card, item);
        } catch(e) { console.warn('Lỗi attach contextMenu', e); }

        const pidSpan = card.querySelector('.dr-patient-mabn');
        if (pidSpan && item.mabn) {
            pidSpan.onclick = async (e) => {
                e.stopPropagation(); // prevent opening sidebar
                try {
                    const displaySettings = require('../components/displaySettings');
                    if (displaySettings.get('autoCopyPID')) {
                        const { copyToClipboard, showToast } = require('../utils/uiUtils');
                        const success = await copyToClipboard(item.mabn);
                        if (success) {
                            showToast(`Đã copy PID: ${item.mabn}`);
                        }
                    }
                } catch(err) { console.warn('Lỗi copy PID', err); }
            };
        }

        // Preload HXT from checklist state after rendering card (non-blocking)
        setTimeout(() => {
            preloadHXTForPatient(item);
        }, 0);

        // Global hover tooltip
        cardTooltip.attach(card, card);

        return card;
    }

    // List view row now lives in components/listView.js

    // escapeHtml provided by utils/htmlUtils

    // Update HXT on a card when sidebar saves
    function updatePatientCardHXT(patient) { try { DomUpdaters.updateHXT(patient); } catch (_) { } }

    // Update Chẩn đoán kèm theo on a card when sidebar saves
    function updatePatientCardCDKT(patient) { try { DomUpdaters.updateCDKT(patient); } catch (_) { } }

    // Preload HXT for a patient by fetching checklist state if not present
    async function preloadHXTForPatient(item) {
        try {
            if (!item || !item.mabn) return;
            const existing = item.checklistState && typeof item.checklistState.huongXuTri === 'string' ? item.checklistState.huongXuTri.trim() : '';
            if (existing) {
                DomUpdaters.updateHXT(item);
                return;
            }
            const res = await ChecklistService.loadChecklistData(item);
            const obj = ChecklistService.findChecklistObject(res);
            if (!obj) return;
            const state = ChecklistService.parseChecklistState(obj) || {};
            const hxt = typeof state.huongXuTri === 'string' ? state.huongXuTri.trim() : '';
            if (!hxt) return;
            // Update dr_data entry
            if (window.dr_data && Array.isArray(window.dr_data)) {
                const idx = window.dr_data.findIndex(p => p.mabn === item.mabn);
                if (idx >= 0) {
                    const oldState = window.dr_data[idx].checklistState || {};
                    window.dr_data[idx].checklistState = { ...oldState, ...state };
                }
            }
            // Update card view with merged state
            const updated = { ...item, checklistState: { ...(item.checklistState || {}), ...state } };
            DomUpdaters.updateHXT(updated);
            try { DomUpdaters.updateCDKT(updated); } catch (_) { }
            // Trigger layout recalculation after enrichment
            if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
        } catch (e) {
            console.warn('Preload HXT failed for', item?.mabn, e);
        }
    }







    // Helper function to create action buttons
    function createActionButtons(item) {
        const { createToDieuTriButton, createHsbaButton, createCopyOneButton } = require('../components/actionButtons');
        const btnToDieuTri = createToDieuTriButton({ item, variant: 'full' });
        const btnHsba2 = createHsbaButton({ item, variant: 'full' });
        const btnCopyOne = createCopyOneButton({ item, variant: 'icon' });

        const btnGroup = document.createElement('div');
        btnGroup.className = 'dr-action-buttons';
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '8px';
        btnGroup.style.justifyContent = 'flex-end';
        btnGroup.style.alignItems = 'center';
        btnGroup.style.position = 'absolute';
        btnGroup.style.right = '16px';
        btnGroup.style.bottom = '12px';

        btnGroup.appendChild(btnCopyOne);
        btnGroup.appendChild(btnToDieuTri);
        btnGroup.appendChild(btnHsba2);

        return btnGroup;
    }

    // Button creators moved to components/actionButtons.js

    // Helper function to create bottom bar
    function createBottomBar() {
        const bottomBar = document.createElement('div');
        bottomBar.className = 'dr-bottom-bar';
        bottomBar.innerHTML = `
            <div class="dr-bottom-bar-left">
                <a id="dr-settings-btn" class="dr-gear-btn" href="/?caidat" target="_blank" title="Cài đặt">
                    <i class="fas fa-cog"></i>
                </a>
                <select id="dr-khoa-select" class="dr-khoa-select" title="Chọn khoa"></select>
                <span id="dr-khoa-loading-status" style="font-size:12px;color:#475569;white-space:nowrap;"></span>
            </div>
        `;
        document.body.appendChild(bottomBar);

        // Add OTM buttons to bottom bar
        addOTMButtonsToBottomBar(bottomBar);

        // Bottom bar styles come from addGlobalStyles()


        // Populate khoa dropdown and wire change
        (async () => {
            try {
                const select = document.getElementById('dr-khoa-select');
                if (!select) return;
                select.innerHTML = `<option>Đang tải khoa...</option>`;
                await refreshKhoaSelectByAccess({
                    reloadDataIfChanged: false,
                    forceReloadList: !Array.isArray(khoaSelectOptionsCache) || !khoaSelectOptionsCache.length
                });
                select.addEventListener('change', async (e) => {
                    const val = e.target.value;
                    lastManualKhoaId = String(val || '').trim();
                    const selectedOpt = e.target.options[e.target.selectedIndex];
                    const selectedName = (selectedOpt && selectedOpt.textContent) || val;
                    try { localStorage.setItem('bsnt_khoa_dashboard', String(val)); } catch (_) { }
                    await reloadDashboardForSelectedKhoa(selectedName);
                });
            } catch (e) {
                console.warn('Load khoa for bottom bar failed', e);
            }
        })();
    }

    // Bottom bar styling helper removed (centralized in dashboard.support.js)
    // Main logic
    async function initializeDashboard() {
        applyCardHoverTooltipSetting();

        const cloudData = await SettingsService.getOrCreateSettings().catch((e) => {
            console.warn('Load dashboard cloud settings failed', e);
            return null;
        });

        if (cloudData && cloudData.settings) {
            applyDashboardSettingsToLocalStorage(cloudData.settings.dashboard || {});
            applyCardHoverTooltipSetting();

            let cloudAccounts = [];
            try {
                cloudAccounts = await SettingsService.getCloudAccounts(cloudData.settings || {}, {
                    doctorName: cloudData.doctorName,
                    chungThuSo: cloudData.chungThuSo
                });
            } catch (e) {
                console.warn('Load bootstrap cloud accounts failed', e);
            }

            dashboardCloudContext = {
                doctorName: cloudData.doctorName || '',
                chungThuSo: cloudData.chungThuSo || '',
                checklistObj: cloudData.checklistObj || null,
                settings: cloudData.settings || SettingsService.getDefaultSettings(),
                cloudAccounts: Array.isArray(cloudAccounts) ? cloudAccounts : [],
                bootstrapLoaded: true
            };

            const allowedIds = getAccessibleKhoaIds(dashboardCloudContext.settings || {});
            if (allowedIds.length) {
                const currentKhoa = String(getSelectedKhoa('551'));
                if (!allowedIds.includes(currentKhoa)) {
                    try {
                        localStorage.setItem('bsnt_khoa_dashboard', allowedIds[0]);
                    } catch (_) {}
                }
            }
        }

        const data = await PatientService.loadPatientDataWithErrorHandling();

        if (data) {
            renderCards(filterDataByAccessibleKhoa(data, dashboardCloudContext.settings || {}));
        }
    }

    // Helper function to try closing a tab using multiple methods
    function tryCloseTab(tab) {
        // Method 1: Try GM.closeTab with tab object
        if (typeof GM !== 'undefined' && GM.closeTab) {
            try {
                GM.closeTab(tab);
                console.log('Closed OTM tab using GM.closeTab(tab)');
                return false; // Remove from array
            } catch (gmError) {
                console.log('GM.closeTab(tab) failed, trying alternatives:', gmError);
            }
        }

        // Method 2: Try tab.close() if available
        if (tab.close && typeof tab.close === 'function') {
            try {
                tab.close();
                console.log('Closed OTM tab using tab.close()');
                return false; // Remove from array
            } catch (closeError) {
                console.log('tab.close() failed:', closeError);
            }
        }

        // Method 3: Try window.close() on the tab
        if (tab.window && tab.window.close) {
            try {
                tab.window.close();
                console.log('Closed OTM tab using tab.window.close()');
                return false; // Remove from array
            } catch (windowError) {
                console.log('tab.window.close() failed:', windowError);
            }
        }

        // Method 4: For GM tabs, try posting a message to close
        if (tab.postMessage) {
            try {
                tab.postMessage({ type: 'close-otm-tab' }, '*');
                console.log('Sent close message to OTM tab');
                return false; // Remove from array
            } catch (msgError) {
                console.log('postMessage failed:', msgError);
            }
        }

        console.log('All close methods failed for OTM tab');
        return true; // Keep in array
    }

    // Handle OTM close tab messages
    function handleOTMCloseTab(name, oldValue, newValue, remote) {
        try {
            const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
            console.log('[OTM Close Tab] Received close request:', data.data);
            console.log('[OTM Close Tab] Current openTabs:', window.openTabs);
            console.log('[OTM Close Tab] openTabs length:', window.openTabs.length);

            // Close OTM tabs from stored references
            if (window.openTabs && window.openTabs.length > 0) {
                window.openTabs = window.openTabs.filter(tabInfo => {
                    if (tabInfo && tabInfo.hostname === 'otm.tahospital.vn') {
                        try {
                            const tab = tabInfo.tab;

                            // Handle case where tab is a Promise (from GM.openInTab)
                            if (tab && typeof tab.then === 'function') {
                                console.log('Tab is a Promise, waiting for resolution...');
                                tab.then(actualTab => {
                                    if (actualTab && !actualTab.closed) {
                                        tryCloseTab(actualTab);
                                    }
                                }).catch(error => {
                                    console.error('Error resolving tab Promise:', error);
                                });
                                return false; // Remove from array since we're handling it asynchronously
                            }

                            if (tab && !tab.closed) {
                                return tryCloseTab(tab);
                            } else {
                                console.log('Tab already closed or invalid');
                                return false; // Remove from array
                            }
                        } catch (error) {
                            console.error('Error closing OTM tab:', error);
                            return true; // Keep in array
                        }
                    }
                    return true; // Keep in array
                });
            } else {
                console.log('No OTM tabs found to close');
            }
        } catch (error) {
            console.error('Error handling OTM close tab:', error);
        }
    }

    // Add GM value change listeners for OTM data
    if (typeof GM !== 'undefined' && GM.addValueChangeListener) {
        GM.addValueChangeListener('otm_progress', handleOTMProgress);
        GM.addValueChangeListener('otm_success', handleOTMSuccess);
        GM.addValueChangeListener('otm_error', handleOTMError);
        GM.addValueChangeListener('otm_close_tab', handleOTMCloseTab);
    } else {
        // Fallback to localStorage polling for non-Greasemonkey environments
        setInterval(() => {
            const progressData = localStorage.getItem('otm_progress');
            const successData = localStorage.getItem('otm_success');
            const errorData = localStorage.getItem('otm_error');
            const closeTabData = localStorage.getItem('otm_close_tab');

            if (progressData) {
                try {
                    const parsed = JSON.parse(progressData);
                    handleOTMProgress('otm_progress', null, parsed, null);
                    localStorage.removeItem('otm_progress');
                } catch (e) {
                    console.error('Error parsing OTM progress data:', e);
                }
            }

            if (successData) {
                try {
                    const parsed = JSON.parse(successData);
                    handleOTMSuccess('otm_success', null, parsed, null);
                    localStorage.removeItem('otm_success');
                } catch (e) {
                    console.error('Error parsing OTM success data:', e);
                }
            }

            if (errorData) {
                try {
                    const parsed = JSON.parse(errorData);
                    handleOTMError('otm_error', null, parsed, null);
                    localStorage.removeItem('otm_error');
                } catch (e) {
                    console.error('Error parsing OTM error data:', e);
                }
            }

            if (closeTabData) {
                try {
                    const parsed = JSON.parse(closeTabData);
                    handleOTMCloseTab('otm_close_tab', null, parsed, null);
                    localStorage.removeItem('otm_close_tab');
                } catch (e) {
                    console.error('Error parsing OTM close tab data:', e);
                }
            }
        }, 1000);
    }

    // Start dashboard initialization
    initializeDashboard();
}

// Helpers to integrate standardized OTM surgery data
function dr_normalizePid(val) {
    if (val == null) return '';
    const s = String(val).trim();
    const digits = s.replace(/\D+/g, '');
    return digits.replace(/^0+/, '');
}

function dr_formatVNDateTime(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    return { date: `${dd}/${mm}/${yyyy}`, time: `${HH}:${MM}` };
}

function dr_otmToLogEntry(otmItem) {
    try {
        const startIso = otmItem && otmItem.start;
        if (!startIso) return null;
        const d = new Date(startIso);
        if (isNaN(d.getTime())) return null;
        const { date, time } = dr_formatVNDateTime(d);
        const method = (otmItem.surgerymethod || '').trim();
        // Collect doctors from userexec (Main surgeons) + userassistant (Assistants)
        // Note: The order in userexec is preserved, ensuring PTV chính is listed first.
        const names = [];
        const pushNames = (arr) => {
            if (Array.isArray(arr)) {
                for (const u of arr) {
                    let n = (u && u.fullname ? String(u.fullname) : '').trim();
                    // Strip designations like (PTV), (PTV chính), (Phụ), etc.
                    n = n.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
                    if (n && !names.includes(n)) names.push(n);
                }
            }
        };
        pushNames(otmItem.userexec);
        pushNames(otmItem.userassistant);
        const doctors = names.join(', ');
        return { 
            date, 
            time, 
            method, 
            doctors, 
            id: `otm-${startIso}`,
            source: 'otm' // Tag as OTM data
        };
    } catch (_) { return null; }
}

function dr_integrateOTMSurgeryData(otmList) {
    const res = { updatedPatients: 0, addedLogs: 0, updated: [] };
    if (!Array.isArray(otmList) || !Array.isArray(window.dr_data)) return res;
    // Build map pid -> log entries
    const map = new Map();
    for (const it of otmList) {
        const pid = dr_normalizePid(it && it.customer && it.customer.pid);
        if (!pid) continue;
        const entry = dr_otmToLogEntry(it);
        if (!entry) continue;
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(entry);
    }
    if (map.size === 0) return res;

    // Attach and merge to in-memory patient data
    for (const p of window.dr_data) {
        const mabnNorm = dr_normalizePid(p && p.mabn);
        if (!mabnNorm) continue;
        const entries = map.get(mabnNorm);
        if (!entries || entries.length === 0) continue;

        // Keep original for sidebar merge
        p._otmPhauThuatLog = entries.slice();

        // Merge into patient.checklistState for UI display (append-only, no overwrite)
        if (!p.checklistState) p.checklistState = {};
        if (!Array.isArray(p.checklistState.phauThuatLog)) p.checklistState.phauThuatLog = [];
        const keyOf = (e) => `${e.date}|${e.time}|${(e.method || '').trim().toLowerCase()}`;
        const existingKeys = new Set(p.checklistState.phauThuatLog.map(keyOf));
        let added = 0;
        for (const e of entries) {
            const k = keyOf(e);
            if (!existingKeys.has(k)) {
                p.checklistState.phauThuatLog.push({ ...e });
                existingKeys.add(k);
                added++;
            }
        }
        if (added > 0) {
            res.updatedPatients++;
            res.addedLogs += added;
            res.updated.push({ patient: p, added });
            // Sort newest first
            const parseDDMMYYYY = (s) => { const [d, m, y] = String(s || '').split('/').map(n => parseInt(n, 10)); return new Date(y || 1970, (m || 1) - 1, d || 1); };
            const toTs = (e) => { const dt = parseDDMMYYYY(e.date); const [hh, mm] = String(e.time || '00:00').split(':').map(n => parseInt(n, 10) || 0); dt.setHours(hh, mm, 0, 0); return dt.getTime(); };
            p.checklistState.phauThuatLog.sort((a, b) => toTs(b) - toTs(a));
            // Also reflect latest to phauThuatInfo for formatSurgeryInfo compatibility
            const latest = p.checklistState.phauThuatLog[0];
            if (latest) {
                p.phauThuatInfo = { date: latest.date, time: latest.time, method: latest.method, doctors: latest.doctors, ngayPhauThuat: latest.date, gioPhauThuat: latest.time, pppt: latest.method };
            }
            // Update card/list row if present
            try {
                const DomUpdaters = require('../utils/domUpdaters');
                const el = DomUpdaters.findPatientElement(p.mabn);
                if (el) {
                    DomUpdaters.updateSurgeryInfo(el, p);
                    DomUpdaters.updateSurgeryIcon(el, p);
                }
            } catch (_) { }
        }
    }
    return res;
}

async function dr_fetchChecklistObjForPatient(patient) {
    try {
        const res = await ChecklistService.loadChecklistData(patient, { forceRefresh: true });
        let obj = ChecklistService.findChecklistObject(res);
        if (!obj) {
            const created = await ChecklistService.createNewChecklist(patient);
            if (created) {
                const res2 = await ChecklistService.loadChecklistData(patient, { forceRefresh: true });
                obj = ChecklistService.findChecklistObject(res2);
            }
        }
        return obj || null;
    } catch (_) { return null; }
}

async function dr_persistMergedOTMSurgeries(updatedEntries, { concurrency = 2 } = {}) {
    if (!Array.isArray(updatedEntries) || updatedEntries.length === 0) return { saved: 0, queued: 0, failed: 0 };
    const queue = updatedEntries.slice();
    let saved = 0, queued = 0, failed = 0;

    const worker = async () => {
        while (queue.length) {
            const entry = queue.shift();
            const p = entry && entry.patient;
            if (!p) { failed++; continue; }
            try {
                const checklistObj = await dr_fetchChecklistObjForPatient(p);
                if (!checklistObj) { failed++; continue; }
                // Merge server state with current in-memory state (append-only)
                const serverState = ChecklistService.parseChecklistState(checklistObj) || {};
                const ensureArr = (arr) => Array.isArray(arr) ? arr : [];
                const merged = ensureArr(serverState.phauThuatLog).slice();
                const fromMem = ensureArr(p.checklistState && p.checklistState.phauThuatLog);
                const keyOf = (e) => `${e.date}|${e.time}|${(e.method || '').trim().toLowerCase()}`;
                const existing = new Set(merged.map(keyOf));
                for (const e of fromMem) {
                    const k = keyOf(e);
                    if (!existing.has(k)) { merged.push({ ...e }); existing.add(k); }
                }
                // Sort newest first
                const parseDDMMYYYY = (s) => { const [d, m, y] = String(s || '').split('/').map(n => parseInt(n, 10)); return new Date(y || 1970, (m || 1) - 1, d || 1); };
                const toTs = (e) => { const dt = parseDDMMYYYY(e.date); const [hh, mm] = String(e.time || '00:00').split(':').map(n => parseInt(n, 10) || 0); dt.setHours(hh, mm, 0, 0); return dt.getTime(); };
                merged.sort((a, b) => toTs(b) - toTs(a));

                const newState = { ...(serverState || {}), phauThuatLog: merged };
                const r = await ChecklistService.updateChecklistState(checklistObj, newState, { enqueueOnOffline: true });
                if (r && (r.ok || r.queued)) {
                    if (r.queued) queued++; else saved++;
                } else {
                    failed++;
                }
            } catch (_) { failed++; }
        }
    };

    const workers = Array.from({ length: Math.max(1, Math.min(6, concurrency)) }, () => worker());
    await Promise.all(workers);
    return { saved, queued, failed };
}

// Handle OTM progress messages
function handleOTMProgress(name, oldValue, newValue, remote) {
    try {
        const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        showToast(`🔄 ${data.data.message}`, 'info', 3000);
        console.log('[OTM Progress]', data.data.step, data.data.message);
    } catch (error) {
        console.error('Error handling OTM progress:', error);
    }
}

// Handle OTM success messages
function handleOTMSuccess(name, oldValue, newValue, remote) {
    try {
        const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        
        let successMsg = `✅ ${data.data.count} ca mổ đã được tải về!`;
        console.log('[OTM Success]', data.data);

        // Log full dataset once (no per-patient logs)
        if (data.data.surgeryData && data.data.surgeryData.length > 0) {
            console.log('=== SURGERY DATA RECEIVED (FULL) ===', data.data.surgeryData);
            // Merge into in-memory patients and update UI
            const mergeRes = dr_integrateOTMSurgeryData(data.data.surgeryData);
            const { updatedPatients, addedLogs, updated } = mergeRes;
            
            if (updatedPatients > 0) {
                // Get names of updated patients for the toast
                const updatedNames = updated.map(u => u.patient.hoten).join(', ');
                showToast(`✅ ${updatedNames} đã được cập nhật.`, 'success', 5000);
                
                // Persist to server in background (append-only)
                (async () => {
                    const res = await dr_persistMergedOTMSurgeries(updated, { concurrency: 2 });
                    if ((res.saved + res.queued) > 0) {
                        try { showToast(`💾 Lưu ${res.saved} | Hàng đợi ${res.queued} | Lỗi ${res.failed}`, 'info', 4000); } catch (_) { }
                    }
                })();
            } else {
                showToast(successMsg, 'success', 5000);
            }
        } else {
            showToast(successMsg, 'success', 5000);
        }
    } catch (error) {
        console.error('Error handling OTM success:', error);
    }
}

// Handle OTM error messages
function handleOTMError(name, oldValue, newValue, remote) {
    try {
        const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        showToast(`❌ ${data.data.message}`, 'error', 5000);
        console.error('[OTM Error]', data.data);
    } catch (error) {
        console.error('Error handling OTM error:', error);
    }
}

// OTM buttons integration
function addOTMButtonsToBottomBar(bottomBar) {
    const bottomBarLeft = bottomBar.querySelector('.dr-bottom-bar-left');
    if (!bottomBarLeft) return;

    // Date range button (integrated today functionality)
    const dateBtn = document.createElement('button');
    dateBtn.id = 'dr-otm-date-btn';
    dateBtn.className = 'dr-btn dr-otm-btn';
    dateBtn.textContent = 'Cập nhật lịch OTM';
    dateBtn.title = 'Chọn khoảng thời gian để lấy dữ liệu mổ từ OTM';
    
    // Applying pinkish-purple gradient to match Copy button
    dateBtn.style.background = 'linear-gradient(135deg, #ec4899, #a855f7)';
    dateBtn.style.color = 'white';
    dateBtn.style.border = 'none';
    dateBtn.style.borderRadius = '8px';
    dateBtn.style.padding = '8px 16px';
    dateBtn.style.fontWeight = '600';
    dateBtn.style.cursor = 'pointer';
    dateBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    dateBtn.style.transition = 'all 0.2s ease';

    dateBtn.onmouseenter = () => {
        dateBtn.style.transform = 'translateY(-1px)';
        dateBtn.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
        dateBtn.style.filter = 'brightness(1.1)';
    };
    dateBtn.onmouseleave = () => {
        dateBtn.style.transform = 'translateY(0)';
        dateBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        dateBtn.style.filter = 'brightness(1)';
    };

    dateBtn.addEventListener('click', () => handleOTMDateClick());

    bottomBarLeft.appendChild(dateBtn);

    // Add Copy Menu next to OTM button
    setupCopyMenu(bottomBar);

    console.log('OTM button added to dashboard');

    function handleOTMDateClick() {
        const DialogManager = require('../components/dialogManager');
        const dialog = DialogManager.createDialog('otm-date-dialog');

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        dialog.inner.innerHTML = `
            <h3>Chọn khoảng thời gian</h3>
            <div style="margin: 10px 0;">
                <div style="margin-bottom: 10px;">
                    <label for="otm-start-date">Ngày bắt đầu:</label>
                    <input type="date" id="otm-start-date" style="margin-left: 10px;" value="${today}">
                </div>
                <div>
                    <label for="otm-end-date">Ngày kết thúc:</label>
                    <input type="date" id="otm-end-date" style="margin-left: 10px;" value="${today}">
                </div>
            </div>
        `;

        const actionButtons = DialogManager.createActionButtons([
            {
                id: 'otm-fetch-btn',
                className: 'dr-btn-primary',
                text: 'Lấy dữ liệu',
                onclick: () => {
                    const startDateInput = document.getElementById('otm-start-date');
                    const endDateInput = document.getElementById('otm-end-date');
                    if (startDateInput && startDateInput.value && endDateInput && endDateInput.value) {
                        openOTMTab(startDateInput.value, endDateInput.value);
                        dialog.close();
                    } else {
                        alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
                    }
                }
            }
        ]);

        dialog.inner.appendChild(actionButtons);
        dialog.show();
    }

    function openOTMTab(fromDate, toDate) {
        const url = `https://otm.tahospital.vn/?otm-fetch=${encodeURIComponent(JSON.stringify({ fromDate, toDate }))}`;
        console.log('[OTM Open Tab] Opening tab with URL:', url);
        console.log('[OTM Open Tab] Current openTabs before:', window.openTabs);

        if (typeof GM !== 'undefined' && GM.openInTab) {
            const tabPromise = GM.openInTab(url, {
                active: false,
                insert: true,
                setParent: true
            });

            // Handle the Promise returned by GM.openInTab
            if (tabPromise && typeof tabPromise.then === 'function') {
                tabPromise.then(tab => {
                    if (tab) {
                        window.openTabs.push({
                            tab: tab,
                            url: url,
                            openedAt: Date.now(),
                            hostname: 'otm.tahospital.vn'
                        });
                        console.log('[OTM Open Tab] Tab added to openTabs. New length:', window.openTabs.length);
                    } else {
                        console.log('[OTM Open Tab] GM.openInTab resolved to null/undefined');
                    }
                }).catch(error => {
                    console.error('[OTM Open Tab] Error opening tab:', error);
                });
            } else if (tabPromise) {
                // Fallback if it's not a Promise (older GM versions)
                window.openTabs.push({
                    tab: tabPromise,
                    url: url,
                    openedAt: Date.now(),
                    hostname: 'otm.tahospital.vn'
                });
                console.log('[OTM Open Tab] Tab added to openTabs. New length:', window.openTabs.length);
            } else {
                console.log('[OTM Open Tab] GM.openInTab returned null/undefined');
            }
        } else {
            // Fallback for non-Greasemonkey environments
            const tab = window.open(url, '_blank');
            if (tab) {
                window.openTabs.push({
                    tab: tab,
                    url: url,
                    openedAt: Date.now(),
                    hostname: 'otm.tahospital.vn'
                });
                console.log('[OTM Open Tab] Fallback tab added to openTabs. New length:', window.openTabs.length);
            } else {
                console.log('[OTM Open Tab] window.open returned null/undefined');
            }
        }
    }
}

module.exports = {
    showDashboardBenhNhanIfNeeded
};
