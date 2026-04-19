const ApiService = require('../services/apiService');

function ensureMarkup(container) {
    if (!container) return;
    if (container.dataset.userInfoMounted === '1') return;

    container.innerHTML = `
        <h3 style="margin:0 0 4px;font-size:1em;color:#111827;">Thông tin người dùng</h3>
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Cấu hình khoa làm việc và danh sách khoa/phòng được phép truy cập. Dữ liệu lưu cloud theo bác sĩ đang đăng nhập.</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
            <button id="dr-ui-refresh-dept" style="appearance:none;border:1px solid #cbd5e1;background:#fff;padding:7px 12px;border-radius:8px;cursor:pointer;color:#334155;font-size:13px;">Tải lại danh sách khoa/phòng</button>
            <span id="dr-ui-dept-status" style="font-size:12px;color:#64748b;"></span>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:12px;background:#fafafa;">
            <div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:6px;">Khoa làm việc của bạn</div>
            <select id="dr-ui-working-khoa" style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;background:#fff;">
                <option value="">-- Chọn khoa/phòng --</option>
            </select>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fff;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <div style="font-size:13px;font-weight:600;color:#1f2937;">Khoa/phòng muốn truy cập</div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button id="dr-ui-select-all" style="appearance:none;border:1px solid #d1d5db;background:#fff;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:12px;color:#334155;">Chọn tất cả</button>
                    <button id="dr-ui-clear-all" style="appearance:none;border:1px solid #fecaca;background:#fff1f2;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:12px;color:#be123c;">Bỏ chọn tất cả</button>
                </div>
            </div>
            <div id="dr-ui-access-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;max-height:320px;overflow:auto;"></div>
        </div>
    `;

    container.dataset.userInfoMounted = '1';
}

function readAccessibleIds(userInfo) {
    const ids = Array.isArray(userInfo && userInfo.accessibleKhoaIds)
        ? userInfo.accessibleKhoaIds
        : (Array.isArray(userInfo && userInfo.accessibleKhoa)
            ? userInfo.accessibleKhoa.map((it) => it && it.id)
            : []);

    return new Set(
        ids
            .map((id) => String(id || '').trim())
            .filter(Boolean)
    );
}

function toList(items) {
    return Array.isArray(items) ? items : [];
}

async function withTimeout(promise, ms, message) {
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message || 'Timeout')), ms);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

async function mountUserInfoSettingsTab(opts) {
    const {
        container,
        getSettings,
        setSettings,
        scheduleAutoSave
    } = opts || {};

    if (!container || typeof getSettings !== 'function' || typeof setSettings !== 'function') {
        return null;
    }

    ensureMarkup(container);

    const workingSelect = container.querySelector('#dr-ui-working-khoa');
    const accessList = container.querySelector('#dr-ui-access-list');
    const statusEl = container.querySelector('#dr-ui-dept-status');
    const refreshBtn = container.querySelector('#dr-ui-refresh-dept');
    const selectAllBtn = container.querySelector('#dr-ui-select-all');
    const clearAllBtn = container.querySelector('#dr-ui-clear-all');

    let allKhoa = [];
    let activeKhoa = [];
    let workingKhoaId = '';
    let accessibleKhoaIds = new Set();

    function ensureWorkingAlwaysAccessible() {
        if (!workingKhoaId) return;
        accessibleKhoaIds.add(String(workingKhoaId));
    }

    function emitRealtimeUserInfo(nextSettings) {
        try {
            const userInfo = (nextSettings && nextSettings.userInfo) || {};
            const detail = {
                userInfo,
                ts: Date.now()
            };
            window.dispatchEvent(new CustomEvent('dr-user-info-updated', { detail }));
            localStorage.setItem('dr_user_info_sync', JSON.stringify(detail));
        } catch (_) {}
    }

    function pullStateFromSettings() {
        const settings = getSettings() || {};
        const userInfo = settings.userInfo || {};
        workingKhoaId = String(userInfo.workingKhoaId || userInfo.defaultKhoaId || '').trim();
        accessibleKhoaIds = readAccessibleIds(userInfo);
        ensureWorkingAlwaysAccessible();
    }

    function pushStateToSettings(shouldSave) {
        const settings = getSettings() || {};
        ensureWorkingAlwaysAccessible();
        const matchedWorking = toList(allKhoa).find((k) => String(k.id) === String(workingKhoaId));
        const activeLookup = new Map(toList(activeKhoa).map((k) => [String(k.id), k.name || '']));

        const next = {
            ...settings,
            userInfo: {
                ...(settings.userInfo || {}),
                workingKhoaId: String(workingKhoaId || ''),
                workingKhoaName: (matchedWorking && matchedWorking.name) || '',
                accessibleKhoaIds: Array.from(accessibleKhoaIds),
                accessibleKhoa: Array.from(accessibleKhoaIds).map((id) => ({
                    id,
                    name: activeLookup.get(id) || ''
                }))
            }
        };

        setSettings(next);
        if (shouldSave) emitRealtimeUserInfo(next);
        if (shouldSave && typeof scheduleAutoSave === 'function') scheduleAutoSave();
    }

    function renderWorkingKhoa() {
        if (!workingSelect) return;
        workingSelect.innerHTML = '<option value="">-- Chọn khoa/phòng --</option>';

        toList(allKhoa).forEach((k) => {
            const opt = document.createElement('option');
            opt.value = String(k.id || '');
            opt.textContent = `${k.name || 'Khoa'} (${k.id || ''})`;
            workingSelect.appendChild(opt);
        });

        if (!workingKhoaId && allKhoa.length) {
            let preferred = '';
            try {
                preferred = String(localStorage.getItem('bsnt_khoa_dashboard') || '').trim();
            } catch (_) {}
            const preferredExists = allKhoa.some((k) => String(k.id) === preferred);
            workingKhoaId = preferredExists ? preferred : String(allKhoa[0].id || '');
        }

        if (workingKhoaId) {
            workingSelect.value = workingKhoaId;
            if (workingSelect.value !== workingKhoaId && allKhoa.length) {
                workingKhoaId = String(allKhoa[0].id || '');
                workingSelect.value = workingKhoaId;
            }
        }

        ensureWorkingAlwaysAccessible();
    }

    function renderAccessibleKhoa() {
        if (!accessList) return;
        if (!toList(activeKhoa).length) {
            accessList.innerHTML = '<div style="font-size:12px;color:#6b7280;font-style:italic;">Chưa có khoa/phòng đang có bệnh nhân.</div>';
            return;
        }

        accessList.innerHTML = '';
        toList(activeKhoa).forEach((dept) => {
            const deptId = String(dept.id || '');
            const isWorking = deptId === String(workingKhoaId || '');
            const checked = isWorking || accessibleKhoaIds.has(deptId);
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:8px;padding:7px 9px;background:#fff;cursor:pointer;';
            label.innerHTML = `
                <input type="checkbox" class="dr-ui-access-item" value="${deptId}" ${checked ? 'checked' : ''} ${isWorking ? 'disabled' : ''} style="margin:0;">
                <span style="font-size:12px;color:#1f2937;line-height:1.35;">${dept.name || 'Khoa'} <span style="color:#64748b;">(${dept.id || ''})</span>${dept.patientCount ? ` <span style="color:#16a34a;">- ${dept.patientCount} BN</span>` : ''}${isWorking ? ' <span style="color:#2563eb;">- Khoa làm việc</span>' : ''}</span>
            `;
            accessList.appendChild(label);
        });
    }

    async function loadWorkingKhoaList() {
        const list = await ApiService.fetchKhoaPhong();
        allKhoa = toList(list).map((k) => ({
            id: String((k && k.id) || ''),
            name: String((k && k.name) || '')
        })).filter((k) => k.id);
        renderWorkingKhoa();
        ensureWorkingAlwaysAccessible();
    }

    async function loadActiveKhoaList() {
        const list = await withTimeout(
            ApiService.fetchActiveKhoaPhongFromSearch(),
            25000,
            'Tai danh sach khoa/phong qua lau'
        );
        activeKhoa = toList(list).map((k) => ({
            id: String((k && k.id) || ''),
            name: String((k && k.name) || ''),
            patientCount: Number((k && k.patientCount) || 0)
        })).filter((k) => k.id && k.name);

        if (workingKhoaId && !activeKhoa.some((k) => String(k.id) === String(workingKhoaId))) {
            const found = allKhoa.find((k) => String(k.id) === String(workingKhoaId));
            activeKhoa.unshift({
                id: String(workingKhoaId),
                name: (found && found.name) || `Khoa ${workingKhoaId}`,
                patientCount: 0
            });
        }

        renderAccessibleKhoa();
    }

    async function reloadAll() {
        if (statusEl) {
            statusEl.textContent = 'Đang tải danh sách khoa/phòng...';
            statusEl.style.color = '#2563eb';
        }

        try {
            pullStateFromSettings();
            await Promise.all([loadWorkingKhoaList(), loadActiveKhoaList()]);
            pushStateToSettings(false);
            if (statusEl) {
                statusEl.textContent = `Đã tải ${activeKhoa.length} khoa/phòng đang có bệnh nhân.`;
                statusEl.style.color = '#16a34a';
            }
        } catch (e) {
            console.warn('Load user info khoa settings failed', e);
            if (statusEl) {
                statusEl.textContent = 'Không tải được danh sách khoa/phòng.';
                statusEl.style.color = '#dc2626';
            }
        }
    }

    pullStateFromSettings();

    if (workingSelect && !workingSelect.dataset.bound) {
        workingSelect.dataset.bound = '1';
        workingSelect.addEventListener('change', () => {
            workingKhoaId = String(workingSelect.value || '');
            try {
                if (workingKhoaId) localStorage.setItem('bsnt_khoa_dashboard', workingKhoaId);
            } catch (_) {}
            pushStateToSettings(true);
        });
    }

    if (accessList && !accessList.dataset.bound) {
        accessList.dataset.bound = '1';
        accessList.addEventListener('change', (e) => {
            const input = e.target;
            if (!input || !input.classList || !input.classList.contains('dr-ui-access-item')) return;
            const deptId = String(input.value || '');
            if (!deptId) return;
            if (deptId === String(workingKhoaId || '')) {
                input.checked = true;
                return;
            }
            if (input.checked) accessibleKhoaIds.add(deptId);
            else accessibleKhoaIds.delete(deptId);
            ensureWorkingAlwaysAccessible();
            pushStateToSettings(true);
        });
    }

    if (selectAllBtn && !selectAllBtn.dataset.bound) {
        selectAllBtn.dataset.bound = '1';
        selectAllBtn.addEventListener('click', () => {
            accessibleKhoaIds = new Set(toList(activeKhoa).map((d) => String(d.id || '')).filter(Boolean));
            ensureWorkingAlwaysAccessible();
            renderAccessibleKhoa();
            pushStateToSettings(true);
        });
    }

    if (clearAllBtn && !clearAllBtn.dataset.bound) {
        clearAllBtn.dataset.bound = '1';
        clearAllBtn.addEventListener('click', () => {
            accessibleKhoaIds = new Set();
            ensureWorkingAlwaysAccessible();
            renderAccessibleKhoa();
            pushStateToSettings(true);
        });
    }

    if (refreshBtn && !refreshBtn.dataset.bound) {
        refreshBtn.dataset.bound = '1';
        refreshBtn.addEventListener('click', () => {
            reloadAll();
        });
    }

    await reloadAll();

    return {
        reload: reloadAll
    };
}

module.exports = { mountUserInfoSettingsTab };
