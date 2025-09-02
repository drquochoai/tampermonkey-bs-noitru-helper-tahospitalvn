// copyDienTienAI.js
// Inject a "Copy diễn tiến" button on /to-dieu-tri and copy all PDF text to clipboard using pdf.js

function isToDieuTriPage() {
    try {
        return /\/to-dieu-tri(\?.*)?$/.test(window.location.pathname);
    } catch (_) { return false; }
}

function getMabnFromUrl() {
    try {
        const u = new URL(window.location.href);
        return u.searchParams.get('mabn') || '';
    } catch (_) { return ''; }
}

function ensureStatusBar(container) {
    let bar = document.getElementById('dr-copy-dien-tien-status');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'dr-copy-dien-tien-status';
        bar.style.cssText = 'margin-top:8px; font-size:12px; color:#0f172a;';
        container.appendChild(bar);
    }
    return bar;
}

// Helper to set status text with optional auto-clear after 4s
function setStatus(bar, text, color, autoClear = false) {
    if (!bar) return;
    try { if (bar.__statusTimer) { clearTimeout(bar.__statusTimer); bar.__statusTimer = null; } } catch(_) {}
    if (typeof text === 'string') bar.textContent = text;
    if (color) bar.style.color = color;
    if (autoClear) {
        bar.__statusTimer = setTimeout(() => {
            try { bar.textContent = ''; } catch(_) {}
        }, 4000);
    }
}

async function loadPdfJsIfNeeded() {
    const getLib = () => (window.pdfjsLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.pdfjsLib : undefined));
    if (getLib()) {
        // worker may still need to be set
        try {
            const lib = getLib();
            if (lib && lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
        } catch(_) {}
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js';
    script.referrerPolicy = 'no-referrer';
    const p = new Promise((resolve, reject) => {
        script.onload = () => {
            try {
                // bridge between page and userscript contexts
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow.pdfjsLib && !window.pdfjsLib) {
                    try { window.pdfjsLib = unsafeWindow.pdfjsLib; } catch(_) {}
                }
                const lib = getLib();
                if (lib && lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
            } catch(_) {}
            resolve();
        };
        script.onerror = () => reject(new Error('Không tải được pdf.js'));
    });
    document.head.appendChild(script);
    await p;
}

async function fetchPatientInfo(mabn) {
    const body = 'code=' + encodeURIComponent(mabn);
    const res = await fetch('/ToDieuTri/GetPatient', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'accept': '*/*'
        },
        credentials: 'include',
        body
    });
    if (!res.ok) throw new Error('Lỗi GetPatient: ' + res.status);
    const json = await res.json();
    if (!json || json.isValid === false || !json.data || !json.data[0]) throw new Error('Dữ liệu GetPatient không hợp lệ');
    return json.data[0];
}

function parseMMDDYYYYtoDDMMYYYY(dateTimeStr) {
    if (!dateTimeStr) return '';
    // Expect "MM/DD/YYYY HH:mm:ss" or "MM/DD/YYYY"
    const [datePart] = String(dateTimeStr).split(' ');
    const [mm, dd, yyyy] = datePart.split('/');
    if (!mm || !dd || !yyyy) return '';
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
}

function todayDDMMYYYY() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

async function fetchPdfArrayBuffer(url) {
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    if (!res.ok) throw new Error('Lỗi tải PDF: ' + res.status);
    return await res.arrayBuffer();
}

async function extractAllTextFromPdfBuffer(buffer) {
    await loadPdfJsIfNeeded();
    const pdfjsLib = (window.pdfjsLib || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.pdfjsLib : undefined));
    if (!pdfjsLib || !pdfjsLib.getDocument) throw new Error('pdfjsLib chưa sẵn sàng');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    let out = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(it => it.str).filter(Boolean);
        out.push(strings.join(' '));
    }
    return out.join('\n\n');
}

// Sanitize sensitive info before copying to clipboard
function sanitizeCopiedText(text) {
    if (!text) return '';
    let t = String(text);
    // Remove from "Họ và tên:" to the first '-' character (inclusive), not to newline
    t = t.replace(/Họ\s+và\s+tên:\s*[^-]*-\s*/gi, '');
    return t;
}

async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch(_) {}
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
    } catch(_) { return false; }
}

function injectButton() {
    if (!isToDieuTriPage()) return;
    const host = document.getElementById('LoadToDieuTri');
    if (!host) return;
    if (document.getElementById('dr-copy-dien-tien-forAI')) return; // already added

    const wrap = document.createElement('div');
    wrap.style.margin = '6px 0 10px 0';

    const btn = document.createElement('button');
    btn.id = 'dr-copy-dien-tien-forAI';
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-success';
    btn.textContent = 'Copy diễn tiến';

    // Secondary "copy again" icon button
    const btnCopyAgain = document.createElement('button');
    btnCopyAgain.type = 'button';
    btnCopyAgain.title = 'Copy lại';
    btnCopyAgain.className = 'btn btn-sm btn-outline-secondary';
    btnCopyAgain.style.marginLeft = '6px';
    btnCopyAgain.textContent = '📋';
    btnCopyAgain.style.display = 'none';

    wrap.appendChild(btn);
    wrap.appendChild(btnCopyAgain);
    host.prepend(wrap);

    const statusBar = ensureStatusBar(wrap);

    btn.addEventListener('click', async () => {
        const mabn = getMabnFromUrl();
        if (!mabn) {
            setStatus(statusBar, 'Không tìm thấy MABN trong URL', '#b91c1c', true);
            return;
        }
        try {
            setStatus(statusBar, 'Đang lấy thông tin người bệnh...', '#0f172a', false);
            const info = await fetchPatientInfo(mabn);
            const mavaovien = info.maVaoVien || info.maVaoVien || info.mavaovien || '';
            const ngayvv = parseMMDDYYYYtoDDMMYYYY(info.ngayVV || info.ngayvv || '');
            const maql = info.maql || '';
            if (!mavaovien || !ngayvv || !maql) {
                setStatus(statusBar, 'Thiếu tham số (mã vào viện/ngày vào/maql)', '#b91c1c', true);
                return;
            }

            const denngay = todayDDMMYYYY();
            const pdfUrl = `/todieutri/DienBien/PrintPDF?id=&mabn=${encodeURIComponent(mabn)}&mavaovien=${encodeURIComponent(mavaovien)}&tungay=${encodeURIComponent(ngayvv)}&denngay=${encodeURIComponent(denngay)}&maql=${encodeURIComponent(maql)}`;

            setStatus(statusBar, 'Đang tải và xử lý PDF...', '#0f172a', false);
            const buf = await fetchPdfArrayBuffer(pdfUrl);
            const rawText = await extractAllTextFromPdfBuffer(buf);
            const text = sanitizeCopiedText(rawText);

            setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
            const ok = await copyToClipboard(text);
            if (ok) {
                setStatus(statusBar, 'Đã copy toàn bộ diễn tiến vào clipboard.', '#166534', true);
                // Enable copy-again with latest sanitized text
                btnCopyAgain.dataset.clipboardText = text;
                btnCopyAgain.style.display = 'inline-block';
            } else {
                setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
            }
        } catch (err) {
            console.error(err);
            setStatus(statusBar, 'Lỗi: ' + (err && err.message ? err.message : 'Không rõ'), '#b91c1c', true);
        }
    });

    // Copy-again action: copy last cached text without reloading PDF
    btnCopyAgain.addEventListener('click', async () => {
        const cached = btnCopyAgain.dataset.clipboardText || '';
        if (!cached) {
            setStatus(statusBar, 'Chưa có dữ liệu để copy lại.', '#b91c1c', true);
            return;
        }
        try {
            setStatus(statusBar, 'Đang copy vào clipboard...', '#0f172a', false);
            const ok = await copyToClipboard(cached);
            if (ok) setStatus(statusBar, 'Đã copy lại vào clipboard.', '#166534', true);
            else setStatus(statusBar, 'Không thể copy vào clipboard.', '#b91c1c', true);
        } catch (e) {
            setStatus(statusBar, 'Lỗi: ' + (e && e.message ? e.message : 'Không rõ'), '#b91c1c', true);
        }
    });
}

function initCopyDienTienAI() {
    if (!isToDieuTriPage()) return;
    // Try immediately and a few retries in case DOM is populated later
    const tryInject = () => {
        injectButton();
    };
    tryInject();
    let tries = 0;
    const iv = setInterval(() => {
        tries++;
        injectButton();
        if (document.getElementById('dr-copy-dien-tien-forAI') || tries > 20) clearInterval(iv);
    }, 300);
}

module.exports = { 
    initCopyDienTienAI,
    fetchPatientInfo,
    parseMMDDYYYYtoDDMMYYYY,
    todayDDMMYYYY,
    fetchPdfArrayBuffer,
    extractAllTextFromPdfBuffer,
    copyToClipboard,
    sanitizeCopiedText,
    setStatus
};
