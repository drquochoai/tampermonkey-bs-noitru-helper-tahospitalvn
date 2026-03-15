// components/trackingUI.js

const ApiService = require('../services/apiService');
const TrackedPatientService = require('../services/trackedPatientService');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const DialogManager = require('./dialogManager');
const cardTooltip = require('./cardTooltip');

function setupTrackingUI(topBar, mainContainer, createPatientCard) {
    const btn = topBar.querySelector('#dr-tracking-btn');
    const badge = topBar.querySelector('#dr-tracking-badge');
    if (!btn || !badge) return;

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
                    
                    const Utils = require('../utils/textUtils');
                    dummyPatients.forEach((d, index) => {
                        const cacheInfo = trackedState.cache[d.mabn] || {};
                        const name = cacheInfo.hoten || '';
                        const gender = cacheInfo.phai === 1 ? 'Nữ' : (cacheInfo.phai === 0 ? 'Nam' : '');
                        const ageStr = cacheInfo.ngaysinh ? Utils.calculateAge(cacheInfo.ngaysinh) : '';
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
                    const Utils = require('../utils/textUtils');
                    const gender = cacheInfo.phai === 1 ? 'Nữ' : 'Nam';
                    const ageStr = cacheInfo.ngaysinh ? `(${Utils.calculateAge(cacheInfo.ngaysinh)} tuổi)` : '';
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
