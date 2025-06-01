// noitru.tahospital.vn/dashboard.js
// Dashboard, sidebar, checklist, upload Google Sheet, ...
(function() {
    if (!/^(bs|dd)-noitru\.tahospital\.vn$/.test(window.location.hostname)) return;
    // Gọi addGlobalStyles nếu cần
    if (window.addGlobalStyles) window.addGlobalStyles();

    // Địa chỉ Google Apps Script API của Bác sĩ
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz48_viXo1mjhk-W2CsDbxLuFLFHyD2I7k2UchSmZROjqRC9S4hCRvbNmNOY5nP8HVBnA/exec';

    // Fetch dữ liệu ToDieuTri
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
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
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

    // Upload danh sách bệnh nhân lên Google Apps Script
    async function uploadPatientListToGoogleAppsScript() {
        if (!window.dr_data || !Array.isArray(window.dr_data) || window.dr_data.length === 0) {
            console.error('Không có dữ liệu bệnh nhân để upload lên Google Apps Script!');
            return;
        }
        console.log('Đang tải dữ liệu bệnh nhân lên Google Apps Script (sử dụng GM_xmlhttpRequest để xử lý CORS)...');
        const requestBody = {
            function: 'doPost',
            parameters: [window.dr_data],
        };
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: GOOGLE_APPS_SCRIPT_URL,
                headers: { 'Content-Type': 'application/json' },
                redirects: 'follow',
                data: JSON.stringify(requestBody),
                onload: function (response) {
                    try {
                        const result = JSON.parse(response.responseText);
                        if (response.status >= 200 && response.status < 300) {
                            console.log('Đã gửi danh sách bệnh nhân lên Google Apps Script thành công!');
                            resolve(result);
                        } else {
                            console.error('Lỗi khi gửi lên Google Apps Script:', result);
                            reject(new Error(result.error && result.error.message ? result.error.message : `HTTP Status ${response.status}`));
                        }
                    } catch (e) {
                        console.error('Lỗi phân tích phản hồi từ Google Apps Script:', e, response.responseText);
                        reject(new Error('Failed to parse response from Google Apps Script.'));
                    }
                },
                onerror: function (error) {
                    console.error('Lỗi mạng khi gửi lên Google Apps Script:', error.statusText);
                    reject(new Error('Network error or failed to connect to Google Apps Script.'));
                },
                ontimeout: function (error) {
                    console.error('Yêu cầu tới Google Apps Script bị hết thời gian:', error.statusText);
                    reject(new Error('Request to Google Apps Script timed out.'));
                }
            });
        });
    }

    // Thêm nút upload Google Sheet
    function addUploadButtonToGoogleAppsScript() {
        const btn = document.createElement('button');
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
        btn.onclick = uploadPatientListToGoogleAppsScript;
        document.body.appendChild(btn);
    }

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
        let html = `<div style="font-size:1.1em;margin-bottom:12px"><b>BÁO CÁO TRỰC</b></div>`;
        html += `<div style="margin-bottom:10px">Số lượng bệnh nhân hiện có: <b>${data.length}</b></div>`;
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
            html += `<h3 style='font-size:1em;margin:0 0 2px 0'><strong>${idx + 1}. ${bn.teN_GIUONG || ''} - ${bn.hoten || ''} - ${bn.mabn || ''}</strong> - ${dob} (${age}) - ${gender}</h3>`;
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

    // Checklist AJAX helpers
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

    // Thêm menu mở dashboard vào sidebar
    function addDashboardMenuToSidebar() {
        const nav = document.querySelector('nav.mt-2 ul.nav-sidebar');
        if (!nav) return;
        if (nav.querySelector('.bsnt-dashboard-menu')) return;
        const li = document.createElement('li');
        li.className = 'nav-item bsnt-dashboard-menu';
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.href = '/?nln';
        a.target = '_blank';
        a.innerHTML = '<i class="nav-icon fas fa-tachometer-alt"></i> <p>Mở dashboard</p>';
        a.style.background = 'gold';
        a.style.borderRadius = '12px';
        a.style.color = '#333';
        a.style.fontWeight = 'bold';
        a.onmouseover = function () { a.style.background = '#ffe066'; };
        a.onmouseout = function () { a.style.background = 'gold'; };
        li.appendChild(a);
        nav.insertBefore(li, nav.firstChild);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDashboardMenuToSidebar);
    } else {
        addDashboardMenuToSidebar();
    }

    // Hiển thị dashboard nếu cần
    function showDashboardBenhNhanIfNeeded() {
        if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
        if (window.addGlobalStyles) window.addGlobalStyles();
        // ... (Toàn bộ logic renderCards, showSidebar, checklist, ... như cũ, sử dụng window.Utils)
        // Để ngắn gọn, bạn có thể copy phần renderCards, showSidebar, checklist từ code cũ vào đây.
    }
    showDashboardBenhNhanIfNeeded();
})();
