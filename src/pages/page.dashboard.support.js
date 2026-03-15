// dashboard.support.js - Refactored with modular architecture

const ReportService = require('../services/reportService');
const ApiService = require('../services/apiService');
const DialogManager = require('../components/dialogManager');
const DateUtils = require('../utils/dateUtils');

/**
 * Create direct report generation dialog
 */
async function createDirectReportGeneration() {
    const data = window.dr_data || [];

    // Create dialog
    const { dialog, inner } = DialogManager.createDialog('dr-direct-report-dialog', { maxWidth: '1100px', maxHeight: '88vh' });
    // Layout: flex column with a scrollable content area and a fixed (in-modal) footer
    try {
        inner.style.display = 'flex';
        inner.style.flexDirection = 'column';
        inner.style.overflowY = 'hidden';
        inner.style.paddingBottom = '0px';
    } catch (_) { }

    try {
        // Show loading state
        inner.innerHTML = `
            <div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>
            <div style="text-align:center;padding:20px;">
                <div>Đang tải dữ liệu báo cáo...</div>
            </div>
        `;

        // Load checklist state for all patients
        // Ưu tiên dùng checklistState in-memory từ window.dr_data (đã được cập nhật real-time
        // khi người dùng chỉnh HXT, CDKT trong sidebar). Chỉ fetch từ server cho BN chưa có.
        const { sortedPatients, states } = await ReportService.getBatchChecklistStates(data, { preferInMemory: true });

        // Generate report content (all patients)
        const htmlContent = ReportService.generateHTMLReport(sortedPatients, states);
        const textReport = ReportService.generateTextReport(sortedPatients, states);

        // Helpers to filter patients by admission date (ngayvv) using preloaded data only
        function parseAdmitDateToMidnight(dateStr) {
            if (!dateStr) return null;
            try {
                const us = DateUtils.convertToUSFormat(String(dateStr));
                const d = new Date(us);
                if (isNaN(d.getTime())) return null;
                d.setHours(0, 0, 0, 0);
                return d;
            } catch (_) { return null; }
        }

        function filterByAdmitDay(patientsArr, statesArr, targetDate) {
            const target = new Date(targetDate);
            target.setHours(0, 0, 0, 0);
            const zipped = patientsArr.map((p, i) => ({ p, s: statesArr[i] }));
            const filtered = zipped.filter(({ p }) => {
                const d = parseAdmitDateToMidnight(p && p.ngayvv);
                return d && d.getTime() === target.getTime();
            });
            return {
                patients: filtered.map(z => z.p),
                states: filtered.map(z => z.s)
            };
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const { patients: todayPatients, states: todayStates } = filterByAdmitDay(sortedPatients, states, today);
        const { patients: yesterdayPatients, states: yesterdayStates } = filterByAdmitDay(sortedPatients, states, yesterday);
        const htmlToday = ReportService.generateHTMLReport(todayPatients, todayStates);
        const textToday = ReportService.generateTextReport(todayPatients, todayStates);
        const htmlYesterday = ReportService.generateHTMLReport(yesterdayPatients, yesterdayStates);
        const textYesterday = ReportService.generateTextReport(yesterdayPatients, yesterdayStates);

        // Filter by surgery date (latest surgery in state.phauThuatLog[0])
        function filterBySurgeryDay(patientsArr, statesArr, targetDate) {
            const target = new Date(targetDate); target.setHours(0, 0, 0, 0);
            const zipped = patientsArr.map((p, i) => ({ p, s: statesArr[i] }));
            const filtered = zipped.filter(({ s }) => {
                if (!s || !Array.isArray(s.phauThuatLog) || s.phauThuatLog.length === 0) return false;
                const dStr = s.phauThuatLog[0] && s.phauThuatLog[0].date;
                const d = parseAdmitDateToMidnight(dStr);
                return d && d.getTime() === target.getTime();
            });
            return {
                patients: filtered.map(z => z.p),
                states: filtered.map(z => z.s)
            };
        }

        const { patients: ptTodayPatients, states: ptTodayStates } = filterBySurgeryDay(sortedPatients, states, today);
        const { patients: ptYesterdayPatients, states: ptYesterdayStates } = filterBySurgeryDay(sortedPatients, states, yesterday);
        const htmlPtToday = ReportService.generateHTMLReport(ptTodayPatients, ptTodayStates);
        const textPtToday = ReportService.generateTextReport(ptTodayPatients, ptTodayStates);
        const htmlPtYesterday = ReportService.generateHTMLReport(ptYesterdayPatients, ptYesterdayStates);
        const textPtYesterday = ReportService.generateTextReport(ptYesterdayPatients, ptYesterdayStates);

        // Create action buttons (copy set only)
        const copyButtons = DialogManager.createActionButtons([
            {
                id: 'dr-copy-direct-report',
                className: 'btn btn-primary',
                text: 'Copy bệnh ở khoa',
                onclick: () => copyReportToClipboardRich(htmlContent, textReport)
            },
            {
                id: 'dr-copy-direct-report-yesterday',
                className: 'btn btn-secondary',
                text: 'Copy bệnh mới hôm qua',
                onclick: () => {
                    if (!yesterdayPatients || yesterdayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân mới hôm qua.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlYesterday, textYesterday);
                }
            },
            {
                id: 'dr-copy-direct-report-today',
                className: 'btn btn-secondary',
                text: 'Copy bệnh mới hôm nay',
                onclick: () => {
                    if (!todayPatients || todayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân mới hôm nay.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlToday, textToday);
                }
            },
            {
                id: 'dr-copy-direct-report-pt-yesterday',
                className: 'btn btn-secondary',
                text: 'Copy bệnh PT hôm qua',
                onclick: () => {
                    if (!ptYesterdayPatients || ptYesterdayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân PT hôm qua.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlPtYesterday, textPtYesterday);
                }
            },
            {
                id: 'dr-copy-direct-report-pt-today',
                className: 'btn btn-secondary',
                text: 'Copy bệnh PT hôm nay',
                onclick: () => {
                    if (!ptTodayPatients || ptTodayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân PT hôm nay.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlPtToday, textPtToday);
                }
            }
        ]);

        // Update dialog content: a scrollable content area
        inner.innerHTML = `<div id="dr-report-content" style="flex:1; overflow:auto;">${htmlContent}</div>`;
        // Build footer bar fixed within modal (not sticky)
        const footerBar = document.createElement('div');
        footerBar.style.cssText = [
            'background:#fff',
            'padding:10px 0 0',
            'margin-top:8px',
            'border-top:1px solid #eee',
            'box-shadow:0 -2px 8px rgba(0,0,0,0.05)'
        ].join(';');
        // Arrange copy buttons into a 2x3 grid as requested
        try {
            const grid = copyButtons;
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr 1fr';
            grid.style.gridTemplateRows = 'auto auto';
            grid.style.gap = '12px';
            grid.style.justifyContent = 'stretch';
            grid.style.alignItems = 'stretch';

            const btnAll = grid.querySelector('#dr-copy-direct-report');
            const btnNewY = grid.querySelector('#dr-copy-direct-report-yesterday');
            const btnNewT = grid.querySelector('#dr-copy-direct-report-today');
            const btnPtY = grid.querySelector('#dr-copy-direct-report-pt-yesterday');
            const btnPtT = grid.querySelector('#dr-copy-direct-report-pt-today');
            if (btnAll) {
                btnAll.style.gridColumn = '1';
                btnAll.style.gridRow = '1 / span 2';
                btnAll.style.height = '100%';
                btnAll.style.width = '100%';
            }
            if (btnNewY) { btnNewY.style.gridColumn = '2'; btnNewY.style.gridRow = '1'; btnNewY.style.width = '100%'; }
            if (btnNewT) { btnNewT.style.gridColumn = '2'; btnNewT.style.gridRow = '2'; btnNewT.style.width = '100%'; }
            if (btnPtY) { btnPtY.style.gridColumn = '3'; btnPtY.style.gridRow = '1'; btnPtY.style.width = '100%'; }
            if (btnPtT) { btnPtT.style.gridColumn = '3'; btnPtT.style.gridRow = '2'; btnPtT.style.width = '100%'; }
        } catch (_) { }

        if (copyButtons && copyButtons.style) copyButtons.style.marginTop = '0';
        footerBar.appendChild(copyButtons);

        // Add a separate right-aligned close button row
        const closeRow = document.createElement('div');
        closeRow.style.cssText = 'display:flex;justify-content:flex-end;margin-top:8px;';
        const closeBtnWrap = DialogManager.createActionButtons([
            {
                id: 'dr-close-direct-report',
                className: 'btn btn-secondary',
                text: 'Đóng',
                onclick: () => dialog.remove()
            }
        ]);
        // Flatten wrapper styles
        if (closeBtnWrap && closeBtnWrap.style) {
            closeBtnWrap.style.marginTop = '0';
        }
        closeRow.appendChild(closeBtnWrap);
        footerBar.appendChild(closeRow);
        inner.appendChild(footerBar);

    } catch (error) {
        console.error('Error generating report:', error);
        inner.innerHTML = `
            <div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>
            <div style="color:red;text-align:center;padding:20px;">
                Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại.
            </div>
            ${DialogManager.createActionButtons([{
            id: 'dr-close-direct-report',
            className: 'btn btn-secondary',
            text: 'Đóng',
            onclick: () => dialog.remove()
        }]).outerHTML}
        `;
    }
}


/**
 * Copy rich HTML (with plain text fallback) to clipboard for better pasting into Google Docs
 */
async function copyReportToClipboardRich(html, textFallback) {
    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const blobHTML = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([textFallback || ''], { type: 'text/plain' });
            const data = new ClipboardItem({
                'text/html': blobHTML,
                'text/plain': blobText
            });
            await navigator.clipboard.write([data]);
        } else {
            // Fallback: inject a hidden contenteditable, select, execCommand
            const div = document.createElement('div');
            div.contentEditable = 'true';
            div.style.position = 'fixed';
            div.style.left = '-9999px';
            div.style.top = '0';
            div.innerHTML = html;
            document.body.appendChild(div);
            const range = document.createRange();
            range.selectNodeContents(div);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            document.body.removeChild(div);
        }
        DialogManager.showToast('Đã copy báo cáo (định dạng) vào clipboard!');
    } catch (error) {
        console.error('Failed to copy rich report:', error);
        // Last resort fallback
        try {
            await navigator.clipboard.writeText(textFallback || '');
            DialogManager.showToast('Đã copy báo cáo dạng text (fallback).');
        } catch (e2) {
            DialogManager.showToast('Lỗi khi copy báo cáo', {
                background: '#d32f2f',
                duration: 3000
            });
        }
    }
}

/**
 * Fetch patient data from ToDieuTri API
 */
async function fetchToDieuTriData() {
    return ApiService.fetchToDieuTriData();
}

/**
 * Add global styles for the dashboard
 */
function addGlobalStyles() {
    if (document.getElementById('dr-global-style')) return;

    const style = document.createElement('style');
    style.id = 'dr-global-style';
    style.textContent = `
        /* Sidebar action buttons polish */
        .dr-sidebar-actions { gap: 10px !important; padding: 6px 0 4px 0; }
        .dr-sidebar-actions .dr-detail-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 14px; border-radius: 12px; border: 1px solid #cbd5e1;
            background: #ffffff; color: #0f172a; font-weight: 600; line-height: 1;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); transition: all 0.18s ease;
        }
        .dr-sidebar-actions .dr-detail-btn svg { width: 18px; height: 18px; }
        .dr-sidebar-actions .dr-detail-btn img { width: 18px; height: 18px; object-fit: contain; display: block; }
        .dr-sidebar-actions .dr-detail-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12); border-color: #94a3b8; }
        .dr-sidebar-actions .dr-detail-btn:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.10); }
        .dr-sidebar-actions .dr-detail-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35); }
        .dr-sidebar-actions .dr-detail-btn:first-child { background: linear-gradient(180deg, #1e88e5, #1976d2); color: #fff; border-color: #1976d2; }
        .dr-sidebar-actions .dr-detail-btn:first-child:hover { filter: brightness(1.03); box-shadow: 0 6px 14px rgba(25, 118, 210, 0.25); }
        .dr-sidebar-actions .dr-detail-btn:last-child { background: #ffffff; color: #0f172a; border-color: #cbd5e1; }
        .dr-sidebar-actions .dr-detail-btn:last-child:hover { background: #f8fafc; }

        /* Quick y lệnh actions */
        .quick-ylenh-actions { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; padding:10px; background:#f8f9fa; border-radius:8px; border:1px solid #e9ecef; }
        .quick-ylenh-btn { display:flex; align-items:center; gap:6px; padding:8px 12px; border:none; border-radius:6px; background:#fff; color:#333; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s ease; border:2px solid transparent; white-space:nowrap; position:relative; }
        .quick-ylenh-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); border-color: currentColor; }
        .quick-ylenh-btn:active { transform: translateY(0); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .quick-ylenh-btn.active { border: 3px solid #d32f2f !important; background-color: #ffebee; box-shadow: 0 0 10px rgba(211, 47, 47, 0.3); }
        .quick-ylenh-btn.active::after { content: '⏳'; position:absolute; top:-6px; right:-6px; background:#1d4ed8; color:#fff; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; }
        .quick-ylenh-btn.done { border: 3px solid #2e7d32 !important; background-color: #e8f5e9; color: #1b5e20 !important; box-shadow: 0 0 10px rgba(27, 94, 32, 0.2); position: relative; }
        .quick-ylenh-btn.done::after { content: '✔'; position:absolute; top:-6px; right:-6px; background:#2e7d32; color:#fff; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; }
        .xv-time-editor { display:flex; align-items:center; gap:8px; padding:8px 12px; margin:6px 0 0 0; background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px; width:fit-content; }
        .xv-time-editor .xv-label { color:#0f172a; font-weight:600; }
        .xv-time-editor .xv-time { padding:4px 6px; border:1px solid #cbd5e1; border-radius:6px; }
        .xv-time-editor .xv-saved { color:#16a34a; font-weight:600; }

        /* Tags (generic) */
        .ylenh-tags { display:flex; flex-wrap:wrap; gap:4px; margin:8px 0 4px 0; overflow-wrap:anywhere; word-break:break-word; }
        .ylenh-tag { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background-color: rgba(76, 175, 80, 0.1); color:#2e7d32; border:1px solid rgba(76, 175, 80, 0.3); border-radius:12px; font-size:12px; font-weight:600; line-height:1.2; white-space:normal; overflow-wrap:anywhere; word-break:break-word; max-width:100%; flex-wrap:wrap; }
        .ylenh-tag.discharge { background: linear-gradient(45deg, #4caf50, #66bb6a) !important; color: #fff !important; border: 2px solid #4caf50 !important; font-weight:700 !important; font-size:12px; text-shadow: 0 1px 1px rgba(0,0,0,0.25); }
        .ylenh-tag.completed { background-color: rgba(76, 175, 80, 0.2); color: #1b5e20; border-color: rgba(76, 175, 80, 0.5); }
        .ylenh-tag.state-active { background-color: rgba(37, 99, 235, 0.10); color:#1d4ed8; border-color: rgba(37, 99, 235, 0.35); font-weight:700; }
        .ylenh-tag.state-done { background-color: rgba(34, 197, 94, 0.12); color:#15803d; border-color: rgba(34, 197, 94, 0.45); font-weight:600; }
        .ylenh-tag.discharge.state-active { font-size:12.5px; font-weight:700; color:#ffffff !important; text-shadow: 0 1px 1px rgba(0,0,0,0.35); border-color:#2e7d32 !important; padding:4px 9px; }

        /* Card meds-done badge */
        .dr-card .dr-badge-meds-done { position:absolute; top:-10px; right:10px; background:#16a34a; color:#fff; font-weight:800; font-size:11px; border-radius:999px; padding:4px 8px; box-shadow:0 2px 6px rgba(22,163,74,0.35); display:inline-flex; align-items:center; gap:6px; z-index:2; }
        .dr-card .dr-badge-meds-done::before { content:'✔'; background: rgba(255,255,255,0.2); width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:11px; }
        .dr-card.meds-done { border: 2px solid #16a34a !important; box-shadow: 0 0 0 2px rgba(22,163,74,0.08), 0 4px 12px rgba(0,0,0,0.06); }
        .dr-card-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 20px; 
            justify-content: center; 
            padding: 30px; 
            /* Ensure content is not hidden behind fixed bottom bar */
            padding-bottom: 90px; 
        }
        /* List view container and rows */
        .dr-list-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 10px 12px 90px 12px; /* keep room for bottom bar */
        }
        @media (min-width: 1200px) {
            .dr-list-container {
                grid-template-columns: 1fr 1fr; /* 2 columns on large screens */
            }
        }
        .dr-list-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 12px 10px 12px; /* extra top space for badge */
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
            cursor: pointer;
            min-height: 60px;
            position: relative; /* anchor for corner badges */
        }
        .dr-list-row:hover {
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.10);
            border-color: #cbd5e1;
        }
        .dr-list-title {
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    .dr-list-title .dr-list-dem { color:#64748b; font-weight:600; }
    .dr-list-title .dr-list-mabn { color:#334155; font-weight:700; }
    .dr-list-title .dr-list-loc { color:#64748b; }
        .dr-list-sub {
            color: #64748b;
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 4px;
        }
        .dr-list-dx {
            color: #0f172a;
            font-size: 13px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            max-height: 2.8em;
        }
        /* Compact tags inside list rows */
        .dr-list-row .ylenh-tags {
            margin: 6px 0 0 0;
            gap: 4px;
        }
        .dr-list-row .ylenh-tag {
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            line-height: 1.15;
        }
        .dr-list-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
            flex-shrink: 0;
            position: relative; /* anchor for inline badge */
        }
        .dr-btn-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: linear-gradient(180deg, #1e88e5, #1976d2);
            box-shadow: 0 1px 2px rgba(25, 118, 210, 0.15);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
        }
        .dr-btn-icon:hover { transform: translateY(-1px); filter: brightness(1.03); box-shadow: 0 4px 10px rgba(25,118,210,0.22); }
        .dr-btn-icon:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(25,118,210,0.18); }
        .dr-btn-icon svg { width: 16px; height: 16px; }
        .dr-badge-meds-inline {
            background: #16a34a;
            color: #fff;
            font-weight: 700;
            font-size: 11px;
            border-radius: 999px;
            padding: 2px 8px;
            line-height: 1.2;
            box-shadow: 0 1px 2px rgba(22,163,74,0.2);
            white-space: nowrap;
            position: absolute;
            top: -8px;
            right: -6px;
            pointer-events: none;
        }
        .dr-badge-meds-row-corner {
            position: absolute;
            top: -8px;
            left: -6px;
            background: #16a34a;
            color: #fff;
            font-weight: 800;
            font-size: 10px;
            border-radius: 999px;
            padding: 3px 8px;
            line-height: 1;
            box-shadow: 0 1px 3px rgba(22,163,74,0.25);
            pointer-events: none;
            z-index: 2;
        }
        /* Unify HXT typography */
        .dr-hxt-block { color: #0f172a; font-size: 13px; line-height: 1.35; }
        .dr-hxt-block .dr-label { color: #0f172a; font-weight: 700; }

        /* Display Settings dynamic visibility */
        body.dr-hide-hxt .dr-hxt-block { display: none !important; }
        body.dr-hide-pppt .dr-pt-info .dr-value:first-child { display: none !important; }
        body.dr-hide-surgeon .dr-surgeon-line { display: none !important; }
        .dr-surgeon-line { color: #555; font-size: 0.9em; margin-bottom: 2px; }

        /* Context Menu Styles */
        .dr-context-menu {
            position: fixed;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 4px 0;
            min-width: 180px;
            z-index: 1000000;
            font-size: 14px;
        }
        .dr-context-menu-item {
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #333;
            transition: background 0.15s;
        }
        .dr-context-menu-item:hover {
            background: #f1f5f9;
        }
        
        /* Modal Settings Styles */
        .dr-settings-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.4); z-index: 999998;
            display: flex; align-items: center; justify-content: center;
        }
        .dr-settings-modal {
            background: #fff; border-radius: 8px; width: 400px;
            max-width: 90vw; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow: hidden; z-index: 999999;
        }
        .dr-settings-header {
            padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
        }
        .dr-settings-header h3 { margin: 0; color: #0f172a; font-size: 16px; font-weight: 600; }
        .dr-settings-close {
            background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b;
        }
        .dr-settings-body { padding: 20px; }
        .dr-settings-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #f1f5f9;
        }
        .dr-settings-row:last-child { border-bottom: none; }
        .dr-settings-label { color: #334155; font-weight: 500; font-size: 14px; }
        
        /* Toggle Switch */
        .dr-switch {
            position: relative; display: inline-block; width: 40px; height: 22px;
        }
        .dr-switch input { opacity: 0; width: 0; height: 0; }
        .dr-slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #cbd5e1; transition: .3s; border-radius: 22px;
        }
        .dr-slider:before {
            position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px;
            background-color: white; transition: .3s; border-radius: 50%;
        }
        input:checked + .dr-slider { background-color: #1976d2; }
        input:checked + .dr-slider:before { transform: translateX(18px); }
        @media (max-width: 600px) {
            .dr-list-row { padding: 12px 10px 8px 10px; gap: 10px; }
            .dr-list-title { font-size: 14px; }
            .dr-list-sub { font-size: 11px; }
            .dr-list-dx { font-size: 12px; -webkit-line-clamp: 2; }
            .dr-btn-icon { width: 30px; height: 30px; border-radius: 8px; }
            .dr-btn-icon svg { width: 14px; height: 14px; }
            .dr-sidebar-actions { gap: 6px !important; }
            .dr-sidebar-actions .dr-detail-btn { gap:6px; padding:8px 10px; border-radius:10px; font-size:12px; line-height:1.1; }
            .dr-sidebar-actions .dr-detail-btn svg,
            .dr-sidebar-actions .dr-detail-btn img { width:14px; height:14px; }
        }
            .dr-card { 
                background: #ffffff; 
                border-radius: 20px; 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10); 
                padding: 14px 20px 50px 20px; 
                min-width: 260px; 
                max-width: 320px; 
                flex: 1 1 260px; 
                display: flex; 
                flex-direction: column; 
                align-items: flex-start; 
                position: relative; 
                border: 2px solid #e3e3e3; 
                cursor: pointer; 
        }
        /* Room/bed label at the very top of the card — large & centered */
        .dr-room-label {
            width: 100%;
            text-align: center;
            font-size: 1.35em;
            font-weight: 800;
            color: #1565c0;
            letter-spacing: 0.04em;
            padding: 2px 0 10px 0;
            margin-bottom: 4px;
            border-bottom: 2px solid #bbdefb;
            word-break: break-word;
        }
        .dr-card.dr-blue .dr-room-label {
            color: #0d47a1;
            border-bottom-color: #90caf9;
        }
        .dr-card.dr-blue { 
            background: #e3f2fd; 
            border: 2px solid #90caf9; 
        }
        .dr-patient-name { 
            margin: 0 0 4px 0; 
            font-size: 1.25em; 
            color: #1976d2;
            font-weight: 700;
        }
        .dr-patient-sub-info {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.95em;
            color: #64748b;
        }
        .dr-patient-mabn { font-weight: 700; color: #334155; }
        .dr-patient-gender { color: #64748b; }
        .dr-card .dr-label { 
            font-weight: bold; 
            color: #000; 
        }
        .dr-card .dr-value { 
            margin-bottom: 6px; 
        }
        /* Clamp secondary diagnosis (CD kèm theo) to 2 lines in card view */
        .dr-card .dr-diagnosis-line .dr-cdkt-clamp {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            max-height: 2.8em; /* approx two lines */
        }
        .dr-card .dr-detail-btn { 
            position: absolute; 
            right: 16px; 
            bottom: 12px; 
            background: #1976d2; 
            color: #fff; 
            border: none; 
            border-radius: 50px; 
            padding: 6px 16px 6px 10px; 
            font-size: 15px; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            box-shadow: 0 2px 6px rgba(25,118,210,0.10); 
            white-space: nowrap;
        }
            .dr-card .dr-detail-btn svg { 
                margin-right: 4px; 
                width: 16px; height: 16px;
            }
        .dr-total { 
            text-align: center; 
            font-size: 1.1em; 
            margin-top: 30px; 
            color: #1976d2; 
            font-weight: bold; 
        }
        .dr-nodata, .dr-login { 
            text-align: center; 
            font-size: 1.2em; 
            color: #b71c1c; 
            margin-top: 40px; 
        }
        .dr-bottom-bar {
            position: fixed;
            left: 0; right: 0; bottom: 0;
            width: 100vw;
            background: #fff;
            border-top: 2px solid #90caf9;
            box-shadow: 0 -2px 8px rgba(25,118,210,0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 24px;
            height: 54px;
            z-index: 99999;
            font-size: 1.1em;
        }
        /* Bottom bar left cluster */
        .dr-bottom-bar-left { display:flex; align-items:center; gap: 10px; }

        /* Khoa select (pretty) */
        .dr-khoa-select {
            height: 34px;
            min-width: 200px;
            padding: 0 34px 0 10px; /* room for chevron */
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 1px 2px rgba(15,23,42,0.05);
            transition: border-color .15s ease, box-shadow .15s ease, filter .15s ease;
            -webkit-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;utf8,\
                <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>\
                    <path d='M6 8l4 4 4-4' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>\
                </svg>");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 18px 18px;
            cursor: pointer;
        }
        .dr-khoa-select:hover { border-color: #94a3b8; filter: brightness(1.02); }
        .dr-khoa-select:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
        .dr-khoa-select:disabled { opacity: .6; cursor: not-allowed; }

        /* settings “gear” anchor next to select */
        .dr-gear-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; color:#1976d2; border:1px solid rgba(25,118,210,0.25); text-decoration:none; background:#fff; transition: box-shadow .15s ease, background .15s ease; }
        .dr-gear-btn i { font-size:16px; }
        .dr-gear-btn:hover { background:#e3f2fd; box-shadow:0 0 0 2px rgba(25,118,210,0.15) inset; }

    /* Offline banner */
    .dr-offline-banner { background:#fff3cd; color:#8a6d3b; border:1px solid #ffeeba; padding:6px 10px; border-radius:6px; margin:8px 0; display:none; }
        .dr-bottom-bar-left { color: #1976d2; font-weight: bold; }
        @media (max-width: 600px) {
            .dr-bottom-bar { 
                flex-direction: column; 
                height: auto; 
                padding: 8px 8px; 
            }
            .dr-card-list { 
                flex-direction: column; 
                align-items: center; 
            }
            /* Card action buttons: smaller on phones */
            .dr-card .dr-detail-btn {
                padding: 6px 10px 6px 8px;
                font-size: 12px;
                border-radius: 16px;
            }
            .dr-card .dr-detail-btn svg { width: 14px; height: 14px; margin-right: 4px; }
            /* Action group spacing and positioning */
            .dr-action-buttons { gap: 6px !important; right: 10px !important; bottom: 8px !important; }
            /* Icon-only copy button (inline style width/height) shrink */
            .dr-action-buttons .dr-detail-btn[title="Copy báo cáo (1 BN)"] {
                width: 30px !important; height: 30px !important; padding: 6px !important; border-radius: 8px !important;
            }
            .dr-action-buttons .dr-detail-btn[title="Copy báo cáo (1 BN)"] svg { width: 14px; height: 14px; }
        }
        #dr-sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.25);
            z-index: 99999;
        }
        #dr-sidebar {
            position: fixed;
            top: 0;
            right: 0;
            width: 80vw;
            max-width: 80vw;
            height: 100vh;
            background: #fff;
            z-index: 100000;
            box-shadow: -2px 0 16px rgba(0,0,0,0.15);
            padding: 32px 24px 24px 24px;
            overflow-y: auto;
            transition: right 0.2s;
        }
        /* Sidebar responsive layout */
        @media (min-width: 1024px) {
            .dr-sidebar-container { flex-direction: row !important; gap: 24px !important; }
            .dr-sidebar-left { flex: 0 0 40% !important; }
            .dr-sidebar-right { flex: 1 !important; }
        }
        /* Xuất viện animation class - Hiệu ứng ngôi sao */
        .dr-card.xuatvienanimation {
            position: relative;
            overflow: hidden;
            border: 3px solid #ffd700 !important;
            background: linear-gradient(135deg, #fff9c4, #ffffff) !important;
            animation: starGlow 3s ease-in-out infinite;
        }
        
        /* Xuất viện animation cho card blue - border blue glow */
        .dr-card.xuatvienanimation.dr-blue {
            border: 3px solid #2196f3 !important;
            background: linear-gradient(135deg, #e3f2fd, #ffffff) !important;
            animation: starGlowBlue 3s ease-in-out infinite;
        }
        
        .dr-card.xuatvienanimation::before {
            content: '⭐';
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 24px;
            animation: starRotate 2s linear infinite;
            z-index: 10;
        }
        
        .dr-card.xuatvienanimation::after {
            content: '✨ 🎉 ✨';
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            animation: sparkle 1.5s ease-in-out infinite;
            z-index: 10;
        }
        
        @keyframes starGlow {
            0%, 100% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 20px rgba(255, 215, 0, 0.4);
            }
            50% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 30px rgba(255, 215, 0, 0.8);
            }
        }
        
        @keyframes starGlowBlue {
            0%, 100% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 20px rgba(33, 150, 243, 0.4);
            }
            50% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 30px rgba(33, 150, 243, 0.8);
            }
        }
        
        @keyframes starRotate {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(90deg) scale(1.2); }
            50% { transform: rotate(180deg) scale(1); }
            75% { transform: rotate(270deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes sparkle {
            0%, 100% { 
                opacity: 0.6;
                transform: translateX(-50%) translateY(0px);
            }
            50% { 
                opacity: 1;
                transform: translateX(-50%) translateY(-5px);
            }
        }
        
        @media print {
            .no-print,
            .dr-action-buttons,
            #dr-global-card-tooltip { 
                display: none !important; 
            }

            /* Layout for side-by-side columns */
            body {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                align-items: flex-start !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            /* White cards (214, 215, 216) - giữ màu trắng khi in */
            .dr-card:not(.dr-blue) {
                background: #fff !important;
                border: 2px solid #ddd !important;
                color: #000 !important;
            }
            /* Blue cards (các phòng khác) - giữ background blue khi in */
            .dr-card.dr-blue {
                background: #e3f2fd !important;
                border: 2px solid #2196f3 !important;
                color: #000 !important;
            }
            .dr-card h2 {
                color: #000 !important;
            }
            
            /* Hide dashboard controls but keep layout structure for children */
            .dr-bottom-bar, .dr-topbar-center, .dr-topbar-right, 
            #dr-search-input, #dr-tracking-btn, #dr-tracking-badge,
            .dr-view-dropdown, .dr-view-toggle {
                display: none !important;
            }
            
            /* Allow tracking container to be visible during print if it's actually open */
            .dr-top-filter-bar, .dr-topbar-left {
                display: block !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                height: auto !important;
                background: transparent !important;
                flex: 0 0 100% !important; /* Default to full width for top elements */
            }

            /* When tracking is open, it acts as a sidebar */
            body:has(#dr-tracking-container.dr-tracking-open:not(.dr-tracking-empty)) .dr-top-filter-bar {
                flex: 0 0 300px !important;
                width: 300px !important;
                margin-right: 20px !important;
            }
            body:has(#dr-tracking-container.dr-tracking-open:not(.dr-tracking-empty)) #dr-main-wrapper {
                flex: 1 !important;
                width: calc(100% - 320px) !important;
            }

            #dr-main-wrapper {
                flex: 0 0 100% !important;
                width: 100% !important;
                margin: 0 !important;
            }

            /* Tắt animation khi in */
            .dr-card.xuatvienanimation,
            .dr-card.xuatvienanimation.dr-blue {
                animation: none !important;
                border: 2px solid #ccc !important;
                background: #fff !important;
            }
            .dr-card.xuatvienanimation::before,
            .dr-card.xuatvienanimation.dr-blue::before {
                display: none !important;
            }

            /* Hỗ trợ in danh sách theo dõi - Chỉ in nếu có class dr-tracking-open và không empty */
            #dr-tracking-container:not(.dr-tracking-open),
            #dr-tracking-container.dr-tracking-empty {
                display: none !important;
            }

            #dr-tracking-container.dr-tracking-open {
                display: flex !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                border: 1px solid #ddd !important;
                border-radius: 8px !important;
                box-shadow: none !important;
                padding: 12px !important;
                margin: 0 !important;
                page-break-before: auto !important;
                background: #fff !important;
                flex-direction: column !important;
            }
            #dr-tracking-scroll-area {
                overflow: visible !important;
                height: auto !important;
                flex: none !important;
            }
            #dr-tracking-active-list {
                display: grid !important;
                grid-template-columns: 1fr !important; /* Multi-column in small sidebar is too cramped, stick to 1 */
                gap: 10px !important;
                width: 100% !important;
            }
            .dr-card.dr-tracking-card {
                max-height: none !important;
                border: 1px solid #eee !important;
                page-break-inside: avoid;
            }
            /* Ẩn phần nhập liệu và các nút toggle khi in */
            #dr-tracking-container > div:nth-child(2),
            #dr-tracking-toggle-mode,
            #dr-tracking-copy-wrapper,
            .dr-tracking-remove,
            .dr-tracking-bulk-remove {
                display: none !important;
            }
            #dr-tracking-container h4 {
                font-size: 16px !important;
                margin-bottom: 10px !important;
            }
        }

        /* --- Custom Premium Dropdown Styles --- */
        .dr-view-dropdown {
            position: relative;
            display: inline-block;
        }
        .dr-dropdown-toggle {
            padding: 8px 16px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            color: #334155;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            min-width: 160px;
            justify-content: space-between;
        }
        .dr-dropdown-toggle:hover {
            border-color: #94a3b8;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateY(-1px);
        }
        .dr-dropdown-toggle:active {
            transform: translateY(0);
        }
        .dr-dropdown-toggle i.fa-chevron-down {
            font-size: 10px;
            transition: transform 0.2s;
            color: #64748b;
        }
        .dr-view-dropdown.open .dr-dropdown-toggle i.fa-chevron-down {
            transform: rotate(180deg);
        }
        .dr-dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 180px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            padding: 6px;
            display: none;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dr-view-dropdown.open .dr-dropdown-menu {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        .dr-dropdown-item {
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .dr-dropdown-item:hover {
            background: rgba(30, 136, 229, 0.08);
            color: #1e88e5;
        }
        .dr-dropdown-item.active {
            background: #1e88e5;
            color: #fff;
        }
        .dr-dropdown-item i {
            width: 16px;
            text-align: center;
        }

        /* --- Fit to Screen Mode Styles --- */
        .dr-fit-container {
            display: grid;
            gap: 10px;
            padding: 15px;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden; /* No scroll requested */
        }
        .dr-fit-container .dr-card {
            min-width: 0 !important;
            max-width: none !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 8px !important; /* Slightly smaller padding */
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            border-radius: 12px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
            overflow: hidden; /* Prevent content expansion */
            position: relative;
        }
        .dr-fit-container .dr-card .dr-room-label {
            font-size: var(--fit-title-size, 1.1em);
            padding-bottom: 2px;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #1e88e5; /* Stronger color for location */
        }
        .dr-fit-container .dr-card .dr-patient-name {
            font-size: var(--fit-name-size, 1.25em);
            font-weight: 800;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #0f172a;
        }
        .dr-fit-container .dr-card .dr-patient-sub-info {
            display: flex;
            gap: 10px;
            font-size: calc(var(--fit-text-size, 0.9em) - 1px);
            color: #64748b;
            margin-bottom: 2px;
            font-weight: 500;
        }
        .dr-fit-container .dr-card .dr-value {
            font-size: var(--fit-text-size, 0.9em);
            margin-bottom: 1px;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .dr-fit-container .dr-card .dr-diagnosis-line,
        .dr-fit-container .dr-card .dr-pt-info,
        .dr-fit-container .dr-card .dr-hxt-block {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2; /* Clamp to 2 lines to save vertical space */
            overflow: hidden;
            font-size: var(--fit-text-size, 0.9em);
            white-space: normal !important;
            margin-bottom: 1px;
        }
        .dr-fit-container .ylenh-tags {
            margin-top: 2px;
            gap: 2px;
            flex-wrap: wrap;
            max-height: 2.2em;
            overflow: hidden;
        }
        .dr-fit-container .ylenh-tag {
            font-size: calc(var(--fit-text-size, 0.9em) - 2px);
            padding: 1px 4px;
        }

        /* --- Compact Bars and Hidden UI in Fit Mode --- */
        body.dr-fit-mode .dr-top-filter-bar {
            padding: 4px 12px !important;
            min-height: 0 !important;
            margin: 0 !important; /* Remove margin as requested */
        }
        body.dr-fit-mode .dr-bottom-bar {
            height: 34px !important; /* Extremely compact bottom bar */
            padding: 0 16px !important;
            margin: 0 !important; /* Remove margin as requested */
        }
        body.dr-fit-mode .dr-action-buttons {
            display: none !important; /* Hide action buttons as requested */
        }
        body.dr-fit-mode .dr-total-compact {
            padding: 2px 8px !important;
            font-size: 11px !important;
        }
        body.dr-fit-mode #dr-search-input {
            padding: 4px 8px !important;
            font-size: 12px !important;
        }
        body.dr-fit-mode .dr-dropdown-toggle {
            padding: 4px 10px !important;
            font-size: 12px !important;
            min-width: 120px !important;
        }
        body.dr-fit-mode .dr-khoa-select {
            height: 24px !important;
            font-size: 12px !important;
            padding: 0 24px 0 6px !important;
            background-size: 12px 12px !important;
        }
        body.dr-fit-mode .dr-gear-btn {
            width: 24px !important;
            height: 24px !important;
        }
        body.dr-fit-mode .dr-gear-btn i {
            font-size: 12px !important;
        }
        body.dr-fit-mode .dr-badge-meds-done {
            top: -5px !important;
            right: 5px !important;
            font-size: 9px !important;
            padding: 2px 6px !important;
        }

        /* --- Compact Bottom Bar Buttons --- */
        body.dr-fit-mode .dr-bottom-bar .dr-btn,
        body.dr-fit-mode .dr-bottom-bar button {
            padding: 4px 10px !important;
            font-size: 11px !important;
            border-radius: 6px !important;
            min-height: 0 !important;
            gap: 4px !important; /* Smaller gap */
        }
        body.dr-fit-mode .dr-bottom-bar .dr-copy-menu-item {
            padding: 6px 10px !important;
        }
        body.dr-fit-mode .dr-bottom-bar .dr-copy-menu-item div:first-child {
            font-size: 0.85em !important;
        }
        body.dr-fit-mode .dr-bottom-bar .dr-copy-menu-item div:last-child {
            font-size: 0.7em !important;
        }
        body.dr-fit-mode .dr-copy-dropdown-menu {
            width: 200px !important;
        }
                 display: none !important;
            }
        }

        /* Tracking UI Fit Cards (mimic fit container) with Hover Expansion */
        #dr-tracking-active-list .dr-card {
            background-color: #fff0f0 !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4px 6px !important;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            border-radius: 10px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
            position: relative;
            max-height: 120px;
            overflow: hidden !important;
            transition: box-shadow 0.2s ease, max-height 0.3s ease;
            z-index: 1;
        }
        #dr-tracking-active-list .dr-card .dr-room-label {
            font-size: 1.1em;
            padding-bottom: 2px;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #1e88e5;
        }
        #dr-tracking-active-list .dr-card .dr-patient-name {
            font-size: 1.1em;
            font-weight: 800;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #0f172a;
        }
        #dr-tracking-active-list .dr-card .dr-patient-sub-info {
            display: flex;
            gap: 10px;
            font-size: 0.85em;
            color: #64748b;
            margin-bottom: 2px;
            font-weight: 500;
        }
        #dr-tracking-active-list .dr-card .dr-value {
            font-size: 0.82em;
            margin-bottom: 0px;
            line-height: 1.2;
            white-space: normal !important;
            word-break: break-word;
            overflow: hidden;
            padding-top: 0;
        }
        #dr-tracking-active-list .dr-card .dr-diagnosis-line,
        #dr-tracking-active-list .dr-card .dr-pt-info,
        #dr-tracking-active-list .dr-card .dr-hxt-block {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            font-size: 0.85em;
            white-space: normal !important;
            margin-bottom: 1px;
        }
        #dr-tracking-active-list .ylenh-tags {
            margin-top: 2px;
            gap: 2px;
            flex-wrap: wrap;
            max-height: 2.2em;
            overflow: hidden;
        }
        #dr-tracking-active-list .ylenh-tag {
            font-size: 10px;
            padding: 1px 4px;
            line-height: 1.2;
        }
        #dr-tracking-active-list .dr-action-buttons {
            transform: scale(0.85);
            transform-origin: bottom right;
            right: 8px !important;
            bottom: 6px !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Update checklist data (wrapper for backward compatibility)
 */
function updateChecklistPhieu(oldData, checklistState, callback) {
    ApiService.updateChecklistData(oldData, checklistState)
        .then(result => {
            if (typeof callback === 'function') {
                callback(result);
            }
        })
        .catch(error => {
            console.error('Failed to update checklist:', error);
            if (typeof callback === 'function') {
                callback(null);
            }
        });
}

/**
 * Create checklist for patient (wrapper for backward compatibility)
 */
function createChecklistPhieu(patient, callback) {
    ApiService.createChecklistForPatient(patient)
        .then(result => {
            if (typeof callback === 'function') {
                callback(result);
            }
        })
        .catch(error => {
            console.error('Failed to create checklist:', error);
            if (typeof callback === 'function') {
                callback(null);
            }
        });
}

module.exports = {
    createDirectReportGeneration,
    fetchToDieuTriData,
    addGlobalStyles,
    copyReportToClipboardRich,
    updateChecklistPhieu,
    createChecklistPhieu
};
