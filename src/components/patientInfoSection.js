// patientInfoSection.js
const { setupYLenhHandlers } = require('./yLenhHandlers');
const { setupPhauThuatHandlers } = require('./phauThuatHandlers');
const ChecklistService = require('../services/checklistService');
const Utils = require('../utils');

function createPatientInfoSection(patient, quickYLenhActions) {
    const info = document.createElement('div');
    info.innerHTML = `
        <h2 style="margin-top:0">${patient.hoten || ''} <span style="font-size:0.9em;color:#888;">${patient.mabn ? ' - ' + patient.mabn : ''}</span></h2>
        <div><b>Tuổi:</b> ${Utils.calculateAge(patient.ngaysinh)}</div>
        <div><b>Giới tính:</b> <span>${patient.phai === 1 ? 'Nữ' : 'Nam'}</span></div>
        <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
        <div style="margin-top:8px;">
            <h3 style="margin-bottom:6px;">Chẩn đoán kèm theo</h3>
            <textarea id="dr-chandoan-kemtheo" rows="2" placeholder="VD: THA, ĐTĐ type 2..." style="width:100%;padding:10px;border:1px solid #eee;border-radius:6px;resize:vertical;"></textarea>
            <div id="dr-chandoan-kemtheo-saved" style="display:none;color:#2e7d32;font-weight:600;margin-top:4px;">Đã lưu</div>
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
    let hxtSaveTimer = null;
    // Setup Chẩn đoán kèm theo auto-save
    const cdktTextarea = info.querySelector('#dr-chandoan-kemtheo');
    const cdktSaved = info.querySelector('#dr-chandoan-kemtheo-saved');
    let cdktSaveTimer = null;

    // Initial load from patient-scoped state only (avoid leaking previous patient's global state)
    setTimeout(() => {
        if (patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string') {
            hxtTextarea.value = patient.checklistState.huongXuTri;
        }
        if (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string') {
            cdktTextarea.value = patient.checklistState.chanDoanKemTheo;
        }
    }, 50);

    function invokeUpdatePatientCardHXT(p) {
        try {
            if (typeof updatePatientCardHXT === 'function') {
                updatePatientCardHXT(p);
                return true;
            }
            if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.updatePatientCardHXT === 'function') {
                unsafeWindow.updatePatientCardHXT(p);
                return true;
            }
            if (typeof globalThis !== 'undefined' && typeof globalThis.updatePatientCardHXT === 'function') {
                globalThis.updatePatientCardHXT(p);
                return true;
            }
            if (typeof this !== 'undefined' && typeof this.updatePatientCardHXT === 'function') {
                this.updatePatientCardHXT(p);
                return true;
            }
            if (typeof window !== 'undefined' && typeof window.updatePatientCardHXT === 'function') {
                window.updatePatientCardHXT(p);
                return true;
            }
        } catch (e) {
            console.warn('invokeUpdatePatientCardHXT error', e);
        }
        return false;
    }

    function softUpdateHXT() {
        const newVal = hxtTextarea.value.trim();
    // If nothing typed and patient has no existing HXT, don't create/propagate empty or previous values
    const hasExisting = !!(patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string' && patient.checklistState.huongXuTri.trim().length > 0);
    if (!newVal && !hasExisting) return;
        if (!window.checklistState) window.checklistState = {};
        window.checklistState = { ...(window.checklistState || {}), huongXuTri: newVal };
        patient.checklistState = { ...(patient.checklistState || {}), huongXuTri: newVal };
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...(patientInData.checklistState || {}), huongXuTri: newVal };
            }
        }
        invokeUpdatePatientCardHXT(patient);
    }

    async function saveHXT() {
        // Normalize and update global checklist state
        const newVal = hxtTextarea.value.trim();
        const hasExisting = !!(patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string' && patient.checklistState.huongXuTri.trim().length > 0);
        // Avoid saving empty if there was no existing value
        if (!newVal && !hasExisting) return;
        if (!window.checklistState) window.checklistState = {};
        window.checklistState = { ...(window.checklistState || {}), huongXuTri: newVal };

        // Ensure the local patient object also carries the latest state
        patient.checklistState = { ...(patient.checklistState || {}), huongXuTri: newVal };

        // Update patient object in global dr_data (merge to avoid losing other fields)
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...(patientInData.checklistState || {}), huongXuTri: newVal };
            }
        }

        // Persist (non-blocking UI-wise)
        if (window.checklistObj) {
            const ok = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
            if (!ok) {
                console.warn('Lưu HXT thất bại');
            }
        }

        // Update card view immediately with the updated patient object
    invokeUpdatePatientCardHXT(patient);

        // Flash saved indicator
        if (hxtSaved) {
            hxtSaved.style.display = 'block';
            setTimeout(() => hxtSaved.style.display = 'none', 1000);
        }
    }

    hxtTextarea.addEventListener('input', () => {
        softUpdateHXT();
        if (hxtSaveTimer) clearTimeout(hxtSaveTimer);
        hxtSaveTimer = setTimeout(() => {
            saveHXT();
        }, 700);
    });

    hxtTextarea.addEventListener('blur', () => {
        if (hxtSaveTimer) {
            clearTimeout(hxtSaveTimer);
            hxtSaveTimer = null;
        }
        saveHXT();
    });
    hxtTextarea.addEventListener('change', saveHXT);

    // ====== Chẩn đoán kèm theo: soft update + save ======
    function softUpdateCDKT() {
        const newVal = cdktTextarea.value.trim();
        const hasExisting = !!(patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string' && patient.checklistState.chanDoanKemTheo.trim().length > 0);
        if (!newVal && !hasExisting) return;
        if (!window.checklistState) window.checklistState = {};
        window.checklistState = { ...(window.checklistState || {}), chanDoanKemTheo: newVal };
        patient.checklistState = { ...(patient.checklistState || {}), chanDoanKemTheo: newVal };
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...(patientInData.checklistState || {}), chanDoanKemTheo: newVal };
            }
        }
    }

    async function saveCDKT() {
        const newVal = cdktTextarea.value.trim();
        const hasExisting = !!(patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string' && patient.checklistState.chanDoanKemTheo.trim().length > 0);
        if (!newVal && !hasExisting) return;
        if (!window.checklistState) window.checklistState = {};
        window.checklistState = { ...(window.checklistState || {}), chanDoanKemTheo: newVal };
        patient.checklistState = { ...(patient.checklistState || {}), chanDoanKemTheo: newVal };
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...(patientInData.checklistState || {}), chanDoanKemTheo: newVal };
            }
        }
        if (window.checklistObj) {
            const ok = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
            if (!ok) {
                console.warn('Lưu Chẩn đoán kèm theo thất bại');
            }
        }
        // Update card view immediately
        try {
            if (typeof updatePatientCardCDKT === 'function') {
                updatePatientCardCDKT(patient);
            } else if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.updatePatientCardCDKT === 'function') {
                unsafeWindow.updatePatientCardCDKT(patient);
            } else if (typeof globalThis !== 'undefined' && typeof globalThis.updatePatientCardCDKT === 'function') {
                globalThis.updatePatientCardCDKT(patient);
            }
        } catch (_) {}
        if (cdktSaved) {
            cdktSaved.style.display = 'block';
            setTimeout(() => cdktSaved.style.display = 'none', 1000);
        }
    }

    cdktTextarea.addEventListener('input', () => {
        softUpdateCDKT();
        if (cdktSaveTimer) clearTimeout(cdktSaveTimer);
        cdktSaveTimer = setTimeout(() => {
            saveCDKT();
        }, 700);
    });
    cdktTextarea.addEventListener('blur', () => {
        if (cdktSaveTimer) {
            clearTimeout(cdktSaveTimer);
            cdktSaveTimer = null;
        }
        saveCDKT();
    });
    cdktTextarea.addEventListener('change', saveCDKT);

    return info;
}

module.exports = { createPatientInfoSection };
