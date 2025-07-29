// ==UserScript==
// @name         BS Nội trú - Helper (TA Hospital) - By drquochoai, BS.CKI Trần Quốc Hoài
// @namespace    http://tampermonkey.net/
// @version      1.4.12
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
// BS_CAI_DAT_GIAO_DIEN.js
// File cấu hình giao diện cho hệ thống Bệnh Sử Nội Trú
// Có thể chỉnh sửa các cài đặt này để tùy chỉnh giao diện

const BS_CAI_DAT = {
    // ================== CÀI ĐẶT CHECKLIST ==================
    checklistItems: [
        'Phiếu Khám vào viện (hsoft)',
        'Bệnh án Ngoại khoa',
        'Tờ điều trị (web)',
        'Tạo Biên bản Hội chẩn duyệt mổ (web)',
        'Phiếu khai thác tiền sử dị ứng (hsoft)',
        '57. Cam kết phẫu thuật thủ thuật (hsoft)',
        'Phiếu cung cấp thông tin, chẩn đoán và điều trị (hsoft)',
        'Đánh giá nguy cơ huyết khối (web)',
        'Chuyển xét nghiệm vào khoa (hsoft) và ✅ ký số',
        'Đánh dấu vết mổ',
        'ĐÃ khám tiền mê CHƯA?',
        'ĐÃ đặt lịch mổ CHƯA?',
        'ĐÃ ghi y lệnh chuyển mổ',
        'Phiếu kiểm tra HIV test (hsoft)',
    ],

    // ================== CÀI ĐẶT CHECKLIST XUẤT VIỆN ==================
    checklistXuatVien: [
        'Mở HSBA v2',
        'Nhập khoa (chỉnh chẩn đoán, ICD)',
        'Mở trang dặn dò',
        'Giấy ra viện',
        'Tóm tắt bệnh án',
        // Tờ điều trị sẽ có checklist con
        {
            label: 'Tờ điều trị',
            children: [
                'Thực hiện y lệnh thuốc đã dự trù',
                'Trả thuốc cử chiều & tối',
                'Toa thuốc ra viện',
                'Chuyển dược, In toa',
                'Tổng kết bệnh án trong tờ điều trị',
                'Tổng kết bệnh án điện tử',
                'Ký số các CLS tồn'
            ]
        }
    ],

    // ================== CÀI ĐẶT Y LỆNH QUICK ACTIONS ==================
    quickYLenhActions: [
        { label: 'Xuất viện', icon: '🏠', color: '#4caf50' },
        { label: 'Thay băng', icon: '👗', color: '#310994ff' },
        { label: 'Rút ODL vết mổ', icon: '🩹', color: '#ff9800' },
        { label: 'Rút ODL phổi', icon: '🫁', color: '#2196f3' },
        { label: 'Rút sonde tiểu', icon: '🔗', color: '#9c27b0' }
    ],

    // ================== CÀI ĐẶT BÁC SĨ ==================
    danhSachBacSi: [
        'BS Dũng',
        'BS Quyền', 
        'BS Hằng',
        'BS Hoài',
        'BS Hiếu',
        'BS Hải',
        'BS Hưng'
    ],

    // ================== CÀI ĐẶT PHẪU THUẬT ==================
    phauThuatDefaults: {
        defaultDate: 'tomorrow', // 'tomorrow' | 'today' | null
        defaultTime: '07:30',
    },

    // ================== CÀI ĐẶT MÀU SẮC VÀ GIAO DIỆN ==================
    colors: {
        // Màu chính
        primary: '#1976d2',
        secondary: '#4caf50',
        danger: '#d32f2f',
        warning: '#ff9800',
        info: '#2196f3',
        
        // Màu cho thẻ bệnh nhân
        cardBackground: '#fff',
        cardBorder: '#e0e0e0',
        blueCardBackground: '#e3f2fd',
        
        // Màu cho tags y lệnh
        tagDefault: '#4caf50',
        tagBackground: 'rgba(76, 175, 80, 0.1)',
        tagBorder: 'rgba(76, 175, 80, 0.3)',
    },

    // ================== CÀI ĐẶT TAGS ==================
    tags: {
        maxDisplayTags: 3, // Số lượng tags tối đa hiển thị trên mỗi thẻ bệnh nhân
        showOnlyToday: true, // Chỉ hiển thị y lệnh hôm nay
        defaultIcon: '📋',
        
        // Cài đặt cho celebration (khi có tag Xuất viện)
        celebration: {
            enabled: true, // Bật/tắt hiệu ứng celebration
            glowColor: '#4caf50', // Màu glow animation
            borderWidth: '3px', // Độ dày viền celebration
            animationDuration: '2s', // Thời gian animation
        }
    },

    // ================== CÀI ĐẶT THỜI GIAN ==================
    timing: {
        autoSaveDelay: 500, // ms - thời gian delay khi auto-save
        loadChecklistDelay: 100, // ms - thời gian delay khi load checklist
        eventListenerDelay: 10, // ms - thời gian delay khi setup event listeners
    },

    // ================== CÀI ĐẶT DEBUG ==================
    debug: {
        enableLogging: true, // Bật/tắt console.log
        enableTagsTest: true, // Bật/tắt function test tags
        defaultTestMabn: '2510149440', // Mã bệnh nhân mặc định để test
    },

    // ================== CÀI ĐẶT TEXT ==================
    text: {
        noYLenhMessage: 'Chưa có y lệnh nào...',
        noPhauThuatMessage: 'Chưa có phẫu thuật nào...',
        loadingMessage: 'Đang tải checklist...',
        noDataMessage: 'Không có dữ liệu',
        errorMessage: 'Lỗi tải checklist',
        
        // Tiêu đề các phần
        checklistTitle: 'Checklist bộ mổ',
        phauThuatTitle: 'Thông tin phẫu thuật',
        yLenhTitle: 'Log y lệnh',
        
        // Button text
        addPhauThuatBtn: 'Thêm phẫu thuật',
        addYLenhBtn: 'Thêm',
        saveBtn: 'Lưu',
        cancelBtn: 'Hủy',
        deleteBtn: 'Xóa',
        
        // Placeholder text
        yLenhPlaceholder: 'Nhập y lệnh (VD: rút sonde tiểu)',
        ppptPlaceholder: 'Nhập PPPT',
        datePlaceholder: 'dd/mm/yyyy',
    },

    // ================== CÀI ĐẶT VALIDATION ==================
    validation: {
        requiredFields: {
            phauThuat: ['date', 'time', 'method', 'doctors'],
            yLenh: ['content']
        },
        dateFormat: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        messages: {
            missingPhauThuatInfo: 'Vui lòng nhập đầy đủ thông tin phẫu thuật!',
            invalidDateFormat: 'Vui lòng nhập ngày theo định dạng dd/mm/yyyy!',
            invalidMonth: 'Tháng không hợp lệ (1-12)!',
            invalidDay: 'Ngày không hợp lệ (1-31)!',
            invalidDate: 'Ngày không tồn tại!',
            noDoctorSelected: 'Vui lòng chọn ít nhất một bác sĩ!',
        }
    },

    // ================== CÀI ĐẶT LAYOUT ==================
    layout: {
        sidebar: {
            width: '80vw',
            maxWidth: '80vw',
            zIndex: 100000,
        },
        
        popup: {
            maxWidth: '500px',
            width: '90vw',
            maxHeight: '80vh',
            zIndex: 100001,
        },
        
        cards: {
            gap: '16px',
            borderRadius: '8px',
            padding: '16px',
        }
    }
};

// Export cho Node.js environment (browserify)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS_CAI_DAT;
}

// Export cho browser environment
if (typeof window !== 'undefined') {
    window.BS_CAI_DAT = BS_CAI_DAT;
}

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
},{"./DanhSachBenhNhan":2,"./dashboard":10,"./googleAppsScript":12,"./utils":17}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
// patientInfoSection.js
const { setupYLenhHandlers } = require('./yLenhHandlers');
const { setupPhauThuatHandlers } = require('./phauThuatHandlers');
const ChecklistService = require('../services/checklistService');
const Utils = require('../utils');

function createPatientInfoSection(patient, quickYLenhActions) {
    const info = document.createElement('div');
    info.innerHTML = `
        <h2 style="margin-top:0">${patient.hoten || ''} <span style="font-size:0.9em;color:#888;">${patient.mabn ? ' - ' + patient.mabn : ''}</span></h2>
        <div><b>Tuổi:</b> ${Utils.calculateAge(patient.ngaysinh)}</div>
        <div><b>Giới tính:</b> <span>${patient.phai === 1 ? 'Nữ' : 'Nam'}</span></div>
        <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
        
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
            
            <!-- Quick Action Buttons -->
            <div class="quick-ylenh-actions">
                ${quickYLenhActions.map(action => `
                    <button class="quick-ylenh-btn" data-action="${action.label}" style="color: ${action.color}; border-color: ${action.color};">
                        <span class="icon">${action.icon}</span>
                        <span class="text">${action.label}</span>
                        <span class="tick" style="display: none;">✅</span>
                    </button>
                `).join('')}
            </div>
            
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input type="text" id="dr-y-lenh-input" placeholder="Nhập y lệnh (VD: rút sonde tiểu)" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:4px;">
                <button id="dr-add-y-lenh" style="padding:8px 16px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;">Thêm</button>
            </div>
            <div id="dr-y-lenh-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;">
                <div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>
            </div>
        </div>
    `;

    // Setup y lệnh functionality
    setupYLenhHandlers(info, patient);

    // Setup phẫu thuật functionality
    setupPhauThuatHandlers(info, patient);

    return info;
}

module.exports = { createPatientInfoSection };

},{"../services/checklistService":14,"../utils":17,"./phauThuatHandlers":8,"./yLenhHandlers":9}],8:[function(require,module,exports){
// phauThuatHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

function createDoctorCheckboxes(className) {
    return BS_CAI_DAT.danhSachBacSi.map(doctor => 
        `<label><input type="checkbox" class="${className}" value="${doctor}"> ${doctor}</label>`
    ).join('');
}

function setupPhauThuatHandlers(infoElement, patient) {
    const showFormBtn = infoElement.querySelector('#dr-show-pt-form');
    const logContainer = infoElement.querySelector('#dr-pt-log');

    function createPhauThuatPopup(editIndex = null) {
        // Check if popup already exists
        const existingPopup = document.getElementById('dr-pt-popup-backdrop');
        if (existingPopup) {
            console.log('Popup already exists, skipping creation');
            return;
        }
        
        const backdrop = document.createElement('div');
        backdrop.id = 'dr-pt-popup-backdrop';
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 100001;
            display: flex; align-items: center; justify-content: center;
        `;

        const popup = document.createElement('div');
        popup.id = 'dr-pt-popup';
        popup.style.cssText = `
            background: white; border-radius: 8px; padding: 24px;
            max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        popup.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 16px;">${editIndex !== null ? 'Sửa thông tin phẫu thuật' : 'Thêm thông tin phẫu thuật'}</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <div>
                    <label style="font-size:0.9em;color:#666;">Ngày PT:</label>
                    <input type="text" id="dr-pt-date-popup" placeholder="dd/mm/yyyy" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.9em;color:#666;">Giờ PT:</label>
                    <div style="display:flex;gap:4px;align-items:center;">
                        <input type="number" id="dr-pt-hour-popup" min="0" max="23" placeholder="HH" style="width:50px;padding:6px;border:1px solid #ddd;border-radius:4px;text-align:center;" />
                        <span style="font-weight:bold;">:</span>
                        <input type="number" id="dr-pt-minute-popup" min="0" max="59" step="5" placeholder="MM" style="width:50px;padding:6px;border:1px solid #ddd;border-radius:4px;text-align:center;" />
                        <small style="margin-left:8px;color:#888;">(24h)</small>
                    </div>
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:0.9em;color:#666;">Phương pháp phẫu thuật (PPPT):</label>
                <input type="text" id="dr-pt-method-popup" placeholder="Nhập PPPT" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="font-size:0.9em;color:#666;margin-bottom:6px;display:block;">Bác sĩ thực hiện:</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;">
                    ${createDoctorCheckboxes('dr-pt-doctor-popup')}
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="dr-cancel-pt" style="background:#666;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Hủy</button>
                <button id="dr-save-pt" style="background:${BS_CAI_DAT.colors.primary};color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Lưu</button>
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        const originalClosePopup = function() {
            document.body.removeChild(backdrop);
            document.documentElement.lang = originalLang || 'vi';
        };

        const dateInput = popup.querySelector('#dr-pt-date-popup');
        const hourInput = popup.querySelector('#dr-pt-hour-popup');
        const minuteInput = popup.querySelector('#dr-pt-minute-popup');
        const methodInput = popup.querySelector('#dr-pt-method-popup');
        const doctorCheckboxes = popup.querySelectorAll('.dr-pt-doctor-popup');
        const saveBtn = popup.querySelector('#dr-save-pt');
        const cancelBtn = popup.querySelector('#dr-cancel-pt');

        hourInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (value > 23) this.value = 23;
            if (value < 0) this.value = 0;
            if (this.value.length === 2) {
                minuteInput.focus();
                minuteInput.select();
            }
        });

        hourInput.addEventListener('focus', function() {
            this.select();
        });

        minuteInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (value > 59) this.value = 59;
            if (value < 0) this.value = 0;
        });

        minuteInput.addEventListener('focus', function() {
            this.select();
        });

        minuteInput.addEventListener('blur', function() {
            if (this.value && this.value.length === 1) {
                this.value = '0' + this.value;
            }
        });

        hourInput.addEventListener('blur', function() {
            if (this.value && this.value.length === 1) {
                this.value = '0' + this.value;
            }
        });

        const config = BS_CAI_DAT.phauThuatDefaults;
        
        // Load existing data for edit mode
        if (editIndex !== null && window.checklistState.phauThuatLog && window.checklistState.phauThuatLog[editIndex]) {
            const editData = window.checklistState.phauThuatLog[editIndex];
            dateInput.value = editData.date || '';
            methodInput.value = editData.method || '';
            
            // Parse time
            if (editData.time) {
                const [hour, minute] = editData.time.split(':');
                hourInput.value = hour;
                minuteInput.value = minute;
            }
            
            // Set doctors
            if (editData.doctors) {
                const doctorList = editData.doctors.split(', ');
                doctorCheckboxes.forEach(cb => {
                    cb.checked = doctorList.includes(cb.value);
                });
            }
        } else {
            // Set defaults for new entry
            if (config.defaultDate === 'tomorrow') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = String(tomorrow.getDate()).padStart(2, '0') + '/' + 
                    String(tomorrow.getMonth() + 1).padStart(2, '0') + '/' + 
                    tomorrow.getFullYear();
                dateInput.value = tomorrowStr;
            } else if (config.defaultDate === 'today') {
                const today = new Date();
                const todayStr = String(today.getDate()).padStart(2, '0') + '/' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                    today.getFullYear();
                dateInput.value = todayStr;
            }

            if (config.defaultTime) {
                const [defaultHour, defaultMinute] = config.defaultTime.split(':');
                hourInput.value = defaultHour;
                minuteInput.value = defaultMinute;
            }
        }

        function closePopup() {
            originalClosePopup();
        }

        function savePhauThuat() {
            const date = dateInput.value.trim();
            const hour = hourInput.value.trim();
            const minute = minuteInput.value.trim();
            const method = methodInput.value.trim();
            
            let time = '';
            if (hour && minute) {
                const h = parseInt(hour, 10);
                const m = parseInt(minute, 10);
                
                if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                    time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                } else {
                    alert('Thời gian không hợp lệ. Giờ: 0-23, Phút: 0-59');
                    return;
                }
            } else if (hour || minute) {
                alert('Vui lòng nhập đầy đủ giờ và phút');
                return;
            }
            
            if (!date || !time || !method) {
                alert(BS_CAI_DAT.validation.messages.missingPhauThuatInfo);
                return;
            }

            const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const dateMatch = date.match(dateRegex);
            if (!dateMatch) {
                alert(BS_CAI_DAT.validation.messages.invalidDateFormat);
                return;
            }

            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);

            if (month < 1 || month > 12) {
                alert(BS_CAI_DAT.validation.messages.invalidMonth);
                return;
            }
            if (day < 1 || day > 31) {
                alert(BS_CAI_DAT.validation.messages.invalidDay);
                return;
            }

            const dateObj = new Date(year, month - 1, day);
            if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                alert(BS_CAI_DAT.validation.messages.invalidDate);
                return;
            }

            const selectedDoctors = Array.from(doctorCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            if (selectedDoctors.length === 0) {
                alert(BS_CAI_DAT.validation.messages.noDoctorSelected);
                return;
            }

            if (!window.checklistState.phauThuatLog) {
                window.checklistState.phauThuatLog = [];
            }

            const newEntry = {
                date: date,
                time: time,
                method: method,
                doctors: selectedDoctors.join(', '),
                id: Date.now()
            };

            if (editIndex !== null) {
                // Update existing entry
                window.checklistState.phauThuatLog[editIndex] = newEntry;
            } else {
                // Add new entry at the beginning
                window.checklistState.phauThuatLog.unshift(newEntry);
            }

            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuat(patient);
            closePopup();
        }

        saveBtn.addEventListener('click', savePhauThuat);
        cancelBtn.addEventListener('click', closePopup);
        backdrop.addEventListener('click', function(e) {
            if (e.target === backdrop) {
                closePopup();
            }
        });
    }

    function loadPhauThuatLog() {
        if (window.checklistState && window.checklistState.phauThuatLog) {
            renderPhauThuatLog(window.checklistState.phauThuatLog);
        }
    }

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

        setTimeout(() => {
            logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(this.getAttribute('data-index'));
                    removePhauThuat(index);
                });
            });

            logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                entry.addEventListener('click', function(e) {
                    if (e.target.classList.contains('remove-pt-btn')) return;
                    const index = parseInt(this.getAttribute('data-index'));
                    editPhauThuat(index);
                });
            });
        }, 10);
    }

    function editPhauThuat(index) {
        console.log('Edit phẫu thuật:', index);
        createPhauThuatPopup(index);
    }

    function removePhauThuat(index) {
        if (window.checklistState.phauThuatLog && Array.isArray(window.checklistState.phauThuatLog)) {
            window.checklistState.phauThuatLog.splice(index, 1);
            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuat(patient);
        }
    }

    async function savePhauThuatLog() {
        if (window.checklistObj) {
            const success = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
            if (!success) {
                console.error('Lưu log phẫu thuật thất bại!');
            }
        }
    }

    function updatePatientCardPhauThuat(patient) {
        // This would need to be imported from dashboard or made global
        if (window.updatePatientCardPhauThuat) {
            window.updatePatientCardPhauThuat(patient);
        }
    }

    showFormBtn.addEventListener('click', () => createPhauThuatPopup(null));
    setTimeout(loadPhauThuatLog, 100);

    window.currentRemovePhauThuat = removePhauThuat;
    window.currentRenderPhauThuatLog = renderPhauThuatLog;
    window.currentEditPhauThuat = editPhauThuat;
}

module.exports = { setupPhauThuatHandlers };

},{"../BS_CAI_DAT_GIAO_DIEN":1,"../services/checklistService":14}],9:[function(require,module,exports){
// yLenhHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

function setupYLenhHandlers(infoElement, patient) {
    const input = infoElement.querySelector('#dr-y-lenh-input');
    const addBtn = infoElement.querySelector('#dr-add-y-lenh');
    const logContainer = infoElement.querySelector('#dr-y-lenh-log');

    // Use configured quick y lệnh actions
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;

    // Load existing y lệnh when checklist is loaded
    function loadYLenhLog() {
        if (window.checklistState && window.checklistState.yLenhLog) {
            renderYLenhLog(window.checklistState.yLenhLog);
        }
    }

    // Render y lệnh log (filter out quick actions from display)
    function renderYLenhLog(yLenhArray) {
        if (!Array.isArray(yLenhArray) || yLenhArray.length === 0) {
            logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>';
            return;
        }

        // Filter out quick actions for log display only
        const quickActionLabels = BS_CAI_DAT.quickYLenhActions.map(action => action.label);
        const manualEntries = yLenhArray.filter(entry => !quickActionLabels.includes(entry.content));

        if (manualEntries.length === 0) {
            logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có y lệnh manual nào...</div>';
            return;
        }

        logContainer.innerHTML = manualEntries.map((entry, index) => {
            // Find original index in full array for correct removal
            const originalIndex = yLenhArray.findIndex(originalEntry => 
                originalEntry.id === entry.id || 
                (originalEntry.timestamp === entry.timestamp && originalEntry.content === entry.content)
            );
            
            return `
                <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;">
                    <button class="remove-y-lenh-btn" data-index="${originalIndex}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                </div>
            `;
        }).join('');

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

    // Add y lệnh (enhanced với support cho quick actions)
    function addYLenh(content = null) {
        const inputContent = content || input.value.trim();
        if (!inputContent) return;

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
            content: inputContent,
            id: Date.now() // Unique ID for easier removal
        };

        // Add to array
        window.checklistState.yLenhLog.unshift(newEntry); // Add to beginning for newest first

        // Save to server
        saveYLenhLog();

        // Clear input and re-render
        if (!content) input.value = ''; // Only clear if not from quick action
        renderYLenhLog(window.checklistState.yLenhLog);

        // Update patient object in window.dr_data with new checklistState
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...window.checklistState };
                console.log('Updated checklistState in window.dr_data for patient:', patient.mabn);
            }
        }

        // Trigger patient card update to show new tag
        if (window.updatePatientCardTags) {
            console.log('Calling updatePatientCardTags for patient:', patient.mabn);
            window.updatePatientCardTags(patient.mabn);
        }
        
        // Also check celebration animation specifically after adding tag
        setTimeout(() => {
            if (typeof window.checkAllCelebrationAnimations === 'function') {
                // Find the updated patient data
                const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                if (patientInData) {
                    window.checkAllCelebrationAnimations([patientInData]);
                }
            }
        }, 100);
    }

    // Remove y lệnh
    function removeYLenh(index) {
        if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
            window.checklistState.yLenhLog.splice(index, 1);
            saveYLenhLog();
            renderYLenhLog(window.checklistState.yLenhLog);
            
            // Update patient object in window.dr_data with new checklistState
            if (window.dr_data && patient.mabn) {
                const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                if (patientInData) {
                    patientInData.checklistState = { ...window.checklistState };
                    console.log('Updated checklistState in window.dr_data after removal for patient:', patient.mabn);
                }
            }

            // Trigger patient card update to refresh tags
            if (window.updatePatientCardTags) {
                console.log('Calling updatePatientCardTags after removal for patient:', patient.mabn);
                window.updatePatientCardTags(patient.mabn);
            }
            
            // Also check celebration animation specifically after removing tag
            setTimeout(() => {
                if (typeof window.checkAllCelebrationAnimations === 'function') {
                    // Find the updated patient data
                    const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                    if (patientInData) {
                        window.checkAllCelebrationAnimations([patientInData]);
                    }
                }
            }, 100);
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
    addBtn.addEventListener('click', () => addYLenh());
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addYLenh();
        }
    });

    // Quick action buttons event listeners - Toggle logic
    infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const actionText = this.getAttribute('data-action');
            toggleQuickYLenh(actionText, this);
        });
    });

    // Function to toggle quick y lệnh (ON/OFF state)
    function toggleQuickYLenh(actionText, buttonElement) {
        // Check if this action already exists today
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        if (!window.checklistState.yLenhLog) {
            window.checklistState.yLenhLog = [];
        }

        // Find existing entry for this action today
        const existingIndex = window.checklistState.yLenhLog.findIndex(entry => {
            const entryDate = entry.timestamp ? entry.timestamp.split(' ')[0] : '';
            return entryDate === todayStr && entry.content === actionText;
        });

        if (existingIndex !== -1) {
            // Entry exists - REMOVE it (toggle OFF)
            window.checklistState.yLenhLog.splice(existingIndex, 1);
            buttonElement.classList.remove('active');
            console.log('Removed quick action:', actionText);
        } else {
            // Entry doesn't exist - ADD it (toggle ON)
            const now = new Date();
            const timestamp = `${todayStr} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const doctorName = 'BS';

            const newEntry = {
                timestamp: `${timestamp} - ${doctorName}`,
                content: actionText,
                id: Date.now()
            };

            window.checklistState.yLenhLog.unshift(newEntry);
            buttonElement.classList.add('active');
            console.log('Added quick action:', actionText);
        }

        // Save changes
        saveYLenhLog();
        renderYLenhLog(window.checklistState.yLenhLog);

        // Update patient object in window.dr_data
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...window.checklistState };
            }
        }

        // Update card tags (but these quick actions won't be displayed as tags)
        if (window.updatePatientCardTags) {
            window.updatePatientCardTags(patient.mabn);
        }

        // Check celebration animation for "Xuất viện"
        if (actionText === 'Xuất viện') {
            setTimeout(() => {
                if (typeof window.checkAllCelebrationAnimations === 'function') {
                    const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                    if (patientInData) {
                        window.checkAllCelebrationAnimations([patientInData]);
                    }
                }
            }, 100);
        }

        // Visual feedback
        buttonElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            buttonElement.style.transform = '';
        }, 150);
    }

    // Function to update button states based on existing log
    function updateQuickActionButtonStates() {
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
            const actionText = btn.getAttribute('data-action');
            
            // Check if this action exists today
            const existsToday = window.checklistState && window.checklistState.yLenhLog && 
                window.checklistState.yLenhLog.some(entry => {
                    const entryDate = entry.timestamp ? entry.timestamp.split(' ')[0] : '';
                    return entryDate === todayStr && entry.content === actionText;
                });

            if (existsToday) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Load existing data after a short delay to ensure checklist is loaded
    setTimeout(() => {
        loadYLenhLog();
        updateQuickActionButtonStates();
    }, 100);

    // Store reference to removeYLenh for use in loadYLenhLogFromState
    window.currentRemoveYLenh = removeYLenh;

    // Return functions that might be needed externally
    return {
        loadYLenhLog,
        renderYLenhLog,
        addYLenh,
        removeYLenh,
        updateQuickActionButtonStates
    };
}

module.exports = { setupYLenhHandlers };

},{"../BS_CAI_DAT_GIAO_DIEN":1,"../services/checklistService":14}],10:[function(require,module,exports){
// dashboard.js

const Utils = require('./utils');
const {
    createDirectReportGeneration,
    addGlobalStyles
} = require('./dashboard.support');

// Import cài đặt giao diện
const BS_CAI_DAT = require('./BS_CAI_DAT_GIAO_DIEN');

// Import refactored modules
const PatientService = require('./services/patientService');
const ChecklistService = require('./services/checklistService');
const PatientDataMapper = require('./utils/patientDataMapper');
const ModalManager = require('./components/modalManager');
const LoginHandler = require('./components/loginHandler');

// Import newly refactored components
const { createPatientInfoSection } = require('./components/patientInfoSection');
const { createYLenhTags, updatePatientCardTags, hasDischargeTag } = require('./utils/tagUtils');
const { setupPhauThuatHandlers } = require('./components/phauThuatHandlers');

// Global function to open HSBA V2 - Define at module level so it's available immediately
window.openHSBAV2 = async function(mabn) {
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
};

function showDashboardBenhNhanIfNeeded() {
    if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
    addGlobalStyles(); // Đảm bảo style chỉ chèn 1 lần
    
    // Inject CSS styles for quick actions and tags
    if (!document.getElementById('dr-ylenh-styles')) {
        const style = document.createElement('style');
        style.id = 'dr-ylenh-styles';
        style.textContent = `
            /* Quick action buttons container */
            .quick-ylenh-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 10px 0;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }

            .quick-ylenh-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                background-color: white;
                color: #333;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
                white-space: nowrap;
                position: relative;
            }

            .quick-ylenh-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                border-color: currentColor;
            }

            .quick-ylenh-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            /* Trạng thái toggle ON - viền đỏ đậm + tick xanh */
            .quick-ylenh-btn.active {
                border: 3px solid #d32f2f !important;
                background-color: #ffebee;
                box-shadow: 0 0 10px rgba(211, 47, 47, 0.3);
            }

            .quick-ylenh-btn.active .tick {
                display: inline !important;
                color: #4caf50;
                font-weight: bold;
                margin-left: 4px;
            }

            .quick-ylenh-btn.active .text {
                font-weight: bold;
            }

            .quick-ylenh-btn .icon {
                font-size: 14px;
            }

            /* Y lệnh tags on patient cards */
            .ylenh-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin: 8px 0 4px 0;
            }

            .ylenh-tag {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 3px 8px;
                background-color: rgba(76, 175, 80, 0.1);
                color: #2e7d32;
                border: 1px solid rgba(76, 175, 80, 0.3);
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                white-space: nowrap;
            }

            /* Hiệu ứng cho tag Xuất viện - giữ đơn giản */
            .ylenh-tag.discharge {
                background: linear-gradient(45deg, #4caf50, #66bb6a) !important;
                color: white !important;
                border: 2px solid #4caf50 !important;
                font-weight: bold !important;
            }

            .ylenh-tag.completed {
                background-color: rgba(76, 175, 80, 0.2);
                color: #1b5e20;
                border-color: rgba(76, 175, 80, 0.5);
            }

            .ylenh-tag .icon {
                font-size: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    const checklistItems = BS_CAI_DAT.checklistItems;
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;

    function createChecklistSection(patient) {
        const checklistDiv = document.createElement('div');
        
        // Determine if patient has discharge tag
        const hasDischarge = hasDischargeTag(patient);
        const defaultTab = hasDischarge ? 'xuatvien' : 'bomo';
        
        checklistDiv.innerHTML = `
            <h3 style="margin-top:0">Checklist</h3>
            <div class="checklist-tabs" style="display:flex;margin-bottom:16px;border-bottom:2px solid #e0e0e0;">
                <button class="tab-btn ${defaultTab === 'bomo' ? 'active' : ''}" data-tab="bomo" style="padding:8px 16px;border:none;background:${defaultTab === 'bomo' ? '#1976d2' : 'transparent'};color:${defaultTab === 'bomo' ? 'white' : '#666'};border-radius:4px 4px 0 0;cursor:pointer;font-weight:${defaultTab === 'bomo' ? 'bold' : 'normal'};">Bộ mổ</button>
                <button class="tab-btn ${defaultTab === 'xuatvien' ? 'active' : ''}" data-tab="xuatvien" style="padding:8px 16px;border:none;background:${defaultTab === 'xuatvien' ? '#4caf50' : 'transparent'};color:${defaultTab === 'xuatvien' ? 'white' : '#666'};border-radius:4px 4px 0 0;cursor:pointer;margin-left:4px;font-weight:${defaultTab === 'xuatvien' ? 'bold' : 'normal'};">Xuất viện</button>
            </div>
            <div class="tab-content">
                <div class="tab-pane ${defaultTab === 'bomo' ? 'active' : ''}" data-tab="bomo" style="display:${defaultTab === 'bomo' ? 'block' : 'none'};">
                    <ul id="checklist-bomo" style="overflow-y:auto;padding-left:0;list-style:none;margin:0 0 16px 0;"></ul>
                </div>
                <div class="tab-pane ${defaultTab === 'xuatvien' ? 'active' : ''}" data-tab="xuatvien" style="display:${defaultTab === 'xuatvien' ? 'block' : 'none'};">
                    <ul id="checklist-xuatvien" style="overflow-y:auto;padding-left:0;list-style:none;margin:0 0 16px 0;"></ul>
                </div>
            </div>
        `;
        
        // Setup tab switching
        setTimeout(() => {
            const tabBtns = checklistDiv.querySelectorAll('.tab-btn');
            const tabPanes = checklistDiv.querySelectorAll('.tab-pane');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const targetTab = this.getAttribute('data-tab');
                    
                    // Update buttons
                    tabBtns.forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'transparent';
                        b.style.color = '#666';
                        b.style.fontWeight = 'normal';
                    });
                    
                    this.classList.add('active');
                    this.style.background = targetTab === 'bomo' ? '#1976d2' : '#4caf50';
                    this.style.color = 'white';
                    this.style.fontWeight = 'bold';
                    
                    // Update panes
                    tabPanes.forEach(pane => {
                        pane.classList.remove('active');
                        pane.style.display = 'none';
                    });
                    
                    const targetPane = checklistDiv.querySelector(`.tab-pane[data-tab="${targetTab}"]`);
                    if (targetPane) {
                        targetPane.classList.add('active');
                        targetPane.style.display = 'block';
                    }
                });
            });
        }, 10);
        
        // Load both checklists
        const bomoList = checklistDiv.querySelector('#checklist-bomo');
        const xuatvienList = checklistDiv.querySelector('#checklist-xuatvien');
        
        if (bomoList) {
            loadChecklist(patient, bomoList, 'bomo');
        }
        if (xuatvienList) {
            loadChecklistXuatVien(patient, xuatvienList);
        }
        
        return checklistDiv;
    }

    // Helper function to load checklist data
    async function loadChecklist(patient, checklistUl, checklistType = 'bomo', retryCount = 0) {
        try {
            checklistUl.innerHTML = '<li>Đang tải checklist...</li>';
            
            const res = await ChecklistService.loadChecklistData(patient);
            checklistUl.innerHTML = '';
            
            let checklistObj = ChecklistService.findChecklistObject(res);
            
            if (!checklistObj) {
                checklistUl.innerHTML = '<li>Không có dữ liệu</li>';
                const created = await ChecklistService.createNewChecklist(patient);
                if (created) {
                    loadChecklist(patient, checklistUl, checklistType, retryCount + 1);
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

            // Render checklist items for bộ mổ
            if (checklistType === 'bomo') {
                renderChecklistItems(checklistUl);
            }
            
        } catch (error) {
            console.error('Error loading checklist:', error);
            checklistUl.innerHTML = '<li>Lỗi tải checklist</li>';
        }
    }

    // Helper function to load checklist xuất viện
    function loadChecklistXuatVien(patient, checklistUl) {
        try {
            checklistUl.innerHTML = '<li>Đang tải checklist xuất viện...</li>';
            
            setTimeout(() => {
                renderChecklistXuatVien(checklistUl, patient);
            }, 100);
            
        } catch (error) {
            console.error('Error loading xuất viện checklist:', error);
            checklistUl.innerHTML = '<li>Lỗi tải checklist xuất viện</li>';
        }
    }

    // Helper function to render checklist xuất viện
    function renderChecklistXuatVien(checklistUl, patient) {
        checklistUl.innerHTML = '';
        
        BS_CAI_DAT.checklistXuatVien.forEach((item, idx) => {
            const li = document.createElement('li');
            li.style = 'margin-bottom:8px;';
            
            if (typeof item === 'string') {
                // Simple checklist item
                const id = 'dr-checklist-xv-' + idx;
                const isChecked = window.checklistState && window.checklistState[`xuatvien_${item}`] || false;
                
                li.innerHTML = createChecklistItemHTML(item, id, isChecked, patient);
            } else if (item.children) {
                // Parent item with children
                const parentId = 'dr-checklist-xv-parent-' + idx;
                const isParentChecked = window.checklistState && window.checklistState[`xuatvien_${item.label}`] || false;
                
                li.innerHTML = `
                    <div style="margin-bottom:8px;">
                        <label style="display:flex;align-items:center;gap:8px;font-weight:bold;">
                            <input type="checkbox" id="${parentId}" ${isParentChecked ? 'checked' : ''}>${item.label}
                        </label>
                        <ul style="margin-left:24px;margin-top:8px;list-style:none;padding:0;">
                            ${item.children.map((child, childIdx) => {
                                const childId = `dr-checklist-xv-child-${idx}-${childIdx}`;
                                const isChildChecked = window.checklistState && window.checklistState[`xuatvien_${child}`] || false;
                                return `<li style="margin-bottom:4px;">${createChecklistItemHTML(child, childId, isChildChecked, patient)}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                `;
            }
            
            checklistUl.appendChild(li);
        });

        // Setup checkbox change handlers for xuất viện
        setTimeout(() => {
            checklistUl.querySelectorAll('input[type=checkbox]').forEach(cb => {
                cb.addEventListener('change', async function () {
                    const label = this.parentNode.textContent.trim();
                    const key = `xuatvien_${label}`;
                    
                    if (!window.checklistState) {
                        window.checklistState = {};
                    }
                    
                    window.checklistState[key] = this.checked;
                    
                    const success = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState);
                    if (!success) {
                        console.error('Lưu checklist xuất viện thất bại!');
                    }
                });
            });
        }, 10);
    }

    // Helper function to create checklist item HTML with special actions
    function createChecklistItemHTML(itemText, id, isChecked, patient) {
        const baseHTML = `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''}>${itemText}</label>`;
        
        // Add special buttons for certain items
        if (itemText === 'Mở HSBA v2') {
            return `
                <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                    ${baseHTML}
                    <button onclick="openHSBAV2('${patient.mabn}')" style="background:#2196f3;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:0.8em;cursor:pointer;">Mở</button>
                </div>
            `;
        } else if (itemText === 'Mở trang dặn dò') {
            return `
                <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                    ${baseHTML}
                    <button onclick="window.open('https://hoaiump.notion.site/D-N-D-RA-VI-N-21025280dcee804c971bea55557264b9', '_blank')" style="background:#ff9800;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:0.8em;cursor:pointer;">Mở</button>
                </div>
            `;
        }
        
        return baseHTML;
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
        
        // Clear and setup sidebar with responsive layout
        sidebar.innerHTML = '';
        sidebar.style = `position:fixed;top:0;right:0;width:80vw;max-width:80vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;`;
        
        // Create responsive container
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: 100%;
        `;
        
        // Add media query styles for desktop layout
        const desktopStyles = document.createElement('style');
        desktopStyles.textContent = `
            @media (min-width: 1024px) {
                .dr-sidebar-container {
                    flex-direction: row !important;
                    gap: 24px !important;
                }
                .dr-sidebar-left {
                    flex: 0 0 40% !important;
                }
                .dr-sidebar-right {
                    flex: 1 !important;
                }
            }
        `;
        if (!document.getElementById('dr-responsive-styles')) {
            desktopStyles.id = 'dr-responsive-styles';
            document.head.appendChild(desktopStyles);
        }
        
        container.className = 'dr-sidebar-container';
        
        // Left column: Patient info with surgery and y lệnh
        const leftColumn = document.createElement('div');
        leftColumn.className = 'dr-sidebar-left';
        leftColumn.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        const info = createPatientInfoSection(patient, quickYLenhActions);
        leftColumn.appendChild(info);
        
        // Setup phẫu thuật handlers for the info section
        setupPhauThuatHandlers(info, patient);
        
        // Right column: Checklist section
        const rightColumn = document.createElement('div');
        rightColumn.className = 'dr-sidebar-right';
        rightColumn.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        const checklistDiv = createChecklistSection(patient);
        rightColumn.appendChild(checklistDiv);
        
        // Add columns to container
        container.appendChild(leftColumn);
        container.appendChild(rightColumn);
        
        // Add container to sidebar
        sidebar.appendChild(container);
        
        // Close button
        const closeBtn = ModalManager.setupCloseHandlers(sidebar, backdrop);
        sidebar.appendChild(closeBtn);
        
        // Show modal
        ModalManager.showModal(sidebar, backdrop);
    }

    // Helper function to parse surgery date and get detailed info
    function getSurgeryDateInfo(surgeryDateStr) {
        if (!surgeryDateStr) return null;
        
        // Extract date from surgery date string (format: dd/mm/yyyy or yyyy-mm-dd)
        let surgeryDate;
        if (surgeryDateStr.includes('/')) {
            // Format: dd/mm/yyyy
            const [day, month, year] = surgeryDateStr.split('/');
            surgeryDate = new Date(year, month - 1, day);
        } else if (surgeryDateStr.includes('-')) {
            // Format: yyyy-mm-dd
            surgeryDate = new Date(surgeryDateStr);
        } else {
            return null;
        }
        
        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Set surgery date to start of day
        surgeryDate.setHours(0, 0, 0, 0);
        
        // Calculate days difference
        const timeDiff = today.getTime() - surgeryDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        // Determine status
        let status;
        if (daysDiff > 0) {
            status = 'past'; // Before today
        } else if (daysDiff === 0) {
            status = 'today'; // Today
        } else {
            status = 'future'; // Tomorrow or later
        }
        
        return {
            status: status,
            daysDiff: daysDiff,
            postOpDay: daysDiff >= 0 ? daysDiff : null // Only calculate for past/today surgeries
        };
    }

    // Helper function to parse surgery date and compare with today (backward compatibility)
    function getSurgeryDateStatus(surgeryDateStr) {
        const info = getSurgeryDateInfo(surgeryDateStr);
        return info ? info.status : null;
    }

    // Helper function to add surgery status icon to card
    function addSurgeryStatusIcon(card, item) {
        // Remove existing status icon if any
        const existingIcon = card.querySelector('.dr-surgery-status-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Get surgery date from item
        let surgeryDate = null;
        if (item.phauThuatInfo) {
            // From new format
            surgeryDate = item.phauThuatInfo.date || item.phauThuatInfo.ngayPhauThuat;
        } else if (item.checklistState && item.checklistState.phauThuatLog && item.checklistState.phauThuatLog.length > 0) {
            // From checklist log (latest surgery)
            surgeryDate = item.checklistState.phauThuatLog[0].date;
        }
        
        const surgeryInfo = getSurgeryDateInfo(surgeryDate);
        if (!surgeryInfo) return;
        
        // Create icon element
        const iconDiv = document.createElement('div');
        iconDiv.className = 'dr-surgery-status-icon';
        iconDiv.style.cssText = `
            position: absolute;
            top: -4px;
            left: -4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            z-index: 10;
            pointer-events: none;
        `;
        
        // Set icon and title based on status
        switch (surgeryInfo.status) {
            case 'past':
                iconDiv.textContent = '⬅️';
                iconDiv.title = `Phẫu thuật đã qua - HPN${surgeryInfo.postOpDay}`;
                break;
            case 'today':
                iconDiv.textContent = '⏸️';
                iconDiv.title = 'Hôm nay PT';
                break;
            case 'future':
                const daysUntil = Math.abs(surgeryInfo.daysDiff);
                iconDiv.textContent = '➡️';
                if (daysUntil === 1) {
                    iconDiv.title = 'Ngày mai';
                } else if (daysUntil === 2) {
                    iconDiv.title = 'Ngày mốt PT';
                } else {
                    iconDiv.title = `Còn ${daysUntil} ngày nữa PT`;
                }
                break;
        }
        
        // Add to card
        card.style.position = 'relative';
        card.appendChild(iconDiv);
    }

    function renderCards(data) {
        const sortedData = PatientDataMapper.sortPatients([...data]);
        
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

        window.refreshPatientCards = function(newData) {
            const sortedNewData = PatientDataMapper.sortPatients([...newData]);
            
            // Update existing cards instead of full re-render to avoid interrupting user
            sortedNewData.forEach((item, index) => {
                const card = container.children[index];
                if (card) {
                    // Update surgery info with post-op days using formatSurgeryInfo
                    const ptInfoContainer = card.querySelector('.dr-pt-info');
                    if (ptInfoContainer) {
                        const formattedPtInfo = formatSurgeryInfo(item);
                        // Extract just the inner content from the formatted HTML
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = formattedPtInfo;
                        const innerContent = tempDiv.querySelector('.dr-pt-info');
                        if (innerContent) {
                            ptInfoContainer.innerHTML = innerContent.innerHTML;
                        }
                    }
                    
                    // Update y lệnh tags if checklistState is available
                    if (item.checklistState) {
                        // Remove existing tags
                        const existingTags = card.querySelector('.ylenh-tags');
                        if (existingTags) {
                            existingTags.remove();
                        }
                        
                        // Add new tags if any
                        const tagsHtml = createYLenhTags(item);
                        if (tagsHtml) {
                            const btnGroup = card.querySelector('.dr-action-buttons');
                            if (btnGroup) {
                                btnGroup.insertAdjacentHTML('beforebegin', tagsHtml);
                                console.log('Updated y lệnh tags for card:', item.mabn);
                            }
                        }
                    }
                    
                    // Update surgery status icon
                    addSurgeryStatusIcon(card, item);
                }
            });
        };
    }

    // Helper function to format surgery info with post-op days
    function formatSurgeryInfo(item) {
        let ptInfo = '';
        let surgeryDate = null;
        let ptData = null;
        
        if (item.phauThuatInfo) {
            ptData = item.phauThuatInfo;
            surgeryDate = ptData.date || ptData.ngayPhauThuat;
        } else if (item.checklistState && item.checklistState.phauThuatLog && item.checklistState.phauThuatLog.length > 0) {
            // Get latest surgery from checklist log
            ptData = item.checklistState.phauThuatLog[0];
            surgeryDate = ptData.date;
        }
        
        if (ptData) {
            let dateTime = '';
            if (ptData.date && ptData.time) {
                // New format from phauThuatHandlers
                dateTime = `${ptData.date} ${ptData.time}`;
            } else if (ptData.ngayPhauThuat && ptData.gioPhauThuat) {
                // Old format
                dateTime = `${ptData.ngayPhauThuat} ${ptData.gioPhauThuat}`;
            } else if (ptData.date) {
                dateTime = ptData.date;
            } else if (ptData.ngayPhauThuat) {
                dateTime = ptData.ngayPhauThuat;
            }
            
            const method = ptData.method || ptData.pppt || '';
            
            // Calculate post-op days
            const surgeryInfo = getSurgeryDateInfo(surgeryDate);
            let postOpDisplay = '';
            if (surgeryInfo && surgeryInfo.postOpDay !== null) {
                if (surgeryInfo.status === 'today') {
                    postOpDisplay = ` <strong>(Hôm nay PT)</strong>`;
                } else {
                    postOpDisplay = ` <strong>(HPN${surgeryInfo.postOpDay})</strong>`;
                }
            } else if (surgeryInfo && surgeryInfo.status === 'future') {
                const daysUntil = Math.abs(surgeryInfo.daysDiff);
                if (daysUntil === 1) {
                    postOpDisplay = ` <strong>(Ngày mai phẫu thuật)</strong>`;
                } else if (daysUntil === 2) {
                    postOpDisplay = ` <strong>(Ngày mốt PT)</strong>`;
                } else {
                    postOpDisplay = ` <strong>(Còn ${daysUntil} ngày nữa PT)</strong>`;
                }
            }
            
            console.log('Surgery info found for patient:', item.mabn, 'PPPT:', method, 'DateTime:', dateTime, 'PostOp:', postOpDisplay);
            
            ptInfo = `<div class="dr-pt-info">
                <div class="dr-value"><span class="dr-label">PPPT:</span> ${method}${postOpDisplay}</div>
                <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
            </div>`;
        } else {
            ptInfo = '<div class="dr-pt-info"></div>';
        }
        
        return ptInfo;
    }

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

        const ptInfo = formatSurgeryInfo(item);
        
        card.innerHTML = `
            <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span> - ${item.phai === 1 ? 'Nữ' : 'Nam'} - ${formattedLocation}</h2>
            <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
            <div class="dr-value"><span class="dr-label">Chẩn đoán:</span> ${item.chandoanvk || ''}</div>
            ${ptInfo}
            ${createYLenhTags(item)}
        `;
        
        // Add action buttons
        const btnGroup = createActionButtons(item);
        card.appendChild(btnGroup);
        
        // Add surgery status icon
        addSurgeryStatusIcon(card, item);
        
        card.onclick = () => showSidebar(item);
        
        return card;
    }

    // Helper function to check celebration for card
    function checkCelebrationForCard(card, patient) {
        if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
            card.classList.remove('xuatvienanimation');
            return;
        }

        // Check if any entries contain "xuất viện"
        const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => {
            return entry.content && entry.content.toLowerCase().includes('xuất viện');
        });

        if (dischargeEntries.length > 0) {
            card.classList.add('xuatvienanimation');
        } else {
            card.classList.remove('xuatvienanimation');
        }
    }

    // Global function to check celebration animations for all cards
    window.checkAllCelebrationAnimations = function(enrichedPatients) {
        const cards = document.querySelectorAll('.dr-card');
        
        cards.forEach((card) => {
            // Get patient MABN from card
            const cardTitle = card.querySelector('h2');
            if (!cardTitle) return;
            
            const cardText = cardTitle.textContent;
            const mabnMatch = cardText.match(/(\d{8,})/); // Find MABN pattern
            if (!mabnMatch) return;
            
            const mabn = mabnMatch[1];
            
            // Find corresponding patient in enriched data
            const patient = enrichedPatients.find(p => p.mabn === mabn);
            if (patient) {
                checkCelebrationForCard(card, patient);
            }
        });
    };

    // Helper function to update patient card surgery info
    function updatePatientCardPhauThuat(patient, customChecklistState = null) {
        const cards = document.querySelectorAll('.dr-card');
        for (let card of cards) {
            const cardTitle = card.querySelector('h2');
            if (cardTitle && cardTitle.textContent.includes(patient.mabn)) {
                const checklistState = customChecklistState || window.checklistState;
                
                // Create patient object with updated checklist state for formatSurgeryInfo
                // Also ensure any existing phauThuatInfo is preserved/updated
                const patientWithState = {
                    ...patient,
                    checklistState: checklistState
                };
                
                // If checklistState has phauThuatLog, update patient's phauThuatInfo with latest entry
                if (checklistState && checklistState.phauThuatLog && checklistState.phauThuatLog.length > 0) {
                    const latestPT = checklistState.phauThuatLog[0]; // Latest is first
                    patientWithState.phauThuatInfo = {
                        date: latestPT.date,
                        time: latestPT.time,
                        method: latestPT.method,
                        doctors: latestPT.doctors,
                        // Keep backward compatibility
                        ngayPhauThuat: latestPT.date,
                        gioPhauThuat: latestPT.time,
                        pppt: latestPT.method
                    };
                }
                
                // Use formatSurgeryInfo to get formatted surgery info with post-op days
                const formattedPtInfo = formatSurgeryInfo(patientWithState);
                
                // Find existing surgery info container and update
                const existingPTContainer = card.querySelector('.dr-pt-info');
                if (existingPTContainer) {
                    console.log('PT container found, updating with formatted info');
                    // Extract just the inner content from the formatted HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = formattedPtInfo;
                    const innerContent = tempDiv.querySelector('.dr-pt-info');
                    if (innerContent) {
                        existingPTContainer.innerHTML = innerContent.innerHTML;
                    }
                    console.log('Updated PT container with post-op days and latest surgery info');
                } else {
                    console.log('PT container not found for patient:', patient.mabn);
                }
                
                // Update surgery status icon with the latest info
                addSurgeryStatusIcon(card, patientWithState);
                
                break;
            }
        }
    }

    // Make updatePatientCardPhauThuat available globally for modules
    window.updatePatientCardPhauThuat = updatePatientCardPhauThuat;

    // Helper function to create action buttons
    function createActionButtons(item) {
        const btnToDieuTri = createToDieuTriButton(item);
        const btnHsba2 = createHsbaButton(item);
        
        const btnGroup = document.createElement('div');
        btnGroup.className = 'dr-action-buttons';
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

},{"./BS_CAI_DAT_GIAO_DIEN":1,"./components/loginHandler":5,"./components/modalManager":6,"./components/patientInfoSection":7,"./components/phauThuatHandlers":8,"./dashboard.support":11,"./services/checklistService":14,"./services/patientService":15,"./utils":17,"./utils/patientDataMapper":19,"./utils/tagUtils":20}],11:[function(require,module,exports){
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
        /* Xuất viện animation class - Hiệu ứng ngôi sao */
        .dr-card.xuatvienanimation {
            position: relative;
            overflow: hidden;
            border: 3px solid #ffd700 !important;
            background: linear-gradient(135deg, #fff9c4, #ffffff) !important;
            animation: starGlow 3s ease-in-out infinite;
        }
        
        /* Xuất viện animation cho card blue - border blue glow */
        .dr-card.xuatvienanimation.dr-blue {
            border: 3px solid #2196f3 !important;
            background: linear-gradient(135deg, #e3f2fd, #ffffff) !important;
            animation: starGlowBlue 3s ease-in-out infinite;
        }
        
        .dr-card.xuatvienanimation::before {
            content: '⭐';
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 24px;
            animation: starRotate 2s linear infinite;
            z-index: 10;
        }
        
        .dr-card.xuatvienanimation::after {
            content: '✨ 🎉 ✨';
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            animation: sparkle 1.5s ease-in-out infinite;
            z-index: 10;
        }
        
        @keyframes starGlow {
            0%, 100% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 20px rgba(255, 215, 0, 0.4);
            }
            50% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 30px rgba(255, 215, 0, 0.8);
            }
        }
        
        @keyframes starGlowBlue {
            0%, 100% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 20px rgba(33, 150, 243, 0.4);
            }
            50% { 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10), 0 0 30px rgba(33, 150, 243, 0.8);
            }
        }
        
        @keyframes starRotate {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(90deg) scale(1.2); }
            50% { transform: rotate(180deg) scale(1); }
            75% { transform: rotate(270deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes sparkle {
            0%, 100% { 
                opacity: 0.6;
                transform: translateX(-50%) translateY(0px);
            }
            50% { 
                opacity: 1;
                transform: translateX(-50%) translateY(-5px);
            }
        }
        
        @media print {
            .no-print { 
                display: none !important; 
            }
            /* White cards (214, 215, 216) - giữ màu trắng khi in */
            .dr-card:not(.dr-blue) {
                background: #0d8ae3ff !important;
                border: 2px solid #c4490bff !important;
                color: #000 !important;
            }
            /* Blue cards (các phòng khác) - giữ background blue khi in */
            .dr-card.dr-blue {
                background: #e3f2fd !important;
                border: 2px solid #2196f3 !important;
                color: #000 !important;
            }
            .dr-card h2 {
                color: #000 !important;
            }
            .dr-bottom-bar {
                display: none !important;
            }
            /* Tắt animation khi in */
            .dr-card.xuatvienanimation,
            .dr-card.xuatvienanimation.dr-blue {
                animation: none !important;
                border: 2px solid #ccc !important;
                background: #fff !important;
            }
            .dr-card.xuatvienanimation::before,
            .dr-card.xuatvienanimation.dr-blue::before {
                display: none !important;
            }
            .dr-card.xuatvienanimation::after,
            .dr-card.xuatvienanimation.dr-blue::after {
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

},{"./components/dialogManager":4,"./services/apiService":13,"./services/reportService":16}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"../utils/dateUtils":18,"./apiService":13}],15:[function(require,module,exports){
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
                        
                        // Store checklist state for y lệnh tags
                        enrichedPatients[actualIndex].checklistState = checklistState;
                        
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

        // Check for celebration animations after enrichment
        setTimeout(() => {
            if (typeof window.checkAllCelebrationAnimations === 'function') {
                window.checkAllCelebrationAnimations(enrichedPatients);
            }
        }, 200);

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
            
            // Check for celebration animations after background enrichment
            setTimeout(() => {
                if (typeof window.checkAllCelebrationAnimations === 'function') {
                    window.checkAllCelebrationAnimations(enrichedData);
                }
            }, 200);
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

},{"../components/loginHandler":5,"../dashboard.support":11,"../utils/patientDataMapper":19,"./checklistService":14}],16:[function(require,module,exports){
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

},{"../utils/dateUtils":18,"../utils/patientDataMapper":19}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
// tagUtils.js
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

// Helper function to create y lệnh tags
function createYLenhTags(patient) {
    console.log('DEBUG createYLenhTags - patient:', patient.mabn, 'checklistState:', !!patient.checklistState);
    
    if (!patient.checklistState || !patient.checklistState.yLenhLog || !Array.isArray(patient.checklistState.yLenhLog)) {
        console.log('No yLenhLog found for patient:', patient.mabn);
        return '';
    }

    // Filter for today's entries (INCLUDE all entries for dashboard cards)
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    const todayEntries = patient.checklistState.yLenhLog.filter(entry => {
        return entry.timestamp && entry.timestamp.startsWith(todayStr);
    });

    console.log('Today entries (including quick actions) for patient', patient.mabn, ':', todayEntries);

    if (todayEntries.length === 0) {
        return '';
    }

    // Take only first 3 entries (most recent)
    const displayEntries = todayEntries.slice(0, 3);
    
    const tagsHtml = displayEntries.map(entry => {
        // Determine tag color based on content
        let color = '#4caf50'; // default green
        const content = entry.content.toLowerCase();
        let isDischarge = false;
        
        if (content.includes('xuất viện')) {
            color = '#4caf50';
            isDischarge = true;
        }
        else if (content.includes('rút odl')) color = '#ff9800';
        else if (content.includes('sonde')) color = '#9c27b0';
        else if (content.includes('thay băng')) color = '#2196f3';
        
        const dischargeClass = isDischarge ? ' discharge' : '';
        
        return `<span class="ylenh-tag${dischargeClass}" style="background-color: rgba(${hexToRgb(color)}, 0.1); color: ${color}; border-color: rgba(${hexToRgb(color)}, 0.3);">
            <span class="icon">📋</span>
            ${entry.content}
        </span>`;
    }).join('');

    console.log('Generated tags HTML for patient', patient.mabn, ':', tagsHtml);
    
    return `<div class="ylenh-tags">${tagsHtml}</div>`;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '76, 175, 80'; // fallback green
}

// Helper function to check for discharge tags and add xuatvienanimation class
function checkAndAddCelebrationClass(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        console.log('No checklistState or yLenhLog for patient:', patient?.mabn);
        return;
    }

    // Check if today's entries include "Xuất viện" (including quick actions)
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    console.log('DEBUG checkAndAddCelebrationClass - Today:', todayStr);
    console.log('DEBUG checkAndAddCelebrationClass - yLenhLog entries:', patient.checklistState.yLenhLog);
    
    // Check ALL entries (including quick actions) for "xuất viện"
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => {
        const hasDischarge = entry.content && entry.content.toLowerCase().includes('xuất viện');
        const isToday = entry.timestamp && entry.timestamp.startsWith(todayStr);
        
        console.log('DEBUG entry:', entry.content, 'timestamp:', entry.timestamp, 'hasDischarge:', hasDischarge, 'isToday:', isToday);
        
        // Check for today's discharge entries (including quick actions)
        return hasDischarge && isToday;
    });

    console.log('DEBUG discharge entries found:', dischargeEntries);

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
        console.log('🎉 Added xuatvienanimation class to card for patient:', patient.mabn);
    } else {
        card.classList.remove('xuatvienanimation');
        console.log('❌ No discharge entries found for patient:', patient.mabn);
    }
}

// Global function to update patient card tags
function updatePatientCardTags(patientMabn) {
    console.log('updatePatientCardTags called for patient:', patientMabn);
    
    if (!window.dr_data) {
        console.log('No dr_data found');
        return;
    }

    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
    if (!patient) {
        console.log('Patient not found in dr_data:', patientMabn);
        return;
    }

    // Try multiple selectors to find the patient card
    console.log('Looking for patient card with mabn:', patientMabn);
    
    // Look for cards that contain this patient's mabn
    const allCards = document.querySelectorAll('.dr-card');
    console.log('Found total cards:', allCards.length);
    
    let targetCard = null;
    allCards.forEach((card, index) => {
        const cardText = card.textContent || card.innerText || '';
        console.log(`Card ${index} text snippet:`, cardText.substring(0, 100));
        if (cardText.includes(patientMabn)) {
            targetCard = card;
            console.log('Found matching card at index:', index);
        }
    });

    if (!targetCard) {
        console.log('Patient card not found in DOM for:', patientMabn);
        console.log('Available card text snippets:');
        allCards.forEach((card, index) => {
            const cardText = card.textContent || card.innerText || '';
            console.log(`  Card ${index}:`, cardText.substring(0, 50));
        });
        return;
    }

    console.log('Found patient card for:', patientMabn);
    
    // Find the action buttons container within this card
    const actionButtons = targetCard.querySelector('.dr-action-buttons');
    if (!actionButtons) {
        console.log('No .dr-action-buttons found in target card');
        return;
    }
    
    // Remove existing tags from anywhere in the card
    const existingTags = targetCard.querySelector('.ylenh-tags');
    if (existingTags) {
        existingTags.remove();
        console.log('Removed existing tags');
    }

    // Create new tags
    const tagsHtml = createYLenhTags(patient);
    if (tagsHtml) {
        // Insert tags before the action buttons
        actionButtons.insertAdjacentHTML('beforebegin', tagsHtml);
        console.log('Inserted new tags before actions container');
        
        // Check if there's a discharge tag and add celebration class to card
        checkAndAddCelebrationClass(targetCard, patient);
    } else {
        console.log('No tags to display for patient:', patientMabn);
        // Remove xuatvienanimation class if no tags
        targetCard.classList.remove('xuatvienanimation');
    }
}

// Make updatePatientCardTags globally available
if (typeof window !== 'undefined') {
    window.updatePatientCardTags = updatePatientCardTags;
}

// Helper function to check if patient has discharge tag
function hasDischargeTag(patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        return false;
    }
    
    return patient.checklistState.yLenhLog.some(entry => {
        return entry.content && entry.content.toLowerCase().includes('xuất viện');
    });
}

module.exports = { 
    createYLenhTags, 
    updatePatientCardTags,
    hexToRgb,
    hasDischargeTag 
};

},{"../BS_CAI_DAT_GIAO_DIEN":1}]},{},[3]);
