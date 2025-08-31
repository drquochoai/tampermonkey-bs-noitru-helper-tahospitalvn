// settings-open-world.js - Open World settings (Thông tin khoa/phòng)

const SettingsService = require('./services/settingsService');
const ApiService = require('./services/apiService');

function createStylesOnce() {
    if (document.getElementById('dr-openworld-styles')) return;
    const st = document.createElement('style');
    st.id = 'dr-openworld-styles';
    st.textContent = `
        .dr-ow-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .dr-ow-card { border:1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fff; }
        .dr-ow-title { margin: 0 0 8px 0; font-weight: 700; color: #0f172a; }
        .dr-ow-list { display: flex; flex-direction: column; gap: 8px; max-height: 52vh; overflow: auto; }
        .dr-ow-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; border:1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
        .dr-ow-item:hover { background: #f8fafc; }
        .dr-ow-item.active { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22,163,74,.15) inset; }
        .dr-ow-badge { background: #16a34a; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 12px; }
        .dr-ow-empty { color:#6b7280; font-style: italic; }
        @media (max-width: 900px) { .dr-ow-wrap { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(st);
}

function debounce(fn, delay = 400) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

async function fetchKhoaPhong() { return ApiService.fetchKhoaPhong(); }
async function fetchRoomsByKhoa(khoaId) { return ApiService.fetchRoomsByKhoa(khoaId); }

/**
 * Mount Open World settings tab
 */
async function mountOpenWorldTab(opts) {
    const { container, doctorName, checklistObj, settings } = opts || {};
    if (!container) return;
    createStylesOnce();

    container.innerHTML = `
        <div style="margin:0 0 8px; color:#6b7280">Quản lý khoa mặc định và các phòng theo dõi bệnh nhân. Việc chọn khoa sẽ được lưu và áp dụng ở dashboard.</div>
        <div class="dr-ow-wrap">
            <div class="dr-ow-card">
                <h4 class="dr-ow-title">Danh sách khoa/phòng</h4>
                <div id="dr-ow-khoa-list" class="dr-ow-list"><div class="dr-ow-empty">Đang tải danh sách khoa...</div></div>
            </div>
            <div class="dr-ow-card">
                <h4 class="dr-ow-title">Phòng thuộc khoa đã chọn</h4>
                <div id="dr-ow-room-list" class="dr-ow-list"><div class="dr-ow-empty">Chưa chọn khoa.</div></div>
            </div>
        </div>
    `;

    const khoaListEl = container.querySelector('#dr-ow-khoa-list');
    const roomListEl = container.querySelector('#dr-ow-room-list');

    const ls = window.localStorage;
    const SELECTED_KHOA_KEY = 'bsnt_khoa_dashboard';
    const ROOMS_CACHE_KEY = (k) => `dr_ow_rooms_${k}`;

    // Helper: render rooms
    function renderRooms(rooms) {
        if (!rooms || rooms.length === 0) {
            roomListEl.innerHTML = `<div class="dr-ow-empty">Không có phòng.</div>`;
            return;
        }
        roomListEl.innerHTML = '';
        rooms.forEach(r => {
            const div = document.createElement('div');
            div.className = 'dr-ow-item';
            div.textContent = r.name || r.code || 'Phòng';
            // keep attributes for later use
            div.dataset.id = r.id || '';
            div.dataset.code = r.code || '';
            div.dataset.name = r.name || '';
            div.dataset.khoA_ID = r.khoA_ID || '';
            div.dataset.tanG_ID = r.tanG_ID || '';
            roomListEl.appendChild(div);
        });
    }

    // Debounced save to API for default khoa
    const debouncedSave = debounce(async (khoaId) => {
        try {
            if (!doctorName) return;
            let obj = checklistObj || await SettingsService.loadSettingsPhieu(doctorName);
            if (!obj) {
                const created = await SettingsService.createSettingsPhieu(doctorName);
                if (created && created.isValid) obj = await SettingsService.loadSettingsPhieu(doctorName);
            }
            if (!obj) return;
            const current = SettingsService.parseSettingsState(obj) || {};
            const next = { ...current, openWorld: { ...(current.openWorld || {}), defaultKhoa: String(khoaId || '') } };
            await SettingsService.updateSettingsState(obj, next);
        } catch (e) { console.warn('Save default khoa failed', e); }
    }, 600);

    // Render khoa list and wire selection
    async function renderKhoaList() {
        try {
            const khoa = await fetchKhoaPhong();
            let selected = (ls && ls.getItem(SELECTED_KHOA_KEY)) || '';
            khoaListEl.innerHTML = '';
            khoa.forEach(k => {
                const div = document.createElement('div');
                const kId = String(k.id);
                const isSelected = !!selected && selected === kId;
                div.className = 'dr-ow-item' + (isSelected ? ' active' : '');
                const name = (k && k.name) || 'Khoa';
                div.innerHTML = `<span>${name}</span>` + (isSelected ? `<span class="dr-ow-badge">Đã chọn</span>` : '');
                div.addEventListener('click', async () => {
                    // update selection locally
                    Array.from(khoaListEl.querySelectorAll('.dr-ow-item')).forEach(el => el.classList.remove('active'));
                    div.classList.add('active');
                    // set badge
                    Array.from(khoaListEl.querySelectorAll('.dr-ow-badge')).forEach(b => b.remove());
                    div.insertAdjacentHTML('beforeend', `<span class="dr-ow-badge">Đã chọn</span>`);
                    // persist to localStorage for dashboard compatibility
                    try {
                        ls && ls.setItem(SELECTED_KHOA_KEY, kId);
                    } catch(_) {}
                    // fetch rooms for selected khoa
                    const rooms = await fetchRoomsByKhoa(kId);
                    renderRooms(rooms);
                    try { ls && ls.setItem(ROOMS_CACHE_KEY(kId), JSON.stringify(rooms || [])); } catch(_) {}
                    // save via API for per-doctor settings
                    debouncedSave(kId);
                });
                khoaListEl.appendChild(div);
            });
            // Auto-load rooms for current selection
            if (selected) {
                try {
                    const cached = ls && ls.getItem(ROOMS_CACHE_KEY(selected));
                    if (cached) {
                        try { renderRooms(JSON.parse(cached)); } catch { /* ignore */ }
                    } else {
                        const rooms = await fetchRoomsByKhoa(selected);
                        renderRooms(rooms);
                        try { ls && ls.setItem(ROOMS_CACHE_KEY(selected), JSON.stringify(rooms || [])); } catch(_) {}
                    }
                } catch(_) {}
            }
        } catch (e) {
            khoaListEl.innerHTML = `<div class="dr-ow-empty">Lỗi tải danh sách khoa.</div>`;
            console.warn('LoadKhoaPhong failed', e);
        }
    }

    renderKhoaList();
}

module.exports = { mountOpenWorldTab };
