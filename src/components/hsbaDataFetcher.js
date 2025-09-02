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

// Allowed document names to keep from HSBA response
const ALLOWED_TENMAU = new Set([
	'Phiếu khám bệnh vào viện',
	'Phiếu khám tiền mê',
	'Biên bản hội chẩn duyệt mổ',
	'Phiếu khám chuyên khoa',
	'Phiếu cung cấp thông tin chẩn đoán, điều trị và chi phí',
	'Giấy cam đoan thực hiện Phẫu thuật, Thủ thuật và Gây mê hồi sức',
    'Phiếu tường trình phẫu thuật, thủ thuật',
    'Phiếu khám bệnh',
    'Toa thuốc ngoại trú'
]);

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

function renderResult(container, result) {
	// Render only filtered data (documents with allowed "tenmau")
	container.innerHTML = '';
	try { console.log('[DR][HSBA] filtered result received:', result); } catch(_) {}
	if (!result || !result.data || !result.data.hoSoBenhAns) {
		container.textContent = 'Không có dữ liệu HSBA.';
		return;
	}
	const hs = result.data.hoSoBenhAns;
	const items = Array.isArray(hs.items) ? hs.items : [];
	// Count only valid, displayable docs (have tenfile or fileName)
	const docCount = items.reduce((sum, it) => sum + (Array.isArray(it.hoSoChiTiet) ? it.hoSoChiTiet.reduce((s, g) => s + (Array.isArray(g.chiTiets) ? g.chiTiets.filter(x => (x && (x.tenfile || x.fileName) && x.tenmau)).length : 0), 0) : 0), 0);
	const summary = createEl('div', { style: { marginBottom: '8px' } }, [
		createEl('div', {}, `Tổng số đợt HSBA: ${hs.total != null ? hs.total : items.length}`),
		createEl('div', {}, `Số tài liệu đã lọc: ${docCount}`)
	]);
	container.appendChild(summary);

	if (items.length === 0) return;
	const outer = createEl('div', { className: 'dr-hsba-container', style: { maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' } });
	items.forEach((it, idx) => {
	const headerParts = [];
	if (it.hoten) headerParts.push(it.hoten);
	if (it.mabn) headerParts.push(it.mabn);
	if (it.tenkp) headerParts.push(it.tenkp);
	const ngayVaoDt = parseDateSafe(it.ngayvao);
	const ngayVaoStr = formatDateDDMMYYYY(ngayVaoDt);
	const header = createEl('div', { className: 'dr-hsba-episode-title', style: { fontWeight: '700', margin: '8px 0 6px', color: '#0f172a' } }, headerParts.concat(ngayVaoStr ? [ngayVaoStr] : []).join(' - '));
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
					if (!d.tenmau || !ALLOWED_TENMAU.has(d.tenmau)) {
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
					return ta - tb; // ascending
				});
			try { console.log('[DR][HSBA] group sorted docs:', { group: g.tengay || g.gayid, count: docs.length }); } catch(_) {}

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
					try {
						const tf = li.dataset.tenfile || '';
						if (!tf) {
							console.error('[DR][HSBA] click but missing data-tenfile');
							return;
						}
						const url = `https://hsba.tahospital.vn/api/hosobenhan/download?url=${encodeURIComponent(tf)}`;
						console.log('[DR][HSBA] opening file:', { tenfile: tf, url });
						window.open(url, '_blank');
					} catch (err) {
						console.error('[DR][HSBA] open file error:', err);
					}
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
						renderResult(resultBox, payload);
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
							renderResult(resultBox, payload);
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
																		g.chiTiets = g.chiTiets.filter(x => !x || !x.tenmau ? false : ALLOWED_TENMAU.has(x.tenmau));
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

