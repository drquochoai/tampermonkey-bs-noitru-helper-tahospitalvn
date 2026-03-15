// contextMenu.js
const { copyToClipboard } = require('../utils/uiUtils');

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
            <div class="dr-context-menu-item" id="ctx-tdt">
                <span>📄</span> Mở Tờ Điều Trị
            </div>
            <div class="dr-context-menu-item" id="ctx-hsba">
                <span>🏥</span> Mở HSBAv2
            </div>
        `;

        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        
        document.body.appendChild(menu);
        this.menu = menu;

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
                const { copyReportToClipboardRich } = require('../pages/page.dashboard.support');
                
                const res = await ChecklistService.loadChecklistData(patient);
                const obj = ChecklistService.findChecklistObject(res);
                const state = obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
                const html = ReportService.generateSingleHTML(patient, state);
                const text = ReportService.generateSingleText(patient, state);
                await copyReportToClipboardRich(html, text);
            } catch (err) {
                console.error('Copy single-patient report failed:', err);
                showToastFallback('Lỗi khi copy báo cáo bệnh nhân');
            }
        };

        menu.querySelector('#ctx-tdt').onclick = (evt) => {
            evt.stopPropagation();
            if (patient.mabn) {
                window.open(`/to-dieu-tri?mabn=${encodeURIComponent(patient.mabn)}`, '_blank');
            }
        };

        menu.querySelector('#ctx-hsba').onclick = (evt) => {
            evt.stopPropagation();
            if (patient.mabn) {
                try {
                    const { openHSBAV2Link } = require('./actionButtons');
                    openHSBAV2Link(patient.mabn);
                } catch(e) { 
                    window.open(`/hoso/${encodeURIComponent(String(patient.mabn))}`, '_blank');
                }
            }
        };
    }
    
    attachToCard(card, patient) {
        card.addEventListener('contextmenu', (e) => {
            this.show(e, patient);
        });
    }
}

const contextMenu = new ContextMenu();
module.exports = contextMenu;
