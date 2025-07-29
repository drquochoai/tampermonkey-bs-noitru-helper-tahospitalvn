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
            <h3 style="margin-bottom:10px;">Log y lệnh</h3>
            
            <!-- Quick Action Buttons -->
            <div class="quick-ylenh-actions">
                ${quickYLenhActions.map(action => `
                    <button class="quick-ylenh-btn" data-action="${action.label}" style="color: ${action.color}; border-color: ${action.color};">
                        <span class="icon">${action.icon}</span>
                        <span class="text">${action.label}</span>
                        <span class="tick" style="display: none;">✅</span>
                    </button>
                `).join('')}
            </div>
            
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input type="text" id="dr-y-lenh-input" placeholder="Nhập y lệnh (VD: rút sonde tiểu)" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;">
                <button id="dr-add-y-lenh" style="padding:8px 16px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;">Thêm</button>
            </div>
            <div id="dr-y-lenh-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;">
                <div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>
            </div>
        </div>
    `;

    // Setup y lệnh functionality
    setupYLenhHandlers(info, patient);

    // Setup phẫu thuật functionality
    setupPhauThuatHandlers(info, patient);

    return info;
}

module.exports = { createPatientInfoSection };
