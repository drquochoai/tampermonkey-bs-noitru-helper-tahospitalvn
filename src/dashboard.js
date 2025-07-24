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
