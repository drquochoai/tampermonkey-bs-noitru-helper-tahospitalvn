// page.settings.otm.quanlyphauthuat.js - Manage surgeons list per Khoa using OTM users

const ApiService = require('../services/apiService');
const SurgeonSettingsService = require('../services/surgeonSettingsService');
const { getSelectedKhoa } = require('../utils/khoaUtils');

function stylesOnce() {
    if (document.getElementById('dr-otm-surgeon-styles')) return;
    const st = document.createElement('style');
    st.id = 'dr-otm-surgeon-styles';
    st.textContent = `
    .dr-os-wrap { display:flex; flex-direction:column; gap:12px; }
    .dr-os-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .dr-os-select, .dr-os-search { padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; }
    .dr-os-columns { display:grid; grid-template-columns: 320px 1fr; gap:12px; align-items:start; }
    .dr-os-selected { border:1px solid #e5e7eb; border-radius:10px; padding:10px; background:#fff; max-height:55vh; overflow:auto; }
    .dr-os-selected h4 { margin:0 0 8px; font-size:14px; color:#334155; }
    .dr-os-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background:#f1f5f9; border:1px solid #e5e7eb; border-radius:999px; margin:4px; font-size:13px; }
    .dr-os-chip button { appearance:none; border:none; background:transparent; cursor:pointer; color:#64748b; }
    .dr-os-list { border:1px solid #e5e7eb; border-radius:10px; padding:10px; max-height:55vh; overflow:auto; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .dr-os-item { display:flex; align-items:center; gap:8px; padding:8px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; }
        .dr-os-actions { display:flex; gap:8px; }
        .dr-os-btn { appearance:none; border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:8px; cursor:pointer }
        .dr-os-btn.primary { border-color:#2563eb; background:#2563eb; color:#fff }
    @media (max-width: 1100px) { .dr-os-columns { grid-template-columns: 1fr; } }
    @media (max-width: 900px) { .dr-os-list { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(st);
}

// In-memory cache for OTM users (heavy list)
const _otmUsersCache = { list: null, at: 0 };

function getBearerToken() {
    try { return localStorage.getItem('otm_bearer_token') || ''; } catch { return ''; }
}

async function ensureOTMUsers() {
    if (Array.isArray(_otmUsersCache.list) && _otmUsersCache.list.length > 0) return _otmUsersCache.list;
    const token = getBearerToken();
    if (!token) throw new Error('NO_TOKEN');
    // Use the same query and cache-busting approach as the content script to avoid 304/empty payloads
    const url = `https://otm.tahospital.vn/api/user?ishsoft=null&page=1&limit=10000&_=${Date.now()}`;
    const res = await fetch(url, {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'authorization': `Bearer ${token}`,
            'logintype': '2',
            'siteid': '1'
        },
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'include'
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('TOKEN_EXPIRED');
        throw new Error('HTTP_' + res.status);
    }
    const json = await res.json();
    // Robustly pick the array from possible containers
    function pickArrayPayload(obj) {
        if (Array.isArray(obj)) return obj;
        if (!obj || typeof obj !== 'object') return [];
        const candidates = ['data', 'items', 'result', 'rows', 'content', 'users', 'records', 'list'];
        for (const k of candidates) {
            const v = obj[k];
            if (Array.isArray(v)) return v;
            if (v && typeof v === 'object') {
                for (const kk of candidates) {
                    const v2 = v[kk];
                    if (Array.isArray(v2)) return v2;
                }
            }
        }
        return [];
    }
    const arr = pickArrayPayload(json);
    _otmUsersCache.list = arr;
    _otmUsersCache.at = Date.now();
    return arr;
}

function subscribeOTMMessages(onUsers, onProgress, onError) {
    // GM listeners (preferred)
    try {
        if (typeof GM !== 'undefined' && GM.addValueChangeListener) {
            const unsub = [];
            unsub.push(GM.addValueChangeListener('otm_success', (n, o, v) => {
                try {
                    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                    const data = parsed && parsed.data;
                    if (data && Array.isArray(data.otmUsers)) {
                        onUsers(data.otmUsers);
                    }
                } catch(_) {}
            }));
            unsub.push(GM.addValueChangeListener('otm_progress', (n, o, v) => {
                try { const parsed = typeof v === 'string' ? JSON.parse(v) : v; onProgress && onProgress(parsed && parsed.data); } catch(_) {}
            }));
            unsub.push(GM.addValueChangeListener('otm_error', (n, o, v) => {
                try { const parsed = typeof v === 'string' ? JSON.parse(v) : v; onError && onError(parsed && parsed.data); } catch(_) {}
            }));
            return () => { try { unsub.forEach(x => typeof x === 'function' && x()); } catch(_) {} };
        }
    } catch(_) {}
    // Fallback: poll localStorage keys once per second for a short time
    const tid = setInterval(() => {
        try {
            const successData = localStorage.getItem('otm_success');
            if (successData) {
                localStorage.removeItem('otm_success');
                const parsed = JSON.parse(successData);
                const data = parsed && parsed.data;
                if (data && Array.isArray(data.otmUsers)) onUsers(data.otmUsers);
            }
            const progressData = localStorage.getItem('otm_progress');
            if (progressData) {
                localStorage.removeItem('otm_progress');
                const parsed = JSON.parse(progressData); onProgress && onProgress(parsed && parsed.data);
            }
            const errorData = localStorage.getItem('otm_error');
            if (errorData) {
                localStorage.removeItem('otm_error');
                const parsed = JSON.parse(errorData); onError && onError(parsed && parsed.data);
            }
        } catch(_) {}
    }, 1000);
    return () => clearInterval(tid);
}

function openOTMUsersTab() {
    const url = 'https://otm.tahospital.vn/?otm-fetch-users=1';
    if (typeof GM !== 'undefined' && GM.openInTab) {
        try { GM.openInTab(url, { active: false, insert: true }); return; } catch(_) {}
    }
    window.open(url, '_blank');
}

function filterSurgeonUsers(users) {
    if (!Array.isArray(users)) return [];
    // Accepted doctor title prefixes
    const prefixes = [
        'BS.', 'Bác sĩ', 'BSCKI', 'BS.CKI', 'BS.CKII', 'ThS.BS', 'ThS.BS.CKI', 'ThS.BS.CKII', 'PGS.TS.BS', 'PGS.TS.BS.CKI', 'PGS.TS.BS.CKII', 'TS.BS'
    ].map(p => p.toLowerCase());
    const norm = s => (s || '').toString().trim();
    function looksLikeDoctorName(name) {
        const n = norm(name);
        if (!n) return false;
        const ln = n.toLowerCase();
        return prefixes.some(p => ln.startsWith(p));
    }
    // Return mapped consistent shape: { id, fullname, khoaId? }
    return users
        .filter(u => looksLikeDoctorName(u?.fullname || u?.name || ''))
        .map(u => ({ id: u.id ?? u.taid ?? u.userid ?? null, fullname: u.fullname || u.name || '', raw: u }));
}

function uniqueByFullname(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr || []) {
        const n = (x.fullname || '').trim();
        if (!n || seen.has(n)) continue;
        seen.add(n); out.push({ fullname: n });
    }
    return out;
}

async function render(container, state) {
    stylesOnce();
    container.innerHTML = `
        <div class="dr-os-wrap">
            <div style="color:#6b7280">Chọn khoa và tick các bác sĩ phẫu thuật cần dùng. Danh sách lấy từ OTM, chỉ tải một lần mỗi phiên.</div>
            <div class="dr-os-row">
                <label>Khoa:</label>
                <select id="dr-os-khoa" class="dr-os-select"></select>
                <input id="dr-os-search" class="dr-os-search" placeholder="Tìm theo tên..." />
                    <div class="dr-os-actions">
                        <button id="dr-os-reload-users" class="dr-os-btn">Tải lại DS từ OTM</button>
                    </div>
            </div>
            <div id="dr-os-info" style="color:#6b7280"></div>
            <div class="dr-os-columns">
                <div class="dr-os-selected">
                    <h4>Đã chọn (<span id="dr-os-selected-count">0</span>)</h4>
                    <div id="dr-os-selected-chips"></div>
                </div>
                <div id="dr-os-list" class="dr-os-list"></div>
            </div>
        </div>
    `;

    const khoaSel = container.querySelector('#dr-os-khoa');
    const searchInput = container.querySelector('#dr-os-search');
    const listEl = container.querySelector('#dr-os-list');
    const chipsWrap = container.querySelector('#dr-os-selected-chips');
    const selCountEl = container.querySelector('#dr-os-selected-count');
    const infoEl = container.querySelector('#dr-os-info');

    // Load khoa list via ApiService
    let khoaList = [];
    try { khoaList = await ApiService.fetchKhoaPhong(); } catch { khoaList = []; }
    khoaSel.innerHTML = '';
    for (const k of khoaList) {
        const opt = document.createElement('option');
        opt.value = String(k.id);
        opt.textContent = k.name || `Khoa ${k.id}`;
        khoaSel.appendChild(opt);
    }
    const selectedKhoa = getSelectedKhoa(khoaList[0] ? String(khoaList[0].id) : '551');
    if (khoaSel.querySelector(`option[value="${selectedKhoa}"]`)) khoaSel.value = selectedKhoa;

    let otmUsers = [];
    let surgeonUsers = [];
    let selected = new Set();

    async function loadUsers() {
        infoEl.textContent = 'Đang tải danh sách người dùng OTM...';
        try {
            otmUsers = await ensureOTMUsers();
            surgeonUsers = filterSurgeonUsers(otmUsers);
            infoEl.textContent = `Lọc được ${surgeonUsers.length} bác sĩ từ OTM.`;
        } catch (e) {
            if (e && (e.message === 'NO_TOKEN' || e.message === 'TOKEN_EXPIRED')) {
                infoEl.textContent = 'Chưa có/ hết hạn token OTM. Đang mở tab OTM để lấy dữ liệu...';
                const unsubscribe = subscribeOTMMessages((users) => {
                    _otmUsersCache.list = users; _otmUsersCache.at = Date.now();
                    otmUsers = users; surgeonUsers = filterSurgeonUsers(otmUsers);
                    infoEl.textContent = `Đã tải ${users.length} người dùng từ OTM. Lọc được ${surgeonUsers.length} bác sĩ.`;
                    renderList();
                    try { unsubscribe && unsubscribe(); } catch(_) {}
                }, (prog) => {
                    // optional progress updates
                }, (err) => {
                    infoEl.textContent = (err && err.message) ? err.message : 'Lỗi khi lấy dữ liệu OTM';
                });
                openOTMUsersTab();
            } else {
                infoEl.textContent = e && e.message ? e.message : 'Không thể tải danh sách OTM';
                surgeonUsers = [];
            }
        }
    }

    function renderSelectedChips() {
        const arr = Array.from(selected.values()).sort((a,b)=>a.localeCompare(b));
        chipsWrap.innerHTML = '';
        for (const name of arr) {
            const chip = document.createElement('span');
            chip.className = 'dr-os-chip';
            chip.innerHTML = `<span>${name}</span><button title="Bỏ chọn">✕</button>`;
            const btn = chip.querySelector('button');
            btn.addEventListener('click', async () => {
                selected.delete(name);
                renderSelectedChips();
                renderList();
                // Auto-save on removal
                const khoaId = khoaSel.value;
                const names = Array.from(selected.values());
                try { await SurgeonSettingsService.saveSurgeonList(khoaId, names); } catch(_) {}
            });
            chipsWrap.appendChild(chip);
        }
        selCountEl.textContent = String(arr.length);
    }

    function renderList() {
        const q = (searchInput.value || '').trim().toLowerCase();
        const items = surgeonUsers.filter(u => !q || (u.fullname || '').toLowerCase().includes(q));
        listEl.innerHTML = '';
        for (const u of items) {
            const id = `dr-os-${btoa(unescape(encodeURIComponent(u.fullname))).replace(/=/g,'')}`;
            const div = document.createElement('label');
            div.className = 'dr-os-item';
            div.innerHTML = `
                <input type="checkbox" data-name="${u.fullname.replace(/"/g,'&quot;')}" ${selected.has(u.fullname) ? 'checked' : ''} />
                <span>${u.fullname}</span>
            `;
            const cb = div.querySelector('input[type="checkbox"]');
                cb.addEventListener('change', async () => {
                    if (cb.checked) selected.add(u.fullname); else selected.delete(u.fullname);
                    renderSelectedChips();
                    // Auto-save on change
                    const khoaId = khoaSel.value;
                    const names = Array.from(selected.values());
                    try { await SurgeonSettingsService.saveSurgeonList(khoaId, names); } catch(_) {}
                });
            listEl.appendChild(div);
        }
        if (items.length === 0) listEl.innerHTML = '<div class="dr-os-item" style="opacity:.7">Không có kết quả.</div>';
    }

    async function loadSelectionForCurrentKhoa() {
        const khoaId = khoaSel.value;
        infoEl.textContent = 'Đang tải danh sách đã lưu...';
        try {
            const { list } = await SurgeonSettingsService.loadSurgeonList(khoaId);
            selected = new Set((list || []).map(x => (typeof x === 'string' ? x : x.fullname)).filter(Boolean));
            infoEl.textContent = `Đã tải danh sách lưu (${selected.size}).`;
            renderList();
            renderSelectedChips();
        } catch (e) {
            infoEl.textContent = 'Không thể tải danh sách đã lưu';
        }
    }

    await loadUsers();
    await loadSelectionForCurrentKhoa();
    renderList();

    searchInput.addEventListener('input', () => renderList());
    khoaSel.addEventListener('change', async () => { await loadSelectionForCurrentKhoa(); });

    container.querySelector('#dr-os-reload-users').addEventListener('click', async () => {
        // Always fetch via OTM tab to mirror otm-entry flow
        infoEl.textContent = 'Đang mở tab OTM để tải lại danh sách...';
        const unsubscribe = subscribeOTMMessages((users) => {
            _otmUsersCache.list = users; _otmUsersCache.at = Date.now();
            otmUsers = users; surgeonUsers = filterSurgeonUsers(otmUsers);
            infoEl.textContent = `Đã tải ${users.length} người dùng từ OTM. Lọc được ${surgeonUsers.length} bác sĩ.`;
            renderList();
            renderSelectedChips();
            try { unsubscribe && unsubscribe(); } catch(_) {}
        }, null, (err) => {
            infoEl.textContent = (err && err.message) ? err.message : 'Lỗi khi lấy dữ liệu OTM';
        });
        openOTMUsersTab();
    });

    container.querySelector('#dr-os-save').addEventListener('click', async () => {
        const khoaId = khoaSel.value;
        const names = Array.from(selected.values());
        // Removed explicit Save button; selection changes are auto-saved.
    });
}

async function mountOTMSurgeonsTab({ container }) {
    if (!container) return;
    await render(container, {});
}

module.exports = { mountOTMSurgeonsTab };
