// page.lichmo.homnay.refactored.js - Refactored surgery schedule using OTMTokenService

const { showToast } = require('../utils/uiUtils');
const { getSelectedKhoa } = require('../utils/khoaUtils');
const SurgeonSettingsService = require('../services/surgeonSettingsService');
const { createKhoaSelect } = require('../components/khoaSelect');
const OTMTokenService = require('../services/otm.token');

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
  
  // Patient name row
  if (s.customer && s.customer.fullname) rowCount++;
  
  // Surgery method row
  if (s.surgerymethod) rowCount++;
  
  // Doctors row
  const docs = [...(s.userexec || []), ...(s.userassistant || [])];
  if (docs.length > 0) rowCount++;
  
  // Diagnosis row
  if (s.diagnose) rowCount++;
  
  // Meta info row
  const meta = [s.khoaLuuTri, s.khoaDieuTri, s.phongDieuTri, s.giuongDieuTri].filter(Boolean);
  if (meta.length > 0) rowCount++;

  // Base height + row height * number of rows
  const baseHeight = 40;
  const rowHeight = 22;
  const paddingHeight = 28;
  
  return baseHeight + (rowCount * rowHeight) + paddingHeight;
}

function renderSurgeryTimeline(surgeries) {
  if (!Array.isArray(surgeries) || surgeries.length === 0) {
    return '<div class="dr-qh-empty">Không có lịch mổ nào trong ngày hôm nay</div>';
  }

  // Sort surgeries by start time
  const sorted = [...surgeries].sort(sortByStart);
  
  const startHour = 6;
  const endHour = 22;
  const timelineHeight = 720;
  const hoursSpan = endHour - startHour;

  const timeAxisHTML = renderTimeAxisHTML(startHour, endHour, timelineHeight);

  // Generate surgery event bars
  let eventsHTML = '';
  sorted.forEach((item, idx) => {
    const { s } = item;
    
    // Calculate position and height
    const startTime = s.start ? new Date(s.start) : null;
    const endTime = s.end ? new Date(s.end) : null;
    
    let topPercent = 0;
    let heightPixels = calculateContentHeight(item);
    
    if (startTime) {
      const startHours = startTime.getHours() + (startTime.getMinutes() / 60);
      const relativeStart = Math.max(0, Math.min(hoursSpan, startHours - startHour));
      topPercent = (relativeStart / hoursSpan) * 100;
      
      if (endTime) {
        const endHours = endTime.getHours() + (endTime.getMinutes() / 60);
        const relativeEnd = Math.max(relativeStart, Math.min(hoursSpan, endHours - startHour));
        const duration = relativeEnd - relativeStart;
        heightPixels = Math.max(heightPixels, (duration / hoursSpan) * timelineHeight);
      }
    }

    // Generate content rows
    let contentRows = '';
    
    // Operating room + time row
    const opRoom = s.operating_room || (s.room && s.room.name) || '';
    const timeRange = formatTimeRange(s.start, s.end);
    if (opRoom || timeRange) {
      contentRows += `
        <div class="row">
          <div class="or">${opRoom || 'Phòng mổ'}</div>
          <div class="time">${timeRange}</div>
        </div>
      `;
    }

    // Patient name row
    if (s.customer && s.customer.fullname) {
      contentRows += `
        <div class="row">
          <div class="patient">${s.customer.fullname}</div>
        </div>
      `;
    }

    // Surgery method row
    if (s.surgerymethod) {
      contentRows += `
        <div class="row">
          <div class="method">${s.surgerymethod}</div>
        </div>
      `;
    }

    // Doctors row
    const docs = [...(s.userexec || []), ...(s.userassistant || [])];
    if (docs.length > 0) {
      const docNames = docs.map(d => d.fullname).filter(Boolean).join(', ');
      contentRows += `
        <div class="row">
          <div class="docs">BS: ${docNames}</div>
        </div>
      `;
    }

    // Diagnosis row
    if (s.diagnose) {
      contentRows += `
        <div class="row">
          <div class="diagnose">${s.diagnose}</div>
        </div>
      `;
    }

    // Meta info row
    const meta = [s.khoaLuuTri, s.khoaDieuTri, s.phongDieuTri, s.giuongDieuTri].filter(Boolean);
    if (meta.length > 0) {
      contentRows += `
        <div class="row">
          <div class="meta">${meta.join(' • ')}</div>
        </div>
      `;
    }

    // Create event bar
    eventsHTML += `
      <div class="dr-qh-evtbar" style="top: ${topPercent}%; height: ${heightPixels}px; z-index: ${100 - idx};">
        ${contentRows}
      </div>
    `;
  });

  return `
    <div class="dr-qh-timegrid">
      ${timeAxisHTML}
      <div class="dr-qh-lanes">
        <div class="dr-qh-lane" style="height: ${timelineHeight}px;">
          ${eventsHTML}
        </div>
      </div>
    </div>
  `;
}

function renderLichMoPage() {
  stylesOnce();

  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <div class="dr-qh-lichmo-wrap">
      <div class="dr-qh-lichmo-head">
        <div class="dr-qh-lichmo-left">
          <h2 class="dr-qh-lichmo-title">Lịch mổ hôm nay</h2>
          <div class="dr-qh-lichmo-khoa" id="dr-qh-lichmo-khoa">Tất cả khoa</div>
        </div>
        <div class="dr-qh-lichmo-mid">
          <div class="dr-qh-lichmo-date">${dateStr}</div>
        </div>
        <div class="dr-qh-lichmo-right">
          <button class="dr-qh-lichmo-btn" id="dr-qh-lichmo-refresh">↻ Làm mới</button>
          <button class="dr-qh-lichmo-btn" id="dr-qh-lichmo-settings">⚙ Cài đặt</button>
          <div class="dr-qh-lichmo-status" id="dr-qh-lichmo-status">Sẵn sàng</div>
          <div class="dr-qh-lichmo-loading" id="dr-qh-lichmo-loading"></div>
        </div>
      </div>
      <div class="dr-qh-lichmo-content" id="dr-qh-lichmo-content">
        <div class="dr-qh-empty">Đang tải dữ liệu...</div>
      </div>
    </div>
  `;
}

// Transform raw surgery records into a lean structure required by the UI
function filterSurgeryData(records) {
  if (!Array.isArray(records)) return [];
  const result = [];
  for (const r of records) {
    const customerPid = r?.customer?.pid ?? r?.customer?.code ?? null;
    const operatingRoom = r?.operating_room ?? r?.room?.name ?? null;
    const item = {
      s: {
        customer: {
          fullname: r?.customer?.fullname ?? null,
          pid: customerPid,
          dob: r?.customer?.dob ?? null,
        },
        diagnose: r?.diagnose ?? null,
        surgerymethod: r?.surgerymethod ?? null,
        start: r?.start ?? null,
        end: r?.end ?? null,
        khoaLuuTri: r?.khoaLuuTri ?? null,
        khoaDieuTri: r?.khoaDieuTri ?? null,
        phongDieuTri: r?.phongDieuTri ?? null,
        giuongDieuTri: r?.giuongDieuTri ?? null,
        operating_room: operatingRoom,
        status: r?.status ?? null,
        userexec: Array.isArray(r?.userexec)
          ? r.userexec.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
          : [],
        userassistant: Array.isArray(r?.userassistant)
          ? r.userassistant.map(u => ({ fullname: u?.fullname ?? null, taid: u?.taid ?? null }))
          : [],
        room: r?.room || null
      }
    };
    result.push(item);
  }
  return result;
}

async function loadSurgeryData() {
  const loadingEl = document.getElementById('dr-qh-lichmo-loading');
  const statusEl = document.getElementById('dr-qh-lichmo-status');
  const contentEl = document.getElementById('dr-qh-lichmo-content');
  
  if (loadingEl) loadingEl.classList.add('active');
  if (statusEl) statusEl.textContent = 'Đang tải...';

  try {
    console.log('DEBUG - Starting direct OTM API fetch...');
    
    // Use OTMTokenService to fetch today's surgeries
    const today = new Date().toISOString().split('T')[0];
    const rawData = await OTMTokenService.fetchSurgeries(today, today);
    
    console.log('DEBUG - Raw OTM surgery data:', rawData);
    
    // Extract surgery array from response
    let surgeryArray = [];
    if (Array.isArray(rawData)) {
      surgeryArray = rawData;
    } else if (rawData && Array.isArray(rawData.data)) {
      surgeryArray = rawData.data;
    } else if (rawData && typeof rawData === 'object') {
      // Look for array in various possible properties
      const candidates = ['bookings', 'surgeries', 'items', 'records', 'results'];
      for (const prop of candidates) {
        if (Array.isArray(rawData[prop])) {
          surgeryArray = rawData[prop];
          break;
        }
      }
    }
    
    console.log('DEBUG - Extracted surgery array:', surgeryArray.length, 'items');
    
    // Transform data
    const surgeries = filterSurgeryData(surgeryArray);
    console.log('DEBUG - Filtered surgery data:', surgeries.length, 'items');
    
    // Apply surgeon filtering if any
    const selectedSurgeons = await SurgeonSettingsService.getSelectedSurgeons();
    const filteredSurgeries = filterBySelectedSurgeons(surgeries, selectedSurgeons);
    console.log('DEBUG - After surgeon filter:', filteredSurgeries.length, 'items');
    
    // Render timeline
    const timelineHTML = renderSurgeryTimeline(filteredSurgeries);
    if (contentEl) contentEl.innerHTML = timelineHTML;
    
    if (statusEl) statusEl.textContent = `${filteredSurgeries.length} ca mổ`;
    showToast(`Đã tải ${filteredSurgeries.length} ca mổ hôm nay`, 'success');
    
  } catch (error) {
    console.error('DEBUG - Error loading surgery data:', error);
    
    let errorMessage = 'Không thể tải dữ liệu lịch mổ';
    if (error.message === 'TOKEN_EXPIRED') {
      errorMessage = 'Token OTM đã hết hạn, vui lòng thử lại';
    } else if (error.message === 'NO_TOKEN') {
      errorMessage = 'Không có token OTM, vui lòng đăng nhập OTM trước';
    }
    
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="dr-qh-empty">
          <p>${errorMessage}</p>
          <button class="dr-qh-lichmo-btn" onclick="loadSurgeryData()">Thử lại</button>
        </div>
      `;
    }
    if (statusEl) statusEl.textContent = 'Lỗi';
    showToast(errorMessage, 'error');
  } finally {
    if (loadingEl) loadingEl.classList.remove('active');
  }
}

function attachEventListeners() {
  const refreshBtn = document.getElementById('dr-qh-lichmo-refresh');
  const settingsBtn = document.getElementById('dr-qh-lichmo-settings');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('DEBUG - Refresh button clicked');
      loadSurgeryData();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // Navigate to surgeon settings
      window.location.href = '?caidat&tab=otm-quanlyphauthuat';
    });
  }
}

function initLichMoPage() {
  console.log('DEBUG - Initializing Lich Mo page with OTMTokenService');
  
  // Render the page
  document.body.innerHTML = renderLichMoPage();
  
  // Attach event listeners
  attachEventListeners();
  
  // Load data
  loadSurgeryData();
}

module.exports = {
  initLichMoPage,
  renderLichMoPage,
  loadSurgeryData
};
