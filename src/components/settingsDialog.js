// settingsDialog.js - Dialog component for settings (reusable, mirrors ?caidat page)
const DialogManager = require('./dialogManager');
const SettingsService = require('../services/settingsService');
const { showToast } = require('../utils/uiUtils');

let _dialogEl = null;

/**
 * Open the settings dialog.
 * @param {string} initialTab - One of: 'display', 'discharge', 'account', 'account-cloud'
 */
async function showSettingsDialog(initialTab = 'display') {
    // Toggle: close if already open
    if (_dialogEl && document.body.contains(_dialogEl)) {
        document.body.removeChild(_dialogEl);
        _dialogEl = null;
        return;
    }

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'dr-settings-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    _dialogEl = overlay;

    // Container
    const wrap = document.createElement('div');
    wrap.style.cssText = 'background:#fff;border-radius:16px;width:100%;max-width:960px;height:80vh;display:flex;overflow:hidden;box-shadow:0 20px 60px -10px rgba(0,0,0,0.3);position:relative;flex-direction:column;';

    // Header bar
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e5e7eb;flex-shrink:0;background:#fafafa;';
    header.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
            <i class="fas fa-sliders-h" style="color:#2563eb;font-size:1.1em;"></i>
            <span style="font-weight:700;font-size:1.05em;color:#111827;">Cài đặt</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
            <span id="dr-sd-save-status" style="font-size:12px;color:#6b7280;font-weight:600;"></span>
            <button id="dr-sd-close" style="appearance:none;border:none;background:#f1f5f9;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;color:#64748b;display:flex;align-items:center;justify-content:center;padding:0;">&times;</button>
        </div>
    `;

    // Body: sidebar + content
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.style.cssText = 'width:200px;border-right:1px solid #e5e7eb;background:#fafafa;padding:12px;flex-shrink:0;overflow-y:auto;';
    const tabs = [
        { id: 'display',       icon: 'fa-desktop',      label: 'Hiển thị' },
        { id: 'discharge',     icon: 'fa-file-medical',  label: 'Dặn dò ra viện' },
        { id: 'account',       icon: 'fa-user-lock',     label: 'Account' },
        { id: 'account-cloud', icon: 'fa-cloud',         label: 'Account Cloud' },
    ];
    sidebar.innerHTML = `
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;padding:4px 8px 8px;">Menu</div>
        ${tabs.map(t => `
            <button data-tab="${t.id}" class="dr-sd-tab-btn" style="
                display:flex;align-items:center;gap:8px;width:100%;padding:9px 10px;border-radius:8px;border:1px solid transparent;
                background:none;cursor:pointer;font-size:13px;text-align:left;color:#374151;margin-bottom:4px;transition:all 0.15s;
                ${initialTab === t.id ? 'background:#fff;border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12) inset;color:#2563eb;font-weight:600;' : ''}
            "><i class="fas ${t.icon}" style="width:16px;text-align:center;${initialTab === t.id ? 'color:#2563eb' : 'color:#94a3b8'};"></i>${t.label}</button>
        `).join('')}
    `;

    // Content area
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;overflow-y:auto;padding:20px;min-width:0;';

    // Tab panels
    content.innerHTML = `
        <!-- Display tab -->
        <div id="dr-sd-tab-display" class="dr-sd-tab-panel" style="display:${initialTab==='display'?'block':'none'}">
            <h3 style="margin:0 0 4px;font-size:1em;color:#111827;">Hiển thị & Tính năng</h3>
            <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Cài đặt những gì hiển thị trên thẻ bệnh nhân.</p>
            <div id="dr-sd-display-settings"></div>
        </div>

        <!-- Discharge tab -->
        <div id="dr-sd-tab-discharge" class="dr-sd-tab-panel" style="display:${initialTab==='discharge'?'block':'none'}">
            <h3 style="margin:0 0 4px;font-size:1em;color:#111827;">Lời dặn dò ra viện</h3>
            <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Danh sách lời dặn mặc định khi xuất viện. Lưu tự động.</p>
            <div id="dr-sd-discharge-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;"></div>
            <button id="dr-sd-add-discharge" style="appearance:none;border:1px dashed #94a3b8;background:none;padding:8px 14px;border-radius:8px;cursor:pointer;color:#64748b;font-size:13px;">+ Thêm mục</button>
        </div>

        <!-- Account tab -->
        <div id="dr-sd-tab-account" class="dr-sd-tab-panel" style="display:${initialTab==='account'?'block':'none'}">
            <h3 style="margin:0 0 4px;font-size:1em;color:#111827;">Account</h3>
            <div style="margin-bottom:12px;padding:10px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;color:#92400e;font-size:13px;">
                <b>Lưu ý:</b> Thông tin chỉ lưu trên thiết bị (localStorage). Không dùng trên máy công cộng.
            </div>
            <div id="dr-sd-acc-autologin-wrap" style="margin-bottom:16px;"></div>
            <div id="dr-sd-acc-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;"></div>
        </div>

        <!-- Account Cloud tab -->
        <div id="dr-sd-tab-account-cloud" class="dr-sd-tab-panel" style="display:${initialTab==='account-cloud'?'block':'none'}">
            <h3 style="margin:0 0 4px;font-size:1em;color:#111827;">Account Cloud</h3>
            <div style="margin-bottom:12px;padding:10px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:8px;color:#1e3a8a;font-size:13px;">
                <b>Cloud theo bác sĩ đăng nhập:</b> Danh sách được mã hóa và lưu vào API. Dashboard Authors đọc từ đây.
            </div>
            <div id="dr-sd-cloud-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;"></div>
        </div>
    `;

    body.appendChild(sidebar);
    body.appendChild(content);
    wrap.appendChild(header);
    wrap.appendChild(body);
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);

    // === Close logic ===
    const close = () => {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        _dialogEl = null;
    };
    overlay.querySelector('#dr-sd-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    });

    // === Tab switching ===
    sidebar.querySelectorAll('.dr-sd-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            sidebar.querySelectorAll('.dr-sd-tab-btn').forEach(b => {
                b.style.background = 'none';
                b.style.borderColor = 'transparent';
                b.style.boxShadow = 'none';
                b.style.color = '#374151';
                b.style.fontWeight = 'normal';
                const icon = b.querySelector('i');
                if (icon) icon.style.color = '#94a3b8';
            });
            btn.style.background = '#fff';
            btn.style.borderColor = '#2563eb';
            btn.style.boxShadow = '0 0 0 2px rgba(37,99,235,.12) inset';
            btn.style.color = '#2563eb';
            btn.style.fontWeight = '600';
            const icon = btn.querySelector('i');
            if (icon) icon.style.color = '#2563eb';

            content.querySelectorAll('.dr-sd-tab-panel').forEach(p => p.style.display = 'none');
            const panel = content.querySelector(`#dr-sd-tab-${tabId}`);
            if (panel) panel.style.display = 'block';
        });
    });

    // === Display settings ===
    try {
        const displaySettingsInstance = require('./displaySettings');
        const cardTooltip = require('./cardTooltip');
        const CARD_HOVER_TOOLTIP_KEY = cardTooltip.STORAGE_KEY || 'dr-card-hover-preview';
        const displayContainer = content.querySelector('#dr-sd-display-settings');
        if (displayContainer) {
            const items = [
                { key: 'showHXT',       label: 'Hiện thẻ Hướng xử trí (HXT)', icon: 'fa-map-signs' },
                { key: 'showPPPT',      label: 'Hiện Phương pháp phẫu thuật', icon: 'fa-procedures' },
                { key: 'showSurgeon',   label: 'Hiện Bác sĩ thực hiện',         icon: 'fa-user-md' },
                { key: 'autoCopyPID',   label: 'Tự động Copy PID khi click',     icon: 'fa-copy' },
            ];
            items.forEach(item => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;background:#fafafa;';
                const checked = displaySettingsInstance.get(item.key);
                row.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fas ${item.icon}" style="width:18px;text-align:center;color:#64748b;"></i>
                        <span style="font-size:14px;color:#374151;">${item.label}</span>
                    </div>
                    <label class="dr-switch" style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;" title="${item.label}">
                        <input type="checkbox" data-key="${item.key}" ${checked ? 'checked' : ''} style="opacity:0;width:0;height:0;position:absolute;">
                        <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${checked?'#2563eb':'#cbd5e1'};border-radius:24px;transition:.3s;">
                            <span style="position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:3px;left:${checked?'23px':'3px'};transition:.3s;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span>
                        </span>
                    </label>
                `;
                const input = row.querySelector('input[type="checkbox"]');
                const track = row.querySelector('span[style*="border-radius:24px"]');
                const thumb = track ? track.querySelector('span') : null;
                input.addEventListener('change', () => {
                    displaySettingsInstance.set(item.key, input.checked);
                    if (track) track.style.background = input.checked ? '#2563eb' : '#cbd5e1';
                    if (thumb) thumb.style.left = input.checked ? '23px' : '3px';
                });
                displayContainer.appendChild(row);
            });

            if (localStorage.getItem(CARD_HOVER_TOOLTIP_KEY) === null) {
                localStorage.setItem(CARD_HOVER_TOOLTIP_KEY, '1');
            }
            const hoverPreviewEnabled = localStorage.getItem(CARD_HOVER_TOOLTIP_KEY) !== '0';
            const cloudRow = document.createElement('div');
            cloudRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid #bfdbfe;border-radius:10px;margin-top:16px;background:#eff6ff;';
            cloudRow.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:10px;min-width:0;">
                    <i class="fas fa-up-right-and-down-left-from-center" style="width:18px;text-align:center;color:#2563eb;margin-top:1px;"></i>
                    <div>
                        <div style="font-size:14px;color:#1e3a8a;font-weight:600;display:flex;align-items:center;gap:8px;">
                            <span>Xem trước thẻ lớn khi hover</span>
                            <span style="display:inline-flex;align-items:center;padding:2px 6px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:700;">Cloud</span>
                        </div>
                        <div style="font-size:12px;color:#475569;margin-top:4px;line-height:1.45;">Di chuột vào .dr-card sẽ hiện popup lớn theo chuột. Cài đặt này được lưu vào API người dùng.</div>
                    </div>
                </div>
                <label class="dr-switch" style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0;" title="Xem trước thẻ lớn khi hover">
                    <input type="checkbox" id="dr-sd-card-hover-preview" ${hoverPreviewEnabled ? 'checked' : ''} style="opacity:0;width:0;height:0;position:absolute;">
                    <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${hoverPreviewEnabled ? '#2563eb' : '#cbd5e1'};border-radius:24px;transition:.3s;">
                        <span style="position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:3px;left:${hoverPreviewEnabled ? '23px' : '3px'};transition:.3s;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span>
                    </span>
                </label>
            `;
            const cloudInput = cloudRow.querySelector('#dr-sd-card-hover-preview');
            const cloudTrack = cloudRow.querySelector('span[style*="border-radius:24px"]');
            const cloudThumb = cloudTrack ? cloudTrack.querySelector('span') : null;
            cloudInput.addEventListener('change', () => {
                localStorage.setItem(CARD_HOVER_TOOLTIP_KEY, cloudInput.checked ? '1' : '0');
                if (cardTooltip && typeof cardTooltip.setEnabled === 'function') {
                    cardTooltip.setEnabled(cloudInput.checked);
                }
                if (cloudTrack) cloudTrack.style.background = cloudInput.checked ? '#2563eb' : '#cbd5e1';
                if (cloudThumb) cloudThumb.style.left = cloudInput.checked ? '23px' : '3px';
                scheduleAutoSave();
            });
            displayContainer.appendChild(cloudRow);
        }
    } catch(e) { console.warn('Display settings render error', e); }

    // === API-based tabs (discharge, account, account-cloud) ===
    const statusEl = header.querySelector('#dr-sd-save-status');
    let _settings = null, _checklistObj = null, _doctorName = '', _chungThuSo = '';
    let _cloudAccounts = [];
    const DASHBOARD_STORAGE_KEYS = [
        'dr-card-view',
        'dr-view-mode',
        'dr-card-hover-preview',
        'dr-filter-type',
        'dr-filter-khoa',
        'dr-tracking-pids'
    ];

    // Auto-save
    let _autoSaveTimeout;
    const scheduleAutoSave = () => {
        clearTimeout(_autoSaveTimeout);
        statusEl.textContent = 'Sẽ lưu...';
        statusEl.style.color = '#f59e0b';
        _autoSaveTimeout = setTimeout(doAutoSave, 800);
    };

    const doAutoSave = async () => {
        try {
            statusEl.textContent = 'Đang lưu...';
            statusEl.style.color = '#3b82f6';

            const dischargeList = content.querySelector('#dr-sd-discharge-list');
            const dischargeValues = dischargeList
                ? Array.from(dischargeList.querySelectorAll('input')).map(i => i.value.trim()).filter(Boolean)
                : (_settings && _settings.danDoRaVien ? _settings.danDoRaVien : []);

            const dashboardSettings = {};
            DASHBOARD_STORAGE_KEYS.forEach((key) => {
                const value = localStorage.getItem(key);
                if (value !== null) dashboardSettings[key] = value;
            });
            if (dashboardSettings['dr-view-mode'] && !dashboardSettings['dr-card-view']) {
                dashboardSettings['dr-card-view'] = dashboardSettings['dr-view-mode'];
            }

            const nextBase = {
                ...(_settings || {}),
                danDoRaVien: dischargeValues,
                dashboard: {
                    ...((_settings && _settings.dashboard) || {}),
                    ...dashboardSettings
                }
            };
            let next = await SettingsService.withCloudAccounts(nextBase, _cloudAccounts, { doctorName: _doctorName, chungThuSo: _chungThuSo });
            delete next.accounts;
            delete next.accountsCloud;

            if (!_checklistObj && _chungThuSo) {
                const created = await SettingsService.createSettingsPhieu({ name: _doctorName, chungThuSo: _chungThuSo });
                if (created && created.isValid) _checklistObj = await SettingsService.loadSettingsPhieu(_chungThuSo);
            }
            if (!_checklistObj) {
                statusEl.textContent = 'Lỗi: Chưa có phiếu';
                statusEl.style.color = '#dc2626';
                return;
            }
            const ok = await SettingsService.updateSettingsState(_checklistObj, next);
            if (ok) {
                _settings = next;
                statusEl.textContent = '✓ Đã lưu';
                statusEl.style.color = '#16a34a';
                showToast('✓ Cài đặt đã được lưu!', 'success', 2500);
            } else {
                statusEl.textContent = '✗ Lưu thất bại';
                statusEl.style.color = '#dc2626';
                showToast('✗ Lưu thất bại', 'error', 2500);
            }
        } catch(e) {
            statusEl.textContent = '✗ Lỗi';
            statusEl.style.color = '#dc2626';
        } finally {
            setTimeout(() => { statusEl.textContent = ''; statusEl.style.color = '#6b7280'; }, 3500);
        }
    };

    // Discharge helpers
    const dischargeList = content.querySelector('#dr-sd-discharge-list');
    function addDischargeRow(text) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;align-items:center;';
        row.innerHTML = `
            <input type="text" value="${(text || '').replace(/"/g, '&quot;')}" placeholder="Nhập lời dặn dò..."
                style="flex:1;padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;">
            <button style="appearance:none;border:1px solid #fee2e2;background:#fff;color:#dc2626;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:13px;flex-shrink:0;">Xóa</button>
        `;
        row.querySelector('button').onclick = () => { row.remove(); scheduleAutoSave(); };
        row.querySelector('input').oninput = scheduleAutoSave;
        dischargeList.appendChild(row);
    }

    content.querySelector('#dr-sd-add-discharge').onclick = () => {
        addDischargeRow('');
        scheduleAutoSave();
    };

    // Account helpers (localStorage-based)
    const ls = window.localStorage;
    const ACC_KEY = 'dr_accounts_json';
    const DEF_KEY = 'dr_acc_default';
    const AUTO_KEY = 'dr_acc_autologin';
    function readAccounts() { try { const p = JSON.parse(ls.getItem(ACC_KEY) || '[]'); return Array.isArray(p) ? p : []; } catch(_) { return []; } }
    function writeAccounts(arr) { ls.setItem(ACC_KEY, JSON.stringify(arr)); }
    function readDefault() { return ls.getItem(DEF_KEY) || ''; }
    function writeDefault(u) { ls.setItem(DEF_KEY, u || ''); }

    async function performQuickLogin(acc) {
        if (!acc || !acc.username) return;
        if (typeof GM_openInTab !== 'function') { alert('Cần quyền GM_openInTab'); return; }
        const loginKey = `dr_quick_login_${acc.username}`;
        await GM.setValue(loginKey, JSON.stringify({ username: acc.username, password: acc.password, ts: Date.now() }));
        GM_openInTab(window.location.origin + '/Home/Login?quicklogin=' + encodeURIComponent(acc.username), { active: true, insert: true, incognito: true });
    }

    const accGrid = content.querySelector('#dr-sd-acc-grid');
    function renderAccGrid() {
        accGrid.innerHTML = '';
        const accounts = readAccounts();
        let def = readDefault();
        if (accounts.length === 1 && accounts[0].username && def !== accounts[0].username) {
            writeDefault(accounts[0].username); def = accounts[0].username;
        }
        accounts.forEach((acc, idx) => {
            const box = document.createElement('div');
            box.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;padding:12px;position:relative;background:#fff;transition:border-color 0.2s;';
            box.onmouseover = () => box.style.borderColor = '#2563eb';
            box.onmouseout = () => box.style.borderColor = '#e5e7eb';
            const rid = `dr-acc-local-${idx}`;
            box.innerHTML = `
                <button class="dr-acc-remove" style="position:absolute;right:8px;top:8px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;">Xóa</button>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;margin-top:10px;">
                    <label style="width:70px;font-size:12px;color:#6b7280;">Bí danh</label>
                    <input class="dr-acc-title" type="text" value="${(acc.title||'').replace(/"/g,'&quot;')}" placeholder="VD: Khoa Ngoại" style="flex:1;padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;">
                </div>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
                    <label style="width:70px;font-size:12px;color:#6b7280;">Username</label>
                    <input class="dr-acc-username" type="text" value="${(acc.username||'').replace(/"/g,'&quot;')}" placeholder="Tên đăng nhập" style="flex:1;padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;">
                </div>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">
                    <label style="width:70px;font-size:12px;color:#6b7280;">Password</label>
                    <input class="dr-acc-password" type="password" value="${(acc.password||'').replace(/"/g,'&quot;')}" placeholder="Mật khẩu" style="flex:1;padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;">
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f3f4f6;padding-top:10px;">
                    <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;">
                        <input id="${rid}" type="radio" name="dr-sd-acc-default" ${def===acc.username?'checked':''} style="margin:0;"> Mặc định
                    </label>
                    <button class="dr-acc-login-btn" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;">Login 🕵️</button>
                </div>
            `;
            box.querySelector('.dr-acc-remove').onclick = () => { if (confirm('Xóa tài khoản?')) { const a = readAccounts(); a.splice(idx,1); writeAccounts(a); if (def===acc.username) writeDefault(''); renderAccGrid(); } };
            box.querySelector('.dr-acc-title').oninput = e => { const a = readAccounts(); if(a[idx]) { a[idx].title=e.target.value; writeAccounts(a); } };
            box.querySelector('.dr-acc-username').oninput = e => { const a = readAccounts(); if(a[idx]) { const old=a[idx].username; a[idx].username=e.target.value; writeAccounts(a); if(readDefault()===old) writeDefault(e.target.value); } };
            box.querySelector('.dr-acc-password').oninput = e => { const a = readAccounts(); if(a[idx]) { a[idx].password=e.target.value; writeAccounts(a); } };
            box.querySelector('.dr-acc-login-btn').onclick = () => performQuickLogin(acc);
            box.querySelector(`#${rid}`).onchange = e => { if(e.target.checked) writeDefault(acc.username||''); };
            accGrid.appendChild(box);
        });
        const addBox = document.createElement('div');
        addBox.style.cssText = 'border:2px dashed #cbd5e1;border-radius:12px;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;background:#f9fafb;min-height:140px;transition:all 0.2s;';
        addBox.onmouseover = () => { addBox.style.borderColor='#2563eb'; addBox.style.color='#2563eb'; };
        addBox.onmouseout = () => { addBox.style.borderColor='#cbd5e1'; addBox.style.color='#6b7280'; };
        addBox.innerHTML = '<div style="font-size:28px;margin-bottom:4px;">+</div><div style="font-size:13px;font-weight:600;">Thêm tài khoản</div>';
        addBox.onclick = () => { const a = readAccounts(); a.push({title:'',username:'',password:''}); writeAccounts(a); renderAccGrid(); };
        accGrid.appendChild(addBox);
    }

    // Cloud account helpers
    const cloudGrid = content.querySelector('#dr-sd-cloud-grid');
    function renderCloudGrid() {
        cloudGrid.innerHTML = '';
        (_cloudAccounts || []).forEach((acc, idx) => {
            const box = document.createElement('div');
            box.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;padding:12px;position:relative;background:#fff;transition:border-color 0.2s;';
            box.onmouseover = () => box.style.borderColor = '#2563eb';
            box.onmouseout = () => box.style.borderColor = '#e5e7eb';
            box.innerHTML = `
                <button class="dr-cloud-remove" style="position:absolute;right:8px;top:8px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;">Xóa</button>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;margin-top:10px;">
                    <label style="width:70px;font-size:12px;color:#6b7280;">Bí danh</label>
                    <input class="dr-cloud-title" type="text" value="${(acc.title||'').replace(/"/g,'&quot;')}" placeholder="VD: Trực Ngoại" style="flex:1;padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;">
                </div>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
                    <label style="width:70px;font-size:12px;color:#6b7280;">Username</label>
                    <input class="dr-cloud-username" type="text" value="${(acc.username||'').replace(/"/g,'&quot;')}" placeholder="Tên đăng nhập" style="flex:1;padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;">
                </div>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">
                    <label style="width:70px;font-size:12px;color:#6b7280;">Password</label>
                    <input class="dr-cloud-password" type="password" value="${(acc.password||'').replace(/"/g,'&quot;')}" placeholder="Mật khẩu" style="flex:1;padding:5px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;">
                </div>
                <div style="display:flex;justify-content:flex-end;border-top:1px solid #f3f4f6;padding-top:10px;">
                    <button class="dr-cloud-login-btn" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;">Login 🕵️</button>
                </div>
            `;
            box.querySelector('.dr-cloud-remove').onclick = () => {
                if (confirm('Xóa account cloud này?')) { _cloudAccounts.splice(idx,1); renderCloudGrid(); scheduleAutoSave(); }
            };
            box.querySelector('.dr-cloud-title').oninput = e => { _cloudAccounts[idx].title = e.target.value; scheduleAutoSave(); };
            box.querySelector('.dr-cloud-username').oninput = e => { _cloudAccounts[idx].username = e.target.value; scheduleAutoSave(); };
            box.querySelector('.dr-cloud-password').oninput = e => { _cloudAccounts[idx].password = e.target.value; scheduleAutoSave(); };
            box.querySelector('.dr-cloud-login-btn').onclick = () => performQuickLogin(_cloudAccounts[idx]);
            cloudGrid.appendChild(box);
        });
        const addBox = document.createElement('div');
        addBox.style.cssText = 'border:2px dashed #cbd5e1;border-radius:12px;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;background:#f9fafb;min-height:140px;transition:all 0.2s;';
        addBox.onmouseover = () => { addBox.style.borderColor='#2563eb'; addBox.style.color='#2563eb'; };
        addBox.onmouseout = () => { addBox.style.borderColor='#cbd5e1'; addBox.style.color='#6b7280'; };
        addBox.innerHTML = '<div style="font-size:28px;margin-bottom:4px;">+</div><div style="font-size:13px;font-weight:600;">Thêm account cloud</div>';
        addBox.onclick = () => { _cloudAccounts.push({title:'',username:'',password:''}); renderCloudGrid(); scheduleAutoSave(); };
        cloudGrid.appendChild(addBox);
    }

    // Load API data
    statusEl.textContent = 'Đang tải...';
    statusEl.style.color = '#3b82f6';
    try {
        const result = await SettingsService.getOrCreateSettings();
        _doctorName = result.doctorName || '';
        _chungThuSo = result.chungThuSo || '';
        _checklistObj = result.checklistObj;
        _settings = result.settings;

        _cloudAccounts = await SettingsService.getCloudAccounts(_settings, { doctorName: _doctorName, chungThuSo: _chungThuSo });

        // Render discharge
        const danDo = _settings && _settings.danDoRaVien ? _settings.danDoRaVien : SettingsService.getDefaultSettings().danDoRaVien;
        (danDo || []).forEach(t => addDischargeRow(t));

        // Render account grids
        renderAccGrid();
        renderCloudGrid();

        // Auto-login toggle
        try {
            const { createAutoLoginToggle, applyToggleStyles } = require('./autoLoginToggle');
            const toggleWrap = content.querySelector('#dr-sd-acc-autologin-wrap');
            if (toggleWrap) {
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
                toggleWrap.appendChild(toggle);
            }
        } catch(_) {}

        statusEl.textContent = '';
    } catch(e) {
        console.error('settingsDialog load error', e);
        statusEl.textContent = '✗ Lỗi tải dữ liệu';
        statusEl.style.color = '#dc2626';
    }
}

module.exports = { showSettingsDialog };
