// Global function to open HSBA V2 - Define at top level for global access
// This needs to be outside any function to be truly global
// Don't use window.openHSBAV2 as it may not work in Tampermonkey
async function openHSBAV2(mabn) {
    try {
        const response = await fetch('/ToDieuTri/LoadLinkHsba', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: 'code=' + encodeURIComponent(mabn)
        });
        
        const result = await response.json();
        if (result && result.data && result.data.link) {
            window.open(result.data.link, '_blank');
        } else {
            console.error('Không lấy được link HSBA V2');
            alert('Không lấy được link HSBA V2');
        }
    } catch (error) {
        console.error('Lỗi khi load link HSBA V2:', error);
        alert('Lỗi khi load link HSBA V2');
    }
}

// Also assign to window as fallback but the function declaration above should work
if (typeof window !== 'undefined') {
    window.openHSBAV2 = openHSBAV2;
}

// Make it available in global scope for Tampermonkey
this.openHSBAV2 = openHSBAV2;
unsafeWindow.openHSBAV2 = openHSBAV2;

(async function () {
    'use strict';

    // Auto-redirect to dashboard if login was just successful and auto-login is enabled
    const isRootPage = window.location.pathname === '/' || window.location.pathname === '';
    const isAutoLoginEnabled = window.localStorage && window.localStorage.getItem('dr_acc_autologin') === '1';
    const loginFlag = window.sessionStorage && window.sessionStorage.getItem('bsnt_login_clicked');

    if (isRootPage && isAutoLoginEnabled && loginFlag) {
        window.sessionStorage.removeItem('bsnt_login_clicked');
        window.location.href = '/?nln';
        return;
    }

    const Utils = require('./utils');

    // Ensure HSBA background worker runs on hsba.tahospital.vn when this bundle is injected there
    try { require('./components/hsbaDataFetcher'); } catch(_) {}
    // Ensure OTM entry runs on otm.tahospital.vn when this bundle is injected there
    try { require('./pages/otm-entry'); } catch(_) {}
    const { TaiToanBoTaiLieuHSBAV2, triggerDownloadIfDataExists } = require('./utils/hsbaV2Download');
    const DanhSachBenhNhan = require('./DanhSachBenhNhan');
    const { GoogleAppsScriptUploader, GOOGLE_APPS_SCRIPT_URL } = require('./googleAppsScript');
    const { showDashboardBenhNhanIfNeeded } = require('./pages/page.dashboard');
    const { showSettingsIfNeeded } = require('./pages/page.settings');
        // Lịch mổ hôm nay route hook
        try {
            const { showLichMoHomNayIfNeeded } = require('./pages/page.lichmo.homnay');
            showLichMoHomNayIfNeeded();
        } catch(_) {}
    const { initCopyDienTienAI } = require('./components/copyDienTienAI');
    const ChecklistService = require('./services/checklistService');
    showDashboardBenhNhanIfNeeded();
    showSettingsIfNeeded();
    try {
        window.addEventListener('online', () => {
            try { ChecklistService.drainSaveQueue(); } catch(_) {}
        });
    } catch(_) {}
    // --- Khởi tạo class và gắn vào window để dễ test ---
    window.DanhSachBenhNhanManager = new DanhSachBenhNhan();
    window.DanhSachBenhNhanManager.startAutoFetch();
    window.DanhSachBenhNhanManager.addFetchButtonToBottomBar();

    // --- Khởi tạo uploader Google Apps Script và gắn vào window để có thể dùng ở nơi khác nếu cần ---
    var uploader = new GoogleAppsScriptUploader(GOOGLE_APPS_SCRIPT_URL);
    window.GoogleAppsScriptUploader = uploader;
    // uploader.addUploadButton();

    // ĐÃ XÓA toàn bộ định nghĩa các hàm createDirectReportGeneration, fetchToDieuTriData, addGlobalStyles, updateChecklistPhieu, createChecklistPhieu khỏi file này vì đã chuyển sang dashboard.support.js và được sử dụng qua dashboard.js


    // Show dr_data as cards if ?show=true or ?nln in URL
    // ĐÃ XÓA toàn bộ định nghĩa hàm showDashboardBenhNhanIfNeeded và các hàm con bên trong (từ dòng 192 trở đi cho đến hết hàm)

    // ĐÃ XÓA đoạn kiểm tra window.dr_data, fetchToDieuTriData và renderCards khỏi file này vì đã chuyển sang dashboard.js


    // Nếu URL kết thúc bằng /to-dieu-tri thì tự động click #cbTaCa nếu tồn tại
    function autoClickCbTaCaIfNeeded() {
        // --- Tự động click #cbTaCa nếu ở trang /to-dieu-tri ---
        if (/\/to-dieu-tri(\?.*)?$/.test(window.location.pathname) || window.location.href.includes('DanhSachBenhNhan')) {
            $('#ddlKhoa').on('change', function () {
                const v = $(this).val();
                try {
                    localStorage.setItem('bsnt_khoa_dashboard', v);
                } catch(_) {}
            });

            setTimeout(() => {

                const savedKhoa = localStorage.getItem('bsnt_khoa_dashboard') || "551";
                if (savedKhoa) {
                    $('#ddlKhoa').val(savedKhoa).change();
                }
                console.log('Đã tự động chọn khoa ' + savedKhoa + ' trong dropdown #ddlKhoa');
            }, 500);

            const cb = document.getElementById('cbTaCa');
            if (cb) {
                cb.click();
            }
        }
    }
    autoClickCbTaCaIfNeeded();

    // Initialize Copy Diễn Tiến button on /to-dieu-tri
    try { initCopyDienTienAI(); } catch(_) {}

    // Auto-login on /Home/Login: always fill from default account; only auto-submit if enabled
    try {
        const isLoginPage = /\/Home\/Login(\?.*)?$/.test(window.location.pathname);
        if (isLoginPage && window.localStorage) {
            const params = new URLSearchParams(window.location.search);
            const quickLoginUser = params.get('quicklogin');
            
            if (quickLoginUser) {
                const loginKey = `dr_quick_login_${quickLoginUser}`;
                const credsStr = await GM.getValue(loginKey);
                if (credsStr) {
                    try {
                        const creds = JSON.parse(credsStr);
                        if (creds && creds.username === quickLoginUser && (Date.now() - creds.ts < 60000)) {
                            // Clear it after pick up
                            await GM.deleteValue(loginKey);

                            // Robust filling: poll for inputs
                            let tries = 0;
                            const fillIv = setInterval(() => {
                                tries++;
                                const uInput = document.querySelector('input[name="username"]');
                                const pInput = document.querySelector('input[name="password"]');
                                const btn = document.querySelector('button[type="submit"]');

                                if (uInput && pInput && btn) {
                                    clearInterval(fillIv);
                                    uInput.value = creds.username;
                                    pInput.value = creds.password;
                                    
                                    // Trigger input events for potential framework listeners
                                    uInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    pInput.dispatchEvent(new Event('input', { bubbles: true }));

                                    setTimeout(() => {
                                        window.sessionStorage.setItem('bsnt_login_clicked', '1');
                                        btn.click();
                                    }, 200);
                                }
                                if (tries > 50) clearInterval(fillIv);
                            }, 100);
                            return; // Stop and let this one finish
                        }
                    } catch (e) { console.error('Quick login failed', e); }
                }
            }

            const ACC_KEY = 'dr_accounts_json';
            const DEF_KEY = 'dr_acc_default';
            const AUTO_KEY = 'dr_acc_autologin';
            let accounts = [];
            try { accounts = JSON.parse(localStorage.getItem(ACC_KEY) || '[]'); } catch(_) { accounts = []; }
            const defUser = localStorage.getItem(DEF_KEY) || '';
            const acc = accounts.find(a => (a && a.username) === defUser) || accounts[0] || null;
            const userInput = document.querySelector('input[name="username"][placeholder="Tên đăng nhập"]');
            const passInput = document.querySelector('input[type="password"][name="password"][placeholder="Mật khẩu"]');
            const submitBtn = document.querySelector('button[type="submit"].btn.btn-primary.btn-block');
            if (acc && userInput && passInput) {
                userInput.value = acc.username || '';
                passInput.value = acc.password || '';
            }
            if (acc && localStorage.getItem(AUTO_KEY) === '1' && userInput && passInput && submitBtn) {
                setTimeout(() => {
                    window.sessionStorage.setItem('bsnt_login_clicked', '1');
                    submitBtn.click();
                    setTimeout(() => { try { window.location.href = '/?nln'; } catch(_) {} }, 1500);
                }, 200);
            } else if (localStorage.getItem(AUTO_KEY) !== '1') {

                // Render account picker panel to the right of login card
                try {
                    const ensurePanel = () => {
                        const loginCard = document.querySelector('div.card.card-outline.card-primary');
                        if (!loginCard || accounts.length === 0 || document.getElementById('dr-quochoai-danh-sach-tai-khoan-login')) return;
                        // Inject minimal CSS for layout + blue buttons
                        if (!document.getElementById('dr-login-accounts-css')) {
                            const style = document.createElement('style');
                            style.id = 'dr-login-accounts-css';
                            style.textContent = `
                                #dr-quochoai-danh-sach-tai-khoan-login { position: fixed; width: 300px; max-width: 340px; display: flex; flex-direction: column; gap: 8px; background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px; z-index:2147483647; }
                                #dr-quochoai-danh-sach-tai-khoan-login .dr-acc-title { font-weight: 700; margin-bottom: 4px; color: #0d47a1; }
                                #dr-quochoai-danh-sach-tai-khoan-login .dr-acc-btn { background: #1976d2; color: #fff; border: none; padding: 10px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: left; box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
                                #dr-quochoai-danh-sach-tai-khoan-login .dr-acc-btn:hover { background: #1565c0; }
                            `;
                            document.head && document.head.appendChild(style);
                        }

                        const panel = document.createElement('div');
                        panel.id = 'dr-quochoai-danh-sach-tai-khoan-login';
                        const titleEl = document.createElement('div');
                        titleEl.className = 'dr-acc-title';
                        titleEl.textContent = 'Tài khoản đã lưu';
                        panel.appendChild(titleEl);

                        accounts.forEach(a => {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'dr-acc-btn';
                            const title = a.title || a.username || 'Tài khoản';
                            btn.textContent = title + (a.username ? ` (${a.username})` : '');
                            btn.addEventListener('click', () => {
                                if (userInput && passInput && submitBtn) {
                                    userInput.value = a.username || '';
                                    passInput.value = a.password || '';
                                    window.sessionStorage.setItem('bsnt_login_clicked', '1');
                                    submitBtn.click();
                                    setTimeout(() => { try { window.location.href = '/?nln'; } catch(_) {} }, 1500);
                                }
                            });

                            panel.appendChild(btn);
                        });

                        // Append panel directly to body and position it to the right of the login card
                        if (document.body && document.body.appendChild) {
                            document.body.appendChild(panel);
                            const positionPanel = () => {
                                const rect = loginCard.getBoundingClientRect();
                                const panelRect = panel.getBoundingClientRect();
                                const top = Math.max(12, rect.top + window.scrollY);
                                let left = rect.right + 16 + window.scrollX;
                                const maxLeft = window.scrollX + window.innerWidth - panelRect.width - 12;
                                if (left > maxLeft) left = Math.max(12 + window.scrollX, maxLeft);
                                panel.style.top = top + 'px';
                                panel.style.left = left + 'px';
                            };
                            // Initial and delayed to ensure metrics
                            positionPanel();
                            setTimeout(positionPanel, 0);
                            window.addEventListener('resize', positionPanel);
                            window.addEventListener('scroll', positionPanel, { passive: true });
                        }
                    };
                    // Run now or retry a few times if the DOM isn’t ready yet
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', ensurePanel);
                    } else {
                        ensurePanel();
                        let tries = 0;
                        const iv = setInterval(() => {
                            tries++;
                            if (document.getElementById('dr-quochoai-danh-sach-tai-khoan-login') || tries > 10) return clearInterval(iv);
                            ensurePanel();
                        }, 300);
                    }
                } catch(_) {}
            }
        }
    } catch(_) {}



    // Gọi hàm khi trang chính load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addDashboardMenuToSidebar();
            addDashboardMenuToTopbar();
            addAutoLoginToggleToTopbar();
        });
    } else {
        addDashboardMenuToSidebar();
        addDashboardMenuToTopbar();
        addAutoLoginToggleToTopbar();
    }

    // Thêm menu mở dashboard vào sidebar
    function addDashboardMenuToSidebar() {
        // Tìm nav sidebar
        const nav = document.querySelector('nav.mt-2 ul.nav-sidebar');
        if (!nav) return;
        // Kiểm tra đã có menu chưa
        if (nav.querySelector('.bsnt-dashboard-menu')) return;
        // Tạo li mới
        const li = document.createElement('li');
        li.className = 'nav-item bsnt-dashboard-menu';
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.href = '/?nln';
        a.target = '_blank'; // Mở trong tab mới
        a.innerHTML = '<i class="nav-icon fas fa-tachometer-alt"></i> <p>Mở dashboard</p>';
        // Style vàng và bo tròn
        a.style.background = 'gold';
        a.style.borderRadius = '12px';
        a.style.color = '#333';
        a.style.fontWeight = 'bold';
        a.onmouseover = function () { a.style.background = '#ffe066'; };
        a.onmouseout = function () { a.style.background = 'gold'; };
        li.appendChild(a);
        // Thêm vào đầu ul
        nav.insertBefore(li, nav.firstChild);
    }

    // Thêm nút TỰ ĐỘNG LOGIN vào TOPBAR bên trái <li class="nav-item dropdown">
    function addAutoLoginToggleToTopbar() {
        const { createAutoLoginToggle, applyToggleStyles } = require('./components/autoLoginToggle');
        const dropdownLi = document.querySelector('nav.main-header ul.navbar-nav li.nav-item.dropdown')
            || document.querySelector('ul.navbar-nav li.nav-item.dropdown')
            || document.querySelector('li.nav-item.dropdown');
        if (!dropdownLi) return;
        const ul = dropdownLi.parentElement;
        if (!ul) return;
        if (ul.querySelector('.bsnt-autologin-toggle')) return;

        const li = document.createElement('li');
        li.className = 'nav-item bsnt-autologin-toggle';
        const enabled = window.localStorage && window.localStorage.getItem('dr_acc_autologin') === '1';
        const a = createAutoLoginToggle({
            enabled,
            onToggle: () => {
                const cur = window.localStorage && window.localStorage.getItem('dr_acc_autologin') === '1';
                if (window.localStorage) window.localStorage.setItem('dr_acc_autologin', cur ? '0' : '1');
                applyToggleStyles(a, !cur);
            },
            onDblClick: () => window.open('/?caidat=account', '_blank'),
            title: 'Bật/tắt tự động login (double click để mở Cài đặt > Account)'
        });
        li.appendChild(a);
        ul.insertBefore(li, dropdownLi);
    }

    // Helper: detect smartphone/small screens
    function shouldShowTopbarMenu() {
        try { return window.matchMedia && window.matchMedia('(max-width: 768px)').matches; } catch(_) { return false; }
    }

    // Thêm nút mở dashboard vào TOPBAR bên cạnh <li class="nav-item dropdown">
    function addDashboardMenuToTopbar() {
        // Tìm topbar ul chứa các nav-item
        const dropdownLi = document.querySelector('nav.main-header ul.navbar-nav li.nav-item.dropdown')
            || document.querySelector('ul.navbar-nav li.nav-item.dropdown')
            || document.querySelector('li.nav-item.dropdown');
        if (!dropdownLi) return;
        const ul = dropdownLi.parentElement;
        if (!ul) return;
        // On desktop, remove if present and skip
        if (!shouldShowTopbarMenu()) {
            const existing = ul.querySelector('.bsnt-dashboard-menu-top');
            if (existing) existing.remove();
            return;
        }
        // Tránh thêm trùng
        if (ul.querySelector('.bsnt-dashboard-menu-top')) return;

        const li = document.createElement('li');
        li.className = 'nav-item bsnt-dashboard-menu-top';
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.href = '/?nln';
        a.target = '_blank';
        a.innerHTML = '<i class="fas fa-tachometer-alt"></i> <span style="margin-left:6px;">Mở dashboard</span>';
        // Style vàng và bo tròn giống sidebar
        a.style.background = 'gold';
        a.style.borderRadius = '12px';
        a.style.color = '#333';
        a.style.fontWeight = 'bold';
        a.style.display = 'inline-flex';
        a.style.alignItems = 'center';
        a.style.gap = '6px';
        a.style.padding = '6px 10px';
        a.onmouseover = function () { a.style.background = '#ffe066'; };
        a.onmouseout = function () { a.style.background = 'gold'; };
        li.appendChild(a);

        if (dropdownLi.nextSibling) ul.insertBefore(li, dropdownLi.nextSibling);
        else ul.appendChild(li);
    }

    // Re-evaluate visibility on resize (bind once)
    if (!window.__bsntTopbarMenuResizeBound) {
        window.addEventListener('resize', () => {
            try { addDashboardMenuToTopbar(); } catch(_) {}
        }, { passive: true });
        window.__bsntTopbarMenuResizeBound = true;
    }

    // --- HSBA V2 PAGE ENHANCEMENT: Hide empty sections (no documents) ---
    function HSBAV2HideEmptySectionsIfNeeded() {
        if (window.location.hostname === 'hsba.tahospital.vn') {
            function hideEmptySections() {
                document.querySelectorAll('div.MuiBox-root.css-0').forEach(div => {
                    const p = div.querySelector('p');
                    if (p && /\(0\)\s*$/.test(p.textContent)) {
                        div.style.display = 'none';
                    }
                });
            }
            // Wait for all AJAX content to load before running hideEmptySections
            function waitForFullLoadAndHide() {
                let lastCount = 0;
                let stableCount = 0;
                const maxWait = 20000; // 20 seconds max
                const startTime = performance.now();
                const interval = setInterval(() => {
                    const currentCount = document.querySelectorAll('div.MuiBox-root.css-0').length;
                    if (currentCount === lastCount) {
                        stableCount++;
                    } else {
                        stableCount = 0;
                    }
                    lastCount = currentCount;
                    // If count is stable for 10 checks (~10s) or maxWait reached, run hideEmptySections and click target div
                    if (stableCount > 10 || (performance.now() - startTime) > maxWait) {
                        clearInterval(interval);
                        hideEmptySections();
                        // Click div with class 'MuiBox-root css-1ebnygn'
                        const targetDiv = document.querySelector('div.MuiBox-root.css-1ebnygn');
                        if (targetDiv) {
                            targetDiv.click();
                        }
                    }
                    // For debug:
                    // console.log(`Current sections: ${currentCount}, Stable count: ${stableCount}`);
                }, 1000);
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', waitForFullLoadAndHide);
            } else {
                waitForFullLoadAndHide();
            }
            // Also observe for dynamic changes (in case of further AJAX updates)
            const observer = new MutationObserver(hideEmptySections);
            observer.observe(document.body, { childList: true, subtree: true });

            // Add download button
            const buttonTargetDiv = document.querySelector('div.css-1xd5sck');
            if (buttonTargetDiv && !buttonTargetDiv.querySelector('.dr-download-all-btn')) {
                const button = document.createElement('button');
                button.className = 'dr-download-all-btn';
                button.textContent = 'Tải toàn bộ tài liệu';
                button.style.cssText = 'background:#007bff;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;margin:10px;font-size:14px;';
                button.onclick = () => {
                    if (typeof window.triggerDownloadIfDataExists === 'function') {
                        window.triggerDownloadIfDataExists();
                    }
                };
                buttonTargetDiv.appendChild(button);
            }

            // Regularly check for button injection on lazy loaded content
            const checkForButtonInjection = () => {
                const buttonTargetDiv = document.querySelector('div.css-1xd5sck');
                if (buttonTargetDiv && !buttonTargetDiv.querySelector('.dr-download-all-btn')) {
                    const button = document.createElement('button');
                    button.className = 'dr-download-all-btn';
                    button.textContent = 'Tải toàn bộ tài liệu';
                    button.style.cssText = 'background:#007bff;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;margin:10px;font-size:14px;';
                    button.onclick = () => {
                        if (typeof window.triggerDownloadIfDataExists === 'function') {
                            window.triggerDownloadIfDataExists();
                        }
                    };
                    buttonTargetDiv.appendChild(button);
                }
            };
            // Check immediately
            checkForButtonInjection();
            // Then check every 2 seconds for up to 30 seconds
            let buttonCheckCount = 0;
            const buttonCheckInterval = setInterval(() => {
                buttonCheckCount++;
                checkForButtonInjection();
                if (buttonCheckCount > 15) { // 30 seconds
                    clearInterval(buttonCheckInterval);
                }
            }, 2000);

        }

    }
    HSBAV2HideEmptySectionsIfNeeded();
    
    // Initialize HSBA V2 full download
    TaiToanBoTaiLieuHSBAV2();
    window.triggerDownloadIfDataExists = triggerDownloadIfDataExists;
})();