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
        try {
            const { showSettingsDialog } = require('./settingsDialog');
            showSettingsDialog('display');
        } catch(e) {
            console.error('Lỗi mở settings dialog:', e);
        }
    }
}

// Singleton instance
const displaySettings = new DisplaySettings();
module.exports = displaySettings;
