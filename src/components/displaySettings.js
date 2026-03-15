// displaySettings.js

class DisplaySettings {
    constructor() {
        this.STORAGE_KEY = 'dr_display_settings';
        this.defaults = {
            showHXT: true,
            showPPPT: true,
            showSurgeon: true,
            autoCopyPID: true
        };
        this.settings = { ...this.defaults, ...this.load() };
        this.applyToBody();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Lỗi load settings:', e);
            return {};
        }
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
            this.applyToBody();
        } catch (e) {
            console.error('Lỗi save settings:', e);
        }
    }

    get(key) {
        return this.settings[key] !== undefined ? this.settings[key] : this.defaults[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    applyToBody() {
        if (!this.settings.showHXT) document.body.classList.add('dr-hide-hxt');
        else document.body.classList.remove('dr-hide-hxt');

        if (!this.settings.showPPPT) document.body.classList.add('dr-hide-pppt');
        else document.body.classList.remove('dr-hide-pppt');

        if (!this.settings.showSurgeon) document.body.classList.add('dr-hide-surgeon');
        else document.body.classList.remove('dr-hide-surgeon');
    }

    createIcon(container) {
        const rightBar = container.querySelector('.dr-topbar-right');
        if (!rightBar) return;
        
        const btn = document.createElement('button');
        btn.innerHTML = '⚙️ Cài đặt';
        btn.style.cssText = 'background:none; border:1px solid #ddd; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:13px; display:flex; align-items:center; gap:4px;';
        btn.title = "Cài đặt hiển thị";
        
        btn.onclick = () => this.showModal();
        
        // Insert before the view dropdown if exists
        const viewDropdown = rightBar.querySelector('.dr-view-dropdown-container') || rightBar.querySelector('.dr-view-dropdown');
        if (viewDropdown) {
            rightBar.insertBefore(btn, viewDropdown);
        } else {
            rightBar.appendChild(btn);
        }
    }

    showModal() {
        const overlay = document.createElement('div');
        overlay.className = 'dr-settings-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'dr-settings-modal';
        
        modal.innerHTML = `
            <div class="dr-settings-header">
                <h3>Cài đặt hiển thị & tính năng</h3>
                <button class="dr-settings-close">×</button>
            </div>
            <div class="dr-settings-body">
                <div class="dr-settings-row">
                    <span class="dr-settings-label">Hiện thẻ Hướng xử trí (HXT)</span>
                    <label class="dr-switch">
                        <input type="checkbox" id="setting-hxt" ${this.settings.showHXT ? 'checked' : ''}>
                        <span class="dr-slider"></span>
                    </label>
                </div>
                <div class="dr-settings-row">
                    <span class="dr-settings-label">Hiện Phương pháp phẫu thuật</span>
                    <label class="dr-switch">
                        <input type="checkbox" id="setting-pppt" ${this.settings.showPPPT ? 'checked' : ''}>
                        <span class="dr-slider"></span>
                    </label>
                </div>
                <div class="dr-settings-row">
                    <span class="dr-settings-label">Hiện Bác sĩ thực hiện</span>
                    <label class="dr-switch">
                        <input type="checkbox" id="setting-surgeon" ${this.settings.showSurgeon ? 'checked' : ''}>
                        <span class="dr-slider"></span>
                    </label>
                </div>
                <div class="dr-settings-row">
                    <span class="dr-settings-label" title="Click vào mã bệnh nhân để copy nhanh">Tự động Copy PID khi click</span>
                    <label class="dr-switch">
                        <input type="checkbox" id="setting-autocopy" ${this.settings.autoCopyPID ? 'checked' : ''}>
                        <span class="dr-slider"></span>
                    </label>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.dr-settings-close');
        
        const close = () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        };
        
        closeBtn.onclick = close;
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
        
        // Handlers
        modal.querySelector('#setting-hxt').onchange = (e) => this.set('showHXT', e.target.checked);
        modal.querySelector('#setting-pppt').onchange = (e) => this.set('showPPPT', e.target.checked);
        modal.querySelector('#setting-surgeon').onchange = (e) => this.set('showSurgeon', e.target.checked);
        modal.querySelector('#setting-autocopy').onchange = (e) => this.set('autoCopyPID', e.target.checked);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
}

// Singleton instance
const displaySettings = new DisplaySettings();
module.exports = displaySettings;
