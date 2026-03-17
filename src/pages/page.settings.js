// settings.js - Render a settings page similar to dashboard, triggered by ?caidat

const SettingsService = require('../services/settingsService');
let mountOpenWorldTab;
try {
        ({ mountOpenWorldTab } = require('./page.settings-open-world'));
} catch (e) {
        try { ({ mountOpenWorldTab } = require('../settings-open-world')); }
        catch (e2) { console.warn('Open World settings module not found', e2); }
}

async function showSettingsIfNeeded() {
        // Support selecting tab via ?caidat or ?tab param, e.g., ?caidat=account or ?caidat, ?tab=discharge
        const u = new URL(window.location.href);
        const caidatParam = u.searchParams.get('caidat');
        const tabParam = u.searchParams.get('tab');
        const targetTab = (caidatParam && caidatParam !== 'true') ? caidatParam : (tabParam || 'discharge');
        if (!(/[?&](caidat)($|=|&)/.test(window.location.search))) return;

        // Set page title
        document.title = 'Cài đặt';

        // Reset page and mount a two-column layout with tabs
        document.body.innerHTML = '';

        const styles = document.createElement('style');
        styles.textContent = `
            .dr-st-wrap{display:flex; min-height:100vh; color:#111827; background:#fff; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
            .dr-st-left{width:260px; border-right:1px solid #e5e7eb; background:#fafafa}
            .dr-st-left h2{margin:16px; font-size:18px}
            .dr-st-menu{display:flex; flex-direction:column; gap:8px; padding:0 12px 16px}
            .dr-st-menu button{appearance:none; border:1px solid #e5e7eb; background:#fff; padding:10px 12px; border-radius:10px; text-align:left; cursor:pointer}
            .dr-st-menu button.active{border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15) inset}
            .dr-st-right{flex:1; min-width:0;}
            .dr-st-head{display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #e5e7eb}
            .dr-st-title{margin:0; font-size:18px}
            .dr-st-content{padding:16px 20px}
            .dr-st-row{display:flex; gap:8px; align-items:center; margin-bottom:8px}
            .dr-st-input{flex:1; padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px}
            .dr-st-btn{appearance:none; border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer}
            .dr-st-btn.primary{border-color:#2563eb; background:#2563eb; color:#fff}
            .dr-st-list{display:flex; flex-direction:column; gap:8px; margin:12px 0}
            .dr-st-tab{display:none}
            .dr-st-tab.active{display:block}
            .dr-st-footer{padding:12px 20px; color:#6b7280; border-top:1px solid #e5e7eb}
        `;
        document.head.appendChild(styles);

        const wrap = document.createElement('div');
        wrap.className = 'dr-st-wrap';

        // Left menu
        const left = document.createElement('aside');
        left.className = 'dr-st-left';
        left.innerHTML = `
            <h2>Cài đặt</h2>
                        <div class="dr-st-menu">
                <button data-tab="discharge" class="${targetTab==='discharge'?'active':''}">Lời dặn dò ra viện</button>
                <button data-tab="account" class="${targetTab==='account'?'active':''}">Account</button>
                                <button data-tab="account-cloud" class="${targetTab==='account-cloud'?'active':''}">Account Cloud</button>
                                <button data-tab="openworld" class="${targetTab==='openworld'?'active':''}">Thông tin khoa/phòng</button>
                                <button data-tab="otm-surgeons" class="${targetTab==='otm-surgeons'?'active':''}">Quản lý phẫu thuật</button>
            </div>
            <div class="dr-st-footer" id="dr-st-doctor"></div>
        `;

        // Right content with header and tabs
        const right = document.createElement('section');
        right.className = 'dr-st-right';
                right.innerHTML = `
            <div class="dr-st-head">
                                                <h3 class="dr-st-title">${targetTab==='account'?'Account':(targetTab==='account-cloud'?'Account Cloud':(targetTab==='openworld'?'Thông tin khoa/phòng':(targetTab==='otm-surgeons'?'Quản lý phẫu thuật':'Lời dặn dò ra viện')))}</h3>
                <div id="dr-auto-save-status" style="font-size:12px; color:#6b7280; font-weight:600;"></div>
            </div>
            <div class="dr-st-content">
                        <div id="tab-discharge" class="dr-st-tab ${targetTab==='discharge'?'active':''}">
                    <p style="margin:0 0 8px; color:#6b7280">Danh sách các lời dặn dò ra viện. Bạn có thể thêm/xóa và chỉnh sửa.</p>
                    <div id="discharge-list" class="dr-st-list"></div>
                    <button id="add-discharge" class="dr-st-btn">+ Thêm mục</button>
                </div>
                                        <div id="tab-account" class="dr-st-tab ${targetTab==='account'?'active':''}">
                                                <div style="margin-bottom:12px; padding:10px; border:1px solid #fde68a; background:#fffbeb; border-radius:8px; color:#92400e">
                                                <b>Lưu ý bảo mật:</b> Thông tin dưới đây chỉ lưu trên thiết bị (LocalStorage của trình duyệt), không gửi lên máy chủ. Hãy sử dụng trên máy tính cá nhân tin cậy. Nếu dùng máy công cộng, KHÔNG nhập mật khẩu ở đây.
                                        </div>
                                                <div id="dr-acc-toggle-wrap" style="margin:8px 0 16px;"></div>
                                                <div style="margin-top:8px; color:#6b7280; font-size:13px; line-height:1.5;">
                                                Khi bật "tự động login", lúc vào trang <code>/Home/Login</code> tiện ích sẽ tự điền Tên đăng nhập và Mật khẩu rồi nhấn Đăng nhập, sau đó chờ 1.5 giây và mở <code>/?nln</code>. Tắt tùy chọn này nếu bạn không muốn tự động đăng nhập.
                                        </div>
                                                                                                <div id="dr-acc-grid" style="display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; margin-top:12px;"></div>
                                </div>
                                <div id="tab-account-cloud" class="dr-st-tab ${targetTab==='account-cloud'?'active':''}">
                                                <div style="margin-bottom:12px; padding:10px; border:1px solid #bfdbfe; background:#eff6ff; border-radius:8px; color:#1e3a8a">
                                                <b>Cloud theo bác sĩ hiện tại:</b> Danh sách account dưới đây được mã hóa rồi lưu vào API cài đặt (<code>settingsService</code>) theo bác sĩ đang đăng nhập. Dropdown Authors ở dashboard sẽ đọc trực tiếp từ danh sách này, không dùng LocalStorage.
                                        </div>
                                                <div style="margin-top:8px; color:#475569; font-size:13px; line-height:1.5;">
                                                Sau khi chỉnh sửa danh sách, bấm <b>Lưu</b> ở góc phải để cập nhật lên cloud.
                                        </div>
                                                                                                <div id="dr-cloud-acc-grid" style="display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; margin-top:12px;"></div>
                                </div>
                                                                <div id="tab-openworld" class="dr-st-tab ${targetTab==='openworld'?'active':''}">
                                                                        <div id="dr-openworld-container"></div>
                                                                </div>
                                                                <div id="tab-otm-surgeons" class="dr-st-tab ${targetTab==='otm-surgeons'?'active':''}">
                                                                        <div id="dr-otm-surgeons-container"></div>
            </div>
        `;

        wrap.appendChild(left);
        wrap.appendChild(right);
        document.body.appendChild(wrap);

        // Load settings state
        let { doctorName, chungThuSo, checklistObj, settings } = await SettingsService.getOrCreateSettings();
        const titleEl = right.querySelector('.dr-st-title');
        const listEl = right.querySelector('#discharge-list');
        const doctorEl = left.querySelector('#dr-st-doctor');
        if (doctorEl) {
            doctorEl.style.cssText = 'padding:12px; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;';
            doctorEl.innerHTML = `
                <div style="font-weight:600; color:#374151;">${doctorName || '(không xác định)'}</div>
                <div style="font-size:11px; margin-top:2px;">CTS: ${chungThuSo || 'N/A'}</div>
            `;
        }

                                // Account tab: localStorage manager (kept for local login compatibility)
                const ls = window.localStorage;
                const ACC_KEY = 'dr_accounts_json';
                const DEF_KEY = 'dr_acc_default';
                const AUTO_KEY = 'dr_acc_autologin';
                                let cloudAccounts = [];

                function readAccounts() {
                                        try {
                                                const parsed = JSON.parse(ls.getItem(ACC_KEY) || '[]');
                                                return Array.isArray(parsed) ? parsed : [];
                                        } catch (_) {
                                                return [];
                                        }
                }
                function writeAccounts(arr) { 
                                        ls.setItem(ACC_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
                }
                function readDefault() { return ls.getItem(DEF_KEY) || ''; }
                function writeDefault(u) { ls.setItem(DEF_KEY, u || ''); }
                                function readCloudAccounts() {
                                        return Array.isArray(cloudAccounts) ? cloudAccounts : [];
                                }
                                function writeCloudAccounts(arr) {
                                        cloudAccounts = Array.isArray(arr) ? arr : [];
                                }

                const grid = right.querySelector('#dr-acc-grid');
                                const cloudGrid = right.querySelector('#dr-cloud-acc-grid');

                                async function reloadCloudAccountsFromSettings() {
                                        cloudAccounts = await SettingsService.getCloudAccounts(settings, { doctorName, chungThuSo });
                                }

                async function performQuickLogin(acc) {
                    if (!acc || !acc.username || !acc.password) {
                        alert('Thông tin tài khoản không hợp lệ');
                        return;
                    }
                    if (typeof GM_openInTab !== 'function') {
                        alert('Tiện ích cần quyền GM_openInTab để thực hiện tính năng này.');
                        return;
                    }

                    // Save credentials to GM storage for the new tab to pick up
                    const loginKey = `dr_quick_login_${acc.username}`;
                    await GM.setValue(loginKey, JSON.stringify({
                        username: acc.username,
                        password: acc.password,
                        ts: Date.now()
                    }));

                    // Open incognito tab to login page
                    GM_openInTab(window.location.origin + '/Home/Login?quicklogin=' + encodeURIComponent(acc.username), {
                        active: true,
                        insert: true,
                        incognito: true
                    });
                }

                function renderGrid() {
                        if (!grid) return;
                        grid.innerHTML = '';
                        const accounts = readAccounts();
                        let def = readDefault();
                        // If only one account, auto set as default
                        if (accounts.length === 1) {
                            const only = accounts[0];
                            if (only && only.username && def !== only.username) {
                                writeDefault(only.username);
                                def = only.username;
                            }
                        }
                        accounts.forEach((acc, idx) => {
                                const box = document.createElement('div');
                                box.style.cssText = 'border:1px solid #e5e7eb; border-radius:12px; padding:12px; position:relative; background:#fff; transition:all 0.2s;';
                                box.onmouseover = () => box.style.borderColor = '#2563eb';
                                box.onmouseout = () => box.style.borderColor = '#e5e7eb';
                                
                                const radioId = `dr-acc-default-${idx}`;
                                box.innerHTML = `
                                        <button class="dr-acc-remove" title="Xóa" style="position:absolute; right:8px; top:8px; background:#fee2e2; color:#dc2626; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px;">Xóa</button>
                                        <div class="dr-st-row" style="margin-top:10px;">
                                                <label style="width:100px; font-size:13px; color:#6b7280;">Bí danh</label>
                                                <input class="dr-st-input dr-acc-title" type="text" value="${(acc.title||'').replace(/"/g,'&quot;')}" placeholder="VD: Khoa Ngoại" />
                                        </div>
                                        <div class="dr-st-row">
                                                <label style="width:100px; font-size:13px; color:#6b7280;">User</label>
                                                <input class="dr-st-input dr-acc-username" type="text" value="${(acc.username||'').replace(/"/g,'&quot;')}" placeholder="Tên đăng nhập" />
                                        </div>
                                        <div class="dr-st-row">
                                                <label style="width:100px; font-size:13px; color:#6b7280;">Pass</label>
                                                <input class="dr-st-input dr-acc-password" type="password" value="${(acc.password||'').replace(/"/g,'&quot;')}" placeholder="Mật khẩu" />
                                        </div>
                                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:12px; border-top:1px solid #f3f4f6;">
                                            <label style="display:flex; align-items:center; cursor:pointer; font-size:13px;">
                                                <input id="${radioId}" type="radio" name="dr-acc-default" class="dr-acc-default" ${def && def===acc.username ? 'checked' : ''} style="margin-right:6px;" /> Mặc định
                                            </label>
                                            <button class="dr-acc-login-btn" style="background:#2563eb; color:#fff; border:none; border-radius:6px; padding:5px 12px; font-size:12px; font-weight:600; cursor:pointer;">1-Click Login 🕵️</button>
                                        </div>
                                `;
                                
                                box.querySelector('.dr-acc-remove').addEventListener('click', () => {
                                        if (confirm('Xóa tài khoản này?')) {
                                                const arr = readAccounts();
                                                arr.splice(idx,1);
                                                writeAccounts(arr);
                                                if (def === acc.username) writeDefault('');
                                                renderGrid();
                                        }
                                });
                                box.querySelector('.dr-acc-title').addEventListener('input', (e) => {
                                        const arr = readAccounts();
                                        if (arr[idx]) { arr[idx].title = e.target.value; writeAccounts(arr); }
                                });
                                box.querySelector('.dr-acc-username').addEventListener('input', (e) => {
                                        const arr = readAccounts();
                                        if (arr[idx]) {
                                                const oldU = arr[idx].username || '';
                                                arr[idx].username = e.target.value; writeAccounts(arr);
                                                const curDef = readDefault();
                                                if (curDef === oldU) writeDefault(e.target.value || '');
                                        }
                                });
                                box.querySelector('.dr-acc-password').addEventListener('input', (e) => {
                                        const arr = readAccounts();
                                        if (arr[idx]) { arr[idx].password = e.target.value; writeAccounts(arr); }
                                });
                                box.querySelector('.dr-acc-login-btn').addEventListener('click', () => performQuickLogin(acc));
                                
                                box.querySelector('.dr-acc-default').addEventListener('change', (e) => {
                                        if (e.target.checked) writeDefault(acc.username || '');
                                });
                                grid.appendChild(box);
                        });
                        // Add box
                        const addBox = document.createElement('div');
                        addBox.style.cssText = 'border:2px dashed #cbd5e1; border-radius:12px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; color:#6b7280; background:#f9fafb; min-height:160px; transition:all 0.2s;';
                        addBox.onmouseover = () => { addBox.style.borderColor = '#2563eb'; addBox.style.color = '#2563eb'; };
                        addBox.onmouseout = () => { addBox.style.borderColor = '#cbd5e1'; addBox.style.color = '#6b7280'; };
                        addBox.innerHTML = '<div style="font-size:32px; margin-bottom:4px;">+</div><div style="font-size:14px; font-weight:600;">Thêm tài khoản</div>';
                        addBox.addEventListener('click', () => {
                                const arr = readAccounts();
                                arr.push({ title:'', username:'', password:'' });
                                writeAccounts(arr);
                                renderGrid();
                        });
                        grid.appendChild(addBox);
                }

                function renderCloudGrid() {
                        if (!cloudGrid) return;
                        cloudGrid.innerHTML = '';
                        const accounts = readCloudAccounts();
                        accounts.forEach((acc, idx) => {
                                const box = document.createElement('div');
                                box.style.cssText = 'border:1px solid #e5e7eb; border-radius:12px; padding:12px; position:relative; background:#fff; transition:all 0.2s;';
                                box.onmouseover = () => box.style.borderColor = '#2563eb';
                                box.onmouseout = () => box.style.borderColor = '#e5e7eb';

                                box.innerHTML = `
                                        <button class="dr-cloud-acc-remove" title="Xóa" style="position:absolute; right:8px; top:8px; background:#fee2e2; color:#dc2626; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px;">Xóa</button>
                                        <div class="dr-st-row" style="margin-top:10px;">
                                                <label style="width:100px; font-size:13px; color:#6b7280;">Bí danh</label>
                                                <input class="dr-st-input dr-cloud-acc-title" type="text" value="${(acc.title||'').replace(/"/g,'&quot;')}" placeholder="VD: Trực Ngoại" />
                                        </div>
                                        <div class="dr-st-row">
                                                <label style="width:100px; font-size:13px; color:#6b7280;">User</label>
                                                <input class="dr-st-input dr-cloud-acc-username" type="text" value="${(acc.username||'').replace(/"/g,'&quot;')}" placeholder="Tên đăng nhập" />
                                        </div>
                                        <div class="dr-st-row">
                                                <label style="width:100px; font-size:13px; color:#6b7280;">Pass</label>
                                                <input class="dr-st-input dr-cloud-acc-password" type="password" value="${(acc.password||'').replace(/"/g,'&quot;')}" placeholder="Mật khẩu" />
                                        </div>
                                        <div style="display:flex; align-items:center; justify-content:flex-end; margin-top:12px; padding-top:12px; border-top:1px solid #f3f4f6;">
                                            <button class="dr-cloud-acc-login-btn" style="background:#2563eb; color:#fff; border:none; border-radius:6px; padding:5px 12px; font-size:12px; font-weight:600; cursor:pointer;">1-Click Login 🕵️</button>
                                        </div>
                                `;

                                box.querySelector('.dr-cloud-acc-remove').addEventListener('click', () => {
                                        if (confirm('Xóa tài khoản cloud này?')) {
                                                const arr = readCloudAccounts();
                                                arr.splice(idx, 1);
                                                writeCloudAccounts(arr);
                                                renderCloudGrid();
                                        }
                                });
                                box.querySelector('.dr-cloud-acc-title').addEventListener('input', (e) => {
                                        const arr = readCloudAccounts();
                                        if (arr[idx]) {
                                                arr[idx].title = e.target.value;
                                                writeCloudAccounts(arr);
                                        }
                                });
                                box.querySelector('.dr-cloud-acc-username').addEventListener('input', (e) => {
                                        const arr = readCloudAccounts();
                                        if (arr[idx]) {
                                                arr[idx].username = e.target.value;
                                                writeCloudAccounts(arr);
                                        }
                                });
                                box.querySelector('.dr-cloud-acc-password').addEventListener('input', (e) => {
                                        const arr = readCloudAccounts();
                                        if (arr[idx]) {
                                                arr[idx].password = e.target.value;
                                                writeCloudAccounts(arr);
                                        }
                                });
                                box.querySelector('.dr-cloud-acc-login-btn').addEventListener('click', () => {
                                        const arr = readCloudAccounts();
                                        performQuickLogin(arr[idx]);
                                });

                                cloudGrid.appendChild(box);
                        });

                        const addBox = document.createElement('div');
                        addBox.style.cssText = 'border:2px dashed #cbd5e1; border-radius:12px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; color:#6b7280; background:#f9fafb; min-height:160px; transition:all 0.2s;';
                        addBox.onmouseover = () => { addBox.style.borderColor = '#2563eb'; addBox.style.color = '#2563eb'; };
                        addBox.onmouseout = () => { addBox.style.borderColor = '#cbd5e1'; addBox.style.color = '#6b7280'; };
                        addBox.innerHTML = '<div style="font-size:32px; margin-bottom:4px;">+</div><div style="font-size:14px; font-weight:600;">Thêm account cloud</div>';
                        addBox.addEventListener('click', () => {
                                const arr = readCloudAccounts();
                                arr.push({ title:'', username:'', password:'' });
                                writeCloudAccounts(arr);
                                renderCloudGrid();
                        });
                        cloudGrid.appendChild(addBox);
                }
                renderGrid();
                await reloadCloudAccountsFromSettings();
                renderCloudGrid();

                // Top-level auto-login toggle (shared component)
                try {
                        const { createAutoLoginToggle, applyToggleStyles } = require('../components/autoLoginToggle');
                        const wrap = right.querySelector('#dr-acc-toggle-wrap');
                        if (wrap) {
                                const enabled = ls.getItem(AUTO_KEY) === '1';
                                const toggle = createAutoLoginToggle({
                                        enabled,
                                        onToggle: () => {
                                                const cur = ls.getItem(AUTO_KEY) === '1';
                                                ls.setItem(AUTO_KEY, cur ? '0' : '1');
                                                applyToggleStyles(toggle, !cur);
                                        },
                                        onDblClick: () => {},
                                        title: 'Bật/tắt tự động login'
                                });
                                wrap.appendChild(toggle);
                        }
                } catch(_) {}

        const renderDischarge = (items) => {
                listEl.innerHTML = '';
                (items || []).forEach(text => {
                        const row = document.createElement('div');
                        row.className = 'dr-st-row';
                        row.innerHTML = `
                            <input class="dr-st-input" type="text" value="${(text || '').replace(/"/g,'&quot;')}" placeholder="Nhập lời dặn dò..." />
                            <button class="dr-st-btn remove-row" title="Xóa">Xóa</button>
                        `;
                        listEl.appendChild(row);
                });
        };

        renderDischarge(settings && settings.danDoRaVien ? settings.danDoRaVien : SettingsService.getDefaultSettings().danDoRaVien);

        // Auto-save function
        const { showToast } = require('../utils/uiUtils');
        let autoSaveTimeout;
        const statusEl = right.querySelector('#dr-auto-save-status');
        
        const performAutoSave = async () => {
                try {
                        statusEl.textContent = 'Đang lưu...';
                        statusEl.style.color = '#3b82f6';

                        const dischargeValues = Array.from(listEl.querySelectorAll('input')).map(i => i.value.trim()).filter(Boolean);
                        
                        // Sync dashboard settings from LS
                        const dashboardSettings = {};
                        const DASHBOARD_KEYS = [
                                                        'dr-card-view',
                            'dr-view-toggle-premium',
                                                        'dr-view-mode',
                                                        'dr-card-hover-preview',
                            'dr-filter-type',
                            'dr-filter-khoa',
                            'dr-tracking-pids'
                        ];
                        DASHBOARD_KEYS.forEach(k => {
                            const val = ls.getItem(k);
                            if (val !== null) dashboardSettings[k] = val;
                        });

                        const nextBase = {
                            ...(settings || {}), 
                            danDoRaVien: dischargeValues,
                            dashboard: dashboardSettings
                        };
                        
                        let next = await SettingsService.withCloudAccounts(nextBase, readCloudAccounts(), { doctorName, chungThuSo });
                        delete next.accounts;
                        delete next.accountsCloud;
                        
                        // Ensure checklist exists
                        if (!checklistObj && chungThuSo) {
                                const created = await SettingsService.createSettingsPhieu({ name: doctorName, chungThuSo });
                                if (created && created.isValid) {
                                        checklistObj = await SettingsService.loadSettingsPhieu(chungThuSo);
                                }
                        }
                        
                        if (!checklistObj) {
                                statusEl.textContent = 'Lỗi: Chưa có phiếu cài đặt';
                                statusEl.style.color = '#dc2626';
                                return;
                        }
                        
                        const ok = await SettingsService.updateSettingsState(checklistObj, next);
                        if (ok) {
                                settings = next;
                                statusEl.textContent = '✓ Đã lưu';
                                statusEl.style.color = '#16a34a';
                                showToast('✓ Cài đặt đã được lưu thành công!', 'success', 3000);
                        } else {
                                statusEl.textContent = '✗ Lưu thất bại';
                                statusEl.style.color = '#dc2626';
                                showToast('✗ Lưu cài đặt thất bại', 'error', 3000);
                        }
                } catch (e) {
                        console.error('Auto-save error:', e);
                        statusEl.textContent = '✗ Lỗi';
                        statusEl.style.color = '#dc2626';
                        showToast('✗ Lỗi khi lưu: ' + e.message, 'error', 3000);
                } finally {
                        setTimeout(() => {
                                if (statusEl) {
                                        statusEl.textContent = '';
                                        statusEl.style.color = '#6b7280';
                                }
                        }, 3500);
                }
        };

        const scheduleAutoSave = () => {
                clearTimeout(autoSaveTimeout);
                statusEl.textContent = 'Sẽ lưu...';
                statusEl.style.color = '#f59e0b';
                autoSaveTimeout = setTimeout(performAutoSave, 800);
        };

        // Listen for changes on discharge inputs
        listEl.addEventListener('input', scheduleAutoSave);

        // Left menu switching
                left.addEventListener('click', (e) => {
                                const btn = e.target.closest('button[data-tab]');
                if (!btn) return;
                left.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                                titleEl.textContent = tab === 'discharge' ? 'Lời dặn dò ra viện' : (tab === 'account' ? 'Account' : (tab === 'account-cloud' ? 'Account Cloud' : (tab === 'openworld' ? 'Thông tin khoa/phòng' : (tab === 'otm-surgeons' ? 'Quản lý phẫu thuật' : btn.textContent.trim()))));
                right.querySelectorAll('.dr-st-tab').forEach(t => t.classList.remove('active'));
                const target = right.querySelector(`#tab-${tab}`);
                if (target) target.classList.add('active');
                                // Update URL
                                try {
                                        const url = new URL(window.location.href);
                                        url.searchParams.set('caidat', tab);
                                        window.history.replaceState({}, '', url);
                                } catch(_) {}
                                // Mount Open World
                                if (tab === 'openworld') {
                                        const mountEl = right.querySelector('#dr-openworld-container');
                                        if (mountEl && !mountEl.dataset.mounted) {
                                                mountEl.dataset.mounted = '1';
                                                mountOpenWorldTab({ container: mountEl, doctorName, checklistObj, settings });
                                        }
                                } else if (tab === 'otm-surgeons') {
                                        try {
                                                const { mountOTMSurgeonsTab } = require('../pages/page.settings.otm.quanlyphauthuat');
                                                const mountEl = right.querySelector('#dr-otm-surgeons-container');
                                                if (mountEl && !mountEl.dataset.mounted) {
                                                        mountEl.dataset.mounted = '1';
                                                        mountOTMSurgeonsTab({ container: mountEl });
                                                }
                                        } catch (e) {
                                                console.warn('OTM Surgeons tab mount failed', e);
                                        }
                                }
        });

        // Right actions
        right.addEventListener('click', async (e) => {
                if (e.target.id === 'add-discharge') {
                        const row = document.createElement('div');
                        row.className = 'dr-st-row';
                        row.innerHTML = `
                            <input class="dr-st-input" type="text" placeholder="Nhập lời dặn dò..." />
                            <button class="dr-st-btn remove-row" title="Xóa">Xóa</button>
                        `;
                        listEl.appendChild(row);
                        row.querySelector('input').addEventListener('input', scheduleAutoSave);
                        return;
                }
                if (e.target.classList && e.target.classList.contains('remove-row')) {
                        e.target.closest('.dr-st-row')?.remove();
                        scheduleAutoSave();
                        return;
                }
        });

        // Auto-save for cloud accounts changes
        right.addEventListener('input', (e) => {
                if (e.target.classList && (e.target.classList.contains('dr-cloud-acc-title') || 
                                           e.target.classList.contains('dr-cloud-acc-username') ||
                                           e.target.classList.contains('dr-cloud-acc-password'))) {
                        scheduleAutoSave();
                }
        });

        // Account tab no longer uses single username/password fields; managed via grid.
                // Mount Open World if deep-linked initially
                try {
                        if (targetTab === 'openworld') {
                                const mountEl = right.querySelector('#dr-openworld-container');
                                if (mountEl) {
                                        mountEl.dataset.mounted = '1';
                                        mountOpenWorldTab({ container: mountEl, doctorName, checklistObj, settings });
                                }
                        } else if (targetTab === 'otm-surgeons') {
                                try {
                                        const { mountOTMSurgeonsTab } = require('../pages/page.settings.otm.quanlyphauthuat');
                                        const mountEl = right.querySelector('#dr-otm-surgeons-container');
                                        if (mountEl) {
                                                mountEl.dataset.mounted = '1';
                                                mountOTMSurgeonsTab({ container: mountEl });
                                        }
                                } catch (e) { console.warn('Init OTM Surgeons tab failed', e); }
                        }
                } catch(_) {}
}

module.exports = { showSettingsIfNeeded };
