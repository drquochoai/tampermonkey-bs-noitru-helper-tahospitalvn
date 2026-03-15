// patientInfoSection.js
const { setupYLenhHandlers } = require('./yLenhHandlers');
const { setupPhauThuatHandlers } = require('./phauThuatHandlers');
const ChecklistService = require('../services/checklistService');
const Utils = require('../utils');
const ReportService = require('../services/reportService');
const { callGlobalFn } = require('../utils/globalFnUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

function createPatientInfoSection(patient, quickYLenhActions) {
    const ctxId = (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id) || `${patient.mabn}:${Date.now()}`;
    const info = document.createElement('div');
    // Reuse report DOB/age formatter for consistency with dr-report-content
    const { dob, age } = ReportService.formatDateOfBirth(patient.ngaysinh);
    const gender = patient.phai === 1 ? 'Nữ' : 'Nam';
    const room = patient.teN_PHONG || '';
    const bed = patient.teN_GIUONG || '';
    info.innerHTML = `
        <h2 style="margin-top:0">${patient.hoten || ''} <span class="dr-patient-mabn-sidebar" style="font-size:0.9em;color:#888;cursor:pointer;" title="Click để copy mã BN">${patient.mabn ? ' - ' + patient.mabn : ''}</span></h2>
        <div><b>DOB:</b> ${dob} (${age}) - ${gender} - ${room} - ${bed}</div>
        <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
        <div style="margin-top:8px; display:grid; grid-template-columns:max-content 1fr; align-items:start; column-gap:10px;">
            <label for="dr-chandoan-kemtheo" style="margin:0;font-weight:600;line-height:1.4;font-size:12px;color:#555;">Bệnh đi kèm</label>
            <div style="display:flex;flex-direction:column;gap:4px;">
                <textarea id="dr-chandoan-kemtheo" rows="2" placeholder="VD: THA, ĐTĐ type 2..." style="width:100%;padding:6px 8px;border:1px solid #90caf9;border-radius:4px;resize:vertical;font-size:12px;line-height:1.3;min-height:44px;box-shadow:0 0 0 2px rgba(25,118,210,0.12);outline:none;"></textarea>
                <div id="dr-chandoan-kemtheo-saved" style="display:none;color:#2e7d32;font-weight:600;">Đã lưu</div>
            </div>
        </div>
        
        <div style="margin-top:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;">
                <h3 style="margin:0;">Thông tin phẫu thuật</h3>
                <button id="dr-show-pt-form" style="background:#1976d2;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:0.9em;white-space:nowrap;">Thêm phẫu thuật</button>
            </div>
            <div id="dr-pt-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;">
                <div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>
            </div>
        </div>
        
        <div style="margin-top:20px;">
            <h3 style="margin-bottom:10px;">Kế hoạch điều trị / Hướng xử trí</h3>
            <textarea id="dr-hxt-textarea" rows="3" placeholder="VD: Kháng sinh 7 ngày, dự kiến xuất viện 22/08, tái khám sau 1 tuần..." style="width:100%;padding:10px;border:1px solid #eee;border-radius:6px;resize:vertical;"></textarea>
            <div id="dr-hxt-saved" style="display:none;color:#2e7d32;font-weight:600;margin-top:4px;">Đã lưu</div>
        </div>
        
        <div style="margin-top:20px;">
            <h3 style="margin-bottom:10px;">Log y lệnh</h3>
            
            <!-- Quick Action Buttons -->
            <div class="quick-ylenh-actions">
                ${quickYLenhActions.map(action => `
                    <button class="quick-ylenh-btn" data-action="${action.label}" style="color: ${action.color}; border-color: ${action.color};">
                        <span class="icon">${action.icon}</span>
                        <span class="text">${action.label}</span>
                    </button>
                `).join('')}
            </div>
            
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
                <input type="text" id="dr-y-lenh-input" placeholder="Nhập y lệnh (VD: rút sonde tiểu)" style="padding:10px;border:1px solid #ddd;border-radius:4px;">
                <button id="dr-add-y-lenh" style="padding:12px 16px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;width:100%;">Thêm</button>
            </div>
            <div id="dr-y-lenh-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;word-break: break-word; overflow-wrap: anywhere;">
                <div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>
            </div>
        </div>
    `;

    // Setup y lệnh functionality
    setupYLenhHandlers(info, patient);

    // Setup phẫu thuật functionality
    setupPhauThuatHandlers(info, patient);

    // Setup HXT (kế hoạch điều trị) auto-save and live update
    const hxtTextarea = info.querySelector('#dr-hxt-textarea');
    const hxtSaved = info.querySelector('#dr-hxt-saved');
    // Setup Chẩn đoán kèm theo auto-save
    const cdktTextarea = info.querySelector('#dr-chandoan-kemtheo');
    const cdktSaved = info.querySelector('#dr-chandoan-kemtheo-saved');
    // Shared debounced save state
    let pendingSaveTimer = null;
    const SAVE_DEBOUNCE_MS = 700;

    // Track last saved values to avoid redundant saves
    const lastSaved = {
        hxt: (patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string')
            ? String(patient.checklistState.huongXuTri).trim() : '',
        cdkt: (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string')
            ? String(patient.checklistState.chanDoanKemTheo).trim() : ''
    };
    // Current draft values
    const draft = { hxt: lastSaved.hxt, cdkt: lastSaved.cdkt };
    let dirty = { hxt: false, cdkt: false };

    // Initial load from patient-scoped state only (avoid leaking previous patient's global state)
    setTimeout(() => {
        if (patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string') {
            hxtTextarea.value = patient.checklistState.huongXuTri;
        }
        if (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string') {
            cdktTextarea.value = patient.checklistState.chanDoanKemTheo;
        }
    }, 50);

    function softUpdate(key, value) {
        if (!window.checklistState) window.checklistState = {};
        window.checklistState = { ...(window.checklistState || {}), [key]: value };
        patient.checklistState = { ...(patient.checklistState || {}), [key]: value };
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
    }

    async function persistIfDirty() {
        // Build a single save payload only if something actually changed
        const changedKeys = [];
        if (dirty.hxt && draft.hxt !== lastSaved.hxt) changedKeys.push('hxt');
        if (dirty.cdkt && draft.cdkt !== lastSaved.cdkt) changedKeys.push('cdkt');
        if (changedKeys.length === 0) return;

        if (!window.checklistState) window.checklistState = {};
        const nextState = { ...window.checklistState };
        if (changedKeys.includes('hxt')) nextState.huongXuTri = draft.hxt;
        if (changedKeys.includes('cdkt')) nextState.chanDoanKemTheo = draft.cdkt;

        // Persist once
        if (window.checklistObj) {
            const res = await ChecklistService.updateChecklistState(window.checklistObj, nextState, { ctxId, enqueueOnOffline: true, signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.warn('Lưu checklist thất bại');
            } else {
                // If this sidebar is no longer active, do not apply visual updates
                if (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id !== ctxId) return;
                // Update global state snapshot and lastSaved
                window.checklistState = nextState;
                if (changedKeys.includes('hxt')) lastSaved.hxt = draft.hxt;
                if (changedKeys.includes('cdkt')) lastSaved.cdkt = draft.cdkt;
                dirty = { hxt: false, cdkt: false };

                // Subtle flash effect on saved fields
                try {
                    const flash = (el) => {
                        if (!el) return;
                        const prev = el.style.boxShadow;
                        el.style.boxShadow = '0 0 0 2px rgba(76,175,80,0.6)';
                        setTimeout(() => { el.style.boxShadow = prev || ''; }, 400);
                    };
                    if (changedKeys.includes('hxt')) {
                        flash(hxtTextarea);
                        if (hxtSaved) { hxtSaved.style.display = 'block'; setTimeout(() => hxtSaved.style.display = 'none', 600); }
                    }
                    if (changedKeys.includes('cdkt')) {
                        flash(cdktTextarea);
                        if (cdktSaved) { cdktSaved.style.display = 'block'; setTimeout(() => cdktSaved.style.display = 'none', 600); }
                        // Update card diagnosis after saving CDKT to keep cards in sync
                        try { callGlobalFn('updatePatientCardCDKT', patient); } catch (_) { }
                    }
                } catch (_) { }
                if (res && res.queued) {
                    try { (window.showToast || console.log)("Đã lưu tạm—sẽ đồng bộ khi có mạng."); } catch (_) { }
                }
            }
        }
    }

    function scheduleSave() {
        if (pendingSaveTimer) clearTimeout(pendingSaveTimer);
        pendingSaveTimer = setTimeout(() => {
            pendingSaveTimer = null;
            persistIfDirty();
        }, SAVE_DEBOUNCE_MS);
    }

    hxtTextarea.addEventListener('input', () => {
        const val = hxtTextarea.value.trim();
        draft.hxt = val;
        // Mark dirty only if actual change relative to last saved
        dirty.hxt = (val !== lastSaved.hxt);
        softUpdate('huongXuTri', val);
        callGlobalFn('updatePatientCardHXT', patient);
        scheduleSave();
    });
    hxtTextarea.addEventListener('blur', () => {
        if (pendingSaveTimer) {
            clearTimeout(pendingSaveTimer);
            pendingSaveTimer = null;
        }
        // Save only if dirty to avoid redundant saves on focus/blur without edits
        persistIfDirty();
    });

    cdktTextarea.addEventListener('input', () => {
        const val = cdktTextarea.value.trim();
        draft.cdkt = val;
        dirty.cdkt = (val !== lastSaved.cdkt);
        softUpdate('chanDoanKemTheo', val);
        scheduleSave();
    });
    cdktTextarea.addEventListener('blur', () => {
        if (pendingSaveTimer) {
            clearTimeout(pendingSaveTimer);
            pendingSaveTimer = null;
        }
        persistIfDirty();
    });

    // Setup PID auto-copy
    setTimeout(() => {
        const pidSpan = info.querySelector('.dr-patient-mabn-sidebar');
        if (pidSpan && patient.mabn) {
            pidSpan.addEventListener('click', async () => {
                try {
                    const displaySettings = require('./displaySettings');
                    if (displaySettings.get('autoCopyPID')) {
                        const { copyToClipboard, showToast } = require('../utils/uiUtils');
                        const success = await copyToClipboard(patient.mabn);
                        if (success) {
                            showToast(`Đã copy PID: ${patient.mabn}`);
                        }
                    }
                } catch(e) { console.warn('Lỗi copy PID sidebar', e); }
            });
        }
    }, 10);

    return info;
}

module.exports = { createPatientInfoSection };
