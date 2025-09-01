// components/listView.js - Rendering for list view rows and actions
const Utils = require('../utils');
const PatientDataMapper = require('../utils/patientDataMapper');
const { createYLenhTags, hasMedsDoneToday } = require('../utils/tagUtils');
const { escapeHtml } = require('../utils/htmlUtils');
const { createCopyOneButton, createToDieuTriButton, createHsbaButton } = require('./actionButtons');

function createListActions(item, onCopy) {
    const wrap = document.createElement('div');
    wrap.className = 'dr-list-actions';
    

    // Copy icon for single-patient report (left-most as requested)
    const btnCopy = createCopyOneButton({ item, variant: 'icon' });
    wrap.appendChild(btnCopy);

    // Document icon for Tờ điều trị
    const btnToDieuTri = createToDieuTriButton({ item, variant: 'icon' });
    wrap.appendChild(btnToDieuTri);

    // Eye icon for HSBA V2 (right-most)
    const btnHsba = createHsbaButton({ item, variant: 'icon' });
    wrap.appendChild(btnHsba);

    return wrap;
}

function createListRow(item, opts = {}) {
    const row = document.createElement('div');
    row.className = 'dr-list-row';
    const age = Utils.calculateAge(item.ngaysinh);
    const gender = item.phai === 1 ? 'Nữ' : 'Nam';
    const formattedLocation = PatientDataMapper.formatRoomLocation(
        item.teN_PHONG, item.teN_GIUONG, item.teN_TANG, item.teN_TOANHA
    );
    const { composeDiagnosis } = require('../utils/domUpdaters');
    const { baseText: dx } = composeDiagnosis(item);
    const hxtText = (item.checklistState && item.checklistState.huongXuTri) ? String(item.checklistState.huongXuTri).trim() : '';

    const left = document.createElement('div');
    left.innerHTML = `
    <div class="dr-list-title">${item.hoten || ''} <span class="dr-list-dem">- ${age}t - ${gender}</span> • <span class="dr-list-mabn">${item.mabn || ''}</span> • <span class="dr-list-loc">${formattedLocation}</span></div>
        <div class="dr-list-dx">${dx}</div>
        ${hxtText ? `<div class="dr-value dr-hxt-block"><span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}</div>` : ''}
        ${createYLenhTags(item)}
    `;

    const onCopy = async () => {
        try {
            const ReportService = require('../services/reportService');
            const ChecklistService = require('../services/checklistService');
            const { copyReportToClipboardRich } = require('../dashboard.support');
            const res = await ChecklistService.loadChecklistData(item);
            const obj = ChecklistService.findChecklistObject(res);
            const state = obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
            const html = ReportService.generateSingleHTML(item, state);
            const text = ReportService.generateSingleText(item, state);
            await copyReportToClipboardRich(html, text);
        } catch (err) { console.error('Copy single-patient report failed:', err); }
    };

    const right = createListActions(item, onCopy);

    row.appendChild(left);
    row.appendChild(right);

    if (typeof opts.onOpen === 'function') {
        row.addEventListener('click', opts.onOpen);
    }

    return row;
}

// escapeHtml now provided by utils/htmlUtils

module.exports = {
    createListRow
};
