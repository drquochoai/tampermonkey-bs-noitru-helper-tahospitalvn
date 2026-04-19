// copyMenu.js - Dropdown menu for quick report copying
const DialogManager = require('./dialogManager');
const ReportService = require('../services/reportService');
const DateUtils = require('../utils/dateUtils');
const ChecklistService = require('../services/checklistService');

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
                const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
                const isTodayTarget = targetMidnight.getTime() === todayMidnight.getTime();
                const currentKhoaName = getCurrentKhoaName();

                const localNewAtDeptPatients = [];
                const localNewAtDeptStates = [];
                const localReceivedPatients = [];
                const localReceivedStates = [];

                sortedPatients.forEach((p, idx) => {
                    const classification = isTodayTarget
                        ? classifyNewPatientTodayFlow(p, targetMidnight, currentKhoaName)
                        : classifyNewPatientYesterdayFlow(p, targetMidnight);
                    if (!classification) return;

                    if (classification.group === 'receivedFromOtherDept') {
                        localReceivedPatients.push(p);
                        localReceivedStates.push(states[idx]);
                    } else {
                        localNewAtDeptPatients.push(p);
                        localNewAtDeptStates.push(states[idx]);
                    }

                    targetPatients.push(p);
                    targetStates.push(states[idx]);
                });

                newAtDeptPatients = localNewAtDeptPatients;
                newAtDeptStates = localNewAtDeptStates;
                receivedFromOtherDeptPatients = localReceivedPatients;
                receivedFromOtherDeptStates = localReceivedStates;
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
            } else if (item.type === 'new') {
                const groupedReport = buildGroupedNewPatientReport({
                    title: `BỆNH MỚI ${item.subtitle || ''}`.trim(),
                    newAtDeptPatients,
                    newAtDeptStates,
                    receivedFromOtherDeptPatients,
                    receivedFromOtherDeptStates
                });
                resultHtml = groupedReport.html;
                resultText = groupedReport.text;
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

    let newAtDeptPatients = [];
    let newAtDeptStates = [];
    let receivedFromOtherDeptPatients = [];
    let receivedFromOtherDeptStates = [];

    function parseAdmitDate(dateStr) {
        if (!dateStr) return null;
        try {
            const usFormat = DateUtils.convertToUSFormat(String(dateStr));
            const d = new Date(usFormat);
            if (isNaN(d.getTime())) return null;
            d.setHours(0, 0, 0, 0);
            return d;
        } catch (_) { return null; }
    }

    function normalizeDeptName(name) {
        return String(name || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    }

    function getCurrentKhoaName() {
        try {
            const khoaSelect = document.getElementById('ddlKhoa');
            if (!khoaSelect) return '';
            const selected = khoaSelect.options && khoaSelect.selectedIndex >= 0
                ? khoaSelect.options[khoaSelect.selectedIndex]
                : null;
            return (selected && selected.textContent ? selected.textContent : '').trim();
        } catch (_) {
            return '';
        }
    }

    function classifyNewPatientTodayFlow(patient, targetMidnight, currentKhoaName) {
        if (!patient || !targetMidnight) return null;

        const ngayVaoKhoa = parseAdmitDate(patient.ngayvk);
        if (!ngayVaoKhoa || ngayVaoKhoa.getTime() !== targetMidnight.getTime()) {
            return null;
        }

        const normalizedCurrentKhoa = normalizeDeptName(currentKhoaName);
        const normalizedTenKpvv = normalizeDeptName(patient.tenkpvv);
        const normalizedTenKhoaChuyen = normalizeDeptName(patient.tenkhoachuyen);
        const normalizedGmhs = normalizeDeptName('KHOA GÂY MÊ - HỒI SỨC');

        const receivedFromOtherDept = Boolean(
            normalizedCurrentKhoa &&
            normalizedTenKpvv &&
            normalizedCurrentKhoa !== normalizedTenKpvv
        );

        if (!receivedFromOtherDept && normalizedTenKhoaChuyen === normalizedGmhs) {
            const ngayVaoVien = parseAdmitDate(patient.ngayvv);
            if (!ngayVaoVien || ngayVaoVien.getTime() !== targetMidnight.getTime()) {
                return null;
            }
        }

        return {
            group: receivedFromOtherDept ? 'receivedFromOtherDept' : 'newAtCurrentDept'
        };
    }

    function classifyNewPatientYesterdayFlow(patient, targetMidnight) {
        if (!patient || !targetMidnight) return null;
        const ngayVaoVien = parseAdmitDate(patient.ngayvv);
        if (!ngayVaoVien || ngayVaoVien.getTime() !== targetMidnight.getTime()) {
            return null;
        }
        return {
            group: 'newAtCurrentDept'
        };
    }

    function formatGroupedTextSection(patients, states) {
        let text = '';
        patients.forEach((patient, idx) => {
            const data = ReportService.formatPatientData(patient, idx, states[idx] || {});
            const locationText = data.room ? `${data.room} ${data.bed}`.trim() : data.bed;
            text += `${data.index}. ${locationText} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
            text += `   Chẩn đoán: ${data.diagnosis}\n`;
            if (data.ppptDisplay) text += `   PPPT: ${data.ppptDisplay}\n`;
            if (data.ngayPtDisplay) text += `   Ngày PT: ${data.ngayPtDisplay}\n`;
            if (data.hxt) text += `   HXT: ${data.hxt}\n`;
        });
        return text;
    }

    function buildGroupedNewPatientReport({
        title,
        newAtDeptPatients,
        newAtDeptStates,
        receivedFromOtherDeptPatients,
        receivedFromOtherDeptStates
    }) {
        const total = (newAtDeptPatients.length + receivedFromOtherDeptPatients.length);

        let html = `<div style='margin:0 0 10px 0;'><h2 style='font-size:1.25em; margin:0; color:#0f172a;'>${title}</h2><div style='color:#334155;'>Tổng số bệnh nhân mới: <b>${total}</b></div></div>`;
        let text = `${title}\nTổng số bệnh nhân mới: ${total}\n\n`;

        html += `<div style='margin:0 0 6px 0; font-weight:700; color:#14532d;'>Bệnh mới của khoa (${newAtDeptPatients.length})</div>`;
        html += ReportService.generateHTMLReport(newAtDeptPatients, newAtDeptStates);
        text += `Bệnh mới của khoa (${newAtDeptPatients.length})\n`;
        text += formatGroupedTextSection(newAtDeptPatients, newAtDeptStates);
        text += `\n`;

        html += `<div style='margin:8px 0 6px 0; font-weight:700; color:#9a3412;'>Nhận từ khoa khác (${receivedFromOtherDeptPatients.length})</div>`;
        html += ReportService.generateHTMLReport(receivedFromOtherDeptPatients, receivedFromOtherDeptStates);
        text += `Nhận từ khoa khác (${receivedFromOtherDeptPatients.length})\n`;
        text += formatGroupedTextSection(receivedFromOtherDeptPatients, receivedFromOtherDeptStates);

        return { html, text };
    }
}

module.exports = { setupCopyMenu };
