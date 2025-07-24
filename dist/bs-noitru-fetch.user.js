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
        fetch('https://bs-noitru.tahospital.vn/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
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
    fetch('https://bs-noitru.tahospital.vn/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
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
// ==UserScript==
// @name         BS Nội trú - Helper (TA Hospital) - By drquochoai, BS.CKI Trần Quốc Hoài
// @namespace    http://tampermonkey.net/
// @version      1.2.8
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

    // ĐÃ XÓA các hàm phụ trợ fetchToDieuTriData, createDirectReportGeneration, addGlobalStyles, updateChecklistPhieu, createChecklistPhieu khỏi file này vì đã chuyển sang dashboard.support.js và được import trong dashboard.js


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
},{"./DanhSachBenhNhan":1,"./dashboard":3,"./googleAppsScript":5,"./utils":6}],3:[function(require,module,exports){
// dashboard.js

const Utils = require('./utils');
const {
    createDirectReportGeneration,
    fetchToDieuTriData,
    addGlobalStyles,
    updateChecklistPhieu,
    createChecklistPhieu
} = require('./dashboard.support');

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
    function showSidebar(patient) {
        let sidebar = document.getElementById('dr-sidebar');
        let backdrop = document.getElementById('dr-sidebar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'dr-sidebar-backdrop';
            backdrop.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:99999;';
            document.body.appendChild(backdrop);
        } else {
            backdrop.style.display = 'block';
        }
        backdrop.onclick = function () {
            if (sidebar) sidebar.style.display = 'none';
            backdrop.style.display = 'none';
        };
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'dr-sidebar';
            document.body.appendChild(sidebar);
        }
        sidebar.innerHTML = '';
        sidebar.style = `position:fixed;top:0;right:0;width:400px;max-width:100vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;`;
        // Patient info form
        const info = document.createElement('div');
        info.innerHTML = `
            <h2 style="margin-top:0">${patient.hoten || ''} <span style="font-size:0.9em;color:#888;">${patient.mabn ? ' - ' + patient.mabn : ''}</span></h2>
            <div><b>Tuổi:</b> ${Utils.calculateAge(patient.ngaysinh)}</div>
            <div><b>Giới tính:</b> <span>${patient.phai === 1 ? 'Nữ' : 'Nam'}</span></div>
            <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
            <div><b>Kế hoạch điều trị:</b><br><textarea id="dr-treatment" style="width:95%;min-height:60px;resize:vertical;">${patient.kehoach || ''}</textarea></div>
        `;
        sidebar.appendChild(info);
        // After rendering the treatment plan textbox
        const drTreatment = info.querySelector('#dr-treatment');
        if (drTreatment) {
            drTreatment.addEventListener('blur', function () {
                if (window.checklistObj) {
                    window.checklistState.kehoach = drTreatment.value;
                    updateChecklistPhieu(window.checklistObj, window.checklistState, function (updateRes) {
                        if (!(updateRes && updateRes.Status == 1)) {
                            console.error('Lưu kế hoạch điều trị thất bại!');
                        }
                    });
                }
            });
        }
        // Checklist section
        const checklistDiv = document.createElement('div');
        checklistDiv.innerHTML = `<h3 style="margin-top:0">Checklist bộ mổ</h3>`;
        const checklistUl = document.createElement('ul');
        checklistUl.style = 'overflow-y:auto;padding-left:0;list-style:none;margin:0 0 16px 0;';
        function loadChecklist(retryCount = 0) {
            checklistUl.innerHTML = '<li>Đang tải checklist...</li>';
            const formData = new FormData();
            formData.append('mabn', patient.mabn + 9898);
            let admitDate = patient.ngayvv;
            let admit;
            if (admitDate && /^\d{2}\/\d{2}\/\d{4}/.test(admitDate)) {
                const [day, month, yearAndTime] = admitDate.split('/');
                const [year, time] = yearAndTime.split(' ');
                admit = `${month}/${day}/${year} ${time || '00:00'}`;
            } else {
                const now = new Date();
                const dd = String(now.getDate()).padStart(2, '0');
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const yyyy = now.getFullYear();
                admit = `${mm}/${dd}/${yyyy} 00:00`;
            }
            let tungay = admit;
            let [admitMonth, admitDay, admitYearAndTime] = tungay.split('/');
            let [admitYear, admitTime] = admitYearAndTime.split(' ');
            let tungayDate = new Date(`${admitYear}-${admitMonth}-${admitDay}T${admitTime || '00:00'}`);
            let denngayDate = new Date(tungayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            let dd = String(denngayDate.getDate()).padStart(2, '0');
            let mm = String(denngayDate.getMonth() + 1).padStart(2, '0');
            let yyyy = denngayDate.getFullYear();
            let hh = '23';
            let min = '59';
            let denngay = `${mm}/${dd}/${yyyy} ${hh}:${min}`;
            formData.append('tungay', tungay);
            formData.append('denngay', denngay);
            fetch('https://bs-noitru.tahospital.vn/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            }).then(r => r.json()).then(res => {
                checklistUl.innerHTML = '';
                if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
                    checklistUl.innerHTML = '<li>Không có dữ liệu</li>';
                    createChecklistPhieu(patient, function (newRes) {
                        if (newRes && newRes.isValid) {
                            loadChecklist(retryCount + 1);
                        } else {
                            checklistUl.innerHTML = '<li>Lỗi tạo mới checklist phiếu!</li>';
                            if (retryCount < 1) {
                                setTimeout(() => {
                                    sidebar.style.display = 'none';
                                    backdrop.style.display = 'none';
                                    setTimeout(() => {
                                        showSidebar(patient);
                                    }, 300);
                                }, 500);
                            }
                        }
                    });
                    return;
                }
                window.checklistObj = null;
                for (let i = 0; i < res.data.length; i++) {
                    if (typeof res.data[i].hoten === 'string' && res.data[i].hoten.trim().endsWith('%')) {
                        window.checklistObj = res.data[i];
                        break;
                    }
                }
                if (!window.checklistObj) {
                    createChecklistPhieu(patient, function (newRes) {
                        if (newRes && newRes.isValid) {
                            loadChecklist();
                        } else {
                            checklistUl.innerHTML = '<li>Lỗi tạo mới checklist phiếu!</li>';
                        }
                    });
                    return;
                }
                window.checklistState = {};
                if (window.checklistObj && window.checklistObj.chuky) {
                    try { window.checklistState = JSON.parse(window.checklistObj.chuky); } catch (e) { window.checklistState = {}; }
                }
                if (window.checklistState && window.checklistState.kehoach) {
                    $('#dr-treatment').val(window.checklistState.kehoach);
                }
                checklistItems.forEach((item, idx) => {
                    const li = document.createElement('li');
                    li.style = 'margin-bottom:8px;';
                    const id = 'dr-checklist-' + idx;
                    li.innerHTML = `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" ${window.checklistState[item] ? 'checked' : ''}>${item}</label>`;
                    checklistUl.appendChild(li);
                });
                setTimeout(() => {
                    checklistUl.querySelectorAll('input[type=checkbox]').forEach(cb => {
                        cb.addEventListener('change', function () {
                            window.checklistState[this.parentNode.textContent.trim()] = this.checked;
                            console.log('Checklist state updated:', window.checklistState, window.checklistObj);
                            updateChecklistPhieu(window.checklistObj, window.checklistState, function (updateRes) {
                                if (!(updateRes && updateRes.Status == 1)) {
                                    console.error('Lưu checklist thất bại!');
                                }
                            });
                        });
                    });
                }, 10);
            }).catch(() => {
                checklistUl.innerHTML = '<li>Lỗi tải checklist</li>';
            });
        }
        checklistDiv.appendChild(checklistUl);
        sidebar.appendChild(checklistDiv);
        loadChecklist();
        let closeBtn = document.createElement('button');
        closeBtn.textContent = 'Đóng';
        closeBtn.style = 'position:absolute;top:12px;right:12px;background:#eee;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;';
        closeBtn.onclick = () => {
            sidebar.style.display = 'none';
            backdrop.style.display = 'none';
        };
        sidebar.appendChild(closeBtn);
        sidebar.style.display = 'block';
        backdrop.style.display = 'block';
    }
    function renderCards(data) {
        console.log('Rendering patient cards with data:', data);
        document.body.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'dr-card-list';
        data.forEach(item => {
            const room = item.teN_PHONG || '';
            const isWhite = /^(Phòng )?(214|215|216)$/i.test(room) || /214|215|216/.test(room);
            const card = document.createElement('div');
            card.className = 'dr-card' + (isWhite ? '' : ' dr-blue');
            card.innerHTML = `
                <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span> - ${item.phai === 1 ? 'Nữ' : 'Nam'} - ${item.teN_PHONG || ''} ${item.teN_GIUONG || ''}</h2>
                <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
                <div class="dr-value"><span class="dr-label">Chẩn đoán:</span> ${item.chandoanvk || ''}</div>
            `;
            const btn = document.createElement('button');
            btn.className = 'dr-detail-btn no-print';
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-4.97 0-8.19-4.16-8.94-5C3.81 10.16 7.03 6 12 6s8.19 4.16 8.94 5c-.75.84-3.97 5-8.94 5zm0-8a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/></svg>Tờ điều trị`;
            btn.style.position = 'static';
            btn.onclick = e => {
                e.stopPropagation();
                if (item.mabn) {
                    window.open(`https://bs-noitru.tahospital.vn/to-dieu-tri?mabn=${encodeURIComponent(item.mabn)}`, '_blank');
                }
            };
            const btnHsba2 = document.createElement('button');
            btnHsba2.className = 'dr-detail-btn no-print';
            btnHsba2.style.position = 'static';
            btnHsba2.style.marginLeft = '8px';
            btnHsba2.textContent = 'HSBA V2';
            btnHsba2.onclick = function (e) {
                e.stopPropagation();
                fetch('/ToDieuTri/LoadLinkHsba', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include',
                    body: 'code=' + encodeURIComponent(item.mabn)
                })
                    .then(r => r.json())
                    .then(response => {
                        if (response && response.data && response.data.link) {
                            window.open(response.data.link, '_blank');
                        } else {
                            console.error('Không lấy được link HSBA V2');
                        }
                    })
                    .catch(() => {
                        console.error('Lỗi khi load link HSBA V2');
                    });
            };
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '8px';
            btnGroup.style.justifyContent = 'flex-end';
            btnGroup.style.alignItems = 'center';
            btnGroup.style.position = 'absolute';
            btnGroup.style.right = '16px';
            btnGroup.style.bottom = '12px';
            btnGroup.appendChild(btn);
            btnGroup.appendChild(btnHsba2);
            card.appendChild(btnGroup);
            card.onclick = () => showSidebar(item);
            container.appendChild(card);
        });
        document.body.appendChild(container);
        let bottomBar = document.createElement('div');
        bottomBar.className = 'dr-bottom-bar';
        bottomBar.innerHTML = `
            <div class="dr-bottom-bar-left">Tổng số bệnh nhân: ${data.length}</div>
            <button id="dr-btn-direct-report" class="btn btn-warning" style="font-weight:bold;">Tạo báo cáo trực</button>
        `;
        document.body.appendChild(bottomBar);
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
        setTimeout(() => {
            const btn = document.getElementById('dr-btn-direct-report');
            if (btn) btn.onclick = createDirectReportGeneration;
        }, 10);
    }
    if (window.dr_data && Array.isArray(window.dr_data) && window.dr_data.length > 0) {
        renderCards(window.dr_data);
    } else if (typeof fetchToDieuTriData === 'function') {
        fetchToDieuTriData().then(data => {
            console.log('Dữ liệu ToDieuTri đã được lấy:', data);
            let arr = Array.isArray(data) ? data : (data && data.data ? data.data : []);
            if (!arr || arr.length === 0) {
                renderCards([]);
                return;
            }
            window.dr_data = arr.map(item => ({
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
                mavaovien: item.mavaovien,
                tungay: item.tungay
            }));
            renderCards(window.dr_data);
        }).catch(() => {
            document.body.innerHTML = '';
            const loginDiv = document.createElement('div');
            loginDiv.className = 'dr-login';
            loginDiv.textContent = 'Vui lòng đăng nhập để xem dữ liệu';
            document.body.appendChild(loginDiv);
            setTimeout(() => {
                window.location.href = 'https://bs-noitru.tahospital.vn/Home/Login';
            }, 500);
        });
    } else {
        document.body.innerHTML = '';
        const loginDiv = document.createElement('div');
        loginDiv.className = 'dr-login';
        loginDiv.textContent = 'Vui lòng đăng nhập để xem dữ liệu';
        document.body.appendChild(loginDiv);
        setTimeout(() => {
            window.location.href = 'https://bs-noitru.tahospital.vn/Home/Login';
        }, 500);
    }
}

module.exports = {
    showDashboardBenhNhanIfNeeded
};

},{"./dashboard.support":4,"./utils":6}],4:[function(require,module,exports){
// dashboard.support.js

// Hàm tạo báo cáo trực và copy clipboard
async function createDirectReportGeneration() {
    let dialog = document.getElementById('dr-direct-report-dialog');
    if (dialog) dialog.remove();
    dialog = document.createElement('div');
    dialog.id = 'dr-direct-report-dialog';
    dialog.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1000001;background:rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;';
    const inner = document.createElement('div');
    inner.style = 'background:#fff;padding:32px 24px 24px 24px;max-width:700px;width:98vw;border-radius:12px;box-shadow:0 4px 32px rgba(0,0,0,0.18);position:relative;';
    let data = window.dr_data || [];
    let html = `<div style=\"font-size:1.1em;margin-bottom:12px\"><b>BÁO CÁO TRỰC</b></div>`;
    html += `<div style=\"margin-bottom:10px\">Số lượng bệnh nhân hiện có: <b>${data.length}</b></div>`;
    let report = `BÁO CÁO TRỰC\nSố lượng bệnh nhân hiện có: ${data.length}\n`;
    async function getKeHoach(mabn, ngayvv) {
        return new Promise(resolve => {
            const formData = new FormData();
            formData.append('mabn', mabn + 9898);
            let admit = '';
            if (ngayvv && /^\d{2}\/\d{2}\/\d{4}/.test(ngayvv)) {
                const [day, month, yearAndTime] = ngayvv.split('/');
                const [year, time] = yearAndTime.split(' ');
                admit = `${month}/${day}/${year} ${time || '00:00'}`;
            } else {
                const now = new Date();
                const dd = String(now.getDate()).padStart(2, '0');
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const yyyy = now.getFullYear();
                admit = `${mm}/${dd}/${yyyy} 00:00`;
            }
            formData.append('tungay', admit);
            let tungayDate = new Date(admit);
            let denngayDate = new Date(tungayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            let dd = String(denngayDate.getDate()).padStart(2, '0');
            let mm = String(denngayDate.getMonth() + 1).padStart(2, '0');
            let yyyy = denngayDate.getFullYear();
            let hh = '23';
            let min = '59';
            let denngay = `${mm}/${dd}/${yyyy} ${hh}:${min}`;
            formData.append('denngay', denngay);
            fetch('https://bs-noitru.tahospital.vn/DanhSachBenhNhan/DSPhieuCCThongTinVaCamKetNhapVien', {
                method: 'POST',
                credentials: 'include',
                body: formData
            }).then(r => r.json()).then(res => {
                let kehoach = '';
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    let obj = res.data[res.data.length - 1];
                    let state = {};
                    if (obj && obj.chuky) {
                        try { state = JSON.parse(obj.chuky); } catch (e) { state = {}; }
                    }
                    if (state && state.kehoach) kehoach = state.kehoach;
                }
                resolve(kehoach);
            }).catch(() => resolve(''));
        });
    }
    let kehoachArr = await Promise.all(data.map(bn => getKeHoach(bn.mabn, bn.ngayvv)));
    data.forEach((bn, idx) => {
        let dob = '';
        let age = '';
        if (bn.ngaysinh) {
            let d = bn.ngaysinh.split('T')[0];
            if (d.includes('-')) {
                let [y, m, day] = d.split('-');
                dob = `${day}/${m}/${y}`;
                age = (new Date().getFullYear() - parseInt(y, 10)).toString() + 't';
            } else if (d.includes('/')) {
                dob = d;
                let y = d.split('/')[2];
                age = (new Date().getFullYear() - parseInt(y, 10)).toString() + 't';
            }
        }
        const gender = bn.phai === 1 ? 'Nữ' : 'Nam';
        const kehoach = kehoachArr[idx] || '';
        html += `<div style='margin-bottom:12px'>`;
        html += `<h3 style='font-size:1em;margin:0 0 2px 0'><strong>${idx + 1}. ${bn.hoten || ''} - ${bn.mabn || ''}</strong> - ${dob} (${age}) - ${gender} - ${bn.teN_PHONG || ''} - ${bn.teN_GIUONG || ''} - </h3>`;
        html += `<div><b>Chẩn đoán</b>: ${bn.chandoanvk || ''}</div>`;
        html += `<div><b>Điều trị</b>: ${kehoach}</div>`;
        html += `</div>`;
        report += `${idx + 1}. ${bn.teN_GIUONG || ''} - ${bn.hoten || ''} - ${bn.mabn || ''} - ${dob} (${age}) - ${gender}\n`;
        report += `   Chẩn đoán: ${bn.chandoanvk || ''}\n`;
        report += `   Điều trị: ${kehoach}\n`;
    });
    inner.innerHTML = html + `<div style='margin-top:18px;display:flex;gap:12px;justify-content:flex-end;'><button id='dr-copy-direct-report' class='btn btn-primary'>Copy báo cáo</button><button id='dr-close-direct-report' class='btn btn-secondary'>Đóng</button></div>`;
    dialog.appendChild(inner);
    document.body.appendChild(dialog);
    window.copyDirectReport = function () {
        navigator.clipboard.writeText(report).then(() => {
            let toast = document.createElement('div');
            toast.innerText = 'Đã copy báo cáo trực vào clipboard!';
            toast.style = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1976d2;color:#fff;padding:12px 28px;border-radius:8px;font-size:1.1em;z-index:1000002;box-shadow:0 2px 12px rgba(25,118,210,0.15);transition:opacity 0.3s;';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 1800);
        });
    };
    document.getElementById('dr-copy-direct-report').onclick = window.copyDirectReport;
    document.getElementById('dr-close-direct-report').onclick = function () {
        dialog.remove();
    };
    dialog.onclick = function (e) { if (e.target === dialog) dialog.remove(); };
}

async function fetchToDieuTriData() {
    try {
        const formData = new FormData();
        formData.append('khoa', '551');
        formData.append('tk', '0');
        formData.append('cbAll', '1');
        const response = await fetch('https://bs-noitru.tahospital.vn/ToDieuTri/Search', {
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
        return null;
    }
}

function addGlobalStyles() {
    if (document.getElementById('dr-global-style')) return;
    const style = document.createElement('style');
    style.id = 'dr-global-style';
    style.textContent = `
        .dr-card-list { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 30px; }
        .dr-card { background: #fff; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.10); padding: 24px 20px 50px 20px; min-width: 260px; max-width: 320px; flex: 1 1 260px; display: flex; flex-direction: column; align-items: flex-start; position: relative; border: 2px solid #e3e3e3; cursor:pointer; }
        .dr-card.dr-blue { background: #e3f2fd; border: 2px solid #90caf9; }
        .dr-card h2 { margin: 0 0 8px 0; font-size: 1.2em; color: #1976d2; }
        .dr-card .dr-label { font-weight: bold; color: #333; }
        .dr-card .dr-value { margin-bottom: 6px; }
        .dr-card .dr-detail-btn { position: absolute; right: 16px; bottom: 12px; background: #1976d2; color: #fff; border: none; border-radius: 50px; padding: 6px 16px 6px 10px; font-size: 15px; cursor: pointer; display: flex; align-items: center; box-shadow: 0 2px 6px rgba(25,118,210,0.10); }
        .dr-card .dr-detail-btn svg { margin-right: 4px; }
        .dr-total { text-align: center; font-size: 1.1em; margin-top: 30px; color: #1976d2; font-weight: bold; }
        .dr-nodata, .dr-login { text-align: center; font-size: 1.2em; color: #b71c1c; margin-top: 40px; }
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
        .dr-bottom-bar-left { color: #1976d2; font-weight: bold; }
        @media (max-width: 600px) {
            .dr-bottom-bar { flex-direction: column; height: auto; padding: 8px 8px; }
            .dr-card-list { flex-direction: column; align-items: center; }
        }
        #dr-sidebar-backdrop {
            position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:99999;
        }
        #dr-sidebar {
            position:fixed;top:0;right:0;width:400px;max-width:100vw;height:100vh;background:#fff;z-index:100000;box-shadow:-2px 0 16px rgba(0,0,0,0.15);padding:32px 24px 24px 24px;overflow-y:auto;transition:right 0.2s;
        }
        @media print {
            .no-print { display: none !important; }
        }
    `;
    document.head.appendChild(style);
}

function updateChecklistPhieu(oldData, checklistState, callback) {
    const formData = new FormData();
    for (const key in oldData) {
        if (Object.prototype.hasOwnProperty.call(oldData, key)) {
            formData.append(key.toLowerCase(), oldData[key] == null ? '' : oldData[key]);
        }
    }
    formData.set('chuky', JSON.stringify(checklistState));
    fetch('https://bs-noitru.tahospital.vn/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/EditAjax', {
        method: 'POST',
        credentials: 'include',
        body: formData
    }).then(r => r.json()).then(res => {
        if (typeof callback === 'function') callback(res);
    }).catch(err => {
        console.error('Lỗi cập nhật checklist phiếu!');
        if (typeof callback === 'function') callback(null);
    });
}

function createChecklistPhieu(patient, callback) {
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
    formData.append('hoten', patient.hoten + "%" || '');
    formData.append('ngaysinh', '10/10/1999');
    formData.append('gioitinh', patient.phai === 1 ? 'Nữ' : 'Nam');
    formData.append('diachi', patient.diachi || '');
    formData.append('sdt', patient.sdt || '');
    fetch('https://bs-noitru.tahospital.vn/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/CreateAjax', {
        method: 'POST',
        credentials: 'include',
        body: formData
    }).then(r => r.json()).then(res => {
        if (typeof callback === 'function') callback(res);
    }).catch(err => {
        console.error('Lỗi tạo mới checklist phiếu!');
        if (typeof callback === 'function') callback(null);
    });
}

module.exports = {
    createDirectReportGeneration,
    fetchToDieuTriData,
    addGlobalStyles,
    updateChecklistPhieu,
    createChecklistPhieu
};

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}]},{},[2]);
