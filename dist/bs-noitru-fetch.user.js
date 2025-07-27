// ==UserScript==
// @name         BS Nội trú - Helper (TA Hospital) - By drquochoai, BS.CKI Trần Quốc Hoài
// @namespace    http://tampermonkey.net/
// @version      1.4.100
// @description  Hỗ trợ dữ liệu bệnh nhân từ bs-noitru.tahospital.vn.
// @author       BS.CKI Trần Quốc Hoài, tahospital.vn
// @match        https://bs-noitru.tahospital.vn/*
// @match        https://dd-noitru.tahospital.vn/*
// @match        https://hsba.tahospital.vn/*
// @grant        GM_xmlhttpRequest
// @license      MIT
// @connect      google.com
// @connect      tahospital.vn
// @connect      bs-noitru.tahospital.vn
// @connect      script.google.com
// @connect      googleusercontent.com
// @connect      *
// @sandbox      MAIN_WORLD
// ==/UserScript==

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// DanhSachBenhNhan.js
function DanhSachBenhNhan() {
    this.danhSach = null;
    this.lastFetched = null;
    this.autoFetchTimer = null;
    this.fixedMabn = "51991h991h991h991";
}

DanhSachBenhNhan.prototype.layDanhSachTheoMaBNFixed = function() {
    var self = this;
    return this._fetchDanhSach(this.fixedMabn).then(function(data) {
        if (data && data.length > 0) {
            self.danhSach = data;
            self.lastFetched = new Date();
            console.log('Đã lấy danh sách cho MABN cố định (' + data.length + ' mục).');
            self.uploadChecklistWithDrData(self.fixedMabn);
        } else {
            self.uploadChecklistWithDrData(self.fixedMabn);
        }
        return data;
    });
};

DanhSachBenhNhan.prototype.luuDanhSachBenhNhanVoiNgayVVMacDinh = function(ds) {
    if (!Array.isArray(ds)) return;
    this.danhSach = ds.map(function(bn) {
        var copy = {};
        for (var k in bn) copy[k] = bn[k];
        copy.ngayvv = "01/01/1001 01:01";
        return copy;
    });
    this.lastFetched = new Date();
    alert('Đã lưu ' + this.danhSach.length + ' bệnh nhân với ngày vào viện mặc định.');
};

DanhSachBenhNhan.prototype.startAutoFetch = function() {
    var self = this;
    if (this.autoFetchTimer) clearInterval(this.autoFetchTimer);
    this.autoFetchTimer = setInterval(function() { self._autoFetch7h(); }, 60000);
};
DanhSachBenhNhan.prototype._autoFetch7h = function() {
    var now = new Date();
    if (now.getHours() === 7 && now.getMinutes() === 0) {
        if (this.lastFetched) {
            var last = new Date(this.lastFetched);
            if (last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate() && last.getHours() === 7) {
                alert('Đã có danh sách bệnh nhân lúc 7h sáng rồi.');
                return;
            }
        }
        this.layDanhSachTheoMaBNFixed();
    }
};

DanhSachBenhNhan.prototype.addFetchButtonToBottomBar = function() {
    var self = this;
    function addBtn() {
        var bar = document.querySelector('.dr-bottom-bar');
        if (!bar || bar.querySelector('#btn-fetch-fixed-mabn')) return;
        var btn = document.createElement('button');
        btn.id = 'btn-fetch-fixed-mabn';
        btn.innerText = 'Lấy DSBN (MABN cố định)';
        btn.className = 'btn btn-info';
        btn.style.marginLeft = '12px';
        btn.onclick = function() { self.layDanhSachTheoMaBNFixed(); };
        bar.appendChild(btn);
    }
    addBtn();
    document.addEventListener('DOMContentLoaded', addBtn);
    setTimeout(addBtn, 2000);
};

DanhSachBenhNhan.prototype._fetchDanhSach = function(mabn) {
    var self = this;
    return new Promise(function(resolve) {
        var formData = new FormData();
        formData.append('mabn', mabn);
        var now = new Date();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var year = now.getFullYear();
        var dateStr = month + '/' + day + '/' + year + ' 07:00';
        formData.append('tungay', "01/01/1001 01:01");
        formData.append('denngay',  "01/01/3001 01:01");
        fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        }).then(function(r) { return r.json(); }).then(function(res) {
            if (res && res.data) resolve(res.data);
            else {
                if (window.DanhSachBenhNhanManager && typeof window.DanhSachBenhNhanManager.uploadChecklistWithDrData === 'function') {
                    window.DanhSachBenhNhanManager.uploadChecklistWithDrData(mabn, function(uploadRes) {
                        resolve(null);
                    });
                } else {
                    resolve(null);
                }
            }
        }).catch(function() { resolve(null); });
    });
};

DanhSachBenhNhan.prototype.uploadChecklistWithDrData = function(mabn, callback) {
    var formData = new FormData();
    formData.append('status', '1');
    formData.append('thebaohiemyte', 'Không');
    formData.append('chuky', JSON.stringify(window.dr_data || {}));
    formData.append('khac', '--*--');
    formData.append('khu', '1');
    formData.append('mabn', mabn);
    formData.append('bieumauid', '027');
    formData.append('makp', '551');
    formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
    formData.append('actiontype', '');
    formData.append('hoten', 'Không rõ%');
    formData.append('ngaysinh', '10/10/1999');
    formData.append('gioitinh', 'Nam');
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    formData.append('maql', `${month}/${day}/${year} 07:00`);
    fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
        method: 'POST',
        credentials: 'include',
        body: formData
    }).then(function(r) { return r.json(); }).then(function(res) {
        if (typeof callback === 'function') callback(res);
    }).catch(function() {
        if (typeof callback === 'function') callback(null);
    });
};

module.exports = DanhSachBenhNhan;

},{}],2:[function(require,module,exports){
(function () {
    'use strict';

    const Utils = require('./utils');
    const DanhSachBenhNhan = require('./DanhSachBenhNhan');
    const { GoogleAppsScriptUploader, GOOGLE_APPS_SCRIPT_URL } = require('./googleAppsScript');
    const { showDashboardBenhNhanIfNeeded } = require('./dashboard');
    showDashboardBenhNhanIfNeeded();
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
                localStorage.setItem('bsnt_selected_khoa', $(this).val());
            });

            setTimeout(() => {

                const savedKhoa = localStorage.getItem('bsnt_selected_khoa') || "551";
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



    // Gọi hàm khi trang chính load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDashboardMenuToSidebar);
    } else {
        addDashboardMenuToSidebar();
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

        }

    }
    HSBAV2HideEmptySectionsIfNeeded();
})();
},{"./DanhSachBenhNhan":1,"./dashboard":6,"./googleAppsScript":8,"./utils":13}],3:[function(require,module,exports){
// dialogManager.js - Manager for dialogs and modals

const DialogManager = {
    /**
     * Create a modal dialog
     */
    createDialog(id, options = {}) {
        // Remove existing dialog if exists
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.id = id;
        dialog.style = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000001;
            background: rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const inner = document.createElement('div');
        inner.style = `
            background: #fff;
            padding: 32px 24px 24px 24px;
            max-width: ${options.maxWidth || '700px'};
            width: 98vw;
            border-radius: 12px;
            box-shadow: 0 4px 32px rgba(0,0,0,0.18);
            position: relative;
        `;

        dialog.appendChild(inner);
        document.body.appendChild(dialog);

        // Click outside to close
        if (options.closeOnClickOutside !== false) {
            dialog.onclick = function (e) {
                if (e.target === dialog) dialog.remove();
            };
        }

        return { dialog, inner };
    },

    /**
     * Create action buttons for dialog
     */
    createActionButtons(buttons) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style = 'margin-top:18px;display:flex;gap:12px;justify-content:flex-end;';

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.id = button.id;
            btn.className = button.className || 'btn';
            btn.textContent = button.text;
            btn.onclick = button.onclick;
            buttonContainer.appendChild(btn);
        });

        return buttonContainer;
    },

    /**
     * Show toast notification
     */
    showToast(message, options = {}) {
        const toast = document.createElement('div');
        toast.innerText = message;
        toast.style = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: ${options.background || '#1976d2'};
            color: ${options.color || '#fff'};
            padding: 12px 28px;
            border-radius: 8px;
            font-size: 1.1em;
            z-index: 1000002;
            box-shadow: 0 2px 12px rgba(25,118,210,0.15);
            transition: opacity 0.3s;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, options.duration || 1800);
    }
};

module.exports = DialogManager;

},{}],4:[function(require,module,exports){
// loginHandler.js - Centralized login prompt handling

const LoginHandler = {
    /**
     * Show login prompt and redirect to login page
     */
    showLoginPrompt() {
        document.body.innerHTML = '';
        const loginDiv = document.createElement('div');
        loginDiv.className = 'dr-login';
        loginDiv.textContent = 'Vui lòng đăng nhập để xem dữ liệu';
        document.body.appendChild(loginDiv);
        
        setTimeout(() => {
            window.location.href = '/Home/Login';
        }, 500);
    },

    /**
     * Check if user needs to login and handle accordingly
     */
    handleLoginRequired() {
        this.showLoginPrompt();
    }
};

module.exports = LoginHandler;

},{}],5:[function(require,module,exports){
// modalManager.js - Centralized modal/sidebar management

const ModalManager = {
    /**
     * Create or get existing backdrop element
     */
    getOrCreateBackdrop() {
        let backdrop = document.getElementById('dr-sidebar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'dr-sidebar-backdrop';
            backdrop.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:99999;';
            document.body.appendChild(backdrop);
        }
        return backdrop;
    },

    /**
     * Create or get existing sidebar element
     */
    getOrCreateSidebar() {
        let sidebar = document.getElementById('dr-sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'dr-sidebar';
            document.body.appendChild(sidebar);
        }
        return sidebar;
    },

    /**
     * Show modal with backdrop
     */
    showModal(sidebar, backdrop) {
        backdrop.style.display = 'block';
        sidebar.style.display = 'block';
    },

    /**
     * Hide modal and backdrop
     */
    hideModal(sidebar, backdrop) {
        if (sidebar) sidebar.style.display = 'none';
        backdrop.style.display = 'none';
    },

    /**
     * Setup modal close handlers
     */
    setupCloseHandlers(sidebar, backdrop) {
        const hideModal = () => this.hideModal(sidebar, backdrop);
        
        // Click backdrop to close
        backdrop.onclick = hideModal;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Đóng';
        closeBtn.style = 'position:absolute;top:12px;right:12px;background:#eee;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;';
        closeBtn.onclick = hideModal;
        
        return closeBtn;
    }
};

module.exports = ModalManager;

},{}],6:[function(require,module,exports){
// dashboard.js

const Utils = require('./utils');
const {
    createDirectReportGeneration,
    addGlobalStyles
} = require('./dashboard.support');

// Import refactored modules
const PatientService = require('./services/patientService');
const ChecklistService = require('./services/checklistService');
const PatientDataMapper = require('./utils/patientDataMapper');
const ModalManager = require('./components/modalManager');
const LoginHandler = require('./components/loginHandler');

function showDashboardBenhNhanIfNeeded() {
    if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
    addGlobalStyles(); // Đảm bảo style chỉ chèn 1 lần
    // Checklist items
    const checklistItems = [
        
        'Phiếu Khám vào viện (hsoft)',
        'Bệnh án Ngoại khoa',
        'Tờ điều trị (web)',
        'Tạo Biên bản Hội chẩn duyệt mổ (web)',
        'Phiếu khai thác tiền sử dị ứng (hsoft)',
        '57. Cam kết phẫu thuật thủ thuật (hsoft)',
        'Phiếu cung cấp thông tin, chẩn đoán và điều trị. (hsoft)',
        'Đánh giá nguy cơ huyết khối (web)',
        `Chuyển xét nghiệm vào khoa (hsoft) và ✅ ký số`,
        `Đánh dấu vết mổ`,
        `ĐÃ khám tiền mê CHƯA?`,
        `ĐÃ đặt lịch mổ CHƯA?`,
        'Phiếu kiểm tra HIV test (hsoft)',
        
    ];

    // Helper function to create patient info section
    function createPatientInfoSection(patient) {
        const info = document.createElement('div');
        info.innerHTML = `
            <h2 style="margin-top:0">${patient.hoten || ''} <span style="font-size:0.9em;color:#888;">${patient.mabn ? ' - ' + patient.mabn : ''}</span></h2>
            <div><b>Tuổi:</b> ${Utils.calculateAge(patient.ngaysinh)}</div>
            <div><b>Giới tính:</b> <span>${patient.phai === 1 ? 'Nữ' : 'Nam'}</span></div>
            <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
            <div><b>Kế hoạch điều trị:</b><br><textarea id="dr-treatment" style="width:95%;min-height:60px;resize:vertical;">${patient.kehoach || ''}</textarea></div>
            
            <div style="margin-top:20px;">
                <h3 style="margin-bottom:10px;">Thông tin phẫu thuật</h3>
                <div style="margin-bottom:12px;">
                    <button id="dr-show-pt-form" style="background:#1976d2;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;font-size:0.9em;">Thêm phẫu thuật</button>
                </div>
                <div id="dr-pt-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;">
                    <div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>
                </div>
            </div>
            
            <div style="margin-top:20px;">
                <h3 style="margin-bottom:10px;">Log y lệnh</h3>
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <input type="text" id="dr-y-lenh-input" placeholder="Nhập y lệnh (VD: rút sonde tiểu)" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;">
                    <button id="dr-add-y-lenh" style="padding:8px 16px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;">Thêm</button>
                </div>
                <div id="dr-y-lenh-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;">
                    <div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>
                </div>
            </div>
        `;

        // Setup treatment plan auto-save
        const drTreatment = info.querySelector('#dr-treatment');
        if (drTreatment) {
            drTreatment.addEventListener('blur', async function () {
                if (window.checklistObj) {
                    window.checklistState.kehoach = drTreatment.value;
                    const success = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                    if (!success) {
                        console.error('Lưu kế hoạch điều trị thất bại!');
                    }
                }
            });
        }

        // Setup y lệnh functionality
        setupYLenhHandlers(info, patient);

        // Setup phẫu thuật functionality
        setupPhauThuatHandlers(info, patient);

        return info;
    }

    // Helper function to setup y lệnh handlers
    function setupYLenhHandlers(infoElement, patient) {
        const input = infoElement.querySelector('#dr-y-lenh-input');
        const addBtn = infoElement.querySelector('#dr-add-y-lenh');
        const logContainer = infoElement.querySelector('#dr-y-lenh-log');

        // Load existing y lệnh when checklist is loaded
        function loadYLenhLog() {
            if (window.checklistState && window.checklistState.yLenhLog) {
                renderYLenhLog(window.checklistState.yLenhLog);
            }
        }

        // Render y lệnh log
        function renderYLenhLog(yLenhArray) {
            if (!Array.isArray(yLenhArray) || yLenhArray.length === 0) {
                logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>';
                return;
            }

            logContainer.innerHTML = yLenhArray.map((entry, index) => `
                <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;">
                    <button class="remove-y-lenh-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-y-lenh-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        removeYLenh(index);
                    });
                });
            }, 10);
        }

        // Add y lệnh
        function addYLenh() {
            const content = input.value.trim();
            if (!content) return;

            // Initialize yLenhLog if not exists
            if (!window.checklistState.yLenhLog) {
                window.checklistState.yLenhLog = [];
            }

            // Create new entry
            const now = new Date();
            const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const doctorName = 'BS'; // You can customize this to get actual doctor name

            const newEntry = {
                timestamp: `${timestamp} - ${doctorName}`,
                content: content,
                id: Date.now() // Unique ID for easier removal
            };

            // Add to array
            window.checklistState.yLenhLog.unshift(newEntry); // Add to beginning for newest first

            // Save to server
            saveYLenhLog();

            // Clear input and re-render
            input.value = '';
            renderYLenhLog(window.checklistState.yLenhLog);
        }

        // Remove y lệnh
        function removeYLenh(index) {
            if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
                window.checklistState.yLenhLog.splice(index, 1);
                saveYLenhLog();
                renderYLenhLog(window.checklistState.yLenhLog);
            }
        }

        // Save y lệnh log to server
        async function saveYLenhLog() {
            if (window.checklistObj) {
                const success = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                if (!success) {
                    console.error('Lưu log y lệnh thất bại!');
                }
            }
        }

        // Event listeners
        addBtn.addEventListener('click', addYLenh);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addYLenh();
            }
        });

        // Load existing data after a short delay to ensure checklist is loaded
        setTimeout(loadYLenhLog, 100);

        // Store reference to removeYLenh for use in loadYLenhLogFromState
        window.currentRemoveYLenh = removeYLenh;
    }

    // Helper function to setup phẫu thuật handlers
    function setupPhauThuatHandlers(infoElement, patient) {
        const showFormBtn = infoElement.querySelector('#dr-show-pt-form');
        const logContainer = infoElement.querySelector('#dr-pt-log');

        // Create popup form
        function createPhauThuatPopup() {
            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.id = 'dr-pt-popup-backdrop';
            backdrop.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 100001;
                display: flex; align-items: center; justify-content: center;
            `;

            // Create popup
            const popup = document.createElement('div');
            popup.id = 'dr-pt-popup';
            popup.style.cssText = `
                background: white; border-radius: 8px; padding: 24px;
                max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;

            popup.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 16px;">Thêm thông tin phẫu thuật</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <div>
                        <label style="font-size:0.9em;color:#666;">Ngày PT:</label>
                        <input type="text" id="dr-pt-date-popup" placeholder="dd/mm/yyyy" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                    <div>
                        <label style="font-size:0.9em;color:#666;">Giờ PT:</label>
                        <input type="time" id="dr-pt-time-popup" step="300" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.9em;color:#666;">Phương pháp phẫu thuật (PPPT):</label>
                    <input type="text" id="dr-pt-method-popup" placeholder="Nhập PPPT" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="font-size:0.9em;color:#666;margin-bottom:6px;display:block;">Bác sĩ thực hiện:</label>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;">
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Dũng"> BS Dũng</label>
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Quyền"> BS Quyền</label>
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Hằng"> BS Hằng</label>
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Hoài"> BS Hoài</label>
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Hiếu"> BS Hiếu</label>
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Hải"> BS Hải</label>
                        <label><input type="checkbox" class="dr-pt-doctor-popup" value="BS Hưng"> BS Hưng</label>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="dr-cancel-pt" style="background:#666;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Hủy</button>
                    <button id="dr-save-pt" style="background:#1976d2;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Lưu</button>
                </div>
            `;

            backdrop.appendChild(popup);
            document.body.appendChild(backdrop);

            // Add CSS to hide AM/PM field
            const style = document.createElement('style');
            style.textContent = `
                #dr-pt-time-popup::-webkit-datetime-edit-ampm-field { 
                    display: none; 
                }
            `;
            document.head.appendChild(style);

            // Cleanup function to remove the style when popup is closed
            const originalClosePopup = function() {
                document.body.removeChild(backdrop);
                // Remove the injected style
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            };

            // Setup event handlers
            const dateInput = popup.querySelector('#dr-pt-date-popup');
            const timeInput = popup.querySelector('#dr-pt-time-popup');
            const methodInput = popup.querySelector('#dr-pt-method-popup');
            const doctorCheckboxes = popup.querySelectorAll('.dr-pt-doctor-popup');
            const saveBtn = popup.querySelector('#dr-save-pt');
            const cancelBtn = popup.querySelector('#dr-cancel-pt');

            // Set default values
            // Set default date to tomorrow in dd/mm/yyyy format for text input
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = String(tomorrow.getDate()).padStart(2, '0') + '/' + 
                String(tomorrow.getMonth() + 1).padStart(2, '0') + '/' + 
                tomorrow.getFullYear();
            dateInput.value = tomorrowStr;

            // Set default time to 07:30
            timeInput.value = '07:30';

            // Close popup function
            function closePopup() {
                originalClosePopup();
            }

            // Save function
            function savePhauThuat() {
                const date = dateInput.value.trim();
                const time = timeInput.value;
                const method = methodInput.value.trim();
                
                if (!date || !time || !method) {
                    alert('Vui lòng nhập đầy đủ thông tin phẫu thuật!');
                    return;
                }

                // Validate date format dd/mm/yyyy
                const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                const dateMatch = date.match(dateRegex);
                if (!dateMatch) {
                    alert('Vui lòng nhập ngày theo định dạng dd/mm/yyyy!');
                    return;
                }

                const day = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]);
                const year = parseInt(dateMatch[3]);

                // Validate date values
                if (month < 1 || month > 12) {
                    alert('Tháng không hợp lệ (1-12)!');
                    return;
                }
                if (day < 1 || day > 31) {
                    alert('Ngày không hợp lệ (1-31)!');
                    return;
                }

                // Check if date is valid
                const dateObj = new Date(year, month - 1, day);
                if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                    alert('Ngày không tồn tại!');
                    return;
                }

                // Get selected doctors
                const selectedDoctors = Array.from(doctorCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                if (selectedDoctors.length === 0) {
                    alert('Vui lòng chọn ít nhất một bác sĩ!');
                    return;
                }

                // Use the validated date directly (already in dd/mm/yyyy format)
                const formattedDate = date;

                // Initialize phauThuatLog if not exists
                if (!window.checklistState.phauThuatLog) {
                    window.checklistState.phauThuatLog = [];
                }

                // Create new entry
                const newEntry = {
                    date: formattedDate, // Store as dd/mm/yyyy
                    time: time, // Already in HH:MM format
                    method: method,
                    doctors: selectedDoctors.join(', '),
                    id: Date.now() // Unique ID for easier removal
                };

                // Add to array
                window.checklistState.phauThuatLog.unshift(newEntry); // Add to beginning for newest first

                // Save to server
                savePhauThuatLog();

                // Re-render log
                renderPhauThuatLog(window.checklistState.phauThuatLog);

                // Update patient card display
                updatePatientCardPhauThuat(patient);

                // Close popup
                closePopup();
            }

            // Event listeners
            saveBtn.addEventListener('click', savePhauThuat);
            cancelBtn.addEventListener('click', closePopup);
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) {
                    closePopup();
                }
            });
        }

        // Load existing phẫu thuật when checklist is loaded
        function loadPhauThuatLog() {
            if (window.checklistState && window.checklistState.phauThuatLog) {
                renderPhauThuatLog(window.checklistState.phauThuatLog);
            }
        }

        // Render phẫu thuật log
        function renderPhauThuatLog(phauThuatArray) {
            if (!Array.isArray(phauThuatArray) || phauThuatArray.length === 0) {
                logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>';
                return;
            }

            logContainer.innerHTML = phauThuatArray.map((entry, index) => `
                <div class="pt-entry-clickable" data-index="${index}" style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #4caf50;position:relative;cursor:pointer;transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='#fff'">
                    <button class="remove-pt-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;z-index:1;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;"><strong>Ngày PT:</strong> ${entry.date} ${entry.time}</div>
                    <div style="font-weight:bold;color:#333;margin-bottom:2px;"><strong>PPPT:</strong> ${entry.method}</div>
                    <div style="font-size:0.85em;color:#555;"><strong>BS:</strong> ${entry.doctors}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent triggering edit popup
                        const index = parseInt(this.getAttribute('data-index'));
                        removePhauThuat(index);
                    });
                });

                // Add event listeners for edit functionality
                logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                    entry.addEventListener('click', function(e) {
                        // Don't trigger if clicking the remove button
                        if (e.target.classList.contains('remove-pt-btn')) return;
                        
                        const index = parseInt(this.getAttribute('data-index'));
                        editPhauThuat(index);
                    });
                });
            }, 10);
        }

        // Edit phẫu thuật
        function editPhauThuat(index) {
            if (!window.checklistState.phauThuatLog || !window.checklistState.phauThuatLog[index]) {
                console.error('Không tìm thấy dữ liệu phẫu thuật để sửa');
                return;
            }

            const existingEntry = window.checklistState.phauThuatLog[index];
            
            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.id = 'dr-pt-edit-popup-backdrop';
            backdrop.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 100002;
                display: flex; align-items: center; justify-content: center;
            `;

            // Create popup
            const popup = document.createElement('div');
            popup.id = 'dr-pt-edit-popup';
            popup.style.cssText = `
                background: white; border-radius: 8px; padding: 24px;
                max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;

            popup.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 16px;">Sửa thông tin phẫu thuật</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <div>
                        <label style="font-size:0.9em;color:#666;">Ngày PT:</label>
                        <input type="text" id="dr-pt-date-edit" placeholder="dd/mm/yyyy" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;" value="${existingEntry.date}">
                    </div>
                    <div>
                        <label style="font-size:0.9em;color:#666;">Giờ PT:</label>
                        <input type="time" id="dr-pt-time-edit" step="300" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;" value="${existingEntry.time}">
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.9em;color:#666;">Phương pháp phẫu thuật (PPPT):</label>
                    <input type="text" id="dr-pt-method-edit" placeholder="Nhập PPPT" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" value="${existingEntry.method}">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="font-size:0.9em;color:#666;margin-bottom:6px;display:block;">Bác sĩ thực hiện:</label>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;">
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Dũng"> BS Dũng</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Quyền"> BS Quyền</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hằng"> BS Hằng</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hoài"> BS Hoài</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hiếu"> BS Hiếu</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hải"> BS Hải</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hưng"> BS Hưng</label>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="dr-cancel-pt-edit" style="background:#666;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Hủy</button>
                    <button id="dr-save-pt-edit" style="background:#1976d2;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Lưu</button>
                </div>
            `;

            backdrop.appendChild(popup);
            document.body.appendChild(backdrop);

            // Add CSS to hide AM/PM field
            const style = document.createElement('style');
            style.textContent = `
                #dr-pt-time-edit::-webkit-datetime-edit-ampm-field { 
                    display: none; 
                }
            `;
            document.head.appendChild(style);

            // Cleanup function to remove the style when popup is closed
            const originalClosePopup = function() {
                document.body.removeChild(backdrop);
                // Remove the injected style
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            };

            // Setup event handlers
            const dateInput = popup.querySelector('#dr-pt-date-edit');
            const timeInput = popup.querySelector('#dr-pt-time-edit');
            const methodInput = popup.querySelector('#dr-pt-method-edit');
            const doctorCheckboxes = popup.querySelectorAll('.dr-pt-doctor-edit');
            const saveBtn = popup.querySelector('#dr-save-pt-edit');
            const cancelBtn = popup.querySelector('#dr-cancel-pt-edit');

            // Pre-select existing doctors
            const existingDoctors = existingEntry.doctors.split(', ');
            doctorCheckboxes.forEach(cb => {
                if (existingDoctors.includes(cb.value)) {
                    cb.checked = true;
                }
            });

            // Close popup function
            function closePopup() {
                originalClosePopup();
            }

            // Save function
            function saveEditedPhauThuat() {
                const date = dateInput.value.trim();
                const time = timeInput.value;
                const method = methodInput.value.trim();
                
                if (!date || !time || !method) {
                    alert('Vui lòng nhập đầy đủ thông tin phẫu thuật!');
                    return;
                }

                // Validate date format dd/mm/yyyy
                const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                const dateMatch = date.match(dateRegex);
                if (!dateMatch) {
                    alert('Vui lòng nhập ngày theo định dạng dd/mm/yyyy!');
                    return;
                }

                const day = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]);
                const year = parseInt(dateMatch[3]);

                // Validate date values
                if (month < 1 || month > 12) {
                    alert('Tháng không hợp lệ (1-12)!');
                    return;
                }
                if (day < 1 || day > 31) {
                    alert('Ngày không hợp lệ (1-31)!');
                    return;
                }

                // Check if date is valid
                const dateObj = new Date(year, month - 1, day);
                if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                    alert('Ngày không tồn tại!');
                    return;
                }

                // Get selected doctors
                const selectedDoctors = Array.from(doctorCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                if (selectedDoctors.length === 0) {
                    alert('Vui lòng chọn ít nhất một bác sĩ!');
                    return;
                }

                // Update the existing entry
                window.checklistState.phauThuatLog[index] = {
                    ...existingEntry,
                    date: date,
                    time: time,
                    method: method,
                    doctors: selectedDoctors.join(', ')
                };

                // Save to server
                savePhauThuatLog();

                // Re-render log
                renderPhauThuatLog(window.checklistState.phauThuatLog);

                // Update patient card display
                updatePatientCardPhauThuat(patient);

                // Close popup
                closePopup();
            }

            // Event listeners
            saveBtn.addEventListener('click', saveEditedPhauThuat);
            cancelBtn.addEventListener('click', closePopup);
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) {
                    closePopup();
                }
            });
        }

        // Edit phẫu thuật
        function editPhauThuat(index) {
            if (!window.checklistState.phauThuatLog || !window.checklistState.phauThuatLog[index]) {
                console.error('Không tìm thấy dữ liệu phẫu thuật để sửa');
                return;
            }

            const existingEntry = window.checklistState.phauThuatLog[index];
            
            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.id = 'dr-pt-edit-popup-backdrop';
            backdrop.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 100002;
                display: flex; align-items: center; justify-content: center;
            `;

            // Create popup
            const popup = document.createElement('div');
            popup.id = 'dr-pt-edit-popup';
            popup.style.cssText = `
                background: white; border-radius: 8px; padding: 24px;
                max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;

            popup.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 16px;">Sửa thông tin phẫu thuật</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <div>
                        <label style="font-size:0.9em;color:#666;">Ngày PT:</label>
                        <input type="text" id="dr-pt-date-edit" placeholder="dd/mm/yyyy" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;" value="${existingEntry.date}">
                    </div>
                    <div>
                        <label style="font-size:0.9em;color:#666;">Giờ PT:</label>
                        <input type="time" id="dr-pt-time-edit" step="300" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;" value="${existingEntry.time}">
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.9em;color:#666;">Phương pháp phẫu thuật (PPPT):</label>
                    <input type="text" id="dr-pt-method-edit" placeholder="Nhập PPPT" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" value="${existingEntry.method}">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="font-size:0.9em;color:#666;margin-bottom:6px;display:block;">Bác sĩ thực hiện:</label>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;">
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Dũng"> BS Dũng</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Quyền"> BS Quyền</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hằng"> BS Hằng</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hoài"> BS Hoài</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hiếu"> BS Hiếu</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hải"> BS Hải</label>
                        <label><input type="checkbox" class="dr-pt-doctor-edit" value="BS Hưng"> BS Hưng</label>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="dr-cancel-pt-edit" style="background:#666;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Hủy</button>
                    <button id="dr-save-pt-edit" style="background:#1976d2;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Lưu</button>
                </div>
            `;

            backdrop.appendChild(popup);
            document.body.appendChild(backdrop);

            // Add CSS to hide AM/PM field
            const style = document.createElement('style');
            style.textContent = `
                #dr-pt-time-edit::-webkit-datetime-edit-ampm-field { 
                    display: none; 
                }
            `;
            document.head.appendChild(style);

            // Cleanup function to remove the style when popup is closed
            const originalClosePopup = function() {
                document.body.removeChild(backdrop);
                // Remove the injected style
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            };

            // Setup event handlers
            const dateInput = popup.querySelector('#dr-pt-date-edit');
            const timeInput = popup.querySelector('#dr-pt-time-edit');
            const methodInput = popup.querySelector('#dr-pt-method-edit');
            const doctorCheckboxes = popup.querySelectorAll('.dr-pt-doctor-edit');
            const saveBtn = popup.querySelector('#dr-save-pt-edit');
            const cancelBtn = popup.querySelector('#dr-cancel-pt-edit');

            // Pre-select existing doctors
            const existingDoctors = existingEntry.doctors.split(', ');
            doctorCheckboxes.forEach(cb => {
                if (existingDoctors.includes(cb.value)) {
                    cb.checked = true;
                }
            });

            // Close popup function
            function closePopup() {
                originalClosePopup();
            }

            // Save function
            function saveEditedPhauThuat() {
                const date = dateInput.value.trim();
                const time = timeInput.value;
                const method = methodInput.value.trim();
                
                if (!date || !time || !method) {
                    alert('Vui lòng nhập đầy đủ thông tin phẫu thuật!');
                    return;
                }

                // Validate date format dd/mm/yyyy
                const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                const dateMatch = date.match(dateRegex);
                if (!dateMatch) {
                    alert('Vui lòng nhập ngày theo định dạng dd/mm/yyyy!');
                    return;
                }

                const day = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]);
                const year = parseInt(dateMatch[3]);

                // Validate date values
                if (month < 1 || month > 12) {
                    alert('Tháng không hợp lệ (1-12)!');
                    return;
                }
                if (day < 1 || day > 31) {
                    alert('Ngày không hợp lệ (1-31)!');
                    return;
                }

                // Check if date is valid
                const dateObj = new Date(year, month - 1, day);
                if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                    alert('Ngày không tồn tại!');
                    return;
                }

                // Get selected doctors
                const selectedDoctors = Array.from(doctorCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                if (selectedDoctors.length === 0) {
                    alert('Vui lòng chọn ít nhất một bác sĩ!');
                    return;
                }

                // Update the existing entry
                window.checklistState.phauThuatLog[index] = {
                    ...existingEntry,
                    date: date,
                    time: time,
                    method: method,
                    doctors: selectedDoctors.join(', ')
                };

                // Save to server
                savePhauThuatLog();

                // Re-render log
                renderPhauThuatLog(window.checklistState.phauThuatLog);

                // Update patient card display
                updatePatientCardPhauThuat(patient);

                // Close popup
                closePopup();
            }

            // Event listeners
            saveBtn.addEventListener('click', saveEditedPhauThuat);
            cancelBtn.addEventListener('click', closePopup);
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) {
                    closePopup();
                }
            });
        }

        // Remove phẫu thuật
        function removePhauThuat(index) {
            if (window.checklistState.phauThuatLog && Array.isArray(window.checklistState.phauThuatLog)) {
                window.checklistState.phauThuatLog.splice(index, 1);
                savePhauThuatLog();
                renderPhauThuatLog(window.checklistState.phauThuatLog);
                
                // Update patient card display
                updatePatientCardPhauThuat(patient);
            }
        }

        // Save phẫu thuật log to server
        async function savePhauThuatLog() {
            if (window.checklistObj) {
                const success = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                if (!success) {
                    console.error('Lưu log phẫu thuật thất bại!');
                }
            }
        }

        // Event listeners
        showFormBtn.addEventListener('click', createPhauThuatPopup);

        // Load existing data after a short delay to ensure checklist is loaded
        setTimeout(loadPhauThuatLog, 100);

        // Store reference for use in loadPhauThuatLogFromState
        window.currentRemovePhauThuat = removePhauThuat;
        window.currentRenderPhauThuatLog = renderPhauThuatLog;
        window.currentEditPhauThuat = editPhauThuat;
    }

    // Helper function to create checklist section
    function createChecklistSection(patient) {
        const checklistDiv = document.createElement('div');
        checklistDiv.innerHTML = `<h3 style="margin-top:0">Checklist bộ mổ</h3>`;
        
        const checklistUl = document.createElement('ul');
        checklistUl.style = 'overflow-y:auto;padding-left:0;list-style:none;margin:0 0 16px 0;';
        
        checklistDiv.appendChild(checklistUl);
        
        // Load checklist data
        loadChecklist(patient, checklistUl);
        
        return checklistDiv;
    }

    // Helper function to load checklist data
    async function loadChecklist(patient, checklistUl, retryCount = 0) {
        try {
            console.log('DEBUG - dashboard.js loadChecklist called with patient:', JSON.stringify(patient, null, 2));
            
            checklistUl.innerHTML = '<li>Đang tải checklist...</li>';
            
            const res = await ChecklistService.loadChecklistData(patient);
            checklistUl.innerHTML = '';
            
            let checklistObj = ChecklistService.findChecklistObject(res);
            
            if (!checklistObj) {
                checklistUl.innerHTML = '<li>Không có dữ liệu</li>';
                const created = await ChecklistService.createNewChecklist(patient);
                if (created) {
                    loadChecklist(patient, checklistUl, retryCount + 1);
                } else {
                    checklistUl.innerHTML = '<li>Lỗi tạo mới checklist phiếu!</li>';
                    if (retryCount < 1) {
                        setTimeout(() => {
                            const sidebar = document.getElementById('dr-sidebar');
                            const backdrop = document.getElementById('dr-sidebar-backdrop');
                            ModalManager.hideModal(sidebar, backdrop);
                            setTimeout(() => {
                                showSidebar(patient);
                            }, 300);
                        }, 500);
                    }
                }
                return;
            }

            window.checklistObj = checklistObj;
            window.checklistState = ChecklistService.parseChecklistState(checklistObj);
            
            // Update treatment plan if saved in checklist
            if (window.checklistState && window.checklistState.kehoach) {
                const treatmentField = document.getElementById('dr-treatment');
                if (treatmentField) {
                    treatmentField.value = window.checklistState.kehoach;
                }
            }

            // Load y lệnh log if exists
            const yLenhLogContainer = document.getElementById('dr-y-lenh-log');
            if (yLenhLogContainer && window.checklistState && window.checklistState.yLenhLog) {
                loadYLenhLogFromState();
            }

            // Load phẫu thuật log if exists
            const ptLogContainer = document.getElementById('dr-pt-log');
            if (ptLogContainer && window.checklistState && window.checklistState.phauThuatLog) {
                loadPhauThuatLogFromState();
            }

            // Render checklist items
            renderChecklistItems(checklistUl);
            
        } catch (error) {
            console.error('Error loading checklist:', error);
            checklistUl.innerHTML = '<li>Lỗi tải checklist</li>';
        }
    }

    // Helper function to load y lệnh log from state
    function loadYLenhLogFromState() {
        const logContainer = document.getElementById('dr-y-lenh-log');
        if (!logContainer) return;

        function renderYLenhLog(yLenhArray) {
            if (!Array.isArray(yLenhArray) || yLenhArray.length === 0) {
                logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>';
                return;
            }

            logContainer.innerHTML = yLenhArray.map((entry, index) => `
                <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;">
                    <button class="remove-y-lenh-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-y-lenh-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        if (window.currentRemoveYLenh) {
                            window.currentRemoveYLenh(index);
                        } else {
                            // Fallback removal function
                            if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
                                window.checklistState.yLenhLog.splice(index, 1);
                                // Re-render after removal
                                renderYLenhLog(window.checklistState.yLenhLog);
                                // Save to server
                                if (window.checklistObj) {
                                    ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                                }
                            }
                        }
                    });
                });
            }, 10);
        }

        if (window.checklistState && window.checklistState.yLenhLog) {
            renderYLenhLog(window.checklistState.yLenhLog);
        }
    }

    // Helper function to load phẫu thuật log from state
    function loadPhauThuatLogFromState() {
        const logContainer = document.getElementById('dr-pt-log');
        if (!logContainer) return;

        // Use the current render function if available
        if (window.currentRenderPhauThuatLog && window.checklistState && window.checklistState.phauThuatLog) {
            window.currentRenderPhauThuatLog(window.checklistState.phauThuatLog);
            return;
        }

        // Fallback render function
        function renderPhauThuatLog(phauThuatArray) {
            if (!Array.isArray(phauThuatArray) || phauThuatArray.length === 0) {
                logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>';
                return;
            }

            logContainer.innerHTML = phauThuatArray.map((entry, index) => `
                <div class="pt-entry-clickable" data-index="${index}" style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #4caf50;position:relative;cursor:pointer;transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='#fff'">
                    <button class="remove-pt-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;z-index:1;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;"><strong>Ngày PT:</strong> ${entry.date} ${entry.time}</div>
                    <div style="font-weight:bold;color:#333;margin-bottom:2px;"><strong>PPPT:</strong> ${entry.method}</div>
                    <div style="font-size:0.85em;color:#555;"><strong>BS:</strong> ${entry.doctors}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent triggering edit popup
                        const index = parseInt(this.getAttribute('data-index'));
                        if (window.currentRemovePhauThuat) {
                            window.currentRemovePhauThuat(index);
                        } else {
                            // Fallback removal function
                            if (window.checklistState.phauThuatLog && Array.isArray(window.checklistState.phauThuatLog)) {
                                window.checklistState.phauThuatLog.splice(index, 1);
                                // Re-render after removal
                                renderPhauThuatLog(window.checklistState.phauThuatLog);
                                // Save to server
                                if (window.checklistObj) {
                                    ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                                }
                            }
                        }
                    });
                });

                // Add event listeners for edit functionality
                logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                    entry.addEventListener('click', function(e) {
                        // Don't trigger if clicking the remove button
                        if (e.target.classList.contains('remove-pt-btn')) return;
                        
                        const index = parseInt(this.getAttribute('data-index'));
                        if (window.currentEditPhauThuat) {
                            window.currentEditPhauThuat(index);
                        } else {
                            console.warn('Edit function not available');
                        }
                    });
                });
            }, 10);
        }

        if (window.checklistState && window.checklistState.phauThuatLog) {
            renderPhauThuatLog(window.checklistState.phauThuatLog);
        }
    }

    // Helper function to render checklist items
    function renderChecklistItems(checklistUl) {
        checklistItems.forEach((item, idx) => {
            const li = document.createElement('li');
            li.style = 'margin-bottom:8px;';
            const id = 'dr-checklist-' + idx;
            li.innerHTML = `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" ${window.checklistState[item] ? 'checked' : ''}>${item}</label>`;
            checklistUl.appendChild(li);
        });

        // Setup checkbox change handlers
        setTimeout(() => {
            checklistUl.querySelectorAll('input[type=checkbox]').forEach(cb => {
                cb.addEventListener('change', async function () {
                    window.checklistState[this.parentNode.textContent.trim()] = this.checked;
                    console.log('Checklist state updated:', window.checklistState, window.checklistObj);
                    
                    const success = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                    if (!success) {
                        console.error('Lưu checklist thất bại!');
                    }
                });
            });
        }, 10);
    }

    function showSidebar(patient) {
        const backdrop = ModalManager.getOrCreateBackdrop();
        const sidebar = ModalManager.getOrCreateSidebar();
        
        // Clear and setup sidebar
        sidebar.innerHTML = '';
        sidebar.style = `position:fixed;top:0;right:0;width:80vw;max-width:80vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;`;
        
        // Patient info form
        const info = createPatientInfoSection(patient);
        sidebar.appendChild(info);
        
        // Checklist section
        const checklistDiv = createChecklistSection(patient);
        sidebar.appendChild(checklistDiv);
        
        // Close button
        const closeBtn = ModalManager.setupCloseHandlers(sidebar, backdrop);
        sidebar.appendChild(closeBtn);
        
        // Show modal
        ModalManager.showModal(sidebar, backdrop);
    }
    function renderCards(data) {
        console.log('Rendering patient cards with data:', data);
        
        // Sort patients before rendering
        const sortedData = PatientDataMapper.sortPatients([...data]);
        console.log('Sorted patient data:', sortedData);
        
        document.body.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'dr-card-list';
        
        sortedData.forEach(item => {
            const card = createPatientCard(item);
            container.appendChild(card);
        });
        
        document.body.appendChild(container);
        
        // Add bottom bar
        createBottomBar(sortedData.length);

        // Store refresh function globally for background enrichment
        window.refreshPatientCards = function(newData) {
            console.log('Refreshing patient cards with new data');
            const sortedNewData = PatientDataMapper.sortPatients([...newData]);
            
            // Update existing cards instead of full re-render to avoid interrupting user
            sortedNewData.forEach((item, index) => {
                const card = container.children[index];
                if (card && item.phauThuatInfo) {
                    // Find and update surgery info container
                    const ptInfoContainer = card.querySelector('.dr-pt-info');
                    if (ptInfoContainer) {
                        const ptData = item.phauThuatInfo;
                        const dateTime = ptData.ngayPhauThuat && ptData.gioPhauThuat ? 
                            `${ptData.ngayPhauThuat} ${ptData.gioPhauThuat}` : 
                            (ptData.ngayPhauThuat || '');
                        
                        ptInfoContainer.innerHTML = `
                            <div class="dr-value"><span class="dr-label">PPPT:</span> ${ptData.pppt || ''}</div>
                            <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
                        `;
                        
                        console.log('Updated surgery info for card:', item.mabn);
                    }
                }
            });
        };
    }

    // Helper function to create patient card
    function createPatientCard(item) {
        const room = item.teN_PHONG || '';
        const isWhite = PatientDataMapper.isWhiteCard(room);
        const card = document.createElement('div');
        card.className = 'dr-card' + (isWhite ? '' : ' dr-blue');
        
        // Format location using the new utility function
        const formattedLocation = PatientDataMapper.formatRoomLocation(
            item.teN_PHONG, 
            item.teN_GIUONG, 
            item.teN_TANG, 
            item.teN_TOANHA
        );

        // Debug logging
        console.log('Creating card for patient:', item.mabn, 'phauThuatInfo:', item.phauThuatInfo);

        // Get latest phẫu thuật info if available
        let ptInfo = '';
        if (item.phauThuatInfo) {
            const ptData = item.phauThuatInfo;
            const dateTime = ptData.ngayPhauThuat && ptData.gioPhauThuat ? 
                `${ptData.ngayPhauThuat} ${ptData.gioPhauThuat}` : 
                (ptData.ngayPhauThuat || '');
            
            console.log('Surgery info found for patient:', item.mabn, 'PPPT:', ptData.pppt, 'DateTime:', dateTime);
            
            ptInfo = `<div class="dr-pt-info">
                <div class="dr-value"><span class="dr-label">PPPT:</span> ${ptData.pppt || ''}</div>
                <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
            </div>`;
        } else {
            console.log('No surgery info for patient:', item.mabn);
            ptInfo = '<div class="dr-pt-info"></div>';
        }
        
        card.innerHTML = `
            <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span> - ${item.phai === 1 ? 'Nữ' : 'Nam'} - ${formattedLocation}</h2>
            <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
            <div class="dr-value"><span class="dr-label">Chẩn đoán:</span> ${item.chandoanvk || ''}</div>
            ${ptInfo}
        `;
        
        // Add action buttons
        const btnGroup = createActionButtons(item);
        card.appendChild(btnGroup);
        
        // Add click handler to show sidebar
        card.onclick = () => showSidebar(item);
        
        return card;
    }

    // Helper function to update patient card surgery info
    function updatePatientCardPhauThuat(patient) {
        // Find patient card in DOM
        const cards = document.querySelectorAll('.dr-card');
        for (let card of cards) {
            const cardTitle = card.querySelector('h2');
            if (cardTitle && cardTitle.textContent.includes(patient.mabn)) {
                // Get latest surgery info from checklistState
                let ptInfo = '';
                if (window.checklistState && window.checklistState.phauThuatLog && window.checklistState.phauThuatLog.length > 0) {
                    const latestPT = window.checklistState.phauThuatLog[0]; // Latest is first
                    const dateTime = latestPT.date && latestPT.time ? 
                        `${latestPT.date} ${latestPT.time}` : 
                        (latestPT.date || '');
                    
                    ptInfo = `
                        <div class="dr-value"><span class="dr-label">PPPT:</span> ${latestPT.method || ''}</div>
                        <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
                    `;
                }

                // Find existing surgery info container and update
                const existingPTContainer = card.querySelector('.dr-pt-info');
                if (existingPTContainer) {
                    existingPTContainer.innerHTML = ptInfo;
                }
                break;
            }
        }
    }

    // Helper function to create action buttons
    function createActionButtons(item) {
        const btnToDieuTri = createToDieuTriButton(item);
        const btnHsba2 = createHsbaButton(item);
        
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '8px';
        btnGroup.style.justifyContent = 'flex-end';
        btnGroup.style.alignItems = 'center';
        btnGroup.style.position = 'absolute';
        btnGroup.style.right = '16px';
        btnGroup.style.bottom = '12px';
        
        btnGroup.appendChild(btnToDieuTri);
        btnGroup.appendChild(btnHsba2);
        
        return btnGroup;
    }

    // Helper function to create "Tờ điều trị" button
    function createToDieuTriButton(item) {
        const btn = document.createElement('button');
        btn.className = 'dr-detail-btn no-print';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-4.97 0-8.19-4.16-8.94-5C3.81 10.16 7.03 6 12 6s8.19 4.16 8.94 5c-.75.84-3.97 5-8.94 5zm0-8a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/></svg>Tờ điều trị`;
        btn.style.position = 'static';
        btn.onclick = e => {
            e.stopPropagation();
            if (item.mabn) {
                window.open(`/to-dieu-tri?mabn=${encodeURIComponent(item.mabn)}`, '_blank');
            }
        };
        return btn;
    }

    // Helper function to create "HSBA V2" button
    function createHsbaButton(item) {
        const btnHsba2 = document.createElement('button');
        btnHsba2.className = 'dr-detail-btn no-print';
        btnHsba2.style.position = 'static';
        btnHsba2.style.marginLeft = '8px';
        btnHsba2.textContent = 'HSBA V2';
        btnHsba2.onclick = async function (e) {
            e.stopPropagation();
            try {
                const response = await fetch('/ToDieuTri/LoadLinkHsba', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include',
                    body: 'code=' + encodeURIComponent(item.mabn)
                });
                
                const result = await response.json();
                if (result && result.data && result.data.link) {
                    window.open(result.data.link, '_blank');
                } else {
                    console.error('Không lấy được link HSBA V2');
                }
            } catch (error) {
                console.error('Lỗi khi load link HSBA V2:', error);
            }
        };
        return btnHsba2;
    }

    // Helper function to create bottom bar
    function createBottomBar(patientCount) {
        const bottomBar = document.createElement('div');
        bottomBar.className = 'dr-bottom-bar';
        bottomBar.innerHTML = `
            <div class="dr-bottom-bar-left">Tổng số bệnh nhân: ${patientCount}</div>
            <button id="dr-btn-direct-report" class="btn btn-warning" style="font-weight:bold;">Tạo báo cáo trực</button>
        `;
        document.body.appendChild(bottomBar);
        
        // Add bottom bar styles
        addBottomBarStyles();
        
        // Setup direct report button
        setTimeout(() => {
            const btn = document.getElementById('dr-btn-direct-report');
            if (btn) btn.onclick = createDirectReportGeneration;
        }, 10);
    }

    // Helper function to add bottom bar styles
    function addBottomBarStyles() {
        const barStyle = document.createElement('style');
        barStyle.textContent = `
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
            .dr-bottom-bar-left {
                color: #1976d2;
                font-weight: bold;
            }
            @media (max-width: 600px) {
                .dr-bottom-bar { flex-direction: column; height: auto; padding: 8px 8px; }
            }
        `;
        document.head.appendChild(barStyle);
    }
    // Main logic
    async function initializeDashboard() {
        const data = await PatientService.loadPatientDataWithErrorHandling();
        if (data) {
            renderCards(data);
        }
    }

    // Start dashboard initialization
    initializeDashboard();
}

module.exports = {
    showDashboardBenhNhanIfNeeded
};

},{"./components/loginHandler":4,"./components/modalManager":5,"./dashboard.support":7,"./services/checklistService":10,"./services/patientService":11,"./utils":13,"./utils/patientDataMapper":15}],7:[function(require,module,exports){
// dashboard.support.js - Refactored with modular architecture

const ReportService = require('./services/reportService');
const ApiService = require('./services/apiService');
const DialogManager = require('./components/dialogManager');

/**
 * Create direct report generation dialog
 */
async function createDirectReportGeneration() {
    const data = window.dr_data || [];
    
    // Create dialog
    const { dialog, inner } = DialogManager.createDialog('dr-direct-report-dialog');
    
    try {
        // Show loading state
        inner.innerHTML = `
            <div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>
            <div style="text-align:center;padding:20px;">
                <div>Đang tải dữ liệu báo cáo...</div>
            </div>
        `;
        
        // Get treatment plans for all patients (already sorted)
        const { sortedPatients, treatmentPlans } = await ReportService.getBatchTreatmentPlans(data);
        
        // Generate report content
        const htmlContent = ReportService.generateHTMLReport(sortedPatients, treatmentPlans);
        const textReport = ReportService.generateTextReport(sortedPatients, treatmentPlans);
        
        // Create action buttons
        const buttons = DialogManager.createActionButtons([
            {
                id: 'dr-copy-direct-report',
                className: 'btn btn-primary',
                text: 'Copy báo cáo',
                onclick: () => copyReportToClipboard(textReport)
            },
            {
                id: 'dr-close-direct-report',
                className: 'btn btn-secondary',
                text: 'Đóng',
                onclick: () => dialog.remove()
            }
        ]);
        
        // Update dialog content
        inner.innerHTML = htmlContent;
        inner.appendChild(buttons);
        
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
        }
        .dr-card { 
            background: #fff; 
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
        }
        .dr-card .dr-detail-btn svg { 
            margin-right: 4px; 
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
        @media print {
            .no-print { 
                display: none !important; 
            }
            .dr-card, .dr-card.dr-blue {
                background: #fff !important;
                border: 2px solid #888 !important;
                color: #000 !important;
            }
            .dr-card h2 {
                color: #000 !important;
            }
            .dr-bottom-bar {
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
    updateChecklistPhieu,
    createChecklistPhieu
};

},{"./components/dialogManager":3,"./services/apiService":9,"./services/reportService":12}],8:[function(require,module,exports){
// googleAppsScript.js

function GoogleAppsScriptUploader(googleAppsScriptUrl) {
    this.url = googleAppsScriptUrl;
}

GoogleAppsScriptUploader.prototype.uploadPatientList = function () {
    if (!window.dr_data || !Array.isArray(window.dr_data) || window.dr_data.length === 0) {
        console.error('Không có dữ liệu bệnh nhân để upload lên Google Apps Script!');
        return;
    }
    console.log('Đang tải dữ liệu bệnh nhân lên Google Apps Script (sử dụng GM_xmlhttpRequest để xử lý CORS)...');
    var requestBody = {
        function: 'doPost',
        parameters: [window.dr_data],
    };
    var self = this;
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: self.url,
            headers: {
                'Content-Type': 'application/json'
            },
            redirects: 'follow',
            data: JSON.stringify(requestBody),
            onload: function (response) {
                try {
                    console.log('Phản hồi từ Google Apps Script:', response);
                    var result = JSON.parse(response.responseText);
                    if (response.status >= 200 && response.status < 300) {
                        console.log('Đã gửi danh sách bệnh nhân lên Google Apps Script thành công!');
                        console.log('Kết quả từ Google Apps Script:', result);
                        resolve(result);
                    } else {
                        console.error('Lỗi khi gửi lên Google Apps Script: ' + (result.error && result.error.message ? result.error.message : 'HTTP Status ' + response.status));
                        console.error('Lỗi từ Google Apps Script:', result);
                        reject(new Error(result.error && result.error.message ? result.error.message : 'HTTP Status ' + response.status));
                    }
                } catch (e) {
                    console.error('Lỗi phân tích phản hồi từ Google Apps Script: ' + e.message);
                    console.error('Lỗi phân tích phản hồi:', e, response.responseText);
                    reject(new Error('Failed to parse response from Google Apps Script.'));
                }
            },
            onerror: function (error) {
                console.error('Lỗi mạng khi gửi lên Google Apps Script: ' + error.statusText);
                console.error('Lỗi mạng (GM_xmlhttpRequest):', error);
                reject(new Error('Network error or failed to connect to Google Apps Script.'));
            },
            ontimeout: function (error) {
                console.error('Yêu cầu tới Google Apps Script bị hết thời gian: ' + error.statusText);
                console.error('Yêu cầu hết thời gian (GM_xmlhttpRequest):', error);
                reject(new Error('Request to Google Apps Script timed out.'));
            }
        });
    });
};

GoogleAppsScriptUploader.prototype.addUploadButton = function () {
    var btn = document.createElement('button');
    btn.innerText = 'Đăng lên Google Sheet';
    btn.style.position = 'fixed';
    btn.style.left = '20px';
    btn.style.bottom = '70px';
    btn.style.background = '#4285F4';
    btn.style.color = '#fff';
    btn.style.padding = '10px 18px';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = 9999;
    btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    btn.onclick = this.uploadPatientList.bind(this);
    document.body.appendChild(btn);
};

var GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz48_viXo1mjhk-W2CsDbxLuFLFHyD2I7k2UchSmZROjqRC9S4hCRvbNmNOY5nP8HVBnA/exec';

module.exports = {
    GoogleAppsScriptUploader: GoogleAppsScriptUploader,
    GOOGLE_APPS_SCRIPT_URL: GOOGLE_APPS_SCRIPT_URL
};

},{}],9:[function(require,module,exports){
// apiService.js - Centralized API service

const ApiService = {
    /**
     * Fetch patient data from ToDieuTri endpoint
     */
    async fetchToDieuTriData() {
        try {
            const formData = new FormData();
            formData.append('khoa', '551');
            formData.append('tk', '0');
            formData.append('cbAll', '1');

            const response = await fetch('/ToDieuTri/Search', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': '*/*'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return data;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu ToDieuTri:', error);
            throw error;
        }
    },

    /**
     * Update checklist data
     */
    async updateChecklistData(oldData, checklistState) {
        try {
            const formData = new FormData();
            
            // Add all old data fields
            for (const key in oldData) {
                if (Object.prototype.hasOwnProperty.call(oldData, key)) {
                    formData.append(key.toLowerCase(), oldData[key] == null ? '' : oldData[key]);
                }
            }
            
            // Update checklist state
            formData.set('chuky', JSON.stringify(checklistState));

            const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/EditAjax', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            return response.json();
        } catch (error) {
            console.error('Lỗi cập nhật checklist phiếu:', error);
            throw error;
        }
    },

    /**
     * Create new checklist for patient
     */
    async createChecklistForPatient(patient) {
        try {
            const formData = new FormData();
            formData.append('status', '1');
            formData.append('thebaohiemyte', patient.thebaohiemyte || 'Không');
            formData.append('chuky', '{}');
            formData.append('khac', '--*--');
            formData.append('khu', patient.khu || '1');
            formData.append('mabn', patient.mabn + 9898);
            formData.append('bieumauid', '027');
            formData.append('makp', patient.makp || '551');
            formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
            formData.append('actiontype', '');
            formData.append('hoten', (patient.hoten || '') + "%");
            formData.append('ngaysinh', '10/10/1999');
            formData.append('gioitinh', patient.phai === 1 ? 'Nữ' : 'Nam');
            formData.append('diachi', patient.diachi || '');
            formData.append('sdt', patient.sdt || '');

            const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            return response.json();
        } catch (error) {
            console.error('Lỗi tạo mới checklist phiếu:', error);
            throw error;
        }
    }
};

module.exports = ApiService;

},{}],10:[function(require,module,exports){
// checklistService.js - Centralized checklist management

const DateUtils = require('../utils/dateUtils');
const ApiService = require('./apiService');

const ChecklistService = {
    /**
     * Load checklist data for a patient
     */
    async loadChecklistData(patient) {
        const formData = new FormData();
        
        // DEBUG: Try both with and without 9898 suffix
        const originalMabn = patient.mabn;
        const mabnWith9898 = patient.mabn + 9898;
        
        console.log('DEBUG - Trying both mabn formats:', { originalMabn, mabnWith9898 });
        
        // First try with 9898 suffix (original logic)
        formData.append('mabn', mabnWith9898);
        
        const { tungay, denngay } = DateUtils.getChecklistDateRange(patient.ngayvv);
        console.log('DEBUG - DateUtils.getChecklistDateRange result:', { 
            inputNgayvv: patient.ngayvv, 
            outputTungay: tungay, 
            outputDenngay: denngay 
        });
        
        formData.append('tungay', tungay);
        formData.append('denngay', denngay);

        const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();
        console.log('DEBUG - ChecklistService.loadChecklistData API response (with 9898):', result);
        
        // If no data found with 9898 suffix, try without it
        if (!result.data || result.data.length === 0) {
            console.log('DEBUG - No data with 9898 suffix, trying original mabn:', originalMabn);
            
            const fallbackFormData = new FormData();
            fallbackFormData.append('mabn', originalMabn);
            fallbackFormData.append('tungay', tungay);
            fallbackFormData.append('denngay', denngay);
            
            const fallbackResponse = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: fallbackFormData
            });
            
            const fallbackResult = await fallbackResponse.json();
            console.log('DEBUG - ChecklistService.loadChecklistData API response (original mabn):', fallbackResult);
            
            return fallbackResult;
        }
        
        return result;
    },

    /**
     * Find existing checklist object from response data
     */
    findChecklistObject(responseData) {
        console.log('DEBUG - findChecklistObject input:', responseData);
        
        if (!responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
            console.log('DEBUG - No data array or empty array');
            return null;
        }

        console.log('DEBUG - Searching through', responseData.data.length, 'checklist objects');
        
        for (let i = 0; i < responseData.data.length; i++) {
            const item = responseData.data[i];
            console.log(`DEBUG - Checklist object ${i}:`, item);
            
            if (typeof item.hoten === 'string' && item.hoten.trim().endsWith('%')) {
                console.log('DEBUG - Found matching checklist object with hoten ending with %');
                return item;
            }
        }
        
        console.log('DEBUG - No matching checklist object found');
        return null;
    },

    /**
     * Parse checklist state from checklist object
     */
    parseChecklistState(checklistObj) {
        let state = {};
        if (checklistObj && checklistObj.chuky) {
            try {
                state = JSON.parse(checklistObj.chuky);
            } catch (e) {
                console.warn('Failed to parse checklist state:', e);
                state = {};
            }
        }
        return state;
    },

    /**
     * Load checklist state for a patient (combination of loadChecklistData and parseChecklistState)
     */
    async loadChecklistState(checklistObj) {
        try {
            // If we already have a checklist object, just parse its state
            if (checklistObj && checklistObj.chuky) {
                return this.parseChecklistState(checklistObj);
            }

            // Otherwise, we need to construct a patient object and load data
            const patient = {
                mabn: checklistObj.mabn,
                mavaovien: checklistObj.mavaovien,
                ngayvv: checklistObj.tungay // Use tungay as ngayvv for date range calculation
            };

            console.log('DEBUG - checklistService.loadChecklistState patient object:', patient);

            const responseData = await this.loadChecklistData(patient);
            const foundChecklistObj = this.findChecklistObject(responseData);
            
            if (foundChecklistObj) {
                return this.parseChecklistState(foundChecklistObj);
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to load checklist state:', error);
            return null;
        }
    },

    /**
     * Update checklist state on server
     */
    async updateChecklistState(checklistObj, checklistState) {
        try {
            const result = await ApiService.updateChecklistData(checklistObj, checklistState);
            return result && result.Status == 1;
        } catch (error) {
            console.error('Failed to update checklist state:', error);
            return false;
        }
    },

    /**
     * Create new checklist for patient
     */
    async createNewChecklist(patient) {
        try {
            const result = await ApiService.createChecklistForPatient(patient);
            return result && result.isValid;
        } catch (error) {
            console.error('Failed to create new checklist:', error);
            return false;
        }
    }
};

module.exports = ChecklistService;

},{"../utils/dateUtils":14,"./apiService":9}],11:[function(require,module,exports){
// patientService.js - Centralized patient data fetching

const { fetchToDieuTriData } = require('../dashboard.support');
const PatientDataMapper = require('../utils/patientDataMapper');
const LoginHandler = require('../components/loginHandler');
const ChecklistService = require('./checklistService');

const PatientService = {
    /**
     * Fetch and process patient data
     */
    async fetchPatientData() {
        try {
            const data = await fetchToDieuTriData();
            console.log('Dữ liệu ToDieuTri đã được lấy:', data);
            
            let arr = Array.isArray(data) ? data : (data && data.data ? data.data : []);
            
            if (!arr || arr.length === 0) {
                return [];
            }

            // DEBUG: Check raw tungay format before mapping
            console.log('DEBUG - Raw tungay format from API:');
            arr.slice(0, 3).forEach((item, index) => {
                console.log(`Raw item ${index + 1} - mabn: ${item.mabn}, tungay: ${item.tungay}, typeof: ${typeof item.tungay}`);
            });

            return PatientDataMapper.mapPatientArray(arr);
        } catch (error) {
            console.error('Error fetching patient data:', error);
            throw error;
        }
    },

    /**
     * Enrich patient data with checklist information including surgery data
     */
    async enrichPatientDataWithChecklist(patients) {
        if (!Array.isArray(patients) || patients.length === 0) {
            return patients;
        }

        console.log('Starting to enrich patient data with checklist information for', patients.length, 'patients');

        // DEBUG: Check tungay format in the first few patients
        console.log('DEBUG - Sample patient data tungay format:');
        patients.slice(0, 3).forEach((patient, index) => {
            console.log(`Patient ${index + 1} - mabn: ${patient.mabn}, tungay: ${patient.tungay}, typeof: ${typeof patient.tungay}`);
        });

        // Process patients in batches to avoid overwhelming the server
        const batchSize = 5;
        const enrichedPatients = [...patients]; // Copy array to avoid mutation

        for (let i = 0; i < patients.length; i += batchSize) {
            const batch = patients.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(patients.length/batchSize)}`);
            
            const batchPromises = batch.map(async (patient, batchIndex) => {
                const actualIndex = i + batchIndex;
                try {
                    // Create checklist object for this patient
                    // Use patient's ngayvv (actual admission date) instead of old tungay
                    console.log('DEBUG - Patient ngayvv:', patient.ngayvv);
                    console.log('DEBUG - Background enrichment patient object:', JSON.stringify(patient, null, 2));
                    
                    const checklistObj = {
                        mabn: patient.mabn,
                        mavaovien: patient.mavaovien,
                        tungay: patient.ngayvv // Use ngayvv (admission date) instead of tungay
                    };

                    console.log('Loading checklist for patient:', patient.mabn, 'with ngayvv:', patient.ngayvv);

                    // Load checklist state
                    const checklistState = await ChecklistService.loadChecklistState(checklistObj);
                    if (checklistState) {
                        console.log('Checklist state loaded for patient:', patient.mabn, checklistState);
                        
                        // Map surgery data from checklist
                        const surgeryData = PatientDataMapper.mapPhauThuatData(checklistState);
                        if (surgeryData) {
                            console.log('Surgery data mapped for patient:', patient.mabn, surgeryData);
                            enrichedPatients[actualIndex].phauThuatInfo = surgeryData;
                        } else {
                            console.log('No surgery data found for patient:', patient.mabn);
                        }
                    } else {
                        console.log('No checklist state found for patient:', patient.mabn);
                    }
                } catch (error) {
                    console.warn('Failed to load checklist for patient:', patient.mabn, error);
                }
            });

            // Wait for current batch to complete before proceeding
            await Promise.all(batchPromises);
            
            // Small delay between batches to be nice to the server
            if (i + batchSize < patients.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('Enrichment completed. Patients with surgery info:', 
            enrichedPatients.filter(p => p.phauThuatInfo).length);

        return enrichedPatients;
    },

    /**
     * Get patient data from window.dr_data or fetch from API
     */
    async getPatientData() {
        // Check if data already exists in window
        if (window.dr_data && Array.isArray(window.dr_data) && window.dr_data.length > 0) {
            return window.dr_data;
        }

        // Check if fetch function is available
        if (typeof fetchToDieuTriData !== 'function') {
            throw new Error('fetchToDieuTriData function not available');
        }

        // Fetch basic patient data from API first (fast)
        const basicData = await this.fetchPatientData();
        
        // Store basic data immediately for fast initial render
        window.dr_data = basicData;
        
        // Start enrichment in background (don't wait for it)
        this.enrichPatientDataInBackground(basicData);
        
        return basicData;
    },

    /**
     * Enrich patient data in background without blocking initial render
     */
    async enrichPatientDataInBackground(patients) {
        console.log('Starting background enrichment for', patients.length, 'patients');
        
        try {
            const enrichedData = await this.enrichPatientDataWithChecklist(patients);
            
            // Update the global data
            window.dr_data = enrichedData;
            
            // Trigger re-render of cards with updated data
            if (typeof window.refreshPatientCards === 'function') {
                window.refreshPatientCards(enrichedData);
            }
            
            console.log('Background enrichment completed');
        } catch (error) {
            console.error('Background enrichment failed:', error);
        }
    },

    /**
     * Load surgery info for a specific patient (for immediate use)
     */
    async loadPatientSurgeryInfo(patient) {
        try {
            const checklistObj = {
                mabn: patient.mabn,
                mavaovien: patient.mavaovien,
                tungay: patient.tungay
            };

            const checklistState = await ChecklistService.loadChecklistState(checklistObj);
            if (checklistState) {
                const surgeryData = PatientDataMapper.mapPhauThuatData(checklistState);
                return surgeryData;
            }
            return null;
        } catch (error) {
            console.warn('Failed to load surgery info for patient:', patient.mabn, error);
            return null;
        }
    },

    /**
     * Handle patient data loading with error handling
     */
    async loadPatientDataWithErrorHandling() {
        try {
            return await this.getPatientData();
        } catch (error) {
            console.error('Failed to load patient data:', error);
            LoginHandler.handleLoginRequired();
            return null;
        }
    }
};

module.exports = PatientService;

},{"../components/loginHandler":4,"../dashboard.support":7,"../utils/patientDataMapper":15,"./checklistService":10}],12:[function(require,module,exports){
// reportService.js - Service for generating reports

const DateUtils = require('../utils/dateUtils');
const PatientDataMapper = require('../utils/patientDataMapper');

const ReportService = {
    /**
     * Get treatment plan for a patient
     */
    async getPatientTreatmentPlan(mabn, ngayvv) {
        try {
            const formData = new FormData();
            formData.append('mabn', mabn + 9898);
            
            const { tungay, denngay } = DateUtils.getChecklistDateRange(ngayvv);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);

            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const res = await response.json();
            
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const obj = res.data[res.data.length - 1];
                let state = {};
                
                if (obj && obj.chuky) {
                    try {
                        state = JSON.parse(obj.chuky);
                    } catch (e) {
                        console.warn('Failed to parse treatment plan state:', e);
                        state = {};
                    }
                }
                
                return state.kehoach || '';
            }
            
            return '';
        } catch (error) {
            console.error('Error getting treatment plan:', error);
            return '';
        }
    },

    /**
     * Get treatment plans for multiple patients
     */
    async getBatchTreatmentPlans(patients) {
        // Sort patients first to maintain order in report
        const sortedPatients = PatientDataMapper.sortPatients([...patients]);
        
        const promises = sortedPatients.map(patient => 
            this.getPatientTreatmentPlan(patient.mabn, patient.ngayvv)
        );
        
        const treatmentPlans = await Promise.all(promises);
        
        return { sortedPatients, treatmentPlans };
    },

    /**
     * Format patient data for report
     */
    formatPatientData(patient, index, treatmentPlan = '') {
        const { dob, age } = this.formatDateOfBirth(patient.ngaysinh);
        const gender = patient.phai === 1 ? 'Nữ' : 'Nam';
        
        return {
            index: index + 1,
            name: patient.hoten || '',
            mabn: patient.mabn || '',
            dob,
            age,
            gender,
            room: patient.teN_PHONG || '',
            bed: patient.teN_GIUONG || '',
            diagnosis: patient.chandoanvk || '',
            treatmentPlan
        };
    },

    /**
     * Format date of birth and calculate age
     */
    formatDateOfBirth(ngaysinh) {
        let dob = '';
        let age = '';
        
        if (ngaysinh) {
            let d = ngaysinh.split('T')[0];
            
            if (d.includes('-')) {
                const [y, m, day] = d.split('-');
                dob = `${day}/${m}/${y}`;
                age = (new Date().getFullYear() - parseInt(y, 10)).toString() + 't';
            } else if (d.includes('/')) {
                dob = d;
                const y = d.split('/')[2];
                age = (new Date().getFullYear() - parseInt(y, 10)).toString() + 't';
            }
        }
        
        return { dob, age };
    },

    /**
     * Generate HTML report content
     */
    generateHTMLReport(patients, treatmentPlans) {
        let html = `<div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>`;
        html += `<div style="margin-bottom:10px">Số lượng bệnh nhân hiện có: <b>${patients.length}</b></div>`;
        
        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, treatmentPlans[idx]);
            
            html += `<div style='margin-bottom:12px'>`;
            html += `<h3 style='font-size:1em;margin:0 0 2px 0'><strong>${data.index}. ${data.name} - ${data.mabn}</strong> - ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed} - </h3>`;
            html += `<div><b>Chẩn đoán</b>: ${data.diagnosis}</div>`;
            html += `<div><b>Điều trị</b>: ${data.treatmentPlan}</div>`;
            html += `</div>`;
        });
        
        return html;
    },

    /**
     * Generate plain text report content
     */
    generateTextReport(patients, treatmentPlans) {
        let report = `BÁO CÁO TRỰC\nSố lượng bệnh nhân hiện có: ${patients.length}\n`;
        
        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, treatmentPlans[idx]);
            
            report += `${data.index}. ${data.bed} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
            report += `   Chẩn đoán: ${data.diagnosis}\n`;
            report += `   Điều trị: ${data.treatmentPlan}\n`;
        });
        
        return report;
    }
};

module.exports = ReportService;

},{"../utils/dateUtils":14,"../utils/patientDataMapper":15}],13:[function(require,module,exports){
// Common utility functions (date formatting, age calculation, etc.)
const Utils = {
    _normalizeDateInput(dateInput) {
        if (!dateInput) return { dateObj: null, timeStr: null };
        let effectiveDateObj = null;
        let extractedTimeStr = null;
        if (dateInput instanceof Date) {
            effectiveDateObj = dateInput;
            extractedTimeStr = `${String(effectiveDateObj.getHours()).padStart(2, '0')}:${String(effectiveDateObj.getMinutes()).padStart(2, '0')}`;
        } else if (typeof dateInput === 'string') {
            let datePart = dateInput;
            let timePart = null;
            if (datePart.includes('T')) {
                const parts = datePart.split('T');
                datePart = parts[0];
                if (parts[1]) timePart = parts[1].substring(0, 5);
            } else if (datePart.includes(' ')) {
                const parts = datePart.split(' ');
                datePart = parts[0];
                if (parts[1]) timePart = parts[1].substring(0, 5);
            }
            extractedTimeStr = timePart;
            if (/\d{4}-\d{2}-\d{2}/.test(datePart)) {
                effectiveDateObj = new Date(datePart + 'T00:00:00');
            } else if (/\d{2}\/\d{2}\/\d{4}/.test(datePart)) {
                const [d, m, y] = datePart.split('/');
                effectiveDateObj = new Date(`${y}-${m}-${d}T00:00:00`);
            } else {
                const potentialDate = new Date(dateInput);
                if (!isNaN(potentialDate.getTime())) {
                    effectiveDateObj = potentialDate;
                    if (!extractedTimeStr && (dateInput.includes('T') || dateInput.includes(' ')) && dateInput.includes(':')) {
                        extractedTimeStr = `${String(effectiveDateObj.getHours()).padStart(2, '0')}:${String(effectiveDateObj.getMinutes()).padStart(2, '0')}`;
                    }
                }
            }
            if (effectiveDateObj && isNaN(effectiveDateObj.getTime())) {
                effectiveDateObj = null;
            }
        }
        return { dateObj: effectiveDateObj, timeStr: extractedTimeStr };
    },
    calculateAge(dateString) {
        const { dateObj: birth } = this._normalizeDateInput(dateString);
        if (!birth) return '';
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },
    formatDate(date) {
        const { dateObj } = this._normalizeDateInput(date);
        if (!dateObj) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    },
    formatDateForApi(date) {
        const { dateObj, timeStr } = this._normalizeDateInput(date);
        if (!dateObj) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const finalTime = timeStr || '00:00';
        return `${month}/${day}/${year} ${finalTime}`;
    },
    pad(n, width = 2) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    },
    getQueryParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    },
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }
};

module.exports = Utils;

},{}],14:[function(require,module,exports){
// dateUtils.js - Centralized date handling utilities

const DateUtils = {
    /**
     * Convert Vietnamese date format (dd/mm/yyyy) to US format (mm/dd/yyyy)
     * Also handles cases where input is already in mm/dd/yyyy format
     */
    convertToUSFormat(admitDate) {
        if (!admitDate) {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            return `${mm}/${dd}/${yyyy} 00:00`;
        }

        // DEBUG: Log input format
        console.log('DEBUG - DateUtils.convertToUSFormat input:', admitDate);

        if (/^\d{2}\/\d{2}\/\d{4}/.test(admitDate)) {
            const [part1, part2, yearAndTime] = admitDate.split('/');
            const [year, time] = yearAndTime.split(' ');
            
            // Try to determine if it's dd/mm/yyyy or mm/dd/yyyy
            // If part1 > 12, it must be dd/mm/yyyy format
            // If part2 > 12, it must be mm/dd/yyyy format  
            const num1 = parseInt(part1);
            const num2 = parseInt(part2);
            
            let month, day;
            
            if (num1 > 12) {
                // part1 is day, part2 is month (dd/mm/yyyy format)
                day = part1;
                month = part2;
                console.log('DEBUG - Detected dd/mm/yyyy format');
            } else if (num2 > 12) {
                // part1 is month, part2 is day (mm/dd/yyyy format - already US format)
                month = part1;
                day = part2;
                console.log('DEBUG - Detected mm/dd/yyyy format (already US format)');
            } else {
                // Both numbers <= 12, assume Vietnamese format (dd/mm/yyyy)
                day = part1;
                month = part2;
                console.log('DEBUG - Ambiguous format, assuming dd/mm/yyyy');
            }
            
            const result = `${month}/${day}/${year} ${time || '00:00'}`;
            console.log('DEBUG - DateUtils.convertToUSFormat output:', result);
            return result;
        }

        console.log('DEBUG - DateUtils.convertToUSFormat: returning input as-is');
        return admitDate;
    },

    /**
     * Calculate date range for checklist (from admit date to +30 days)
     */
    getChecklistDateRange(admitDate) {
        const tungay = this.convertToUSFormat(admitDate);
        const [admitMonth, admitDay, admitYearAndTime] = tungay.split('/');
        const [admitYear, admitTime] = admitYearAndTime.split(' ');
        
        const tungayDate = new Date(`${admitYear}-${admitMonth}-${admitDay}T${admitTime || '00:00'}`);
        const denngayDate = new Date(tungayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const dd = String(denngayDate.getDate()).padStart(2, '0');
        const mm = String(denngayDate.getMonth() + 1).padStart(2, '0');
        const yyyy = denngayDate.getFullYear();
        const denngay = `${mm}/${dd}/${yyyy} 23:59`;

        return { tungay, denngay };
    }
};

module.exports = DateUtils;

},{}],15:[function(require,module,exports){
// patientDataMapper.js - Centralized patient data mapping

const PatientDataMapper = {
    /**
     * Map raw patient data to standardized format
     */
    mapPatientData(item) {
        return {
            teN_GIUONG: item.teN_GIUONG,
            teN_PHONG: item.teN_PHONG,
            teN_TANG: item.teN_TANG,
            teN_TOANHA: item.teN_TOANHA,
            mabn: item.mabn,
            hoten: item.hoten,
            ngaysinh: item.ngaysinh,
            phai: item.phai,
            mavaovien: item.mavaovien,
            chandoanvk: item.chandoanvk,
            kehoach: item.kehoach,
            ngayvv: item.ngayvv,
            maql: item.maql,
            tungay: item.tungay
        };
    },

    /**
     * Map array of patient data
     */
    mapPatientArray(dataArray) {
        if (!Array.isArray(dataArray)) {
            return [];
        }
        return dataArray.map(item => this.mapPatientData(item));
    },

    /**
     * Determine if room should have white card styling
     */
    isWhiteCard(room) {
        if (!room) return false;
        return /^(Phòng )?(214|215|216)$/i.test(room) || /214|215|216/.test(room);
    },

    /**
     * Format room info - extract only room number
     * "Phòng 402" -> "402"
     */
    formatRoom(roomText) {
        if (!roomText) return '';
        // Remove "Phòng " prefix and keep only the number/text
        return roomText.replace(/^Phòng\s*/i, '').trim();
    },

    /**
     * Format bed info - extract only bed letter/name
     * "Giường A" -> "A"
     * "G215-A" -> "A"
     */
    formatBed(bedText) {
        if (!bedText) return '';
        
        // Remove "Giường " prefix first
        let cleaned = bedText.replace(/^Giường\s*/i, '').trim();
        
        // If there's a dash, take only the part after the last dash
        if (cleaned.includes('-')) {
            const parts = cleaned.split('-');
            return parts[parts.length - 1].trim();
        }
        
        // Otherwise return the cleaned text
        return cleaned;
    },

    /**
     * Format floor info - extract only floor number
     * "Tầng 4" -> "4"
     */
    formatFloor(floorText) {
        if (!floorText) return '';
        // Remove "Tầng " prefix and keep only the number
        return floorText.replace(/^Tầng\s*/i, '').trim();
    },

    /**
     * Format building info - extract only building letter/name
     * "Tòa C" -> "C"
     */
    formatBuilding(buildingText) {
        if (!buildingText) return '';
        // Remove "Tòa " prefix and keep only the letter/name
        return buildingText.replace(/^Tòa\s*/i, '').trim();
    },

    /**
     * Format complete room location info
     * Returns formatted string: "402 A - 4 C"
     */
    formatRoomLocation(room, bed, floor, building) {
        const formattedRoom = this.formatRoom(room);
        const formattedBed = this.formatBed(bed);
        const formattedFloor = this.formatFloor(floor);
        const formattedBuilding = this.formatBuilding(building);
        
        let location = '';
        
        // Add room and bed
        if (formattedRoom) {
            location += formattedRoom;
            if (formattedBed) {
                location += `${formattedBed}`;
            }
        }
        
        // Add separator if we have floor or building
        if ((formattedFloor || formattedBuilding) && location) {
            location += ' - ';
        }
        
        // Add floor and building
        if (formattedFloor) {
            location += "Tòa " + formattedFloor;
            if (formattedBuilding) {
                location += `${formattedBuilding}`;
            }
        } else if (formattedBuilding) {
            location += formattedBuilding;
        }
        
        return location;
    },

    /**
     * Extract numeric value from text for sorting
     * "402" -> 402, "A" -> 0, "4C" -> 4
     */
    extractNumericValue(text) {
        if (!text) return 0;
        const match = text.toString().match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    },

    /**
     * Extract alpha value from text for sorting
     * "402A" -> "A", "G215-B" -> "B", "4" -> ""
     */
    extractAlphaValue(text) {
        if (!text) return '';
        // Remove numbers and special characters, keep only letters
        const alpha = text.toString().replace(/[^A-Za-z]/g, '');
        return alpha.toUpperCase();
    },

    /**
     * Sort patients by Building -> Floor -> Room -> Bed (all ascending)
     */
    sortPatients(patients) {
        return patients.sort((a, b) => {
            // 1. Sort by Building (Tòa nhà)
            const buildingA = this.extractAlphaValue(this.formatBuilding(a.teN_TOANHA));
            const buildingB = this.extractAlphaValue(this.formatBuilding(b.teN_TOANHA));
            if (buildingA !== buildingB) {
                return buildingA.localeCompare(buildingB);
            }

            // 2. Sort by Floor (Tầng)
            const floorA = this.extractNumericValue(this.formatFloor(a.teN_TANG));
            const floorB = this.extractNumericValue(this.formatFloor(b.teN_TANG));
            if (floorA !== floorB) {
                return floorA - floorB;
            }

            // 3. Sort by Room number (Phòng)
            const roomA = this.extractNumericValue(this.formatRoom(a.teN_PHONG));
            const roomB = this.extractNumericValue(this.formatRoom(b.teN_PHONG));
            if (roomA !== roomB) {
                return roomA - roomB;
            }

            // 4. Sort by Bed (Giường)
            // First by numeric part, then by alpha part
            const bedA = this.formatBed(a.teN_GIUONG);
            const bedB = this.formatBed(b.teN_GIUONG);
            
            const bedNumA = this.extractNumericValue(bedA);
            const bedNumB = this.extractNumericValue(bedB);
            if (bedNumA !== bedNumB) {
                return bedNumA - bedNumB;
            }
            
            const bedAlphaA = this.extractAlphaValue(bedA);
            const bedAlphaB = this.extractAlphaValue(bedB);
            return bedAlphaA.localeCompare(bedAlphaB);
        });
    },

    /**
     * Map surgery data from checklist state
     */
    mapPhauThuatData(checklistData) {
        if (!checklistData || !checklistData.phauThuatLog) {
            return null;
        }

        const logs = checklistData.phauThuatLog;
        if (!Array.isArray(logs) || logs.length === 0) {
            return null;
        }

        // Get the latest surgery record (first one since newest is first)
        const latestSurgery = logs[0];
        
        return {
            ngayPhauThuat: latestSurgery.date || '', // Already in dd/mm/yyyy format
            gioPhauThuat: latestSurgery.time || '', // Already in HH:MM format
            pppt: latestSurgery.method || '',
            bacSi: latestSurgery.doctors || '',
            timestamp: latestSurgery.id || new Date().getTime()
        };
    },

    /**
     * Check if patient has surgery data
     */
    hasPhauThuatData(checklistData) {
        if (!checklistData || !checklistData.phauThuatLog) {
            return false;
        }

        const logs = checklistData.phauThuatLog;
        return Array.isArray(logs) && logs.length > 0;
    }
};

module.exports = PatientDataMapper;

},{}]},{},[2]);
