// dashboard.support.js - Refactored with modular architecture

const ReportService = require('./services/reportService');
const ApiService = require('./services/apiService');
const DialogManager = require('./components/dialogManager');
const DateUtils = require('./utils/dateUtils');

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
    } catch (_) {}
    
    try {
        // Show loading state
        inner.innerHTML = `
            <div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>
            <div style="text-align:center;padding:20px;">
                <div>Đang tải dữ liệu báo cáo...</div>
            </div>
        `;
        
    // Load checklist state for all patients (already sorted)
    const { sortedPatients, states } = await ReportService.getBatchChecklistStates(data);
        
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
        target.setHours(0,0,0,0);
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

    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const { patients: todayPatients, states: todayStates } = filterByAdmitDay(sortedPatients, states, today);
    const { patients: yesterdayPatients, states: yesterdayStates } = filterByAdmitDay(sortedPatients, states, yesterday);
    const htmlToday = ReportService.generateHTMLReport(todayPatients, todayStates);
    const textToday = ReportService.generateTextReport(todayPatients, todayStates);
    const htmlYesterday = ReportService.generateHTMLReport(yesterdayPatients, yesterdayStates);
    const textYesterday = ReportService.generateTextReport(yesterdayPatients, yesterdayStates);

    // Filter by surgery date (latest surgery in state.phauThuatLog[0])
    function filterBySurgeryDay(patientsArr, statesArr, targetDate) {
        const target = new Date(targetDate); target.setHours(0,0,0,0);
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
                        try { DialogManager.showToast('Không có bệnh nhân mới hôm qua.'); } catch (_) {}
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
                        try { DialogManager.showToast('Không có bệnh nhân mới hôm nay.'); } catch (_) {}
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
                        try { DialogManager.showToast('Không có bệnh nhân PT hôm qua.'); } catch (_) {}
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
                        try { DialogManager.showToast('Không có bệnh nhân PT hôm nay.'); } catch (_) {}
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
        } catch (_) {}

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
 * Copy report to clipboard and show toast
 */
async function copyReportToClipboard(report) {
    try {
        await navigator.clipboard.writeText(report);
        DialogManager.showToast('Đã copy báo cáo trực vào clipboard!');
    } catch (error) {
        console.error('Failed to copy report:', error);
        DialogManager.showToast('Lỗi khi copy báo cáo', { 
            background: '#d32f2f',
            duration: 3000 
        });
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
        @media (max-width: 600px) {
        .dr-list-row { padding: 12px 10px 8px 10px; gap: 10px; }
            .dr-list-title { font-size: 14px; }
            .dr-list-sub { font-size: 11px; }
            .dr-list-dx { font-size: 12px; -webkit-line-clamp: 2; }
            .dr-btn-icon { width: 30px; height: 30px; border-radius: 8px; }
            .dr-btn-icon svg { width: 14px; height: 14px; }
        }
            .dr-card { 
                background: #ffffff; 
                border-radius: 20px; 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10); 
                padding: 24px 20px 50px 20px; 
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
        .dr-card.dr-blue { 
            background: #e3f2fd; 
            border: 2px solid #90caf9; 
        }
        .dr-card h2 { 
            margin: 0 0 8px 0; 
            font-size: 1.2em; 
            color: #1976d2; 
        }
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
    /* Offline banner */
    .dr-offline-banner { background:#fff3cd; color:#8a6d3b; border:1px solid #ffeeba; padding:6px 10px; border-radius:6px; margin:8px 0; display:none; }
        .dr-bottom-bar-left { 
            color: #1976d2; 
            font-weight: bold; 
        }
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
            .no-print { 
                display: none !important; 
            }
            /* White cards (214, 215, 216) - giữ màu trắng khi in */
            .dr-card:not(.dr-blue) {
                background: #0d8ae3ff !important;
                border: 2px solid #c4490bff !important;
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
            .dr-bottom-bar {
                display: none !important;
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
            .dr-card.xuatvienanimation::after,
            .dr-card.xuatvienanimation.dr-blue::after {
                display: none !important;
            }
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
