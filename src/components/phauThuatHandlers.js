// phauThuatHandlers.js
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = require('../BS_CAI_DAT_GIAO_DIEN');
const { updatePatientCardPhauThuat } = require('../utils/surgeryUtils');
const { callGlobalFn } = require('../utils/globalFnUtils');
const { syncPatientStateToGlobal } = require('../utils/stateSync');

function createDoctorCheckboxes(className) {
    return BS_CAI_DAT.danhSachBacSi.map(doctor =>
        `<div style="position:relative; margin-bottom: 4px;">
            <label style="display:flex; align-items:center; gap:4px; cursor:pointer; width:100%;">
                <input type="checkbox" class="${className}" value="${doctor}">
                <span class="dr-doctor-name">${doctor}</span>
                <span class="dr-pt-role-badge" data-doctor="${doctor}" style="margin-left:auto; font-size:10px; padding:2px 6px; border-radius:10px; color:white; font-weight:bold; display:none; background:#1976d2; white-space:nowrap;"></span>
            </label>
        </div>`
    ).join('');
}

function setupPhauThuatHandlers(infoElement, patient) {
    const showFormBtn = infoElement.querySelector('#dr-show-pt-form');
    const logContainer = infoElement.querySelector('#dr-pt-log');

    function createPhauThuatPopup(editIndex = null) {
        // Check if popup already exists
        const existingPopup = document.getElementById('dr-pt-popup-backdrop');
        if (existingPopup) {
            console.log('Popup already exists, skipping creation');
            return;
        }

        const backdrop = document.createElement('div');
        backdrop.id = 'dr-pt-popup-backdrop';
        backdrop.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 100001;
            display: flex; align-items: center; justify-content: center;
        `;

        const popup = document.createElement('div');
        popup.id = 'dr-pt-popup';
        popup.style.cssText = `
            background: white; border-radius: 8px; padding: 24px;
            max-width: 500px; width: 90vw; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        popup.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 16px;">${editIndex !== null ? 'Sửa thông tin phẫu thuật' : 'Thêm thông tin phẫu thuật'}</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <div>
                    <label style="font-size:0.9em;color:#666;">Ngày PT:</label>
                    <input type="text" id="dr-pt-date-popup" placeholder="dd/mm/yyyy" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.9em;color:#666;">Giờ PT:</label>
                    <div style="display:flex;gap:4px;align-items:center;">
                        <input type="number" id="dr-pt-hour-popup" min="0" max="23" placeholder="HH" style="width:50px;padding:6px;border:1px solid #ddd;border-radius:4px;text-align:center;" />
                        <span style="font-weight:bold;">:</span>
                        <input type="number" id="dr-pt-minute-popup" min="0" max="59" step="5" placeholder="MM" style="width:50px;padding:6px;border:1px solid #ddd;border-radius:4px;text-align:center;" />
                        <small style="margin-left:8px;color:#888;">(24h)</small>
                    </div>
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:0.9em;color:#666;">Phương pháp phẫu thuật (PPPT):</label>
                <input type="text" id="dr-pt-method-popup" placeholder="Nhập PPPT" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="font-size:0.9em;color:#666;margin-bottom:6px;display:block;">Bác sĩ thực hiện (theo thứ tự chọn):</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;margin-bottom:8px;">
                    ${createDoctorCheckboxes('dr-pt-doctor-popup')}
                </div>
                <div>
                    <label style="font-size:0.9em;color:#666;">Bác sĩ khác:</label>
                    <input type="text" id="dr-pt-other-doctor-popup" placeholder="Tên BS khác (cách nhau bằng dấu phẩy)" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;">
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="dr-cancel-pt" style="background:#666;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Hủy</button>
                <button id="dr-save-pt" style="background:${BS_CAI_DAT.colors.primary};color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">Lưu</button>
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        const originalClosePopup = function () {
            document.body.removeChild(backdrop);
            document.documentElement.lang = originalLang || 'vi';
        };

        const dateInput = popup.querySelector('#dr-pt-date-popup');
        const hourInput = popup.querySelector('#dr-pt-hour-popup');
        const minuteInput = popup.querySelector('#dr-pt-minute-popup');
        const methodInput = popup.querySelector('#dr-pt-method-popup');
        const doctorCheckboxes = popup.querySelectorAll('.dr-pt-doctor-popup');
        const otherDoctorInput = popup.querySelector('#dr-pt-other-doctor-popup');
        const saveBtn = popup.querySelector('#dr-save-pt');
        const cancelBtn = popup.querySelector('#dr-cancel-pt');

        let selectedDoctorsOrder = [];

        function updateDoctorBadges() {
            // Clear all badges first
            popup.querySelectorAll('.dr-pt-role-badge').forEach(badge => {
                badge.style.display = 'none';
                badge.textContent = '';
            });

            // Update badges based on order
            selectedDoctorsOrder.forEach((doctor, idx) => {
                const badge = popup.querySelector(`.dr-pt-role-badge[data-doctor="${doctor}"]`);
                if (badge) {
                    badge.style.display = 'inline-block';
                    if (idx === 0) {
                        badge.textContent = 'PTV chính';
                        badge.style.background = '#d32f2f'; // Red for main
                    } else {
                        badge.textContent = `Phụ ${idx}`;
                        badge.style.background = '#1976d2'; // Blue for assistants
                    }
                }
            });
        }

        // Track selection order
        doctorCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    if (!selectedDoctorsOrder.includes(this.value)) {
                        selectedDoctorsOrder.push(this.value);
                    }
                } else {
                    selectedDoctorsOrder = selectedDoctorsOrder.filter(d => d !== this.value);
                }
                updateDoctorBadges();
                tryAutoSave();
            });
        });

        otherDoctorInput.addEventListener('blur', tryAutoSave);

        hourInput.addEventListener('input', function () {
            let value = parseInt(this.value);
            if (value > 23) this.value = 23;
            if (value < 0) this.value = 0;
            if (this.value.length === 2) {
                minuteInput.focus();
                minuteInput.select();
            }
        });

        hourInput.addEventListener('focus', function () {
            this.select();
        });

        minuteInput.addEventListener('input', function () {
            let value = parseInt(this.value);
            if (value > 59) this.value = 59;
            if (value < 0) this.value = 0;
        });

        minuteInput.addEventListener('focus', function () {
            this.select();
        });

        minuteInput.addEventListener('blur', function () {
            if (this.value && this.value.length === 1) {
                this.value = '0' + this.value;
            }
            tryAutoSave();
        });

        hourInput.addEventListener('blur', function () {
            if (this.value && this.value.length === 1) {
                this.value = '0' + this.value;
            }
            tryAutoSave();
        });

        // ── Auto-save on blur ──────────────────────────────────────────────────────
        // Validates and saves the current popup form values silently when user
        // leaves any of the key fields (date, hour, minute, method).
        // Only runs in EDIT mode (editIndex !== null) when there is already a record.
        function tryAutoSave() {
            const date = dateInput.value.trim();
            const hour = hourInput.value.trim();
            const minute = minuteInput.value.trim();
            const method = methodInput.value.trim();

            // Need at least date + time + method to auto-save
            if (!date || !hour || !minute || !method) return;

            const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            if (!dateRegex.test(date)) return;

            const h = parseInt(hour, 10);
            const m = parseInt(minute, 10);
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return;

            const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');

            let combinedDoctors = [...selectedDoctorsOrder];
            const otherVal = otherDoctorInput.value.trim();
            if (otherVal) {
                const others = otherVal.split(',').map(s => s.trim()).filter(s => !!s);
                others.forEach(o => {
                    if (!combinedDoctors.includes(o)) combinedDoctors.push(o);
                });
            }

            if (combinedDoctors.length === 0) return;

            if (!window.checklistState.phauThuatLog) {
                window.checklistState.phauThuatLog = [];
            }

            const newEntry = {
                date,
                time,
                method,
                doctors: combinedDoctors.join(', '),
                id: (editIndex !== null && window.checklistState.phauThuatLog[editIndex] && window.checklistState.phauThuatLog[editIndex].id)
                    ? window.checklistState.phauThuatLog[editIndex].id
                    : Date.now(),
                source: 'manual' // Tag as manual entry
            };

            if (editIndex !== null && window.checklistState.phauThuatLog[editIndex]) {
                window.checklistState.phauThuatLog[editIndex] = newEntry;
            } else if (editIndex === null) {
                // For new entry mode, update the first slot tentatively (will be finalised on Save)
                return;
            } else {
                return;
            }

            syncPatientStateToGlobal(patient.mabn, window.checklistState);

            // Persist and update card silently
            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuatLocal(patient);

            // Brief visual flash on the popup itself
            try {
                const prev = popup.style.boxShadow;
                popup.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.5)';
                setTimeout(() => { popup.style.boxShadow = prev || ''; }, 500);
            } catch (_) { }
        }

        // Wire auto-save to blur on key fields
        dateInput.addEventListener('blur', tryAutoSave);
        methodInput.addEventListener('blur', tryAutoSave);

        const config = BS_CAI_DAT.phauThuatDefaults;

        // Load existing data for edit mode
        if (editIndex !== null && window.checklistState.phauThuatLog && window.checklistState.phauThuatLog[editIndex]) {
            const editData = window.checklistState.phauThuatLog[editIndex];
            dateInput.value = editData.date || '';
            methodInput.value = editData.method || '';

            // Parse time
            if (editData.time) {
                const [hour, minute] = editData.time.split(':');
                hourInput.value = hour;
                minuteInput.value = minute;
            }

            // Set doctors and maintain order
            if (editData.doctors) {
                const doctorList = editData.doctors.split(', ').map(s => s.trim());
                const predefined = BS_CAI_DAT.danhSachBacSi;
                const others = [];

                doctorList.forEach(doc => {
                    if (predefined.includes(doc)) {
                        selectedDoctorsOrder.push(doc);
                        doctorCheckboxes.forEach(cb => {
                            if (cb.value === doc) cb.checked = true;
                        });
                    } else {
                        others.push(doc);
                    }
                });

                if (others.length > 0) {
                    otherDoctorInput.value = others.join(', ');
                }
                updateDoctorBadges();
            }
        } else {
            // Set defaults for new entry
            if (config.defaultDate === 'tomorrow') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = String(tomorrow.getDate()).padStart(2, '0') + '/' +
                    String(tomorrow.getMonth() + 1).padStart(2, '0') + '/' +
                    tomorrow.getFullYear();
                dateInput.value = tomorrowStr;
            } else if (config.defaultDate === 'today') {
                const today = new Date();
                const todayStr = String(today.getDate()).padStart(2, '0') + '/' +
                    String(today.getMonth() + 1).padStart(2, '0') + '/' +
                    today.getFullYear();
                dateInput.value = todayStr;
            }

            if (config.defaultTime) {
                const [defaultHour, defaultMinute] = config.defaultTime.split(':');
                hourInput.value = defaultHour;
                minuteInput.value = defaultMinute;
            }
        }

        function closePopup() {
            originalClosePopup();
        }

        function savePhauThuat() {
            const date = dateInput.value.trim();
            const hour = hourInput.value.trim();
            const minute = minuteInput.value.trim();
            const method = methodInput.value.trim();

            let time = '';
            if (hour && minute) {
                const h = parseInt(hour, 10);
                const m = parseInt(minute, 10);

                if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                    time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                } else {
                    alert('Thời gian không hợp lệ. Giờ: 0-23, Phút: 0-59');
                    return;
                }
            } else if (hour || minute) {
                alert('Vui lòng nhập đầy đủ giờ và phút');
                return;
            }

            if (!date || !time || !method) {
                alert(BS_CAI_DAT.validation.messages.missingPhauThuatInfo);
                return;
            }

            const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const dateMatch = date.match(dateRegex);
            if (!dateMatch) {
                alert(BS_CAI_DAT.validation.messages.invalidDateFormat);
                return;
            }

            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);

            if (month < 1 || month > 12) {
                alert(BS_CAI_DAT.validation.messages.invalidMonth);
                return;
            }
            if (day < 1 || day > 31) {
                alert(BS_CAI_DAT.validation.messages.invalidDay);
                return;
            }

            const dateObj = new Date(year, month - 1, day);
            if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
                alert(BS_CAI_DAT.validation.messages.invalidDate);
                return;
            }

            let combinedDoctors = [...selectedDoctorsOrder];
            const otherVal = otherDoctorInput.value.trim();
            if (otherVal) {
                const others = otherVal.split(',').map(s => s.trim()).filter(s => !!s);
                others.forEach(o => {
                    if (!combinedDoctors.includes(o)) combinedDoctors.push(o);
                });
            }

            if (combinedDoctors.length === 0) {
                alert(BS_CAI_DAT.validation.messages.noDoctorSelected);
                return;
            }

            if (!window.checklistState.phauThuatLog) {
                window.checklistState.phauThuatLog = [];
            }

            const newEntry = {
                date: date,
                time: time,
                method: method,
                doctors: combinedDoctors.join(', '),
                id: Date.now(),
                source: 'manual' // Tag as manual entry
            };

            if (editIndex !== null) {
                // Update existing entry
                window.checklistState.phauThuatLog[editIndex] = newEntry;
            } else {
                // Add new entry at the beginning
                window.checklistState.phauThuatLog.unshift(newEntry);
            }

            syncPatientStateToGlobal(patient.mabn, window.checklistState);

            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuatLocal(patient);
            closePopup();
        }

        saveBtn.addEventListener('click', savePhauThuat);
        cancelBtn.addEventListener('click', closePopup);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) {
                closePopup();
            }
        });
    }

    function loadPhauThuatLog() {
        const log = (patient && patient.checklistState && Array.isArray(patient.checklistState.phauThuatLog))
            ? patient.checklistState.phauThuatLog
            : (window.checklistState && Array.isArray(window.checklistState.phauThuatLog))
                ? window.checklistState.phauThuatLog
                : null;
        if (log) {
            renderPhauThuatLog(log);
        }
    }

    function renderPhauThuatLog(phauThuatArray) {
        if (!Array.isArray(phauThuatArray) || phauThuatArray.length === 0) {
            logContainer.innerHTML = '<div style="color:#888;font-style:italic;">Chưa có phẫu thuật nào...</div>';
            return;
        }

        logContainer.innerHTML = phauThuatArray.map((entry, index) => {
            const sourceMarker = entry.source === 'otm' 
                ? '<span style="color:#1976d2; font-size:0.8em; margin-left:8px;">[OTM]</span>' 
                : '<span style="color:#d32f2f; font-size:0.8em; margin-left:8px;">[Tay]</span>';
            
            return `
            <div class="pt-entry-clickable" data-index="${index}" style="margin-bottom:8px;padding:8px 40px 8px 8px;background:#fff;border-radius:4px;border-left:3px solid #4caf50;position:relative;cursor:pointer;transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='#f5f5f5'" onmouseout="this.style.backgroundColor='#fff'">
                <button class="remove-pt-btn" data-index="${index}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:2px 6px;font-size:0.8em;cursor:pointer;z-index:1;">Xóa</button>
                <div style="font-size:0.9em;color:#666;margin-bottom:4px;"><strong>Ngày PT:</strong> ${entry.date} ${entry.time}${sourceMarker}</div>
                <div style="font-weight:bold;color:#333;margin-bottom:2px;"><strong>PPPT:</strong> ${entry.method}</div>
                <div id="dr-bs-PTV-${index}" data-field-id="dr-bs-PTV" style="font-size:0.85em;color:#555;"><strong>BS:</strong> ${entry.doctors}</div>
            </div>
            `;
        }).join('');

        setTimeout(() => {
            logContainer.querySelectorAll('.remove-pt-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const index = parseInt(this.getAttribute('data-index'));
                    removePhauThuat(index);
                });
            });

            logContainer.querySelectorAll('.pt-entry-clickable').forEach(entry => {
                entry.addEventListener('click', function (e) {
                    if (e.target.classList.contains('remove-pt-btn')) return;
                    const index = parseInt(this.getAttribute('data-index'));
                    editPhauThuat(index);
                });
            });
        }, 10);
    }

    function editPhauThuat(index) {
        console.log('Edit phẫu thuật:', index);
        createPhauThuatPopup(index);
    }

    function removePhauThuat(index) {
        if (window.checklistState.phauThuatLog && Array.isArray(window.checklistState.phauThuatLog)) {
            window.checklistState.phauThuatLog.splice(index, 1);
            syncPatientStateToGlobal(patient.mabn, window.checklistState);
            savePhauThuatLog();
            renderPhauThuatLog(window.checklistState.phauThuatLog);
            updatePatientCardPhauThuatLocal(patient);
        }
    }

    async function savePhauThuatLog() {
        if (window.checklistObj) {
            const res = await ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) });
            if (!res || (!res.ok && !res.queued)) {
                console.error('Lưu log phẫu thuật thất bại!');
            }
        }
    }

    function updatePatientCardPhauThuatLocal(patient) {
        try {
            // Prefer the patient object from window.dr_data to ensure card updaters operate on canonical data
            let patientInData = null;
            if (window.dr_data && Array.isArray(window.dr_data)) {
                patientInData = window.dr_data.find(p => (p && (p.mabn === patient.mabn || p.pid === patient.mabn || p.mabn === patient.pid)));
            }
            const target = patientInData || patient;
            updatePatientCardPhauThuat(target);
            callGlobalFn('updatePatientCardPhauThuat', target);
        } catch (e) {
            try { updatePatientCardPhauThuat(patient); callGlobalFn('updatePatientCardPhauThuat', patient); } catch (_) {}
        }
    }

    showFormBtn.addEventListener('click', () => createPhauThuatPopup(null));

    // Initial load: immediate from patient state or window state
    loadPhauThuatLog();

    // Sync poll: if patient.checklistState was empty or window.checklistState arrives later, refresh
    let _syncPollCount = 0;
    const _syncPoll = setInterval(() => {
        _syncPollCount++;
        const wlog = window.checklistState && Array.isArray(window.checklistState.phauThuatLog)
            ? window.checklistState.phauThuatLog : null;
        const plog = patient && patient.checklistState && Array.isArray(patient.checklistState.phauThuatLog)
            ? patient.checklistState.phauThuatLog : null;

        if (wlog && wlog !== plog) {
            if (patient) patient.checklistState = { ...(patient.checklistState || {}), phauThuatLog: wlog };
            loadPhauThuatLog();
            clearInterval(_syncPoll);
        }
        if (_syncPollCount >= 20) clearInterval(_syncPoll); // Stop after ~2s
    }, 100);

    window.currentRemovePhauThuat = removePhauThuat;
    window.currentRenderPhauThuatLog = renderPhauThuatLog;
    window.currentEditPhauThuat = editPhauThuat;
}

module.exports = { setupPhauThuatHandlers };
