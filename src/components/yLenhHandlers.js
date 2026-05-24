// yLenhHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const { callGlobalFn } = require('../utils/globalFnUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');
const DateUtils = require('../utils/dateUtils');
const { getTodayISODate, formatDisplayDate, getDischargeDisplayText, isDischargeEntryOnDate } = require('../utils/dischargeUtils');

function setupYLenhHandlers(infoElement, patient) {
    const ctxId = (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id) || `${patient.mabn}:${Date.now()}`;
    const input = infoElement.querySelector('#dr-y-lenh-input');
    const addBtn = infoElement.querySelector('#dr-add-y-lenh');
    const logContainer = infoElement.querySelector('#dr-y-lenh-log');

    // Use configured quick y lệnh actions
    const quickYLenhActions = BS_CAI_DAT.quickYLenhActions;
    const quickYLenhActionMap = new Map(quickYLenhActions.map(action => [action.label, action]));

    function getQuickActionStatusCount(actionText) {
        const config = quickYLenhActionMap.get(actionText);
        const statusCount = Number(config && config.status);
        return statusCount === 2 ? 2 : 3;
    }

    // Load existing y lệnh when checklist is loaded
    // Priority: patient.checklistState (always populated from card open) > window.checklistState
    function loadYLenhLog() {
        const log = (patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog))
            ? patient.checklistState.yLenhLog
            : (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                ? window.checklistState.yLenhLog
                : null;
        if (log) {
            renderYLenhLog(log);
            renderDischargeLog();
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
                btn.addEventListener('click', function () {
                    const index = parseInt(this.getAttribute('data-index'));
                    removeYLenh(index);
                });
            });
        }, 10);
    }

    function getHxtTextarea() {
        return infoElement.querySelector('#dr-hxt-textarea');
    }

    function getHxtDateLineMatch(line) {
        const trimmed = String(line || '').trim();
        const match = trimmed.match(/^(\d{2}\/\d{2}\/\d{4})\s*[:\-]\s*(.+)$/);
        if (!match) return null;
        return { dateKey: match[1], body: match[2].trim() };
    }

    function splitHxtLabels(body) {
        return String(body || '')
            .replace(/[.]+$/g, '')
            .split(/\s*,\s*/)
            .map(part => part.trim())
            .filter(Boolean);
    }

    function shouldSkipHxtLabel(label) {
        const normalized = String(label || '').trim().replace(/[.]+$/g, '').toLowerCase();
        return !normalized || normalized === 'đã đánh thuốc';
    }

    function buildHxtDailySummaryMap(yLenhArray) {
        const grouped = new Map();
        if (!Array.isArray(yLenhArray) || yLenhArray.length === 0) return grouped;

        yLenhArray.forEach((entry) => {
            if (!entry || !entry.timestamp) return;
            const dateKey = String(entry.timestamp).split(' ')[0];
            if (!dateKey) return;

            const label = String(entry.content || entry.action || '').trim();
            if (!label || label.toLowerCase() === 'xuất viện' || shouldSkipHxtLabel(label)) return;
            if (entry.noAddToHxt || entry['no-add-to-hxt'] || entry.no_add_to_hxt) return;

            if (!grouped.has(dateKey)) grouped.set(dateKey, []);
            const bucket = grouped.get(dateKey);
            if (!bucket.includes(label)) bucket.push(label);
        });

        return grouped;
    }

    function mergeHxtWithYLenh(existingText, yLenhArray) {
        const grouped = buildHxtDailySummaryMap(yLenhArray);
        if (grouped.size === 0) return String(existingText || '');

        const lines = String(existingText || '').split(/\r?\n/);
        const nextLines = [];
        lines.forEach((line) => {
            const matched = getHxtDateLineMatch(line);
            if (!matched) {
                nextLines.push(line);
                return;
            }

            const labels = splitHxtLabels(matched.body);
            const autoLabels = grouped.get(matched.dateKey) || [];
            const mergedLabels = [];

            labels.concat(autoLabels).forEach((label) => {
                const cleaned = String(label || '').trim().replace(/[.]+$/g, '');
                if (!shouldSkipHxtLabel(cleaned) && !mergedLabels.includes(cleaned)) mergedLabels.push(cleaned);
            });

            grouped.delete(matched.dateKey);
            if (mergedLabels.length > 0) {
                nextLines.push(`${matched.dateKey}: ${mergedLabels.join(', ')}.`);
            }
        });

        const missingLines = Array.from(grouped.entries()).map(([dateKey, labels]) => `${dateKey}: ${labels.join(', ')}.`);
        if (missingLines.length > 0) {
            while (nextLines.length > 0 && String(nextLines[nextLines.length - 1] || '').trim() === '') {
                nextLines.pop();
            }
            if (nextLines.length > 0) nextLines.push('');
            nextLines.push(...missingLines);
        }

        while (nextLines.length > 0 && String(nextLines[0] || '').trim() === '') {
            nextLines.shift();
        }

        const compactedLines = [];
        nextLines.forEach((line) => {
            const text = String(line || '');
            if (text.trim() === '' && compactedLines.length > 0 && compactedLines[compactedLines.length - 1].trim() === '') {
                return;
            }
            compactedLines.push(text);
        });

        return compactedLines.join('\n').trimEnd();
    }

    function syncHxtFromYLenhLog() {
        const hxtTextarea = getHxtTextarea();
        if (!hxtTextarea) return;

        const yLenhArray = (patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog))
            ? patient.checklistState.yLenhLog
            : (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                ? window.checklistState.yLenhLog
                : [];

        const nextValue = mergeHxtWithYLenh(hxtTextarea.value, yLenhArray);

        if (nextValue !== hxtTextarea.value) {
            hxtTextarea.value = nextValue;
            hxtTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function getDischargeLogContainer() {
        return infoElement.querySelector('#dr-xv-log');
    }

    function getCurrentDischargeEntry() {
        return findTodayQuickEntryByAction('Xuất viện');
    }

    function ensureCurrentDischargeDefaults(entry) {
        if (!entry) return;
        if (!entry.expectedDischargeDate) entry.expectedDischargeDate = getTodayISODate();
        if (!entry.dischargeTime) entry.dischargeTime = '12:00';
    }

    function persistDischargeSchedule() {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        saveYLenhLog();
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        callGlobalFn('updatePatientCardTags', patient.mabn);
        renderDischargeLog();
    }

    function applyDischargePreset(presetDate, presetTime) {
        const { entry } = getCurrentDischargeEntry();
        if (!entry) return;

        ensureCurrentDischargeDefaults(entry);
        if (presetDate) entry.expectedDischargeDate = presetDate;
        if (presetTime) entry.dischargeTime = presetTime;
        persistDischargeSchedule();
    }

    function openDischargeCustomDialog() {
        const { entry } = getCurrentDischargeEntry();
        if (!entry) return;

        ensureCurrentDischargeDefaults(entry);
        const overlay = document.createElement('div');
        overlay.className = 'dr-xv-custom-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.38);z-index:100005;display:flex;align-items:center;justify-content:center;padding:16px;';

        const panel = document.createElement('div');
        panel.style.cssText = 'width:min(420px,100%);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(15,23,42,0.25);padding:18px;';
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:12px;">
                <div>
                    <div style="font-size:18px;font-weight:700;color:#0f172a;">Tùy chỉnh ra viện</div>
                    <div style="font-size:12px;color:#64748b;">Chọn ngày và giờ ra viện cụ thể</div>
                </div>
                <button type="button" class="dr-xv-close" style="border:none;background:#f1f5f9;color:#334155;border-radius:999px;width:32px;height:32px;cursor:pointer;">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;">
                <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#334155;">
                    <span>Ngày dự kiến</span>
                    <input class="dr-xv-custom-date" type="date" style="padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;" />
                </label>
                <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#334155;">
                    <span>Giờ ra viện</span>
                    <input class="dr-xv-custom-time" type="time" step="60" style="padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;" />
                </label>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
                <button type="button" class="dr-xv-cancel" style="padding:10px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:10px;cursor:pointer;">Hủy</button>
                <button type="button" class="dr-xv-save" style="padding:10px 14px;border:none;background:#16a34a;color:#fff;border-radius:10px;cursor:pointer;font-weight:700;">Lưu</button>
            </div>
        `;

        const dateInput = panel.querySelector('.dr-xv-custom-date');
        const timeInput = panel.querySelector('.dr-xv-custom-time');
        const closeDialog = () => overlay.remove();
        dateInput.value = entry.expectedDischargeDate || getTodayISODate();
        timeInput.value = entry.dischargeTime || '12:00';

        panel.querySelector('.dr-xv-close').addEventListener('click', closeDialog);
        panel.querySelector('.dr-xv-cancel').addEventListener('click', closeDialog);
        panel.querySelector('.dr-xv-save').addEventListener('click', () => {
            entry.expectedDischargeDate = dateInput.value || getTodayISODate();
            entry.dischargeTime = timeInput.value || '12:00';
            closeDialog();
            persistDischargeSchedule();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDialog();
        });

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    function renderDischargeLog() {
        const dischargeContainer = getDischargeLogContainer();
        if (!dischargeContainer) return;

        const { entry } = getCurrentDischargeEntry();
        if (!entry) {
            dischargeContainer.innerHTML = '<div style="color:#888;font-style:italic;">Bấm <b>Xuất viện</b> để thiết lập ngày/giờ ra viện.</div>';
            return;
        }
        ensureCurrentDischargeDefaults(entry);

        const todayDate = getTodayISODate();
        const selectedDate = entry.expectedDischargeDate || todayDate;
        const selectedTime = entry.dischargeTime || '12:00';
        const quickDates = [
            { key: 'today', label: 'Hôm nay', value: todayDate },
            { key: 'tomorrow', label: 'Ngày mai', value: (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })() }
        ];
        const quickTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

        dischargeContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;">Ngày dự kiến</div>
                        <div style="font-size:18px;font-weight:800;color:#0f172a;">${formatDisplayDate(selectedDate)}</div>
                    </div>
                    <div style="font-size:14px;color:${entry.status === 'done' ? '#166534' : '#92400e'};font-weight:700;align-self:center;">
                        ${entry.status === 'done' ? 'Đã ra viện' : 'Đang chờ'}
                    </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${quickDates.map(btn => `
                        <button type="button" class="dr-xv-date-chip ${selectedDate === btn.value ? 'is-active' : ''}" data-xv-date="${btn.value}" style="padding:8px 12px;border-radius:999px;border:1px solid ${selectedDate === btn.value ? '#16a34a' : '#cbd5e1'};background:${selectedDate === btn.value ? '#dcfce7' : '#fff'};color:${selectedDate === btn.value ? '#166534' : '#334155'};cursor:pointer;font-weight:${selectedDate === btn.value ? '700' : '600'};">${btn.label}</button>
                    `).join('')}
                    <button type="button" class="dr-xv-custom-btn" style="padding:8px 12px;border-radius:999px;border:1px solid #60a5fa;background:#eff6ff;color:#1d4ed8;cursor:pointer;font-weight:700;">Tùy chỉnh</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <span style="font-size:13px;color:#334155;font-weight:700;">Giờ ra viện</span>
                    ${quickTimes.map(time => {
                        const isActive = selectedTime === time;
                        return `<button type="button" class="dr-xv-time-chip ${isActive ? 'is-active' : ''}" data-xv-time="${time}" style="padding:8px 12px;border-radius:999px;border:1px solid ${isActive ? '#16a34a' : '#cbd5e1'};background:${isActive ? '#dcfce7' : '#fff'};color:${isActive ? '#166534' : '#334155'};cursor:pointer;font-weight:${isActive ? '700' : '600'};">${time}</button>`;
                    }).join('')}
                </div>
                <div style="padding:10px 12px;border:1px solid #dbeafe;border-radius:12px;background:#f8fbff;color:#0f172a;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;">
                    <div><strong>${entry.content}</strong></div>
                    <div style="color:#166534;font-weight:700;">Dự kiến ${formatDisplayDate(selectedDate)} ${selectedTime}</div>
                </div>
            </div>
        `;

        dischargeContainer.querySelectorAll('.dr-xv-date-chip').forEach(btn => {
            btn.addEventListener('click', () => applyDischargePreset(btn.getAttribute('data-xv-date')));
        });
        dischargeContainer.querySelectorAll('.dr-xv-time-chip').forEach(btn => {
            btn.addEventListener('click', () => applyDischargePreset(null, btn.getAttribute('data-xv-time')));
        });
        const customBtn = dischargeContainer.querySelector('.dr-xv-custom-btn');
        if (customBtn && !customBtn._bound) {
            customBtn.addEventListener('click', openDischargeCustomDialog);
            customBtn._bound = true;
        }
    }

    // Add y lệnh (enhanced với support cho quick actions)
    function addYLenh(content = null) {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
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

        // Update patient state and card tags
        if (!content) input.value = ''; // Only clear if not from quick action
        renderYLenhLog(window.checklistState.yLenhLog);
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        callGlobalFn('updatePatientCardTags', patient.mabn);
        syncHxtFromYLenhLog();

        // Also check celebration animation specifically after adding tag
        setTimeout(() => {
            if (typeof window.checkAllCelebrationAnimations === 'function') {
                const patientInData = window.dr_data && window.dr_data.find(p => p.mabn === patient.mabn);
                if (patientInData) window.checkAllCelebrationAnimations([patientInData]);
            }
        }, 100);
    }

    // Remove y lệnh
    function removeYLenh(index) {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        if (window.checklistState.yLenhLog && Array.isArray(window.checklistState.yLenhLog)) {
            window.checklistState.yLenhLog.splice(index, 1);
            saveYLenhLog();
            renderYLenhLog(window.checklistState.yLenhLog);
            syncPatientStateToGlobal(patient.mabn, window.checklistState);
            callGlobalFn('updatePatientCardTags', patient.mabn);
            syncHxtFromYLenhLog();

            // Also check celebration animation specifically after removing tag
            setTimeout(() => {
                if (typeof window.checkAllCelebrationAnimations === 'function') {
                    const patientInData = window.dr_data && window.dr_data.find(p => p.mabn === patient.mabn);
                    if (patientInData) window.checkAllCelebrationAnimations([patientInData]);
                }
            }, 100);
        }
    }

    // Save y lệnh log to server
    async function saveYLenhLog() {
        if (window.checklistObj) {
            if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
                window.__drSidebarResetAutoSyncTimer();
            }
            const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { ctxId, enqueueOnOffline: true, signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.error('Lưu log y lệnh thất bại!');
            }
        }
    }

    // Event listeners
    addBtn.addEventListener('click', () => addYLenh());
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addYLenh();
        }
    });

    // Helper: find today's quick entry by action
    function findTodayQuickEntryByAction(actionText) {
        const todayStr = DateUtils.getTodayStr();
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
        renderDischargeLog();
    }

    // Quick action buttons event listeners - Toggle logic (3-state: off -> active -> done -> off)
    infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const actionText = this.getAttribute('data-action');
            toggleQuickYLenh(actionText, this);
        });
    });

    // Function to toggle quick y lệnh (three states)
    function toggleQuickYLenh(actionText, buttonElement) {
        if (typeof window.__drSidebarResetAutoSyncTimer === 'function') {
            window.__drSidebarResetAutoSyncTimer();
        }
        const todayStr = DateUtils.getTodayStr();
        const statusCount = getQuickActionStatusCount(actionText);

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

        // Cycle states based on configured mode
        if (statusCount === 2) {
            if (existingIndex === -1) {
                const now = new Date();
                const timestamp = `${todayStr} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                const doctorName = 'BS';
                const newEntry = {
                    timestamp: `${timestamp} - ${doctorName}`,
                    content: actionText,
                    id: Date.now(),
                    q: true,
                    action: actionText,
                    status: 'done'
                };
                if (buttonElement && buttonElement.dataset && buttonElement.dataset.noAddToHxt === '1') {
                    newEntry.noAddToHxt = true;
                }
                if (actionText === 'Xuất viện') {
                    newEntry.dischargeTime = '12:00';
                    newEntry.expectedDischargeDate = getTodayISODate();
                }
                window.checklistState.yLenhLog.unshift(newEntry);
                buttonElement.classList.remove('active');
                buttonElement.classList.add('done');
                console.log('Quick action set to DONE:', actionText);
            } else {
                window.checklistState.yLenhLog.splice(existingIndex, 1);
                buttonElement.classList.remove('active');
                buttonElement.classList.remove('done');
                console.log('Quick action reset to OFF:', actionText);
            }
        } else if (existingIndex === -1) {
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
            if (buttonElement && buttonElement.dataset && buttonElement.dataset.noAddToHxt === '1') {
                newEntry.noAddToHxt = true;
            }
            // If this is 'Xuất viện', set default discharge time
            if (actionText === 'Xuất viện') {
                newEntry.dischargeTime = '12:00';
                newEntry.expectedDischargeDate = getTodayISODate();
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
        renderDischargeLog();
        syncHxtFromYLenhLog();

        // Update card tags
        syncPatientStateToGlobal(patient.mabn, window.checklistState);
        callGlobalFn('updatePatientCardTags', patient.mabn);

        // Discharge time editor + celebration animation for 'Xuất viện'
        if (actionText === 'Xuất viện') {
            // ensure time editor is visible/hidden appropriately
            ensureDischargeTimeEditor();
            renderDischargeLog();
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
    // Priority: patient.checklistState (populated from card) > window.checklistState
    function updateQuickActionButtonStates() {
        const todayStr = DateUtils.getTodayStr();
        // Source: prefer patient-scoped state so buttons show correctly on sidebar open
        // even before the async checklist API call resolves
        const yLenhLog = (patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog))
            ? patient.checklistState.yLenhLog
            : (window.checklistState && Array.isArray(window.checklistState.yLenhLog))
                ? window.checklistState.yLenhLog
                : null;

        infoElement.querySelectorAll('.quick-ylenh-btn').forEach(btn => {
            const actionText = btn.getAttribute('data-action');
            const statusCount = getQuickActionStatusCount(actionText);

            // Check if this action exists today
            let state = 'off';
            if (yLenhLog) {
                const found = yLenhLog.find(entry => {
                    const entryDate = entry.timestamp ? entry.timestamp.split(' ')[0] : '';
                    const isToday = entryDate === todayStr;
                    const sameAction = entry.action ? entry.action === actionText : entry.content === actionText;
                    return isToday && sameAction && (entry.q === true || entry.content === actionText);
                });
                if (found) {
                    state = statusCount === 2 ? 'done' : (found.status || 'active');
                }
            }
            btn.classList.toggle('active', state === 'active');
            btn.classList.toggle('done', state === 'done');
        });
    }

    // Load immediately using patient.checklistState (no waiting for async API)
    // then re-sync once window.checklistState is populated (via a short poll)
    loadYLenhLog();
    updateQuickActionButtonStates();
    ensureDischargeTimeEditor();
    renderDischargeLog();
    syncHxtFromYLenhLog();

    // Secondary poll: if patient.checklistState was empty but window.checklistState
    // arrives later (async API), refresh displays once
    let _syncPollCount = 0;
    const _syncPoll = setInterval(() => {
        _syncPollCount++;
        const wlog = window.checklistState && Array.isArray(window.checklistState.yLenhLog)
            ? window.checklistState.yLenhLog : null;
        const plog = patient && patient.checklistState && Array.isArray(patient.checklistState.yLenhLog)
            ? patient.checklistState.yLenhLog : null;
        if (wlog && wlog !== plog) {
            // window.checklistState just became available or was updated – sync into patient and refresh
            if (patient) patient.checklistState = { ...(patient.checklistState || {}), yLenhLog: wlog };
            loadYLenhLog();
            updateQuickActionButtonStates();
            ensureDischargeTimeEditor();
            syncHxtFromYLenhLog();
            clearInterval(_syncPoll);
        }
        if (_syncPollCount >= 20) clearInterval(_syncPoll); // stop after ~2s
    }, 100);

    // Store reference to removeYLenh for use in loadYLenhLogFromState
    window.currentRemoveYLenh = removeYLenh;
    window.currentRenderYLenh = renderYLenhLog;
    window.currentUpdateQuickYLenhStates = updateQuickActionButtonStates;
    window.currentEnsureDischargeTimeEditor = ensureDischargeTimeEditor;
    window.currentSyncHxtFromYLenhLog = syncHxtFromYLenhLog;

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
