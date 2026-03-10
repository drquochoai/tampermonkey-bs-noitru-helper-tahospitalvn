// dashboard.js

const Utils = require('../utils');
const {
    createDirectReportGeneration,
    addGlobalStyles
} = require('./page.dashboard.support');

// Import cài đặt giao diện
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

// Import refactored modules
const PatientService = require('../services/patientService');
const ChecklistService = require('../services/checklistService');
const PatientDataMapper = require('../utils/patientDataMapper');
const ModalManager = require('../components/modalManager');
const LoginHandler = require('../components/loginHandler');

// Import newly refactored components
const { createPatientInfoSection } = require('../components/patientInfoSection');
const SidebarSession = require('../components/sidebarSession');
const { createYLenhTags, updatePatientCardTags, hasDischargeTag, updateMedsDoneBadge } = require('../utils/tagUtils');
const { setupPhauThuatHandlers } = require('../components/phauThuatHandlers');

// Import utility functions
const { showToast, copyToClipboard } = require('../utils/uiUtils');
const { addSurgeryStatusIcon, formatSurgeryInfo, updatePatientCardPhauThuat } = require('../utils/surgeryUtils');
const { escapeHtml } = require('../utils/htmlUtils');
const DomUpdaters = require('../utils/domUpdaters');
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('../utils/checklistUtils');

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

            const res = await ChecklistService.loadChecklistData(patient, { forceRefresh: true });
            checklistUl.innerHTML = '';

            let checklistObj = ChecklistService.findChecklistObject(res);

            if (!checklistObj) {
                checklistUl.innerHTML = '<li>Không có dữ liệu</li>';
                const created = await ChecklistService.createNewChecklist(patient);
                if (created) {
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

            window.checklistObj = checklistObj;
            // Parse into a fresh object; avoid leaking prior patient's HXT into others
            const parsedState = ChecklistService.parseChecklistState(checklistObj) || {};
            window.checklistState = { ...parsedState };
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
                        // Persist silently in background
                        try { ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) }); } catch (_) { }
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
                <input id="dr-search-input" type="text" placeholder="Lọc BN theo tên, MABN, phòng, chẩn đoán..." 
                    style="flex:1; min-width: 220px; padding: 8px 10px; border:1px solid #ddd; border-radius:6px;">
            </div>
            <div class="dr-topbar-center" style="flex:0 0 auto; display:flex; justify-content:center; min-width:140px;">
                <span id="dr-total-compact" style="display:inline-block; text-align:center; color:#0f172a; font-weight:700; white-space:nowrap; background:#f1f5f9; border:1px solid #e2e8f0; padding:4px 10px; border-radius:9999px; min-width:110px;">0/0</span>
            </div>
            <div class="dr-topbar-right" style="flex:1; display:flex; align-items:center; justify-content:flex-end; gap:12px;">
                <label style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                    <input id="dr-filter-xuatvien" type="checkbox"> Xuất viện
                </label>
                <label style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                    <input id="dr-filter-canlamsang" type="checkbox"> Cận lâm sàng
                </label>
                <button id="dr-view-toggle" title="Đổi chế độ hiển thị" style="padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;cursor:pointer;white-space:nowrap;">Chế độ: <b><span id="dr-view-label"></span></b></button>
            </div>
        `;

        const container = document.createElement('div');
        // View state
        const VIEW_KEY = 'dr-card-view';
        const view = (localStorage.getItem(VIEW_KEY) || 'grid');
        const viewLabelEl = topBar.querySelector('#dr-view-label');
        const setViewLabel = () => { if (viewLabelEl) viewLabelEl.textContent = (localStorage.getItem(VIEW_KEY) || 'grid') === 'list' ? 'Danh sách' : 'Lưới'; };
        if (!localStorage.getItem(VIEW_KEY)) localStorage.setItem(VIEW_KEY, view);
        container.className = view === 'list' ? 'dr-list-container' : 'dr-card-list';
        // Safety padding in case styles load late
        container.style.paddingBottom = '90px';

        const renderItemGrid = (item) => createPatientCard(item);
        const { createListRow } = require('../components/listView');
        const renderItemList = (item) => createListRow(item, { onOpen: () => showSidebar(item) });
        const renderer = (localStorage.getItem('dr-card-view') || 'grid') === 'list' ? renderItemList : renderItemGrid;
        sortedData.forEach(item => {
            const card = renderer(item);
            // mark useful attributes for filtering
            if (item && item.mabn) card.setAttribute('data-mabn', item.mabn);
            if (item && item.hoten) card.setAttribute('data-name', (item.hoten || '').toLowerCase());
            if (item && item.chandoanvk) card.setAttribute('data-cd', (item.chandoanvk || '').toLowerCase());
            if (item && (item.teN_PHONG || item.teN_GIUONG)) {
                const loc = PatientDataMapper.formatRoomLocation(
                    item.teN_PHONG,
                    item.teN_GIUONG,
                    item.teN_TANG,
                    item.teN_TOANHA
                );
                card.setAttribute('data-loc', (loc || '').toLowerCase());
            }
            // compute dataset flags from today's yLenhLog
            try {
                const today = new Date();
                const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
                const log = item && item.checklistState && Array.isArray(item.checklistState.yLenhLog) ? item.checklistState.yLenhLog : [];
                let hasXV = false, hasCLS = false;
                for (const e of log) {
                    if (!e.timestamp || !e.content) continue;
                    if (!e.timestamp.startsWith(todayStr)) continue;
                    const c = e.content.toLowerCase();
                    if (c.includes('xuất viện')) {
                        // if quick and has status, use done/active as presence
                        if (e.q === true && e.action === 'Xuất viện') {
                            if (e.status === 'active' || e.status === 'done') hasXV = true;
                        } else {
                            hasXV = true;
                        }
                    }
                    if (c.includes('cận lâm sàng')) hasCLS = true;
                }
                card.dataset.hasxv = hasXV ? '1' : '0';
                card.dataset.hascls = hasCLS ? '1' : '0';
            } catch (_) { }
            container.appendChild(card);
        });

        // Append top bar then container
        document.body.appendChild(topBar);
        document.body.appendChild(container);

        // Add bottom bar
        createBottomBar();

        // Filter logic
        const searchInput = topBar.querySelector('#dr-search-input');
        const chkXuatVien = topBar.querySelector('#dr-filter-xuatvien');
        const chkCanLamSang = topBar.querySelector('#dr-filter-canlamsang');
        const totalCompact = topBar.querySelector('#dr-total-compact');

        function applyFilter() {
            const q = (searchInput.value || '').trim().toLowerCase();
            const onlyXV = !!chkXuatVien.checked;
            const onlyCLS = !!chkCanLamSang.checked;
            let visible = 0;

            const cards = container.querySelectorAll('.dr-card, .dr-list-row');
            cards.forEach(card => {
                const txt = card.textContent.toLowerCase();
                const matchesText = q === '' || txt.includes(q) ||
                    card.getAttribute('data-mabn')?.toLowerCase().includes(q) ||
                    card.getAttribute('data-name')?.includes(q) ||
                    card.getAttribute('data-cd')?.includes(q) ||
                    card.getAttribute('data-loc')?.includes(q);
                // dataset flags prepared on card creation
                const matchesXV = !onlyXV || card.dataset.hasxv === '1' || card.classList.contains('xuatvienanimation');
                const matchesCLS = !onlyCLS || card.dataset.hascls === '1';
                const show = matchesText && matchesXV && matchesCLS;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            // Update centered compact total, integrating the filter count
            if (totalCompact) {
                const hasFilter = !!(q || onlyXV || onlyCLS);
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
        }

        searchInput.addEventListener('input', applyFilter);
        chkXuatVien.addEventListener('change', applyFilter);
        chkCanLamSang.addEventListener('change', applyFilter);

        // Initialize view label, compact total and run first filter
        setViewLabel();
        const totalCompactInit = document.getElementById('dr-total-compact');
        if (totalCompactInit) {
            totalCompactInit.textContent = `${sortedData.length}/${sortedData.length}`;
            totalCompactInit.style.background = '#f1f5f9';
            totalCompactInit.style.borderColor = '#e2e8f0';
            totalCompactInit.style.color = '#0f172a';
        }
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
            const sortedNewData = PatientDataMapper.sortPatients([...newData]);

            // Update existing cards instead of full re-render to avoid interrupting user
            sortedNewData.forEach((item, index) => {
                const card = container.children[index];
                if (card) {
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

                    // Re-evaluate filter visibility after updates (e.g., xuatvienanimation class changes)
                    // Delay to allow DOM/class updates done elsewhere
                    setTimeout(() => {
                        applyFilter();
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

        // Wire view toggle button
        const toggleBtn = topBar.querySelector('#dr-view-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const cur = localStorage.getItem('dr-card-view') || 'grid';
                const next = cur === 'list' ? 'grid' : 'list';
                localStorage.setItem('dr-card-view', next);
                setViewLabel();
                try { window.location.reload(); } catch (_) { }
            });
        }
    }



    function createPatientCard(item) {
        const room = item.teN_PHONG || '';
        const isWhite = PatientDataMapper.isWhiteCard(room);
        const card = document.createElement('div');
        card.className = 'dr-card' + (isWhite ? '' : ' dr-blue');

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
            <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span> - ${item.phai === 1 ? 'Nữ' : 'Nam'}</h2>
            <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
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
        // Preload HXT from checklist state after rendering card (non-blocking)
        setTimeout(() => {
            preloadHXTForPatient(item);
        }, 0);

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
        const ApiService = require('../services/apiService');
        const { getSelectedKhoa } = require('../utils/khoaUtils');
        const bottomBar = document.createElement('div');
        bottomBar.className = 'dr-bottom-bar';
        bottomBar.innerHTML = `
            <div class="dr-bottom-bar-left">
                <a id="dr-settings-btn" class="dr-gear-btn" href="/?caidat" target="_blank" title="Cài đặt">
                    <i class="fas fa-cog"></i>
                </a>
                <select id="dr-khoa-select" class="dr-khoa-select" title="Chọn khoa"></select>
            </div>
            <button id="dr-btn-direct-report" class="btn btn-warning" style="font-weight:bold;">Tạo báo cáo trực</button>
        `;
        document.body.appendChild(bottomBar);

        // Add OTM buttons to bottom bar
        addOTMButtonsToBottomBar(bottomBar);

        // Bottom bar styles come from addGlobalStyles()

        // Setup direct report button
        setTimeout(() => {
            const btn = document.getElementById('dr-btn-direct-report');
            if (btn) btn.onclick = createDirectReportGeneration;
        }, 10);

        // Populate khoa dropdown and wire change
        (async () => {
            try {
                const select = document.getElementById('dr-khoa-select');
                if (!select) return;
                select.disabled = true;
                select.innerHTML = `<option>Đang tải khoa...</option>`;
                const list = await ApiService.fetchKhoaPhong();
                const current = String(getSelectedKhoa('551'));
                select.innerHTML = '';
                list.forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = String(k.id);
                    opt.textContent = k.name || k.id;
                    if (opt.value === current) opt.selected = true;
                    select.appendChild(opt);
                });
                select.disabled = false;
                select.addEventListener('change', (e) => {
                    const val = e.target.value;
                    try { localStorage.setItem('bsnt_khoa_dashboard', String(val)); } catch (_) { }
                    // reload dashboard data by simply reloading the page or re-running init
                    window.location.reload();
                });
            } catch (e) {
                console.warn('Load khoa for bottom bar failed', e);
            }
        })();
    }

    // Bottom bar styling helper removed (centralized in dashboard.support.js)
    // Main logic
    async function initializeDashboard() {
        const data = await PatientService.loadPatientDataWithErrorHandling();
        if (data) {
            renderCards(data);
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
        // Collect doctors from userexec + userassistant
        const names = [];
        const pushNames = (arr) => {
            if (Array.isArray(arr)) {
                for (const u of arr) {
                    const n = (u && u.fullname ? String(u.fullname) : '').trim();
                    if (n && !names.includes(n)) names.push(n);
                }
            }
        };
        pushNames(otmItem.userexec);
        pushNames(otmItem.userassistant);
        const doctors = names.join(', ');
        return { date, time, method, doctors, id: `otm-${startIso}` };
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
        showToast(`✅ ${data.data.count} ca mổ đã được tải về!`, 'success', 5000);
        console.log('[OTM Success]', data.data);

        // Log full dataset once (no per-patient logs)
        if (data.data.surgeryData && data.data.surgeryData.length > 0) {
            console.log('=== SURGERY DATA RECEIVED (FULL) ===', data.data.surgeryData);
            // Merge into in-memory patients and update UI
            const mergeRes = dr_integrateOTMSurgeryData(data.data.surgeryData);
            const { updatedPatients, addedLogs } = mergeRes;
            if (updatedPatients > 0) {
                try { showToast(`🧩 Đã cập nhật PT cho ${updatedPatients} BN (${addedLogs} mục).`, 'success', 4000); } catch (_) { }
                // Persist to server in background (append-only)
                (async () => {
                    const res = await dr_persistMergedOTMSurgeries(mergeRes.updated, { concurrency: 2 });
                    if ((res.saved + res.queued) > 0) {
                        try { showToast(`💾 Lưu ${res.saved} | Hàng đợi ${res.queued} | Lỗi ${res.failed}`, 'info', 4000); } catch (_) { }
                    }
                })();
            }
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
    dateBtn.textContent = 'Mổ theo ngày';
    dateBtn.title = 'Chọn khoảng thời gian để lấy dữ liệu mổ từ OTM';
    dateBtn.addEventListener('click', () => handleOTMDateClick());

    bottomBarLeft.appendChild(dateBtn);
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
            },
            {
                id: 'otm-cancel-btn',
                className: 'dr-btn-secondary',
                text: 'Hủy',
                onclick: () => dialog.close()
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
