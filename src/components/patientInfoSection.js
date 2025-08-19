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
        
        <div style="margin-top:20px;">
            <h3 style="margin-bottom:10px;">Thông tin phẫu thuật</h3>
            <div style="margin-bottom:12px;">
                <button id="dr-show-pt-form" style="background:#1976d2;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;font-size:0.9em;">Thêm phẫu thuật</button>
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

    // Initial load if state already available
    setTimeout(() => {
        if (window.checklistState && typeof window.checklistState.huongXuTri === 'string') {
            hxtTextarea.value = window.checklistState.huongXuTri;
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

    return info;
}

module.exports = { createPatientInfoSection };
