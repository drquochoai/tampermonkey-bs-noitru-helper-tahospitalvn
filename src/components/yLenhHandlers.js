// yLenhHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');

function setupYLenhHandlers(infoElement, patient) {
    const ctxId = (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id) || `${patient.mabn}:${Date.now()}`;
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
            const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { ctxId, enqueueOnOffline: true, signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.error('Lưu log y lệnh thất bại!');
            }
            if (res && res.queued) {
                try { (window.showToast || console.log)("Đã lưu tạm—sẽ đồng bộ khi có mạng."); } catch(_) {}
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

    // Helper: find today's quick entry by action
    function findTodayQuickEntryByAction(actionText) {
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        if (!window.checklistState || !Array.isArray(window.checklistState.yLenhLog)) return { entry: null, index: -1 };
        const index = window.checklistState.yLenhLog.findIndex(e => {
            const entryDate = e.timestamp ? e.timestamp.split(' ')[0] : '';
            const sameAction = e.action ? e.action === actionText : e.content === actionText;
            return entryDate === todayStr && sameAction && (e.q === true || e.content === actionText);
        });
        return { entry: index >= 0 ? window.checklistState.yLenhLog[index] : null, index };
    }

    // UI: Discharge time editor (appears when 'Xuất viện' quick action is present today)
    function ensureDischargeTimeEditor() {
        const hostAfter = infoElement.querySelector('.quick-ylenh-actions');
        if (!hostAfter) return;
        const { entry } = findTodayQuickEntryByAction('Xuất viện');
        let editor = infoElement.querySelector('.xv-time-editor');
        if (!entry) {
            if (editor) editor.remove();
            return;
        }
        // ensure editor exists
        if (!editor) {
            editor = document.createElement('div');
            editor.className = 'xv-time-editor';
            editor.innerHTML = `
              <label class="xv-label">Xuất viện lúc:</label>
              <input class="xv-time xv-hour" type="number" min="0" max="23" placeholder="HH" style="width:56px;text-align:center;" />
              <span>:</span>
              <input class="xv-time xv-min" type="number" min="0" max="59" placeholder="mm" style="width:56px;text-align:center;" />
                            <div class="xv-presets" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                                <button type="button" class="xv-chip" data-time="11:00" style="padding:2px 8px;border:1px solid #ccc;border-radius:12px;background:#f7f7f7;cursor:pointer;">11:00</button>
                                <button type="button" class="xv-chip" data-time="12:00" style="padding:2px 8px;border:1px solid #ccc;border-radius:12px;background:#f7f7f7;cursor:pointer;">12:00</button>
                                <button type="button" class="xv-chip" data-time="13:00" style="padding:2px 8px;border:1px solid #ccc;border-radius:12px;background:#f7f7f7;cursor:pointer;">13:00</button>
                                <button type="button" class="xv-chip" data-time="14:00" style="padding:2px 8px;border:1px solid #ccc;border-radius:12px;background:#f7f7f7;cursor:pointer;">14:00</button>
                                <button type="button" class="xv-chip" data-time="15:00" style="padding:2px 8px;border:1px solid #ccc;border-radius:12px;background:#f7f7f7;cursor:pointer;">15:00</button>
                            </div>
              <span class="xv-saved" style="display:none;">Đã lưu</span>
            `;
            hostAfter.insertAdjacentElement('afterend', editor);
        }
        const hourInput = editor.querySelector('.xv-hour');
        const minInput = editor.querySelector('.xv-min');
                const presets = editor.querySelector('.xv-presets');
        const saved = editor.querySelector('.xv-saved');
        // default to 12:00 if missing
        if (!entry.dischargeTime) entry.dischargeTime = '12:00';
        const [hh = '12', mm = '00'] = (entry.dischargeTime || '12:00').split(':');
        if (hourInput.value !== hh) hourInput.value = hh;
        if (minInput.value !== mm) minInput.value = mm;
        // Bind change handlers once
        const commit = async () => {
            const { entry: current, index } = findTodayQuickEntryByAction('Xuất viện');
            if (current && index >= 0) {
                let h = parseInt(hourInput.value, 10);
                let m = parseInt(minInput.value, 10);
                if (isNaN(h)) h = 12; if (isNaN(m)) m = 0;
                h = Math.max(0, Math.min(23, h));
                m = Math.max(0, Math.min(59, m));
                const hh2 = String(h).padStart(2, '0');
                const mm2 = String(m).padStart(2, '0');
                current.dischargeTime = `${hh2}:${mm2}`;
                // Update dr_data patient state for tag refresh
                if (window.dr_data && patient.mabn) {
                    const patientInData = window.dr_data.find(p => p.mabn === patient.mabn);
                    if (patientInData) patientInData.checklistState = { ...window.checklistState };
                }
                await saveYLenhLog();
                if (typeof window.updatePatientCardTags === 'function') {
                    window.updatePatientCardTags(patient.mabn);
                }
                if (saved) {
                    saved.style.display = 'inline';
                    setTimeout(() => { saved.style.display = 'none'; }, 1000);
                }
            }
        };
        if (!hourInput._bound) {
            hourInput.addEventListener('change', commit);
            hourInput.addEventListener('blur', commit);
            hourInput._bound = true;
        }
        // UX: select all text in hour field when user clicks/focuses it
        if (!hourInput._selectAllBound) {
            const selectAll = (e) => {
                try {
                    // Attempt twice to handle timing quirks
                    e.target.select && e.target.select();
                    setTimeout(() => {
                        try { e.target.select && e.target.select(); } catch (_) {}
                    }, 0);
                } catch (_) { /* noop */ }
            };
            hourInput.addEventListener('focus', selectAll);
            hourInput.addEventListener('click', selectAll);
            // Prevent mouseup from clearing the selection in some browsers
            hourInput.addEventListener('mouseup', (ev) => ev.preventDefault());
            hourInput._selectAllBound = true;
        }
        if (!minInput._bound) {
            minInput.addEventListener('change', commit);
            minInput.addEventListener('blur', commit);
            minInput._bound = true;
        }
        // UX: select all text in minute field when user clicks/focuses it
        if (!minInput._selectAllBound) {
            const selectAllMin = (e) => {
                try {
                    e.target.select && e.target.select();
                    setTimeout(() => {
                        try { e.target.select && e.target.select(); } catch (_) {}
                    }, 0);
                } catch (_) { /* noop */ }
            };
            minInput.addEventListener('focus', selectAllMin);
            minInput.addEventListener('click', selectAllMin);
            minInput.addEventListener('mouseup', (ev) => ev.preventDefault());
            minInput._selectAllBound = true;
        }

        // Preset chips: quick one-tap set and save
        if (presets && !presets._bound) {
            presets.querySelectorAll('.xv-chip').forEach(chip => {
                chip.addEventListener('click', async () => {
                    const tm = chip.getAttribute('data-time') || '12:00';
                    const [hh3, mm3] = tm.split(':');
                    hourInput.value = hh3.padStart(2, '0');
                    minInput.value = mm3.padStart(2, '0');
                    await commit();
                    // brief visual press feedback
                    chip.style.transform = 'scale(0.98)';
                    setTimeout(() => { chip.style.transform = ''; }, 120);
                });
            });
            presets._bound = true;
        }
    }

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
            // If this is 'Xuất viện', set default discharge time
            if (actionText === 'Xuất viện') {
                newEntry.dischargeTime = '12:00';
            }
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

        // Discharge time editor + celebration animation for 'Xuất viện'
        if (actionText === 'Xuất viện') {
            // ensure time editor is visible/hidden appropriately
            ensureDischargeTimeEditor();
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
        // Ensure discharge editor appears if needed on load
        ensureDischargeTimeEditor();
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
