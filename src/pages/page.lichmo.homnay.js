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
  .dr-qh-timegrid{position:relative;min-height:720px;background:linear-gradient(180deg,#fff 0,#fff 49%,#f8fafc 50%,#f8fafc 100%);background-size:100% 60px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
  .dr-qh-timeaxis{position:absolute;left:0;top:0;width:54px;border-right:1px solid #e5e7eb;background:#fff;z-index:2}
  .dr-qh-timeaxis .tick{position:absolute;left:0;right:0;height:1px;background:#e5e7eb}
  .dr-qh-timeaxis .label{position:absolute;left:6px;transform:translateY(-50%);font-size:12px;color:#64748b;background:#fff;padding:0 2px}
  .dr-qh-lanes{position:absolute;left:54px;right:0;top:0}
  .dr-qh-lane{position:relative}
  .dr-qh-evtbar{position:absolute;left:8px;right:12px;border-radius:16px;display:flex;flex-direction:column;align-items:flex-start;padding:14px 18px;color:#0f172a;box-shadow:0 8px 20px rgba(2,6,23,.12);border:1px solid rgba(15,23,42,.08);min-height:80px;transition:all .2s ease;overflow:hidden}
  .dr-qh-evtbar:hover{box-shadow:0 12px 30px rgba(2,6,23,.18);transform:translateY(-1px)}
  .dr-qh-evtbar .row{display:flex;gap:8px;align-items:flex-start;min-width:0;width:100%;line-height:1.4;margin-bottom:6px}
  .dr-qh-evtbar .row:last-child{margin-bottom:0}
  .dr-qh-evtbar .time{font-size:14px;font-weight:600;color:#1976d2;white-space:nowrap;margin-left:auto}
  .dr-qh-evtbar .patient{font-weight:800;font-size:18px;text-transform:uppercase;letter-spacing:.3px;color:#1976d2;line-height:1.2;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  .dr-qh-evtbar .method{font-size:14px;color:#374151;font-weight:500;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .dr-qh-evtbar .docs{font-size:14px;color:#7c3aed;font-weight:500;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  /* Emphasize OR row: largest and bold */
  .dr-qh-evtbar .or{font-size:16px;font-weight:800;color:#1976d2;background:#fef3c7;padding:4px 10px;border-radius:8px;border:1px solid #fbbf24;margin-bottom:4px;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  /* Make meta as prominent as patient */
  .dr-qh-evtbar .meta{font-size:14px;font-weight:600;color:#1f2937;background:#f3f4f6;padding:3px 8px;border-radius:6px;border:1px solid #d1d5db;word-wrap:break-word;overflow-wrap:break-word;flex:1}
  .dr-qh-evtbar .diagnose{font-size:14px;color:#374151;font-weight:500;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .dr-qh-evtbar.tight{padding:8px 12px;min-height:80px}
  .dr-qh-evtbar.tight .method{font-size:13px}
  .dr-qh-evtbar.tight .docs{font-size:12px}
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

function renderTimeAxisHTML(startHour, endHour, timelineHeight = 720) {
  let ticksHTML = '';
  for (let h = startHour; h <= endHour; h++) {
    const y = (h - startHour) * (timelineHeight / (endHour - startHour));
    ticksHTML += `
      <div class="tick" style="top: ${y}px;"></div>
      <div class="label" style="top: ${y}px;">${String(h).padStart(2,'0')}:00</div>
    `;
  }
  return `<div class="dr-qh-timeaxis" style="height: ${timelineHeight}px;">${ticksHTML}</div>`;
}

function calculateContentHeight(item) {
  const { s } = item;
  
  // Count content rows
  let rowCount = 0;
  
  // Operating room + time row
  const opRoom = s.operating_room || (s.room && s.room.name) || '';
  if (opRoom) rowCount++;
  
  // Patient name row (always present)
  rowCount++;
  
  // Meta info row
  const pid = (s.customer && (s.customer.pid || s.customer.code || '')) || '';
  const phong = s.phongDieuTri || '';
  const giuong = s.giuongDieuTri || '';
  if (pid || phong || giuong) rowCount++;
  
  // Diagnosis row (now before surgery method)
  const diagnose = s.diagnose || '';
  if (diagnose) {
    // Count lines for diagnosis (might wrap to 2 lines)
    const diagnosisLineCount = Math.min(2, Math.ceil(diagnose.length / 50));
    rowCount += diagnosisLineCount;
  }
  
  // Surgery method row
  const method = s.surgerymethod || '';
  if (method) {
    // Count lines for method (might wrap to 2 lines)
    const methodLineCount = Math.min(2, Math.ceil(method.length / 50));
    rowCount += methodLineCount;
  }
  
  // Doctors row
  const exec = (s.userexec||[]).map(u => u && (u.fullname || u.name)).filter(Boolean);
  const assistant = (s.userassistant||[]).map(u => u && (u.fullname || u.name)).filter(Boolean);
  if (exec.length || assistant.length) rowCount++;
  
  // Calculate height: base padding + row height * count + gaps
  const basePadding = 28; // 14px top + 14px bottom
  const rowHeight = 24; // estimated height per row including line-height
  const gapHeight = 6; // gap between rows
  const calculatedHeight = basePadding + (rowHeight * rowCount) + (gapHeight * Math.max(0, rowCount - 1));
  
  return Math.max(80, calculatedHeight); // minimum 80px
}

function renderSurgeryBarHTML(item, pxPerMin, palette) {
  const { s, idx, topMin, height } = item;
  
  // Extract data
  const patient = (s.customer && (s.customer.fullname || '')) || '';
  const method = s.surgerymethod || '';
  const exec = (s.userexec||[]).map(u => u && (u.fullname || u.name)).filter(Boolean).join(', ');
  const assistant = (s.userassistant||[]).map(u => u && (u.fullname || u.name)).filter(Boolean).join(', ');
  const pid = (s.customer && (s.customer.pid || s.customer.code || '')) || '';
  const phong = s.phongDieuTri || '';
  const giuong = s.giuongDieuTri || '';
  const opRoom = s.operating_room || (s.room && s.room.name) || '';
  const timeRange = formatTimeRange(s.start, s.end) || '—';
  const diagnose = s.diagnose || '';
  
  // Create tooltip
  const tooltip = [
    `Phòng mổ: ${opRoom}`,
    `Bệnh nhân: ${patient}`,
    `PID: ${pid}`,
    phong ? `Phòng: ${phong}` : '',
    giuong ? `Giường: ${giuong}` : '',
    diagnose ? `Chẩn đoán: ${diagnose}` : '',
    `PPPT: ${method}`,
    exec ? `BS chính: ${exec}` : '',
    assistant ? `BS phụ: ${assistant}` : '',
    s.status ? `Ghi chú: ${s.status}` : ''
  ].filter(Boolean).join('\n');
  
  // Meta info
  const metaInfo = [
    pid ? `PID: ${pid}` : '', 
    phong ? `Phòng: ${phong}` : '', 
    giuong ? `Giường: ${giuong}` : ''
  ].filter(Boolean).join(' • ');
  
  const docsInfo = [exec, assistant ? `(phụ: ${assistant})` : ''].filter(Boolean).join(' ');
  
  // Style properties with content-based height
  const contentHeight = calculateContentHeight(item);
  const displayHeight = Math.max(contentHeight, height * pxPerMin); // Use larger of content or time-based height
  
  const barStyle = `
    top: ${topMin * pxPerMin}px;
    height: ${displayHeight}px;
    background: ${palette[idx % palette.length]};
  `;
  
  const tightClass = displayHeight < 100 ? ' tight' : '';
  
  return `
    <div class="dr-qh-evtbar${tightClass}" style="${barStyle}" title="${tooltip}">
      ${opRoom ? `
        <div class="row">
          <span class="or">Phòng mổ: ${opRoom}</span>
          <span class="time">${timeRange}</span>
        </div>
      ` : ''}
      
      <div class="row">
        <span class="patient">${patient}</span>
      </div>
      
      ${metaInfo ? `
        <div class="row">
          <span class="meta">${metaInfo}</span>
        </div>
      ` : ''}
      
      ${diagnose ? `
        <div class="row">
          <span class="diagnose"><b>CĐ:</b> ${diagnose}</span>
        </div>
      ` : ''}
      
      ${method ? `
        <div class="row">
          <span class="method"><b>PPPT:</b> ${method}</span>
        </div>
      ` : ''}
      
      ${docsInfo ? `
        <div class="row">
          <span class="docs">${docsInfo}</span>
        </div>
      ` : ''}
    </div>
  `;
}

function renderUI(container, dateStr, surgeries) {
  if (!surgeries || surgeries.length === 0) {
    container.innerHTML = '<div class="dr-qh-empty">Không có ca mổ nào trong ngày này.</div>';
    return;
  }

  // Prepare timeline range
  const startHour = 7, endHour = 24;
  const totalMinutes = (endHour - startHour) * 60;
  const pxPerMin = 720 / totalMinutes;

  // Compute bars with overlap lanes and content-based heights
  const items = surgeries.map((s, idx) => {
    const sMs = s && s.start ? Date.parse(s.start) : NaN;
    const eMs = s && s.end ? Date.parse(s.end) : NaN;
    const sD = isNaN(sMs) ? null : new Date(sMs);
    const eD = isNaN(eMs) ? null : new Date(eMs);
    const clamp = (d) => Math.max(0, Math.min(totalMinutes - 5, (d.getHours() - startHour) * 60 + d.getMinutes()));
    const topMin = sD ? clamp(sD) : 0;
    const endMin = eD ? clamp(eD) : (topMin + 60);
    const timeBasedHeight = Math.max(60, endMin - topMin); // Reduced minimum for time-based
    return { s, idx, topMin, height: timeBasedHeight };
  }).sort((a,b) => a.topMin - b.topMin);

  // Calculate content heights and determine actual display heights
  items.forEach(item => {
    const contentHeight = calculateContentHeight(item);
    const timeHeight = item.height;
    item.displayHeight = Math.max(contentHeight, timeHeight);
    // Convert back to minutes for lane calculation
    item.heightInMinutes = item.displayHeight / pxPerMin;
  });

  // Assign lanes using display heights for overlapping bars
  const lanes = [];
  items.forEach(it => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] <= it.topMin - 4) {
        it.lane = i; 
        lanes[i] = it.topMin + it.heightInMinutes; 
        placed = true; 
        break;
      }
    }
    if (!placed) { 
      it.lane = lanes.length; 
      lanes.push(it.topMin + it.heightInMinutes); 
    }
  });

  // Calculate required timeline height based on content
  const maxEndTime = Math.max(...items.map(item => item.topMin + item.heightInMinutes));
  const requiredTimelineHeight = Math.max(720, maxEndTime * pxPerMin + 40); // 40px bottom padding

  // Generate lanes HTML
  const laneWidthPercent = 100 / Math.max(1, lanes.length);
  const palette = ['#e0f2fe','#f0f9ff','#fdf4ff','#fef7ed','#fef2f2','#fffbeb','#f0fdf4'];
  
  let lanesHTML = '';
  for (let i = 0; i < lanes.length; i++) {
    const laneStyle = `
      position: absolute;
      left: ${i * laneWidthPercent}%;
      width: ${laneWidthPercent}%;
      top: 0;
      height: ${requiredTimelineHeight}px;
    `;
    
    const barsInLane = items
      .filter(item => item.lane === i)
      .map(item => renderSurgeryBarHTML(item, pxPerMin, palette))
      .join('');
    
    lanesHTML += `<div class="dr-qh-lane" style="${laneStyle}">${barsInLane}</div>`;
  }

  // Render complete timeline with dynamic height
  const timelineHTML = `
    <div class="dr-qh-timeline">
      <div class="dr-qh-timegrid" style="height: ${requiredTimelineHeight}px;">
        ${renderTimeAxisHTML(startHour, endHour, requiredTimelineHeight)}
        <div class="dr-qh-lanes" style="height: ${requiredTimelineHeight}px;">${lanesHTML}</div>
      </div>
    </div>
  `;
  
  container.innerHTML = timelineHTML;
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
