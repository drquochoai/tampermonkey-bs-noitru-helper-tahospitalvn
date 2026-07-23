// ==UserScript==
// @name         BS Nội trú - Helper (TA Hospital) - By drquochoai, BS.CKI Trần Quốc Hoài
// @namespace    http://tampermonkey.net/
// @version      2.2.9
// @description  Hỗ trợ dữ liệu bệnh nhân từ bs-noitru.tahospital.vn.
// @author       BS.CKI Trần Quốc Hoài, tahospital.vn
// @match        https://bs-noitru.tahospital.vn/*
// @match        https://dd-noitru.tahospital.vn/*
// @match        https://hsba.tahospital.vn/*
// @match        https://otm.tahospital.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @license      MIT
// @connect      google.com
// @connect      tahospital.vn
// @connect      bs-noitru.tahospital.vn
// @connect      script.google.com
// @connect      googleusercontent.com
// @sandbox      MAIN_WORLD
// ==/UserScript==

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// BS_CAI_DAT_GIAO_DIEN.js
// File cấu hình giao diện cho hệ thống Bệnh Sử Nội Trú
// Có thể chỉnh sửa các cài đặt này để tùy chỉnh giao diện

const BS_CAI_DAT = {
    // ================== CÀI ĐẶT HSBA ==================
    // Quy tắc xử lý tài liệu HSBA.
    // - tenmau: Tên mẫu tài liệu gốc từ HSBA V2
    // - show: true nếu muốn hiển thị trong danh sách "dr-hsba-item"
    // - sync: true nếu muốn dùng tài liệu này để đồng bộ với checklist bộ mổ
    // - checklist: (tùy chọn) Nhãn checklist mục tiêu khi sync === true
    // Lưu ý: Một mục có thể chỉ show (hiển thị) hoặc chỉ sync (đồng bộ) hoặc cả hai.
    HSBA_CHECKLIST_MAP: [
        // Hiển thị + Đồng bộ vào checklist
        { tenmau: 'Phiếu khám bệnh vào viện', show: true, sync: true, checklist: 'Phiếu Khám vào viện (hsoft)' },
        { tenmau: 'Biên bản hội chẩn duyệt mổ', show: true, sync: true, checklist: 'Tạo Biên bản Hội chẩn duyệt mổ (web)' },
        { tenmau: 'Phiếu cung cấp thông tin chẩn đoán, điều trị và chi phí', show: true, sync: true, checklist: 'Phiếu cung cấp thông tin, chẩn đoán và điều trị (hsoft)' },
        { tenmau: 'Giấy cam đoan thực hiện Phẫu thuật, Thủ thuật và Gây mê hồi sức', show: true, sync: true, checklist: '57. Cam kết phẫu thuật thủ thuật (hsoft)' },
        { tenmau: 'Phiếu khai thác tiền sử dị ứng', show: true, sync: true, checklist: 'Phiếu khai thác tiền sử dị ứng (hsoft)' },
        { tenmau: 'Phiếu HKTT trên bệnh người Phẫu thuật', show: false, sync: true, checklist: 'Đánh giá nguy cơ huyết khối (web)' },
        { tenmau: 'Phiếu khám tiền mê', show: true, sync: true, checklist: 'ĐÃ khám tiền mê CHƯA?' },

        // Chỉ hiển thị (không sync checklist)
        { tenmau: 'Phiếu khám chuyên khoa', show: true, sync: false },
        { tenmau: 'Phiếu tường trình phẫu thuật, thủ thuật', show: true, sync: false },
        { tenmau: 'Phiếu khám bệnh', show: true, sync: false },
        { tenmau: 'Toa thuốc ngoại trú', show: true, sync: false },

        // Không hiển thị (chỉ sync checklist)
        { tenmau: 'Phiếu Theo dõi điều trị', show: true, sync: true, checklist: 'Tờ điều trị (web)' },

        // Có thể bổ sung thêm nếu cần
    ],
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
        'Tạo tờ điều trị cuối (chỉnh chẩn đoán, ICD)',
        'Mở trang dặn dò',
        'Giấy ra viện',
        'Tóm tắt bệnh án',
        // Tờ điều trị sẽ có checklist con
        {
            label: 'Tờ điều trị',
            children: [
                'Thực hiện y lệnh thuốc đã dự trù',
                'Cấp các cử thuốc còn lại của người bệnh khi xuất viện',
                'Ký toa thuốc ra viện, In toa',
                'Chuyển dược',
                'Ký số các CLS tồn',
                'Tổng kết bệnh án trong tờ điều trị',
                'Tổng kết bệnh án điện tử',
            ]
        }
    ],

    // ================== CÀI ĐẶT Y LỆNH QUICK ACTIONS ==================
    quickYLenhActions: [
        { label: 'Xuất viện', icon: '🏠', color: '#4caf50', status: 3 },
        { label: 'Cận lâm sàng', icon: '🧪', color: '#06b6d4', status: 3 },
        { label: 'Đã đánh thuốc', icon: '💊', color: '#16a34a', status: 2 },
        { label: 'Thay băng', icon: '👗', color: '#310994ff', status: 3 },
        { label: 'Rút ODL vết mổ', icon: '🩹', color: '#ff9800', status: 3 },
        { label: 'Rút ODL phổi', icon: '🫁', color: '#2196f3', status: 3 },
        { label: 'Rút sonde tiểu', icon: '🔗', color: '#9c27b0', status: 3 },
        { label: 'Xquang', icon: '🩺', color: '#2196f3', status: 3 },
        { label: 'Đi mổ', icon: '🩹', color: '#ff9800', status: 3 },
        { label: 'VLTL', icon: '🩺', color: '#2196f3', status: 3 }
    ],

    // ================== CÀI ĐẶT BÁC SĨ ==================
    danhSachBacSi: [
        'PGS.TS.BS Vũ Hữu Vĩnh',
        'TS.BS Nguyễn Anh Dũng',
        'ThS.BS Lê Thị Ngọc Hằng',
        'BS.CKI Trần Quốc Hoài',
        'ThS.BS Lê Chí Hiếu',
        'ThS.BS Phan Vũ Hồng Hải',
        'ThS.BSNT.CKI Phạm Hưng',
        'ThS.BS Nguyễn Đức Nghĩa'
    ],

    // ================== CÀI ĐẶT THẺ TRẮNG (WHITE-CARD ROOMS) ==================
    // Danh sách phòng sẽ hiển thị thẻ màu trắng (sử dụng bởi isWhiteCard(room))
    whiteCardRooms: [
        'Phòng 302',
        'Phòng 303',
        'Phòng 304',
        'Phòng 306D',
        'Phòng 307',
        'Phòng 305D',
        'Phòng 300',
        'Phòng 301'
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
        enableLogging: false, // Bật/tắt console.log
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
            gap: '8px',
            borderRadius: '13px',
            padding: '6px',
        },

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
// BS_CAI_DAT_GPB_CAT_LANH.js
// Cấu hình cho copy GPB cắt lạnh

const BS_CAI_DAT_GPB_CAT_LANH = {
    defaultExpectedMinutes: 90,
    defaultMongMuonBiet: 'lành/ác',
    defaultFallbackSpecimen: 'Mẫu bệnh phẩm theo chẩn đoán',
    rules: [
        {
            label: 'Giáp',
            keywords: 'giáp',
            matchMode: 'OR',
            mau_benh_pham: 'nhân giáp {laterality}',
            mong_muon_biet: 'Lành/ác, xâm lấn vỏ bao không'
        },
        {
            label: 'U phổi',
            keywords: 'u phổi|phổi',
            matchMode: 'OR',
            mau_benh_pham: 'u {laterality}',
            mong_muon_biet: 'Lành/ác'
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BS_CAI_DAT_GPB_CAT_LANH;
}

if (typeof window !== 'undefined') {
    window.BS_CAI_DAT_GPB_CAT_LANH = BS_CAI_DAT_GPB_CAT_LANH;
}

},{}],3:[function(require,module,exports){
// DanhSachBenhNhan.js
function DanhSachBenhNhan() {
    this.danhSach = null;
    this.lastFetched = null;
    this.autoFetchTimer = null;
    this.fixedMabn = "51991h991h991h991";
}

DanhSachBenhNhan.prototype.layDanhSachTheoMaBNFixed = function () {
    var self = this;
    return this._fetchDanhSach(this.fixedMabn).then(function (data) {
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


DanhSachBenhNhan.prototype.startAutoFetch = function () {
    var self = this;
    if (this.autoFetchTimer) clearInterval(this.autoFetchTimer);
    this.autoFetchTimer = setInterval(function () { self._autoFetch7h(); }, 60000);
};
DanhSachBenhNhan.prototype._autoFetch7h = function () {
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

DanhSachBenhNhan.prototype.addFetchButtonToBottomBar = function () {
    var self = this;
    function addBtn() {
        var bar = document.querySelector('.dr-bottom-bar');
        if (!bar || bar.querySelector('#btn-fetch-fixed-mabn')) return;
        var btn = document.createElement('button');
        btn.id = 'btn-fetch-fixed-mabn';
        btn.innerText = 'Lấy DSBN (MABN cố định)';
        btn.className = 'btn btn-info';
        btn.style.marginLeft = '12px';
        btn.onclick = function () { self.layDanhSachTheoMaBNFixed(); };
        bar.appendChild(btn);
    }
    addBtn();
    document.addEventListener('DOMContentLoaded', addBtn);
    setTimeout(addBtn, 2000);
};

DanhSachBenhNhan.prototype._fetchDanhSach = function (mabn) {
    var self = this;
    return new Promise(function (resolve) {
        var formData = new FormData();
        formData.append('mabn', mabn);
        var now = new Date();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var year = now.getFullYear();
        var dateStr = month + '/' + day + '/' + year + ' 07:00';
        formData.append('tungay', "01/01/1001 01:01");
        formData.append('denngay', "01/01/3001 01:01");
        fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        }).then(function (r) { return r.json(); }).then(function (res) {
            if (res && res.data) resolve(res.data);
            else {
                if (window.DanhSachBenhNhanManager && typeof window.DanhSachBenhNhanManager.uploadChecklistWithDrData === 'function') {
                    window.DanhSachBenhNhanManager.uploadChecklistWithDrData(mabn, function (uploadRes) {
                        resolve(null);
                    });
                } else {
                    resolve(null);
                }
            }
        }).catch(function () { resolve(null); });
    });
};

DanhSachBenhNhan.prototype.uploadChecklistWithDrData = function (mabn, callback) {
    var formData = new FormData();
    formData.append('status', '1');
    formData.append('thebaohiemyte', 'Không');
    formData.append('dieukhoancamket', 'true');
    formData.append('chuky', JSON.stringify(window.dr_data || {}));
    formData.append('khac', '--*--');
    formData.append('khu', '1');
    formData.append('mabn', mabn);
    formData.append('bieumauid', '027');
    try {
        const { getSelectedKhoa } = require('./utils/khoaUtils');
        formData.append('makp', getSelectedKhoa('551'));
    } catch (_) {
        formData.append('makp', '551');
    }
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
    }).then(function (r) { return r.json(); }).then(function (res) {
        if (typeof callback === 'function') callback(res);
    }).catch(function () {
        if (typeof callback === 'function') callback(null);
    });
};

module.exports = DanhSachBenhNhan;

},{"./utils/khoaUtils":56}],4:[function(require,module,exports){
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
},{"./DanhSachBenhNhan":3,"./components/autoLoginToggle":7,"./components/copyDienTienAI":10,"./components/hsbaDataFetcher":14,"./googleAppsScript":27,"./pages/otm-entry":28,"./pages/page.dashboard":30,"./pages/page.lichmo.homnay":32,"./pages/page.settings":34,"./services/checklistService":38,"./utils":47,"./utils/hsbaV2Download":54}],5:[function(require,module,exports){
// components/actionButtons.js - shared creators for action buttons
const ChecklistService = require('../services/checklistService');
const ReportService = require('../services/reportService');

async function openHSBAV2Link(mabn) {
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
            window.open(`/hoso/${encodeURIComponent(String(mabn))}`, '_blank');
        }
    } catch (_) {
        window.open(`/hoso/${encodeURIComponent(String(mabn))}`, '_blank');
    }
}

function createCopyOneButton({ item, variant = 'icon' }) {
    const isIcon = variant === 'icon';
    const btn = document.createElement('button');
    btn.className = isIcon ? 'dr-btn-icon' : 'dr-detail-btn no-print';
    if (!isIcon) {
        btn.style.position = 'static';
        btn.style.padding = '8px';
        btn.style.borderRadius = '10px';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
    }
    btn.title = 'Copy báo cáo (1 BN)';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>' + (isIcon ? '' : ' Copy');
    btn.onclick = async (e) => {
        e.stopPropagation();
        try {
            const { copyReportToClipboardRich } = require('../pages/page.dashboard.support');
            const res = await ChecklistService.loadChecklistData(item);
            const obj = ChecklistService.findChecklistObject(res);
            const state = obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
            const html = ReportService.generateSingleHTML(item, state);
            const text = ReportService.generateSingleText(item, state);
            await copyReportToClipboardRich(html, text);
        } catch (err) {
            console.error('Copy single-patient report failed:', err);
        }
    };
    return btn;
}

function createToDieuTriButton({ item, variant = 'full' }) {
    const isIcon = variant === 'icon';
    const btn = document.createElement('button');
    btn.className = isIcon ? 'dr-btn-icon' : 'dr-detail-btn no-print';
    if (!isIcon) {
        btn.style.position = 'static';
        btn.style.fontSize = '14px';
        btn.style.padding = '8px 12px 8px 10px';
    }
    btn.title = 'Tờ điều trị';
    const svgDoc = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1v4h4l-4-4zM8 9h8v2H8V9zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>';
    btn.innerHTML = isIcon ? svgDoc : `${svgDoc}Tờ điều trị`;
    btn.onclick = (e) => {
        e.stopPropagation();
        if (item.mabn) window.open(`/to-dieu-tri?mabn=${encodeURIComponent(item.mabn)}`, '_blank');
    };
    return btn;
}

function createHsbaButton({ item, variant = 'full' }) {
    const isIcon = variant === 'icon';
    const btn = document.createElement('button');
    btn.className = isIcon ? 'dr-btn-icon' : 'dr-detail-btn no-print';
    if (!isIcon) {
        btn.style.position = 'static';
        btn.style.marginLeft = '8px';
        btn.style.fontSize = '14px';
        btn.style.padding = '8px 12px 8px 10px';
        btn.textContent = 'HSBA V2';
    } else {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-4.97 0-8.19-4.16-8.94-5C3.81 10.16 7.03 6 12 6s8.19 4.16 8.94 5c-.75.84-3.97 5-8.94 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>';
    }
    btn.title = 'HSBA V2';
    btn.onclick = (e) => { e.stopPropagation(); openHSBAV2Link(item.mabn); };
    return btn;
}

module.exports = {
    createCopyOneButton,
    createToDieuTriButton,
    createHsbaButton,
    createHsbaV1Button,
    openHSBAV2Link
};

// Legacy HSBA (v1) opener as a shared creator
function createHsbaV1Button(item) {
    const btn = document.createElement('button');
    btn.className = 'dr-detail-btn no-print';
    btn.style.position = 'static';
    btn.style.marginLeft = '8px';
    btn.textContent = 'HSBAv1';
    btn.onclick = function (e) {
        e.stopPropagation();
        try {
            if (!item || !item.mabn) return;
            const url = `/hoso/${encodeURIComponent(String(item.mabn))}`;
            window.open(url, '_blank', 'noopener');
        } catch (error) {
            console.warn('Open HSBAv1 failed', error);
        }
    };
    return btn;
}

},{"../pages/page.dashboard.support":31,"../services/checklistService":38,"../services/reportService":41}],6:[function(require,module,exports){
// advancedFilter.js - Logic for advanced dashboard filtering
const DialogManager = require('./dialogManager');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const Utils = require('../utils');
const DateUtils = require('../utils/dateUtils');
const { createResponsiveDropdownController } = require('./responsiveDropdown');

/**
 * Trích xuất tên gốc của bác sĩ, loại bỏ các chức danh (BS, TS, ThS...)
 */
function getBaseName(name) {
    if (!name) return '';
    const titles = ['pgs', 'ts', 'bs', 'ths', 'bsnt', 'cki', 'ckii', 'ck1', 'ck2', 'bác', 'sĩ', 'gs'];
    return name.toLowerCase()
        .replace(/[.,;/()\-]/g, ' ') // Thay dấu câu bằng khoảng trắng, thay vì dùng regex phức tạp dễ mất chữ 'đ'
        .split(/\s+/)
        .filter(w => w && !titles.includes(w))
        .join(' ');
}

function hasMedsDoneBadgeForItem(item) {
    if (!item) return false;
    const ids = [item.mabn, item.pid, item.maBN, item.ma_benh_nhan]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean);
    const selectors = ids.flatMap(id => [
        `.dr-card[data-mabn="${id}"] .dr-badge-meds-done`,
        `.dr-list-row[data-mabn="${id}"] .dr-badge-meds-row-corner`
    ]);
    return selectors.some(selector => !!document.querySelector(selector));
}


let advancedFilterState = {
    active: false,
    onlyXuatVien: false,  // Lọc BN xuất viện
    onlyCanLamSang: false, // Lọc BN cần cận lâm sàng
    onlyChuaDanhThuoc: false, // Lọc BN chưa đánh thuốc hôm nay
    yLenhTags: [],      // Array of strings
    yLenhTagsLogic: 'OR', // 'OR' | 'AND'
    surgeryName: '',     // %like% search
    surgeons: [],       // Array of objects { name, role: 'any'|'main'|'1'|'2'|'3' }
    surgeonsLogic: 'OR', // 'OR' | 'AND'
    surgeryDate: null,   // 'yesterday' | 'today' | 'tomorrow' | null
};

/**
 * Setup Advanced Filter button and logic
 */
function setupAdvancedFilter(topBar, onApply) {
    const topbarRight = topBar.querySelector('.dr-topbar-right');
    if (!topbarRight) return;
    const dropdownController = createResponsiveDropdownController({ breakpoint: 1180 });

    const filterDropdown = document.createElement('div');
    filterDropdown.id = 'dr-advanced-filter-container';
    filterDropdown.className = 'dr-filter-dropdown dr-topbar-dropdown';
    filterDropdown.style.cssText = 'position:relative; display:inline-block;';

    const filterBtn = document.createElement('button');
    filterBtn.type = 'button';
    filterBtn.id = 'dr-advanced-filter-btn';
    filterBtn.className = 'dr-topbar-control-btn dr-dropdown-toggle';
    filterBtn.title = 'Click để mở bộ lọc nâng cao; trên màn nhỏ sẽ mở lọc nhanh.';
    filterBtn.style.cssText = `
        height: 38px;
        padding: 0 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #475569;
        transition: all 0.2s;
        white-space: nowrap;
    `;
    filterBtn.innerHTML = '<i class="fas fa-filter"></i> <span class="dr-topbar-btn-text">Lọc</span> <span id="dr-filter-badge" style="display:none; background:#1976d2; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px;">0</span> <i class="fas fa-chevron-down" style="font-size:0.8em; opacity:0.7;"></i>';

    const quickMenu = document.createElement('div');
    quickMenu.className = 'dr-dropdown-menu dr-filter-quick-menu';
    quickMenu.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px 10px; border-bottom:1px solid #e2e8f0; margin-bottom:6px;">
            <span style="font-size:12px; font-weight:700; color:#475569;">Lọc nhanh</span>
            <span style="font-size:11px; color:#94a3b8;">Click menu</span>
        </div>
        <div class="dr-dropdown-item dr-filter-open-dialog" role="button">
            <span style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-sliders-h"></i>
                <span>Bộ lọc nâng cao</span>
            </span>
        </div>
        <div class="dr-dropdown-item dr-filter-quick-item" data-quick-filter="chuadanhthuoc" role="button" aria-pressed="false">
            <span style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-pills"></i>
                <span>Chưa đánh thuốc</span>
            </span>
            <i class="fas fa-check dr-filter-quick-indicator"></i>
        </div>
        <div class="dr-dropdown-item dr-filter-quick-item" data-quick-filter="xuatvien" role="button" aria-pressed="false">
            <span style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-sign-out-alt"></i>
                <span>Xuất viện</span>
            </span>
            <i class="fas fa-check dr-filter-quick-indicator"></i>
        </div>
        <div class="dr-dropdown-item dr-filter-quick-item" data-quick-filter="canlamsang" role="button" aria-pressed="false">
            <span style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-microscope"></i>
                <span>Cận lâm sàng</span>
            </span>
            <i class="fas fa-check dr-filter-quick-indicator"></i>
        </div>
        <div class="dr-filter-submenu">
            <div class="dr-dropdown-item dr-filter-submenu-trigger" role="button">
                <span style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Ngày phẫu thuật</span>
                </span>
                <span style="display:flex; align-items:center; gap:8px; margin-left:auto;">
                    <span id="dr-filter-quick-date-value" class="dr-filter-quick-date-value">Tất cả</span>
                    <i class="fas fa-chevron-right" style="font-size:11px; opacity:0.7;"></i>
                </span>
            </div>
            <div class="dr-filter-submenu-menu">
                <div class="dr-dropdown-item dr-filter-submenu-item" data-surgery-date="" role="button">Tất cả</div>
                <div class="dr-dropdown-item dr-filter-submenu-item" data-surgery-date="yesterday" role="button">Hôm qua</div>
                <div class="dr-dropdown-item dr-filter-submenu-item" data-surgery-date="today" role="button">Hôm nay</div>
                <div class="dr-dropdown-item dr-filter-submenu-item" data-surgery-date="tomorrow" role="button">Ngày mai</div>
            </div>
        </div>
        <div style="border-top:1px solid #e2e8f0; margin-top:6px; padding-top:6px;">
            <div class="dr-dropdown-item dr-filter-quick-clear" data-quick-filter-action="clear" role="button">
                <span style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-eraser"></i>
                    <span>Bỏ lọc nhanh</span>
                </span>
            </div>
            <div style="padding:8px 12px 4px; font-size:11px; color:#94a3b8; line-height:1.45;">
                Click nút Lọc để mở bộ lọc nâng cao đầy đủ.
            </div>
        </div>
    `;
    filterDropdown.appendChild(filterBtn);
    filterDropdown.appendChild(quickMenu);
    
    // Insert before sort/view controls when present
    const insertBeforeEl = topBar.querySelector('#dr-sort-dropdown-container')
        || topBar.querySelector('#dr-view-dropdown-container')
        || topBar.querySelector('#dr-view-toggle-premium')
        || topBar.querySelector('#dr-view-toggle');
    if (insertBeforeEl) {
        topbarRight.insertBefore(filterDropdown, insertBeforeEl);
    } else {
        topbarRight.appendChild(filterDropdown);
    }

    dropdownController.register({
        id: 'dr-advanced-filter-container',
        container: filterDropdown,
        toggle: filterBtn,
        menu: quickMenu,
        align: 'auto',
        bindToggle: false
    });

    filterBtn.onclick = (e) => {
        e.stopPropagation();
        const isCompact = dropdownController.shouldUseCompactMode('dr-advanced-filter-container');
        if (isCompact) {
            dropdownController.toggle('dr-advanced-filter-container');
            return;
        }
        dropdownController.closeAll();
        openFilterDialog(onApply);
    };

    const submenu = quickMenu.querySelector('.dr-filter-submenu');
    const submenuTrigger = quickMenu.querySelector('.dr-filter-submenu-trigger');
    const submenuMenu = quickMenu.querySelector('.dr-filter-submenu-menu');
    if (submenuTrigger && submenu && submenuMenu) {
        dropdownController.registerSubmenu({
            id: 'dr-filter-surgery-date-submenu',
            parentId: 'dr-filter-dropdown',
            container: submenu,
            toggle: submenuTrigger,
            trigger: submenuTrigger,
            menu: submenuMenu,
            align: 'auto',
            bindToggle: true
        });
    }

    const openDialogItem = quickMenu.querySelector('.dr-filter-open-dialog');
    if (openDialogItem) {
        openDialogItem.onclick = (e) => {
            e.stopPropagation();
            dropdownController.closeAll();
            openFilterDialog(onApply);
        };
    }

    quickMenu.querySelectorAll('[data-quick-filter]').forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            const filterType = item.getAttribute('data-quick-filter');
            if (filterType === 'chuadanhthuoc') {
                advancedFilterState.onlyChuaDanhThuoc = !advancedFilterState.onlyChuaDanhThuoc;
            } else if (filterType === 'xuatvien') {
                advancedFilterState.onlyXuatVien = !advancedFilterState.onlyXuatVien;
            } else if (filterType === 'canlamsang') {
                advancedFilterState.onlyCanLamSang = !advancedFilterState.onlyCanLamSang;
            }
            refreshAdvancedFilterUI();
            if (onApply) onApply();
        };
    });

    quickMenu.querySelectorAll('[data-surgery-date]').forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            const nextValue = item.getAttribute('data-surgery-date') || null;
            advancedFilterState.surgeryDate = nextValue;
            refreshAdvancedFilterUI();
            if (onApply) onApply();
        };
    });

    const clearQuickBtn = quickMenu.querySelector('[data-quick-filter-action="clear"]');
    if (clearQuickBtn) {
        clearQuickBtn.onclick = (e) => {
            e.stopPropagation();
            advancedFilterState.onlyChuaDanhThuoc = false;
            advancedFilterState.onlyXuatVien = false;
            advancedFilterState.onlyCanLamSang = false;
            advancedFilterState.surgeryDate = null;
            refreshAdvancedFilterUI();
            if (onApply) onApply();
        };
    }

    // Initial badge update
    refreshAdvancedFilterUI();
}

/**
 * Update the numeric badge on the filter button
 */
function updateFilterBadge(btn) {
    const badge = btn.querySelector('#dr-filter-badge');
    if (!badge) return;

    let count = 0;
    if (advancedFilterState.onlyChuaDanhThuoc) count++;
    if (advancedFilterState.onlyXuatVien) count++;
    if (advancedFilterState.onlyCanLamSang) count++;
    if (advancedFilterState.yLenhTags.length > 0) count++;
    if (advancedFilterState.surgeryName.trim()) count++;
    if (advancedFilterState.surgeons.length > 0) count++;
    if (advancedFilterState.surgeryDate) count++;

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
        btn.style.borderColor = '#1976d2';
        btn.style.color = '#1976d2';
        btn.style.background = '#eff6ff';
        advancedFilterState.active = true;
    } else {
        badge.style.display = 'none';
        btn.style.borderColor = '#cbd5e1';
        btn.style.color = '#475569';
        btn.style.background = '#f8fafc';
        advancedFilterState.active = false;
    }
}

function getQuickFilterDateLabel() {
    if (advancedFilterState.surgeryDate === 'yesterday') return 'Hôm qua';
    if (advancedFilterState.surgeryDate === 'today') return 'Hôm nay';
    if (advancedFilterState.surgeryDate === 'tomorrow') return 'Ngày mai';
    return 'Tất cả';
}

function refreshAdvancedFilterUI() {
    const filterBtn = document.getElementById('dr-advanced-filter-btn');
    if (filterBtn) updateFilterBadge(filterBtn);

    const filterDropdown = document.getElementById('dr-advanced-filter-container');
    if (!filterDropdown) return;

    filterDropdown.querySelectorAll('[data-quick-filter]').forEach(item => {
        const filterType = item.getAttribute('data-quick-filter');
        const isActive = filterType === 'chuadanhthuoc'
            ? !!advancedFilterState.onlyChuaDanhThuoc
            : filterType === 'xuatvien'
                ? !!advancedFilterState.onlyXuatVien
                : !!advancedFilterState.onlyCanLamSang;

        item.classList.toggle('active', isActive);
        item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        const indicator = item.querySelector('.dr-filter-quick-indicator');
        if (indicator) indicator.style.opacity = isActive ? '1' : '0';
    });

    filterDropdown.querySelectorAll('[data-surgery-date]').forEach(item => {
        const dateValue = item.getAttribute('data-surgery-date') || null;
        const isActive = (advancedFilterState.surgeryDate || null) === dateValue;
        item.classList.toggle('active', isActive);
    });

    const dateValueEl = filterDropdown.querySelector('#dr-filter-quick-date-value');
    if (dateValueEl) {
        dateValueEl.textContent = getQuickFilterDateLabel();
        dateValueEl.style.color = advancedFilterState.surgeryDate ? '#1976d2' : '#94a3b8';
        dateValueEl.style.fontWeight = advancedFilterState.surgeryDate ? '700' : '500';
    }

    const clearQuickBtn = filterDropdown.querySelector('[data-quick-filter-action="clear"]');
    if (clearQuickBtn) {
        const hasQuickFilter = !!(advancedFilterState.onlyChuaDanhThuoc || advancedFilterState.onlyXuatVien || advancedFilterState.onlyCanLamSang || advancedFilterState.surgeryDate);
        clearQuickBtn.style.opacity = hasQuickFilter ? '1' : '0.5';
        clearQuickBtn.style.pointerEvents = hasQuickFilter ? 'auto' : 'none';
    }
}

/**
 * Open the filter dialog
 */
function openFilterDialog(onApply) {
    const { dialog, inner } = DialogManager.createDialog('dr-advanced-filter-dialog', {
        maxWidth: '850px',
        maxHeight: '90vh'
    });

    // Collect all available manual Y lệnh tags from dr_data
    const allManualTags = new Set();
    if (window.dr_data) {
        window.dr_data.forEach(p => {
            const log = p.checklistState?.yLenhLog || [];
            log.forEach(entry => {
                // filter out quick actions (we only want manual ones for this filter as per plan)
                const isQuick = entry.q === true || BS_CAI_DAT.quickYLenhActions.some(a => a.label === entry.content);
                if (!isQuick && entry.content) {
                    allManualTags.add(entry.content.trim());
                }
            });
        });
    }
    const manualTagsArray = Array.from(allManualTags).sort();

    inner.innerHTML = `
        <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:12px; display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h2 style="margin:0; font-size:1.4em; color:#1e293b;">Bộ lọc nâng cao</h2>
                <p style="margin:4px 0 0 0; color:#64748b; font-size:0.9em;">Tìm kiếm bệnh nhân theo tiêu chí chuyên sâu</p>
            </div>
            <div id="dr-filter-header-actions" style="display:flex; gap:8px;"></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:20px;">
            <!-- Quick filters: Xuất viện + Cận lâm sàng -->
            <section>
                <h3 style="font-size:1em; margin-bottom:10px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-bolt" style="color:#f59e0b;"></i> Lọc nhanh
                </h3>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 14px;border:1px solid #e2e8f0;border-radius:20px;font-size:0.9em;background:${advancedFilterState.onlyChuaDanhThuoc?'#fff7ed':'#fff'};color:${advancedFilterState.onlyChuaDanhThuoc?'#c2410c':'#374151'};transition:all 0.15s;">
                        <input type="checkbox" id="filter-chuadanhthuoc" ${advancedFilterState.onlyChuaDanhThuoc ? 'checked' : ''}>
                        <i class="fas fa-pills"></i> Chưa đánh thuốc
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 14px;border:1px solid #e2e8f0;border-radius:20px;font-size:0.9em;background:${advancedFilterState.onlyXuatVien?'#dcfce7':'#fff'};color:${advancedFilterState.onlyXuatVien?'#16a34a':'#374151'};transition:all 0.15s;">
                        <input type="checkbox" id="filter-xuatvien" ${advancedFilterState.onlyXuatVien ? 'checked' : ''}>
                        <i class="fas fa-sign-out-alt"></i> Xuất viện
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 14px;border:1px solid #e2e8f0;border-radius:20px;font-size:0.9em;background:${advancedFilterState.onlyCanLamSang?'#eff6ff':'#fff'};color:${advancedFilterState.onlyCanLamSang?'#1d4ed8':'#374151'};transition:all 0.15s;">
                        <input type="checkbox" id="filter-canlamsang" ${advancedFilterState.onlyCanLamSang ? 'checked' : ''}>
                        <i class="fas fa-microscope"></i> Cận lâm sàng
                    </label>
                </div>
            </section>
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-hand-holding-medical" style="color:#1976d2;"></i> Tên phẫu thuật
                </h3>
                <div style="position:relative;">
                    <input type="text" id="filter-surgery-name" value="${advancedFilterState.surgeryName}" placeholder="Nhập tên mổ (vd: sỏi, túi mật...)" 
                        style="width:100%; padding:8px 30px 8px 12px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">
                    <span id="clear-surgery-name" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); cursor:pointer; color:#94a3b8; display:${advancedFilterState.surgeryName ? 'block' : 'none'};"><i class="fas fa-times-circle"></i></span>
                </div>
            </section>

            <!-- Category: Surgery Date -->
            <section>
                <h3 style="font-size:1em; margin-bottom:8px; color:#334155; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-calendar-alt" style="color:#1976d2;"></i> Ngày phẫu thuật
                </h3>
                <div style="display:flex; gap:8px;">
                    <button class="filter-date-chip ${advancedFilterState.surgeryDate === 'yesterday' ? 'active' : ''}" data-date="yesterday">Hôm qua</button>
                    <button class="filter-date-chip ${advancedFilterState.surgeryDate === 'today' ? 'active' : ''}" data-date="today">Hôm nay</button>
                    <button class="filter-date-chip ${advancedFilterState.surgeryDate === 'tomorrow' ? 'active' : ''}" data-date="tomorrow">Ngày mai</button>
                    <button class="filter-date-chip ${!advancedFilterState.surgeryDate ? 'active' : ''}" data-date="">Tất cả</button>
                </div>
            </section>

            <!-- Category: Surgeons -->
            <section>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="font-size:1em; margin:0; color:#334155; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-user-md" style="color:#1976d2;"></i> Phẫu thuật viên
                    </h3>
                    <div style="display:flex; background:#f1f5f9; border-radius:12px; padding:2px; font-size:0.8em;">
                        <button class="logic-toggle ${advancedFilterState.surgeonsLogic === 'OR' ? 'active' : ''}" data-logic="OR" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">OR</button>
                        <button class="logic-toggle ${advancedFilterState.surgeonsLogic === 'AND' ? 'active' : ''}" data-logic="AND" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">AND</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px; max-height:180px; overflow-y:auto; padding:8px; border:1px solid #f1f5f9; border-radius:6px; background:#f8fafc;">
                    ${BS_CAI_DAT.danhSachBacSi.map(doc => {
                        const selected = advancedFilterState.surgeons.find(s => s.name === doc);
                        return `
                        <div class="filter-surgeon-row" style="display:flex; align-items:center; gap:8px; font-size:0.9em; padding:4px; border-radius:4px; transition:background 0.2s;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex: 1;">
                                <input type="checkbox" class="filter-surgeon-check" value="${doc}" ${selected ? 'checked' : ''}>
                                <span style="font-weight:${selected ? '600' : '400'}">${doc}</span>
                            </label>
                            <select class="filter-surgeon-role" style="font-size:0.8em; padding:2px 4px; border:1px solid #cbd5e1; border-radius:4px; background:white; ${selected ? '' : 'display:none;'}">
                                <option value="any" ${selected?.role === 'any' ? 'selected' : ''}>Bất kỳ</option>
                                <option value="main" ${selected?.role === 'main' ? 'selected' : ''}>PTV chính</option>
                                <option value="1" ${selected?.role === '1' ? 'selected' : ''}>Phụ 1</option>
                                <option value="2" ${selected?.role === '2' ? 'selected' : ''}>Phụ 2</option>
                                <option value="3" ${selected?.role === '3' ? 'selected' : ''}>Phụ 3</option>
                            </select>
                        </div>
                    `}).join('')}
                </div>
            </section>

            <!-- Category: Manual Y lệnh tags -->
            <section>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="font-size:1em; margin:0; color:#334155; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-tags" style="color:#1976d2;"></i> Log y lệnh (Manual)
                    </h3>
                    <div style="display:flex; background:#f1f5f9; border-radius:12px; padding:2px; font-size:0.8em;">
                        <button class="logic-toggle-tags ${advancedFilterState.yLenhTagsLogic === 'OR' ? 'active' : ''}" data-logic="OR" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">OR</button>
                        <button class="logic-toggle-tags ${advancedFilterState.yLenhTagsLogic === 'AND' ? 'active' : ''}" data-logic="AND" style="border:none; border-radius:10px; padding:2px 8px; cursor:pointer; font-weight:600;">AND</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:8px; max-height:200px; overflow-y:auto; padding:4px; border:1px solid #f1f5f9; border-radius:6px; background:#f8fafc;">
                    ${manualTagsArray.length > 0 ? manualTagsArray.map(tag => `
                        <label style="display:flex; align-items:center; gap:8px; font-size:0.9em; cursor:pointer; padding:2px 4px;">
                            <input type="checkbox" class="filter-tag-check" value="${tag}" ${advancedFilterState.yLenhTags.includes(tag) ? 'checked' : ''}>
                            ${tag}
                        </label>
                    `).join('') : '<div style="color:#94a3b8; font-style:italic; font-size:0.9em; padding:8px;">Không có y lệnh riêng nào...</div>'}
                </div>
            </section>
        </div>

        <style>
            .filter-date-chip {
                padding: 6px 14px;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                background: #fff;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s;
            }
            .filter-date-chip.active {
                background: #1976d2;
                color: #fff;
                border-color: #1976d2;
            }
            .filter-date-chip:hover:not(.active) {
                background: #f1f5f9;
            }
            .logic-toggle, .logic-toggle-tags {
                background: transparent;
                color: #64748b;
            }
            .logic-toggle.active, .logic-toggle-tags.active {
                background: #fff;
                color: #1976d2;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
        </style>
    `;

    // Add buttons to header: Only "Bỏ tất cả" remains, filtering is now real-time
    const headerActions = inner.querySelector('#dr-filter-header-actions');
    const actionButtons = DialogManager.createActionButtons([
        {
            text: 'Bỏ tất cả',
            className: 'btn-secondary',
            onclick: () => {
                resetFilter();
                dialog.remove();
                if (onApply) onApply();
                refreshAdvancedFilterUI();
            }
        }
    ]);
    if (headerActions) {
        actionButtons.style.marginTop = '0'; // Remove top margin in header
        headerActions.appendChild(actionButtons);
    }

    // Real-time trigger helper
    function triggerUpdate() {
        applyInputs();
        if (onApply) onApply();
        refreshAdvancedFilterUI();
    }

    // Event listeners for date chips
    inner.querySelectorAll('.filter-date-chip').forEach(chip => {
        chip.onclick = () => {
            inner.querySelectorAll('.filter-date-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            advancedFilterState.surgeryDate = chip.getAttribute('data-date') || null;
            triggerUpdate();
        };
    });

    // Logic toggle listeners
    inner.querySelectorAll('.logic-toggle').forEach(btn => {
        btn.onclick = () => {
            inner.querySelectorAll('.logic-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            advancedFilterState.surgeonsLogic = btn.getAttribute('data-logic');
            triggerUpdate();
        };
    });

    // Logic toggle for tags
    inner.querySelectorAll('.logic-toggle-tags').forEach(btn => {
        btn.onclick = () => {
            inner.querySelectorAll('.logic-toggle-tags').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            advancedFilterState.yLenhTagsLogic = btn.getAttribute('data-logic');
            triggerUpdate();
        };
    });

    // Surgeon checkbox/select listeners
    inner.querySelectorAll('.filter-surgeon-check').forEach(cb => {
        cb.onchange = () => {
            const select = cb.closest('.filter-surgeon-row').querySelector('.filter-surgeon-role');
            if (select) select.style.display = cb.checked ? 'block' : 'none';
            triggerUpdate();
        };
    });

    inner.querySelectorAll('.filter-surgeon-role, .filter-tag-check').forEach(el => {
        el.onchange = triggerUpdate;
    });

    // Quick filter checkbox listeners
    const xuatVienCb = inner.querySelector('#filter-xuatvien');
    const canLamSangCb = inner.querySelector('#filter-canlamsang');
    const chuaDanhThuocCb = inner.querySelector('#filter-chuadanhthuoc');
    if (chuaDanhThuocCb) chuaDanhThuocCb.onchange = triggerUpdate;
    if (xuatVienCb) xuatVienCb.onchange = triggerUpdate;
    if (canLamSangCb) canLamSangCb.onchange = triggerUpdate;

    // Clear icon logic
    const surgeryInput = inner.querySelector('#filter-surgery-name');
    const clearBtn = inner.querySelector('#clear-surgery-name');
    if (surgeryInput && clearBtn) {
        surgeryInput.oninput = () => {
            clearBtn.style.display = surgeryInput.value ? 'block' : 'none';
            triggerUpdate();
        };
        clearBtn.onclick = () => {
            surgeryInput.value = '';
            clearBtn.style.display = 'none';
            surgeryInput.focus();
            triggerUpdate();
        };
    }

    function applyInputs() {
        // Quick filters
        const xuatVienCb = inner.querySelector('#filter-xuatvien');
        const canLamSangCb = inner.querySelector('#filter-canlamsang');
        const chuaDanhThuocCb = inner.querySelector('#filter-chuadanhthuoc');
        if (chuaDanhThuocCb) advancedFilterState.onlyChuaDanhThuoc = chuaDanhThuocCb.checked;
        if (xuatVienCb) advancedFilterState.onlyXuatVien = xuatVienCb.checked;
        if (canLamSangCb) advancedFilterState.onlyCanLamSang = canLamSangCb.checked;

        advancedFilterState.surgeryName = (inner.querySelector('#filter-surgery-name').value || '').trim();
        
        advancedFilterState.surgeons = [];
        inner.querySelectorAll('.filter-surgeon-row').forEach(row => {
            const cb = row.querySelector('.filter-surgeon-check');
            const select = row.querySelector('.filter-surgeon-role');
            if (cb && cb.checked) {
                advancedFilterState.surgeons.push({
                    name: cb.value,
                    role: select ? select.value : 'any'
                });
            }
        });

        advancedFilterState.yLenhTags = [];
        inner.querySelectorAll('.filter-tag-check:checked').forEach(cb => {
            advancedFilterState.yLenhTags.push(cb.value);
        });

        // CRITICAL FIX: Update active state immediately
        advancedFilterState.active = !!(
            advancedFilterState.onlyChuaDanhThuoc ||
            advancedFilterState.onlyXuatVien ||
            advancedFilterState.onlyCanLamSang ||
            advancedFilterState.surgeryName || 
            advancedFilterState.surgeons.length > 0 || 
            advancedFilterState.surgeryDate || 
            advancedFilterState.yLenhTags.length > 0
        );
    }

    function resetFilter() {
        advancedFilterState.active = false;
        advancedFilterState.onlyChuaDanhThuoc = false;
        advancedFilterState.onlyXuatVien = false;
        advancedFilterState.onlyCanLamSang = false;
        advancedFilterState.yLenhTags = [];
        advancedFilterState.yLenhTagsLogic = 'OR';
        advancedFilterState.surgeryName = '';
        advancedFilterState.surgeons = [];
        advancedFilterState.surgeonsLogic = 'OR';
        advancedFilterState.surgeryDate = null;
    }
}

/**
 * Trích xuất ca mổ gần nhất của bệnh nhân từ nhiều nguồn dữ liệu khác nhau
 */
function getLatestSurgeryLog(item) {
    if (!item) return null;
    
    // Nguồn 1: Log đã lưu trữ / đã merge (ưu tiên cao nhất)
    if (item.checklistState?.phauThuatLog?.length > 0) {
        return item.checklistState.phauThuatLog[0];
    }
    
    // Nguồn 2: Log trực tiếp từ OTM chưa merge vào checklistState
    if (item._otmPhauThuatLog?.length > 0) {
        return item._otmPhauThuatLog[0];
    }
    
    // Nguồn 3: Dữ liệu fallback cơ bản
    if (item.phauThuatInfo) {
        return item.phauThuatInfo;
    }
    
    return null;
}


/**
 * Filter logic: check if patient matches current criteria
 */
function matchesAdvancedFilter(item) {
    let hasCondition = false;
    
    // Lấy thông tin ca phẫu thuật gần nhất của bệnh nhân
    const logEntry = getLatestSurgeryLog(item);
    
    // 1. Filter by Surgery Name (PPPT)
    if (advancedFilterState.onlyChuaDanhThuoc) {
        hasCondition = true;
        if (hasMedsDoneBadgeForItem(item)) return false;
    }

    // 1b. Quick filter by patients that have not been medicated today
    if (advancedFilterState.surgeryName.trim()) {
        hasCondition = true;
        if (!logEntry) return false;
        
        const query = advancedFilterState.surgeryName.toLowerCase().trim();
        const ptNameHtml = (logEntry.method || logEntry.pppt || '').toLowerCase();
        
        if (!ptNameHtml.includes(query)) return false;
    }

    // 2. Filter by Surgeon
    if (advancedFilterState.surgeons.length > 0) {
        hasCondition = true;
        if (!logEntry) return false;

        const doctorsString = (logEntry.doctors || '').toLowerCase();
        // Tách chuỗi bác sĩ theo dấu phẩy / chấm phẩy và loại bỏ khoảng trắng thừa
        const patientDoctors = doctorsString.split(/[,;]/).map(s => s.trim()).filter(Boolean);

        const checkMatch = (sFilter) => {
            const filterBase = getBaseName(sFilter.name);
            
            // Xóa bỏ chức danh của cả 2 bên và so sánh tên gốc
            // Vd: "ThS.BS Lê Chí Hiếu" -> "lê chí hiếu"
            //     "BS.CKI Lê Chí Hiếu" -> "lê chí hiếu"
            const docIdx = patientDoctors.findIndex(pd => {
                const pdBase = getBaseName(pd);
                return pdBase && filterBase && (pdBase.includes(filterBase) || filterBase.includes(pdBase));
            });
            
            if (docIdx === -1) return false;
            
            if (sFilter.role === 'any') return true;
            if (sFilter.role === 'main' && docIdx === 0) return true;
            if (sFilter.role === '1' && docIdx === 1) return true;
            if (sFilter.role === '2' && docIdx === 2) return true;
            if (sFilter.role === '3' && docIdx === 3) return true;
            
            return false;
        };

        if (advancedFilterState.surgeonsLogic === 'AND') {
            const matchesAll = advancedFilterState.surgeons.every(checkMatch);
            if (!matchesAll) return false;
        } else {
            const matchesAny = advancedFilterState.surgeons.some(checkMatch);
            if (!matchesAny) return false;
        }
        
        // Final sanity check log if filtered
        console.log(`[Filter Match] Patient: ${item.hoten} | Doctors: ${patientDoctors.join('|')} | Match Status: SUCCESS`);
    }

    // 3. Filter by Surgery Date
    if (advancedFilterState.surgeryDate) {
        hasCondition = true;
        if (!logEntry) return false;
        
        const surgeryDateStr = logEntry.date || logEntry.ngayPhauThuat;
        if (!surgeryDateStr) return false;

        const targetDate = new Date();
        if (advancedFilterState.surgeryDate === 'yesterday') targetDate.setDate(targetDate.getDate() - 1);
        if (advancedFilterState.surgeryDate === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
        
        const targetStr = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getFullYear()}`;
        
        // Handle both formats: dd/mm/yyyy and yyyy-mm-dd
        let formattedSurgeryDate = surgeryDateStr;
        if (surgeryDateStr.includes('-')) {
            const [y, m, d] = surgeryDateStr.split('-');
            formattedSurgeryDate = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
        
        if (formattedSurgeryDate !== targetStr) return false;
    }

    // 4. Filter by Manual Y lệnh Tags
    if (advancedFilterState.yLenhTags.length > 0) {
        hasCondition = true;
        const patientManualTags = (item.checklistState?.yLenhLog || [])
            .filter(entry => {
                const isQuick = entry.q === true || BS_CAI_DAT.quickYLenhActions.some(a => a.label === entry.content);
                return !isQuick;
            })
            .map(e => (e.content || '').trim());
        
        if (advancedFilterState.yLenhTagsLogic === 'AND') {
            const matchesAll = advancedFilterState.yLenhTags.every(tag => 
                patientManualTags.includes(tag)
            );
            if (!matchesAll) return false;
        } else {
            const matchesAny = advancedFilterState.yLenhTags.some(tag => 
                patientManualTags.includes(tag)
            );
            if (!matchesAny) return false;
        }
    }

    return true;
}

module.exports = {
    setupAdvancedFilter,
    matchesAdvancedFilter,
    advancedFilterState
};

},{"../BS_CAI_DAT_GIAO_DIEN":1,"../utils":47,"../utils/dateUtils":50,"./dialogManager":12,"./responsiveDropdown":21}],7:[function(require,module,exports){
// autoLoginToggle.js - Shared toggle UI for Auto Login

function applyToggleStyles(a, enabled) {
    a.className = (a.className || '') + ' dr-autologin-toggle nav-link';
    a.style.borderRadius = '12px';
    a.style.display = 'inline-flex';
    a.style.alignItems = 'center';
    a.style.gap = '6px';
    a.style.padding = '6px 10px';
    if (enabled) {
        a.innerHTML = '<i class="fas fa-toggle-on"></i> <span style="margin-left:6px; font-weight:600;">TỰ ĐỘNG LOGIN</span>';
        a.style.background = '#dc2626';
        a.style.color = '#fff';
        a.style.border = '1px solid #b91c1c';
    } else {
        a.innerHTML = '<i class="fas fa-toggle-off"></i> <span style="margin-left:6px;">TỰ ĐỘNG LOGIN</span>';
        a.style.background = '#fff';
        a.style.color = '#111827';
        a.style.border = '1px solid #e5e7eb';
    }
}

function createAutoLoginToggle({ enabled, onToggle, onDblClick, title }) {
    const a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.title = title || 'Bật/tắt tự động login';
    applyToggleStyles(a, !!enabled);
    a.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof onToggle === 'function') onToggle();
    });
    if (typeof onDblClick === 'function') {
        a.addEventListener('dblclick', (e) => {
            e.preventDefault();
            onDblClick();
        });
    }
    return a;
}

module.exports = { createAutoLoginToggle, applyToggleStyles };

},{}],8:[function(require,module,exports){
// cardTooltip.js - Global hover tooltip for patient cards

const STORAGE_KEY = 'dr-card-hover-preview';
let tooltipEnabled = true;

function syncEnabledFromStorage() {
    try {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            tooltipEnabled = saved !== '0';
        }
    } catch (_) {}
    return tooltipEnabled;
}

function setEnabled(enabled) {
    tooltipEnabled = enabled !== false;
    const tooltip = document.getElementById('dr-global-card-tooltip');
    if (tooltip && !tooltipEnabled) {
        tooltip.style.display = 'none';
    }
}

function isEnabled() {
    return tooltipEnabled;
}

syncEnabledFromStorage();

/**
 * Attach hover tooltip to a patient card
 * @param {HTMLElement} card - The card or wrapper element to trigger the tooltip
 * @param {HTMLElement} contentSource - The element to clone into the tooltip (usually the card itself)
 */
function attach(card, contentSource) {
    if (!card || !contentSource) return;

    card.addEventListener('mouseenter', (e) => {
        if (!isEnabled()) return;
        let tooltip = document.getElementById('dr-global-card-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dr-global-card-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                z-index: 100000;
                pointer-events: none;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                width: 320px;
                transform: translate(15px, 15px);
                display: none;
            `;
            document.body.appendChild(tooltip);
        }

        const clone = contentSource.cloneNode(true);
        // Ensure clone is visible and reset any truncations
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';
        clone.style.opacity = '1';
        clone.classList.remove('dr-tracking-card'); // Remove tracking specific styles if any
        
        // Remove interactive stuff from clone
        const rmBtns = clone.querySelectorAll('button, .dr-tracking-remove, .dr-action-buttons');
        rmBtns.forEach(b => b.remove());

        // Fix CSS clamp to show full text for specific lines
        const lines = clone.querySelectorAll('.dr-diagnosis-line, .dr-pt-info, .dr-hxt-block');
        lines.forEach(l => {
            l.style.webkitLineClamp = 'unset';
            l.style.display = 'block';
            l.style.whiteSpace = 'normal';
        });

        tooltip.innerHTML = '';
        tooltip.appendChild(clone);
        tooltip.style.display = 'block';
    });

    card.addEventListener('mousemove', (e) => {
        if (!isEnabled()) return;
        const tooltip = document.getElementById('dr-global-card-tooltip');
        if (tooltip && tooltip.style.display === 'block') {
            let top = e.clientY + 15;
            let left = e.clientX + 15;
            
            // Wait for next frame to get height correctly if needed, 
            // but usually it's already there
            const rect = tooltip.getBoundingClientRect();
            if (top + rect.height > window.innerHeight) {
                top = e.clientY - rect.height - 15;
            }
            if (left + rect.width > window.innerWidth) {
                left = e.clientX - rect.width - 15;
            }
            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
        }
    });

    card.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('dr-global-card-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    });
}

module.exports = {
    attach,
    setEnabled,
    isEnabled,
    syncEnabledFromStorage,
    STORAGE_KEY
};

},{}],9:[function(require,module,exports){
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

},{"../pages/page.dashboard.support":31,"../services/checklistService":38,"../services/reportService":41,"../utils/contextMenuCopyBuilders":49,"../utils/uiUtils":62,"./actionButtons":5}],10:[function(require,module,exports){
// copyDienTienAI.js
// Inject a "Copy diễn tiến" button on /to-dieu-tri and copy all PDF text to clipboard using pdf.js

function isToDieuTriPage() {
    try {
        return /\/to-dieu-tri(\?.*)?$/.test(window.location.pathname);
    } catch (_) { return false; }
}

function getMabnFromUrl() {
    try {
        const u = new URL(window.location.href);
        return u.searchParams.get('mabn') || '';
    } catch (_) { return ''; }
}

function ensureStatusBar(container) {
    let bar = document.getElementById('dr-copy-dien-tien-status');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'dr-copy-dien-tien-status';
        bar.style.cssText = 'margin-top:8px; font-size:12px; color:#0f172a;';
        container.appendChild(bar);
    }
    return bar;
}

// Helper to set status text with optional auto-clear after 4s
function setStatus(bar, text, color, autoClear = false) {
    if (!bar) return;
    try { if (bar.__statusTimer) { clearTimeout(bar.__statusTimer); bar.__statusTimer = null; } } catch(_) {}
    if (typeof text === 'string') bar.textContent = text;
    if (color) bar.style.color = color;
    if (autoClear) {
        bar.__statusTimer = setTimeout(() => {
            try { bar.textContent = ''; } catch(_) {}
        }, 4000);
    }
}

async function loadPdfJsIfNeeded() {
    const getLib = () => (window.pdfjsLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.pdfjsLib : undefined));
    if (getLib()) {
        // worker may still need to be set
        try {
            const lib = getLib();
            if (lib && lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
        } catch(_) {}
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js';
    script.referrerPolicy = 'no-referrer';
    const p = new Promise((resolve, reject) => {
        script.onload = () => {
            try {
                // bridge between page and userscript contexts
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow.pdfjsLib && !window.pdfjsLib) {
                    try { window.pdfjsLib = unsafeWindow.pdfjsLib; } catch(_) {}
                }
                const lib = getLib();
                if (lib && lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
            } catch(_) {}
            resolve();
        };
        script.onerror = () => reject(new Error('Không tải được pdf.js'));
    });
    document.head.appendChild(script);
    await p;
}

async function fetchPatientInfo(mabn) {
    const body = 'code=' + encodeURIComponent(mabn);
    const res = await fetch('/ToDieuTri/GetPatient', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'accept': '*/*'
        },
        credentials: 'include',
        body
    });
    if (!res.ok) throw new Error('Lỗi GetPatient: ' + res.status);
    const json = await res.json();
    if (!json || json.isValid === false || !json.data || !json.data[0]) throw new Error('Dữ liệu GetPatient không hợp lệ');
    return json.data[0];
}

function parseMMDDYYYYtoDDMMYYYY(dateTimeStr) {
    if (!dateTimeStr) return '';
    // Expect "MM/DD/YYYY HH:mm:ss" or "MM/DD/YYYY"
    const [datePart] = String(dateTimeStr).split(' ');
    const [mm, dd, yyyy] = datePart.split('/');
    if (!mm || !dd || !yyyy) return '';
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
}

function todayDDMMYYYY() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

async function fetchPdfArrayBuffer(url) {
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    if (!res.ok) throw new Error('Lỗi tải PDF: ' + res.status);
    return await res.arrayBuffer();
}

async function extractAllTextFromPdfBuffer(buffer) {
    await loadPdfJsIfNeeded();
    const pdfjsLib = (window.pdfjsLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.pdfjsLib : undefined));
    if (!pdfjsLib || !pdfjsLib.getDocument) throw new Error('pdfjsLib chưa sẵn sàng');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    let out = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(it => it.str).filter(Boolean);
        out.push(strings.join(' '));
    }
    return out.join('\n\n');
}

// Sanitize sensitive info before copying to clipboard
function sanitizeCopiedText(text) {
    if (!text) return '';
    let t = String(text);
    // Remove from "Họ và tên:" to the first '-' character (inclusive), not to newline
    t = t.replace(/Họ\s+và\s+tên:\s*[^-]*-\s*/gi, '');
    return t;
}

async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch(_) {}
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
    } catch(_) { return false; }
}

function injectButton() {
    if (!isToDieuTriPage()) return;
    const host = document.getElementById('LoadToDieuTri');
    if (!host) return;
    if (document.getElementById('dr-copy-dien-tien-forAI')) return; // already added

    const wrap = document.createElement('div');
    wrap.style.margin = '6px 0 10px 0';

    const btn = document.createElement('button');
    btn.id = 'dr-copy-dien-tien-forAI';
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-success';
    btn.textContent = 'Copy diễn tiến';

    // Secondary "copy again" icon button
    const btnCopyAgain = document.createElement('button');
    btnCopyAgain.type = 'button';
    btnCopyAgain.title = 'Copy lại';
    btnCopyAgain.className = 'btn btn-sm btn-outline-secondary';
    btnCopyAgain.style.marginLeft = '6px';
    btnCopyAgain.textContent = '📋';
    btnCopyAgain.style.display = 'none';

    wrap.appendChild(btn);
    wrap.appendChild(btnCopyAgain);
    host.prepend(wrap);

    const statusBar = ensureStatusBar(wrap);

    btn.addEventListener('click', async () => {
        const mabn = getMabnFromUrl();
        if (!mabn) {
            setStatus(statusBar, 'Không tìm thấy MABN trong URL', '#b91c1c', true);
            return;
        }
        try {
            setStatus(statusBar, 'Đang lấy thông tin người bệnh...', '#0f172a', false);
            const info = await fetchPatientInfo(mabn);
            const mavaovien = info.maVaoVien || info.maVaoVien || info.mavaovien || '';
            const ngayvv = parseMMDDYYYYtoDDMMYYYY(info.ngayVV || info.ngayvv || '');
            const maql = info.maql || '';
            if (!mavaovien || !ngayvv || !maql) {
                setStatus(statusBar, 'Thiếu tham số (mã vào viện/ngày vào/maql)', '#b91c1c', true);
                return;
            }

            const denngay = todayDDMMYYYY();
            const pdfUrl = `/todieutri/DienBien/PrintPDF?id=&mabn=${encodeURIComponent(mabn)}&mavaovien=${encodeURIComponent(mavaovien)}&tungay=${encodeURIComponent(ngayvv)}&denngay=${encodeURIComponent(denngay)}&maql=${encodeURIComponent(maql)}`;

            setStatus(statusBar, 'Đang tải và xử lý PDF...', '#0f172a', false);
            const buf = await fetchPdfArrayBuffer(pdfUrl);
            const rawText = await extractAllTextFromPdfBuffer(buf);
            const text = sanitizeCopiedText(rawText);

            setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
            const ok = await copyToClipboard(text);
            if (ok) {
                setStatus(statusBar, 'Đã copy toàn bộ diễn tiến vào clipboard.', '#166534', true);
                // Enable copy-again with latest sanitized text
                btnCopyAgain.dataset.clipboardText = text;
                btnCopyAgain.style.display = 'inline-block';
            } else {
                setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
            }
        } catch (err) {
            console.error(err);
            setStatus(statusBar, 'Lỗi: ' + (err && err.message ? err.message : 'Không rõ'), '#b91c1c', true);
        }
    });

    // Copy-again action: copy last cached text without reloading PDF
    btnCopyAgain.addEventListener('click', async () => {
        const cached = btnCopyAgain.dataset.clipboardText || '';
        if (!cached) {
            setStatus(statusBar, 'Chưa có dữ liệu để copy lại.', '#b91c1c', true);
            return;
        }
        try {
            setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
            const ok = await copyToClipboard(cached);
            if (ok) setStatus(statusBar, 'Đã copy lại vào clipboard.', '#166534', true);
            else setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
        } catch (e) {
            setStatus(statusBar, 'Lỗi: ' + (e && e.message ? e.message : 'Không rõ'), '#b91c1c', true);
        }
    });
}

function initCopyDienTienAI() {
    if (!isToDieuTriPage()) return;
    // Try immediately and a few retries in case DOM is populated later
    const tryInject = () => {
        injectButton();
    };
    tryInject();
    let tries = 0;
    const iv = setInterval(() => {
        tries++;
        injectButton();
        if (document.getElementById('dr-copy-dien-tien-forAI') || tries > 20) clearInterval(iv);
    }, 300);
}

module.exports = { 
    initCopyDienTienAI,
    fetchPatientInfo,
    parseMMDDYYYYtoDDMMYYYY,
    todayDDMMYYYY,
    fetchPdfArrayBuffer,
    extractAllTextFromPdfBuffer,
    copyToClipboard,
    sanitizeCopiedText,
    setStatus
};

},{}],11:[function(require,module,exports){
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

},{"../pages/page.dashboard.support":31,"../services/checklistService":38,"../services/reportService":41,"../utils/dateUtils":50,"./dialogManager":12}],12:[function(require,module,exports){
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
            max-width: ${options.maxWidth || '1000px'};
            width: 95vw;
            max-height: ${options.maxHeight || '88vh'};
            overflow-y: auto;
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
    buttonContainer.style = 'margin-top:18px;display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap;';

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.id = button.id;
            btn.className = button.className || 'btn';
            btn.textContent = button.text;
            btn.onclick = button.onclick;
            // Add visual styles for easier recognition
            btn.style.padding = '8px 14px';
            btn.style.borderRadius = '8px';
            btn.style.border = '1px solid #cbd5e1';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = '600';
            if (btn.className.includes('btn-primary')) {
                btn.style.background = 'linear-gradient(180deg, #1e88e5, #1976d2)';
                btn.style.color = '#fff';
                btn.style.borderColor = '#1976d2';
            } else if (btn.className.includes('btn-secondary')) {
                btn.style.background = '#f8fafc';
                btn.style.color = '#0f172a';
                btn.style.borderColor = '#cbd5e1';
            }
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

},{}],13:[function(require,module,exports){
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

},{"./settingsDialog":22}],14:[function(require,module,exports){
// hsbaDataFetcher.js - Fetch HSBA V2 data via background tab and GraphQL

/*
Contract
- addHSBATab(rootEl, patient):
  - Adds a new tab button "HSBA Data" into `.checklist-tabs` within the provided rootEl (sidebar right column content)
  - Renders a tab pane with a Fetch button (id: dr-hsb-fetch-btn) to trigger the flow
  - Uses GM_openInTab to open the HSBA V2 link silently, waits for background tab to collect data on hsba.tahospital.vn, then displays results

- Background (auto-run when host === hsba.tahospital.vn):
  - Wait until the main grid appears (div.MuiGrid-root)
  - Parse pid from URL (public?pid=<...>)
  - Run fetch to /graphql using current domain’s cookies (no cross-origin hack)
  - Store results via GM_setValue under key `dr_hsba_result_${pid}`

Notes
- Requires Tampermonkey grants: GM_openInTab, GM_setValue, GM_addValueChangeListener (already used in this repo for GM_xmlhttpRequest)
- Falls back gracefully when grants aren’t available (opens in foreground and asks user to wait)
*/

const DialogManager = require('./dialogManager');
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = (() => {
	try { return require('../BS_CAI_DAT_GIAO_DIEN'); } catch(_) { return (typeof window !== 'undefined' && window.BS_CAI_DAT) ? window.BS_CAI_DAT : {}; }
})();

// Track opened HSBA tabs by patient id to auto-close after data arrives
const HSBA_OPEN_TABS = new Map();
function registerOpenedTab(pid, ref) {
	try {
		const prev = HSBA_OPEN_TABS.get(pid);
		if (prev && typeof prev.close === 'function') {
			try { prev.close(); } catch(_) {}
		}
	} catch(_) {}
	HSBA_OPEN_TABS.set(pid, ref);
	try { console.log('[DR][HSBA] registered background tab for pid:', pid, ref); } catch(_) {}
}
function closeOpenedTab(pid, reason = 'done') {
	try {
		const ref = HSBA_OPEN_TABS.get(pid);
		if (ref && typeof ref.close === 'function') {
			try { ref.close(); console.log('[DR][HSBA] closed background tab (GM_openInTab) for pid:', pid, 'reason:', reason); } catch(e) { console.warn('[DR][HSBA] close tab error:', e); }
		} else if (ref && typeof ref === 'object' && 'close' in ref) {
			try { ref.close(); console.log('[DR][HSBA] closed background window for pid:', pid, 'reason:', reason); } catch(e) { console.warn('[DR][HSBA] close window error:', e); }
		} else {
			console.warn('[DR][HSBA] no tabRef to close for pid:', pid, 'reason:', reason);
		}
	} catch(e) { console.warn('[DR][HSBA] closeOpenedTab exception:', e); }
	HSBA_OPEN_TABS.delete(pid);
}

// Build rules from BS_CAI_DAT.HSBA_CHECKLIST_MAP (array of rule objects)
// Preprocess rules to support case-insensitive "like" matching on `tenmau` (substring match)
const __HSBA_RULES__ = Array.isArray(BS_CAI_DAT.HSBA_CHECKLIST_MAP) ? BS_CAI_DAT.HSBA_CHECKLIST_MAP : [];
const HSBA_RULES_PROCESSED = __HSBA_RULES__.map(r => {
	const tenmauNorm = r && r.tenmau ? String(r.tenmau).toLowerCase().trim() : null;
	return { ...r, tenmauNorm };
});

function matchRuleByTenmau(tenmau, rule) {
	if (!tenmau || !rule || !rule.tenmauNorm) return false;
	try { return String(tenmau).toLowerCase().includes(rule.tenmauNorm); } catch (_) { return false; }
}

function shouldShowTenmau(docTenmau) {
	return HSBA_RULES_PROCESSED.some(r => r && r.show && matchRuleByTenmau(docTenmau, r));
}

function shouldSyncTenmau(docTenmau) {
	return HSBA_RULES_PROCESSED.some(r => r && r.sync && matchRuleByTenmau(docTenmau, r));
}

function tenmauToChecklist(docTenmau) {
	const found = HSBA_RULES_PROCESSED.find(r => r && r.sync && r.checklist && matchRuleByTenmau(docTenmau, r));
	return found ? found.checklist : null;
}

function createEl(tag, attrs = {}, children = []) {
	const el = document.createElement(tag);
	Object.entries(attrs).forEach(([k, v]) => {
		if (k === 'style' && typeof v === 'object') {
			Object.assign(el.style, v);
		} else if (k === 'dataset' && v && typeof v === 'object') {
			Object.entries(v).forEach(([dk, dv]) => el.dataset[dk] = dv);
		} else if (k in el) {
			try { el[k] = v; } catch(_) { el.setAttribute(k, v); }
		} else {
			el.setAttribute(k, v);
		}
	});
	(Array.isArray(children) ? children : [children]).forEach(c => {
		if (c == null) return;
		if (typeof c === 'string') el.appendChild(document.createTextNode(c));
		else el.appendChild(c);
	});
	return el;
}

function formatDateYYYYMMDD(d = new Date()) {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function parseDateSafe(s) {
	if (!s || typeof s !== 'string') return null;
	// Try ISO first; fallback to replace spaces
	let dt = new Date(s);
	if (isNaN(dt.getTime())) {
		try { dt = new Date(s.replace(' ', 'T')); } catch(_) {}
	}
	return isNaN(dt.getTime()) ? null : dt;
}

function formatDateDDMMYYYY(dt) {
	if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
	const dd = String(dt.getDate()).padStart(2, '0');
	const mm = String(dt.getMonth() + 1).padStart(2, '0');
	const yyyy = dt.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

function formatDateTimeDDMMYYYYHHmm(dt) {
	if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
	const ddmmyyyy = formatDateDDMMYYYY(dt);
	const hh = String(dt.getHours()).padStart(2, '0');
	const mi = String(dt.getMinutes()).padStart(2, '0');
	return `${ddmmyyyy} ${hh}:${mi}`;
}

async function getHSBAV2Link(mabn) {
	try {
		const res = await fetch('/ToDieuTri/LoadLinkHsba', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-Requested-With': 'XMLHttpRequest'
			},
			credentials: 'include',
			body: 'code=' + encodeURIComponent(mabn)
		});
		const json = await res.json();
		if (json && json.data && json.data.link) return json.data.link;
		return `/hoso/${encodeURIComponent(String(mabn))}`; // fallback v1
	} catch (e) {
		return `/hoso/${encodeURIComponent(String(mabn))}`; // fallback v1
	}
}

function renderResult(container, result, ctx = {}) {
	// Render only filtered data (documents with allowed "tenmau")
	container.innerHTML = '';
	try { console.log('[DR][HSBA] filtered result received:', result); } catch(_) {}
	if (!result || !result.data || !result.data.hoSoBenhAns) {
		container.textContent = 'Không có dữ liệu HSBA.';
		return;
	}
	const hs = result.data.hoSoBenhAns;
	const rawItems = Array.isArray(hs.items) ? hs.items : [];
	// Filter: skip episodes with hoten === null (do not display)
	const items = rawItems.filter(it => it && it.hoten != null);
	// Count only valid, displayable docs (have tenfile or fileName)
	const docCount = items.reduce((sum, it) => sum + (Array.isArray(it.hoSoChiTiet) ? it.hoSoChiTiet.reduce((s, g) => s + (Array.isArray(g.chiTiets) ? g.chiTiets.filter(x => (x && (x.tenfile || x.fileName) && x.tenmau)).length : 0), 0) : 0), 0);
	const summary = createEl('div', { style: { marginBottom: '8px' } }, [
		createEl('div', {}, `Tổng số đợt HSBA: ${hs.total != null ? hs.total : items.length}`),
		createEl('div', {}, `Số tài liệu đã lọc: ${docCount}`)
	]);
	container.appendChild(summary);

	if (items.length === 0) return;

	// Determine current episode: prefer one with ngayra null, otherwise the latest by ngayvao
	const pickEpisode = () => {
		const open = items.filter(it => !it.ngayra);
		const arr = (open.length ? open : items).slice();
		arr.sort((a,b) => {
			const ta = parseDateSafe(a.ngayvao)?.getTime() || 0;
			const tb = parseDateSafe(b.ngayvao)?.getTime() || 0;
			return tb - ta; // newest first
		});
		return arr[0] || null;
	};
	const currentEpisode = pickEpisode();

	// From current episode, compute HSBA doc matches and persist to checklist state
	try {
		if (currentEpisode && Array.isArray(currentEpisode.hoSoChiTiet)) {
			const epStart = parseDateSafe(currentEpisode.ngayvao);
			const epEnd = parseDateSafe(currentEpisode.ngayra);
			const startTs = epStart ? epStart.getTime() : -Infinity;
			const endTs = epEnd ? epEnd.getTime() : Infinity;
			const docSet = new Set();
			let latestDocDates = {};
			currentEpisode.hoSoChiTiet.forEach(g => {
				(Array.isArray(g.chiTiets) ? g.chiTiets : []).forEach(d => {
					if (!d || !d.tenmau) return;
					if (!shouldSyncTenmau(d.tenmau)) return;
					// Only consider documents within the current episode date range
					const dDate = parseDateSafe(d.ngay);
					if (!dDate) return;
					const ts = dDate.getTime();
					if (ts < startTs || ts > endTs) return;
					docSet.add(d.tenmau);
					const prev = latestDocDates[d.tenmau] || 0;
					if (ts > prev) latestDocDates[d.tenmau] = ts;
				});
			});
			const nowIso = new Date().toISOString();
			const mapLookup = tenmauToChecklist;
			const hsbaSynced = Object.create(null);
			for (const tenmau of docSet) {
				const target = mapLookup(tenmau);
				if (!target) continue;
				const dateTs = latestDocDates[tenmau] || 0;
				hsbaSynced[target] = {
					matched: true,
					source: 'hsba',
					docName: tenmau,
					docDate: dateTs ? new Date(dateTs).toISOString() : null,
					updatedAt: nowIso
				};
			}
			if (Object.keys(hsbaSynced).length) {
				// Merge into window.checklistState only when the effective mapping changed.
				if (!window.checklistState) window.checklistState = {};
				const prev = window.checklistState.hsbaSynced || {};
				const stripMeta = (obj) => {
					const result = {};
					Object.keys(obj || {}).forEach((key) => {
						if (key === '__lastSyncAt') return;
						result[key] = obj[key];
					});
					return result;
				};
				const prevComparable = JSON.stringify(stripMeta(prev));
				const nextComparable = JSON.stringify(stripMeta({ ...prev, ...hsbaSynced }));
				if (prevComparable !== nextComparable) {
					window.checklistState.hsbaSynced = { ...prev, ...hsbaSynced, __lastSyncAt: nowIso };
					if (window.checklistObj && ChecklistService && typeof ChecklistService.updateChecklistState === 'function') {
						ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) })
							.then(() => {
								try { if (typeof window.dr_refreshChecklistBadges === 'function') window.dr_refreshChecklistBadges(); } catch(_) {}
							})
							.catch(() => {});
					} else {
						try { if (typeof window.dr_refreshChecklistBadges === 'function') window.dr_refreshChecklistBadges(); } catch(_) {}
					}
				}
			}
		}
	} catch(_) {}
	const outer = createEl('div', { className: 'dr-hsba-container', style: { maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' } });
	items.forEach((it, idx) => {
	const headerParts = [];
	if (it.hoten) headerParts.push(it.hoten);
	if (it.mabn) headerParts.push(it.mabn);
	if (it.tenkp) headerParts.push(it.tenkp);
	const ngayVaoDt = parseDateSafe(it.ngayvao);
	const ngayVaoStr = formatDateDDMMYYYY(ngayVaoDt);
	const header = createEl('div', { className: 'dr-hsba-episode-title', style: { fontWeight: '700', margin: '8px 0 6px', color: '#fff', background: '#1976d2' } }, headerParts.concat(ngayVaoStr ? [ngayVaoStr] : []).join(' - '));
		outer.appendChild(header);
		const groups = Array.isArray(it.hoSoChiTiet) ? it.hoSoChiTiet : [];
	groups.forEach(g => {
			const rawDocs = Array.isArray(g.chiTiets) ? g.chiTiets : [];
			if (!rawDocs.length) return;
			const gTitle = createEl('div', { className: 'dr-hsba-group-title', style: { fontWeight: '600', margin: '4px 0', color: '#334155' } }, `${g.tengay || g.gayid || 'Mục'}:`);
			outer.appendChild(gTitle);
			const ul = createEl('ul', { className: 'dr-hsba-list', style: { margin: 0, paddingLeft: '18px', listStyle: 'disc' } });
			// Build displayable docs: must have tenmau and tenfile/fileName
			const docs = rawDocs
				.map(d => ({
					...d,
					_tenfile: d && (d.tenfile || d.fileName) || '',
					_date: parseDateSafe(d && d.ngay)
				}))
				.filter(d => {
					if (!d) return false;
					if (!d.tenmau || !shouldShowTenmau(d.tenmau)) {
						try { console.debug('[DR][HSBA] skip doc (tenmau not allowed):', d); } catch(_) {}
						return false;
					}
					if (!d._tenfile) {
						try { console.warn('[DR][HSBA] skip doc (missing tenfile):', d); } catch(_) {}
						return false;
					}
					return true;
				})
				.sort((a, b) => {
					const ta = a._date ? a._date.getTime() : -Infinity;
					const tb = b._date ? b._date.getTime() : -Infinity;
					return tb - ta; // descending (newest first)
				});
			try { console.log('[DR][HSBA] group sorted docs:', { group: g.tengay || g.gayid, count: docs.length }); } catch(_) {}

	    const openViewer = async (tenfile, tenmau, ngayDisplay) => {
				try {
					const patient = ctx && ctx.patient;
					const mabn = patient && (patient.pid || patient.mabn);
					if (!mabn) {
						console.error('[DR][HSBA] openViewer: missing mabn');
						return;
					}
					// Get a fresh HSBA V2 link with tokens (pid/s/t/site) and append hash with file to view inline
					const baseLink = await getHSBAV2Link(mabn);
		    const parts = [];
		    parts.push(`dr-viewer=${encodeURIComponent(tenfile)}`);
		    if (tenmau) parts.push(`dr-name=${encodeURIComponent(tenmau)}`);
		    if (ngayDisplay) parts.push(`dr-date=${encodeURIComponent(ngayDisplay)}`);
		    const hash = parts.join('&');
		    const url = `${baseLink}${baseLink.includes('#') ? '' : '#'}${baseLink.includes('#') ? '&' : ''}${hash}`;
		    console.log('[DR][HSBA] opening inline viewer:', { mabn, tenfile, tenmau, ngayDisplay, url });
					window.open(url, '_blank');
				} catch (err) {
					console.error('[DR][HSBA] openViewer error:', err);
				}
			};

			docs.forEach(d => {
				const nd = d._date || parseDateSafe(d && d.ngay);
				const ngayFmt = formatDateTimeDDMMYYYYHHmm(nd) || (d && d.ngay) || '';
				const label = `${d.tenmau} - ${ngayFmt}`;
				const li = createEl('li', {
					className: 'dr-hsba-item',
					title: 'Mở tài liệu ở tab mới',
					dataset: { tenfile: d._tenfile },
					style: { cursor: 'pointer', padding: '2px 0' }
				}, label);
				li.addEventListener('click', () => {
					const tf = li.dataset.tenfile || '';
					if (!tf) {
						console.error('[DR][HSBA] click but missing data-tenfile');
						return;
					}
					openViewer(tf, d.tenmau, ngayFmt);
				});
				ul.appendChild(li);
			});
			outer.appendChild(ul);
		});
		if (idx < items.length - 1) outer.appendChild(createEl('hr', { style: { border: 'none', borderTop: '1px dashed #e5e7eb', margin: '8px 0' } }));
	});
	container.appendChild(outer);
}

function attachTabToggleBehavior(rootEl) {
	const tabs = rootEl.querySelectorAll('.checklist-tabs .tab-btn');
	const panes = rootEl.querySelectorAll('.tab-content .tab-pane');
	tabs.forEach(btn => {
		if (btn.__drBound) return;
		btn.__drBound = true;
		btn.addEventListener('click', function() {
			const targetTab = this.getAttribute('data-tab');
			tabs.forEach(b => { b.classList.remove('active'); b.style.background = 'transparent'; b.style.color = '#666'; b.style.fontWeight = 'normal'; });
			this.classList.add('active');
			this.style.background = '#0ea5e9';
			this.style.color = '#fff';
			this.style.fontWeight = 'bold';
			panes.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
			const pane = rootEl.querySelector(`.tab-pane[data-tab="${targetTab}"]`);
			if (pane) { pane.classList.add('active'); pane.style.display = 'block'; }
		});
	});
}

function addHSBATab(rootEl, patient) {
	try {
		if (!rootEl) return;
		const tabsBar = rootEl.querySelector('.checklist-tabs');
		const tabContent = rootEl.querySelector('.tab-content');
		if (!tabsBar || !tabContent) return;

		// Avoid duplicate
		if (tabsBar.querySelector('#dr-hsba-tab-btn')) return;

		const btn = createEl('button', {
			id: 'dr-hsba-tab-btn',
			className: 'tab-btn',
			dataset: { tab: 'hsba' },
			style: {
				padding: '8px 16px', border: 'none', background: 'transparent', color: '#666',
				borderRadius: '4px 4px 0 0', cursor: 'pointer', marginLeft: '4px'
			}
		}, 'HSBA Data');
		tabsBar.appendChild(btn);

		const pane = createEl('div', {
			className: 'tab-pane',
			dataset: { tab: 'hsba' },
			style: { display: 'none' }
		});

		const status = createEl('div', { id: 'dr-hsba-status', style: { margin: '6px 0', color: '#0f172a' } });
		const resultBox = createEl('div', { id: 'dr-hsba-result', style: { fontSize: '13px' } });
		const btnFetch = createEl('button', {
			id: 'dr-hsb-fetch-btn',
			className: 'btn btn-primary',
			style: { padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }
		}, 'Lấy HSBA từ file');
		// When clicking the HSBA tab, auto-fetch if there is no data yet
		btn.addEventListener('click', () => {
			try {
				const empty = !resultBox || (!resultBox.firstChild && !String(resultBox.textContent || '').trim());
				if (empty) {
					btnFetch.click();
				}
			} catch (_) {}
		});
		btnFetch.addEventListener('click', async () => {
			// Defensive: ensure patient exists
			const mabn = patient && (patient.pid || patient.mabn);
			if (!mabn) { status.textContent = 'Không tìm thấy MABN.'; return; }
			status.textContent = 'Đang mở HSBA V2 trong nền...';
			const link = await getHSBAV2Link(mabn);
			let tabRef = null;
			try {
				if (typeof GM_openInTab === 'function') {
					tabRef = GM_openInTab(link, { active: false, insert: true });
					registerOpenedTab(String(mabn), tabRef);
				} else {
					const w = window.open(link, '_blank');
					if (w) registerOpenedTab(String(mabn), w);
				}
			} catch(_) {
				const w = window.open(link, '_blank');
				if (w) registerOpenedTab(String(mabn), w);
			}

			// Result key for cross-tab delivery
			const key = `dr_hsba_result_${mabn}`;
			// 1) Realtime listener when supported
			if (typeof GM_addValueChangeListener === 'function') {
		GM_addValueChangeListener(key, function(name, oldVal, newVal, remote) {
					if (!remote || !newVal) return;
					try {
						const payload = typeof newVal === 'string' ? JSON.parse(newVal) : newVal;
						try { console.log('[DR][HSBA] payload received via listener:', payload); } catch(_) {}
						renderResult(resultBox, payload, { patient });
						status.textContent = 'Đã lấy HSBA.';
			// Close the background tab for this patient
			setTimeout(() => closeOpenedTab(String(mabn), 'listener'), 300);
					} catch (e) {
						status.textContent = 'Lỗi phân tích dữ liệu HSBA.';
						console.warn(e);
					}
				});
			}
			// 2) Polling fallback when listener is unavailable or unreliable
			let attempts = 0;
			const maxAttempts = 60; // ~60s
			if (typeof GM_getValue === 'function') {
				const iv = setInterval(async () => {
					try {
						attempts++;
						const raw = await GM_getValue(key, null);
						if (raw) {
							clearInterval(iv);
							const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
							try { console.log('[DR][HSBA] payload received via polling:', payload); } catch(_) {}
							renderResult(resultBox, payload, { patient });
							status.textContent = 'Đã lấy HSBA.';
							// Close the background tab for this patient
							setTimeout(() => closeOpenedTab(String(mabn), 'polling'), 300);
							return;
						}
						if (attempts === 5 && !resultBox.firstChild) {
							status.textContent = 'Đang chờ HSBA tải xong... (có thể 5–15s)';
						}
						if (attempts >= maxAttempts) {
							clearInterval(iv);
							if (!resultBox.firstChild) status.textContent = 'Hết thời gian chờ HSBA.';
						}
					} catch (_) {}
				}, 1000);
			} else if (!resultBox.firstChild) {
				status.textContent = 'Không hỗ trợ lắng nghe nền. Hãy chuyển sang tab HSBA để tải xong, rồi quay lại.';
			}
		});

		pane.appendChild(btnFetch);
		pane.appendChild(status);
		pane.appendChild(resultBox);
		tabContent.appendChild(pane);

		// Bind toggle behavior (for newly added button)
		attachTabToggleBehavior(rootEl);
	} catch (e) {
		console.warn('addHSBATab error', e);
	}
}

// Background worker on hsba.tahospital.vn — auto-fetch GraphQL and publish via GM_setValue
async function hsbaBackgroundFetcherIfNeeded() {
	try {
		if (typeof window === 'undefined') return;
		if (window.location.hostname !== 'hsba.tahospital.vn') return;
	const params = new URLSearchParams(window.location.search);
	const pid = params.get('pid');
	const s = params.get('s') || '';
	const t = params.get('t') || '';
	const site = params.get('site') || '1';
		if (!pid) return;

		function waitForGrid() {
			return new Promise(resolve => {
				// Prefer the explicit container; fallback to generic grid if classnames change
				const targetSelectors = [
					'div.MuiGrid-root'
				];
				if (targetSelectors.some(q => document.querySelector(q))) return resolve(true);
				const obs = new MutationObserver(() => {
					if (targetSelectors.some(q => document.querySelector(q))) {
						obs.disconnect();
						resolve(true);
					}
				});
				obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
				// Fallback timeout
				setTimeout(() => { try { obs.disconnect(); } catch(_) {} resolve(true); }, 15000);
			});
		}

		await waitForGrid();

		const today = formatDateYYYYMMDD(new Date());
		const body = {
			operationName: 'hoSoBenhAns',
			variables: {
				mabn: String(pid),
				tuNgay: '2024-01-01',
				denNgay: today,
				offset: 0,
				limit: 1000
			},
			query: `query hoSoBenhAns($mabn: String, $tuNgay: DateTime, $denNgay: DateTime, $daKy: Boolean, $offset: Int, $limit: Int, $makp: String, $raVien: Boolean) {
  hoSoBenhAns(
	mabn: $mabn
	tuNgay: $tuNgay
	denNgay: $denNgay
	daKy: $daKy
	offset: $offset
	limit: $limit
	makp: $makp
	raVien: $raVien
  ) {
	items {
	  mabn
	  hoten
	  ngaysinh
	  phai
	  diachi
	  mavaovien
	  sovaovien
	  doituong
	  tenkp
	  ngayvao
	  ngayra
	  chandoan
	  tenba
	  ngayky
	  loai
	  dienthoai
	  tenfile
	  fileName
	  tuoi
	  daky
	  maql
	  tennguoiky
	  coTheKyTong
	  ChiDinhNgoai
	  nguoiky
	  hoSoChiTiet {
		stt
		gayid
		tengay
		chiTiets {
		  id
		  tenfile
		  fileName
		  ngay
		  tenmau
		  daky
		  coTheKyChiTiet
		  congkhai
		  maql
		  BieuMau {
			id
			maphieu
			stt
			gayid
			slkyso
			ghichu
			loaiphieu
			trangthai
			chophepxoa
			congkhai
			xemtomtat
			NhomBieuMau {
			  id
			  ten
			  __typename
			}
			__typename
		  }
		  __typename
		}
		__typename
	  }
	  loaidieutri
	  __typename
	}
	total
	offset
	limit
	__typename
  }
}`
		};

				// Inject a main-world script that performs the fetch with the exact headers and posts the result back
				try {
						if (!window.__dr_hsba_injected__) {
								window.__dr_hsba_injected__ = true;
								// Listen for result from main world and persist via GM_setValue
								window.addEventListener('message', (ev) => {
										try {
												const d = ev && ev.data;
												if (!d || d.type !== 'DR_HSBA_RESULT' || d.pid !== pid) return;
												// Filter payload to only keep allowed tenmau docs
												let filtered = d.payload || {};
												try {
													const src = d.payload;
													if (src && src.data && src.data.hoSoBenhAns) {
														const cloned = JSON.parse(JSON.stringify(src));
														const items = Array.isArray(cloned.data.hoSoBenhAns.items) ? cloned.data.hoSoBenhAns.items : [];
														items.forEach(it => {
															if (Array.isArray(it.hoSoChiTiet)) {
																it.hoSoChiTiet.forEach(g => {
																	if (Array.isArray(g.chiTiets)) {
																		g.chiTiets = g.chiTiets.filter(x => !x || !x.tenmau ? false : shouldShowTenmau(x.tenmau));
																	}
																});
															}
														});
														filtered = cloned;
													}
												} catch(_) {}
												if (typeof GM_setValue === 'function') {
														GM_setValue(`dr_hsba_result_${pid}`, JSON.stringify(filtered));
												} else {
														window.__dr_hsba_result__ = filtered;
												}
										} catch(_) {}
								});
												const refUrl = `${window.location.origin}/public?pid=${encodeURIComponent(pid)}&t=${encodeURIComponent(t)}&s=${encodeURIComponent(s)}&site=${encodeURIComponent(site)}`;
								const script = document.createElement('script');
								script.type = 'text/javascript';
								script.textContent = `(() => {
	try {
		const pid = ${JSON.stringify(pid)};
		const s = ${JSON.stringify(s)};
		const t = ${JSON.stringify(t)};
		const site = ${JSON.stringify(String(site))};
		const body = ${JSON.stringify(body)};
		const referrer = ${JSON.stringify(refUrl)};
						const headers = {
							"accept": "*/*",
							"accept-language": "en-US,en;q=0.9,vi;q=0.8",
							"content-type": "application/json",
							pid: String(pid),
							priority: "u=1, i",
							s: s,
							site: String(site),
							t: t
						};

						// Inline viewer: if URL hash has dr-viewer, fetch the file and render via blob URL
						const showInlineViewer = (filePath, docName, docDate) => {
							try {
								const overlay = document.createElement('div');
								overlay.id = 'dr-hsba-viewer-overlay';
								overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.75);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:0;width:100vw;height:100vh;';
								overlay.setAttribute('role', 'dialog');
								overlay.setAttribute('aria-modal', 'true');
								const frameWrap = document.createElement('div');
								frameWrap.id = 'dr-hsba-viewer-framewrap';
								frameWrap.style.cssText = 'background:#fff;width:100vw;height:100vh;box-shadow:0 10px 30px rgba(0,0,0,0.4);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;margin:0;';
								const bar = document.createElement('div');
								bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:#0ea5e9;color:#fff;font-weight:700;';
								const title = document.createElement('span');
								title.textContent = 'Xem tài liệu HSBA';
								const actions = document.createElement('div');
								actions.style.cssText = 'display:flex;gap:8px;align-items:center;';
								const btnDownload = document.createElement('button');
								btnDownload.id = 'dr-hsba-viewer-download';
								btnDownload.textContent = 'Tải xuống';
								btnDownload.style.cssText = 'background:#fff;color:#0f172a;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;';
								const prevOverflow = document.body && document.body.style ? document.body.style.overflow : '';
								let currentBlobUrl = null;
								const revokeUrl = () => { try { if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; } } catch(_) {} };
								const doClose = () => { try { revokeUrl(); if (document.body) document.body.style.overflow = prevOverflow || ''; overlay.remove(); } catch(_) {} };
								actions.appendChild(btnDownload);
								bar.appendChild(title);
								bar.appendChild(actions);
								const iframe = document.createElement('iframe');
								iframe.id = 'dr-hsba-viewer-iframe';
								iframe.style.cssText = 'flex:1;border:0;background:#1f2937';
								frameWrap.appendChild(bar);
								frameWrap.appendChild(iframe);
								overlay.appendChild(frameWrap);
								if (document && document.body) { document.body.style.overflow = 'hidden'; }
								(document.body || document.documentElement).appendChild(overlay);
				// ESC disabled per requirements
				const getFileName = () => {
									try {
					const sanitize = (s) => (s || '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
					const namePart = sanitize(docName || 'HSBA');
					const datePart = sanitize(docDate || '');
					const combined = (namePart + (datePart ? ' - ' + datePart : '')).trim() || 'hsba-document';
					return combined + '.pdf';
									} catch(_) { return 'hsba-document.pdf'; }
								};
								const fileName = getFileName();
								const triggerDownload = () => {
									try {
										if (currentBlobUrl) {
											const a = document.createElement('a');
											a.href = currentBlobUrl;
											a.download = fileName;
											document.body.appendChild(a);
											a.click();
											a.remove();
										} else {
											// Fallback: navigate to API to download with credentials
											const a = document.createElement('a');
											a.href = '/api/hosobenhan/download?url=' + encodeURIComponent(filePath);
											a.target = '_blank';
											a.rel = 'noopener';
											document.body.appendChild(a);
											a.click();
											a.remove();
										}
									} catch(_) {}
								};
								btnDownload.onclick = () => triggerDownload();
								fetch('/api/hosobenhan/download?url=' + encodeURIComponent(filePath), { credentials: 'include' })
									.then(r => r.blob())
									.then(blob => {
										const u = URL.createObjectURL(blob);
										currentBlobUrl = u;
										iframe.src = u;
									})
									.catch(err => {
										console.error('[DR][HSBA] viewer fetch error:', err);
										doClose();
									});
							} catch (e) { console.error('[DR][HSBA] viewer error:', e); }
						};

						try {
							const h = window.location.hash || '';
							const m = h.match(/[#&]dr-viewer=([^&]+)/);
							if (m && m[1]) {
								const filePath = decodeURIComponent(m[1]);
								console.log('[DR][HSBA] inline viewer param detected:', filePath);
								let name = null, dateLabel = null;
								const n = h.match(/[#&]dr-name=([^&]+)/);
								if (n && n[1]) name = decodeURIComponent(n[1]);
								const d2 = h.match(/[#&]dr-date=([^&]+)/);
								if (d2 && d2[1]) dateLabel = decodeURIComponent(d2[1]);
								showInlineViewer(filePath, name, dateLabel);
							}
						} catch(_) {}
						fetch("/graphql", {
							headers,
			referrer: referrer,
			body: JSON.stringify(body),
			method: "POST",
			mode: "cors",
			credentials: "include"
		}).then(r => r.json()).then(json => {
			try { console.log('[DR][HSBA] raw API response:', json); } catch(_) {}
			window.postMessage({ type: 'DR_HSBA_RESULT', pid, payload: json }, '*');
		}).catch(err => {
			window.postMessage({ type: 'DR_HSBA_RESULT', pid, payload: { error: String(err && err.message || err) } }, '*');
		});
	} catch (e) {
		try { window.postMessage({ type: 'DR_HSBA_RESULT', pid: ${JSON.stringify(pid)}, payload: { error: String(e && e.message || e) } }, '*'); } catch(_) {}
	}
})();`;
								(document.head || document.documentElement || document.body).appendChild(script);
								// Optional: remove the script node after injected
								setTimeout(() => { try { script.remove(); } catch(_) {} }, 1000);
						}
				} catch(_) {}
	} catch (e) {
		// Swallow errors to avoid impacting page
		console.warn('hsbaBackgroundFetcherIfNeeded error', e);
	}
}

// Run background fetcher immediately on hsba domain
try { hsbaBackgroundFetcherIfNeeded(); } catch(_) {}

module.exports = { addHSBATab };


},{"../BS_CAI_DAT_GIAO_DIEN":1,"../services/checklistService":38,"./dialogManager":12}],15:[function(require,module,exports){
// components/khoaSelect.js - Reusable khoa selection button with dropdown

const ApiService = require('../services/apiService');

function ensureStyles() {
  if (document.getElementById('dr-khoa-select-css')) return;
  const st = document.createElement('style');
  st.id = 'dr-khoa-select-css';
  st.textContent = `
    .dr-khoa-select{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#0f172a;font-size:13px;cursor:pointer}
    .dr-khoa-caret{border:solid #64748b;border-width:0 2px 2px 0;display:inline-block;padding:2px;transform:rotate(45deg);margin-left:2px}
    .dr-khoa-select-wrap{position:relative;display:inline-block}
    .dr-khoa-menu{position:absolute;top:110%;left:0;min-width:220px;max-height:320px;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 10px 20px rgba(2,6,23,.08);z-index:9999;padding:6px}
    .dr-khoa-item{padding:6px 8px;border-radius:6px;cursor:pointer}
    .dr-khoa-item:hover{background:#f1f5f9}
    .dr-khoa-active{background:#e0f2fe}
    .dr-khoa-search{display:block;width:100%;box-sizing:border-box;margin:4px 0 6px 0;padding:6px 8px;border:1px solid #e5e7eb;border-radius:6px}
  `;
  document.head.appendChild(st);
}

function getStoredKhoaId(defaultId) {
  try { return localStorage.getItem('bsnt_khoa_dashboard') || defaultId; } catch(_) { return defaultId; }
}
function setStoredKhoaId(id) {
  try { localStorage.setItem('bsnt_khoa_dashboard', String(id)); } catch(_) {}
}

function createKhoaSelect(opts) {
  ensureStyles();
  const { container, onChange } = opts || {};
  const wrap = document.createElement('span');
  wrap.className = 'dr-khoa-select-wrap';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dr-khoa-select';
  btn.id = 'dr-khoa-select';
  const label = document.createElement('span');
  label.textContent = 'Chọn khoa';
  const caret = document.createElement('i'); caret.className = 'dr-khoa-caret';
  btn.appendChild(label); btn.appendChild(caret);
  const menu = document.createElement('div'); menu.className = 'dr-khoa-menu'; menu.style.display = 'none';
  const search = document.createElement('input'); search.className = 'dr-khoa-search'; search.placeholder = 'Tìm khoa...';
  const listBox = document.createElement('div');
  menu.appendChild(search); menu.appendChild(listBox);
  wrap.appendChild(btn); wrap.appendChild(menu);
  if (container) container.innerHTML = '', container.appendChild(wrap);

  let allKhoa = [];
  let currentId = getStoredKhoaId('551');

  function renderList(filter='') {
    listBox.innerHTML = '';
    const f = filter.trim().toLowerCase();
    allKhoa
      .filter(k => !f || (k.name||'').toLowerCase().includes(f) || String(k.id).includes(f))
      .forEach(k => {
        const item = document.createElement('div');
        item.className = 'dr-khoa-item' + (String(k.id) === String(currentId) ? ' dr-khoa-active' : '');
        item.textContent = `${k.name || 'Khoa'} (${k.id})`;
        item.addEventListener('click', () => {
          currentId = String(k.id);
          setStoredKhoaId(currentId);
          label.textContent = k.name || `Khoa ${k.id}`;
          if (typeof onChange === 'function') onChange(currentId, k.name || `Khoa ${k.id}`);
          menu.style.display = 'none';
        });
        listBox.appendChild(item);
      });
  }

  async function init() {
    try {
      const list = await ApiService.fetchKhoaPhong();
      allKhoa = Array.isArray(list) ? list : [];
      const found = allKhoa.find(k => String(k.id) === String(currentId));
      label.textContent = (found && found.name) || `Khoa ${currentId}`;
      renderList();
    } catch(_) {
      label.textContent = `Khoa ${currentId}`;
    }
  }

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (menu.style.display === 'none') {
      if (!allKhoa.length) await init();
      menu.style.display = 'block';
      search.focus();
    } else {
      menu.style.display = 'none';
    }
  });
  search.addEventListener('input', () => renderList(search.value || ''));
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) menu.style.display = 'none';
  });

  init();
  return { el: wrap, button: btn, refreshLabel: init, getKhoaId: () => currentId };
}

module.exports = { createKhoaSelect };

},{"../services/apiService":36}],16:[function(require,module,exports){
// components/listView.js - Rendering for list view rows and actions
const Utils = require('../utils');
const PatientDataMapper = require('../utils/patientDataMapper');
const { createYLenhTags, hasMedsDoneToday } = require('../utils/tagUtils');
const { escapeHtml } = require('../utils/htmlUtils');
const { createCopyOneButton, createToDieuTriButton, createHsbaButton } = require('./actionButtons');

function createListActions(item, onCopy) {
    const wrap = document.createElement('div');
    wrap.className = 'dr-list-actions';
    

    // Copy icon for single-patient report (left-most as requested)
    const btnCopy = createCopyOneButton({ item, variant: 'icon' });
    wrap.appendChild(btnCopy);

    // Document icon for Tờ điều trị
    const btnToDieuTri = createToDieuTriButton({ item, variant: 'icon' });
    wrap.appendChild(btnToDieuTri);

    // Eye icon for HSBA V2 (right-most)
    const btnHsba = createHsbaButton({ item, variant: 'icon' });
    wrap.appendChild(btnHsba);

    return wrap;
}

function createListRow(item, opts = {}) {
    const row = document.createElement('div');
    row.className = 'dr-list-row';
    const age = Utils.calculateAge(item.ngaysinh);
    const gender = item.phai === 1 ? 'Nữ' : 'Nam';
    const formattedLocation = PatientDataMapper.formatRoomLocation(
        item.teN_PHONG, item.teN_GIUONG, item.teN_TANG, item.teN_TOANHA
    );
    const { composeDiagnosis } = require('../utils/domUpdaters');
    const { baseText: dx } = composeDiagnosis(item);
    const hxtText = (item.checklistState && item.checklistState.huongXuTri) ? String(item.checklistState.huongXuTri).trim() : '';

    const left = document.createElement('div');
    left.innerHTML = `
    <div class="dr-list-title">${item.hoten || ''} <span class="dr-list-dem">- ${age}t - ${gender}</span> • <span class="dr-list-mabn">${item.mabn || ''}</span> • <span class="dr-list-loc">${formattedLocation}</span></div>
        <div class="dr-list-dx">${dx}</div>
        ${hxtText ? `<div class="dr-value dr-hxt-block"><span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}</div>` : ''}
        ${createYLenhTags(item)}
    `;

    const onCopy = async () => {
        try {
            const ReportService = require('../services/reportService');
            const ChecklistService = require('../services/checklistService');
            const { copyReportToClipboardRich } = require('../pages/page.dashboard.support');
            const res = await ChecklistService.loadChecklistData(item);
            const obj = ChecklistService.findChecklistObject(res);
            const state = obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
            const html = ReportService.generateSingleHTML(item, state);
            const text = ReportService.generateSingleText(item, state);
            await copyReportToClipboardRich(html, text);
        } catch (err) { console.error('Copy single-patient report failed:', err); }
    };

    const right = createListActions(item, onCopy);

    row.appendChild(left);
    row.appendChild(right);

    if (typeof opts.onOpen === 'function') {
        row.addEventListener('click', opts.onOpen);
    }

    return row;
}

// escapeHtml now provided by utils/htmlUtils

module.exports = {
    createListRow
};

},{"../pages/page.dashboard.support":31,"../services/checklistService":38,"../services/reportService":41,"../utils":47,"../utils/domUpdaters":52,"../utils/htmlUtils":55,"../utils/patientDataMapper":57,"../utils/tagUtils":60,"./actionButtons":5}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
// modalManager.js - Centralized modal/sidebar management
let SidebarSession = null;
try { SidebarSession = require('./sidebarSession'); } catch(_) {}

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
        if (sidebar) {
            sidebar.style.display = 'none';
            sidebar.innerHTML = ''; // Clear content between patients
        }
        backdrop.style.display = 'none';
    try { if (SidebarSession && typeof SidebarSession.endSession === 'function') SidebarSession.endSession(); } catch(_) {}
    },

    /**
     * Setup modal close handlers
     */
    setupCloseHandlers(sidebar, backdrop) {
        const hideModal = () => this.hideModal(sidebar, backdrop);
        
        // Click backdrop to close and clear content
        backdrop.onclick = () => {
            sidebar.innerHTML = ''; // Clear all HTML content of current dr-sidebar
            this.hideModal(sidebar, backdrop);
        };
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Đóng';
        closeBtn.style = 'position:absolute;top:12px;right:12px;background:#eee;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;';
        closeBtn.onclick = hideModal;
        
        return closeBtn;
    }
};

module.exports = ModalManager;

},{"./sidebarSession":23}],19:[function(require,module,exports){
// patientInfoSection.js
const { setupYLenhHandlers } = require('./yLenhHandlers');
const { setupPhauThuatHandlers } = require('./phauThuatHandlers');
const ChecklistService = require('../services/checklistService');
const Utils = require('../utils');
const ReportService = require('../services/reportService');
const { callGlobalFn } = require('../utils/globalFnUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

function createPatientInfoSection(patient, quickYLenhActions) {
    const ctxId = (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id) || `${patient.mabn}:${Date.now()}`;
    const info = document.createElement('div');
    // Reuse report DOB/age formatter for consistency with dr-report-content
    const { dob, age } = ReportService.formatDateOfBirth(patient.ngaysinh);
    const gender = patient.phai === 1 ? 'Nữ' : 'Nam';
    const room = patient.teN_PHONG || '';
    const bed = patient.teN_GIUONG || '';
    info.innerHTML = `
        <h2 style="margin-top:0">${patient.hoten || ''} <span class="dr-patient-mabn-sidebar" style="font-size:0.9em;color:#888;cursor:pointer;" title="Click để copy mã BN">${patient.mabn ? ' - ' + patient.mabn : ''}</span></h2>
        <div><b>DOB:</b> ${dob} (${age}) - ${gender} - ${room} - ${bed}</div>
        <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
        <div style="margin-top:8px; display:grid; grid-template-columns:max-content 1fr; align-items:start; column-gap:10px;">
            <label for="dr-chandoan-kemtheo" style="margin:0;font-weight:600;line-height:1.4;font-size:12px;color:#555;">Bệnh đi kèm</label>
            <div style="display:flex;flex-direction:column;gap:4px;">
                <textarea id="dr-chandoan-kemtheo" rows="2" placeholder="VD: THA, ĐTĐ type 2..." style="width:100%;padding:6px 8px;border:1px solid #90caf9;border-radius:4px;resize:vertical;font-size:12px;line-height:1.3;min-height:44px;box-shadow:0 0 0 2px rgba(25,118,210,0.12);outline:none;"></textarea>
            </div>
        </div>
        
        <div style="margin-top:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;">
                <h3 style="margin:0;">Thông tin phẫu thuật</h3>
                <button id="dr-show-pt-form" style="background:#1976d2;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:0.9em;white-space:nowrap;">Thêm phẫu thuật</button>
            </div>
            <div id="dr-pt-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;">
                <div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>
            </div>
        </div>
        
        <div style="margin-top:20px;">
            <h3 style="margin-bottom:10px;">Kế hoạch điều trị / Hướng xử trí</h3>
            <textarea id="dr-hxt-textarea" rows="3" placeholder="VD: Kháng sinh 7 ngày, dự kiến xuất viện 22/08, tái khám sau 1 tuần..." style="width:100%;padding:10px;border:1px solid #eee;border-radius:6px;resize:vertical;"></textarea>
        </div>
        
        <div style="margin-top:20px;">
            <h3 style="margin-bottom:10px;">Log y lệnh</h3>
            
            <!-- Quick Action Buttons -->
            <div class="quick-ylenh-actions">
                ${quickYLenhActions.map(action => `
                    <button class="quick-ylenh-btn" data-action="${action.label}" ${action.label === 'Đã đánh thuốc' ? 'data-no-add-to-hxt="1"' : ''} style="color: ${action.color}; border-color: ${action.color};">
                        <span class="icon">${action.icon}</span>
                        <span class="text">${action.label}</span>
                    </button>
                `).join('')}
            </div>
            
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
                <input type="text" id="dr-y-lenh-input" placeholder="Nhập y lệnh (VD: rút sonde tiểu)" style="padding:10px;border:1px solid #ddd;border-radius:4px;">
                <button id="dr-add-y-lenh" style="padding:12px 16px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;width:100%;">Thêm</button>
            </div>
            <div id="dr-y-lenh-log" style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:10px;border-radius:4px;background:#f9f9f9;word-break: break-word; overflow-wrap: anywhere;">
                <div style="color:#888;font-style:italic;">Chưa có y lệnh nào...</div>
            </div>
        </div>

        <div style="margin-top:20px;">
            <h3 style="margin-bottom:10px;">Xuất viện</h3>
            <div id="dr-xv-log" style="max-height:180px;overflow-y:auto;border:1px solid #e8f5e9;padding:10px;border-radius:4px;background:#f8fff9;word-break: break-word; overflow-wrap: anywhere;">
                <div style="color:#888;font-style:italic;">Chưa có xuất viện nào...</div>
            </div>
        </div>
    `;

    // Setup y lệnh functionality
    setupYLenhHandlers(info, patient);

    // Setup phẫu thuật functionality
    setupPhauThuatHandlers(info, patient);

    // Setup HXT (kế hoạch điều trị) auto-save and live update
    const hxtTextarea = info.querySelector('#dr-hxt-textarea');
    // Setup Chẩn đoán kèm theo auto-save
    const cdktTextarea = info.querySelector('#dr-chandoan-kemtheo');
    // Shared debounced save state
    let pendingSaveTimer = null;
    const SAVE_DEBOUNCE_MS = 700;

    // Track last saved values to avoid redundant saves
    const lastSaved = {
        hxt: (patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string')
            ? String(patient.checklistState.huongXuTri).trim() : '',
        cdkt: (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string')
            ? String(patient.checklistState.chanDoanKemTheo).trim() : ''
    };
    // Current draft values
    const draft = { hxt: lastSaved.hxt, cdkt: lastSaved.cdkt };
    let dirty = { hxt: false, cdkt: false };

    // Initial load from patient-scoped state only (avoid leaking previous patient's global state)
    setTimeout(() => {
        if (patient && patient.checklistState && typeof patient.checklistState.huongXuTri === 'string') {
            hxtTextarea.value = patient.checklistState.huongXuTri;
        }
        if (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string') {
            cdktTextarea.value = patient.checklistState.chanDoanKemTheo;
        }
        if (typeof window.currentSyncHxtFromYLenhLog === 'function') {
            window.currentSyncHxtFromYLenhLog();
        }
    }, 50);

    function ensureSidebarSaveSpinner() {
        let spinner = document.getElementById('dr-sidebar-save-spinner');
        if (spinner) return spinner;

        if (!document.getElementById('dr-sidebar-save-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'dr-sidebar-save-spinner-style';
            style.textContent = '@keyframes drspin{to{transform:rotate(360deg)}}';
            document.head.appendChild(style);
        }

        spinner = document.createElement('div');
        spinner.id = 'dr-sidebar-save-spinner';
        spinner.style.cssText = `
            position: fixed;
            top: 16px;
            right: 18px;
            z-index: 100010;
            display: none;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.92);
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
            pointer-events: none;
        `;
        spinner.innerHTML = '<span style="width:12px;height:12px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:drspin 0.8s linear infinite;display:inline-block;"></span><span>Đang lưu</span>';
                    // Keep the spinner as the only save feedback; no inline toast.
        return spinner;
    }

    function setSidebarSaveSpinner(visible, label = 'Đang lưu') {
        const spinner = ensureSidebarSaveSpinner();
        const text = spinner.querySelector('span:last-child');
        if (text) text.textContent = label;
        spinner.style.display = visible ? 'inline-flex' : 'none';
    }

    window.__drSetSidebarSaveSpinner = setSidebarSaveSpinner;
    window.__drEnsureSidebarSaveSpinner = ensureSidebarSaveSpinner;

    function softUpdate(key, value) {
        if (!window.checklistState) window.checklistState = {};
        window.checklistState = { ...(window.checklistState || {}), [key]: value };
        patient.checklistState = { ...(patient.checklistState || {}), [key]: value };
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
    }

    async function persistIfDirty() {
        // Build a single save payload only if something actually changed
        const changedKeys = [];
        if (dirty.hxt && draft.hxt !== lastSaved.hxt) changedKeys.push('hxt');
        if (dirty.cdkt && draft.cdkt !== lastSaved.cdkt) changedKeys.push('cdkt');
        if (changedKeys.length === 0) return;

        if (!window.checklistState) window.checklistState = {};
        const nextState = { ...window.checklistState };
        if (changedKeys.includes('hxt')) nextState.huongXuTri = draft.hxt;
        if (changedKeys.includes('cdkt')) nextState.chanDoanKemTheo = draft.cdkt;

        // Persist once
        if (window.checklistObj) {
            try {
                const res = await ChecklistService.updateChecklistState(window.checklistObj, nextState, { ctxId, enqueueOnOffline: true, signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
                if (!res || (!res.ok && !res.queued)) {
                    console.warn('Lưu checklist thất bại');
                } else {
                    // If this sidebar is no longer active, do not apply visual updates
                    if (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id !== ctxId) return;
                    // Update global state snapshot and lastSaved
                    window.checklistState = nextState;
                    if (changedKeys.includes('hxt')) lastSaved.hxt = draft.hxt;
                    if (changedKeys.includes('cdkt')) lastSaved.cdkt = draft.cdkt;
                    dirty = { hxt: false, cdkt: false };

                    // Subtle flash effect on saved fields
                    try {
                        const flash = (el) => {
                            if (!el) return;
                            const prev = el.style.boxShadow;
                            el.style.boxShadow = '0 0 0 2px rgba(76,175,80,0.6)';
                            setTimeout(() => { el.style.boxShadow = prev || ''; }, 400);
                        };
                        if (changedKeys.includes('hxt')) {
                            try { callGlobalFn('updatePatientCardHXT', patient); } catch (_) { }
                            flash(hxtTextarea);
                        }
                        if (changedKeys.includes('cdkt')) {
                            try { callGlobalFn('updatePatientCardCDKT', patient); } catch (_) { }
                            flash(cdktTextarea);
                            try { callGlobalFn('updatePatientCardCDKT', patient); } catch (_) { }
                        }
                    } catch (_) { }
                }
            } finally {
                if (typeof window.__drSetSidebarSaveSpinner === 'function') {
                    window.__drSetSidebarSaveSpinner(false);
                }
            }
        }
    }

    function scheduleSave() {
        if (pendingSaveTimer) clearTimeout(pendingSaveTimer);
        pendingSaveTimer = setTimeout(() => {
            pendingSaveTimer = null;
            persistIfDirty();
        }, SAVE_DEBOUNCE_MS);
    }

    hxtTextarea.addEventListener('input', () => {
        const val = hxtTextarea.value.trim();
        draft.hxt = val;
        // Mark dirty only if actual change relative to last saved
        dirty.hxt = (val !== lastSaved.hxt);
        softUpdate('huongXuTri', val);
        callGlobalFn('updatePatientCardHXT', patient);
        if (typeof window.__drSetSidebarSaveSpinner === 'function') window.__drSetSidebarSaveSpinner(true, 'Đang lưu HXT');
        scheduleSave();
    });
    hxtTextarea.addEventListener('blur', () => {
        if (pendingSaveTimer) {
            clearTimeout(pendingSaveTimer);
            pendingSaveTimer = null;
        }
        // Save only if dirty to avoid redundant saves on focus/blur without edits
        persistIfDirty();
    });

    cdktTextarea.addEventListener('input', () => {
        const val = cdktTextarea.value.trim();
        draft.cdkt = val;
        dirty.cdkt = (val !== lastSaved.cdkt);
        softUpdate('chanDoanKemTheo', val);
        if (typeof window.__drSetSidebarSaveSpinner === 'function') window.__drSetSidebarSaveSpinner(true, 'Đang lưu bệnh đi kèm');
        scheduleSave();
    });
    cdktTextarea.addEventListener('blur', () => {
        if (pendingSaveTimer) {
            clearTimeout(pendingSaveTimer);
            pendingSaveTimer = null;
        }
        persistIfDirty();
    });

    // Setup PID auto-copy
    setTimeout(() => {
        const pidSpan = info.querySelector('.dr-patient-mabn-sidebar');
        if (pidSpan && patient.mabn) {
            pidSpan.addEventListener('click', async () => {
                try {
                    const displaySettings = require('./displaySettings');
                    if (displaySettings.get('autoCopyPID')) {
                        const { copyToClipboard, showToast } = require('../utils/uiUtils');
                        const success = await copyToClipboard(patient.mabn);
                        if (success) {
                            showToast(`Đã copy PID: ${patient.mabn}`);
                        }
                    }
                } catch(e) { console.warn('Lỗi copy PID sidebar', e); }
            });
        }
    }, 10);

    return info;
}

module.exports = { createPatientInfoSection };

},{"../services/checklistService":38,"../services/reportService":41,"../utils":47,"../utils/globalFnUtils":53,"../utils/stateSync":58,"../utils/uiUtils":62,"./displaySettings":13,"./phauThuatHandlers":20,"./yLenhHandlers":26}],20:[function(require,module,exports){
// phauThuatHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const { updatePatientCardPhauThuat } = require('../utils/surgeryUtils');
const { callGlobalFn } = require('../utils/globalFnUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

function createDoctorCheckboxes(className) {
    return BS_CAI_DAT.danhSachBacSi.map(doctor =>
        `<div style="position:relative; margin-bottom: 4px;">
            <label style="display:flex; align-items:center; gap:4px; cursor:pointer; width:100%;">
                <input type="checkbox" class="${className}" value="${doctor}">
                <span class="dr-doctor-name">${doctor}</span>
                <span class="dr-pt-role-badge" data-doctor="${doctor}" style="margin-left:auto; font-size:10px; padding:2px 6px; border-radius:10px; color:white; font-weight:bold; display:none; background:#1976d2; white-space:nowrap;"></span>
            </label>
        </div>`
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
                <label style="font-size:0.9em;color:#666;margin-bottom:6px;display:block;">Bác sĩ thực hiện (theo thứ tự chọn):</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;margin-bottom:8px;">
                    ${createDoctorCheckboxes('dr-pt-doctor-popup')}
                </div>
                <div>
                    <label style="font-size:0.9em;color:#666;">Bác sĩ khác:</label>
                    <input type="text" id="dr-pt-other-doctor-popup" placeholder="Tên BS khác (cách nhau bằng dấu phẩy)" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="dr-cancel-pt" style="background:#666;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Hủy</button>
                <button id="dr-save-pt" style="background:${BS_CAI_DAT.colors.primary};color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Lưu</button>
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        const originalClosePopup = function () {
            document.body.removeChild(backdrop);
            document.documentElement.lang = originalLang || 'vi';
        };

        const dateInput = popup.querySelector('#dr-pt-date-popup');
        const hourInput = popup.querySelector('#dr-pt-hour-popup');
        const minuteInput = popup.querySelector('#dr-pt-minute-popup');
        const methodInput = popup.querySelector('#dr-pt-method-popup');
        const doctorCheckboxes = popup.querySelectorAll('.dr-pt-doctor-popup');
        const otherDoctorInput = popup.querySelector('#dr-pt-other-doctor-popup');
        const saveBtn = popup.querySelector('#dr-save-pt');
        const cancelBtn = popup.querySelector('#dr-cancel-pt');

        let selectedDoctorsOrder = [];

        function updateDoctorBadges() {
            // Clear all badges first
            popup.querySelectorAll('.dr-pt-role-badge').forEach(badge => {
                badge.style.display = 'none';
                badge.textContent = '';
            });

            // Update badges based on order
            selectedDoctorsOrder.forEach((doctor, idx) => {
                const badge = popup.querySelector(`.dr-pt-role-badge[data-doctor="${doctor}"]`);
                if (badge) {
                    badge.style.display = 'inline-block';
                    if (idx === 0) {
                        badge.textContent = 'PTV chính';
                        badge.style.background = '#d32f2f'; // Red for main
                    } else {
                        badge.textContent = `Phụ ${idx}`;
                        badge.style.background = '#1976d2'; // Blue for assistants
                    }
                }
            });
        }

        // Track selection order
        doctorCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    if (!selectedDoctorsOrder.includes(this.value)) {
                        selectedDoctorsOrder.push(this.value);
                    }
                } else {
                    selectedDoctorsOrder = selectedDoctorsOrder.filter(d => d !== this.value);
                }
                updateDoctorBadges();
                tryAutoSave();
            });
        });

        otherDoctorInput.addEventListener('blur', tryAutoSave);

        hourInput.addEventListener('input', function () {
            let value = parseInt(this.value);
            if (value > 23) this.value = 23;
            if (value < 0) this.value = 0;
            if (this.value.length === 2) {
                minuteInput.focus();
                minuteInput.select();
            }
        });

        hourInput.addEventListener('focus', function () {
            this.select();
        });

        minuteInput.addEventListener('input', function () {
            let value = parseInt(this.value);
            if (value > 59) this.value = 59;
            if (value < 0) this.value = 0;
        });

        minuteInput.addEventListener('focus', function () {
            this.select();
        });

        minuteInput.addEventListener('blur', function () {
            if (this.value && this.value.length === 1) {
                this.value = '0' + this.value;
            }
            tryAutoSave();
        });

        hourInput.addEventListener('blur', function () {
            if (this.value && this.value.length === 1) {
                this.value = '0' + this.value;
            }
            tryAutoSave();
        });

        // ── Auto-save on blur ──────────────────────────────────────────────────────
        // Validates and saves the current popup form values silently when user
        // leaves any of the key fields (date, hour, minute, method).
        // Only runs in EDIT mode (editIndex !== null) when there is already a record.
        function tryAutoSave() {
            if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                window.__drSidebarResetAutoSyncTimer();
            }
            const date = dateInput.value.trim();
            const hour = hourInput.value.trim();
            const minute = minuteInput.value.trim();
            const method = methodInput.value.trim();

            // Need at least date + time + method to auto-save
            if (!date || !hour || !minute || !method) return;

            const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            if (!dateRegex.test(date)) return;

            const h = parseInt(hour, 10);
            const m = parseInt(minute, 10);
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return;

            const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');

            let combinedDoctors = [...selectedDoctorsOrder];
            const otherVal = otherDoctorInput.value.trim();
            if (otherVal) {
                const others = otherVal.split(',').map(s => s.trim()).filter(s => !!s);
                others.forEach(o => {
                    if (!combinedDoctors.includes(o)) combinedDoctors.push(o);
                });
            }

            if (combinedDoctors.length === 0) return;

            if (!window.checklistState.phauThuatLog) {
                window.checklistState.phauThuatLog = [];
            }

            const newEntry = {
                date,
                time,
                method,
                doctors: combinedDoctors.join(', '),
                id: (editIndex !== null && window.checklistState.phauThuatLog[editIndex] && window.checklistState.phauThuatLog[editIndex].id)
                    ? window.checklistState.phauThuatLog[editIndex].id
                    : Date.now(),
                source: 'manual' // Tag as manual entry
            };

            if (editIndex !== null && window.checklistState.phauThuatLog[editIndex]) {
                window.checklistState.phauThuatLog[editIndex] = newEntry;
            } else if (editIndex === null) {
                // For new entry mode, update the first slot tentatively (will be finalised on Save)
                return;
            } else {
                return;
            }

            syncPatientStateToGlobal(patient.mabn, window.checklistState);

            // Persist and update card silently
            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuatLocal(patient);

            // Brief visual flash on the popup itself
            try {
                const prev = popup.style.boxShadow;
                popup.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.5)';
                setTimeout(() => { popup.style.boxShadow = prev || ''; }, 500);
            } catch (_) { }
        }

        // Wire auto-save to blur on key fields
        dateInput.addEventListener('blur', tryAutoSave);
        methodInput.addEventListener('blur', tryAutoSave);

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

            // Set doctors and maintain order
            if (editData.doctors) {
                const doctorList = editData.doctors.split(', ').map(s => s.trim());
                const predefined = BS_CAI_DAT.danhSachBacSi;
                const others = [];

                doctorList.forEach(doc => {
                    if (predefined.includes(doc)) {
                        selectedDoctorsOrder.push(doc);
                        doctorCheckboxes.forEach(cb => {
                            if (cb.value === doc) cb.checked = true;
                        });
                    } else {
                        others.push(doc);
                    }
                });

                if (others.length > 0) {
                    otherDoctorInput.value = others.join(', ');
                }
                updateDoctorBadges();
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
            if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                window.__drSidebarResetAutoSyncTimer();
            }
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

            let combinedDoctors = [...selectedDoctorsOrder];
            const otherVal = otherDoctorInput.value.trim();
            if (otherVal) {
                const others = otherVal.split(',').map(s => s.trim()).filter(s => !!s);
                others.forEach(o => {
                    if (!combinedDoctors.includes(o)) combinedDoctors.push(o);
                });
            }

            if (combinedDoctors.length === 0) {
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
                doctors: combinedDoctors.join(', '),
                id: Date.now(),
                source: 'manual' // Tag as manual entry
            };

            if (editIndex !== null) {
                // Update existing entry
                window.checklistState.phauThuatLog[editIndex] = newEntry;
            } else {
                // Add new entry at the beginning
                window.checklistState.phauThuatLog.unshift(newEntry);
            }

            syncPatientStateToGlobal(patient.mabn, window.checklistState);

            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuatLocal(patient);
            closePopup();
        }

        saveBtn.addEventListener('click', savePhauThuat);
        cancelBtn.addEventListener('click', closePopup);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) {
                closePopup();
            }
        });
    }

    function loadPhauThuatLog() {
        const log = (patient && patient.checklistState && Array.isArray(patient.checklistState.phauThuatLog))
            ? patient.checklistState.phauThuatLog
            : (window.checklistState && Array.isArray(window.checklistState.phauThuatLog))
                ? window.checklistState.phauThuatLog
                : null;
        if (log) {
            renderPhauThuatLog(log);
        }
    }

    function renderPhauThuatLog(phauThuatArray) {
        if (!Array.isArray(phauThuatArray) || phauThuatArray.length === 0) {
            logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>';
            return;
        }

        logContainer.innerHTML = phauThuatArray.map((entry, index) => {
            const sourceMarker = entry.source === 'otm' 
                ? '<span style="color:#1976d2; font-size:0.8em; margin-left:8px;">[OTM]</span>' 
                : '<span style="color:#d32f2f; font-size:0.8em; margin-left:8px;">[Tay]</span>';
            
            return `
            <div class="pt-entry-clickable" data-index="${index}" style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #4caf50;position:relative;cursor:pointer;transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='#fff'">
                <button class="remove-pt-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;z-index:1;">Xóa</button>
                <div style="font-size:0.9em;color:#666;margin-bottom:4px;"><strong>Ngày PT:</strong> ${entry.date} ${entry.time}${sourceMarker}</div>
                <div style="font-weight:bold;color:#333;margin-bottom:2px;"><strong>PPPT:</strong> ${entry.method}</div>
                <div id="dr-bs-PTV-${index}" data-field-id="dr-bs-PTV" style="font-size:0.85em;color:#555;"><strong>BS:</strong> ${entry.doctors}</div>
            </div>
            `;
        }).join('');

        setTimeout(() => {
            logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const index = parseInt(this.getAttribute('data-index'));
                    removePhauThuat(index);
                });
            });

            logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                entry.addEventListener('click', function (e) {
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
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        if (window.checklistState.phauThuatLog && Array.isArray(window.checklistState.phauThuatLog)) {
            window.checklistState.phauThuatLog.splice(index, 1);
            syncPatientStateToGlobal(patient.mabn, window.checklistState);
            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuatLocal(patient);
        }
    }

    async function savePhauThuatLog() {
        if (window.checklistObj) {
            if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                window.__drSidebarResetAutoSyncTimer();
            }
            const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.error('Lưu log phẫu thuật thất bại!');
            }
        }
    }

    function updatePatientCardPhauThuatLocal(patient) {
        try {
            // Prefer the patient object from window.dr_data to ensure card updaters operate on canonical data
            let patientInData = null;
            if (window.dr_data && Array.isArray(window.dr_data)) {
                patientInData = window.dr_data.find(p => (p && (p.mabn === patient.mabn || p.pid === patient.mabn || p.mabn === patient.pid)));
            }
            const target = patientInData || patient;
            updatePatientCardPhauThuat(target);
            callGlobalFn('updatePatientCardPhauThuat', target);
        } catch (e) {
            try { updatePatientCardPhauThuat(patient); callGlobalFn('updatePatientCardPhauThuat', patient); } catch (_) {}
        }
    }

    showFormBtn.addEventListener('click', () => createPhauThuatPopup(null));

    // Initial load: immediate from patient state or window state
    loadPhauThuatLog();

    // Sync poll: if patient.checklistState was empty or window.checklistState arrives later, refresh
    let _syncPollCount = 0;
    const _syncPoll = setInterval(() => {
        _syncPollCount++;
        const wlog = window.checklistState && Array.isArray(window.checklistState.phauThuatLog)
            ? window.checklistState.phauThuatLog : null;
        const plog = patient && patient.checklistState && Array.isArray(patient.checklistState.phauThuatLog)
            ? patient.checklistState.phauThuatLog : null;

        if (wlog && wlog !== plog) {
            if (patient) patient.checklistState = { ...(patient.checklistState || {}), phauThuatLog: wlog };
            loadPhauThuatLog();
            clearInterval(_syncPoll);
        }
        if (_syncPollCount >= 20) clearInterval(_syncPoll); // Stop after ~2s
    }, 100);

    window.currentRemovePhauThuat = removePhauThuat;
    window.currentRenderPhauThuatLog = renderPhauThuatLog;
    window.currentEditPhauThuat = editPhauThuat;
}

module.exports = { setupPhauThuatHandlers };

},{"../BS_CAI_DAT_GIAO_DIEN":1,"../services/checklistService":38,"../utils/globalFnUtils":53,"../utils/stateSync":58,"../utils/surgeryUtils":59}],21:[function(require,module,exports){
// responsiveDropdown.js - Shared dropdown controller for top bar menus

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function isCompactViewport(breakpoint) {
    try {
        const maxWidthQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
        return maxWidthQuery.matches || coarsePointerQuery.matches;
    } catch (_) {
        return false;
    }
}

class ResponsiveDropdownController {
    constructor(options = {}) {
        this.breakpoint = Number.isFinite(Number(options.breakpoint)) ? Number(options.breakpoint) : 1180;
        this.zIndex = Number.isFinite(Number(options.zIndex)) ? Number(options.zIndex) : 10050;
        this.entriesById = new Map();
        this.openEntryIds = new Set();
        this.boundDocumentClick = this.handleDocumentClick.bind(this);
        this.boundWindowResize = this.handleViewportChange.bind(this);
        this.boundWindowScroll = this.handleViewportChange.bind(this);
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.documentListenersAttached = false;
        this.documentClickCapture = true;
        this.windowScrollCapture = true;
    }

    register(config) {
        if (!config || !config.id || !config.container || !config.toggle || !config.menu) return null;

        const entry = {
            id: config.id,
            type: config.type || 'dropdown',
            container: config.container,
            toggle: config.toggle,
            menu: config.menu,
            trigger: config.trigger || config.toggle,
            align: config.align || 'auto',
            breakpoint: Number.isFinite(Number(config.breakpoint)) ? Number(config.breakpoint) : this.breakpoint,
            zIndex: Number.isFinite(Number(config.zIndex)) ? Number(config.zIndex) : this.zIndex,
            openClass: config.openClass || 'open',
            menuPortalParent: null,
            menuPortalNextSibling: null,
            isOpen: false,
            closeTimer: null,
            hoverEnabled: config.hoverEnabled !== false
        };

        this.entriesById.set(entry.id, entry);

        if (entry.toggle && config.bindToggle !== false) {
            entry.toggle.addEventListener('click', (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.toggle(entry.id);
            });
        }

        return entry;
    }

    registerSubmenu(config) {
        const entry = this.register({
            ...config,
            type: 'submenu',
            trigger: config.trigger || config.toggle || config.menu
        });

        if (!entry) return entry;

        entry.parentId = config.parentId;

        const openOnHover = () => {
            if (!this.shouldUseCompactMode(entry)) {
                this.cancelCloseTimer(entry);
                this.open(entry.id);
            }
        };

        const scheduleClose = () => {
            if (this.shouldUseCompactMode(entry)) return;
            this.scheduleCloseTimer(entry);
        };

        if (entry.trigger && entry.hoverEnabled) {
            entry.trigger.addEventListener('pointerenter', openOnHover);
            entry.trigger.addEventListener('pointerleave', scheduleClose);
            entry.trigger.addEventListener('click', (event) => {
                if (!this.shouldUseCompactMode(entry)) return;
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.toggle(entry.id);
            });
        }

        if (entry.menu && entry.hoverEnabled) {
            entry.menu.addEventListener('pointerenter', () => this.cancelCloseTimer(entry));
            entry.menu.addEventListener('pointerleave', scheduleClose);
        }

        return entry;
    }

    shouldUseCompactMode(entryOrId) {
        const entry = typeof entryOrId === 'string' ? this.entriesById.get(entryOrId) : entryOrId;
        if (!entry) return isCompactViewport(this.breakpoint);
        return isCompactViewport(entry.breakpoint);
    }

    isOpen(id) {
        const entry = this.entriesById.get(id);
        return !!(entry && entry.isOpen);
    }

    toggle(id) {
        const entry = this.entriesById.get(id);
        if (!entry) return;
        if (entry.isOpen) this.close(id);
        else this.open(id);
    }

    open(id) {
        const entry = this.entriesById.get(id);
        if (!entry) return;

        this.cancelCloseTimer(entry);
        this.closeAll(entry.id);

        if (!entry.menuPortalParent) {
            entry.menuPortalParent = entry.menu.parentNode;
            entry.menuPortalNextSibling = entry.menu.nextSibling;
        }

        if (entry.menu.parentNode !== document.body) {
            document.body.appendChild(entry.menu);
        }

        entry.container.classList.add(entry.openClass);
        entry.menu.style.display = 'block';
        entry.menu.style.position = 'fixed';
        entry.menu.style.visibility = 'hidden';
        entry.menu.style.opacity = '0';
        entry.menu.style.transform = 'translateY(10px)';
        entry.menu.style.left = '0px';
        entry.menu.style.top = '0px';
        entry.menu.style.right = 'auto';
        entry.menu.style.bottom = 'auto';
        entry.menu.style.zIndex = String(entry.zIndex);
        entry.menu.style.maxHeight = 'calc(100vh - 16px)';
        entry.menu.style.overflowY = 'auto';
        entry.menu.style.overflowX = 'hidden';
        entry.menu.style.boxSizing = 'border-box';

        entry.isOpen = true;
        this.openEntryIds.add(entry.id);
        this.ensureGlobalListeners();

        window.requestAnimationFrame(() => {
            if (!entry.isOpen) return;
            this.position(entry);
            entry.menu.style.opacity = '1';
            entry.menu.style.transform = 'translateY(0)';
            entry.menu.style.visibility = 'visible';
        });
    }

    close(id) {
        const entry = this.entriesById.get(id);
        if (!entry || !entry.isOpen) return;

        this.cancelCloseTimer(entry);
        entry.isOpen = false;
        this.openEntryIds.delete(entry.id);
        entry.container.classList.remove(entry.openClass);
        entry.menu.style.display = 'none';
        entry.menu.style.visibility = '';
        entry.menu.style.opacity = '';
        entry.menu.style.transform = '';
        entry.menu.style.position = '';
        entry.menu.style.left = '';
        entry.menu.style.top = '';
        entry.menu.style.right = '';
        entry.menu.style.bottom = '';
        entry.menu.style.zIndex = '';
        entry.menu.style.maxHeight = '';
        entry.menu.style.overflowY = '';
        entry.menu.style.overflowX = '';
        entry.menu.style.boxSizing = '';

        this.restoreMenu(entry);
        this.cleanupGlobalListeners();
    }

    closeAll(exceptId = null) {
        const keepOpenIds = new Set();
        if (exceptId) {
            let currentId = exceptId;
            while (currentId) {
                keepOpenIds.add(currentId);
                const currentEntry = this.entriesById.get(currentId);
                currentId = currentEntry ? currentEntry.parentId : null;
            }
        }

        Array.from(this.openEntryIds).forEach((openId) => {
            if (keepOpenIds.has(openId)) return;
            this.close(openId);
        });
    }

    position(entry) {
        const anchor = entry.type === 'submenu' ? entry.trigger : entry.toggle;
        if (!anchor || !entry.menu) return;

        const anchorRect = anchor.getBoundingClientRect();
        const menuRect = entry.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const margin = 8;
        const gap = entry.type === 'submenu' ? 6 : 8;
        const compact = this.shouldUseCompactMode(entry);

        let left = anchorRect.left;
        let top = anchorRect.bottom + gap;

        if (entry.type === 'submenu') {
            if (compact) {
                left = anchorRect.left;
                top = anchorRect.bottom + 6;
            } else {
                left = anchorRect.right + gap;
                if (left + menuRect.width > viewportWidth - margin) {
                    left = anchorRect.left - menuRect.width - gap;
                }
                if (left < margin) {
                    left = margin;
                }
                if (top + menuRect.height > viewportHeight - margin) {
                    top = Math.max(margin, viewportHeight - menuRect.height - margin);
                }
            }
        } else {
            if (entry.align === 'right' || (entry.align === 'auto' && left + menuRect.width > viewportWidth - margin)) {
                left = anchorRect.right - menuRect.width;
            }
            if (left + menuRect.width > viewportWidth - margin) {
                left = viewportWidth - menuRect.width - margin;
            }
            if (left < margin) {
                left = margin;
            }
            if (top + menuRect.height > viewportHeight - margin) {
                top = anchorRect.top - menuRect.height - gap;
                if (top < margin) {
                    top = Math.max(margin, viewportHeight - menuRect.height - margin);
                }
            }
        }

        left = clamp(left, margin, Math.max(margin, viewportWidth - menuRect.width - margin));
        top = clamp(top, margin, Math.max(margin, viewportHeight - menuRect.height - margin));

        entry.menu.style.left = `${Math.round(left)}px`;
        entry.menu.style.top = `${Math.round(top)}px`;

        if (compact) {
            entry.menu.style.minWidth = entry.type === 'submenu' ? '180px' : '220px';
            entry.menu.style.maxWidth = `${Math.max(180, viewportWidth - 16)}px`;
        }
    }

    restoreMenu(entry) {
        if (!entry.menuPortalParent) return;

        const parent = entry.menuPortalParent;
        const nextSibling = entry.menuPortalNextSibling;
        if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(entry.menu, nextSibling);
        } else {
            parent.appendChild(entry.menu);
        }
    }

    handleDocumentClick(event) {
        const target = event.target;
        const openEntries = Array.from(this.openEntryIds)
            .map((id) => this.entriesById.get(id))
            .filter(Boolean);

        const clickedInside = openEntries.some((entry) => {
            return entry.container.contains(target) || entry.menu.contains(target) || entry.toggle.contains(target) || (entry.trigger && entry.trigger.contains(target));
        });

        if (!clickedInside) {
            this.closeAll();
        }
    }

    handleViewportChange() {
        Array.from(this.openEntryIds).forEach((id) => {
            const entry = this.entriesById.get(id);
            if (entry) this.position(entry);
        });
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.closeAll();
        }
    }

    scheduleCloseTimer(entry) {
        this.cancelCloseTimer(entry);
        entry.closeTimer = window.setTimeout(() => {
            entry.closeTimer = null;
            this.close(entry.id);
        }, 120);
    }

    cancelCloseTimer(entry) {
        if (entry && entry.closeTimer) {
            window.clearTimeout(entry.closeTimer);
            entry.closeTimer = null;
        }
        if (entry && entry.parentId) {
            const parent = this.entriesById.get(entry.parentId);
            if (parent && parent.closeTimer) {
                window.clearTimeout(parent.closeTimer);
                parent.closeTimer = null;
            }
        }
    }

    ensureGlobalListeners() {
        if (this.documentListenersAttached) return;
        document.addEventListener('click', this.boundDocumentClick, this.documentClickCapture);
        window.addEventListener('resize', this.boundWindowResize, { passive: true });
        window.addEventListener('scroll', this.boundWindowScroll, this.windowScrollCapture);
        document.addEventListener('keydown', this.boundKeyDown, true);
        this.documentListenersAttached = true;
    }

    cleanupGlobalListeners() {
        if (this.openEntryIds.size > 0 || !this.documentListenersAttached) return;
        document.removeEventListener('click', this.boundDocumentClick, this.documentClickCapture);
        window.removeEventListener('resize', this.boundWindowResize);
        window.removeEventListener('scroll', this.boundWindowScroll, this.windowScrollCapture);
        document.removeEventListener('keydown', this.boundKeyDown, true);
        this.documentListenersAttached = false;
    }
}

function createResponsiveDropdownController(options = {}) {
    return new ResponsiveDropdownController(options);
}

module.exports = {
    createResponsiveDropdownController
};

},{}],22:[function(require,module,exports){
// settingsDialog.js - Dialog component for settings (reusable, mirrors ?caidat page)
const DialogManager = require('./dialogManager');
const SettingsService = require('../services/settingsService');
const { showToast } = require('../utils/uiUtils');
const { mountUserInfoSettingsTab } = require('./userInfoSettingsTab');

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
        { id: 'user-info',     icon: 'fa-hospital-user', label: 'Thông tin người dùng' },
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

        <!-- User info tab -->
        <div id="dr-sd-tab-user-info" class="dr-sd-tab-panel" style="display:${initialTab==='user-info'?'block':'none'}">
            <div id="dr-sd-user-info-container"></div>
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
            if (tabId === 'user-info') {
                ensureUserInfoMounted();
            }
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
    let _userInfoMounted = false;
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

    async function ensureUserInfoMounted() {
        if (_userInfoMounted) return;
        const mountEl = content.querySelector('#dr-sd-user-info-container');
        if (!mountEl) return;
        _userInfoMounted = true;
        await mountUserInfoSettingsTab({
            container: mountEl,
            getSettings: () => _settings,
            setSettings: (next) => { _settings = next; },
            scheduleAutoSave
        });
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
        if (initialTab === 'user-info') await ensureUserInfoMounted();

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

},{"../services/settingsService":43,"../utils/uiUtils":62,"./autoLoginToggle":7,"./cardTooltip":8,"./dialogManager":12,"./displaySettings":13,"./userInfoSettingsTab":25}],23:[function(require,module,exports){
// sidebarSession.js - Manage per-sidebar session context and AbortController

let _current = {
    id: 0,
    mabn: null,
    controller: null
};

const SidebarSession = {
    startSession(mabn) {
        // End previous session
        try { if (_current.controller) _current.controller.abort(); } catch(_) {}
        _current.id = Date.now();
        _current.mabn = mabn || null;
        _current.controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        return _current.id;
    },
    endSession() {
        try { if (_current.controller) _current.controller.abort(); } catch(_) {}
        _current.controller = null;
        _current.mabn = null;
        _current.id = 0;
    },
    getSignal() {
        return _current.controller ? _current.controller.signal : undefined;
    },
    isActive(sessionId) {
        return !!sessionId && sessionId === _current.id;
    },
    getCurrent() { return { ..._current }; }
};

module.exports = SidebarSession;

},{}],24:[function(require,module,exports){
// components/trackingUI.js

const ApiService = require('../services/apiService');
const TrackedPatientService = require('../services/trackedPatientService');
const Utils = require('../utils');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const DialogManager = require('./dialogManager');
const cardTooltip = require('./cardTooltip');

function safeCalculateAge(dateString) {
    if (!dateString) return '';
    try {
        if (typeof Utils.calculateAge !== 'function') return '';
        const age = Utils.calculateAge(dateString);
        return age === null || age === undefined || Number.isNaN(age) ? '' : age;
    } catch (error) {
        console.warn('TrackingUI: calculateAge failed', error);
        return '';
    }
}

function setupTrackingUI(topBar, mainContainer, createPatientCard, onRender) {
    const btn = topBar.querySelector('#dr-tracking-btn');
    const badge = topBar.querySelector('#dr-tracking-badge');
    if (!btn || !badge) return;

    function notifyRender() {
        if (typeof onRender !== 'function') return;
        requestAnimationFrame(() => {
            try {
                onRender();
            } catch (e) {
                console.warn('Tracking filter callback failed', e);
            }
        });
    }

    // Build the outer tracking container
    const trackingContainer = document.createElement('div');
    trackingContainer.id = 'dr-tracking-container';
    trackingContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        width: 400px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px;
        display: none;
        flex-direction: column;
        z-index: 2000;
        max-height: 70vh;
        overflow-y: auto;
        margin-top: 8px;
        min-height: 200px;
    `;

    // 1. State Persistence
    let isTrackingOpen = localStorage.getItem('dr_tracking_is_open') === 'true';
    if (isTrackingOpen) {
        trackingContainer.style.display = 'flex';
        trackingContainer.classList.add('dr-tracking-open');
        // Need to wait for DOM insertion and layout init
        requestAnimationFrame(() => updateLayoutStyle());
    }

    btn.parentElement.appendChild(trackingContainer);

    let isSidebarMode = localStorage.getItem('dr_tracking_sidebar') === 'true';

    function updateLayoutStyle() {
        if (isSidebarMode) {
            trackingContainer.style.position = 'fixed';
            trackingContainer.style.top = '65px';
            trackingContainer.style.left = '0';
            trackingContainer.style.height = 'calc(100vh - 120px)';
            trackingContainer.style.maxHeight = 'none';
            trackingContainer.style.width = '25vw';
            trackingContainer.style.minWidth = '300px';
            trackingContainer.style.maxWidth = '400px';
            trackingContainer.style.borderRadius = '0';
            trackingContainer.style.border = 'none';
            trackingContainer.style.borderRight = '1px solid #ddd';
            trackingContainer.style.margin = '0';
            trackingContainer.style.boxShadow = '2px 0 8px rgba(0,0,0,0.05)';

            const sidebarWidth = 'clamp(300px, 25vw, 400px)';
            requestAnimationFrame(() => {
                mainContainer.style.marginLeft = sidebarWidth;
                mainContainer.style.width = `calc(100% - ${sidebarWidth})`;
            });
            mainContainer.style.transition = 'margin-left 0.2s ease, width 0.2s ease';
        } else {
            trackingContainer.style.position = 'absolute';
            trackingContainer.style.top = '100%';
            trackingContainer.style.left = '0';
            trackingContainer.style.height = 'auto';
            trackingContainer.style.maxHeight = '70vh';
            trackingContainer.style.width = '400px';
            trackingContainer.style.borderRadius = '8px';
            trackingContainer.style.border = '1px solid #ddd';
            trackingContainer.style.margin = '8px 0 0 0';
            trackingContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

            mainContainer.style.marginLeft = '0';
            mainContainer.style.width = '100%';
        }
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = trackingContainer.style.display === 'flex';
        trackingContainer.style.display = isVisible ? 'none' : 'flex';
        
        if (trackingContainer.style.display === 'flex') {
            trackingContainer.classList.add('dr-tracking-open');
        } else {
            trackingContainer.classList.remove('dr-tracking-open');
        }

        // 1. State Persistence
        localStorage.setItem('dr_tracking_is_open', trackingContainer.style.display === 'flex');

        if (!isVisible) {
            updateLayoutStyle();
        } else {
            if (isSidebarMode) mainContainer.style.marginLeft = '0';
        }
    });

    document.addEventListener('click', (e) => {
        if (!isSidebarMode && trackingContainer.style.display === 'flex' && !btn.parentElement.contains(e.target) && !trackingContainer.contains(e.target)) {
            trackingContainer.style.display = 'none';
            trackingContainer.classList.remove('dr-tracking-open');
            localStorage.setItem('dr_tracking_is_open', false);
        }
    });

    // States
    let trackedState = { pids: [], cache: {} };
    let trackedObj = null;
    let activePatients = [];
    let dummyPatients = [];

    async function loadDataAndRender() {
        trackingContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">⏳ Đang tải dữ liệu bệnh nhân theo dõi...</div>';

        try {
            const deptId = getSelectedKhoa('551');
            const res = await TrackedPatientService.getOrCreateTrackedPatients(deptId);
            trackedObj = res.checklistObj;
            let loadedPids = res.pids || [];
            trackedState.cache = res.cache || {};

            // 5. Auto deduplicate from current dept active list
            if (Array.isArray(window.dr_data)) {
                const currentDeptPids = window.dr_data.map(p => p.mabn);
                const originalLength = loadedPids.length;
                loadedPids = loadedPids.filter(pid => !currentDeptPids.includes(pid));
                
                if (loadedPids.length !== originalLength) {
                     // Save immediately back to API
                     trackedState.pids = loadedPids;
                     await TrackedPatientService.updateTrackedState(trackedObj, trackedState);
                }
            }
            trackedState.pids = loadedPids;
            badge.textContent = trackedState.pids.length;

            if (trackedState.pids.length === 0) {
                activePatients = [];
                dummyPatients = [];
                renderUI();
                return;
            }

            const promises = trackedState.pids.map(async pid => {
                try {
                    const resStr = await ApiService.fetchPatientByPID(pid);
                    const r = typeof resStr === 'string' ? JSON.parse(resStr) : resStr;
                    if (r && r.data && r.data.length > 0) {
                        const pt = r.data[0];
                        pt.theodoi = true;
                        return pt;
                    }
                    return { mabn: pid, error: true, _rawPid: true };
                } catch (e) {
                    return { mabn: pid, error: true, _rawPid: true };
                }
            });

            const fetched = await Promise.all(promises);
            let valid = fetched.filter(p => !p._rawPid);

            // Enrich the data
            let cacheUpdated = false;
            if (valid.length > 0) {
                const PatientService = require('../services/patientService');
                activePatients = await PatientService.enrichPatientDataWithChecklist(valid);
                
                // 4. Update cache with fresh active patient data
                activePatients.forEach(pt => {
                    const basicInfo = {
                        hoten: pt.hoten || '',
                        mabn: pt.mabn || '',
                        chandoanvk: pt.chandoanvk || '',
                        teN_PHONG: pt.teN_PHONG || pt.teN_GIUONG || '',
                        phai: pt.phai,
                        ngaysinh: pt.ngaysinh,
                        // Get surgery name directly if available
                        pppt: (pt.checklistState && Array.isArray(pt.checklistState.phauThuatList) && pt.checklistState.phauThuatList.length > 0) ? pt.checklistState.phauThuatList[0].pppt : ''
                    };
                    trackedState.cache[pt.mabn] = basicInfo;
                    cacheUpdated = true;
                });
            } else {
                activePatients = [];
            }

            // Save cache to server quietly if updated
            if (cacheUpdated) {
                TrackedPatientService.updateTrackedState(trackedObj, trackedState);
            }

            dummyPatients = fetched.filter(p => p._rawPid);

            renderUI();
        } catch (e) {
            trackingContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#d32f2f;">Lỗi khi tải dữ liệu.</div>';
            console.error(e);
        }
    }

    function renderUI() {
        const isEmpty = activePatients.length === 0;
        if (isEmpty) {
            trackingContainer.classList.add('dr-tracking-empty');
            // If empty, force back to popup mode if currently in sidebar
            if (isSidebarMode) {
                isSidebarMode = false;
                localStorage.setItem('dr_tracking_sidebar', false);
                updateLayoutStyle();
            }
        } else {
            trackingContainer.classList.remove('dr-tracking-empty');
        }

        trackingContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px; flex-shrink:0;">
                <h4 style="margin:0; color:#1976d2; font-size:15px;"><i class="fas fa-user-clock"></i> Bệnh nhân đang theo dõi</h4>
                <div style="display:flex; gap:8px; align-items:center;">
                    <div style="position:relative;" id="dr-tracking-copy-wrapper">
                        <button id="dr-tracking-copy-btn" title="Click để copy ngay DS Hiện tại / Rê chuột để thêm lựa chọn" style="background:none; border:none; cursor:pointer; color:#666; font-size:14px;">
                            <i class="fas fa-copy"></i>
                        </button>
                        <div id="dr-tracking-copy-menu" style="display:none; position:absolute; right:0; top:100%; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.15); border-radius:4px; border:1px solid #eee; z-index:100; min-width:200px; padding:4px 0;">
                            <div class="dr-tracking-copy-item" data-type="active" style="padding:8px 12px; cursor:pointer; font-size:13px; color:#333; border-bottom:1px solid #f5f5f5;">
                                <i class="fas fa-users" style="width:16px; color:#1976d2; text-align:center; margin-right:4px;"></i> Copy DS Hiện tại
                            </div>
                            <div class="dr-tracking-copy-item" data-type="dummy" style="padding:8px 12px; cursor:pointer; font-size:13px; color:#333;">
                                <i class="fas fa-user-times" style="width:16px; color:#d32f2f; text-align:center; margin-right:4px;"></i> Copy DS Đã XV
                            </div>
                        </div>
                    </div>
                    <button id="dr-tracking-toggle-mode" title="Chuyển đổi Dropdown / Sidebar" style="background:none; border:none; cursor:pointer; color:#666; font-size:14px;">
                        <i class="fas ${isSidebarMode ? 'fa-window-restore' : 'fa-columns'}"></i>
                    </button>
                </div>
            </div>
            
            <div style="display:flex; gap:8px; margin-bottom:12px; flex-shrink:0;">
                <input type="text" id="dr-tracking-input" placeholder="Nhập PID (mabn)..." 
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                    style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:4px; font-size:13px;">
                <button id="dr-tracking-add" style="padding:6px 12px; background:#1976d2; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold;">Thêm</button>
            </div>
            
            <div id="dr-tracking-scroll-area" style="overflow-y:auto; overflow-x:hidden; flex:1;">
                <div id="dr-tracking-active-list" style="margin-bottom:16px; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; width:100%; box-sizing:border-box;"></div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-top:8px; border-top:1px dashed #eee;">
                    <div style="font-size:12px; color:#666; font-weight:bold;">Không có dữ liệu (đã Xuất viện):</div>
                    <button id="dr-tracking-bulk-remove" style="background:none; border:none; cursor:pointer; color:#d32f2f; font-size:12px;" title="Xóa toàn bộ mã lỗi rỗng">
                        <i class="fas fa-trash-alt"></i> Xóa rỗng
                    </button>
                </div>
                <div id="dr-tracking-dummy-list"></div>
            </div>
        `;

        trackingContainer.querySelector('#dr-tracking-toggle-mode').addEventListener('click', () => {
            if (activePatients.length === 0 && !isSidebarMode) {
                DialogManager.showToast('Danh sách trống, chỉ có thể hiển thị dạng popup!', { background: '#ff9800' });
                return;
            }
            isSidebarMode = !isSidebarMode;
            localStorage.setItem('dr_tracking_sidebar', isSidebarMode);
            updateLayoutStyle();
            renderUI();
        });

        // Copy menu logic
        const copyWrapper = trackingContainer.querySelector('#dr-tracking-copy-wrapper');
        const copyBtn = trackingContainer.querySelector('#dr-tracking-copy-btn');
        const copyMenu = trackingContainer.querySelector('#dr-tracking-copy-menu');

        copyWrapper.onmouseenter = () => { copyMenu.style.display = 'block'; };
        copyWrapper.onmouseleave = () => { copyMenu.style.display = 'none'; };

        copyBtn.onclick = (e) => {
            e.stopPropagation();
            copyMenu.style.display = 'none';
            // Trigger first item (active) click
            const activeItem = copyMenu.querySelector('.dr-tracking-copy-item[data-type="active"]');
            if (activeItem) activeItem.click();
        };

        trackingContainer.querySelectorAll('.dr-tracking-copy-item').forEach(item => {
            item.addEventListener('mouseenter', function() { this.style.backgroundColor = '#f0f9ff'; });
            item.addEventListener('mouseleave', function() { this.style.backgroundColor = 'transparent'; });
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                trackingContainer.querySelector('#dr-tracking-copy-menu').style.display = 'none';
                const type = e.currentTarget.dataset.type;

                if (type === 'active') {
                    if (activePatients.length === 0) return DialogManager.showToast('Không có bệnh nhân hiện tại!', { background: '#ff9800' });
                    try {
                        const ReportService = require('../services/reportService');
                        const targetStates = activePatients.map(p => p.checklistState || {});
                        let resultHtml = ReportService.generateHTMLReport(activePatients, targetStates);
                        let resultText = ReportService.generateTextReport(activePatients, targetStates);

                        // Red color for tracking header
                        resultHtml = resultHtml.replace(/#1976d2/g, '#8b0000').replace(/Khoa /g, 'Theo dõi ');

                        const dashboardSupport = require('../pages/page.dashboard.support');
                        if (typeof dashboardSupport.copyReportToClipboardRich === 'function') {
                            await dashboardSupport.copyReportToClipboardRich(resultHtml, resultText);
                            DialogManager.showToast('Đã copy danh sách hiện tại!', { background: '#b91c1c' });
                        } else {
                            DialogManager.showToast('Không tìm thấy tính năng copy', { background: '#d32f2f' });
                        }
                    } catch (err) {
                        console.error(err);
                        DialogManager.showToast('Lỗi khi copy danh sách!', { background: '#d32f2f' });
                    }
                } else if (type === 'dummy') {
                    if (dummyPatients.length === 0) return DialogManager.showToast('Không có bệnh nhân đã xuất viện!', { background: '#ff9800' });
                    let html = '<table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">';
                    html += '<tr style="background:#f2f2f2;"><th>STT</th><th>Mã BN</th><th>Họ tên</th><th>Giới tính</th><th>Tuổi</th><th>Chẩn đoán</th></tr>';
                    
                    dummyPatients.forEach((d, index) => {
                        const cacheInfo = trackedState.cache[d.mabn] || {};
                        const name = cacheInfo.hoten || '';
                        const gender = cacheInfo.phai === 1 ? 'Nữ' : (cacheInfo.phai === 0 ? 'Nam' : '');
                        const ageStr = safeCalculateAge(cacheInfo.ngaysinh);
                        const diag = cacheInfo.chandoanvk || '';
                        
                        html += `<tr>
                            <td style="text-align:center;">${index + 1}</td>
                            <td style="text-align:center;">${d.mabn}</td>
                            <td>${name}</td>
                            <td style="text-align:center;">${gender}</td>
                            <td style="text-align:center;">${ageStr}</td>
                            <td>${diag}</td>
                        </tr>`;
                    });
                    html += '</table>';
                    
                    try {
                        const blobHtml = new Blob([html], { type: 'text/html' });
                        const blobText = new Blob(['Danh sách bệnh nhân đã xuất viện theo dõi'], { type: 'text/plain' });
                        const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];
                        await navigator.clipboard.write(data);
                        DialogManager.showToast('Đã copy danh sách bệnh nhân xuất viện!', { background: '#b91c1c' });
                    } catch (err) {
                        console.error('Copy failed', err);
                        DialogManager.showToast('Lỗi khi sao chép!', { background: '#d32f2f' });
                    }
                }
            });
        });

        const activeListEl = trackingContainer.querySelector('#dr-tracking-active-list');
        const dummyListEl = trackingContainer.querySelector('#dr-tracking-dummy-list');

        if (activePatients.length === 0) {
            activeListEl.innerHTML = '<div style="color:#999; font-size:12px; font-style:italic; padding:10px;">Không có BN active</div>';
        } else {
            activePatients.forEach(pt => {
                // Wrapper to handle layout and removal within sidebar
                const wrap = document.createElement('div');
                wrap.className = 'dr-tracking-card-wrap';
                wrap.style.cssText = 'position:relative; width:100%; min-width:0; box-sizing:border-box;';

                // create normal dr-card
                let card;
                if (typeof createPatientCard === 'function') {
                    card = createPatientCard(pt);
                    // Override card styles slightly to fit container
                    card.classList.remove('dr-blue'); // remove interfering class
                    card.classList.remove('dr-yellow');
                    card.style.cssText += 'background-color: #fff0f0 !important; background-image: none !important;';
                    card.style.minWidth = '0';
                    card.style.flex = 'none';
                    card.style.width = '100%';
                    card.style.margin = '0 auto';
                    card.classList.add('dr-tracking-card');
                } else {
                    card = document.createElement('div');
                    card.textContent = pt.hoten + ' (' + pt.mabn + ')';
                }

                wrap.appendChild(card);

                // Add a remove button directly to this wrapper
                const rmBtn = document.createElement('button');
                rmBtn.innerHTML = '<i class="fas fa-times"></i>';
                rmBtn.title = 'Ngừng theo dõi';
                rmBtn.style.cssText = 'position:absolute; top:4px; right:4px; background:#d32f2f; color:#fff; border:none; width:22px; height:22px; border-radius:50%; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:10; opacity:0.8;';

                rmBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await removePatient(pt.mabn);
                };

                wrap.appendChild(rmBtn);
                
                // Use global cardTooltip
                cardTooltip.attach(wrap, card);

                activeListEl.appendChild(wrap);
            });
        }

        if (dummyPatients.length === 0) {
            dummyListEl.innerHTML = '<div style="color:#999; font-size:12px; font-style:italic;">Trống</div>';
        } else {
            dummyPatients.forEach(d => {
                const div = document.createElement('div');
                div.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#f9fafb; border:1px solid #f1f5f9; border-radius:6px; margin-bottom:8px; box-shadow:0 1px 2px rgba(0,0,0,0.05);`;
                
                let infoHtml = '';
                const cacheInfo = trackedState.cache[d.mabn];
                // 4. Caching Discharged Patients Data
                if (cacheInfo && cacheInfo.hoten) {
                    const gender = cacheInfo.phai === 1 ? 'Nữ' : 'Nam';
                    const ageVal = safeCalculateAge(cacheInfo.ngaysinh);
                    const ageStr = ageVal !== '' ? `(${ageVal} tuổi)` : '';
                    infoHtml = `
                        <div style="flex:1; min-width:0; padding-right:8px;">
                            <div style="font-size:13px; font-weight:700; color:#334155;">${cacheInfo.hoten}</div>
                            <div style="font-size:11px; color:#64748b; margin-top:2px;">
                                <span style="color:#1976d2; font-weight:600;">${d.mabn}</span> &bull; ${gender} ${ageStr}
                            </div>
                            <div style="font-size:11px; color:#64748b; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${cacheInfo.chandoanvk}">
                                ${cacheInfo.chandoanvk ? 'CĐ: ' + cacheInfo.chandoanvk : ''}
                            </div>
                        </div>
                    `;
                } else {
                    infoHtml = `<div style="flex:1; min-width:0; color:#94a3b8; font-size:13px; font-weight:600;">PID: ${d.mabn}</div>`;
                }

                div.innerHTML = `
                    ${infoHtml}
                    <button class="dr-tracking-remove" style="background:none; border:none; color:#d32f2f; cursor:pointer; padding:4px;" title="Xóa khỏi theo dõi"><i class="fas fa-times"></i></button>
                `;
                div.querySelector('.dr-tracking-remove').onclick = async () => {
                    await removePatient(d.mabn);
                };
                dummyListEl.appendChild(div);
            });
        }

        // 3. Bulk Remove Empties Handler
        trackingContainer.querySelector('#dr-tracking-bulk-remove').addEventListener('click', async () => {
            if (dummyPatients.length === 0) {
                DialogManager.showToast('Không có mã rỗng nào để xóa!', { background: '#ff9800' });
                return;
            }
            if (!confirm(`Xóa toàn bộ ${dummyPatients.length} bệnh nhân rỗng/đã xuất viện khỏi danh sách?`)) return;
            
            const dummyPids = dummyPatients.map(p => p.mabn);
            trackedState.pids = trackedState.pids.filter(p => !dummyPids.includes(p));
            // optional: clean up cache
            dummyPids.forEach(pid => delete trackedState.cache[pid]);
            
            badge.textContent = trackedState.pids.length;
            dummyPatients = [];
            renderUI();

            const success = await TrackedPatientService.updateTrackedState(trackedObj, trackedState);
            if (!success) {
                DialogManager.showToast('Có lỗi khi xóa hàng loạt!', { background: '#d32f2f' });
                loadDataAndRender(); // full revert
            }
        });

        // 2. Bulk Add handler
        trackingContainer.querySelector('#dr-tracking-add').addEventListener('click', async () => {
            const input = trackingContainer.querySelector('#dr-tracking-input');
            const rawVal = input.value.trim();
            if (!rawVal) return;
            
            input.disabled = true;
            const btnAdd = trackingContainer.querySelector('#dr-tracking-add');
            btnAdd.textContent = '...';

            // Split by comma, space or newline and filter empties
            const pidsToAdd = rawVal.split(/[\s,]+/).filter(Boolean);
            const newValidPids = [];
            const duplicatePids = [];

            const currentDeptPids = window.dr_data ? window.dr_data.map(p => p.mabn) : [];

            pidsToAdd.forEach(pid => {
                if (trackedState.pids.includes(pid)) {
                    duplicatePids.push(pid);
                } else if (currentDeptPids.includes(pid)) {
                    const deptPt = window.dr_data.find(p => p.mabn === pid);
                    const name = deptPt ? deptPt.hoten : pid;
                    DialogManager.showToast(`Bệnh nhân ${name} đã có ở Khoa!`, { background: '#d32f2f' });
                } else {
                    newValidPids.push(pid);
                }
            });

            if (newValidPids.length === 0) {
                if (duplicatePids.length > 0) {
                     DialogManager.showToast('Các PID này đã có trong danh sách theo dõi hoặc Khoa!', { background: '#ff9800' });
                }
                input.disabled = false;
                btnAdd.textContent = 'Thêm';
                return;
            }

            const newState = { pids: [...trackedState.pids, ...newValidPids], cache: trackedState.cache };
            const success = await TrackedPatientService.updateTrackedState(trackedObj, newState);

            if (success) {
                trackedState.pids.push(...newValidPids);
                badge.textContent = trackedState.pids.length;
                input.value = '';
                
                // Fetch dynamically for the new PIDs
                const fetchPromises = newValidPids.map(async pid => {
                    try {
                        const resStr = await ApiService.fetchPatientByPID(pid);
                        const r = typeof resStr === 'string' ? JSON.parse(resStr) : resStr;
                        if (r && r.data && r.data.length > 0) {
                            const pt = r.data[0];
                            pt.theodoi = true;
                            return pt;
                        } else {
                            return { mabn: pid, error: true, _rawPid: true };
                        }
                    } catch (err) {
                        return { mabn: pid, error: true, _rawPid: true };
                    }
                });

                const fetchedNew = await Promise.all(fetchPromises);
                const validNew = fetchedNew.filter(p => !p._rawPid);
                
                if (validNew.length > 0) {
                    const PatientService = require('../services/patientService');
                    const enrichedNew = await PatientService.enrichPatientDataWithChecklist(validNew);
                    
                    enrichedNew.forEach(pt => {
                        const basicInfo = {
                            hoten: pt.hoten || '',
                            mabn: pt.mabn || '',
                            chandoanvk: pt.chandoanvk || '',
                            teN_PHONG: pt.teN_PHONG || pt.teN_GIUONG || '',
                            phai: pt.phai,
                            ngaysinh: pt.ngaysinh,
                            pppt: (pt.checklistState && Array.isArray(pt.checklistState.phauThuatList) && pt.checklistState.phauThuatList.length > 0) ? pt.checklistState.phauThuatList[0].pppt : ''
                        };
                        trackedState.cache[pt.mabn] = basicInfo;
                        activePatients.push(pt);
                    });
                    
                    // Fire-and-forget back to save cache
                    TrackedPatientService.updateTrackedState(trackedObj, trackedState);
                }
                
                const dummyNew = fetchedNew.filter(p => p._rawPid);
                dummyPatients.push(...dummyNew);

                if (duplicatePids.length > 0) {
                    alert('Đã thêm thành công, bỏ qua các PIDs trùng: ' + duplicatePids.join(', '));
                }
                renderUI();
            } else {
                alert('Có lỗi khi lưu bệnh nhân theo dõi!');
            }
            input.disabled = false;
            btnAdd.textContent = 'Thêm';
        });

        notifyRender();
    }

    async function removePatient(pid) {
        if (!confirm(`Xóa PID ${pid} khỏi danh sách theo dõi?`)) return;

        // Optimistic UI update
        const oldPids = [...trackedState.pids];
        trackedState.pids = trackedState.pids.filter(p => p !== pid);
        badge.textContent = trackedState.pids.length;

        activePatients = activePatients.filter(p => p.mabn !== pid);
        dummyPatients = dummyPatients.filter(p => p.mabn !== pid);
        // optional: delete cache too to save space
        delete trackedState.cache[pid];
        
        renderUI();

        const success = await TrackedPatientService.updateTrackedState(trackedObj, trackedState);
        if (!success) {
            alert('Có lỗi khi xóa bệnh nhân!');
            // revert
            trackedState.pids = oldPids;
            badge.textContent = trackedState.pids.length;
            loadDataAndRender(); // full reload to be safe
        }
    }

    // Expose globally for context menu
    window.dr_removeTrackedPatient = removePatient;

    // Initialize network fetch in background
    loadDataAndRender();
}

module.exports = { setupTrackingUI };

},{"../pages/page.dashboard.support":31,"../services/apiService":36,"../services/patientService":40,"../services/reportService":41,"../services/trackedPatientService":45,"../utils":47,"../utils/khoaUtils":56,"./cardTooltip":8,"./dialogManager":12}],25:[function(require,module,exports){
const ApiService = require('../services/apiService');

function ensureMarkup(container) {
    if (!container) return;
    if (container.dataset.userInfoMounted === '1') return;

    container.innerHTML = `
        <h3 style="margin:0 0 4px;font-size:1em;color:#111827;">Thông tin người dùng</h3>
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Cấu hình khoa làm việc và danh sách khoa/phòng được phép truy cập. Dữ liệu lưu cloud theo bác sĩ đang đăng nhập.</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
            <button id="dr-ui-refresh-dept" style="appearance:none;border:1px solid #cbd5e1;background:#fff;padding:7px 12px;border-radius:8px;cursor:pointer;color:#334155;font-size:13px;">Tải lại danh sách khoa/phòng</button>
            <span id="dr-ui-dept-status" style="font-size:12px;color:#64748b;"></span>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:12px;background:#fafafa;">
            <div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:6px;">Khoa làm việc của bạn</div>
            <select id="dr-ui-working-khoa" style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;background:#fff;">
                <option value="">-- Chọn khoa/phòng --</option>
            </select>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fff;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <div style="font-size:13px;font-weight:600;color:#1f2937;">Khoa/phòng muốn truy cập</div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="dr-ui-select-all" style="appearance:none;border:1px solid #d1d5db;background:#fff;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:12px;color:#334155;">Chọn tất cả</button>
                    <button id="dr-ui-clear-all" style="appearance:none;border:1px solid #fecaca;background:#fff1f2;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:12px;color:#be123c;">Bỏ chọn tất cả</button>
                </div>
            </div>
            <div id="dr-ui-access-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;max-height:320px;overflow:auto;"></div>
        </div>
    `;

    container.dataset.userInfoMounted = '1';
}

function readAccessibleIds(userInfo) {
    const ids = Array.isArray(userInfo && userInfo.accessibleKhoaIds)
        ? userInfo.accessibleKhoaIds
        : (Array.isArray(userInfo && userInfo.accessibleKhoa)
            ? userInfo.accessibleKhoa.map((it) => it && it.id)
            : []);

    return new Set(
        ids
            .map((id) => String(id || '').trim())
            .filter(Boolean)
    );
}

function toList(items) {
    return Array.isArray(items) ? items : [];
}

async function withTimeout(promise, ms, message) {
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message || 'Timeout')), ms);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

async function mountUserInfoSettingsTab(opts) {
    const {
        container,
        getSettings,
        setSettings,
        scheduleAutoSave
    } = opts || {};

    if (!container || typeof getSettings !== 'function' || typeof setSettings !== 'function') {
        return null;
    }

    ensureMarkup(container);

    const workingSelect = container.querySelector('#dr-ui-working-khoa');
    const accessList = container.querySelector('#dr-ui-access-list');
    const statusEl = container.querySelector('#dr-ui-dept-status');
    const refreshBtn = container.querySelector('#dr-ui-refresh-dept');
    const selectAllBtn = container.querySelector('#dr-ui-select-all');
    const clearAllBtn = container.querySelector('#dr-ui-clear-all');

    let allKhoa = [];
    let activeKhoa = [];
    let workingKhoaId = '';
    let accessibleKhoaIds = new Set();

    function ensureWorkingAlwaysAccessible() {
        if (!workingKhoaId) return;
        accessibleKhoaIds.add(String(workingKhoaId));
    }

    function emitRealtimeUserInfo(nextSettings) {
        try {
            const userInfo = (nextSettings && nextSettings.userInfo) || {};
            const detail = {
                userInfo,
                ts: Date.now()
            };
            window.dispatchEvent(new CustomEvent('dr-user-info-updated', { detail }));
            localStorage.setItem('dr_user_info_sync', JSON.stringify(detail));
        } catch (_) {}
    }

    function pullStateFromSettings() {
        const settings = getSettings() || {};
        const userInfo = settings.userInfo || {};
        workingKhoaId = String(userInfo.workingKhoaId || userInfo.defaultKhoaId || '').trim();
        accessibleKhoaIds = readAccessibleIds(userInfo);
        ensureWorkingAlwaysAccessible();
    }

    function pushStateToSettings(shouldSave) {
        const settings = getSettings() || {};
        ensureWorkingAlwaysAccessible();
        const matchedWorking = toList(allKhoa).find((k) => String(k.id) === String(workingKhoaId));
        const activeLookup = new Map(toList(activeKhoa).map((k) => [String(k.id), k.name || '']));

        const next = {
            ...settings,
            userInfo: {
                ...(settings.userInfo || {}),
                workingKhoaId: String(workingKhoaId || ''),
                workingKhoaName: (matchedWorking && matchedWorking.name) || '',
                accessibleKhoaIds: Array.from(accessibleKhoaIds),
                accessibleKhoa: Array.from(accessibleKhoaIds).map((id) => ({
                    id,
                    name: activeLookup.get(id) || ''
                }))
            }
        };

        setSettings(next);
        if (shouldSave) emitRealtimeUserInfo(next);
        if (shouldSave && typeof scheduleAutoSave === 'function') scheduleAutoSave();
    }

    function renderWorkingKhoa() {
        if (!workingSelect) return;
        workingSelect.innerHTML = '<option value="">-- Chọn khoa/phòng --</option>';

        toList(allKhoa).forEach((k) => {
            const opt = document.createElement('option');
            opt.value = String(k.id || '');
            opt.textContent = `${k.name || 'Khoa'} (${k.id || ''})`;
            workingSelect.appendChild(opt);
        });

        if (!workingKhoaId && allKhoa.length) {
            let preferred = '';
            try {
                preferred = String(localStorage.getItem('bsnt_khoa_dashboard') || '').trim();
            } catch (_) {}
            const preferredExists = allKhoa.some((k) => String(k.id) === preferred);
            workingKhoaId = preferredExists ? preferred : String(allKhoa[0].id || '');
        }

        if (workingKhoaId) {
            workingSelect.value = workingKhoaId;
            if (workingSelect.value !== workingKhoaId && allKhoa.length) {
                workingKhoaId = String(allKhoa[0].id || '');
                workingSelect.value = workingKhoaId;
            }
        }

        ensureWorkingAlwaysAccessible();
    }

    function renderAccessibleKhoa() {
        if (!accessList) return;
        if (!toList(activeKhoa).length) {
            accessList.innerHTML = '<div style="font-size:12px;color:#6b7280;font-style:italic;">Chưa có khoa/phòng đang có bệnh nhân.</div>';
            return;
        }

        accessList.innerHTML = '';
        toList(activeKhoa).forEach((dept) => {
            const deptId = String(dept.id || '');
            const isWorking = deptId === String(workingKhoaId || '');
            const checked = isWorking || accessibleKhoaIds.has(deptId);
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:8px;padding:7px 9px;background:#fff;cursor:pointer;';
            label.innerHTML = `
                <input type="checkbox" class="dr-ui-access-item" value="${deptId}" ${checked ? 'checked' : ''} ${isWorking ? 'disabled' : ''} style="margin:0;">
                <span style="font-size:12px;color:#1f2937;line-height:1.35;">${dept.name || 'Khoa'} <span style="color:#64748b;">(${dept.id || ''})</span>${dept.patientCount ? ` <span style="color:#16a34a;">- ${dept.patientCount} BN</span>` : ''}${isWorking ? ' <span style="color:#2563eb;">- Khoa làm việc</span>' : ''}</span>
            `;
            accessList.appendChild(label);
        });
    }

    async function loadWorkingKhoaList() {
        const list = await ApiService.fetchKhoaPhong();
        allKhoa = toList(list).map((k) => ({
            id: String((k && k.id) || ''),
            name: String((k && k.name) || '')
        })).filter((k) => k.id);
        renderWorkingKhoa();
        ensureWorkingAlwaysAccessible();
    }

    async function loadActiveKhoaList() {
        const list = await withTimeout(
            ApiService.fetchActiveKhoaPhongFromSearch(),
            25000,
            'Tai danh sach khoa/phong qua lau'
        );
        activeKhoa = toList(list).map((k) => ({
            id: String((k && k.id) || ''),
            name: String((k && k.name) || ''),
            patientCount: Number((k && k.patientCount) || 0)
        })).filter((k) => k.id && k.name);

        if (workingKhoaId && !activeKhoa.some((k) => String(k.id) === String(workingKhoaId))) {
            const found = allKhoa.find((k) => String(k.id) === String(workingKhoaId));
            activeKhoa.unshift({
                id: String(workingKhoaId),
                name: (found && found.name) || `Khoa ${workingKhoaId}`,
                patientCount: 0
            });
        }

        renderAccessibleKhoa();
    }

    async function reloadAll() {
        if (statusEl) {
            statusEl.textContent = 'Đang tải danh sách khoa/phòng...';
            statusEl.style.color = '#2563eb';
        }

        try {
            pullStateFromSettings();
            await Promise.all([loadWorkingKhoaList(), loadActiveKhoaList()]);
            pushStateToSettings(false);
            if (statusEl) {
                statusEl.textContent = `Đã tải ${activeKhoa.length} khoa/phòng đang có bệnh nhân.`;
                statusEl.style.color = '#16a34a';
            }
        } catch (e) {
            console.warn('Load user info khoa settings failed', e);
            if (statusEl) {
                statusEl.textContent = 'Không tải được danh sách khoa/phòng.';
                statusEl.style.color = '#dc2626';
            }
        }
    }

    pullStateFromSettings();

    if (workingSelect && !workingSelect.dataset.bound) {
        workingSelect.dataset.bound = '1';
        workingSelect.addEventListener('change', () => {
            workingKhoaId = String(workingSelect.value || '');
            try {
                if (workingKhoaId) localStorage.setItem('bsnt_khoa_dashboard', workingKhoaId);
            } catch (_) {}
            pushStateToSettings(true);
        });
    }

    if (accessList && !accessList.dataset.bound) {
        accessList.dataset.bound = '1';
        accessList.addEventListener('change', (e) => {
            const input = e.target;
            if (!input || !input.classList || !input.classList.contains('dr-ui-access-item')) return;
            const deptId = String(input.value || '');
            if (!deptId) return;
            if (deptId === String(workingKhoaId || '')) {
                input.checked = true;
                return;
            }
            if (input.checked) accessibleKhoaIds.add(deptId);
            else accessibleKhoaIds.delete(deptId);
            ensureWorkingAlwaysAccessible();
            pushStateToSettings(true);
        });
    }

    if (selectAllBtn && !selectAllBtn.dataset.bound) {
        selectAllBtn.dataset.bound = '1';
        selectAllBtn.addEventListener('click', () => {
            accessibleKhoaIds = new Set(toList(activeKhoa).map((d) => String(d.id || '')).filter(Boolean));
            ensureWorkingAlwaysAccessible();
            renderAccessibleKhoa();
            pushStateToSettings(true);
        });
    }

    if (clearAllBtn && !clearAllBtn.dataset.bound) {
        clearAllBtn.dataset.bound = '1';
        clearAllBtn.addEventListener('click', () => {
            accessibleKhoaIds = new Set();
            ensureWorkingAlwaysAccessible();
            renderAccessibleKhoa();
            pushStateToSettings(true);
        });
    }

    if (refreshBtn && !refreshBtn.dataset.bound) {
        refreshBtn.dataset.bound = '1';
        refreshBtn.addEventListener('click', () => {
            reloadAll();
        });
    }

    await reloadAll();

    return {
        reload: reloadAll
    };
}

module.exports = { mountUserInfoSettingsTab };

},{"../services/apiService":36}],26:[function(require,module,exports){
// yLenhHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const { callGlobalFn } = require('../utils/globalFnUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');
const DateUtils = require('../utils/dateUtils');
const { getTodayISODate, formatDisplayDate, getDischargeDisplayText, isDischargeEntryOnDate } = require('../utils/dischargeUtils');

function setupYLenhHandlers(infoElement, patient) {
    const ctxId = (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id) || `${patient.mabn}:${Date.now()}`;
    const input = infoElement.querySelector('#dr-y-lenh-input');
    const addBtn = infoElement.querySelector('#dr-add-y-lenh');
    const logContainer = infoElement.querySelector('#dr-y-lenh-log');

    // Use configured quick y lệnh actions
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;
    const quickYLenhActionMap = new Map(quickYLenhActions.map(action => [action.label, action]));

    function getQuickActionStatusCount(actionText) {
        const config = quickYLenhActionMap.get(actionText);
        const statusCount = Number(config && config.status);
        return statusCount === 2 ? 2 : 3;
    }

    // Load existing y lệnh when checklist is loaded
    // Priority: patient.checklistState (always populated from card open) > window.checklistState
    function loadYLenhLog() {
        const log = (patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog))
            ? patient.checklistState.yLenhLog
            : (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                ? window.checklistState.yLenhLog
                : null;
        if (log) {
            renderYLenhLog(log);
            renderDischargeLog();
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
        <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;word-break: break-word; overflow-wrap: anywhere;">
                    <button class="remove-y-lenh-btn" data-index="${originalIndex}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                </div>
            `;
        }).join('');

        // Add event listeners for remove buttons
        setTimeout(() => {
            logContainer.querySelectorAll('.remove-y-lenh-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const index = parseInt(this.getAttribute('data-index'));
                    removeYLenh(index);
                });
            });
        }, 10);
    }

    function getHxtTextarea() {
        return infoElement.querySelector('#dr-hxt-textarea');
    }

    function getHxtDateLineMatch(line) {
        const trimmed = String(line || '').trim();
        const match = trimmed.match(/^(\d{2}\/\d{2}\/\d{4})\s*[:\-]\s*(.+)$/);
        if (!match) return null;
        return { dateKey: match[1], body: match[2].trim() };
    }

    function splitHxtLabels(body) {
        return String(body || '')
            .replace(/[.]+$/g, '')
            .split(/\s*,\s*/)
            .map(part => part.trim())
            .filter(Boolean);
    }

    function shouldSkipHxtLabel(label) {
        const normalized = String(label || '').trim().replace(/[.]+$/g, '').toLowerCase();
        return !normalized || normalized === 'đã đánh thuốc';
    }

    function parseDateTime(ts) {
        if (!ts) return 0;
        const match = ts.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (!match) return 0;
        const [_, d, m, y, h, min] = match;
        return new Date(`${y}-${m}-${d}T${h}:${min}:00`).getTime();
    }

    function buildHxtDailySummaryMap(yLenhArray) {
        const grouped = new Map();
        if (!Array.isArray(yLenhArray) || yLenhArray.length === 0) return grouped;

        const sortedArray = [...yLenhArray].sort((a, b) => {
            const timeA = parseDateTime(a.timestamp);
            const timeB = parseDateTime(b.timestamp);
            return timeA - timeB;
        });

        sortedArray.forEach((entry) => {
            if (!entry || !entry.timestamp) return;
            const dateKey = String(entry.timestamp).split(' ')[0];
            if (!dateKey) return;

            const label = String(entry.content || entry.action || '').trim();
            if (!label || label.toLowerCase() === 'xuất viện' || shouldSkipHxtLabel(label)) return;
            if (entry.noAddToHxt || entry['no-add-to-hxt'] || entry.no_add_to_hxt) return;

            if (!grouped.has(dateKey)) grouped.set(dateKey, []);
            const bucket = grouped.get(dateKey);
            if (!bucket.includes(label)) bucket.push(label);
        });

        return grouped;
    }

    function parseDateToTimestamp(dateStr) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`).getTime();
        }
        return 0;
    }

    function mergeHxtWithYLenh(existingText, yLenhArray) {
        const grouped = buildHxtDailySummaryMap(yLenhArray);

        const yLenhLabelsByDate = new Map();
        grouped.forEach((labels, date) => yLenhLabelsByDate.set(date, [...labels]));

        const lines = String(existingText || '').split(/\r?\n/);
        const parsedLines = [];

        let i = 0;
        while (i < lines.length) {
            let line = lines[i];
            const matched = getHxtDateLineMatch(line);
            if (matched) {
                let dateStr = matched.dateKey;
                let labelsForThisDate = splitHxtLabels(matched.body);

                let existingDateItem = parsedLines.find(item => item.type === 'date' && item.dateKey === dateStr);
                if (existingDateItem) {
                    labelsForThisDate.forEach(l => {
                        if (!existingDateItem.labels.includes(l)) existingDateItem.labels.push(l);
                    });
                } else {
                    parsedLines.push({ type: 'date', dateKey: dateStr, labels: Array.from(new Set(labelsForThisDate)) });
                }
            } else {
                parsedLines.push({ type: 'text', text: line });
            }
            i++;
        }

        yLenhLabelsByDate.forEach((yLabels, dateStr) => {
            let existingDateItem = parsedLines.find(item => item.type === 'date' && item.dateKey === dateStr);
            if (existingDateItem) {
                yLabels.forEach(l => {
                    const cleaned = String(l || '').trim().replace(/[.]+$/g, '');
                    if (!shouldSkipHxtLabel(cleaned) && !existingDateItem.labels.includes(cleaned)) existingDateItem.labels.push(cleaned);
                });
            } else {
                const cleanedLabels = yLabels.map(l => String(l || '').trim().replace(/[.]+$/g, '')).filter(l => !shouldSkipHxtLabel(l));
                parsedLines.push({ type: 'date', dateKey: dateStr, labels: cleanedLabels });
            }
        });

        let leadingText = [];
        let datesAndRest = parsedLines;

        if (parsedLines.length > 0 && parsedLines[0].type === 'text') {
            let j = 0;
            while (j < parsedLines.length && parsedLines[j].type === 'text') {
                leadingText.push(parsedLines[j].text);
                j++;
            }
            datesAndRest = parsedLines.slice(j);
        }

        const onlyDates = datesAndRest.filter(item => item.type === 'date');
        const otherTexts = datesAndRest.filter(item => item.type === 'text');

        onlyDates.sort((a, b) => parseDateToTimestamp(a.dateKey) - parseDateToTimestamp(b.dateKey));

        const nextLines = [...leadingText];

        onlyDates.forEach(item => {
            if (item.labels.length > 0) {
                nextLines.push(`${item.dateKey}: ${item.labels.join(', ')}.`);
            }
        });

        otherTexts.forEach(item => {
            nextLines.push(item.text);
        });

        while (nextLines.length > 0 && String(nextLines[0] || '').trim() === '') {
            nextLines.shift();
        }

        const compactedLines = [];
        nextLines.forEach((line) => {
            const text = String(line || '');
            if (text.trim() === '' && compactedLines.length > 0 && compactedLines[compactedLines.length - 1].trim() === '') {
                return;
            }
            compactedLines.push(text);
        });

        return compactedLines.join('\n').trimEnd();
    }

    function syncHxtFromYLenhLog() {
        const hxtTextarea = getHxtTextarea();
        if (!hxtTextarea) return;

        const yLenhArray = (patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog))
            ? patient.checklistState.yLenhLog
            : (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                ? window.checklistState.yLenhLog
                : [];

        const nextValue = mergeHxtWithYLenh(hxtTextarea.value, yLenhArray);

        if (nextValue !== hxtTextarea.value) {
            hxtTextarea.value = nextValue;
            hxtTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function getDischargeLogContainer() {
        return infoElement.querySelector('#dr-xv-log');
    }

    function getCurrentDischargeEntry() {
        return findTodayQuickEntryByAction('Xuất viện');
    }

    function ensureCurrentDischargeDefaults(entry) {
        if (!entry) return;
        if (!entry.expectedDischargeDate) entry.expectedDischargeDate = getTodayISODate();
        if (!entry.dischargeTime) entry.dischargeTime = '12:00';
    }

    function persistDischargeSchedule() {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        saveYLenhLog();
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        callGlobalFn('updatePatientCardTags', patient.mabn);
        renderDischargeLog();
    }

    function applyDischargePreset(presetDate, presetTime) {
        const { entry } = getCurrentDischargeEntry();
        if (!entry) return;

        ensureCurrentDischargeDefaults(entry);
        if (presetDate) entry.expectedDischargeDate = presetDate;
        if (presetTime) entry.dischargeTime = presetTime;
        persistDischargeSchedule();
    }

    function openDischargeCustomDialog() {
        const { entry } = getCurrentDischargeEntry();
        if (!entry) return;

        ensureCurrentDischargeDefaults(entry);
        const overlay = document.createElement('div');
        overlay.className = 'dr-xv-custom-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.38);z-index:100005;display:flex;align-items:center;justify-content:center;padding:16px;';

        const panel = document.createElement('div');
        panel.style.cssText = 'width:min(420px,100%);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(15,23,42,0.25);padding:18px;';
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:12px;">
                <div>
                    <div style="font-size:18px;font-weight:700;color:#0f172a;">Tùy chỉnh ra viện</div>
                    <div style="font-size:12px;color:#64748b;">Chọn ngày và giờ ra viện cụ thể</div>
                </div>
                <button type="button" class="dr-xv-close" style="border:none;background:#f1f5f9;color:#334155;border-radius:999px;width:32px;height:32px;cursor:pointer;">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;">
                <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#334155;">
                    <span>Ngày dự kiến</span>
                    <input class="dr-xv-custom-date" type="date" style="padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;" />
                </label>
                <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#334155;">
                    <span>Giờ ra viện</span>
                    <input class="dr-xv-custom-time" type="time" step="60" style="padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;" />
                </label>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
                <button type="button" class="dr-xv-cancel" style="padding:10px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:10px;cursor:pointer;">Hủy</button>
                <button type="button" class="dr-xv-save" style="padding:10px 14px;border:none;background:#16a34a;color:#fff;border-radius:10px;cursor:pointer;font-weight:700;">Lưu</button>
            </div>
        `;

        const dateInput = panel.querySelector('.dr-xv-custom-date');
        const timeInput = panel.querySelector('.dr-xv-custom-time');
        const closeDialog = () => overlay.remove();
        dateInput.value = entry.expectedDischargeDate || getTodayISODate();
        timeInput.value = entry.dischargeTime || '12:00';

        panel.querySelector('.dr-xv-close').addEventListener('click', closeDialog);
        panel.querySelector('.dr-xv-cancel').addEventListener('click', closeDialog);
        panel.querySelector('.dr-xv-save').addEventListener('click', () => {
            entry.expectedDischargeDate = dateInput.value || getTodayISODate();
            entry.dischargeTime = timeInput.value || '12:00';
            closeDialog();
            persistDischargeSchedule();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
        });

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    function renderDischargeLog() {
        const dischargeContainer = getDischargeLogContainer();
        if (!dischargeContainer) return;

        const { entry } = getCurrentDischargeEntry();
        if (!entry) {
            dischargeContainer.innerHTML = '<div style="color:#888;font-style:italic;">Bấm <b>Xuất viện</b> để thiết lập ngày/giờ ra viện.</div>';
            return;
        }
        ensureCurrentDischargeDefaults(entry);

        const todayDate = getTodayISODate();
        const selectedDate = entry.expectedDischargeDate || todayDate;
        const selectedTime = entry.dischargeTime || '12:00';
        const quickDates = [
            { key: 'today', label: 'Hôm nay', value: todayDate },
            { key: 'tomorrow', label: 'Ngày mai', value: (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })() }
        ];
        const quickTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

        dischargeContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;">Ngày dự kiến</div>
                        <div style="font-size:18px;font-weight:800;color:#0f172a;">${formatDisplayDate(selectedDate)}</div>
                    </div>
                    <div style="font-size:14px;color:${entry.status === 'done' ? '#166534' : '#92400e'};font-weight:700;align-self:center;">
                        ${entry.status === 'done' ? 'Đã ra viện' : 'Đang chờ'}
                    </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${quickDates.map(btn => `
                        <button type="button" class="dr-xv-date-chip ${selectedDate === btn.value ? 'is-active' : ''}" data-xv-date="${btn.value}" style="padding:8px 12px;border-radius:999px;border:1px solid ${selectedDate === btn.value ? '#16a34a' : '#cbd5e1'};background:${selectedDate === btn.value ? '#dcfce7' : '#fff'};color:${selectedDate === btn.value ? '#166534' : '#334155'};cursor:pointer;font-weight:${selectedDate === btn.value ? '700' : '600'};">${btn.label}</button>
                    `).join('')}
                    <button type="button" class="dr-xv-custom-btn" style="padding:8px 12px;border-radius:999px;border:1px solid #60a5fa;background:#eff6ff;color:#1d4ed8;cursor:pointer;font-weight:700;">Tùy chỉnh</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <span style="font-size:13px;color:#334155;font-weight:700;">Giờ ra viện</span>
                    ${quickTimes.map(time => {
                        const isActive = selectedTime === time;
                        return `<button type="button" class="dr-xv-time-chip ${isActive ? 'is-active' : ''}" data-xv-time="${time}" style="padding:8px 12px;border-radius:999px;border:1px solid ${isActive ? '#16a34a' : '#cbd5e1'};background:${isActive ? '#dcfce7' : '#fff'};color:${isActive ? '#166534' : '#334155'};cursor:pointer;font-weight:${isActive ? '700' : '600'};">${time}</button>`;
                    }).join('')}
                </div>
                <div style="padding:10px 12px;border:1px solid #dbeafe;border-radius:12px;background:#f8fbff;color:#0f172a;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;">
                    <div><strong>${entry.content}</strong></div>
                    <div style="color:#166534;font-weight:700;">Dự kiến ${formatDisplayDate(selectedDate)} ${selectedTime}</div>
                </div>
            </div>
        `;

        dischargeContainer.querySelectorAll('.dr-xv-date-chip').forEach(btn => {
            btn.addEventListener('click', () => applyDischargePreset(btn.getAttribute('data-xv-date')));
        });
        dischargeContainer.querySelectorAll('.dr-xv-time-chip').forEach(btn => {
            btn.addEventListener('click', () => applyDischargePreset(null, btn.getAttribute('data-xv-time')));
        });
        const customBtn = dischargeContainer.querySelector('.dr-xv-custom-btn');
        if (customBtn && !customBtn._bound) {
            customBtn.addEventListener('click', openDischargeCustomDialog);
            customBtn._bound = true;
        }
    }

    // Add y lệnh (enhanced với support cho quick actions)
    function addYLenh(content = null) {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
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

        // Update patient state and card tags
        if (!content) input.value = ''; // Only clear if not from quick action
        renderYLenhLog(window.checklistState.yLenhLog);
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        callGlobalFn('updatePatientCardTags', patient.mabn);
        syncHxtFromYLenhLog();

        // Also check celebration animation specifically after adding tag
        setTimeout(() => {
            if (typeof window.checkAllCelebrationAnimations === 'function') {
                const patientInData = window.dr_data && window.dr_data.find(p => p.mabn === patient.mabn);
                if (patientInData) window.checkAllCelebrationAnimations([patientInData]);
            }
        }, 100);
    }

    // Remove y lệnh
    function removeYLenh(index) {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
            window.checklistState.yLenhLog.splice(index, 1);
            saveYLenhLog();
            renderYLenhLog(window.checklistState.yLenhLog);
            syncPatientStateToGlobal(patient.mabn, window.checklistState);
            callGlobalFn('updatePatientCardTags', patient.mabn);
            syncHxtFromYLenhLog();

            // Also check celebration animation specifically after removing tag
            setTimeout(() => {
                if (typeof window.checkAllCelebrationAnimations === 'function') {
                    const patientInData = window.dr_data && window.dr_data.find(p => p.mabn === patient.mabn);
                    if (patientInData) window.checkAllCelebrationAnimations([patientInData]);
                }
            }, 100);
        }
    }

    // Save y lệnh log to server
    async function saveYLenhLog() {
        if (window.checklistObj) {
            if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                window.__drSidebarResetAutoSyncTimer();
            }
            const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { ctxId, enqueueOnOffline: true, signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.error('Lưu log y lệnh thất bại!');
            }
        }
    }

    // Event listeners
    addBtn.addEventListener('click', () => addYLenh());
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addYLenh();
        }
    });

    // Helper: find today's quick entry by action
    function findTodayQuickEntryByAction(actionText) {
        const todayStr = DateUtils.getTodayStr();
        if (!window.checklistState || !Array.isArray(window.checklistState.yLenhLog)) return { entry: null, index: -1 };
        const index = window.checklistState.yLenhLog.findIndex(e => {
            const entryDate = e.timestamp ? e.timestamp.split(' ')[0] : '';
            const sameAction = e.action ? e.action === actionText : e.content === actionText;
            return entryDate === todayStr && sameAction && (e.q === true || e.content === actionText);
        });
        return { entry: index >= 0 ? window.checklistState.yLenhLog[index] : null, index };
    }

    // UI: Discharge time editor (appears when 'Xuất viện' quick action is present today)
    function ensureDischargeTimeEditor() {
        renderDischargeLog();
    }

    // Quick action buttons event listeners - Toggle logic (3-state: off -> active -> done -> off)
    infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const actionText = this.getAttribute('data-action');
            toggleQuickYLenh(actionText, this);
        });
    });

    // Function to toggle quick y lệnh (three states)
    function toggleQuickYLenh(actionText, buttonElement) {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        const todayStr = DateUtils.getTodayStr();
        const statusCount = getQuickActionStatusCount(actionText);

        if (!window.checklistState.yLenhLog) {
            window.checklistState.yLenhLog = [];
        }

        // Find existing quick entry for this action today
        const existingIndex = window.checklistState.yLenhLog.findIndex(entry => {
            const entryDate = entry.timestamp ? entry.timestamp.split(' ')[0] : '';
            const isToday = entryDate === todayStr;
            const isQuick = entry.q === true || (entry.content === actionText && !entry.id?.toString().startsWith('manual'));
            const sameAction = entry.action ? entry.action === actionText : entry.content === actionText;
            return isToday && isQuick && sameAction;
        });

        // Cycle states based on configured mode
        if (statusCount === 2) {
            if (existingIndex === -1) {
                const now = new Date();
                const timestamp = `${todayStr} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                const doctorName = 'BS';
                const newEntry = {
                    timestamp: `${timestamp} - ${doctorName}`,
                    content: actionText,
                    id: Date.now(),
                    q: true,
                    action: actionText,
                    status: 'done'
                };
                if (buttonElement && buttonElement.dataset && buttonElement.dataset.noAddToHxt === '1') {
                    newEntry.noAddToHxt = true;
                }
                if (actionText === 'Xuất viện') {
                    newEntry.dischargeTime = '12:00';
                    newEntry.expectedDischargeDate = getTodayISODate();
                }
                window.checklistState.yLenhLog.unshift(newEntry);
                buttonElement.classList.remove('active');
                buttonElement.classList.add('done');
                console.log('Quick action set to DONE:', actionText);
            } else {
                window.checklistState.yLenhLog.splice(existingIndex, 1);
                buttonElement.classList.remove('active');
                buttonElement.classList.remove('done');
                console.log('Quick action reset to OFF:', actionText);
            }
        } else if (existingIndex === -1) {
            // OFF -> ACTIVE (create entry)
            const now = new Date();
            const timestamp = `${todayStr} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const doctorName = 'BS';
            const newEntry = {
                timestamp: `${timestamp} - ${doctorName}`,
                content: actionText,
                id: Date.now(),
                q: true,
                action: actionText,
                status: 'active'
            };
            if (buttonElement && buttonElement.dataset && buttonElement.dataset.noAddToHxt === '1') {
                newEntry.noAddToHxt = true;
            }
            // If this is 'Xuất viện', set default discharge time
            if (actionText === 'Xuất viện') {
                newEntry.dischargeTime = '12:00';
                newEntry.expectedDischargeDate = getTodayISODate();
            }
            window.checklistState.yLenhLog.unshift(newEntry);
            buttonElement.classList.add('active');
            buttonElement.classList.remove('done');
            console.log('Quick action set to ACTIVE:', actionText);
        } else {
            const entry = window.checklistState.yLenhLog[existingIndex];
            if (entry.status === 'active') {
                // ACTIVE -> DONE
                entry.status = 'done';
                buttonElement.classList.remove('active');
                buttonElement.classList.add('done');
                console.log('Quick action set to DONE:', actionText);
            } else if (entry.status === 'done') {
                // DONE -> OFF (remove)
                window.checklistState.yLenhLog.splice(existingIndex, 1);
                buttonElement.classList.remove('active');
                buttonElement.classList.remove('done');
                console.log('Quick action reset to OFF:', actionText);
            } else {
                // Unknown status (fallback): set to ACTIVE
                entry.status = 'active';
                buttonElement.classList.add('active');
                buttonElement.classList.remove('done');
            }
        }

        // Save changes
        saveYLenhLog();
        renderYLenhLog(window.checklistState.yLenhLog);
        renderDischargeLog();
        syncHxtFromYLenhLog();

        // Update card tags
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        callGlobalFn('updatePatientCardTags', patient.mabn);

        // Discharge time editor + celebration animation for 'Xuất viện'
        if (actionText === 'Xuất viện') {
            // ensure time editor is visible/hidden appropriately
            ensureDischargeTimeEditor();
            renderDischargeLog();
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
    // Priority: patient.checklistState (populated from card) > window.checklistState
    function updateQuickActionButtonStates() {
        const todayStr = DateUtils.getTodayStr();
        // Source: prefer patient-scoped state so buttons show correctly on sidebar open
        // even before the async checklist API call resolves
        const yLenhLog = (patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog))
            ? patient.checklistState.yLenhLog
            : (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                ? window.checklistState.yLenhLog
                : null;

        infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
            const actionText = btn.getAttribute('data-action');
            const statusCount = getQuickActionStatusCount(actionText);

            // Check if this action exists today
            let state = 'off';
            if (yLenhLog) {
                const found = yLenhLog.find(entry => {
                    const entryDate = entry.timestamp ? entry.timestamp.split(' ')[0] : '';
                    const isToday = entryDate === todayStr;
                    const sameAction = entry.action ? entry.action === actionText : entry.content === actionText;
                    return isToday && sameAction && (entry.q === true || entry.content === actionText);
                });
                if (found) {
                    state = statusCount === 2 ? 'done' : (found.status || 'active');
                }
            }
            btn.classList.toggle('active', state === 'active');
            btn.classList.toggle('done', state === 'done');
        });
    }

    // Load immediately using patient.checklistState (no waiting for async API)
    // then re-sync once window.checklistState is populated (via a short poll)
    loadYLenhLog();
    updateQuickActionButtonStates();
    ensureDischargeTimeEditor();
    renderDischargeLog();
    syncHxtFromYLenhLog();

    // Secondary poll: if patient.checklistState was empty but window.checklistState
    // arrives later (async API), refresh displays once
    let _syncPollCount = 0;
    const _syncPoll = setInterval(() => {
        _syncPollCount++;
        const wlog = window.checklistState && Array.isArray(window.checklistState.yLenhLog)
            ? window.checklistState.yLenhLog : null;
        const plog = patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog)
            ? patient.checklistState.yLenhLog : null;
        if (wlog && wlog !== plog) {
            // window.checklistState just became available or was updated – sync into patient and refresh
            if (patient) patient.checklistState = { ...(patient.checklistState || {}), yLenhLog: wlog };
            loadYLenhLog();
            updateQuickActionButtonStates();
            ensureDischargeTimeEditor();
            syncHxtFromYLenhLog();
            clearInterval(_syncPoll);
        }
        if (_syncPollCount >= 20) clearInterval(_syncPoll); // stop after ~2s
    }, 100);

    // Store reference to removeYLenh for use in loadYLenhLogFromState
    window.currentRemoveYLenh = removeYLenh;
    window.currentRenderYLenh = renderYLenhLog;
    window.currentUpdateQuickYLenhStates = updateQuickActionButtonStates;
    window.currentEnsureDischargeTimeEditor = ensureDischargeTimeEditor;
    window.currentSyncHxtFromYLenhLog = syncHxtFromYLenhLog;

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

},{"../BS_CAI_DAT_GIAO_DIEN":1,"../services/checklistService":38,"../utils/dateUtils":50,"../utils/dischargeUtils":51,"../utils/globalFnUtils":53,"../utils/stateSync":58}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
// otm-entry.js - Entry point for OTM content script
(function() {
    'use strict';

    // Only run on OTM domain
    if (window.location.hostname !== 'otm.tahospital.vn') {
        return;
    }

    console.log('OTM Entry Script loaded');

    // Load the content script
    try {
        require('./otm.content.script');
    } catch (error) {
        console.error('Failed to load OTM content script:', error);
    }

})();

},{"./otm.content.script":29}],29:[function(require,module,exports){
// otm.content.js - Content script for OTM surgery data fetching
(function() {
    'use strict';

    console.log('OTM Content Script loaded');

    // Function to check if debug is enabled
    function isDebugEnabled() {
        return localStorage.getItem('dr_debug_otm') === 'true';
    }

    // Function to log debug messages
    function debugLog(message, ...args) {
        if (isDebugEnabled()) {
            console.log('[OTM Debug]', message, ...args);
        }
    }

    // Lightweight validation for access tokens to avoid saving 'undefined'/'null'/too-short values
    function isLikelyValidToken(tok) {
        try {
            if (typeof tok !== 'string') return false;
            const t = tok.trim();
            if (!t) return false;
            const low = t.toLowerCase();
            if (low === 'undefined' || low === 'null') return false;
            if (t.length < 16) return false; // heuristic: tokens are typically long
            // avoid whitespace in token
            if (/\s/.test(t)) return false;
            return true;
        } catch { return false; }
    }

    // Function to save bearer token to GM and localStorage (only if valid)
    function saveBearerToken(token) {
        try {
            if (!isLikelyValidToken(token)) {
                debugLog('Refusing to save invalid bearer token candidate');
                return;
            }
            try { sessionStorage.setItem('otm_bearer_token', token); } catch(_) {}
            try { localStorage.setItem('otm_bearer_token', token); } catch(_) {}
            try { if (typeof GM !== 'undefined' && GM.setValue) { GM.setValue('otm_bearer_token', token); } } catch(_) {}
            debugLog('Bearer token saved');
        } catch (error) {
            debugLog('Error saving bearer token:', error);
        }
    }

    // Function to get bearer token from GM or localStorage (awaits GM when needed)
    async function getSavedBearerTokenAsync() {
        try {
            let token = null;
            try { token = sessionStorage.getItem('otm_bearer_token'); } catch(_) { token = null; }
            if (!token) { try { token = localStorage.getItem('otm_bearer_token'); } catch(_) { token = null; } }
            if (!token && typeof GM !== 'undefined' && GM.getValue) {
                try {
                    token = await GM.getValue('otm_bearer_token', '');
                    if (token) {
                        try { sessionStorage.setItem('otm_bearer_token', token); } catch(_) {}
                        try { localStorage.setItem('otm_bearer_token', token); } catch(_) {}
                    }
                } catch(_) { token = null; }
            }
            if (token) {
                // Guard against polluted storage values like 'undefined' or too short strings
                if (!isLikelyValidToken(token)) {
                    debugLog('Found invalid token in storage; cleaning up');
                    try { sessionStorage.removeItem('otm_bearer_token'); } catch(_) {}
                    try { localStorage.removeItem('otm_bearer_token'); } catch(_) {}
                    try { if (typeof GM !== 'undefined' && GM.deleteValue) { GM.deleteValue('otm_bearer_token'); } } catch(_) {}
                    return null;
                }
                debugLog('Found saved bearer token (async)');
                return token;
            }
        } catch (error) {
            debugLog('Error getting saved bearer token (async):', error);
        }
        return null;
    }

    // Function to send message to parent using GM storage
    function sendMessageToParent(type, data) {
        debugLog('Sending message to parent via GM storage:', type, data);
        try {
            const key = `otm_${type}`;
            const value = JSON.stringify({
                data: {
                    ...(data || {})
                },
                timestamp: Date.now(),
                tabId: Math.random().toString(36).substr(2, 9)
            });

            if (typeof GM !== 'undefined' && GM.setValue) {
                GM.setValue(key, value);
                debugLog(`Stored ${key} in GM storage`);
            } else {
                debugLog('GM.setValue not available, falling back to localStorage');
                localStorage.setItem(key, value);
            }
        } catch (error) {
            debugLog('Error storing message:', error);
        }
    }

    // Function to close this tab - always self-close like ?nln flow, with robust fallbacks
    function closeTab() {
        debugLog('Closing OTM tab (self + fallback signal)');
        // Signal parent as a fallback in case self-close is blocked
        try { sendMessageToParent('close_tab', { reason: 'self_close_fallback' }); } catch(_) {}
        // Try TM API if available
        try { if (typeof GM !== 'undefined' && GM.closeTab) { GM.closeTab(); } } catch(_) {}
        // Try window.close twice with small delays
        try { window.close(); } catch (_) { /* ignore */ }
        setTimeout(() => {
            try { if (typeof GM !== 'undefined' && GM.closeTab) { GM.closeTab(); } } catch(_) {}
            try { window.close(); } catch(_) {}
        }, 300);
        setTimeout(() => {
            try { if (typeof GM !== 'undefined' && GM.closeTab) { GM.closeTab(); } } catch(_) {}
            try { window.close(); } catch(_) {}
        }, 900);
    }

    // Function to test if bearer token is still valid
    async function testTokenValidity(token) {
        try {
            debugLog('Testing token validity...');
            // Use a future date for testing (next week)
            const testDate = new Date();
            testDate.setDate(testDate.getDate() + 7); // 7 days from now
            const isoDate = testDate.toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z');

            debugLog('Test date for token validation:', isoDate);

            const response = await fetch(`https://otm.tahospital.vn/api/booking?date=${isoDate}`, {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                    "authorization": `Bearer ${token}`,
                    "if-none-match": "W/\"3de9d-aNgxHg6vKhdB2PNct3jxHFKkaaU\"",
                    "logintype": "2",
                    "priority": "u=1, i",
                    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "siteid": "1"
                },
                method: "GET",
                mode: "cors",
                credentials: "include"
            });

            debugLog('Token validation response status:', response.status);
            debugLog('Token validation response ok:', response.ok);

            if (!response.ok) {
                debugLog('Token validation failed - response not ok');
                return false;
            }

            // Try to parse the response
            const data = await response.json();
            debugLog('Token validation response data:', data);

            return true;
        } catch (error) {
            debugLog('Token validity test failed with error:', error);
            debugLog('Error details:', error.message);
            return false;
        }
    }

    // Check if we should run automation - read from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const otmFetchParam = urlParams.get('otm-fetch');
    const otmFetchUsers = urlParams.has('otm-fetch-users') || urlParams.get('otm-fetch-users') === '1' || urlParams.get('otm-fetch') === 'users';
    const otmTokenParam = urlParams.get('otm-token'); // New parameter for token-only extraction
    // Date range for fetching (filled from URL or defaulted later)
    let fromDate = null;
    let toDate = null;
    // Correlation id for messages back to parent
    let requestId = null;
    
    console.log('[OTM Debug] URL params check - otmFetchParam:', !!otmFetchParam, 'otmTokenParam:', !!otmTokenParam);
    
    // Handle token-only extraction requests
    if (otmTokenParam) {
        console.log('[OTM Debug] Token extraction request detected');
        setTimeout(() => {
            checkExistingTokenForExtraction();
        }, 0);
    } else {
        // Always check existing token first for normal operations
        console.log('[OTM Debug] Will check existing token first');
        debugLog('Checking for existing token...');
        // Schedule immediately (next tick) to start as soon as possible
        setTimeout(() => {
            console.log('[OTM Debug] Calling checkExistingToken ASAP');
            checkExistingToken();
        }, 0);
    }

    // Function to check existing token and start appropriate flow
    async function checkExistingToken() {
        let savedToken = await getSavedBearerTokenAsync();
        console.log('[OTM Debug] Checking existing token...');
        if (savedToken) {
            console.log('[OTM Debug] Found saved token, using it immediately');
            sendMessageToParent('progress', { step: 'token_found', message: 'Đã có token OTM, bắt đầu lấy dữ liệu...' });
            // Ensure global bearerToken is set so fetchSurgeryData can use it immediately
            try { bearerToken = savedToken; } catch(_) {}
            // Skip pre-validation to save time; fetch will detect 401/403 and fallback
            if (otmFetchUsers) {
                try {
                    await fetchOTMUsers();
                    return;
                } catch (error) {
                    console.error('Failed to fetch OTM users with saved token:', error);
                    sendMessageToParent('error', { message: 'Lỗi khi lấy danh sách OTM: ' + error.message });
                    closeTab();
                    return;
                }
            } else if (otmFetchParam) {
                try {
                    const data = JSON.parse(decodeURIComponent(otmFetchParam));
                    fromDate = data.fromDate;
                    toDate = data.toDate;
                    const preferToken = !!data.preferToken;
                    console.log('Starting direct API fetch for dates:', fromDate, 'to', toDate);
                    if (preferToken) {
                        // With preferToken, strictly avoid automation when token is present
                        await fetchSurgeryData(fromDate, toDate);
                        return;
                    }
                    await fetchSurgeryData(fromDate, toDate);
                    return;
                } catch (error) {
                    console.error('Failed to parse OTM fetch data from URL:', error);
                    sendMessageToParent('error', { message: 'Lỗi khi phân tích dữ liệu URL: ' + error.message });
                    closeTab();
                    return;
                }
            } else {
                // Default to today
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                fromDate = `${yyyy}-${mm}-${dd}`;
                toDate = fromDate;
                console.log('[OTM Debug] No URL param; defaulting to today and fetching:', fromDate);
                await fetchSurgeryData(fromDate, toDate);
                return;
            }
        } else {
            console.log('[OTM Debug] No saved token found');
            debugLog('No saved token found, starting automation');
            // Grace period: retry a few times to read GM/local storage in case it's not hydrated yet
            let tries = 0;
            while (!savedToken && tries < 5) {
                await new Promise(r => setTimeout(r, 250));
                tries++;
                savedToken = await getSavedBearerTokenAsync();
            }
            if (savedToken) {
                try { bearerToken = savedToken; } catch(_) {}
                sendMessageToParent('progress', { step: 'token_found', message: 'Đã có token OTM, bắt đầu lấy dữ liệu...' });
                if (otmFetchUsers) { await fetchOTMUsers(); return; }
                if (otmFetchParam) {
                    try {
                        const data = JSON.parse(decodeURIComponent(otmFetchParam));
                        fromDate = data.fromDate; toDate = data.toDate;
                        await fetchSurgeryData(fromDate, toDate);
                        return;
                    } catch (e) {
                        sendMessageToParent('error', { message: 'Lỗi khi phân tích dữ liệu URL: ' + e.message });
                        closeTab(); return;
                    }
                }
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                fromDate = `${yyyy}-${mm}-${dd}`; toDate = fromDate;
                await fetchSurgeryData(fromDate, toDate);
                return;
            }
            sendMessageToParent('progress', { step: 'no_token', message: 'Không tìm thấy token OTM đã lưu, bắt đầu tự động hóa...' });
        }

    // Start automation to get new token (either invalid token or no token)
    if (otmFetchParam) {
            // Parse the fetch parameters
            try {
                const data = JSON.parse(decodeURIComponent(otmFetchParam));
                fromDate = data.fromDate;
                toDate = data.toDate;
                console.log('Starting OTM automation for dates:', fromDate, 'to', toDate);
            } catch (error) {
                console.error('Failed to parse OTM fetch data from URL:', error);
                sendMessageToParent('error', { message: 'Lỗi khi phân tích dữ liệu URL: ' + error.message });
                closeTab();
                return;
            }
        }
        startAutomation();
    }

    // Function specifically for token extraction requests
    async function checkExistingTokenForExtraction() {
        console.log('[OTM Debug] Starting token extraction flow...');
        
        // Check for existing token first
        let savedToken = await getSavedBearerTokenAsync();
        
        if (savedToken && isLikelyValidToken(savedToken)) {
            console.log('[OTM Debug] Found valid saved token, returning it');
            debugLog('Token extraction: using saved token');
            bearerToken = savedToken;
            
            // Validate the token to make sure it's still working
            const isValid = await testTokenValidity(savedToken);
            if (isValid) {
                console.log('[OTM Debug] Token validation passed, sending to parent');
                sendMessageToParent('token_success', {
                    token: savedToken,
                    expiry: Date.now() + (24 * 60 * 60 * 1000), // Default 24h expiry
                    source: 'saved_token'
                });
                closeTab();
                return;
            } else {
                console.log('[OTM Debug] Saved token is invalid, need to get fresh one');
                debugLog('Token extraction: saved token invalid, starting automation');
            }
        } else {
            console.log('[OTM Debug] No valid saved token found');
            debugLog('Token extraction: no saved token, starting automation');
        }

        // No valid token available, start automation to get a fresh one
        sendMessageToParent('progress', { step: 'token_automation', message: 'Bắt đầu tự động hóa để lấy token mới...' });
        startAutomationForTokenExtraction();
    }

    // Modified automation specifically for token extraction
    async function startAutomationForTokenExtraction() {
        try {
            debugLog('=== STARTING TOKEN EXTRACTION AUTOMATION ===');
            sendMessageToParent('progress', { step: 'start', message: 'Bắt đầu tự động hóa để lấy token OTM...' });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 500));
            sendMessageToParent('progress', { step: 'page_loaded', message: 'Trang OTM đã tải xong' });

            // Step 1: Find and hover over "Quản lý Phẫu thuật"
            debugLog('Looking for "Quản lý Phẫu thuật" menu for token extraction...');
            sendMessageToParent('progress', { step: 'finding_menu', message: 'Đang tìm menu "Quản lý Phẫu thuật"...' });
            const quanLyPhauThuatElement = await waitForElement('p', 'Quản lý Phẫu thuật', 8000);

            if (!quanLyPhauThuatElement) {
                debugLog('Token extraction: Cannot find "Quản lý Phẫu thuật" menu');
                sendMessageToParent('token_error', { message: 'Không tìm thấy menu "Quản lý Phẫu thuật". Có thể tài khoản không có quyền truy cập.' });
                closeTab();
                return;
            }

            debugLog('Token extraction: Found menu, triggering mouseover...');
            sendMessageToParent('progress', { step: 'menu_found', message: 'Đã tìm thấy menu, đang mở submenu...' });

            // Step 2: Trigger mouseover to show submenu
            triggerMouseEvent(quanLyPhauThuatElement, 'mouseover');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Find and click submenu
            debugLog('Token extraction: Looking for submenu...');
            sendMessageToParent('progress', { step: 'finding_submenu', message: 'Đang tìm submenu "Đặt hẹn Lịch mổ"...' });

            let datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn Lịch mổ', 800);
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn Lịch mổ', 800);
            }
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn', 900);
            }
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn', 900);
            }

            if (datHenLichMoElement) {
                debugLog('Token extraction: Found submenu, clicking...');
                sendMessageToParent('progress', { step: 'submenu_found', message: 'Đã tìm thấy submenu, đang chuyển trang...' });
                datHenLichMoElement.click();

                // Wait for the page to load and token to be captured
                await new Promise(resolve => setTimeout(resolve, 2000));
                sendMessageToParent('progress', { step: 'token_wait', message: 'Đang chờ token được tạo...' });

                // Wait for token to be captured by our interceptors
                let attempts = 0;
                while (!bearerToken && attempts < 15) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                    debugLog(`Token extraction: waiting for token... (attempt ${attempts}/15)`);
                }

                if (bearerToken && isLikelyValidToken(bearerToken)) {
                    console.log('[OTM Debug] Token captured successfully during extraction');
                    debugLog('Token extraction: success, token captured');
                    sendMessageToParent('token_success', {
                        token: bearerToken,
                        expiry: Date.now() + (24 * 60 * 60 * 1000), // Default 24h expiry
                        source: 'fresh_automation'
                    });
                } else {
                    console.log('[OTM Debug] Token extraction failed - no token captured');
                    debugLog('Token extraction: failed, no token captured');
                    sendMessageToParent('token_error', { message: 'Không thể lấy token sau khi tự động hóa' });
                }
            } else {
                debugLog('Token extraction: submenu not found');
                sendMessageToParent('token_error', { message: 'Không tìm thấy submenu "Đặt hẹn Lịch mổ"' });
            }
        } catch (error) {
            console.error('Token extraction automation error:', error);
            sendMessageToParent('token_error', { message: 'Lỗi trong quá trình tự động hóa token: ' + error.message });
        } finally {
            closeTab();
        }
    }

    // Intercept fetch to capture Bearer token
    let bearerToken = null; // Will be set by checkExistingToken or interceptors
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        if (options && options.headers) {
            // Check for Authorization header
            const getHeaderVal = (h) => {
                try {
                    if (!h) return null;
                    // Headers object vs plain object
                    if (typeof h.get === 'function') {
                        return h.get('Authorization') || h.get('authorization') || null;
                    }
                    return h.Authorization || h.authorization || null;
                } catch { return null; }
            };
            const authHeader = getHeaderVal(options.headers);
            if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                const newToken = authHeader.substring(7);
                if (isLikelyValidToken(newToken) && newToken !== bearerToken) {
                    bearerToken = newToken;
                    saveBearerToken(bearerToken);
                    debugLog('Captured Bearer token from fetch headers');
                }
            }
        }
        return originalFetch.apply(this, args);
    };

    // Also intercept XMLHttpRequest for token capture
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this.addEventListener('loadstart', function() {
            try {
                const authHeader = this._headers && (this._headers.Authorization || this._headers.authorization);
                if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                    const newToken = authHeader.substring(7);
                    if (isLikelyValidToken(newToken) && newToken !== bearerToken) {
                        bearerToken = newToken;
                        saveBearerToken(bearerToken);
                        debugLog('Captured Bearer token from XMLHttpRequest');
                    }
                }
            } catch(_) {}
        });
        return originalOpen.apply(this, [method, url, ...args]);
    };

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (!this._headers) this._headers = {};
        this._headers[header] = value;
        try {
            if ((header === 'Authorization' || header === 'authorization') && typeof value === 'string' && value.startsWith('Bearer ')) {
                const newToken = value.substring(7);
                if (isLikelyValidToken(newToken) && newToken !== bearerToken) {
                    bearerToken = newToken;
                    saveBearerToken(bearerToken);
                    debugLog('Captured Bearer token from XMLHttpRequest setRequestHeader');
                }
            }
        } catch(_) {}
        return originalSetRequestHeader.apply(this, [header, value]);
    };

    // Utility functions
    function findElementByText(tagName, textContent) {
        const elements = document.querySelectorAll(tagName);
        for (const element of elements) {
            const elementText = element.textContent.trim();
            // Try exact match first
            if (elementText === textContent.trim()) {
                return element;
            }
            // Try case-insensitive match
            if (elementText.toLowerCase() === textContent.trim().toLowerCase()) {
                return element;
            }
            // Try partial match
            if (elementText.includes(textContent.trim())) {
                return element;
            }
            // Try partial case-insensitive match
            if (elementText.toLowerCase().includes(textContent.trim().toLowerCase())) {
                return element;
            }
        }
        return null;
    }

    function triggerMouseEvent(element, eventType) {
        const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    function waitForElement(tagName, textContent, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = findElementByText(tagName, textContent);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    resolve(null);
                }
            }, 500);
        });
    }

    // Transform raw surgery records into a lean structure required by the main UI
    function filterSurgeryData(records) {
        if (!Array.isArray(records)) return [];
        const result = [];
        for (const r of records) {
            const customerPid = r?.customer?.pid ?? r?.customer?.code ?? null;
            const operatingRoom = r?.operating_room ?? r?.room?.name ?? null;
            const item = {
                customer: {
                    fullname: r?.customer?.fullname ?? null,
                    pid: customerPid,
                    dob: r?.customer?.dob ?? null,
                },
                diagnose: r?.diagnose ?? null,
                surgerymethod: r?.surgerymethod ?? null,
                start: r?.start ?? null,
                end: r?.end ?? null,
                // Optional treatment info
                khoaLuuTri: r?.khoaLuuTri ?? null,
                khoaDieuTri: r?.khoaDieuTri ?? null,
                phongDieuTri: r?.phongDieuTri ?? null,
                giuongDieuTri: r?.giuongDieuTri ?? null,
                // Operating room name only
                operating_room: operatingRoom,
                status: r?.status ?? null,
                // Surgeons
                userexec: Array.isArray(r?.userexec)
                    ? r.userexec.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
                    : [],
                userassistant: Array.isArray(r?.userassistant)
                    ? r.userassistant.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
                    : [],
            };
            result.push(item);
        }
        return result;
    }

    // Main automation function
    async function startAutomation() {
        try {
            debugLog('=== STARTING OTM AUTOMATION ===');
            sendMessageToParent('progress', { step: 'start', message: 'Bắt đầu tự động hóa OTM...' });

            // Wait for page to load (reduced)
            await new Promise(resolve => setTimeout(resolve, 500));
            sendMessageToParent('progress', { step: 'page_loaded', message: 'Trang OTM đã tải xong' });

            // Step 1: Find and hover over "Quản lý Phẫu thuật"
            debugLog('Looking for "Quản lý Phẫu thuật" menu...');
            sendMessageToParent('progress', { step: 'finding_menu', message: 'Đang tìm menu "Quản lý Phẫu thuật"...' });
            const quanLyPhauThuatElement = await waitForElement('p', 'Quản lý Phẫu thuật', 8000);

            if (!quanLyPhauThuatElement) {
                debugLog('Không tìm thấy phần tử "Quản lý Phẫu thuật". Có thể account không có quyền truy cập.');
                sendMessageToParent('error', { message: 'Không tìm thấy menu "Quản lý Phẫu thuật". Có thể tài khoản không có quyền truy cập.' });
                closeTab();
                return;
            }

            debugLog('Tìm thấy "Quản lý Phẫu thuật", kích hoạt mouseover...');
            sendMessageToParent('progress', { step: 'menu_found', message: 'Đã tìm thấy menu, đang mở submenu...' });

            // Step 2: Trigger mouseover to show submenu
            triggerMouseEvent(quanLyPhauThuatElement, 'mouseover');

            // Wait a bit for submenu to appear (reduced from 1000ms)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Try different selectors for submenu (reduced timeouts)
            debugLog('Tìm submenu "Đặt hẹn Lịch mổ"...');
            sendMessageToParent('progress', { step: 'finding_submenu', message: 'Đang tìm submenu "Đặt hẹn Lịch mổ"...' });

            let datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn Lịch mổ', 800);
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn Lịch mổ', 800);
            }
            if (!datHenLichMoElement) {
                // Try partial text match
                datHenLichMoElement = await waitForElement('h6', 'Đặt hẹn', 900);
            }
            if (!datHenLichMoElement) {
                datHenLichMoElement = await waitForElement('p', 'Đặt hẹn', 900);
            }
            if (!datHenLichMoElement) {
                // Last resort: search all clickable elements
                const allClickable = document.querySelectorAll('button, a, [role="button"], [onclick]');
                for (const el of allClickable) {
                    if (el.textContent && el.textContent.toLowerCase().includes('đặt hẹn')) {
                        datHenLichMoElement = el;
                        debugLog('Found via clickable elements search:', el.textContent.trim());
                        break;
                    }
                }
            }

            // Debug: Log all possible elements
            console.log('Debug: Tất cả elements h6:', Array.from(document.querySelectorAll('h6')).map(el => el.textContent.trim()));
            console.log('Debug: Tất cả elements p:', Array.from(document.querySelectorAll('p')).map(el => el.textContent.trim()));

            if (datHenLichMoElement) {
                debugLog('Tìm thấy "Đặt hẹn Lịch mổ", click...');
                sendMessageToParent('progress', { step: 'submenu_found', message: 'Đã tìm thấy submenu, đang chuyển trang...' });
                datHenLichMoElement.click();

                // Wait for the surgery scheduling page to load
                await new Promise(resolve => setTimeout(resolve, 1000));
                sendMessageToParent('progress', { step: 'page_ready', message: 'Trang đặt lịch đã sẵn sàng' });

                // Now we can fetch the surgery data if date range is available
                if (otmFetchUsers) {
                    await fetchOTMUsers();
                } else if (fromDate && toDate) {
                    await fetchSurgeryData(fromDate, toDate);
                } else {
                    debugLog('No date range provided; token should be captured by now. Closing tab.');
                    sendMessageToParent('progress', { step: 'token_ready', message: 'Token đã sẵn sàng' });
                    closeTab();
                }

            } else {
                debugLog('Không tìm thấy submenu "Đặt hẹn Lịch mổ"');
                debugLog('Debug: Current URL:', window.location.href);
                debugLog('Debug: Page title:', document.title);
                sendMessageToParent('error', { message: 'Không tìm thấy submenu "Đặt hẹn Lịch mổ"' });
                closeTab();
            }

        } catch (error) {
            console.error('Lỗi trong quá trình automation:', error);
            sendMessageToParent('error', { message: 'Lỗi trong quá trình tự động hóa: ' + error.message });
            closeTab();
        }
    }

    // Fetch OTM users list and return to parent
    async function fetchOTMUsers() {
        try {
            sendMessageToParent('progress', { step: 'token_wait', message: 'Đang chờ token xác thực...' });
            let attempts = 0;
            while (!bearerToken && attempts < 10) {
                await new Promise(r => setTimeout(r, 1000));
                attempts++;
            }
            if (!bearerToken) {
                sendMessageToParent('error', { message: 'Không thể lấy token xác thực sau 10 lần thử' });
                closeTab();
                return;
            }

            const query = 'ishsoft=null&page=1&limit=10000';
            const url = `https://otm.tahospital.vn/api/user?${query}&_=${Date.now()}`;
            debugLog('Fetching OTM users:', url);
            debugLog('Using Bearer token (prefix):', (bearerToken || '').slice(0, 12) + '...');

            const res = await fetch(url, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                    'authorization': `Bearer ${bearerToken}`,
                    'logintype': '2',
                    'priority': 'u=1, i',
                    'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'siteid': '1'
                },
                referrer: 'https://otm.tahospital.vn/surgery/booking',
                body: null,
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                credentials: 'include'
            });

            debugLog('Users fetch status:', res.status, 'ok:', res.ok);
            debugLog('Users fetch headers etag:', res.headers && res.headers.get ? res.headers.get('etag') : undefined);
            let effectiveRes = res;
            if (res.status === 304) {
                // Retry once without caches using a cache-busting param
                debugLog('Received 304 for OTM users. Retrying with cache-busting...');
                const bustUrl = `${url}&_=${Date.now()}`;
                const retry = await fetch(bustUrl, {
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                        'authorization': `Bearer ${bearerToken}`,
                        'logintype': '2',
                        'siteid': '1'
                    },
                    referrer: 'https://otm.tahospital.vn/surgery/booking',
                    body: null,
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-store',
                    credentials: 'include'
                });
                effectiveRes = retry;
                debugLog('Retry users fetch status:', effectiveRes.status, 'ok:', effectiveRes.ok);
            }

            if (!effectiveRes.ok) {
                if (effectiveRes.status === 401 || effectiveRes.status === 403) {
                    sendMessageToParent('progress', { step: 'token_invalid', message: 'Token hết hạn, chuyển sang tự động hóa để lấy token mới...' });
                    startAutomation();
                    return;
                }
                throw new Error('HTTP ' + effectiveRes.status);
            }
            let json;
            try {
                json = await effectiveRes.json();
            } catch (parseErr) {
                debugLog('Users JSON parse error:', parseErr);
                try {
                    const txt = await effectiveRes.clone().text();
                    debugLog('Users raw text (first 300 chars):', (txt || '').slice(0, 300));
                } catch {}
                throw parseErr;
            }

            const keys = json && typeof json === 'object' ? Object.keys(json) : [];
            debugLog('Users response type:', Array.isArray(json) ? 'array' : typeof json, 'keys:', keys);

            function pickArrayPayload(obj) {
                if (Array.isArray(obj)) return { arr: obj, via: 'root' };
                if (!obj || typeof obj !== 'object') return { arr: [], via: 'none' };
                const candidates = ['data', 'items', 'result', 'rows', 'content', 'users', 'records', 'list'];
                for (const k of candidates) {
                    const v = obj[k];
                    if (Array.isArray(v)) return { arr: v, via: k };
                    if (v && typeof v === 'object') {
                        for (const kk of candidates) {
                            const v2 = v[kk];
                            if (Array.isArray(v2)) return { arr: v2, via: `${k}.${kk}` };
                        }
                    }
                }
                return { arr: [], via: 'not_found' };
            }

            const { arr: usersArray, via } = pickArrayPayload(json);
            debugLog('Users array source:', via, 'length:', usersArray.length || 0);
            let users = (usersArray || []).map(u => ({ id: u.id ?? u.taid ?? u.userid ?? u.userId ?? null, fullname: u.fullname || u.fullName || u.name || '' }));

            if ((users?.length || 0) === 0) {
                // Extra diagnostics for empty payloads
                debugLog('Empty users after parse. Sample payload snapshot:', JSON.stringify(json).slice(0, 400));
                sendMessageToParent('progress', { step: 'users_empty', via, keys, hint: 'Parsed 0 users from payload', url });

                // Optional fallback: drop ishsoft param if enabled
                if (localStorage.getItem('dr_otm_users_alt') === 'drop_ishsoft') {
                    const altUrl = 'https://otm.tahospital.vn/api/user?page=1&limit=10000&_=' + Date.now();
                    debugLog('Fallback fetch without ishsoft:', altUrl);
                    sendMessageToParent('progress', { step: 'users_alt_fetch', message: 'Thử lại không có ishsoft', altUrl });
                    const altRes = await fetch(altUrl, {
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                            'authorization': `Bearer ${bearerToken}`,
                            'logintype': '2',
                            'priority': 'u=1, i',
                            'sec-ch-ua': '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': '"Windows"',
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'same-origin',
                            'siteid': '1'
                        },
                        referrer: 'https://otm.tahospital.vn/surgery/booking',
                        body: null,
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-store',
                        credentials: 'include'
                    });
                    if (altRes.ok) {
                        let altJson;
                        try { altJson = await altRes.json(); } catch {}
                        const altKeys = altJson && typeof altJson === 'object' ? Object.keys(altJson) : [];
                        const pickAlt = pickArrayPayload(altJson);
                        debugLog('Alt users array source:', pickAlt.via, 'length:', (pickAlt.arr || []).length || 0, 'keys:', altKeys);
                        users = (pickAlt.arr || []).map(u => ({ id: u.id ?? u.taid ?? u.userid ?? u.userId ?? null, fullname: u.fullname || u.fullName || u.name || '' }));
                        sendMessageToParent('progress', { step: 'users_alt_parsed', count: users.length, via: pickAlt.via });
                    } else {
                        debugLog('Alt users fetch failed:', altRes.status);
                        sendMessageToParent('progress', { step: 'users_alt_failed', status: altRes.status });
                    }
                }
            }

            // Emit a parse summary to parent for debugging
            const sample = (users || []).slice(0, 3).map(u => u.fullname);
            sendMessageToParent('progress', { step: 'users_parsed', count: users.length, via, sample });

            sendMessageToParent('success', {
                otmUsers: users,
                count: users.length,
                summary: `Đã tải ${users.length} người dùng từ OTM`
            });
            closeTab();
        } catch (e) {
            sendMessageToParent('error', { message: 'Lỗi khi lấy DS người dùng OTM: ' + (e.message || e) });
            closeTab();
        }
    }

    // Function to fetch surgery data for a date range
    async function fetchSurgeryData(fromDate, toDate) {
        try {
            debugLog('=== STARTING SURGERY DATA FETCH ===');
            // Keep original requested range for reporting
            const requestedFrom = fromDate;
            const requestedTo = toDate;
            debugLog('Requested range:', requestedFrom, 'to', requestedTo);

            // Send progress update to parent
            sendMessageToParent('progress', { step: 'token_wait', message: 'Đang chờ token xác thực...' });

            // Wait for token if not available yet
            let attempts = 0;
            while (!bearerToken && attempts < 10) {
                debugLog(`Waiting for Bearer token... (attempt ${attempts + 1}/10)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            if (!bearerToken) {
                debugLog('No Bearer token captured after 10 attempts');
                sendMessageToParent('error', { message: 'Không thể lấy token xác thực sau 10 lần thử' });
                closeTab();
                return;
            }

            debugLog('Bearer token available:', bearerToken.substring(0, 20) + '...');
            sendMessageToParent('progress', { step: 'token_ready', message: 'Token đã sẵn sàng, đang lấy dữ liệu...' });

            // Generate array of dates from requestedFrom to requestedTo (inclusive)
            function toDateOnly(dateStr) {
                // Always treat as date-only without timezone shifting
                const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
                return new Date(Date.UTC(y, (m - 1), d)); // UTC midnight for stability
            }
            const dates = [];
            const startDate = toDateOnly(requestedFrom);
            const endDate = toDateOnly(requestedTo);
            const cur = new Date(startDate.getTime());
            while (cur.getTime() <= endDate.getTime()) {
                const y = cur.getUTCFullYear();
                const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
                const d = String(cur.getUTCDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${d}`);
                cur.setUTCDate(cur.getUTCDate() + 1);
            }

            debugLog('Dates to fetch:', dates);

            const allSurgeryData = [];
            let totalSurgeries = 0;

            const getConcurrencyLimit = () => {
                const raw = localStorage.getItem('dr_otm_concurrency');
                const n = parseInt(raw ?? '3', 10);
                return isNaN(n) ? 3 : Math.min(Math.max(n, 1), 6);
            };

            async function fetchDateData(currentDate) {
                sendMessageToParent('progress', {
                    step: 'api_call',
                    message: `Đang gọi API cho ngày ${currentDate}...`
                });

                // Use the exact date string with T17 to match other usages in the system (e.g. otm.token.js)
                // This ensures we request the correct date rather than shifting backwards by one day
                const isoDate = `${currentDate}T17:00:00.000Z`;

                debugLog(`Fetching data for date: ${currentDate} (ISO: ${isoDate})`);
                sendMessageToParent('progress', { step: 'api_call', message: `GET /api/booking?date=${isoDate}`, currentDate, isoDate });

                let response = await fetch(`https://otm.tahospital.vn/api/booking?date=${isoDate}`, {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                        "authorization": `Bearer ${bearerToken}`,
                        "logintype": "2",
                        "priority": "u=1, i",
                        "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "siteid": "1"
                    },
                    referrer: "https://otm.tahospital.vn/surgery/booking",
                    body: null,
                    method: "GET",
                    mode: "cors",
                    cache: "no-store",
                    credentials: "include"
                });
                if (response.status === 304) {
                    debugLog(`Received 304 for ${currentDate}. Retrying with cache-busting...`);
                    const retryUrl = `https://otm.tahospital.vn/api/booking?date=${isoDate}&_=${Date.now()}`;
                    response = await fetch(retryUrl, {
                        headers: {
                            "accept": "application/json, text/plain, */*",
                            "authorization": `Bearer ${bearerToken}`,
                            "logintype": "2",
                            "siteid": "1"
                        },
                        referrer: "https://otm.tahospital.vn/surgery/booking",
                        body: null,
                        method: "GET",
                        mode: "cors",
                        cache: "no-store",
                        credentials: "include"
                    });
                }

                if (!response.ok) {
                    debugLog(`HTTP error for ${currentDate}: ${response.status}`);
                    if (response.status === 401 || response.status === 403) {
                        const err = new Error('Unauthorized');
                        err.__unauthorized = true;
                        throw err;
                    }
                    return { surgeriesWithDate: [], count: 0 };
                }
                let data;
                try { data = await response.json(); }
                catch (parseErr) {
                    debugLog('Booking JSON parse error:', parseErr);
                    try { const raw = await response.clone().text(); debugLog('Booking raw (first 300):', (raw||'').slice(0,300)); } catch {}
                    return { surgeriesWithDate: [], count: 0 };
                }
                debugLog(`Surgery data received for ${currentDate}:`, data);
                if (!Array.isArray(data) || data.length === 0) return { surgeriesWithDate: [], count: 0 };

                const surgeriesWithDate = data.map(surgery => ({ ...surgery, fetchDate: currentDate }));
                debugLog(`Full surgery data for ${currentDate}:`, data);
                return { surgeriesWithDate, count: data.length };
            }

            const concurrency = getConcurrencyLimit();
            let unauthorizedDetected = false;
            for (let i = 0; i < dates.length; i += concurrency) {
                const batch = dates.slice(i, i + concurrency);
                const results = await Promise.allSettled(batch.map(d => fetchDateData(d)));

                for (const res of results) {
                    if (res.status === 'rejected') {
                        if (res.reason && res.reason.__unauthorized) {
                            unauthorizedDetected = true;
                            break;
                        } else {
                            debugLog('Batch fetch error:', res.reason);
                        }
                    } else if (res.value) {
                        const { surgeriesWithDate, count } = res.value;
                        if (count > 0) {
                            totalSurgeries += count;
                            allSurgeryData.push(...surgeriesWithDate);
                        }
                    }
                }

                if (unauthorizedDetected) {
                    sendMessageToParent('progress', { step: 'token_invalid', message: 'Token hết hạn, chuyển sang tự động hóa để lấy token mới...' });
                    startAutomation();
                    return;
                }

                // Small delay between batches to avoid rate limiting
                if (i + concurrency < dates.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            sendMessageToParent('progress', { step: 'data_received', message: 'Đã nhận dữ liệu từ API', days: dates.length, totalCandidate: allSurgeryData.length });

            // Send success data to parent with all collected data (raw + filtered)
            const filteredSurgeryData = filterSurgeryData(allSurgeryData);
            if (filteredSurgeryData.length > 0) {
                const message = `Tìm thấy tổng cộng ${totalSurgeries} ca mổ từ ${requestedFrom} đến ${requestedTo}:\n\n` +
                    allSurgeryData.map((item, index) => 
                        `${index + 1}. ${item.customer?.fullname || 'N/A'} - ${item.surgerymethod || 'N/A'} (${item.fetchDate})`
                    ).join('\n');

                sendMessageToParent('success', {
                    surgeryData: filteredSurgeryData,
                    surgeryDataRaw: allSurgeryData,
                    count: filteredSurgeryData.length,
                    dateRange: { from: requestedFrom, to: requestedTo },
                    summary: message
                });

                debugLog('=== SURGERY DATA FETCH COMPLETED SUCCESSFULLY ===');
                debugLog(`Total surgeries found (filtered): ${filteredSurgeryData.length}`);
            } else {
                sendMessageToParent('success', {
                    surgeryData: [],
                    surgeryDataRaw: allSurgeryData,
                    count: 0,
                    dateRange: { from: requestedFrom, to: requestedTo },
                    summary: `Không tìm thấy dữ liệu mổ từ ${requestedFrom} đến ${requestedTo}`
                });
            }

            // Small delay to let storage events propagate before closing
            setTimeout(() => { try { closeTab(); } catch(_) {} }, 350);

        } catch (error) {
            debugLog('Error fetching surgery data:', error);
            debugLog('Lỗi khi lấy dữ liệu mổ: ' + error.message);
            sendMessageToParent('error', {
                message: 'Lỗi khi lấy dữ liệu mổ: ' + error.message,
                error: error.toString()
            });
            setTimeout(() => { try { closeTab(); } catch(_) {} }, 350);
        }
    }

    // Start automation when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // checkExistingToken() is already called at the top
        });
    } else {
        // checkExistingToken() is already called at the top
    }

})();

},{}],30:[function(require,module,exports){
(function (global){(function (){
// dashboard.js

const Utils = require('../utils');
const {
    addGlobalStyles
} = require('./page.dashboard.support');

// Import cài đặt giao diện
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

// Import refactored modules
const PatientService = require('../services/patientService');
const ChecklistService = require('../services/checklistService');
const SettingsService = require('../services/settingsService');
const ApiService = require('../services/apiService');
const PatientDataMapper = require('../utils/patientDataMapper');
const ModalManager = require('../components/modalManager');
const LoginHandler = require('../components/loginHandler');

// Import newly refactored components
const { removeAccents, hasAccents } = require('../utils/textUtils');
const { createPatientInfoSection } = require('../components/patientInfoSection');
const cardTooltip = require('../components/cardTooltip');
const SidebarSession = require('../components/sidebarSession');
const { createYLenhTags, updatePatientCardTags, hasDischargeTag, updateMedsDoneBadge } = require('../utils/tagUtils');
const { setupPhauThuatHandlers } = require('../components/phauThuatHandlers');
const { setupAdvancedFilter, matchesAdvancedFilter, advancedFilterState } = require('../components/advancedFilter');
const { setupCopyMenu } = require('../components/copyMenu');
const { createResponsiveDropdownController } = require('../components/responsiveDropdown');

// Import utility functions
const { showToast, copyToClipboard } = require('../utils/uiUtils');
const { addSurgeryStatusIcon, formatSurgeryInfo, updatePatientCardPhauThuat } = require('../utils/surgeryUtils');
const { escapeHtml } = require('../utils/htmlUtils');
const DomUpdaters = require('../utils/domUpdaters');
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('../utils/checklistUtils');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const DateUtils = require('../utils/dateUtils');
const { getTodayISODate, isDischargeEntryOnDate } = require('../utils/dischargeUtils');

// Global variable for OTM tabs
if (typeof window !== 'undefined') {
    window.openTabs = window.openTabs || [];
} else if (typeof global !== 'undefined') {
    global.openTabs = global.openTabs || [];
} else {
    this.openTabs = this.openTabs || [];
}

function showDashboardBenhNhanIfNeeded() {
    // Use global openTabs variable for OTM tabs
    if (!window.openTabs) window.openTabs = [];
    let openTabs = window.openTabs;

    if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
    
    // Set page title
    document.title = 'Dashboard by drquochoai';
    
    addGlobalStyles(); // Đảm bảo style chỉ chèn 1 lần

    // Make utility functions globally available for onclick handlers
    // Không sử dụng window để tránh lỗi undefined - sử dụng global assignment trực tiếp
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.showToast = showToast;
        unsafeWindow.copyToClipboard = copyToClipboard;
        unsafeWindow.copyYLenhText = copyYLenhText;
        unsafeWindow.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
        unsafeWindow.updatePatientCardHXT = DomUpdaters.updateHXT;
        unsafeWindow.updatePatientCardCDKT = DomUpdaters.updateCDKT;
    } else if (typeof this !== 'undefined') {
        this.showToast = showToast;
        this.copyToClipboard = copyToClipboard;
        this.copyYLenhText = copyYLenhText;
        this.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
        this.updatePatientCardHXT = DomUpdaters.updateHXT;
        this.updatePatientCardCDKT = DomUpdaters.updateCDKT;
    } else {
        // Fallback - tạo global functions không qua window
        globalThis.showToast = showToast;
        globalThis.copyToClipboard = copyToClipboard;
        globalThis.copyYLenhText = copyYLenhText;
        globalThis.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
        globalThis.updatePatientCardHXT = DomUpdaters.updateHXT;
        globalThis.updatePatientCardCDKT = DomUpdaters.updateCDKT;
    }

    // Styles are injected via addGlobalStyles() only

    const checklistItems = BS_CAI_DAT.checklistItems;
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;
    const VIEW_KEY = 'dr-card-view';
    const CARD_HOVER_TOOLTIP_KEY = cardTooltip.STORAGE_KEY || 'dr-card-hover-preview';
    const DASHBOARD_CLOUD_KEYS = [
        VIEW_KEY,
        'dr-view-mode',
        CARD_HOVER_TOOLTIP_KEY,
        'dr-filter-type',
        'dr-filter-khoa',
        'dr-tracking-pids'
    ];
    let dashboardCloudContext = {
        doctorName: '',
        chungThuSo: '',
        checklistObj: null,
        settings: SettingsService.getDefaultSettings(),
        cloudAccounts: [],
        bootstrapLoaded: false
    };
    let dashboardSaveTimeout = null;
    let khoaSelectRefreshToken = 0;
    let khoaSelectOptionsCache = null;
    let lastManualKhoaId = '';
    let dashboardAutoRefreshBusy = false;
    const DASHBOARD_AUTO_REFRESH_MS = 45000;
    let dashboardAutoRefreshDeadline = 0;
    let dashboardAutoRefreshTickInterval = null;

    function getActiveDashboardKhoaId() {
        return String(getSelectedKhoa('551') || window.dr_data_khoa_id || '551').trim();
    }

    function setDashboardAutoRefreshStatus(text, isBusy) {
        const el = document.getElementById('dr-dashboard-refresh-countdown');
        if (!el) return;
        el.textContent = text || '';
        el.dataset.busy = isBusy ? '1' : '0';
    }

    function resetDashboardAutoRefreshCountdown() {
        dashboardAutoRefreshDeadline = Date.now() + DASHBOARD_AUTO_REFRESH_MS;
        const remaining = Math.max(0, dashboardAutoRefreshDeadline - Date.now());
        setDashboardAutoRefreshStatus(`↻ ${Math.max(1, Math.ceil(remaining / 1000))}s`, false);
    }

    async function runDashboardAutoRefresh() {
        if (dashboardAutoRefreshBusy) return;
        dashboardAutoRefreshBusy = true;
        setDashboardAutoRefreshStatus('Đang làm mới...', true);

        try {
            const activeKhoaId = getActiveDashboardKhoaId();
            if (activeKhoaId) {
                window.dr_data_khoa_id = activeKhoaId;
                try { localStorage.setItem('bsnt_khoa_dashboard', activeKhoaId); } catch (_) {}
            }

            const basicFresh = await PatientService.fetchPatientData();
            if (!basicFresh || !Array.isArray(basicFresh)) return;

            const enrichedFresh = await PatientService.enrichPatientDataWithChecklist(basicFresh);
            if (!enrichedFresh || !Array.isArray(enrichedFresh)) return;

            window.dr_data = enrichedFresh;
            window.dr_data_khoa_id = activeKhoaId;

            const filteredFresh = filterDataByAccessibleKhoa(enrichedFresh, dashboardCloudContext.settings || {});
            const refreshFn = (typeof globalThis.refreshPatientCards === 'function')
                ? globalThis.refreshPatientCards
                : null;

            const domEls = Array.from(document.querySelectorAll('.dr-card[data-mabn], .dr-list-row[data-mabn]'));
            const domSet = new Set(domEls.map(el => String(el.getAttribute('data-mabn') || '').trim()).filter(Boolean));
            const dataSet = new Set(filteredFresh.map(p => String((p && p.mabn) || '').trim()).filter(Boolean));
            let sameSet = domSet.size === dataSet.size;
            if (sameSet) {
                for (const mabn of dataSet) {
                    if (!domSet.has(mabn)) {
                        sameSet = false;
                        break;
                    }
                }
            }

            const sidebarActive = !!(SidebarSession.getCurrent && SidebarSession.getCurrent().id);
            if (!sameSet && !sidebarActive) {
                renderCards(filteredFresh);
                if (refreshFn) {
                    refreshFn(filteredFresh);
                }
                if (typeof checkAllCelebrationAnimations === 'function') {
                    checkAllCelebrationAnimations(filteredFresh);
                }
                return;
            }

            if (refreshFn) {
                refreshFn(filteredFresh);
            }
            if (typeof checkAllCelebrationAnimations === 'function') {
                checkAllCelebrationAnimations(filteredFresh);
            }
        } catch (e) {
            console.warn('Dashboard auto refresh failed:', e);
        } finally {
            dashboardAutoRefreshBusy = false;
            resetDashboardAutoRefreshCountdown();
        }
    }

    function ensureDashboardAutoRefreshLoop() {
        if (!dashboardAutoRefreshTickInterval) {
            dashboardAutoRefreshTickInterval = setInterval(() => {
                if (dashboardAutoRefreshBusy) {
                    setDashboardAutoRefreshStatus('↻ ...', true);
                    return;
                }

                const remaining = dashboardAutoRefreshDeadline - Date.now();
                if (remaining <= 0) {
                    runDashboardAutoRefresh();
                    return;
                }

                setDashboardAutoRefreshStatus(`↻ ${Math.max(1, Math.ceil(remaining / 1000))}s`, false);
            }, 1000);
        }

        resetDashboardAutoRefreshCountdown();
    }

    function applyCardHoverTooltipSetting() {
        if (localStorage.getItem(CARD_HOVER_TOOLTIP_KEY) === null) {
            localStorage.setItem(CARD_HOVER_TOOLTIP_KEY, '1');
        }
        if (cardTooltip && typeof cardTooltip.setEnabled === 'function') {
            cardTooltip.setEnabled(localStorage.getItem(CARD_HOVER_TOOLTIP_KEY) !== '0');
        }
    }

    function applyDashboardSettingsToLocalStorage(dashboardSettings) {
        if (!dashboardSettings || typeof dashboardSettings !== 'object') return;

        Object.keys(dashboardSettings).forEach((key) => {
            const value = dashboardSettings[key];
            if (value === undefined || value === null) return;
            localStorage.setItem(key, String(value));
        });

        if (!dashboardSettings[VIEW_KEY] && dashboardSettings['dr-view-mode']) {
            localStorage.setItem(VIEW_KEY, String(dashboardSettings['dr-view-mode']));
        }
    }

    function readDashboardSettingsFromLocalStorage() {
        const dashboardSettings = {};
        DASHBOARD_CLOUD_KEYS.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value !== null) dashboardSettings[key] = value;
        });

        if (dashboardSettings['dr-view-mode'] && !dashboardSettings[VIEW_KEY]) {
            dashboardSettings[VIEW_KEY] = dashboardSettings['dr-view-mode'];
        }

        return dashboardSettings;
    }

    function getAccessibleKhoaIds(settingsObj) {
        const userInfo = settingsObj && settingsObj.userInfo ? settingsObj.userInfo : {};
        const ids = Array.isArray(userInfo.accessibleKhoaIds)
            ? userInfo.accessibleKhoaIds
            : (Array.isArray(userInfo.accessibleKhoa) ? userInfo.accessibleKhoa.map((it) => it && it.id) : []);
        return (ids || []).map((id) => String(id || '').trim()).filter(Boolean);
    }

    function filterDataByAccessibleKhoa(data, settingsObj) {
        if (!Array.isArray(data)) return [];
        const ids = getAccessibleKhoaIds(settingsObj);
        if (!ids.length) return data;
        const allowSet = new Set(ids);
        return data.filter((item) => allowSet.has(String((item && item.makp) || '').trim()));
    }

    function getDashboardPreferredKhoaId() {
        try {
            const stored = String(localStorage.getItem('bsnt_khoa_dashboard') || '').trim();
            if (stored) return stored;
        } catch (_) {}

        const userInfo = ((dashboardCloudContext.settings || {}).userInfo) || {};
        const preferred = String(userInfo.workingKhoaId || userInfo.defaultKhoaId || '').trim();
        if (preferred) return preferred;

        return String(getSelectedKhoa('551') || '551').trim();
    }

    async function initializeKhoaSelect(preferredKhoaId) {
        const select = document.getElementById('dr-khoa-select');
        if (!select) return '';

        select.innerHTML = '<option value="">Đang tải khoa...</option>';
        await refreshKhoaSelectByAccess({
            reloadDataIfChanged: false,
            forceReloadList: !Array.isArray(khoaSelectOptionsCache) || !khoaSelectOptionsCache.length,
            preferredKhoaId: preferredKhoaId
        });

        return String(select.value || preferredKhoaId || '').trim();
    }

    async function refreshKhoaSelectByAccess({ reloadDataIfChanged = false, forceReloadList = false, preferredKhoaId = '' } = {}) {
        const select = document.getElementById('dr-khoa-select');
        if (!select) return;

        const requestId = ++khoaSelectRefreshToken;
        const previousValue = String(select.value || preferredKhoaId || window.dr_data_khoa_id || getSelectedKhoa('551'));

        // Debug instrumentation to help diagnose auto-refresh selection issues
        try {
            console.debug('[dr] refreshKhoaSelectByAccess start', {
                requestId,
                previousValue,
                preferredKhoaId: String(preferredKhoaId || ''),
                window_dr_data_khoa_id: String(window.dr_data_khoa_id || ''),
                localStorage_bsnt: (function(){ try { return localStorage.getItem('bsnt_khoa_dashboard'); } catch(e){ return '<err>'; } })()
            });
        } catch (_) {}

        try {
            select.disabled = true;
            let list = khoaSelectOptionsCache;
            if (forceReloadList || !Array.isArray(list) || !list.length) {
                list = await ApiService.fetchKhoaPhong();
                khoaSelectOptionsCache = Array.isArray(list) ? list : [];
            }
            if (requestId !== khoaSelectRefreshToken) return;

            const userInfo = ((dashboardCloudContext.settings || {}).userInfo) || {};
            const accessibleIds = getAccessibleKhoaIds(dashboardCloudContext.settings || {});
            const allowSet = new Set(accessibleIds);
            const defaultAllowedList = accessibleIds.length
                ? list.filter((k) => allowSet.has(String((k && k.id) || '').trim()))
                : list;

            let filteredList = defaultAllowedList;
            if (accessibleIds.length) {
                const mapById = new Map();
                defaultAllowedList.forEach((k) => {
                    const id = String((k && k.id) || '').trim();
                    if (!id) return;
                    mapById.set(id, {
                        id,
                        name: String((k && k.name) || id)
                    });
                });

                const accessibleMeta = Array.isArray(userInfo.accessibleKhoa) ? userInfo.accessibleKhoa : [];
                accessibleIds.forEach((id) => {
                    if (mapById.has(id)) return;
                    const meta = accessibleMeta.find((x) => String((x && x.id) || '').trim() === id);
                    mapById.set(id, {
                        id,
                        name: (meta && meta.name) ? String(meta.name) : `Khoa ${id}`
                    });
                });

                filteredList = Array.from(mapById.values());
            }

            select.innerHTML = '';
            if (!filteredList.length) {
                select.innerHTML = '<option value="">Khong co khoa duoc cap quyen</option>';
                select.disabled = true;
                return;
            }

            filteredList.forEach((k) => {
                const opt = document.createElement('option');
                opt.value = String(k.id);
                opt.textContent = k.name || k.id;
                select.appendChild(opt);
            });

            let nextValue = String(previousValue || preferredKhoaId || window.dr_data_khoa_id || getSelectedKhoa('551') || '').trim();
            try {
                const ids = filteredList.map(k => String(k.id));
                console.debug('[dr] refreshKhoaSelectByAccess candidates', { ids, preferredKhoaId: nextValue, previousValue });
            } catch (_) {}

            if (!filteredList.some((k) => String(k.id) === nextValue)) {
                const storedFallback = (function(){ try { return localStorage.getItem('bsnt_khoa_dashboard'); } catch(e){ return ''; } })();
                const fallbackPreferred = String(preferredKhoaId || window.dr_data_khoa_id || storedFallback || getSelectedKhoa('551') || '').trim();
                if (filteredList.some((k) => String(k.id) === fallbackPreferred)) {
                    nextValue = fallbackPreferred;
                } else {
                    nextValue = String(filteredList[0].id || '');
                }
            }
            try {
                console.debug('[dr] refreshKhoaSelectByAccess chose', { nextValue });
            } catch (_) {}

            if (nextValue) {
                select.value = nextValue;
                window.dr_data_khoa_id = nextValue;
                try { localStorage.setItem('bsnt_khoa_dashboard', nextValue); } catch (_) {}
            }
            select.disabled = false;

            if (reloadDataIfChanged && nextValue && nextValue !== previousValue) {
                const selectedOpt = select.options[select.selectedIndex];
                const selectedName = (selectedOpt && selectedOpt.textContent) || nextValue;
                await reloadDashboardForSelectedKhoa(selectedName);
            }
        } catch (e) {
            console.warn('Refresh khoa select failed', e);
            select.disabled = false;
        }
    }

    function applyRealtimeUserInfo(detail) {
        const userInfo = detail && detail.userInfo;
        if (!userInfo || typeof userInfo !== 'object') return;

        dashboardCloudContext.settings = {
            ...(dashboardCloudContext.settings || SettingsService.getDefaultSettings()),
            userInfo: {
                ...(((dashboardCloudContext.settings || {}).userInfo) || {}),
                ...userInfo
            }
        };

        refreshKhoaSelectByAccess({ reloadDataIfChanged: true, forceReloadList: true });
    }

    function setKhoaLoadingStatus(text, isError) {
        const el = document.getElementById('dr-khoa-loading-status');
        if (!el) return;
        el.textContent = text || '';
        el.style.color = isError ? '#b91c1c' : '#475569';
    }

    async function reloadDashboardForSelectedKhoa(selectedName) {
        const khoaName = String(selectedName || '').trim() || 'khoa da chon';
        setKhoaLoadingStatus(`Dang tai thong tin ${khoaName}...`);
        showToast(`Dang tai thong tin ${khoaName}...`, 'info', 1800);

        try {
            const fresh = await PatientService.loadPatientDataWithErrorHandling({ forceRefresh: true });
            if (!fresh) {
                setKhoaLoadingStatus('Khong tai duoc du lieu khoa/phong', true);
                return;
            }

            // PatientService background enrichment already calls checklist endpoint
            // DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien for checklist details.
            renderCards(filterDataByAccessibleKhoa(fresh, dashboardCloudContext.settings || {}));
            setKhoaLoadingStatus('');
        } catch (e) {
            console.warn('Reload dashboard by khoa failed', e);
            setKhoaLoadingStatus('Loi tai du lieu khoa/phong', true);
            showToast('Loi tai du lieu khoa/phong', 'error', 2200);
        }
    }

    if (!window.__drUserInfoSyncBound) {
        window.__drUserInfoSyncBound = true;

        window.addEventListener('dr-user-info-updated', (event) => {
            applyRealtimeUserInfo(event && event.detail);
        });

        window.addEventListener('storage', (event) => {
            if (!event || event.key !== 'dr_user_info_sync' || !event.newValue) return;
            try {
                const payload = JSON.parse(event.newValue);
                applyRealtimeUserInfo(payload);
            } catch (_) {}
        });
    }

    async function ensureDashboardChecklistObj() {
        if (dashboardCloudContext.checklistObj) return dashboardCloudContext.checklistObj;
        if (!dashboardCloudContext.chungThuSo) return null;

        const created = await SettingsService.createSettingsPhieu({
            name: dashboardCloudContext.doctorName,
            chungThuSo: dashboardCloudContext.chungThuSo
        });
        if (created && created.isValid) {
            dashboardCloudContext.checklistObj = await SettingsService.loadSettingsPhieu(dashboardCloudContext.chungThuSo);
        }
        return dashboardCloudContext.checklistObj;
    }

    async function persistDashboardSettingsToCloud({ silent = true } = {}) {
        try {
            const checklistObj = await ensureDashboardChecklistObj();
            if (!checklistObj) return false;

            const nextSettings = {
                ...(dashboardCloudContext.settings || SettingsService.getDefaultSettings()),
                dashboard: {
                    ...((dashboardCloudContext.settings && dashboardCloudContext.settings.dashboard) || {}),
                    ...readDashboardSettingsFromLocalStorage()
                }
            };

            const ok = await SettingsService.updateSettingsState(checklistObj, nextSettings);
            if (ok) {
                dashboardCloudContext.settings = nextSettings;
                return true;
            }

            if (!silent) showToast('Không thể lưu cài đặt dashboard', 'error', 2500);
            return false;
        } catch (e) {
            console.warn('Persist dashboard settings failed', e);
            if (!silent) showToast('Không thể lưu cài đặt dashboard', 'error', 2500);
            return false;
        }
    }

    function scheduleDashboardSettingsSync() {
        clearTimeout(dashboardSaveTimeout);
        dashboardSaveTimeout = setTimeout(() => {
            persistDashboardSettingsToCloud({ silent: true });
        }, 800);
    }

    // Helper function to create checklist section
    async function createChecklistSectionAsync(patient) {
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
                btn.addEventListener('click', function () {
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

        // Load both checklists asynchronously
        const bomoList = checklistDiv.querySelector('#checklist-bomo');
        const xuatvienList = checklistDiv.querySelector('#checklist-xuatvien');

        // Await the async loadChecklist for bomo
        if (bomoList) {
            await loadChecklist(patient, bomoList, 'bomo');
        }

        // For xuatvien, it's not async but we can wait a bit for the setTimeout
        if (xuatvienList) {
            loadChecklistXuatVien(patient, xuatvienList);
            // Wait for the setTimeout in loadChecklistXuatVien
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        return checklistDiv;
    }

    // Helper function to load checklist data
    async function loadChecklist(patient, checklistUl, checklistType = 'bomo', retryCount = 0) {
        try {
            checklistUl.innerHTML = '<li>Đang tải checklist...</li>';

            const result = await ChecklistService.loadChecklistBundle(patient, {
                forceRefresh: true,
                createIfMissing: true
            });
            checklistUl.innerHTML = '';

            if (!result || !result.checklistObj) {
                checklistUl.innerHTML = '<li>Không có dữ liệu checklist bệnh nhân</li>';
                return;
            }

            const checklistObj = result.checklistObj;

            window.checklistObj = checklistObj;
            // Parse into a fresh object; avoid leaking prior patient's HXT into others
            window.checklistState = { ...result.state };
            try { patient.checklistState = { ...result.state }; } catch (_) {}
            // Merge standardized OTM surgeries (if any) for this patient into state (append-only)
            try {
                const otmLogs = Array.isArray(patient && patient._otmPhauThuatLog) ? patient._otmPhauThuatLog : [];
                if (otmLogs.length > 0) {
                    if (!Array.isArray(window.checklistState.phauThuatLog)) window.checklistState.phauThuatLog = [];
                    const keyOf = (e) => `${e.date}|${e.time}|${(e.method || '').trim().toLowerCase()}`;
                    const existingKeys = new Set(window.checklistState.phauThuatLog.map(keyOf));
                    let added = 0;
                    for (const e of otmLogs) {
                        const k = keyOf(e);
                        if (!existingKeys.has(k)) {
                            window.checklistState.phauThuatLog.push({ ...e });
                            existingKeys.add(k);
                            added++;
                        }
                    }
                    if (added > 0) {
                        const parseDDMMYYYY = (s) => { const [d, m, y] = String(s || '').split('/').map(n => parseInt(n, 10)); return new Date(y || 1970, (m || 1) - 1, d || 1); };
                        const toTs = (e) => { const dt = parseDDMMYYYY(e.date); const [hh, mm] = String(e.time || '00:00').split(':').map(n => parseInt(n, 10) || 0); dt.setHours(hh, mm, 0, 0); return dt.getTime(); };
                        window.checklistState.phauThuatLog.sort((a, b) => toTs(b) - toTs(a));
                        // Persist silently in background using the unified checklist flow.
                        try { persistCurrentChecklistState(); } catch (_) { }
                    }
                }
            } catch (e) { console.warn('OTM merge into checklistState failed', e); }

            try { require('../utils/stateSync').syncPatientStateToGlobal(patient.mabn, window.checklistState); } catch (_) { }

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

    async function persistCurrentChecklistState() {
        if (!window.checklistObj || !window.checklistState) return { ok: false, queued: false };
        return await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, {
            enqueueOnOffline: true,
            signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal)
        });
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
                const id = 'dr-checklist-xv-' + idx;
                const isChecked = window.checklistState && window.checklistState[`xuatvien_${item}`] || false;
                li.innerHTML = createChecklistItemHTML(item, id, isChecked, patient);
            } else if (item.children) {
                if (item.label === 'Tờ điều trị') {
                    li.innerHTML = `
                        <div style="margin-bottom:12px;">
                            <h4 style="margin:0 0 8px 0;color:#1976d2;font-weight:bold;border-bottom:2px solid #e3f2fd;padding-bottom:4px;">📋 ${item.label}</h4>
                            <ul style="margin-left:0;margin-top:8px;list-style:none;padding:0;">
                                ${item.children.map((child, childIdx) => {
                        const childId = `dr-checklist-xv-child-${idx}-${childIdx}`;
                        const isChildChecked = window.checklistState && window.checklistState[`xuatvien_${child}`] || false;
                        return `<li style="margin-bottom:4px;">${createChecklistItemHTML(child, childId, isChildChecked, patient)}</li>`;
                    }).join('')}
                            </ul>
                        </div>
                    `;
                } else {
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
            }

            checklistUl.appendChild(li);
        });

        setTimeout(() => {
            checklistUl.querySelectorAll('input[type=checkbox]').forEach((cb, idx) => {
                cb.addEventListener('change', async function () {
                    if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                        window.__drSidebarResetAutoSyncTimer();
                    }
                    const item = BS_CAI_DAT.checklistXuatVien[idx];
                    let label = '';
                    if (typeof item === 'string') {
                        label = item;
                    } else if (item.label) {
                        label = item.label;
                    } else {
                        const dataLabel = this.getAttribute('data-original-label');
                        label = dataLabel || this.parentNode.textContent.trim();
                    }
                    const key = `xuatvien_${label}`;

                    if (!window.checklistState) {
                        window.checklistState = {};
                    }

                    window.checklistState[key] = this.checked;

                    const res = await persistCurrentChecklistState();
                    if (!res || (!res.ok && !res.queued)) {
                        console.error('Lưu checklist xuất viện thất bại!');
                    }
                });
            });
        }, 10);

        window.renderChecklistXuatVien = renderChecklistXuatVien;
    }

    // Public refresh to update checklist xuất viện after sync
    window.dr_refreshChecklistXuatVien = function () {
        try {
            const ul = document.querySelector('#checklist-xuatvien');
            const activePatient = (window.dr_sidebar_ctx && window.dr_sidebar_ctx.patient) || patient;
            if (ul && window.checklistState && activePatient) {
                renderChecklistXuatVien(ul, activePatient);
            }
        } catch (_) { }
    };



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
                <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;word-break: break-word; overflow-wrap: anywhere;">
                    <button class="remove-y-lenh-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-y-lenh-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
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
                                    persistCurrentChecklistState();
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
                    <div id="dr-bs-PTV-${index}" data-field-id="dr-bs-PTV" style="font-size:0.85em;color:#555;"><strong>BS:</strong> ${entry.doctors}</div>
                </div>
            `).join('');

            // Add event listeners for remove buttons
            setTimeout(() => {
                logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
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
                                    persistCurrentChecklistState();
                                }
                            }
                        }
                    });
                });

                // Add event listeners for edit functionality
                logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                    entry.addEventListener('click', function (e) {
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

    // Helper function to render checklist items with HSBA badges and sync note
    function renderChecklistItems(checklistUl) {
        checklistUl.innerHTML = '';
        const hsbaSynced = (window.checklistState && window.checklistState.hsbaSynced) || {};
        const lastSyncAt = hsbaSynced.__lastSyncAt || null;
        const existingNote = checklistUl.parentElement && checklistUl.parentElement.querySelector('.dr-hsba-sync-note');
        if (existingNote) existingNote.remove();
        checklistItems.forEach((item, idx) => {
            const li = document.createElement('li');
            // No margin/padding; keep optional background and radius only
            let liStyle = 'border-radius:6px;';
            const id = 'dr-checklist-' + idx;
            const isChecked = !!(window.checklistState && window.checklistState[item]);
            const auto = hsbaSynced[item] && hsbaSynced[item].matched === true;
            const badge = auto ? `<span class="dr-hsba-badge" title="Đã có trong HSBA" style="color:#16a34a; font-weight:700;">✔</span>` : '';
            const hint = auto ? `<span class="dr-hsba-hint" style="color:#16a34a; font-size:12px;">(HSBA)</span>` : '';
            if (auto) {
                const hl = (BS_CAI_DAT && BS_CAI_DAT.colors && BS_CAI_DAT.colors.blueCardBackground) ? BS_CAI_DAT.colors.blueCardBackground : '#e3f2fd';
                liStyle += `background:${hl};`;
            }
            li.style = liStyle;
            li.innerHTML = `<label style="display:flex;align-items:center;gap:0;min-height:28px;"><input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''}>${item}${auto ? ' ' : ''}${badge}${auto ? ' ' : ''}${hint}</label>`;
            checklistUl.appendChild(li);
        });

        // Add sync note under list
        const note = document.createElement('div');
        note.className = 'dr-hsba-sync-note';
        note.style.cssText = 'margin-top:6px; font-size:12px; color:#64748b;';
        if (lastSyncAt) {
            const dt = new Date(lastSyncAt);
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const yyyy = dt.getFullYear();
            const hh = String(dt.getHours()).padStart(2, '0');
            const mi = String(dt.getMinutes()).padStart(2, '0');
            note.textContent = `Đồng bộ HSBA: ${dd}/${mm}/${yyyy} ${hh}:${mi}`;
        } else {
            note.textContent = 'Đồng bộ HSBA: chưa có';
        }
        checklistUl.parentElement.appendChild(note);

        // Setup checkbox change handlers
        setTimeout(() => {
            checklistUl.querySelectorAll('input[type=checkbox]').forEach((cb, idx) => {
                cb.addEventListener('change', async function () {
                    if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                        window.__drSidebarResetAutoSyncTimer();
                    }
                    const itemText = checklistItems[idx]; // Use original item text, not display text
                    window.checklistState[itemText] = this.checked;
                    const res = await persistCurrentChecklistState();
                    if (!res || (!res.ok && !res.queued)) {
                        console.error('Lưu checklist thất bại!');
                    }
                });
            });
        }, 10);
    }

    // Public refresh to update HSBA badges and note after sync
    window.dr_refreshChecklistBadges = function () {
        try {
            const ul = document.querySelector('#checklist-bomo');
            if (ul) renderChecklistItems(ul);
        } catch (_) { }
    };

    async function showSidebar(patient) {
        const backdrop = ModalManager.getOrCreateBackdrop();
        const sidebar = ModalManager.getOrCreateSidebar();

        // ─── Bug 1 fix: Clear stale global state from previous patient IMMEDIATELY ───
        // Reset shared globals so no previous patient's data leaks into new sidebar.
        window.checklistState = null;
        window.checklistObj = null;
        window.currentRemoveYLenh = null;
        window.currentRenderPhauThuatLog = null;
        window.currentRemovePhauThuat = null;
        window.currentEditPhauThuat = null;

        // Clear and setup sidebar with loading spinner right away (no stale DOM)
        sidebar.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 18px; color: #666;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 16px;">Đang tải thông tin bệnh nhân...</div>
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        // Show/reveal sidebar immediately so user sees the spinner (not old content)
        ModalManager.showModal(sidebar, backdrop);

        // Start a new session for this sidebar open
        const sessionId = SidebarSession.startSession(patient && patient.mabn);
        sidebar.style = `position:fixed;top:0;right:0;width:80vw;max-width:80vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;`;

        // Create responsive container
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            height: 100%;
        `;

        // Responsive styles are handled in addGlobalStyles()

        container.className = 'dr-sidebar-container';

        // Left column: Patient info with surgery and y lệnh
        const leftColumn = document.createElement('div');
        leftColumn.className = 'dr-sidebar-left';
        leftColumn.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        // Sidebar action buttons (reuse card actions behavior)
        const sidebarActions = document.createElement('div');
        sidebarActions.className = 'dr-sidebar-actions';
        sidebarActions.style.cssText = `
            display: flex; justify-content: flex-end; gap: 10px; 
            margin-bottom: 12px; flex-wrap: wrap;
        `;
        // Import shared action creators
        const { createToDieuTriButton, createHsbaButton, createHsbaV1Button } = require('../components/actionButtons');
        const { initCopyDienTienAI } = require('../components/copyDienTienAI');
        sidebarActions.appendChild(createToDieuTriButton({ item: patient, variant: 'full' }));
        sidebarActions.appendChild(createHsbaV1Button(patient));
        sidebarActions.appendChild(createHsbaButton({ item: patient, variant: 'full' }));

        // Copy diễn tiến button (AI) inside sidebar actions
        try {
            const btnCopy = document.createElement('button');
            btnCopy.type = 'button';
            btnCopy.className = 'btn btn-sm btn-success';
            btnCopy.textContent = 'Copy diễn tiến';
            // Copy-again icon button
            const btnCopyAgain = document.createElement('button');
            btnCopyAgain.type = 'button';
            btnCopyAgain.title = 'Copy lại';
            btnCopyAgain.className = 'btn btn-sm btn-outline-secondary';
            btnCopyAgain.style.marginLeft = '6px';
            btnCopyAgain.textContent = '📋';
            btnCopyAgain.style.display = 'none';
            btnCopy.addEventListener('click', async () => {
                // Build a minimal runner that reuses CopyDienTienAI logic with explicit mabn
                const mabn = (patient && (patient.pid || patient.mabn)) ? String(patient.pid || patient.mabn) : '';
                const wrap = document.createElement('div');
                const statusBar = document.createElement('div');
                statusBar.id = 'dr-copy-dien-tien-status';
                statusBar.style.cssText = 'margin-left:8px; font-size:12px; color:#0f172a;';
                // Place status near the button
                btnCopyAgain.insertAdjacentElement('afterend', statusBar);

                if (!mabn) {
                    const mod = require('../components/copyDienTienAI');
                    mod.setStatus(statusBar, 'Không tìm thấy MABN (pid)', '#b91c1c', true);
                    return;
                }

                // Import functions from module
                const mod = require('../components/copyDienTienAI');
                const { fetchPatientInfo } = mod.__esModule ? mod : { fetchPatientInfo: undefined };
                // Fallback: call via window by reusing internal helpers through duplicated minimal flow
                try {
                    mod.setStatus(statusBar, 'Đang lấy thông tin người bệnh...', '#0f172a', false);
                    // use internal method via module reference already loaded in bundle
                    const info = await mod.fetchPatientInfo(mabn);
                    const mavaovien = info.maVaoVien || info.mavaovien || '';
                    const ngayvv = mod.parseMMDDYYYYtoDDMMYYYY(info.ngayVV || info.ngayvv || '');
                    const maql = info.maql || '';
                    if (!mavaovien || !ngayvv || !maql) {
                        mod.setStatus(statusBar, 'Thiếu tham số (mã vào viện/ngày vào/maql)', '#b91c1c', true);
                        return;
                    }
                    const denngay = mod.todayDDMMYYYY();
                    const pdfUrl = `/todieutri/DienBien/PrintPDF?id=&mabn=${encodeURIComponent(mabn)}&mavaovien=${encodeURIComponent(mavaovien)}&tungay=${encodeURIComponent(ngayvv)}&denngay=${encodeURIComponent(denngay)}&maql=${encodeURIComponent(maql)}`;

                    mod.setStatus(statusBar, 'Đang tải và xử lý PDF...', '#0f172a', false);
                    const buf = await mod.fetchPdfArrayBuffer(pdfUrl);
                    const rawText = await mod.extractAllTextFromPdfBuffer(buf);
                    const text = mod.sanitizeCopiedText(rawText);

                    mod.setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
                    const ok = await mod.copyToClipboard(text);
                    if (ok) {
                        mod.setStatus(statusBar, 'Đã copy toàn bộ diễn tiến vào clipboard.', '#166534', true);
                        btnCopyAgain.dataset.clipboardText = text;
                        btnCopyAgain.style.display = 'inline-block';
                    } else {
                        mod.setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
                    }
                } catch (err) {
                    console.error(err);
                    mod.setStatus(statusBar, 'Lỗi: ' + (err && err.message ? err.message : 'Không rõ'), '#b91c1c', true);
                }
            });
            // Copy-again behavior
            btnCopyAgain.addEventListener('click', async () => {
                const mod = require('../components/copyDienTienAI');
                const cached = btnCopyAgain.dataset.clipboardText || '';
                const statusBar = document.getElementById('dr-copy-dien-tien-status') || document.createElement('div');
                if (!cached) {
                    mod.setStatus(statusBar, 'Chưa có dữ liệu để copy lại.', '#b91c1c', true);
                    return;
                }
                mod.setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
                const ok = await mod.copyToClipboard(cached);
                if (ok) mod.setStatus(statusBar, 'Đã copy lại vào clipboard.', '#166534', true);
                else mod.setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
            });
            sidebarActions.appendChild(btnCopy);
            sidebarActions.appendChild(btnCopyAgain);
        } catch (_) { }
        // HSBAv1 button now comes from components/actionButtons.js
        leftColumn.appendChild(sidebarActions);

        // Provide sidebar context for children (ctx id + abort signal)
        window.dr_sidebar_ctx = { id: sessionId, signal: SidebarSession.getSignal(), patient };

        // Right column: Checklist section - load checklist first so patient check state is fresh
        const rightColumn = document.createElement('div');
        rightColumn.className = 'dr-sidebar-right';
        rightColumn.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const checklistDiv = await createChecklistSectionAsync(patient);
        // Ensure the freshly loaded checklist state is merged into the patient object
        try { if (window.checklistState) patient.checklistState = { ...window.checklistState }; } catch (_) {}
        rightColumn.appendChild(checklistDiv);

        // Left column: Patient info with surgery and y lệnh (create after checklist so inputs reflect latest state)
        const info = createPatientInfoSection(patient, quickYLenhActions);
        leftColumn.appendChild(info);

        // Setup phẫu thuật handlers for the info section
        setupPhauThuatHandlers(info, patient);

        
        // Add HSBA Data tab into the same tabs bar
        try {
            const { addHSBATab } = require('../components/hsbaDataFetcher');
            addHSBATab(checklistDiv, patient);
        } catch (e) { console.warn('HSBA tab init failed', e); }

        // Add columns to container
        container.appendChild(leftColumn);
        container.appendChild(rightColumn);

        // Add container to sidebar plus an offline banner
        const offlineBanner = document.createElement('div');
        offlineBanner.className = 'dr-offline-banner';
        offlineBanner.textContent = 'Đang offline — thay đổi sẽ được lưu tạm và đồng bộ khi có mạng.';
        sidebar.appendChild(offlineBanner);
        // Replace loading content with actual content
        sidebar.innerHTML = '';
        sidebar.appendChild(offlineBanner);
        sidebar.appendChild(container);

        // Close button
        const closeBtn = ModalManager.setupCloseHandlers(sidebar, backdrop);
        sidebar.appendChild(closeBtn);

        // Modal is already visible (shown when spinner displayed); just ensure it stays shown
        ModalManager.showModal(sidebar, backdrop);

        // Toggle offline banner visibility
        const toggleOffline = () => {
            try {
                const b = document.querySelector('#dr-sidebar .dr-offline-banner');
                if (!b) return;
                b.style.display = (navigator && navigator.onLine === false) ? 'block' : 'none';
            } catch (_) { }
        };
        toggleOffline();
        try {
            window.addEventListener('online', toggleOffline, { once: true });
        } catch (_) { }

        // ─── Auto-sync checklist data every 4321ms ───
        // Resetting the timer on local edits avoids stale refreshes overwriting fresh sidebar state.
        let autoSyncTimeout = null;
        let autoSyncToken = 0;
        const scheduleSidebarAutoSync = (delay = 4321) => {
            autoSyncToken += 1;
            const token = autoSyncToken;

            if (autoSyncTimeout) {
                clearTimeout(autoSyncTimeout);
            }

            autoSyncTimeout = setTimeout(async () => {
                autoSyncTimeout = null;
                if (token !== autoSyncToken) return;
                if (!SidebarSession.isActive(sessionId)) return;

                try {
                    const freshData = await ChecklistService.loadChecklistBundle(patient, { forceRefresh: true });
                    if (token !== autoSyncToken) return;
                    if (!freshData || !freshData.state) return;

                    const oldStateStr = JSON.stringify(window.checklistState || {});
                    const newStateStr = JSON.stringify(freshData.state);

                    if (oldStateStr !== newStateStr) {
                        console.log('Sidebar auto-sync: detected state change for patient', patient.mabn);
                        window.checklistObj = freshData.checklistObj;
                        window.checklistState = { ...freshData.state };
                        syncPatientCardFromChecklistState(window.checklistState);
                        refreshSidebarFromChecklistState();
                    }
                } catch (e) {
                    console.warn('Sidebar auto-sync error:', e);
                } finally {
                    if (token === autoSyncToken) {
                        scheduleSidebarAutoSync(4321);
                    }
                }
            }, delay);
        };
        window.__drSidebarResetAutoSyncTimer = () => {
            scheduleSidebarAutoSync(4321);
        };
        const refreshSidebarFromChecklistState = () => {
            try {
                if (typeof window.dr_refreshChecklistBadges === 'function') {
                    window.dr_refreshChecklistBadges();
                }
                if (typeof window.dr_refreshChecklistXuatVien === 'function') {
                    window.dr_refreshChecklistXuatVien();
                }

                const yLenhLog = (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                    ? window.checklistState.yLenhLog
                    : [];
                if (typeof window.currentRenderYLenh === 'function') {
                    window.currentRenderYLenh(yLenhLog);
                }
                if (typeof window.currentUpdateQuickYLenhStates === 'function') {
                    window.currentUpdateQuickYLenhStates();
                }
                if (typeof window.currentEnsureDischargeTimeEditor === 'function') {
                    window.currentEnsureDischargeTimeEditor();
                }

                const phauThuatLog = (window.checklistState && Array.isArray(window.checklistState.phauThuatLog))
                    ? window.checklistState.phauThuatLog
                    : [];
                if (typeof window.currentRenderPhauThuatLog === 'function') {
                    window.currentRenderPhauThuatLog(phauThuatLog);
                }

                const hxtTextarea = document.querySelector('#dr-sidebar #dr-hxt-textarea');
                const nextHxt = (window.checklistState && typeof window.checklistState.huongXuTri === 'string')
                    ? window.checklistState.huongXuTri
                    : '';
                if (hxtTextarea && document.activeElement !== hxtTextarea && hxtTextarea.value !== nextHxt) {
                    hxtTextarea.value = nextHxt;
                }

                const cdktTextarea = document.querySelector('#dr-sidebar #dr-chandoan-kemtheo');
                const nextCdkt = (window.checklistState && typeof window.checklistState.chanDoanKemTheo === 'string')
                    ? window.checklistState.chanDoanKemTheo
                    : '';
                if (cdktTextarea && document.activeElement !== cdktTextarea && cdktTextarea.value !== nextCdkt) {
                    cdktTextarea.value = nextCdkt;
                }
            } catch (e) {
                console.warn('Sidebar auto-sync: failed to refresh sidebar sections', e);
            }
        };
        window.__drSyncActiveSidebarState = (mabn, nextState) => {
            try {
                if (!patient || !patient.mabn) return;
                if (String(patient.mabn).trim() !== String(mabn || '').trim()) return;
                window.checklistState = { ...(nextState || {}) };
                patient.checklistState = { ...(nextState || {}) };
                refreshSidebarFromChecklistState();
            } catch (e) {
                console.warn('Sidebar sync bridge failed', e);
            }
        };
        const syncPatientCardFromChecklistState = (freshState) => {
            try {
                if (!patient || !patient.mabn) return;

                const mergedState = { ...(freshState || {}) };
                patient.checklistState = mergedState;

                if (window.dr_data && Array.isArray(window.dr_data)) {
                    const patientInData = window.dr_data.find(p => p && p.mabn === patient.mabn);
                    if (patientInData) {
                        patientInData.checklistState = { ...mergedState };
                        if (typeof window.updatePatientCardTags === 'function') {
                            window.updatePatientCardTags(patient.mabn);
                        }
                        if (typeof window.updatePatientCardPhauThuat === 'function') {
                            window.updatePatientCardPhauThuat(patientInData);
                        }
                        if (typeof window.updatePatientCardHXT === 'function') {
                            window.updatePatientCardHXT(patientInData);
                        }
                        if (typeof window.updatePatientCardCDKT === 'function') {
                            window.updatePatientCardCDKT(patientInData);
                        }
                    }
                }
            } catch (e) {
                console.warn('Sidebar auto-sync: failed to sync dashboard card', e);
            }
        };
        // Start auto-sync when sidebar is fully rendered and visible
        scheduleSidebarAutoSync(4321);

        // One-time initial sync now that helper functions are defined
        try { if (typeof syncPatientCardFromChecklistState === 'function') syncPatientCardFromChecklistState(window.checklistState); } catch (_) {}
        try { if (typeof refreshSidebarFromChecklistState === 'function') refreshSidebarFromChecklistState(); } catch (_) {}

        // Clean up auto-sync when sidebar closes
        const originalEndSession = SidebarSession.endSession;
        window.__drSidebarAutoSyncCleanup = () => {
            if (autoSyncTimeout) {
                clearTimeout(autoSyncTimeout);
                autoSyncTimeout = null;
            }
            if (window.__drSyncActiveSidebarState) {
                window.__drSyncActiveSidebarState = null;
            }
            window.__drSidebarResetAutoSyncTimer = null;
        };
        // Hook into modal close to stop auto-sync
        const origHideModal = ModalManager.hideModal;
        if (origHideModal) {
            ModalManager.hideModal = function(...args) {
                window.__drSidebarAutoSyncCleanup && window.__drSidebarAutoSyncCleanup();
                return origHideModal.apply(this, args);
            };
        }
    }



    function normalizePatientFilterText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function parseDashboardDate(dateStr) {
        if (!dateStr) return null;
        try {
            const raw = String(dateStr).trim();
            if (!raw) return null;

            let normalized = raw;
            if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
                normalized = raw.replace(' ', 'T');
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
                const [part1, part2, part3] = raw.split('/');
                const [year, time = '00:00'] = part3.split(' ');
                const num1 = parseInt(part1, 10);
                const num2 = parseInt(part2, 10);

                let day = part1;
                let month = part2;

                if (num1 <= 12 && num2 > 12) {
                    month = part1;
                    day = part2;
                }

                normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time || '00:00'}`;
            }

            const date = new Date(normalized);
            if (isNaN(date.getTime())) return null;
            date.setHours(0, 0, 0, 0);
            return date;
        } catch (_) {
            return null;
        }
    }

    function getPatientAdmissionTimestamp(item) {
        const admitDate = parseDashboardDate(item && (item.ngayvv || item.tungay));
        return admitDate ? admitDate.getTime() : null;
    }

    function getPatientStayDays(item) {
        const admitTs = getPatientAdmissionTimestamp(item);
        if (admitTs == null) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.floor((today.getTime() - admitTs) / (24 * 60 * 60 * 1000));
    }

    function decoratePatientFilterTarget(element, item, defaultOrder) {
        if (!element || !item) return element;

        element.__drPatientData = item;

        if (item.mabn) element.setAttribute('data-mabn', item.mabn);
        element.setAttribute('data-name', normalizePatientFilterText(item.hoten));
        element.setAttribute('data-cd', normalizePatientFilterText(item.chandoanvk));

        const loc = PatientDataMapper.formatRoomLocation(
            item.teN_PHONG,
            item.teN_GIUONG,
            item.teN_TANG,
            item.teN_TOANHA
        );
        element.setAttribute('data-loc', normalizePatientFilterText(loc));

        if (defaultOrder !== undefined && defaultOrder !== null) {
            element.dataset.defaultOrder = String(defaultOrder);
        }

        const admitTs = getPatientAdmissionTimestamp(item);
        if (admitTs != null) element.dataset.admitTs = String(admitTs);
        else delete element.dataset.admitTs;

        const stayDays = getPatientStayDays(item);
        if (stayDays != null) element.dataset.stayDays = String(stayDays);
        else delete element.dataset.stayDays;

        try {
            const todayStr = DateUtils.getTodayStr();
            const todayIso = getTodayISODate();
            const log = item && item.checklistState && Array.isArray(item.checklistState.yLenhLog) ? item.checklistState.yLenhLog : [];
            let hasXV = false;
            let hasCLS = false;

            for (const entry of log) {
                if (!entry.timestamp || !entry.content) continue;
                const content = entry.content.toLowerCase();
                if (isDischargeEntryOnDate(entry, todayIso)) {
                    hasXV = true;
                }
                if (entry.timestamp.startsWith(todayStr) && content.includes('cận lâm sàng')) hasCLS = true;
            }

            element.dataset.hasxv = hasXV ? '1' : '0';
            element.dataset.hascls = hasCLS ? '1' : '0';
        } catch (_) {
            element.dataset.hasxv = '0';
            element.dataset.hascls = '0';
        }

        return element;
    }

    function renderCards(data) {
        const sortedData = PatientDataMapper.sortPatients([...data]);

        document.body.innerHTML = '';

        // Create top filter/search bar
        const topBar = document.createElement('div');
        topBar.className = 'dr-top-filter-bar';
        topBar.style.cssText = `
            position: sticky; top: 0; z-index: 1000;
            display: flex; align-items: center; gap: 12px;
            padding: 12px 16px; margin: 0 0 8px 0;
            background: #fff; border-bottom: 1px solid #e0e0e0;
        `;
        topBar.innerHTML = `
            <div class="dr-topbar-left" style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                <div class="dr-topbar-btn-wrap" style="position:relative;">
                    <button id="dr-tracking-btn" class="dr-topbar-control-btn" title="Danh sách bệnh nhân theo dõi khác khoa">
                        <i class="fas fa-user-clock"></i>
                        <span class="dr-topbar-btn-text">Theo dõi</span>
                    </button>
                    <span id="dr-tracking-badge" style="position:absolute; top:-6px; right:-6px; background:#d32f2f; color:#fff; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.2);">0</span>
                </div>
                <!-- Authors / Quick Login Dropdown -->
                <div class="dr-view-dropdown dr-topbar-dropdown" id="dr-authors-dropdown-container">
                    <button id="dr-authors-btn" class="dr-topbar-control-btn" title="Quản lý tài khoản & Đăng nhập nhanh">
                        <i class="fas fa-user-shield"></i>
                        <span class="dr-topbar-btn-text">Authors</span>
                    </button>
                    <div class="dr-dropdown-menu" style="min-width:240px; padding:8px 0;">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 16px; border-bottom:1px solid #f1f5f9; margin-bottom:4px;">
                            <span style="font-weight:700; color:#475569; font-size:13px;">Tài khoản đã lưu</span>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <button id="dr-authors-reload-btn" type="button" title="Tải lại danh sách account cloud" style="appearance:none; border:none; background:#f8fafc; color:#64748b; width:28px; height:28px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                                    <i class="fas fa-rotate-right"></i>
                                </button>
                                <a href="/?caidat=account-cloud" target="_blank" title="Cài đặt account cloud" style="color:#64748b; transition:color 0.2s; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f8fafc;"><i class="fas fa-cog"></i></a>
                            </div>
                        </div>
                        <div id="dr-authors-list" style="max-height:300px; overflow-y:auto;">
                            <div style="padding:12px; text-align:center; color:#94a3b8; font-size:12px;">Đang tải...</div>
                        </div>
                    </div>
                </div>
                <input id="dr-search-input" type="text" placeholder="Lọc BN theo tên, MABN, phòng, chẩn đoán... [/] để tìm nhanh"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                    style="flex:1; min-width: 220px; height:38px; padding: 0 10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;">
            </div>
            <div class="dr-topbar-center" style="flex:0 0 auto; display:flex; justify-content:center; min-width:140px;">
                <span id="dr-total-compact" style="display:inline-block; text-align:center; color:#0f172a; font-weight:700; white-space:nowrap; background:#f1f5f9; border:1px solid #e2e8f0; padding:4px 10px; border-radius:9999px; min-width:110px;">0/0</span>
            </div>
            <div class="dr-topbar-right" style="flex:1; display:flex; align-items:center; justify-content:flex-end; gap:12px;">
                <div class="dr-view-dropdown dr-topbar-dropdown dr-sort-dropdown" id="dr-sort-dropdown-container">
                    <div class="dr-dropdown-toggle dr-topbar-control-btn" id="dr-sort-toggle" title="Sắp xếp danh sách bệnh nhân">
                        <span><i class="fas fa-sort-amount-down-alt" style="margin-right:0px; color:#1e88e5;"></i> <span class="dr-topbar-btn-text">Sắp xếp</span></span>
                        <i class="fas fa-chevron-down" style="font-size:0.8em; opacity:0.7;"></i>
                    </div>
                    <div class="dr-dropdown-menu">
                        <div class="dr-dropdown-item" data-sort="admit-asc">
                            <i class="fas fa-calendar-plus"></i> Sắp xếp theo ngày nhập viện (tăng dần)
                        </div>
                        <div class="dr-dropdown-item" data-sort="admit-desc">
                            <i class="fas fa-calendar-minus"></i> Sắp xếp theo ngày nhập viện (giảm dần)
                        </div>
                        <div class="dr-dropdown-item" data-sort="stay-asc">
                            <i class="fas fa-hourglass-start"></i> Sắp xếp theo tổng số ngày nằm viện (tăng dần)
                        </div>
                        <div class="dr-dropdown-item" data-sort="stay-desc">
                            <i class="fas fa-hourglass-end"></i> Sắp xếp theo tổng số ngày nằm viện (giảm dần)
                        </div>
                    </div>
                </div>

                <!-- Premium View Dropdown -->
                <div class="dr-view-dropdown dr-topbar-dropdown" id="dr-view-dropdown-container">
                    <div class="dr-dropdown-toggle dr-topbar-control-btn" id="dr-view-toggle-premium" style="height:38px; display:flex; align-items:center; box-sizing:border-box; padding: 0 12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; font-weight:600; color:#475569; gap:8px; cursor:pointer;">
                        <span><i class="fas fa-eye" style="margin-right:0px; color:#1e88e5;"></i> <span id="dr-view-label-text">Kiểu hiển thị</span></span>
                        <i class="fas fa-chevron-down" style="font-size:0.8em; opacity:0.7;"></i>
                    </div>
                    <div class="dr-dropdown-menu">
                        <div class="dr-dropdown-item" data-view="grid">
                            <i class="fas fa-th-large"></i> Lưới
                        </div>
                        <div class="dr-dropdown-item" data-view="list">
                            <i class="fas fa-list"></i> Danh sách
                        </div>
                        <div class="dr-dropdown-item" data-view="fit">
                            <i class="fas fa-expand-arrows-alt"></i> Vừa màn hình
                        </div>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        // View state
        let view = (localStorage.getItem(VIEW_KEY) || localStorage.getItem('dr-view-mode') || 'grid');

        // Safety: ensure view is one of supported
        if (!['grid', 'list', 'fit'].includes(view)) view = 'grid';

        const dropdownContainer = topBar.querySelector('#dr-view-dropdown-container');
        const viewLabelText = topBar.querySelector('#dr-view-label-text');
        const dropdownItems = topBar.querySelectorAll('#dr-view-dropdown-container .dr-dropdown-item');
        const sortDropdownContainer = topBar.querySelector('#dr-sort-dropdown-container');
        const sortToggle = topBar.querySelector('#dr-sort-toggle');
        const sortItems = topBar.querySelectorAll('#dr-sort-dropdown-container .dr-dropdown-item');
        const authorsContainer = topBar.querySelector('#dr-authors-dropdown-container');
        const authorsBtn = topBar.querySelector('#dr-authors-btn');
        const authorsReloadBtn = topBar.querySelector('#dr-authors-reload-btn');
        const authorsList = topBar.querySelector('#dr-authors-list');
        const topbarDropdownController = createResponsiveDropdownController({ breakpoint: 1180 });

        topbarDropdownController.register({
            id: 'dr-sort-dropdown-container',
            container: sortDropdownContainer,
            toggle: sortToggle,
            menu: sortDropdownContainer ? sortDropdownContainer.querySelector('.dr-dropdown-menu') : null,
            align: 'auto'
        });
        topbarDropdownController.register({
            id: 'dr-view-dropdown-container',
            container: dropdownContainer,
            toggle: topBar.querySelector('#dr-view-toggle-premium'),
            menu: dropdownContainer ? dropdownContainer.querySelector('.dr-dropdown-menu') : null,
            align: 'auto'
        });
        topbarDropdownController.register({
            id: 'dr-authors-dropdown-container',
            container: authorsContainer,
            toggle: authorsBtn,
            menu: authorsContainer ? authorsContainer.querySelector('.dr-dropdown-menu') : null,
            align: 'auto',
            bindToggle: false
        });

        const SORT_KEY = 'dr-card-sort';
        const validSortKeys = new Set(['default', 'admit-asc', 'admit-desc', 'stay-asc', 'stay-desc']);
        let currentSort = localStorage.getItem(SORT_KEY) || 'default';
        let cloudAccounts = Array.isArray(dashboardCloudContext.cloudAccounts) ? [...dashboardCloudContext.cloudAccounts] : [];
        let cloudAccountsLoaded = !!dashboardCloudContext.bootstrapLoaded;
        let cloudAccountsLoading = null;

        const setAuthorsReloadButtonState = (loading) => {
            if (!authorsReloadBtn) return;
            authorsReloadBtn.disabled = !!loading;
            authorsReloadBtn.style.opacity = loading ? '0.65' : '1';
            authorsReloadBtn.style.cursor = loading ? 'wait' : 'pointer';
            authorsReloadBtn.innerHTML = loading
                ? '<i class="fas fa-spinner fa-spin"></i>'
                : '<i class="fas fa-rotate-right"></i>';
        };

        if (!validSortKeys.has(currentSort)) currentSort = 'default';

        const updateViewUI = (newView) => {
            const labels = { 'grid': 'Lưới', 'list': 'Danh sách', 'fit': 'Vừa màn hình' };
            if (viewLabelText) viewLabelText.textContent = labels[newView] || 'Kiểu hiển thị';
            dropdownItems.forEach(item => {
                if (item.getAttribute('data-view') === newView) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };

        const getDefaultOrder = (element) => Number(element && element.dataset ? element.dataset.defaultOrder || '0' : '0');
        const getNumericSortValue = (element, sortKey) => {
            if (!element) return null;

            if (sortKey === 'admit-asc' || sortKey === 'admit-desc') {
                const value = Number(element.dataset.admitTs);
                return Number.isFinite(value) ? value : null;
            }

            if (sortKey === 'stay-asc' || sortKey === 'stay-desc') {
                const value = Number(element.dataset.stayDays);
                return Number.isFinite(value) ? value : null;
            }

            return null;
        };

        const compareNullableNumbers = (aValue, bValue, direction, aFallback, bFallback) => {
            const aMissing = !Number.isFinite(aValue);
            const bMissing = !Number.isFinite(bValue);

            if (aMissing && bMissing) return aFallback - bFallback;
            if (aMissing) return 1;
            if (bMissing) return -1;
            if (aValue !== bValue) return direction === 'asc' ? aValue - bValue : bValue - aValue;
            return aFallback - bFallback;
        };

        const updateSortUI = (sortKey) => {
            sortItems.forEach(item => {
                if (item.getAttribute('data-sort') === sortKey) item.classList.add('active');
                else item.classList.remove('active');
            });

            if (sortDropdownContainer) {
                sortDropdownContainer.classList.toggle('dr-sort-active', sortKey !== 'default');
            }

            if (sortToggle) {
                const titleMap = {
                    'admit-asc': 'Sắp xếp theo ngày nhập viện (tăng dần)',
                    'admit-desc': 'Sắp xếp theo ngày nhập viện (giảm dần)',
                    'stay-asc': 'Sắp xếp theo tổng số ngày nằm viện (tăng dần)',
                    'stay-desc': 'Sắp xếp theo tổng số ngày nằm viện (giảm dần)'
                };
                sortToggle.title = sortKey === 'default'
                    ? 'Sắp xếp danh sách bệnh nhân'
                    : `Đang ${titleMap[sortKey]}. Click lại lựa chọn đang bật để về mặc định.`;
            }
        };

        const applySelectedSort = () => {
            const elements = Array.from(container.children);
            if (elements.length === 0) return;

            elements.sort((a, b) => {
                const aFallback = getDefaultOrder(a);
                const bFallback = getDefaultOrder(b);

                if (currentSort === 'default') return aFallback - bFallback;

                const direction = currentSort.endsWith('desc') ? 'desc' : 'asc';
                return compareNullableNumbers(
                    getNumericSortValue(a, currentSort),
                    getNumericSortValue(b, currentSort),
                    direction,
                    aFallback,
                    bFallback
                );
            });

            elements.forEach(element => container.appendChild(element));
            updateSortUI(currentSort);
        };

        const setCurrentSort = (sortKey) => {
            currentSort = validSortKeys.has(sortKey) ? sortKey : 'default';

            if (currentSort === 'default') localStorage.removeItem(SORT_KEY);
            else localStorage.setItem(SORT_KEY, currentSort);

            applySelectedSort();
        };

        const normalizeCloudAccounts = (accounts) => {
            if (!Array.isArray(accounts)) return [];
            return accounts
                .map(acc => {
                    if (!acc || typeof acc !== 'object') return null;
                    return {
                        title: String(acc.title || '').trim(),
                        username: String(acc.username || '').trim(),
                        password: String(acc.password || '')
                    };
                })
                .filter(acc => acc && acc.username);
        };

        const loadCloudAccounts = async ({ force = false, showLoading = false } = {}) => {
            if (cloudAccountsLoaded && !force) return cloudAccounts;
            if (cloudAccountsLoading) return cloudAccountsLoading;

            if (showLoading && authorsList) {
                authorsList.innerHTML = '<div style="padding:12px; text-align:center; color:#94a3b8; font-size:12px;">Đang tải...</div>';
            }
            setAuthorsReloadButtonState(true);

            cloudAccountsLoading = (async () => {
                try {
                    const SettingsService = require('../services/settingsService');
                    const cloudData = await SettingsService.getOrCreateSettings();
                    const s = cloudData && cloudData.settings ? cloudData.settings : null;
                    const list = await SettingsService.getCloudAccounts(s || {}, {
                        doctorName: cloudData && cloudData.doctorName,
                        chungThuSo: cloudData && cloudData.chungThuSo
                    });
                    cloudAccounts = normalizeCloudAccounts(list);
                    dashboardCloudContext = {
                        doctorName: cloudData && cloudData.doctorName,
                        chungThuSo: cloudData && cloudData.chungThuSo,
                        checklistObj: cloudData && cloudData.checklistObj,
                        settings: s || SettingsService.getDefaultSettings(),
                        cloudAccounts: [...cloudAccounts],
                        bootstrapLoaded: true
                    };

                    if (s && s.dashboard && typeof s.dashboard === 'object') {
                        applyDashboardSettingsToLocalStorage(s.dashboard);
                        applyCardHoverTooltipSetting();
                    }
                } catch (e) {
                    console.warn('Cloud authors load failed', e);
                    cloudAccounts = [];
                } finally {
                    cloudAccountsLoaded = true;
                    cloudAccountsLoading = null;
                    setAuthorsReloadButtonState(false);
                }
                return cloudAccounts;
            })();

            return cloudAccountsLoading;
        };

        const renderAuthorsList = () => {
            if (!authorsList) return;
            const accounts = cloudAccounts;
            if (accounts.length === 0) {
                authorsList.innerHTML = `
                    <div style="padding:16px; text-align:center;">
                        <div style="color:#64748b; font-size:12px; margin-bottom:8px;">Chưa có account cloud nào được lưu</div>
                        <a href="/?caidat=account-cloud" target="_blank" style="display:inline-block; background:#2563eb; color:#fff; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; text-decoration:none;">Thêm ngay</a>
                    </div>
                `;
                return;
            }
            authorsList.innerHTML = '';
            accounts.forEach(acc => {
                const item = document.createElement('div');
                item.className = 'dr-dropdown-item';
                item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px 16px;';
                item.innerHTML = `
                    <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                        <span style="font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${acc.title || acc.username}</span>
                        <span style="font-size:11px; color:#64748b;">${acc.username}</span>
                    </div>
                    <button class="dr-quick-login-btn" style="background:#f1f5f9; color:#2563eb; border:none; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s;">Login 🕵️</button>
                `;
                item.querySelector('.dr-quick-login-btn').onclick = async (e) => {
                    e.stopPropagation();
                    if (!acc.username || !acc.password) return;

                    // Save credentials to GM storage
                    const loginKey = `dr_quick_login_${acc.username}`;
                    await GM.setValue(loginKey, JSON.stringify({
                        username: acc.username,
                        password: acc.password,
                        ts: Date.now()
                    }));

                    // Open incognito tab
                    if (typeof GM_openInTab === 'function') {
                        GM_openInTab(window.location.origin + '/Home/Login?quicklogin=' + encodeURIComponent(acc.username), {
                            active: true,
                            insert: true,
                            incognito: true
                        });
                    } else {
                        alert('Tiện ích cần quyền GM_openInTab để thực hiện tính năng này.');
                    }
                };
                authorsList.appendChild(item);
            });
        };

        // Initialize UI
        updateViewUI(view);
        updateSortUI(currentSort);

        if (cloudAccountsLoaded) {
            renderAuthorsList();
        } else {
            (async () => {
                try {
                    await loadCloudAccounts({ showLoading: true });
                } catch(e) { console.warn('Cloud sync failed on start', e); }
                renderAuthorsList();
            })();
        }

        if (authorsBtn) {
            authorsBtn.onclick = (e) => {
                e.stopPropagation();
                topbarDropdownController.toggle('dr-authors-dropdown-container');
                if (authorsContainer && authorsContainer.classList.contains('open') && cloudAccountsLoaded) {
                    renderAuthorsList();
                }
            };
        }

        if (authorsReloadBtn) {
            authorsReloadBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    await loadCloudAccounts({ force: true, showLoading: true });
                    renderAuthorsList();
                    showToast('Đã tải lại danh sách account cloud', 'success', 2200);
                } catch (err) {
                    console.warn('Manual cloud authors reload failed', err);
                    showToast('Không thể tải lại account cloud', 'error', 2500);
                }
            };
        }

        // Handle item selection
        dropdownItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const targetView = item.getAttribute('data-view');
                if (targetView === view) return;
                topbarDropdownController.closeAll();

                localStorage.setItem(VIEW_KEY, targetView);
                localStorage.setItem('dr-view-mode', targetView);
                scheduleDashboardSettingsSync();

                // If switching between fit and others, we might need a full re-render or reload
                // For now, let's try to just re-trigger renderCards if it's fit mode,
                // but since the container structure changes much, a reload or re-exec of renderCards with original data is safer.
                // However, the requested behavior is "không reload lại trang web".

                if (targetView === 'fit' || view === 'fit') {
                    // Re-render everything with the new view
                    renderCards(data);
                } else {
                    // Classic behavior for grid/list (might involve reload if complex)
                    renderCards(data);
                }
            };
        });

        sortItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const targetSort = item.getAttribute('data-sort') || 'default';
                const nextSort = targetSort === currentSort ? 'default' : targetSort;
                setCurrentSort(nextSort);
                topbarDropdownController.closeAll();
                applyFilter();
            };
        });

        if (!localStorage.getItem(VIEW_KEY)) localStorage.setItem(VIEW_KEY, view);

        if (view === 'fit') {
            container.className = 'dr-fit-container';
            container.style.paddingBottom = '0'; // Clean slate for fit mode
            document.body.classList.add('dr-fit-mode');
        } else {
            container.className = view === 'list' ? 'dr-list-container' : 'dr-card-list';
            container.style.paddingBottom = '90px';
            document.body.classList.remove('dr-fit-mode');
        }

        const renderItemGrid = (item) => createPatientCard(item);
        const { createListRow } = require('../components/listView');
        const renderItemList = (item) => createListRow(item, { onOpen: () => showSidebar(item) });
        const renderer = view === 'list' ? renderItemList : renderItemGrid;
        sortedData.forEach((item, index) => {
            const card = renderer(item);
            decoratePatientFilterTarget(card, item, index);
            container.appendChild(card);
            try {
                if (item && item.mabn && typeof updatePatientCardTags === 'function') {
                    updatePatientCardTags(item.mabn);
                }
            } catch (_) { }
        });

        // Introduce a generalized wrapper for ALL views so layout padding/margins apply consistently
        const wrapper = document.createElement('div');
        wrapper.id = 'dr-main-wrapper';
        wrapper.style.cssText = 'transition: margin-left 0.2s ease; width: 100%; box-sizing: border-box;';
        wrapper.appendChild(container);

        // Append top bar then wrapper
        document.body.appendChild(topBar);
        document.body.appendChild(wrapper);

        try {
            const displaySettings = require('../components/displaySettings');
            displaySettings.createIcon(topBar);
        } catch(e) { console.warn('Lỗi init display settings', e); }

        // Bottom bar is intentionally rendered after the main dashboard content.
        createBottomBar();
        initializeKhoaSelect(getDashboardPreferredKhoaId()).catch((e) => {
            console.warn('Initialize khoa select after render failed', e);
        });
        ensureDashboardAutoRefreshLoop();

        // Setup Advanced Filter
        setupAdvancedFilter(topBar, () => applyFilter());

        // Setup Tracking UI
        try {
            const { setupTrackingUI } = require('../components/trackingUI');
            setupTrackingUI(topBar, wrapper, createPatientCard, applyFilter);
        } catch (e) {
            console.error('Lỗi khi setup Tracking UI:', e);
        }

        // Filter logic
        const searchInput = topBar.querySelector('#dr-search-input');
        const totalCompact = topBar.querySelector('#dr-total-compact');

        function getCardVisibilityState(card, keywords) {
            const nameAttr = card.getAttribute('data-name') || '';
            const mabnAttr = card.getAttribute('data-mabn') || '';
            const cdAttr = card.getAttribute('data-cd') || '';
            const locAttr = card.getAttribute('data-loc') || '';
            const fullTxt = card.textContent || '';

            const matchesText = keywords.length === 0 || keywords.every(k => {
                const searchKey = k.toLowerCase();
                const useExactMatch = hasAccents(k);

                if (useExactMatch) {
                    return nameAttr.toLowerCase().includes(searchKey) ||
                        mabnAttr.toLowerCase().includes(searchKey) ||
                        cdAttr.toLowerCase().includes(searchKey) ||
                        locAttr.toLowerCase().includes(searchKey) ||
                        fullTxt.toLowerCase().includes(searchKey);
                }

                const normKey = removeAccents(searchKey);
                return removeAccents(nameAttr).includes(normKey) ||
                    removeAccents(mabnAttr).includes(normKey) ||
                    removeAccents(cdAttr).includes(normKey) ||
                    removeAccents(locAttr).includes(normKey) ||
                    removeAccents(fullTxt).includes(normKey);
            });

            const matchesXV = !advancedFilterState.onlyXuatVien || card.dataset.hasxv === '1' || card.classList.contains('xuatvienanimation');
            const matchesCLS = !advancedFilterState.onlyCanLamSang || card.dataset.hascls === '1';
            const item = card.__drPatientData || sortedData.find(p => p.mabn === card.getAttribute('data-mabn'));
                // Only run advanced filter logic if there are advanced criteria (not just quick filters)
                const hasAdvancedCriteria = !!(advancedFilterState.surgeryName || advancedFilterState.surgeons.length > 0 || advancedFilterState.surgeryDate || advancedFilterState.yLenhTags.length > 0);
                const matchesAdvanced = !hasAdvancedCriteria || (item && matchesAdvancedFilter(item));

            return matchesText && matchesXV && matchesCLS && matchesAdvanced;
        }

        function updateCardDisplay(card, show) {
            const trackingWrapper = card.closest('.dr-tracking-card-wrap');
            if (trackingWrapper) {
                trackingWrapper.style.display = show ? '' : 'none';
                card.style.display = '';
                return;
            }

            card.style.display = show ? '' : 'none';
        }

        function applyFilter() {
            const rawQ = (searchInput.value || '').trim();
            let visible = 0;

            // Split by comma and process each keyword
            const keywords = rawQ.split(',')
                .map(k => k.trim())
                .filter(k => k !== '');

            const mainCards = container.querySelectorAll('.dr-card, .dr-list-row');
            mainCards.forEach(card => {
                const show = getCardVisibilityState(card, keywords);
                updateCardDisplay(card, show);
                if (show) visible++;
            });

            const trackingCards = document.querySelectorAll('#dr-tracking-active-list .dr-card');
            trackingCards.forEach(card => {
                const show = getCardVisibilityState(card, keywords);
                updateCardDisplay(card, show);
            });

            // Update centered compact total, integrating the filter count
            if (totalCompact) {
                const hasFilter = !!(keywords.length > 0 || advancedFilterState.active);
                totalCompact.textContent = hasFilter ? `Hiển thị: ${visible}/${sortedData.length}` : `${visible}/${sortedData.length}`;
                // Color accents: blue when filtered, neutral otherwise
                if (hasFilter) {
                    totalCompact.style.background = '#e3f2fd';
                    totalCompact.style.borderColor = '#bbdefb';
                    totalCompact.style.color = '#1976d2';
                } else {
                    totalCompact.style.background = '#f1f5f9';
                    totalCompact.style.borderColor = '#e2e8f0';
                    totalCompact.style.color = '#0f172a';
                }
            }

            if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
        }

        searchInput.addEventListener('input', applyFilter);

        // Escape key to clear search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                applyFilter();
                // Optionally blur after clearing
                // searchInput.blur();
            }
        });

        // Hotkey support: "/" to focus search
        const hotkeyHandler = (e) => {
            // Only trigger if not already in an input/textarea
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                const input = document.getElementById('dr-search-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
        };
        document.addEventListener('keydown', hotkeyHandler);

        // Fit to Screen dynamic adjustment logic
        function updateFitLayout() {
            if (view !== 'fit') return;
            
            const cards = Array.from(container.querySelectorAll('.dr-card')).filter(card => card.style.display !== 'none');
            if (cards.length === 0) return;
            
            const count = cards.length;
            const w = window.innerWidth - 30; // 15px padding each side
            
            const topBarH = topBar.offsetHeight;
            const bottomBar = document.querySelector('.dr-bottom-bar');
            const bottomBarH = bottomBar ? bottomBar.offsetHeight : 0;
            
            const h = window.innerHeight - (topBarH + bottomBarH + 30); // 15px padding top/bottom
            
            // Try to find best grid (rows x cols)
            let bestCols = 1;
            let bestRows = count;
            let minDiff = Infinity;
            
            for (let cols = 1; cols <= count; cols++) {
                const rows = Math.ceil(count / cols);
                const cardW = w / cols;
                const cardH = h / rows;
                const ratio = cardW / cardH;
                const diff = Math.abs(ratio - 1.4); // Target aspect ratio ~1.4
                if (diff < minDiff) {
                    minDiff = diff;
                    bestCols = cols;
                    bestRows = rows;
                }
            }
            
            container.style.gridTemplateColumns = `repeat(${bestCols}, 1fr)`;
            // Use minmax(0, 1fr) to prevent content from expanding the row height
            container.style.gridTemplateRows = `repeat(${bestRows}, minmax(0, 1fr))`;
            container.style.height = `${h + 30}px`; // +30 for the internal padding of container
            
            // Scale text based on card height
            const cardH = h / bestRows;
            const baseSize = Math.max(10, Math.min(16, cardH / 15));
            container.style.setProperty('--fit-title-size', `${baseSize * 1.2}px`);
            container.style.setProperty('--fit-name-size', `${baseSize * 1.1}px`);
            container.style.setProperty('--fit-text-size', `${baseSize}px`);
        }

        // Expose to window for post-enrichment updates
        if (typeof unsafeWindow !== 'undefined') unsafeWindow.dr_updateFitLayout = updateFitLayout;
        else globalThis.dr_updateFitLayout = updateFitLayout;

        if (view === 'fit') {
            window.addEventListener('resize', updateFitLayout);
            setTimeout(updateFitLayout, 0);
        }

        // Run first filter
        const totalCompactInit = document.getElementById('dr-total-compact');
        if (totalCompactInit) {
            totalCompactInit.textContent = `${sortedData.length}/${sortedData.length}`;
            totalCompactInit.style.background = '#f1f5f9';
            totalCompactInit.style.borderColor = '#e2e8f0';
            totalCompactInit.style.color = '#0f172a';
        }
        applySelectedSort();
        applyFilter();

        // Prefill from query param ?q=
        try {
            const u = new URL(window.location.href);
            const qParam = u.searchParams.get('q');
            if (qParam) {
                searchInput.value = qParam;
                applyFilter();
            }
        } catch (_) { }

        const refreshPatientCards = function (newData) {
            const cardsByPid = new Map();
            document.querySelectorAll('.dr-card, .dr-list-row, .dr-tracking-item').forEach(card => {
                const mabn = card.getAttribute('data-mabn');
                if (mabn) {
                    if (!cardsByPid.has(mabn)) {
                        cardsByPid.set(mabn, [card]);
                    } else {
                        cardsByPid.get(mabn).push(card);
                    }
                }
            });

            // Update existing cards instead of full re-render to avoid interrupting user
            newData.forEach(item => {
                const matchedCards = item && item.mabn ? cardsByPid.get(item.mabn) : null;
                if (matchedCards) {
                    matchedCards.forEach(card => {
                        decoratePatientFilterTarget(card, item, card.dataset.defaultOrder);
                        // Update merged diagnosis line (Chẩn đoán + CD kèm theo)
                        try {
                            const diagnosisEl = card.querySelector('.dr-diagnosis-line');
                            if (diagnosisEl) {
                                const { composeDiagnosis } = DomUpdaters;
                                const { baseText: baseCdNew, cdktText, combinedHtml } = composeDiagnosis(item);
                                diagnosisEl.dataset.baseCd = baseCdNew;
                                diagnosisEl.dataset.cdkt = cdktText || '';
                                diagnosisEl.innerHTML = `<span class="dr-label">Chẩn đoán:</span> ${combinedHtml}`;
                            }
                            // remove any legacy block if present
                            const oldCdkt = card.querySelector('.dr-cdkt-block');
                            if (oldCdkt) oldCdkt.remove();
                        } catch (_) { }
                        // Update surgery info with post-op days using shared updater
                        DomUpdaters.updateSurgeryInfo(card, item);

                        // Update HXT line in the card/list row
                        DomUpdaters.updateHXT(item);

                        // Update surgery status icon
                        DomUpdaters.updateSurgeryIcon(card, item);
                    });

                    try {
                        if (item && item.mabn) {
                            if (typeof window.updatePatientCardTags === 'function') {
                                window.updatePatientCardTags(item.mabn);
                            } else if (typeof updatePatientCardTags === 'function') {
                                updatePatientCardTags(item.mabn);
                            }
                        }
                    } catch (_) { }

                    try {
                        if (typeof window.__drSyncActiveSidebarState === 'function') {
                            window.__drSyncActiveSidebarState(item && item.mabn, item && item.checklistState);
                        }
                    } catch (_) { }

                    // Re-evaluate filter visibility and layout after updates
                    // Delay to allow DOM/class updates done elsewhere
                    setTimeout(() => {
                        applySelectedSort();
                        applyFilter();
                        if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
                    }, 0);
                }
            });
        };

        // Make functions available for global use
        if (typeof unsafeWindow !== 'undefined') {
            unsafeWindow.refreshPatientCards = refreshPatientCards;
            unsafeWindow.checkAllCelebrationAnimations = checkAllCelebrationAnimations;
        } else if (typeof this !== 'undefined') {
            this.refreshPatientCards = refreshPatientCards;
            this.checkAllCelebrationAnimations = checkAllCelebrationAnimations;
        } else {
            globalThis.refreshPatientCards = refreshPatientCards;
            globalThis.checkAllCelebrationAnimations = checkAllCelebrationAnimations;
        }

        // View toggle logic removed as it's now handled by the premium dropdown
    }



    function createPatientCard(item) {
        const room = item.teN_PHONG || '';
        const isWhite = PatientDataMapper.isWhiteCard(room);
        const card = document.createElement('div');
        card.className = 'dr-card' + (isWhite ? '' : ' dr-blue');
        decoratePatientFilterTarget(card, item);

        // Format location using the new utility function
        const formattedLocation = PatientDataMapper.formatRoomLocation(
            item.teN_PHONG,
            item.teN_GIUONG,
            item.teN_TANG,
            item.teN_TOANHA
        );

        const ptInfo = formatSurgeryInfo(item);

        const hxtText = (item.checklistState && item.checklistState.huongXuTri) ? String(item.checklistState.huongXuTri).trim() : '';
        const hxtHtml = hxtText ? `<div class="dr-value dr-hxt-block"><span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}</div>` : '';
        const { baseText: baseDiagnosis, cdktText, combinedHtml: combinedDiagnosis } = DomUpdaters.composeDiagnosis(item);
        card.innerHTML = `
            <div class="dr-room-label">${formattedLocation}</div>
            <h2 class="dr-patient-name">${item.hoten || ''}</h2>
            <div class="dr-patient-sub-info">
                <span class="dr-patient-mabn" style="cursor:pointer;" title="Click để copy mã BN">${item.mabn || ''}</span>
                <span class="dr-patient-gender">${item.phai === 1 ? 'Nữ' : 'Nam'}</span>
            </div>
            <div class="dr-value dr-dob-line"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
            <div class="dr-value dr-diagnosis-line" data-base-cd="${baseDiagnosis.replace(/"/g, '&quot;')}" data-cdkt="${escapeHtml(cdktText).replace(/"/g, '&quot;')}"><span class="dr-label">Chẩn đoán:</span> ${combinedDiagnosis}</div>
            ${ptInfo}
            ${hxtHtml}
            ${createYLenhTags(item)}
        `;
        // mark base diagnosis for future updates
        try {
            const diagEl = card.querySelector('.dr-diagnosis-line');
            if (diagEl) {
                diagEl.dataset.baseCd = baseDiagnosis;
                diagEl.dataset.cdkt = cdktText || '';
            }
        } catch (_) { }
        if (item && item.mabn && !card.getAttribute('data-mabn')) {
            card.setAttribute('data-mabn', item.mabn);
        }

        // Add action buttons
        const btnGroup = createActionButtons(item);
        card.appendChild(btnGroup);

        // Add surgery status icon
        addSurgeryStatusIcon(card, item);
        // Show meds-done badge if applicable
        try { updateMedsDoneBadge(card, item); } catch (_) { }

        card.onclick = () => showSidebar(item);
        
        try {
            const contextMenu = require('../components/contextMenu');
            contextMenu.attachToCard(card, item);
        } catch(e) { console.warn('Lỗi attach contextMenu', e); }

        const pidSpan = card.querySelector('.dr-patient-mabn');
        if (pidSpan && item.mabn) {
            pidSpan.onclick = async (e) => {
                e.stopPropagation(); // prevent opening sidebar
                try {
                    const displaySettings = require('../components/displaySettings');
                    if (displaySettings.get('autoCopyPID')) {
                        const { copyToClipboard, showToast } = require('../utils/uiUtils');
                        const success = await copyToClipboard(item.mabn);
                        if (success) {
                            showToast(`Đã copy PID: ${item.mabn}`);
                        }
                    }
                } catch(err) { console.warn('Lỗi copy PID', err); }
            };
        }

        // Preload HXT from checklist state after rendering card (non-blocking)
        setTimeout(() => {
            preloadHXTForPatient(item);
        }, 0);

        // Global hover tooltip
        cardTooltip.attach(card, card);

        return card;
    }

    // List view row now lives in components/listView.js

    // escapeHtml provided by utils/htmlUtils

    // Update HXT on a card when sidebar saves
    function updatePatientCardHXT(patient) { try { DomUpdaters.updateHXT(patient); } catch (_) { } }

    // Update Chẩn đoán kèm theo on a card when sidebar saves
    function updatePatientCardCDKT(patient) { try { DomUpdaters.updateCDKT(patient); } catch (_) { } }

    // Preload HXT for a patient by fetching checklist state if not present
    async function preloadHXTForPatient(item) {
        try {
            if (!item || !item.mabn) return;
            const existing = item.checklistState && typeof item.checklistState.huongXuTri === 'string' ? item.checklistState.huongXuTri.trim() : '';
            if (existing) {
                DomUpdaters.updateHXT(item);
                return;
            }
            const bundle = await ChecklistService.loadChecklistBundle(item, { forceRefresh: false });
            if (!bundle || !bundle.checklistObj) return;
            const state = bundle.state || {};
            const hxt = typeof state.huongXuTri === 'string' ? state.huongXuTri.trim() : '';
            if (!hxt) return;
            // Update dr_data entry
            if (window.dr_data && Array.isArray(window.dr_data)) {
                const idx = window.dr_data.findIndex(p => p.mabn === item.mabn);
                if (idx >= 0) {
                    const oldState = window.dr_data[idx].checklistState || {};
                    window.dr_data[idx].checklistState = { ...oldState, ...state };
                }
            }
            // Update card view with merged state
            const updated = { ...item, checklistState: { ...(item.checklistState || {}), ...state } };
            DomUpdaters.updateHXT(updated);
            try { DomUpdaters.updateCDKT(updated); } catch (_) { }
            // Trigger layout recalculation after enrichment
            if (typeof dr_updateFitLayout === 'function') dr_updateFitLayout();
        } catch (e) {
            console.warn('Preload HXT failed for', item?.mabn, e);
        }
    }







    // Helper function to create action buttons
    function createActionButtons(item) {
        const { createToDieuTriButton, createHsbaButton, createCopyOneButton } = require('../components/actionButtons');
        const btnToDieuTri = createToDieuTriButton({ item, variant: 'full' });
        const btnHsba2 = createHsbaButton({ item, variant: 'full' });
        const btnCopyOne = createCopyOneButton({ item, variant: 'icon' });

        const btnGroup = document.createElement('div');
        btnGroup.className = 'dr-action-buttons';
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '8px';
        btnGroup.style.justifyContent = 'flex-end';
        btnGroup.style.alignItems = 'center';
        btnGroup.style.position = 'absolute';
        btnGroup.style.right = '16px';
        btnGroup.style.bottom = '12px';

        btnGroup.appendChild(btnCopyOne);
        btnGroup.appendChild(btnToDieuTri);
        btnGroup.appendChild(btnHsba2);

        return btnGroup;
    }

    // Button creators moved to components/actionButtons.js

    // Helper function to create bottom bar
    function createBottomBar() {
        const bottomBar = document.createElement('div');
        bottomBar.className = 'dr-bottom-bar';
        bottomBar.innerHTML = `
            <div class="dr-bottom-bar-left">
                <a id="dr-settings-btn" class="dr-gear-btn" href="/?caidat" target="_blank" title="Cài đặt">
                    <i class="fas fa-cog"></i>
                </a>
                <select id="dr-khoa-select" class="dr-khoa-select" title="Chọn khoa"></select>
                <span id="dr-khoa-loading-status" style="font-size:12px;color:#475569;white-space:nowrap;"></span>
            </div>
            <div class="dr-bottom-bar-right">
                <button id="dr-dashboard-refresh-countdown" type="button" class="dr-dashboard-refresh-countdown" title="Tự làm mới ngay">
                    ↻ 45s
                </button>
            </div>
        `;
        document.body.appendChild(bottomBar);

        // Add OTM buttons to bottom bar
        addOTMButtonsToBottomBar(bottomBar);

        // Bottom bar styles come from addGlobalStyles()

        const select = document.getElementById('dr-khoa-select');
        if (select) {
            select.addEventListener('change', async (e) => {
                const val = e.target.value;
                lastManualKhoaId = String(val || '').trim();
                const selectedOpt = e.target.options[e.target.selectedIndex];
                const selectedName = (selectedOpt && selectedOpt.textContent) || val;
                window.dr_data_khoa_id = String(val || '').trim();
                try { localStorage.setItem('bsnt_khoa_dashboard', String(val)); } catch (_) { }
                await reloadDashboardForSelectedKhoa(selectedName);
            });
        }

        const refreshBtn = document.getElementById('dr-dashboard-refresh-countdown');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await runDashboardAutoRefresh();
            });
        }
    }

    // Bottom bar styling helper removed (centralized in dashboard.support.js)
    // Main logic
    async function initializeDashboard() {
        applyCardHoverTooltipSetting();

        const cloudData = await SettingsService.getOrCreateSettings().catch((e) => {
            console.warn('Load dashboard cloud settings failed', e);
            return null;
        });

        if (cloudData && cloudData.settings) {
            applyDashboardSettingsToLocalStorage(cloudData.settings.dashboard || {});
            applyCardHoverTooltipSetting();

            let cloudAccounts = [];
            try {
                cloudAccounts = await SettingsService.getCloudAccounts(cloudData.settings || {}, {
                    doctorName: cloudData.doctorName,
                    chungThuSo: cloudData.chungThuSo
                });
            } catch (e) {
                console.warn('Load bootstrap cloud accounts failed', e);
            }

            dashboardCloudContext = {
                doctorName: cloudData.doctorName || '',
                chungThuSo: cloudData.chungThuSo || '',
                checklistObj: cloudData.checklistObj || null,
                settings: cloudData.settings || SettingsService.getDefaultSettings(),
                cloudAccounts: Array.isArray(cloudAccounts) ? cloudAccounts : [],
                bootstrapLoaded: true
            };
        }

        const preferredKhoaId = getDashboardPreferredKhoaId();
        try { localStorage.setItem('bsnt_khoa_dashboard', preferredKhoaId); } catch (_) {}
        window.dr_data_khoa_id = preferredKhoaId;

        const data = await PatientService.loadPatientDataWithErrorHandling();

        if (data) {
            renderCards(filterDataByAccessibleKhoa(data, dashboardCloudContext.settings || {}));
        }
    }

    // Helper function to try closing a tab using multiple methods
    function tryCloseTab(tab) {
        // Method 1: Try GM.closeTab with tab object
        if (typeof GM !== 'undefined' && GM.closeTab) {
            try {
                GM.closeTab(tab);
                console.log('Closed OTM tab using GM.closeTab(tab)');
                return false; // Remove from array
            } catch (gmError) {
                console.log('GM.closeTab(tab) failed, trying alternatives:', gmError);
            }
        }

        // Method 2: Try tab.close() if available
        if (tab.close && typeof tab.close === 'function') {
            try {
                tab.close();
                console.log('Closed OTM tab using tab.close()');
                return false; // Remove from array
            } catch (closeError) {
                console.log('tab.close() failed:', closeError);
            }
        }

        // Method 3: Try window.close() on the tab
        if (tab.window && tab.window.close) {
            try {
                tab.window.close();
                console.log('Closed OTM tab using tab.window.close()');
                return false; // Remove from array
            } catch (windowError) {
                console.log('tab.window.close() failed:', windowError);
            }
        }

        // Method 4: For GM tabs, try posting a message to close
        if (tab.postMessage) {
            try {
                tab.postMessage({ type: 'close-otm-tab' }, '*');
                console.log('Sent close message to OTM tab');
                return false; // Remove from array
            } catch (msgError) {
                console.log('postMessage failed:', msgError);
            }
        }

        console.log('All close methods failed for OTM tab');
        return true; // Keep in array
    }

    // Handle OTM close tab messages
    function handleOTMCloseTab(name, oldValue, newValue, remote) {
        try {
            const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
            console.log('[OTM Close Tab] Received close request:', data.data);
            console.log('[OTM Close Tab] Current openTabs:', window.openTabs);
            console.log('[OTM Close Tab] openTabs length:', window.openTabs.length);

            // Close OTM tabs from stored references
            if (window.openTabs && window.openTabs.length > 0) {
                window.openTabs = window.openTabs.filter(tabInfo => {
                    if (tabInfo && tabInfo.hostname === 'otm.tahospital.vn') {
                        try {
                            const tab = tabInfo.tab;

                            // Handle case where tab is a Promise (from GM.openInTab)
                            if (tab && typeof tab.then === 'function') {
                                console.log('Tab is a Promise, waiting for resolution...');
                                tab.then(actualTab => {
                                    if (actualTab && !actualTab.closed) {
                                        tryCloseTab(actualTab);
                                    }
                                }).catch(error => {
                                    console.error('Error resolving tab Promise:', error);
                                });
                                return false; // Remove from array since we're handling it asynchronously
                            }

                            if (tab && !tab.closed) {
                                return tryCloseTab(tab);
                            } else {
                                console.log('Tab already closed or invalid');
                                return false; // Remove from array
                            }
                        } catch (error) {
                            console.error('Error closing OTM tab:', error);
                            return true; // Keep in array
                        }
                    }
                    return true; // Keep in array
                });
            } else {
                console.log('No OTM tabs found to close');
            }
        } catch (error) {
            console.error('Error handling OTM close tab:', error);
        }
    }

    // Add GM value change listeners for OTM data
    if (typeof GM !== 'undefined' && GM.addValueChangeListener) {
        GM.addValueChangeListener('otm_progress', handleOTMProgress);
        GM.addValueChangeListener('otm_success', handleOTMSuccess);
        GM.addValueChangeListener('otm_error', handleOTMError);
        GM.addValueChangeListener('otm_close_tab', handleOTMCloseTab);
    } else {
        // Fallback to localStorage polling for non-Greasemonkey environments
        setInterval(() => {
            const progressData = localStorage.getItem('otm_progress');
            const successData = localStorage.getItem('otm_success');
            const errorData = localStorage.getItem('otm_error');
            const closeTabData = localStorage.getItem('otm_close_tab');

            if (progressData) {
                try {
                    const parsed = JSON.parse(progressData);
                    handleOTMProgress('otm_progress', null, parsed, null);
                    localStorage.removeItem('otm_progress');
                } catch (e) {
                    console.error('Error parsing OTM progress data:', e);
                }
            }

            if (successData) {
                try {
                    const parsed = JSON.parse(successData);
                    handleOTMSuccess('otm_success', null, parsed, null);
                    localStorage.removeItem('otm_success');
                } catch (e) {
                    console.error('Error parsing OTM success data:', e);
                }
            }

            if (errorData) {
                try {
                    const parsed = JSON.parse(errorData);
                    handleOTMError('otm_error', null, parsed, null);
                    localStorage.removeItem('otm_error');
                } catch (e) {
                    console.error('Error parsing OTM error data:', e);
                }
            }

            if (closeTabData) {
                try {
                    const parsed = JSON.parse(closeTabData);
                    handleOTMCloseTab('otm_close_tab', null, parsed, null);
                    localStorage.removeItem('otm_close_tab');
                } catch (e) {
                    console.error('Error parsing OTM close tab data:', e);
                }
            }
        }, 1000);
    }

    // Start dashboard initialization
    initializeDashboard();
}

// Helpers to integrate standardized OTM surgery data
function dr_normalizePid(val) {
    if (val == null) return '';
    const s = String(val).trim();
    const digits = s.replace(/\D+/g, '');
    return digits.replace(/^0+/, '');
}

function dr_formatVNDateTime(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    return { date: `${dd}/${mm}/${yyyy}`, time: `${HH}:${MM}` };
}

function dr_otmToLogEntry(otmItem) {
    try {
        const startIso = otmItem && otmItem.start;
        if (!startIso) return null;
        const d = new Date(startIso);
        if (isNaN(d.getTime())) return null;
        const { date, time } = dr_formatVNDateTime(d);
        const method = (otmItem.surgerymethod || otmItem.pppt || '').trim();
        // Collect doctors from userexec (Main surgeons) + userassistant (Assistants)
        // Note: The order in userexec is preserved, ensuring PTV chính is listed first.
        const names = [];
        const pushNames = (arr) => {
            if (Array.isArray(arr)) {
                for (const u of arr) {
                    let n = (u && u.fullname ? String(u.fullname) : '').trim();
                    // Strip designations like (PTV), (PTV chính), (Phụ), etc.
                    n = n.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
                    if (n && !names.includes(n)) names.push(n);
                }
            }
        };
        pushNames(otmItem.userexec);
        pushNames(otmItem.userassistant);
        const doctors = names.join(', ');
        return { 
            date, 
            time, 
            method, 
            doctors, 
            id: `otm-${startIso}`,
            source: 'otm' // Tag as OTM data
        };
    } catch (_) { return null; }
}

function dr_integrateOTMSurgeryData(otmList) {
    const res = { updatedPatients: 0, addedLogs: 0, updated: [], matchedPatients: 0, refreshed: false };
    if (!Array.isArray(otmList) || !Array.isArray(window.dr_data)) return res;
    // Build map pid -> log entries
    const map = new Map();
    for (const it of otmList) {
        const pid = dr_normalizePid(it && it.customer && (it.customer.pid ?? it.customer.code));
        if (!pid) continue;
        const entry = dr_otmToLogEntry(it);
        if (!entry) continue;
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(entry);
    }
    if (map.size === 0) return res;

    // Attach and merge to in-memory patient data
    for (const p of window.dr_data) {
        const mabnNorm = dr_normalizePid(p && p.mabn);
        if (!mabnNorm) continue;
        const entries = map.get(mabnNorm);
        if (!entries || entries.length === 0) continue;

        res.matchedPatients++;

        // Keep original for sidebar merge
        p._otmPhauThuatLog = entries.slice();

        // Merge into patient.checklistState for UI display (append-only, no overwrite)
        if (!p.checklistState) p.checklistState = {};
        if (!Array.isArray(p.checklistState.phauThuatLog)) p.checklistState.phauThuatLog = [];
        const keyOf = (e) => `${e.date}|${e.time}|${(e.method || '').trim().toLowerCase()}`;
        const existingKeys = new Set(p.checklistState.phauThuatLog.map(keyOf));
        let added = 0;
        for (const e of entries) {
            const k = keyOf(e);
            if (!existingKeys.has(k)) {
                p.checklistState.phauThuatLog.push({ ...e });
                existingKeys.add(k);
                added++;
            }
        }
        if (added > 0) {
            res.updatedPatients++;
            res.addedLogs += added;
            res.updated.push({ patient: p, added });
        }

        // Sort newest first and sync the visible summary even when the log already existed.
        const parseDDMMYYYY = (s) => { const [d, m, y] = String(s || '').split('/').map(n => parseInt(n, 10)); return new Date(y || 1970, (m || 1) - 1, d || 1); };
        const toTs = (e) => { const dt = parseDDMMYYYY(e.date); const [hh, mm] = String(e.time || '00:00').split(':').map(n => parseInt(n, 10) || 0); dt.setHours(hh, mm, 0, 0); return dt.getTime(); };
        p.checklistState.phauThuatLog.sort((a, b) => toTs(b) - toTs(a));

        const latest = p.checklistState.phauThuatLog[0];
        if (latest) {
            p.phauThuatInfo = { date: latest.date, time: latest.time, method: latest.method, doctors: latest.doctors, ngayPhauThuat: latest.date, gioPhauThuat: latest.time, pppt: latest.method };
        }

        // Update card/list row if present.
        try {
            const DomUpdaters = require('../utils/domUpdaters');
            const el = DomUpdaters.findPatientElement(p.mabn);
            if (el) {
                DomUpdaters.updateSurgeryInfo(el, p);
                DomUpdaters.updateSurgeryIcon(el, p);
            }
        } catch (_) { }
    }

    try {
        const refreshFn = (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.refreshPatientCards === 'function')
            ? unsafeWindow.refreshPatientCards
            : (typeof globalThis !== 'undefined' && typeof globalThis.refreshPatientCards === 'function')
                ? globalThis.refreshPatientCards
                : (typeof window !== 'undefined' && typeof window.refreshPatientCards === 'function')
                    ? window.refreshPatientCards
                    : null;
        if (refreshFn) {
            refreshFn(window.dr_data);
            res.refreshed = true;
        }
    } catch (_) { }
    return res;
}

async function dr_fetchChecklistObjForPatient(patient) {
    try {
        const bundle = await ChecklistService.loadChecklistBundle(patient, { forceRefresh: true, createIfMissing: true });
        return bundle && bundle.checklistObj ? bundle.checklistObj : null;
    } catch (_) { return null; }
}

async function dr_persistMergedOTMSurgeries(updatedEntries, { concurrency = 2 } = {}) {
    if (!Array.isArray(updatedEntries) || updatedEntries.length === 0) return { saved: 0, queued: 0, failed: 0 };
    const queue = updatedEntries.slice();
    let saved = 0, queued = 0, failed = 0;

    const worker = async () => {
        while (queue.length) {
            const entry = queue.shift();
            const p = entry && entry.patient;
            if (!p) { failed++; continue; }
            try {
                const checklistObj = await dr_fetchChecklistObjForPatient(p);
                if (!checklistObj) { failed++; continue; }
                // Merge server state with current in-memory state (append-only)
                const serverState = ChecklistService.parseChecklistState(checklistObj) || {};
                const ensureArr = (arr) => Array.isArray(arr) ? arr : [];
                const merged = ensureArr(serverState.phauThuatLog).slice();
                const fromMem = ensureArr(p.checklistState && p.checklistState.phauThuatLog);
                const keyOf = (e) => `${e.date}|${e.time}|${(e.method || '').trim().toLowerCase()}`;
                const existing = new Set(merged.map(keyOf));
                for (const e of fromMem) {
                    const k = keyOf(e);
                    if (!existing.has(k)) { merged.push({ ...e }); existing.add(k); }
                }
                // Sort newest first
                const parseDDMMYYYY = (s) => { const [d, m, y] = String(s || '').split('/').map(n => parseInt(n, 10)); return new Date(y || 1970, (m || 1) - 1, d || 1); };
                const toTs = (e) => { const dt = parseDDMMYYYY(e.date); const [hh, mm] = String(e.time || '00:00').split(':').map(n => parseInt(n, 10) || 0); dt.setHours(hh, mm, 0, 0); return dt.getTime(); };
                merged.sort((a, b) => toTs(b) - toTs(a));

                const newState = { ...(serverState || {}), phauThuatLog: merged };
                const r = await ChecklistService.updateChecklistState(checklistObj, newState, { enqueueOnOffline: true });
                if (r && (r.ok || r.queued)) {
                    if (r.queued) queued++; else saved++;
                } else {
                    failed++;
                }
            } catch (_) { failed++; }
        }
    };

    const workers = Array.from({ length: Math.max(1, Math.min(6, concurrency)) }, () => worker());
    await Promise.all(workers);
    return { saved, queued, failed };
}

// Handle OTM progress messages
function handleOTMProgress(name, oldValue, newValue, remote) {
    try {
        const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        showToast(`🔄 ${data.data.message}`, 'info', 3000);
        console.log('[OTM Progress]', data.data.step, data.data.message);
    } catch (error) {
        console.error('Error handling OTM progress:', error);
    }
}

// Handle OTM success messages
function handleOTMSuccess(name, oldValue, newValue, remote) {
    try {
        const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        
        let successMsg = `✅ ${data.data.count} ca mổ đã được tải về!`;
        console.log('[OTM Success]', data.data);

        // Log full dataset once (no per-patient logs)
        if (data.data.surgeryData && data.data.surgeryData.length > 0) {
            console.log('=== SURGERY DATA RECEIVED (FULL) ===', data.data.surgeryData);
            // Merge into in-memory patients and update UI
            const mergeRes = dr_integrateOTMSurgeryData(data.data.surgeryData);
            const { updatedPatients, addedLogs, updated } = mergeRes;
            
            if (updatedPatients > 0) {
                // Get names of updated patients for the toast
                const updatedNames = updated.map(u => u.patient.hoten).join(', ');
                showToast(`✅ ${updatedNames} đã được cập nhật.`, 'success', 5000);
                
                // Persist to server in background (append-only)
                (async () => {
                    const res = await dr_persistMergedOTMSurgeries(updated, { concurrency: 2 });
                    if ((res.saved + res.queued) > 0) {
                        try { showToast(`💾 Lưu ${res.saved} | Hàng đợi ${res.queued} | Lỗi ${res.failed}`, 'info', 4000); } catch (_) { }
                    }
                })();
            } else {
                showToast(successMsg, 'success', 5000);
            }
        } else {
            showToast(successMsg, 'success', 5000);
        }
    } catch (error) {
        console.error('Error handling OTM success:', error);
    }
}

// Handle OTM error messages
function handleOTMError(name, oldValue, newValue, remote) {
    try {
        const data = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        showToast(`❌ ${data.data.message}`, 'error', 5000);
        console.error('[OTM Error]', data.data);
    } catch (error) {
        console.error('Error handling OTM error:', error);
    }
}

// OTM buttons integration
function addOTMButtonsToBottomBar(bottomBar) {
    const bottomBarLeft = bottomBar.querySelector('.dr-bottom-bar-left');
    if (!bottomBarLeft) return;

    // Date range button (integrated today functionality)
    const dateBtn = document.createElement('button');
    dateBtn.id = 'dr-otm-date-btn';
    dateBtn.className = 'dr-btn dr-otm-btn';
    dateBtn.textContent = 'Cập nhật lịch OTM';
    dateBtn.title = 'Chọn khoảng thời gian để lấy dữ liệu mổ từ OTM';
    
    // Applying pinkish-purple gradient to match Copy button
    dateBtn.style.background = 'linear-gradient(135deg, #ec4899, #a855f7)';
    dateBtn.style.color = 'white';
    dateBtn.style.border = 'none';
    dateBtn.style.borderRadius = '8px';
    dateBtn.style.padding = '8px 16px';
    dateBtn.style.fontWeight = '600';
    dateBtn.style.cursor = 'pointer';
    dateBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    dateBtn.style.transition = 'all 0.2s ease';

    dateBtn.onmouseenter = () => {
        dateBtn.style.transform = 'translateY(-1px)';
        dateBtn.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
        dateBtn.style.filter = 'brightness(1.1)';
    };
    dateBtn.onmouseleave = () => {
        dateBtn.style.transform = 'translateY(0)';
        dateBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        dateBtn.style.filter = 'brightness(1)';
    };

    dateBtn.addEventListener('click', () => handleOTMDateClick());

    bottomBarLeft.appendChild(dateBtn);

    // Add Copy Menu next to OTM button
    setupCopyMenu(bottomBar);

    console.log('OTM button added to dashboard');

    function handleOTMDateClick() {
        const DialogManager = require('../components/dialogManager');
        const dialog = DialogManager.createDialog('otm-date-dialog');

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        dialog.inner.innerHTML = `
            <h3>Chọn khoảng thời gian</h3>
            <div style="margin: 10px 0;">
                <div style="margin-bottom: 10px;">
                    <label for="otm-start-date">Ngày bắt đầu:</label>
                    <input type="date" id="otm-start-date" style="margin-left: 10px;" value="${today}">
                </div>
                <div>
                    <label for="otm-end-date">Ngày kết thúc:</label>
                    <input type="date" id="otm-end-date" style="margin-left: 10px;" value="${today}">
                </div>
            </div>
        `;

        const actionButtons = DialogManager.createActionButtons([
            {
                id: 'otm-fetch-btn',
                className: 'dr-btn-primary',
                text: 'Lấy dữ liệu',
                onclick: () => {
                    const startDateInput = document.getElementById('otm-start-date');
                    const endDateInput = document.getElementById('otm-end-date');
                    if (startDateInput && startDateInput.value && endDateInput && endDateInput.value) {
                        openOTMTab(startDateInput.value, endDateInput.value);
                        dialog.close();
                    } else {
                        alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
                    }
                }
            }
        ]);

        dialog.inner.appendChild(actionButtons);
        dialog.show();
    }

    function openOTMTab(fromDate, toDate) {
        const url = `https://otm.tahospital.vn/?otm-fetch=${encodeURIComponent(JSON.stringify({ fromDate, toDate }))}`;
        console.log('[OTM Open Tab] Opening tab with URL:', url);
        console.log('[OTM Open Tab] Current openTabs before:', window.openTabs);

        if (typeof GM !== 'undefined' && GM.openInTab) {
            const tabPromise = GM.openInTab(url, {
                active: false,
                insert: true,
                setParent: true
            });

            // Handle the Promise returned by GM.openInTab
            if (tabPromise && typeof tabPromise.then === 'function') {
                tabPromise.then(tab => {
                    if (tab) {
                        window.openTabs.push({
                            tab: tab,
                            url: url,
                            openedAt: Date.now(),
                            hostname: 'otm.tahospital.vn'
                        });
                        console.log('[OTM Open Tab] Tab added to openTabs. New length:', window.openTabs.length);
                    } else {
                        console.log('[OTM Open Tab] GM.openInTab resolved to null/undefined');
                    }
                }).catch(error => {
                    console.error('[OTM Open Tab] Error opening tab:', error);
                });
            } else if (tabPromise) {
                // Fallback if it's not a Promise (older GM versions)
                window.openTabs.push({
                    tab: tabPromise,
                    url: url,
                    openedAt: Date.now(),
                    hostname: 'otm.tahospital.vn'
                });
                console.log('[OTM Open Tab] Tab added to openTabs. New length:', window.openTabs.length);
            } else {
                console.log('[OTM Open Tab] GM.openInTab returned null/undefined');
            }
        } else {
            // Fallback for non-Greasemonkey environments
            const tab = window.open(url, '_blank');
            if (tab) {
                window.openTabs.push({
                    tab: tab,
                    url: url,
                    openedAt: Date.now(),
                    hostname: 'otm.tahospital.vn'
                });
                console.log('[OTM Open Tab] Fallback tab added to openTabs. New length:', window.openTabs.length);
            } else {
                console.log('[OTM Open Tab] window.open returned null/undefined');
            }
        }
    }
}

module.exports = {
    showDashboardBenhNhanIfNeeded
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../BS_CAI_DAT_GIAO_DIEN":1,"../components/actionButtons":5,"../components/advancedFilter":6,"../components/cardTooltip":8,"../components/contextMenu":9,"../components/copyDienTienAI":10,"../components/copyMenu":11,"../components/dialogManager":12,"../components/displaySettings":13,"../components/hsbaDataFetcher":14,"../components/listView":16,"../components/loginHandler":17,"../components/modalManager":18,"../components/patientInfoSection":19,"../components/phauThuatHandlers":20,"../components/responsiveDropdown":21,"../components/sidebarSession":23,"../components/trackingUI":24,"../services/apiService":36,"../services/checklistService":38,"../services/patientService":40,"../services/settingsService":43,"../utils":47,"../utils/checklistUtils":48,"../utils/dateUtils":50,"../utils/dischargeUtils":51,"../utils/domUpdaters":52,"../utils/htmlUtils":55,"../utils/khoaUtils":56,"../utils/patientDataMapper":57,"../utils/stateSync":58,"../utils/surgeryUtils":59,"../utils/tagUtils":60,"../utils/textUtils":61,"../utils/uiUtils":62,"./page.dashboard.support":31}],31:[function(require,module,exports){
// dashboard.support.js - Refactored with modular architecture

const ReportService = require('../services/reportService');
const ApiService = require('../services/apiService');
const DialogManager = require('../components/dialogManager');
const DateUtils = require('../utils/dateUtils');

/**
 * Create direct report generation dialog
 */
async function createDirectReportGeneration() {
    const data = window.dr_data || [];

    // Create dialog
    const { dialog, inner } = DialogManager.createDialog('dr-direct-report-dialog', { maxWidth: '1100px', maxHeight: '88vh' });
    // Layout: flex column with a scrollable content area and a fixed (in-modal) footer
    try {
        inner.style.display = 'flex';
        inner.style.flexDirection = 'column';
        inner.style.overflowY = 'hidden';
        inner.style.paddingBottom = '0px';
    } catch (_) { }

    try {
        // Show loading state
        inner.innerHTML = `
            <div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>
            <div style="text-align:center;padding:20px;">
                <div>Đang tải dữ liệu báo cáo...</div>
            </div>
        `;

        // Load checklist state for all patients
        // Ưu tiên dùng checklistState in-memory từ window.dr_data (đã được cập nhật real-time
        // khi người dùng chỉnh HXT, CDKT trong sidebar). Chỉ fetch từ server cho BN chưa có.
        const { sortedPatients, states } = await ReportService.getBatchChecklistStates(data, { preferInMemory: true });

        // Generate report content (all patients)
        const htmlContent = ReportService.generateHTMLReport(sortedPatients, states);
        const textReport = ReportService.generateTextReport(sortedPatients, states);

        // Helpers to classify new patients using ngayvk + tenkpvv vs current khoa
        function parseAdmitDateToMidnight(dateStr) {
            if (!dateStr) return null;
            try {
                const us = DateUtils.convertToUSFormat(String(dateStr));
                const d = new Date(us);
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

        function formatDateVN(d) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }

        function filterNewPatientsTodayFlow(patientsArr, statesArr, targetDate) {
            const target = new Date(targetDate);
            target.setHours(0, 0, 0, 0);
            const currentKhoaName = getCurrentKhoaName();
            const normalizedCurrentKhoa = normalizeDeptName(currentKhoaName);
            const normalizedGmhs = normalizeDeptName('KHOA GÂY MÊ - HỒI SỨC');
            const zipped = patientsArr.map((p, i) => ({ p, s: statesArr[i] }));

            const grouped = {
                newAtDeptPatients: [],
                newAtDeptStates: [],
                receivedPatients: [],
                receivedStates: []
            };

            const filtered = [];

            zipped.forEach(({ p, s }) => {
                const ngayVaoKhoa = parseAdmitDateToMidnight(p && p.ngayvk);
                if (!ngayVaoKhoa || ngayVaoKhoa.getTime() !== target.getTime()) {
                    return;
                }

                const normalizedTenKpvv = normalizeDeptName(p && p.tenkpvv);
                const normalizedTenKhoaChuyen = normalizeDeptName(p && p.tenkhoachuyen);
                const isReceivedFromOtherDept = Boolean(
                    normalizedCurrentKhoa &&
                    normalizedTenKpvv &&
                    normalizedCurrentKhoa !== normalizedTenKpvv
                );

                if (!isReceivedFromOtherDept && normalizedTenKhoaChuyen === normalizedGmhs) {
                    const ngayVaoVien = parseAdmitDateToMidnight(p && p.ngayvv);
                    if (!ngayVaoVien || ngayVaoVien.getTime() !== target.getTime()) {
                        return;
                    }
                }

                filtered.push({ p, s });

                if (isReceivedFromOtherDept) {
                    grouped.receivedPatients.push(p);
                    grouped.receivedStates.push(s);
                } else {
                    grouped.newAtDeptPatients.push(p);
                    grouped.newAtDeptStates.push(s);
                }
            });

            return {
                patients: filtered.map(z => z.p),
                states: filtered.map(z => z.s),
                ...grouped
            };
        }

        function filterNewPatientsYesterdayFlow(patientsArr, statesArr, targetDate) {
            const target = new Date(targetDate);
            target.setHours(0, 0, 0, 0);
            const zipped = patientsArr.map((p, i) => ({ p, s: statesArr[i] }));
            const filtered = zipped.filter(({ p }) => {
                const d = parseAdmitDateToMidnight(p && p.ngayvv);
                return d && d.getTime() === target.getTime();
            });

            return {
                patients: filtered.map(z => z.p),
                states: filtered.map(z => z.s),
                newAtDeptPatients: filtered.map(z => z.p),
                newAtDeptStates: filtered.map(z => z.s),
                receivedPatients: [],
                receivedStates: []
            };
        }

        function formatGroupedTextSection(patients, sectionStates) {
            let text = '';
            patients.forEach((patient, idx) => {
                const data = ReportService.formatPatientData(patient, idx, sectionStates[idx] || {});
                const locationText = data.room ? `${data.room} ${data.bed}`.trim() : data.bed;
                text += `${data.index}. ${locationText} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
                text += `   Chẩn đoán: ${data.diagnosis}\n`;
                if (data.ppptDisplay) text += `   PPPT: ${data.ppptDisplay}\n`;
                if (data.ngayPtDisplay) text += `   Ngày PT: ${data.ngayPtDisplay}\n`;
                if (data.hxt) text += `   HXT: ${data.hxt}\n`;
            });
            return text;
        }

        function buildGroupedNewPatientReport({ title, grouped }) {
            const total = grouped.patients.length;

            let html = `<div style='margin:0 0 10px 0;'><h2 style='font-size:1.25em; margin:0; color:#0f172a;'>${title}</h2><div style='color:#334155;'>Tổng số bệnh nhân mới: <b>${total}</b></div></div>`;
            let text = `${title}\nTổng số bệnh nhân mới: ${total}\n\n`;

            html += `<div style='margin:0 0 6px 0; font-weight:700; color:#14532d;'>Bệnh mới của khoa (${grouped.newAtDeptPatients.length})</div>`;
            html += ReportService.generateHTMLReport(grouped.newAtDeptPatients, grouped.newAtDeptStates);
            text += `Bệnh mới của khoa (${grouped.newAtDeptPatients.length})\n`;
            text += formatGroupedTextSection(grouped.newAtDeptPatients, grouped.newAtDeptStates);
            text += `\n`;

            html += `<div style='margin:8px 0 6px 0; font-weight:700; color:#9a3412;'>Nhận từ khoa khác (${grouped.receivedPatients.length})</div>`;
            html += ReportService.generateHTMLReport(grouped.receivedPatients, grouped.receivedStates);
            text += `Nhận từ khoa khác (${grouped.receivedPatients.length})\n`;
            text += formatGroupedTextSection(grouped.receivedPatients, grouped.receivedStates);

            return { html, text };
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const todayGrouped = filterNewPatientsTodayFlow(sortedPatients, states, today);
        const yesterdayGrouped = filterNewPatientsYesterdayFlow(sortedPatients, states, yesterday);
        const todayPatients = todayGrouped.patients;
        const yesterdayPatients = yesterdayGrouped.patients;
        const { html: htmlToday, text: textToday } = buildGroupedNewPatientReport({
            title: `BỆNH MỚI ${formatDateVN(today)}`,
            grouped: todayGrouped
        });
        const { html: htmlYesterday, text: textYesterday } = buildGroupedNewPatientReport({
            title: `BỆNH MỚI ${formatDateVN(yesterday)}`,
            grouped: yesterdayGrouped
        });

        // Filter by surgery date (latest surgery in state.phauThuatLog[0])
        function filterBySurgeryDay(patientsArr, statesArr, targetDate) {
            const target = new Date(targetDate); target.setHours(0, 0, 0, 0);
            const zipped = patientsArr.map((p, i) => ({ p, s: statesArr[i] }));
            const filtered = zipped.filter(({ s }) => {
                if (!s || !Array.isArray(s.phauThuatLog) || s.phauThuatLog.length === 0) return false;
                const dStr = s.phauThuatLog[0] && s.phauThuatLog[0].date;
                const d = parseAdmitDateToMidnight(dStr);
                return d && d.getTime() === target.getTime();
            });
            return {
                patients: filtered.map(z => z.p),
                states: filtered.map(z => z.s)
            };
        }

        const { patients: ptTodayPatients, states: ptTodayStates } = filterBySurgeryDay(sortedPatients, states, today);
        const { patients: ptYesterdayPatients, states: ptYesterdayStates } = filterBySurgeryDay(sortedPatients, states, yesterday);
        const htmlPtToday = ReportService.generateHTMLReport(ptTodayPatients, ptTodayStates);
        const textPtToday = ReportService.generateTextReport(ptTodayPatients, ptTodayStates);
        const htmlPtYesterday = ReportService.generateHTMLReport(ptYesterdayPatients, ptYesterdayStates);
        const textPtYesterday = ReportService.generateTextReport(ptYesterdayPatients, ptYesterdayStates);

        // Create action buttons (copy set only)
        const copyButtons = DialogManager.createActionButtons([
            {
                id: 'dr-copy-direct-report',
                className: 'btn btn-primary',
                text: 'Copy bệnh ở khoa',
                onclick: () => copyReportToClipboardRich(htmlContent, textReport)
            },
            {
                id: 'dr-copy-direct-report-yesterday',
                className: 'btn btn-secondary',
                text: 'Copy bệnh mới hôm qua',
                onclick: () => {
                    if (!yesterdayPatients || yesterdayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân mới hôm qua.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlYesterday, textYesterday);
                }
            },
            {
                id: 'dr-copy-direct-report-today',
                className: 'btn btn-secondary',
                text: 'Copy bệnh mới hôm nay',
                onclick: () => {
                    if (!todayPatients || todayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân mới hôm nay.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlToday, textToday);
                }
            },
            {
                id: 'dr-copy-direct-report-pt-yesterday',
                className: 'btn btn-secondary',
                text: 'Copy bệnh PT hôm qua',
                onclick: () => {
                    if (!ptYesterdayPatients || ptYesterdayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân PT hôm qua.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlPtYesterday, textPtYesterday);
                }
            },
            {
                id: 'dr-copy-direct-report-pt-today',
                className: 'btn btn-secondary',
                text: 'Copy bệnh PT hôm nay',
                onclick: () => {
                    if (!ptTodayPatients || ptTodayPatients.length === 0) {
                        try { DialogManager.showToast('Không có bệnh nhân PT hôm nay.'); } catch (_) { }
                        return;
                    }
                    copyReportToClipboardRich(htmlPtToday, textPtToday);
                }
            }
        ]);

        // Update dialog content: a scrollable content area
        inner.innerHTML = `<div id="dr-report-content" style="flex:1; overflow:auto;">${htmlContent}</div>`;
        // Build footer bar fixed within modal (not sticky)
        const footerBar = document.createElement('div');
        footerBar.style.cssText = [
            'background:#fff',
            'padding:10px 0 0',
            'margin-top:8px',
            'border-top:1px solid #eee',
            'box-shadow:0 -2px 8px rgba(0,0,0,0.05)'
        ].join(';');
        // Arrange copy buttons into a 2x3 grid as requested
        try {
            const grid = copyButtons;
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr 1fr';
            grid.style.gridTemplateRows = 'auto auto';
            grid.style.gap = '12px';
            grid.style.justifyContent = 'stretch';
            grid.style.alignItems = 'stretch';

            const btnAll = grid.querySelector('#dr-copy-direct-report');
            const btnNewY = grid.querySelector('#dr-copy-direct-report-yesterday');
            const btnNewT = grid.querySelector('#dr-copy-direct-report-today');
            const btnPtY = grid.querySelector('#dr-copy-direct-report-pt-yesterday');
            const btnPtT = grid.querySelector('#dr-copy-direct-report-pt-today');
            if (btnAll) {
                btnAll.style.gridColumn = '1';
                btnAll.style.gridRow = '1 / span 2';
                btnAll.style.height = '100%';
                btnAll.style.width = '100%';
            }
            if (btnNewY) { btnNewY.style.gridColumn = '2'; btnNewY.style.gridRow = '1'; btnNewY.style.width = '100%'; }
            if (btnNewT) { btnNewT.style.gridColumn = '2'; btnNewT.style.gridRow = '2'; btnNewT.style.width = '100%'; }
            if (btnPtY) { btnPtY.style.gridColumn = '3'; btnPtY.style.gridRow = '1'; btnPtY.style.width = '100%'; }
            if (btnPtT) { btnPtT.style.gridColumn = '3'; btnPtT.style.gridRow = '2'; btnPtT.style.width = '100%'; }
        } catch (_) { }

        if (copyButtons && copyButtons.style) copyButtons.style.marginTop = '0';
        footerBar.appendChild(copyButtons);

        // Add a separate right-aligned close button row
        const closeRow = document.createElement('div');
        closeRow.style.cssText = 'display:flex;justify-content:flex-end;margin-top:8px;';
        const closeBtnWrap = DialogManager.createActionButtons([
            {
                id: 'dr-close-direct-report',
                className: 'btn btn-secondary',
                text: 'Đóng',
                onclick: () => dialog.remove()
            }
        ]);
        // Flatten wrapper styles
        if (closeBtnWrap && closeBtnWrap.style) {
            closeBtnWrap.style.marginTop = '0';
        }
        closeRow.appendChild(closeBtnWrap);
        footerBar.appendChild(closeRow);
        inner.appendChild(footerBar);

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
 * Copy rich HTML (with plain text fallback) to clipboard for better pasting into Google Docs
 */
async function copyReportToClipboardRich(html, textFallback) {
    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const blobHTML = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([textFallback || ''], { type: 'text/plain' });
            const data = new ClipboardItem({
                'text/html': blobHTML,
                'text/plain': blobText
            });
            await navigator.clipboard.write([data]);
        } else {
            // Fallback: inject a hidden contenteditable, select, execCommand
            const div = document.createElement('div');
            div.contentEditable = 'true';
            div.style.position = 'fixed';
            div.style.left = '-9999px';
            div.style.top = '0';
            div.innerHTML = html;
            document.body.appendChild(div);
            const range = document.createRange();
            range.selectNodeContents(div);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            document.body.removeChild(div);
        }
        DialogManager.showToast('Đã copy báo cáo (định dạng) vào clipboard!');
    } catch (error) {
        console.error('Failed to copy rich report:', error);
        // Last resort fallback
        try {
            await navigator.clipboard.writeText(textFallback || '');
            DialogManager.showToast('Đã copy báo cáo dạng text (fallback).');
        } catch (e2) {
            DialogManager.showToast('Lỗi khi copy báo cáo', {
                background: '#d32f2f',
                duration: 3000
            });
        }
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
        /* Sidebar action buttons polish */
        .dr-sidebar-actions { gap: 10px !important; padding: 6px 0 4px 0; }
        .dr-sidebar-actions .dr-detail-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 14px; border-radius: 12px; border: 1px solid #cbd5e1;
            background: #ffffff; color: #0f172a; font-weight: 600; line-height: 1;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); transition: all 0.18s ease;
        }
        .dr-sidebar-actions .dr-detail-btn svg { width: 18px; height: 18px; }
        .dr-sidebar-actions .dr-detail-btn img { width: 18px; height: 18px; object-fit: contain; display: block; }
        .dr-sidebar-actions .dr-detail-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12); border-color: #94a3b8; }
        .dr-sidebar-actions .dr-detail-btn:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.10); }
        .dr-sidebar-actions .dr-detail-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35); }
        .dr-sidebar-actions .dr-detail-btn:first-child { background: linear-gradient(180deg, #1e88e5, #1976d2); color: #fff; border-color: #1976d2; }
        .dr-sidebar-actions .dr-detail-btn:first-child:hover { filter: brightness(1.03); box-shadow: 0 6px 14px rgba(25, 118, 210, 0.25); }
        .dr-sidebar-actions .dr-detail-btn:last-child { background: #ffffff; color: #0f172a; border-color: #cbd5e1; }
        .dr-sidebar-actions .dr-detail-btn:last-child:hover { background: #f8fafc; }

        /* Quick y lệnh actions */
        .quick-ylenh-actions { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; padding:10px; background:#f8f9fa; border-radius:8px; border:1px solid #e9ecef; }
        .quick-ylenh-btn { display:flex; align-items:center; gap:6px; padding:8px 12px; border:none; border-radius:6px; background:#fff; color:#333; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s ease; border:2px solid transparent; white-space:nowrap; position:relative; }
        .quick-ylenh-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); border-color: currentColor; }
        .quick-ylenh-btn:active { transform: translateY(0); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .quick-ylenh-btn.active { border: 3px solid #d32f2f !important; background-color: #ffebee; box-shadow: 0 0 10px rgba(211, 47, 47, 0.3); }
        .quick-ylenh-btn.active::after { content: '⏳'; position:absolute; top:-6px; right:-6px; background:#1d4ed8; color:#fff; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; }
        .quick-ylenh-btn.done { border: 3px solid #2e7d32 !important; background-color: #e8f5e9; color: #1b5e20 !important; box-shadow: 0 0 10px rgba(27, 94, 32, 0.2); position: relative; }
        .quick-ylenh-btn.done::after { content: '✔'; position:absolute; top:-6px; right:-6px; background:#2e7d32; color:#fff; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; }
        .xv-time-editor { display:flex; align-items:center; gap:8px; padding:8px 12px; margin:6px 0 0 0; background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px; width:fit-content; }
        .xv-time-editor .xv-label { color:#0f172a; font-weight:600; }
        .xv-time-editor .xv-time { padding:4px 6px; border:1px solid #cbd5e1; border-radius:6px; }
        .xv-time-editor .xv-saved { color:#16a34a; font-weight:600; }

        /* Tags (generic) */
        .ylenh-tags { display:flex; flex-wrap:wrap; gap:4px; margin:8px 0 4px 0; overflow-wrap:anywhere; word-break:break-word; }
        .ylenh-tag { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background-color: rgba(76, 175, 80, 0.1); color:#2e7d32; border:1px solid rgba(76, 175, 80, 0.3); border-radius:12px; font-size:12px; font-weight:600; line-height:1.2; white-space:normal; overflow-wrap:anywhere; word-break:break-word; max-width:100%; flex-wrap:wrap; }
        .ylenh-tag.discharge { background: linear-gradient(45deg, #4caf50, #66bb6a) !important; color: #fff !important; border: 2px solid #4caf50 !important; font-weight:700 !important; font-size:12px; text-shadow: 0 1px 1px rgba(0,0,0,0.25); }
        .ylenh-tag.completed { background-color: rgba(76, 175, 80, 0.2); color: #1b5e20; border-color: rgba(76, 175, 80, 0.5); }
        .ylenh-tag.state-active { background-color: rgba(37, 99, 235, 0.10); color:#1d4ed8; border-color: rgba(37, 99, 235, 0.35); font-weight:700; }
        .ylenh-tag.state-done { background-color: rgba(34, 197, 94, 0.12); color:#15803d; border-color: rgba(34, 197, 94, 0.45); font-weight:600; }
        .ylenh-tag.discharge.state-active { font-size:12.5px; font-weight:700; color:#ffffff !important; text-shadow: 0 1px 1px rgba(0,0,0,0.35); border-color:#2e7d32 !important; padding:4px 9px; }

        /* Card meds-done badge */
        .dr-card .dr-badge-meds-done { position:absolute; top:-10px; right:10px; background:#16a34a; color:#fff; font-weight:800; font-size:11px; border-radius:999px; padding:4px 8px; box-shadow:0 2px 6px rgba(22,163,74,0.35); display:inline-flex; align-items:center; gap:6px; z-index:2; }
        .dr-card .dr-badge-meds-done::before { content:'✔'; background: rgba(255,255,255,0.2); width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:11px; }
        .dr-card.meds-done { border: 2px solid #16a34a !important; box-shadow: 0 0 0 2px rgba(22,163,74,0.08), 0 4px 12px rgba(0,0,0,0.06); }
        .dr-card-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 20px; 
            justify-content: center; 
            padding: 30px; 
            /* Ensure content is not hidden behind fixed bottom bar */
            padding-bottom: 90px; 
        }
        /* List view container and rows */
        .dr-list-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 10px 12px 90px 12px; /* keep room for bottom bar */
        }
        @media (min-width: 1200px) {
            .dr-list-container {
                grid-template-columns: 1fr 1fr; /* 2 columns on large screens */
            }
        }
        .dr-list-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 12px 10px 12px; /* extra top space for badge */
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
            cursor: pointer;
            min-height: 60px;
            position: relative; /* anchor for corner badges */
        }
        .dr-list-row:hover {
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.10);
            border-color: #cbd5e1;
        }
        .dr-list-title {
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    .dr-list-title .dr-list-dem { color:#64748b; font-weight:600; }
    .dr-list-title .dr-list-mabn { color:#334155; font-weight:700; }
    .dr-list-title .dr-list-loc { color:#64748b; }
        .dr-list-sub {
            color: #64748b;
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 4px;
        }
        .dr-list-dx {
            color: #0f172a;
            font-size: 13px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            max-height: 2.8em;
        }
        /* Compact tags inside list rows */
        .dr-list-row .ylenh-tags {
            margin: 6px 0 0 0;
            gap: 4px;
        }
        .dr-list-row .ylenh-tag {
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            line-height: 1.15;
        }
        .dr-list-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
            flex-shrink: 0;
            position: relative; /* anchor for inline badge */
        }
        .dr-btn-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: linear-gradient(180deg, #1e88e5, #1976d2);
            box-shadow: 0 1px 2px rgba(25, 118, 210, 0.15);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
        }
        .dr-btn-icon:hover { transform: translateY(-1px); filter: brightness(1.03); box-shadow: 0 4px 10px rgba(25,118,210,0.22); }
        .dr-btn-icon:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(25,118,210,0.18); }
        .dr-btn-icon svg { width: 16px; height: 16px; }
        .dr-badge-meds-inline {
            background: #16a34a;
            color: #fff;
            font-weight: 700;
            font-size: 11px;
            border-radius: 999px;
            padding: 2px 8px;
            line-height: 1.2;
            box-shadow: 0 1px 2px rgba(22,163,74,0.2);
            white-space: nowrap;
            position: absolute;
            top: -8px;
            right: -6px;
            pointer-events: none;
        }
        .dr-badge-meds-row-corner {
            position: absolute;
            top: -8px;
            left: -6px;
            background: #16a34a;
            color: #fff;
            font-weight: 800;
            font-size: 10px;
            border-radius: 999px;
            padding: 3px 8px;
            line-height: 1;
            box-shadow: 0 1px 3px rgba(22,163,74,0.25);
            pointer-events: none;
            z-index: 2;
        }
        /* Unify HXT typography */
        .dr-hxt-block { color: #0f172a; font-size: 13px; line-height: 1.35; }
        .dr-hxt-block .dr-label { color: #0f172a; font-weight: 700; }

        /* Display Settings dynamic visibility */
        body.dr-hide-hxt .dr-hxt-block { display: none !important; }
        body.dr-hide-pppt .dr-pt-info .dr-value:first-child { display: none !important; }
        body.dr-hide-surgeon .dr-surgeon-line { display: none !important; }
        .dr-surgeon-line { color: #555; font-size: 0.9em; margin-bottom: 2px; }

        /* Context Menu Styles */
        .dr-context-menu {
            position: fixed;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 4px 0;
            min-width: 180px;
            z-index: 1000000;
            font-size: 14px;
        }
        .dr-context-menu-item {
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #333;
            transition: background 0.15s;
        }
        .dr-context-menu-item:hover {
            background: #f1f5f9;
        }
        
        /* Modal Settings Styles */
        .dr-settings-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.4); z-index: 999998;
            display: flex; align-items: center; justify-content: center;
        }
        .dr-settings-modal {
            background: #fff; border-radius: 8px; width: 400px;
            max-width: 90vw; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow: hidden; z-index: 999999;
        }
        .dr-settings-header {
            padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
        }
        .dr-settings-header h3 { margin: 0; color: #0f172a; font-size: 16px; font-weight: 600; }
        .dr-settings-close {
            background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b;
        }
        .dr-settings-body { padding: 20px; }
        .dr-settings-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #f1f5f9;
        }
        .dr-settings-row:last-child { border-bottom: none; }
        .dr-settings-label { color: #334155; font-weight: 500; font-size: 14px; }
        
        /* Toggle Switch */
        .dr-switch {
            position: relative; display: inline-block; width: 40px; height: 22px;
        }
        .dr-switch input { opacity: 0; width: 0; height: 0; }
        .dr-slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #cbd5e1; transition: .3s; border-radius: 22px;
        }
        .dr-slider:before {
            position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px;
            background-color: white; transition: .3s; border-radius: 50%;
        }
        input:checked + .dr-slider { background-color: #1976d2; }
        input:checked + .dr-slider:before { transform: translateX(18px); }
        @media (max-width: 600px) {
            .dr-list-row { padding: 12px 10px 8px 10px; gap: 10px; }
            .dr-list-title { font-size: 14px; }
            .dr-list-sub { font-size: 11px; }
            .dr-list-dx { font-size: 12px; -webkit-line-clamp: 2; }
            .dr-btn-icon { width: 30px; height: 30px; border-radius: 8px; }
            .dr-btn-icon svg { width: 14px; height: 14px; }
            .dr-sidebar-actions { gap: 6px !important; }
            .dr-sidebar-actions .dr-detail-btn { gap:6px; padding:8px 10px; border-radius:10px; font-size:12px; line-height:1.1; }
            .dr-sidebar-actions .dr-detail-btn svg,
            .dr-sidebar-actions .dr-detail-btn img { width:14px; height:14px; }
        }
            .dr-card { 
                background: #ffffff; 
                border-radius: 20px; 
                box-shadow: 0 2px 12px rgba(0,0,0,0.10); 
                padding: 14px 20px 50px 20px; 
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
        /* Room/bed label at the very top of the card — large & centered */
        .dr-room-label {
            width: 100%;
            text-align: center;
            font-size: 1.35em;
            font-weight: 800;
            color: #1565c0;
            letter-spacing: 0.04em;
            padding: 2px 0 10px 0;
            margin-bottom: 4px;
            border-bottom: 2px solid #bbdefb;
            word-break: break-word;
        }
        .dr-card.dr-blue .dr-room-label {
            color: #0d47a1;
            border-bottom-color: #90caf9;
        }
        .dr-card.dr-blue { 
            background: #e3f2fd; 
            border: 2px solid #90caf9; 
        }
        .dr-patient-name { 
            margin: 0 0 4px 0; 
            font-size: 1.25em; 
            color: #1976d2;
            font-weight: 700;
        }
        .dr-patient-sub-info {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.95em;
            color: #64748b;
        }
        .dr-patient-mabn { font-weight: 700; color: #334155; }
        .dr-patient-gender { color: #64748b; }
        .dr-card .dr-label { 
            font-weight: bold; 
            color: #000; 
        }
        .dr-card .dr-value { 
            margin-bottom: 6px; 
        }
        /* Clamp secondary diagnosis (CD kèm theo) to 2 lines in card view */
        .dr-card .dr-diagnosis-line .dr-cdkt-clamp {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            max-height: 2.8em; /* approx two lines */
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
            white-space: nowrap;
        }
            .dr-card .dr-detail-btn svg { 
                margin-right: 4px; 
                width: 16px; height: 16px;
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
        /* Bottom bar left cluster */
        .dr-bottom-bar-left { display:flex; align-items:center; gap: 10px; }
        .dr-bottom-bar-right {
            display:flex;
            align-items:center;
            justify-content:flex-end;
            margin-left:auto;
            min-width: 120px;
        }
        .dr-dashboard-refresh-countdown {
            display:inline-flex;
            align-items:center;
            justify-content:center;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid rgba(25,118,210,0.18);
            background: #f8fbff;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            letter-spacing: 0.01em;
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
            outline: none;
        }
        .dr-dashboard-refresh-countdown[data-busy="1"] {
            background: #e3f2fd;
            color: #1976d2;
            border-color: rgba(25,118,210,0.25);
        }
        .dr-dashboard-refresh-countdown:hover {
            filter: brightness(1.02);
            box-shadow: 0 0 0 2px rgba(25,118,210,0.08) inset;
        }
        .dr-dashboard-refresh-countdown:active {
            transform: translateY(1px);
        }

        /* Khoa select (pretty) */
        .dr-khoa-select {
            height: 34px;
            min-width: 200px;
            padding: 0 34px 0 10px; /* room for chevron */
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 1px 2px rgba(15,23,42,0.05);
            transition: border-color .15s ease, box-shadow .15s ease, filter .15s ease;
            -webkit-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;utf8,\
                <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'>\
                    <path d='M6 8l4 4 4-4' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>\
                </svg>");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 18px 18px;
            cursor: pointer;
        }
        .dr-khoa-select:hover { border-color: #94a3b8; filter: brightness(1.02); }
        .dr-khoa-select:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
        .dr-khoa-select:disabled { opacity: .6; cursor: not-allowed; }

        /* settings “gear” anchor next to select */
        .dr-gear-btn { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; color:#1976d2; border:1px solid rgba(25,118,210,0.25); text-decoration:none; background:#fff; transition: box-shadow .15s ease, background .15s ease; }
        .dr-gear-btn i { font-size:16px; }
        .dr-gear-btn:hover { background:#e3f2fd; box-shadow:0 0 0 2px rgba(25,118,210,0.15) inset; }

    /* Offline banner */
    .dr-offline-banner { background:#fff3cd; color:#8a6d3b; border:1px solid #ffeeba; padding:6px 10px; border-radius:6px; margin:8px 0; display:none; }
        .dr-bottom-bar-left { color: #1976d2; font-weight: bold; }
        @media (max-width: 600px) {
            .dr-bottom-bar { 
                flex-direction: column; 
                height: auto; 
                padding: 8px 8px; 
            }
            .dr-bottom-bar-right {
                margin-left: 0;
                width: 100%;
                justify-content: flex-end;
                padding-top: 6px;
            }
            .dr-card-list { 
                flex-direction: column; 
                align-items: center; 
            }
            /* Card action buttons: smaller on phones */
            .dr-card .dr-detail-btn {
                padding: 6px 10px 6px 8px;
                font-size: 12px;
                border-radius: 16px;
            }
            .dr-card .dr-detail-btn svg { width: 14px; height: 14px; margin-right: 4px; }
            /* Action group spacing and positioning */
            .dr-action-buttons { gap: 6px !important; right: 10px !important; bottom: 8px !important; }
            /* Icon-only copy button (inline style width/height) shrink */
            .dr-action-buttons .dr-detail-btn[title="Copy báo cáo (1 BN)"] {
                width: 30px !important; height: 30px !important; padding: 6px !important; border-radius: 8px !important;
            }
            .dr-action-buttons .dr-detail-btn[title="Copy báo cáo (1 BN)"] svg { width: 14px; height: 14px; }
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
        /* Sidebar responsive layout */
        @media (min-width: 1024px) {
            .dr-sidebar-container { flex-direction: row !important; gap: 24px !important; }
            .dr-sidebar-left { flex: 0 0 40% !important; }
            .dr-sidebar-right { flex: 1 !important; }
        }
        /* Xuất viện animation class - Hiệu ứng ngôi sao */
        .dr-card.xuatvienanimation, .dr-list-row.xuatvienanimation, .dr-tracking-item.xuatvienanimation {
            position: relative;
            overflow: hidden;
            border: 3px solid #ffd700 !important;
            background: linear-gradient(135deg, #fff9c4, #ffffff) !important;
            animation: starGlow 3s ease-in-out infinite;
        }
        
        /* Xuất viện animation cho card blue - border blue glow */
        .dr-card.xuatvienanimation.dr-blue, .dr-list-row.xuatvienanimation.dr-blue, .dr-tracking-item.xuatvienanimation.dr-blue {
            border: 3px solid #2196f3 !important;
            background: linear-gradient(135deg, #e3f2fd, #ffffff) !important;
            animation: starGlowBlue 3s ease-in-out infinite;
        }
        
        .dr-card.xuatvienanimation::before, .dr-list-row.xuatvienanimation::before, .dr-tracking-item.xuatvienanimation::before {
            content: '⭐';
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 24px;
            animation: starRotate 2s linear infinite;
            z-index: 10;
        }
        
        .dr-card.xuatvienanimation::after, .dr-list-row.xuatvienanimation::after, .dr-tracking-item.xuatvienanimation::after {
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
            .no-print,
            .dr-action-buttons,
            #dr-global-card-tooltip { 
                display: none !important; 
            }

            /* Layout for side-by-side columns */
            body {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                align-items: flex-start !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            /* White cards (214, 215, 216) - giữ màu trắng khi in */
            .dr-card:not(.dr-blue) {
                background: #fff !important;
                border: 2px solid #ddd !important;
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
            
            /* Hide dashboard controls but keep layout structure for children */
            .dr-bottom-bar, .dr-topbar-center, .dr-topbar-right, 
            #dr-search-input, #dr-tracking-btn, #dr-tracking-badge,
            .dr-view-dropdown, .dr-view-toggle {
                display: none !important;
            }
            
            /* Allow tracking container to be visible during print if it's actually open */
            .dr-top-filter-bar, .dr-topbar-left {
                display: block !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                height: auto !important;
                background: transparent !important;
                flex: 0 0 100% !important; /* Default to full width for top elements */
            }

            /* When tracking is open, it acts as a sidebar */
            body:has(#dr-tracking-container.dr-tracking-open:not(.dr-tracking-empty)) .dr-top-filter-bar {
                flex: 0 0 300px !important;
                width: 300px !important;
                margin-right: 20px !important;
            }
            body:has(#dr-tracking-container.dr-tracking-open:not(.dr-tracking-empty)) #dr-main-wrapper {
                flex: 1 !important;
                width: calc(100% - 320px) !important;
            }

            #dr-main-wrapper {
                flex: 0 0 100% !important;
                width: 100% !important;
                margin: 0 !important;
            }

            /* Tắt animation khi in */
            .dr-card.xuatvienanimation, .dr-list-row.xuatvienanimation, .dr-tracking-item.xuatvienanimation,
            .dr-card.xuatvienanimation.dr-blue, .dr-list-row.xuatvienanimation.dr-blue, .dr-tracking-item.xuatvienanimation.dr-blue {
                animation: none !important;
                border: 2px solid #ccc !important;
                background: #fff !important;
            }
            .dr-card.xuatvienanimation::before, .dr-list-row.xuatvienanimation::before, .dr-tracking-item.xuatvienanimation::before,
            .dr-card.xuatvienanimation.dr-blue::before, .dr-list-row.xuatvienanimation.dr-blue::before, .dr-tracking-item.xuatvienanimation.dr-blue::before {
                display: none !important;
            }

            /* Hỗ trợ in danh sách theo dõi - Chỉ in nếu có class dr-tracking-open và không empty */
            #dr-tracking-container:not(.dr-tracking-open),
            #dr-tracking-container.dr-tracking-empty {
                display: none !important;
            }

            #dr-tracking-container.dr-tracking-open {
                display: flex !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                border: 1px solid #ddd !important;
                border-radius: 8px !important;
                box-shadow: none !important;
                padding: 12px !important;
                margin: 0 !important;
                page-break-before: auto !important;
                background: #fff !important;
                flex-direction: column !important;
            }
            #dr-tracking-scroll-area {
                overflow: visible !important;
                height: auto !important;
                flex: none !important;
            }
            #dr-tracking-active-list {
                display: grid !important;
                grid-template-columns: 1fr !important; /* Multi-column in small sidebar is too cramped, stick to 1 */
                gap: 10px !important;
                width: 100% !important;
            }
            .dr-card.dr-tracking-card {
                max-height: none !important;
                border: 1px solid #eee !important;
                page-break-inside: avoid;
            }
            /* Ẩn phần nhập liệu và các nút toggle khi in */
            #dr-tracking-container > div:nth-child(2),
            #dr-tracking-toggle-mode,
            #dr-tracking-copy-wrapper,
            .dr-tracking-remove,
            .dr-tracking-bulk-remove {
                display: none !important;
            }
            #dr-tracking-container h4 {
                font-size: 16px !important;
                margin-bottom: 10px !important;
            }
        }

        /* --- Dashboard Top Bar Controls --- */
        .dr-top-filter-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
        }
        .dr-topbar-left,
        .dr-topbar-right {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            flex-wrap: wrap;
        }
        .dr-topbar-left {
            flex: 1 1 360px;
        }
        .dr-topbar-center {
            flex: 0 0 auto;
        }
        .dr-topbar-right {
            flex: 1 1 360px;
            justify-content: flex-end;
        }
        .dr-topbar-checkbox {
            color: #334155;
            font-size: 13px;
            font-weight: 600;
        }
        .dr-topbar-control-btn {
            height: 38px;
            padding: 0 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            color: #475569;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dr-topbar-control-btn:hover {
            border-color: #94a3b8;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateY(-1px);
        }
        .dr-topbar-control-btn:active {
            transform: translateY(0);
        }
        .dr-topbar-control-btn i:first-child {
            color: #1e88e5;
        }
        #dr-tracking-btn {
            color: #1976d2;
        }
        #dr-tracking-btn i:first-child {
            color: #1976d2;
        }
        .dr-topbar-dropdown {
            position: relative;
            display: inline-block;
        }
        .dr-topbar-dropdown .dr-dropdown-toggle {
            min-width: 0;
        }
        .dr-sort-dropdown .dr-dropdown-menu {
            min-width: 300px;
        }
        .dr-sort-dropdown .dr-dropdown-item {
            white-space: normal;
            line-height: 1.35;
            align-items: flex-start;
        }
        .dr-sort-dropdown.dr-sort-active .dr-dropdown-toggle {
            border-color: #1976d2;
            color: #1976d2;
            background: #eff6ff;
        }
        .dr-filter-dropdown .dr-dropdown-menu {
            min-width: 280px;
        }
        .dr-sort-dropdown:hover .dr-dropdown-menu,
        .dr-sort-dropdown.open .dr-dropdown-menu,
        .dr-filter-dropdown:hover .dr-dropdown-menu,
        .dr-filter-dropdown.open .dr-dropdown-menu {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        .dr-sort-dropdown:hover .dr-dropdown-toggle i.fa-chevron-down,
        .dr-sort-dropdown.open .dr-dropdown-toggle i.fa-chevron-down,
        .dr-filter-dropdown:hover .dr-dropdown-toggle i.fa-chevron-down,
        .dr-filter-dropdown.open .dr-dropdown-toggle i.fa-chevron-down {
            transform: rotate(180deg);
        }
        /* Fix hover gap: invisible bridge between toggle and menu so mouse doesn't leave container */
        .dr-sort-dropdown .dr-dropdown-menu::before,
        .dr-view-dropdown .dr-dropdown-menu::before,
        .dr-filter-dropdown .dr-dropdown-menu::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 0;
            right: 0;
            height: 10px;
        }
        .dr-filter-quick-menu .dr-dropdown-item {
            justify-content: space-between;
        }
        .dr-filter-quick-menu .dr-filter-quick-indicator {
            opacity: 0;
            color: #16a34a;
            transition: opacity 0.15s ease;
        }
        .dr-filter-submenu {
            position: relative;
        }
        .dr-filter-submenu-menu {
            position: absolute;
            top: -8px;
            left: calc(100% - 8px);
            min-width: 180px;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 6px;
            display: none;
            opacity: 0;
            transform: translateX(8px);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10002;
        }
        .dr-filter-submenu:hover .dr-filter-submenu-menu {
            display: block;
            opacity: 1;
            transform: translateX(0);
        }
        .dr-filter-submenu.open .dr-filter-submenu-menu {
            display: block;
            opacity: 1;
            transform: translateX(0);
        }
        .dr-filter-submenu-menu::before {
            content: '';
            position: absolute;
            left: -20px;
            top: 0;
            bottom: 0;
            width: 25px;
        }

        @media (max-width: 1180px) {
            .dr-top-filter-bar {
                padding: 10px 12px !important;
                gap: 10px !important;
                flex-wrap: nowrap !important;
            }
            .dr-topbar-left,
            .dr-topbar-center,
            .dr-topbar-right {
                flex: 0 0 auto !important;
                flex-wrap: nowrap !important;
                min-width: 0 !important;
            }
            .dr-topbar-right {
                gap: 8px !important;
            }
            .dr-topbar-control-btn,
            .dr-topbar-dropdown .dr-dropdown-toggle {
                height: 34px !important;
                padding: 0 10px !important;
                min-width: 0 !important;
                font-size: 13px !important;
            }
            .dr-topbar-btn-text,
            #dr-view-label-text {
                display: none !important;
            }
            .dr-topbar-checkbox {
                display: none !important;
            }
            #dr-search-input {
                height: 34px !important;
                flex: 0 0 160px !important;
                min-width: 160px !important;
                max-width: 220px !important;
                font-size: 13px !important;
            }
            #dr-total-compact {
                min-width: 88px !important;
                font-size: 12px !important;
                padding: 4px 8px !important;
            }
        }

        @media (max-width: 960px) {
            .dr-top-filter-bar {
                gap: 8px !important;
            }
            .dr-topbar-left,
            .dr-topbar-center,
            .dr-topbar-right {
                flex: 0 0 auto !important;
                flex-wrap: nowrap !important;
                min-width: 0 !important;
            }
            #dr-search-input {
                flex: 0 0 140px !important;
                min-width: 140px !important;
                max-width: 180px !important;
            }
        }

        @media (max-width: 680px) {
            .dr-top-filter-bar {
                padding: 8px 8px !important;
                gap: 6px !important;
                flex-wrap: nowrap !important;
            }
            .dr-topbar-left,
            .dr-topbar-right {
                gap: 4px !important;
            }
            .dr-topbar-control-btn,
            .dr-topbar-dropdown .dr-dropdown-toggle {
                height: 30px !important;
                padding: 0 8px !important;
                min-width: 0 !important;
                gap: 4px !important;
                border-radius: 9999px !important;
                font-size: 12px !important;
            }
            #dr-search-input {
                min-width: 120px !important;
                height: 30px !important;
                font-size: 12px !important;
                padding: 0 8px !important;
            }
            #dr-total-compact {
                font-size: 11px !important;
                padding: 3px 6px !important;
                min-width: 72px !important;
            }
            .dr-sort-dropdown .dr-dropdown-menu {
                min-width: 240px !important;
                right: auto !important;
                left: 0 !important;
            }
            .dr-filter-submenu-menu {
                position: static !important;
                top: auto !important;
                left: auto !important;
                right: auto !important;
                transform: none !important;
                min-width: 100% !important;
                margin-top: 6px !important;
            }
            .dr-filter-submenu-menu::before {
                display: none !important;
            }
        }

        @media (max-width: 760px) {
            .dr-top-filter-bar {
                flex-wrap: nowrap !important;
                overflow: visible !important;
            }
            .dr-topbar-left,
            .dr-topbar-center,
            .dr-topbar-right {
                flex: 0 0 auto !important;
                flex-wrap: nowrap !important;
                min-width: 0 !important;
            }
            .dr-topbar-left,
            .dr-topbar-right {
                gap: 4px !important;
            }
            .dr-topbar-control-btn,
            .dr-topbar-dropdown .dr-dropdown-toggle {
                height: 30px !important;
                min-width: 0 !important;
                padding: 0 8px !important;
                gap: 4px !important;
                border-radius: 9999px !important;
            }
            .dr-topbar-control-btn .dr-topbar-btn-text,
            #dr-view-label-text,
            .dr-topbar-checkbox {
                display: none !important;
            }
            #dr-search-input {
                flex: 0 0 120px !important;
                min-width: 120px !important;
                max-width: 150px !important;
                height: 30px !important;
                padding: 0 8px !important;
                font-size: 12px !important;
            }
            #dr-total-compact {
                min-width: 72px !important;
                padding: 3px 6px !important;
                font-size: 11px !important;
            }
            .dr-sort-dropdown .dr-dropdown-menu,
            .dr-filter-dropdown .dr-dropdown-menu,
            .dr-view-dropdown .dr-dropdown-menu {
                min-width: 220px !important;
            }
        }

        /* --- Custom Premium Dropdown Styles --- */
        .dr-view-dropdown {
            position: relative;
            display: inline-block;
        }
        .dr-dropdown-toggle {
            padding: 8px 16px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            color: #334155;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            min-width: 160px;
            justify-content: space-between;
        }
        .dr-dropdown-toggle:hover {
            border-color: #94a3b8;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateY(-1px);
        }
        .dr-dropdown-toggle:active {
            transform: translateY(0);
        }
        .dr-dropdown-toggle i.fa-chevron-down {
            font-size: 10px;
            transition: transform 0.2s;
            color: #64748b;
        }
        .dr-view-dropdown.open .dr-dropdown-toggle i.fa-chevron-down {
            transform: rotate(180deg);
        }
        #dr-view-dropdown-container:hover .dr-dropdown-menu,
        #dr-view-dropdown-container.open .dr-dropdown-menu {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        #dr-view-dropdown-container:hover .dr-dropdown-toggle i.fa-chevron-down,
        #dr-view-dropdown-container.open .dr-dropdown-toggle i.fa-chevron-down {
            transform: rotate(180deg);
        }
        .dr-dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 180px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            padding: 6px;
            display: none;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dr-view-dropdown.open .dr-dropdown-menu {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        .dr-dropdown-item {
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .dr-dropdown-item:hover {
            background: rgba(30, 136, 229, 0.08);
            color: #1e88e5;
        }
        .dr-dropdown-item.active {
            background: #1e88e5;
            color: #fff;
        }
        .dr-dropdown-item i {
            width: 16px;
            text-align: center;
        }

        /* --- Fit to Screen Mode Styles --- */
        .dr-fit-container {
            display: grid;
            gap: 10px;
            padding: 15px;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden; /* No scroll requested */
            justify-items: center;
            align-items: center;
        }
        .dr-fit-container .dr-card {
            min-width: 0 !important;
            max-width: min(100%, 760px) !important;
            width: min(100%, 760px) !important;
            max-height: min(100%, 520px) !important;
            height: min(100%, 520px) !important;
            margin: 0 !important;
            padding: 8px !important; /* Slightly smaller padding */
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            border-radius: 12px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            overscroll-behavior: contain;
            position: relative;
            justify-self: center;
            align-self: center;
        }
        .dr-fit-container .dr-card .dr-room-label {
            font-size: var(--fit-title-size, 1.1em);
            padding-bottom: 2px;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #1e88e5; /* Stronger color for location */
        }
        .dr-fit-container .dr-card .dr-patient-name {
            font-size: var(--fit-name-size, 1.25em);
            font-weight: 800;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #0f172a;
        }
        .dr-fit-container .dr-card .dr-patient-sub-info {
            display: flex;
            gap: 10px;
            font-size: calc(var(--fit-text-size, 0.9em) - 1px);
            color: #64748b;
            margin-bottom: 2px;
            font-weight: 500;
        }
        .dr-fit-container .dr-card .dr-value {
            font-size: var(--fit-text-size, 0.9em);
            margin-bottom: 1px;
            line-height: 1.1;
            white-space: normal !important;
            overflow-wrap: anywhere;
            word-break: break-word;
        }
        .dr-fit-container .dr-card .dr-diagnosis-line,
        .dr-fit-container .dr-card .dr-pt-info,
        .dr-fit-container .dr-card .dr-hxt-block {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2; /* Clamp to 2 lines to save vertical space */
            overflow: hidden;
            font-size: var(--fit-text-size, 0.9em);
            white-space: normal !important;
            margin-bottom: 1px;
        }
        .dr-fit-container .ylenh-tags {
            margin-top: 2px;
            gap: 2px;
            flex-wrap: wrap;
            max-height: 2.2em;
            overflow: hidden;
        }
        .dr-fit-container .ylenh-tag {
            font-size: calc(var(--fit-text-size, 0.9em) - 2px);
            padding: 1px 4px;
        }

        /* --- Compact Bars and Hidden UI in Fit Mode --- */
        body.dr-fit-mode .dr-top-filter-bar {
            padding: 4px 12px !important;
            min-height: 0 !important;
            margin: 0 !important; /* Remove margin as requested */
        }
        body.dr-fit-mode .dr-bottom-bar {
            height: 34px !important; /* Extremely compact bottom bar */
            padding: 0 16px !important;
            margin: 0 !important; /* Remove margin as requested */
        }
        body.dr-fit-mode .dr-action-buttons {
            display: none !important; /* Hide action buttons as requested */
        }
        body.dr-fit-mode .dr-total-compact {
            padding: 2px 8px !important;
            font-size: 11px !important;
        }
        body.dr-fit-mode #dr-search-input {
            padding: 4px 8px !important;
            font-size: 12px !important;
        }
        body.dr-fit-mode .dr-dropdown-toggle {
            padding: 4px 10px !important;
            font-size: 12px !important;
            min-width: 120px !important;
        }
        body.dr-fit-mode .dr-khoa-select {
            height: 24px !important;
            font-size: 12px !important;
            padding: 0 24px 0 6px !important;
            background-size: 12px 12px !important;
        }
        body.dr-fit-mode .dr-gear-btn {
            width: 24px !important;
            height: 24px !important;
        }
        body.dr-fit-mode .dr-gear-btn i {
            font-size: 12px !important;
        }
        body.dr-fit-mode .dr-badge-meds-done {
            top: -5px !important;
            right: 5px !important;
            font-size: 9px !important;
            padding: 2px 6px !important;
        }

        /* --- Compact Bottom Bar Buttons --- */
        body.dr-fit-mode .dr-bottom-bar .dr-btn,
        body.dr-fit-mode .dr-bottom-bar button {
            padding: 4px 10px !important;
            font-size: 11px !important;
            border-radius: 6px !important;
            min-height: 0 !important;
            gap: 4px !important; /* Smaller gap */
        }
        body.dr-fit-mode .dr-bottom-bar .dr-copy-menu-item {
            padding: 6px 10px !important;
        }
        body.dr-fit-mode .dr-bottom-bar .dr-copy-menu-item div:first-child {
            font-size: 0.85em !important;
        }
        body.dr-fit-mode .dr-bottom-bar .dr-copy-menu-item div:last-child {
            font-size: 0.7em !important;
        }
        body.dr-fit-mode .dr-copy-dropdown-menu {
            width: 200px !important;
        }
                 display: none !important;
            }
        }

        /* Tracking UI Fit Cards (mimic fit container) with Hover Expansion */
        #dr-tracking-active-list .dr-card {
            background-color: #fff0f0 !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4px 6px !important;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            border-radius: 10px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
            position: relative;
            max-height: 120px;
            overflow: hidden !important;
            transition: box-shadow 0.2s ease, max-height 0.3s ease;
            z-index: 1;
        }
        #dr-tracking-active-list .dr-card .dr-room-label {
            font-size: 1.1em;
            padding-bottom: 2px;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #1e88e5;
        }
        #dr-tracking-active-list .dr-card .dr-patient-name {
            font-size: 1.1em;
            font-weight: 800;
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #0f172a;
        }
        #dr-tracking-active-list .dr-card .dr-patient-sub-info {
            display: flex;
            gap: 10px;
            font-size: 0.85em;
            color: #64748b;
            margin-bottom: 2px;
            font-weight: 500;
        }
        #dr-tracking-active-list .dr-card .dr-value {
            font-size: 0.82em;
            margin-bottom: 0px;
            line-height: 1.2;
            white-space: normal !important;
            word-break: break-word;
            overflow: hidden;
            padding-top: 0;
        }
        #dr-tracking-active-list .dr-card .dr-diagnosis-line,
        #dr-tracking-active-list .dr-card .dr-pt-info,
        #dr-tracking-active-list .dr-card .dr-hxt-block {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            font-size: 0.85em;
            white-space: normal !important;
            margin-bottom: 1px;
        }
        #dr-tracking-active-list .ylenh-tags {
            margin-top: 2px;
            gap: 2px;
            flex-wrap: wrap;
            max-height: 2.2em;
            overflow: hidden;
        }
        #dr-tracking-active-list .ylenh-tag {
            font-size: 10px;
            padding: 1px 4px;
            line-height: 1.2;
        }
        #dr-tracking-active-list .dr-action-buttons {
            transform: scale(0.85);
            transform-origin: bottom right;
            right: 8px !important;
            bottom: 6px !important;
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
    copyReportToClipboardRich,
    updateChecklistPhieu,
    createChecklistPhieu
};

},{"../components/dialogManager":12,"../services/apiService":36,"../services/reportService":41,"../utils/dateUtils":50}],32:[function(require,module,exports){
// page.lichmo.homnay.js - Refactored surgery schedule using OTMTokenService

const { showToast } = require('../utils/uiUtils');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const SurgeonSettingsService = require('../services/surgeonSettingsService');
const { createKhoaSelect } = require('../components/khoaSelect');
const OTMTokenService = require('../services/otm.token');

function stylesOnce() {
  if (document.getElementById('dr-qh-lichmo-css')) return;
  const st = document.createElement('style');
  st.id = 'dr-qh-lichmo-css';
  st.textContent = `
    .dr-qh-lichmo-wrap{min-height:100vh;background:#fff;color:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
    .dr-qh-lichmo-head{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e5e7eb;position:sticky;top:0;background:#fff;z-index:10;gap:12px}
    .dr-qh-lichmo-left{display:flex;align-items:center;gap:10px}
    .dr-qh-lichmo-title{margin:0;font-size:18px}
    .dr-qh-lichmo-khoa{color:#475569;font-size:13px;background:#f1f5f9;border-radius:8px;padding:3px 8px}
    .dr-qh-lichmo-mid{display:flex;align-items:center;gap:6px}
    .dr-qh-lichmo-date{font-weight:600}
    .dr-qh-lichmo-btn{border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}
    .dr-qh-lichmo-btn:hover{background:#f8fafc}
    .dr-qh-lichmo-right{display:flex;align-items:center;gap:8px}
    .dr-qh-lichmo-status{color:#64748b;font-size:13px}
    .dr-qh-lichmo-loading{width:16px;height:16px;border:2px solid #94a3b8;border-top-color:#0ea5e9;border-radius:50%;animation:drspin 1s linear infinite;display:none}
    .dr-qh-lichmo-loading.active{display:inline-block}
    @keyframes drspin{to{transform:rotate(360deg)}}
  .dr-qh-lichmo-content{padding:16px 18px;height:calc(100vh - 58px);overflow:auto;overscroll-behavior:contain}
  /* Timeline container */
  .dr-qh-timeline{position:relative;border-left:1px dashed #e2e8f0;padding-left:12px}
  .dr-qh-timegrid{position:relative;min-height:720px;background:linear-gradient(180deg,#fff 0,#fff 49%,#f8fafc 50%,#f8fafc 100%);background-size:100% 60px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
  .dr-qh-timeaxis{position:absolute;left:0;top:0;width:54px;border-right:1px solid #e5e7eb;background:#fff;z-index:2}
  .dr-qh-timeaxis .tick{position:absolute;left:0;right:0;height:1px;background:#e5e7eb}
  .dr-qh-timeaxis .label{position:absolute;left:6px;transform:translateY(-50%);font-size:12px;color:#64748b;background:#fff;padding:0 2px}
  .dr-qh-lanes{position:absolute;left:54px;right:0;top:0}
  .dr-qh-lane{position:relative}
  .dr-qh-evtbar{position:absolute;left:8px;right:12px;border-radius:16px;display:flex;flex-direction:column;align-items:flex-start;padding:14px 18px;color:#0f172a;box-shadow:0 8px 20px rgba(2,6,23,.12);border:1px solid rgba(15,23,42,.08);min-height:80px;transition:all .2s ease;overflow:hidden}
  .dr-qh-evtbar:hover{box-shadow:0 12px 30px rgba(2,6,23,.18);transform:translateY(-1px)}
  .dr-qh-evtbar .row{display:flex;gap:8px;align-items:flex-start;min-width:0;width:100%;line-height:1.4;margin-bottom:6px}
  .dr-qh-evtbar .row:last-child{margin-bottom:0}
  .dr-qh-evtbar .time{font-size:14px;font-weight:600;color:#1976d2;white-space:nowrap;margin-left:auto}
  .dr-qh-evtbar .patient{font-weight:800;font-size:18px;text-transform:uppercase;letter-spacing:.3px;color:#1976d2;line-height:1.2;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  .dr-qh-evtbar .method{font-size:14px;color:#374151;font-weight:500;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .dr-qh-evtbar .docs{font-size:14px;color:#7c3aed;font-weight:500;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  /* Emphasize OR row: largest and bold */
  .dr-qh-evtbar .or{font-size:16px;font-weight:800;color:#1976d2;background:#fef3c7;padding:4px 10px;border-radius:8px;border:1px solid #fbbf24;margin-bottom:4px;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  /* Make meta as prominent as patient */
  .dr-qh-evtbar .meta{font-size:14px;font-weight:600;color:#1f2937;background:#f3f4f6;padding:3px 8px;border-radius:6px;border:1px solid #d1d5db;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  .dr-qh-evtbar .diagnose{font-size:14px;color:#374151;font-weight:500;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .dr-qh-evtbar.tight{padding:8px 12px;min-height:80px}
  .dr-qh-evtbar.tight .method{font-size:13px}
  .dr-qh-evtbar.tight .docs{font-size:12px}
  .dr-qh-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;background:#f8fafc}
  @media (max-width: 1100px){.dr-qh-timeaxis{width:46px}.dr-qh-lanes{left:46px}}
  `;
  document.head.appendChild(st);
}

function formatTimeRange(start, end) {
  try {
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    const fmt = (d)=> d ? d.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';
    const sStr = fmt(s);
    const eStr = fmt(e);
    return sStr + (eStr ? ` - ${eStr}` : '');
  } catch(_) { return start || ''; }
}

function filterBySelectedSurgeons(surgeries, selectedNames) {
  if (!Array.isArray(surgeries) || surgeries.length === 0) return [];
  const set = new Set((selectedNames || []).map(s => (s || '').toString().trim().toLowerCase()).filter(Boolean));
  if (set.size === 0) return surgeries; // If nothing selected, show all
  return surgeries.filter(item => {
    const all = [
      ...(Array.isArray(item.userexec) ? item.userexec : []),
      ...(Array.isArray(item.userassistant) ? item.userassistant : [])
    ];
    return all.some(u => set.has(((u && (u.fullname || u.name)) || '').toString().trim().toLowerCase()));
  });
}

function sortByStart(a, b) {
  const as = a && a.start ? Date.parse(a.start) : 0;
  const bs = b && b.start ? Date.parse(b.start) : 0;
  return as - bs;
}

function renderTimeAxisHTML(startHour, endHour, timelineHeight = 720) {
  let ticksHTML = '';
  for (let h = startHour; h <= endHour; h++) {
    const y = (h - startHour) * (timelineHeight / (endHour - startHour));
    ticksHTML += `
      <div class="tick" style="top: ${y}px;"></div>
      <div class="label" style="top: ${y}px;">${String(h).padStart(2,'0')}:00</div>
    `;
  }
  return `<div class="dr-qh-timeaxis" style="height: ${timelineHeight}px;">${ticksHTML}</div>`;
}

function calculateContentHeight(item) {
  const { s } = item;
  
  // Count content rows
  let rowCount = 0;
  
  // Operating room + time row
  const opRoom = s.operating_room || (s.room && s.room.name) || '';
  if (opRoom) rowCount++;
  
  // Patient name row
  if (s.customer && s.customer.fullname) rowCount++;
  
  // Surgery method row
  if (s.surgerymethod) rowCount++;
  
  // Doctors row
  const docs = [...(s.userexec || []), ...(s.userassistant || [])];
  if (docs.length > 0) rowCount++;
  
  // Diagnosis row
  if (s.diagnose) rowCount++;
  
  // Meta info row
  const meta = [s.khoaLuuTri, s.khoaDieuTri, s.phongDieuTri, s.giuongDieuTri].filter(Boolean);
  if (meta.length > 0) rowCount++;

  // Base height + row height * number of rows
  const baseHeight = 40;
  const rowHeight = 22;
  const paddingHeight = 28;
  
  return baseHeight + (rowCount * rowHeight) + paddingHeight;
}

function renderSurgeryTimeline(surgeries) {
  if (!Array.isArray(surgeries) || surgeries.length === 0) {
    return '<div class="dr-qh-empty">Không có lịch mổ nào trong ngày hôm nay</div>';
  }

  // Sort surgeries by start time
  const sorted = [...surgeries].sort(sortByStart);
  
  const startHour = 6;
  const endHour = 22;
  const timelineHeight = 720;
  const hoursSpan = endHour - startHour;

  const timeAxisHTML = renderTimeAxisHTML(startHour, endHour, timelineHeight);

  // Generate surgery event bars
  let eventsHTML = '';
  sorted.forEach((item, idx) => {
    const { s } = item;
    
    // Calculate position and height
    const startTime = s.start ? new Date(s.start) : null;
    const endTime = s.end ? new Date(s.end) : null;
    
    let topPercent = 0;
    let heightPixels = calculateContentHeight(item);
    
    if (startTime) {
      const startHours = startTime.getHours() + (startTime.getMinutes() / 60);
      const relativeStart = Math.max(0, Math.min(hoursSpan, startHours - startHour));
      topPercent = (relativeStart / hoursSpan) * 100;
      
      if (endTime) {
        const endHours = endTime.getHours() + (endTime.getMinutes() / 60);
        const relativeEnd = Math.max(relativeStart, Math.min(hoursSpan, endHours - startHour));
        const duration = relativeEnd - relativeStart;
        heightPixels = Math.max(heightPixels, (duration / hoursSpan) * timelineHeight);
      }
    }

    // Generate content rows
    let contentRows = '';
    
    // Operating room + time row
    const opRoom = s.operating_room || (s.room && s.room.name) || '';
    const timeRange = formatTimeRange(s.start, s.end);
    if (opRoom || timeRange) {
      contentRows += `
        <div class="row">
          <div class="or">${opRoom || 'Phòng mổ'}</div>
          <div class="time">${timeRange}</div>
        </div>
      `;
    }

    // Patient name row
    if (s.customer && s.customer.fullname) {
      contentRows += `
        <div class="row">
          <div class="patient">${s.customer.fullname}</div>
        </div>
      `;
    }

    // Surgery method row
    if (s.surgerymethod) {
      contentRows += `
        <div class="row">
          <div class="method">${s.surgerymethod}</div>
        </div>
      `;
    }

    // Doctors row
    const docs = [...(s.userexec || []), ...(s.userassistant || [])];
    if (docs.length > 0) {
      const docNames = docs.map(d => d.fullname).filter(Boolean).join(', ');
      contentRows += `
        <div class="row">
          <div class="docs">BS: ${docNames}</div>
        </div>
      `;
    }

    // Diagnosis row
    if (s.diagnose) {
      contentRows += `
        <div class="row">
          <div class="diagnose">${s.diagnose}</div>
        </div>
      `;
    }

    // Meta info row
    const meta = [s.khoaLuuTri, s.khoaDieuTri, s.phongDieuTri, s.giuongDieuTri].filter(Boolean);
    if (meta.length > 0) {
      contentRows += `
        <div class="row">
          <div class="meta">${meta.join(' • ')}</div>
        </div>
      `;
    }

    // Create event bar
    eventsHTML += `
      <div class="dr-qh-evtbar" style="top: ${topPercent}%; height: ${heightPixels}px; z-index: ${100 - idx};">
        ${contentRows}
      </div>
    `;
  });

  return `
    <div class="dr-qh-timegrid">
      ${timeAxisHTML}
      <div class="dr-qh-lanes">
        <div class="dr-qh-lane" style="height: ${timelineHeight}px;">
          ${eventsHTML}
        </div>
      </div>
    </div>
  `;
}

function renderLichMoPage() {
  stylesOnce();

  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <div class="dr-qh-lichmo-wrap">
      <div class="dr-qh-lichmo-head">
        <div class="dr-qh-lichmo-left">
          <h2 class="dr-qh-lichmo-title">Lịch mổ hôm nay</h2>
          <div class="dr-qh-lichmo-khoa" id="dr-qh-lichmo-khoa">Tất cả khoa</div>
        </div>
        <div class="dr-qh-lichmo-mid">
          <div class="dr-qh-lichmo-date">${dateStr}</div>
        </div>
        <div class="dr-qh-lichmo-right">
          <button class="dr-qh-lichmo-btn" id="dr-qh-lichmo-refresh">↻ Làm mới</button>
          <button class="dr-qh-lichmo-btn" id="dr-qh-lichmo-settings">⚙ Cài đặt</button>
          <div class="dr-qh-lichmo-status" id="dr-qh-lichmo-status">Sẵn sàng</div>
          <div class="dr-qh-lichmo-loading" id="dr-qh-lichmo-loading"></div>
        </div>
      </div>
      <div class="dr-qh-lichmo-content" id="dr-qh-lichmo-content">
        <div class="dr-qh-empty">Đang tải dữ liệu...</div>
      </div>
    </div>
  `;
}

// Transform raw surgery records into a lean structure required by the UI
function filterSurgeryData(records) {
  if (!Array.isArray(records)) return [];
  const result = [];
  for (const r of records) {
    const customerPid = r?.customer?.pid ?? r?.customer?.code ?? null;
    const operatingRoom = r?.operating_room ?? r?.room?.name ?? null;
    const item = {
      s: {
        customer: {
          fullname: r?.customer?.fullname ?? null,
          pid: customerPid,
          dob: r?.customer?.dob ?? null,
        },
        diagnose: r?.diagnose ?? null,
        surgerymethod: r?.surgerymethod ?? null,
        start: r?.start ?? null,
        end: r?.end ?? null,
        khoaLuuTri: r?.khoaLuuTri ?? null,
        khoaDieuTri: r?.khoaDieuTri ?? null,
        phongDieuTri: r?.phongDieuTri ?? null,
        giuongDieuTri: r?.giuongDieuTri ?? null,
        operating_room: operatingRoom,
        status: r?.status ?? null,
        userexec: Array.isArray(r?.userexec)
          ? r.userexec.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
          : [],
        userassistant: Array.isArray(r?.userassistant)
          ? r.userassistant.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
          : [],
        room: r?.room || null
      }
    };
    result.push(item);
  }
  return result;
}

async function loadSurgeryData() {
  const loadingEl = document.getElementById('dr-qh-lichmo-loading');
  const statusEl = document.getElementById('dr-qh-lichmo-status');
  const contentEl = document.getElementById('dr-qh-lichmo-content');
  
  if (loadingEl) loadingEl.classList.add('active');
  if (statusEl) statusEl.textContent = 'Đang tải...';

  try {
    console.log('DEBUG - Starting direct OTM API fetch...');
    
    // Use OTMTokenService to fetch today's surgeries
    const today = new Date().toISOString().split('T')[0];
    const rawData = await OTMTokenService.fetchSurgeries(today, today);
    
    console.log('DEBUG - Raw OTM surgery data:', rawData);
    
    // Extract surgery array from response
    let surgeryArray = [];
    if (Array.isArray(rawData)) {
      surgeryArray = rawData;
    } else if (rawData && Array.isArray(rawData.data)) {
      surgeryArray = rawData.data;
    } else if (rawData && typeof rawData === 'object') {
      // Look for array in various possible properties
      const candidates = ['bookings', 'surgeries', 'items', 'records', 'results'];
      for (const prop of candidates) {
        if (Array.isArray(rawData[prop])) {
          surgeryArray = rawData[prop];
          break;
        }
      }
    }
    
    console.log('DEBUG - Extracted surgery array:', surgeryArray.length, 'items');
    
    // Transform data
    const surgeries = filterSurgeryData(surgeryArray);
    console.log('DEBUG - Filtered surgery data:', surgeries.length, 'items');
    
    // Apply surgeon filtering if any
    const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
    const filteredSurgeries = filterBySelectedSurgeons(surgeries, selectedSurgeons);
    console.log('DEBUG - After surgeon filter:', filteredSurgeries.length, 'items');
    
    // Render timeline
    const timelineHTML = renderSurgeryTimeline(filteredSurgeries);
    if (contentEl) contentEl.innerHTML = timelineHTML;
    
    if (statusEl) statusEl.textContent = `${filteredSurgeries.length} ca mổ`;
    showToast(`Đã tải ${filteredSurgeries.length} ca mổ hôm nay`, 'success');
    
  } catch (error) {
    console.error('DEBUG - Error loading surgery data:', error);
    
    let errorMessage = 'Không thể tải dữ liệu lịch mổ';
    if (error.message === 'TOKEN_EXPIRED') {
      errorMessage = 'Token OTM đã hết hạn, vui lòng thử lại';
    } else if (error.message === 'NO_TOKEN') {
      errorMessage = 'Không có token OTM, vui lòng đăng nhập OTM trước';
    }
    
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="dr-qh-empty">
          <p>${errorMessage}</p>
          <button class="dr-qh-lichmo-btn" onclick="loadSurgeryData()">Thử lại</button>
        </div>
      `;
    }
    if (statusEl) statusEl.textContent = 'Lỗi';
    showToast(errorMessage, 'error');
  } finally {
    if (loadingEl) loadingEl.classList.remove('active');
  }
}

function attachEventListeners() {
  const refreshBtn = document.getElementById('dr-qh-lichmo-refresh');
  const settingsBtn = document.getElementById('dr-qh-lichmo-settings');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('DEBUG - Refresh button clicked');
      loadSurgeryData();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // Navigate to surgeon settings
      window.location.href = '?caidat&tab=otm-quanlyphauthuat';
    });
  }
}

function initLichMoPage() {
  console.log('DEBUG - Initializing Lich Mo page with OTMTokenService');
  
  // Render the page
  document.body.innerHTML = renderLichMoPage();
  
  // Attach event listeners
  attachEventListeners();
  
  // Load data
  loadSurgeryData();
}

// Legacy compatibility function
async function showLichMoHomNayIfNeeded() {
  const url = new URL(window.location.href);
  const hasLm = /[?&]lm(=|&|$)/.test(url.search);
  const hasLichmo = /[?&]lichmo(=|&|$)/.test(url.search) || (url.searchParams.get('otm')||'').toLowerCase() === 'lichmo';
  if (!hasLm && !hasLichmo) return;
  
  console.log('DEBUG - Legacy URL detected, redirecting to initLichMoPage');
  initLichMoPage();
}

module.exports = {
  initLichMoPage,
  renderLichMoPage,
  loadSurgeryData,
  showLichMoHomNayIfNeeded
};

},{"../components/khoaSelect":15,"../services/otm.token":39,"../services/surgeonSettingsService":44,"../utils/khoaUtils":56,"../utils/uiUtils":62}],33:[function(require,module,exports){
// settings-open-world.js - Open World settings (Thông tin khoa/phòng)

const SettingsService = require('../services/settingsService');
const ApiService = require('../services/apiService');

function createStylesOnce() {
    if (document.getElementById('dr-openworld-styles')) return;
    const st = document.createElement('style');
    st.id = 'dr-openworld-styles';
    st.textContent = `
        .dr-ow-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .dr-ow-card { border:1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fff; }
        .dr-ow-title { margin: 0 0 8px 0; font-weight: 700; color: #0f172a; }
        .dr-ow-list { display: flex; flex-direction: column; gap: 8px; max-height: 52vh; overflow: auto; }
        .dr-ow-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; border:1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
        .dr-ow-item:hover { background: #f8fafc; }
        .dr-ow-item.active { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22,163,74,.15) inset; }
        .dr-ow-badge { background: #16a34a; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 12px; }
        .dr-ow-empty { color:#6b7280; font-style: italic; }
        @media (max-width: 900px) { .dr-ow-wrap { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(st);
}

function debounce(fn, delay = 400) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

async function fetchKhoaPhong() { return ApiService.fetchKhoaPhong(); }
async function fetchRoomsByKhoa(khoaId) { return ApiService.fetchRoomsByKhoa(khoaId); }

/**
 * Mount Open World settings tab
 */
async function mountOpenWorldTab(opts) {
    const { container, doctorName, checklistObj, settings } = opts || {};
    if (!container) return;
    createStylesOnce();

    container.innerHTML = `
        <div style="margin:0 0 8px; color:#6b7280">Quản lý khoa mặc định và các phòng theo dõi bệnh nhân. Việc chọn khoa sẽ được lưu và áp dụng ở dashboard.</div>
        <div class="dr-ow-wrap">
            <div class="dr-ow-card">
                <h4 class="dr-ow-title">Danh sách khoa/phòng</h4>
                <div id="dr-ow-khoa-list" class="dr-ow-list"><div class="dr-ow-empty">Đang tải danh sách khoa...</div></div>
            </div>
            <div class="dr-ow-card">
                <h4 class="dr-ow-title">Phòng thuộc khoa đã chọn</h4>
                <div id="dr-ow-room-list" class="dr-ow-list"><div class="dr-ow-empty">Chưa chọn khoa.</div></div>
            </div>
        </div>
    `;

    const khoaListEl = container.querySelector('#dr-ow-khoa-list');
    const roomListEl = container.querySelector('#dr-ow-room-list');

    const ls = window.localStorage;
    const SELECTED_KHOA_KEY = 'bsnt_khoa_dashboard';
    const ROOMS_CACHE_KEY = (k) => `dr_ow_rooms_${k}`;

    // Helper: render rooms
    function renderRooms(rooms) {
        if (!rooms || rooms.length === 0) {
            roomListEl.innerHTML = `<div class="dr-ow-empty">Không có phòng.</div>`;
            return;
        }
        roomListEl.innerHTML = '';
        rooms.forEach(r => {
            const div = document.createElement('div');
            div.className = 'dr-ow-item';
            div.textContent = r.name || r.code || 'Phòng';
            // keep attributes for later use
            div.dataset.id = r.id || '';
            div.dataset.code = r.code || '';
            div.dataset.name = r.name || '';
            div.dataset.khoA_ID = r.khoA_ID || '';
            div.dataset.tanG_ID = r.tanG_ID || '';
            roomListEl.appendChild(div);
        });
    }

    // Debounced save to API for default khoa
    const debouncedSave = debounce(async (khoaId) => {
        try {
            if (!doctorName) return;
            let obj = checklistObj || await SettingsService.loadSettingsPhieu(doctorName);
            if (!obj) {
                const created = await SettingsService.createSettingsPhieu(doctorName);
                if (created && created.isValid) obj = await SettingsService.loadSettingsPhieu(doctorName);
            }
            if (!obj) return;
            const current = SettingsService.parseSettingsState(obj) || {};
            const next = { ...current, openWorld: { ...(current.openWorld || {}), defaultKhoa: String(khoaId || '') } };
            await SettingsService.updateSettingsState(obj, next);
        } catch (e) { console.warn('Save default khoa failed', e); }
    }, 600);

    // Render khoa list and wire selection
    async function renderKhoaList() {
        try {
            const khoa = await fetchKhoaPhong();
            let selected = (ls && ls.getItem(SELECTED_KHOA_KEY)) || '';
            khoaListEl.innerHTML = '';
            khoa.forEach(k => {
                const div = document.createElement('div');
                const kId = String(k.id);
                const isSelected = !!selected && selected === kId;
                div.className = 'dr-ow-item' + (isSelected ? ' active' : '');
                const name = (k && k.name) || 'Khoa';
                div.innerHTML = `<span>${name}</span>` + (isSelected ? `<span class="dr-ow-badge">Đã chọn</span>` : '');
                div.addEventListener('click', async () => {
                    // update selection locally
                    Array.from(khoaListEl.querySelectorAll('.dr-ow-item')).forEach(el => el.classList.remove('active'));
                    div.classList.add('active');
                    // set badge
                    Array.from(khoaListEl.querySelectorAll('.dr-ow-badge')).forEach(b => b.remove());
                    div.insertAdjacentHTML('beforeend', `<span class="dr-ow-badge">Đã chọn</span>`);
                    // persist to localStorage for dashboard compatibility
                    try {
                        ls && ls.setItem(SELECTED_KHOA_KEY, kId);
                    } catch(_) {}
                    // fetch rooms for selected khoa
                    const rooms = await fetchRoomsByKhoa(kId);
                    renderRooms(rooms);
                    try { ls && ls.setItem(ROOMS_CACHE_KEY(kId), JSON.stringify(rooms || [])); } catch(_) {}
                    // save via API for per-doctor settings
                    debouncedSave(kId);
                });
                khoaListEl.appendChild(div);
            });
            // Auto-load rooms for current selection
            if (selected) {
                try {
                    const cached = ls && ls.getItem(ROOMS_CACHE_KEY(selected));
                    if (cached) {
                        try { renderRooms(JSON.parse(cached)); } catch { /* ignore */ }
                    } else {
                        const rooms = await fetchRoomsByKhoa(selected);
                        renderRooms(rooms);
                        try { ls && ls.setItem(ROOMS_CACHE_KEY(selected), JSON.stringify(rooms || [])); } catch(_) {}
                    }
                } catch(_) {}
            }
        } catch (e) {
            khoaListEl.innerHTML = `<div class="dr-ow-empty">Lỗi tải danh sách khoa.</div>`;
            console.warn('LoadKhoaPhong failed', e);
        }
    }

    renderKhoaList();
}

module.exports = { mountOpenWorldTab };

},{"../services/apiService":36,"../services/settingsService":43}],34:[function(require,module,exports){
// settings.js - Render a settings page similar to dashboard, triggered by ?caidat

const SettingsService = require('../services/settingsService');
const { mountUserInfoSettingsTab } = require('../components/userInfoSettingsTab');
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
                <button data-tab="user-info" class="${targetTab==='user-info'?'active':''}">Thông tin người dùng</button>
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
                                                                                                <h3 class="dr-st-title">${targetTab==='account'?'Account':(targetTab==='account-cloud'?'Account Cloud':(targetTab==='openworld'?'Thông tin khoa/phòng':(targetTab==='otm-surgeons'?'Quản lý phẫu thuật':(targetTab==='user-info'?'Thông tin người dùng':'Lời dặn dò ra viện'))))}</h3>
                <div id="dr-auto-save-status" style="font-size:12px; color:#6b7280; font-weight:600;"></div>
            </div>
            <div class="dr-st-content">
                        <div id="tab-discharge" class="dr-st-tab ${targetTab==='discharge'?'active':''}">
                    <p style="margin:0 0 8px; color:#6b7280">Danh sách các lời dặn dò ra viện. Bạn có thể thêm/xóa và chỉnh sửa.</p>
                    <div id="discharge-list" class="dr-st-list"></div>
                    <button id="add-discharge" class="dr-st-btn">+ Thêm mục</button>
                </div>
                                <div id="tab-user-info" class="dr-st-tab ${targetTab==='user-info'?'active':''}">
                                        <div id="dr-user-info-container"></div>
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
        let userInfoMounted = false;
        
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

        async function ensureUserInfoMounted() {
                if (userInfoMounted) return;
                const mountEl = right.querySelector('#dr-user-info-container');
                if (!mountEl) return;
                userInfoMounted = true;
                await mountUserInfoSettingsTab({
                        container: mountEl,
                        getSettings: () => settings,
                        setSettings: (next) => { settings = next; },
                        scheduleAutoSave
                });
        }

        // Listen for changes on discharge inputs
        listEl.addEventListener('input', scheduleAutoSave);

        // Left menu switching
                left.addEventListener('click', (e) => {
                                const btn = e.target.closest('button[data-tab]');
                if (!btn) return;
                left.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                                titleEl.textContent = tab === 'discharge' ? 'Lời dặn dò ra viện' : (tab === 'user-info' ? 'Thông tin người dùng' : (tab === 'account' ? 'Account' : (tab === 'account-cloud' ? 'Account Cloud' : (tab === 'openworld' ? 'Thông tin khoa/phòng' : (tab === 'otm-surgeons' ? 'Quản lý phẫu thuật' : btn.textContent.trim())))));
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
                                if (tab === 'user-info') {
                                        ensureUserInfoMounted();
                                } else if (tab === 'openworld') {
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
                        if (targetTab === 'user-info') {
                                await ensureUserInfoMounted();
                        } else if (targetTab === 'openworld') {
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

},{"../components/autoLoginToggle":7,"../components/userInfoSettingsTab":25,"../pages/page.settings.otm.quanlyphauthuat":35,"../services/settingsService":43,"../settings-open-world":46,"../utils/uiUtils":62,"./page.settings-open-world":33}],35:[function(require,module,exports){
// page.settings.otm.quanlyphauthuat.refactored.js - Refactored OTM surgeon management using OTMTokenService

const SurgeonSettingsService = require('../services/surgeonSettingsService');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const OTMTokenService = require('../services/otm.token');

function stylesOnce() {
    if (document.getElementById('dr-otm-surgeon-styles-v2')) return;
    const st = document.createElement('style');
    st.id = 'dr-otm-surgeon-styles-v2';
    st.textContent = `
    .dr-os-wrap { display:flex; flex-direction:column; gap:12px; }
    .dr-os-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .dr-os-select, .dr-os-search { padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; }
    .dr-os-columns { display:grid; grid-template-columns: 320px 1fr; gap:12px; align-items:start; }
    .dr-os-selected { border:1px solid #e5e7eb; border-radius:10px; padding:10px; background:#fff; max-height:55vh; overflow:auto; }
    .dr-os-selected h4 { margin:0 0 8px; font-size:14px; color:#334155; }
    .dr-os-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background:#f1f5f9; border:1px solid #e5e7eb; border-radius:999px; margin:4px; font-size:13px; }
    .dr-os-chip button { appearance:none; border:none; background:transparent; cursor:pointer; color:#64748b; }
    .dr-os-list { border:1px solid #e5e7eb; border-radius:10px; padding:10px; max-height:55vh; overflow:auto; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .dr-os-item { display:flex; align-items:center; gap:8px; padding:8px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; }
        .dr-os-actions { display:flex; gap:8px; }
        .dr-os-btn { appearance:none; border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer }
        .dr-os-btn.primary { border-color:#2563eb; background:#2563eb; color:#fff }
        .dr-os-status { padding:12px; text-align:center; color:#64748b; font-size:14px; }
        .dr-os-error { color:#dc2626; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:12px; margin:8px 0; }
        .dr-os-loading { display:inline-block; width:16px; height:16px; border:2px solid #e5e7eb; border-top-color:#2563eb; border-radius:50%; animation:spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1100px) { .dr-os-columns { grid-template-columns: 1fr; } }
    @media (max-width: 900px) { .dr-os-list { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(st);
}

// In-memory cache for OTM users
const _otmUsersCache = { list: null, at: 0, loading: false };

async function ensureOTMUsers() {
    if (Array.isArray(_otmUsersCache.list) && _otmUsersCache.list.length > 0) {
        console.log('DEBUG - Using cached OTM users:', _otmUsersCache.list.length);
        return _otmUsersCache.list;
    }
    
    if (_otmUsersCache.loading) {
        console.log('DEBUG - OTM users already loading, waiting...');
        // Wait for the ongoing request
        let attempts = 0;
        while (_otmUsersCache.loading && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        if (Array.isArray(_otmUsersCache.list) && _otmUsersCache.list.length > 0) {
            return _otmUsersCache.list;
        }
    }

    _otmUsersCache.loading = true;
    try {
        console.log('DEBUG - Fetching OTM users using OTMTokenService...');
        const response = await OTMTokenService.fetchUsers();
        console.log('DEBUG - Raw OTM users response:', response);
        
        // Extract users array from response
        let usersArray = [];
        if (Array.isArray(response)) {
            usersArray = response;
        } else if (response && Array.isArray(response.data)) {
            usersArray = response.data;
        } else if (response && typeof response === 'object') {
            // Look for array in various possible properties
            const candidates = ['data', 'items', 'result', 'rows', 'content', 'users', 'records', 'list'];
            for (const prop of candidates) {
                if (Array.isArray(response[prop])) {
                    usersArray = response[prop];
                    break;
                }
                // Check nested properties
                if (response[prop] && typeof response[prop] === 'object') {
                    for (const nestedProp of candidates) {
                        if (Array.isArray(response[prop][nestedProp])) {
                            usersArray = response[prop][nestedProp];
                            break;
                        }
                    }
                    if (usersArray.length > 0) break;
                }
            }
        }
        
        console.log('DEBUG - Extracted users array:', usersArray.length, 'users');
        
        // Transform and filter users
        const users = (usersArray || [])
            .map(u => ({
                id: u.id ?? u.taid ?? u.userid ?? u.userId ?? null,
                fullname: u.fullname || u.fullName || u.name || ''
            }))
            .filter(u => u.fullname && u.fullname.trim().length > 0);

        console.log('DEBUG - Processed users:', users.length, 'valid users');
        
        _otmUsersCache.list = users;
        _otmUsersCache.at = Date.now();
        return users;
        
    } catch (error) {
        console.error('DEBUG - Error fetching OTM users:', error);
        
        if (error.message === 'TOKEN_EXPIRED') {
            throw new Error('Token OTM đã hết hạn. Vui lòng đăng nhập lại OTM.');
        } else if (error.message === 'NO_TOKEN') {
            throw new Error('Không có token OTM. Vui lòng đăng nhập OTM trước.');
        }
        
        throw new Error('Không thể tải danh sách bác sĩ từ OTM: ' + error.message);
    } finally {
        _otmUsersCache.loading = false;
    }
}

function renderSurgeonManagement() {
    stylesOnce();
    return `
        <div class="dr-os-wrap">
            <div class="dr-os-row">
                <h3>Quản lý danh sách bác sĩ phẫu thuật</h3>
                <button class="dr-os-btn primary" id="dr-os-refresh">🔄 Làm mới danh sách</button>
            </div>
            <div class="dr-os-row">
                <input 
                    type="text" 
                    id="dr-os-search" 
                    class="dr-os-search" 
                    placeholder="Tìm kiếm bác sĩ..."
                    style="flex: 1; max-width: 300px;"
                />
                <button class="dr-os-btn" id="dr-os-select-all">Chọn tất cả</button>
                <button class="dr-os-btn" id="dr-os-clear-all">Bỏ chọn tất cả</button>
            </div>
            <div class="dr-os-columns">
                <div class="dr-os-selected">
                    <h4>Bác sĩ đã chọn (<span id="dr-os-selected-count">0</span>)</h4>
                    <div id="dr-os-selected-list">
                        <div class="dr-os-status">Đang tải...</div>
                    </div>
                </div>
                <div class="dr-os-list" id="dr-os-list">
                    <div class="dr-os-status">
                        <div class="dr-os-loading"></div>
                        Đang tải danh sách bác sĩ từ OTM...
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadSurgeonsList() {
    const listEl = document.getElementById('dr-os-list');
    const selectedListEl = document.getElementById('dr-os-selected-list');
    const searchEl = document.getElementById('dr-os-search');

    try {
        // Show loading state
        if (listEl) {
            listEl.innerHTML = `
                <div class="dr-os-status">
                    <div class="dr-os-loading"></div>
                    Đang tải danh sách bác sĩ từ OTM...
                </div>
            `;
        }

        console.log('DEBUG - Starting OTM users fetch...');
        const users = await ensureOTMUsers();
        console.log('DEBUG - Loaded', users.length, 'OTM users');

        // Get currently selected surgeons
        const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
        console.log('DEBUG - Currently selected surgeons:', selectedSurgeons);
        
        // Render selected surgeons
        renderSelectedSurgeons(selectedSurgeons, selectedListEl);
        
        // Render all surgeons list
        renderSurgeonsList(users, selectedSurgeons, listEl);
        
        // Set up search functionality
        if (searchEl) {
            searchEl.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterSurgeonsList(users, selectedSurgeons, query, listEl);
            });
        }

        console.log('DEBUG - Surgeon management loaded successfully');

    } catch (error) {
        console.error('DEBUG - Error loading surgeons list:', error);
        
        if (listEl) {
            listEl.innerHTML = `
                <div class="dr-os-error">
                    <p><strong>Lỗi:</strong> ${error.message}</p>
                    <button class="dr-os-btn" onclick="loadSurgeonsList()">Thử lại</button>
                </div>
            `;
        }
        
        if (selectedListEl) {
            selectedListEl.innerHTML = `
                <div class="dr-os-status">Không thể tải danh sách bác sĩ</div>
            `;
        }
    }
}

function renderSelectedSurgeons(selectedSurgeons, container) {
    if (!container) return;
    
    const countEl = document.getElementById('dr-os-selected-count');
    if (countEl) {
        countEl.textContent = selectedSurgeons.length.toString();
    }

    if (selectedSurgeons.length === 0) {
        container.innerHTML = '<div class="dr-os-status">Chưa chọn bác sĩ nào</div>';
        return;
    }

    const chipsHTML = selectedSurgeons.map(name => `
        <div class="dr-os-chip">
            ${name}
            <button onclick="removeSurgeon('${name.replace(/'/g, "\\'")}')">&times;</button>
        </div>
    `).join('');

    container.innerHTML = chipsHTML;
}

function renderSurgeonsList(users, selectedSurgeons, container) {
    if (!container) return;
    
    filterSurgeonsList(users, selectedSurgeons, '', container);
}

function filterSurgeonsList(users, selectedSurgeons, query, container) {
    if (!container) return;
    
    const selectedSet = new Set(selectedSurgeons.map(name => name.toLowerCase()));
    
    let filteredUsers = users.filter(user => {
        const nameMatch = !query || user.fullname.toLowerCase().includes(query);
        const notSelected = !selectedSet.has(user.fullname.toLowerCase());
        return nameMatch && notSelected;
    });

    if (filteredUsers.length === 0) {
        const message = query ? 
            `Không tìm thấy bác sĩ nào với từ khóa "${query}"` : 
            'Tất cả bác sĩ đã được chọn';
        container.innerHTML = `<div class="dr-os-status">${message}</div>`;
        return;
    }

    const itemsHTML = filteredUsers.map(user => `
        <div class="dr-os-item">
            <div style="flex: 1;">
                <strong>${user.fullname}</strong>
                ${user.id ? `<div style="font-size: 12px; color: #6b7280;">ID: ${user.id}</div>` : ''}
            </div>
            <button class="dr-os-btn primary" onclick="addSurgeon('${user.fullname.replace(/'/g, "\\'")}')">
                Thêm
            </button>
        </div>
    `).join('');

    container.innerHTML = itemsHTML;
}

// Global functions for button handlers
window.addSurgeon = async function(name) {
    try {
        console.log('DEBUG - Adding surgeon:', name);
        const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
        
        if (selectedSurgeons.includes(name)) {
            console.log('DEBUG - Surgeon already selected:', name);
            return;
        }

        const newSelected = [...selectedSurgeons, name];
        await SurgeonSettingsService.saveSelectedSurgeons(newSelected);
        console.log('DEBUG - Surgeon added successfully:', name);
        
        // Reload the lists
        loadSurgeonsList();

    } catch (error) {
        console.error('DEBUG - Error adding surgeon:', error);
        alert('Không thể thêm bác sĩ: ' + error.message);
    }
};

window.removeSurgeon = async function(name) {
    try {
        console.log('DEBUG - Removing surgeon:', name);
        const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
        const newSelected = selectedSurgeons.filter(s => s !== name);
        
        await SurgeonSettingsService.saveSelectedSurgeons(newSelected);
        console.log('DEBUG - Surgeon removed successfully:', name);
        
        // Reload the lists
        loadSurgeonsList();

    } catch (error) {
        console.error('DEBUG - Error removing surgeon:', error);
        alert('Không thể xóa bác sĩ: ' + error.message);
    }
};

function attachEventListeners() {
    const refreshBtn = document.getElementById('dr-os-refresh');
    const selectAllBtn = document.getElementById('dr-os-select-all');
    const clearAllBtn = document.getElementById('dr-os-clear-all');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log('DEBUG - Refresh button clicked, clearing cache');
            // Clear cache and reload
            _otmUsersCache.list = null;
            _otmUsersCache.at = 0;
            await loadSurgeonsList();
        });
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', async () => {
            try {
                const users = await ensureOTMUsers();
                const allNames = users.map(u => u.fullname);
                await SurgeonSettingsService.saveSelectedSurgeons(allNames);
                loadSurgeonsList();
            } catch (error) {
                alert('Không thể chọn tất cả: ' + error.message);
            }
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            try {
                await SurgeonSettingsService.saveSelectedSurgeons([]);
                loadSurgeonsList();
            } catch (error) {
                alert('Không thể bỏ chọn tất cả: ' + error.message);
            }
        });
    }
}

function initSurgeonManagement() {
    console.log('DEBUG - Initializing OTM surgeon management with OTMTokenService');
    
    const container = document.createElement('div');
    container.innerHTML = renderSurgeonManagement();
    
    // Replace or append to current content
    const existingContent = document.querySelector('.dr-os-wrap');
    if (existingContent) {
        existingContent.replaceWith(container.firstElementChild);
    } else {
        document.body.appendChild(container.firstElementChild);
    }
    
    // Attach event listeners
    attachEventListeners();
    
    // Load data
    loadSurgeonsList();
}

module.exports = {
    initSurgeonManagement,
    renderSurgeonManagement,
    loadSurgeonsList,
    ensureOTMUsers
};

},{"../services/otm.token":39,"../services/surgeonSettingsService":44,"../utils/khoaUtils":56}],36:[function(require,module,exports){
// apiService.js - Centralized API service
const { getSelectedKhoa } = require('../utils/khoaUtils');

const ApiService = {
    _pickFirstValue(obj, keys) {
        if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) return '';
        for (let i = 0; i < keys.length; i += 1) {
            const v = obj[keys[i]];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    },

    _extractToDieuTriRows(payload) {
        if (Array.isArray(payload)) return payload;
        if (!payload || typeof payload !== 'object') return [];

        const candidates = [
            payload.data,
            payload.Data,
            payload.rows,
            payload.Rows,
            payload.result,
            payload.Result,
            payload.items,
            payload.Items
        ];
        for (let i = 0; i < candidates.length; i += 1) {
            if (Array.isArray(candidates[i])) return candidates[i];
        }
        return [];
    },

    /**
     * Load list of khoa/phòng (departments)
     */
    async fetchKhoaPhong() {
        const body = new URLSearchParams();
        body.set('loaibn', '');
        body.set('makp', '');
        const res = await fetch('/ToDieuTri/LoadKhoaPhong', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            },
            body
        });
        const json = await res.json();
        return (json && json.data) || [];
    },

    /**
     * Load rooms by khoa id
     */
    async fetchRoomsByKhoa(khoaId) {
        const body = new URLSearchParams();
        body.set('code', String(khoaId || ''));
        const res = await fetch('/ToDieuTri/LoadRoom', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            },
            body
        });
        const json = await res.json();
        return (json && json.data) || [];
    },
    /**
     * Fetch patient data from ToDieuTri endpoint
     */
    async fetchToDieuTriData() {
        try {
            const formData = new FormData();
            const khoa = getSelectedKhoa('551');
            formData.append('khoa', khoa);
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
     * Fetch all inpatients from Search endpoint without khoa filter.
     */
    async fetchToDieuTriDataAllKhoa() {
        try {
            const formData = new FormData();
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

            const contentType = String(response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/json')) {
                return await response.json();
            }
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (_) {
                return { data: [] };
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu ToDieuTri (all khoa):', error);
            throw error;
        }
    },

    /**
     * Build unique active khoa/phong list from current Search data.
     * Uses a single-pass Map for speed on large patient datasets.
     */
    async fetchActiveKhoaPhongFromSearch() {
        const payload = await this.fetchToDieuTriDataAllKhoa();
        const rows = this._extractToDieuTriRows(payload);
        const uniq = new Map();

        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i] || {};
            const makp = this._pickFirstValue(row, ['makp', 'maKP', 'khoa', 'khoA_ID', 'makhoa', 'MAKP', 'Makp']);
            const tenkp = this._pickFirstValue(row, ['tenkp', 'teN_KP', 'tenkhoa', 'teN_KHOA', 'khoaphong', 'TENKP', 'Tenkp']);
            if (!makp || !tenkp) continue;

            const key = `${makp}::${tenkp.toLowerCase()}`;
            const existing = uniq.get(key);
            if (existing) {
                existing.patientCount += 1;
            } else {
                uniq.set(key, {
                    id: makp,
                    name: tenkp,
                    patientCount: 1
                });
            }
        }

        return Array.from(uniq.values())
            .sort((a, b) => {
                const byName = String(a.name || '').localeCompare(String(b.name || ''), 'vi');
                if (byName !== 0) return byName;
                return String(a.id || '').localeCompare(String(b.id || ''));
            });
    },

    /**
     * Fetch a specific patient's data by PID
     */
    async fetchPatientByPID(pid) {
        try {
            const formData = new FormData();
            formData.append('loaibn', '');
            formData.append('mabn', pid);
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
            console.error(`Lỗi khi lấy dữ liệu patient PID ${pid}:`, error);
            throw error;
        }
    },

    /**
     * Update checklist data
     */
    async updateChecklistData(oldData, checklistState, { signal } = {}) {
        try {
            const formData = new FormData();
            
            // Add all old data fields, preserving non-empty values
            for (const key in oldData) {
                if (Object.prototype.hasOwnProperty.call(oldData, key)) {
                    let value = oldData[key];
                    
                    // Handle required fields that cannot be empty
                    if (key.toLowerCase() === 'dieukhoancamket' && (value == null || String(value).trim() === '')) {
                        // Default value for commitment clause if not set
                        value = 'true';
                    }
                    
                    // Only append if value exists, otherwise skip to preserve API constraints
                    if (value != null && String(value).trim() !== '') {
                        formData.append(key.toLowerCase(), value);
                    }
                }
            }

            formData.set('dieukhoancamket', 'true');
            
            // Update checklist state
            formData.set('chuky', JSON.stringify(checklistState));

            const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/EditAjax', {
                method: 'POST',
                credentials: 'include',
                body: formData,
                signal
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
            formData.append('dieukhoancamket', 'true');
            formData.append('chuky', '{}');
            formData.append('khac', '--*--');
            formData.append('khu', patient.khu || '1');
            formData.append('mabn', patient.mabn + 9898);
            formData.append('bieumauid', '027');
            // prefer patient's makp; fallback to selected khoa
            const makp = (patient.makp || getSelectedKhoa('551'));
            formData.append('makp', makp);
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

},{"../utils/khoaUtils":56}],37:[function(require,module,exports){
// checklistAPIModule.js - Unified, centralized checklist data API
// Single source of truth for all checklist operations (fetch, save, create)
// Handles consistent mabn normalization and error recovery

const DateUtils = require('../utils/dateUtils');
const ApiService = require('./apiService');

// In-memory single-result cache for the most recently fetched checklist
// Key: mabn, Value: { checklistObj, state, timestamp }
const _cache = new Map();
const _inflight = new Map();

const ChecklistAPIModule = {
    /**
     * Get checklist data for a patient.
     * Handles mabn normalization: tries +9898 first, falls back to plain mabn.
     * Returns: { mabn, checklistObj, state } or null if not found
     */
    async getChecklistData(patient, options = {}) {
        if (!patient || !patient.mabn) {
            console.error('ChecklistAPIModule.getChecklistData: invalid patient');
            return null;
        }

        const { forceRefresh = false, skipCache = false } = options;
        const originalMabn = String(patient.mabn).trim();
        const inflightKey = originalMabn;
        
        // Check cache first
        if (!forceRefresh && !skipCache && _cache.has(originalMabn)) {
            const cached = _cache.get(originalMabn);
            if (cached && cached.checklistObj) {
                console.log('ChecklistAPIModule.getChecklistData: returning cached result for', originalMabn);
                return {
                    mabn: originalMabn,
                    checklistObj: cached.checklistObj,
                    state: cached.state
                };
            }
        }

        if (!forceRefresh && _inflight.has(inflightKey)) {
            return await _inflight.get(inflightKey);
        }

        // Clear cache if force refresh
        if (forceRefresh) {
            _cache.delete(originalMabn);
        }

        try {
            const fetchPromise = (async () => {
                // Fetch checklist data (tries +9898 first, fallback to plain mabn internally)
                const responseData = await this._fetchChecklistDataInternal(patient);
            
                if (!responseData) {
                    console.warn('ChecklistAPIModule.getChecklistData: no response data for', originalMabn);
                    return null;
                }

                // Find matching checklist object in response
                const checklistObj = this._findChecklistObject(responseData);
            
                if (!checklistObj) {
                    console.warn('ChecklistAPIModule.getChecklistData: no matching checklist object for', originalMabn);
                    return null;
                }

                // Parse checklist state from the object
                const state = this._parseChecklistState(checklistObj);

                // Cache the result
                _cache.set(originalMabn, {
                    checklistObj,
                    state,
                    timestamp: Date.now()
                });

                console.log('ChecklistAPIModule.getChecklistData: loaded for', originalMabn);

                return {
                    mabn: originalMabn,
                    checklistObj,
                    state
                };
            })();

            if (!forceRefresh) {
                _inflight.set(inflightKey, fetchPromise.finally(() => {
                    _inflight.delete(inflightKey);
                }));
                return await _inflight.get(inflightKey);
            }

            return await fetchPromise;
        } catch (error) {
            console.error('ChecklistAPIModule.getChecklistData error:', error);
            return null;
        } finally {
            if (forceRefresh) {
                _inflight.delete(inflightKey);
            }
        }
    },

    /**
     * Save checklist state for a patient.
     * Preserves the original mabn from the checklist object.
     * Returns: { ok: boolean, result: any }
     */
    async saveChecklistState(checklistObj, checklistState, options = {}) {
        if (!checklistObj || !checklistState || typeof checklistState !== 'object') {
            console.error('ChecklistAPIModule.saveChecklistState: invalid inputs');
            return { ok: false };
        }

        try {
            const mabn = String(checklistObj.mabn || checklistObj.MABN || checklistObj.MaBN || '').trim();
            
            // Call ApiService.updateChecklistData with the full checklist object
            // This preserves the original mabn and ID from the API response
            const result = await ApiService.updateChecklistData(checklistObj, checklistState, options);
            const ok = result && (result.Status == 1 || result.isValid);
            
            if (ok) {
                // Invalidate cache on successful save
                _cache.delete(mabn);
                console.log('ChecklistAPIModule.saveChecklistState: saved for', mabn);
            }

            return { ok, result };
        } catch (error) {
            console.error('ChecklistAPIModule.saveChecklistState error:', error);
            return { ok: false, error };
        }
    },

    /**
     * Create a new checklist for a patient.
     * Returns: { ok: boolean, checklistObj: any }
     */
    async createChecklist(patient) {
        if (!patient || !patient.mabn) {
            console.error('ChecklistAPIModule.createChecklist: invalid patient');
            return { ok: false };
        }

        try {
            const result = await ApiService.createChecklistForPatient(patient);
            const ok = result && result.isValid;
            
            if (ok) {
                // Invalidate cache after creation
                const mabn = String(patient.mabn).trim();
                _cache.delete(mabn);
                console.log('ChecklistAPIModule.createChecklist: created for', mabn);
            }

            return { ok, result };
        } catch (error) {
            console.error('ChecklistAPIModule.createChecklist error:', error);
            return { ok: false, error };
        }
    },

    /**
     * Internal: Fetch checklist data with automatic mabn+9898 fallback
     */
    async _fetchChecklistDataInternal(patient) {
        const originalMabn = String(patient.mabn).trim();
        const mabnWith9898 = originalMabn + '9898';
        const { tungay, denngay } = DateUtils.getChecklistDateRange(patient.ngayvv);

        // Try with +9898 first
        try {
            const formData = new FormData();
            formData.append('mabn', mabnWith9898);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);

            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();
            
            if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                console.log('ChecklistAPIModule: fetched with +9898 format, got', result.data.length, 'items');
                return result;
            }
        } catch (e) {
            console.warn('ChecklistAPIModule: fetch with +9898 failed, trying plain mabn', e);
        }

        // Fallback: try with plain mabn
        try {
            const formData = new FormData();
            formData.append('mabn', originalMabn);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);

            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();
            
            if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                console.log('ChecklistAPIModule: fetched with plain mabn, got', result.data.length, 'items');
                return result;
            }
        } catch (e) {
            console.warn('ChecklistAPIModule: fetch with plain mabn failed', e);
        }

        return null;
    },

    /**
     * Internal: Find matching checklist object from response
     * Prefers items with hoten ending in '%', falls back to single item
     */
    _findChecklistObject(responseData) {
        if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
            return null;
        }

        const items = responseData.data;

        // Prefer item with hoten ending in '%'
        for (const item of items) {
            if (item && typeof item.hoten === 'string' && item.hoten.trim().endsWith('%')) {
                return item;
            }
        }

        // Fallback: single item
        if (items.length === 1 && items[0]) {
            return items[0];
        }

        // Last resort: first item with mabn
        for (const item of items) {
            if (item && (item.mabn || item.MABN || item.MaBN)) {
                return item;
            }
        }

        return null;
    },

    /**
     * Internal: Parse checklist state from checklist object
     */
    _parseChecklistState(checklistObj) {
        if (!checklistObj || !checklistObj.chuky) {
            return {};
        }

        try {
            const parsed = JSON.parse(checklistObj.chuky);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            console.warn('ChecklistAPIModule: failed to parse chuky:', e);
            return {};
        }
    },

    /**
     * Invalidate cache for a specific mabn or all entries
     */
    invalidateCache(mabn) {
        if (mabn) {
            const key = String(mabn).trim();
            _cache.delete(key);
            _inflight.delete(key);
        } else {
            _cache.clear();
            _inflight.clear();
        }
    }
};

module.exports = ChecklistAPIModule;

},{"../utils/dateUtils":50,"./apiService":36}],38:[function(require,module,exports){
// checklistService.js - Unified checklist workflow service
// Single entrypoint for checklist load/create/save + local state sync.

const SaveQueue = require('./saveQueue');
const ChecklistAPIModule = require('./checklistAPIModule');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

function getMabn(input) {
    if (!input || typeof input !== 'object') return '';
    return String(input.mabn || input.MABN || input.MaBN || '').trim();
}

const ChecklistService = {
    // Delegate to ChecklistAPIModule for cache invalidation
    _invalidateCacheForMabn(mabn) {
        try {
            ChecklistAPIModule.invalidateCache(mabn);
        } catch (_) {}
    },

    async drainSaveQueue() {
        return await SaveQueue.drain(async ({ checklistObj, checklistState }) => {
            try {
                const res = await ChecklistAPIModule.saveChecklistState(checklistObj, checklistState);
                if (res && res.ok) {
                    const mabn = getMabn(checklistObj);
                    if (mabn) {
                        try { syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
                        this._invalidateCacheForMabn(mabn);
                    }
                }
                return !!(res && res.ok);
            } catch (_) {
                return false;
            }
        });
    },
    /**
     * Load checklist data for a patient
     * DELEGATION: Delegates to ChecklistAPIModule for unified mabn handling
     */
    async loadChecklistData(patient, options = {}) {
        const result = await ChecklistAPIModule.getChecklistData(patient, options);
        if (!result) {
            return { data: [] };
        }
        // Return in legacy format: { data: [checklistObj, ...] }
        return {
            isValid: true,
            data: result.checklistObj ? [result.checklistObj] : []
        };
    },

    /**
     * Find existing checklist object from response data
     * DELEGATION: Uses ChecklistAPIModule's improved matching logic
     */
    findChecklistObject(responseData) {
        return ChecklistAPIModule._findChecklistObject(responseData);
    },

    /**
     * Parse checklist state from checklist object
     * DELEGATION: Uses ChecklistAPIModule's logic
     */
    parseChecklistState(checklistObj) {
        return ChecklistAPIModule._parseChecklistState(checklistObj);
    },

    /**
     * Unified loader for dashboard/sidebar: load checklist bundle and create if missing.
     * Returns { checklistObj, state, created } or null.
     */
    async loadChecklistBundle(patient, options = {}) {
        const { forceRefresh = false, createIfMissing = false } = options || {};
        const fetched = await ChecklistAPIModule.getChecklistData(patient, { forceRefresh });
        if (fetched && fetched.checklistObj) {
            return {
                checklistObj: fetched.checklistObj,
                state: fetched.state || {},
                created: false
            };
        }

        if (!createIfMissing) return null;

        const created = await this.createNewChecklist(patient);
        if (!created) return null;

        const afterCreate = await ChecklistAPIModule.getChecklistData(patient, { forceRefresh: true, skipCache: true });
        if (!afterCreate || !afterCreate.checklistObj) return null;
        return {
            checklistObj: afterCreate.checklistObj,
            state: afterCreate.state || {},
            created: true
        };
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
    _locks: new Map(), // mabn -> Promise chain for serialization

    async updateChecklistState(checklistObj, checklistState, options = {}) {
        const { enqueueOnOffline = true, signal, clientVersion = Date.now() } = options || {};
        const mabn = getMabn(checklistObj);
        // If offline, queue and return
        if (enqueueOnOffline && typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
            SaveQueue.enqueueUpdate(checklistObj, checklistState);
            try { if (mabn) syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
            return { ok: false, queued: true, clientVersion };
        }
        const send = async () => {
            const result = await ChecklistAPIModule.saveChecklistState(checklistObj, checklistState, { signal });
            const ok = !!(result && result.ok);
            return { ok, queued: false, clientVersion };
        };
        // Serialize per patient to avoid races
        if (mabn) {
            const prev = this._locks.get(mabn) || Promise.resolve();
            const next = prev.then(send, send);
            this._locks.set(mabn, next.catch(() => {}));
            try {
                const res = await next;
                if (res.ok) {
                    try {
                        if (mabn) syncPatientStateToGlobal(mabn, checklistState);
                    } catch (_) {}
                }
                return res;
            } catch (error) {
                console.error('Failed to update checklist state:', error);
                // Network error: queue if allowed
                if (enqueueOnOffline) {
                    SaveQueue.enqueueUpdate(checklistObj, checklistState);
                    try { if (mabn) syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
                    return { ok: false, queued: true, clientVersion };
                }
                return { ok: false, queued: false, clientVersion };
            }
        } else {
            try {
                return await send();
            } catch (error) {
                console.error('Failed to update checklist state:', error);
                if (enqueueOnOffline) {
                    SaveQueue.enqueueUpdate(checklistObj, checklistState);
                    try { if (mabn) syncPatientStateToGlobal(mabn, checklistState); } catch (_) {}
                    return { ok: false, queued: true, clientVersion };
                }
                return { ok: false, queued: false, clientVersion };
            }
        }
    },

    /**
     * Create new checklist for patient
     */
    async createNewChecklist(patient) {
        try {
            const result = await ChecklistAPIModule.createChecklist(patient);
            return !!(result && result.ok);
        } catch (error) {
            console.error('Failed to create new checklist:', error);
            return false;
        }
    }
};

module.exports = ChecklistService;

},{"../utils/stateSync":58,"./checklistAPIModule":37,"./saveQueue":42}],39:[function(require,module,exports){
// otm.token.js - OTM Token management service
// This service manages OTM authentication tokens and direct API access

const ApiService = require('./apiService');

// Special MABN identifier for OTM token storage
const OTM_TOKEN_MABN = '%9191_otm_token';

// In-memory token cache to avoid frequent API calls
let _tokenCache = {
    token: null,
    expiry: 0,
    lastValidated: 0
};

// Token validation interval (5 minutes)
const TOKEN_VALIDATION_INTERVAL = 5 * 60 * 1000;

const OTMTokenService = {
    /**
     * Check if a token appears to be valid (basic format validation)
     */
    _isLikelyValidToken(token) {
        try {
            if (typeof token !== 'string') return false;
            const t = token.trim();
            if (!t) return false;
            const low = t.toLowerCase();
            if (low === 'undefined' || low === 'null') return false;
            if (t.length < 16) return false; // heuristic: tokens are typically long
            // avoid whitespace in token
            if (/\s/.test(t)) return false;
            return true;
        } catch { 
            return false; 
        }
    },

    /**
     * Get stored OTM token from our API service
     */
    async getStoredToken() {
        try {
            // Use fixed dates as per requirement: tungay và denngay là 10/10/1010 10:10
            const tungay = '1010-10-10 10:10';
            const denngay = '1010-10-10 10:10';
            
            const formData = new FormData();
            formData.append('mabn', OTM_TOKEN_MABN);
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);
            
            const response = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            const result = await response.json();
            console.log('DEBUG - OTM Token retrieve API response:', result);
            
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                // Find the token record (similar to findChecklistObject)
                const tokenRecord = result.data.find(item => 
                    item.hoten && item.hoten.includes('OTM_TOKEN')
                );
                
                if (tokenRecord && tokenRecord.chuky) {
                    try {
                        const tokenData = JSON.parse(tokenRecord.chuky);
                        if (tokenData.token && this._isLikelyValidToken(tokenData.token)) {
                            console.log('DEBUG - Retrieved valid OTM token from storage');
                            return {
                                token: tokenData.token,
                                expiry: tokenData.expiry || 0,
                                checklistObj: tokenRecord
                            };
                        }
                    } catch (e) {
                        console.error('DEBUG - Error parsing stored token data:', e);
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('DEBUG - Error retrieving stored OTM token:', error);
            return null;
        }
    },

    /**
     * Save OTM token to our API service
     */
    async saveToken(token, expiry = null) {
        try {
            if (!this._isLikelyValidToken(token)) {
                console.error('DEBUG - Refusing to save invalid OTM token');
                return false;
            }

            // Calculate expiry if not provided (default: 24 hours from now)
            if (!expiry) {
                expiry = Date.now() + (24 * 60 * 60 * 1000);
            }

            const tokenData = {
                token: token,
                expiry: expiry,
                savedAt: Date.now()
            };

            // First, try to get existing record
            const existing = await this.getStoredToken();
            
            let checklistObj;
            if (existing && existing.checklistObj) {
                // Update existing record
                checklistObj = existing.checklistObj;
            } else {
                // Create new record structure with fixed dates: 10/10/1010 10:10
                const fixedDate = '1010-10-10';
                const fixedDateTime = '1010-10-10 10:10';
                checklistObj = {
                    mabn: OTM_TOKEN_MABN,
                    hoten: 'OTM_TOKEN_STORAGE',
                    ngaysinh: fixedDate,
                    gioitinh: '1',
                    diachi: 'SYSTEM_GENERATED',
                    ngayvv: fixedDate,
                    tungay: fixedDateTime,
                    denngay: fixedDateTime,
                    chuky: JSON.stringify(tokenData)
                };
            }

            // Update the token data
            checklistObj.chuky = JSON.stringify(tokenData);

            // Save using the same pattern as ChecklistService
            const result = await ApiService.updateChecklistData(checklistObj, tokenData);
            
            if (result && (result.Status == 1 || result.isValid)) {
                console.log('DEBUG - OTM token saved successfully');
                // Update in-memory cache
                _tokenCache = {
                    token: token,
                    expiry: expiry,
                    lastValidated: Date.now()
                };
                return true;
            } else {
                console.error('DEBUG - Failed to save OTM token:', result);
                return false;
            }
        } catch (error) {
            console.error('DEBUG - Error saving OTM token:', error);
            return false;
        }
    },

    /**
     * Test if a token is valid by making a test API call
     */
    async validateToken(token) {
        try {
            if (!this._isLikelyValidToken(token)) {
                return false;
            }

            // Use GM_xmlhttpRequest for cross-origin request if available
            return new Promise((resolve) => {
                const testUrl = `https://otm.tahospital.vn/api/booking/roomwithdepartment?_=${Date.now()}`;
                
                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: testUrl,
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'authorization': `Bearer ${token}`,
                            'logintype': '2',
                            'siteid': '1',
                            'cache-control': 'no-cache'
                        },
                        timeout: 10000,
                        onload: function(response) {
                            console.log('DEBUG - Token validation response:', response.status);
                            resolve(response.status >= 200 && response.status < 300);
                        },
                        onerror: function() {
                            console.log('DEBUG - Token validation failed - network error');
                            resolve(false);
                        },
                        ontimeout: function() {
                            console.log('DEBUG - Token validation timed out');
                            resolve(false);
                        }
                    });
                } else {
                    // Fallback - this might fail due to CORS, but try anyway
                    fetch(testUrl, {
                        method: 'GET',
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'authorization': `Bearer ${token}`,
                            'logintype': '2',
                            'siteid': '1'
                        },
                        mode: 'cors',
                        credentials: 'include'
                    })
                    .then(response => {
                        console.log('DEBUG - Token validation response (fetch):', response.status);
                        resolve(response.status >= 200 && response.status < 300);
                    })
                    .catch(() => {
                        console.log('DEBUG - Token validation failed (fetch)');
                        resolve(false);
                    });
                }
            });
        } catch (error) {
            console.error('DEBUG - Error validating token:', error);
            return false;
        }
    },

    /**
     * Get a valid OTM token - from cache, storage, or by opening OTM tab
     */
    async getValidToken() {
        const now = Date.now();
        
        // Check in-memory cache first
        if (_tokenCache.token && 
            _tokenCache.expiry > now && 
            (now - _tokenCache.lastValidated) < TOKEN_VALIDATION_INTERVAL) {
            console.log('DEBUG - Using cached OTM token');
            return _tokenCache.token;
        }

        // Try to get from storage
        const stored = await this.getStoredToken();
        if (stored && stored.token && stored.expiry > now) {
            // Validate the stored token
            const isValid = await this.validateToken(stored.token);
            if (isValid) {
                console.log('DEBUG - Using stored OTM token');
                _tokenCache = {
                    token: stored.token,
                    expiry: stored.expiry,
                    lastValidated: now
                };
                return stored.token;
            } else {
                console.log('DEBUG - Stored token is invalid, need to refresh');
            }
        }

        // Need to get a fresh token by opening OTM tab
        console.log('DEBUG - Need to open OTM tab to get fresh token');
        return await this._getTokenFromOTMTab();
    },

    /**
     * Open OTM tab to obtain a fresh token (based on existing openOTMSurgeriesTab pattern)
     */
    async _getTokenFromOTMTab() {
        return new Promise((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Token fetch timeout'));
                }
            }, 30000); // 30 second timeout

            // Subscribe to OTM messages (based on existing subscribeOTMMessages pattern)
            const unsubscribe = this._subscribeToTokenMessages(
                (tokenData) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        unsubscribe();
                        
                        if (tokenData && tokenData.token) {
                            console.log('DEBUG - Received token from OTM tab');
                            // Save the new token
                            this.saveToken(tokenData.token, tokenData.expiry);
                            resolve(tokenData.token);
                        } else {
                            reject(new Error('No token received from OTM tab'));
                        }
                    }
                },
                (error) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        unsubscribe();
                        reject(new Error(error || 'OTM token fetch failed'));
                    }
                }
            );

            // Open OTM tab with token fetch request
            const payload = encodeURIComponent(JSON.stringify({ 
                action: 'getToken',
                preferToken: true 
            }));
            const url = `https://otm.tahospital.vn/?otm-token=${payload}`;
            
            if (typeof GM !== 'undefined' && GM.openInTab) {
                try {
                    GM.openInTab(url, { active: false, insert: true, setParent: true });
                } catch (e) {
                    window.open(url, '_blank');
                }
            } else {
                window.open(url, '_blank');
            }
        });
    },

    /**
     * Subscribe to token messages from OTM tab (similar to subscribeOTMMessages)
     */
    _subscribeToTokenMessages(onSuccess, onError) {
        try {
            if (typeof GM !== 'undefined' && GM.addValueChangeListener) {
                const unsubIds = [];
                
                unsubIds.push(GM.addValueChangeListener('otm_token_success', (n, o, v) => {
                    try {
                        const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                        onSuccess && onSuccess(parsed && parsed.data);
                    } catch(_) {}
                }));
                
                unsubIds.push(GM.addValueChangeListener('otm_token_error', (n, o, v) => {
                    try {
                        const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                        onError && onError(parsed && parsed.data);
                    } catch(_) {}
                }));
                
                return () => {
                    try {
                        unsubIds.forEach(id => {
                            try {
                                GM.removeValueChangeListener && GM.removeValueChangeListener(id);
                            } catch(_) {}
                        });
                    } catch(_) {}
                };
            }
        } catch(_) {}

        // Fallback localStorage polling
        const tid = setInterval(() => {
            try {
                const s = localStorage.getItem('otm_token_success');
                if (s) {
                    localStorage.removeItem('otm_token_success');
                    const p = JSON.parse(s);
                    onSuccess && onSuccess(p && p.data);
                }
                
                const er = localStorage.getItem('otm_token_error');
                if (er) {
                    localStorage.removeItem('otm_token_error');
                    const p = JSON.parse(er);
                    onError && onError(p && p.data);
                }
            } catch(_) {}
        }, 800);
        
        return () => clearInterval(tid);
    },

    /**
     * Make an OTM API request using GM_xmlhttpRequest with automatic token handling
     */
    async makeOTMRequest(url, options = {}) {
        try {
            const token = await this.getValidToken();
            if (!token) {
                throw new Error('No valid OTM token available');
            }

            return new Promise((resolve, reject) => {
                const requestOptions = {
                    method: options.method || 'GET',
                    url: url,
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'authorization': `Bearer ${token}`,
                        'logintype': '2',
                        'siteid': '1',
                        'cache-control': 'no-cache',
                        ...options.headers
                    },
                    timeout: options.timeout || 30000
                };

                // Add body for POST requests
                if (options.body) {
                    if (typeof options.body === 'string') {
                        requestOptions.data = options.body;
                    } else {
                        requestOptions.data = JSON.stringify(options.body);
                        requestOptions.headers['content-type'] = 'application/json';
                    }
                }

                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    GM_xmlhttpRequest({
                        ...requestOptions,
                        onload: function(response) {
                            console.log('DEBUG - OTM API response:', response.status, url);
                            
                            if (response.status >= 200 && response.status < 300) {
                                try {
                                    const data = JSON.parse(response.responseText);
                                    resolve(data);
                                } catch (e) {
                                    resolve(response.responseText);
                                }
                            } else if (response.status === 401 || response.status === 403) {
                                // Token expired, clear cache and retry once
                                console.log('DEBUG - Token expired, clearing cache');
                                _tokenCache = { token: null, expiry: 0, lastValidated: 0 };
                                reject(new Error('TOKEN_EXPIRED'));
                            } else {
                                reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                            }
                        },
                        onerror: function(error) {
                            reject(error);
                        },
                        ontimeout: function() {
                            reject(new Error('REQUEST_TIMEOUT'));
                        }
                    });
                } else {
                    // Fallback to fetch (might fail due to CORS)
                    fetch(url, {
                        method: requestOptions.method,
                        headers: requestOptions.headers,
                        body: requestOptions.data,
                        mode: 'cors',
                        credentials: 'include'
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json().catch(() => response.text());
                        } else if (response.status === 401 || response.status === 403) {
                            _tokenCache = { token: null, expiry: 0, lastValidated: 0 };
                            throw new Error('TOKEN_EXPIRED');
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    })
                    .then(resolve)
                    .catch(reject);
                }
            });
        } catch (error) {
            console.error('DEBUG - OTM API request error:', error);
            throw error;
        }
    },

    /**
     * Convenience method: Fetch surgery data for date range
     */
    async fetchSurgeries(fromDate, toDate) {
        const fromISO = fromDate ? new Date(fromDate).toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z') : null;
        const toISO = toDate ? new Date(toDate).toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z') : null;
        
        if (fromISO && toISO) {
            // Range request
            const url = `https://otm.tahospital.vn/api/booking?from=${fromISO}&to=${toISO}&_=${Date.now()}`;
            return await this.makeOTMRequest(url);
        } else if (fromISO) {
            // Single date
            const url = `https://otm.tahospital.vn/api/booking?date=${fromISO}&_=${Date.now()}`;
            return await this.makeOTMRequest(url);
        } else {
            // Today
            const today = new Date().toISOString().replace('T00:00:00.000Z', 'T17:00:00.000Z');
            const url = `https://otm.tahospital.vn/api/booking?date=${today}&_=${Date.now()}`;
            return await this.makeOTMRequest(url);
        }
    },

    /**
     * Convenience method: Fetch OTM users list
     */
    async fetchUsers() {
        const url = `https://otm.tahospital.vn/api/user?ishsoft=null&page=1&limit=10000&_=${Date.now()}`;
        return await this.makeOTMRequest(url);
    },

    /**
     * Convenience method: Fetch rooms with department info
     */
    async fetchRoomsWithDepartment() {
        const url = `https://otm.tahospital.vn/api/booking/roomwithdepartment?_=${Date.now()}`;
        return await this.makeOTMRequest(url);
    }
};

module.exports = OTMTokenService;

},{"./apiService":36}],40:[function(require,module,exports){
// patientService.js - Centralized patient data fetching

const { fetchToDieuTriData } = require('../pages/page.dashboard.support');
const PatientDataMapper = require('../utils/patientDataMapper');
const LoginHandler = require('../components/loginHandler');
const ChecklistService = require('./checklistService');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

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

        const ChecklistAPIModule = require('./checklistAPIModule');
        const batchSize = 5;
        const enrichedPatients = [...patients]; // Copy array to avoid mutation

        for (let i = 0; i < patients.length; i += batchSize) {
            const batch = patients.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(patients.length / batchSize)}`);

            const batchPromises = batch.map(async (patient, batchIndex) => {
                const actualIndex = i + batchIndex;
                try {
                    console.log('Loading checklist for patient:', patient.mabn, 'with ngayvv:', patient.ngayvv);

                    // Use unified ChecklistAPIModule for consistent mabn handling
                    const result = await ChecklistAPIModule.getChecklistData(patient);
                    if (result && result.state) {
                        console.log('Checklist state loaded for patient:', patient.mabn);

                        // Store checklist state for y lệnh tags
                        enrichedPatients[actualIndex].checklistState = result.state;
                        syncPatientStateToGlobal(patient.mabn, result.state);

                        // Map surgery data from checklist
                        const surgeryData = PatientDataMapper.mapPhauThuatData(result.state);
                        if (surgeryData) {
                            console.log('Surgery data mapped for patient:', patient.mabn);
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
            if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.checkAllCelebrationAnimations === 'function') {
                unsafeWindow.checkAllCelebrationAnimations(enrichedPatients);
            } else if (typeof this !== 'undefined' && typeof this.checkAllCelebrationAnimations === 'function') {
                this.checkAllCelebrationAnimations(enrichedPatients);
            } else if (typeof globalThis.checkAllCelebrationAnimations === 'function') {
                globalThis.checkAllCelebrationAnimations(enrichedPatients);
            } else if (typeof window.checkAllCelebrationAnimations === 'function') {
                window.checkAllCelebrationAnimations(enrichedPatients);
            }
        }, 200);

        return enrichedPatients;
    },

    /**
     * Get patient data from window.dr_data or fetch from API
     */
    async getPatientData(options = {}) {
        const { forceRefresh = false } = options || {};
        const selectedKhoa = String(getSelectedKhoa('551') || '551');

        // Check if data already exists in window
        if (!forceRefresh && window.dr_data && Array.isArray(window.dr_data) && window.dr_data.length > 0 && String(window.dr_data_khoa_id || '') === selectedKhoa) {
            return window.dr_data;
        }


        // Fetch basic patient data from API first (fast)
        const basicData = await this.fetchPatientData();

        // Store basic data immediately for fast initial render
        window.dr_data = basicData;
        window.dr_data_khoa_id = selectedKhoa;

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
            if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.refreshPatientCards === 'function') {
                unsafeWindow.refreshPatientCards(enrichedData);
            } else if (typeof this !== 'undefined' && typeof this.refreshPatientCards === 'function') {
                this.refreshPatientCards(enrichedData);
            } else if (typeof globalThis.refreshPatientCards === 'function') {
                globalThis.refreshPatientCards(enrichedData);
            } else if (typeof window.refreshPatientCards === 'function') {
                window.refreshPatientCards(enrichedData);
            }

            console.log('Background enrichment completed');

            // Check for celebration animations after background enrichment
            setTimeout(() => {
                if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.checkAllCelebrationAnimations === 'function') {
                    unsafeWindow.checkAllCelebrationAnimations(enrichedData);
                } else if (typeof this !== 'undefined' && typeof this.checkAllCelebrationAnimations === 'function') {
                    this.checkAllCelebrationAnimations(enrichedData);
                } else if (typeof globalThis.checkAllCelebrationAnimations === 'function') {
                    globalThis.checkAllCelebrationAnimations(enrichedData);
                } else if (typeof window.checkAllCelebrationAnimations === 'function') {
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
    async loadPatientDataWithErrorHandling(options = {}) {
        try {
            return await this.getPatientData(options);
        } catch (error) {
            console.error('Failed to load patient data:', error);
            LoginHandler.handleLoginRequired();
            return null;
        }
    }
};

module.exports = PatientService;

},{"../components/loginHandler":17,"../pages/page.dashboard.support":31,"../utils/khoaUtils":56,"../utils/patientDataMapper":57,"../utils/stateSync":58,"./checklistAPIModule":37,"./checklistService":38}],41:[function(require,module,exports){
// reportService.js - Service for generating reports

const DateUtils = require('../utils/dateUtils');
const PatientDataMapper = require('../utils/patientDataMapper');
const ChecklistService = require('./checklistService');
const SurgeryUtils = require('../utils/surgeryUtils');
const { escapeHtml } = require('../utils/htmlUtils');

const ReportService = {

    /**
     * Load checklist state for multiple patients (sorted).
     * Options:
     *   preferInMemory (boolean, default false): if true, use the checklistState already
     *   present in window.dr_data[patient] (updated real-time by sidebar edits) and skip
     *   the server fetch for those patients. Only patients without in-memory state are fetched.
     */
    async getBatchChecklistStates(patients, { preferInMemory = false } = {}) {
        const sortedPatients = PatientDataMapper.sortPatients([...patients]);

        // Build a lookup of in-memory checklistState from window.dr_data (if available)
        const inMemoryMap = {};
        if (preferInMemory && typeof window !== 'undefined' && window.dr_data && Array.isArray(window.dr_data)) {
            for (const p of window.dr_data) {
                if (p && p.mabn && p.checklistState) {
                    inMemoryMap[p.mabn] = p.checklistState;
                }
            }
        }

        // If a sidebar is currently open, prefer its live checklistState for that patient.
        // This prevents direct-report copies from lagging behind the latest unsaved UI state.
        if (preferInMemory && typeof window !== 'undefined' && window.dr_sidebar_ctx && window.dr_sidebar_ctx.patient && window.checklistState) {
            const activePatient = window.dr_sidebar_ctx.patient;
            const activeKey = activePatient && activePatient.mabn ? String(activePatient.mabn).trim() : '';
            if (activeKey) {
                inMemoryMap[activeKey] = { ...window.checklistState };
            }
        }

        const promises = sortedPatients.map(async (patient) => {
            // Use in-memory state if available (real-time updated by sidebar)
            if (preferInMemory && patient && patient.mabn && inMemoryMap[patient.mabn]) {
                return inMemoryMap[patient.mabn];
            }
            // Otherwise fetch from server
            try {
                const res = await ChecklistService.loadChecklistData(patient);
                const obj = ChecklistService.findChecklistObject(res);
                return obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
            } catch (e) {
                console.warn('Failed to load checklist state for', patient?.mabn, e);
                return {};
            }
        });
        const states = await Promise.all(promises);
        return { sortedPatients, states };
    },

    /**
     * Format patient data for report
     */
    formatPatientData(patient, index, state = {}) {
        const { dob, age } = this.formatDateOfBirth(patient.ngaysinh);
        const gender = patient.phai === 1 ? 'Nữ' : 'Nam';
        const phauThuat = PatientDataMapper.mapPhauThuatData(state);
        const hxt = (state && typeof state.huongXuTri === 'string') ? state.huongXuTri.trim() : '';
        const cdkt = (state && typeof state.chanDoanKemTheo === 'string') ? state.chanDoanKemTheo.trim() : '';

        // Build surgery displays similar to dr-card
        let ppptDisplay = '';
        let ngayPtDisplay = '';
        if (phauThuat) {
            const date = phauThuat.ngayPhauThuat || '';
            const time = phauThuat.gioPhauThuat || '';
            const method = phauThuat.pppt || '';
            const info = SurgeryUtils.getSurgeryDateInfo(date);
            
            let hpnSuffix = '';
            if (info && info.postOpDay !== null) {
                if (info.postOpDay === 0) {
                    // Check if surgery time has passed
                    try {
                        const now = new Date();
                        const [d, m, y] = date.split('/').map(Number);
                        const [hh, mm] = time.split(':').map(Number);
                        const surgeryDate = new Date(y, m - 1, d, hh || 0, mm || 0);
                        if (now >= surgeryDate) {
                            hpnSuffix = ' (HPN0)';
                        }
                    } catch (_) {
                        // Fallback to showing it if we can't parse
                        hpnSuffix = ' (HPN0)';
                    }
                } else {
                    hpnSuffix = ` (HPN${info.postOpDay})`;
                }
            }
            // Show PPPT with HPNx when available
            ppptDisplay = `${method}${hpnSuffix}`.trim();
            // Show only the surgery date (no time)
            ngayPtDisplay = date;
        }

        return {
            index: index + 1,
            name: patient.hoten || '',
            mabn: patient.mabn || '',
            dob,
            age,
            gender,
            room: patient.teN_PHONG || '',
            bed: patient.teN_GIUONG || '',
            diagnosis: `${this.formatDiagnosis(patient)}${cdkt ? '; ' + cdkt : ''}`,
            hxt,
            ppptDisplay,
            ngayPtDisplay
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
     * Format the main diagnosis with the primary ICD code.
     */
    formatDiagnosis(patient) {
        const primaryDiagnosis = (patient && patient.chandoanvk) ? String(patient.chandoanvk).trim() : '';
        const primaryIcd = (patient && patient.maicdvk) ? String(patient.maicdvk).trim() : '';

        if (!primaryDiagnosis && !primaryIcd) return '';
        if (!primaryIcd) return primaryDiagnosis;
        if (!primaryDiagnosis) return `(${primaryIcd})`;
        return `${primaryDiagnosis} (${primaryIcd})`;
    },

    /**
     * Generate HTML report content
     */
    generateHTMLReport(patients, states) {
        let html = ``;
        // html += `<div style="margin-bottom:10px">Số lượng bệnh nhân hiện có: <b>${patients.length}</b></div>`;

        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, states[idx] || {});

            html += `<div style='margin-bottom:8px; line-height:1.15;'>`;
            html += `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${data.index}. ${data.name} - ${data.mabn}</strong></h3>`;
            html += `<div style='margin:2px 0;'><b>DOB</b>: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}</div>`;
            html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`;
            if (data.ppptDisplay) html += `<div style='margin:2px 0;'><b>PPPT</b>: ${data.ppptDisplay}</div>`;
            if (data.ngayPtDisplay) html += `<div style='margin:2px 0;'><b>Ngày PT</b>: ${data.ngayPtDisplay}</div>`;
            if (data.hxt) html += `<div style='margin:2px 0;'><b>HXT</b>: ${data.hxt.replace(/\n/g, '<br>')}</div>`;
            html += `</div>`;
        });

        return html;
    },

    /**
     * Generate HTML for a single patient (no numbering)
     */
    generateSingleHTML(patient, state = {}) {
        const data = this.formatPatientData(patient, 0, state);
        let html = ``;
        html += `<div style='margin-bottom:8px; line-height:1.15;'>`;
        html += `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${data.name} - ${data.mabn}</strong></h3>`;
        html += `<div style='margin:2px 0;'><b>DOB</b>: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}</div>`;
        html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`;
        if (data.ppptDisplay) html += `<div style='margin:2px 0;'><b>PPPT</b>: ${data.ppptDisplay}</div>`;
        if (data.ngayPtDisplay) html += `<div style='margin:2px 0;'><b>Ngày PT</b>: ${data.ngayPtDisplay}</div>`;
        if (data.hxt) html += `<div style='margin:2px 0;'><b>HXT</b>: ${data.hxt.replace(/\n/g, '<br>')}</div>`;
        html += `</div>`;
        return html;
    },

    /**
     * Generate plain text report content
     */
    generateTextReport(patients, states) {
        let report = `BÁO CÁO TRỰC\nSố lượng bệnh nhân hiện có: ${patients.length}\n`;

        patients.forEach((patient, idx) => {
            const data = this.formatPatientData(patient, idx, states[idx] || {});

            const locationText = data.room ? `${data.room} ${data.bed}`.trim() : data.bed;
            report += `${data.index}. ${locationText} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
            report += `   Chẩn đoán: ${data.diagnosis}\n`;
            if (data.ppptDisplay) report += `   PPPT: ${data.ppptDisplay}\n`;
            if (data.ngayPtDisplay) report += `   Ngày PT: ${data.ngayPtDisplay}\n`;
            if (data.hxt) report += `   HXT: ${data.hxt}\n`;
        });

        return report;
    }
    ,
    /**
     * Generate plain text for a single patient (no numbering)
     */
    generateSingleText(patient, state = {}) {
        const data = this.formatPatientData(patient, 0, state);
        let report = '';
        const locationText = data.room ? `${data.room} ${data.bed}`.trim() : data.bed;
        report += `${locationText} - ${data.name} - ${data.mabn} - ${data.dob} (${data.age}) - ${data.gender}\n`;
        report += `Chẩn đoán: ${data.diagnosis}\n`;
        if (data.ppptDisplay) report += `PPPT: ${data.ppptDisplay}\n`;
        if (data.ngayPtDisplay) report += `Ngày PT: ${data.ngayPtDisplay}\n`;
        if (data.hxt) report += `HXT: ${data.hxt}\n`;
        return report;
    },

    /**
     * Specialized report for upcoming surgeries (PT ngày mai).
     * Header: [STT]. [Giờ] - [Tên bệnh nhân] - [MABN]
     * Row: Bác sĩ thực hiện: [Bác sĩ]
     * Sorted by surgery time ascending.
     */
    generateSurgerySpecialReport(patients, states) {
        // Zip patients and states for sorting
        const zipped = patients.map((p, idx) => ({
            p,
            s: states[idx] || {},
            pt: PatientDataMapper.mapPhauThuatData(states[idx]) || {}
        }));

        // Sort by surgery time ascending
        zipped.sort((a, b) => {
            const timeA = a.pt.time || a.pt.gioPhauThuat || '99:99';
            const timeB = b.pt.time || b.pt.gioPhauThuat || '99:99';
            return timeA.localeCompare(timeB);
        });

        let html = '';
        let text = 'DANH SÁCH PHẪU THUẬT\n\n';

        zipped.forEach((item, idx) => {
            const data = this.formatPatientData(item.p, idx, item.s);
            const time = item.pt.time || item.pt.gioPhauThuat || '--:--';
            const doctors = item.pt.doctors || item.pt.bacSiPhauThuat || 'Chưa rõ';

            // HTML - Standardized style
            html += `<div style='margin-bottom:12px; line-height:1.15;'>`;
            html += `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${data.index}. ${time} - ${data.name} - ${data.mabn}</strong></h3>`;
            html += `<div style='margin:2px 0;'><b>DOB</b>: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}</div>`;
            html += `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`;
            html += `<div style='margin:2px 0;'><b>PTV</b>: <span style='color:#d32f2f; font-weight:700;'>${item.pt.bacSi || 'Chưa rõ'}</span></div>`;
            if (data.ppptDisplay) html += `<div style='margin:2px 0;'><b>PPPT</b>: ${data.ppptDisplay}</div>`;
            html += `</div>`;

            // Text
            text += `${data.index}. ${time} - ${data.name} - ${data.mabn}\n`;
            text += `   PTV: ${item.pt.bacSi || 'Chưa rõ'}\n`;
            text += `   Chẩn đoán: ${data.diagnosis}\n`;
            if (data.ppptDisplay) text += `   PPPT: ${data.ppptDisplay}\n`;
        });

        return { html, text };
    }
};

module.exports = ReportService;

},{"../utils/dateUtils":50,"../utils/htmlUtils":55,"../utils/patientDataMapper":57,"../utils/surgeryUtils":59,"./checklistService":38}],42:[function(require,module,exports){
// saveQueue.js - Offline queue for checklist saves

const QUEUE_KEY = 'dr_save_queue_v1';

function loadQueue() {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (_) {
        return [];
    }
}

function saveQueue(arr) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(arr)); } catch (_) {}
}

// Keep only the latest item per mabn (dedupe)
function upsertByMabn(queue, item) {
    const idx = queue.findIndex(q => q.mabn === item.mabn);
    if (idx >= 0) queue[idx] = item; else queue.push(item);
}

const SaveQueue = {
    enqueueUpdate(checklistObj, checklistState) {
        const mabn = (checklistObj && (checklistObj.mabn || checklistObj.MABN || checklistObj.MaBN)) || '';
        const item = {
            id: `${mabn}:${Date.now()}`,
            mabn,
            type: 'updateChecklist',
            payload: { checklistObj, checklistState },
            createdAt: Date.now()
        };
        const q = loadQueue();
        upsertByMabn(q, item);
        saveQueue(q);
        return item.id;
    },
    async drain(processor) {
        // processor: async ({ checklistObj, checklistState }) => boolean
        const q = loadQueue();
        if (!q.length) return 0;
        let successCount = 0;
        const rest = [];
        for (const item of q) {
            try {
                const ok = await processor(item.payload);
                if (ok) successCount++; else rest.push(item);
            } catch (_) { rest.push(item); }
        }
        saveQueue(rest);
        return successCount;
    },
    size() { return loadQueue().length; },
    purge(mabn) {
        const q = loadQueue().filter(i => i.mabn !== mabn);
        saveQueue(q);
    }
};

module.exports = SaveQueue;

},{}],43:[function(require,module,exports){
// settingsService.js - Manage settings stored in a checklist-like phiếu using doctor name as mabn

const ApiService = require('./apiService');
const { getSelectedKhoa } = require('../utils/khoaUtils');

const CLOUD_ACCOUNTS_VERSION = 1;
const CLOUD_ACCOUNTS_ALG_AES = 'AES-GCM';
const CLOUD_ACCOUNTS_ALG_FALLBACK = 'XOR-B64';

function toBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i += 1) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function fromBase64(base64Text) {
    const binary = atob(base64Text || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function xorBytes(inputBytes, keyBytes) {
    if (!inputBytes || !keyBytes || keyBytes.length === 0) return inputBytes;
    const output = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i += 1) {
        output[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return output;
}

function normalizeAccountList(list) {
    if (!Array.isArray(list)) return [];
    return list
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            return {
                title: String(item.title || '').trim(),
                username: String(item.username || '').trim(),
                password: String(item.password || '')
            };
        })
        .filter((item) => item && item.username);
}

function buildCryptoSeed(context) {
    const chungThuSo = String((context && context.chungThuSo) || '').trim();
    const doctorName = String((context && context.doctorName) || '').trim();
    const source = chungThuSo || doctorName || 'anonymous';
    return `dr.cloud.accounts.v1::${source}`;
}

async function deriveAesKey(seed) {
    try {
        if (!window.crypto || !window.crypto.subtle) return null;
        const encoder = new TextEncoder();
        const raw = encoder.encode(String(seed || ''));
        const digest = await window.crypto.subtle.digest('SHA-256', raw);
        return await window.crypto.subtle.importKey(
            'raw',
            digest,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (_) {
        return null;
    }
}

async function encryptWithAesGcm(plainText, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(String(plainText || ''))
    );
    return {
        iv: toBase64(iv),
        data: toBase64(new Uint8Array(encrypted))
    };
}

async function decryptWithAesGcm(ivBase64, dataBase64, key) {
    const iv = fromBase64(ivBase64 || '');
    const cipher = fromBase64(dataBase64 || '');
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipher
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

const SettingsService = {
    async fetchDoctorInfo() {
        try {
            const body = new URLSearchParams();
            body.set('FilterProperty', '');
            body.set('FilterBy', '');
            body.set('Page', '1');
            body.set('PageSize', '20');
            body.set('OrderProperty', '');
            body.set('OrderBy', '');
            body.set('id', '');
            body.set('_key', 'change-pin-chung-thu-so');

            const response = await fetch('/sp-admin/change-pin-chung-thu-so/Form', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body
            });

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const nameInput = doc.querySelector('#HoTen');
            const ctsInput = doc.querySelector('#ChungThuSo');
            
            let name = '';
            if (nameInput) {
                name = (nameInput.value || nameInput.getAttribute('value') || '').trim();
            }
            let chungThuSo = '';
            if (ctsInput) {
                chungThuSo = (ctsInput.value || ctsInput.getAttribute('value') || '').trim();
            }

            return { name, chungThuSo };
        } catch (e) {
            console.error('Failed to fetch doctor info:', e);
            return { name: '', chungThuSo: '' };
        }
    },

    async loadSettingsPhieu(chungThuSo) {
        // Use DSPhieu API with chungThuSo as mabn
        const formData = new FormData();
        formData.append('mabn', chungThuSo);
        // very wide range
        formData.append('tungay', '01/01/1001 01:01');
        formData.append('denngay', '01/01/3001 01:01');

        const resp = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const result = await resp.json();
        const data = (result && result.data) || [];
        // Pick first item that matches mabn==chungThuSo and hoten endsWith %
        let found = data.find(item => item && item.mabn === chungThuSo && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
        // Fallback: if API returned exactly one candidate for this chungThuSo, accept it even without the '%' marker
        if (!found && data.length === 1 && data[0] && data[0].mabn === chungThuSo) {
            found = data[0];
        }
        return found;
    },

    parseSettingsState(checklistObj) {
        if (!checklistObj || !checklistObj.chuky) return {};
        try {
            const parsed = JSON.parse(checklistObj.chuky);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    },

    async encodeCloudAccounts(accounts, context) {
        const normalized = normalizeAccountList(accounts);
        const payloadText = JSON.stringify({
            accounts: normalized,
            updatedAt: Date.now()
        });
        const seed = buildCryptoSeed(context);
        const key = await deriveAesKey(seed);

        if (key) {
            const encrypted = await encryptWithAesGcm(payloadText, key);
            return {
                v: CLOUD_ACCOUNTS_VERSION,
                alg: CLOUD_ACCOUNTS_ALG_AES,
                iv: encrypted.iv,
                data: encrypted.data
            };
        }

        return {
            v: CLOUD_ACCOUNTS_VERSION,
            alg: CLOUD_ACCOUNTS_ALG_FALLBACK,
            data: toBase64(
                xorBytes(
                    new TextEncoder().encode(payloadText),
                    new TextEncoder().encode(seed)
                )
            )
        };
    },

    async decodeCloudAccounts(cloudAccounts, context) {
        try {
            if (!cloudAccounts) return [];

            if (Array.isArray(cloudAccounts)) {
                return normalizeAccountList(cloudAccounts);
            }

            if (typeof cloudAccounts === 'string') {
                try {
                    const parsed = JSON.parse(cloudAccounts);
                    return this.decodeCloudAccounts(parsed, context);
                } catch (_) {
                    return [];
                }
            }

            if (cloudAccounts && Array.isArray(cloudAccounts.items)) {
                return normalizeAccountList(cloudAccounts.items);
            }

            const alg = String((cloudAccounts && cloudAccounts.alg) || CLOUD_ACCOUNTS_ALG_FALLBACK);
            const seed = buildCryptoSeed(context);
            const encodedData = cloudAccounts && cloudAccounts.data;
            if (!encodedData) return [];

            let payloadText = '';
            if (alg === CLOUD_ACCOUNTS_ALG_AES) {
                const key = await deriveAesKey(seed);
                if (!key) return [];
                payloadText = await decryptWithAesGcm(cloudAccounts.iv, encodedData, key);
            } else {
                payloadText = new TextDecoder().decode(
                    xorBytes(
                        fromBase64(encodedData),
                        new TextEncoder().encode(seed)
                    )
                );
            }

            const payload = JSON.parse(payloadText);
            if (Array.isArray(payload)) return normalizeAccountList(payload);
            return normalizeAccountList(payload && payload.accounts);
        } catch (e) {
            console.warn('Decode cloud accounts failed:', e);
            return [];
        }
    },

    async getCloudAccounts(settings, context) {
        const state = settings && typeof settings === 'object' ? settings : {};

        if (Object.prototype.hasOwnProperty.call(state, 'cloudAccounts') && state.cloudAccounts) {
            return this.decodeCloudAccounts(state.cloudAccounts, context);
        }

        if (Array.isArray(state.accountsCloud)) {
            return normalizeAccountList(state.accountsCloud);
        }

        if (Array.isArray(state.accounts)) {
            return normalizeAccountList(state.accounts);
        }

        return [];
    },

    async withCloudAccounts(settings, accounts, context) {
        const next = {
            ...(settings && typeof settings === 'object' ? settings : {})
        };
        next.cloudAccounts = await this.encodeCloudAccounts(accounts, context);
        return next;
    },

    async createSettingsPhieu({ name, chungThuSo }) {
        // Reuse CreateAjax endpoint with chungThuSo as mabn
        const formData = new FormData();
        formData.append('status', '1');
        formData.append('thebaohiemyte', 'Không');
        formData.append('dieukhoancamket', 'true');
        formData.append('chuky', '{}');
        formData.append('khac', '--*--');
        formData.append('khu', '1');
        formData.append('mabn', chungThuSo);
        formData.append('bieumauid', '027');
        formData.append('makp', getSelectedKhoa('551'));
        formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
        formData.append('actiontype', '');
        // Mark with name% so it can be identified and matched by endsWith('%')
        formData.append('hoten', `${name}%`);
        formData.append('ngaysinh', '10/10/1999');
        formData.append('gioitinh', 'Nam');

        const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return response.json();
    },

    async updateSettingsState(oldData, settingsState) {
        try {
            const res = await ApiService.updateChecklistData(oldData, settingsState);
            return res && (res.Status == 1 || res.isValid);
        } catch (e) {
            console.error('Failed to update settings state:', e);
            return false;
        }
    },

    getDefaultSettings() {
        return {
            danDoRaVien: [
                'Uống thuốc đúng toa được dặn',
                'Tái khám đúng hẹn',
                'Liên hệ khi có dấu hiệu bất thường'
            ],
            dashboard: {}, // To store dashboard toggles/filters
            cloudAccounts: null
        };
    },

    async getOrCreateSettings() {
        const info = await this.fetchDoctorInfo();
        if (!info.name || !info.chungThuSo) {
            return { doctorName: info.name, chungThuSo: info.chungThuSo, checklistObj: null, settings: this.getDefaultSettings() };
        }
        let checklistObj = await this.loadSettingsPhieu(info.chungThuSo);
        if (!checklistObj) {
            const created = await this.createSettingsPhieu(info);
            if (created && created.isValid && created.data) {
                // Some CreateAjax returns full object, some just flags; re-read list to get object
                checklistObj = await this.loadSettingsPhieu(info.chungThuSo);
            }
        }
        const settings = checklistObj ? this.parseSettingsState(checklistObj) : this.getDefaultSettings();
        if (!settings.danDoRaVien) settings.danDoRaVien = this.getDefaultSettings().danDoRaVien;
        if (!settings.dashboard) settings.dashboard = this.getDefaultSettings().dashboard;
        return { doctorName: info.name, chungThuSo: info.chungThuSo, checklistObj, settings };
    }
};

module.exports = SettingsService;

},{"../utils/khoaUtils":56,"./apiService":36}],44:[function(require,module,exports){
// surgeonSettingsService.js - Store selected surgeons per khoa using checklist-like records

const ApiService = require('./apiService');

function makeKeyForKhoa(khoaId) {
    return `${String(khoaId)}%h991h otm.dsbacsi`;
}

async function loadRecordForKhoa(khoaId) {
    const key = makeKeyForKhoa(khoaId);
    const formData = new FormData();
    formData.append('mabn', key);
    // Use a very wide range to ensure the special record is returned
    formData.append('tungay', '01/01/1001 01:01');
    formData.append('denngay', '01/01/3001 01:01');
    const resp = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    const result = await resp.json();
    const data = (result && result.data) || [];
    let found = data.find(item => item && item.mabn === key && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
    if (!found && data.length === 1 && data[0] && data[0].mabn === key) {
        found = data[0];
    }
    return found;
}

async function createRecordForKhoa(khoaId) {
    const key = makeKeyForKhoa(khoaId);
    const formData = new FormData();
    formData.append('status', '1');
    formData.append('thebaohiemyte', 'Không');
    formData.append('dieukhoancamket', 'true');
    // Initialize with empty list
    formData.append('chuky', JSON.stringify({ otm: { dsbacsi: [] } }));
    formData.append('khac', '--*--');
    formData.append('khu', '1');
    formData.append('mabn', key);
    formData.append('bieumauid', '027');
    // Use a fixed marker date as per convention
    formData.append('makp', '551');
    formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
    formData.append('actiontype', '');
    formData.append('hoten', `${key}%`);
    formData.append('ngaysinh', '10/10/1010');
    formData.append('gioitinh', 'Nam');
    const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    return response.json();
}

function parseState(obj) {
    if (!obj || !obj.chuky) return { otm: { dsbacsi: [] } };
    try {
        const parsed = JSON.parse(obj.chuky);
        if (parsed && parsed.otm && Array.isArray(parsed.otm.dsbacsi)) return parsed;
        // normalize
        const arr = parsed && (parsed.dsbacsi || parsed.surgeons || []);
        return { otm: { dsbacsi: Array.isArray(arr) ? arr : [] } };
    } catch (_) {
        return { otm: { dsbacsi: [] } };
    }
}

const SurgeonSettingsService = {
    makeKeyForKhoa,
    async getOrCreateRecord(khoaId) {
        let obj = await loadRecordForKhoa(khoaId);
        if (!obj) {
            const created = await createRecordForKhoa(khoaId);
            if (created && (created.isValid || created.Status == 1)) {
                obj = await loadRecordForKhoa(khoaId);
            }
        }
        return obj;
    },
    async loadSurgeonList(khoaId) {
        const obj = await loadRecordForKhoa(khoaId);
        const state = parseState(obj);
        return { list: state.otm.dsbacsi || [], obj };
    },
    async saveSurgeonList(khoaId, fullnames) {
        const obj = await this.getOrCreateRecord(khoaId);
        if (!obj) return { ok: false };
        const next = { otm: { dsbacsi: Array.from(new Set((fullnames || []).map(s => String(s).trim()).filter(Boolean))) } };
        const res = await ApiService.updateChecklistData(obj, next);
        const ok = res && (res.Status == 1 || res.isValid);
        return { ok };
    }
};

module.exports = SurgeonSettingsService;

},{"./apiService":36}],45:[function(require,module,exports){
// trackedPatientService.js - Manage tracked patients (from other departments)

const ApiService = require('./apiService');
const { getSelectedKhoa } = require('../utils/khoaUtils');

const TrackedPatientService = {
    async loadTrackedPhieu(deptId) {
        const mabn = `${deptId}theodoi`;
        const formData = new FormData();
        formData.append('mabn', mabn);
        // very wide range
        formData.append('tungay', '01/01/1001 01:01');
        formData.append('denngay', '01/01/3001 01:01');

        const resp = await fetch('/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const result = await resp.json();
        const data = (result && result.data) || [];
        let found = data.find(item => item && item.mabn === mabn && typeof item.hoten === 'string' && item.hoten.endsWith('%')) || null;
        if (!found && data.length === 1 && data[0] && data[0].mabn === mabn) {
            // Accept single returned item as fallback even if it lacks the '%' marker
            found = data[0];
        }
        return found;
    },

    parseTrackedState(checklistObj) {
        if (!checklistObj || !checklistObj.chuky) return { pids: [], cache: {} };
        try {
            const parsed = JSON.parse(checklistObj.chuky);
            return {
                pids: Array.isArray(parsed?.pids) ? parsed.pids : [],
                cache: (parsed && typeof parsed.cache === 'object') ? parsed.cache : {}
            };
        } catch {
            return { pids: [], cache: {} };
        }
    },

    async createTrackedPhieu(deptId) {
        const mabn = `${deptId}theodoi`;
        const formData = new FormData();
        formData.append('status', '1');
        formData.append('thebaohiemyte', 'Không');
        formData.append('dieukhoancamket', 'true');
        formData.append('chuky', JSON.stringify({ pids: [], cache: {} }));
        formData.append('khac', '--*--');
        formData.append('khu', '1');
        formData.append('mabn', mabn);
        formData.append('bieumauid', '027');
        formData.append('makp', deptId);
        formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
        formData.append('actiontype', '');
        formData.append('hoten', `${mabn}%`);
        formData.append('ngaysinh', '10/10/1999');
        formData.append('gioitinh', 'Nam');

        const response = await fetch('/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return response.json();
    },

    async updateTrackedState(oldData, state) {
        try {
            const res = await ApiService.updateChecklistData(oldData, state);
            return res && (res.Status == 1 || res.isValid);
        } catch (e) {
            console.error('Failed to update tracked patients state:', e);
            return false;
        }
    },

    async getOrCreateTrackedPatients(deptId) {
        if (!deptId) return { checklistObj: null, pids: [] };
        
        let checklistObj = await this.loadTrackedPhieu(deptId);
        if (!checklistObj) {
            const created = await this.createTrackedPhieu(deptId);
            if (created && created.isValid && created.data) {
                checklistObj = await this.loadTrackedPhieu(deptId);
            }
        }
        
        const state = checklistObj ? this.parseTrackedState(checklistObj) : { pids: [], cache: {} };
        if (!Array.isArray(state.pids)) state.pids = [];
        if (typeof state.cache !== 'object') state.cache = {};
        return { checklistObj, pids: state.pids, cache: state.cache };
    }
};

module.exports = TrackedPatientService;

},{"../utils/khoaUtils":56,"./apiService":36}],46:[function(require,module,exports){
// Top-level compatibility shim for legacy imports
module.exports = require('./pages/page.settings-open-world');
// Top-level compatibility shim for legacy imports
// This allows requiring '../settings-open-world' from files inside src/pages
module.exports = require('./pages/page.settings-open-world');

},{"./pages/page.settings-open-world":33}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
// checklistUtils.js - Checklist-related utility functions

const { showToast, copyToClipboard } = require('./uiUtils');
const ChecklistService = require('../services/checklistService');
const { getTodayISODate, isDischargeEntryOnDate } = require('./dischargeUtils');

/**
 * Create checklist item HTML with special actions
 * @param {string} itemText - Item text
 * @param {string} id - Item ID
 * @param {boolean} isChecked - Whether item is checked
 * @param {object} patient - Patient data
 * @returns {string} - HTML string
 */
function createChecklistItemHTML(itemText, id, isChecked, patient) {
    const baseHTML = `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''}>${itemText}</label>`;
    
    // Add special clickable items without checkbox for certain items
    if (itemText === 'Mở HSBA v2') {
        return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#e3f2fd;border-radius:4px;cursor:pointer;transition:background-color 0.2s;" onclick="openHSBAV2('${patient.mabn}')" onmouseover="this.style.backgroundColor='#bbdefb'" onmouseout="this.style.backgroundColor='#e3f2fd'">
                <span style="color:#1976d2;font-weight:500;">🔗 ${itemText}</span>
                <span style="margin-left:auto;color:#1976d2;font-size:0.8em;">👆 Click để mở</span>
            </div>
        `;
    } else if (itemText === 'Mở trang dặn dò') {
        return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#fff3e0;border-radius:4px;cursor:pointer;transition:background-color 0.2s;" onclick="window.open('https://hoaiump.notion.site/D-N-D-RA-VI-N-21025280dcee804c971bea55557264b9', '_blank')" onmouseover="this.style.backgroundColor='#ffe0b2'" onmouseout="this.style.backgroundColor='#fff3e0'">
                <span style="color:#f57c00;font-weight:500;">📋 ${itemText}</span>
                <span style="margin-left:auto;color:#f57c00;font-size:0.8em;">👆 Click để mở</span>
            </div>
        `;
    } else if (itemText === 'Thực hiện y lệnh thuốc đã dự trù') {
        const key = `xuatvien_${itemText}`;
        const isCompleted = window.checklistState && window.checklistState[key] || false;
        return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:${isCompleted ? '#e8f5e8' : '#f3e5f5'};border-radius:4px;cursor:pointer;transition:background-color 0.2s;border:${isCompleted ? '2px solid #4caf50' : '1px solid #9c27b0'};" onclick="copyYLenhText('${itemText}', '${id}', '${patient.mabn}')" onmouseover="this.style.backgroundColor='${isCompleted ? '#dcedc8' : '#e1bee7'}'" onmouseout="this.style.backgroundColor='${isCompleted ? '#e8f5e8' : '#f3e5f5'}'">
                <span style="color:${isCompleted ? '#2e7d32' : '#7b1fa2'};font-weight:500;">${isCompleted ? '✅' : '📋'} ${itemText}</span>
                <span style="margin-left:auto;color:${isCompleted ? '#2e7d32' : '#7b1fa2'};font-size:0.8em;">${isCompleted ? '✅ Đã copy' : '👆 Click để copy'}</span>
            </div>
        `;
    }
    
    return baseHTML;
}

/**
 * Copy y lệnh text and mark as completed
 * @param {string} text - Text to copy
 * @param {string} id - Item ID
 * @param {string} mabn - Patient MABN
 */
async function copyYLenhText(text, id, mabn) {
    const success = await copyToClipboard(text);
    
    if (success) {
        // Mark as completed in checklist state
        if (!window.checklistState) {
            window.checklistState = {};
        }
        
        const key = `xuatvien_${text}`;
        window.checklistState[key] = true;
        
        // Save to server
        if (window.checklistObj) {
            const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.error('Lưu checklist thất bại!');
            }
        }
        
        // Show success toast
        showToast(`📋 Đã copy: "${text}"`, {
            background: '#4caf50',
            duration: 2500
        });
        
        // Re-render the checklist to show completed state
        setTimeout(() => {
            const xuatvienList = document.querySelector('#checklist-xuatvien');
            if (xuatvienList) {
                const patient = (typeof dr_data !== 'undefined' && dr_data) ? dr_data.find(p => p.mabn === mabn) : null;
                if (patient) {
                    // Try different global scopes for renderChecklistXuatVien function
                    const renderFn = globalThis.renderChecklistXuatVien || 
                                   (typeof unsafeWindow !== 'undefined' && unsafeWindow.renderChecklistXuatVien) ||
                                   (typeof this !== 'undefined' && this.renderChecklistXuatVien) ||
                                   window.renderChecklistXuatVien;
                    if (renderFn) {
                        renderFn(xuatvienList, patient);
                    }
                }
            }
        }, 100);
        
    } else {
        showToast('❌ Không thể copy vào clipboard', {
            background: '#f44336',
            duration: 2000
        });
    }
}

/**
 * Check celebration for card
 * @param {HTMLElement} card - Card element
 * @param {object} patient - Patient data
 */
function checkCelebrationForCard(card, patient) {
    if (!patient || !patient.checklistState || !patient.checklistState.yLenhLog) {
        card.classList.remove('xuatvienanimation');
        return;
    }

    const todayIso = getTodayISODate();
    const dischargeEntries = patient.checklistState.yLenhLog.filter(entry => isDischargeEntryOnDate(entry, todayIso));

    if (dischargeEntries.length > 0) {
        card.classList.add('xuatvienanimation');
    } else {
        card.classList.remove('xuatvienanimation');
    }
}

/**
 * Check celebration animations for all cards
 * @param {Array} enrichedPatients - Patient data array
 */
function checkAllCelebrationAnimations(enrichedPatients) {
    const cards = document.querySelectorAll('.dr-card, .dr-list-row, .dr-tracking-item');
    
    cards.forEach((card) => {
        // Get patient MABN from card attributes
        let mabn = card.getAttribute('data-mabn');
        
        if (!mabn) {
            // Fallback for older DOM structures if data-mabn attribute is not set
            const cardTitle = card.querySelector('h2');
            if (!cardTitle) return;

            const cardText = cardTitle.textContent;
            const mabnMatch = cardText.match(/(\d{8,})/); // Find MABN pattern
            if (!mabnMatch) return;

            mabn = mabnMatch[1];
        }
        
        // Find corresponding patient in enriched data
        const patient = enrichedPatients.find(p => p.mabn === mabn);
        if (patient) {
            checkCelebrationForCard(card, patient);
        }
    });
}

module.exports = {
    createChecklistItemHTML,
    copyYLenhText,
    checkCelebrationForCard,
    checkAllCelebrationAnimations
};

},{"../services/checklistService":38,"./dischargeUtils":51,"./uiUtils":62}],49:[function(require,module,exports){
// contextMenuCopyBuilders.js - Builders for specialized context-menu copy variants

const ChecklistService = require('../services/checklistService');
const ReportService = require('../services/reportService');
const PatientDataMapper = require('./patientDataMapper');
const { escapeHtml } = require('./htmlUtils');
const GPB_CAI_DAT = require('../BS_CAI_DAT_GPB_CAT_LANH');

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function loadPatientChecklistState(patient) {
    if (patient && patient.checklistState) {
        return patient.checklistState;
    }
    return ChecklistService.loadChecklistData(patient)
        .then((res) => {
            const obj = ChecklistService.findChecklistObject(res);
            return obj ? (ChecklistService.parseChecklistState(obj) || {}) : {};
        })
        .catch(() => ({}));
}

function getPatientSurgeryData(patient, state) {
    return PatientDataMapper.mapPhauThuatData(state) || patient?.phauThuatInfo || null;
}

function parseDateDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const match = String(dateStr).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
}

function parseTimeHHMM(timeStr) {
    const match = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hour = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    const minute = Math.max(0, Math.min(59, parseInt(match[2], 10)));
    return { hour, minute };
}

function formatDateTimeVN(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    return { date: `${dd}/${mm}/${yyyy}`, time: `${HH}:${MM}` };
}

function addMinutesToSurgeryTime(dateStr, timeStr, minutes) {
    const date = parseDateDDMMYYYY(dateStr);
    const time = parseTimeHHMM(timeStr);
    if (!date || !time) return '';
    date.setHours(time.hour, time.minute, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return formatDateTimeVN(date);
}

function extractLateralityPhrase(diagnosis) {
    const raw = String(diagnosis || '').trim();
    if (!raw) return '';

    const phraseMatch = raw.match(/th[ùu]y(?:\s+[^,.;()]+){0,3}\s+(trái|phải|trai|phai)/i);
    if (phraseMatch) {
        return phraseMatch[0]
            .replace(/trai/i, 'trái')
            .replace(/phai/i, 'phải')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const normalized = normalizeText(raw);
    if (normalized.includes('trai')) return 'thùy trái';
    if (normalized.includes('phai')) return 'thùy phải';
    return '';
}

function matchesRule(diagnosis, rule) {
    const normalizedDiagnosis = normalizeText(diagnosis);
    const rawKeywords = Array.isArray(rule.keywords)
        ? rule.keywords
        : String(rule.keywords || '').split('|');
    const keywords = rawKeywords.map(item => normalizeText(item)).filter(Boolean);

    if (keywords.length === 0) return false;
    const mode = String(rule.matchMode || 'OR').toUpperCase();
    if (mode === 'AND') {
        return keywords.every(keyword => normalizedDiagnosis.includes(keyword));
    }
    return keywords.some(keyword => normalizedDiagnosis.includes(keyword));
}

function resolveTemplate(template, context) {
    const source = String(template || '').trim();
    if (!source) return '';
    return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
        const value = context[key];
        return value == null ? '' : String(value);
    }).replace(/\s+/g, ' ').trim();
}

function findGpbRule(diagnosis) {
    const rules = Array.isArray(GPB_CAI_DAT.rules) ? GPB_CAI_DAT.rules : [];
    return rules.find(rule => matchesRule(diagnosis, rule)) || null;
}

function buildPatientHeader(data, includeLocation = true) {
    const locationText = includeLocation && data.room ? `${data.room} ${data.bed}`.trim() : '';
    const parts = [];
    if (locationText) parts.push(locationText);
    if (data.name) parts.push(data.name);
    if (data.mabn) parts.push(data.mabn);
    const rest = `${data.dob} (${data.age}) - ${data.gender}`.trim();
    return parts.join(' - ') + (rest ? ` - ${rest}` : '');
}

function buildPatientHeaderHtml(data, includeLocation = true) {
    const parts = [];
    if (includeLocation && data.room) parts.push(escapeHtml(`${data.room} ${data.bed || ''}`.trim()));
    parts.push(escapeHtml(data.name || ''));
    parts.push(escapeHtml(data.mabn || ''));
    const headerText = parts.filter(Boolean).join(' - ');
    return `<h3 style='font-size:1.3em; margin:0 0 4px 0; color:#3277d5'><strong>${headerText}</strong></h3>`;
}

function buildPatientIdentityLines(data) {
    return {
        html: `<div style='margin:2px 0;'><b>DOB</b>: ${escapeHtml(data.dob)} (${escapeHtml(data.age)}) - ${escapeHtml(data.gender)} - ${escapeHtml(data.room)} - ${escapeHtml(data.bed)}</div>`,
        text: `DOB: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}\n`
    };
}

async function buildLichMoPtvCopy(patient, { includeLocation = true } = {}) {
    const state = await loadPatientChecklistState(patient);
    const data = ReportService.formatPatientData(patient, 0, state);
    const surgery = getPatientSurgeryData(patient, state);
    if (!surgery) return null;

    const surgeryDate = surgery.ngayPhauThuat || '';
    const surgeryTime = surgery.gioPhauThuat || '';
    const header = buildPatientHeader(data, includeLocation);
    const surgeryDisplay = surgeryDate && surgeryTime ? `${surgeryDate} ${surgeryTime}` : (surgeryDate || surgeryTime || '');

    const ptvDoctors = surgery.doctors || surgery.bacSi || surgery.bacSiPhauThuat || '';

    const html = [
        `<div style='margin-bottom:8px; line-height:1.15;'>`,
        buildPatientHeaderHtml(data, includeLocation),
        `<div style='margin:2px 0;'><b>DOB</b>: ${escapeHtml(data.dob)} (${escapeHtml(data.age)}) - ${escapeHtml(data.gender)} - ${escapeHtml(data.room)} - ${escapeHtml(data.bed)}</div>`,
        `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`,
        `<div style='margin:2px 0;'><b>Ngày PT</b>: ${escapeHtml(surgeryDate)}</div>`,
        `<div style='margin:2px 0;'><b>Giờ PT</b>: ${escapeHtml(surgeryTime)}</div>`,
        `<div style='margin:2px 0;'><b>PTV</b>: <span style='color:#d32f2f; font-weight:700;'>${escapeHtml(ptvDoctors || 'Chưa rõ')}</span></div>`,
        surgery.pppt ? `<div style='margin:2px 0;'><b>PPPT</b>: ${escapeHtml(surgery.pppt)}</div>` : '',
        `</div>`
    ].filter(Boolean).join('');

    const text = [
        header,
        `DOB: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}`,
        `Chẩn đoán: ${data.diagnosis}`,
        `Ngày PT: ${surgeryDate}`,
        `Giờ PT: ${surgeryTime}`,
        `PTV: ${ptvDoctors || 'Chưa rõ'}`,
        surgery.pppt ? `PPPT: ${surgery.pppt}` : ''
    ].filter(Boolean).join('\n') + '\n';

    return { html, text };
}

async function buildGpbCatLanhCopy(patient, { includeLocation = true } = {}) {
    const state = await loadPatientChecklistState(patient);
    const data = ReportService.formatPatientData(patient, 0, state);
    const surgery = getPatientSurgeryData(patient, state);
    if (!surgery) return null;

    const diagnosis = String(data.diagnosis || '').trim();
    const rule = findGpbRule(diagnosis) || {};
    const laterality = extractLateralityPhrase(diagnosis);
    const context = {
        diagnosis,
        laterality,
        room: data.room,
        bed: data.bed,
        name: data.name,
        mabn: data.mabn
    };

    const specimenTemplate = rule.mau_benh_pham || GPB_CAI_DAT.defaultFallbackSpecimen || 'Mẫu bệnh phẩm';
    const wantToKnowTemplate = rule.mong_muon_biet || GPB_CAI_DAT.defaultMongMuonBiet || '';
    const specimen = resolveTemplate(specimenTemplate, context) || diagnosis || 'Mẫu bệnh phẩm';
    const wantToKnow = resolveTemplate(wantToKnowTemplate, context) || (GPB_CAI_DAT.defaultMongMuonBiet || '');

    const surgeryDate = surgery.ngayPhauThuat || '';
    const surgeryTime = surgery.gioPhauThuat || '';
    const expected = addMinutesToSurgeryTime(surgeryDate, surgeryTime, Number(GPB_CAI_DAT.defaultExpectedMinutes || 90)) || '';
    const expectedText = expected ? `${expected.date} ${expected.time}`.trim() : '';

    const html = [
        `<div style='margin-bottom:8px; line-height:1.15;'>`,
        buildPatientHeaderHtml(data, includeLocation),
        `<div style='margin:2px 0;'><b>DOB</b>: ${escapeHtml(data.dob)} (${escapeHtml(data.age)}) - ${escapeHtml(data.gender)} - ${escapeHtml(data.room)} - ${escapeHtml(data.bed)}</div>`,
        `<div style='margin:2px 0;'><b>Chẩn đoán</b>: ${escapeHtml(data.diagnosis)}</div>`,
        `<div style='margin:2px 0;'><b>Ngày PT</b>: ${escapeHtml(surgeryDate)}</div>`,
        `<div style='margin:2px 0;'><b>Giờ PT</b>: ${escapeHtml(surgeryTime)}</div>`,
        surgery.pppt ? `<div style='margin:2px 0;'><b>PPPT</b>: ${escapeHtml(surgery.pppt)}</div>` : '',
        `<div style='margin:2px 0;'><b>Mẫu bệnh phẩm:</b> ${escapeHtml(specimen)}</div>`,
        `<div style='margin:2px 0;'><b>Mong muốn biết:</b> ${escapeHtml(wantToKnow)}</div>`,
        `<div style='margin:2px 0;'><b>Giờ có mẫu dự kiến:</b> ${escapeHtml(expectedText)}</div>`,
        `</div>`
    ].filter(Boolean).join('');

    const text = [
        buildPatientHeader(data, includeLocation),
        `DOB: ${data.dob} (${data.age}) - ${data.gender} - ${data.room} - ${data.bed}`,
        `Chẩn đoán: ${data.diagnosis}`,
        `Ngày PT: ${surgeryDate}`,
        `Giờ PT: ${surgeryTime}`,
        surgery.pppt ? `PPPT: ${surgery.pppt}` : '',
        `Mẫu bệnh phẩm: ${specimen}`,
        `Mong muốn biết: ${wantToKnow}`,
        `Giờ có mẫu dự kiến: ${expectedText}`
    ].filter(Boolean).join('\n') + '\n';

    return { html, text, matchedRule: rule.label || '' };
}

module.exports = {
    buildLichMoPtvCopy,
    buildGpbCatLanhCopy,
    findGpbRule,
    extractLateralityPhrase
};

},{"../BS_CAI_DAT_GPB_CAT_LANH":2,"../services/checklistService":38,"../services/reportService":41,"./htmlUtils":55,"./patientDataMapper":57}],50:[function(require,module,exports){
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
    },

    /**
     * Get today's date as dd/mm/yyyy string (used in y lệnh timestamps, tags, etc.)
     */
    getTodayStr() {
        const d = new Date();
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
};

module.exports = DateUtils;

},{}],51:[function(require,module,exports){
function pad2(value) {
    return String(value).padStart(2, '0');
}

function normalizeToDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
        const copy = new Date(value.getTime());
        if (isNaN(copy.getTime())) return null;
        copy.setHours(0, 0, 0, 0);
        return copy;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    let normalized = raw;

    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
        normalized = raw.replace(' ', 'T');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
        const [part1, part2, part3] = raw.split('/');
        const [year, time = '00:00'] = part3.split(' ');
        const num1 = parseInt(part1, 10);
        const num2 = parseInt(part2, 10);

        let day = part1;
        let month = part2;
        if (num1 <= 12 && num2 > 12) {
            month = part1;
            day = part2;
        }

        normalized = `${year}-${pad2(month)}-${pad2(day)}T${time || '00:00'}`;
    }

    const date = new Date(normalized);
    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function toISODate(value) {
    const date = normalizeToDate(value);
    if (!date) return '';
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDisplayDate(value) {
    const date = normalizeToDate(value);
    if (!date) return '';
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function getTodayISODate() {
    return toISODate(new Date());
}

function getEntryDischargeDate(entry) {
    if (!entry || typeof entry !== 'object') return '';

    const explicit = entry.expectedDischargeDate || entry.dischargeDate || entry.dischargeDateExpected;
    if (explicit) return toISODate(explicit);

    if (entry.timestamp) {
        const timestampDate = String(entry.timestamp).split(' ')[0];
        return toISODate(timestampDate);
    }

    return '';
}

function isDischargeEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    const content = String(entry.content || entry.action || '').toLowerCase();
    return content.includes('xuất viện') || (entry.q === true && entry.action === 'Xuất viện');
}

function isDischargeEntryOnDate(entry, targetDate) {
    if (!isDischargeEntry(entry)) return false;
    const entryDate = getEntryDischargeDate(entry);
    const effectiveTarget = toISODate(targetDate || new Date()) || getTodayISODate();
    return !!entryDate && entryDate === effectiveTarget;
}

function getDischargeDisplayText(entry) {
    if (!entry || !isDischargeEntry(entry)) return '';
    const plannedDate = entry.expectedDischargeDate ? formatDisplayDate(entry.expectedDischargeDate) : '';
    const timeText = entry.dischargeTime ? ` ${entry.dischargeTime}` : '';
    if (plannedDate && timeText) return `dự kiến ${plannedDate}${timeText}`;
    if (plannedDate) return `dự kiến ${plannedDate}`;
    if (timeText) return `lúc${timeText}`;
    return '';
}

module.exports = {
    formatDisplayDate,
    getDischargeDisplayText,
    getEntryDischargeDate,
    getTodayISODate,
    isDischargeEntry,
    isDischargeEntryOnDate,
    normalizeToDate,
    toISODate
};
},{}],52:[function(require,module,exports){
// domUpdaters.js - shared UI update helpers for both card and list rows

const { createYLenhTags, updateMedsDoneBadge } = require('./tagUtils');
const { addSurgeryStatusIcon, formatSurgeryInfo } = require('./surgeryUtils');
const { escapeHtml } = require('./htmlUtils');

function getPatientIdentifiers(patientOrId) {
    const ids = [];
    if (patientOrId == null) return ids;
    if (typeof patientOrId === 'object') {
        [patientOrId.mabn, patientOrId.pid, patientOrId.maBN, patientOrId.ma_benh_nhan].forEach((v) => {
            const s = v == null ? '' : String(v).trim();
            if (s && !ids.includes(s)) ids.push(s);
        });
    } else {
        const s = String(patientOrId).trim();
        if (s) ids.push(s);
    }
    return ids;
}

function findPatientElement(patientOrId) {
    const ids = getPatientIdentifiers(patientOrId);
    if (!ids.length) return null;

    for (const id of ids) {
        const direct = document.querySelector(`.dr-card[data-mabn="${id}"]`) || document.querySelector(`.dr-list-row[data-mabn="${id}"]`);
        if (direct) return direct;
    }

    const allCards = Array.from(document.querySelectorAll('.dr-card, .dr-list-row'));
    for (const card of allCards) {
        const cardId = String(card.getAttribute('data-mabn') || '').trim();
        if (cardId && ids.includes(cardId)) return card;
        const text = (card.textContent || card.innerText || '').trim();
        if (text && ids.some((id) => text.includes(id))) return card;
    }

    return null;
}

function updateHXT(patient) {
    try {
        const el = findPatientElement(patient && patient.mabn);
        if (!el) return;
        const hxtText = (patient.checklistState && patient.checklistState.huongXuTri) ? String(patient.checklistState.huongXuTri).trim() : '';
        const old = el.querySelector('.dr-hxt-block');
        if (old) old.remove();
        if (!hxtText) return;
        const div = document.createElement('div');
        div.className = 'dr-value dr-hxt-block';
        div.innerHTML = `<span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}`;
        if (el.classList.contains('dr-card')) {
            const ptInfoEl = el.querySelector('.dr-pt-info');
            const cdEl = el.querySelector('.dr-diagnosis-line');
            if (ptInfoEl) ptInfoEl.insertAdjacentElement('afterend', div);
            else if (cdEl) cdEl.insertAdjacentElement('afterend', div);
            else el.insertAdjacentElement('afterbegin', div);
        } else {
            const dxEl = el.querySelector('.dr-list-dx');
            if (dxEl) dxEl.insertAdjacentElement('afterend', div);
            else el.insertAdjacentElement('afterbegin', div);
        }
    } catch (_) {}
}

/**
 * Compose diagnosis strings consistently.
 * Returns baseText (primary diagnosis + optional ICD in parentheses)
 * and combinedHtml which appends CDKT (clamped span) when present.
 */
function composeDiagnosis(patient) {
    const icdSuffix = patient && patient.maicdvk ? ` (${String(patient.maicdvk).trim()})` : '';
    const baseText = `${(patient && patient.chandoanvk) ? patient.chandoanvk : ''}${icdSuffix}`;
    let cdktText = (patient && patient.checklistState && typeof patient.checklistState.chanDoanKemTheo === 'string')
        ? patient.checklistState.chanDoanKemTheo.trim()
        : '';
    if (cdktText) {
        cdktText = cdktText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('; ');
    }
    const combinedHtml = `${baseText}${cdktText ? '; <span class="dr-cdkt-clamp">' + escapeHtml(cdktText) + '</span>' : ''}`;
    return { baseText, cdktText, combinedHtml };
}

function updateCDKT(patient) {
    try {
        const el = findPatientElement(patient && patient.mabn);
        if (!el) return;
        const diagnosisLine = el.querySelector('.dr-diagnosis-line');
        if (!diagnosisLine) return;
        const { baseText, cdktText, combinedHtml } = composeDiagnosis(patient);
        diagnosisLine.dataset.baseCd = baseText;
        diagnosisLine.dataset.cdkt = cdktText;
        diagnosisLine.innerHTML = `<span class="dr-label">Chẩn đoán:</span> ${combinedHtml}`;
    } catch (_) {}
}

function updateTagsAndMedsBadge(containerEl, patient) {
    try {
        if (!containerEl || !patient) return;
        const existingTags = containerEl.querySelector('.ylenh-tags');
        if (existingTags) existingTags.remove();
        const tagsHtml = createYLenhTags(patient);
        if (tagsHtml) {
            let inserted = false;
            if (containerEl.classList.contains('dr-card')) {
                const btnGroup = containerEl.querySelector('.dr-action-buttons');
                if (btnGroup) { btnGroup.insertAdjacentHTML('beforebegin', tagsHtml); inserted = true; }
            }
            if (!inserted) {
                const left = containerEl.querySelector(':scope > div');
                if (left) left.insertAdjacentHTML('beforeend', tagsHtml);
                else containerEl.insertAdjacentHTML('beforeend', tagsHtml);
            }
        }
        updateMedsDoneBadge(containerEl, patient);
    } catch (_) {}
}

function updateSurgeryInfo(containerEl, patient) {
    try {
        if (!containerEl) return;
        const ptInfoContainer = containerEl.querySelector('.dr-pt-info');
        if (!ptInfoContainer) return;
        const formattedPtInfo = formatSurgeryInfo(patient);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedPtInfo;
        const inner = tempDiv.querySelector('.dr-pt-info');
        if (inner) ptInfoContainer.innerHTML = inner.innerHTML;
    } catch (_) {}
}

function updateSurgeryIcon(containerEl, patient) {
    try { addSurgeryStatusIcon(containerEl, patient); } catch (_) {}
}

module.exports = {
    updateHXT,
    updateCDKT,
    updateTagsAndMedsBadge,
    updateSurgeryInfo,
    updateSurgeryIcon,
    findPatientElement,
    composeDiagnosis,
};

},{"./htmlUtils":55,"./surgeryUtils":59,"./tagUtils":60}],53:[function(require,module,exports){
// globalFnUtils.js - Helper to call functions that may live on multiple global scopes
// (unsafeWindow, globalThis, window) without repeating the boilerplate everywhere.

/**
 * Call a named function across all known global scopes.
 * Returns true if the function was found and called successfully.
 * @param {string} fnName - Name of the global function to call
 * @param {...any} args - Arguments to pass to the function
 * @returns {boolean}
 */
function callGlobalFn(fnName, ...args) {
    const scopes = [];
    try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow) scopes.push(unsafeWindow); } catch (_) { }
    try { if (typeof globalThis !== 'undefined' && globalThis) scopes.push(globalThis); } catch (_) { }
    try { if (typeof window !== 'undefined' && window) scopes.push(window); } catch (_) { }

    for (const scope of scopes) {
        if (scope && typeof scope[fnName] === 'function') {
            try {
                scope[fnName](...args);
                return true;
            } catch (e) {
                console.warn(`callGlobalFn: error calling ${fnName}`, e);
            }
        }
    }
    return false;
}

module.exports = { callGlobalFn };

},{}],54:[function(require,module,exports){
function TaiToanBoTaiLieuHSBAV2() {
    if (window.location.hostname !== 'hsba.tahospital.vn') return;

    // Load pdf-lib for merging using the same loading pattern as PDF.js
    const getPDFLib = () => (window.PDFLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.PDFLib : undefined));
    if (!getPDFLib()) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        script.referrerPolicy = 'no-referrer';
        script.onload = () => {
            try {
                // bridge between page and userscript contexts
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow.PDFLib && !window.PDFLib) {
                    try { window.PDFLib = unsafeWindow.PDFLib; } catch(_) {}
                }
                console.log('PDF-lib loaded for HSBA download');
            } catch(_) {}
        };
        script.onerror = () => console.warn('Failed to load PDF-lib, falling back to individual downloads');
        document.head.appendChild(script);
    }

    // Listen for the existing HSBA data fetch result
    window.addEventListener('message', (event) => {
        try {
            const data = event.data;
            if (data && data.type === 'DR_HSBA_RESULT' && data.payload && data.payload.data && data.payload.data.hoSoBenhAns) {
                // Store data globally for manual trigger
                window.hsbaData = data.payload;
                console.log('HSBA data ready for manual download');
            }
        } catch (e) {
            console.error('Error processing HSBA message:', e);
        }
    });

    // Also check if data is already available (in case it was fetched before this script ran)
    if (window.__dr_hsba_result__ && window.__dr_hsba_result__.data && window.__dr_hsba_result__.data.hoSoBenhAns) {
        window.hsbaData = window.__dr_hsba_result__;
        console.log('HSBA data already available for manual download');
    }
}

function downloadAllDocuments(data) {
    if (!data || !data.data || !data.data.hoSoBenhAns || !data.data.hoSoBenhAns.items) {
        console.error('Invalid data structure for hoSoBenhAns');
        return;
    }

    const items = data.data.hoSoBenhAns.items;
    const filteredDocs = [];
    const downloadPromises = [];

    // Filter documents based on tenmau keywords
    const keywords = ['phiếu khám', 'kết quả', 'chuyên khoa', 'dị ứng', 'tiền mê', 'duyệt mổ', 'cam đoan', 'điều trị'];

    items.forEach(item => {
        if (item.hoSoChiTiet) {
            item.hoSoChiTiet.forEach(section => {
                if (section.chiTiets) {
                    section.chiTiets.forEach(doc => {
                        if (doc.tenfile && doc.tenmau && doc.ngay) {
                            // Check if tenmau contains any of the keywords (case insensitive)
                            const tenmauLower = doc.tenmau.toLowerCase();
                            const hasKeyword = keywords.some(keyword => tenmauLower.includes(keyword));
                            
                            if (hasKeyword) {
                                filteredDocs.push({
                                    ...doc,
                                    patientInfo: {
                                        hoten: item.hoten,
                                        mabn: item.mabn
                                    }
                                });
                                
                                // Prepare for downloading with proper filename
                                const fileName = `${doc.tenmau} - ${formatDate(doc.ngay)}.pdf`;
                                downloadPromises.push(downloadDocumentForMerge(doc.tenfile, fileName));
                            }
                        }
                    });
                }
            });
        }
    });

    // Wait for all downloads to complete, then process results
    Promise.allSettled(downloadPromises).then((results) => {
        const successfulDownloads = results
            .map((result, index) => ({
                result,
                doc: filteredDocs[index]
            }))
            .filter(({ result }) => result.status === 'fulfilled' && result.value);

        // Always download individual files with correct names
        successfulDownloads.forEach(({ result, doc }) => {
            const fileName = `${doc.tenmau} - ${formatDate(doc.ngay)}.pdf`;
            downloadDocumentWithCorrectName(result.value, fileName);
        });

        // Try to merge PDFs if pdf-lib is available and we have multiple files
        const getPDFLib = () => (window.PDFLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.PDFLib : undefined));
        if (successfulDownloads.length > 1 && getPDFLib()) {
            console.log(`Attempting to merge ${successfulDownloads.length} PDFs...`);
            const pdfBuffers = successfulDownloads.map(({ result }) => result.value);
            mergeAndDownloadPDFs(pdfBuffers, filteredDocs[0]?.patientInfo);
        } else if (successfulDownloads.length > 1 && !getPDFLib()) {
            console.log('PDF-lib not available, skipping merge. Only individual files downloaded.');
        } else {
            console.log(`Only ${successfulDownloads.length} file(s) found, no merging needed.`);
        }

        // Call the hide function after downloads
        if (typeof HSBAV2HideEmptySectionsIfNeeded === 'function') {
            HSBAV2HideEmptySectionsIfNeeded();
        }
    });
}

function downloadDocumentForMerge(tenfile, fileName) {
    const url = 'https://hsba.tahospital.vn/api/hosobenhan/download/base64?url=' + encodeURIComponent(tenfile);
    return fetch(url, { credentials: 'include' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to download ' + fileName);
            }
            return response.json();
        })
        .then(jsonResponse => {
            const base64String = jsonResponse.base64;
            
            // Decode base64 to binary
            const binaryString = atob(base64String);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Return the PDF buffer for merging
            return bytes.buffer;
        })
        .catch(err => {
            console.error('Error downloading document ' + fileName + ':', err);
            return null; // Return null so Promise.allSettled can handle it
        });
}

function downloadDocumentWithCorrectName(buffer, fileName) {
    try {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        URL.revokeObjectURL(blobUrl);
        
        console.log('Downloaded:', fileName);
    } catch (err) {
        console.error('Error downloading document ' + fileName + ':', err);
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString; // Return original if parsing fails
    }
}

async function mergeAndDownloadPDFs(pdfBuffers, patientInfo) {
    const getPDFLib = () => (window.PDFLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.PDFLib : undefined));
    if (!getPDFLib() || !pdfBuffers.length) {
        console.log('PDF-lib not available or no buffers to merge');
        return;
    }

    try {
        console.log(`Starting PDF merge with ${pdfBuffers.length} files...`);
        const { PDFDocument } = getPDFLib();
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < pdfBuffers.length; i++) {
            try {
                const pdf = await PDFDocument.load(pdfBuffers[i]);
                const pageCount = pdf.getPageCount();
                console.log(`Processing PDF ${i + 1}: ${pageCount} pages`);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            } catch (e) {
                console.error(`Error processing PDF ${i + 1}:`, e);
            }
        }

        const mergedPdfBytes = await mergedPdf.save();
        const totalPages = mergedPdf.getPageCount();
        console.log(`Merged PDF created with ${totalPages} total pages`);
        
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Create download link for merged PDF
        const fileName = patientInfo ? `${patientInfo.hoten}-${patientInfo.mabn}.pdf` : 'merged-hsba-documents.pdf';
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        URL.revokeObjectURL(blobUrl);
        
        console.log(`✅ Merged PDF downloaded as: ${fileName}`);
    } catch (e) {
        console.error('❌ Error merging PDFs:', e);
    }
}

// Export for require
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaiToanBoTaiLieuHSBAV2, triggerDownloadIfDataExists, downloadDocumentForMerge, downloadDocumentWithCorrectName, formatDate, mergeAndDownloadPDFs };
}

function triggerDownloadIfDataExists() {
    if (window.hsbaData) {
        downloadAllDocuments(window.hsbaData);
    } else {
        alert('Dữ liệu chưa sẵn sàng. Vui lòng tải lại trang hoặc chờ dữ liệu tải.');
    }
}
},{}],55:[function(require,module,exports){
// htmlUtils.js - HTML/text helpers

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br/>');
}

module.exports = { escapeHtml };

},{}],56:[function(require,module,exports){
// khoaUtils.js - central helpers for selected khoa id

function getSelectedKhoa(defaultValue = '551') {
    try {
        const ls = window.localStorage;
        return (ls.getItem('bsnt_khoa_dashboard') || defaultValue);
    } catch (_) {
        return defaultValue;
    }
}

module.exports = {
    getSelectedKhoa
};

},{}],57:[function(require,module,exports){
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
            maicdvk: item.maicdvk,
            kehoach: item.kehoach,
            ngayvv: item.ngayvv,
            ngayvk: item.ngayvk,
            tenkpvv: item.tenkpvv,
            tenkhoachuyen: item.tenkhoachuyen,
            makp: item.makp,
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

        // Prefer configured list in BS_CAI_DAT.whiteCardRooms when available
        try {
            const cfg = (typeof BS_CAI_DAT !== 'undefined' && BS_CAI_DAT.whiteCardRooms) || null;
            if (Array.isArray(cfg) && cfg.length > 0) {
                const target = this.formatRoom(room).toLowerCase();
                return cfg.some(r => this.formatRoom(r).toLowerCase() === target);
            }
        } catch (e) {
            // ignore and fallback to legacy pattern
        }

        // Fallback (legacy behavior)
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

},{}],58:[function(require,module,exports){
// stateSync.js - Helpers to keep in-memory state in sync across window.dr_data and window.checklistState

/**
 * Sync a new checklistState back into the matching patient object in window.dr_data.
 * Call this after any mutation to window.checklistState so cards stay up to date.
 * @param {string} mabn - Patient identifier
 * @param {object} newState - The updated checklist state object
 */
function syncPatientStateToGlobal(mabn, newState) {
    try {
        if (!window.dr_data || !mabn) return;
        const key = String(mabn || '').trim();
        const p = window.dr_data.find(p => {
            if (!p) return false;
            const candidates = [p.mabn, p.pid, p.maBN, p.ma_benh_nhan];
            for (let i = 0; i < candidates.length; i++) {
                const v = candidates[i];
                if (v != null && String(v).trim() === key) return true;
            }
            return false;
        });

        if (!p) return;

        p.checklistState = { ...newState };

        try {
            if (typeof window.updatePatientCardTags === 'function') {
                window.updatePatientCardTags(key);
            }
        } catch (_) { }

        try {
            if (typeof window.updatePatientCardPhauThuat === 'function') {
                window.updatePatientCardPhauThuat(p, p.checklistState);
            }
        } catch (_) { }

        try {
            if (typeof window.updatePatientCardHXT === 'function') {
                window.updatePatientCardHXT(p);
            }
        } catch (_) { }

        try {
            if (typeof window.updatePatientCardCDKT === 'function') {
                window.updatePatientCardCDKT(p);
            }
        } catch (_) { }

        try {
            if (typeof window.__drSyncActiveSidebarState === 'function') {
                window.__drSyncActiveSidebarState(key, p.checklistState);
            }
        } catch (_) { }
    } catch (_) { }
}

module.exports = { syncPatientStateToGlobal };

},{}],59:[function(require,module,exports){
// surgeryUtils.js - Surgery-related utility functions

/**
 * Parse surgery date and get detailed info
 * @param {string} surgeryDateStr - Surgery date string
 * @returns {object|null} - Surgery date info
 */
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

/**
 * Parse surgery date and compare with today (backward compatibility)
 * @param {string} surgeryDateStr - Surgery date string
 * @returns {string|null} - Surgery status
 */
function getSurgeryDateStatus(surgeryDateStr) {
    const info = getSurgeryDateInfo(surgeryDateStr);
    return info ? info.status : null;
}

/**
 * Add surgery status icon to card
 * @param {HTMLElement} card - Patient card element
 * @param {object} item - Patient item
 */
function addSurgeryStatusIcon(card, item) {
    // Remove existing status icon if any
    const existingIcon = card.querySelector('.dr-surgery-status-icon');
    if (existingIcon) {
        existingIcon.remove();
    }
    // Do not show icon for list view rows
    try {
        if (card && card.classList && card.classList.contains('dr-list-row')) return;
    } catch (_) {}
    
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

    // Keep the icon only for surgeries done today.
    if (surgeryInfo.status !== 'today') return;

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

    iconDiv.textContent = '⏸️';
    iconDiv.title = 'Hôm nay PT';
    
    // Add to card
    card.style.position = 'relative';
    card.appendChild(iconDiv);
}

/**
 * Format surgery info with post-op days
 * @param {object} item - Patient item
 * @returns {string} - Formatted surgery info HTML
 */
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
        const sourceLabel = ptData.source === 'otm' ? '<span style="color:#1976d2; font-weight:600;">[OTM]</span> ' : 
                           ptData.source === 'manual' ? '<span style="color:#d32f2f; font-weight:600;">[Tay]</span> ' : '';
        
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
        
        const doctorsInfo = ptData.doctors ? `<div class="dr-surgeon-line"><span class="dr-label">BS:</span> ${ptData.doctors}</div>` : '';
        ptInfo = `<div class="dr-pt-info">
            <div class="dr-value"><span class="dr-label">PPPT:</span> ${sourceLabel}${method}${postOpDisplay}</div>
            ${doctorsInfo}
            <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
        </div>`;
    } else {
        ptInfo = '<div class="dr-pt-info"></div>';
    }
    
    return ptInfo;
}

/**
 * Update patient card surgery info
 * @param {object} patient - Patient data
 * @param {object} customChecklistState - Custom checklist state
 */
function updatePatientCardPhauThuat(patient, customChecklistState = null) {
    const ids = [patient && patient.mabn, patient && patient.pid, patient && patient.maBN, patient && patient.ma_benh_nhan]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean);
    const cards = document.querySelectorAll('.dr-card, .dr-list-row');
    for (let card of cards) {
        const cardMabn = String(card.getAttribute('data-mabn') || '').trim();
        const cardTitle = card.querySelector('h2');
        const cardText = cardTitle ? cardTitle.textContent : (card.textContent || '');
        const matched = (cardMabn && ids.includes(cardMabn)) || (cardText && ids.some((id) => cardText.includes(id)));
        if (matched) {
            const checklistState = customChecklistState || window.checklistState;
            
            // Create patient object with updated checklist state for formatSurgeryInfo
            // Also ensure any existing phauThuatInfo is preserved/updated
            const patientWithState = {
                ...patient,
                checklistState: checklistState
            };
            
            // If checklistState has phauThuatLog, update patient's phauThuatInfo with latest entry
            // Sync patient's phauThuatInfo with latest entry in checklistState.phauThuatLog
            if (checklistState && checklistState.phauThuatLog) {
                if (checklistState.phauThuatLog.length > 0) {
                    const latestPT = checklistState.phauThuatLog[0];
                    patientWithState.phauThuatInfo = {
                        date: latestPT.date,
                        time: latestPT.time,
                        method: latestPT.method,
                        doctors: latestPT.doctors,
                        source: latestPT.source,
                        ngayPhauThuat: latestPT.date,
                        gioPhauThuat: latestPT.time,
                        pppt: latestPT.method
                    };
                } else {
                    // Log is empty, clear phauThuatInfo
                    patientWithState.phauThuatInfo = null;
                }
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

module.exports = {
    getSurgeryDateInfo,
    getSurgeryDateStatus,
    addSurgeryStatusIcon,
    formatSurgeryInfo,
    updatePatientCardPhauThuat
};

},{}],60:[function(require,module,exports){
// tagUtils.js
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const DateUtils = require('./dateUtils');
const { getTodayISODate, isDischargeEntryOnDate, getDischargeDisplayText, isDischargeEntry } = require('./dischargeUtils');

// Helper function to create y lệnh tags
function createYLenhTags(patient) {
    if (!patient.checklistState || !patient.checklistState.yLenhLog || !Array.isArray(patient.checklistState.yLenhLog)) {
        return '';
    }

    // Filter for today's effective discharge entries + today's non-discharge entries
    const todayStr = DateUtils.getTodayStr();
    const todayIso = getTodayISODate();

    const todayEntries = patient.checklistState.yLenhLog.filter(entry => {
        if (!entry || !entry.timestamp) return false;
        if (isDischargeEntry(entry)) return isDischargeEntryOnDate(entry, todayIso);
        return entry.timestamp.startsWith(todayStr);
    });
    // Exclude 'Đã đánh thuốc' from tags (both quick and manual entries)
    const filteredEntries = todayEntries.filter(entry => {
        const text = ((entry.action || entry.content || '') + '').trim().toLowerCase();
        return text !== 'đã đánh thuốc';
    });

    if (filteredEntries.length === 0) {
        return '';
    }

    // Show ALL entries for today (no limit)
    const displayEntries = filteredEntries;

    const tagsHtml = displayEntries.map(entry => {
        // Determine tag color based on content
        let color = '#4caf50'; // default green
        const content = (entry.content || '').toLowerCase();
        let isDischarge = false;
        let dischargeMeta = '';

        if (isDischargeEntry(entry)) {
            color = '#4caf50';
            isDischarge = true;
            dischargeMeta = getDischargeDisplayText(entry);
        }
        else if (content.includes('rút odl')) color = '#ff9800';
        else if (content.includes('sonde')) color = '#9c27b0';
        else if (content.includes('thay băng')) color = '#2196f3';

        // Quick-action state mapping
        let stateClass = '';
        let stateIcon = '📋';
        if (entry.q === true) {
            const st = entry.status || 'active';
            if (st === 'active') { stateClass = ' state-active'; stateIcon = '⏳'; }
            if (st === 'done') { stateClass = ' state-done'; stateIcon = '✔'; }
        }

        const dischargeClass = isDischarge ? ' discharge' : '';
        const classes = `ylenh-tag${dischargeClass}${stateClass}`;
        const timeText = isDischarge && dischargeMeta ? ` (${dischargeMeta})` : '';

        return `<span class="${classes}" style="background-color: rgba(${hexToRgb(color)}, 0.1); color: ${color}; border-color: rgba(${hexToRgb(color)}, 0.3);">
            <span class="icon">${stateIcon}</span>
            <span style="overflow-wrap:anywhere; word-break:break-word;">${entry.content}${timeText}</span>
        </span>`;
    }).join('');

    return `<div class="ylenh-tags">${tagsHtml}</div>`;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '76, 175, 80'; // fallback green
}

// Compute if today has a quick action 'Đã đánh thuốc' marked done
function hasMedsDoneToday(patient) {
    try {
        if (!patient || !patient.checklistState || !Array.isArray(patient.checklistState.yLenhLog)) return false;
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        return patient.checklistState.yLenhLog.some(entry => {
            if (!entry || !entry.timestamp || !entry.content) return false;
            if (!entry.timestamp.startsWith(todayStr)) return false;
            const isQuick = entry.q === true && (entry.action ? entry.action === 'Đã đánh thuốc' : entry.content === 'Đã đánh thuốc');
            const isManual = !entry.q && entry.content === 'Đã đánh thuốc';
            if (isQuick) return entry.status === 'done';
            return isManual; // if someone typed it manually, count it
        });
    } catch (_) { return false; }
}

// Add or remove the meds-done badge on a specific card element
function updateMedsDoneBadge(card, patient) {
    try {
        if (!card) return;
        const shouldShow = hasMedsDoneToday(patient);

        // List view: manage inline badge inside actions, do not use absolute badge
        if (card.classList.contains('dr-list-row')) {
            let corner = card.querySelector('.dr-badge-meds-row-corner');
            if (shouldShow) {
                if (!corner) {
                    corner = document.createElement('span');
                    corner.className = 'dr-badge-meds-row-corner';
                    corner.textContent = 'Đã đánh thuốc';
                    card.appendChild(corner);
                }
            } else if (corner) {
                corner.remove();
            }
            return;
        }

        // Card view: original absolute badge behavior
        const existed = card.querySelector('.dr-badge-meds-done');
        if (shouldShow) {
            if (!existed) {
                const badge = document.createElement('div');
                badge.className = 'dr-badge-meds-done';
                badge.textContent = 'Đã đánh thuốc';
                card.appendChild(badge);
            }
            card.classList.add('meds-done');
        } else if (existed) {
            existed.remove();
            card.classList.remove('meds-done');
        }
    } catch (_) { /* noop */ }
}

// Helper function to check for discharge tags and add xuatvienanimation class
function checkAndAddCelebrationClass(card, patient) {
    try {
        const { checkCelebrationForCard } = require('./checklistUtils');
        if (checkCelebrationForCard) {
            checkCelebrationForCard(card, patient);
        }
    } catch (e) {
        console.error('Error applying celebration class', e);
    }
}

// Global function to update patient card tags
function updatePatientCardTags(patientMabn) {
    if (!window.dr_data) {
        return;
    }

    // Find patient in data
    const patient = window.dr_data.find(p => p.mabn === patientMabn);
    if (!patient) {
        console.log('Patient not found in dr_data:', patientMabn);
        return;
    }

    // Prefer data-mabn matching on both card and list rows
    console.log('Looking for patient element (card or row) with mabn:', patientMabn);
    let targetCard = document.querySelector(`.dr-card[data-mabn="${patientMabn}"]`) || document.querySelector(`.dr-list-row[data-mabn="${patientMabn}"]`);
    if (!targetCard) {
        // Fallback: scan text in .dr-card only (legacy)
        const allCards = document.querySelectorAll('.dr-card');
        allCards.forEach((card) => {
            const cardText = card.textContent || card.innerText || '';
            if (cardText.includes(patientMabn)) targetCard = card;
        });
    }

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

    // Remove existing tags from anywhere in the element
    const existingTags = targetCard.querySelector('.ylenh-tags');
    if (existingTags) {
        existingTags.remove();
        console.log('Removed existing tags');
    }

    // Create new tags
    const tagsHtml = createYLenhTags(patient);
    if (tagsHtml) {
        // Insert tags appropriately
        let placed = false;
        const actionButtons = targetCard.querySelector('.dr-action-buttons');
        if (actionButtons) {
            actionButtons.insertAdjacentHTML('beforebegin', tagsHtml);
            placed = true;
        }
        if (!placed) {
            const left = targetCard.querySelector(':scope > div');
            if (left) left.insertAdjacentHTML('beforeend', tagsHtml);
            else targetCard.insertAdjacentHTML('beforeend', tagsHtml);
        }
        // Update dataset flags for filters (today only)
        try {
            const todayStr = DateUtils.getTodayStr();
            const todayIso = getTodayISODate();
            const log = patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog) ? patient.checklistState.yLenhLog : [];
            let hasXV = false, hasCLS = false;
            for (const e of log) {
                if (!e.timestamp || !e.content) continue;
                const c = e.content.toLowerCase();
                if (isDischargeEntry(e) && isDischargeEntryOnDate(e, todayIso)) {
                    hasXV = true;
                }
                if (e.timestamp.startsWith(todayStr) && c.includes('cận lâm sàng')) hasCLS = true;
            }
            targetCard.dataset.hasxv = hasXV ? '1' : '0';
            targetCard.dataset.hascls = hasCLS ? '1' : '0';
        } catch (_) { }
    }

    // Update discharge celebration class and meds-done badge regardless of tags presence
    checkAndAddCelebrationClass(targetCard, patient);
    updateMedsDoneBadge(targetCard, patient);
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

    const todayIso = getTodayISODate();
    return patient.checklistState.yLenhLog.some(entry => isDischargeEntryOnDate(entry, todayIso));
}

module.exports = {
    createYLenhTags,
    updatePatientCardTags,
    hexToRgb,
    hasDischargeTag,
    hasMedsDoneToday,
    updateMedsDoneBadge
};

},{"../BS_CAI_DAT_GIAO_DIEN":1,"./checklistUtils":48,"./dateUtils":50,"./dischargeUtils":51}],61:[function(require,module,exports){
/**
 * Normalizes Vietnamese text by removing diacritics/accents
 * @param {string} str - The string to normalize
 * @returns {string} - The normalized string
 */
function removeAccents(str) {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

/**
 * Detects if a string contains Vietnamese diacritics
 * @param {string} str - The string to check
 * @returns {boolean} - True if it has accents
 */
function hasAccents(str) {
    if (!str) return false;
    // Check if normalizing and then removing accents results in a different string
    const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasD = /[đĐ]/.test(str);
    return str.normalize('NFD') !== normalized || hasD;
}

module.exports = {
    removeAccents,
    hasAccents
};

},{}],62:[function(require,module,exports){
// uiUtils.js - UI utility functions

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {object} options - Options for toast
 * @param {string} options.background - Background color
 * @param {string} options.color - Text color
 * @param {number} options.duration - Duration in milliseconds
 */
function showToast(message, options = {}) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${options.background || '#4caf50'};
        color: ${options.color || '#fff'};
        padding: 12px 28px;
        border-radius: 8px;
        font-size: 1.1em;
        z-index: 1000002;
        box-shadow: 0 2px 12px rgba(76, 175, 80, 0.3);
        transition: opacity 0.3s;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, options.duration || 2000);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            textArea.remove();
            return success;
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

module.exports = {
    showToast,
    copyToClipboard
};

},{}]},{},[4]);
