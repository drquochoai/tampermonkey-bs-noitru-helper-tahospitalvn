// ==UserScript==
// @name         BS Nội Trú Helper by BS.CKI Trần Quốc Hoài, tahospital.vn
// @namespace    http://tampermonkey.net/
// @version      1.1.3
// @description  Hỗ trợ dữ liệu bệnh nhân từ bs-noitru.tahospital.vn.
// @author       BS.CKI Trần Quốc Hoài, tahospital.vn
// @match        https://bs-noitru.tahospital.vn/*
// @match        https://dd-noitru.tahospital.vn/*
// @grant        GM_xmlhttpRequest
// @license      MIT
// @connect      google.com
// @connect      tahospital.vn
// @connect      script.google.com
// @connect      googleusercontent.com
// @connect      *
// @sandbox      MAIN_WORLD
// ==/UserScript==

(function () {
    'use strict';

    // Địa chỉ Google Apps Script API của Bác sĩ
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz48_viXo1mjhk-W2CsDbxLuFLFHyD2I7k2UchSmZROjqRC9S4hCRvbNmNOY5nP8HVBnA/exec';

    /**
     * Fetches data from the ToDieuTri/Search endpoint on bs-noitru.tahospital.vn
     * This uses standard fetch as it's an internal request within the same origin.
     * @returns {Promise<any>} The parsed response data.
     */
    async function fetchToDieuTriData() {
        try {
            const formData = new FormData();
            formData.append('khoa', '551');
            formData.append('phong', '');
            formData.append('loaibn', '');
            formData.append('mabn', '');
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
            alert('Lỗi khi lấy dữ liệu: ' + error.message);
            return null;
        }
    }

    /**
     * Uploads the patient list (window.dr_data) to Google Apps Script API endpoint
     * using GM_xmlhttpRequest to bypass CORS.
     */
    async function uploadPatientListToGoogleAppsScript() {
        if (!window.dr_data || !Array.isArray(window.dr_data) || window.dr_data.length === 0) {
            alert('Không có dữ liệu bệnh nhân để upload lên Google Apps Script!');
            return;
        }

        console.log('Đang tải dữ liệu bệnh nhân lên Google Apps Script (sử dụng GM_xmlhttpRequest để xử lý CORS)...');

        const requestBody = {
            function: 'doPost', // Tên hàm mà Bác sĩ muốn gọi trên Google Apps Script
            parameters: [window.dr_data],
            // devMode: true // Có thể bỏ nếu đã triển khai bản final
        };

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: GOOGLE_APPS_SCRIPT_URL,
                headers: {
                    'Content-Type': 'application/json'
                },
                redirects: 'follow', // Theo dõi chuyển hướng nếu có
                data: JSON.stringify(requestBody),
                onload: function (response) {
                    try {
                        console.log('Phản hồi từ Google Apps Script:', response);
                        const result = JSON.parse(response.responseText);
                        if (response.status >= 200 && response.status < 300) {
                            alert('Đã gửi danh sách bệnh nhân lên Google Apps Script thành công!');
                            console.log('Kết quả từ Google Apps Script:', result);
                            resolve(result);
                        } else {
                            alert('Lỗi khi gửi lên Google Apps Script: ' + (result.error && result.error.message ? result.error.message : `HTTP Status ${response.status}`));
                            console.error('Lỗi từ Google Apps Script:', result);
                            reject(new Error(result.error && result.error.message ? result.error.message : `HTTP Status ${response.status}`));
                        }
                    } catch (e) {
                        alert('Lỗi phân tích phản hồi từ Google Apps Script: ' + e.message);
                        console.error('Lỗi phân tích phản hồi:', e, response.responseText);
                        reject(new Error('Failed to parse response from Google Apps Script.'));
                    }
                },
                onerror: function (error) {
                    alert('Lỗi mạng khi gửi lên Google Apps Script: ' + error.statusText);
                    console.error('Lỗi mạng (GM_xmlhttpRequest):', error);
                    reject(new Error('Network error or failed to connect to Google Apps Script.'));
                },
                ontimeout: function (error) {
                    alert('Yêu cầu tới Google Apps Script bị hết thời gian: ' + error.statusText);
                    console.error('Yêu cầu hết thời gian (GM_xmlhttpRequest):', error);
                    reject(new Error('Request to Google Apps Script timed out.'));
                }
            });
        });
    }

    /**
     * Adds a styled button to the bottom left of the screen to upload patient list to Google Apps Script
     */
    function addUploadButtonToGoogleAppsScript() {
        const btn = document.createElement('button');
        btn.innerText = 'Đăng lên Google Sheet'; // Đổi tên nút để rõ ràng hơn
        btn.style.position = 'fixed';
        btn.style.left = '20px';
        btn.style.bottom = '70px'; // Đặt cao hơn nút Notion
        btn.style.background = '#4285F4'; // Google blue-like color
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

    // Show dr_data as cards if ?show=true or ?nln in URL
    function showDashboardBenhNhanIfNeeded() {
        if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
        // Helper: Calculate age from date string
        function calculateAge(dateString) {
            if (!dateString) return '';
            const birth = new Date(dateString);
            if (isNaN(birth)) return '';
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }
        // Checklist items
        const checklistItems = [
            'Phiếu khai thác tiền sử dị ứng (hsoft)',
            'Phiếu kiểm tra HIV test (hsoft)',
            'Phiếu cung cấp thông tin, chẩn đoán và điều trị. (hsoft)',
            'Phiếu Khám vào viện (hsoft)',
            '20. Biên bản hội chẩn mổ (hsoft)',
            '57. Cam kết phẫu thuật thủ thuật (hsoft)',
            'Bệnh án giấy Ngoại khoa',
            'Tờ điều trị (web)',
            'Tạo phiếu Hội chẩn duyệt mổ (web)'
        ];
        // Render sidebar for a patient
        function showSidebar(patient) {
            let sidebar = document.getElementById('dr-sidebar');
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
                <div><b>Tuổi:</b> <input id="dr-age" type="number" value="${calculateAge(patient.ngaysinh)}" style="width:60px"></div>
                <div><b>Giới tính:</b> <span>${patient.phai === 1 ? 'Nữ' : 'Nam'}</span></div>
                <div><b>Chẩn đoán:</b> <span id="dr-chandoan">${patient.chandoanvk || ''}</span></div>
                <div><b>Kế hoạch điều trị:</b> <input id="dr-treatment" type="text" value="${patient.kehoach || ''}" style="width:90%"></div>
            `;
            sidebar.appendChild(info);
            // After rendering the treatment plan textbox
            const drTreatment = info.querySelector('#dr-treatment');
            if (drTreatment) {
                drTreatment.addEventListener('blur', function() {
                    // Update checklistObj.kehoach and checklistState (if needed)
                    if (checklistObj) {
                        checklistObj.kehoach = drTreatment.value;
                        // Save checklist state and treatment plan
                        updateChecklistPhieu(checklistObj, checklistState, function(updateRes) {
                            if (!(updateRes && updateRes.Status == 1)) {
                                alert('Lưu kế hoạch điều trị thất bại!');
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
            // Load checklist from server
            function loadChecklist() {
                checklistUl.innerHTML = '<li>Đang tải checklist...</li>';
                // AJAX POST to get checklist
                const formData = new FormData();
                formData.append('mabn', patient.mabn);
                // Ngày nhập viện: lấy từ patient.ngayvv hoặc ngaysinh nếu không có
                // patient.ngayvv have the format "19/05/2025 09:18", keep it as is, format is "dd/MM/yyyy HH:mm"
                // Ngày nhập viện: lấy từ patient.ngayvv nếu có, giữ nguyên định dạng "dd/MM/yyyy HH:mm"
                let admitDate = patient.ngayvv;
                let admit;
                if (admitDate && /^\d{2}\/\d{2}\/\d{4}/.test(admitDate)) {
                    // admitDate dạng "dd/MM/yyyy HH:mm", chuyển sang "MM/dd/yyyy HH:mm"
                    const [day, month, yearAndTime] = admitDate.split('/');
                    const [year, time] = yearAndTime.split(' ');
                    admit = `${month}/${day}/${year} ${time || '00:00'}`;
                } else {
                    // Nếu không có, lấy ngày hiện tại theo định dạng "MM/dd/yyyy 00:00"
                    const now = new Date();
                    const dd = String(now.getDate()).padStart(2, '0');
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const yyyy = now.getFullYear();
                    admit = `${mm}/${dd}/${yyyy} 00:00`;
                }
                let tungay = admit;
                // Tính denngay: 30 ngày sau tungay, định dạng "MM/dd/yyyy HH:mm"
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
                        // Tạo mới checklist phiếu nếu chưa có
                        createChecklistPhieu(patient, function(newRes) {
                            if (newRes && newRes.isValid) {
                                // Sau khi tạo mới, reload lại checklist
                                loadChecklist();
                            } else {
                                checklistUl.innerHTML = '<li>Lỗi tạo mới checklist phiếu!</li>';
                            }
                        });
                        return;
                    }
                    // Find object with TEXT
                    let checklistObj = res.data[res.data.length - 1];
                    let checklistState = {};
                    if (checklistObj && checklistObj.chuky) {
                        try { checklistState = JSON.parse(checklistObj.chuky); } catch(e) { checklistState = {}; }
                    }
                    // Hiển thị lại kế hoạch điều trị nếu có trong checklistObj
                    if (checklistObj && checklistObj.kehoach && checklistUl.parentElement) {
                        const drTreatment = checklistUl.parentElement.querySelector('#dr-treatment');
                        if (drTreatment) drTreatment.value = checklistObj.kehoach;
                    }
                    checklistItems.forEach((item, idx) => {
                        const li = document.createElement('li');
                        li.style = 'margin-bottom:8px;';
                        const id = 'dr-checklist-' + idx;
                        li.innerHTML = `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" ${checklistState[item] ? 'checked' : ''}>${item}</label>`;
                        checklistUl.appendChild(li);
                    });
                    // Save checklist on change (attach after rendering)
                    // console.log('Checklist loaded:', checklistUl.querySelectorAll('input[type=checkbox]'));
                    setTimeout(() => {
                        checklistUl.querySelectorAll('input[type=checkbox]').forEach(cb => {
                            cb.addEventListener('change', function() {
                                // Update state
                                checklistState[this.parentNode.textContent.trim()] = this.checked;
                                console.log('Checklist state updated:', checklistState, checklistObj);
                                // Cập nhật checklist phiếu khi thay đổi
                                updateChecklistPhieu(checklistObj, checklistState, function(updateRes) {
                                    if (!(updateRes && updateRes.Status == 1)) {
                                        alert('Lưu checklist thất bại!');
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
            // Close button
            let closeBtn = document.createElement('button');
            closeBtn.textContent = 'Đóng';
            closeBtn.style = 'position:absolute;top:12px;right:12px;background:#eee;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;';
            closeBtn.onclick = () => { sidebar.style.display = 'none'; };
            sidebar.appendChild(closeBtn);
            sidebar.style.display = 'block';
        }
        // Render patient cards
        function renderCards(data) {
            console.log('Rendering patient cards with data:', data);
            document.body.innerHTML = '';
            const style = document.createElement('style');
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
                @media (max-width: 600px) { .dr-card-list { flex-direction: column; align-items: center; } }
            `;
            document.head.appendChild(style);
            if (!data || !Array.isArray(data) || data.length === 0) {
                // If no data, show message and redirect to login after 500ms
                const nodata = document.createElement('div');
                nodata.className = 'dr-nodata';
                nodata.textContent = 'Không có dữ liệu. Vui lòng đăng nhập để xem dữ liệu.';
                document.body.appendChild(nodata);
                setTimeout(() => {
                    window.location.href = 'https://bs-noitru.tahospital.vn/Home/Login';
                }, 500);
                return;
            }
            // Sort by room number (teN_PHONG), then by bed (teN_GIUONG)
            data.sort((a, b) => {
                const getRoom = v => {
                    if (!v || typeof v !== 'string') return 9999;
                    const m = v.match(/(\d+)/);
                    return m ? parseInt(m[1], 10) : 9999;
                };
                const getBed = v => {
                    if (!v || typeof v !== 'string') return 'Z';
                    const m = v.match(/([A-Z])/i);
                    return m ? m[1].toUpperCase() : 'Z';
                };
                const roomA = getRoom(a.teN_PHONG);
                const roomB = getRoom(b.teN_PHONG);
                if (roomA !== roomB) return roomA - roomB;
                // If same room, sort by bed letter
                return getBed(a.teN_GIUONG).localeCompare(getBed(b.teN_GIUONG));
            });
            const container = document.createElement('div');
            container.className = 'dr-card-list';
            data.forEach(item => {
                const room = item.teN_PHONG || '';
                const isWhite = /^(Phòng )?(214|215|216)$/i.test(room) || /214|215|216/.test(room);
                const card = document.createElement('div');
                card.className = 'dr-card' + (isWhite ? '' : ' dr-blue');
                card.innerHTML = `
                    <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span></h2>
                    <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? item.ngaysinh.split('T')[0] : ''} (${calculateAge(item.ngaysinh)} tuổi)</div>
                    <div class="dr-value"><span class="dr-label">Giới tính:</span> ${item.phai === 1 ? 'Nữ' : 'Nam'}</div>
                    <div class="dr-value"><span class="dr-label">Phòng - Giường:</span> ${item.teN_PHONG || ''} - ${item.teN_GIUONG || ''}</div>
                    <div class="dr-value"><span class="dr-label">Chẩn đoán:</span> ${item.chandoanvk || ''}</div>
                `;
                // Add detail button
                const btn = document.createElement('button');
                btn.className = 'dr-detail-btn';
                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-4.97 0-8.19-4.16-8.94-5C3.81 10.16 7.03 6 12 6s8.19 4.16 8.94 5c-.75.84-3.97 5-8.94 5zm0-8a3 3 0 100 6 3 3 0 000-6zm0 4a1 1 0 110-2 1 1 0 010 2z"/></svg>Tờ điều trị`;
                btn.onclick = e => {
                    e.stopPropagation();
                    if (item.mabn) {
                        window.open(`https://bs-noitru.tahospital.vn/to-dieu-tri?mabn=${encodeURIComponent(item.mabn)}`, '_blank');
                    }
                };
                card.appendChild(btn);
                // Card click: show sidebar
                card.onclick = () => showSidebar(item);
                container.appendChild(card);
            });
            document.body.appendChild(container);
            // Show bottom bar with total
            let bottomBar = document.createElement('div');
            bottomBar.className = 'dr-bottom-bar';
            bottomBar.innerHTML = `
                <div class="dr-bottom-bar-left">Tổng số bệnh nhân: ${data.length}</div>
            `;
            document.body.appendChild(bottomBar);
            // Add bottom bar CSS
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
        // If dr_data exists, show it. Otherwise, fetch and then show.
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
                    ngayvv: item.ngayvv
                }));
                renderCards(window.dr_data);
            }).catch(() => {
                // If fetch fails, show login message and redirect
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
            // If cannot fetch, show login message and redirect
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

    // Lấy dữ liệu ToDieuTri khi script được tải
    fetchToDieuTriData().then(data => {
        if (data && data.data) {
            console.log('Đã lấy dữ liệu ToDieuTri:', data);
            window.dr_data = data.data; // Lưu dữ liệu vào biến toàn cục để các hàm khác có thể truy cập
        } else {
            window.dr_data = [];
            console.warn('Không có dữ liệu bệnh nhân nào được tìm thấy hoặc định dạng dữ liệu không hợp lệ.');
        }
    }).catch(error => {
        console.error('Lỗi trong quá trình khởi tạo fetchToDieuTriData:', error);
    });

    // Xuất hàm ra window để dễ debug và gọi thủ công nếu cần
    window.fetchToDieuTriData = fetchToDieuTriData;
    window.uploadPatientListToGoogleAppsScript = uploadPatientListToGoogleAppsScript;

    // Thêm các nút upload khi trang tải xong
    // Sử dụng DOMContentLoaded để đảm bảo DOM đã sẵn sàng
    showDashboardBenhNhanIfNeeded();


    // --- Checklist AJAX helpers ---
    // 1. Create new checklist phiếu
    function createChecklistPhieu(patient, callback) {
        const formData = new FormData();
        formData.append('status', '1');
        formData.append('thebaohiemyte', patient.thebaohiemyte || 'Không');
        formData.append('chuky', '{}');
        formData.append('khu', patient.khu || '1');
        formData.append('mabn', patient.mabn);
        formData.append('bieumauid', '027');
        formData.append('makp', patient.makp || '551');
        formData.append('__model', 'TAH.Entity.Model.PHIEUCCTHONGTINVACAMKETNHAPVIEN.ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN');
        formData.append('actiontype', '');
        formData.append('hoten', patient.hoten || '');
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
            alert('Lỗi tạo mới checklist phiếu!');
            if (typeof callback === 'function') callback(null);
        });
    }
    // 2. Update checklist phiếu
    function updateChecklistPhieu(oldData, checklistState, callback) {
        const formData = new FormData();
        // Copy all old fields with lowercase keys
        for (const key in oldData) {
            if (Object.prototype.hasOwnProperty.call(oldData, key)) {
                formData.append(key.toLowerCase(), oldData[key] == null ? '' : oldData[key]);
            }
        }
        // Update the 'chuky' field (lowercase) with new checklist state
        formData.set('chuky', JSON.stringify(checklistState));
        fetch('https://bs-noitru.tahospital.vn/ERM_PHIEUCCTHONGTINVACAMKETNHAPVIEN/EditAjax', {
            method: 'POST',
            credentials: 'include',
            body: formData
        }).then(r => r.json()).then(res => {
            if (typeof callback === 'function') callback(res);
        }).catch(err => {
            alert('Lỗi cập nhật checklist phiếu!');
            if (typeof callback === 'function') callback(null);
        });
    }


})();