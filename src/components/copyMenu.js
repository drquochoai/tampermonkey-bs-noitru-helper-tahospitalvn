// copyMenu.js - Dropdown menu for quick report copying
const DialogManager = require('./dialogManager');
const ReportService = require('../services/reportService');
const DateUtils = require('../utils/dateUtils');

/**
 * Setup Copy menu next to "Mổ theo ngày"
 */
function setupCopyMenu(bottomBar) {
    const bottomBarLeft = bottomBar.querySelector('.dr-bottom-bar-left');
    if (!bottomBarLeft) return;

    const wrap = document.createElement('div');
    wrap.className = 'dr-copy-menu-wrap';
    wrap.style.position = 'relative';

    const copyBtn = document.createElement('button');
    copyBtn.id = 'dr-copy-menu-btn';
    copyBtn.className = 'dr-btn';
    copyBtn.style.cssText = `
        padding: 8px 14px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #ec4899, #a855f7);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: #fff;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(236, 72, 153, 0.25);
    `;
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy <i class="fas fa-chevron-up" style="font-size:10px; opacity:0.8;"></i>';
    
    wrap.appendChild(copyBtn);
    bottomBarLeft.appendChild(wrap);

    // Menu state
    let menuVisible = false;
    const menu = createMenuElement();
    wrap.appendChild(menu);

    // Hover logic for menu
    wrap.onmouseenter = () => {
        menuVisible = true;
        menu.style.display = 'block';
        copyBtn.style.transform = 'translateY(-1px)';
        copyBtn.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
        copyBtn.style.filter = 'brightness(1.05)';
    };
    wrap.onmouseleave = () => {
        menuVisible = false;
        menu.style.display = 'none';
        copyBtn.style.transform = 'translateY(0)';
        copyBtn.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.25)';
        copyBtn.style.filter = 'brightness(1)';
    };

    function createMenuElement() {
        const el = document.createElement('div');
        el.className = 'dr-copy-dropdown-menu';
        el.style.cssText = `
            position: absolute;
            bottom: calc(100% - 2px); /* CRITICAL FIX: Overlap slightly to avoid hover gap */
            left: 0;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            width: 250px;
            display: none;
            z-index: 100000;
            padding: 8px;
            /* margin-bottom removed to fix hover gap */
        `;

        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

        const formatDate = (d) => {
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

        const items = [
            { id: 'copy-all', text: 'Copy bệnh đang có ở khoa', subtitle: 'Toàn bộ danh sách hiện tại', type: 'all' },
            { id: 'copy-new-yesterday', text: 'Copy bệnh mới hôm qua', subtitle: formatDate(yesterday), type: 'new', date: yesterday },
            { id: 'copy-new-today', text: 'Copy bệnh mới hôm nay', subtitle: formatDate(today), type: 'new', date: today },
            { id: 'copy-pt-yesterday', text: 'Copy bệnh PT hôm qua', subtitle: formatDate(yesterday), type: 'pt', date: yesterday },
            { id: 'copy-pt-today', text: 'Copy bệnh PT hôm nay', subtitle: formatDate(today), type: 'pt', date: today },
            { id: 'copy-pt-tomorrow', text: 'Copy bệnh PT ngày mai', subtitle: formatDate(tomorrow), type: 'pt-special', date: tomorrow },
        ];

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'dr-copy-menu-item';
            row.style.cssText = `
                padding: 10px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 2px;
            `;
            row.innerHTML = `
                <div style="font-size: 0.95em; font-weight: 600; color: #334155;">${item.text}</div>
                <div style="font-size: 0.8em; color: #94a3b8; font-weight: 500;">${item.subtitle}</div>
            `;

            row.onmouseenter = () => {
                row.style.background = '#f1f5f9';
                row.querySelector('div:first-child').style.color = '#1976d2';
            };
            row.onmouseleave = () => {
                row.style.background = 'transparent';
                row.querySelector('div:first-child').style.color = '#334155';
            };

            row.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyAction(item);
                // Hide menu after click
                menuVisible = false;
                el.style.display = 'none';
            };

            el.appendChild(row);
        });

        return el;
    }

    async function handleCopyAction(item) {
        try {
            const data = window.dr_data || [];
            if (data.length === 0) {
                DialogManager.showToast('Không có dữ liệu bệnh nhân.', { background: '#d32f2f' });
                return;
            }

            DialogManager.showToast('Đang chuẩn bị dữ liệu...', { duration: 1000 });
            
            const { sortedPatients, states } = await ReportService.getBatchChecklistStates(data, { preferInMemory: true });

            let targetPatients = [];
            let targetStates = [];

            if (item.type === 'all') {
                targetPatients = sortedPatients;
                targetStates = states;
            } else if (item.type === 'new') {
                const targetMidnight = new Date(item.date); targetMidnight.setHours(0, 0, 0, 0);
                sortedPatients.forEach((p, idx) => {
                    const admitDate = parseAdmitDate(p.ngayvv);
                    if (admitDate && admitDate.getTime() === targetMidnight.getTime()) {
                        targetPatients.push(p);
                        targetStates.push(states[idx]);
                    }
                });
            } else if (item.type === 'pt' || item.type === 'pt-special') {
                const targetMidnight = new Date(item.date); targetMidnight.setHours(0, 0, 0, 0);
                sortedPatients.forEach((p, idx) => {
                    const s = states[idx];
                    if (s && Array.isArray(s.phauThuatLog)) {
                        const ptDateStr = s.phauThuatLog[0]?.date;
                        const ptDate = parseAdmitDate(ptDateStr);
                        if (ptDate && ptDate.getTime() === targetMidnight.getTime()) {
                            targetPatients.push(p);
                            targetStates.push(s);
                        }
                    }
                });
            }

            if (targetPatients.length === 0) {
                DialogManager.showToast(`Không có bệnh nhân cho tiêu chí: ${item.text}`, { background: '#ff9800' });
                return;
            }

            // AUTO-UPDATE HXT: If surgery exists but HXT is empty, set to "Ổn định nội khoa"
            const ApiService = require('../services/apiService');
            for (let i = 0; i < targetPatients.length; i++) {
                const p = targetPatients[i];
                const s = targetStates[i];
                if (s && Array.isArray(s.phauThuatLog) && s.phauThuatLog.length > 0) {
                    const currentHxt = (s.huongXuTri || '').trim();
                    if (!currentHxt) {
                        const newHxt = 'Ổn định nội khoa';
                        console.log(`Auto-updating HXT for ${p.mabn} (${p.hoten}) to: ${newHxt}`);
                        s.huongXuTri = newHxt;
                        
                        // Persist to server if possible
                        try {
                            const res = await ChecklistService.loadChecklistData(p);
                            const obj = ChecklistService.findChecklistObject(res);
                            if (obj) {
                                await ChecklistService.updateChecklistState(obj, { ...s, huongXuTri: newHxt });
                                // Synchronize to global window.dr_data if it's there
                                if (window.dr_data) {
                                    const globalP = window.dr_data.find(gp => gp.mabn === p.mabn);
                                    if (globalP && globalP.checklistState) globalP.checklistState.huongXuTri = newHxt;
                                }
                            }
                        } catch (persistErr) {
                            console.warn(`Failed to persist auto-HXT for ${p.mabn}`, persistErr);
                        }
                    }
                }
            }

            let resultHtml, resultText;
            if (item.type === 'pt-special') {
                const res = ReportService.generateSurgerySpecialReport(targetPatients, targetStates);
                resultHtml = res.html;
                resultText = res.text;
            } else {
                resultHtml = ReportService.generateHTMLReport(targetPatients, targetStates);
                resultText = ReportService.generateTextReport(targetPatients, targetStates);
            }

            const { copyReportToClipboardRich } = require('../pages/page.dashboard.support');
            await copyReportToClipboardRich(resultHtml, resultText);

        } catch (err) {
            console.error('Copy action failed:', err);
            DialogManager.showToast('Lỗi khi chuẩn bị báo cáo.', { background: '#d32f2f' });
        }
    }

    function parseAdmitDate(dateStr) {
        if (!dateStr) return null;
        try {
            // Support dd/mm/yyyy and yyyy-mm-dd
            let usFormat = dateStr;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    usFormat = `${parts[1]}/${parts[0]}/${parts[2]}`;
                }
            }
            const d = new Date(usFormat);
            if (isNaN(d.getTime())) return null;
            d.setHours(0, 0, 0, 0);
            return d;
        } catch (_) { return null; }
    }
}

module.exports = { setupCopyMenu };
