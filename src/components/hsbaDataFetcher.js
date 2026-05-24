// hsbaDataFetcher.js - Fetch HSBA V2 data via background tab and GraphQL

/*
Contract
- addHSBATab(rootEl, patient):
  - Adds a new tab button "HSBA Data" into `.checklist-tabs` within the provided rootEl (sidebar right column content)
  - Renders a tab pane with a Fetch button (id: dr-hsb-fetch-btn) to trigger the flow
  - Uses GM_openInTab to open the HSBA V2 link silently, waits for background tab to collect data on hsba.tahospital.vn, then displays results

- Background (auto-run when host === hsba.tahospital.vn):
  - Wait until the main grid appears (div.MuiGrid-root)
  - Parse pid from URL (public?pid=<...>)
  - Run fetch to /graphql using current domain’s cookies (no cross-origin hack)
  - Store results via GM_setValue under key `dr_hsba_result_${pid}`

Notes
- Requires Tampermonkey grants: GM_openInTab, GM_setValue, GM_addValueChangeListener (already used in this repo for GM_xmlhttpRequest)
- Falls back gracefully when grants aren’t available (opens in foreground and asks user to wait)
*/

const DialogManager = require('./dialogManager');
const ChecklistService = require('../services/checklistService');
const BS_CAI_DAT = (() => {
	try { return require('../BS_CAI_DAT_GIAO_DIEN'); } catch(_) { return (typeof window !== 'undefined' && window.BS_CAI_DAT) ? window.BS_CAI_DAT : {}; }
})();

// Track opened HSBA tabs by patient id to auto-close after data arrives
const HSBA_OPEN_TABS = new Map();
function registerOpenedTab(pid, ref) {
	try {
		const prev = HSBA_OPEN_TABS.get(pid);
		if (prev && typeof prev.close === 'function') {
			try { prev.close(); } catch(_) {}
		}
	} catch(_) {}
	HSBA_OPEN_TABS.set(pid, ref);
	try { console.log('[DR][HSBA] registered background tab for pid:', pid, ref); } catch(_) {}
}
function closeOpenedTab(pid, reason = 'done') {
	try {
		const ref = HSBA_OPEN_TABS.get(pid);
		if (ref && typeof ref.close === 'function') {
			try { ref.close(); console.log('[DR][HSBA] closed background tab (GM_openInTab) for pid:', pid, 'reason:', reason); } catch(e) { console.warn('[DR][HSBA] close tab error:', e); }
		} else if (ref && typeof ref === 'object' && 'close' in ref) {
			try { ref.close(); console.log('[DR][HSBA] closed background window for pid:', pid, 'reason:', reason); } catch(e) { console.warn('[DR][HSBA] close window error:', e); }
		} else {
			console.warn('[DR][HSBA] no tabRef to close for pid:', pid, 'reason:', reason);
		}
	} catch(e) { console.warn('[DR][HSBA] closeOpenedTab exception:', e); }
	HSBA_OPEN_TABS.delete(pid);
}

// Build rules from BS_CAI_DAT.HSBA_CHECKLIST_MAP (array of rule objects)
// Preprocess rules to support case-insensitive "like" matching on `tenmau` (substring match)
const __HSBA_RULES__ = Array.isArray(BS_CAI_DAT.HSBA_CHECKLIST_MAP) ? BS_CAI_DAT.HSBA_CHECKLIST_MAP : [];
const HSBA_RULES_PROCESSED = __HSBA_RULES__.map(r => {
	const tenmauNorm = r && r.tenmau ? String(r.tenmau).toLowerCase().trim() : null;
	return { ...r, tenmauNorm };
});

function matchRuleByTenmau(tenmau, rule) {
	if (!tenmau || !rule || !rule.tenmauNorm) return false;
	try { return String(tenmau).toLowerCase().includes(rule.tenmauNorm); } catch (_) { return false; }
}

function shouldShowTenmau(docTenmau) {
	return HSBA_RULES_PROCESSED.some(r => r && r.show && matchRuleByTenmau(docTenmau, r));
}

function shouldSyncTenmau(docTenmau) {
	return HSBA_RULES_PROCESSED.some(r => r && r.sync && matchRuleByTenmau(docTenmau, r));
}

function tenmauToChecklist(docTenmau) {
	const found = HSBA_RULES_PROCESSED.find(r => r && r.sync && r.checklist && matchRuleByTenmau(docTenmau, r));
	return found ? found.checklist : null;
}

function createEl(tag, attrs = {}, children = []) {
	const el = document.createElement(tag);
	Object.entries(attrs).forEach(([k, v]) => {
		if (k === 'style' && typeof v === 'object') {
			Object.assign(el.style, v);
		} else if (k === 'dataset' && v && typeof v === 'object') {
			Object.entries(v).forEach(([dk, dv]) => el.dataset[dk] = dv);
		} else if (k in el) {
			try { el[k] = v; } catch(_) { el.setAttribute(k, v); }
		} else {
			el.setAttribute(k, v);
		}
	});
	(Array.isArray(children) ? children : [children]).forEach(c => {
		if (c == null) return;
		if (typeof c === 'string') el.appendChild(document.createTextNode(c));
		else el.appendChild(c);
	});
	return el;
}

function formatDateYYYYMMDD(d = new Date()) {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function parseDateSafe(s) {
	if (!s || typeof s !== 'string') return null;
	// Try ISO first; fallback to replace spaces
	let dt = new Date(s);
	if (isNaN(dt.getTime())) {
		try { dt = new Date(s.replace(' ', 'T')); } catch(_) {}
	}
	return isNaN(dt.getTime()) ? null : dt;
}

function formatDateDDMMYYYY(dt) {
	if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
	const dd = String(dt.getDate()).padStart(2, '0');
	const mm = String(dt.getMonth() + 1).padStart(2, '0');
	const yyyy = dt.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}

function formatDateTimeDDMMYYYYHHmm(dt) {
	if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
	const ddmmyyyy = formatDateDDMMYYYY(dt);
	const hh = String(dt.getHours()).padStart(2, '0');
	const mi = String(dt.getMinutes()).padStart(2, '0');
	return `${ddmmyyyy} ${hh}:${mi}`;
}

async function getHSBAV2Link(mabn) {
	try {
		const res = await fetch('/ToDieuTri/LoadLinkHsba', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-Requested-With': 'XMLHttpRequest'
			},
			credentials: 'include',
			body: 'code=' + encodeURIComponent(mabn)
		});
		const json = await res.json();
		if (json && json.data && json.data.link) return json.data.link;
		return `/hoso/${encodeURIComponent(String(mabn))}`; // fallback v1
	} catch (e) {
		return `/hoso/${encodeURIComponent(String(mabn))}`; // fallback v1
	}
}

function renderResult(container, result, ctx = {}) {
	// Render only filtered data (documents with allowed "tenmau")
	container.innerHTML = '';
	try { console.log('[DR][HSBA] filtered result received:', result); } catch(_) {}
	if (!result || !result.data || !result.data.hoSoBenhAns) {
		container.textContent = 'Không có dữ liệu HSBA.';
		return;
	}
	const hs = result.data.hoSoBenhAns;
	const rawItems = Array.isArray(hs.items) ? hs.items : [];
	// Filter: skip episodes with hoten === null (do not display)
	const items = rawItems.filter(it => it && it.hoten != null);
	// Count only valid, displayable docs (have tenfile or fileName)
	const docCount = items.reduce((sum, it) => sum + (Array.isArray(it.hoSoChiTiet) ? it.hoSoChiTiet.reduce((s, g) => s + (Array.isArray(g.chiTiets) ? g.chiTiets.filter(x => (x && (x.tenfile || x.fileName) && x.tenmau)).length : 0), 0) : 0), 0);
	const summary = createEl('div', { style: { marginBottom: '8px' } }, [
		createEl('div', {}, `Tổng số đợt HSBA: ${hs.total != null ? hs.total : items.length}`),
		createEl('div', {}, `Số tài liệu đã lọc: ${docCount}`)
	]);
	container.appendChild(summary);

	if (items.length === 0) return;

	// Determine current episode: prefer one with ngayra null, otherwise the latest by ngayvao
	const pickEpisode = () => {
		const open = items.filter(it => !it.ngayra);
		const arr = (open.length ? open : items).slice();
		arr.sort((a,b) => {
			const ta = parseDateSafe(a.ngayvao)?.getTime() || 0;
			const tb = parseDateSafe(b.ngayvao)?.getTime() || 0;
			return tb - ta; // newest first
		});
		return arr[0] || null;
	};
	const currentEpisode = pickEpisode();

	// From current episode, compute HSBA doc matches and persist to checklist state
	try {
		if (currentEpisode && Array.isArray(currentEpisode.hoSoChiTiet)) {
			const epStart = parseDateSafe(currentEpisode.ngayvao);
			const epEnd = parseDateSafe(currentEpisode.ngayra);
			const startTs = epStart ? epStart.getTime() : -Infinity;
			const endTs = epEnd ? epEnd.getTime() : Infinity;
			const docSet = new Set();
			let latestDocDates = {};
			currentEpisode.hoSoChiTiet.forEach(g => {
				(Array.isArray(g.chiTiets) ? g.chiTiets : []).forEach(d => {
					if (!d || !d.tenmau) return;
					if (!shouldSyncTenmau(d.tenmau)) return;
					// Only consider documents within the current episode date range
					const dDate = parseDateSafe(d.ngay);
					if (!dDate) return;
					const ts = dDate.getTime();
					if (ts < startTs || ts > endTs) return;
					docSet.add(d.tenmau);
					const prev = latestDocDates[d.tenmau] || 0;
					if (ts > prev) latestDocDates[d.tenmau] = ts;
				});
			});
			const nowIso = new Date().toISOString();
			const mapLookup = tenmauToChecklist;
			const hsbaSynced = Object.create(null);
			for (const tenmau of docSet) {
				const target = mapLookup(tenmau);
				if (!target) continue;
				const dateTs = latestDocDates[tenmau] || 0;
				hsbaSynced[target] = {
					matched: true,
					source: 'hsba',
					docName: tenmau,
					docDate: dateTs ? new Date(dateTs).toISOString() : null,
					updatedAt: nowIso
				};
			}
			if (Object.keys(hsbaSynced).length) {
				// Merge into window.checklistState only when the effective mapping changed.
				if (!window.checklistState) window.checklistState = {};
				const prev = window.checklistState.hsbaSynced || {};
				const stripMeta = (obj) => {
					const result = {};
					Object.keys(obj || {}).forEach((key) => {
						if (key === '__lastSyncAt') return;
						result[key] = obj[key];
					});
					return result;
				};
				const prevComparable = JSON.stringify(stripMeta(prev));
				const nextComparable = JSON.stringify(stripMeta({ ...prev, ...hsbaSynced }));
				if (prevComparable !== nextComparable) {
					window.checklistState.hsbaSynced = { ...prev, ...hsbaSynced, __lastSyncAt: nowIso };
					if (window.checklistObj && ChecklistService && typeof ChecklistService.updateChecklistState === 'function') {
						ChecklistService.updateChecklistState(window.checklistObj, window.checklistState, { enqueueOnOffline: true, ctxId: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.id), signal: (window.dr_sidebar_ctx && window.dr_sidebar_ctx.signal) })
							.then(() => {
								try { if (typeof window.dr_refreshChecklistBadges === 'function') window.dr_refreshChecklistBadges(); } catch(_) {}
							})
							.catch(() => {});
					} else {
						try { if (typeof window.dr_refreshChecklistBadges === 'function') window.dr_refreshChecklistBadges(); } catch(_) {}
					}
				}
			}
		}
	} catch(_) {}
	const outer = createEl('div', { className: 'dr-hsba-container', style: { maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' } });
	items.forEach((it, idx) => {
	const headerParts = [];
	if (it.hoten) headerParts.push(it.hoten);
	if (it.mabn) headerParts.push(it.mabn);
	if (it.tenkp) headerParts.push(it.tenkp);
	const ngayVaoDt = parseDateSafe(it.ngayvao);
	const ngayVaoStr = formatDateDDMMYYYY(ngayVaoDt);
	const header = createEl('div', { className: 'dr-hsba-episode-title', style: { fontWeight: '700', margin: '8px 0 6px', color: '#fff', background: '#1976d2' } }, headerParts.concat(ngayVaoStr ? [ngayVaoStr] : []).join(' - '));
		outer.appendChild(header);
		const groups = Array.isArray(it.hoSoChiTiet) ? it.hoSoChiTiet : [];
	groups.forEach(g => {
			const rawDocs = Array.isArray(g.chiTiets) ? g.chiTiets : [];
			if (!rawDocs.length) return;
			const gTitle = createEl('div', { className: 'dr-hsba-group-title', style: { fontWeight: '600', margin: '4px 0', color: '#334155' } }, `${g.tengay || g.gayid || 'Mục'}:`);
			outer.appendChild(gTitle);
			const ul = createEl('ul', { className: 'dr-hsba-list', style: { margin: 0, paddingLeft: '18px', listStyle: 'disc' } });
			// Build displayable docs: must have tenmau and tenfile/fileName
			const docs = rawDocs
				.map(d => ({
					...d,
					_tenfile: d && (d.tenfile || d.fileName) || '',
					_date: parseDateSafe(d && d.ngay)
				}))
				.filter(d => {
					if (!d) return false;
					if (!d.tenmau || !shouldShowTenmau(d.tenmau)) {
						try { console.debug('[DR][HSBA] skip doc (tenmau not allowed):', d); } catch(_) {}
						return false;
					}
					if (!d._tenfile) {
						try { console.warn('[DR][HSBA] skip doc (missing tenfile):', d); } catch(_) {}
						return false;
					}
					return true;
				})
				.sort((a, b) => {
					const ta = a._date ? a._date.getTime() : -Infinity;
					const tb = b._date ? b._date.getTime() : -Infinity;
					return tb - ta; // descending (newest first)
				});
			try { console.log('[DR][HSBA] group sorted docs:', { group: g.tengay || g.gayid, count: docs.length }); } catch(_) {}

	    const openViewer = async (tenfile, tenmau, ngayDisplay) => {
				try {
					const patient = ctx && ctx.patient;
					const mabn = patient && (patient.pid || patient.mabn);
					if (!mabn) {
						console.error('[DR][HSBA] openViewer: missing mabn');
						return;
					}
					// Get a fresh HSBA V2 link with tokens (pid/s/t/site) and append hash with file to view inline
					const baseLink = await getHSBAV2Link(mabn);
		    const parts = [];
		    parts.push(`dr-viewer=${encodeURIComponent(tenfile)}`);
		    if (tenmau) parts.push(`dr-name=${encodeURIComponent(tenmau)}`);
		    if (ngayDisplay) parts.push(`dr-date=${encodeURIComponent(ngayDisplay)}`);
		    const hash = parts.join('&');
		    const url = `${baseLink}${baseLink.includes('#') ? '' : '#'}${baseLink.includes('#') ? '&' : ''}${hash}`;
		    console.log('[DR][HSBA] opening inline viewer:', { mabn, tenfile, tenmau, ngayDisplay, url });
					window.open(url, '_blank');
				} catch (err) {
					console.error('[DR][HSBA] openViewer error:', err);
				}
			};

			docs.forEach(d => {
				const nd = d._date || parseDateSafe(d && d.ngay);
				const ngayFmt = formatDateTimeDDMMYYYYHHmm(nd) || (d && d.ngay) || '';
				const label = `${d.tenmau} - ${ngayFmt}`;
				const li = createEl('li', {
					className: 'dr-hsba-item',
					title: 'Mở tài liệu ở tab mới',
					dataset: { tenfile: d._tenfile },
					style: { cursor: 'pointer', padding: '2px 0' }
				}, label);
				li.addEventListener('click', () => {
					const tf = li.dataset.tenfile || '';
					if (!tf) {
						console.error('[DR][HSBA] click but missing data-tenfile');
						return;
					}
					openViewer(tf, d.tenmau, ngayFmt);
				});
				ul.appendChild(li);
			});
			outer.appendChild(ul);
		});
		if (idx < items.length - 1) outer.appendChild(createEl('hr', { style: { border: 'none', borderTop: '1px dashed #e5e7eb', margin: '8px 0' } }));
	});
	container.appendChild(outer);
}

function attachTabToggleBehavior(rootEl) {
	const tabs = rootEl.querySelectorAll('.checklist-tabs .tab-btn');
	const panes = rootEl.querySelectorAll('.tab-content .tab-pane');
	tabs.forEach(btn => {
		if (btn.__drBound) return;
		btn.__drBound = true;
		btn.addEventListener('click', function() {
			const targetTab = this.getAttribute('data-tab');
			tabs.forEach(b => { b.classList.remove('active'); b.style.background = 'transparent'; b.style.color = '#666'; b.style.fontWeight = 'normal'; });
			this.classList.add('active');
			this.style.background = '#0ea5e9';
			this.style.color = '#fff';
			this.style.fontWeight = 'bold';
			panes.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
			const pane = rootEl.querySelector(`.tab-pane[data-tab="${targetTab}"]`);
			if (pane) { pane.classList.add('active'); pane.style.display = 'block'; }
		});
	});
}

function addHSBATab(rootEl, patient) {
	try {
		if (!rootEl) return;
		const tabsBar = rootEl.querySelector('.checklist-tabs');
		const tabContent = rootEl.querySelector('.tab-content');
		if (!tabsBar || !tabContent) return;

		// Avoid duplicate
		if (tabsBar.querySelector('#dr-hsba-tab-btn')) return;

		const btn = createEl('button', {
			id: 'dr-hsba-tab-btn',
			className: 'tab-btn',
			dataset: { tab: 'hsba' },
			style: {
				padding: '8px 16px', border: 'none', background: 'transparent', color: '#666',
				borderRadius: '4px 4px 0 0', cursor: 'pointer', marginLeft: '4px'
			}
		}, 'HSBA Data');
		tabsBar.appendChild(btn);

		const pane = createEl('div', {
			className: 'tab-pane',
			dataset: { tab: 'hsba' },
			style: { display: 'none' }
		});

		const status = createEl('div', { id: 'dr-hsba-status', style: { margin: '6px 0', color: '#0f172a' } });
		const resultBox = createEl('div', { id: 'dr-hsba-result', style: { fontSize: '13px' } });
		const btnFetch = createEl('button', {
			id: 'dr-hsb-fetch-btn',
			className: 'btn btn-primary',
			style: { padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }
		}, 'Lấy HSBA từ file');
		// When clicking the HSBA tab, auto-fetch if there is no data yet
		btn.addEventListener('click', () => {
			try {
				const empty = !resultBox || (!resultBox.firstChild && !String(resultBox.textContent || '').trim());
				if (empty) {
					btnFetch.click();
				}
			} catch (_) {}
		});
		btnFetch.addEventListener('click', async () => {
			// Defensive: ensure patient exists
			const mabn = patient && (patient.pid || patient.mabn);
			if (!mabn) { status.textContent = 'Không tìm thấy MABN.'; return; }
			status.textContent = 'Đang mở HSBA V2 trong nền...';
			const link = await getHSBAV2Link(mabn);
			let tabRef = null;
			try {
				if (typeof GM_openInTab === 'function') {
					tabRef = GM_openInTab(link, { active: false, insert: true });
					registerOpenedTab(String(mabn), tabRef);
				} else {
					const w = window.open(link, '_blank');
					if (w) registerOpenedTab(String(mabn), w);
				}
			} catch(_) {
				const w = window.open(link, '_blank');
				if (w) registerOpenedTab(String(mabn), w);
			}

			// Result key for cross-tab delivery
			const key = `dr_hsba_result_${mabn}`;
			// 1) Realtime listener when supported
			if (typeof GM_addValueChangeListener === 'function') {
		GM_addValueChangeListener(key, function(name, oldVal, newVal, remote) {
					if (!remote || !newVal) return;
					try {
						const payload = typeof newVal === 'string' ? JSON.parse(newVal) : newVal;
						try { console.log('[DR][HSBA] payload received via listener:', payload); } catch(_) {}
						renderResult(resultBox, payload, { patient });
						status.textContent = 'Đã lấy HSBA.';
			// Close the background tab for this patient
			setTimeout(() => closeOpenedTab(String(mabn), 'listener'), 300);
					} catch (e) {
						status.textContent = 'Lỗi phân tích dữ liệu HSBA.';
						console.warn(e);
					}
				});
			}
			// 2) Polling fallback when listener is unavailable or unreliable
			let attempts = 0;
			const maxAttempts = 60; // ~60s
			if (typeof GM_getValue === 'function') {
				const iv = setInterval(async () => {
					try {
						attempts++;
						const raw = await GM_getValue(key, null);
						if (raw) {
							clearInterval(iv);
							const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
							try { console.log('[DR][HSBA] payload received via polling:', payload); } catch(_) {}
							renderResult(resultBox, payload, { patient });
							status.textContent = 'Đã lấy HSBA.';
							// Close the background tab for this patient
							setTimeout(() => closeOpenedTab(String(mabn), 'polling'), 300);
							return;
						}
						if (attempts === 5 && !resultBox.firstChild) {
							status.textContent = 'Đang chờ HSBA tải xong... (có thể 5–15s)';
						}
						if (attempts >= maxAttempts) {
							clearInterval(iv);
							if (!resultBox.firstChild) status.textContent = 'Hết thời gian chờ HSBA.';
						}
					} catch (_) {}
				}, 1000);
			} else if (!resultBox.firstChild) {
				status.textContent = 'Không hỗ trợ lắng nghe nền. Hãy chuyển sang tab HSBA để tải xong, rồi quay lại.';
			}
		});

		pane.appendChild(btnFetch);
		pane.appendChild(status);
		pane.appendChild(resultBox);
		tabContent.appendChild(pane);

		// Bind toggle behavior (for newly added button)
		attachTabToggleBehavior(rootEl);
	} catch (e) {
		console.warn('addHSBATab error', e);
	}
}

// Background worker on hsba.tahospital.vn — auto-fetch GraphQL and publish via GM_setValue
async function hsbaBackgroundFetcherIfNeeded() {
	try {
		if (typeof window === 'undefined') return;
		if (window.location.hostname !== 'hsba.tahospital.vn') return;
	const params = new URLSearchParams(window.location.search);
	const pid = params.get('pid');
	const s = params.get('s') || '';
	const t = params.get('t') || '';
	const site = params.get('site') || '1';
		if (!pid) return;

		function waitForGrid() {
			return new Promise(resolve => {
				// Prefer the explicit container; fallback to generic grid if classnames change
				const targetSelectors = [
					'div.MuiGrid-root'
				];
				if (targetSelectors.some(q => document.querySelector(q))) return resolve(true);
				const obs = new MutationObserver(() => {
					if (targetSelectors.some(q => document.querySelector(q))) {
						obs.disconnect();
						resolve(true);
					}
				});
				obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
				// Fallback timeout
				setTimeout(() => { try { obs.disconnect(); } catch(_) {} resolve(true); }, 15000);
			});
		}

		await waitForGrid();

		const today = formatDateYYYYMMDD(new Date());
		const body = {
			operationName: 'hoSoBenhAns',
			variables: {
				mabn: String(pid),
				tuNgay: '2024-01-01',
				denNgay: today,
				offset: 0,
				limit: 1000
			},
			query: `query hoSoBenhAns($mabn: String, $tuNgay: DateTime, $denNgay: DateTime, $daKy: Boolean, $offset: Int, $limit: Int, $makp: String, $raVien: Boolean) {
  hoSoBenhAns(
	mabn: $mabn
	tuNgay: $tuNgay
	denNgay: $denNgay
	daKy: $daKy
	offset: $offset
	limit: $limit
	makp: $makp
	raVien: $raVien
  ) {
	items {
	  mabn
	  hoten
	  ngaysinh
	  phai
	  diachi
	  mavaovien
	  sovaovien
	  doituong
	  tenkp
	  ngayvao
	  ngayra
	  chandoan
	  tenba
	  ngayky
	  loai
	  dienthoai
	  tenfile
	  fileName
	  tuoi
	  daky
	  maql
	  tennguoiky
	  coTheKyTong
	  ChiDinhNgoai
	  nguoiky
	  hoSoChiTiet {
		stt
		gayid
		tengay
		chiTiets {
		  id
		  tenfile
		  fileName
		  ngay
		  tenmau
		  daky
		  coTheKyChiTiet
		  congkhai
		  maql
		  BieuMau {
			id
			maphieu
			stt
			gayid
			slkyso
			ghichu
			loaiphieu
			trangthai
			chophepxoa
			congkhai
			xemtomtat
			NhomBieuMau {
			  id
			  ten
			  __typename
			}
			__typename
		  }
		  __typename
		}
		__typename
	  }
	  loaidieutri
	  __typename
	}
	total
	offset
	limit
	__typename
  }
}`
		};

				// Inject a main-world script that performs the fetch with the exact headers and posts the result back
				try {
						if (!window.__dr_hsba_injected__) {
								window.__dr_hsba_injected__ = true;
								// Listen for result from main world and persist via GM_setValue
								window.addEventListener('message', (ev) => {
										try {
												const d = ev && ev.data;
												if (!d || d.type !== 'DR_HSBA_RESULT' || d.pid !== pid) return;
												// Filter payload to only keep allowed tenmau docs
												let filtered = d.payload || {};
												try {
													const src = d.payload;
													if (src && src.data && src.data.hoSoBenhAns) {
														const cloned = JSON.parse(JSON.stringify(src));
														const items = Array.isArray(cloned.data.hoSoBenhAns.items) ? cloned.data.hoSoBenhAns.items : [];
														items.forEach(it => {
															if (Array.isArray(it.hoSoChiTiet)) {
																it.hoSoChiTiet.forEach(g => {
																	if (Array.isArray(g.chiTiets)) {
																		g.chiTiets = g.chiTiets.filter(x => !x || !x.tenmau ? false : shouldShowTenmau(x.tenmau));
																	}
																});
															}
														});
														filtered = cloned;
													}
												} catch(_) {}
												if (typeof GM_setValue === 'function') {
														GM_setValue(`dr_hsba_result_${pid}`, JSON.stringify(filtered));
												} else {
														window.__dr_hsba_result__ = filtered;
												}
										} catch(_) {}
								});
												const refUrl = `${window.location.origin}/public?pid=${encodeURIComponent(pid)}&t=${encodeURIComponent(t)}&s=${encodeURIComponent(s)}&site=${encodeURIComponent(site)}`;
								const script = document.createElement('script');
								script.type = 'text/javascript';
								script.textContent = `(() => {
	try {
		const pid = ${JSON.stringify(pid)};
		const s = ${JSON.stringify(s)};
		const t = ${JSON.stringify(t)};
		const site = ${JSON.stringify(String(site))};
		const body = ${JSON.stringify(body)};
		const referrer = ${JSON.stringify(refUrl)};
						const headers = {
							"accept": "*/*",
							"accept-language": "en-US,en;q=0.9,vi;q=0.8",
							"content-type": "application/json",
							pid: String(pid),
							priority: "u=1, i",
							s: s,
							site: String(site),
							t: t
						};

						// Inline viewer: if URL hash has dr-viewer, fetch the file and render via blob URL
						const showInlineViewer = (filePath, docName, docDate) => {
							try {
								const overlay = document.createElement('div');
								overlay.id = 'dr-hsba-viewer-overlay';
								overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.75);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:0;width:100vw;height:100vh;';
								overlay.setAttribute('role', 'dialog');
								overlay.setAttribute('aria-modal', 'true');
								const frameWrap = document.createElement('div');
								frameWrap.id = 'dr-hsba-viewer-framewrap';
								frameWrap.style.cssText = 'background:#fff;width:100vw;height:100vh;box-shadow:0 10px 30px rgba(0,0,0,0.4);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;margin:0;';
								const bar = document.createElement('div');
								bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:#0ea5e9;color:#fff;font-weight:700;';
								const title = document.createElement('span');
								title.textContent = 'Xem tài liệu HSBA';
								const actions = document.createElement('div');
								actions.style.cssText = 'display:flex;gap:8px;align-items:center;';
								const btnDownload = document.createElement('button');
								btnDownload.id = 'dr-hsba-viewer-download';
								btnDownload.textContent = 'Tải xuống';
								btnDownload.style.cssText = 'background:#fff;color:#0f172a;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;';
								const prevOverflow = document.body && document.body.style ? document.body.style.overflow : '';
								let currentBlobUrl = null;
								const revokeUrl = () => { try { if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; } } catch(_) {} };
								const doClose = () => { try { revokeUrl(); if (document.body) document.body.style.overflow = prevOverflow || ''; overlay.remove(); } catch(_) {} };
								actions.appendChild(btnDownload);
								bar.appendChild(title);
								bar.appendChild(actions);
								const iframe = document.createElement('iframe');
								iframe.id = 'dr-hsba-viewer-iframe';
								iframe.style.cssText = 'flex:1;border:0;background:#1f2937';
								frameWrap.appendChild(bar);
								frameWrap.appendChild(iframe);
								overlay.appendChild(frameWrap);
								if (document && document.body) { document.body.style.overflow = 'hidden'; }
								(document.body || document.documentElement).appendChild(overlay);
				// ESC disabled per requirements
				const getFileName = () => {
									try {
					const sanitize = (s) => (s || '').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
					const namePart = sanitize(docName || 'HSBA');
					const datePart = sanitize(docDate || '');
					const combined = (namePart + (datePart ? ' - ' + datePart : '')).trim() || 'hsba-document';
					return combined + '.pdf';
									} catch(_) { return 'hsba-document.pdf'; }
								};
								const fileName = getFileName();
								const triggerDownload = () => {
									try {
										if (currentBlobUrl) {
											const a = document.createElement('a');
											a.href = currentBlobUrl;
											a.download = fileName;
											document.body.appendChild(a);
											a.click();
											a.remove();
										} else {
											// Fallback: navigate to API to download with credentials
											const a = document.createElement('a');
											a.href = '/api/hosobenhan/download?url=' + encodeURIComponent(filePath);
											a.target = '_blank';
											a.rel = 'noopener';
											document.body.appendChild(a);
											a.click();
											a.remove();
										}
									} catch(_) {}
								};
								btnDownload.onclick = () => triggerDownload();
								fetch('/api/hosobenhan/download?url=' + encodeURIComponent(filePath), { credentials: 'include' })
									.then(r => r.blob())
									.then(blob => {
										const u = URL.createObjectURL(blob);
										currentBlobUrl = u;
										iframe.src = u;
									})
									.catch(err => {
										console.error('[DR][HSBA] viewer fetch error:', err);
										doClose();
									});
							} catch (e) { console.error('[DR][HSBA] viewer error:', e); }
						};

						try {
							const h = window.location.hash || '';
							const m = h.match(/[#&]dr-viewer=([^&]+)/);
							if (m && m[1]) {
								const filePath = decodeURIComponent(m[1]);
								console.log('[DR][HSBA] inline viewer param detected:', filePath);
								let name = null, dateLabel = null;
								const n = h.match(/[#&]dr-name=([^&]+)/);
								if (n && n[1]) name = decodeURIComponent(n[1]);
								const d2 = h.match(/[#&]dr-date=([^&]+)/);
								if (d2 && d2[1]) dateLabel = decodeURIComponent(d2[1]);
								showInlineViewer(filePath, name, dateLabel);
							}
						} catch(_) {}
						fetch("/graphql", {
							headers,
			referrer: referrer,
			body: JSON.stringify(body),
			method: "POST",
			mode: "cors",
			credentials: "include"
		}).then(r => r.json()).then(json => {
			try { console.log('[DR][HSBA] raw API response:', json); } catch(_) {}
			window.postMessage({ type: 'DR_HSBA_RESULT', pid, payload: json }, '*');
		}).catch(err => {
			window.postMessage({ type: 'DR_HSBA_RESULT', pid, payload: { error: String(err && err.message || err) } }, '*');
		});
	} catch (e) {
		try { window.postMessage({ type: 'DR_HSBA_RESULT', pid: ${JSON.stringify(pid)}, payload: { error: String(e && e.message || e) } }, '*'); } catch(_) {}
	}
})();`;
								(document.head || document.documentElement || document.body).appendChild(script);
								// Optional: remove the script node after injected
								setTimeout(() => { try { script.remove(); } catch(_) {} }, 1000);
						}
				} catch(_) {}
	} catch (e) {
		// Swallow errors to avoid impacting page
		console.warn('hsbaBackgroundFetcherIfNeeded error', e);
	}
}

// Run background fetcher immediately on hsba domain
try { hsbaBackgroundFetcherIfNeeded(); } catch(_) {}

module.exports = { addHSBATab };

