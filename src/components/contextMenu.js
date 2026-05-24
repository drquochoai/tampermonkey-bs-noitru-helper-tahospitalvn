// contextMenu.js
const { copyToClipboard } = require('../utils/uiUtils');
const { copyReportToClipboardRich } = require('../pages/page.dashboard.support');
const { buildLichMoPtvCopy, buildGpbCatLanhCopy } = require('../utils/contextMenuCopyBuilders');

// Define global showToast if not pulled from uiUtils properly due to scoping
const showToastFallback = (msg) => {
    if (window.showToast) {
        window.showToast(msg);
    } else {
        alert(msg);
    }
};

class ContextMenu {
    constructor() {
        this.menu = null;
        document.addEventListener('click', () => this.hide());
        window.addEventListener('scroll', () => this.hide(), { passive: true });
        window.addEventListener('resize', () => this.hide(), { passive: true });
    }

    hide() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    }

    show(e, patient) {
        e.preventDefault();
        this.hide();

        const menu = document.createElement('div');
        menu.className = 'dr-context-menu';
        
        // Use actionButtons to perform actions directly
        menu.innerHTML = `
            <div class="dr-context-menu-item" id="ctx-copy">
                <span>📋</span> Copy báo cáo (1 BN)
            </div>
            <div class="dr-context-menu-item" id="ctx-copy-lichmo-ptv">
                <span>📋</span> Copy báo Lịch mổ (PTV)
            </div>
            <div class="dr-context-menu-item" id="ctx-copy-gpb-cat-lanh">
                <span>🧊</span> Copy GPB cắt lạnh
            </div>
            <div class="dr-context-menu-item" id="ctx-tdt">
                <span>📄</span> Mở Tờ Điều Trị
            </div>
            <div class="dr-context-menu-item" id="ctx-hsba">
                <span>🏥</span> Mở HSBAv2
            </div>
            ${patient.theodoi ? `
            <div class="dr-context-menu-item" id="ctx-remove-tracking" style="color:#d32f2f; border-top:1px solid #eee;">
                <span>❌</span> Xóa khỏi DS theo dõi
            </div>
            ` : ''}
        `;

        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        
        document.body.appendChild(menu);
        this.menu = menu;

        // No submenu for specialized copy; items are top-level entries now.

        // Try adjusting position if it goes out of bounds
        setTimeout(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = `${window.innerWidth - rect.width - 10}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = `${window.innerHeight - rect.height - 10}px`;
            }
        }, 0);

        menu.querySelector('#ctx-copy').onclick = async (evt) => {
            evt.stopPropagation();
            this.hide();
            try {
                const ChecklistService = require('../services/checklistService');
                const ReportService = require('../services/reportService');
                
                const res = await ChecklistService.loadChecklistData(patient);
                const obj = ChecklistService.findChecklistObject(res);
                const state = obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
                const html = ReportService.generateSingleHTML(patient, state);
                let text = ReportService.generateSingleText(patient, state);
                // Strip leading room/bed prefix from first line for single-patient text copies
                try {
                    const lines = String(text || '').split('\n');
                    if (lines.length > 0 && lines[0].includes(' - ')) {
                        const parts = lines[0].split(' - ');
                        const firstPart = (parts[0] || '').toLowerCase();
                        if (/phòng|giường|^\d+/.test(firstPart)) {
                            lines[0] = parts.slice(1).join(' - ');
                            text = lines.join('\n');
                        }
                    }
                } catch (_) {}
                await copyReportToClipboardRich(html, text);
            } catch (err) {
                console.error('Copy single-patient report failed:', err);
                showToastFallback('Lỗi khi copy báo cáo bệnh nhân');
            }
        };

        menu.querySelector('#ctx-copy-lichmo-ptv').onclick = async (evt) => {
            evt.stopPropagation();
            this.hide();
            try {
                const result = await buildLichMoPtvCopy(patient, { includeLocation: false });
                if (!result) {
                    showToastFallback('Không có dữ liệu phẫu thuật để copy');
                    return;
                }
                await copyReportToClipboardRich(result.html, result.text);
            } catch (err) {
                console.error('Copy Lịch mổ (PTV) failed:', err);
                showToastFallback('Lỗi khi copy báo Lịch mổ (PTV)');
            }
        };

        menu.querySelector('#ctx-copy-gpb-cat-lanh').onclick = async (evt) => {
            evt.stopPropagation();
            this.hide();
            try {
                const result = await buildGpbCatLanhCopy(patient, { includeLocation: false });
                if (!result) {
                    showToastFallback('Không có dữ liệu phẫu thuật để copy');
                    return;
                }
                await copyReportToClipboardRich(result.html, result.text);
            } catch (err) {
                console.error('Copy GPB cắt lạnh failed:', err);
                showToastFallback('Lỗi khi copy GPB cắt lạnh');
            }
        };

        menu.querySelector('#ctx-tdt').onclick = (evt) => {
            evt.stopPropagation();
            this.hide();
            if (patient.mabn) {
                window.open(`/to-dieu-tri?mabn=${encodeURIComponent(patient.mabn)}`, '_blank');
            }
        };

        menu.querySelector('#ctx-hsba').onclick = (evt) => {
            evt.stopPropagation();
            this.hide();
            if (patient.mabn) {
                try {
                    const { openHSBAV2Link } = require('./actionButtons');
                    openHSBAV2Link(patient.mabn);
                } catch(e) { 
                    window.open(`/hoso/${encodeURIComponent(String(patient.mabn))}`, '_blank');
                }
            }
        };
        
        if (patient.theodoi) {
            const rmItem = menu.querySelector('#ctx-remove-tracking');
            if (rmItem) {
                rmItem.onclick = async (evt) => {
                    evt.stopPropagation();
                    this.hide();
                    if (typeof window.dr_removeTrackedPatient === 'function') {
                        await window.dr_removeTrackedPatient(patient.mabn);
                    }
                };
            }
        }
    }
    
    attachToCard(card, patient) {
        card.addEventListener('contextmenu', (e) => {
            this.show(e, patient);
        });
    }
}

const contextMenu = new ContextMenu();
module.exports = contextMenu;
