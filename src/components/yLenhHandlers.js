// yLenhHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

function setupYLenhHandlers(infoElement, patient) {
    const input = infoElement.querySelector('#dr-y-lenh-input');
    const addBtn = infoElement.querySelector('#dr-add-y-lenh');
    const logContainer = infoElement.querySelector('#dr-y-lenh-log');

    // Use configured quick y lệnh actions
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;

    // Load existing y lệnh when checklist is loaded
    function loadYLenhLog() {
        if (window.checklistState && window.checklistState.yLenhLog) {
            renderYLenhLog(window.checklistState.yLenhLog);
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
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    removeYLenh(index);
                });
            });
        }, 10);
    }

    // Add y lệnh (enhanced với support cho quick actions)
    function addYLenh(content = null) {
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

        // Clear input and re-render
        if (!content) input.value = ''; // Only clear if not from quick action
        renderYLenhLog(window.checklistState.yLenhLog);

        // Update patient object in window.dr_data with new checklistState
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...window.checklistState };
                console.log('Updated checklistState in window.dr_data for patient:', patient.mabn);
            }
        }

        // Trigger patient card update to show new tag
        if (window.updatePatientCardTags) {
            console.log('Calling updatePatientCardTags for patient:', patient.mabn);
            window.updatePatientCardTags(patient.mabn);
        }
        
        // Also check celebration animation specifically after adding tag
        setTimeout(() => {
            if (typeof window.checkAllCelebrationAnimations === 'function') {
                // Find the updated patient data
                const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                if (patientInData) {
                    window.checkAllCelebrationAnimations([patientInData]);
                }
            }
        }, 100);
    }

    // Remove y lệnh
    function removeYLenh(index) {
        if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
            window.checklistState.yLenhLog.splice(index, 1);
            saveYLenhLog();
            renderYLenhLog(window.checklistState.yLenhLog);
            
            // Update patient object in window.dr_data with new checklistState
            if (window.dr_data && patient.mabn) {
                const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                if (patientInData) {
                    patientInData.checklistState = { ...window.checklistState };
                    console.log('Updated checklistState in window.dr_data after removal for patient:', patient.mabn);
                }
            }

            // Trigger patient card update to refresh tags
            if (window.updatePatientCardTags) {
                console.log('Calling updatePatientCardTags after removal for patient:', patient.mabn);
                window.updatePatientCardTags(patient.mabn);
            }
            
            // Also check celebration animation specifically after removing tag
            setTimeout(() => {
                if (typeof window.checkAllCelebrationAnimations === 'function') {
                    // Find the updated patient data
                    const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                    if (patientInData) {
                        window.checkAllCelebrationAnimations([patientInData]);
                    }
                }
            }, 100);
        }
    }

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
    addBtn.addEventListener('click', () => addYLenh());
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addYLenh();
        }
    });

    // Quick action buttons event listeners - Toggle logic (3-state: off -> active -> done -> off)
    infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const actionText = this.getAttribute('data-action');
            toggleQuickYLenh(actionText, this);
        });
    });

    // Function to toggle quick y lệnh (three states)
    function toggleQuickYLenh(actionText, buttonElement) {
        // Today string
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
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

        // Cycle states
        if (existingIndex === -1) {
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

        // Update patient object in window.dr_data
        if (window.dr_data && patient.mabn) {
            const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
            if (patientInData) {
                patientInData.checklistState = { ...window.checklistState };
            }
        }

    // Update card tags (quick actions might render as tags; styles can reflect state)
        if (window.updatePatientCardTags) {
            window.updatePatientCardTags(patient.mabn);
        }

        // Check celebration animation for "Xuất viện"
        if (actionText === 'Xuất viện') {
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
    function updateQuickActionButtonStates() {
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
            const actionText = btn.getAttribute('data-action');
            
            // Check if this action exists today
            let state = 'off';
            if (window.checklistState && Array.isArray(window.checklistState.yLenhLog)) {
                const found = window.checklistState.yLenhLog.find(entry => {
                    const entryDate = entry.timestamp ? entry.timestamp.split(' ')[0] : '';
                    const isToday = entryDate === todayStr;
                    const sameAction = entry.action ? entry.action === actionText : entry.content === actionText;
                    return isToday && sameAction && (entry.q === true || entry.content === actionText);
                });
                if (found) state = found.status || 'active';
            }
            btn.classList.toggle('active', state === 'active');
            btn.classList.toggle('done', state === 'done');
        });
    }

    // Load existing data after a short delay to ensure checklist is loaded
    setTimeout(() => {
        loadYLenhLog();
        updateQuickActionButtonStates();
    }, 100);

    // Store reference to removeYLenh for use in loadYLenhLogFromState
    window.currentRemoveYLenh = removeYLenh;

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
