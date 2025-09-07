// page.lichmo.homnay.js - Lịch mổ hôm nay (today's surgery schedule)

const { showToast } = require('../utils/uiUtils');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const ApiService = require('../services/apiService');
const SurgeonSettingsService = require('../services/surgeonSettingsService');
const { createKhoaSelect } = require('../components/khoaSelect');

function stylesOnce() {
  if (document.getElementById('dr-qh-lichmo-css')) return;
  const st = document.createElement('style');
  st.id = 'dr-qh-lichmo-css';
  st.textContent = `
    .dr-qh-lichmo-wrap{min-height:100vh;background:#fff;color:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
    .dr-qh-lichmo-head{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e5e7eb;position:sticky;top:0;background:#fff;z-index:10;gap:12px}
    .dr-qh-lichmo-left{display:flex;align-items:center;gap:10px}
    .dr-qh-lichmo-title{margin:0;font-size:18px}
    .dr-qh-lichmo-khoa{color:#475569;font-size:13px;background:#f1f5f9;border-radius:8px;padding:3px 8px}
    .dr-qh-lichmo-mid{display:flex;align-items:center;gap:6px}
    .dr-qh-lichmo-date{font-weight:600}
    .dr-qh-lichmo-btn{border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}
    .dr-qh-lichmo-btn:hover{background:#f8fafc}
    .dr-qh-lichmo-right{display:flex;align-items:center;gap:8px}
    .dr-qh-lichmo-status{color:#64748b;font-size:13px}
    .dr-qh-lichmo-loading{width:16px;height:16px;border:2px solid #94a3b8;border-top-color:#0ea5e9;border-radius:50%;animation:drspin 1s linear infinite;display:none}
    .dr-qh-lichmo-loading.active{display:inline-block}
    @keyframes drspin{to{transform:rotate(360deg)}}
  .dr-qh-lichmo-content{padding:16px 18px;height:calc(100vh - 58px);overflow:auto;overscroll-behavior:contain}
  /* Timeline container */
  .dr-qh-timeline{position:relative;border-left:1px dashed #e2e8f0;padding-left:12px}
  .dr-qh-timegrid{position:relative;height:720px;background:linear-gradient(180deg,#fff 0,#fff 49%,#f8fafc 50%,#f8fafc 100%);background-size:100% 60px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
  .dr-qh-timeaxis{position:absolute;left:0;top:0;bottom:0;width:54px;border-right:1px solid #e5e7eb;background:#fff;z-index:2}
  .dr-qh-timeaxis .tick{position:absolute;left:0;right:0;height:1px;background:#e5e7eb}
  .dr-qh-timeaxis .label{position:absolute;left:6px;transform:translateY(-50%);font-size:12px;color:#64748b;background:#fff;padding:0 2px}
  .dr-qh-lanes{position:absolute;left:54px;right:0;top:0;bottom:0}
  .dr-qh-lane{position:relative;height:100%}
  .dr-qh-evtbar{position:absolute;left:8px;right:12px;border-radius:12px;display:flex;flex-direction:column;align-items:flex-start;padding:10px 14px;color:#0f172a;box-shadow:0 8px 20px rgba(2,6,23,.12);border:1px solid rgba(15,23,42,.08)}
  .dr-qh-evtbar .row{display:flex;gap:8px;align-items:center;min-width:0;width:100%}
  .dr-qh-evtbar .row+.row{margin-top:4px}
  .dr-qh-evtbar .time{font-size:12px;opacity:.85;white-space:nowrap;color:#334155}
  .dr-qh-evtbar .patient{font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dr-qh-evtbar .method{font-size:14px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.95;flex:1}
  .dr-qh-evtbar .docs{font-size:12px;color:#2563ebb3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-left:auto}
  /* Emphasize OR row: largest and bold */
  .dr-qh-evtbar .or{font-size:16px;font-weight:800;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
  /* Make meta as prominent as patient */
  .dr-qh-evtbar .meta{font-size:14px;font-weight:700;color:#0f172a;opacity:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dr-qh-evtbar.tight{padding:4px 10px}
  .dr-qh-evtbar.tight .method,.dr-qh-evtbar.tight .docs{display:none}
  .dr-qh-empty{padding:12px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;background:#f8fafc}
  @media (max-width: 1100px){.dr-qh-timeaxis{width:46px}.dr-qh-lanes{left:46px}}
  `;
  document.head.appendChild(st);
}

function subscribeOTMMessages(onSuccess, onProgress, onError) {
  try {
    if (typeof GM !== 'undefined' && GM.addValueChangeListener) {
      const unsubIds = [];
      unsubIds.push(GM.addValueChangeListener('otm_success', (n, o, v) => {
        try {
          const parsed = typeof v === 'string' ? JSON.parse(v) : v;
          const data = parsed && parsed.data;
          onSuccess && onSuccess(data);
        } catch(_) {}
      }));
      unsubIds.push(GM.addValueChangeListener('otm_progress', (n, o, v) => {
        try {
          const parsed = typeof v === 'string' ? JSON.parse(v) : v;
          const data = parsed && parsed.data;
          onProgress && onProgress(data);
        } catch(_) {}
      }));
      unsubIds.push(GM.addValueChangeListener('otm_error', (n, o, v) => {
        try {
          const parsed = typeof v === 'string' ? JSON.parse(v) : v;
          const data = parsed && parsed.data;
          onError && onError(data);
        } catch(_) {}
      }));
      // Listen for close request to ensure background tab is closed if self-close failed
      unsubIds.push(GM.addValueChangeListener('otm_close_tab', (n, o, v) => {
  try { closeOTMTabIfAny(); } catch(_) {}
  scheduleCloseAfterSignal(5000);
      }));
      return () => { try { unsubIds.forEach(id => { try { GM.removeValueChangeListener && GM.removeValueChangeListener(id); } catch(_) {} }); } catch(_) {} };
    }
  } catch(_) {}
  // Fallback localStorage polling
  const tid = setInterval(() => {
    try {
      const s = localStorage.getItem('otm_success');
  if (s) { localStorage.removeItem('otm_success'); const p = JSON.parse(s); onSuccess && onSuccess(p && p.data); }
      const pr = localStorage.getItem('otm_progress');
  if (pr) { localStorage.removeItem('otm_progress'); const p = JSON.parse(pr); onProgress && onProgress(p && p.data); }
      const er = localStorage.getItem('otm_error');
  if (er) { localStorage.removeItem('otm_error'); const p = JSON.parse(er); onError && onError(p && p.data); }
  const ct = localStorage.getItem('otm_close_tab');
  if (ct) { localStorage.removeItem('otm_close_tab'); try { closeOTMTabIfAny(); } catch(_) {} scheduleCloseAfterSignal(5000); }
    } catch(_) {}
  }, 800);
  return () => clearInterval(tid);
}

let lastOTMTab = null;
let pendingCloseTimer = null;
let pendingCloseDeadline = 0;
function closeOTMTabIfAny() {
  try {
    if (lastOTMTab && !lastOTMTab.closed) { lastOTMTab.close(); }
  } catch(_) {}
  lastOTMTab = null;
}
function scheduleCloseAfterSignal(ms = 5000) {
  try { if (pendingCloseTimer) { clearInterval(pendingCloseTimer); } } catch(_) {}
  pendingCloseDeadline = Date.now() + Math.max(1000, ms);
  pendingCloseTimer = setInterval(() => {
    try { closeOTMTabIfAny(); } catch(_) {}
    if (!lastOTMTab || lastOTMTab.closed || Date.now() > pendingCloseDeadline) {
      try { clearInterval(pendingCloseTimer); } catch(_) {}
      pendingCloseTimer = null; pendingCloseDeadline = 0;
    }
  }, 250);
}

function openOTMSurgeriesTab(fromDate, toDate) {
  // Avoid tab accumulation: close previous background tab if still open
  try { closeOTMTabIfAny(); } catch(_) {}
  const payload = encodeURIComponent(JSON.stringify({ fromDate, toDate, preferToken: true }));
  const url = `https://otm.tahospital.vn/?otm-fetch=${payload}`;
  if (typeof GM !== 'undefined' && GM.openInTab) {
  try {
    const ret = GM.openInTab(url, { active: false, insert: true, setParent: true });
    // Tampermonkey may return a Tab or a Promise<Tab>
    if (ret && typeof ret.then === 'function') {
      ret.then(h => { try { if (h && h.close) { lastOTMTab = h; } } catch(_) {} });
    } else {
      lastOTMTab = ret && ret.close ? ret : null;
    }
    return;
  } catch(_) {}
  }
  try { lastOTMTab = window.open(url, '_blank'); } catch(_) { /* ignore */ }
}

function formatTimeRange(start, end) {
  try {
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    const fmt = (d)=> d ? d.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';
    const sStr = fmt(s);
    const eStr = fmt(e);
    return sStr + (eStr ? ` - ${eStr}` : '');
  } catch(_) { return start || ''; }
}

function filterBySelectedSurgeons(surgeries, selectedNames) {
  if (!Array.isArray(surgeries) || surgeries.length === 0) return [];
  const set = new Set((selectedNames || []).map(s => (s || '').toString().trim().toLowerCase()).filter(Boolean));
  if (set.size === 0) return surgeries; // If nothing selected, show all
  return surgeries.filter(item => {
    const all = [
      ...(Array.isArray(item.userexec) ? item.userexec : []),
      ...(Array.isArray(item.userassistant) ? item.userassistant : [])
    ];
    return all.some(u => set.has(((u && (u.fullname || u.name)) || '').toString().trim().toLowerCase()));
  });
}

function sortByStart(a, b) {
  const as = a && a.start ? Date.parse(a.start) : 0;
  const bs = b && b.start ? Date.parse(b.start) : 0;
  return as - bs;
}

function renderUI(container, dateStr, surgeries) {
  container.innerHTML = '';
  if (!surgeries || surgeries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dr-qh-empty';
    empty.textContent = 'Không có ca mổ nào trong ngày này.';
    container.appendChild(empty);
    return;
  }

  // Prepare timeline range (07:00 - 19:00 default)
  const startHour = 7, endHour = 19; // can be tuned later
  const totalMinutes = (endHour - startHour) * 60; // maps to 720px grid height
  const pxPerMin = 720 / totalMinutes;

  // Create base structure
  const timeline = document.createElement('div'); timeline.className = 'dr-qh-timeline';
  const grid = document.createElement('div'); grid.className = 'dr-qh-timegrid';
  const axis = document.createElement('div'); axis.className = 'dr-qh-timeaxis';
  const lanesWrap = document.createElement('div'); lanesWrap.className = 'dr-qh-lanes';

  // Axis ticks each hour
  for (let h = startHour; h <= endHour; h++) {
  const y = (h - startHour) * (720 / (endHour - startHour));
    const tick = document.createElement('div'); tick.className = 'tick'; tick.style.top = `${y}px`;
    const lab = document.createElement('div'); lab.className = 'label'; lab.style.top = `${y}px`; lab.textContent = `${String(h).padStart(2,'0')}:00`;
    axis.appendChild(tick); axis.appendChild(lab);
  }

  // Compute bars with overlap lanes
  const items = surgeries.map((s, idx) => {
    const sMs = s && s.start ? Date.parse(s.start) : NaN;
    const eMs = s && s.end ? Date.parse(s.end) : NaN;
    const sD = isNaN(sMs) ? null : new Date(sMs);
    const eD = isNaN(eMs) ? null : new Date(eMs);
    const clamp = (d) => Math.max(0, Math.min(totalMinutes - 5, (d.getHours() - startHour) * 60 + d.getMinutes()));
    const topMin = sD ? clamp(sD) : 0;
    const endMin = eD ? clamp(eD) : (topMin + 45);
    const height = Math.max(28, endMin - topMin);
    return { s, idx, topMin, height };
  }).sort((a,b)=>a.topMin-b.topMin);

  // Assign lanes so overlapping bars go to different horizontal lanes
  const lanes = []; // each lane stores last end (minute)
  items.forEach(it => {
    let placed = false;
    for (let i=0;i<lanes.length;i++) {
      if (lanes[i] <= it.topMin - 4) { // small gap to avoid touching
        it.lane = i; lanes[i] = it.topMin + it.height; placed = true; break;
      }
    }
    if (!placed) { it.lane = lanes.length; lanes.push(it.topMin + it.height); }
  });

  // Render lanes container widths
  const laneWidthPercent = 100 / Math.max(1, lanes.length);
  for (let i=0;i<lanes.length;i++) {
    const laneEl = document.createElement('div');
    laneEl.className = 'dr-qh-lane';
    laneEl.style.position = 'absolute';
    laneEl.style.left = `${i * laneWidthPercent}%`;
    laneEl.style.width = `${laneWidthPercent}%`;
    laneEl.style.top = '0';
    laneEl.style.bottom = '0';
    lanesWrap.appendChild(laneEl);
  }

  // Render bars into lanes
  const palette = ['#93c5fd','#a5b4fc','#f0abfc','#f9a8d4','#fda4af','#fcd34d','#86efac'];
  items.forEach(it => {
    const laneEl = lanesWrap.children[it.lane];
    const bar = document.createElement('div'); bar.className = 'dr-qh-evtbar';
  bar.style.top = `${it.topMin * pxPerMin}px`;
    bar.style.height = `${it.height * pxPerMin}px`;
    bar.style.background = palette[it.idx % palette.length];
    if (it.height * pxPerMin < 36) bar.classList.add('tight');
    const row0 = document.createElement('div'); row0.className = 'row';
    const row1 = document.createElement('div'); row1.className = 'row';
    const row2 = document.createElement('div'); row2.className = 'row';
    const time = document.createElement('span'); time.className = 'time'; time.textContent = formatTimeRange(it.s.start, it.s.end) || '—';
  const patientEl = document.createElement('span'); patientEl.className = 'patient';
    const patient = (it.s.customer && (it.s.customer.fullname || '')) || '';
    const method = it.s.surgerymethod || '';
    const exec = (it.s.userexec||[]).map(u => u && (u.fullname || u.name)).filter(Boolean).join(', ');
    const assistant = (it.s.userassistant||[]).map(u => u && (u.fullname || u.name)).filter(Boolean).join(', ');
    patientEl.textContent = patient || '';
    const methodEl = document.createElement('span'); methodEl.className = 'method'; methodEl.textContent = method || '';
    const docsEl = document.createElement('span'); docsEl.className = 'docs'; docsEl.textContent = [exec, assistant? `(phụ: ${assistant})` : ''].filter(Boolean).join(' ');
    const pid = (it.s.customer && (it.s.customer.pid || it.s.customer.code || '')) || '';
    const phong = it.s.phongDieuTri || '';
    const giuong = it.s.giuongDieuTri || '';
    const metaEl = document.createElement('span'); metaEl.className = 'meta';
    metaEl.textContent = [pid? `PID: ${pid}`:'', phong? `Phòng: ${phong}`:'', giuong? `Giường: ${giuong}`:''].filter(Boolean).join(' • ');
    const orEl = document.createElement('span'); orEl.className = 'or';
    const opRoom = it.s.operating_room || (it.s.room && it.s.room.name) || '';
    orEl.textContent = opRoom ? `Phòng mổ: ${opRoom}` : '';
    bar.title = [
      `Phòng mổ: ${it.s.operating_room || (it.s.room && it.s.room.name) || ''}`,
      `Bệnh nhân: ${patient}`,
      `PID: ${(it.s.customer && (it.s.customer.pid || it.s.customer.code || '')) || ''}`,
      it.s.phongDieuTri ? `Phòng: ${it.s.phongDieuTri}` : '',
      it.s.giuongDieuTri ? `Giường: ${it.s.giuongDieuTri}` : '',
      it.s.diagnose ? `Chẩn đoán: ${it.s.diagnose}` : '',
      `PPPT: ${method}`,
      exec ? `BS chính: ${exec}` : '',
      assistant ? `BS phụ: ${assistant}` : '',
      it.s.status ? `Ghi chú: ${it.s.status}` : ''
    ].filter(Boolean).join('\n');
    row0.appendChild(orEl);
    row1.appendChild(time); row1.appendChild(patientEl); row1.appendChild(metaEl);
    row2.appendChild(methodEl); row2.appendChild(docsEl);
    if (opRoom) bar.appendChild(row0);
    bar.appendChild(row1); bar.appendChild(row2);
    laneEl.appendChild(bar);
  });

  grid.appendChild(axis); grid.appendChild(lanesWrap);
  timeline.appendChild(grid);
  container.appendChild(timeline);
}

async function showLichMoHomNayIfNeeded() {
  const url = new URL(window.location.href);
  const hasLm = /[?&]lm(=|&|$)/.test(url.search);
  const hasLichmo = /[?&]lichmo(=|&|$)/.test(url.search) || (url.searchParams.get('otm')||'').toLowerCase() === 'lichmo';
  if (!hasLm && !hasLichmo) return;

  stylesOnce();
  document.body.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'dr-qh-lichmo-wrap';
  const head = document.createElement('div'); head.className = 'dr-qh-lichmo-head';
  head.innerHTML = `
    <div class="dr-qh-lichmo-left">
      <h3 class="dr-qh-lichmo-title">Lịch mổ hôm nay</h3>
      <span id="dr-qh-lichmo-khoa" class="dr-qh-lichmo-khoa"></span>
    </div>
    <div class="dr-qh-lichmo-mid">
      <button id="dr-qh-lichmo-prev" class="dr-qh-lichmo-btn" title="Ngày trước">◀</button>
      <input id="dr-qh-lichmo-date" class="dr-qh-lichmo-date" type="date" />
      <button id="dr-qh-lichmo-next" class="dr-qh-lichmo-btn" title="Ngày sau">▶</button>
      <button id="dr-qh-lichmo-today" class="dr-qh-lichmo-btn" title="Hôm nay">Hôm nay</button>
    </div>
    <div class="dr-qh-lichmo-right">
      <div id="dr-qh-lichmo-loading" class="dr-qh-lichmo-loading" aria-label="Đang tải" title="Đang tải"></div>
      <div id="dr-qh-lichmo-status" class="dr-qh-lichmo-status">Chuẩn bị lấy dữ liệu...</div>
      <button id="dr-qh-lichmo-refresh" class="dr-qh-lichmo-btn">Làm mới</button>
    </div>
  `;
  const content = document.createElement('div'); content.className = 'dr-qh-lichmo-content';
  wrap.appendChild(head); wrap.appendChild(content); document.body.appendChild(wrap);

  const statusEl = head.querySelector('#dr-qh-lichmo-status');
  const loadingEl = head.querySelector('#dr-qh-lichmo-loading');
  const dateEl = head.querySelector('#dr-qh-lichmo-date');
  const prevBtn = head.querySelector('#dr-qh-lichmo-prev');
  const nextBtn = head.querySelector('#dr-qh-lichmo-next');
  const todayBtn = head.querySelector('#dr-qh-lichmo-today');
  const refreshBtn = head.querySelector('#dr-qh-lichmo-refresh');
  const khoaEl = head.querySelector('#dr-qh-lichmo-khoa');
  // mount reusable khoa select at vị trí "dr-qh-lichmo-khoa"
  const khoaComp = createKhoaSelect({ container: khoaEl, onChange: async (newId, newName) => {
    khoaId = String(newId);
    await doRefresh();
    scheduleAutoRefresh();
  }});

  // State
  let currentDate = new Date();
  let refreshTimer = null;
  let selectedNames = [];
  let khoaId = getSelectedKhoa('551');
  let khoaNameCache = '';
  let isBusy = false; // single-flight lock
  let activeUnsub = null;
  let busyWatchdog = null;
  let closeRetryTimer = null; // no longer used; child self-closes

  function fmtVietnam(d) {
    const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
    return { iso: `${yyyy}-${mm}-${dd}`, human: `${dd}/${mm}/${yyyy}` };
  }

  async function loadKhoaNameOnce() {
    try {
      const list = await ApiService.fetchKhoaPhong();
      const found = (list||[]).find(k => String(k.id) === String(khoaId));
      khoaNameCache = (found && found.name) || `Khoa ${khoaId}`;
    } catch(_) { khoaNameCache = `Khoa ${khoaId}`; }
    // Label is handled by component; keep cache for title/other use if needed
  }

  async function loadSelectedSurgeons() {
    try {
      const { list } = await SurgeonSettingsService.loadSurgeonList(khoaId);
      selectedNames = (list || []).map(x => typeof x === 'string' ? x : x.fullname).filter(Boolean);
    } catch(_) { selectedNames = []; }
  }

  function setLoading(flag, message) {
    if (flag) loadingEl.classList.add('active'); else loadingEl.classList.remove('active');
    if (message) statusEl.textContent = message;
  }

  function disableControls(disabled) {
    [prevBtn, nextBtn, todayBtn, refreshBtn, dateEl].forEach(el => { try { el.disabled = !!disabled; el.classList.toggle('dr-disabled', !!disabled); } catch(_) {} });
  }

  function subscribeAndFetch(dateIso) {
    if (isBusy) {
      showToast('Đang lấy dữ liệu, vui lòng đợi tác vụ hiện tại hoàn tất...', { background: '#0284c7' });
      return;
    }
    isBusy = true;
    disableControls(true);
    setLoading(true, `Đang mở OTM để lấy lịch mổ ngày ${dateIso}...`);
    showToast(`Đang lấy dữ liệu ngày ${dateIso}...`);
    const unsub = subscribeOTMMessages((data) => {
      try {
        const arr = data && (data.surgeryData || []);
        const usable = Array.isArray(arr) && arr.length ? arr : (data && data.surgeryDataRaw) || [];
        const filtered = filterBySelectedSurgeons(usable, selectedNames);
        content.innerHTML = '';
        renderUI(content, dateIso, filtered);
        statusEl.textContent = `Đã tải ${usable.length} ca, hiển thị ${filtered.length} ca (lọc theo bác sĩ).`;
        showToast('Đã lấy dữ liệu.', { background: '#16a34a' });
      } finally {
        try { unsub && unsub(); } catch(_) {}
        setLoading(false);
        isBusy = false; activeUnsub = null; disableControls(false);
      }
    }, (prog) => {
      if (prog && prog.message) { statusEl.textContent = prog.message; }
    }, (err) => {
      statusEl.textContent = (err && err.message) ? err.message : 'Lỗi khi lấy dữ liệu lịch mổ.';
      showToast('Lỗi khi lấy dữ liệu lịch mổ.', { background: '#ef4444' });
      try { unsub && unsub(); } catch(_) {}
      setLoading(false);
      isBusy = false; activeUnsub = null; disableControls(false);
    });
    activeUnsub = unsub;
    openOTMSurgeriesTab(dateIso, dateIso);

    // Watchdog to avoid stuck busy state if no response arrives
    if (busyWatchdog) { try { clearTimeout(busyWatchdog); } catch(_) {} }
  busyWatchdog = setTimeout(() => {
      if (isBusy) {
        showToast('Quá thời gian chờ OTM phản hồi. Tác vụ bị hủy.', { background: '#ef4444' });
        try { activeUnsub && activeUnsub(); } catch(_) {}
        setLoading(false);
        isBusy = false; activeUnsub = null; disableControls(false);
      }
    }, 75000);
  }

  async function doRefresh() {
    const { iso } = fmtVietnam(currentDate);
    if (dateEl && dateEl.type === 'date') { dateEl.value = iso; }
    await loadSelectedSurgeons();
    subscribeAndFetch(iso);
  }

  function scheduleAutoRefresh() {
    const ms = Math.max(60000, parseInt(localStorage.getItem('dr_qh_lichmo_refresh_ms') || '300000', 10));
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    refreshTimer = setInterval(() => { doRefresh(); }, ms);
  }

  // Wire header controls
  prevBtn.addEventListener('click', () => { currentDate.setDate(currentDate.getDate()-1); doRefresh(); scheduleAutoRefresh(); });
  nextBtn.addEventListener('click', () => { currentDate.setDate(currentDate.getDate()+1); doRefresh(); scheduleAutoRefresh(); });
  todayBtn.addEventListener('click', () => { currentDate = new Date(); doRefresh(); scheduleAutoRefresh(); });
  refreshBtn.addEventListener('click', () => { doRefresh(); scheduleAutoRefresh(); });
  // Allow manual date selection
  dateEl.addEventListener('change', () => {
    const v = dateEl.value; // yyyy-mm-dd
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y,m,d] = v.split('-').map(n=>parseInt(n,10));
      const nd = new Date(y, m-1, d);
      if (!isNaN(nd.getTime())) {
        currentDate = nd;
        doRefresh();
        scheduleAutoRefresh();
      }
    }
  });

  // Initial
  await loadKhoaNameOnce();
  await doRefresh();
  scheduleAutoRefresh();
}

module.exports = { showLichMoHomNayIfNeeded };
