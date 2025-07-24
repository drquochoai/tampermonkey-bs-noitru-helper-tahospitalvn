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
