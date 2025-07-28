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
const { createYLenhTags, updatePatientCardTags } = require('./utils/tagUtils');
const { setupPhauThuatHandlers } = require('./components/phauThuatHandlers');

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
        
        // Patient info form (using refactored module)
        const info = createPatientInfoSection(patient, quickYLenhActions);
        sidebar.appendChild(info);
        
        // Setup phẫu thuật handlers for the info section
        setupPhauThuatHandlers(info, patient);
        
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
                    // Update surgery info if available
                    if (item.phauThuatInfo) {
                        const ptInfoContainer = card.querySelector('.dr-pt-info');
                        if (ptInfoContainer) {
                            const ptData = item.phauThuatInfo;
                            
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
                            
                            ptInfoContainer.innerHTML = `
                                <div class="dr-value"><span class="dr-label">PPPT:</span> ${method}</div>
                                <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
                            `;
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
                }
            });
        };
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
            ptInfo = '<div class="dr-pt-info"></div>';
        }
        
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
                
                // Get latest surgery info from checklistState
                let ptInfo = '';
                if (checklistState && checklistState.phauThuatLog && checklistState.phauThuatLog.length > 0) {
                    const latestPT = checklistState.phauThuatLog[0]; // Latest is first
                    console.log('Latest surgery found:', latestPT);
                    const dateTime = latestPT.date && latestPT.time ? 
                        `${latestPT.date} ${latestPT.time}` : 
                        (latestPT.date || '');
                    
                    ptInfo = `
                        <div class="dr-value"><span class="dr-label">PPPT:</span> ${latestPT.method || ''}</div>
                        <div class="dr-value"><span class="dr-label">Ngày PT:</span> ${dateTime}</div>
                    `;
                    console.log('Generated ptInfo HTML:', ptInfo);
                } else {
                    console.log('No surgery data found for patient:', patient.mabn);
                    console.log('checklistState details:', {
                        exists: !!checklistState,
                        hasPhauThuatLog: checklistState && !!checklistState.phauThuatLog,
                        logLength: checklistState && checklistState.phauThuatLog ? checklistState.phauThuatLog.length : 'N/A'
                    });
                }

                // Find existing surgery info container and update
                const existingPTContainer = card.querySelector('.dr-pt-info');
                if (existingPTContainer) {
                    console.log('PT container found, current content:', existingPTContainer.innerHTML);
                    existingPTContainer.innerHTML = ptInfo;
                    console.log('Updated PT container with new content:', ptInfo);
                    console.log('PT container content after update:', existingPTContainer.innerHTML);
                } else {
                    console.log('PT container not found for patient:', patient.mabn);
                }
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
