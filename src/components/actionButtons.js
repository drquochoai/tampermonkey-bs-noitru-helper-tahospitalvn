// components/actionButtons.js - shared creators for action buttons
const ChecklistService = require('../services/checklistService');
const ReportService = require('../services/reportService');

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
            window.open(`/hoso/${encodeURIComponent(String(mabn))}`, '_blank');
        }
    } catch (_) {
        window.open(`/hoso/${encodeURIComponent(String(mabn))}`, '_blank');
    }
}

function createCopyOneButton({ item, variant = 'icon' }) {
    const isIcon = variant === 'icon';
    const btn = document.createElement('button');
    btn.className = isIcon ? 'dr-btn-icon' : 'dr-detail-btn no-print';
    if (!isIcon) {
        btn.style.position = 'static';
        btn.style.padding = '8px';
        btn.style.borderRadius = '10px';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
    }
    btn.title = 'Copy báo cáo (1 BN)';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>' + (isIcon ? '' : ' Copy');
    btn.onclick = async (e) => {
        e.stopPropagation();
        try {
            const { copyReportToClipboardRich } = require('../dashboard.support');
            const res = await ChecklistService.loadChecklistData(item);
            const obj = ChecklistService.findChecklistObject(res);
            const state = obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
            const html = ReportService.generateSingleHTML(item, state);
            const text = ReportService.generateSingleText(item, state);
            await copyReportToClipboardRich(html, text);
        } catch (err) {
            console.error('Copy single-patient report failed:', err);
        }
    };
    return btn;
}

function createToDieuTriButton({ item, variant = 'full' }) {
    const isIcon = variant === 'icon';
    const btn = document.createElement('button');
    btn.className = isIcon ? 'dr-btn-icon' : 'dr-detail-btn no-print';
    if (!isIcon) {
        btn.style.position = 'static';
        btn.style.fontSize = '14px';
        btn.style.padding = '8px 12px 8px 10px';
    }
    btn.title = 'Tờ điều trị';
    const svgDoc = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1v4h4l-4-4zM8 9h8v2H8V9zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>';
    btn.innerHTML = isIcon ? svgDoc : `${svgDoc}Tờ điều trị`;
    btn.onclick = (e) => {
        e.stopPropagation();
        if (item.mabn) window.open(`/to-dieu-tri?mabn=${encodeURIComponent(item.mabn)}`, '_blank');
    };
    return btn;
}

function createHsbaButton({ item, variant = 'full' }) {
    const isIcon = variant === 'icon';
    const btn = document.createElement('button');
    btn.className = isIcon ? 'dr-btn-icon' : 'dr-detail-btn no-print';
    if (!isIcon) {
        btn.style.position = 'static';
        btn.style.marginLeft = '8px';
        btn.style.fontSize = '14px';
        btn.style.padding = '8px 12px 8px 10px';
        btn.textContent = 'HSBA V2';
    } else {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-4.97 0-8.19-4.16-8.94-5C3.81 10.16 7.03 6 12 6s8.19 4.16 8.94 5c-.75.84-3.97 5-8.94 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>';
    }
    btn.title = 'HSBA V2';
    btn.onclick = (e) => { e.stopPropagation(); openHSBAV2Link(item.mabn); };
    return btn;
}

module.exports = {
    createCopyOneButton,
    createToDieuTriButton,
    createHsbaButton,
    createHsbaV1Button,
    openHSBAV2Link
};

// Legacy HSBA (v1) opener as a shared creator
function createHsbaV1Button(item) {
    const btn = document.createElement('button');
    btn.className = 'dr-detail-btn no-print';
    btn.style.position = 'static';
    btn.style.marginLeft = '8px';
    btn.textContent = 'HSBAv1';
    btn.onclick = function (e) {
        e.stopPropagation();
        try {
            if (!item || !item.mabn) return;
            const url = `/hoso/${encodeURIComponent(String(item.mabn))}`;
            window.open(url, '_blank', 'noopener');
        } catch (error) {
            console.warn('Open HSBAv1 failed', error);
        }
    };
    return btn;
}
