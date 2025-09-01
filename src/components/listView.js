// components/listView.js - Rendering for list view rows and actions
const Utils = require('../utils');
const PatientDataMapper = require('../utils/patientDataMapper');
const { createYLenhTags, hasMedsDoneToday } = require('../utils/tagUtils');

async function openHSBAV2Link(mabn) {
    try {
        const response = await fetch('/ToDieuTri/LoadLinkHsba', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: 'code=' + encodeURIComponent(mabn)
        });
        const result = await response.json();
        if (result && result.data && result.data.link) {
            window.open(result.data.link, '_blank');
        } else {
            // fallback to v1
            window.open(`/hoso/${encodeURIComponent(String(mabn))}`, '_blank');
        }
    } catch (_) {
        window.open(`/hoso/${encodeURIComponent(String(mabn))}`, '_blank');
    }
}

function createListActions(item, onCopy) {
    const wrap = document.createElement('div');
    wrap.className = 'dr-list-actions';
    

    // Copy icon for single-patient report (left-most as requested)
    const btnCopy = document.createElement('button');
    btnCopy.className = 'dr-btn-icon';
    btnCopy.title = 'Copy báo cáo (1 BN)';
    btnCopy.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>';
    btnCopy.onclick = (e) => {
        e.stopPropagation();
        if (typeof onCopy === 'function') onCopy();
    };
    wrap.appendChild(btnCopy);

    // Document icon for Tờ điều trị
    const btnToDieuTri = document.createElement('button');
    btnToDieuTri.className = 'dr-btn-icon';
    btnToDieuTri.title = 'Tờ điều trị';
    btnToDieuTri.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1v4h4l-4-4zM8 9h8v2H8V9zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>';
    btnToDieuTri.onclick = (e) => {
        e.stopPropagation();
        if (item.mabn) window.open(`/to-dieu-tri?mabn=${encodeURIComponent(item.mabn)}`, '_blank');
    };
    wrap.appendChild(btnToDieuTri);

    // Eye icon for HSBA V2 (right-most)
    const btnHsba = document.createElement('button');
    btnHsba.className = 'dr-btn-icon';
    btnHsba.title = 'HSBA V2';
    btnHsba.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-4.97 0-8.19-4.16-8.94-5C3.81 10.16 7.03 6 12 6s8.19 4.16 8.94 5c-.75.84-3.97 5-8.94 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>';
    btnHsba.onclick = (e) => {
        e.stopPropagation();
        openHSBAV2Link(item.mabn);
    };
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
    const icdSuffix = item.maicdvk ? ` (${String(item.maicdvk).trim()})` : '';
    const dx = `${item.chandoanvk || ''}${icdSuffix}`;
    const hxtText = (item.checklistState && item.checklistState.huongXuTri) ? String(item.checklistState.huongXuTri).trim() : '';

    const left = document.createElement('div');
    left.innerHTML = `
        <div class="dr-list-title">${item.hoten || ''} <span style="color:#64748b;font-weight:600;">- ${age}t - ${gender}</span> • <span style="color:#334155;font-weight:700;">${item.mabn || ''}</span> • <span style="color:#64748b;">${formattedLocation}</span></div>
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

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br/>');
}

module.exports = {
    createListRow
};
