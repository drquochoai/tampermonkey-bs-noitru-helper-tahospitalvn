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
                <div style="margin-bottom:8px;padding:8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;">
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                    <button onclick="removeYLenh(${index})" style="float:right;background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="clear:both;"></div>
                </div>
            `).join('');
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
        window.removeYLenh = function(index) {
            if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
                window.checklistState.yLenhLog.splice(index, 1);
                saveYLenhLog();
                renderYLenhLog(window.checklistState.yLenhLog);
            }
        };

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
                <div style="margin-bottom:8px;padding:8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;">
                    <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${entry.timestamp}</div>
                    <div style="font-weight:bold;color:#333;">${entry.content}</div>
                    <button onclick="removeYLenh(${index})" style="float:right;background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;">Xóa</button>
                    <div style="clear:both;"></div>
                </div>
            `).join('');
        }

        if (window.checklistState && window.checklistState.yLenhLog) {
            renderYLenhLog(window.checklistState.yLenhLog);
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
        
        card.innerHTML = `
            <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span> - ${item.phai === 1 ? 'Nữ' : 'Nam'} - ${formattedLocation}</h2>
            <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
            <div class="dr-value"><span class="dr-label">Chẩn đoán:</span> ${item.chandoanvk || ''}</div>
        `;
        
        // Add action buttons
        const btnGroup = createActionButtons(item);
        card.appendChild(btnGroup);
        
        // Add click handler to show sidebar
        card.onclick = () => showSidebar(item);
        
        return card;
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
