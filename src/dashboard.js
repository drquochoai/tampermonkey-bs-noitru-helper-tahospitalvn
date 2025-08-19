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

// Import utility functions
const { showToast, copyToClipboard } = require('./utils/uiUtils');
const { getSurgeryDateInfo, getSurgeryDateStatus, addSurgeryStatusIcon, formatSurgeryInfo, updatePatientCardPhauThuat } = require('./utils/surgeryUtils');
const { createChecklistItemHTML, copyYLenhText, checkCelebrationForCard, checkAllCelebrationAnimations } = require('./utils/checklistUtils');

function showDashboardBenhNhanIfNeeded() {
    if (!(/[?&](show=true|nln)($|&)/.test(window.location.search))) return;
    addGlobalStyles(); // Đảm bảo style chỉ chèn 1 lần

    // Make utility functions globally available for onclick handlers
    // Không sử dụng window để tránh lỗi undefined - sử dụng global assignment trực tiếp
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.showToast = showToast;
        unsafeWindow.copyToClipboard = copyToClipboard;
        unsafeWindow.copyYLenhText = copyYLenhText;
    unsafeWindow.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
    unsafeWindow.updatePatientCardHXT = updatePatientCardHXT;
    } else if (typeof this !== 'undefined') {
        this.showToast = showToast;
        this.copyToClipboard = copyToClipboard;
        this.copyYLenhText = copyYLenhText;
    this.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
    this.updatePatientCardHXT = updatePatientCardHXT;
    } else {
        // Fallback - tạo global functions không qua window
        globalThis.showToast = showToast;
        globalThis.copyToClipboard = copyToClipboard;
        globalThis.copyYLenhText = copyYLenhText;
    globalThis.updatePatientCardPhauThuat = updatePatientCardPhauThuat;
    globalThis.updatePatientCardHXT = updatePatientCardHXT;
    }
    
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

            /* Active state shows a processing badge (no inline tick) */
            .quick-ylenh-btn.active::after {
                content: '⏳';
                position: absolute;
                top: -6px;
                right: -6px;
                background: #1d4ed8;
                color: #fff;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .quick-ylenh-btn.active .text {
                font-weight: bold;
            }

            .quick-ylenh-btn .icon {
                font-size: 14px;
            }

            /* Discharge time editor */
            .xv-time-editor {
                display:flex; align-items:center; gap:8px;
                padding:8px 12px; margin:6px 0 0 0;
                background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px;
                width:fit-content;
            }
            .xv-time-editor .xv-label { color:#0f172a; font-weight:600; }
            .xv-time-editor .xv-time { padding:4px 6px; border:1px solid #cbd5e1; border-radius:6px; }
            .xv-time-editor .xv-saved { color:#16a34a; font-weight:600; }

            /* Trạng thái DONE - hoàn tất */
            .quick-ylenh-btn.done {
                border: 3px solid #2e7d32 !important;
                background-color: #e8f5e9;
                color: #1b5e20 !important;
                box-shadow: 0 0 10px rgba(27, 94, 32, 0.2);
                position: relative;
            }
            .quick-ylenh-btn.done::after {
                content: '✔';
                position: absolute;
                top: -6px;
                right: -6px;
                background: #2e7d32;
                color: #fff;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            /* Y lệnh tags on patient cards */
            .ylenh-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin: 8px 0 4px 0;
                overflow-wrap: anywhere;
                word-break: break-word;
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
                white-space: normal; /* allow wrapping */
                overflow-wrap: anywhere;
                word-break: break-word;
                max-width: 100%;
                flex-wrap: wrap;
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

            /* Tag states for quick actions */
            .ylenh-tag.state-active {
                background-color: rgba(37, 99, 235, 0.10);
                color: #1d4ed8;
                border-color: rgba(37, 99, 235, 0.35);
            }
            .ylenh-tag.state-done {
                background-color: rgba(34, 197, 94, 0.12);
                color: #15803d;
                border-color: rgba(34, 197, 94, 0.45);
                font-weight: 600;
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
                // Parent item with children - Special handling for "Tờ điều trị"
                if (item.label === 'Tờ điều trị') {
                    // Render as header without checkbox
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
                    // Normal parent item with checkbox
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
        
        // Make function available for reuse
        window.renderChecklistXuatVien = renderChecklistXuatVien;
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
                <div style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #1976d2;position:relative;word-break: break-word; overflow-wrap: anywhere;">
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
        
        // Sidebar action buttons (reuse card actions behavior)
        const sidebarActions = document.createElement('div');
        sidebarActions.className = 'dr-sidebar-actions';
        sidebarActions.style.cssText = `
            display: flex; justify-content: flex-end; gap: 8px; 
            margin-bottom: 12px; flex-wrap: wrap;
        `;
        sidebarActions.appendChild(createToDieuTriButton(patient));
        sidebarActions.appendChild(createHsbaButton(patient));
        leftColumn.appendChild(sidebarActions);

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
            <input id="dr-search-input" type="text" placeholder="Lọc BN theo tên, MABN, phòng, chẩn đoán..." 
                style="flex:1; min-width: 220px; padding: 8px 10px; border:1px solid #ddd; border-radius:6px;">
            <label style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                <input id="dr-filter-xuatvien" type="checkbox"> Xuất viện
            </label>
            <label style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                <input id="dr-filter-canlamsang" type="checkbox"> Cận lâm sàng
            </label>
            <label style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                <input id="dr-filter-rutodl" type="checkbox"> Rút ODL
            </label>
            <span id="dr-filter-count" style="color:#1976d2; font-weight:bold;"></span>
        `;

    const container = document.createElement('div');
        container.className = 'dr-card-list';
    // Safety padding in case styles load late
    container.style.paddingBottom = '90px';
        
        sortedData.forEach(item => {
            const card = createPatientCard(item);
            // mark useful attributes for filtering
            if (item && item.mabn) card.setAttribute('data-mabn', item.mabn);
            if (item && item.hoten) card.setAttribute('data-name', (item.hoten || '').toLowerCase());
            if (item && item.chandoanvk) card.setAttribute('data-cd', (item.chandoanvk || '').toLowerCase());
            if (item && (item.teN_PHONG || item.teN_GIUONG)) {
                const loc = PatientDataMapper.formatRoomLocation(
                    item.teN_PHONG,
                    item.teN_GIUONG,
                    item.teN_TANG,
                    item.teN_TOANHA
                );
                card.setAttribute('data-loc', (loc || '').toLowerCase());
            }
            // compute dataset flags from today's yLenhLog
            try {
                const today = new Date();
                const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
                const log = item && item.checklistState && Array.isArray(item.checklistState.yLenhLog) ? item.checklistState.yLenhLog : [];
                let hasXV = false, hasCLS = false, hasODL = false;
                for (const e of log) {
                    if (!e.timestamp || !e.content) continue;
                    if (!e.timestamp.startsWith(todayStr)) continue;
                    const c = e.content.toLowerCase();
                    if (c.includes('xuất viện')) {
                        // if quick and has status, use done/active as presence
                        if (e.q === true && e.action === 'Xuất viện') {
                            if (e.status === 'active' || e.status === 'done') hasXV = true;
                        } else {
                            hasXV = true;
                        }
                    }
                    if (c.includes('cận lâm sàng')) hasCLS = true;
                    if (c.includes('rút odl')) hasODL = true;
                }
                card.dataset.hasxv = hasXV ? '1' : '0';
                card.dataset.hascls = hasCLS ? '1' : '0';
                card.dataset.hasodl = hasODL ? '1' : '0';
            } catch (_) {}
            container.appendChild(card);
        });
        
        // Append top bar then container
        document.body.appendChild(topBar);
        document.body.appendChild(container);
        
        // Add bottom bar
        createBottomBar(sortedData.length);

        // Filter logic
        const searchInput = topBar.querySelector('#dr-search-input');
    const chkXuatVien = topBar.querySelector('#dr-filter-xuatvien');
    const chkCanLamSang = topBar.querySelector('#dr-filter-canlamsang');
    const chkRutODL = topBar.querySelector('#dr-filter-rutodl');
        const filterCount = topBar.querySelector('#dr-filter-count');

        function applyFilter() {
            const q = (searchInput.value || '').trim().toLowerCase();
            const onlyXV = !!chkXuatVien.checked;
            const onlyCLS = !!chkCanLamSang.checked;
            const onlyODL = !!chkRutODL.checked;
            let visible = 0;

            const cards = container.querySelectorAll('.dr-card');
            cards.forEach(card => {
                const txt = card.textContent.toLowerCase();
                const matchesText = q === '' || txt.includes(q) ||
                    card.getAttribute('data-mabn')?.toLowerCase().includes(q) ||
                    card.getAttribute('data-name')?.includes(q) ||
                    card.getAttribute('data-cd')?.includes(q) ||
                    card.getAttribute('data-loc')?.includes(q);
                // dataset flags prepared on card creation
                const matchesXV = !onlyXV || card.dataset.hasxv === '1' || card.classList.contains('xuatvienanimation');
                const matchesCLS = !onlyCLS || card.dataset.hascls === '1';
                const matchesODL = !onlyODL || card.dataset.hasodl === '1';
                const show = matchesText && matchesXV && matchesCLS && matchesODL;
                card.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            // Update counts in top bar and bottom bar
            filterCount.textContent = (q || onlyXV || onlyCLS || onlyODL) ? `Hiển thị: ${visible}/${sortedData.length}` : '';
            const bottomLeft = document.querySelector('.dr-bottom-bar-left');
            if (bottomLeft) {
                bottomLeft.textContent = `Tổng số bệnh nhân: ${sortedData.length}` + (q || onlyXV ? ` (lọc: ${visible})` : '');
            }
        }

        searchInput.addEventListener('input', applyFilter);
    chkXuatVien.addEventListener('change', applyFilter);
    chkCanLamSang.addEventListener('change', applyFilter);
    chkRutODL.addEventListener('change', applyFilter);

        // Prefill from query param ?q=
        try {
            const u = new URL(window.location.href);
            const qParam = u.searchParams.get('q');
            if (qParam) {
                searchInput.value = qParam;
                applyFilter();
            }
        } catch (_) {}

        const refreshPatientCards = function(newData) {
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
                    
                    // Update HXT (Hướng xử trí) line in the card
                    {
                        const hxtText = (item.checklistState && typeof item.checklistState.huongXuTri === 'string')
                            ? item.checklistState.huongXuTri.trim()
                            : '';
                        const oldHxt = card.querySelector('.dr-hxt-block');
                        if (oldHxt) oldHxt.remove();
                        if (hxtText) {
                            const div = document.createElement('div');
                            div.className = 'dr-value dr-hxt-block';
                            div.innerHTML = `<span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}`;
                            const ptInfoEl = card.querySelector('.dr-pt-info');
                            const cdEl = card.querySelector('.dr-value');
                            if (ptInfoEl) ptInfoEl.insertAdjacentElement('afterend', div);
                            else if (cdEl) cdEl.insertAdjacentElement('afterend', div);
                            else card.insertAdjacentElement('afterbegin', div);
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

                    // Re-evaluate filter visibility after updates (e.g., xuatvienanimation class changes)
                    // Delay to allow DOM/class updates done elsewhere
                    setTimeout(() => {
                        applyFilter();
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
        
    const hxtText = (item.checklistState && item.checklistState.huongXuTri) ? String(item.checklistState.huongXuTri).trim() : '';
    const hxtHtml = hxtText ? `<div class="dr-value dr-hxt-block"><span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}</div>` : '';
        card.innerHTML = `
            <h2>${item.hoten || ''} <span style="font-size:0.9em;color:#888;">${item.mabn ? ' - ' + item.mabn : ''}</span> - ${item.phai === 1 ? 'Nữ' : 'Nam'} - ${formattedLocation}</h2>
            <div class="dr-value"><span class="dr-label">Ngày sinh:</span> ${item.ngaysinh ? Utils.formatDate(item.ngaysinh) : ''} (${Utils.calculateAge(item.ngaysinh)} tuổi)</div>
            <div class="dr-value"><span class="dr-label">Chẩn đoán:</span> ${item.chandoanvk || ''}</div>
            ${ptInfo}
            ${hxtHtml}
            ${createYLenhTags(item)}
        `;
        
        // Add action buttons
        const btnGroup = createActionButtons(item);
        card.appendChild(btnGroup);
        
        // Add surgery status icon
        addSurgeryStatusIcon(card, item);
        
        card.onclick = () => showSidebar(item);
        // Preload HXT from checklist state after rendering card (non-blocking)
        setTimeout(() => {
            preloadHXTForPatient(item);
        }, 0);
        
        return card;
    }

    // Safely escape HTML for rendering user-entered HXT
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br/>');
    }

    // Update HXT on a card when sidebar saves
    function updatePatientCardHXT(patient) {
        try {
            if (!patient || !patient.mabn) return;
            // Prefer matching by data attribute for accuracy
            let targetCard = document.querySelector(`.dr-card[data-mabn="${patient.mabn}"]`);
            if (!targetCard) {
                // Fallback: text search
                const allCards = document.querySelectorAll('.dr-card');
                allCards.forEach(card => {
                    const txt = card.textContent || card.innerText || '';
                    if (txt.includes(String(patient.mabn))) targetCard = card;
                });
            }
            if (!targetCard) return;
            const hxtText = (patient.checklistState && patient.checklistState.huongXuTri) ? String(patient.checklistState.huongXuTri).trim() : '';
            // Remove previous HXT block if found by class marker
            const oldBlock = targetCard.querySelector('.dr-hxt-block');
            if (oldBlock) oldBlock.remove();
            if (hxtText) {
                const div = document.createElement('div');
                div.className = 'dr-value dr-hxt-block';
                div.innerHTML = `<span class="dr-label"><b>HXT:</b></span> ${escapeHtml(hxtText)}`;
                // Insert after ptInfo if present, else after diagnosis
                const ptInfoEl = targetCard.querySelector('.dr-pt-info');
                const cdEl = targetCard.querySelector('.dr-value');
                if (ptInfoEl) ptInfoEl.insertAdjacentElement('afterend', div);
                else if (cdEl) cdEl.insertAdjacentElement('afterend', div);
                else targetCard.insertAdjacentElement('afterbegin', div);
            }
        } catch (_) {}
    }

    // Preload HXT for a patient by fetching checklist state if not present
    async function preloadHXTForPatient(item) {
        try {
            if (!item || !item.mabn) return;
            const existing = item.checklistState && typeof item.checklistState.huongXuTri === 'string' ? item.checklistState.huongXuTri.trim() : '';
            if (existing) {
                updatePatientCardHXT(item);
                return;
            }
            const res = await ChecklistService.loadChecklistData(item);
            const obj = ChecklistService.findChecklistObject(res);
            if (!obj) return;
            const state = ChecklistService.parseChecklistState(obj) || {};
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
            updatePatientCardHXT(updated);
        } catch (e) {
            console.warn('Preload HXT failed for', item?.mabn, e);
        }
    }







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
